/**
 * TonightView.jsx — 「此刻」综合门户首页（v4.18.0 重写版）
 *
 * 屏幕从上到下：
 *   1) 顶部区域：大标题「息息·宇宙」+ 应用简介（未测试时显示，有测试结果后隐藏）
 *   2) 人格测试卡片：三种状态（未测试 / 已保存可展开 / 飞入未保存）
 *   3) 星系图谱：有测试结果时才显示，垂直滑动卡片堆叠
 *   4) 星际回音：可折叠，展开后垂直滑动卡片堆叠
 *   5) 底部固定导航：雷达 + 心愿池
 *
 * Props:
 *   isDark, userData, saveUserData, onNavigate
 *
 * 实现注意（v4.23.1）：
 *   ❗ 三个有内部 state 的 Section（QuizSection / GalaxySection / SupernovaSection）
 *   定义在文件顶层（不是 TonightView 内部），否则父级 re-render 会让它们的
 *   identity 改变，触发 unmount → 内部 useState 重置 → 卡片展开态/滚动位置丢失。
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Radio, Gift, Compass, Sparkles, ChevronRight, ChevronDown, Users } from 'lucide-react';
import { COSMIC_PERSONALITIES, MOCK_WHISPERS } from '../constants.js';
import QuizWidget from '../widgets/QuizWidget.jsx';

// 星系 mock 人数数据
const GALAXY_COUNTS = {
  'ISTJ': 128, 'ISFJ': 245, 'INFJ': 312, 'INTJ': 198,
  'ISTP': 156, 'ISFP': 289, 'INFP': 456, 'INTP': 234,
  'ESTP': 167, 'ESFP': 278, 'ENFP': 389, 'ENTP': 201,
  'ESTJ': 145, 'ESFJ': 267, 'ENFJ': 298, 'ENTJ': 176,
};

// ============================================================================
// Section 组件 — 顶层 function 定义，避免父级 re-render 时 identity 变化
// ============================================================================

// 2. 探索内宇宙测试 — 简洁卡片（含内部 showDetail state + 飞入清理 useEffect）
function QuizSection({
  isDark,
  flyInResult,
  showFlyInAnim,
  setShowFlyInAnim,
  personalityData,
  setShowQuiz,
  quizCardRef,
}) {
  const [showDetail, setShowDetail] = useState(false);

  // 飞入动画结束后清理状态
  useEffect(() => {
    if (showFlyInAnim && flyInResult) {
      const timer = setTimeout(() => {
        setShowFlyInAnim(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [showFlyInAnim, flyInResult, setShowFlyInAnim]);

  // 有飞入结果但未保存时，显示临时结果卡片
  if (flyInResult && !personalityData) {
    return (
      <section
        ref={quizCardRef}
        className={`p-5 rounded-[24px] border transition-all ${
          isDark ? 'bg-[#171724]/70 border-white/5' : 'bg-white border-gray-100 shadow-sm'
        } ${showFlyInAnim ? 'animate-fly-in-card' : ''}`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-100'}`}>
            <Sparkles size={24} className={isDark ? 'text-indigo-300' : 'text-indigo-500'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-medium tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              宇宙睡眠人格
            </p>
            <h3 className="text-lg font-medium tracking-wide">
              {flyInResult.name}
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              {flyInResult.type}
            </span>
          </div>
          <button
            onClick={() => setShowDetail(!showDetail)}
            className={`p-2 rounded-full transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ChevronDown size={16} className={`transition-transform duration-300 ${showDetail ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* 展开详情 */}
        <div className={`grid transition-all duration-300 ease-in-out ${showDetail ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="flex flex-wrap gap-2 mb-3">
              {flyInResult.tags.map((tag, idx) => (
                <span key={idx} className={`text-[10px] px-2.5 py-1 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-200' : 'bg-indigo-100/80 text-indigo-700'}`}>
                  {tag}
                </span>
              ))}
            </div>
            <p className={`text-xs leading-relaxed font-light ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {flyInResult.desc}
            </p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => setShowQuiz(true)}
                className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'}`}
              >
                重新探测 <ChevronRight size={10} />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!personalityData) {
    return (
      <section
        onClick={() => setShowQuiz(true)}
        className={`p-5 rounded-[24px] cursor-pointer border transition-all hover:scale-[1.01] active:scale-95 ${
          isDark ? 'bg-[#171724]/70 border-white/5' : 'bg-white border-gray-100 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-100'}`}>
            <Compass size={24} className={isDark ? 'text-indigo-300' : 'text-indigo-500'} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base tracking-wide">
              探索你的宇宙人格
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              10 题测试 · 解锁专属星体身份
            </p>
          </div>
          <div className="px-3 py-1.5 bg-indigo-500 text-white text-[10px] rounded-full whitespace-nowrap">
            开始
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`p-5 rounded-[24px] border transition-all ${
        isDark ? 'bg-[#171724]/70 border-white/5' : 'bg-white border-gray-100 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-100'}`}>
          <Sparkles size={24} className={isDark ? 'text-indigo-300' : 'text-indigo-500'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-medium tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
            宇宙睡眠人格
          </p>
          <h3 className="text-lg font-medium tracking-wide">
            {personalityData.name}
          </h3>
          <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
            {personalityData.type}
          </span>
        </div>
        <button
          onClick={() => setShowDetail(!showDetail)}
          className={`p-2 rounded-full transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <ChevronDown size={16} className={`transition-transform duration-300 ${showDetail ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 展开详情 */}
      <div className={`grid transition-all duration-300 ease-in-out ${showDetail ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="flex flex-wrap gap-2 mb-3">
            {personalityData.tags.map((tag, idx) => (
              <span key={idx} className={`text-[10px] px-2.5 py-1 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-200' : 'bg-indigo-100/80 text-indigo-700'}`}>
                {tag}
              </span>
            ))}
          </div>
          <p className={`text-xs leading-relaxed font-light ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {personalityData.desc}
          </p>
          <button
            onClick={() => setShowQuiz(true)}
            className={`mt-3 text-[10px] flex items-center gap-1 ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'}`}
          >
            重新探测 <ChevronRight size={10} />
          </button>
        </div>
      </div>
    </section>
  );
}

