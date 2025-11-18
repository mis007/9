import { getSpotImage, getRouteBackgroundImage } from "../utils/imageService";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Spot, RecognitionResponse, VoiceResponse, RelatedKnowledge, NavigationInfo } from '../types';
import { Icon } from './common/Icon';
import { Spinner } from './common/Spinner';
import * as aiService from '../services/minimaxService';
import { decode, decodeAudioData } from '../utils/audioUtils';

// --- Child Components ---

const NarrationPlayer: React.FC<{ spotName: string }> = ({ spotName }) => {
  const [narration, setNarration] = useState<VoiceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);

  const cleanupAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop(0);
      } catch (e) {
        // Ignore error if already stopped
      }
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlaying(false);
    setProgress(0);
    pauseOffsetRef.current = 0;
  }, []);

  useEffect(() => {
    return cleanupAudio;
  }, [cleanupAudio]);

  const prepareAudio = async (base64: string) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      const audioBytes = decode(base64);
      audioBufferRef.current = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
    } catch (err) {
      console.error("Error preparing audio:", err);
      audioBufferRef.current = null;
    }
  };

  const handleFetchNarration = useCallback(async () => {
    setIsLoading(true);
    cleanupAudio();

    const cacheKey = `village_guide_narration_${spotName}`;

    try {
      // 1. Try to load from cache
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          // Check expiry (3 days = 259200000 ms)
          if (Date.now() - parsed.timestamp < 259200000) {
            setNarration(parsed.data);
            if (parsed.data.audio_base_64) {
              await prepareAudio(parsed.data.audio_base_64);
            }
            setIsLoading(false);
            return; // Exit if cache hit
          }
        } catch (e) {
          console.warn("Invalid cache data, removing...", e);
          localStorage.removeItem(cacheKey);
        }
      }

      // 2. Fetch from API if no valid cache
      const result = await aiService.voiceInteraction(spotName);
      setNarration(result);

      // 3. Save to cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: result
        }));
      } catch (e) {
        console.warn("Failed to cache narration (likely storage quota exceeded):", e);
      }

      if (result.audio_base_64) {
        await prepareAudio(result.audio_base_64);
      }
    } catch (error) {
      console.error("Failed to fetch narration:", error);
      setNarration(null);
    } finally {
      setIsLoading(false);
    }
  }, [spotName, cleanupAudio]);
  
  useEffect(() => {
    handleFetchNarration();
  }, [handleFetchNarration]);


  const updateProgress = useCallback(() => {
    if (!isPlaying || !audioBufferRef.current || !audioContextRef.current) return;

    const elapsedTime = audioContextRef.current.currentTime - playbackStartTimeRef.current + pauseOffsetRef.current;
    const newProgress = (elapsedTime / audioBufferRef.current.duration) * 100;

    if (newProgress >= 100) {
      cleanupAudio();
    } else {
      setProgress(newProgress);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying, cleanupAudio]);

  const handlePlayPause = () => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (isPlaying) { // Pause
      if (audioSourceRef.current) {
        try {
           audioSourceRef.current.stop(0);
        } catch (e) {}
        audioSourceRef.current = null;
      }
      pauseOffsetRef.current += audioContextRef.current.currentTime - playbackStartTimeRef.current;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setIsPlaying(false);
    } else { // Play
      audioSourceRef.current = audioContextRef.current.createBufferSource();
      audioSourceRef.current.buffer = audioBufferRef.current;
      audioSourceRef.current.connect(audioContextRef.current.destination);
      audioSourceRef.current.onended = () => {
        if (progress < 99) cleanupAudio();
      };

      playbackStartTimeRef.current = audioContextRef.current.currentTime;
      audioSourceRef.current.start(0, pauseOffsetRef.current % audioBufferRef.current.duration);

      animationFrameRef.current = requestAnimationFrame(updateProgress);
      setIsPlaying(true);
    }
  };
  
  if (isLoading) {
      return (
          <div className="bg-teal-50/80 border border-solid border-teal-200 rounded-xl p-4 mt-4 flex justify-center items-center h-[92px] glass">
              <Spinner size="sm" />
              <span className="ml-3 text-teal-800/80 text-sm">正在生成语音...</span>
          </div>
      )
  }

  if (!narration) {
      return (
          <div className="bg-red-50 border border-solid border-red-200 rounded-xl p-4 mt-4 text-center">
              <p className="text-sm text-red-700">无法加载语音讲解，请稍后重试。</p>
          </div>
      )
  }


  return (
    <div className="bg-white/90 backdrop-blur border border-teal-100 rounded-2xl p-4 mt-4 space-y-3 animate-fade-in-up shadow-premium-sm">
      <div className="flex items-center space-x-3">
        <button onClick={handlePlayPause} className="w-12 h-12 flex-shrink-0 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-teal-700 transition btn-press">
          <Icon name={isPlaying ? 'pause' : 'play'} className="w-6 h-6" />
        </button>
        <div className="w-full bg-teal-100 rounded-full h-2">
          <div className="bg-teal-600 h-2 rounded-full transition-all duration-100" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      <div>
        <p className="text-sm text-teal-900/80 leading-relaxed font-light">{narration.text}</p>
      </div>
    </div>
  );
};

