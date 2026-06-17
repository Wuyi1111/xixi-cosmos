/**
 * StarWhispersView.jsx — "星海"板块（v4.47.28 卡片滑动完全重写版）
 *
 * 核心交互（参考 Tinder / 探探 / 积目）：
 *   - 3 层卡片堆叠：当前 + 下一张（右侧露出）+ 第三张（更右侧露出）
 *   - 滑动时卡片跟随手指旋转（±15°）+ 缩放（0.92）
 *   - 滑动方向反馈：左滑浮现 ❤️ 收藏图标，右滑浮现 ✕ 跳过图标
 *   - 松手后卡片带惯性飞出屏幕，继续旋转缩小
 *   - 下一张卡片从后方弹性弹入中央
 *   - 新卡片文字逐行淡入
 *   - 触感反馈 + 背景模糊景深
 *
 * 技术方案：纯 React state + CSS transform，不用 RAF 直接操作 DOM
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart, X, BookOpen, Sparkles, Send,
  Edit3, Star, ChevronLeft, RotateCcw
} from 'lucide-react';
import Portal from '../components/Portal.jsx';
import MyWhispersView from './MyWhispersView.jsx';
import { MOCK_WHISPERS, PRESET_TAGS } from '../constants.js';

// 触感反馈
const haptic = (type = 'light') => {
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

  // === 滑动核心 state ===
  const [currentIndex, setCurrentIndex] = useState(0);
  const [offsetX, setOffsetX] = useState(0);          // 当前卡片水平偏移
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDir, setSwipeDir] = useState(null);     // 'left' | 'right' | null
  const [isFlying, setIsFlying] = useState(false);    // 是否正在飞出动画中
  const [cardEntering, setCardEntering] = useState(false);

  const containerRef = useRef(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const startTimeRef = useRef(0);
  const hapticDoneRef = useRef(false);

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

  // === 计算滑动参数 ===
  const getParams = (dx) => {
    const absDx = Math.abs(dx);
    const maxDx = window.innerWidth * 0.5;
    const progress = Math.min(absDx / maxDx, 1);
    const rotate = dx * 0.03; // ±15° at ±50% width
    const scale = 1 - progress * 0.08;
    const opacity = 1 - progress * 0.5;
    return { absDx, progress, rotate, scale, opacity };
  };

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

    haptic('medium');

    const cx = sourceX || window.innerWidth / 2;
    const cy = sourceY || window.innerHeight / 2;
    const newParticles = Array.from({ length: 24 }).map((_, i) => {
      const angle = (i / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const dist = 100 + Math.random() * 300;
      return {
        id: Date.now() + i,
        x: cx, y: cy,
        tx: Math.cos(angle) * dist + 'px',
        ty: Math.sin(angle) * dist + 'px',
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
    const newParticles = Array.from({ length: 50 }).map((_, i) => {
      const sx = Math.random() * window.innerWidth;
      const sy = -20 - Math.random() * 150;
      return {
        id: Date.now() + i,
        x: sx, y: sy,
        endX: sx + (Math.random() - 0.5) * 250,
        endY: window.innerHeight + 100,
        scale: 0.3 + Math.random() * 0.8,
        delay: Math.random() * 2.5,
        duration: 2 + Math.random() * 2.5,
        color: ['#f472b6', '#fb7185', '#fbbf24', '#a78bfa', '#60a5fa', '#34d399'][Math.floor(Math.random() * 6)],
      };
    });
    setCelebrationParticles(newParticles);
    setTimeout(() => setCelebrationParticles([]), 6000);
  }, []);

  // === 飞出并切换 ===
  const flyAway = useCallback((direction) => {
    if (isFlying) return;
    const isLast = currentIndex >= whispers.length - 1;

    setIsFlying(true);
    setSwipeDir(direction);

    // 左滑送温暖
    if (direction === 'left') {
      const w = whispers[currentIndex];
      if (w) {
        const rect = containerRef.current?.getBoundingClientRect();
        handleGiveHug(w.id, rect?.left + (rect?.width || 0) / 2, rect?.top + (rect?.height || 0) / 2);
      }
    }

    // 350ms 后切换索引
    setTimeout(() => {
      if (!isLast) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setCurrentIndex(prev => prev + 1);
        if (direction === 'left') triggerCelebration();
      }

      // 重置
      setOffsetX(0);
      setSwipeDir(null);
      setIsFlying(false);
      hapticDoneRef.current = false;

      // 新卡片入场动画
      setCardEntering(true);
      setTimeout(() => setCardEntering(false), 500);
    }, 350);
  }, [currentIndex, whispers, isFlying, handleGiveHug, triggerCelebration]);

  // === 回弹 ===
  const bounceBack = useCallback(() => {
    setOffsetX(0);
    setSwipeDir(null);
    hapticDoneRef.current = false;
  }, []);

  // === 触摸事件（使用 useEffect + addEventListener 以支持 passive: false）===
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let dragging = false;
    let startX = 0;
    let currentX = 0;
    let startTime = 0;
    let hapticDone = false;

    const handleStart = (e) => {
      if (isFlying || currentIndex >= whispers.length) return;
      if (e.touches.length > 1) return;
      dragging = true;
      startX = e.touches[0].clientX;
      currentX = e.touches[0].clientX;
      startTime = Date.now();
      hapticDone = false;
      setIsDragging(true);
    };

    const handleMove = (e) => {
      if (!dragging || isFlying) return;
      e.preventDefault();
      currentX = e.touches[0].clientX;
      const dx = currentX - startX;
      setOffsetX(dx);

      const { progress } = getParams(dx);
      const dir = dx < -30 ? 'left' : dx > 30 ? 'right' : null;
      setSwipeDir(dir);

      if (progress > 0.5 && !hapticDone) {
        haptic('light');
        hapticDone = true;
      }
    };

    const handleEnd = () => {
      if (!dragging) return;
      dragging = false;
      setIsDragging(false);
      const dx = currentX - startX;
      const elapsed = Date.now() - startTime;
      const velocity = Math.abs(dx) / (elapsed || 1);
      const threshold = window.innerWidth * 0.1;

      if (Math.abs(dx) > threshold || velocity > 0.8) {
        flyAway(dx < 0 ? 'left' : 'right');
      } else {
        bounceBack();
      }
    };

    el.addEventListener('touchstart', handleStart, { passive: true });
    el.addEventListener('touchmove', handleMove, { passive: false });
    el.addEventListener('touchend', handleEnd, { passive: true });
    el.addEventListener('touchcancel', handleEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleStart);
      el.removeEventListener('touchmove', handleMove);
      el.removeEventListener('touchend', handleEnd);
      el.removeEventListener('touchcancel', handleEnd);
    };
  }, [isFlying, currentIndex, whispers.length, flyAway, bounceBack]);

  // === 鼠标事件 ===
  const onMouseDown = useCallback((e) => {
    if (isFlying || currentIndex >= whispers.length) return;
    setIsDragging(true);
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;
    startTimeRef.current = Date.now();
    hapticDoneRef.current = false;
  }, [isFlying, currentIndex, whispers.length]);

  const onMouseMove = useCallback((e) => {
    if (!isDragging || isFlying) return;
    currentXRef.current = e.clientX;
    const dx = currentXRef.current - startXRef.current;
    setOffsetX(dx);

    const { progress } = getParams(dx);
    const dir = dx < -30 ? 'left' : dx > 30 ? 'right' : null;
    setSwipeDir(dir);

    if (progress > 0.5 && !hapticDoneRef.current) {
      haptic('light');
      hapticDoneRef.current = true;
    }
  }, [isDragging, isFlying]);

  const onMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const dx = currentXRef.current - startXRef.current;
    const elapsed = Date.now() - startTimeRef.current;
    const velocity = Math.abs(dx) / (elapsed || 1);
    const threshold = window.innerWidth * 0.1;

    if (Math.abs(dx) > threshold || velocity > 0.8) {
      flyAway(dx < 0 ? 'left' : 'right');
    } else {
      bounceBack();
    }
  }, [isDragging, flyAway, bounceBack]);

  // === 回到上一张 ===
  const goToPrev = useCallback(() => {
    if (isFlying || currentIndex <= 0) return;
    setIsFlying(true);
    setCurrentIndex(prev => prev - 1);
    setOffsetX(0);
    setSwipeDir(null);
    hapticDoneRef.current = false;
    setTimeout(() => {
      setIsFlying(false);
      setCardEntering(true);
      setTimeout(() => setCardEntering(false), 500);
    }, 300);
  }, [isFlying, currentIndex]);

  // === 重置 ===
  const handleReset = useCallback(() => {
    if (isFlying) return;
    setIsFlying(true);
    setCurrentIndex(0);
    setOffsetX(0);
    setSwipeDir(null);
    hapticDoneRef.current = false;
    setTimeout(() => {
      setIsFlying(false);
      setCardEntering(true);
      setTimeout(() => setCardEntering(false), 500);
    }, 300);
  }, [isFlying]);

  // === 计算当前卡片样式 ===
  const getCurrentStyle = () => {
    if (isFlying && swipeDir) {
      const flyX = swipeDir === 'left' ? -window.innerWidth * 1.5 : window.innerWidth * 1.5;
      const flyRotate = swipeDir === 'left' ? -20 : 20;
      return {
        transform: `translateX(${flyX}px) rotate(${flyRotate}deg) scale(0.8)`,
        opacity: 0,
        transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease',
        zIndex: 3,
      };
    }

    if (offsetX !== 0) {
      const { rotate, scale, opacity } = getParams(offsetX);
      return {
        transform: `translateX(${offsetX}px) rotate(${rotate}deg) scale(${scale})`,
        opacity,
        transition: 'none',
        zIndex: 3,
      };
    }

    // 初始状态或回弹后
    return {
      transform: 'translateX(0) rotate(0deg) scale(1)',
      opacity: 1,
      transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
      zIndex: 3,
    };
  };

  // === 计算下一张样式 ===
  const getNextStyle = () => {
    if (isFlying) {
      // 当前飞出，下一张弹入
      return {
        transform: 'translateX(0px) scale(1)',
        opacity: 1,
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s, opacity 0.35s ease 0.05s',
        zIndex: 2,
      };
    }

    if (offsetX !== 0) {
      const { progress } = getParams(offsetX);
      // 从右侧 60px 位置向中央移动
      const tx = 60 - progress * 60;
      return {
        transform: `translateX(${tx}px) scale(${0.85 + progress * 0.15})`,
        opacity: 0.4 + progress * 0.6,
        transition: 'none',
        zIndex: 2,
      };
    }

    return {
      transform: 'translateX(60px) scale(0.85)',
      opacity: 0.4,
      transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
      zIndex: 2,
    };
  };

  // === 计算第三张样式 ===
  const getThirdStyle = () => {
    if (isFlying) {
      return {
        transform: 'translateX(60px) scale(0.85)',
        opacity: 0.4,
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s, opacity 0.35s ease 0.1s',
        zIndex: 1,
      };
    }

    if (offsetX !== 0) {
      const { progress } = getParams(offsetX);
      // 从右侧 120px 位置向 60px 移动
      const tx = 120 - progress * 60;
      return {
        transform: `translateX(${tx}px) scale(${0.75 + progress * 0.1})`,
        opacity: 0.2 + progress * 0.3,
        transition: 'none',
        zIndex: 1,
      };
    }

    return {
      transform: 'translateX(120px) scale(0.75)',
      opacity: 0.2,
      transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
      zIndex: 1,
    };
  };

  // === 反馈图标参数 ===
  const getFeedbackProps = () => {
    const { progress } = getParams(offsetX);
    const opacity = Math.max(0, (progress - 0.1) / 0.9);
    const scale = 0.6 + progress * 0.4;
    return { opacity, scale };
  };

  // === 情绪颜色 ===
  const getEmotionColor = (emotion) => {
    const map = {
      '小确幸': 'border-amber-400/20 text-amber-400',
      '治愈': 'border-emerald-400/20 text-emerald-400',
      '温暖': 'border-orange-400/20 text-orange-400',
      '浪漫': 'border-pink-400/20 text-pink-400',
      '成就': 'border-yellow-400/20 text-yellow-400',
      '失落': 'border-slate-400/20 text-slate-400',
      '孤独': 'border-indigo-400/20 text-indigo-400',
      '平静': 'border-cyan-400/20 text-cyan-400',
      '安静': 'border-blue-400/20 text-blue-400',
      '自由': 'border-violet-400/20 text-violet-400',
      '陪伴': 'border-rose-400/20 text-rose-400',
      '坚持': 'border-amber-400/20 text-amber-400',
      '感慨': 'border-teal-400/20 text-teal-400',
      '释然': 'border-sky-400/20 text-sky-400',
    };
    return map[emotion] || 'border-white/10 text-gray-400';
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

  const currentW = whispers[currentIndex];
  const nextW = whispers[currentIndex + 1];
  const thirdW = whispers[currentIndex + 2];
  const isAllDone = currentIndex >= whispers.length;
  const feedback = getFeedbackProps();

  // 卡片内容
  const CardFace = ({ whisper, isCurrent }) => {
    if (!whisper) return null;
    const hugged = userData.huggedWhispers.includes(whisper.id);
    const ec = getEmotionColor(whisper.emotion);
    return (
      <div className={`relative w-full rounded-3xl border select-none ${ec.split(' ')[0]} ${isDark ? 'bg-[#1a1a2e]' : 'bg-white'}`}
        style={{ minHeight: '400px', boxShadow: isDark ? '0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)' : '0 12px 48px rgba(0,0,0,0.10)', touchAction: 'none' }}
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
            <span className={`text-[10px] px-2.5 py-1 rounded-full border ${ec} ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              {whisper.emotion}
            </span>
            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{whisper.time}</span>
          </div>
          <div className="flex-1 flex items-center justify-center py-4">
            <p className={`text-base leading-relaxed font-light text-center transition-all duration-700 ${
              isCurrent && cardEntering ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
            } ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
              style={{ transitionDelay: isCurrent && !cardEntering ? '150ms' : '0ms' }}
            >
              "{whisper.text}"
            </p>
          </div>
          <div className={`w-full h-px my-4 ${isDark ? 'bg-white/5' : 'bg-black/5'}`} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <span className="text-[10px]">👤</span>
              </div>
              <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{whisper.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart size={12} className={hugged ? 'text-pink-400' : (isDark ? 'text-gray-600' : 'text-gray-300')} fill={hugged ? 'currentColor' : 'none'} />
              <span className={`text-[11px] ${hugged ? 'text-pink-400' : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
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
        <div>
          <h1 className="text-xl font-medium tracking-wide">星海</h1>
          <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {isAllDone ? '探索完成' : `${Math.min(currentIndex + 1, whispers.length)} / ${whispers.length}`}
          </p>
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
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* 背景模糊层 */}
        {(isDragging || isFlying) && (
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] z-0 transition-opacity duration-300" />
        )}

        {/* 左滑反馈 ❤️ */}
        {swipeDir === 'left' && !isAllDone && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
            style={{ opacity: feedback.opacity, transform: `scale(${feedback.scale})` }}
          >
            <div className="w-24 h-24 rounded-full bg-pink-500/20 border-2 border-pink-400/50 flex items-center justify-center">
              <Heart size={48} fill="currentColor" className="text-pink-400" />
            </div>
          </div>
        )}

        {/* 右滑反馈 ✕ */}
        {swipeDir === 'right' && !isAllDone && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
            style={{ opacity: feedback.opacity, transform: `scale(${feedback.scale})` }}
          >
            <div className="w-24 h-24 rounded-full bg-gray-500/20 border-2 border-gray-400/50 flex items-center justify-center">
              <X size={48} className="text-gray-400" />
            </div>
          </div>
        )}

        {/* 第三张卡片 */}
        {thirdW && !isAllDone && (
          <div className="absolute inset-0 flex items-center justify-center px-4" style={{ ...getThirdStyle(), touchAction: 'none' }}>
            <div className="w-full max-w-sm">
              <div className={`rounded-2xl border ${isDark ? 'bg-[#1a1a2e] border-white/5' : 'bg-white border-gray-100'} opacity-40`}
                style={{ minHeight: '360px', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', touchAction: 'none' }}
              >
                <div className="p-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isDark ? 'bg-white/5 text-gray-500 border-white/10' : 'bg-black/5 text-gray-400 border-gray-200'}`}>
                    {thirdW.emotion}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 下一张卡片 */}
        {nextW && !isAllDone && (
          <div className="absolute inset-0 flex items-center justify-center px-4" style={{ ...getNextStyle(), touchAction: 'none' }}>
            <div className="w-full max-w-sm">
              <div className={`rounded-2xl border ${isDark ? 'bg-[#1a1a2e] border-white/5' : 'bg-white border-gray-100'} opacity-50`}
                style={{ minHeight: '380px', boxShadow: isDark ? '0 6px 30px rgba(0,0,0,0.35)' : '0 6px 30px rgba(0,0,0,0.08)', touchAction: 'none' }}
              >
                <div className="p-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isDark ? 'bg-white/5 text-gray-500 border-white/10' : 'bg-black/5 text-gray-400 border-gray-200'}`}>
                    {nextW.emotion}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 当前卡片 */}
        {currentW && !isAllDone && (
          <div className="absolute inset-0 flex items-center justify-center px-4" style={{ ...getCurrentStyle(), touchAction: 'none' }}>
            <div className="w-full max-w-sm" style={{ touchAction: 'none' }}>
              <CardFace whisper={currentW} isCurrent={true} />
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
              <p className={`text-lg mb-1 font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>星海探索完成</p>
              <p className={`text-xs mb-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>你收集了 {userData.huggedWhispers.length} 份温暖</p>
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
            onClick={() => flyAway('right')}
            disabled={isFlying}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isDark
                ? 'bg-[#171724] border border-white/10 text-gray-400 hover:bg-[#1f1f2e]'
                : 'bg-white border border-gray-200 text-gray-500 hover:shadow-md'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <X size={24} />
          </button>
          <div className="text-center">
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>左滑收藏</p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>右滑跳过</p>
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

      {/* === 发散粒子 === */}
      {particles.map(p => (
        <div key={p.id} className="fixed pointer-events-none z-50"
          style={{ left: p.x, top: p.y, animationDelay: `${p.delay}s` }}
        >
          <div className="animate-particle-burst"
            style={{
              '--tx': p.tx, '--ty': p.ty, '--rotation': p.rotation + 'deg',
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

      {/* === Toast === */}
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

      {/* === 发射弹窗 === */}
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
          <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowPrivacyModal(false)}>
            <div className={`w-full max-w-xs p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative text-center`} onClick={e => e.stopPropagation()}>
              <div className="mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-pink-500/10 text-pink-500">
                <BookOpen size={24} />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>深空折叠</h3>
              <p className={`text-xs mb-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择「深空折叠」后，这条信号将仅保留在你的设备上。</p>
              <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>它不会进入公开内容池，也不会被他人看到。</p>
              <div className="flex gap-3">
                <button onClick={() => setShowPrivacyModal(false)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-[#1f1f2e] hover:bg-[#262638] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>取消</button>
                <button onClick={() => { setVisibility('private'); setShowPrivacyModal(false); }} className={`flex-1 py-3 rounded-xl text-sm font-medium bg-pink-500 hover:bg-pink-600 text-white transition-colors shadow-lg shadow-pink-500/20 active:scale-95`}>确认</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
