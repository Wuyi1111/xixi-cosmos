/**
 * TomorrowView.jsx — "明日"板块（v4.47.2 日记本摊开版）
 *
 * 中央是一本摊开的日记本，悬浮在星空中：
 *   - 左页：昨天的便条（微微发光的小纸条）
 *   - 右页：今天的空白页，等待贴上新的便条
 *   - 两页之间：极细微光粒子带
 *   - 边缘凸出小标签
 *   - 底部"写一张"按钮
 */

import { useState, useRef, useEffect } from 'react';
import {
  X, BookOpen, Sparkles, Plus, CheckCircle2,
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
    <div className="animate-fade-in pb-10 relative min-h-[calc(100vh-8rem)]">
      {/* === 顶部栏 === */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h1 className="text-xl font-medium tracking-wide">明日</h1>
          <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {todayTasks.length} 个今日约定
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

      {/* === 日记本主体 === */}
      <div className="relative mx-auto px-2">
        {/* 日记本封面/容器 */}
        <div
          className={`relative rounded-3xl overflow-hidden ${
            isDark ? 'bg-[#161622]' : 'bg-[#1a1a2e]'
          }`}
          style={{
            boxShadow: '0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          {/* 日记本内页区域 */}
          <div className="flex relative" style={{ minHeight: '480px' }}>
            {/* === 左页：昨天的便条 === */}
            <div className="flex-1 p-4 relative">
              {/* 页面纹理 - 淡淡的横线 */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: 'linear-gradient(transparent 23px, rgba(255,255,255,0.02) 24px)',
                  backgroundSize: '100% 24px',
                }}
              />

              {/* 左页标签 */}
              <div className="absolute -left-2.5 top-10">
                <div
                  className={`px-2.5 py-2 rounded-r-lg text-[10px] ${
                    isDark ? 'bg-[#252538] text-gray-500' : 'bg-[#252538] text-gray-500'
                  }`}
                  style={{ writingMode: 'vertical-rl' }}
                >
                  昨天
                </div>
              </div>

              {/* 左页内容 */}
              <div className="relative z-10">
                <p className={`text-[10px] mb-3 ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
                  {yesterday.getMonth() + 1}月{yesterday.getDate()}日
                </p>

                {yesterdayTasks.length > 0 ? (
                  <div className="space-y-3">
                    {yesterdayTasks.map((task) => (
                      <div
                        key={task.taskId}
                        className={`relative p-3.5 rounded-xl transition-all ${
                          task.completed
                            ? 'bg-[#1e1e30] border-l-[3px] border-emerald-500/30'
                            : 'bg-[#1e1e30] border-l-[3px] border-amber-400/20'
                        }`}
                        style={{
                          transform: `rotate(${-1 + Math.random() * 2}deg)`,
                          boxShadow: task.completed
                            ? '0 0 16px rgba(16, 185, 129, 0.1)'
                            : '0 0 16px rgba(251, 191, 36, 0.06)',
                        }}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-sm shrink-0">{task.emoji}</span>
                          <p className={`text-xs leading-relaxed ${
                            task.completed
                              ? 'text-gray-500 line-through'
                              : 'text-gray-400'
                          }`}>
                            {task.main}
                          </p>
                        </div>
                        {task.completed && (
                          <div className="absolute -top-1.5 -right-1.5">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <CheckCircle2 size={12} className="text-emerald-400" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 opacity-30">
                    <div className="w-16 h-px bg-gray-600 mb-3" />
                    <p className="text-xs text-gray-600">昨天没有留下便条</p>
                  </div>
                )}
              </div>
            </div>

            {/* === 中央微光粒子带 === */}
            <div className="relative w-px flex-shrink-0">
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, transparent, rgba(251,191,36,0.15) 20%, rgba(251,191,36,0.1) 50%, rgba(251,191,36,0.15) 80%, transparent)',
                }}
              />
              {/* 缓慢上升的光点 */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="animate-particle-rise w-full h-full relative">
                  <div className="absolute w-0.5 h-0.5 rounded-full bg-amber-400/60" style={{ left: '50%', top: '80%', animationDelay: '0s' }} />
                  <div className="absolute w-0.5 h-0.5 rounded-full bg-amber-400/40" style={{ left: '30%', top: '60%', animationDelay: '1.5s' }} />
                  <div className="absolute w-0.5 h-0.5 rounded-full bg-amber-400/50" style={{ left: '70%', top: '40%', animationDelay: '3s' }} />
                </div>
              </div>
            </div>

            {/* === 右页：今天的空白页 === */}
            <div className="flex-1 p-4 relative">
              {/* 页面纹理 */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: 'linear-gradient(transparent 23px, rgba(255,255,255,0.02) 24px)',
                  backgroundSize: '100% 24px',
                }}
              />

              {/* 右页标签 */}
              <div className="absolute -right-2.5 top-10">
                <div
                  className={`px-2.5 py-2 rounded-l-lg text-[10px] ${
                    isDark ? 'bg-[#1e1e30] text-amber-400/60' : 'bg-[#1e1e30] text-amber-400/60'
                  }`}
                  style={{ writingMode: 'vertical-rl' }}
                >
                  今天
                </div>
              </div>

              {/* 右页内容 */}
              <div className="relative z-10">
                <p className={`text-[10px] mb-3 ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
                  {new Date().getMonth() + 1}月{new Date().getDate()}日
                </p>

                {todayTasks.length > 0 ? (
                  <div className="space-y-3">
                    {todayTasks.map((task) => (
                      <div
                        key={task.taskId}
                        className={`relative p-3.5 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                          task.completed
                            ? 'bg-[#1e1e30] border-l-[3px] border-emerald-500/30'
                            : 'bg-[#1e1e30] border-l-[3px] border-white/5 hover:border-amber-400/20'
                        }`}
                        style={{
                          transform: `rotate(${-0.5 + Math.random() * 1}deg)`,
                          boxShadow: task.completed
                            ? '0 0 16px rgba(16, 185, 129, 0.1)'
                            : '0 0 12px rgba(255,255,255,0.03)',
                        }}
                        onClick={() => handleToggleComplete(task.taskId)}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-sm shrink-0">{task.emoji}</span>
                          <p className={`text-xs leading-relaxed ${
                            task.completed
                              ? 'text-gray-500 line-through'
                              : 'text-gray-300'
                          }`}>
                            {task.main}
                          </p>
                        </div>
                        {task.completed && (
                          <div className="absolute -top-1.5 -right-1.5">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <CheckCircle2 size={12} className="text-emerald-400" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-14">
                    {/* 空白页提示 */}
                    <div className="relative">
                      <div className="w-20 h-px bg-gray-700/50 mb-3" />
                      <div className="w-14 h-px bg-gray-700/30 mb-3 ml-3" />
                      <div className="w-18 h-px bg-gray-700/40 mb-8 ml-1" />
                    </div>
                    <p className="text-xs text-gray-600 mb-1">今天还是空白页</p>
                    <p className="text-xs text-gray-700">贴一张便条吧</p>
                    {/* 闪烁光标 */}
                    <div className="mt-5 w-0.5 h-4 bg-amber-400/40 animate-pulse" />
                  </div>
                )}

                {/* 添加便条占位区 */}
                {todayTasks.length > 0 && todayTasks.length < 5 && (
                  <button
                    onClick={() => setShowTomorrowModal(true)}
                    className="w-full mt-4 py-3.5 rounded-xl border border-dashed border-white/5 flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:border-white/10"
                  >
                    <Plus size={14} className="text-gray-600" />
                    <span className="text-xs text-gray-600">再贴一张</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === 底部"写一张"按钮 === */}
      <div className="flex justify-center mt-10">
        <button
          onClick={() => setShowTomorrowModal(true)}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-full text-sm transition-all active:scale-95 ${
            isDark
              ? 'bg-[#1e1e30] border border-white/5 text-gray-400 hover:bg-[#252538] hover:text-gray-300'
              : 'bg-[#1e1e30] border border-white/5 text-gray-400 hover:bg-[#252538]'
          }`}
        >
          <Plus size={16} />
          <span>写一张</span>
        </button>
      </div>

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
