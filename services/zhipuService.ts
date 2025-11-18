import { Spot, Route, VoiceResponse, RecognitionResponse, ShoppingInfo, NavigationInfo, RelatedKnowledge } from '../types';

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
const ZHIPU_BASE_URL = process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
const TEXT_MODEL = process.env.ZHIPU_TEXT_MODEL || 'glm-4.5-flash';

if (!ZHIPU_API_KEY) {
  console.error("ZHIPU_API_KEY is not set. Please set the environment variable.");
}

/**
 * 智谱AI通用调用函数
 */
const callZhipuAPI = async <T,>(prompt: string, systemPrompt?: string): Promise<T> => {
  try {
    const response = await fetch(`${ZHIPU_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}`
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`Zhipu API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty response from Zhipu API");
    }

    return JSON.parse(content) as T;
  } catch (error) {
    console.error("Error calling Zhipu API:", error);
    throw new Error("Failed to get a valid response from the AI model.");
  }
};

export const getRoutes = async (userCoord: string, village: string): Promise<{ routes: Route[] }> => {
  const systemPrompt = `你是一个专业的乡村旅游路线规划助手。请严格按照JSON格式输出。`;
  
  const prompt = `用户当前位于村庄'${village}'，坐标为'${userCoord}'。请生成3条旅游路线。

路线名称: "红色革命追忆路线", "自然生态民俗游", "深度民俗文化体验"

返回JSON格式，每条路线包含2-3个景点，景点ID从101开始。`;

  return callZhipuAPI<{ routes: Route[] }>(prompt, systemPrompt);
};

export const voiceInteraction = async (spotName: string, question?: string): Promise<VoiceResponse> => {
  if (question?.includes("无法识别")) {
    return { text: "抱歉，我没听清楚您的问题，可以请您手动输入吗？", audio_base_64: "", need_manual_input: true };
  }

  const systemPrompt = `你是一位友好的乡村AI导游，回答简洁口语化。`;
  const prompt = question 
    ? `用户在'${spotName}'问："${question}"。请简短回答（不超过3句话）。`
    : `为景点"${spotName}"生成15-20秒的欢迎讲解词。`;

  const response = await callZhipuAPI<{ text: string }>(prompt, systemPrompt);
  return { ...response, audio_base_64: "", need_manual_input: false };
};

export const objectRecognition = async (spotName: string): Promise<RecognitionResponse> => {
  const systemPrompt = `你是一位知识渊博的乡村文化讲解员。`;
  const prompt = `用户在'${spotName}'拍摄了照片。请生成3-5句讲解词。`;
  
  const response = await callZhipuAPI<{ explanation: string }>(prompt, systemPrompt);
  return {
    ...response,
    audio_base_64: "",
    memorial_image: "https://picsum.photos/600/400?random=1"
  };
};

export const getRelatedKnowledge = async (spotName: string): Promise<RelatedKnowledge> => {
  const systemPrompt = `你是一位历史学家和文化学者。`;
  const prompt = `为景点"${spotName}"生成一个有趣的知识点（100-150字）。`;
  return callZhipuAPI<RelatedKnowledge>(prompt, systemPrompt);
};

export const getShoppingInfo = async (userCoord: string, spotName: string): Promise<ShoppingInfo> => {
  const systemPrompt = `你是一个乡村导购助手。`;
  const prompt = `用户在'${spotName}'附近，生成1-2个商家和2-3个特色商品信息。`;
  return callZhipuAPI<ShoppingInfo>(prompt, systemPrompt);
};

export const getNavigationRoute = async (userCoord: string, spotName: string, spotCoord: string): Promise<NavigationInfo> => {
  const systemPrompt = `你是一个乡村地图导航助手。`;
  const prompt = `从'${userCoord}'到'${spotName}'（${spotCoord}），生成口语化步行导航。`;
  return callZhipuAPI<NavigationInfo>(prompt, systemPrompt);
};
