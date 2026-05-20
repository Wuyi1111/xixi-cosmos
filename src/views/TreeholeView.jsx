/**
 * TreeholeView.jsx — "微澜"树洞，三栏 tab：星际回音 / 发射台 / 明日。
 *
 * 三个 tab（mode）：
 *   - 'browse'   星际回音：浏览示例心语，每张卡底部"送出温暖"心形按钮
 *   - 'emit'     发射台：选标签 + 写心语 + 选可见度 + 发射（每日上限 5 条）
 *                       下方接"我的信号" — 搜索 + 历史心语列表（v4.5.0 起合并进来）
 *   - 'tomorrow' 明日：给用户的温柔建议清单，原则是不逼用户改变只陪着
 *
 * 三个 tab 可以手指**横向滑动切换**（v4.5.0 起），也可以继续点击顶部按钮。
 *
 * 改什么：
 *   - 改"星际回音"展示的示例心语 → src/constants.js 的 MOCK_WHISPERS
 *   - 改发射台的预设波段标签 → src/constants.js 的 PRESET_TAGS
 *   - 改每日发射上限（默认 5 次）→ 这里 postsLeft 那行的 5
 *   - 改"送出温暖"心形点亮 / 取消交互、粒子动效 → handleToggleHug
 *   - 改"明日"tab 的建议条目（emoji / 主文 / 副文）→ src/constants.js 的 TOMORROW_SUGGESTIONS
 *   - 调整手势滑动灵敏度（默认 20% 容器宽即触发切换）→ SWIPE_THRESHOLD_RATIO
 *   - 改边界阻尼 / 拖动反馈曲线 → onTouchMove 里的 0.3 系数
 *
 * 注意：当前没有后端，"散落星海"和"深空折叠"两个可见度选项目前只是 UI 标签，
 *      心语全都只保存在本地。要做真"匿名公开"得自己加后端。
 */

import { useState, useEffect, useRef } from 'react';
import { Radio, Heart, Search, X, Star, ChevronDown, Trash2, Send, AlertTriangle, CheckCircle2, RefreshCw, Plus, BookOpen } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import { MOCK_WHISPERS, PRESET_TAGS, TOMORROW_SUGGESTIONS } from '../constants.js';

const MODES = ['browse', 'emit', 'tomorrow'];
const MODE_LABELS = { browse: '星际回音', emit: '发射台', tomorrow: '明日' };
const SWIPE_THRESHOLD_RATIO = 0.2; // 拖过容器 20% 宽就切到下一页
const SPOTS_COUNT = 3; // 默认光点数量

