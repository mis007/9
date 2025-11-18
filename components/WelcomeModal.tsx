import React, { useState, useEffect } from 'react';
import { Icon } from './common/Icon';

interface WelcomeModalProps {
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [weatherIcon, setWeatherIcon] = useState<'sun' | 'moon'>('sun');
  const [weatherText, setWeatherText] = useState('');
  const [announcement, setAnnouncement] = useState('探索乡土风情，感受科技助农的温度。欢迎来到东里村，我是您的智能村官助手，随时为您服务。');

  useEffect(() => {
    // 1. Date Logic
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(now.toLocaleDateString('zh-CN', options));

    // 2. Time-based Greeting & Weather Simulation
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('早上好！一日之计在于晨。');
      setWeatherIcon('sun');
      setWeatherText('晴空万里 24°C');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('下午好！愿您有段惬意的时光。');
      setWeatherIcon('sun');
      setWeatherText('微风徐徐 28°C');
    } else {
      setGreeting('晚上好！乡村的夜空格外宁静。');
      setWeatherIcon('moon');
      setWeatherText('星河璀璨 20°C');
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative glass p-0 rounded-3xl shadow-premium-lg max-w-sm w-full overflow-hidden animate-fade-in-up" style={{ animationDuration: '0.4s' }}>
        
        {/* Header Image Area */}
        <div className="h-32 bg-gradient-to-br from-teal-600 to-teal-800 relative p-6 flex flex-col justify-between">
             <div className="absolute top-0 right-0 p-4 opacity-20">
                 <Icon name={weatherIcon} className="w-24 h-24 text-white" />
             </div>
             <div className="text-white relative z-10">
                 <div className="flex items-center space-x-2 opacity-90 text-sm mb-1">
                     <Icon name="calendar" className="w-4 h-4" />
                     <span>{currentDate}</span>
                 </div>
                 <div className="flex items-center space-x-2 font-bold text-lg">
                     <span>{weatherText}</span>
                 </div>
             </div>
        </div>

        {/* Content Area */}
        <div className="p-8 pt-12 relative bg-white/90">
            {/* Avatar floating between sections */}
            <div className="absolute -top-10 left-8 w-20 h-20 bg-white rounded-full p-1 shadow-lg">
                <img 
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=village_guide&backgroundColor=transparent" 
                    alt="AI Avatar" 
                    className="w-full h-full rounded-full bg-teal-50"
                />
            </div>

            <h2 className="text-2xl font-serif-brand font-bold text-teal-900 mb-2 mt-2">{greeting}</h2>
            <p className="text-gray-500 text-sm mb-6">我是您的专属 AI 导游</p>

            {/* Admin/AI Announcement Card */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-8">
                <div className="flex items-center space-x-2 text-orange-800 mb-2">
                    <Icon name="bell" className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">今日公告</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                    {announcement}
                </p>
            </div>

            <button 
                onClick={onClose}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium shadow-lg shadow-teal-200 transition-all transform hover:scale-[1.02] btn-press"
            >
                开启今日旅程
            </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;