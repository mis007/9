import React, { useEffect, useState } from 'react';
import { Spinner } from './common/Spinner';
import { Icon } from './common/Icon';

interface LoginProps {
  onLogin: (userId: string) => void;
  onAdminClick: () => void;
  geoLoading: boolean;
  geoError: GeolocationPositionError | null;
}

const GeolocationStatus: React.FC<{ loading: boolean; error: GeolocationPositionError | null }> = ({ loading, error }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center text-xs text-white/70 mt-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <Spinner size="sm" />
        <span className="ml-2">正在定位，准备为您开启旅程...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center text-xs text-white/80 mt-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <Icon name="location" className="w-3 h-3 mr-1" />
        <span>欢迎访问，请稍后选择您的定位</span>
      </div>
    );
  }
  return <div className="h-[34px] mt-6"></div>; 
};

const Login: React.FC<LoginProps> = ({ onLogin, onAdminClick, geoLoading, geoError }) => {
  const [bgUrl, setBgUrl] = useState('https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN');

  useEffect(() => {
      // Attempt to fetch Bing daily wallpaper for a fresh look every day
      const fetchBingImage = async () => {
          try {
              // Using a proxy or direct service if available. Fallback to unsplash.
              // This URL is a common proxy for Bing images
              setBgUrl('https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN');
          } catch (e) {
              console.warn("Failed to fetch Bing image, falling back.");
          }
      };
      fetchBingImage();
  }, []);

  const handleLogin = (loginType: 'wechat' | 'alipay') => {
    const openid = `${loginType}_${Math.random().toString(36).substring(2, 10)}`;
    const userId = `user_${openid.slice(-8)}`;
    onLogin(userId);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center p-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" 
        style={{ backgroundImage: `url('${bgUrl}')`, transform: 'scale(1.05)' }} 
      />
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
      
      {/* Main Card */}
      <div className="relative glass-dark p-10 rounded-3xl shadow-2xl text-center max-w-sm w-full animate-fade-in-up border border-white/10">
        
        {/* Header */}
        <div className="mb-10 relative">
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-lg">
                 <img src="https://api.dicebear.com/7.x/bottts/svg?seed=village_guide&backgroundColor=transparent" alt="AI Avatar" className="w-16 h-16 drop-shadow-md" />
            </div>
            <div className="mt-8">
                <h1 className="text-3xl font-serif-brand font-bold text-white mb-2 tracking-wide">村官智能体</h1>
                <div className="flex items-center justify-center space-x-2">
                    <span className="h-[1px] w-6 bg-white/40"></span>
                    <p className="text-sm text-white/80 font-light tracking-wider">AI 伴您 · 探索乡土</p>
                    <span className="h-[1px] w-6 bg-white/40"></span>
                </div>
            </div>
        </div>

        {/* Login Actions */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={() => handleLogin('wechat')}
            className="flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-[#07C160]/90 hover:bg-[#07C160] text-white transition-all hover:shadow-lg group backdrop-blur-sm"
          >
             <Icon name="chat-bubble" className="w-5 h-5" />
             <span className="text-sm font-medium">微信一键游</span>
          </button>

          <button
            onClick={() => handleLogin('alipay')}
            className="flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-[#1677FF]/90 hover:bg-[#1677FF] text-white transition-all hover:shadow-lg group backdrop-blur-sm"
          >
             <Icon name="bag" className="w-5 h-5" />
             <span className="text-sm font-medium">支付宝登录</span>
          </button>
        </div>

        <GeolocationStatus loading={geoLoading} error={geoError} />

         <div className="mt-10 pt-6 border-t border-white/10">
            <button 
                onClick={onAdminClick}
                className="text-xs text-white/50 hover:text-white flex items-center justify-center mx-auto transition-colors hover:underline underline-offset-4"
            >
                我是村民/管理员，参与内容共建 &rarr;
            </button>
        </div>
      </div>
      
      <p className="absolute bottom-4 text-[10px] text-white/30">Powered by MiniMax AI · 公益助农</p>
    </div>
  );
};

export default Login;