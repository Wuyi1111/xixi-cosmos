/**
 * StarWhispersView.jsx — "星海"板块（v4.47.1 信件卡片版）
 *
 * 中央左右滑动信件卡片浏览区：
 *   - 第1封信：未拆封信封（封口微光），点击展开
 *   - 后续信：展开的信纸（可见文字）
 *   - 每张卡片右下角微小光点按钮"送温暖"
 *   - 右上角星匣子图标 → 我的心语
 *   - 右下角浮动写信按钮
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart, X, BookOpen, Sparkles, Send,
  Edit3, Star, Mail
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

  // === 信件卡片滑动 state ===
  const [currentIndex, setCurrentIndex] = useState(0);
  const [openedEnvelopes, setOpenedEnvelopes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('xixi_opened_envelopes') || '[]');
    } catch { return []; }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isExpanding, setIsExpanding] = useState(false);
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

  // 持久化已拆封信件
  useEffect(() => {
    localStorage.setItem('xixi_opened_envelopes', JSON.stringify(openedEnvelopes));
  }, [openedEnvelopes]);

  // === 滑动逻辑 ===
  const handleTouchStart = useCallback((e) => {
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    setDragOffset(diff);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = currentX.current - startX.current;
    const threshold = 60;

    if (Math.abs(diff) > threshold) {
      if (diff < 0 && currentIndex < whispers.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (diff > 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }
    setDragOffset(0);
  }, [isDragging, currentIndex, whispers.length]);

  // 鼠标滑动支持
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    startX.current = e.clientX;
    currentX.current = e.clientX;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    setDragOffset(diff);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = currentX.current - startX.current;
    const threshold = 60;

    if (Math.abs(diff) > threshold) {
      if (diff < 0 && currentIndex < whispers.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (diff > 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }
    setDragOffset(0);
  }, [isDragging, currentIndex, whispers.length]);

  // === 拆封信封 ===
  const handleOpenEnvelope = (whisperId) => {
    if (openedEnvelopes.includes(whisperId)) return;
    setIsExpanding(true);
    setTimeout(() => {
      setOpenedEnvelopes(prev => [...prev, whisperId]);
      setIsExpanding(false);
    }, 400);
  };

  // === 送温暖 ===
  const handleGiveHug = (whisperId, e) => {
    e.stopPropagation();
    const huggedList = userData.huggedWhispers;
    if (huggedList.includes(whisperId)) return;

    const hugPatch = {
      totalHugs: userData.totalHugs + 1,
      huggedWhispers: [...huggedList, whisperId],
    };

    if (onGiveHug) {
      onGiveHug(whisperId, hugPatch);
    } else {
      saveUserData({ ...userData, ...hugPatch });
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const newParticles = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: rect.left + rect.width / 2,
      y: rect.top,
      tx: (Math.random() - 0.5) * 120 + 'px',
      ty: -(Math.random() * 60 + 20) + 'px',
      scale: 0.5 + Math.random() * 0.8,
      delay: Math.random() * 0.15,
    }));
    const MAX_PARTICLES = 50;
    setParticles(prev => {
      const merged = [...prev, ...newParticles];
      return merged.length > MAX_PARTICLES ? merged.slice(-MAX_PARTICLES) : merged;
    });
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1200);
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
  const isOpened = openedEnvelopes.includes(currentWhisper.id);
  const isHugged = userData.huggedWhispers.includes(currentWhisper.id);

  return (
    <div className="animate-fade-in pb-10 relative min-h-[calc(100vh-8rem)]">
      {/* === 顶部栏：标题 + 星匣子图标 === */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h1 className="text-xl font-medium tracking-wide">星海</h1>
          <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {whispers.length} 封来自深空的信
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

      {/* === 信件卡片滑动区 === */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden select-none"
        style={{ height: '380px', touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="flex items-center h-full transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {whispers.map((whisper, index) => {
            const opened = openedEnvelopes.includes(whisper.id);
            const hugged = userData.huggedWhispers.includes(whisper.id);
            const isCurrent = index === currentIndex;
            const isAdjacent = Math.abs(index - currentIndex) === 1;

            return (
              <div
                key={whisper.id}
                className="w-full flex-shrink-0 flex items-center justify-center px-4"
                style={{
                  opacity: isCurrent ? 1 : isAdjacent ? 0.4 : 0,
                  transform: `scale(${isCurrent ? 1 : 0.88})`,
                  transition: 'opacity 0.3s, transform 0.3s',
                }}
              >
                <div
                  className={`relative w-full max-w-[300px] rounded-2xl border overflow-hidden transition-all duration-300 ${
                    isDark ? 'bg-[#1a1a2e] border-white/5' : 'bg-[#1e1e32] border-white/5'
                  }`}
                  style={{
                    minHeight: '320px',
                    boxShadow: isCurrent ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {/* 未拆封信封样式 */}
                  {!opened ? (
                    <div
                      className="flex flex-col items-center justify-center min-h-[320px] p-6 cursor-pointer active:scale-[0.98] transition-transform"
                      onClick={() => isCurrent && handleOpenEnvelope(whisper.id)}
                    >
                      {/* 信封图标 */}
                      <div className="relative mb-4">
                        <Mail size={64} className={`${isDark ? 'text-gray-600' : 'text-gray-500'} opacity-60`} strokeWidth={1} />
                        {/* 封口微光 */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className={`w-2 h-2 rounded-full ${isExpanding && isCurrent ? 'animate-ping' : 'animate-pulse'} bg-amber-400/80`}
                            style={{ boxShadow: '0 0 8px rgba(251, 191, 36, 0.5)' }}
                          />
                        </div>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>有一封信在等你</p>
                      <p className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>轻触拆封</p>
                    </div>
                  ) : (
                    /* 展开信纸样式 */
                    <div className="flex flex-col min-h-[320px] p-5">
                      {/* 信纸头部 */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isDark ? 'bg-white/5 text-gray-400 border-white/10' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                          {whisper.emotion}
                        </span>
                        <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
                          未知坐标
                        </span>
                      </div>

                      {/* 信纸内容 */}
                      <div className="flex-1 flex items-center">
                        <p className={`text-sm leading-relaxed font-light ${isDark ? 'text-gray-300' : 'text-gray-300'}`}>
                          "{whisper.text}"
                        </p>
                      </div>

                      {/* 底部装饰线 */}
                      <div className={`w-full h-px my-3 ${isDark ? 'bg-white/5' : 'bg-white/5'}`} />

                      {/* 底部：送温暖按钮 */}
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => handleGiveHug(whisper.id, e)}
                          disabled={hugged}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                            hugged
                              ? 'bg-pink-500/20 border border-pink-400/40'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <Heart size={12} fill={hugged ? 'currentColor' : 'none'} className={hugged ? 'text-pink-400' : 'text-pink-400/60'} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* === 分页指示器 === */}
      <div className="flex justify-center items-center gap-1.5 mt-4">
        {whispers.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`rounded-full transition-all ${
              index === currentIndex
                ? 'w-4 h-1.5 bg-amber-400/80'
                : 'w-1.5 h-1.5 bg-gray-600/50'
            }`}
          />
        ))}
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
