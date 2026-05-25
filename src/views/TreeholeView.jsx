/**
 * TreeholeView.jsx — "雷达"板块，方案A：双tab（星海/明日）+ 底部悬浮发射按钮
 *
 * Tab 1 — 星海：
 *   - 快速输入框（点击展开）
 *   - 我的心语流（最近3条，可展开全部）
 *   - 星际回音（别人的心语，左右滑动）
 *
 * Tab 2 — 明日：
 *   - 明日小事（底部弹窗，含推荐标签+可见度+发布）
 *   - 我的今日清单（只显示自己的任务，可标记完成）
 *   - 热门任务（按跟随人数排序，系统推荐）
 */

import { useState, useEffect, useRef } from 'react';
import {
  Heart, Search, X, Star, ChevronDown, Trash2, Send,
  BookOpen, Sparkles, Compass, Plus, CheckCircle2,
  RotateCcw, Edit3, Radio, Flame
} from 'lucide-react';
import Portal from '../components/Portal.jsx';
import { MOCK_WHISPERS, PRESET_TAGS, TOMORROW_SUGGESTIONS } from '../constants.js';

const MODES = ['starsea', 'tomorrow'];
const MODE_LABELS = { starsea: '星海', tomorrow: '明日' };

// 明日小事推荐标签
const TOMORROW_QUICK_TAGS = [
  { emoji: '🌅', text: '早起看日出' },
  { emoji: '📚', text: '读10页书' },
  { emoji: '🏃', text: '散步20分钟' },
  { emoji: '🎵', text: '听一首新歌' },
  { emoji: '🧘', text: '冥想5分钟' },
  { emoji: '💧', text: '多喝一杯水' },
  { emoji: '🌙', text: '早睡一小时' },
  { emoji: '📝', text: '写日记' },
];

