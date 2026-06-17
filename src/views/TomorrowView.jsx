/**
 * TomorrowView.jsx — "明日"板块（v4.47.19 上下结构优化版）
 *
 * 从左右分栏日记本 → 上下结构便条板：
 *   - 顶部：今日进度条 + 标题
 *   - 中部：今日便条（占主要空间，可点击完成）
 *   - 底部：昨日便条（弱化回顾）+ 添加按钮
 *   - 一屏可见，操作更自然
 */

import { useState, useRef, useEffect } from 'react';
import {
  X, BookOpen, Sparkles, Plus, CheckCircle2,
  Send, Footprints
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

  // 昨天的任务
  const yesterday = new Date(currentDateStr);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const yesterdayTasks = myTasks.filter(t => t.date === yesterdayStr);

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

  // === 星际足迹 ===
  const [showStarTrail, setShowStarTrail] = useState(false);

  // 今日进度
  const completedCount = todayTasks.filter(t => t.completed).length;
  const totalCount = todayTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

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
      {/* === 顶部栏 === */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-medium tracking-wide">明日</h1>
          <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {totalCount > 0 ? `${completedCount}/${totalCount} 已完成` : '还没有今日约定'}
          </p>
        </div>
        {/* 星际足迹入口 */}
        <button
          onClick={() => setShowStarTrail(true)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            isDark ? 'bg-[#171724] border border-white/10 hover:bg-[#1f1f2e]' : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
          }`}
        >
          <Footprints size={18} className={isDark ? 'text-sky-400' : 'text-sky-500'} />
        </button>
      </div>

      {/* === 今日进度条 === */}
      {totalCount > 0 && (
        <div className="px-1">
          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#1e1e30]' : 'bg-gray-100'}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* === 今日便条区 === */}
      <div
        className={`relative rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm overflow-hidden`}
      >
        <div className="p-5">
          {/* 日期标签 */}
          <div className="flex items-center justify-between mb-4">
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {new Date().getMonth() + 1}月{new Date().getDate()}日 · 今天
            </p>
            {completedCount > 0 && (
              <span className="text-[10px] text-emerald-400/70">
                已完成 {completedCount} 项
              </span>
            )}
          </div>

          {todayTasks.length > 0 ? (
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div
                  key={task.taskId}
                  onClick={() => handleToggleComplete(task.taskId)}
                  className={`relative p-4 rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${
                    task.completed
                      ? (isDark ? 'bg-[#1e1e30] border border-emerald-500/20' : 'bg-emerald-50/50 border border-emerald-200/60')
                      : (isDark ? 'bg-[#1e1e30] border border-white/5 hover:border-amber-400/20' : 'bg-gray-50 border border-gray-100 hover:border-amber-300/40')
                  }`}
                  style={{
                    boxShadow: task.completed
                      ? '0 0 16px rgba(16, 185, 129, 0.08)'
                      : '0 0 12px rgba(0,0,0,0.03)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* 完成状态圆圈 */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      task.completed
                        ? 'bg-emerald-500/20'
                        : (isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-300')
                    }`}>
                      {task.completed && <CheckCircle2 size={14} className="text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-relaxed ${
                        task.completed
                          ? (isDark ? 'text-gray-500 line-through' : 'text-gray-400 line-through')
                          : (isDark ? 'text-gray-200' : 'text-gray-700')
                      }`}>
                        {task.main}
                      </p>
                    </div>
                    <span className="text-lg shrink-0">{task.emoji}</span>
                  </div>
                </div>
              ))}

              {/* 再贴一张 */}
              {todayTasks.length < 5 && (
                <button
                  onClick={() => setShowTomorrowModal(true)}
                  className={`w-full py-3.5 rounded-2xl border border-dashed flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                    isDark ? 'border-white/5 hover:border-white/10' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Plus size={14} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                  <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>再贴一张</span>
                </button>
              )}
            </div>
          ) : (
            /* 空白状态 */
            <div className="flex flex-col items-center justify-center py-12">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-[#1e1e30]' : 'bg-gray-100'}`}>
                <Plus size={24} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
              </div>
              <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>今天还没有约定</p>
              <p className={`text-xs mb-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>写一张便条，给明天一个期待</p>
              <button
                onClick={() => setShowTomorrowModal(true)}
                className={`px-6 py-3 rounded-full text-sm transition-all active:scale-95 ${
                  isDark
                    ? 'bg-[#1e1e30] border border-white/10 text-gray-300 hover:bg-[#252538]'
                    : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                写一张便条
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === 昨日回顾（弱化）=== */}
      {yesterdayTasks.length > 0 && (
        <div className="px-1">
          <p className={`text-[10px] mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            昨天 · {yesterday.getMonth() + 1}月{yesterday.getDate()}日
          </p>
          <div className="space-y-2">
            {yesterdayTasks.map((task) => (
              <div
                key={task.taskId}
                className={`p-3 rounded-xl ${
                  task.completed
                    ? (isDark ? 'bg-[#1e1e30]/50 border border-emerald-500/10' : 'bg-emerald-50/30 border border-emerald-100/50')
                    : (isDark ? 'bg-[#1e1e30]/50 border border-white/5' : 'bg-gray-50/60 border border-gray-100')
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm opacity-50">{task.emoji}</span>
                  <p className={`text-xs leading-relaxed ${
                    task.completed
                      ? (isDark ? 'text-gray-600 line-through' : 'text-gray-400 line-through')
                      : (isDark ? 'text-gray-500' : 'text-gray-500')
                  }`}>
                    {task.main}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === 明日发布成功 Toast === */}
      {showTomorrowToast && (
        <Portal>
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowTomorrowToast(false)}>
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border ${isDark ? 'bg-[#171724] border-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'bg-white border-emerald-200 shadow-xl'}`} onClick={e => e.stopPropagation()}>
              <CheckCircle2 size={18} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
              <span className={`text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>便条已贴上</span>
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
                <h3 className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>写一张便条</h3>
                <button onClick={() => setShowTomorrowModal(false)} className={`p-1 rounded-full ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  <X size={20} />
                </button>
              </div>
              <div className="relative mb-4">
                <textarea
                  className={`w-full p-4 rounded-2xl resize-none min-h-[100px] text-sm focus:outline-none transition-all ${
                    isDark ? 'bg-[#1f1f2e] text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/30' : 'bg-gray-50 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400/30'
                  }`}
                  placeholder="写下今天想做的一件小事..."
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
                <Send size={18} className={tomorrowText.trim() ? 'animate-pulse' : ''} />贴上便条
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
              <p className={`text-xs mb-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择「仅自己可见」后，这个便条将仅保留在你的设备上。</p>
              <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>它不会进入公开便条池，也不会被他人看到。</p>
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
