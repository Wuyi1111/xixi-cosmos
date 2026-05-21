/**
 * TreeholeView.jsx — "雷达"板块，三栏滑动：星际回音 / 发射台 / 明日。
 *
 * 三个 mode：
 *   - 'echo'     星际回音（左侧）：浏览示例心语，每张卡底部"送出温暖"
 *   - 'emit'     发射台（中间，默认）：选标签 + 写心语 + 选可见度 + 发射
 *                       下方接"我的信号" — 搜索 + 历史心语列表
 *   - 'tomorrow' 明日（右侧）：展示他人的挑战/计划，"跟随"按钮
 *
 * 三个栏可以手指**横向滑动切换**，也可以继续点击顶部按钮。
 *
 * 改什么：
 *   - 改"星际回音"展示的示例心语 → src/constants.js 的 MOCK_WHISPERS
 *   - 改发射台的预设波段标签 → src/constants.js 的 PRESET_TAGS
 *   - 改每日发射上限（默认 5 次）→ 这里 postsLeft 那行的 5
 *   - 改"明日"tab 的挑战条目 → src/constants.js 的 TOMORROW_SUGGESTIONS
 *   - 调整手势滑动灵敏度（默认 20% 容器宽即触发切换）→ SWIPE_THRESHOLD_RATIO
 *   - 改边界阻尼 / 拖动反馈曲线 → onTouchMove 里的 0.3 系数
 *
 * 注意：当前没有后端，"散落星海"和"深空折叠"两个可见度选项目前只是 UI 标签，
 *      心语全都只保存在本地。要做真"匿名公开"得自己加后端。
 */

import { useState, useEffect, useRef } from 'react';
import { Radio, Heart, Search, X, Star, ChevronDown, Trash2, Send, AlertTriangle, CheckCircle2, BookOpen, Radar, Sparkles, Compass, RefreshCw, Plus, Flame, TrendingUp, RotateCcw } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import { MOCK_WHISPERS, PRESET_TAGS, TOMORROW_SUGGESTIONS } from '../constants.js';

const MODES = ['echo', 'emit', 'tomorrow'];
const MODE_LABELS = { echo: '星际回音', emit: '发射台', tomorrow: '明日' };
const SWIPE_THRESHOLD_RATIO = 0.2;

