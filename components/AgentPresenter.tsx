import React, { useState, useEffect, useRef } from 'react';
import { Agent, Spot, VoiceResponse, RecognitionResponse, ShoppingInfo } from '../types';
import { Icon } from './common/Icon';
import { Spinner } from './common/Spinner';
import * as aiService from '../services/minimaxService';
import { decode, decodeAudioData } from '../utils/audioUtils';

interface ChatMessage {
  id: number;
  sender: 'user' | 'agent';
  type: 'text' | 'voice' | 'photo' | 'shop' | 'system';
  content: any;
}

interface AgentPresenterProps {
  agent: Agent;
  spot: Spot | null;
  onSwitchToAgentC: () => void;
}

const AgentMessageBubble: React.FC<{ message: ChatMessage; onPlayAudio: (b64: string) => void; isAudioPlaying: boolean; agent: Agent }> = ({ message, onPlayAudio, isAudioPlaying, agent }) => {
  const renderContent = () => {
    switch (message.type) {
      case 'voice':
        const voiceResult = message.content as VoiceResponse;
        return (
          <div className="flex items-start space-x-2">
            <p className="flex-grow">{voiceResult.text}</p>
            {voiceResult.audio_base_64 && (
              <button
                onClick={() => onPlayAudio(voiceResult.audio_base_64)}
                className="p-2 rounded-full bg-teal-100 hover:bg-teal-200 transition text-teal-600 shrink-0"
                aria-label={isAudioPlaying ? '停止播放' : '播放语音'}
              >
                <Icon name={isAudioPlaying ? 'pause' : 'play'} className="w-5 h-5" />
              </button>
            )}
          </div>
        );
      case 'photo':
        const photoResult = message.content as RecognitionResponse;
        return (
          <div className="space-y-2">
            <img src={photoResult.memorial_image} alt="AI生成纪念图" className="rounded-lg shadow-md" />
            <p>{photoResult.explanation}</p>
          </div>
        );
      case 'shop':
        const shopResult = message.content as ShoppingInfo;
        return (
          <div className="space-y-3 text-sm">
            <p className="italic">{shopResult.recommend_text}</p>
            <div>
              <h4 className="font-bold">推荐商品:</h4>
              <ul className="list-disc list-inside text-gray-600 mt-1">
                {shopResult.products.map((p, i) => <li key={i}>{p.name} - {p.price}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-bold">附近商家:</h4>
              <ul className="list-disc list-inside text-gray-600 mt-1">
                {shopResult.businesses.map((b, i) => <li key={i}>{b.name} ({b.type}) - {b.distance}</li>)}
              </ul>
            </div>
          </div>
        );
      case 'system': return message.content;
      case 'text': return <p>{message.content.text || message.content}</p>;
      default: return null;
    }
  };

  return (
    <div className="flex items-start space-x-3 animate-fade-in-up" style={{ animationDuration: '0.4s' }}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${agent.colorClasses.iconBg} shadow-md flex-shrink-0 mt-1`}>
        <Icon name={agent.icon} className="w-5 h-5 text-white" />
      </div>
      <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 shadow-premium max-w-[85%]">
        {renderContent()}
      </div>
    </div>
  );
};

const UserMessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => (
  <div className="flex justify-end animate-fade-in-up" style={{ animationDuration: '0.4s' }}>
    <div className="bg-teal-500 text-white rounded-lg rounded-tr-none px-4 py-3 shadow-premium max-w-[85%]">
      <p>{message.content}</p>
    </div>
  </div>
);

const LoadingBubble: React.FC<{ agent: Agent; text?: string }> = ({ agent, text = "AI 正在思考中" }) => (
  <div className="flex items-start space-x-3 animate-fade-in-up">
    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${agent.colorClasses.iconBg} shadow-md flex-shrink-0 mt-1`}>
      <Icon name={agent.icon} className="w-5 h-5 text-white" />
    </div>
    <div className="bg-white text-gray-500 rounded-lg rounded-tl-none px-4 py-3 flex items-center space-x-3 shadow-premium">
      <span className="text-sm italic">{text}</span>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0s' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }}></div>
    </div>
  </div>
);


const AgentPresenter: React.FC<AgentPresenterProps> = ({ agent, spot, onSwitchToAgentC }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("AI 正在思考中");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any | null>(null); // For SpeechRecognition API

  useEffect(() => {
    const getInitialMessage = (): ChatMessage => {
      let content;
      if (agent.id === 'A') {
        content = (
          <div className="text-gray-700 space-y-3">
            <p className="font-semibold text-lg">您好, 我是您的AI导游:</p>
            <ol className="list-decimal list-inside text-sm space-y-2">
              <li>点击<span className="font-semibold text-teal-600">地图标记</span>或<span className="font-semibold text-teal-600">快速导览</span>按钮切换景点。</li>
              <li>我可以告诉您周边有什么好玩的<span className="font-semibold">活动</span>、<span className="font-semibold">住宿</span>、<span className="font-semibold">餐饮</span>和<span className="font-semibold">特产</span>。</li>
              <li>有任何疑问都可以通过下方的对话框问我。</li>
            </ol>
          </div>
        );
      } else if (['B', 'RED', 'ECO', 'FOOD'].includes(agent.id)) {
        content = (
          <div className="text-gray-700 space-y-3">
            <p className="font-semibold text-lg">您好, 我是{agent.name}:</p>
            <p className="text-sm">1. 在<span className="font-semibold text-teal-600">{spot?.name || '此景点'}</span>, 您可以点击 <Icon name="camera" className="w-4 h-4 inline-block mx-1" /> 拍照, 我将为您讲述它的故事。</p>
            <p className="text-sm">2. 您也可以在下方输入问题，与我进行<span className="font-semibold">语音</span>或<span className="font-semibold">文字</span>互动。</p>
          </div>
        );
      } else {
        content = <p className="text-gray-600 text-center p-4">欢迎来到东里村！<br />请在上方地图选择一个景点，或从快速导航开始探索。</p>;
      }
      return { id: Date.now(), sender: 'agent', type: 'system', content };
    };
    setChatHistory([getInitialMessage()]);

    return () => {
      audioSourceRef.current?.stop();
      recognitionRef.current?.stop();
    };
  }, [agent.id, spot?.id]);

  useEffect(() => {
    const fetchShopInfoForAgentC = async () => {
      if (agent.id === 'C' && spot) {
        setLoadingMessage("正在为您搜罗附近的特产...");
        setIsLoading(true);
        try {
          const result = await aiService.getShoppingInfo(spot.coord, spot.name);
          addMessage({ sender: 'agent', type: 'shop', content: result });
        } catch (error) {
          console.error(error);
          addMessage({ sender: 'agent', type: 'text', content: { text: "获取特产信息失败，请稍后重试。" } });
        } finally {
          setIsLoading(false);
          setLoadingMessage("AI 正在思考中");
        }
      }
    };
    fetchShopInfoForAgentC();
  }, [agent.id, spot]); // spot dependency is sufficient

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const addMessage = (message: Omit<ChatMessage, 'id'>) => {
    setChatHistory(prev => [...prev, { ...message, id: Date.now() }]);
  };

  const handlePlayAudio = async (base64Audio: string) => {
    if (isAudioPlaying) {
      audioSourceRef.current?.stop();
      setIsAudioPlaying(false);
      return;
    }
    if (!base64Audio) return;

    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsAudioPlaying(false);
      source.start(0);
      audioSourceRef.current = source;
      setIsAudioPlaying(true);
    } catch (err) {
      console.error("Failed to play audio:", err);
      alert("无法播放语音，请稍后再试。");
      setIsAudioPlaying(false);
    }
  };

  const handleSendQuestion = async () => {
    if (!question.trim() || isLoading) return;
    const userQuestion = question;
    setQuestion('');
    addMessage({ sender: 'user', type: 'text', content: userQuestion });
    setLoadingMessage("AI 正在思考中...");
    setIsLoading(true);
    try {
      const result = await aiService.voiceInteraction(spot?.name || '东里村', userQuestion);
      addMessage({ sender: 'agent', type: 'voice', content: result });
    } catch (error) {
      console.error(error);
      addMessage({ sender: 'agent', type: 'text', content: { text: "服务暂时不可用，请稍后重试。" } });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && spot && !isLoading) {
      addMessage({ sender: 'user', type: 'text', content: '（已发送一张图片进行识别）' });
      setLoadingMessage("正在分析您拍摄的物体...");
      setIsLoading(true);
      try {
        const result = await aiService.objectRecognition(spot.name);
        addMessage({ sender: 'agent', type: 'photo', content: result });
      } catch (error) {
        console.error(error);
        addMessage({ sender: 'agent', type: 'text', content: { text: "哎呀，刚才信号不太好，或者照片有点模糊，我没能识别出来。请您再试一次吧！" } });
      } finally {
        setIsLoading(false);
        setLoadingMessage("AI 正在思考中");
      }
    }
    if (event.target) event.target.value = '';
  };

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("抱歉，您的浏览器不支持语音识别功能。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
      setQuestion(transcript);
    };
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('语音识别需要麦克风权限，请在浏览器设置中允许。');
      } else {
        alert(`语音识别出错: ${event.error}`);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="p-4 flex flex-col h-full bg-white">
      <div ref={chatContainerRef} className="flex-grow bg-gray-100 rounded-xl shadow-inner p-4 space-y-4 overflow-y-auto scrollbar-hide">
        {chatHistory.map(msg =>
          msg.sender === 'user'
            ? <UserMessageBubble key={msg.id} message={msg} />
            : <AgentMessageBubble key={msg.id} message={msg} onPlayAudio={handlePlayAudio} isAudioPlaying={isAudioPlaying} agent={agent} />
        )}
        {isLoading && <LoadingBubble agent={agent} text={loadingMessage} />}
      </div>

      <div className="mt-4 flex-shrink-0">
        {agent.id !== 'C' && spot && (
          <div className="flex justify-end mb-2">
            <button
              onClick={onSwitchToAgentC}
              className="text-sm bg-white border border-orange-300 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-50 transition shadow-sm"
            >
              <Icon name="bag" className="w-4 h-4 inline mr-1.5" />
              查找本地特产
            </button>
          </div>
        )}
        <div className="bg-gray-100 rounded-xl flex items-center space-x-2 p-2 shadow-sm">
          <button onClick={() => fileInputRef.current?.click()} disabled={!spot || isLoading} className="p-2 text-gray-500 hover:text-gray-800 shrink-0 disabled:opacity-50" title="拍照识别">
            <Icon name="camera" className="w-6 h-6" />
          </button>
          <button onClick={handleMicClick} disabled={!spot || isLoading} className={`p-2 shrink-0 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:text-gray-800'} disabled:opacity-50`} title={isListening ? "停止录音" : "语音输入"}>
            <Icon name="microphone" className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendQuestion()}
            placeholder={spot ? `关于${spot.name}，问点什么...` : "请先选择一个景点"}
            className="flex-grow bg-white rounded-md px-3 py-2 text-gray-800 placeholder-gray-400 border border-gray-300 focus:ring-2 focus:ring-teal-500/80 focus:border-teal-500/80 disabled:bg-gray-200"
            disabled={!spot || isLoading}
          />
          <button onClick={handleSendQuestion} className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center text-white hover:bg-teal-600 transition disabled:opacity-50 shrink-0" disabled={!question.trim() || isLoading} title="发送">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
          </button>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </div>
  );
};

export default AgentPresenter;