const Modal: React.FC<{ title: string; isLoading: boolean; children: React.ReactNode; onClose: () => void; }> = ({ title, isLoading, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
    <div className="relative bg-white rounded-2xl shadow-premium-xl max-w-sm w-full animate-fade-in-up" role="dialog" aria-modal="true" style={{ animationDuration: '0.3s' }}>
      <header className="p-4 border-b border-gray-200 flex justify-between items-center bg-stone-50 rounded-t-2xl">
        <h2 className="font-bold text-lg text-gray-800 font-serif-brand">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition btn-press" aria-label="关闭">
          <Icon name="x" className="w-5 h-5" />
        </button>
      </header>
      <main className="p-6 max-h-[60vh] overflow-y-auto">
        {isLoading ? <div className="flex justify-center items-center h-32"><Spinner /></div> : children}
      </main>
    </div>
  </div>
);

// --- Main Component ---

// ... (Pre-mapped images constant if needed, otherwise relying on Unsplash logic)
const spotImageMap: Record<string, string> = {
    '永春辛亥革命纪念馆': 'https://i.ibb.co/nH3Hf3W/58.png',
    '旌义状石碑': 'https://i.ibb.co/JRJzxRgZ/75.png',
    '古炮楼': 'https://i.ibb.co/XxmK7qR5/153.png',
    '集庆廊桥': 'https://i.ibb.co/zWX80Lqp/150.png',
    '洋杆尾古民居': 'https://i.ibb.co/Q3GZbVMX/133.png',
    '昭灵宫': 'https://i.ibb.co/DHTD9rjt/101.png',
    '仙灵瀑布': 'https://i.ibb.co/ymdMQ6SN/98-181.jpg',
    '豆磨古寨': 'https://i.ibb.co/dsRgDNZ1/100-192.jpg',
    '东里水库': 'https://i.ibb.co/VpMxRxj3/105-221.jpg',
    '功能农业基地': 'https://i.ibb.co/G3ncz111/121-292.jpg',
    '特色果园': 'https://i.ibb.co/84GVHwQ7/122-297.jpg',
    '婚庆习俗': 'https://i.ibb.co/VpMxRxj3/105-221.jpg', // Reuse for now or find better
    '池头古民居': 'https://i.ibb.co/21V3Jh2r/123-304.jpg',
    '迎龙灯': 'https://i.ibb.co/fYvJfmtP/126-318.jpg',
};

interface SpotDetailProps {
  spot: Spot;
  onBack: () => void;
  navigationInfo: NavigationInfo | null;
  isNavLoading: boolean;
}

const SpotDetail: React.FC<SpotDetailProps> = ({ spot, onBack, navigationInfo, isNavLoading }) => {
  const [modalState, setModalState] = useState<{ type: 'knowledge' | 'photo'; data: any } | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);
  const [showNarration, setShowNarration] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefer curated image, fallback to unsplash
  const spotImageUrl = getSpotImage(spot.name, spot.imagePrompt, 600, 400);

  const handleKnowledgeClick = async () => {
    setModalState({ type: 'knowledge', data: null });
    setIsModalLoading(true);
    try {
      const result = await aiService.getRelatedKnowledge(spot.name);
      setModalState({ type: 'knowledge', data: result });
    } catch (error) {
      console.error("Failed to get related knowledge", error);
      alert("获取关联知识失败，请稍后重试。");
      setModalState(null);
    } finally {
      setIsModalLoading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setModalState({ type: 'photo', data: null });
    setIsModalLoading(true);
    try {
      const result = await aiService.objectRecognition(spot.name);
      setModalState({ type: 'photo', data: result });
    } catch (error) {
      console.error("Failed to recognize object", error);
      alert("图片识别失败，请稍后重试。");
      setModalState(null);
    } finally {
      setIsModalLoading(false);
    }
    if (event.target) event.target.value = '';
  };

  const renderModalContent = () => {
    if (!modalState || !modalState.data) {
      return null;
    }

    switch (modalState.type) {
      case 'knowledge':
        const knowledge = modalState.data as RelatedKnowledge;
        return (
          <div className="space-y-4">
             <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <Icon name="book-open" className="w-6 h-6 text-orange-600" />
             </div>
            <h3 className="font-serif-brand font-bold text-xl text-gray-900">{knowledge.title}</h3>
            <p className="text-gray-600 leading-relaxed font-light text-justify">{knowledge.content}</p>
          </div>
        );
      case 'photo':
        const recognition = modalState.data as RecognitionResponse;
        return (
          <div className="space-y-4">
            <img src={recognition.memorial_image} alt="AI生成纪念图" className="rounded-xl shadow-premium w-full aspect-square object-cover" />
            <div className="p-2">
                <h4 className="font-bold text-gray-800 mb-2">AI 识别解读：</h4>
                <p className="text-gray-600 leading-relaxed font-light">{recognition.explanation}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in-up" key={spot.id}>
      <div className="bg-white rounded-t-3xl shadow-premium-xl overflow-hidden mt-4 min-h-[80vh] relative">
        
        {/* Immersive Hero Image */}
        <div className="relative h-72 w-full">
          <img src={spotImageUrl} alt={spot.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
          
          <button onClick={onBack} className="absolute top-4 left-4 bg-white/20 backdrop-blur-md rounded-full p-2 text-white hover:bg-white/40 transition-all z-10 border border-white/30 btn-press" aria-label="返回列表">
            <Icon name="arrow-left" className="w-6 h-6" />
          </button>

          {/* Floating Navigation Button */}
          <button
            onClick={() => setIsNavModalOpen(true)}
            className="absolute -bottom-6 right-6 bg-white rounded-full p-4 text-teal-600 shadow-premium-lg hover:shadow-2xl z-20 transition-all transform hover:-translate-y-1 btn-press flex items-center justify-center border border-teal-50"
            aria-label="显示导航"
          >
            <Icon name="navigation" className="w-8 h-8 transform rotate-45" />
          </button>

          <div className="absolute bottom-6 left-6 right-16 text-white">
            <h2 className="text-3xl font-serif-brand font-bold drop-shadow-lg tracking-wide">{spot.name}</h2>
            <div className="h-1 w-10 bg-teal-500 my-2 rounded-full"></div>
            <p className="text-sm drop-shadow text-white/90 font-light line-clamp-1">{spot.intro_short}</p>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-6 pt-10 bg-white relative pb-12">
          <div className="text-gray-700 leading-relaxed space-y-4 mb-8 font-light text-justify">
            {spot.intro_txt.split('\n').map((p, i) => <p key={i}>{p || '\u00A0'}</p>)}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button onClick={handleKnowledgeClick} className="group relative overflow-hidden rounded-2xl p-4 bg-orange-50 border border-orange-100 shadow-sm hover:shadow-md transition btn-press">
                <div className="relative z-10 flex flex-col items-center">
                    <Icon name="book-open" className="w-8 h-8 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-orange-900">关联知识</span>
                    <span className="text-xs text-orange-600/70 mt-1">AI 深度解读</span>
                </div>
                <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            <button onClick={handlePhotoClick} className="group relative overflow-hidden rounded-2xl p-4 bg-blue-50 border border-blue-100 shadow-sm hover:shadow-md transition btn-press">
                <div className="relative z-10 flex flex-col items-center">
                    <Icon name="camera" className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-blue-900">拍照讲解</span>
                    <span className="text-xs text-blue-600/70 mt-1">识物生图</span>
                </div>
                <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>

          {!showNarration ? (
            <div className="relative rounded-2xl overflow-hidden shadow-lg btn-press cursor-pointer" onClick={() => setShowNarration(true)}>
                <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-700"></div>
                <div className="relative p-5 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Icon name="microphone" className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-white">
                            <p className="font-bold text-lg">收听景点故事</p>
                            <p className="text-xs opacity-80">沉浸式语音讲解</p>
                        </div>
                    </div>
                    <Icon name="play" className="w-6 h-6 text-white opacity-80" />
                </div>
            </div>
          ) : (
            <NarrationPlayer spotName={spot.name} />
          )}

          {/* Brand Signature - AI Agent Identity */}
          <div className="mt-12 mb-4 flex flex-col items-center justify-center space-y-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
             <p className="text-teal-600 font-medium text-lg tracking-wider font-serif-brand">
                听小A 讲述景点故事
             </p>
             <div className="flex items-center space-x-3 text-xs text-teal-400/80 uppercase tracking-widest font-light">
                <span>话题播客</span>
                <span className="w-px h-3 bg-teal-200"></span>
                <span>景点故事</span>
             </div>
          </div>

        </div>
      </div>

      {modalState && (
        <Modal
          title={modalState.type === 'knowledge' ? '关联知识' : '拍照讲解'}
          isLoading={isModalLoading}
          onClose={() => setModalState(null)}
        >
          {renderModalContent()}
        </Modal>
      )}

      {isNavModalOpen && (
        <Modal
          title="路线导航"
          isLoading={isNavLoading}
          onClose={() => setIsNavModalOpen(false)}
        >
          {navigationInfo ? (
            <div className="space-y-4 text-gray-700">
               <div className="flex items-center justify-between bg-teal-50 p-3 rounded-xl">
                  <div>
                      <p className="text-xs text-gray-500">目的地</p>
                      <p className="font-bold text-teal-800">{spot.name}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-xs text-gray-500">预计步行</p>
                      <p className="font-bold text-teal-800">{navigationInfo.walking_time}</p>
                  </div>
               </div>
              <div className="flex items-start space-x-3 p-2">
                <Icon name="map" className="w-6 h-6 text-teal-500 mt-1 flex-shrink-0" />
                <p className="leading-relaxed text-sm font-light text-justify">{navigationInfo.route_text}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
                 <p className="text-sm text-gray-400">正在规划路线...</p>
            </div>
          )}
        </Modal>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </div>
  );
};

export default SpotDetail;