export default function TreeholeView({
  isDark,
  userData,
  saveUserData,
  currentDateStr,
  onGiveHug,
  onFollow,
}) {
  const [mode, setMode] = useState('emit');
  const [whisperText, setWhisperText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [particles, setParticles] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWhisperId, setExpandedWhisperId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // 明日板块 state（必须从组件顶层调用，不能放在 renderTomorrow 内部）
  const [displayedSuggestions, setDisplayedSuggestions] = useState(() =>
    TOMORROW_SUGGESTIONS.map(s => ({ ...s, _instanceId: Math.random().toString(36).slice(2) }))
  );
  const [customText, setCustomText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // 热度排行数据缓存，避免每次渲染重新计算导致页面跳动
  const hotChallengesRef = useRef([]);
  const lastFollowCountRef = useRef('');

  // 只在组件挂载时计算一次热度排行
  useEffect(() => {
    const allForHot = [
      ...TOMORROW_SUGGESTIONS.map(s => ({ ...s, followCount: Math.floor(Math.random() * 50) + 10 })),
    ];
    const hot = [...allForHot].sort((a, b) => b.followCount - a.followCount).slice(0, 3);
    hotChallengesRef.current = hot;
    lastFollowCountRef.current = hot.map(h => h.id + ':' + h.followCount).join(',');
  }, []);

  const textareaRef = useRef(null);

  const isNewDay = userData.lastPostDate !== currentDateStr;
  const postsToday = isNewDay ? 0 : (userData.dailyPosts || 0);
  const postsLeft = Math.max(0, 5 - postsToday);

  const myWhispers = userData.myWhispers || [];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [whisperText, mode]);

  // === 横向手势滑动 ===
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragX, setDragX] = useState(0);
  const dragging = useRef(false);
  const swipeStart = useRef({ x: 0, y: 0, direction: null });

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => setContainerWidth(containerRef.current?.offsetWidth || 0);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const modeIndex = MODES.indexOf(mode);

  const onPagesTouchStart = (e) => {
    swipeStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      direction: null,
    };
    dragging.current = true;
  };
  const onPagesTouchMove = (e) => {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - swipeStart.current.x;
    const dy = e.touches[0].clientY - swipeStart.current.y;

    if (swipeStart.current.direction === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        swipeStart.current.direction = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      }
    }

    if (swipeStart.current.direction === 'h') {
      let constrained = dx;
      if (modeIndex === 0 && dx > 0) constrained = dx * 0.3;
      if (modeIndex === MODES.length - 1 && dx < 0) constrained = dx * 0.3;
      setDragX(constrained);
    }
  };
  const onPagesTouchEnd = () => {
    if (swipeStart.current.direction === 'h' && containerWidth > 0) {
      const threshold = containerWidth * SWIPE_THRESHOLD_RATIO;
      let newIndex = modeIndex;
      if (dragX < -threshold && modeIndex < MODES.length - 1) newIndex = modeIndex + 1;
      else if (dragX > threshold && modeIndex > 0) newIndex = modeIndex - 1;
      if (newIndex !== modeIndex) setMode(MODES[newIndex]);
    }
    setDragX(0);
    dragging.current = false;
    swipeStart.current.direction = null;
  };

  // === 业务逻辑 ===
  const handleGiveHug = (whisperId, e) => {
    const huggedList = userData.huggedWhispers || [];
    if (huggedList.includes(whisperId)) return;

    saveUserData({
      ...userData,
      totalHugs: (userData.totalHugs || 0) + 1,
      huggedWhispers: [...huggedList, whisperId],
    });

    if (onGiveHug) onGiveHug(whisperId);

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
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1200);
  };

  const handleEmit = () => {
    if (!whisperText || postsLeft <= 0) return;
    const newWhisper = {
      id: Date.now(),
      date: currentDateStr,
      text: whisperText,
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
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const toggleFavoriteWhisper = (id, e) => {
    e.stopPropagation();
    const newList = myWhispers.map(log => log.id === id ? { ...log, isFavorite: !log.isFavorite } : log);
    saveUserData({ ...userData, myWhispers: newList });
  };

  const confirmDeleteWhisper = () => {
    saveUserData({ ...userData, myWhispers: myWhispers.filter(log => log.id !== deleteConfirmId) });
    setDeleteConfirmId(null);
  };

  const filteredWhispers = myWhispers.filter(w =>
    w.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.emotion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVisibilityChange = (v) => {
    if (v === 'private') {
      setShowPrivacyModal(true);
    }
    setVisibility(v);
  };

  const handleFollow = (suggestionId) => {
    const followedList = userData.followedSuggestions || [];
    if (followedList.includes(suggestionId)) return;

    saveUserData({
      ...userData,
      totalFollows: (userData.totalFollows || 0) + 1,
      followedSuggestions: [...followedList, suggestionId],
    });

    if (onFollow) onFollow(suggestionId);
  };

  const handleUnfollow = (suggestionId) => {
    const followedList = userData.followedSuggestions || [];
    if (!followedList.includes(suggestionId)) return;

    saveUserData({
      ...userData,
      totalFollows: Math.max(0, (userData.totalFollows || 0) - 1),
      followedSuggestions: followedList.filter(id => id !== suggestionId),
    });
  };

  // === 三个页面内容 ===
  const renderEcho = () => (
    <div className="space-y-6">
      {MOCK_WHISPERS.map((whisper) => {
        const isHugged = (userData.huggedWhispers || []).includes(whisper.id);
        return (
          <div
            key={whisper.id}
            className={`p-6 rounded-[28px] ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#171724] border-white/5' : 'bg-gradient-to-br from-indigo-50/50 to-white border-indigo-50'} border shadow-sm relative overflow-hidden`}
          >
            <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-3xl opacity-50 ${whisper.isPositive ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}></div>
            <div className={`absolute -bottom-10 -left-4 w-16 h-16 rounded-full blur-2xl opacity-30 ${whisper.isPositive ? 'bg-pink-500/10' : 'bg-indigo-500/10'}`}></div>

            <div className="flex items-center gap-2 mb-5 relative z-10">
              <span className={`text-[10px] px-2.5 py-1 rounded-md border ${isDark ? 'bg-white/[0.03] text-gray-300 border-white/10' : 'bg-white text-gray-600 border-gray-100'}`}>
                {whisper.emotion}
              </span>
              <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <Radio size={10} /> 未知坐标
              </span>
            </div>

            <p className={`text-sm leading-relaxed mb-6 font-light relative z-10 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              "{whisper.text}"
            </p>

            <div className="flex justify-end relative z-10">
              <button
                onClick={(e) => handleGiveHug(whisper.id, e)}
                disabled={isHugged}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 active:scale-95 ${
                  isHugged
                    ? (isDark
                        ? 'bg-pink-500/25 text-pink-300 border border-pink-400/60 shadow-[0_0_20px_rgba(236,72,153,0.35)]'
                        : 'bg-pink-100 text-pink-600 border border-pink-300 shadow-[0_0_18px_rgba(236,72,153,0.25)]')
                    : (isDark
                        ? 'bg-white/5 hover:bg-white/10 text-pink-400 border border-white/5 hover:border-pink-500/30'
                        : 'bg-pink-50 hover:bg-pink-100 text-pink-500 border border-pink-100')
                }`}
              >
                <Heart
                  size={16}
                  fill={isHugged ? 'currentColor' : 'none'}
                  strokeWidth={isHugged ? 2.5 : 2}
                  className={`transition-transform duration-300 ${isHugged ? 'scale-110' : 'scale-100'}`}
                />
                <span className="text-xs">{isHugged ? '已送出温暖' : '送出温暖'}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderEmit = () => (
    <div className="space-y-6">
      {/* 雷达示意图区 — 优化版 */}
      <div className={`p-6 rounded-[28px] relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] via-[#171724] to-[#1a1a24] border border-indigo-500/15' : 'bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 border border-indigo-100'}`}>
        <div className="absolute -top-12 -right-8 w-40 h-40 rounded-full bg-indigo-300/15 blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-10 -left-8 w-32 h-32 rounded-full bg-purple-300/10 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 relative ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-100'}`}>
            <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-200/30'} animate-ping`} style={{ animationDuration: '3s' }}></div>
            <Radar size={28} className={isDark ? 'text-indigo-300' : 'text-indigo-500'} />
          </div>
          <h2 className="text-xl font-light mb-2 tracking-wide">信号雷达</h2>
          <p className={`text-xs leading-relaxed max-w-[240px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            左右滑动探索星际回音与明日<br/>
            在这里发送你的心声信号
          </p>
        </div>
      </div>

      {/* 波段选择 — 优化版 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Compass size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
          <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>为你的信号选择一个波段</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[...PRESET_TAGS.positive, ...PRESET_TAGS.neutral].slice(0, 5).map((tag, i) => (
            <button
              key={i}
              onClick={() => {
                setWhisperText(tag + '...');
                setSelectedTag(tag);
              }}
              className={`text-xs px-3.5 py-2 rounded-full border transition-all active:scale-95 ${
                selectedTag === tag
                ? (isDark ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]' : 'bg-indigo-100 border-indigo-300 text-indigo-700 shadow-sm')
                : (isDark ? 'border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50')
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 输入框 — 优化版 */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          className={`w-full p-5 rounded-[24px] resize-none min-h-[140px] text-sm focus:outline-none transition-all duration-300 ${
            isDark
              ? 'bg-[#171724] text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500/30 focus:bg-[#1a1a2e]'
              : 'bg-white shadow-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-400/30 focus:shadow-md'
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

      {/* 可见度 — 优化版 */}
      <div className="flex justify-between items-center px-1">
        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>信号可见度</span>
        <div className={`flex p-1 rounded-full ${isDark ? 'bg-[#171724]' : 'bg-gray-100'}`}>
          <button
            onClick={() => handleVisibilityChange('public')}
            className={`px-3.5 py-1.5 rounded-full text-[10px] font-medium transition-all ${visibility === 'public' ? (isDark ? 'bg-indigo-500/20 text-indigo-300 shadow-sm' : 'bg-white text-indigo-600 shadow-sm') : 'text-gray-400 hover:text-gray-300'}`}
          >
            <Sparkles size={10} className="inline mr-1" />
            散落星海
          </button>
          <button
            onClick={() => handleVisibilityChange('private')}
            className={`px-3.5 py-1.5 rounded-full text-[10px] font-medium transition-all ${visibility === 'private' ? (isDark ? 'bg-indigo-500/20 text-indigo-300 shadow-sm' : 'bg-white text-indigo-600 shadow-sm') : 'text-gray-400 hover:text-gray-300'}`}
          >
            <BookOpen size={10} className="inline mr-1" />
            深空折叠
          </button>
        </div>
      </div>

      {/* 发射按钮 — 优化版 */}
      <div className="space-y-2">
        <button
          onClick={handleEmit}
          disabled={!whisperText || postsLeft <= 0}
          className={`w-full py-4 rounded-2xl font-medium tracking-wider transition-all flex items-center justify-center gap-2 ${
            whisperText && postsLeft > 0
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/25 active:scale-[0.98]'
              : (isDark ? 'bg-[#1f1f2e] text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
          }`}
        >
          <Send size={18} className={whisperText && postsLeft > 0 ? 'animate-pulse' : ''} />
          {postsLeft > 0 ? '向深空发射' : '今日星际能量已耗尽'}
        </button>
        <div className="flex items-center justify-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${postsLeft > 0 ? 'bg-emerald-400' : 'bg-gray-300'}`}></div>
          <p className="text-center text-[10px] text-gray-500">
            {postsLeft > 0 ? `今日还可发射 ${postsLeft} 次信号` : '明日 00:00 信号能量自动恢复'}
          </p>
        </div>
      </div>

      {/* === 我的信号 列表 — 优化版 === */}
      <div className={`pt-6 mt-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Radio size={14} className="text-indigo-400" />
            我的信号
          </h3>
          <span className={`text-[10px] px-2 py-1 rounded-full ${isDark ? 'bg-[#1f1f2e] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
            {myWhispers.length} 条
          </span>
        </div>

        <div className={`flex items-center px-4 py-3 rounded-2xl mb-4 border transition-all ${isDark ? 'bg-[#171724] border-white/5 focus-within:border-indigo-500/30' : 'bg-white shadow-sm border-gray-100 focus-within:border-indigo-200 focus-within:shadow-md'}`}>
          <Search size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
          <input
            type="text"
            placeholder="搜索我的心语轨迹..."
            className={`flex-1 ml-3 bg-transparent text-sm outline-none ${isDark ? 'text-gray-200 placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'}`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={`p-1 rounded-full transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="space-y-3">
          {filteredWhispers.length === 0 ? (
            <div className={`py-12 text-center flex flex-col items-center gap-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'}`}>
                <Radio size={24} className="opacity-40" />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">{searchQuery ? '在广袤宇宙中未寻得该信号' : '暂未发射过任何信号'}</p>
                {!searchQuery && (
                  <p className="text-[10px] opacity-60">写下你的心声，让它在宇宙中漂流</p>
                )}
              </div>
            </div>
          ) : (
            filteredWhispers.map(whisper => {
              const isExpanded = expandedWhisperId === whisper.id;
              return (
                <div
                  key={whisper.id}
                  onClick={() => setExpandedWhisperId(isExpanded ? null : whisper.id)}
                  className={`rounded-[24px] transition-all duration-300 border cursor-pointer ${
                    isExpanded ? (isDark ? 'bg-[#1f1f2e] border-indigo-500/30 shadow-lg shadow-indigo-500/5' : 'bg-white border-indigo-200 shadow-md')
                               : (isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]' : 'bg-white/60 border-white/50 hover:bg-white shadow-sm')
                  } active:scale-[0.98]`}
                >
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex flex-col gap-1.5 overflow-hidden pr-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-sm ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                          {whisper.emotion}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border ${whisper.visibility === 'private' ? (isDark ? 'bg-gray-800/50 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200') : (isDark ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-500 border-indigo-100')}`}>
                          {whisper.visibility === 'private' ? '深空折叠' : '散落星海'}
                        </span>
                        <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{whisper.date}</span>
                      </div>
                      {!isExpanded && (
                        <span className={`text-sm truncate font-light ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {whisper.text}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button onClick={(e) => toggleFavoriteWhisper(whisper.id, e)} className="p-1 hover:scale-110 transition-transform">
                        <Star size={16} className={`${whisper.isFavorite ? 'text-yellow-400 fill-yellow-400' : (isDark ? 'text-gray-600' : 'text-gray-300')} transition-colors`} />
                      </button>
                      <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                      </div>
                    </div>
                  </div>

                  <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 space-y-4 pt-1 border-t border-white/5">
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-black/20' : 'bg-gray-50/80'}`}>
                          <p className={`text-sm font-light leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            {whisper.text}
                          </p>
                        </div>
                        <div className="flex justify-end items-center gap-4 pt-2">
                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(whisper.id); }} className={`flex items-center gap-1 text-[10px] hover:text-red-400 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <Trash2 size={12} /> 消散
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const renderTomorrow = () => {
    const followedList = userData.followedSuggestions || [];

    // 用户发布的自定义挑战
    const userChallenges = userData.userChallenges || [];

    // 已跟随的任务列表（包含完成状态）
    const myTasks = userData.myTomorrowTasks || [];

    // 过滤出今天跟随的任务
    const todayTasks = myTasks.filter(t => t.date === currentDateStr);
    const completedTasks = todayTasks.filter(t => t.completed);
    const progressPercent = todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0;

    // 热度排行：使用缓存的数据，避免每次渲染重新计算导致页面跳动
    const hotChallenges = hotChallengesRef.current;

    const handleRefreshOne = (instanceId) => {
      // 只替换当前这一条为另一条随机推荐
      const available = TOMORROW_SUGGESTIONS.filter(s => !displayedSuggestions.find(d => d.id === s.id && d._instanceId !== instanceId));
      const pool = available.length > 0 ? available : TOMORROW_SUGGESTIONS;
      const random = pool[Math.floor(Math.random() * pool.length)];
      setDisplayedSuggestions(prev =>
        prev.map(d => d._instanceId === instanceId ? { ...random, _instanceId: instanceId } : d)
      );
    };

    const handlePublishCustom = () => {
      if (!customText.trim()) return;
      const newChallenge = {
        id: `user_${Date.now()}`,
        emoji: '✨',
        main: customText.trim(),
        sub: '来自你的明日约定',
        source: 'user',
        followers: [],
        date: currentDateStr,
      };
      saveUserData({
        ...userData,
        userChallenges: [newChallenge, ...userChallenges],
      });
      setCustomText('');
      setShowCustomInput(false);
    };

    const handleFollowTask = (challenge) => {
      const isSystem = !challenge.id.startsWith('user_');
      const taskId = challenge.id;

      // 检查是否已经跟随
      if (todayTasks.find(t => t.taskId === taskId)) return;

      // 添加到已跟随列表
      const newTask = {
        taskId,
        date: currentDateStr,
        completed: false,
        emoji: challenge.emoji,
        main: challenge.main,
        sub: challenge.sub,
        source: isSystem ? 'system' : 'user',
      };

      if (isSystem) {
        const newFollowedList = [...followedList, taskId];
        saveUserData({
          ...userData,
          totalFollows: (userData.totalFollows || 0) + 1,
          followedSuggestions: newFollowedList,
          myTomorrowTasks: [...myTasks, newTask],
        });
      } else {
        const newChallenges = userChallenges.map(c => {
          if (c.id === taskId) {
            const followers = c.followers || [];
            if (followers.includes(userData.id)) return c;
            return { ...c, followers: [...followers, userData.id] };
          }
          return c;
        });
        saveUserData({
          ...userData,
          totalFollows: (userData.totalFollows || 0) + 1,
          userChallenges: newChallenges,
          myTomorrowTasks: [...myTasks, newTask],
        });
      }

      if (onFollow) onFollow(taskId);
    };

    const handleToggleComplete = (taskId) => {
      const newTasks = myTasks.map(t => {
        if (t.taskId === taskId && t.date === currentDateStr) {
          return { ...t, completed: !t.completed };
        }
        return t;
      });
      saveUserData({
        ...userData,
        myTomorrowTasks: newTasks,
      });
    };

    const handleUnfollowTask = (taskId) => {
      const newTasks = myTasks.filter(t => !(t.taskId === taskId && t.date === currentDateStr));
      const isUserChallenge = taskId.startsWith('user_');

      if (isUserChallenge) {
        const newChallenges = userChallenges.map(c => {
          if (c.id === taskId) {
            return { ...c, followers: (c.followers || []).filter(id => id !== userData.id) };
          }
          return c;
        });
        saveUserData({
          ...userData,
          totalFollows: Math.max(0, (userData.totalFollows || 0) - 1),
          userChallenges: newChallenges,
          myTomorrowTasks: newTasks,
        });
      } else {
        saveUserData({
          ...userData,
          totalFollows: Math.max(0, (userData.totalFollows || 0) - 1),
          followedSuggestions: followedList.filter(id => id !== taskId),
          myTomorrowTasks: newTasks,
        });
      }
    };

    const isFollowed = (challengeId) => {
      return todayTasks.some(t => t.taskId === challengeId);
    };

    return (
      <div className="space-y-6">
        {/* 头部卡片 + 进度条 */}
        <div className={`p-6 rounded-[28px] relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1a1a24] to-[#171724] border border-emerald-500/15' : 'bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-100'}`}>
          <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full bg-amber-300/15 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-8 -left-6 w-24 h-24 rounded-full bg-emerald-300/15 blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                <span className="text-base">🌅</span>
              </div>
              <p className={`text-[10px] tracking-[0.2em] ${isDark ? 'text-emerald-300' : 'text-emerald-500'}`}>TOMORROW</p>
            </div>

            <h2 className="text-xl font-light mb-2 tracking-wide">明日</h2>
            <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              定下一个温柔约定，或跟随一颗别人的光点。
            </p>

            {/* 进度条 */}
            {todayTasks.length > 0 && (
              <div className={`p-3 rounded-xl ${isDark ? 'bg-[#1f1f2e]/60' : 'bg-white/60'}`}>
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    今日进度 {completedTasks.length}/{todayTasks.length}
                  </span>
                  <span className={isDark ? 'text-emerald-300' : 'text-emerald-600'}>
                    {progressPercent}%
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#0f0f1a]' : 'bg-gray-100'}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      progressPercent === 100
                        ? 'bg-gradient-to-r from-emerald-400 to-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 我的今日任务 */}
        {todayTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <CheckCircle2 size={14} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
              <h3 className="text-sm font-medium">我的今日约定</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
                {completedTasks.length}/{todayTasks.length}
              </span>
            </div>
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div
                  key={task.taskId}
                  className={`p-4 rounded-[20px] border transition-all ${
                    task.completed
                      ? (isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/30 border-emerald-200/50')
                      : (isDark ? 'bg-[#171724] border-white/5' : 'bg-white border-gray-100 shadow-sm')
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'} shadow-sm`}>
                      {task.completed ? '✅' : task.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.completed ? (isDark ? 'text-emerald-300 line-through opacity-60' : 'text-emerald-600 line-through opacity-60') : (isDark ? 'text-gray-100' : 'text-gray-800')}`}>
                        {task.main}
                      </p>
                      <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {task.sub}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleComplete(task.taskId)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all active:scale-95 ${
                          task.completed
                            ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-600 border border-emerald-200')
                            : (isDark ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100')
                        }`}
                      >
                        {task.completed ? '已完成' : '未完成'}
                      </button>
                      <button
                        onClick={() => handleUnfollowTask(task.taskId)}
                        className={`p-1.5 rounded-full transition-colors ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 热度排行 */}
        {hotChallenges.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <TrendingUp size={14} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
              <h3 className="text-sm font-medium">热度排行</h3>
            </div>
            <div className="space-y-3">
              {hotChallenges.map((challenge, index) => {
                const followed = isFollowed(challenge.id);
                return (
                  <div
                    key={challenge.id}
                    className={`p-4 rounded-[20px] border transition-all ${
                      index === 0
                        ? (isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50/50 border-amber-200/50')
                        : (isDark ? 'bg-[#171724] border-white/5' : 'bg-white border-gray-100 shadow-sm')
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'}`}>
                        {index === 0 ? '🔥' : challenge.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                            {challenge.main}
                          </p>
                          {index === 0 && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-600'}`}>
                              最热
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {challenge.followCount} 人跟随
                        </p>
                      </div>
                      <button
                        onClick={() => followed ? null : handleFollowTask(challenge)}
                        disabled={followed}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all active:scale-95 ${
                          followed
                            ? (isDark ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200')
                            : (isDark ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100')
                        }`}
                      >
                        <CheckCircle2 size={10} />
                        {followed ? '已跟随' : '跟随'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 发现更多 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Compass size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
              <h3 className="text-sm font-medium">发现更多</h3>
            </div>
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all active:scale-95 ${
                showCustomInput
                  ? (isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600')
                  : (isDark ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100')
              }`}
            >
              <Plus size={12} />
              发布我的
            </button>
          </div>

          {/* 自定义输入 */}
          {showCustomInput && (
            <div className={`p-4 rounded-[20px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}>
              <textarea
                className={`w-full p-3 rounded-xl resize-none text-sm focus:outline-none transition-all ${
                  isDark
                    ? 'bg-[#1f1f2e] text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500/30'
                    : 'bg-gray-50 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-400/30'
                }`}
                rows={2}
                placeholder="写下你明天想做的一件小事..."
                value={customText}
                onChange={e => setCustomText(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handlePublishCustom}
                  disabled={!customText.trim()}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all active:scale-95 ${
                    customText.trim()
                      ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : (isDark ? 'bg-[#1f1f2e] text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                  }`}
                >
                  发布出去
                </button>
              </div>
            </div>
          )}

          {/* 挑战列表（带单独刷新） */}
          <div className="space-y-3">
            {displayedSuggestions.map((suggestion) => {
              const followed = isFollowed(suggestion.id);
              return (
                <div
                  key={suggestion._instanceId}
                  className={`p-4 rounded-[20px] transition-all ${
                    followed
                      ? (isDark ? 'bg-[#13131a]/60 border border-emerald-500/20' : 'bg-emerald-50/50 border border-emerald-200/50')
                      : (isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100 shadow-sm')
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'} shadow-sm`}>
                      {suggestion.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                        {suggestion.main}
                      </p>
                      <p className={`text-[11px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {suggestion.sub}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRefreshOne(suggestion._instanceId)}
                        className={`p-1.5 rounded-full transition-all active:scale-90 ${isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
                        title="换一条"
                      >
                        <RotateCcw size={12} />
                      </button>
                      <button
                        onClick={() => followed ? null : handleFollowTask(suggestion)}
                        disabled={followed}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all active:scale-95 ${
                          followed
                            ? (isDark ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200')
                            : (isDark ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100')
                        }`}
                      >
                        <CheckCircle2 size={10} />
                        {followed ? '已跟随' : '跟随'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 用户发布的挑战 */}
        {userChallenges.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Sparkles size={14} className={isDark ? 'text-purple-400' : 'text-purple-500'} />
              <h3 className="text-sm font-medium">来自星旅人</h3>
            </div>
            <div className="space-y-3">
              {userChallenges.map((challenge) => {
                const followed = isFollowed(challenge.id);
                return (
                  <div
                    key={challenge.id}
                    className={`p-4 rounded-[20px] transition-all ${
                      followed
                        ? (isDark ? 'bg-[#13131a]/60 border border-purple-500/20' : 'bg-purple-50/50 border border-purple-200/50')
                        : (isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100 shadow-sm')
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'} shadow-sm`}>
                        {challenge.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                          {challenge.main}
                        </p>
                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {(challenge.followers || []).length} 人跟随 · {challenge.date}
                        </p>
                      </div>
                      <button
                        onClick={() => followed ? null : handleFollowTask(challenge)}
                        disabled={followed}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all active:scale-95 ${
                          followed
                            ? (isDark ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'bg-purple-50 text-purple-600 border border-purple-200')
                            : (isDark ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100')
                        }`}
                      >
                        <CheckCircle2 size={10} />
                        {followed ? '已跟随' : '跟随'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 底部温馨语句 */}
        <div className={`p-4 rounded-2xl text-center ${isDark ? 'bg-[#171724]/50 border border-white/5' : 'bg-emerald-50/30 border border-emerald-100/50'}`}>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            明天醒来时，记得只是先睁开眼，剩下的慢慢来。
          </p>
        </div>
      </div>
    );
  };

  // === 渲染 ===
  return (
    <div className="animate-fade-in pb-10">
      {/* 三栏式导航 */}
      <div className="flex justify-center mb-6">
        <div className={`flex p-1 rounded-full w-full max-w-[320px] ${isDark ? 'bg-[#171724]' : 'bg-gray-200/50'}`}>
          {MODES.map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors ${mode === m ? (isDark ? 'bg-[#1f1f2e] text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') : 'text-gray-400'}`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* 横向滑动容器 */}
      <div
        ref={containerRef}
        className="overflow-hidden -mx-4"
        data-no-pull-refresh="true"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={onPagesTouchStart}
        onTouchMove={onPagesTouchMove}
        onTouchEnd={onPagesTouchEnd}
        onTouchCancel={onPagesTouchEnd}
      >
        <div
          className="flex"
          style={{
            width: `${MODES.length * 100}%`,
            transform: containerWidth
              ? `translateX(${-modeIndex * containerWidth + dragX}px)`
              : 'translateX(0)',
            transition: dragging.current && swipeStart.current.direction === 'h'
              ? 'none'
              : 'transform 0.35s cubic-bezier(0.2, 0.9, 0.4, 1)',
          }}
        >
          <div className="shrink-0 px-4" style={{ width: `${100 / MODES.length}%` }}>
            {renderEcho()}
          </div>
          <div className="shrink-0 px-4" style={{ width: `${100 / MODES.length}%` }}>
            {renderEmit()}
          </div>
          <div className="shrink-0 px-4" style={{ width: `${100 / MODES.length}%` }}>
            {renderTomorrow()}
          </div>
        </div>
      </div>

      {/* 粒子效果 */}
      {particles.map(p => (
        <div
          key={p.id}
          className="fixed pointer-events-none z-50"
          style={{
            left: p.x,
            top: p.y,
            animation: `particle-float 1s ease-out ${p.delay}s forwards`,
          }}
        >
          <Heart
            size={20}
            fill="currentColor"
            className="text-pink-500"
            style={{
              transform: `scale(${p.scale})`,
              '--tx': p.tx,
              '--ty': p.ty,
            }}
          />
        </div>
      ))}

      {/* 发射成功 toast */}
      {showToast && (
        <Portal>
          <div className="fixed left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-indigo-500 text-white text-sm shadow-lg shadow-indigo-500/20 animate-fade-in z-50 flex items-center gap-2 top-[max(env(safe-area-inset-top)+1rem,5rem)]">
            <Send size={14} /> 信号已封存进我的信号
          </div>
        </Portal>
      )}

      {/* 隐私弹窗 */}
      {showPrivacyModal && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowPrivacyModal(false)}>
            <div className={`w-full max-w-xs p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative text-center`} onClick={e => e.stopPropagation()}>
              <div className="mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-indigo-500/10 text-indigo-500">
                <BookOpen size={24} />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>深空折叠</h3>
              <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                选择"仅自己可见"后，这条信号只会保存在你的设备上，不会进入公开星海。
              </p>
              <button onClick={() => setShowPrivacyModal(false)} className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-[#1f1f2e] hover:bg-[#262638] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                知道了
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* 心语消散确认弹窗 */}
      {deleteConfirmId && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setDeleteConfirmId(null)}>
            <div className={`w-full max-w-xs p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative text-center`} onClick={e => e.stopPropagation()}>
              <div className="mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
                <AlertTriangle size={24} />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>确认消散</h3>
              <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                确定要让这段信号消散在宇宙中吗？此操作不可撤销。
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-[#1f1f2e] hover:bg-[#262638] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                  保留
                </button>
                <button onClick={confirmDeleteWhisper} className="flex-1 py-3 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20 active:scale-95">
                  消散
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
