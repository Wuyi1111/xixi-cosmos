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

export default function TonightView({ isDark, userData, saveUserData, onNavigate }) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [flyInResult, setFlyInResult] = useState(null);
  const [showFlyInAnim, setShowFlyInAnim] = useState(false);
  const quizCardRef = useRef(null);
  const personalityData = typeof userData.personality === 'object' ? userData.personality : null;
  const personalityType = personalityData?.type || null;

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
      // 点击关闭，触发飞入动画
      setFlyInResult(unsavedResult);
      setShowQuiz(false);
      // 延迟一点等弹窗关闭后再开始飞入
      setTimeout(() => {
        setShowFlyInAnim(true);
      }, 100);
    }
  };

  // 是否有测试结果（已保存或飞入未保存）
  const hasTestResult = !!personalityData || !!flyInResult;

  // 1. 宇宙氛围开头
  const HeroSection = () => (
    <section className="text-center pt-4 pb-2">
      <h1 className={`text-4xl font-light tracking-[0.2em] ${isDark ? 'text-white' : 'text-gray-900'}`}>
        息息·宇宙
      </h1>
    </section>
  );

  // 2. 探索内宇宙测试 — 简洁卡片
  const QuizSection = () => {
    const [showDetail, setShowDetail] = useState(false);

    // 飞入动画结束后清理状态
    useEffect(() => {
      if (showFlyInAnim && flyInResult) {
        const timer = setTimeout(() => {
          setShowFlyInAnim(false);
        }, 800);
        return () => clearTimeout(timer);
      }
    }, [showFlyInAnim, flyInResult]);

    // 有飞入结果但未保存时，显示临时结果卡片
    if (flyInResult && !personalityData) {
      return (
        <section
          ref={quizCardRef}
          className={`p-6 rounded-[24px] border transition-all ${
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
          className={`p-6 rounded-[24px] cursor-pointer border transition-all hover:scale-[1.01] active:scale-95 ${
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
        className={`p-6 rounded-[24px] border transition-all ${
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
                      : (isDark ? 'bg-[#171724]/70 border-white/5' : 'bg-white border-gray-100 shadow-sm')
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

  // 4. 超新星/脉冲星 — 折叠 + 横向滑动轮播
  const SupernovaSection = () => {
    const [expanded, setExpanded] = useState(false);
    const entries = MOCK_WHISPERS;
    const total = entries.length;
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef(null);
    const isScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef(null);
    const CARD_WIDTH = 292; // 276px + 16px gap

    const scrollToRealIndex = useCallback((realIndex, smooth = true) => {
      if (!scrollRef.current) return;
      const containerWidth = scrollRef.current.offsetWidth;
      const offset = realIndex * CARD_WIDTH - (containerWidth - 276) / 2;
      scrollRef.current.scrollTo({ left: offset, behavior: smooth ? 'smooth' : 'auto' });
    }, []);

    const setActiveAndScroll = useCallback((virtualIndex) => {
      const clamped = Math.max(0, Math.min(total - 1, virtualIndex));
      setActiveIndex(clamped);
      const realIndex = total + clamped;
      scrollToRealIndex(realIndex, true);
    }, [total, scrollToRealIndex]);

    useEffect(() => {
      if (!expanded) return;
      const el = scrollRef.current;
      if (!el) return;

      const handleScroll = () => {
        if (!el) return;
        const containerWidth = el.offsetWidth;
        const scrollLeft = el.scrollLeft;
        const center = scrollLeft + containerWidth / 2;
        const realIndex = Math.round((center - containerWidth / 2 + 276 / 2) / CARD_WIDTH);

        if (realIndex < total) {
          const jumpIndex = realIndex + total;
          el.scrollTo({ left: jumpIndex * CARD_WIDTH - (containerWidth - 276) / 2, behavior: 'auto' });
          setActiveIndex(realIndex);
        } else if (realIndex >= total * 2) {
          const jumpIndex = realIndex - total;
          el.scrollTo({ left: jumpIndex * CARD_WIDTH - (containerWidth - 276) / 2, behavior: 'auto' });
          setActiveIndex(realIndex - total * 2);
        } else {
          setActiveIndex(realIndex - total);
        }

        isScrollingRef.current = true;
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
        }, 150);
      };

      // 初始居中定位到中间循环区域
      const initialRealIndex = total + 0;
      scrollToRealIndex(initialRealIndex, false);

      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        el.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      };
    }, [expanded, total, scrollToRealIndex]);

    // 构建循环数据：尾部副本 + 原始数据 + 头部副本
    const cyclicEntries = [
      ...entries.map((w, i) => ({ ...w, virtualIndex: i, key: `tail-${w.id}` })),
      ...entries.map((w, i) => ({ ...w, virtualIndex: i, key: `mid-${w.id}` })),
      ...entries.map((w, i) => ({ ...w, virtualIndex: i, key: `head-${w.id}` })),
    ];

    return (
      <section className="space-y-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-2 py-2 transition-colors rounded-xl"
        >
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            超新星 / 脉冲星
          </h3>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>星际回音精选</span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${isDark ? 'text-gray-500' : 'text-gray-400'} ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        <div className={`grid transition-all duration-500 ease-in-out ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden space-y-2">
            {/* 轮播容器 */}
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2"
              style={{ scrollBehavior: 'auto' }}
            >
              {cyclicEntries.map((whisper) => {
                const isActive = whisper.virtualIndex === activeIndex;
                return (
                  <div
                    key={whisper.key}
                    onClick={() => {
                      if (!isScrollingRef.current) {
                        setActiveAndScroll(whisper.virtualIndex);
                      }
                    }}
                    className={`shrink-0 snap-center transition-all duration-300 cursor-pointer ${
                      isActive ? 'scale-100 opacity-100' : 'scale-[0.88] opacity-50'
                    }`}
                    style={{ width: '276px' }}
                  >
                    <div
                      className={`p-5 rounded-[24px] border relative overflow-hidden h-full min-h-[160px] flex flex-col ${
                        isDark ? 'bg-[#171724]/70 border-white/5' : 'bg-white border-gray-100 shadow-sm'
                      }`}
                    >
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
              {entries.map((whisper, index) => (
                <button
                  key={whisper.id}
                  onClick={() => setActiveAndScroll(index)}
                  className={`rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? 'w-5 h-1.5 bg-amber-400'
                      : 'w-1.5 h-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  };

  // 5. 跳转引导 — 固定在底部
  const NavigationSection = () => (
    <section className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-0 right-0 z-40 px-4 max-w-md mx-auto">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('radar')}
          className={`p-4 rounded-[24px] border text-center transition-all hover:scale-[1.02] active:scale-95 ${
            isDark ? 'bg-[#171724]/90 border-white/5 hover:border-indigo-500/30 backdrop-blur-md' : 'bg-white/90 border-gray-100 shadow-sm hover:border-indigo-200 backdrop-blur-md'
          }`}
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-2 ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>
            <Radio size={20} className="text-indigo-400" />
          </div>
          <h4 className="text-sm font-medium">雷达</h4>
        </button>

        <button
          onClick={() => onNavigate('star')}
          className={`p-4 rounded-[24px] border text-center transition-all hover:scale-[1.02] active:scale-95 ${
            isDark ? 'bg-[#171724]/90 border-white/5 hover:border-pink-500/30 backdrop-blur-md' : 'bg-white/90 border-gray-100 shadow-sm hover:border-pink-200 backdrop-blur-md'
          }`}
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-2 ${isDark ? 'bg-pink-500/15' : 'bg-pink-50'}`}>
            <Gift size={20} className="text-pink-400" />
          </div>
          <h4 className="text-sm font-medium">心愿池</h4>
        </button>
      </div>
    </section>
  );

  // 应用简介
  const AppIntroSection = () => (
    <section className="text-center px-4">
      <p className={`text-xs leading-relaxed max-w-[280px] mx-auto ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        一个温柔的睡前陪伴空间，在这里记录心情、探索自我、与宇宙对话，让每一天的结束都充满仪式感
      </p>
    </section>
  );

  return (
    <div className="animate-fade-in space-y-4 pb-6">
      {/* 未测试且没有飞入结果时显示标题和简介 */}
      {!hasTestResult && (
        <>
          <HeroSection />
          <AppIntroSection />
        </>
      )}
      <QuizSection />
      <GalaxySection />
      <SupernovaSection />

      {/* 占位：给底部固定导航留出空间 */}
      <div className="h-24" />

      {showQuiz && (
        <QuizWidget
          isDark={isDark}
          onClose={() => setShowQuiz(false)}
          onComplete={handleQuizComplete}
        />
      )}

      {/* 底部固定跳转引导 */}
      <NavigationSection />
    </div>
  );
}
