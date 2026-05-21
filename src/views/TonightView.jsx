/**
 * TonightView.jsx — 「此刻」综合门户首页。
 *
 * 屏幕从上到下：
 *   1) 宇宙氛围开头：大标题「息息·宇宙」+ 副标题 + 渐变背景装饰
 *   2) 探索内宇宙测试：点击弹出 QuizWidget 弹窗，完成后直接更新 personality
 *   3) 星系呈现：用户所属星系高亮 + 所有星系列表（可折叠）
 *   4) 超新星/脉冲星：优秀内容卡片（MOCK_WHISPERS）
 *   5) 跳转引导：雷达入口（发射台）+ 心愿池入口（归星页内嵌）
 *
 * Props:
 *   isDark, userData, saveUserData, onNavigate
 */

import React, { useState, useRef, useEffect } from 'react';
import { Radio, Heart, Gift, Compass, Sparkles, ChevronRight, Users, ChevronDown } from 'lucide-react';
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
      {/* 背景光晕装饰 */}
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

  // 3. 星系呈现 — 横向滑动轮播
  const GalaxySection = () => {
    const entries = Object.entries(COSMIC_PERSONALITIES);
    const defaultIndex = personalityType
      ? entries.findIndex(([type]) => type === personalityType)
      : 0;
    const [activeIndex, setActiveIndex] = useState(Math.max(0, defaultIndex));
    const scrollRef = useRef(null);
    const cardWidth = 260; // 卡片宽度 + gap

    const scrollToIndex = (index) => {
      const clamped = Math.max(0, Math.min(entries.length - 1, index));
      setActiveIndex(clamped);
      if (scrollRef.current) {
        const containerWidth = scrollRef.current.offsetWidth;
        const offset = clamped * cardWidth - (containerWidth - cardWidth) / 2;
        scrollRef.current.scrollTo({ left: offset, behavior: 'smooth' });
      }
    };

    const handleScroll = () => {
      if (!scrollRef.current) return;
      const containerWidth = scrollRef.current.offsetWidth;
      const scrollLeft = scrollRef.current.scrollLeft;
      const center = scrollLeft + containerWidth / 2;
      const newIndex = Math.round((center - containerWidth / 2) / cardWidth + entries.length / 2);
      const clamped = Math.max(0, Math.min(entries.length - 1, newIndex));
      if (clamped !== activeIndex) setActiveIndex(clamped);
    };

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      // 初始定位到活跃卡片居中
      const containerWidth = el.offsetWidth;
      const offset = activeIndex * cardWidth - (containerWidth - cardWidth) / 2;
      el.scrollLeft = offset;

      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => el.removeEventListener('scroll', handleScroll);
    }, []);

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Users size={16} className="text-indigo-400" />
            星系图谱
          </h3>
          {personalityType && (
            <span className={`text-[10px] px-2.5 py-1 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
              你属于 {COSMIC_PERSONALITIES[personalityType]?.name}
            </span>
          )}
        </div>

        {/* 轮播容器 */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2"
          style={{ scrollBehavior: 'smooth' }}
        >
          {entries.map(([type, data], index) => {
            const isMine = type === personalityType;
            const count = GALAXY_COUNTS[type] || 0;
            const isActive = index === activeIndex;

            return (
              <div
                key={type}
                onClick={() => scrollToIndex(index)}
                className={`shrink-0 snap-center transition-all duration-500 cursor-pointer ${
                  isActive ? 'scale-100 opacity-100' : 'scale-[0.88] opacity-50'
                }`}
                style={{ width: '228px' }}
              >
                <div
                  className={`h-full p-5 rounded-[24px] border transition-all ${
                    isMine
                      ? (isDark ? 'bg-indigo-900/20 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.12)]' : 'bg-indigo-50 border-indigo-300 shadow-md')
                      : (isDark ? 'bg-[#171724] border-white/5' : 'bg-white border-gray-100 shadow-sm')
                  }`}
                >
                  {/* 顶部：类型标签 */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-mono px-2 py-1 rounded-md ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                      {type}
                    </span>
                    {isMine && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
                        你的归属
                      </span>
                    )}
                  </div>

                  {/* 人格名称 */}
                  <h4 className={`text-lg font-medium mb-2 ${isMine ? (isDark ? 'text-indigo-300' : 'text-indigo-700') : (isDark ? 'text-gray-200' : 'text-gray-800')}`}>
                    {data.name}
                  </h4>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {data.tags.map((tag, i) => (
                      <span key={i} className={`text-[9px] px-2 py-1 rounded-full ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 描述 */}
                  <p className={`text-[11px] leading-relaxed mb-4 line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {data.desc}
                  </p>

                  {/* 人数 */}
                  <div className={`flex items-center gap-1.5 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
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
              onClick={() => scrollToIndex(index)}
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

  // 4. 超新星/脉冲星
  const SupernovaSection = () => (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Sparkles size={16} className="text-amber-400" />
          超新星 / 脉冲星
        </h3>
        <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>星际回音精选</span>
      </div>

      <div className="space-y-3">
        {MOCK_WHISPERS.map((whisper) => (
          <div
            key={whisper.id}
            className={`p-5 rounded-[28px] border relative overflow-hidden transition-all hover:scale-[1.01] ${
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

            <p className={`text-sm leading-relaxed font-light relative z-10 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              "{whisper.text}"
            </p>
          </div>
        ))}
      </div>
    </section>
  );

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
