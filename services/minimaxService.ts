import { Spot, Route, VoiceResponse, RecognitionResponse, ShoppingInfo, NavigationInfo, RelatedKnowledge } from '../types';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_BASE_URL = 'https://api.minimax.chat/v1';

if (!MINIMAX_API_KEY) {
  console.error("MINIMAX_API_KEY is not set. Please set the environment variable.");
}

/**
 * MiniMax API通用调用函数
 */
const callMinimaxAPI = async <T,>(prompt: string, systemPrompt?: string): Promise<T> => {
  try {
    const response = await fetch(`${MINIMAX_BASE_URL}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: 'abab6.5-chat',
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
      throw new Error(`MiniMax API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty response from MiniMax API");
    }

    return JSON.parse(content) as T;
  } catch (error) {
    console.error("Error calling MiniMax API:", error);
    throw new Error("Failed to get a valid response from the AI model.");
  }
};

/**
 * 生成旅游路线
 */
export const getRoutes = async (userCoord: string, village: string): Promise<{ routes: Route[] }> => {
  const systemPrompt = `你是一个专业的乡村旅游路线规划助手。请严格按照JSON格式输出，确保数据结构完整。`;
  
  const prompt = `用户当前位于村庄'${village}'，坐标为'${userCoord}'。请生成3条旅游路线的JSON数据。

这3条路线分别是: "红色革命追忆路线", "自然生态民俗游", "深度民俗文化体验"。

返回格式：
{
  "routes": [
    {
      "name": "路线名称",
      "category": "历史文化|自然风景|美食体验",
      "description": "简短描述（少于30字）",
      "imagePrompt": "1-3个英文关键词",
      "spots": [
        {
          "id": 101,
          "name": "景点名称",
          "coord": "lng,lat",
          "distance": "距今300米",
          "intro_short": "单行简介（少于25字）",
          "imagePrompt": "1-3个英文关键词",
          "intro_txt": "详细介绍文本",
          "position": { "top": "30%", "left": "40%" }
        }
      ]
    }
  ]
}

每条路线包含2-3个景点，景点ID从101开始递增，position值确保不重叠。`;

  return callMinimaxAPI<{ routes: Route[] }>(prompt, systemPrompt);
};

/**
 * 语音交互
 */
export const voiceInteraction = async (spotName: string, question?: string): Promise<VoiceResponse> => {
  if (question?.includes("无法识别")) {
    return { 
      text: "抱歉，我没听清楚您的问题，可以请您手动输入吗？", 
      audio_base_64: "", 
      need_manual_input: true 
    };
  }

  const systemPrompt = `你是一位友好的乡村AI导游，回答要简洁口语化，不超过3句话。`;
  
  const prompt = question 
    ? `用户在'${spotName}'问："${question}"。请回答并返回JSON: {"text": "回答内容", "audio_base_64": "", "need_manual_input": false}`
    : `请为景点"${spotName}"生成15-20秒的欢迎讲解词，包括核心特色和历史背景，语气亲切自然。返回JSON: {"text": "讲解词", "audio_base_64": "", "need_manual_input": false}`;

  try {
    const response = await callMinimaxAPI<VoiceResponse>(prompt, systemPrompt);
    
    // TODO: 集成MiniMax语音合成API生成audio_base_64
    // 目前返回空字符串，后续可接入MiniMax TTS服务
    
    return response;
  } catch (error) {
    console.error("Error in voice interaction:", error);
    return {
      text: "抱歉，服务暂时不可用，请稍后再试。",
      audio_base_64: "",
      need_manual_input: false
    };
  }
};

/**
 * 物体识别
 */
export const objectRecognition = async (spotName: string): Promise<RecognitionResponse> => {
  const systemPrompt = `你是一位知识渊博的乡村文化讲解员。`;
  
  const prompt = `用户在'${spotName}'拍摄了一张照片（假设是该景点的建筑细节或手工艺品）。
  
请返回JSON:
{
  "explanation": "3-5句话的口语化讲解，介绍历史文化背景或有趣故事",
  "audio_base_64": "",
  "memorial_image": "https://picsum.photos/600/400?random=1"
}`;

  return callMinimaxAPI<RecognitionResponse>(prompt, systemPrompt);
};

/**
 * 获取相关知识
 */
export const getRelatedKnowledge = async (spotName: string): Promise<RelatedKnowledge> => {
  const systemPrompt = `你是一位历史学家和文化学者。`;
  
  const prompt = `请为景点"${spotName}"生成一个有趣的、鲜为人知的知识点。
  
返回JSON:
{
  "title": "知识点标题",
  "content": "详细内容（100-150字）"
}`;

  return callMinimaxAPI<RelatedKnowledge>(prompt, systemPrompt);
};

/**
 * 获取购物信息
 */
export const getShoppingInfo = async (userCoord: string, spotName: string): Promise<ShoppingInfo> => {
  const systemPrompt = `你是一个乡村导购助手。`;
  
  const prompt = `用户在'${spotName}'（坐标'${userCoord}'）附近，希望了解当地特产。

返回JSON:
{
  "businesses": [
    {
      "name": "商家名称",
      "type": "餐饮|住宿|纪念品",
      "coord": "lng,lat",
      "address": "详细地址",
      "distance": "距今500米"
    }
  ],
  "products": [
    {
      "name": "商品名称",
      "feature": "特色描述",
      "spec": "规格",
      "price": "价格",
      "business": "关联商家名称"
    }
  ],
  "recommend_text": "亲切自然的推荐文案"
}

生成1-2个商家，2-3个商品。`;

  return callMinimaxAPI<ShoppingInfo>(prompt, systemPrompt);
};

/**
 * 获取导航路线
 */
export const getNavigationRoute = async (userCoord: string, spotName: string, spotCoord: string): Promise<NavigationInfo> => {
  const systemPrompt = `你是一个乡村地图导航助手。`;
  
  const prompt = `用户当前在坐标'${userCoord}'，要前往'${spotName}'（坐标'${spotCoord}'）。

请生成口语化的步行导航文本，使用乡村参照物（如大榕树、村口小卖部、池塘等）。

返回JSON:
{
  "route_text": "导航文本描述",
  "walking_time": "约5分钟"
}`;

  return callMinimaxAPI<NavigationInfo>(prompt, systemPrompt);
};
