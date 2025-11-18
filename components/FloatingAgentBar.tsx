import React, { useState, useEffect, useRef } from 'react';
import { Spot, VoiceResponse } from '../types';
import * as aiService from '../services/minimaxService';
import { Icon } from './common/Icon';

const ChatBubble: React.FC<{ message: string; sender: 'user' | 'ai' }> = ({ message, sender }) => {
  if (sender === 'user') {
    return (
      <div className="flex justify-end animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
        <div className="bg-teal-500 text-white rounded-lg rounded-br-none px-4 py-3 shadow-premium-sm max-w-[85%]">
          {message}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
      <div className="bg-white text-gray-800 rounded-lg rounded-bl-none px-4 py-3 shadow-premium-sm max-w-[85%]">
        {message}
      </div>
    </div>
  );
};

const FloatingAgentBar: React.FC<{ spot: Spot | null }> = ({ spot }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "这个景点的历史背景是什么？",
    "有什么有趣的故事吗？",
    "最佳游览时间是多久？",
    "拍照的最佳位置在哪里？"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (questionText?: string) => {
    const textToSend = questionText || inputValue;
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const contextSpotName = spot?.name || '这个地方';
      const response: VoiceResponse = await aiService.voiceInteraction(contextSpotName, textToSend);
      setMessages(prev => [...prev, { sender: 'ai', text: response.text }]);
    } catch (error) {
      console.error("AI interaction failed:", error);
      setMessages(prev => [...prev, { sender: 'ai', text: '抱歉，我现在有点忙，请稍后再试。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div
        className="fixed bottom-24 right-4 z-40 animate-fade-in-up"
        style={{ animationDelay: '0.5s' }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-full shadow-premium-xl p-3 flex items-center justify-center transition-all transform hover:scale-105 hover:shadow-premium-2xl"
          style={{ width: '60px', height: '60px' }}
          aria-label="打开AI导游"
        >
          <Icon name="chat-bubble" className="w-7 h-7 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-40 w-[calc(100%-2rem)] max-w-[360px] h-[calc(100%-6rem)] max-h-[600px] bg-gray-50 rounded-2xl shadow-premium-xl flex flex-col animate-fade-in-up"
      style={{ animationDuration: '0.4s' }}
    >
      <header className="flex-shrink-0 p-4 bg-white rounded-t-2xl flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg">
            <Icon name="chat-bubble" className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-800">村官智能体</p>
            <p className="text-xs text-gray-500">您的专属AI导游</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
        </button>
      </header>

      <main className="flex-grow p-4 space-y-4 overflow-y-auto scrollbar-hide bg-gray-100/50">
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-800">
          <p className="font-semibold mb-2">您可以问：</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
              <button key={i} onClick={() => handleSendMessage(q)} className="text-xs bg-white border border-teal-300 rounded-full px-3 py-1 hover:bg-teal-100 transition">
                {q}
              </button>
            ))}
          </div>
        </div>
        {messages.map((msg, index) => (
          <ChatBubble key={index} sender={msg.sender} message={msg.text} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg rounded-bl-none px-4 py-3 flex items-center space-x-2 shadow-sm">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      <footer className="flex-shrink-0 p-3 bg-white border-t rounded-b-2xl">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="输入您的问题..."
            disabled={isLoading}
            className="flex-grow bg-gray-100 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 border border-transparent focus:ring-2 focus:ring-teal-400 focus:bg-white disabled:bg-gray-50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputValue.trim()}
            className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center text-white hover:bg-teal-600 transition disabled:opacity-50 shrink-0"
          >
            <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default FloatingAgentBar;