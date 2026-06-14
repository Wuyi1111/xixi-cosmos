/**
 * StarWhispersView.jsx — "星海"板块
 *
 * 从原 TreeholeView 拆分出来的独立视图。
 * 包含：发射信号、我的心语、星际回音（心语列表 + 送出温暖）。
 */

import { useState, useEffect, useRef } from 'react';
import {
  Heart, X, BookOpen, Sparkles, Send,
  Edit3, Radio
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

  const handleGiveHug = (whisperId, e) => {
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

  return (
    <div className="animate-fade-in pb-10 space-y-5">
      {/* 左右并排：发射信号 + 我的心语入口 */}
      <div className="flex gap-3">
        {/* 左边：向深空发射信号 */}
        <div
          onClick={() => setShowEmitModal(true)}
          className={`flex-1 p-4 rounded-[20px] border cursor-pointer transition-all active:scale-[0.98] ${
            isDark ? 'bg-[#171724] border-white/5 hover:bg-[#1a1a2e]' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-pink-500/15' : 'bg-pink-100'}`}>
              <Edit3 size={20} className={isDark ? 'text-pink-300' : 'text-pink-500'} />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                {postsLeft > 0 ? '向深空发射信号' : '能量已耗尽'}
              </p>
              <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {postsLeft > 0 ? '倾诉你的心声' : '明日 00:00 恢复'}
              </p>
            </div>
          </div>
        </div>

        {/* 右边：我的心语入口 */}
        <div
          onClick={() => setShowMyWhispers(true)}
          className={`w-[80px] rounded-[20px] border cursor-pointer transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-1 ${
            isDark ? 'bg-[#171724] border-white/5 hover:bg-[#1a1a2e]' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
          }`}
        >
          <Radio size={20} className="text-pink-400" />
          <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>我的心语</span>
        </div>
      </div>

      {/* 星际回音 — 自由上下滑动 */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-pink-400" />
            <h3 className="text-sm font-medium">星际回音</h3>
          </div>
        </div>

        <div
          className="relative max-h-[420px] overflow-hidden -mx-5 px-5"
          style={{ overflowY: 'scroll' }}
        >
          <div className="py-4">
            {MOCK_WHISPERS.map((whisper) => {
              const isHugged = userData.huggedWhispers.includes(whisper.id);
              return (
                <div
                  key={whisper.id}
                  className="mb-3"
                >
                  <div
                    className={`relative p-4 rounded-[20px] border overflow-hidden ${
                      isDark ? 'bg-[#171724]/70 border-white/5' : 'bg-white border-gray-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 relative z-10">
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
                    <div className="flex justify-end mt-3 relative z-10">
                      <button
                        onClick={(e) => handleGiveHug(whisper.id, e)}
                        disabled={isHugged}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                          isHugged
                            ? (isDark ? 'bg-pink-500/20 text-pink-300 border border-pink-400/40' : 'bg-pink-100 text-pink-600 border border-pink-300')
                            : (isDark ? 'bg-white/5 text-pink-400 border border-white/10 hover:bg-white/10' : 'bg-pink-50 text-pink-500 border border-pink-100 hover:bg-pink-100')
                        }`}
                      >
                        <Heart size={12} fill={isHugged ? 'currentColor' : 'none'} />
                        <span className="text-[11px]">{isHugged ? '已温暖' : '温暖'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
