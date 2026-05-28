/**
 * GalaxyMapView.jsx — 星系图谱全览子界面
 *
 * 展示全部 16 种宇宙睡眠人格，高亮用户已测出的类型
 */

import { useState, useMemo } from 'react';
import { ChevronRight, Sparkles, X } from 'lucide-react';
import { COSMIC_PERSONALITIES } from '../constants.js';

export default function GalaxyMapView({ isDark, userPersonality, onClose }) {
  const [selectedType, setSelectedType] = useState(null);

  const types = useMemo(() => {
    return Object.entries(COSMIC_PERSONALITIES).map(([type, data]) => ({
      type,
      ...data,
      isMine: userPersonality?.type === type,
    }));
  }, [userPersonality]);

  const myType = types.find((t) => t.isMine);

  return (
    <div className="animate-fade-in pb-10">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onClose}
          className={`p-2 rounded-full transition-all active:scale-95 ${isDark ? 'bg-[#171724] text-gray-400' : 'bg-white text-gray-500 shadow-sm'}`}
        >
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-medium">星系图谱</h2>
          <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            16 种宇宙睡眠人格
          </p>
        </div>
      </div>

      {/* 我的类型（如果已测试） */}
      {myType && (
        <div className={`p-5 rounded-[24px] mb-5 ${isDark ? 'bg-gradient-to-br from-indigo-500/10 to-[#171724] border border-indigo-500/20' : 'bg-gradient-to-br from-indigo-50 to-white border border-indigo-100'} shadow-sm`}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
            <span className={`text-[10px] font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>你的归属</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-100'}`}>
              <Sparkles size={28} className={isDark ? 'text-indigo-300' : 'text-indigo-500'} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium">{myType.name}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                {myType.type}
              </span>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{myType.desc}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {myType.tags.map((tag, idx) => (
              <span key={idx} className={`text-[10px] px-2 py-1 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 全部类型网格 */}
      <div className="grid grid-cols-2 gap-3">
        {types.map((item) => (
          <button
            key={item.type}
            onClick={() => setSelectedType(selectedType === item.type ? null : item.type)}
            className={`p-4 rounded-2xl text-left transition-all active:scale-95 ${
              item.isMine
                ? (isDark ? 'bg-indigo-500/10 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200')
                : (isDark ? 'bg-[#171724] border border-white/5 hover:border-white/10' : 'bg-white border border-gray-100 hover:border-gray-200 shadow-sm')
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.type}</span>
              {item.isMine && (
                <Sparkles size={12} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
              )}
            </div>
            <h4 className={`text-sm font-medium mb-1 ${item.isMine ? (isDark ? 'text-indigo-300' : 'text-indigo-700') : ''}`}>
              {item.name}
            </h4>
            <p className={`text-[10px] line-clamp-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {item.desc}
            </p>
          </button>
        ))}
      </div>

      {/* 选中详情弹窗 */}
      {selectedType && (
        <div
          className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`}
          onClick={() => setSelectedType(null)}
        >
          {(() => {
            const item = types.find((t) => t.type === selectedType);
            if (!item) return null;
            return (
              <div
                className={`w-full max-w-sm p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedType(null)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200"
                >
                  <X size={20} />
                </button>

                <div className="text-center space-y-3">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                    {item.type}
                  </span>
                  <h3 className="text-xl font-medium">{item.name}</h3>

                  <div className="flex flex-wrap justify-center gap-2">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className={`text-[10px] px-3 py-1.5 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className={`text-sm leading-relaxed font-light ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