// 从任务池中随机抽取指定数量的任务
const getRandomSuggestions = (count, excludeIds = []) => {
  const available = TOMORROW_SUGGESTIONS.filter(s => !excludeIds.includes(s.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export default function TreeholeView({ isDark, userData, saveUserData, currentDateStr }) {
  const [mode, setMode] = useState('browse');
  const [whisperText, setWhisperText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [particles, setParticles] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWhisperId, setExpandedWhisperId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // 明日页面状态
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState('');
  const [showHistory, setShowHistory] = useState(false);

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

    // 锁定方向：第一次显著移动决定是横滑还是竖滚
    if (swipeStart.current.direction === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        swipeStart.current.direction = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      }
    }

    if (swipeStart.current.direction === 'h') {
      // 边界阻尼：到了最左 / 最右还想往外拖时，给 0.3 的衰减
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
  const handleToggleHug = (whisperId, e) => {
    const huggedList = userData.huggedWhispers || [];
    const isHugged = huggedList.includes(whisperId);

    if (isHugged) {
      saveUserData({
        ...userData,
        totalHugs: Math.max(0, userData.totalHugs - 1),
        huggedWhispers: huggedList.filter(id => id !== whisperId),
      });
    } else {
      saveUserData({
        ...userData,
        totalHugs: userData.totalHugs + 1,
        huggedWhispers: [...huggedList, whisperId],
      });
      const rect = e.currentTarget.getBoundingClientRect();
      const newParticles = Array.from({ length: 5 }).map((_, i) => ({
        id: Date.now() + i,
        x: rect.left + rect.width / 2,
        y: rect.top,
        tx: (Math.random() - 0.5) * 100 + 'px'
      }));
      setParticles(prev => [...prev, ...newParticles]);
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 1000);
    }
  };

  const handleEmit = () => {
    if(!whisperText || postsLeft <= 0) return;
    const newWhisper = {
      id: Date.now(),
      date: currentDateStr,
      text: whisperText,
      emotion: selectedTag || '无名星尘',
      visibility,
      isFavorite: false
    };
    saveUserData({
      ...userData,
      dailyPosts: postsToday + 1,
      lastPostDate: currentDateStr,
      myWhispers: [newWhisper, ...myWhispers]
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

  // === 明日页面逻辑 ===
  // 获取今日光点（如果没有则生成）
  const getTodaySpots = () => {
    const saved = userData.tomorrowSpots;
    if (saved?.date === currentDateStr && saved?.spots?.length >= SPOTS_COUNT) {
      return saved.spots;
    }
    // 生成新的光点
    const spots = Array.from({ length: SPOTS_COUNT }, (_, i) => ({
      id: `spot_${Date.now()}_${i}`,
      type: 'random',
      suggestion: getRandomSuggestions(1)[0] || null,
      customText: '',
      status: 'pending', // pending | done | skipped
    }));
    saveUserData({
      ...userData,
      tomorrowSpots: { date: currentDateStr, spots }
    });
    return spots;
  };

  const todaySpots = getTodaySpots();
  const doneCount = todaySpots.filter(s => s.status === 'done').length;

  const updateSpot = (spotId, updates) => {
    const newSpots = todaySpots.map(s => s.id === spotId ? { ...s, ...updates } : s);
    saveUserData({
      ...userData,
      tomorrowSpots: { date: currentDateStr, spots: newSpots }
    });
  };

  const handleDone = (spotId) => {
    const spot = todaySpots.find(s => s.id === spotId);
    if (!spot || spot.status === 'done') return;

    // 添加到历史记录
    const historyEntry = {
      id: Date.now(),
      date: currentDateStr,
      text: spot.type === 'custom' ? spot.customText : (spot.suggestion?.main || ''),
      emoji: spot.type === 'custom' ? '✨' : (spot.suggestion?.emoji || '✨'),
    };

    saveUserData({
      ...userData,
      tomorrowDoneTotal: (userData.tomorrowDoneTotal || 0) + 1,
      tomorrowSpots: { date: currentDateStr, spots: todaySpots.map(s => s.id === spotId ? { ...s, status: 'done' } : s) },
      tomorrowHistory: [historyEntry, ...(userData.tomorrowHistory || [])],
    });
  };

  const handleAddNewSpot = () => {
    const newSpot = {
      id: `spot_${Date.now()}_${todaySpots.length}`,
      type: 'empty',
      suggestion: null,
      customText: '',
      status: 'pending',
    };
    saveUserData({
      ...userData,
      tomorrowSpots: { date: currentDateStr, spots: [...todaySpots, newSpot] }
    });
  };

  const handleRefresh = (spotId) => {
    const usedIds = todaySpots
      .filter(s => s.type === 'random' && s.suggestion && s.id !== spotId)
      .map(s => s.suggestion.id);
    const newSuggestion = getRandomSuggestions(1, usedIds)[0];
    updateSpot(spotId, { type: 'random', suggestion: newSuggestion || null });
  };

  const handleAddCustom = (spotId) => {
    if (!customText.trim()) return;
    updateSpot(spotId, {
      type: 'custom',
      customText: customText.trim(),
      suggestion: null,
      status: 'pending'
    });
    setCustomText('');
    setShowCustomInput(false);
  };

  const handleClearCustom = (spotId) => {
    const newSuggestion = getRandomSuggestions(1)[0];
    updateSpot(spotId, {
      type: 'random',
      customText: '',
      suggestion: newSuggestion || null,
      status: 'pending'
    });
  };

  // === 三个页面内容 ===
  const renderBrowse = () => (
    <div className="space-y-6">
      {MOCK_WHISPERS.map((whisper, i) => {
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
                onClick={(e) => handleToggleHug(whisper.id, e)}
                aria-pressed={isHugged}
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

  const renderEmitAndMine = () => (
    <div className="space-y-6">
      {/* 发射区 */}
      <div className="space-y-3">
        <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>为你的信号选择一个波段：</p>
        <div className="flex flex-wrap gap-2">
          {[...PRESET_TAGS.positive, ...PRESET_TAGS.neutral].slice(0, 5).map((tag, i) => (
            <button
              key={i}
              onClick={() => {
                setWhisperText(tag + '...');
                setSelectedTag(tag);
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedTag === tag
                ? (isDark ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-indigo-100 border-indigo-300 text-indigo-700')
                : (isDark ? 'border-gray-700 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-500 hover:border-gray-300')
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          className={`w-full p-5 rounded-[28px] resize-none min-h-[160px] text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-colors ${
            isDark ? 'bg-[#171724] text-gray-200 placeholder-gray-600' : 'bg-white shadow-sm text-gray-800 placeholder-gray-400'
          }`}
          placeholder="宇宙无边无际，你的心声在这里不再受限。倾诉吧..."
          value={whisperText}
          onChange={e => setWhisperText(e.target.value)}
        ></textarea>
      </div>

      <div className="flex justify-between items-center px-2">
        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>信号可见度：</span>
        <div className={`flex p-1 rounded-full ${isDark ? 'bg-[#171724]' : 'bg-gray-100'}`}>
          <button
            onClick={() => setVisibility('public')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors ${visibility === 'public' ? (isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white text-indigo-600 shadow-sm') : 'text-gray-400 hover:text-gray-300'}`}
          >
            散落星海 (公开)
          </button>
          <button
            onClick={() => setVisibility('private')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors ${visibility === 'private' ? (isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white text-indigo-600 shadow-sm') : 'text-gray-400 hover:text-gray-300'}`}
          >
            深空折叠 (仅自己)
          </button>
        </div>
      </div>

      <button
        onClick={handleEmit}
        disabled={!whisperText || postsLeft <= 0}
        className={`w-full py-4 rounded-2xl font-medium tracking-wider transition-all flex items-center justify-center gap-2 ${
          whisperText && postsLeft > 0
            ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-95'
            : (isDark ? 'bg-[#1f1f2e] text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
        }`}
      >
        <Send size={18} />
        {postsLeft > 0 ? '向深空发射' : '今日星际能量已耗尽'}
      </button>
      <p className="text-center text-[10px] text-gray-500">
        {postsLeft > 0 ? `今日还可发射 ${postsLeft} 次信号` : '明日 00:00 信号能量自动恢复'}
      </p>

      {/* === 我的信号 列表（合并进发射台底部） === */}
      <div className={`pt-6 mt-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Radio size={14} className="text-indigo-400" />
            我的信号
          </h3>
          <span className="text-[10px] text-gray-500">{myWhispers.length} 条</span>
        </div>

        <div className={`flex items-center px-4 py-3 rounded-2xl mb-3 ${isDark ? 'bg-[#171724]' : 'bg-white shadow-sm'}`}>
          <Search size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
          <input
            type="text"
            placeholder="搜索我的心语轨迹..."
            className={`flex-1 ml-3 bg-transparent text-sm outline-none ${isDark ? 'text-gray-200 placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'}`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={isDark ? 'text-gray-500' : 'text-gray-400'}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="space-y-3">
          {filteredWhispers.length === 0 ? (
            <div className={`py-10 text-center text-xs flex flex-col items-center gap-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              <Radio size={28} className="opacity-40" />
              {searchQuery ? '在广袤宇宙中未寻得该信号' : '暂未发射过任何信号'}
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

  // === 明日页面：光点机制 ===
  const renderTomorrow = () => {
    const totalSpots = todaySpots.length;
    const progress = totalSpots > 0 ? Math.round((doneCount / totalSpots) * 100) : 0;

    return (
      <div className="space-y-5">
        {/* 头部卡片 */}
        <div className={`p-6 rounded-[28px] relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1a1a24] to-[#171724] border border-indigo-500/15' : 'bg-gradient-to-br from-indigo-50/70 to-white border border-indigo-100'}`}>
          <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full bg-amber-300/15 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-8 -left-6 w-24 h-24 rounded-full bg-indigo-300/15 blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            {/* 顶部标签与进度 */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                  <span className="text-base">🌅</span>
                </div>
                <p className={`text-[10px] tracking-[0.2em] ${isDark ? 'text-indigo-300' : 'text-indigo-500'}`}>TOMORROW</p>
              </div>
              <div className="flex items-center gap-2">
                {(userData.tomorrowDoneTotal || 0) > 0 && (
                  <span className={`text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 ${isDark ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                    <CheckCircle2 size={10} /> 已完成 {userData.tomorrowDoneTotal} 次
                  </span>
                )}
                <button
                  onClick={() => setShowHistory(true)}
                  className={`text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors ${isDark ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25' : 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100'}`}
                >
                  <BookOpen size={10} /> 我的光点
                </button>
              </div>
            </div>

            <h2 className="text-xl font-light mb-2 tracking-wide">轻轻陪你走向明天</h2>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              今天有 {totalSpots} 颗小光点等你拾起，<br/>
              不是任务，只是温柔的陪伴。
            </p>

            {/* 今日进度 */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <p className={`text-[11px] ${doneCount > 0 ? (isDark ? 'text-emerald-300' : 'text-emerald-600') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
                  {doneCount > 0 ? `今天已经拾起了 ${doneCount} 颗 · 谢谢你照顾了自己` : '还没有拾起光点，慢慢来'}
                </p>
                <span className={`text-[10px] font-medium ${isDark ? 'text-emerald-300/70' : 'text-emerald-600/70'}`}>{progress}%</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#13131a]' : 'bg-gray-100'}`}>
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 光点列表 */}
        <div className="space-y-3">
          {todaySpots.map((spot, index) => {
            const isDone = spot.status === 'done';
            const isCustom = spot.type === 'custom';
            const suggestion = spot.suggestion;

            return (
              <div
                key={spot.id}
                className={`p-5 rounded-[24px] transition-all duration-500 ${
                  isDone
                    ? (isDark ? 'bg-[#13131a]/60 border border-emerald-500/20' : 'bg-emerald-50/50 border border-emerald-200/50')
                    : (isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100 shadow-sm')
                }`}
              >
                {/* 光点头部 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                      光点 {index + 1}/{totalSpots}
                    </span>
                    {isDone && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
                        <CheckCircle2 size={8} /> 已完成
                      </span>
                    )}
                  </div>
                </div>

                {/* 光点内容 */}
                {isDone ? (
                  // 已完成状态
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                      {isCustom ? '✨' : (suggestion?.emoji || '✨')}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        {isCustom ? spot.customText : (suggestion?.main || '')}
                      </p>
                      <p className={`text-[11px] ${isDark ? 'text-emerald-400/60' : 'text-emerald-600/60'}`}>
                        谢谢你，这颗光点已经被你拾起
                      </p>
                    </div>
                  </div>
                ) : isCustom ? (
                  // 自定义任务
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'} shadow-sm`}>
                        ✨
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                          {spot.customText}
                        </p>
                        <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          这是你自己写下的光点
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDone(spot.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                          isDark ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25' : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <CheckCircle2 size={12} /> 完成
                      </button>
                      <button
                        onClick={() => handleClearCustom(spot.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                          isDark ? 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <RefreshCw size={12} /> 换成随机的
                      </button>
                    </div>
                  </div>
                ) : suggestion ? (
                  // 随机推荐任务
                  <div className="space-y-3">
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
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDone(spot.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                          isDark ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25' : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <CheckCircle2 size={12} /> 完成
                      </button>
                      <button
                        onClick={() => handleRefresh(spot.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                          isDark ? 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <RefreshCw size={12} /> 换一换
                      </button>
                      <button
                        onClick={() => {
                          setShowCustomInput(true);
                          setCustomText('');
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                          isDark ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <Plus size={12} /> 自己写
                      </button>
                    </div>
                  </div>
                ) : (
                  // 空状态 - 等待用户选择
                  <div className="space-y-3">
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      这颗光点还是空的，你想怎么填满它？
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRefresh(spot.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                          isDark ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25' : 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        <RefreshCw size={12} /> 随机一颗
                      </button>
                      <button
                        onClick={() => {
                          setShowCustomInput(true);
                          setCustomText('');
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                          isDark ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <Plus size={12} /> 自己写
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 底部添加按钮 */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleAddNewSpot}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all active:scale-95 ${
              isDark ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 hover:shadow-lg hover:shadow-indigo-500/20'
            }`}
          >
            <Plus size={16} /> 添加光点
          </button>
        </div>

        {/* 底部温馨语句 */}
        <div className={`p-4 rounded-2xl text-center ${isDark ? 'bg-[#171724]/50 border border-white/5' : 'bg-indigo-50/30 border border-indigo-100/50'}`}>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            明天醒来时，记得只是先睁开眼，剩下的慢慢来。
          </p>
        </div>

        {/* 自定义输入弹窗 */}
        {showCustomInput && (
          <Portal>
            <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowCustomInput(false)}>
              <div className={`w-full max-w-sm p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative`} onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowCustomInput(false)} className={`absolute top-4 right-4 p-1 rounded-full ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                  <X size={18} />
                </button>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>写下你的光点</h3>
                <textarea
                  className={`w-full p-4 rounded-2xl resize-none h-24 text-sm focus:outline-none transition-all ${
                    isDark ? 'bg-[#1f1f2e] text-gray-200 placeholder-gray-600 border border-gray-800' : 'bg-gray-50 text-gray-800 placeholder-gray-400 border border-gray-200'
                  }`}
                  placeholder="想为自己做一件什么事..."
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                />
                <button
                  onClick={() => {
                    const emptySpot = todaySpots.find(s => s.type === 'empty');
                    if (emptySpot && customText.trim()) {
                      handleAddCustom(emptySpot.id);
                    }
                  }}
                  disabled={!customText.trim()}
                  className={`w-full mt-4 py-3 rounded-2xl font-medium transition-all active:scale-95 ${
                    customText.trim()
                      ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : (isDark ? 'bg-[#1f1f2e] text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                  }`}
                >
                  添加光点
                </button>
              </div>
            </div>
          </Portal>
        )}

        {/* 历史记录弹窗 */}
        {showHistory && (
          <Portal>
            <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowHistory(false)}>
              <div className={`w-full max-w-sm max-h-[80vh] overflow-y-auto p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative`} onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowHistory(false)} className={`absolute top-4 right-4 p-1 rounded-full ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                  <X size={18} />
                </button>
                <h3 className={`text-lg font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>我的光点记录</h3>
                <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  你拾起的每一颗光点，都在这里发光
                </p>

                {(userData.tomorrowHistory || []).length === 0 ? (
                  <div className={`py-10 text-center text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    还没有拾起过光点，慢慢来
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(
                      (userData.tomorrowHistory || []).reduce((acc, item) => {
                        if (!acc[item.date]) acc[item.date] = [];
                        acc[item.date].push(item);
                        return acc;
                      }, {})
                    ).map(([date, items]) => (
                      <div key={date} className="space-y-2">
                        <p className={`text-[10px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{date}</p>
                        {items.map(item => (
                          <div key={item.id} className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'}`}>
                            <span className="text-lg">{item.emoji}</span>
                            <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Portal>
        )}
      </div>
    );
  };

  // === 渲染 ===
  return (
    <div className="animate-fade-in pb-10">
      {/* 三栏式导航：点击 / 高亮跟着滑动 */}
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
            {renderBrowse()}
          </div>
          <div className="shrink-0 px-4" style={{ width: `${100 / MODES.length}%` }}>
            {renderEmitAndMine()}
          </div>
          <div className="shrink-0 px-4" style={{ width: `${100 / MODES.length}%` }}>
            {renderTomorrow()}
          </div>
        </div>
      </div>

      {/* 粒子效果 */}
      {particles.map(p => (
        <div key={p.id} className="particle text-pink-500 z-50 flex items-center justify-center" style={{ left: p.x - 10, top: p.y - 10, '--tx': p.tx }}>
          <Heart size={20} fill="currentColor" />
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