export default function TreeholeView({
  isDark,
  userData,
  saveUserData,
  currentDateStr,
  onGiveHug,
  onFollow,
}) {
  const [mode, setMode] = useState('starsea');

  // === 星海弹窗 state ===
  const [showEmitModal, setShowEmitModal] = useState(false);
  const [whisperText, setWhisperText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [showToast, setShowToast] = useState(false);
  const [toastExpanded, setToastExpanded] = useState(false);
  const [lastPublishedWhisper, setLastPublishedWhisper] = useState(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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

  // === 我的心语流 state ===
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWhisperId, setExpandedWhisperId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showAllMyWhispers, setShowAllMyWhispers] = useState(false);

  // === 星际回音 state ===
  const [particles, setParticles] = useState([]);

  // === 明日板块 state ===
  const [showTomorrowModal, setShowTomorrowModal] = useState(false);
  const [tomorrowText, setTomorrowText] = useState('');
  const [tomorrowVisibility, setTomorrowVisibility] = useState('public');
  const [showTomorrowPrivacyModal, setShowTomorrowPrivacyModal] = useState(false);
  const [displayedSuggestions, setDisplayedSuggestions] = useState(() =>
    TOMORROW_SUGGESTIONS.map(s => ({ ...s, _instanceId: Math.random().toString(36).slice(2) }))
  );

  const textareaRef = useRef(null);

  const isNewDay = userData.lastPostDate !== currentDateStr;
  const postsToday = isNewDay ? 0 : (userData.dailyPosts || 0);
  const postsLeft = Math.max(0, 5 - postsToday);

  const myWhispers = userData.myWhispers || [];

  // 输入框自适应高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [whisperText, showEmitModal]);

  // 容器ref
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => setContainerWidth(containerRef.current?.offsetWidth || 0);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const modeIndex = MODES.indexOf(mode);

  // === 星海业务逻辑 ===
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
    setLastPublishedWhisper(newWhisper);
    setToastExpanded(false);
    setShowToast(true);
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

  const displayedWhispers = showAllMyWhispers ? filteredWhispers : filteredWhispers.slice(0, 3);

  // === 明日业务逻辑 ===
  const followedList = userData.followedSuggestions || [];
  const userChallenges = userData.userChallenges || [];
  const myTasks = userData.myTomorrowTasks || [];
  const todayTasks = myTasks.filter(t => t.date === currentDateStr);

  // 热门任务：只显示系统推荐，使用稳定的跟随人数（基于id生成伪随机）
  const getStableFollowCount = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 80) + 20;
  };

  const hotTasks = [...displayedSuggestions]
    .map(s => ({ ...s, source: 'system', followCount: getStableFollowCount(s.id) }))
    .sort((a, b) => b.followCount - a.followCount);

  const handleRefreshOne = (instanceId) => {
    const currentIds = displayedSuggestions
      .filter(d => d._instanceId !== instanceId)
      .map(d => d.id);
    const available = TOMORROW_SUGGESTIONS.filter(s => !currentIds.includes(s.id));
    const pool = available.length > 0 ? available : TOMORROW_SUGGESTIONS;
    const random = pool[Math.floor(Math.random() * pool.length)];
    setDisplayedSuggestions(prev =>
      prev.map(d => d._instanceId === instanceId ? { ...random, _instanceId: instanceId } : d)
    );
  };

  // === 明日成功toast ===
  const [showTomorrowToast, setShowTomorrowToast] = useState(false);
  const [tomorrowToastExpanded, setTomorrowToastExpanded] = useState(false);
  const [lastPublishedTask, setLastPublishedTask] = useState(null);

  const handlePublishTomorrow = () => {
    if (!tomorrowText.trim()) return;

    const newTask = {
      taskId: `user_${Date.now()}`,
      date: currentDateStr,
      completed: false,
      emoji: '✨',
      main: tomorrowText.trim(),
      sub: '来自你的明日约定',
      source: 'user',
    };

    // 如果公开，同时创建为可跟随的挑战
    if (tomorrowVisibility === 'public') {
      const newChallenge = {
        id: newTask.taskId,
        emoji: '✨',
        main: tomorrowText.trim(),
        sub: '来自你的明日约定',
        source: 'user',
        followers: [userData.id],
        date: currentDateStr,
      };
      saveUserData({
        ...userData,
        userChallenges: [newChallenge, ...userChallenges],
        myTomorrowTasks: [...myTasks, newTask],
      });
    } else {
      saveUserData({
        ...userData,
        myTomorrowTasks: [...myTasks, newTask],
      });
    }

    setTomorrowText('');
    setTomorrowVisibility('public');
    setShowTomorrowModal(false);
    setLastPublishedTask(newTask);
    setTomorrowToastExpanded(false);
    setShowTomorrowToast(true);
  };

  const handleFollowTask = (challenge) => {
    const taskId = challenge.id;
    if (todayTasks.find(t => t.taskId === taskId)) return;

    const newTask = {
      taskId,
      date: currentDateStr,
      completed: false,
      emoji: challenge.emoji,
      main: challenge.main,
      sub: challenge.sub,
      source: 'system',
    };

    saveUserData({
      ...userData,
      totalFollows: (userData.totalFollows || 0) + 1,
      followedSuggestions: [...followedList, taskId],
      myTomorrowTasks: [...myTasks, newTask],
    });

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
    saveUserData({
      ...userData,
      totalFollows: Math.max(0, (userData.totalFollows || 0) - 1),
      followedSuggestions: followedList.filter(id => id !== taskId),
      myTomorrowTasks: newTasks,
    });
  };

  const isFollowed = (challengeId) => {
    return todayTasks.some(t => t.taskId === challengeId);
  };

  // === 渲染：星海 tab ===
  const renderStarSea = () => (
    <div className="space-y-5">
      {/* 快速输入框 — 橙色主题 */}
      <div
        onClick={() => setShowEmitModal(true)}
        className={`p-4 rounded-[20px] border cursor-pointer transition-all active:scale-[0.98] flex items-center gap-3 ${
          isDark ? 'bg-[#171724]/70 border-white/5 hover:bg-[#1a1a2e]' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/15' : 'bg-amber-100'}`}>
          <Edit3 size={20} className={isDark ? 'text-amber-300' : 'text-amber-500'} />
        </div>
        <div className="flex-1">
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {postsLeft > 0 ? '今天想对宇宙说什么？' : '今日星际能量已耗尽'}
          </p>
          <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {postsLeft > 0 ? `还可发射 ${postsLeft} 次信号` : '明日 00:00 自动恢复'}
          </p>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <Plus size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
        </div>
      </div>

      {/* 我的心语流 */}
      {myWhispers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Radio size={14} className="text-amber-400" />
              我的心语流
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-[#1f1f2e] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              {myWhispers.length} 条
            </span>
          </div>

          {/* 搜索 */}
          <div className={`flex items-center px-4 py-2.5 rounded-2xl border transition-all ${isDark ? 'bg-[#171724] border-white/5 focus-within:border-amber-500/30' : 'bg-white shadow-sm border-gray-100 focus-within:border-amber-200 focus-within:shadow-md'}`}>
            <Search size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
            <input
              type="text"
              placeholder="搜索我的心语..."
              className={`flex-1 ml-3 bg-transparent text-sm outline-none ${isDark ? 'text-gray-200 placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'}`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={`p-1 rounded-full transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* 心语列表 — 优化排版 */}
          <div className="space-y-2">
            {displayedWhispers.length === 0 ? (
              <div className={`py-8 text-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                <p className="text-xs">未找到匹配的信号</p>
              </div>
            ) : (
              displayedWhispers.map(whisper => {
                const isExpanded = expandedWhisperId === whisper.id;
                return (
                  <div
                    key={whisper.id}
                    onClick={() => setExpandedWhisperId(isExpanded ? null : whisper.id)}
                    className={`rounded-[20px] transition-all duration-300 border cursor-pointer ${
                      isExpanded
                        ? (isDark ? 'bg-[#1f1f2e] border-amber-500/30 shadow-lg shadow-amber-500/5' : 'bg-white border-amber-200 shadow-md')
                        : (isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]' : 'bg-white/60 border-white/50 hover:bg-white shadow-sm')
                    } active:scale-[0.98]`}
                  >
                    {/* 卡片头部：标签 + 操作 */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-sm ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                            {whisper.emotion}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border ${whisper.visibility === 'private' ? (isDark ? 'bg-gray-800/50 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200') : (isDark ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-500 border-amber-100')}`}>
                            {whisper.visibility === 'private' ? '深空折叠' : '散落星海'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={(e) => toggleFavoriteWhisper(whisper.id, e)} className="p-1.5 hover:scale-110 transition-transform">
                            <Star size={14} className={`${whisper.isFavorite ? 'text-yellow-400 fill-yellow-400' : (isDark ? 'text-gray-600' : 'text-gray-300')} transition-colors`} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(whisper.id); }} className={`p-1.5 rounded-full transition-colors ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* 内容区 */}
                      <p className={`text-sm font-light leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'} ${!isExpanded ? 'line-clamp-2' : ''}`}>
                        {whisper.text}
                      </p>

                      {/* 底部：日期 + 展开按钮 */}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{whisper.date}</span>
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          <ChevronDown size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                        </div>
                      </div>
                    </div>

                    {/* 展开详情 */}
                    <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-3 pt-1 border-t border-white/5">
                          <div className={`p-3 rounded-xl ${isDark ? 'bg-black/20' : 'bg-gray-50/80'}`}>
                            <p className={`text-sm font-light leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                              {whisper.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* 查看全部 */}
            {filteredWhispers.length > 3 && !showAllMyWhispers && (
              <button
                onClick={() => setShowAllMyWhispers(true)}
                className={`w-full py-2.5 rounded-xl text-xs transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                查看全部 {filteredWhispers.length} 条心语
              </button>
            )}
          </div>
        </div>
      )}

      {/* 星际回音 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles size={14} className="text-amber-400" />
          <h3 className="text-sm font-medium">星际回音</h3>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-1">
          {MOCK_WHISPERS.map((whisper) => {
            const isHugged = (userData.huggedWhispers || []).includes(whisper.id);
            return (
              <div
                key={whisper.id}
                className={`shrink-0 snap-center w-[280px] p-5 rounded-[24px] border relative overflow-hidden ${
                  isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#171724] border-white/5' : 'bg-gradient-to-br from-indigo-50/50 to-white border-indigo-50'
                } shadow-sm`}
              >
                <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-3xl opacity-50 ${whisper.isPositive ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}></div>
                <div className={`absolute -bottom-10 -left-4 w-16 h-16 rounded-full blur-2xl opacity-30 ${whisper.isPositive ? 'bg-pink-500/10' : 'bg-indigo-500/10'}`}></div>

                <div className="flex items-center gap-2 mb-4 relative z-10">
                  <span className={`text-[10px] px-2.5 py-1 rounded-md border ${isDark ? 'bg-white/[0.03] text-gray-300 border-white/10' : 'bg-white text-gray-600 border-gray-100'}`}>
                    {whisper.emotion}
                  </span>
                  <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Radio size={10} /> 未知坐标
                  </span>
                </div>

                <p className={`text-sm leading-relaxed mb-5 font-light relative z-10 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
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
                      size={14}
                      fill={isHugged ? 'currentColor' : 'none'}
                      strokeWidth={isHugged ? 2.5 : 2}
                      className={`transition-transform duration-300 ${isHugged ? 'scale-110' : 'scale-100'}`}
                    />
                    <span className="text-[11px]">{isHugged ? '已送出温暖' : '送出温暖'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // === 渲染：明日 tab ===
  const renderTomorrow = () => (
    <div className="space-y-5">
      {/* 明日小事 — 顶部输入框 */}
      <div
        onClick={() => setShowTomorrowModal(true)}
        className={`p-4 rounded-[20px] border cursor-pointer transition-all active:scale-[0.98] flex items-center gap-3 ${
          isDark ? 'bg-[#171724]/70 border-white/5 hover:bg-[#1a1a2e]' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-100'}`}>
          <Edit3 size={20} className={isDark ? 'text-emerald-300' : 'text-emerald-500'} />
        </div>
        <div className="flex-1">
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            明日小事
          </p>
          <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            给自己定一个小目标
          </p>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <Plus size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
        </div>
      </div>

      {/* 我的今日清单 */}
      {todayTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <CheckCircle2 size={14} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
            <h3 className="text-sm font-medium">我的今日清单</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
              {todayTasks.filter(t => t.completed).length}/{todayTasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div
                key={task.taskId}
                className={`p-3 rounded-[16px] border flex items-center gap-3 ${
                  task.completed
                    ? (isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/30 border-emerald-200/50')
                    : (isDark ? 'bg-[#171724] border-white/5' : 'bg-white border-gray-100 shadow-sm')
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'}`}>
                  {task.completed ? '✅' : task.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.completed ? (isDark ? 'text-emerald-300 line-through opacity-60' : 'text-emerald-600 line-through opacity-60') : (isDark ? 'text-gray-100' : 'text-gray-800')}`}>
                    {task.main}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleComplete(task.taskId)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all active:scale-95 ${
                    task.completed
                      ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-600 border border-emerald-200')
                      : (isDark ? 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100')
                  }`}
                >
                  {task.completed ? '已完成' : '未完成'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 热门任务 */}
      {hotTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Flame size={14} className={isDark ? 'text-orange-400' : 'text-orange-500'} />
            <h3 className="text-sm font-medium">热门任务</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-1">
            {hotTasks.map((challenge) => {
              const followed = isFollowed(challenge.id);
              return (
                <div
                  key={challenge._instanceId}
                  className={`shrink-0 snap-center w-[260px] p-4 rounded-[20px] border transition-all ${
                    followed
                      ? (isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200/50')
                      : (isDark ? 'bg-[#171724] border-white/5' : 'bg-white border-gray-100 shadow-sm')
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'} shadow-sm shrink-0`}>
                      {challenge.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                        {challenge.main}
                      </p>
                      <p className={`text-[11px] leading-relaxed mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {challenge.sub}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <Flame size={10} /> {challenge.followCount} 人跟随
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRefreshOne(challenge._instanceId)}
                            className={`p-1.5 rounded-full transition-all active:scale-90 ${isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
                            title="换一条"
                          >
                            <RotateCcw size={12} />
                          </button>
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
                    </div>
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

  // === 渲染：星海发射弹窗 ===
  const renderEmitModal = () => {
    if (!showEmitModal) return null;
    return (
      <Portal>
        <div className={`fixed inset-0 z-[60] flex items-end ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowEmitModal(false)}>
          <div
            className={`w-full p-6 rounded-t-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative`}
            style={{ maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 拖动指示条 */}
            <div className="flex justify-center mb-4">
              <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>向深空发射信号</h3>
              <button onClick={() => setShowEmitModal(false)} className={`p-1 rounded-full ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                <X size={20} />
              </button>
            </div>

            {/* 输入框 */}
            <div className="relative mb-4">
              <textarea
                ref={textareaRef}
                className={`w-full p-4 rounded-2xl resize-none min-h-[120px] text-sm focus:outline-none transition-all ${
                  isDark
                    ? 'bg-[#1f1f2e] text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500/30'
                    : 'bg-gray-50 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-400/30'
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

            {/* 标签选择 */}
            <div className="mb-4">
              <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择一个波段</p>
              <div className="flex flex-wrap gap-2">
                {[...PRESET_TAGS.positive, ...PRESET_TAGS.neutral].slice(0, 5).map((tag, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setWhisperText(tag + '...');
                      setSelectedTag(tag);
                    }}
                    className={`text-xs px-3 py-2 rounded-full border transition-all active:scale-95 ${
                      selectedTag === tag
                        ? (isDark ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-indigo-100 border-indigo-300 text-indigo-700')
                        : (isDark ? 'border-gray-700 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-500 hover:border-gray-300')
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 可见度 */}
            <div className="flex justify-between items-center mb-6">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>信号可见度</span>
              <div className={`flex p-1 rounded-full ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-100'}`}>
                <button
                  onClick={() => handleVisibilityChange('public')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${visibility === 'public' ? (isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white text-indigo-600 shadow-sm') : 'text-gray-400'}`}
                >
                  <Sparkles size={10} className="inline mr-1" />
                  散落星海
                </button>
                <button
                  onClick={() => handleVisibilityChange('private')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${visibility === 'private' ? (isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white text-indigo-600 shadow-sm') : 'text-gray-400'}`}
                >
                  <BookOpen size={10} className="inline mr-1" />
                  深空折叠
                </button>
              </div>
            </div>

            {/* 发射按钮 */}
            <button
              onClick={handleEmit}
              disabled={!whisperText.trim() || postsLeft <= 0}
              className={`w-full py-3.5 rounded-2xl font-medium tracking-wider transition-all flex items-center justify-center gap-2 ${
                whisperText.trim() && postsLeft > 0
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/25 active:scale-[0.98]'
                  : (isDark ? 'bg-[#1f1f2e] text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
              }`}
            >
              <Send size={18} className={whisperText.trim() && postsLeft > 0 ? 'animate-pulse' : ''} />
              {postsLeft > 0 ? '向深空发射' : '今日星际能量已耗尽'}
            </button>
          </div>
        </div>
      </Portal>
    );
  };

  // === 渲染：明日小事弹窗 ===
  const renderTomorrowModal = () => {
    if (!showTomorrowModal) return null;
    return (
      <Portal>
        <div className={`fixed inset-0 z-[60] flex items-end ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowTomorrowModal(false)}>
          <div
            className={`w-full p-6 rounded-t-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative`}
            style={{ maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 拖动指示条 */}
            <div className="flex justify-center mb-4">
              <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>明日小事</h3>
              <button onClick={() => setShowTomorrowModal(false)} className={`p-1 rounded-full ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                <X size={20} />
              </button>
            </div>

            {/* 输入框 */}
            <div className="relative mb-4">
              <textarea
                className={`w-full p-4 rounded-2xl resize-none min-h-[100px] text-sm focus:outline-none transition-all ${
                  isDark
                    ? 'bg-[#1f1f2e] text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/30'
                    : 'bg-gray-50 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400/30'
                }`}
                placeholder="写下明天想做的一件小事..."
                value={tomorrowText}
                onChange={e => setTomorrowText(e.target.value)}
              ></textarea>
              {tomorrowText && (
                <div className={`absolute bottom-3 right-3 text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {tomorrowText.length} 字
                </div>
              )}
            </div>

            {/* 推荐标签 */}
            <div className="mb-4">
              <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选一个，或自己写</p>
              <div className="flex flex-wrap gap-2">
                {TOMORROW_QUICK_TAGS.map((tag, i) => (
                  <button
                    key={i}
                    onClick={() => setTomorrowText(tag.text)}
                    className={`text-xs px-3 py-2 rounded-full border transition-all active:scale-95 ${
                      tomorrowText === tag.text
                        ? (isDark ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-700')
                        : (isDark ? 'border-gray-700 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-500 hover:border-gray-300')
                    }`}
                  >
                    {tag.emoji} {tag.text}
                  </button>
                ))}
              </div>
            </div>

            {/* 可见度 */}
            <div className="flex justify-between items-center mb-6">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>可见度</span>
              <div className={`flex p-1 rounded-full ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-100'}`}>
                <button
                  onClick={() => {
                    if (tomorrowVisibility === 'private') {
                      setTomorrowVisibility('public');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${tomorrowVisibility === 'public' ? (isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white text-emerald-600 shadow-sm') : 'text-gray-400'}`}
                >
                  <Sparkles size={10} className="inline mr-1" />
                  公开
                </button>
                <button
                  onClick={() => {
                    if (tomorrowVisibility === 'public') {
                      setShowTomorrowPrivacyModal(true);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${tomorrowVisibility === 'private' ? (isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white text-emerald-600 shadow-sm') : 'text-gray-400'}`}
                >
                  <BookOpen size={10} className="inline mr-1" />
                  仅自己可见
                </button>
              </div>
            </div>

            {/* 发布按钮 */}
            <button
              onClick={handlePublishTomorrow}
              disabled={!tomorrowText.trim()}
              className={`w-full py-3.5 rounded-2xl font-medium tracking-wider transition-all flex items-center justify-center gap-2 ${
                tomorrowText.trim()
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 active:scale-[0.98]'
                  : (isDark ? 'bg-[#1f1f2e] text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
              }`}
            >
              <Send size={18} className={tomorrowText.trim() ? 'animate-pulse' : ''} />
              发布
            </button>
          </div>
        </div>
      </Portal>
    );
  };

  // === 主渲染 ===
  return (
    <div className="animate-fade-in pb-10 relative">
      {/* 双栏导航 */}
      <div className="flex justify-center mb-6">
        <div className={`flex p-1 rounded-full w-full max-w-[280px] ${isDark ? 'bg-[#171724]' : 'bg-gray-200/50'}`}>
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

      {/* 内容容器（无滑动，仅点击切换） */}
      <div
        ref={containerRef}
        className="overflow-hidden -mx-4"
        data-no-pull-refresh="true"
      >
        <div
          className="flex"
          style={{
            width: `${MODES.length * 100}%`,
            transform: containerWidth
              ? `translateX(${-modeIndex * containerWidth}px)`
              : 'translateX(0)',
            transition: 'transform 0.35s cubic-bezier(0.2, 0.9, 0.4, 1)',
          }}
        >
          <div className="shrink-0 px-4" style={{ width: `${100 / MODES.length}%` }}>
            {renderStarSea()}
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

      {/* 星海发射成功 — 可折叠卡片 */}
      {showToast && lastPublishedWhisper && (
        <Portal>
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowToast(false)}>
            <div className={`w-full max-w-sm rounded-[24px] border overflow-hidden ${isDark ? 'bg-[#171724] border-amber-500/30 shadow-lg shadow-amber-500/10' : 'bg-white border-amber-200 shadow-xl'}`} onClick={e => e.stopPropagation()}>
              {/* 头部 */}
              <div className={`p-4 flex items-center justify-between ${isDark ? 'bg-amber-500/10' : 'bg-amber-50/50'}`}>
                <div className="flex items-center gap-2">
                  <Send size={16} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
                  <span className={`text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>信号已封存</span>
                </div>
                <button onClick={() => setShowToast(false)} className={`p-1 rounded-full transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  <X size={16} />
                </button>
              </div>

              {/* 卡片内容 */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-sm ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                    {lastPublishedWhisper.emotion}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border ${lastPublishedWhisper.visibility === 'private' ? (isDark ? 'bg-gray-800/50 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200') : (isDark ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-500 border-amber-100')}`}>
                    {lastPublishedWhisper.visibility === 'private' ? '深空折叠' : '散落星海'}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{lastPublishedWhisper.date}</span>
                </div>

                <p className={`text-sm font-light leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'} ${!toastExpanded ? 'line-clamp-3' : ''}`}>
                  {lastPublishedWhisper.text}
                </p>

                <button
                  onClick={() => setToastExpanded(!toastExpanded)}
                  className={`mt-3 text-xs flex items-center gap-1 transition-colors ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-500 hover:text-amber-600'}`}
                >
                  <ChevronDown size={14} className={`transition-transform duration-300 ${toastExpanded ? 'rotate-180' : ''}`} />
                  {toastExpanded ? '收起' : '展开'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* 明日发布成功 — 可折叠卡片 */}
      {showTomorrowToast && lastPublishedTask && (
        <Portal>
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowTomorrowToast(false)}>
            <div className={`w-full max-w-sm rounded-[24px] border overflow-hidden ${isDark ? 'bg-[#171724] border-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'bg-white border-emerald-200 shadow-xl'}`} onClick={e => e.stopPropagation()}>
              {/* 头部 */}
              <div className={`p-4 flex items-center justify-between ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50/50'}`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
                  <span className={`text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>明日小事已添加</span>
                </div>
                <button onClick={() => setShowTomorrowToast(false)} className={`p-1 rounded-full transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  <X size={16} />
                </button>
              </div>

              {/* 卡片内容 */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{lastPublishedTask.emoji}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border ${lastPublishedTask.source === 'user' && tomorrowVisibility === 'private' ? (isDark ? 'bg-gray-800/50 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200') : (isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-500 border-emerald-100')}`}>
                    {lastPublishedTask.source === 'user' && tomorrowVisibility === 'private' ? '仅自己可见' : '公开'}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{lastPublishedTask.date}</span>
                </div>

                <p className={`text-sm font-light leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'} ${!tomorrowToastExpanded ? 'line-clamp-3' : ''}`}>
                  {lastPublishedTask.main}
                </p>

                <button
                  onClick={() => setTomorrowToastExpanded(!tomorrowToastExpanded)}
                  className={`mt-3 text-xs flex items-center gap-1 transition-colors ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-500 hover:text-emerald-600'}`}
                >
                  <ChevronDown size={14} className={`transition-transform duration-300 ${tomorrowToastExpanded ? 'rotate-180' : ''}`} />
                  {tomorrowToastExpanded ? '收起' : '展开'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* 星海发射弹窗 */}
      {renderEmitModal()}

      {/* 明日小事弹窗 */}
      {renderTomorrowModal()}

      {/* 星海隐私确认弹窗 */}
      {showPrivacyModal && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={cancelPrivacy}>
            <div className={`w-full max-w-xs p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative text-center`} onClick={e => e.stopPropagation()}>
              <div className="mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-indigo-500/10 text-indigo-500">
                <BookOpen size={24} />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>深空折叠</h3>
              <p className={`text-xs mb-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                选择「深空折叠」后，这条信号将仅保留在你的设备上。
              </p>
              <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                它不会进入公开内容池，也不会被他人看到。这是为了保护和尊重你的隐私。
              </p>
              <div className="flex gap-3">
                <button onClick={cancelPrivacy} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-[#1f1f2e] hover:bg-[#262638] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                  取消
                </button>
                <button onClick={confirmPrivacy} className={`flex-1 py-3 rounded-xl text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors shadow-lg shadow-indigo-500/20 active:scale-95`}>
                  确认
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* 明日隐私确认弹窗 */}
      {showTomorrowPrivacyModal && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowTomorrowPrivacyModal(false)}>
            <div className={`w-full max-w-xs p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative text-center`} onClick={e => e.stopPropagation()}>
              <div className="mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                <BookOpen size={24} />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>仅自己可见</h3>
              <p className={`text-xs mb-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                选择「仅自己可见」后，这个任务将仅保留在你的设备上。
              </p>
              <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                它不会进入公开任务池，也不会被他人看到。这是为了保护和尊重你的隐私。
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowTomorrowPrivacyModal(false)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-[#1f1f2e] hover:bg-[#262638] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                  取消
                </button>
                <button onClick={() => { setTomorrowVisibility('private'); setShowTomorrowPrivacyModal(false); }} className={`flex-1 py-3 rounded-xl text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-lg shadow-emerald-500/20 active:scale-95`}>
                  确认
                </button>
              </div>
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
                <Trash2 size={24} />
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
