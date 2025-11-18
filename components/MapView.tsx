import React, { useEffect, useRef, useState } from 'react';
import { Spot, Route } from '../types';
import { Icon } from './common/Icon';

interface MapViewProps {
  routes: Route[];
  onSelectSpot: (spot: Spot | null) => void;
  activeSpotId: number | null;
}

// 高德地图类型声明
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
  }
}

const MapView: React.FC<MapViewProps> = ({ routes, onSelectSpot, activeSpotId }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const amapInstance = useRef<any>(null);
  const [useAmapMode, setUseAmapMode] = useState(false);
  const AMAP_KEY = process.env.AMAP_KEY;

  useEffect(() => {
    // 如果配置了高德地图Key，则加载高德地图
    if (AMAP_KEY && mapRef.current && !amapInstance.current) {
      loadAmapScript();
    }
  }, [AMAP_KEY]);

  const loadAmapScript = () => {
    if (window.AMap) {
      initAmap();
      return;
    }

    // 配置安全密钥（如果有）
    window._AMapSecurityConfig = {
      securityJsCode: process.env.AMAP_SECURITY_CODE || '',
    };

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&plugin=AMap.Scale,AMap.ToolBar,AMap.Marker`;
    script.async = true;
    script.onload = () => initAmap();
    document.body.appendChild(script);
  };

  const initAmap = () => {
    if (!mapRef.current || !window.AMap) return;

    try {
      // 创建地图实例
      const map = new window.AMap.Map(mapRef.current, {
        zoom: 15,
        center: [116.397428, 39.90923], // 默认中心点，可根据村庄位置调整
        mapStyle: 'amap://styles/whitesmoke', // 清新风格
      });

      amapInstance.current = map;
      setUseAmapMode(true);

      // 添加景点标记
      routes.flatMap(r => r.spots).forEach(spot => {
        const [lng, lat] = spot.coord.split(',').map(Number);
        
        const marker = new window.AMap.Marker({
          position: new window.AMap.LngLat(lng, lat),
          title: spot.name,
          offset: new window.AMap.Pixel(-13, -30),
        });

        marker.on('click', () => onSelectSpot(spot));
        map.add(marker);
      });

      // 添加比例尺和工具条
      map.addControl(new window.AMap.Scale());
      map.addControl(new window.AMap.ToolBar());

    } catch (error) {
      console.error('Failed to initialize Amap:', error);
      setUseAmapMode(false);
    }
  };

  const getSpotCategory = (spotId: number): Route['category'] | null => {
    for (const route of routes) {
      if (route.spots.some(s => s.id === spotId)) {
        return route.category;
      }
    }
    return null;
  };

  const MapMarker: React.FC<{ spot: Spot }> = ({ spot }) => {
    const isActive = activeSpotId === spot.id;
    const category = getSpotCategory(spot.id);

    const pinColorClasses = () => {
      switch (category) {
        case '历史文化': return { base: 'bg-pink-500', active: 'bg-pink-600', hover: 'group-hover:bg-pink-600', text: 'text-pink-800' };
        case '自然风景': return { base: 'bg-green-500', active: 'bg-green-600', hover: 'group-hover:bg-green-600', text: 'text-green-800' };
        case '美食体验': return { base: 'bg-amber-500', active: 'bg-amber-600', hover: 'group-hover:bg-amber-600', text: 'text-amber-800' };
        default: return { base: 'bg-gray-500', active: 'bg-gray-600', hover: 'group-hover:bg-gray-600', text: 'text-gray-800' };
      }
    };
    const colors = pinColorClasses();

    return (
      <button
        style={{ top: spot.position.top, left: spot.position.left }}
        onClick={() => onSelectSpot(spot)}
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-transform duration-300 ${isActive ? 'scale-110 z-10' : 'hover:scale-110'}`}
        title={spot.name}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300
                    ${isActive ? `${colors.active} border-4 border-white` : `${colors.base} border-2 border-white ${colors.hover}`}`}>
          <Icon name="location" className="w-5 h-5 text-white" />
        </div>
        <span className={`mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full shadow transition-all duration-300 whitespace-nowrap
                    ${isActive ? `${colors.active} text-white` : `bg-white ${colors.text} ${colors.hover} group-hover:text-white`}`}>
          {spot.name}
        </span>
      </button>
    )
  }

  // 静态地图模式（备用）
  const StaticMapView = () => (
    <div className="relative w-full h-full bg-cover bg-center" 
         style={{ backgroundImage: "url('https://picsum.photos/1200/800?nature')" }}>
      <div className="absolute inset-0 bg-amber-50/30"></div>

      {routes.flatMap(r => r.spots).map(spot => (
        <MapMarker key={spot.id} spot={spot} />
      ))}

      <div className="absolute" style={{ top: '50%', left: '50%' }}>
        <div className="transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <span className="text-xs font-bold bg-black/50 text-white px-2 py-0.5 rounded-md mb-1">当前位置</span>
          <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full">
      {/* 高德地图容器 */}
      {AMAP_KEY ? (
        <div ref={mapRef} className={`w-full h-full ${useAmapMode ? 'block' : 'hidden'}`} />
      ) : null}
      
      {/* 静态地图备用模式 */}
      {!useAmapMode && <StaticMapView />}

      {/* 返回按钮 */}
      {activeSpotId && (
        <button
          onClick={() => onSelectSpot(null)}
          className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-gray-700 hover:bg-white shadow-lg z-10"
        >
          返回总览
        </button>
      )}
    </div>
  );
};

export default MapView;
