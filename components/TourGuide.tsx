import React, { useState, useEffect, useCallback } from 'react';
import { Spot, NavigationInfo, Route } from '../types';
import * as aiService from '../services/minimaxService';
import SpotList from './SpotList';
import SpotDetail from './SpotDetail';
import { Spinner } from './common/Spinner';
import { Icon } from './common/Icon';
import PresenterMode from './PresenterMode';
import FloatingAgentBar from './FloatingAgentBar';
import CelebritySection from './CelebritySection';

interface TourGuideProps {
  userId: string;
  onLogout: () => void;
  coordinates: { lat: number; lng: number } | null;
  geoLoading: boolean;
  geoError: GeolocationPositionError | null;
}

const TourGuide: React.FC<TourGuideProps> = ({ userId, onLogout, coordinates, geoLoading, geoError }) => {
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [selectedSpotCategory, setSelectedSpotCategory] = useState<Route['category'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uiMode, setUiMode] = useState<'classic' | 'presenter'>('classic');
  const [navigationInfo, setNavigationInfo] = useState<NavigationInfo | null>(null);
  const [isNavLoading, setIsNavLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const fetchRoutes = useCallback(async () => {
    // Default to a scenic spot in China if coordinates are unavailable.
    const userCoord = coordinates ? `${coordinates.lng},${coordinates.lat}` : "113.2345,22.6789"; 
    try {
      setError(null);
      setIsLoading(true);
      const data = await aiService.getRoutes(userCoord, "东里村");
      setRoutes(data.routes);
    } catch (err) {
      setError("无法加载景点信息，请检查网络后重试。");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [coordinates]);


  useEffect(() => {
    if (!geoLoading) {
      fetchRoutes();
    }
  }, [geoLoading, fetchRoutes]);

  useEffect(() => {
    const handleScroll = () => {
        if (window.scrollY > 300) {
            setShowScrollTop(true);
        } else {
            setShowScrollTop(false);
        }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchNavigation = async () => {
      if (selectedSpot && coordinates) {
        setIsNavLoading(true);
        setNavigationInfo(null);
        try {
          const userCoord = `${coordinates.lng},${coordinates.lat}`;
          const navData = await aiService.getNavigationRoute(userCoord, selectedSpot.name, selectedSpot.coord);
          setNavigationInfo(navData);
        } catch (err) {
          console.error("Failed to fetch navigation info:", err);
          setNavigationInfo(null); // Ensure it's null on error
        } finally {
          setIsNavLoading(false);
        }
      } else {
        setNavigationInfo(null);
      }
    };
    fetchNavigation();
  }, [selectedSpot, coordinates]);

  const handleSelectSpot = (spot: Spot, category: Route['category']) => {
    setSelectedSpot(spot);
    setSelectedSpotCategory(category);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedSpot(null);
    setSelectedSpotCategory(null);
  };

  const handleSelectSpotFromMap = (spot: Spot | null) => {
    if (spot) {
      const routeForSpot = routes?.find(route => route.spots.some(s => s.id === spot.id));
      const category = routeForSpot?.category ?? null;
      if (category) {
        handleSelectSpot(spot, category);
      }
    } else {
      handleBackToList();
    }
  };
  
  const handleHomeClick = () => {
    setSelectedSpot(null);
    setSelectedSpotCategory(null);
  }

  const toggleUiMode = () => {
    setUiMode(prev => prev === 'classic' ? 'presenter' : 'classic');
  }
  
  const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderClassicContent = () => {
    if (isLoading || geoLoading) {
      return <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]"><Spinner /><p className="mt-4 text-gray-600 text-sm font-light animate-pulse">{geoLoading ? '正在获取您的位置信息，以便为您提供更精准的导览服务...' : 'AI正在为您规划专属路线...'}</p></div>;
    }
    if (error) {
      return <div className="text-center p-8 text-red-500">{error}<button onClick={fetchRoutes} className="mt-4 bg-teal-500 text-white px-4 py-2 rounded">重试</button></div>;
    }

    if (routes) {
      return (
        <div className="p-4 space-y-8 pb-24">
          {selectedSpot ? (
            <SpotDetail 
              spot={selectedSpot} 
              onBack={handleBackToList}
              navigationInfo={navigationInfo}
              isNavLoading={isNavLoading}
            />
          ) : (
            <>
              <div>
                <h2 className="text-2xl font-serif-brand font-bold text-gray-800 px-2 mb-4">推荐路线</h2>
                <SpotList
                  routes={routes}
                  onSelectSpot={handleSelectSpot}
                  selectedSpotId={selectedSpot?.id || null}
                />
              </div>
              {/* Hall of Fame Section */}
              <CelebritySection />
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-lg mx-auto bg-gray-50 min-h-screen shadow-premium-xl relative overflow-hidden">
       {/* Ambient Background Animation */}
       <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-teal-200/20 rounded-full blur-3xl animate-pulse-dot pointer-events-none"></div>
       <div className="absolute bottom-[10%] right-[-10%] w-[60%] h-[40%] bg-amber-100/30 rounded-full blur-3xl animate-pulse-dot pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-md shadow-premium flex items-center justify-between p-4 border-b border-white/20">
        {uiMode === 'presenter' ? (
          <button
            onClick={() => setUiMode('classic')}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors btn-press"
            title="返回经典模式"
          >
            <Icon name="arrow-left" />
          </button>
        ) : (
             selectedSpot ? (
                <button
                    onClick={handleBackToList}
                    className="text-teal-600 hover:text-teal-800 p-2 rounded-full hover:bg-teal-50 transition-colors btn-press flex items-center space-x-1"
                    title="返回首页"
                >
                    <Icon name="home" className="w-6 h-6" />
                </button>
             ) : (
                <button onClick={() => alert('手动定位功能正在开发中！')} className="text-red-500/80 animate-pulse p-2 btn-press" title="手动选择定位">
                    <Icon name="location" className="w-7 h-7"/>
                </button>
             )
        )}
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-bold text-gray-800 font-serif-brand tracking-wide">村官智能体 · 东里村</h1>
          {uiMode === 'presenter' && (
            <p className="text-xs text-gray-500">当前区域: {selectedSpot?.name || '全域视图'}</p>
          )}
        </div>
        <button onClick={toggleUiMode} className="text-white font-semibold py-2 px-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-md hover:shadow-lg transition text-sm btn-press">
          {uiMode === 'classic' ? '主播模式' : '经典模式'}
        </button>
      </header>
      <main className="relative min-h-[calc(100vh-80px)]">
        {uiMode === 'presenter'
          ? <PresenterMode
            routes={routes}
            activeSpot={selectedSpot}
            activeSpotCategory={selectedSpotCategory}
            onSelectSpotFromMap={handleSelectSpotFromMap}
            isLoading={isLoading}
            error={error}
            geoError={geoError}
          />
          : renderClassicContent()
        }
      </main>
      
       {/* Scroll to Top Button */}
       {showScrollTop && uiMode === 'classic' && !selectedSpot && (
        <button
            onClick={scrollToTop}
            className="fixed bottom-24 right-4 z-30 bg-white/80 backdrop-blur text-teal-600 p-3 rounded-full shadow-lg border border-teal-100 hover:bg-teal-50 transition-all animate-fade-in-up"
            style={{ marginBottom: '70px' }} // Stack above agent button
        >
            <Icon name="arrow-left" className="w-5 h-5 transform rotate-90" />
        </button>
      )}

      {uiMode === 'classic' && !isLoading && (
        <div className="fixed bottom-8 right-4 z-40 flex flex-col items-center space-y-3 pointer-events-none">
           <div className="pointer-events-auto">
              <FloatingAgentBar spot={selectedSpot} />
           </div>
        </div>
      )}
    </div>
  );
};

export default TourGuide;