import React, { useState, useEffect } from 'react';
import { Spot, Agent, AgentColorClasses, Route } from '../types';
import AgentPresenter from './AgentPresenter';
import MapView from './MapView';
import { Spinner } from './common/Spinner';
import { Icon } from './common/Icon';
import * as aiService from '../services/minimaxService';
import { getSpotImage } from '../utils/imageService';


const AGENT_A_IMAGE_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAbFBMVEUAAAD///8iIiL8/Pzo6Ojk5OTf398xMTGtra0TExOZmZlISEjY2NiioqJ7e3tYWFhubm5WVlZPT085OTlCQkJpaWlAQEAnJycMDAxwcHAdHR2VlZWMjIyBgYGCgoJEREQ8PDySkpJ4eHhmZma2trZHR0c+y5wDAAACRklEQVR4nO3ae1aiQBCFYRGEBERAQRyqrf//G1ssF2dlIDEw9zzX2uuci7M7s5MchQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwS3m83l2Wp3P5p4R/LsdHw3l7z2g7x328328j/K6Mny6fLb8syzN5Pp2+9wF+z/Mv6/p8/vz0+gMAB+P6b148iQ/b2fT89voDANfX9QcADpC0fHh5EwD30/X7CwD/xGkBAAA4Kk0LAAwgaQEAASQtADCANAEAGk/SAgADSFoAQABJCwAIIA0AQMbp25sCl9NlAQBOoGkBADSANAEAGk/SAgADSFoAQABJCwAIIA0AQMbp24sCB9O1AQBOomsBADSANAEAGk/SAgADSFoAQABJCwAIIA0AQMbp2ysCF9O0AQBOo2kBADSANAEAGk/SAgADSFoAQABJCwAIIA0AQMbp22sC59O1AQBOoGkBADSANAEAGk/SAgADSFoAQABJCwAIIA0AQMbp26sCF9O2AQBOoWkBADSANAEAGk/SAgADSFoAQABJCwAIIA0AQMbp2wsC59O3AQBOomsBADSANAEAGk/SAgADSFoAQABJCwAIIA0AQMbp23sC59O3AQBOoWkBADSANAEAGk/SAgADSFoAQABJCwAIIA0AQMbp29sC59O2AQBOomsBADSANAEAGk/SAgADSFoAQABJCwAIIA0AQMbp2ysCF9O3AQBOoWkBADSANAEAGk/SAgADSFoAQABJCwAIIA0AQMbp2+sC59O2AQBOomsBADSANAEAGk/SAgADSFoAQABJCwAIIA0AQMbp2/sC59O2AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA6/sHJyRxS1yOYoIAAAAASUVORK5CYII=';

