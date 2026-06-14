/**
 * TomorrowView.jsx — "明日"板块
 *
 * 从原 TreeholeView 拆分出来的独立视图。
 * 包含：添加明日约定、今日清单、热门约定、星际足迹。
 */

import { useState, useRef } from 'react';
import {
  X, Star, BookOpen, Sparkles, Plus, CheckCircle2,
  Send, Flame, Footprints
} from 'lucide-react';
import Portal from '../components/Portal.jsx';
import StarTrailView from './StarTrailView.jsx';
import { TOMORROW_SUGGESTIONS } from '../constants.js';

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

export default function TomorrowView({
  isDark,
  userData,
  saveUserData,
  currentDateStr,
  onFollow,
}) {
  const myTasks = userData.myTomorrowTasks;
  const todayTasks = myTasks.filter(t => t.date === currentDateStr);
  const taskFootprints = userData.taskFootprints;
  const followedList = userData.followedSuggestions;
  const userChallenges = userData.userChallenges;

  // === 弹窗 state ===
  const [showTomorrowModal, setShowTomorrowModal] = useState(false);
  const [showTomorrowPrivacyModal, setShowTomorrowPrivacyModal] = useState(false);

  // === 明日约定 state ===
  const [tomorrowText, setTomorrowText] = useState('');
  const [tomorrowVisibility, setTomorrowVisibility] = useState('public');
  const [showTomorrowToast, setShowTomorrowToast] = useState(false);

  // === 热门任务 state ===
  const [displayedSuggestions, setDisplayedSuggestions] = useState(() =>
    TOMORROW_SUGGESTIONS.map(s => ({ ...s, _instanceId: Math.random().toString(36).slice(2) }))
  );

  // === 星际足迹 ===
  const [showStarTrail, setShowStarTrail] = useState(false);

  const [hotIndex, setHotIndex] = useState(0);
  const hotScrollRef = useRef(null);

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
        onClose={() => setShowStarTrail(false)}
      />
    );
  }

  return (
    <div className="animate-fade-in pb-10 space-y-5">
      {/* 左右并排：添加明日约定 + 星际足迹 */}
      <div className="flex gap-3">
        {/* 左边：添加明日约定 */}
        <div
          onClick={() => setShowTomorrowModal(true)}
          className={`flex-1 p-4 rounded-[20px] border cursor-pointer transition-all active:scale-[0.98] ${
            isDark ? 'bg-[#171724] border-white/5 hover:bg-[#1a1a2e]' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-100'}`}>
              <Plus size={20} className={isDark ? 'text-emerald-300' : 'text-emerald-500'} />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>添加明日约定</p>
              <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>给自己定一个小目标</p>
            </div>
          </div>
        </div>

        {/* 右边：星际足迹入口 */}
        <div
          onClick={() => setShowStarTrail(true)}
          className={`w-[80px] rounded-[20px] border cursor-pointer transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-1 ${
            isDark ? 'bg-[#171724] border-white/5 hover:bg-[#1a1a2e]' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
          }`}
        >
          <Footprints size={20} className={isDark ? 'text-emerald-300' : 'text-emerald-500'} />
          <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>星际足迹</span>
        </div>
      </div>

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
          <div
            className="relative max-h-[220px] overflow-hidden -mx-5 px-5"
            style={{ overflowY: 'scroll' }}
          >
            <div className="py-4 space-y-2">
              {todayTasks.map((task) => (
                <div
                  key={task.taskId}
                  className={`p-3 rounded-[16px] border flex items-center gap-3 ${
                    task.completed
                      ? (isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/30 border-emerald-200/50')
                      : (isDark ? 'bg-[#1f1f2e] border-white/5' : 'bg-gray-50 border-gray-100')
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${task.completed ? (isDark ? 'text-emerald-300 line-through opacity-60' : 'text-emerald-600 line-through opacity-60') : (isDark ? 'text-gray-200' : 'text-gray-700')}`}>
                      {task.main}
                    </p>
                  </div>
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
                </div>
              ))}
            </div>
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
          className="relative max-h-[420px] overflow-hidden -mx-5 px-5"
          onScroll={(e) => {
            const container = e.currentTarget;
            const scrollTop = container.scrollTop;
            const cardHeight = 160 + 16;
            const newIndex = Math.round(scrollTop / cardHeight);
            if (newIndex !== hotIndex && newIndex >= 0 && newIndex < hotTasks.length) {
              setHotIndex(newIndex);
            }
          }}
          style={{ overflowY: 'scroll' }}
        >
          <div className="py-4">
            {hotTasks.map((challenge, index) => {
              const isActive = index === hotIndex;
              const followed = isFollowed(challenge.id);
              const isMine = challenge.isMyChallenge;
              return (
                <div
                  key={challenge._instanceId}
                  className="mb-3"
                >
                  <div
                    className={`relative p-4 rounded-[20px] border overflow-hidden transition-all duration-500 ${
                      isDark ? 'bg-[#171724]/70 border-white/5' : 'bg-white border-gray-100 shadow-sm'
                    } ${isActive ? 'shadow-lg scale-100 opacity-100' : 'shadow-sm scale-95 opacity-50'}`}
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
