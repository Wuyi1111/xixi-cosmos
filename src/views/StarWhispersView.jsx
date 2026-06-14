/**
 * StarWhispersView.jsx — "星海"板块（v4.47.3 积目式滑动版）
 *
 * 积目式卡片滑动：
 *   - 卡片占满屏幕中央，直接显示信纸内容
 *   - 左滑 → 下一个 + 自动"送温暖"（点赞）
 *   - 右滑 → 下一个（跳过）
 *   - 滑动时显示视觉反馈（粉色❤️ / 灰色✕）
 *   - 底部辅助按钮：❤️ 和 ✕
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart, X, BookOpen, Sparkles, Send,
  Edit3, Star
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
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' | 'right' | null
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);

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

  const [particles, setParticles] = useState([]);

  const textareaRef = useRef(null);

  const whispers = MOCK_WHISPERS;

  // === 送温暖 ===
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

    // 粒子效果
    const x = sourceX || window.innerWidth / 2;
    const y = sourceY || window.innerHeight / 2;
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      tx: (Math.random() - 0.5) * 150 + 'px',
      ty: -(Math.random() * 80 + 30) + 'px',
      scale: 0.6 + Math.random() * 0.8,
      delay: Math.random() * 0.2,
    }));
    const MAX_PARTICLES = 50;
    setParticles(prev => {
      const merged = [...prev, ...newParticles];
      return merged.length > MAX_PARTICLES ? merged.slice(-MAX_PARTICLES) : merged;
    });
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1200);

    return true;
  }, [userData, onGiveHug, saveUserData]);

  // === 切换到下一个 ===
  const goToNext = useCallback((direction) => {
    if (isAnimating || currentIndex >= whispers.length - 1) return;
    setIsAnimating(true);
    setSwipeDirection(direction);

    // 如果是左滑，自动送温暖
    if (direction === 'left') {
      const whisper = whispers[currentIndex];
      handleGiveHug(whisper.id, window.innerWidth * 0.3, window.innerHeight * 0.5);
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
      setDragOffset(0);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, currentIndex, whispers, handleGiveHug]);

  // === 触摸滑动逻辑 ===
  const handleTouchStart = useCallback((e) => {
    if (isAnimating) return;
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
  }, [isAnimating]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || isAnimating) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    setDragOffset(diff);

    // 判断滑动方向
    if (diff < -30) setSwipeDirection('left');
    else if (diff > 30) setSwipeDirection('right');
    else setSwipeDirection(null);
  }, [isDragging, isAnimating]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = currentX.current - startX.current;
    const threshold = window.innerWidth * 0.15; // 15% 屏幕宽度阈值

    if (Math.abs(diff) > threshold) {
      goToNext(diff < 0 ? 'left' : 'right');
    } else {
      // 回弹
      setDragOffset(0);
      setSwipeDirection(null);
    }
  }, [isDragging, goToNext]);

  // === 鼠标滑动支持 ===
  const handleMouseDown = useCallback((e) => {
    if (isAnimating) return;
    setIsDragging(true);
    startX.current = e.clientX;
    currentX.current = e.clientX;
  }, [isAnimating]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || isAnimating) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    setDragOffset(diff);

    if (diff < -30) setSwipeDirection('left');
    else if (diff > 30) setSwipeDirection('right');
    else setSwipeDirection(null);
  }, [isDragging, isAnimating]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = currentX.current - startX.current;
    const threshold = window.innerWidth * 0.15;

    if (Math.abs(diff) > threshold) {
      goToNext(diff < 0 ? 'left' : 'right');
    } else {
      setDragOffset(0);
      setSwipeDirection(null);
    }
  }, [isDragging, goToNext]);

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
  const isHugged = userData.huggedWhispers.includes(currentWhisper?.id);

  // 计算卡片变换
  const getCardTransform = () => {
    if (swipeDirection === 'left' && isAnimating) {
      return `translateX(-120%) rotate(-8deg)`;
    }
    if (swipeDirection === 'right' && isAnimating) {
      return `translateX(120%) rotate(8deg)`;
    }
    return `translateX(${dragOffset}px) rotate(${dragOffset * 0.03}deg)`;
  };

  // 计算视觉反馈透明度
  const getFeedbackOpacity = () => {
    const absOffset = Math.abs(dragOffset);
    const maxOffset = window.innerWidth * 0.3;
    return Math.min(absOffset / maxOffset, 1);
  };

  return (
    <div className="animate-fade-in pb-10 relative min-h-[calc(100vh-8rem)] flex flex-col">
      {/* === 顶部栏：标题 + 星匣子图标 === */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h1 className="text-xl font-medium tracking-wide">星海</h1>
          <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {currentIndex + 1} / {whispers.length}
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
        className="flex-1 relative flex items-center justify-center px-4"
        style={{ minHeight: '420px', touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {currentWhisper && (
          <>
            {/* 滑动视觉反馈 - 左滑 ❤️ */}
            {swipeDirection === 'left' && (
              <div
                className="absolute left-8 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
                style={{ opacity: getFeedbackOpacity() }}
              >
                <div className="w-16 h-16 rounded-full bg-pink-500/20 border-2 border-pink-400/50 flex items-center justify-center">
                  <Heart size={32} fill="currentColor" className="text-pink-400" />
                </div>
                <p className="text-center text-pink-400 text-xs mt-2 font-medium">送温暖</p>
              </div>
            )}

            {/* 滑动视觉反馈 - 右滑 ✕ */}
            {swipeDirection === 'right' && (
              <div
                className="absolute right-8 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
                style={{ opacity: getFeedbackOpacity() }}
              >
                <div className="w-16 h-16 rounded-full bg-gray-500/20 border-2 border-gray-400/50 flex items-center justify-center">
                  <X size={32} className="text-gray-400" />
                </div>
                <p className="text-center text-gray-400 text-xs mt-2 font-medium">跳过</p>
              </div>
            )}

            {/* 主卡片 */}
            <div
              className={`relative w-full rounded-3xl border overflow-hidden transition-all duration-300 select-none ${
                isDark ? 'bg-[#1a1a2e] border-white/5' : 'bg-[#1e1e32] border-white/5'
              }`}
              style={{
                minHeight: '400px',
                maxWidth: '360px',
                transform: getCardTransform(),
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              {/* 卡片内容 - 直接显示信纸 */}
              <div className="flex flex-col min-h-[400px] p-6">
                {/* 头部 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border ${isDark ? 'bg-white/5 text-gray-400 border-white/10' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                      {currentWhisper.emotion}
                    </span>
                  </div>
                  <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
                    未知坐标
                  </span>
                </div>

                {/* 内容区域 - 占满空间 */}
                <div className="flex-1 flex items-center justify-center py-4">
                  <p className={`text-base leading-relaxed font-light text-center ${isDark ? 'text-gray-200' : 'text-gray-200'}`}>
                    "{currentWhisper.text}"
                  </p>
                </div>

                {/* 底部装饰线 */}
                <div className={`w-full h-px my-4 ${isDark ? 'bg-white/5' : 'bg-white/5'}`} />

                {/* 底部信息 */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
                    来自深空的信
                  </span>
                  {isHugged && (
                    <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-pink-400' : 'text-pink-400'}`}>
                      <Heart size={10} fill="currentColor" /> 已温暖
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 全部浏览完毕 */}
        {currentIndex >= whispers.length - 1 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#1a1a2e] border border-white/5 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-amber-400/60" />
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>已浏览完所有信件</p>
              <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>明天会有新的信飘来</p>
            </div>
          </div>
        )}
      </div>

      {/* === 底部操作区 === */}
      <div className="flex items-center justify-center gap-6 mt-6 mb-4">
        {/* 跳过按钮 */}
        <button
          onClick={() => goToNext('right')}
          disabled={isAnimating || currentIndex >= whispers.length - 1}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            isDark
              ? 'bg-[#171724] border border-white/10 text-gray-400 hover:bg-[#1f1f2e]'
              : 'bg-white border border-gray-200 text-gray-500 hover:shadow-md'
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <X size={24} />
        </button>

        {/* 送温暖按钮 */}
        <button
          onClick={() => goToNext('left')}
          disabled={isAnimating || currentIndex >= whispers.length - 1 || isHugged}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            isHugged
              ? 'bg-pink-500/20 border-2 border-pink-400/40 text-pink-400'
              : 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40'
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <Heart size={28} fill={isHugged ? 'currentColor' : 'none'} />
        </button>
      </div>

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

      {/* === 粒子效果 === */}
      {particles.map(p => (
        <div
          key={p.id}
          className="fixed pointer-events-none z-50 animate-particle-float"
          style={{
            left: p.x,
            top: p.y,
            animationDelay: `${p.delay}s`,
            '--tx': p.tx,
            '--ty': p.ty,
          }}
        >
          <Heart size={20} fill="currentColor" className="text-pink-500" style={{ transform: `scale(${p.scale})` }} />
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
