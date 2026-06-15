/**
 * StarWhispersView.jsx — "星海"板块（v4.47.27 Tinder级卡片滑动重构版）
 *
 * 核心交互（参考 Tinder / 探探 / 积目）：
 *   - 3 层卡片堆叠：当前 + 下一张（右侧露出 18%）+ 第三张（右侧露出 8%）
 *   - 滑动时卡片跟随手指旋转（±15°）+ 缩放（0.92），像真的拿着一张纸
 *   - 滑动方向反馈：左滑浮现 ❤️ 收藏图标（随距离放大），右滑浮现 ✕ 跳过图标
 *   - 松手后卡片带惯性飞出屏幕，继续旋转缩小，有"甩出去"的物理感
 *   - 下一张卡片从后方弹性弹入中央（cubic-bezier 弹性曲线）
 *   - 新卡片文字逐行淡入，像拆开一封信
 *   - 触感反馈：滑动超过阈值时震动（设备支持时）
 *   - 不同情绪卡片有不同微光边框
 *   - 全部浏览完有庆祝粒子雨
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart, X, BookOpen, Sparkles, Send,
  Edit3, Star, ChevronLeft, RotateCcw
} from 'lucide-react';
import Portal from '../components/Portal.jsx';
import MyWhispersView from './MyWhispersView.jsx';
import { MOCK_WHISPERS, PRESET_TAGS } from '../constants.js';

// 触感反馈工具
const triggerHaptic = (type = 'light') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (type === 'light') navigator.vibrate(8);
    if (type === 'medium') navigator.vibrate(15);
    if (type === 'heavy') navigator.vibrate([20, 30, 20]);
  }
};

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
  const [textRevealed, setTextRevealed] = useState(false);
  const containerRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const startTime = useRef(0);
  const rafId = useRef(null);
  const dragOffsetRef = useRef(0);
  const swipeDirRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const hapticTriggeredRef = useRef(false);

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

  // 同步 isAnimating 到 ref
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

    triggerHaptic('medium');

    const centerX = sourceX || window.innerWidth / 2;
    const centerY = sourceY || window.innerHeight / 2;
    const particleCount = 24;
    const newParticles = Array.from({ length: particleCount }).map((_, i) => {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const distance = 100 + Math.random() * 300;
      const tx = Math.cos(angle) * distance + 'px';
      const ty = Math.sin(angle) * distance + 'px';
      return {
        id: Date.now() + i,
        x: centerX,
        y: centerY,
        tx,
        ty,
        scale: 0.3 + Math.random() * 1.2,
        delay: Math.random() * 0.2,
        rotation: Math.random() * 360,
        duration: 1.0 + Math.random() * 0.8,
      };
    });

    setParticles(prev => {
      const merged = [...prev, ...newParticles];
      return merged.length > 120 ? merged.slice(-120) : merged;
    });

    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 2000);

    return true;
  }, [userData, onGiveHug, saveUserData]);

  // === 庆祝粒子雨 ===
  const triggerCelebration = useCallback(() => {
    const particleCount = 50;
    const newParticles = Array.from({ length: particleCount }).map((_, i) => {
      const startX = Math.random() * window.innerWidth;
      const startY = -20 - Math.random() * 150;
      const endX = startX + (Math.random() - 0.5) * 250;
      const endY = window.innerHeight + 100;
      return {
        id: Date.now() + i,
        x: startX,
        y: startY,
        endX,
        endY,
        scale: 0.3 + Math.random() * 0.8,
        delay: Math.random() * 2.5,
        duration: 2 + Math.random() * 2.5,
        color: ['#f472b6', '#fb7185', '#fbbf24', '#a78bfa', '#60a5fa', '#34d399'][Math.floor(Math.random() * 6)],
      };
    });

    setCelebrationParticles(newParticles);
    setTimeout(() => setCelebrationParticles([]), 6000);
  }, []);

  // === 计算滑动参数 ===
  const getSwipeParams = () => {
    const diff = dragOffsetRef.current;
    const absDiff = Math.abs(diff);
    const maxOffset = window.innerWidth * 0.5;
    const progress = Math.min(absDiff / maxOffset, 1);
    const direction = diff < 0 ? 'left' : 'right';
    const rotate = diff * 0.03; // 旋转系数，最大约 ±15°
    const scale = 1 - progress * 0.08;
    const opacity = 1 - progress * 0.5;
    return { diff, absDiff, progress, direction, rotate, scale, opacity };
  };

  // === RAF 更新所有卡片样式 ===
  const updateCardStyles = useCallback(() => {
    const { diff, progress, rotate, scale, opacity } = getSwipeParams();

    const currentEl = containerRef.current?.querySelector('[data-card="current"]');
    const nextEl = containerRef.current?.querySelector('[data-card="next"]');
    const thirdEl = containerRef.current?.querySelector('[data-card="third"]');

    if (currentEl) {
      currentEl.style.transform = `translateX(${diff}px) rotate(${rotate}deg) scale(${scale})`;
      currentEl.style.opacity = opacity;
    }

    if (nextEl) {
      const nextScale = 0.85 + progress * 0.15;
      const nextTranslate = 25 - progress * 25;
      const nextOpacity = 0.4 + progress * 0.6;
      nextEl.style.transform = `translateX(${nextTranslate}%) scale(${nextScale})`;
      nextEl.style.opacity = nextOpacity;
    }

    if (thirdEl) {
      const thirdScale = 0.75 + progress * 0.1;
      const thirdTranslate = 40 - progress * 10;
      const thirdOpacity = 0.2 + progress * 0.3;
      thirdEl.style.transform = `translateX(${thirdTranslate}%) scale(${thirdScale})`;
      thirdEl.style.opacity = thirdOpacity;
    }
  }, []);

  const scheduleUpdate = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(updateCardStyles);
  }, [updateCardStyles]);

  // === 切换到下一个 ===
  const goToNext = useCallback((direction) => {
    if (isAnimatingRef.current) return;
    const isLastCard = currentIndex >= whispers.length - 1;

    setIsAnimating(true);
    setSwipeDirection(direction);
    swipeDirRef.current = direction;

    const flyRotate = direction === 'left' ? -20 : 20;
    const flyX = direction === 'left' ? -window.innerWidth * 1.5 : window.innerWidth * 1.5;

    // 先让当前卡片飞出
    const currentEl = containerRef.current?.querySelector('[data-card="current"]');
    if (currentEl) {
      currentEl.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease';
      currentEl.style.transform = `translateX(${flyX}px) rotate(${flyRotate}deg) scale(0.8)`;
      currentEl.style.opacity = '0';
    }

    // 下一张弹入
    const nextEl = containerRef.current?.querySelector('[data-card="next"]');
    if (nextEl) {
      nextEl.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s, opacity 0.35s ease 0.05s';
      nextEl.style.transform = 'translateX(0) scale(1)';
      nextEl.style.opacity = '1';
    }

    // 第三张递补
    const thirdEl = containerRef.current?.querySelector('[data-card="third"]');
    if (thirdEl) {
      thirdEl.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s, opacity 0.35s ease 0.1s';
      thirdEl.style.transform = 'translateX(25%) scale(0.85)';
      thirdEl.style.opacity = '0.4';
    }

    // 左滑送温暖
    if (direction === 'left') {
      const whisper = whispers[currentIndex];
      if (whisper) {
        const cardEl = containerRef.current?.querySelector('[data-card="current"]');
        const rect = cardEl?.getBoundingClientRect();
        handleGiveHug(whisper.id, rect?.left + rect?.width / 2, rect?.top + rect?.height / 2);
      }
    }

    setTimeout(() => {
      if (!isLastCard) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setCurrentIndex(prev => prev + 1);
        if (direction === 'left') triggerCelebration();
      }

      // 重置状态
      setSwipeDirection(null);
      swipeDirRef.current = null;
      setDragOffset(0);
      dragOffsetRef.current = 0;
      hapticTriggeredRef.current = false;

      // 清除 transition
      setTimeout(() => {
        [currentEl, nextEl, thirdEl].forEach(el => {
          if (el) el.style.transition = '';
        });
        setIsAnimating(false);
        setCardEntering(true);
        setTextRevealed(false);
        setTimeout(() => {
          setCardEntering(false);
          setTextRevealed(true);
        }, 500);
      }, 100);
    }, 350);
  }, [currentIndex, whispers, handleGiveHug, triggerCelebration]);

  // === 回到上一张 ===
  const goToPrev = useCallback(() => {
    if (isAnimatingRef.current || currentIndex <= 0) return;
    setIsAnimating(true);
    setCurrentIndex(prev => prev - 1);
    setCardEntering(true);
    setTextRevealed(false);
    setDragOffset(0);
    dragOffsetRef.current = 0;
    setSwipeDirection(null);
    swipeDirRef.current = null;
    hapticTriggeredRef.current = false;
    setTimeout(() => {
      setIsAnimating(false);
      setCardEntering(false);
      setTextRevealed(true);
    }, 400);
  }, [currentIndex]);

  // === 重置浏览 ===
  const handleReset = useCallback(() => {
    if (isAnimatingRef.current) return;
    setIsAnimating(true);
    setCurrentIndex(0);
    setCardEntering(true);
    setTextRevealed(false);
    setDragOffset(0);
    dragOffsetRef.current = 0;
    setSwipeDirection(null);
    swipeDirRef.current = null;
    hapticTriggeredRef.current = false;
    setTimeout(() => {
      setIsAnimating(false);
      setCardEntering(false);
      setTextRevealed(true);
    }, 400);
  }, []);

  // === 触摸滑动逻辑 ===
  const handleTouchStart = useCallback((e) => {
    if (isAnimatingRef.current) return;
    if (e.touches.length > 1) return;
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    startTime.current = Date.now();
    dragOffsetRef.current = 0;
    hapticTriggeredRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || isAnimatingRef.current) return;
    e.preventDefault();
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    dragOffsetRef.current = diff;

    const { progress, direction } = getSwipeParams();

    const newDir = diff < -30 ? 'left' : diff > 30 ? 'right' : null;
    if (newDir !== swipeDirRef.current) {
      swipeDirRef.current = newDir;
      setSwipeDirection(newDir);
    }

    // 超过阈值触发触感
    if (progress > 0.5 && !hapticTriggeredRef.current) {
      triggerHaptic('light');
      hapticTriggeredRef.current = true;
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
    const threshold = window.innerWidth * 0.1;
    const fastSwipe = velocity > 0.8;

    if (Math.abs(diff) > threshold || fastSwipe) {
      goToNext(diff < 0 ? 'left' : 'right');
    } else {
      // 回弹
      const currentEl = containerRef.current?.querySelector('[data-card="current"]');
      const nextEl = containerRef.current?.querySelector('[data-card="next"]');
      const thirdEl = containerRef.current?.querySelector('[data-card="third"]');

      if (currentEl) {
        currentEl.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
        currentEl.style.transform = 'translateX(0) rotate(0deg) scale(1)';
        currentEl.style.opacity = '1';
      }
      if (nextEl) {
        nextEl.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
        nextEl.style.transform = 'translateX(25%) scale(0.85)';
        nextEl.style.opacity = '0.4';
      }
      if (thirdEl) {
        thirdEl.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
        thirdEl.style.transform = 'translateX(40%) scale(0.75)';
        thirdEl.style.opacity = '0.2';
      }

      setTimeout(() => {
        [currentEl, nextEl, thirdEl].forEach(el => {
          if (el) el.style.transition = '';
        });
      }, 400);

      setDragOffset(0);
      dragOffsetRef.current = 0;
      setSwipeDirection(null);
      swipeDirRef.current = null;
      hapticTriggeredRef.current = false;
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
    hapticTriggeredRef.current = false;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || isAnimatingRef.current) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    dragOffsetRef.current = diff;

    const newDir = diff < -30 ? 'left' : diff > 30 ? 'right' : null;
    if (newDir !== swipeDirRef.current) {
      swipeDirRef.current = newDir;
      setSwipeDirection(newDir);
    }

    const { progress } = getSwipeParams();
    if (progress > 0.5 && !hapticTriggeredRef.current) {
      triggerHaptic('light');
      hapticTriggeredRef.current = true;
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
    const threshold = window.innerWidth * 0.1;
    const fastSwipe = velocity > 0.8;

    if (Math.abs(diff) > threshold || fastSwipe) {
      goToNext(diff < 0 ? 'left' : 'right');
    } else {
      const currentEl = containerRef.current?.querySelector('[data-card="current"]');
      const nextEl = containerRef.current?.querySelector('[data-card="next"]');
      const thirdEl = containerRef.current?.querySelector('[data-card="third"]');

      if (currentEl) {
        currentEl.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
        currentEl.style.transform = 'translateX(0) rotate(0deg) scale(1)';
        currentEl.style.opacity = '1';
      }
      if (nextEl) {
        nextEl.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
        nextEl.style.transform = 'translateX(25%) scale(0.85)';
        nextEl.style.opacity = '0.4';
      }
      if (thirdEl) {
        thirdEl.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
        thirdEl.style.transform = 'translateX(40%) scale(0.75)';
        thirdEl.style.opacity = '0.2';
      }

      setTimeout(() => {
        [currentEl, nextEl, thirdEl].forEach(el => {
          if (el) el.style.transition = '';
        });
      }, 400);

      setDragOffset(0);
      dragOffsetRef.current = 0;
      setSwipeDirection(null);
      swipeDirRef.current = null;
      hapticTriggeredRef.current = false;
    }
  }, [isDragging, goToNext]);

  // === 视觉反馈透明度 ===
  const getFeedbackOpacity = () => {
    const { progress } = getSwipeParams();
    return Math.max(0, (progress - 0.1) / 0.9);
  };

  const getFeedbackScale = () => {
    const { progress } = getSwipeParams();
    return 0.6 + progress * 0.4;
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
  const thirdWhisper = whispers[currentIndex + 2];
  const isHugged = currentWhisper ? userData.huggedWhispers.includes(currentWhisper.id) : false;
  const emotionColor = currentWhisper ? getEmotionColor(currentWhisper.emotion) : getEmotionColor('');
  const isAllDone = currentIndex >= whispers.length;

  // 卡片内容组件
  const CardContent = ({ whisper, isCurrent }) => {
    if (!whisper) return null;
    const hugged = userData.huggedWhispers.includes(whisper.id);
    const ec = getEmotionColor(whisper.emotion);
    return (
      <div className={`relative w-full rounded-3xl border overflow-hidden select-none ${ec.border} ${
        isDark ? 'bg-[#1a1a2e]' : 'bg-[#1e1e32]'
      }`}
        style={{
          minHeight: '400px',
          boxShadow: `0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)`,
        }}
      >
        {hugged && isCurrent && (
          <div className="absolute top-4 right-4 z-10">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-pink-500/10 border border-pink-400/20">
              <Star size={10} className="text-pink-400" />
              <span className="text-[10px] text-pink-400">已收藏</span>
            </div>
          </div>
        )}

        <div className="flex flex-col min-h-[400px] p-6">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-[10px] px-2.5 py-1 rounded-full border ${ec.border} ${ec.text} bg-white/5`}>
              {whisper.emotion}
            </span>
            <span className="text-[10px] text-gray-500">{whisper.time}</span>
          </div>

          <div className="flex-1 flex items-center justify-center py-4">
            <p className={`text-base leading-relaxed font-light text-center text-gray-200 transition-all duration-700 ${
              isCurrent && cardEntering ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
            }`}
              style={{ transitionDelay: isCurrent && !cardEntering ? '150ms' : '0ms' }}
            >
              "{whisper.text}"
            </p>
          </div>

          <div className="w-full h-px my-4 bg-white/5" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                <span className="text-[10px]">👤</span>
              </div>
              <span className="text-[11px] text-gray-400">{whisper.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart size={12} className={hugged ? 'text-pink-400' : 'text-gray-600'} fill={hugged ? 'currentColor' : 'none'} />
              <span className={`text-[11px] ${hugged ? 'text-pink-400' : 'text-gray-500'}`}>
                {whisper.hugs + (hugged ? 1 : 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
        style={{ minHeight: '440px', touchAction: 'none', userSelect: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 滑动视觉反馈 - 左滑 ❤️ 收藏 */}
        {swipeDirection === 'left' && !isAllDone && (
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
            style={{
              opacity: getFeedbackOpacity(),
              transform: `scale(${getFeedbackScale()})`,
            }}
          >
            <div className="w-24 h-24 rounded-full bg-pink-500/20 border-2 border-pink-400/50 flex items-center justify-center">
              <Heart size={48} fill="currentColor" className="text-pink-400" />
            </div>
          </div>
        )}

        {/* 滑动视觉反馈 - 右滑 ✕ 跳过 */}
        {swipeDirection === 'right' && !isAllDone && (
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
            style={{
              opacity: getFeedbackOpacity(),
              transform: `scale(${getFeedbackScale()})`,
            }}
          >
            <div className="w-24 h-24 rounded-full bg-gray-500/20 border-2 border-gray-400/50 flex items-center justify-center">
              <X size={48} className="text-gray-400" />
            </div>
          </div>
        )}

        {/* 第三张卡片（最底层） */}
        {thirdWhisper && !isAllDone && (
          <div
            className="absolute inset-y-0 right-0 flex items-center justify-end pointer-events-none"
            data-card="third"
            style={{
              width: '22%',
              paddingRight: '2px',
              transform: 'translateX(40%) scale(0.75)',
              opacity: 0.2,
              zIndex: 1,
            }}
          >
            <div className="w-full rounded-2xl border overflow-hidden bg-[#1a1a2e] border-white/5"
              style={{ minHeight: '360px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
            >
              <div className="flex flex-col min-h-[360px] p-4 opacity-30">
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-white/5 text-gray-500 border-white/10">
                  {thirdWhisper.emotion}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 下一张卡片（中间层） */}
        {nextWhisper && !isAllDone && (
          <div
            className="absolute inset-y-0 right-0 flex items-center justify-end pointer-events-none"
            data-card="next"
            style={{
              width: '30%',
              paddingRight: '3px',
              transform: 'translateX(25%) scale(0.85)',
              opacity: 0.4,
              zIndex: 2,
            }}
          >
            <div className="w-full rounded-2xl border overflow-hidden bg-[#1a1a2e] border-white/5"
              style={{ minHeight: '380px', boxShadow: '0 6px 30px rgba(0,0,0,0.35)' }}
            >
              <div className="flex flex-col min-h-[380px] p-4 opacity-35">
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-white/5 text-gray-500 border-white/10">
                  {nextWhisper.emotion}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 当前卡片（最上层） */}
        {currentWhisper && !isAllDone && (
          <div
            className="absolute inset-y-0 flex items-center justify-center"
            data-card="current"
            style={{
              left: '8%',
              right: '8%',
              transform: 'translateX(0) rotate(0deg) scale(1)',
              opacity: 1,
              zIndex: 3,
              willChange: isDragging ? 'transform, opacity' : 'auto',
            }}
          >
            <CardContent whisper={currentWhisper} isCurrent={true} />
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

          <div className="text-center">
            <p className="text-[10px] text-gray-500">左滑收藏</p>
            <p className="text-[10px] text-gray-500">右滑跳过</p>
          </div>

          <div className="w-14 h-14" />
        </div>
      )}

      {/* === 浮动写信按钮 === */}
      <button
        onClick={() => setShowEmitModal(true)}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/20 active:scale-90 transition-transform"
        style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)' }}
      >
        <Edit3 size={20} className="text-white" />
      </button>

      {/* === 发散粒子效果 === */}
      {particles.map(p => (
        <div key={p.id} className="fixed pointer-events-none z-50"
          style={{ left: p.x, top: p.y, animationDelay: `${p.delay}s` }}
        >
          <div className="animate-particle-burst"
            style={{
              '--tx': p.tx,
              '--ty': p.ty,
              '--rotation': p.rotation + 'deg',
              animationDuration: `${p.duration}s`,
            }}
          >
            <Heart size={20} fill="currentColor" className="text-pink-500"
              style={{ transform: `scale(${p.scale})` }}
            />
          </div>
        </div>
      ))}

      {/* === 庆祝粒子雨 === */}
      {celebrationParticles.map(p => (
        <div key={p.id} className="fixed pointer-events-none z-40"
          style={{ left: p.x, top: p.y, animationDelay: `${p.delay}s` }}
        >
          <div className="animate-celebration-fall"
            style={{
              '--end-x': (p.endX - p.x) + 'px',
              '--end-y': (p.endY - p.y) + 'px',
              animationDuration: `${p.duration}s`,
            }}
          >
            <Star size={12} fill={p.color} className="text-transparent"
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
