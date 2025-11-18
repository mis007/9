import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Spot, Route, VoiceResponse, RecognitionResponse, ShoppingInfo, NextSpotResponse, NavigationInfo, RelatedKnowledge } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set. Please set the environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

/**
 * A generic function to call the Gemini API with a JSON schema and return a typed object.
 * @param prompt The text prompt to send to the model.
 * @param schema The response schema for the JSON output.
 * @returns A promise that resolves to the parsed JSON object of type T.
 */
const generateContentWithSchema = async <T,>(prompt: string, schema: any): Promise<T> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.5,
      },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as T;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get a valid response from the AI model.");
  }
};

export const getRoutes = async (userCoord: string, village: string): Promise<{ routes: Route[] }> => {
  const prompt = `你是一个乡村旅游应用的后端API。一位用户当前位于村庄'${village}'，坐标为'${userCoord}'。请根据以下要求生成一个包含3条旅游路线的JSON数组，每条路线都是一个对象。
    
    这3条路线分别是: "红色革命追忆路线", "自然生态民俗游", "深度民俗文化体验"。

    每个路线(Route)对象必须包含以下字段:
    - name (字符串): 路线名称。
    - category (字符串): 路线类别，从 '历史文化', '自然风景', '美食体验' 中选择。
    - description (字符串): 对路线的简短描述，少于30个字。
    - imagePrompt (字符串): 用于生成路线主图的1-3个英文关键词，例如 "ancient chinese village" 或 "rural landscape temple"。
    - spots (数组): 一个包含2到3个该路线下景点的数组。

    每个景点(Spot)对象必须包含以下字段:
    - id (整数): 从101开始的唯一整数ID。
    - name (字符串): 景点名称。
    - coord (字符串): 格式为 'lng,lat' 的模拟坐标。
    - distance (字符串): 距离用户的估算距离，例如 '距今300米' 或 '约1.2公里'。
    - intro_short (字符串): 景点的单行简介，少于25个字。
    - imagePrompt (字符串): 用于生成该景点图片的1-3个英文关键词，确保与景点名称和性质相关，例如 "revolution memorial hall" 或 "traditional folk house"。
    - intro_txt (字符串): 这是一个模拟的详细介绍文本。
    - position (对象): 包含top和left两个字符串属性，值为百分比，用于在地图上定位。请确保所有景点的position值在地图上分布合理，不要重叠。

    请严格按照以上结构和字段要求生成JSON。`;

  const positionSchema = { type: Type.OBJECT, properties: { top: { type: Type.STRING }, left: { type: Type.STRING } }, required: ['top', 'left'] };
  const spotSchema = { type: Type.OBJECT, properties: { id: { type: Type.INTEGER }, name: { type: Type.STRING }, coord: { type: Type.STRING }, distance: { type: Type.STRING }, intro_short: { type: Type.STRING }, imagePrompt: { type: Type.STRING }, intro_txt: { type: Type.STRING }, position: positionSchema }, required: ['id', 'name', 'coord', 'distance', 'intro_short', 'imagePrompt', 'intro_txt', 'position'] };
  const routeSchema = { type: Type.OBJECT, properties: { name: { type: Type.STRING }, category: { type: Type.STRING, enum: ['历史文化', '自然风景', '美食体验'] }, description: { type: Type.STRING }, imagePrompt: { type: Type.STRING }, spots: { type: Type.ARRAY, items: spotSchema } }, required: ['name', 'category', 'description', 'imagePrompt', 'spots'] };
  const schema = { type: Type.OBJECT, properties: { routes: { type: Type.ARRAY, items: routeSchema } }, required: ['routes'] };

  return generateContentWithSchema<{ routes: Route[] }>(prompt, schema);
};

export const voiceInteraction = async (spotName: string, question?: string): Promise<VoiceResponse> => {
  if (question?.includes("无法识别")) {
    return { text: "抱歉，我没听清楚您的问题，可以请您手动输入吗？", audio_base_64: "", need_manual_input: true };
  }

  if (question) {
    const prompt = `你是一位友好的乡村AI导游。用户当前在'${spotName}'，他们问：“${question}”。请用中文提供一个简洁、口语化的回答（最多3句话）。同时，提供一个用于音频播放的占位符base64字符串。返回一个JSON对象。`;
    const schema = { type: Type.OBJECT, properties: { text: { type: Type.STRING }, audio_base_64: { type: Type.STRING }, need_manual_input: { type: Type.BOOLEAN } }, required: ['text', 'audio_base_64', 'need_manual_input'] };
    return generateContentWithSchema<VoiceResponse>(prompt, schema);
  } else {
    try {
      const ttsPrompt = `你是一位专业的景点讲解员，请为景点“${spotName}”生成一段引人入胜的欢迎与简介讲解词，总时长约15-20秒。内容应包括景点的核心特色和历史背景，语气亲切自然，富有感染力。`;
      const textResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: ttsPrompt });
      const textToSpeak = textResponse.text;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: textToSpeak }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? '';
      if (!audioBase64) throw new Error("Failed to generate audio from API.");

      return { text: textToSpeak, audio_base_64: audioBase64, need_manual_input: false };
    } catch (error) {
      console.error("Error calling Gemini TTS API:", error);
      throw new Error("Failed to generate audio introduction.");
    }
  }
};

