/**
 * 图片服务工具类 - 国内CDN优化
 * 替换Unsplash等国外图片服务为国内可访问的服务
 */

// 必应每日壁纸API
const BING_IMAGE_BASE = 'https://bing.biturl.top';

// 景点图片映射（可根据实际需求上传到CDN）
export const spotImageMap: Record<string, string> = {
  // 可以在这里添加具体景点的图片URL
  // '红军纪念馆': 'https://your-cdn.com/memorial-hall.jpg',
};

/**
 * 获取必应壁纸
 */
export const getBingWallpaper = (index: number = 0): string => {
  return `${BING_IMAGE_BASE}/?resolution=1920&format=image&index=${index}&mkt=zh-CN`;
};

/**
 * 获取随机风景图片（使用必应）
 */
export const getRandomNatureImage = (width: number = 800, height: number = 600): string => {
  const index = Math.floor(Math.random() * 7); // 必应保留最近7天的壁纸
  return getBingWallpaper(index);
};

/**
 * 根据关键词获取图片
 * 优先使用本地映射，回退到通用图片
 */
export const getImageByKeyword = (keyword: string, width: number = 600, height: number = 400): string => {
  // 检查是否有预设图片
  if (spotImageMap[keyword]) {
    return spotImageMap[keyword];
  }
  
  // 根据关键词类型返回不同的必应壁纸
  const keywordMap: Record<string, number> = {
    'nature': 0,
    'mountain': 1,
    'village': 2,
    'ancient': 3,
    'temple': 4,
    'revolution': 5,
    'memorial': 6,
  };
  
  for (const [key, index] of Object.entries(keywordMap)) {
    if (keyword.toLowerCase().includes(key)) {
      return getBingWallpaper(index);
    }
  }
  
  // 默认返回随机图片
  return getRandomNatureImage(width, height);
};

/**
 * 获取景点图片
 */
export const getSpotImage = (spotName: string, imagePrompt?: string, width: number = 600, height: number = 400): string => {
  // 优先使用景点名称映射
  if (spotImageMap[spotName]) {
    return spotImageMap[spotName];
  }
  
  // 使用imagePrompt关键词
  if (imagePrompt) {
    return getImageByKeyword(imagePrompt, width, height);
  }
  
  // 默认风景图
  return getRandomNatureImage(width, height);
};

/**
 * 获取路线背景图
 */
export const getRouteBackgroundImage = (imagePrompt?: string): string => {
  if (imagePrompt) {
    return getImageByKeyword(imagePrompt, 800, 400);
  }
  return getRandomNatureImage(800, 400);
};

/**
 * 获取名人肖像图片（使用DiceBear API生成头像）
 */
export const getPortraitImage = (seed: string): string => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
};

/**
 * 获取纪念图片
 */
export const getMemorialImage = (width: number = 600, height: number = 400): string => {
  return getBingWallpaper(Math.floor(Math.random() * 7));
};
