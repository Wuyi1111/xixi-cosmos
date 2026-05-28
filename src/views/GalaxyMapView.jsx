/**
 * GalaxyMapView.jsx — 星系图谱全览子界面（v4.38.0 优雅卡片版）
 *
 * 单张大卡片居中展示，底部横向缩略导航
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { COSMIC_PERSONALITIES } from '../constants.js';

export default function GalaxyMapView({ isDark, userPersonality, onClose }) {
  const scrollRef = useRef(null);
  const thumbRef = useRef(null);
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
      const cardWidth = el.offsetWidth * 0.82;
      const gap = 16;
      el.scrollLeft = mineIndex * (cardWidth + gap);
      setActiveIndex(mineIndex);
    }
  }, [types]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.offsetWidth * 0.82;
    const gap = 16;
    const index = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.max(0, Math.min(index, types.length - 1)));
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // 点击缩略导航滚动到对应卡片
  const scrollToIndex = (index) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.offsetWidth * 0.82;
    const gap = 16;
    el.scrollTo({ left: index * (cardWidth + gap), behavior: 'smooth' });
  };

  // 缩略导航滚动：让当前项保持在中间
  useEffect(() => {
    const thumbEl = thumbRef.current;
    if (!thumbEl) return;
    const itemWidth = 48;
    const containerWidth = thumbEl.offsetWidth;
    thumbEl.scrollTo({
      left: activeIndex * itemWidth - containerWidth / 2 + itemWidth / 2,
      behavior: 'smooth',
    });
  }, [activeIndex]);

  const current = types[activeIndex];

  return (
    <div className="animate-fade-in pb-10">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onClose}
          className={`p-2 rounded-full transition-all active:scale-95 ${isDark ? 'bg-[#171724] text-gray-400' : 'bg-white text-gray-500 shadow-sm'}`}
        >
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-medium">星系图谱</h2>
        </div>
      </div>

      {/* 计数 */}
      <div className="text-center mb-4">
        <span className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {activeIndex + 1} / {types.length}
        </span>
      </div>

      {/* 卡片滑动区域 */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-6"
        style={{ scrollPaddingLeft: '9%', scrollPaddingRight: '9%' }}
      >
        {/* 左侧占位 */}
        <div className="snap-start shrink-0" style={{ width: '9%' }} />

        {types.map((item, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={item.type}
              className={`snap-center shrink-0 rounded-[28px] p-8 transition-all duration-500 flex flex-col items-center text-center ${
                isActive
                  ? (isDark ? 'bg-[#171724] border border-white/10 shadow-xl' : 'bg-white border border-gray-200 shadow-xl')
                  : (isDark ? 'bg-[#171724]/40 border border-white/5 opacity-50 scale-95' : 'bg-white/40 border border-gray-100 opacity-50 scale-95')
              }`}
              style={{ width: '82%', minHeight: '380px' }}
            >
              {/* MBTI 类型 */}
              <span className={`text-[10px] font-mono tracking-widest mb-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {item.type}
              </span>

              {/* 名字 */}
              <h3 className={`text-2xl font-medium mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.name}
              </h3>

              {/* 图标 */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                <Sparkles size={32} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
              </div>

              {/* 描述 */}
              <p className={`text-sm leading-relaxed flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.desc}
              </p>

              {/* 标签 */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {item.tags.map((tag, idx) => (
                  <span key={idx} className={`text-[10px] px-3 py-1.5 rounded-full ${isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* 你的归属标记 */}
              {item.isMine && (
                <div className={`mt-4 flex items-center gap-1 text-[10px] ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}>
                  <Sparkles size={10} />
                  你的归属
                </div>
              )}
            </div>
          );
        })}

        {/* 右侧占位 */}
        <div className="snap-start shrink-0" style={{ width: '9%' }} />
      </div>

      {/* 底部横向缩略导航 */}
      <div className="px-4">
        <div
          ref={thumbRef}
          className="flex gap-2 overflow-x-auto no-scrollbar py-2"
        >
          {types.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={item.type}
                onClick={() => scrollToIndex(idx)}
                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium transition-all active:scale-90 ${
                  isActive
                    ? (isDark ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border border-indigo-200')
                    : (isDark ? 'bg-[#1f1f2e] text-gray-500 border border-transparent' : 'bg-gray-50 text-gray-400 border border-transparent')
                }`}
              >
                {item.type.charAt(0)}
              </button>
            );
          })}
        </div>

        {/* 当前名字 */}
        <div className="text-center mt-3">
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {current?.name}
          </p>
        </div>
      </div>
    </div>
  );
}