export const objectRecognition = async (spotName: string): Promise<RecognitionResponse> => {
  const prompt = `你是一位知识渊博的乡村文化讲解员。用户在'${spotName}'拍摄了一张照片（我们假设照片内容与该景点高度相关，比如一个建筑细节或一件手工艺品）。请完成以下任务：
    1. 生成一段口语化的讲解词（3-5句话），介绍这个物体的历史、文化背景或一个有趣的故事，语气亲切。
    2. 生成一张符合乡村主题的水彩画风格纪念图的URL（使用picsum.photos）。
    3. 提供一个用于音频播放的占位符base64字符串。
    返回一个JSON对象。`;
  const schema = { type: Type.OBJECT, properties: { explanation: { type: Type.STRING }, audio_base_64: { type: Type.STRING }, memorial_image: { type: Type.STRING } }, required: ['explanation', 'audio_base_64', 'memorial_image'] };
  return generateContentWithSchema<RecognitionResponse>(prompt, schema);
};

export const getRelatedKnowledge = async (spotName: string): Promise<RelatedKnowledge> => {
  const prompt = `你是一位知识渊博的历史学家和文化学者。请为景点“${spotName}”生成一个相关的知识点。这个知识点应该是有趣的、鲜为人知的，并且与该景点的历史、文化、传说或自然特征相关。返回一个JSON对象，包含'title'（知识点的标题）和'content'（详细内容，大约100-150字）。`;
  const schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } }, required: ['title', 'content'] };
  return generateContentWithSchema<RelatedKnowledge>(prompt, schema);
};

export const getShoppingInfo = async (userCoord: string, spotName: string): Promise<ShoppingInfo> => {
  const prompt = `你是一个乡村导购助手。用户在'${spotName}'（坐标'${userCoord}'）附近，希望了解当地特产。请生成一个JSON对象，包含：
    1.  'businesses' (商家列表): 1-2个虚构的商家，每个商家有name, type('餐饮'/'住宿'/'纪念品'), coord, address, distance。
    2.  'products' (商品列表): 2-3个虚构的特色商品，每个商品有name, feature, spec, price, business(关联的商家名称)。
    3.  'recommend_text' (推荐语): 一段亲切自然的软性推荐文案。`;
  const businessSchema = { type: Type.OBJECT, properties: { name: { type: Type.STRING }, type: { type: Type.STRING, enum: ['餐饮', '住宿', '纪念品'] }, coord: { type: Type.STRING }, address: { type: Type.STRING }, distance: { type: Type.STRING } }, required: ['name', 'type', 'coord', 'address', 'distance'] };
  const productSchema = { type: Type.OBJECT, properties: { name: { type: Type.STRING }, feature: { type: Type.STRING }, spec: { type: Type.STRING }, price: { type: Type.STRING }, business: { type: Type.STRING } }, required: ['name', 'feature', 'spec', 'price', 'business'] };
  const schema = { type: Type.OBJECT, properties: { businesses: { type: Type.ARRAY, items: businessSchema }, products: { type: Type.ARRAY, items: productSchema }, recommend_text: { type: Type.STRING } }, required: ['businesses', 'products', 'recommend_text'] };
  return generateContentWithSchema<ShoppingInfo>(prompt, schema);
};

export const getNavigationRoute = async (userCoord: string, spotName: string, spotCoord: string): Promise<NavigationInfo> => {
  const prompt = `你是一个乡村地图导航助手。用户当前在坐标 '${userCoord}'，希望前往景点 '${spotName}' (坐标 '${spotCoord}')。请生成一段符合乡村环境的、口语化的步行导航文本，并估算一个步行时间。请使用一些虚拟但合理的乡村参照物，例如“大榕树”、“村口的小卖部”、“池塘边的石子路”等。返回一个JSON对象。`;
  const schema = { type: Type.OBJECT, properties: { route_text: { type: Type.STRING }, walking_time: { type: Type.STRING } }, required: ['route_text', 'walking_time'] };
  return generateContentWithSchema<NavigationInfo>(prompt, schema);
};