import { getSpotImage, getRouteBackgroundImage } from "../utils/imageService";
import React, { useState } from 'react';
import { Route, Spot } from '../types';
import { Icon } from './common/Icon';

interface SpotListProps {
  routes: Route[];
  onSelectSpot: (spot: Spot, category: Route['category']) => void;
  selectedSpotId: string | null;
}

const categoryConfig = {
  '历史文化': { 
      color: 'text-red-800', 
      badge: 'bg-red-100 text-red-800 border-red-200',
      icon: 'book-open'
  },
  '自然风景': { 
      color: 'text-green-800', 
      badge: 'bg-green-100 text-green-800 border-green-200',
      icon: 'map'
  },
  '美食体验': { 
      color: 'text-amber-800', 
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: 'price-tag'
  },
};

const RouteCard: React.FC<{
  route: Route;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectSpot: (spot: Spot, category: Route['category']) => void;
  selectedSpotId: string | null;
}> = ({ route, isExpanded, onToggle, onSelectSpot, selectedSpotId }) => {
  const config = categoryConfig[route.category] || categoryConfig['历史文化'];
  // Use imagePrompt to get a high-quality unsplash image for the card background
  const bgImage = getRouteBackgroundImage(route.imagePrompt);

  return (
    <div className="group rounded-2xl shadow-premium-lg overflow-hidden bg-white transition-all duration-500 hover:shadow-xl border border-gray-100">
      
      {/* Magazine Cover Style Header */}
      <div 
        className="relative h-48 cursor-pointer overflow-hidden"
        onClick={onToggle}
      >
        {/* Background Image with Zoom Effect */}
        <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url('${bgImage}')` }}
        />
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
             <div className="flex justify-between items-end">
                 <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-white/20 backdrop-blur-md border border-white/30 mb-2`}>
                        <Icon name={config.icon as any} className="w-3 h-3 mr-1" />
                        {route.category}
                    </span>
                    <h3 className="font-serif-brand text-2xl font-bold shadow-black drop-shadow-md tracking-wide">{route.name}</h3>
                    <p className="text-sm text-white/90 mt-1 font-light line-clamp-1">{route.description}</p>
                 </div>
                 <div className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-white text-teal-900' : ''}`}>
                     <Icon name="chevron-down" className="w-6 h-6" />
                 </div>
             </div>
        </div>
      </div>

      {/* Expanded Details List */}
      <div className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
        <div className="p-2 bg-stone-50/50">
             {/* Decorative line */}
             <div className="flex items-center justify-center py-2">
                 <div className="h-px w-16 bg-gray-300"></div>
                 <span className="mx-2 text-[10px] text-gray-400 uppercase tracking-widest">包含景点</span>
                 <div className="h-px w-16 bg-gray-300"></div>
             </div>

          <ul className="space-y-2 pb-2">
            {route.spots.map((spot, index) => (
              <li
                key={spot.id}
                className={`
                    relative mx-2 p-4 rounded-xl cursor-pointer transition-all duration-300 flex items-center border
                    ${selectedSpotId === spot.id 
                        ? 'bg-white border-teal-500 shadow-md ring-1 ring-teal-100' 
                        : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm'
                    }
                `}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectSpot(spot, route.category);
                }}
              >
                {/* Number Badge */}
                <div className="flex-shrink-0 mr-4">
                    <span className={`
                        flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold font-serif-brand
                        ${selectedSpotId === spot.id ? 'bg-teal-600 text-white' : 'bg-stone-100 text-stone-500'}
                    `}>
                        {index + 1}
                    </span>
                </div>

                <div className="flex-grow">
                  <div className="flex justify-between items-baseline">
                    <h4 className={`font-bold text-base ${selectedSpotId === spot.id ? 'text-teal-900' : 'text-gray-800'}`}>
                        {spot.name}
                    </h4>
                    <span className="text-xs text-gray-400">{spot.distance}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{spot.intro_short}</p>
                </div>
                
                {selectedSpotId === spot.id && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-teal-500 rounded-r-xl"></div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};


const SpotList: React.FC<SpotListProps> = ({ routes, onSelectSpot, selectedSpotId }) => {
  const [expandedRoute, setExpandedRoute] = useState<string | null>(routes.length > 0 ? routes[0].name : null);

  const handleToggle = (routeName: string) => {
    setExpandedRoute(current => (current === routeName ? null : routeName));
  };

  return (
    <div className="space-y-6 px-1">
      {routes.map(route => (
        <RouteCard
          key={route.name}
          route={route}
          isExpanded={expandedRoute === route.name}
          onToggle={() => handleToggle(route.name)}
          onSelectSpot={onSelectSpot}
          selectedSpotId={selectedSpotId}
        />
      ))}
    </div>
  );
};

export default SpotList;