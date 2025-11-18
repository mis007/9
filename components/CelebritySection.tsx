import React, { useState } from 'react';
import { Celebrity } from '../types';
import { Icon } from './common/Icon';
import { getPortraitImage } from '../utils/imageService';

const mockCelebrities: Celebrity[] = [
  {
    id: 'c1',
    name: '郑玉指',
    title: '辛亥革命先驱',
    description: '获孙中山亲颁“旌义状”',
    imageUrl: getPortraitImage('zheng-yuzhi-vintage'),
    detailText: '郑玉指（1851—1929年），字绳摇，永春仙夹东里村人。早年出洋到马来亚的槟榔屿谋生，后经商发达。1906年加入中国同盟会，成为槟榔屿分会第一批会员。他毁家纾难，多次慷慨捐输巨资支持孙中山的革命活动。1912年，孙中山亲颁“旌义状”，表彰其“宣扬大义，不遗余力”。'
  },
  {
    id: 'c2',
    name: '郑拔桶',
    title: '革命烈士',
    description: '坚贞不屈的红色斗士',
    imageUrl: getPortraitImage('zheng-batong-soldier'),
    detailText: '郑拔桶，东里村人。土地革命战争时期积极参加革命斗争，任红二支队侦察员。他机智勇敢，多次完成重要情报传递任务。1935年在反“围剿”斗争中不幸被捕，面对敌人的严刑拷打，他始终坚贞不屈，严守党的秘密，最后英勇就义，用生命谱写了一曲壮丽的革命凯歌。'
  },
  {
    id: 'c3',
    name: '颜子俊',
    title: '爱国侨领',
    description: '致力于华侨权益与家乡建设',
    imageUrl: getPortraitImage('yan-zijun-scholar'),
    detailText: '颜子俊，祖籍永春。早年追随孙中山参加辛亥革命。抗日战争期间，他积极组织南洋华侨筹赈祖国难民，支援抗战。新中国成立后，他历任中国致公党主席、全国侨联副主席等职，为团结海外侨胞、促进祖国统一大业和家乡建设做出了巨大贡献。'
  }
];

const CelebrityCard: React.FC<{ celebrity: Celebrity; onClick: () => void }> = ({ celebrity, onClick }) => (
  <div 
    onClick={onClick}
    className="relative flex-shrink-0 w-40 h-56 rounded-xl overflow-hidden shadow-premium cursor-pointer group transition-transform duration-300 hover:scale-105 card-hover btn-press"
  >
    <img 
      src={celebrity.imageUrl} 
      alt={celebrity.name} 
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0" 
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
      <p className="text-[10px] bg-teal-600/80 px-1.5 py-0.5 rounded inline-block mb-1 backdrop-blur-sm">{celebrity.title}</p>
      <h4 className="font-serif-brand font-bold text-lg leading-tight mb-0.5">{celebrity.name}</h4>
      <p className="text-[10px] opacity-80 line-clamp-1">{celebrity.description}</p>
    </div>
  </div>
);

const CelebritySection: React.FC = () => {
  const [selectedCelebrity, setSelectedCelebrity] = useState<Celebrity | null>(null);

  return (
    <div className="mt-8 mb-4 px-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-baseline justify-between mb-4 px-2">
        <div>
           <h2 className="text-2xl font-serif-brand font-bold text-gray-800">名人堂</h2>
           <p className="text-xs text-gray-500 mt-1 tracking-widest font-light">往昔峥嵘 风骨长隽</p>
        </div>
        <span className="text-xs text-teal-600 font-medium">左滑查看更多 &rarr;</span>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-6 px-2 scrollbar-hide snap-x">
        {mockCelebrities.map(celebrity => (
          <CelebrityCard 
            key={celebrity.id} 
            celebrity={celebrity} 
            onClick={() => setSelectedCelebrity(celebrity)} 
          />
        ))}
         {/* Placeholder for "More" */}
         <div className="flex-shrink-0 w-20 h-56 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 snap-center">
            <span className="text-xs">更多先辈</span>
            <span className="text-xs">敬请期待</span>
         </div>
      </div>

      {/* Detail Modal */}
      {selectedCelebrity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedCelebrity(null)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
             <div className="h-48 relative">
                <img src={selectedCelebrity.imageUrl} alt={selectedCelebrity.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <button 
                    onClick={() => setSelectedCelebrity(null)}
                    className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition btn-press"
                >
                    <Icon name="x" className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-6 text-white">
                    <h3 className="text-3xl font-serif-brand font-bold">{selectedCelebrity.name}</h3>
                    <p className="text-sm opacity-90 mt-1">{selectedCelebrity.title}</p>
                </div>
             </div>
             <div className="p-6 bg-white relative">
                <div className="absolute -top-8 right-6 w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                    <span className="text-2xl">📜</span>
                </div>
                <div className="text-gray-700 leading-relaxed text-sm space-y-4 font-light text-justify">
                    {selectedCelebrity.detailText}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400 italic">—— 精神永存 ——</p>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CelebritySection;