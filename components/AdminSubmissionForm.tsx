import React, { useState } from 'react';
import { Icon } from './common/Icon';
import { Spinner } from './common/Spinner';

const GOOGLE_SCRIPT_URL = '';

interface SubmissionData {
  name: string;
  type: 'red' | 'ecology' | 'folk' | 'food';
  desc: string;
  location_desc: string;
  recommender_name: string;
}

interface AdminSubmissionFormProps {
  onBack: () => void;
}

const AdminSubmissionForm: React.FC<AdminSubmissionFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<SubmissionData>({
    name: '',
    type: 'ecology',
    desc: '',
    location_desc: '',
    recommender_name: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatDataForCopy = () => {
    return `【乡村内容共建提交】
景点名称：${formData.name}
类型：${formData.type === 'red' ? '红色文化' : formData.type === 'ecology' ? '自然生态' : formData.type === 'folk' ? '民俗文化' : '美食特产'}
位置描述：${formData.location_desc}
详细介绍：${formData.desc}
推荐人：${formData.recommender_name}
提交时间：${new Date().toLocaleString()}`;
  };

  const handleCopyToClipboard = async () => {
    const text = formatDataForCopy();
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      alert('复制失败，请手动复制。');
    }
  };

  const handleSubmitToCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!GOOGLE_SCRIPT_URL) {
      handleCopyToClipboard();
      setStatus('success');
      return;
    }
    setStatus('submitting');
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setStatus('success');
    } catch (error) {
      console.error('Submission error:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex flex-col" style={{ backgroundImage: "url('https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN')" }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      
      <header className="relative z-10 p-4 flex items-center text-white">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition">
          <Icon name="arrow-left" className="w-6 h-6" />
        </button>
        <h1 className="ml-3 text-lg font-bold font-serif-brand tracking-wide">内容共建 · 景点填报</h1>
      </header>

      <main className="flex-grow p-4 relative z-10 flex items-center justify-center">
        {status === 'success' ? (
          <div className="glass p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full animate-fade-in-up">
             <div className="w-20 h-20 bg-green-100/90 rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner">
                <Icon name="check-circle" className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">提交成功！</h2>
            <p className="text-gray-600 mb-6">感谢您为家乡宣传做出的贡献。</p>
            {!GOOGLE_SCRIPT_URL && (
               <div className="bg-white/60 border border-gray-200 p-3 rounded-lg mb-6">
                   <p className="text-xs text-gray-500">内容已复制，请前往微信粘贴发送。</p>
               </div>
            )}
            <button
              onClick={() => {
                setFormData({ name: '', type: 'ecology', desc: '', location_desc: '', recommender_name: '' });
                setStatus('idle');
              }}
              className="w-full bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-teal-700 transition"
            >
              提交下一条
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitToCloud} className="glass p-6 rounded-3xl shadow-2xl w-full max-w-md space-y-5 animate-fade-in-up">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">景点名称</label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                placeholder="例如：老村长家的大榕树"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">类型</label>
                <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:bg-white outline-none transition appearance-none"
                >
                    <option value="ecology">自然生态</option>
                    <option value="red">红色文化</option>
                    <option value="folk">民俗文化</option>
                    <option value="food">美食特产</option>
                </select>
                </div>
                <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">位置</label>
                <input
                    required
                    name="location_desc"
                    value={formData.location_desc}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                    placeholder="如：村委会后"
                />
                </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">详细介绍</label>
              <textarea
                required
                name="desc"
                value={formData.desc}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition resize-none"
                placeholder="讲讲这里的故事..."
              />
            </div>

             <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">推荐人</label>
              <input
                name="recommender_name"
                value={formData.recommender_name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                placeholder="您的姓名"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-teal-700 transition-all transform hover:scale-[1.02] disabled:opacity-70 mt-2"
            >
              {status === 'submitting' ? '提交中...' : '生成并复制'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
};

export default AdminSubmissionForm;