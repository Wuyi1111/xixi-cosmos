/**
 * TonightView.jsx — 「此刻」综合门户首页。
 *
 * 屏幕从上到下：
 *   1) 宇宙氛围开头：大标题「息息·宇宙」+ 副标题 + 渐变背景装饰
 *   2) 探索内宇宙测试：点击弹出 QuizWidget 弹窗，完成后直接更新 personality
 *   3) 星系呈现：用户所属星系高亮 + 所有星系列表（循环轮播）
 *   4) 超新星/脉冲星：优秀内容卡片（MOCK_WHISPERS）
 *   5) 跳转引导：雷达入口（发射台）+ 心愿池入口（归星页内嵌）
 *
 * Props:
 *   isDark, userData, saveUserData, onNavigate
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Radio, Gift, Compass, Sparkles, ChevronRight, Users } from 'lucide-react';
import { COSMIC_PERSONALITIES, MOCK_WHISPERS } from '../constants.js';
import QuizWidget from '../widgets/QuizWidget.jsx';

// 星系 mock 人数数据
const GALAXY_COUNTS = {
  'ISTJ': 128, 'ISFJ': 245, 'INFJ': 312, 'INTJ': 198,
  'ISTP': 156, 'ISFP': 289, 'INFP': 456, 'INTP': 234,
  'ESTP': 167, 'ESFP': 278, 'ENFP': 389, 'ENTP': 201,
  'ESTJ': 145, 'ESFJ': 267, 'ENFJ': 298, 'ENTJ': 176,
};

export default function TonightView({ isDark, userData, saveUserData, onNavigate }) {
  const [showQuiz, setShowQuiz] = useState(false);
  const personalityData = typeof userData.personality === 'object' ? userData.personality : null;
  const personalityType = personalityData?.type || null;

  const handleQuizComplete = (result) => {
    const isFirstTest = !userData.personality;
    const nextData = {
      ...userData,
      personality: result,
    };
    if (isFirstTest) {
      nextData.stardust = (userData.stardust || 0) + 30;
    }
    saveUserData(nextData);
    setShowQuiz(false);
  };

  // 1. 宇宙氛围开头
  const HeroSection = () => (
    <section className="relative text-center pt-4 pb-8 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-4 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <h1 className={`text-4xl font-light tracking-[0.2em] mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          息息·宇宙
        </h1>
        <p className={`text-sm font-light tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          与繁星作伴，和内心和解
        </p>
        <div className="mt-4 flex justify-center">
          <div className={`w-16 h-[1px] ${isDark ? 'bg-indigo-500/30' : 'bg-indigo-300/50'}`} />
        </div>
      </div>
    </section>
  );

  // 2. 探索内宇宙测试
  const QuizSection = () => {
    if (!personalityData) {
      return (
        <section
          onClick={() => setShowQuiz(true)}
          className={`p-5 rounded-[28px] cursor-pointer border transition-all hover:scale-[1.02] active:scale-95 ${
            isDark ? 'bg-gradient-to-r from-[#1f1f2e] to-[#171724] border-indigo-500/20' : 'bg-gradient-to-r from-indigo-50 to-white border-indigo-100 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-sm mb-1 flex items-center gap-2">
                <Compass size={16} className="text-indigo-500" />
                探索内宇宙特质
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                完成 10 题睡眠测试，解锁你的专属星体身份
              </p>
            </div>
            <div className="px-3 py-1 bg-indigo-500 text-white text-[10px] rounded-full whitespace-nowrap shadow-md shadow-indigo-500/30">
              +30 星尘
            </div>
          </div>
        </section>
      );
    }

    return (
      <section
        onClick={() => setShowQuiz(true)}
        className={`p-6 rounded-[28px] cursor-pointer border transition-all hover:scale-[1.01] active:scale-95 relative overflow-hidden ${
          isDark ? 'bg-[#1f1f2e] border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]' : 'bg-indigo-50 border-indigo-200 shadow-sm'
        }`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <p className={`text-[10px] mb-1 font-medium tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              你的宇宙睡眠人格
            </p>
            <h3 className="text-xl font-medium tracking-wide flex items-center gap-2">
              {personalityData.name}
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500 border border-gray-200'}`}>
                {personalityData.type}
              </span>
            </h3>
          </div>
          <Sparkles size={20} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
        </div>

        <div className="flex flex-wrap gap-2 mb-4 relative z-10">
          {personalityData.tags.map((tag, idx) => (
            <span key={idx} className={`text-[10px] px-2.5 py-1 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-200' : 'bg-indigo-100/80 text-indigo-700'}`}>
              {tag}
            </span>
          ))}
        </div>

        <p className={`text-xs leading-relaxed font-light relative z-10 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          "{personalityData.desc}"
        </p>

        <p className={`text-[9px] mt-4 text-right opacity-60 flex items-center justify-end gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          点击可重新探测 <ChevronRight size={10} />
        </p>
      </section>
    );
  };

  // 3. 星系呈现 — 循环轮播
  const GalaxySection = () => {
    const entries = Object.entries(COSMIC_PERSONALITIES);
    const total = entries.length;
    if (total === 0) return null;

    // 未测试时不显示
    if (!personalityType) return null;

    const defaultIndex = entries.findIndex(([type]) => type === personalityType);
    const [activeIndex, setActiveIndex] = useState(Math.max(0, defaultIndex));
    const scrollRef = useRef(null);
    const isScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef(null);
    const CARD_WIDTH = 276; // 260px + 16px gap

    const getVirtualIndex = useCallback((realIndex) => {
      // 将真实索引映射到虚拟循环索引
      return ((realIndex % total) + total) % total;
    }, [total]);

    const scrollToRealIndex = useCallback((realIndex, smooth = true) => {
      if (!scrollRef.current) return;
      const containerWidth = scrollRef.current.offsetWidth;
      const offset = realIndex * CARD_WIDTH - (containerWidth - 260) / 2;
      scrollRef.current.scrollTo({ left: offset, behavior: smooth ? 'smooth' : 'auto' });
    }, []);

    const setActiveAndScroll = useCallback((virtualIndex) => {
      const clamped = Math.max(0, Math.min(total - 1, virtualIndex));
      setActiveIndex(clamped);
      // 计算对应的真实索引（在中间循环区域）
      const realIndex = total + clamped;
      scrollToRealIndex(realIndex, true);
    }, [total, scrollToRealIndex]);

    const scrollToMine = useCallback(() => {
      if (defaultIndex >= 0) {
        setActiveAndScroll(defaultIndex);
      }
    }, [defaultIndex, setActiveAndScroll]);

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;

      // 初始定位到中间循环区域的对应位置
      const initialRealIndex = total + Math.max(0, defaultIndex);
      scrollToRealIndex(initialRealIndex, false);

      const handleScroll = () => {
        if (!el) return;
        const containerWidth = el.offsetWidth;
        const scrollLeft = el.scrollLeft;
        const center = scrollLeft + containerWidth / 2;
        const realIndex = Math.round((center - containerWidth / 2 + 228 / 2) / CARD_WIDTH);

        // 循环处理：当滚动到边界时，跳转到中间循环区域的对应位置
        if (realIndex < total) {
          // 滚动到了头部副本区域，跳转到尾部副本
          const jumpIndex = realIndex + total;
          el.scrollTo({ left: jumpIndex * CARD_WIDTH - (containerWidth - 260) / 2, behavior: 'auto' });
          setActiveIndex(getVirtualIndex(realIndex));
        } else if (realIndex >= total * 2) {
          // 滚动到了尾部副本区域，跳转到头部副本
          const jumpIndex = realIndex - total;
          el.scrollTo({ left: jumpIndex * CARD_WIDTH - (containerWidth - 260) / 2, behavior: 'auto' });
          setActiveIndex(getVirtualIndex(realIndex));
        } else {
          setActiveIndex(getVirtualIndex(realIndex));
        }

        // 防抖标记
        isScrollingRef.current = true;
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
        }, 150);
      };

      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        el.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      };
    }, [total, defaultIndex, scrollToRealIndex, getVirtualIndex]);

    // 构建循环数据：尾部副本 + 原始数据 + 头部副本
    const cyclicEntries = [
      ...entries.map(([type, data], i) => ({ type, data, virtualIndex: i, key: `tail-${type}` })),
      ...entries.map(([type, data], i) => ({ type, data, virtualIndex: i, key: `mid-${type}` })),
      ...entries.map(([type, data], i) => ({ type, data, virtualIndex: i, key: `head-${type}` })),
    ];

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Users size={16} className="text-indigo-400" />
            星系图谱
          </h3>
          <button
            onClick={scrollToMine}
            className={`text-[10px] px-2.5 py-1 rounded-full transition-all active:scale-95 ${isDark ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}
          >
            你属于 {COSMIC_PERSONALITIES[personalityType]?.name}
          </button>
        </div>

        {/* 轮播容器 */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2"
          style={{ scrollBehavior: 'auto' }}
        >
          {cyclicEntries.map(({ type, data, virtualIndex, key }) => {
            const isMine = type === personalityType;
            const count = GALAXY_COUNTS[type] || 0;
            const isActive = virtualIndex === activeIndex;

            return (
              <div
                key={key}
                onClick={() => {
                  if (!isScrollingRef.current) {
                    setActiveAndScroll(virtualIndex);
                  }
                }}
                className={`shrink-0 snap-center transition-all duration-300 cursor-pointer ${
                  isActive ? 'scale-100 opacity-100' : 'scale-[0.88] opacity-50'
                }`}
                style={{ width: '260px' }}
              >
                <div
                  className={`h-full p-5 rounded-[24px] border transition-all ${
                    isMine
                      ? (isDark ? 'bg-indigo-900/20 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.12)]' : 'bg-indigo-50 border-indigo-300 shadow-md')
                      : (isDark ? 'bg-[#171724] border-white/5' : 'bg-white border-gray-100 shadow-sm')
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-mono px-2 py-1 rounded-md ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                      {type}
                    </span>
                    {isMine && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
                        你的归属
                      </span>
                    )}
                  </div>

                  <h4 className={`text-lg font-medium mb-3 ${isMine ? (isDark ? 'text-indigo-300' : 'text-indigo-700') : (isDark ? 'text-gray-200' : 'text-gray-800')}`}>
                    {data.name}
                  </h4>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {data.tags.map((tag, i) => (
                      <span key={i} className={`text-[9px] px-2 py-1 rounded-full whitespace-nowrap ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className={`text-[11px] leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {data.desc}
                  </p>

                  <div className={`flex items-center gap-1.5 text-[10px] mt-auto ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Users size={10} />
                    <span>{count.toLocaleString()} 位旅人</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 底部指示器 */}
        <div className="flex justify-center gap-1.5">
          {entries.map(([type], index) => (
            <button
              key={type}
              onClick={() => setActiveAndScroll(index)}
              className={`rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? 'w-5 h-1.5 bg-indigo-500'
                  : 'w-1.5 h-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </section>
    );
  };

  // 4. 超新星/脉冲星 — 横向滑动轮播
  const SupernovaSection = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef(null);
    const isScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef(null);
    const CARD_WIDTH = 292; // 276px + 16px gap

    const scrollToIndex = (index) => {
      if (!scrollRef.current) return;
      const containerWidth = scrollRef.current.offsetWidth;
      const offset = index * CARD_WIDTH - (containerWidth - 276) / 2;
      scrollRef.current.scrollTo({ left: offset, behavior: 'smooth' });
    };

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;

      const handleScroll = () => {
        if (!el) return;
        const containerWidth = el.offsetWidth;
        const scrollLeft = el.scrollLeft;
        const center = scrollLeft + containerWidth / 2;
        const newIndex = Math.round((center - containerWidth / 2 + 276 / 2) / CARD_WIDTH);
        const clamped = Math.max(0, Math.min(MOCK_WHISPERS.length - 1, newIndex));
        if (clamped !== activeIndex) setActiveIndex(clamped);

        isScrollingRef.current = true;
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
        }, 150);
      };

      // 初始居中
      const containerWidth = el.offsetWidth;
      el.scrollLeft = 0 * CARD_WIDTH - (containerWidth - 276) / 2;

      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        el.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      };
    }, [activeIndex]);

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            超新星 / 脉冲星
          </h3>
          <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>星际回音精选</span>
        </div>

        {/* 轮播容器 */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2"
          style={{ scrollBehavior: 'smooth' }}
        >
          {MOCK_WHISPERS.map((whisper, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={whisper.id}
                onClick={() => {
                  if (!isScrollingRef.current) {
                    setActiveIndex(index);
                    scrollToIndex(index);
                  }
                }}
                className={`shrink-0 snap-center transition-all duration-300 cursor-pointer ${
                  isActive ? 'scale-100 opacity-100' : 'scale-[0.88] opacity-50'
                }`}
                style={{ width: '276px' }}
              >
                <div
                  className={`p-5 rounded-[24px] border relative overflow-hidden h-full min-h-[180px] flex flex-col ${
                    isDark ? 'bg-[#171724] border-white/5' : 'bg-white border-gray-100 shadow-sm'
                  }`}
                >
                  <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-3xl opacity-50 ${whisper.isPositive ? 'bg-amber-500/20' : 'bg-blue-500/20'}`} />
                  <div className={`absolute -bottom-10 -left-4 w-16 h-16 rounded-full blur-2xl opacity-30 ${whisper.isPositive ? 'bg-pink-500/10' : 'bg-indigo-500/10'}`} />

                  <div className="flex items-center gap-2 mb-3 relative z-10">
                    <span className={`text-[10px] px-2.5 py-1 rounded-md border ${isDark ? 'bg-white/[0.03] text-gray-300 border-white/10' : 'bg-white text-gray-600 border-gray-100'}`}>
                      {whisper.emotion}
                    </span>
                    <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Radio size={10} /> 未知坐标
                    </span>
                  </div>

                  <p className={`text-sm leading-relaxed font-light relative z-10 flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    "{whisper.text}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 底部指示器 */}
        <div className="flex justify-center gap-1.5">
          {MOCK_WHISPERS.map((whisper, index) => (
            <button
              key={whisper.id}
              onClick={() => {
                setActiveIndex(index);
                scrollToIndex(index);
              }}
              className={`rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? 'w-5 h-1.5 bg-amber-400'
                  : 'w-1.5 h-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </section>
    );
  };

  // 5. 跳转引导
  const NavigationSection = () => (
    <section className="grid grid-cols-2 gap-3">
      <button
        onClick={() => onNavigate('radar')}
        className={`p-5 rounded-[28px] border text-left transition-all hover:scale-[1.02] active:scale-95 group ${
          isDark ? 'bg-[#171724] border-white/5 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-sm hover:border-indigo-200'
        }`}
      >
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>
          <Radio size={20} className="text-indigo-400" />
        </div>
        <h4 className="text-sm font-medium mb-1">雷达入口</h4>
        <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>进入发射台，发送你的心语信号</p>
        <div className={`mt-3 flex items-center gap-1 text-[10px] ${isDark ? 'text-indigo-400' : 'text-indigo-600'} group-hover:gap-1.5 transition-all`}>
          <span>前往</span>
          <ChevronRight size={12} />
        </div>
      </button>

      <button
        onClick={() => onNavigate('star')}
        className={`p-5 rounded-[28px] border text-left transition-all hover:scale-[1.02] active:scale-95 group ${
          isDark ? 'bg-[#171724] border-white/5 hover:border-pink-500/30' : 'bg-white border-gray-100 shadow-sm hover:border-pink-200'
        }`}
      >
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${isDark ? 'bg-pink-500/15' : 'bg-pink-50'}`}>
          <Gift size={20} className="text-pink-400" />
        </div>
        <h4 className="text-sm font-medium mb-1">心愿池入口</h4>
        <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>进入星愿池，兑换助眠好物</p>
        <div className={`mt-3 flex items-center gap-1 text-[10px] ${isDark ? 'text-pink-400' : 'text-pink-600'} group-hover:gap-1.5 transition-all`}>
          <span>前往</span>
          <ChevronRight size={12} />
        </div>
      </button>
    </section>
  );

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <HeroSection />
      <QuizSection />
      <GalaxySection />
      <SupernovaSection />
      <NavigationSection />

      {showQuiz && (
        <QuizWidget
          isDark={isDark}
          onClose={() => setShowQuiz(false)}
          onComplete={handleQuizComplete}
        />
      )}
    </div>
  );
}
