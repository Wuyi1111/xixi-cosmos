/**
 * StarWhispersView.jsx — "星海"板块（v4.47.23 交互全面重构版）
 *
 * 核心优化：
 *   - 卡片飞出带旋转+缩放，像真的扔出去一样
 *   - 下一张卡片弹性弹入，有爽感
 *   - 新卡片文字逐行淡入，有拆信仪式感
 *   - 操作简化：左滑=送温暖+滑走，右滑=跳过，底部只保留跳过+写信
 *   - 不同情绪卡片有不同微光边框
 *   - 全部浏览完有庆祝粒子雨
 *   - 修复所有触摸/动画/状态同步 bug
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart, X, BookOpen, Sparkles, Send,
  Edit3, Star, ChevronLeft, RotateCcw
} from 'lucide-react';
import Portal from '../components/Portal.jsx';
import MyWhispersView from './MyWhispersView.jsx';
import { MOCK_WHISPERS, PRESET_TAGS } from '../constants.js';

export default function StarWhispersView({
  isDark,
  userData,
  saveUserData,
  currentDateStr,
  onGiveHug,
}) {
  const isNewDay = userData.lastPostDate !== currentDateStr;
  const postsToday = isNewDay ? 0 : userData.dailyPosts;
  const postsLeft = Math.max(0, 5 - postsToday);
  const myWhispers = userData.myWhispers;

  // === 卡片滑动 state ===
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardEntering, setCardEntering] = useState(false);
  const containerRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const startTime = useRef(0);
  const rafId = useRef(null);
  const dragOffsetRef = useRef(0);
  const swipeDirRef = useRef(null);
  const isAnimatingRef = useRef(false);

  // === 弹窗 state ===
  const [showEmitModal, setShowEmitModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // === 发射心语 state ===
  const [whisperText, setWhisperText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [showToast, setShowToast] = useState(false);

  // === 我的心语 state ===
  const [showMyWhispers, setShowMyWhispers] = useState(false);

  // === 粒子效果 ===
  const [particles, setParticles] = useState([]);
  const [celebrationParticles, setCelebrationParticles] = useState([]);

  const textareaRef = useRef(null);

  const whispers = MOCK_WHISPERS;

  // 同步 isAnimating 到 ref，避免闭包问题
  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  // === 送温暖 + 发散粒子 ===
  const handleGiveHug = useCallback((whisperId, sourceX, sourceY) => {
    const huggedList = userData.huggedWhispers;
    if (huggedList.includes(whisperId)) return false;

    const hugPatch = {
      totalHugs: userData.totalHugs + 1,
      huggedWhispers: [...huggedList, whisperId],
    };

    if (onGiveHug) {
      onGiveHug(whisperId, hugPatch);
    } else {
      saveUserData({ ...userData, ...hugPatch });
    }

    // 发散粒子效果
    const centerX = sourceX || window.innerWidth / 2;
    const centerY = sourceY || window.innerHeight / 2;
    const particleCount = 20;
    const newParticles = Array.from({ length: particleCount }).map((_, i) => {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = 120 + Math.random() * 280;
      const tx = Math.cos(angle) * distance + 'px';
      const ty = Math.sin(angle) * distance + 'px';
      return {
        id: Date.now() + i,
        x: centerX,
        y: centerY,
        tx,
        ty,
        scale: 0.3 + Math.random() * 1.0,
        delay: Math.random() * 0.15,
        rotation: Math.random() * 360,
        duration: 1.2 + Math.random() * 0.6,
      };
    });

    setParticles(prev => {
      const merged = [...prev, ...newParticles];
      return merged.length > 100 ? merged.slice(-100) : merged;
    });

    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 2000);

    return true;
  }, [userData, onGiveHug, saveUserData]);

  // === 庆祝粒子雨（全部浏览完）===
  const triggerCelebration = useCallback(() => {
    const particleCount = 40;
    const newParticles = Array.from({ length: particleCount }).map((_, i) => {
      const startX = Math.random() * window.innerWidth;
      const startY = -20 - Math.random() * 100;
      const endX = startX + (Math.random() - 0.5) * 200;
      const endY = window.innerHeight + 100;
      return {
        id: Date.now() + i,
        x: startX,
        y: startY,
        endX,
        endY,
        scale: 0.3 + Math.random() * 0.7,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        color: ['#f472b6', '#fb7185', '#fbbf24', '#a78bfa', '#60a5fa'][Math.floor(Math.random() * 5)],
      };
    });

    setCelebrationParticles(newParticles);

    setTimeout(() => {
      setCelebrationParticles([]);
    }, 5000);
  }, []);

  // === 切换到下一个 ===
  const goToNext = useCallback((direction) => {
    if (isAnimatingRef.current) return;
    const isLastCard = currentIndex >= whispers.length - 1;

    setIsAnimating(true);
    setSwipeDirection(direction);
    swipeDirRef.current = direction;

    if (direction === 'left' && !isLastCard) {
      const whisper = whispers[currentIndex];
      const cardEl = containerRef.current?.querySelector('[data-current-card]');
      const rect = cardEl?.getBoundingClientRect();
      const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const centerY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      handleGiveHug(whisper.id, centerX, centerY);
    }

    // 飞出动画时间
    setTimeout(() => {
      if (!isLastCard) {
        setCurrentIndex(prev => prev + 1);
        setCardEntering(true);
        setTimeout(() => setCardEntering(false), 500);
      } else if (isLastCard && direction === 'left') {
        // 最后一张左滑也送温暖
        const whisper = whispers[currentIndex];
        if (whisper) {
          const cardEl = containerRef.current?.querySelector('[data-current-card]');
          const rect = cardEl?.getBoundingClientRect();
          const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
          const centerY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
          handleGiveHug(whisper.id, centerX, centerY);
        }
        setCurrentIndex(prev => prev + 1);
        triggerCelebration();
      } else if (isLastCard && direction === 'right') {
        setCurrentIndex(prev => prev + 1);
      }

      setSwipeDirection(null);
      swipeDirRef.current = null;
      setDragOffset(0);
      dragOffsetRef.current = 0;
      setIsAnimating(false);
    }, 300);
  }, [currentIndex, whispers, handleGiveHug, triggerCelebration]);

  // === 回到上一张 ===
  const goToPrev = useCallback(() => {
    if (isAnimatingRef.current || currentIndex <= 0) return;
    setIsAnimating(true);
    setCurrentIndex(prev => prev - 1);
    setCardEntering(true);
    setDragOffset(0);
    dragOffsetRef.current = 0;
    setSwipeDirection(null);
    swipeDirRef.current = null;
    setTimeout(() => {
      setIsAnimating(false);
      setCardEntering(false);
    }, 300);
  }, [currentIndex]);

  // === 重置浏览 ===
  const handleReset = useCallback(() => {
    if (isAnimatingRef.current) return;
    setIsAnimating(true);
    setCurrentIndex(0);
    setCardEntering(true);
    setDragOffset(0);
    dragOffsetRef.current = 0;
    setSwipeDirection(null);
    swipeDirRef.current = null;
    setTimeout(() => {
      setIsAnimating(false);
      setCardEntering(false);
    }, 300);
  }, []);

  // === RAF 更新样式 ===
  const updateCardStyle = useCallback(() => {
    const diff = dragOffsetRef.current;
    const cardEl = containerRef.current?.querySelector('[data-current-card]');
    const nextEl = containerRef.current?.querySelector('[data-next-card]');

    if (cardEl) {
      const progress = Math.min(Math.abs(diff) / (window.innerWidth * 0.4), 1);
      const scale = 1 - progress * 0.08;
      const opacity = 1 - progress * 0.6;
      const rotate = diff * 0.015;
      cardEl.style.transform = `translateX(${diff}px) rotate(${rotate}deg) scale(${scale})`;
      cardEl.style.opacity = opacity;
    }

    if (nextEl) {
      const progress = Math.min(Math.abs(diff) / (window.innerWidth * 0.4), 1);
      const translateX = 50 - progress * 50;
      const scale = 0.88 + progress * 0.12;
      const opacity = 0.3 + progress * 0.7;
      nextEl.style.transform = `translateX(${translateX}%) scale(${scale})`;
      nextEl.style.opacity = opacity;
    }
  }, []);

  const scheduleUpdate = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(updateCardStyle);
  }, [updateCardStyle]);

  // === 触摸滑动逻辑 ===
  const handleTouchStart = useCallback((e) => {
    if (isAnimatingRef.current) return;
    // 防止多点触摸问题
    if (e.touches.length > 1) return;
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    startTime.current = Date.now();
    dragOffsetRef.current = 0;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || isAnimatingRef.current) return;
    // 防止触摸时页面滚动
    e.preventDefault();
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    dragOffsetRef.current = diff;

    const newDir = diff < -40 ? 'left' : diff > 40 ? 'right' : null;
    if (newDir !== swipeDirRef.current) {
      swipeDirRef.current = newDir;
      setSwipeDirection(newDir);
    }

    setDragOffset(diff);
    scheduleUpdate();
  }, [isDragging, scheduleUpdate]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = currentX.current - startX.current;
    const elapsed = Date.now() - startTime.current;
    const velocity = Math.abs(diff) / (elapsed || 1);
    const threshold = window.innerWidth * 0.12;
    const fastSwipe = velocity > 0.6;

    if (Math.abs(diff) > threshold || fastSwipe) {
      goToNext(diff < 0 ? 'left' : 'right');
    } else {
      // 回弹
      const cardEl = containerRef.current?.querySelector('[data-current-card]');
      const nextEl = containerRef.current?.querySelector('[data-next-card]');
      if (cardEl) {
        cardEl.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease';
        cardEl.style.transform = 'translateX(0) rotate(0deg) scale(1)';
        cardEl.style.opacity = '1';
      }
      if (nextEl) {
        nextEl.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease';
        nextEl.style.transform = 'translateX(50%) scale(0.88)';
        nextEl.style.opacity = '0.3';
      }
      setTimeout(() => {
        if (cardEl) cardEl.style.transition = '';
        if (nextEl) nextEl.style.transition = '';
      }, 350);
      setDragOffset(0);
      dragOffsetRef.current = 0;
      setSwipeDirection(null);
      swipeDirRef.current = null;
    }
  }, [isDragging, goToNext]);

  // === 鼠标滑动支持 ===
  const handleMouseDown = useCallback((e) => {
    if (isAnimatingRef.current) return;
    setIsDragging(true);
    startX.current = e.clientX;
    currentX.current = e.clientX;
    startTime.current = Date.now();
    dragOffsetRef.current = 0;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || isAnimatingRef.current) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    dragOffsetRef.current = diff;

    const newDir = diff < -40 ? 'left' : diff > 40 ? 'right' : null;
    if (newDir !== swipeDirRef.current) {
      swipeDirRef.current = newDir;
      setSwipeDirection(newDir);
    }

    setDragOffset(diff);
    scheduleUpdate();
  }, [isDragging, scheduleUpdate]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = currentX.current - startX.current;
    const elapsed = Date.now() - startTime.current;
    const velocity = Math.abs(diff) / (elapsed || 1);
    const threshold = window.innerWidth * 0.12;
    const fastSwipe = velocity > 0.6;

    if (Math.abs(diff) > threshold || fastSwipe) {
      goToNext(diff < 0 ? 'left' : 'right');
    } else {
      const cardEl = containerRef.current?.querySelector('[data-current-card]');
      const nextEl = containerRef.current?.querySelector('[data-next-card]');
      if (cardEl) {
        cardEl.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease';
        cardEl.style.transform = 'translateX(0) rotate(0deg) scale(1)';
        cardEl.style.opacity = '1';
      }
      if (nextEl) {
        nextEl.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease';
        nextEl.style.transform = 'translateX(50%) scale(0.88)';
        nextEl.style.opacity = '0.3';
      }
      setTimeout(() => {
        if (cardEl) cardEl.style.transition = '';
        if (nextEl) nextEl.style.transition = '';
      }, 350);
      setDragOffset(0);
      dragOffsetRef.current = 0;
      setSwipeDirection(null);
      swipeDirRef.current = null;
    }
  }, [isDragging, goToNext]);

  // === 计算滑动进度 ===
  const getSwipeProgress = () => {
    const absOffset = Math.abs(dragOffset);
    const maxOffset = window.innerWidth * 0.4;
    return Math.min(absOffset / maxOffset, 1);
  };

  // === 当前卡片样式 ===
  const getCurrentCardStyle = () => {
    if (swipeDirection && isAnimating) {
      const flyX = swipeDirection === 'left' ? -window.innerWidth * 1.3 : window.innerWidth * 1.3;
      const rotate = swipeDirection === 'left' ? -12 : 12;
      return {
        transform: `translateX(${flyX}px) rotate(${rotate}deg) scale(0.85)`,
        opacity: 0,
        transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease',
      };
    }

    if (isDragging) {
      const progress = getSwipeProgress();
      return {
        transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.015}deg) scale(${1 - progress * 0.08})`,
        opacity: 1 - progress * 0.6,
        transition: 'none',
        willChange: 'transform, opacity',
      };
    }

    // 入场动画
    if (cardEntering) {
      return {
        transform: 'translateX(0) rotate(0deg) scale(1)',
        opacity: 1,
        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease',
        willChange: 'auto',
        zIndex: 3,
      };
    }

    return {
      transform: 'translateX(0) rotate(0deg) scale(1)',
      opacity: 1,
      transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease',
      willChange: 'auto',
      zIndex: 3,
    };
  };

  // === 下一张卡片样式 ===
  const getNextCardStyle = () => {
    if (cardEntering) {
      return {
        transform: 'translateX(0) scale(1)',
        opacity: 1,
        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s, opacity 0.5s ease 0.05s',
        willChange: 'auto',
        zIndex: 2,
      };
    }

    const progress = getSwipeProgress();
    const translateX = 50 - progress * 50;
    const scale = 0.88 + progress * 0.12;
    const opacity = 0.3 + progress * 0.7;

    return {
      transform: `translateX(${translateX}%) scale(${scale})`,
      opacity,
      transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease',
      willChange: isDragging ? 'transform, opacity' : 'auto',
      zIndex: 2,
    };
  };

  // === 视觉反馈透明度 ===
  const getFeedbackOpacity = () => {
    const progress = getSwipeProgress();
    return Math.max(0, (progress - 0.15) / 0.85);
  };

  // === 获取情绪颜色 ===
  const getEmotionColor = (emotion) => {
    const colorMap = {
      '小确幸': { border: 'border-amber-400/20', glow: 'shadow-amber-500/10', text: 'text-amber-400' },
      '治愈': { border: 'border-emerald-400/20', glow: 'shadow-emerald-500/10', text: 'text-emerald-400' },
      '温暖': { border: 'border-orange-400/20', glow: 'shadow-orange-500/10', text: 'text-orange-400' },
      '浪漫': { border: 'border-pink-400/20', glow: 'shadow-pink-500/10', text: 'text-pink-400' },
      '成就': { border: 'border-yellow-400/20', glow: 'shadow-yellow-500/10', text: 'text-yellow-400' },
      '失落': { border: 'border-slate-400/20', glow: 'shadow-slate-500/10', text: 'text-slate-400' },
      '孤独': { border: 'border-indigo-400/20', glow: 'shadow-indigo-500/10', text: 'text-indigo-400' },
      '平静': { border: 'border-cyan-400/20', glow: 'shadow-cyan-500/10', text: 'text-cyan-400' },
      '安静': { border: 'border-blue-400/20', glow: 'shadow-blue-500/10', text: 'text-blue-400' },
      '自由': { border: 'border-violet-400/20', glow: 'shadow-violet-500/10', text: 'text-violet-400' },
      '陪伴': { border: 'border-rose-400/20', glow: 'shadow-rose-500/10', text: 'text-rose-400' },
      '坚持': { border: 'border-amber-400/20', glow: 'shadow-amber-500/10', text: 'text-amber-400' },
      '感慨': { border: 'border-teal-400/20', glow: 'shadow-teal-500/10', text: 'text-teal-400' },
      '释然': { border: 'border-sky-400/20', glow: 'shadow-sky-500/10', text: 'text-sky-400' },
    };
    return colorMap[emotion] || { border: 'border-white/10', glow: 'shadow-none', text: 'text-gray-400' };
  };

  // === 发射心语 ===
  const handleEmit = () => {
    if (!whisperText.trim() || postsLeft <= 0) return;
    const newWhisper = {
      id: Date.now(),
      date: currentDateStr,
      text: whisperText.trim(),
      emotion: selectedTag || '无名星尘',
      visibility,
      isFavorite: false,
    };
    saveUserData({
      ...userData,
      dailyPosts: postsToday + 1,
      lastPostDate: currentDateStr,
      myWhispers: [newWhisper, ...myWhispers],
    });
    setWhisperText('');
    setSelectedTag('');
    setVisibility('public');
    setShowEmitModal(false);
    setShowToast(true);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [whisperText, showEmitModal]);

  const handleVisibilityChange = (v) => {
    if (v === 'private' && visibility !== 'private') {
      setShowPrivacyModal(true);
    } else {
      setVisibility(v);
    }
  };

  const confirmPrivacy = () => {
    setVisibility('private');
    setShowPrivacyModal(false);
  };

  const cancelPrivacy = () => {
    setShowPrivacyModal(false);
  };

  // === 我的心语子界面 ===
  if (showMyWhispers) {
    return (
      <MyWhispersView
        isDark={isDark}
        userData={userData}
        saveUserData={saveUserData}
        onClose={() => setShowMyWhispers(false)}
        currentDateStr={currentDateStr}
      />
    );
  }

  const currentWhisper = whispers[currentIndex];
  const nextWhisper = whispers[currentIndex + 1];
  const isHugged = currentWhisper ? userData.huggedWhispers.includes(currentWhisper.id) : false;
  const emotionColor = currentWhisper ? getEmotionColor(currentWhisper.emotion) : getEmotionColor('');
  const isAllDone = currentIndex >= whispers.length;

  return (
    <div className="animate-fade-in pb-10 relative min-h-[calc(100vh-8rem)] flex flex-col">
      {/* === 顶部栏 === */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          {currentIndex > 0 && !isAllDone && (
            <button
              onClick={goToPrev}
              disabled={isAnimating}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isDark ? 'bg-[#171724] border border-white/10 text-gray-400 hover:text-gray-200' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-700'
              } disabled:opacity-30`}
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-medium tracking-wide">星海</h1>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {isAllDone ? '探索完成' : `${Math.min(currentIndex + 1, whispers.length)} / ${whispers.length}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowMyWhispers(true)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            isDark ? 'bg-[#171724] border border-white/10 hover:bg-[#1f1f2e]' : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
          }`}
        >
          <Star size={18} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
        </button>
      </div>

      {/* === 卡片区域 === */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center"
        style={{ minHeight: '420px', touchAction: 'none', userSelect: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 滑动视觉反馈 - 左滑 收藏 */}
        {swipeDirection === 'left' && !isAllDone && (
          <div
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
            style={{ opacity: getFeedbackOpacity() }}
          >
            <div className="w-20 h-20 rounded-full bg-pink-500/20 border-2 border-pink-400/50 flex items-center justify-center mb-2 animate-breathe">
              <Heart size={40} fill="currentColor" className="text-pink-400" />
            </div>
            <p className="text-center text-pink-400 text-xs font-medium">收藏到</p>
            <p className="text-center text-pink-400 text-xs font-medium">我的温暖</p>
          </div>
        )}

        {/* 滑动视觉反馈 - 右滑 跳过 */}
        {swipeDirection === 'right' && !isAllDone && (
          <div
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
            style={{ opacity: getFeedbackOpacity() }}
          >
            <div className="w-20 h-20 rounded-full bg-gray-500/20 border-2 border-gray-400/50 flex items-center justify-center animate-breathe">
              <X size={40} className="text-gray-400" />
            </div>
            <p className="text-center text-gray-400 text-xs mt-2 font-medium">跳过</p>
          </div>
        )}

        {/* 下一张卡片（右侧露出） */}
        {nextWhisper && !isAllDone && (
          <div
            className="absolute inset-y-0 right-0 flex items-center justify-end pointer-events-none"
            data-next-card
            style={{
              ...getNextCardStyle(),
              width: '28%',
              paddingRight: '4px',
            }}
          >
            <div
              className={`w-full rounded-2xl border overflow-hidden ${
                isDark ? 'bg-[#1a1a2e] border-white/5' : 'bg-[#1e1e32] border-white/5'
              }`}
              style={{
                minHeight: '360px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              <div className="flex flex-col min-h-[360px] p-4 opacity-40">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isDark ? 'bg-white/5 text-gray-500 border-white/10' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                  {nextWhisper.emotion}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 当前卡片（中央 72%） */}
        {currentWhisper && !isAllDone && (
          <div
            className="absolute inset-y-0 flex items-center justify-center"
            style={{
              ...getCurrentCardStyle(),
              left: '14%',
              right: '14%',
            }}
            data-current-card
          >
            <div
              className={`relative w-full rounded-3xl border overflow-hidden select-none ${emotionColor.border} ${emotionColor.glow} ${
                isDark ? 'bg-[#1a1a2e]' : 'bg-[#1e1e32]'
              }`}
              style={{
                minHeight: '400px',
                boxShadow: `0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03), 0 0 60px ${emotionColor.glow.includes('amber') ? 'rgba(251,191,36,0.05)' : emotionColor.glow.includes('pink') ? 'rgba(244,114,182,0.05)' : emotionColor.glow.includes('emerald') ? 'rgba(52,211,153,0.05)' : 'rgba(99,102,241,0.03)'}`,
              }}
            >
              {/* 已收藏角标 */}
              {isHugged && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-pink-500/10 border border-pink-400/20">
                    <Star size={10} className="text-pink-400" />
                    <span className="text-[10px] text-pink-400">已收藏</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col min-h-[400px] p-6">
                {/* 头部：情绪标签 + 时间 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border ${emotionColor.border} ${emotionColor.text} bg-white/5`}>
                      {currentWhisper.emotion}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500">{currentWhisper.time}</span>
                  </div>
                </div>

                {/* 内容区域 - 逐行淡入 */}
                <div className="flex-1 flex items-center justify-center py-4">
                  <p
                    className={`text-base leading-relaxed font-light text-center text-gray-200 transition-all duration-700 ${
                      cardEntering ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                    }`}
                    style={{ transitionDelay: cardEntering ? '0ms' : '200ms' }}
                  >
                    "{currentWhisper.text}"
                  </p>
                </div>

                {/* 底部装饰线 */}
                <div className="w-full h-px my-4 bg-white/5" />

                {/* 底部信息：作者 + 温暖数 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                      <span className="text-[10px]">👤</span>
                    </div>
                    <span className="text-[11px] text-gray-400">{currentWhisper.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart size={12} className={isHugged ? 'text-pink-400' : 'text-gray-600'} fill={isHugged ? 'currentColor' : 'none'} />
                    <span className={`text-[11px] ${isHugged ? 'text-pink-400' : 'text-gray-500'}`}>
                      {currentWhisper.hugs + (isHugged ? 1 : 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 全部浏览完毕 */}
        {isAllDone && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center px-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400/20 to-pink-500/20 border border-amber-400/20 flex items-center justify-center mx-auto mb-4 animate-breathe">
                <Sparkles size={32} className="text-amber-400" />
              </div>
              <p className="text-lg text-gray-200 mb-1 font-medium">星海探索完成</p>
              <p className="text-xs text-gray-500 mb-6">你收集了 {userData.huggedWhispers.length} 份温暖</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowEmitModal(true)}
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium shadow-lg shadow-pink-500/25 active:scale-95 transition-all"
                >
                  我也写一封信
                </button>
                <button
                  onClick={handleReset}
                  className={`px-6 py-2.5 rounded-full text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-[#171724] text-gray-400 border border-white/10 hover:bg-[#1f1f2e]'
                      : 'bg-white text-gray-600 border border-gray-200 hover:shadow-md'
                  }`}
                >
                  <RotateCcw size={14} />
                  再浏览一次
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* === 底部操作区 === */}
      {!isAllDone && (
        <div className="flex items-center justify-center gap-6 mt-6 mb-4">
          {/* 跳过按钮 */}
          <button
            onClick={() => goToNext('right')}
            disabled={isAnimating}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isDark
                ? 'bg-[#171724] border border-white/10 text-gray-400 hover:bg-[#1f1f2e]'
                : 'bg-white border border-gray-200 text-gray-500 hover:shadow-md'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <X size={24} />
          </button>

          {/* 提示文字 */}
          <div className="text-center">
            <p className="text-[10px] text-gray-500">左滑收藏</p>
            <p className="text-[10px] text-gray-500">右滑跳过</p>
          </div>

          {/* 占位保持对称 */}
          <div className="w-14 h-14" />
        </div>
      )}

      {/* === 浮动写信按钮 === */}
      <button
        onClick={() => setShowEmitModal(true)}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/20 active:scale-90 transition-transform"
        style={{
          background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
        }}
      >
        <Edit3 size={20} className="text-white" />
      </button>

      {/* === 发散粒子效果 === */}
      {particles.map(p => (
        <div
          key={p.id}
          className="fixed pointer-events-none z-50"
          style={{
            left: p.x,
            top: p.y,
            animationDelay: `${p.delay}s`,
          }}
        >
          <div
            className="animate-particle-burst"
            style={{
              '--tx': p.tx,
              '--ty': p.ty,
              '--rotation': p.rotation + 'deg',
              animationDuration: `${p.duration}s`,
            }}
          >
            <Heart
              size={20}
              fill="currentColor"
              className="text-pink-500"
              style={{ transform: `scale(${p.scale})` }}
            />
          </div>
        </div>
      ))}

      {/* === 庆祝粒子雨 === */}
      {celebrationParticles.map(p => (
        <div
          key={p.id}
          className="fixed pointer-events-none z-40"
          style={{
            left: p.x,
            top: p.y,
            animationDelay: `${p.delay}s`,
          }}
        >
          <div
            className="animate-celebration-fall"
            style={{
              '--end-x': (p.endX - p.x) + 'px',
              '--end-y': (p.endY - p.y) + 'px',
              animationDuration: `${p.duration}s`,
            }}
          >
            <Star
              size={12}
              fill={p.color}
              className="text-transparent"
              style={{ transform: `scale(${p.scale})`, color: p.color }}
            />
          </div>
        </div>
      ))}

      {/* === 发射成功 Toast === */}
      {showToast && (
        <Portal>
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowToast(false)}>
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border ${isDark ? 'bg-[#171724] border-pink-500/30 shadow-lg shadow-pink-500/10' : 'bg-white border-pink-200 shadow-xl'}`} onClick={e => e.stopPropagation()}>
              <Send size={18} className={isDark ? 'text-pink-400' : 'text-pink-500'} />
              <span className={`text-sm font-medium ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>你的信号已飘向星海</span>
            </div>
          </div>
        </Portal>
      )}

      {/* === 发射心语弹窗 === */}
      {showEmitModal && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-end ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowEmitModal(false)}>
            <div className={`w-full p-6 rounded-t-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative`} style={{ maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-center mb-4">
                <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>向深空发射信号</h3>
                <button onClick={() => setShowEmitModal(false)} className={`p-1 rounded-full ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  <X size={20} />
                </button>
              </div>
              <div className="relative mb-4">
                <textarea
                  ref={textareaRef}
                  className={`w-full p-4 rounded-2xl resize-none min-h-[120px] text-sm focus:outline-none transition-all ${
                    isDark ? 'bg-[#1f1f2e] text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-pink-500/30' : 'bg-gray-50 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-pink-400/30'
                  }`}
                  placeholder="宇宙无边无际，你的心声在这里不再受限。倾诉吧..."
                  value={whisperText}
                  onChange={e => setWhisperText(e.target.value)}
                ></textarea>
                {whisperText && (
                  <div className={`absolute bottom-3 right-3 text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {whisperText.length} 字
                  </div>
                )}
              </div>
              <div className="mb-4">
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择一个波段</p>
                <div className="flex flex-wrap gap-2">
                  {[...PRESET_TAGS.positive, ...PRESET_TAGS.neutral].slice(0, 5).map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => { setWhisperText(tag + '...'); setSelectedTag(tag); }}
                      className={`text-xs px-3 py-2 rounded-full border transition-all active:scale-95 ${
                        selectedTag === tag
                          ? (isDark ? 'bg-pink-500/20 border-pink-500/50 text-pink-300' : 'bg-pink-100 border-pink-300 text-pink-700')
                          : (isDark ? 'border-gray-700 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-500 hover:border-gray-300')
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>信号可见度</span>
                <div className={`flex p-1 rounded-full ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-100'}`}>
                  <button onClick={() => handleVisibilityChange('public')} className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${visibility === 'public' ? (isDark ? 'bg-pink-500/20 text-pink-300' : 'bg-white text-pink-600 shadow-sm') : 'text-gray-400'}`}>
                    <Sparkles size={10} className="inline mr-1" />散落星海
                  </button>
                  <button onClick={() => handleVisibilityChange('private')} className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${visibility === 'private' ? (isDark ? 'bg-pink-500/20 text-pink-300' : 'bg-white text-pink-600 shadow-sm') : 'text-gray-400'}`}>
                    <BookOpen size={10} className="inline mr-1" />深空折叠
                  </button>
                </div>
              </div>
              <button
                onClick={handleEmit}
                disabled={!whisperText.trim() || postsLeft <= 0}
                className={`w-full py-3.5 rounded-2xl font-medium tracking-wider transition-all flex items-center justify-center gap-2 ${
                  whisperText.trim() && postsLeft > 0
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/25 active:scale-[0.98]'
                    : (isDark ? 'bg-[#1f1f2e] text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                }`}
              >
                <Send size={18} className={whisperText.trim() && postsLeft > 0 ? 'animate-pulse' : ''} />
                {postsLeft > 0 ? '向深空发射' : '今日星际能量已耗尽'}
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* === 隐私确认弹窗 === */}
      {showPrivacyModal && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={cancelPrivacy}>
            <div className={`w-full max-w-xs p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative text-center`} onClick={e => e.stopPropagation()}>
              <div className="mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-pink-500/10 text-pink-500">
                <BookOpen size={24} />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>深空折叠</h3>
              <p className={`text-xs mb-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择「深空折叠」后，这条信号将仅保留在你的设备上。</p>
              <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>它不会进入公开内容池，也不会被他人看到。</p>
              <div className="flex gap-3">
                <button onClick={cancelPrivacy} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-[#1f1f2e] hover:bg-[#262638] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>取消</button>
                <button onClick={confirmPrivacy} className={`flex-1 py-3 rounded-xl text-sm font-medium bg-pink-500 hover:bg-pink-600 text-white transition-colors shadow-lg shadow-pink-500/20 active:scale-95`}>确认</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
