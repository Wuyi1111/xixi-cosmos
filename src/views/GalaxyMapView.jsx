/**
 * GalaxyMapView.jsx — 星系图谱全览子界面（v4.37.0 卡片滑动版）
 *
 * 左右滑动卡片堆叠展示 16 种宇宙睡眠人格
 * 中间卡片完整展示，两侧露出边缘
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { COSMIC_PERSONALITIES } from '../constants.js';

export default function GalaxyMapView({ isDark, userPersonality, onClose }) {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const types = useMemo(() => {
    return Object.entries(COSMIC_PERSONALITIES).map(([type, data]) => ({
      type,
      ...data,
      isMine: userPersonality?.type === type,
    }));
  }, [userPersonality]);

  // 默认滚动到"我的归属"
  useEffect(() => {
    const mineIndex = types.findIndex((t) => t.isMine);
    if (mineIndex >= 0 && scrollRef.current) {
      const el = scrollRef.current;
      const cardWidth = el.offsetWidth * 0.72;
      const gap = 12;
      el.scrollLeft = mineIndex * (cardWidth + gap);
      setActiveIndex(mineIndex);
    }
  }, [types]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.offsetWidth * 0.72;
    const gap = 12;
    const index = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.max(0, Math.min(index, types.length - 1)));
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

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

      {/* 卡片滑动区域 */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4"
        style={{ scrollPaddingLeft: '14%', scrollPaddingRight: '14%' }}
      >
        {/* 左侧占位 */}
        <div className="snap-start shrink-0" style={{ width: '14%' }} />

        {types.map((item, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={item.type}
              className={`snap-center shrink-0 rounded-[24px] p-6 transition-all duration-300 flex flex-col ${
                isActive
                  ? (isDark ? 'bg-[#171724] border border-white/10 shadow-lg' : 'bg-white border border-gray-200 shadow-lg')
                  : (isDark ? 'bg-[#171724]/60 border border-white/5 opacity-70' : 'bg-white/60 border border-gray-100 opacity-70')
              }`}
              style={{ width: '72%' }}
            >
              {/* 顶部：类型 + 是否我的归属 */}
              <div className="flex items-center justify-between mb-6">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                  {item.type}
                </span>
                {item.isMine && (
                  <div className="flex items-center gap-1">
                    <Sparkles size={12} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                    <span className={`text-[10px] ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>你的归属</span>
                  </div>
                )}
              </div>

              {/* 中间：名字 */}
              <h3 className={`text-2xl font-medium text-center mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.name}
              </h3>

              {/* 描述 */}
              <p className={`text-sm leading-relaxed text-center flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.desc}
              </p>

              {/* 底部：标签 */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {item.tags.map((tag, idx) => (
                  <span key={idx} className={`text-[10px] px-3 py-1.5 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {/* 右侧占位 */}
        <div className="snap-start shrink-0" style={{ width: '14%' }} />
      </div>

      {/* 指示点 */}
      <div className="flex justify-center gap-1.5 mt-2">
        {types.map((_, idx) => (
          <div
            key={idx}
            className={`rounded-full transition-all duration-300 ${
              idx === activeIndex
                ? (isDark ? 'bg-indigo-400 w-4 h-1.5' : 'bg-indigo-500 w-4 h-1.5')
                : (isDark ? 'bg-gray-700 w-1.5 h-1.5' : 'bg-gray-300 w-1.5 h-1.5')
            }`}
          />
        ))}
      </div>
    </div>
  );
}
