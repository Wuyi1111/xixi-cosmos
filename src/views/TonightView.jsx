/**
 * TonightView.jsx — "此刻"板块（v4.36.0 测试卡片+星系入口版）
 *
 * 页面结构：
 *   1) 标题区：品牌名 + 日期问候
 *   2) 测试卡片：未测试时星空粒子背景 / 已测试时人格图标+进度环
 *   3) 星际回音：横向滑动卡片
 *   4) 底部导航：去雷达 / 去心愿池
 */

import { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronRight, Heart, Send, X, RotateCcw, Compass, Star, Wind } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import QuizWidget from '../widgets/QuizWidget.jsx';
import GalaxyMapView from '../views/GalaxyMapView.jsx';
import { MOCK_WHISPERS } from '../constants.js';

export default function TonightView({ isDark, userData, saveUserData, onNavigate }) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [showGalaxyMap, setShowGalaxyMap] = useState(false);
  const [expandedSupernova, setExpandedSupernova] = useState(false);
  const [flyInResult, setFlyInResult] = useState(null);
  const [whispers, setWhispers] = useState(MOCK_WHISPERS);
  const [huggedIds, setHuggedIds] = useState(new Set());
  const [showWriteWhisper, setShowWriteWhisper] = useState(false);
  const [whisperDraft, setWhisperDraft] = useState('');
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const personality = userData.personality;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollWhispers = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  const handleQuizComplete = (result) => {
    setFlyInResult(result);
    setTimeout(() => setFlyInResult(null), 3000);
    saveUserData({ ...userData, personality: result });
    setShowQuiz(false);
  };

  const handleHug = (id) => {
    if (huggedIds.has(id)) return;
    setHuggedIds(new Set([...huggedIds, id]));
    setWhispers((prev) =>
      prev.map((w) => (w.id === id ? { ...w, hugCount: (w.hugCount || 0) + 1 } : w))
    );
    saveUserData({
      ...userData,
      totalHugs: userData.totalHugs + 1,
      huggedWhispers: [...userData.huggedWhispers, id],
    });
  };

  const handlePostWhisper = () => {
    const text = whisperDraft.trim();
    if (!text) return;
    const newWhisper = {
      id: Date.now(),
      text,
      emotion: '心语',
      isPositive: true,
      isMine: true,
      hugCount: 0,
    };
    setWhispers([newWhisper, ...whispers]);
    setWhisperDraft('');
    setShowWriteWhisper(false);
    saveUserData({
      ...userData,
      myWhispers: [newWhisper, ...userData.myWhispers],
      dailyPosts: userData.dailyPosts + 1,
    });
  };

  // 计算探索度（基于连续天数）
  const explorationProgress = Math.min((userData.continuousDays || 0) / 30 * 100, 100);

  // 当前日期
  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[today.getDay()];

  if (showGalaxyMap) {
    return (
      <GalaxyMapView
        isDark={isDark}
        userPersonality={personality}
        onClose={() => setShowGalaxyMap(false)}
      />
    );
  }

  return (
    <div className="animate-fade-in pb-10 space-y-5">
      {/* === 1. 标题区 === */}
      <div>
        <h1 className="text-xl font-medium tracking-wide">息息·宇宙</h1>
        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {month}月{date}日 {weekDay}
        </p>
      </div>

      {/* === 2. 测试卡片 === */}
      {!personality ? (
        /* 未测试：星空粒子背景卡片 */
        <button
          onClick={() => setShowQuiz(true)}
          className={`w-full p-6 rounded-[24px] text-left relative overflow-hidden transition-all active:scale-[0.98] ${
            isDark
              ? 'bg-gradient-to-br from-indigo-900/30 to-[#171724] border border-indigo-500/20'
              : 'bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm'
          }`}
        >
          {/* 星空粒子背景（CSS 动画） */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-twinkle"
                style={{
                  width: `${Math.random() * 3 + 1}px`,
                  height: `${Math.random() * 3 + 1}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: isDark ? 'rgba(147,197,253,0.6)' : 'rgba(99,102,241,0.4)',
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${Math.random() * 2 + 2}s`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-100'}`}>
              <Sparkles size={28} className={isDark ? 'text-indigo-300' : 'text-indigo-500'} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium mb-1">探索你的睡眠人格</h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                8 道题，发现属于你的宇宙归属
              </p>
            </div>
            <ChevronRight size={20} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
          </div>
        </button>
      ) : (
        /* 已测试：人格图标 + 进度环 */
        <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
          <div className="flex items-center gap-4">
            {/* 人格图标 */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-100'}`}>
              <Sparkles size={28} className={isDark ? 'text-indigo-300' : 'text-indigo-500'} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium">{personality.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                  {personality.type}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowGalaxyMap(true)}
              className={`p-2 rounded-full transition-all active:scale-95 ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500'}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* 快捷操作 */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
            <button
              onClick={() => setShowQuiz(true)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              重新测试
            </button>
            <button
              onClick={() => setShowGalaxyMap(true)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                isDark ? 'bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              查看图谱
            </button>
          </div>
        </div>
      )}

      {/* === 3. 星际回音 === */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={16} className={isDark ? 'text-sky-400' : 'text-sky-500'} />
            <h3 className="text-sm font-medium">星际回音</h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => scrollWhispers('left')}
              className={`p-1.5 rounded-full transition-all ${canScrollLeft ? 'opacity-100' : 'opacity-30'} ${isDark ? 'bg-[#171724] text-gray-400' : 'bg-white text-gray-500 shadow-sm'}`}
            >
              <ChevronRight size={14} className="rotate-180" />
            </button>
            <button
              onClick={() => scrollWhispers('right')}
              className={`p-1.5 rounded-full transition-all ${canScrollRight ? 'opacity-100' : 'opacity-30'} ${isDark ? 'bg-[#171724] text-gray-400' : 'bg-white text-gray-500 shadow-sm'}`}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2"
          style={{ scrollPaddingLeft: '1px' }}
        >
          {whispers.map((w) => (
            <div
              key={w.id}
              className={`snap-start shrink-0 w-[260px] p-4 rounded-[20px] border transition-all ${
                isDark
                  ? 'bg-[#171724] border-white/5'
                  : 'bg-white border-gray-100 shadow-sm'
              }`}
            >
              <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {w.text}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                    {w.emotion}
                  </span>
                  {w.isMine && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-50 text-sky-600'}`}>
                      我的心语
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleHug(w.id)}
                  className={`flex items-center gap-1 text-[10px] transition-all active:scale-95 ${
                    huggedIds.has(w.id)
                      ? (isDark ? 'text-pink-400' : 'text-pink-500')
                      : (isDark ? 'text-gray-500 hover:text-pink-400' : 'text-gray-400 hover:text-pink-500')
                  }`}
                >
                  <Heart size={12} fill={huggedIds.has(w.id) ? 'currentColor' : 'none'} />
                  {w.hugCount || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === 4. 底部导航 === */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('treehole')}
          className={`p-4 rounded-2xl text-left transition-all active:scale-95 ${
            isDark
              ? 'bg-[#171724] border border-white/5 hover:border-white/10'
              : 'bg-white border border-gray-100 hover:border-gray-200 shadow-sm'
          }`}
        >
          <Compass size={18} className={isDark ? 'text-sky-400 mb-2' : 'text-sky-500 mb-2'} />
          <p className="text-xs font-medium">去雷达</p>
          <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>星海与明日</p>
        </button>
        <button
          onClick={() => onNavigate('star')}
          className={`p-4 rounded-2xl text-left transition-all active:scale-95 ${
            isDark
              ? 'bg-[#171724] border border-white/5 hover:border-white/10'
              : 'bg-white border border-gray-100 hover:border-gray-200 shadow-sm'
          }`}
        >
          <Wind size={18} className={isDark ? 'text-sky-400 mb-2' : 'text-sky-500 mb-2'} />
          <p className="text-xs font-medium">去归星</p>
          <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>伴眠与心愿</p>
        </button>
      </div>

      {/* === 写心语弹窗 === */}
      {showWriteWhisper && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`}>
            <div className={`w-full max-w-sm p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">写一条心语</h3>
                <button onClick={() => setShowWriteWhisper(false)} className="p-2 text-gray-400 hover:text-gray-200">
                  <X size={20} />
                </button>
              </div>
              <textarea
                value={whisperDraft}
                onChange={(e) => setWhisperDraft(e.target.value)}
                placeholder="今晚有什么想对宇宙说的..."
                rows={4}
                maxLength={200}
                className={`w-full p-4 rounded-2xl text-sm resize-none outline-none mb-4 ${
                  isDark
                    ? 'bg-[#1f1f2e] text-white border border-white/10 focus:border-sky-500/50'
                    : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-sky-300'
                }`}
              />
              <div className="flex items-center justify-between">
                <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {whisperDraft.length}/200
                </span>
                <button
                  onClick={handlePostWhisper}
                  disabled={!whisperDraft.trim()}
                  className="px-6 py-2.5 rounded-2xl bg-sky-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* === 测试弹窗 === */}
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
