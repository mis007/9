export interface Spot {
  id: number;
  name: string;
  coord: string; // "lng,lat"
  distance: string;
  intro_short: string;
  imagePrompt: string; // Dynamic prompt for image generation
  intro_txt: string;
  position: { top: string; left: string; }; // For map view
}

export interface Route {
  name: string;
  category: '历史文化' | '自然风景' | '美食体验';
  description: string;
  spots: Spot[];
  imagePrompt: string; // Dynamic prompt for image generation
}

export interface Business {
  name: string;
  type: '餐饮' | '住宿' | '纪念品';
  coord: string;
  address: string;
  distance: string;
}

export interface Product {
  name: string;
  feature: string;
  spec: string;
  price: string;
  business: string;
}

export interface ShoppingInfo {
  businesses: Business[];
  products: Product[];
  recommend_text: string;
}

export interface VoiceResponse {
  text: string;
  audio_base_64: string;
  need_manual_input: boolean;
}

export interface RecognitionResponse {
  explanation: string;
  audio_base_64: string;
  memorial_image: string;
}

export interface MemorialAlbum {
  cover_url: string;
  download_url: string;
  share_url: string;
}

export interface NextSpotResponse {
  is_last: boolean;
  next_spot_name?: string;
  next_coord?: string;
  route_text?: string;
  text: string;
  memorial_album?: MemorialAlbum;
}

export interface NavigationInfo {
  route_text: string;
  walking_time: string;
}

export interface AgentColorClasses {
  bg: string;
  border: string;
  text: string;
  shadow: string;
  iconBg: string;
}

// Defines the structure for an AI Agent
export interface Agent {
  id: 'A' | 'B' | 'C' | 'D' | 'RED' | 'ECO' | 'FOOD';
  name: string;
  description: string;
  icon: any; // Using 'any' for IconName to avoid circular dependency
  imageUrl?: string;
  interactionType: 'voice' | 'photo' | 'shop' | 'system';
  actionText: string;
  colorClasses: AgentColorClasses;
}

export interface RelatedKnowledge {
  title: string;
  content: string;
}

export interface Celebrity {
  id: string;
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  detailText: string;
}