const agentColors: Record<string, AgentColorClasses> = {
  A: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800', shadow: 'hover:shadow-blue-300/50', iconBg: 'bg-blue-500' },
  B: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800', shadow: 'hover:shadow-green-300/50', iconBg: 'bg-green-500' },
  C: { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800', shadow: 'hover:shadow-orange-300/50', iconBg: 'bg-orange-500' },
  RED: { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-800', shadow: 'hover:shadow-pink-300/50', iconBg: 'bg-pink-500' },
  ECO: { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-800', shadow: 'hover:shadow-teal-300/50', iconBg: 'bg-teal-500' },
  FOOD: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800', shadow: 'hover:shadow-amber-300/50', iconBg: 'bg-amber-500' },
};

export const agents: Agent[] = [
  { id: 'A', name: '小A村官儿', description: '我是您的专属AI导游', icon: 'user', imageUrl: AGENT_A_IMAGE_URL, interactionType: 'system', actionText: '', colorClasses: agentColors.A },
  { id: 'RED', name: '红导阿义', description: '红色文化专属导游', icon: 'book-open', interactionType: 'photo', actionText: '拍照讲解', colorClasses: agentColors.RED },
  { id: 'ECO', name: '生态阿绿', description: '自然生态专属导游', icon: 'map', interactionType: 'photo', actionText: '拍照讲解', colorClasses: agentColors.ECO },
  { id: 'FOOD', name: '美食探味家', description: '带你品尝地道美味', icon: 'price-tag', interactionType: 'photo', actionText: '拍照讲解', colorClasses: agentColors.FOOD },
  { id: 'B', name: 'B 景点解说智能体', description: '支持语音/文字/拍照互动', icon: 'academic-cap', interactionType: 'photo', actionText: '拍照讲解', colorClasses: agentColors.B },
  { id: 'C', name: '特产推荐员', description: '为您搜罗好物', icon: 'bag', interactionType: 'shop', actionText: '查找好物', colorClasses: agentColors.C },
];

const getGeolocationErrorMessage = (error: GeolocationPositionError): string => {
  switch (error.code) {
    case 1: return "已拒绝位置权限。";
    case 2: return "无法定位, 请检查网络/GPS。";
    case 3: return "获取位置超时。";
    default: return "未知错误。";
  }
};

const QuickNav: React.FC<{ spots: Spot[]; onSelectSpot: (spot: Spot) => void; }> = ({ spots, onSelectSpot }) => (
  <div className="p-3 bg-white border-y border-gray-200">
    <h3 className="text-xs font-semibold text-gray-600 mb-2 px-1">快速导览</h3>
    <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
      {spots.map((spot) => (
        <button
          key={spot.id}
          onClick={() => onSelectSpot(spot)}
          className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-full shadow-sm transition-all transform hover:scale-105 hover:bg-white hover:shadow-md"
        >
          {spot.name}
        </button>
      ))}
    </div>
  </div>
);

interface PresenterModeProps {
  routes: Route[] | null;
  activeSpot: Spot | null;
  activeSpotCategory: Route['category'] | null;
  onSelectSpotFromMap: (spot: Spot | null) => void;
  isLoading: boolean;
  error: string | null;
  geoError: GeolocationPositionError | null;
}

const PresenterMode: React.FC<PresenterModeProps> = ({ routes, activeSpot, activeSpotCategory, onSelectSpotFromMap, isLoading, error, geoError }) => {
  const [activeAgent, setActiveAgent] = useState<Agent>(agents.find(a => a.id === 'A')!);
  const [visualMode, setVisualMode] = useState<'map' | 'image'>('map');
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);


  useEffect(() => {
    if (activeSpot && activeSpotCategory) {
      setVisualMode('image');
      let newAgentId: Agent['id'] = 'B'; // Fallback
      switch (activeSpotCategory) {
        case '历史文化': newAgentId = 'RED'; break;
        case '自然风景': newAgentId = 'ECO'; break;
        case '美食体验': newAgentId = 'FOOD'; break;
      }
      setActiveAgent(agents.find(a => a.id === newAgentId)!);
    } else {
      setVisualMode('map');
      setActiveAgent(agents.find(a => a.id === 'A')!);
    }
  }, [activeSpot, activeSpotCategory]);

  const handleSwitchToAgentC = () => {
    setActiveAgent(agents.find(a => a.id === 'C')!);
  }

  if (isLoading) {
    return <div className="flex flex-col items-center justify-center h-[calc(100vh-5rem)]"><Spinner /><p className="mt-4 text-gray-600">正在加载导览数据...</p></div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  const nearbySpots = routes?.map(r => r.spots[0]).filter(Boolean) as Spot[] || [];

  const activeSpotImageUrl = activeSpot ? getSpotImage(activeSpot.name, activeSpot.imagePrompt, 600, 400) : '';

  return (
    <div className="flex flex-col h-[calc(100vh-88px)] overflow-hidden bg-gray-50">
      <div className="relative h-2/5 flex-shrink-0 bg-gray-200 border-b-4 border-white shadow-md">
        {geoError && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-100 text-yellow-800 p-2 text-center text-xs z-20" role="alert">
            <strong>定位失败:</strong> {getGeolocationErrorMessage(geoError)} 已加载默认景点。
          </div>
        )}
        <div className="absolute inset-0">
          {visualMode === 'image' && activeSpot ? (
            <>
              <img src={activeSpotImageUrl} alt={activeSpot.name} className="w-full h-full object-cover" />
               <button
                  onClick={() => onSelectSpotFromMap(null)}
                  className="absolute top-4 left-4 bg-white/70 backdrop-blur-sm rounded-full p-2 text-gray-800 hover:bg-white hover:shadow-md transition-all z-10"
                  aria-label="返回地图"
                >
                  <Icon name="arrow-left" className="w-6 h-6" />
                </button>
            </>
          ) : (
             <MapView
                  routes={routes || []}
                  onSelectSpot={onSelectSpotFromMap}
                  activeSpotId={activeSpot?.id || null}
              />
          )}
        </div>
        <button
          onClick={() => setVisualMode(v => v === 'map' ? 'image' : 'map')}
          disabled={!activeSpot && visualMode === 'map'}
          className="absolute bottom-4 right-4 bg-white/80 p-2 rounded-full shadow-lg backdrop-blur-sm disabled:opacity-50 z-10 hover:bg-white transition-colors"
          title="切换视图"
        >
          <Icon name={visualMode === 'map' ? 'camera' : 'map'} className="w-6 h-6 text-gray-700" />
        </button>
      </div>
      <QuickNav spots={nearbySpots} onSelectSpot={(spot) => onSelectSpotFromMap(spot)} />
      <div className="flex-grow flex flex-col overflow-hidden">
        <AgentPresenter
          key={activeAgent.id}
          agent={activeAgent}
          spot={activeSpot}
          onSwitchToAgentC={handleSwitchToAgentC}
        />
      </div>
    </div>
  );
};

export default PresenterMode;