// 3. 星系呈现 — 垂直滑动卡片堆叠（含 scrollRef + 初始定位 useEffect）
function GalaxySection({ isDark, effectiveType, galaxyActiveIndex, setGalaxyActiveIndex }) {
  const entries = Object.entries(COSMIC_PERSONALITIES);
  const total = entries.length;
  const scrollRef = useRef(null);
  const defaultIndex = entries.findIndex(([type]) => type === effectiveType);

  const scrollToMine = useCallback(() => {
    if (defaultIndex >= 0 && scrollRef.current) {
      const cardHeight = 140 + 16;
      scrollRef.current.scrollTo({ top: defaultIndex * cardHeight, behavior: 'smooth' });
      setGalaxyActiveIndex(defaultIndex);
    }
  }, [defaultIndex, setGalaxyActiveIndex]);

  // 初始定位
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      const cardHeight = 140 + 16;
      el.scrollTo({ top: Math.max(0, defaultIndex) * cardHeight, behavior: 'auto' });
    });
    return () => cancelAnimationFrame(raf);
  }, [defaultIndex]);

  if (total === 0 || !effectiveType) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Users size={16} className="text-indigo-400" />
          星系图谱
        </h3>
        <button
          onClick={scrollToMine}
          className={`text-[10px] px-2.5 py-1 rounded-full transition-all active:scale-95 ${isDark ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}
        >
          你属于 {COSMIC_PERSONALITIES[effectiveType]?.name}
        </button>
      </div>

      {/* 垂直滑动容器 */}
      <div
        ref={scrollRef}
        className="relative h-[220px] overflow-hidden -mx-4 px-4"
        onScroll={(e) => {
          const container = e.currentTarget;
          const scrollTop = container.scrollTop;
          const cardHeight = 140 + 16;
          const newIndex = Math.round(scrollTop / cardHeight);
          if (newIndex !== galaxyActiveIndex && newIndex >= 0 && newIndex < total) {
            setGalaxyActiveIndex(newIndex);
          }
        }}
        style={{ scrollSnapType: 'y mandatory', overflowY: 'scroll' }}
      >
        <div className="py-[40px]">
          {entries.map(([type, data], index) => {
            const isMine = type === effectiveType;
            const count = GALAXY_COUNTS[type] || 0;
            const isActive = index === galaxyActiveIndex;

            return (
              <div
                key={type}
                className="mb-4"
                style={{ scrollSnapAlign: 'center' }}
              >
                <div
                  className={`relative h-[140px] p-5 rounded-[24px] border transition-all duration-500 ${
                    isMine
                      ? (isDark ? 'bg-indigo-900/20 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.12)]' : 'bg-indigo-50 border-indigo-300 shadow-md')
                      : (isDark ? 'bg-[#171724]/70 border-white/5' : 'bg-white border-gray-100 shadow-sm')
                  } ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-40 blur-[2px]'}`}
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

                  <h4 className={`text-lg font-medium mb-2 ${isMine ? (isDark ? 'text-indigo-300' : 'text-indigo-700') : (isDark ? 'text-gray-200' : 'text-gray-800')}`}>
                    {data.name}
                  </h4>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {data.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className={`text-[9px] px-2 py-1 rounded-full whitespace-nowrap ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Users size={10} />
                      <span>{count.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
}

// 4. 星际回音 — 折叠 + 垂直滑动卡片堆叠（含内部 activeIndex state + scrollRef）
function SupernovaSection({ isDark, supernovaExpanded, toggleSupernova }) {
  const entries = MOCK_WHISPERS;
  const total = entries.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  return (
    <section className="space-y-2">
      <button
        onClick={toggleSupernova}
        className="w-full flex items-center justify-between px-2 py-2 transition-colors rounded-xl"
      >
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Sparkles size={16} className="text-pink-400" />
          星际回音
        </h3>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>星际回音精选</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${isDark ? 'text-gray-500' : 'text-gray-400'} ${supernovaExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      <div className={`grid transition-all duration-500 ease-in-out ${supernovaExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden space-y-2">
          {/* 垂直滑动容器 */}
          <div
            ref={scrollRef}
            className="relative h-[240px] overflow-hidden -mx-4 px-4"
            onScroll={(e) => {
              const container = e.currentTarget;
              const scrollTop = container.scrollTop;
              const cardHeight = 160 + 16;
              const newIndex = Math.round(scrollTop / cardHeight);
              if (newIndex !== activeIndex && newIndex >= 0 && newIndex < total) {
                setActiveIndex(newIndex);
              }
            }}
            style={{ scrollSnapType: 'y mandatory', overflowY: 'scroll' }}
          >
            <div className="py-[40px]">
              {entries.map((whisper, index) => {
                const isActive = index === activeIndex;
                return (
                  <div
                    key={whisper.id}
                    className="mb-4"
                    style={{ scrollSnapAlign: 'center' }}
                  >
                    <div
                      className={`relative h-[160px] p-5 rounded-[24px] border overflow-hidden transition-all duration-500 ${
                        isDark ? 'bg-[#171724]/70 border-white/5' : 'bg-white border-gray-100 shadow-sm'
                      } ${isActive ? 'shadow-lg scale-100 opacity-100' : 'shadow-sm scale-90 opacity-40 blur-[2px]'}`}
                    >
                      <div className="flex items-center gap-2 mb-3 relative z-10">
                        <span className={`text-[10px] px-2.5 py-1 rounded-md border ${isDark ? 'bg-white/[0.03] text-gray-300 border-white/10' : 'bg-white text-gray-600 border-gray-100'}`}>
                          {whisper.emotion}
                        </span>
                        <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <Radio size={10} /> 未知坐标
                        </span>
                      </div>

                      <p className={`text-sm leading-relaxed font-light relative z-10 line-clamp-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        "{whisper.text}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


        </div>
      </div>
    </section>
  );
}

// ============================================================================
// 主组件 TonightView
// ============================================================================

export default function TonightView({ isDark, userData, saveUserData, onNavigate }) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [flyInResult, setFlyInResult] = useState(null);
  const [showFlyInAnim, setShowFlyInAnim] = useState(false);
  const quizCardRef = useRef(null);

  // 星系图谱当前活跃索引（提升到组件顶层，避免子组件重建时重置）
  const [galaxyActiveIndex, setGalaxyActiveIndex] = useState(() => {
    const entries = Object.entries(COSMIC_PERSONALITIES);
    const idx = entries.findIndex(([type]) => type === (userData?.personality?.type || null));
    return Math.max(0, idx);
  });
  // 确保 personality 数据格式正确（兼容旧版本数据）
  const personalityData = userData?.personality && typeof userData.personality === 'object' && userData.personality.type
    ? userData.personality
    : null;

  // 有效人格数据：已保存的或飞入未保存的
  const effectivePersonality = personalityData || flyInResult;
  const effectiveType = effectivePersonality?.type || null;

  // 星际回音展开状态持久化到 localStorage
  const [supernovaExpanded, setSupernovaExpanded] = useState(() => {
    try {
      return localStorage.getItem('xixi_supernova_expanded') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSupernova = () => {
    const next = !supernovaExpanded;
    setSupernovaExpanded(next);
    try {
      localStorage.setItem('xixi_supernova_expanded', String(next));
    } catch {}
  };

  const handleQuizComplete = (savedResult, unsavedResult) => {
    if (savedResult) {
      // 点击保存 — 只保存数据，不关闭弹窗（弹窗内会显示已保存状态）
      const isFirstTest = !userData.personality;
      const nextData = {
        ...userData,
        personality: savedResult,
      };
      if (isFirstTest) {
        nextData.stardust = (userData.stardust || 0) + 30;
      }
      saveUserData(nextData);
      // 不关闭弹窗，让 QuizWidget 内部显示已保存状态
    } else if (unsavedResult) {
      // 点击关闭（未保存），触发飞入动画
      setFlyInResult(unsavedResult);
      setShowQuiz(false);
      // 延迟一点等弹窗关闭后再开始飞入
      setTimeout(() => {
        setShowFlyInAnim(true);
      }, 100);
    } else {
      // 两个参数都是 null：已保存后点击关闭，直接关闭弹窗
      setShowQuiz(false);
    }
  };

  // 是否有测试结果（已保存或飞入未保存）
  const hasTestResult = !!personalityData || !!flyInResult;

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-5rem)] overflow-hidden">
      {/* 内容区 — 不需要上下滚动，所有内容在一页内 */}
      <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
        {/* 未测试且没有飞入结果时显示标题和简介 */}
        {!hasTestResult && (
          <>
            {/* 1. 顶部区域 */}
            <section className="text-center pt-2 pb-1">
              <h1 className={`text-4xl font-light tracking-[0.2em] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                息息·宇宙
              </h1>
            </section>
            {/* 应用简介 */}
            <section className="text-center px-4">
              <p className={`text-xs leading-relaxed max-w-[280px] mx-auto ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                一个温柔的睡前陪伴空间<br />记录心情 · 探索自我 · 与宇宙对话
              </p>
            </section>
          </>
        )}

        <QuizSection
          isDark={isDark}
          flyInResult={flyInResult}
          showFlyInAnim={showFlyInAnim}
          setShowFlyInAnim={setShowFlyInAnim}
          personalityData={personalityData}
          setShowQuiz={setShowQuiz}
          quizCardRef={quizCardRef}
        />

        {/* 未测试时：星际回音在上，星系图谱在下；测试后：星系图谱在上，星际回音在下 */}
        {hasTestResult ? (
          <>
            <GalaxySection
              isDark={isDark}
              effectiveType={effectiveType}
              galaxyActiveIndex={galaxyActiveIndex}
              setGalaxyActiveIndex={setGalaxyActiveIndex}
            />
            <SupernovaSection
              isDark={isDark}
              supernovaExpanded={supernovaExpanded}
              toggleSupernova={toggleSupernova}
            />
          </>
        ) : (
          <>
            <SupernovaSection
              isDark={isDark}
              supernovaExpanded={supernovaExpanded}
              toggleSupernova={toggleSupernova}
            />
            <GalaxySection
              isDark={isDark}
              effectiveType={effectiveType}
              galaxyActiveIndex={galaxyActiveIndex}
              setGalaxyActiveIndex={setGalaxyActiveIndex}
            />
          </>
        )}
      </div>

      {/* 5. 跳转引导 — 固定在底部，极简图标风格 */}
      <section className="shrink-0 px-4 pb-1">
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={() => onNavigate('radar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95 ${
              isDark ? 'text-gray-400 hover:text-indigo-300' : 'text-gray-500 hover:text-indigo-500'
            }`}
          >
            <Radio size={18} />
            <span className="text-xs font-medium">雷达</span>
          </button>

          <div className={`w-px h-4 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

          <button
            onClick={() => onNavigate('star')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95 ${
              isDark ? 'text-gray-400 hover:text-pink-300' : 'text-gray-500 hover:text-pink-500'
            }`}
          >
            <Gift size={18} />
            <span className="text-xs font-medium">心愿池</span>
          </button>
        </div>
      </section>

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
