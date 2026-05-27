/**
 * TreeholeView.jsx — "雷达"板块（v4.28.1 双Tab重构）
 *
 * 结构：
 *   顶部 Tab 切换：星海 / 明日
 *   Tab 1 — 星海：心语相关
 *     - 快速发射入口
 *     - 我的心语流
 *     - 星际回音（左右滑动）
 *   Tab 2 — 明日：任务相关
 *     - 添加明日约定
 *     - 我的今日清单
 *     - 热门约定（左右滑动）
 *     - 星际足迹入口
 */

import { useState, useEffect, useRef } from 'react';
import {
  Heart, X, Star, ChevronDown, Send,
  BookOpen, Sparkles, Plus, CheckCircle2,
  Edit3, Radio, Flame, Footprints
} from 'lucide-react';
import Portal from '../components/Portal.jsx';
import StarTrailView from './StarTrailView.jsx';
import MyWhispersView from './MyWhispersView.jsx';
import { MOCK_WHISPERS, PRESET_TAGS, TOMORROW_SUGGESTIONS } from '../constants.js';

const MODES = ['starsea', 'tomorrow'];
const MODE_LABELS = { starsea: '星海', tomorrow: '明日' };

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

  const isNewDay = userData.lastPostDate !== currentDateStr;
  const postsToday = isNewDay ? 0 : userData.dailyPosts;
  const postsLeft = Math.max(0, 5 - postsToday);
  const myWhispers = userData.myWhispers;
  const myTasks = userData.myTomorrowTasks;
  const todayTasks = myTasks.filter(t => t.date === currentDateStr);
  const taskFootprints = userData.taskFootprints;
  const followedList = userData.followedSuggestions;
  const userChallenges = userData.userChallenges;

  // === 弹窗 state ===
  const [showEmitModal, setShowEmitModal] = useState(false);
  const [showTomorrowModal, setShowTomorrowModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTomorrowPrivacyModal, setShowTomorrowPrivacyModal] = useState(false);

  // === 发射心语 state ===
  const [whisperText, setWhisperText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [showToast, setShowToast] = useState(false);

  // === 明日约定 state ===
  const [tomorrowText, setTomorrowText] = useState('');
  const [tomorrowVisibility, setTomorrowVisibility] = useState('public');
  const [showTomorrowToast, setShowTomorrowToast] = useState(false);

  // === 我的心语 state ===
  const [showMyWhispers, setShowMyWhispers] = useState(false);

  const [particles, setParticles] = useState([]);

  // === 热门约定 state ===
  const [hotIndex, setHotIndex] = useState(0);
  const hotScrollRef = useRef(null);

  // === 热门任务 state ===
  const [displayedSuggestions, setDisplayedSuggestions] = useState(() =>
    TOMORROW_SUGGESTIONS.map(s => ({ ...s, _instanceId: Math.random().toString(36).slice(2) }))
  );

  // === 星际足迹 ===
  const [showStarTrail, setShowStarTrail] = useState(false);

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
    setShowTomorrowToast(true);
  };

  const handleToggleComplete = (taskId) => {
    const task = myTasks.find(t => t.taskId === taskId && t.date === currentDateStr);
    if (!task) return;

    const newCompleted = !task.completed;
    const newTasks = myTasks.map(t => {
      if (t.taskId === taskId && t.date === currentDateStr) {
        return { ...t, completed: newCompleted };
      }
      return t;
    });

    let newFootprints = [...taskFootprints];
    if (newCompleted) {
      if (!newFootprints.some(f => f.taskId === taskId && f.date === currentDateStr)) {
        newFootprints.unshift({
          taskId: task.taskId,
          date: currentDateStr,
          emoji: task.emoji,
          main: task.main,
          sub: task.sub,
          source: task.source,
          completedAt: Date.now(),
        });
      }
    } else {
      newFootprints = newFootprints.filter(f => !(f.taskId === taskId && f.date === currentDateStr));
    }

    saveUserData({
      ...userData,
      myTomorrowTasks: newTasks,
      taskFootprints: newFootprints,
    });
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

    const followPatch = {
      totalFollows: userData.totalFollows + 1,
      followedSuggestions: [...followedList, taskId],
      myTomorrowTasks: [...myTasks, newTask],
    };

    if (onFollow) {
      onFollow(taskId, followPatch);
    } else {
      saveUserData({ ...userData, ...followPatch });
    }
  };

  const isFollowed = (challengeId) => {
    return todayTasks.some(t => t.taskId === challengeId);
  };

  const getStableFollowCount = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 80) + 20;
  };

  const myChallengeTasks = userChallenges.map(c => ({
    _instanceId: c.id,
    id: c.id,
    emoji: c.emoji,
    main: c.main,
    sub: c.sub,
    source: 'user',
    isMyChallenge: true,
    followCount: (c.followers || []).length,
    date: c.date,
  }));

  const systemTasks = displayedSuggestions.map(s => ({
    ...s,
    source: 'system',
    isMyChallenge: false,
    followCount: getStableFollowCount(s.id),
  }));

  const hotTasks = [...myChallengeTasks, ...systemTasks];

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

  // === 星际足迹子界面 ===
  if (showStarTrail) {
    return (
      <StarTrailView
        isDark={isDark}
        userData={userData}
        onClose={() => {
          setShowStarTrail(false);
          setMode('tomorrow');
        }}
      />
    );
  }

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

  // === 渲染：星海 Tab ===
  const renderStarSea = () => (
    <div className="space-y-5">
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
          {myWhispers.length > 0 && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-pink-500/10 text-pink-400' : 'bg-pink-50 text-pink-600'}`}>
              {myWhispers.length}
            </span>
          )}
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
          className="relative max-h-[440px] overflow-hidden -mx-5 px-5"
          style={{ overflowY: 'scroll' }}
        >
          <div className="pb-4">
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
    </div>
  );

  // === 渲染：明日 Tab ===
  const renderTomorrow = () => (
    <div className="space-y-5">
      {/* 添加明日约定 */}
      <div
        onClick={() => setShowTomorrowModal(true)}
        className={`p-5 rounded-[24px] border cursor-pointer transition-all active:scale-[0.98] ${
          isDark ? 'bg-[#171724] border-white/5 hover:bg-[#1a1a2e]' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-100'}`}>
            <Plus size={24} className={isDark ? 'text-emerald-300' : 'text-emerald-500'} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>添加明日约定</p>
            <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>给自己定一个小目标</p>
          </div>
        </div>
      </div>

      {/* 星际足迹入口 */}
      {taskFootprints.length > 0 && (
        <div
          onClick={() => setShowStarTrail(true)}
          className={`p-5 rounded-[24px] cursor-pointer transition-all active:scale-[0.98] ${
            isDark ? 'bg-[#171724] border border-white/5 hover:bg-[#1a1a2e]' : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-100'}`}>
                <Footprints size={24} className={isDark ? 'text-emerald-300' : 'text-emerald-500'} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>星际足迹</p>
                <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>查看你的任务完成记录</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
                {taskFootprints.length} 个
              </span>
              <ChevronDown size={16} className={`rotate-[-90deg] ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>
      )}

      {/* 我的今日清单 */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
            <h3 className="text-sm font-medium">今日清单</h3>
          </div>
          {todayTasks.length > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
              {todayTasks.filter(t => t.completed).length}/{todayTasks.length}
            </span>
          )}
        </div>

        {todayTasks.length > 0 ? (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div
                key={task.taskId}
                className={`p-3 rounded-[16px] border flex items-center gap-3 ${
                  task.completed
                    ? (isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/30 border-emerald-200/50')
                    : (isDark ? 'bg-[#1f1f2e] border-white/5' : 'bg-gray-50 border-gray-100')
                }`}
              >
                <button
                  onClick={() => handleToggleComplete(task.taskId)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                    task.completed
                      ? (isDark ? 'bg-emerald-500 border-emerald-500' : 'bg-emerald-500 border-emerald-500')
                      : (isDark ? 'border-gray-600 hover:border-emerald-500' : 'border-gray-300 hover:border-emerald-400')
                  }`}
                >
                  {task.completed && <CheckCircle2 size={14} className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${task.completed ? (isDark ? 'text-emerald-300 line-through opacity-60' : 'text-emerald-600 line-through opacity-60') : (isDark ? 'text-gray-200' : 'text-gray-700')}`}>
                    {task.main}
                  </p>
                </div>
                <span className="text-lg shrink-0">{task.emoji}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-xs text-center py-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            还没有今日约定，点击上方添加
          </p>
        )}
      </div>

      {/* 热门约定 — 垂直滑动卡片堆叠 */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame size={16} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
            <h3 className="text-sm font-medium">热门约定</h3>
          </div>
        </div>

        <div
          ref={hotScrollRef}
          className="relative h-[200px] overflow-hidden -mx-5 px-5"
          onScroll={(e) => {
            const container = e.currentTarget;
            const scrollTop = container.scrollTop;
            const cardHeight = 160 + 16;
            const newIndex = Math.round(scrollTop / cardHeight);
            if (newIndex !== hotIndex && newIndex >= 0 && newIndex < hotTasks.length) {
              setHotIndex(newIndex);
            }
          }}
          style={{ scrollSnapType: 'y mandatory', overflowY: 'scroll' }}
        >
          <div className="py-[40px]">
            {hotTasks.map((challenge, index) => {
              const isActive = index === hotIndex;
              const followed = isFollowed(challenge.id);
              const isMine = challenge.isMyChallenge;
              return (
                <div
                  key={challenge._instanceId}
                  className="mb-4"
                  style={{ scrollSnapAlign: 'center' }}
                >
                  <div
                    className={`relative h-[160px] p-5 rounded-[24px] border overflow-hidden transition-all duration-500 ${
                      isDark ? 'bg-[#171724]/70 border-white/5' : 'bg-white border-gray-100 shadow-sm'
                    } ${isActive ? 'shadow-lg scale-100 opacity-100' : 'shadow-sm scale-90 opacity-40 blur-[2px]'}`}
                  >
                    <div className="flex items-start gap-3 mb-3 relative z-10">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isDark ? 'bg-[#171724]' : 'bg-white'} shadow-sm shrink-0`}>
                        {challenge.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                          {challenge.main}
                        </p>
                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {challenge.sub}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between relative z-10">
                      <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Flame size={10} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} /> {challenge.followCount} 人跟随
                      </span>
                      {isMine ? (
                        <span className={`text-[10px] px-2 py-1 rounded-full ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-600'}`}>
                          你发布的
                        </span>
                      ) : (
                        <button
                          onClick={() => followed ? null : handleFollowTask(challenge)}
                          disabled={followed}
                          className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all active:scale-95 ${
                            followed
                              ? (isDark ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200')
                              : (isDark ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50')
                          }`}
                        >
                          {followed ? '已跟随' : '跟随'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 底部温馨语句 */}
      <div className={`p-4 rounded-2xl text-center ${isDark ? 'bg-[#171724]/50 border border-white/5' : 'bg-emerald-50/30 border border-emerald-100/50'}`}>
        <p className={`text-[11px] leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          明天醒来时，记得只是先睁开眼，剩下的慢慢来。
        </p>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in pb-10 relative">
      {/* 双栏导航 */}
      <div className="flex justify-center mb-6">
        <div className={`flex p-1 rounded-full w-full max-w-[280px] ${isDark ? 'bg-[#171724]' : 'bg-gray-200/50'}`}>
          {MODES.map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors ${
                mode === m
                  ? (isDark ? 'bg-[#1f1f2e] text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm')
                  : 'text-gray-400'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="space-y-5">
        {mode === 'starsea' ? renderStarSea() : renderTomorrow()}
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

      {/* === 明日发布成功 Toast === */}
      {showTomorrowToast && (
        <Portal>
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowTomorrowToast(false)}>
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border ${isDark ? 'bg-[#171724] border-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'bg-white border-emerald-200 shadow-xl'}`} onClick={e => e.stopPropagation()}>
              <CheckCircle2 size={18} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
              <span className={`text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>明日约定已立下</span>
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

      {/* === 明日约定弹窗 === */}
      {showTomorrowModal && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-end ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowTomorrowModal(false)}>
            <div className={`w-full p-6 rounded-t-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative`} style={{ maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-center mb-4">
                <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>明日约定</h3>
                <button onClick={() => setShowTomorrowModal(false)} className={`p-1 rounded-full ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  <X size={20} />
                </button>
              </div>
              <div className="relative mb-4">
                <textarea
                  className={`w-full p-4 rounded-2xl resize-none min-h-[100px] text-sm focus:outline-none transition-all ${
                    isDark ? 'bg-[#1f1f2e] text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/30' : 'bg-gray-50 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400/30'
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
              <div className="flex justify-between items-center mb-6">
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>可见度</span>
                <div className={`flex p-1 rounded-full ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-100'}`}>
                  <button onClick={() => { if (tomorrowVisibility === 'private') setTomorrowVisibility('public'); }} className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${tomorrowVisibility === 'public' ? (isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white text-emerald-600 shadow-sm') : 'text-gray-400'}`}>
                    <Sparkles size={10} className="inline mr-1" />公开
                  </button>
                  <button onClick={() => { if (tomorrowVisibility === 'public') setShowTomorrowPrivacyModal(true); }} className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${tomorrowVisibility === 'private' ? (isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white text-emerald-600 shadow-sm') : 'text-gray-400'}`}>
                    <BookOpen size={10} className="inline mr-1" />仅自己可见
                  </button>
                </div>
              </div>
              <button
                onClick={handlePublishTomorrow}
                disabled={!tomorrowText.trim()}
                className={`w-full py-3.5 rounded-2xl font-medium tracking-wider transition-all flex items-center justify-center gap-2 ${
                  tomorrowText.trim()
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 active:scale-[0.98]'
                    : (isDark ? 'bg-[#1f1f2e] text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                }`}
              >
                <Send size={18} className={tomorrowText.trim() ? 'animate-pulse' : ''} />发布
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

      {showTomorrowPrivacyModal && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowTomorrowPrivacyModal(false)}>
            <div className={`w-full max-w-xs p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative text-center`} onClick={e => e.stopPropagation()}>
              <div className="mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                <BookOpen size={24} />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>仅自己可见</h3>
              <p className={`text-xs mb-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择「仅自己可见」后，这个任务将仅保留在你的设备上。</p>
              <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>它不会进入公开任务池，也不会被他人看到。</p>
              <div className="flex gap-3">
                <button onClick={() => setShowTomorrowPrivacyModal(false)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-[#1f1f2e] hover:bg-[#262638] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>取消</button>
                <button onClick={() => { setTomorrowVisibility('private'); setShowTomorrowPrivacyModal(false); }} className={`flex-1 py-3 rounded-xl text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-lg shadow-emerald-500/20 active:scale-95`}>确认</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

    </div>
  );
}
