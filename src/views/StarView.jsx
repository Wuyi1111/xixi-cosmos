/**
 * StarView.jsx — "归星"板块（v4.25.0 仪式驱动型重构）
 *
 * 页面结构：
 *   1) 顶部精简个人信息：头像 + 名字 + 设置
 *   2) 今日状态卡片：今晚归星状态 / 连续天数 / 心情
 *   3) 归星仪式入口：大按钮，点击进入全屏仪式
 *   4) 夜声配置：仪式前的声音选择
 *   5) 成就徽章墙：累积夜晚 / 传递温暖 / 同行者
 *   6) 底部：心愿池独立入口
 */

import { useState, useEffect, useRef } from 'react';
import { Settings, Sparkles, Moon, Heart, Users, Play, Pause, Wind, ChevronRight, X, CheckCircle2, Award, Flame, Music } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import SettingsPanel from './SettingsPanel.jsx';
import WishPoolView from './WishPoolView.jsx';
import { INITIAL_USER_DATA } from '../constants.js';
import { computeStreakInfo } from '../utils.js';

const NIGHT_SOUNDS = [
  { id: 'rain', name: '星河雨声', desc: '柔和雨声，适合放松入眠' },
  { id: 'wind', name: '深空风声', desc: '低频风声，适合安静沉淀' },
  { id: 'wave', name: '月海潮汐', desc: '海浪声，适合缓慢呼吸' },
  { id: 'cloud', name: '云层轻响', desc: '轻柔环境声，适合浅睡前放松' },
  { id: 'fire', name: '篝火星光', desc: '微弱火焰声，适合安全感场景' },
  { id: 'forest', name: '森林夜航', desc: '夜晚虫鸣和森林环境声' },
  { id: 'cabin', name: '舱内白噪', desc: '稳定低频白噪音，适合屏蔽干扰' },
  { id: 'silent', name: '静默星空', desc: '近乎无声，只保留极轻环境底噪' },
];

const SLEEP_POSES = [
  { id: 'gaze', name: '仰望星空', emoji: '🌠', desc: '躺在星球上，看星河从眼前流过' },
  { id: 'side', name: '侧卧星河', emoji: '🌙', desc: '侧身沉入星河，让星光从背后淌过' },
  { id: 'curl', name: '云朵蜷睡', emoji: '☁️', desc: '像一朵云那样，把自己轻轻卷起来' },
  { id: 'hug', name: '抱星入眠', emoji: '⭐', desc: '怀里抱着一颗温柔的星，慢慢睡去' },
  { id: 'float', name: '自由漂浮', emoji: '🌌', desc: '什么都不抓，只是漂浮在宇宙里' },
  { id: 'small', name: '小行星趴睡', emoji: '🪐', desc: '趴在一颗小行星上，听它缓慢自转' },
];

// 成就徽章定义
const BADGES = [
  { id: 'nights_7', name: '7夜行者', desc: '连续归星7天', icon: Moon, minDays: 7, color: 'indigo' },
  { id: 'nights_30', name: '月度星旅', desc: '连续归星30天', icon: Moon, minDays: 30, color: 'amber' },
  { id: 'hugs_10', name: '温暖使者', desc: '传递温暖10次', icon: Heart, minHugs: 10, color: 'pink' },
  { id: 'hugs_50', name: '光之传递', desc: '传递温暖50次', icon: Heart, minHugs: 50, color: 'rose' },
  { id: 'follows_5', name: '同行者', desc: '跟随5个任务', icon: Users, minFollows: 5, color: 'cyan' },
  { id: 'follows_20', name: '星际伙伴', desc: '跟随20个任务', icon: Users, minFollows: 20, color: 'blue' },
];

export default function StarView({ isDark, theme, setTheme, userData, saveUserData, setUserData, currentDateStr }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showWishPool, setShowWishPool] = useState(false);

  // 夜声状态
  const [selectedSound, setSelectedSound] = useState(NIGHT_SOUNDS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  // 归星仪式状态
  const [selectedPose, setSelectedPose] = useState(SLEEP_POSES[0]);
  const [showRitual, setShowRitual] = useState(false);
  const [ritualPhase, setRitualPhase] = useState('select');
  const [breathPhase, setBreathPhase] = useState('inhale');
  const ritualTimersRef = useRef([]);
  const ritualActiveRef = useRef(false);

  const clearRitualTimers = () => {
    ritualTimersRef.current.forEach(id => clearTimeout(id));
    ritualTimersRef.current = [];
  };

  // 连续夜晚显示
  const { lastCheckInDate, hasCheckedInToday, displayContinuousDays } =
    computeStreakInfo(userData, currentDateStr);

  // 夜声播放（模拟）
  const togglePlay = () => setIsPlaying(!isPlaying);

  // 调息动画
  const startBreathing = () => {
    clearRitualTimers();
    ritualActiveRef.current = true;
    setRitualPhase('breathing');
    setBreathPhase('inhale');

    let cycle = 0;
    const runCycle = () => {
      if (!ritualActiveRef.current) return;
      setBreathPhase('inhale');
      const t1 = setTimeout(() => {
        if (!ritualActiveRef.current) return;
        setBreathPhase('hold');
        const t2 = setTimeout(() => {
          if (!ritualActiveRef.current) return;
          setBreathPhase('exhale');
          const t3 = setTimeout(() => {
            if (!ritualActiveRef.current) return;
            cycle++;
            if (cycle < 3) {
              runCycle();
            } else {
              completeRitual();
            }
          }, 3000);
          ritualTimersRef.current.push(t3);
        }, 2000);
        ritualTimersRef.current.push(t2);
      }, 3000);
      ritualTimersRef.current.push(t1);
    };
    runCycle();
  };

  const completeRitual = () => {
    if (!ritualActiveRef.current) return;
    if (hasCheckedInToday) {
      ritualActiveRef.current = false;
      clearRitualTimers();
      setRitualPhase('already-completed');
      return;
    }
    ritualActiveRef.current = false;
    clearRitualTimers();
    setRitualPhase('complete');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = lastCheckInDate === yesterday.toDateString();
    const newContinuousDays = isConsecutive ? userData.continuousDays + 1 : 1;
    const streakBonus = isConsecutive ? Math.min((newContinuousDays - 1) * 2, 10) : 0;
    const earned = 10 + streakBonus;

    const today = new Date();
    const hours = today.getHours().toString().padStart(2, '0');
    const minutes = today.getMinutes().toString().padStart(2, '0');

    const newEntry = {
      id: Date.now(),
      date: currentDateStr,
      timeStr: `${hours}:${minutes}`,
      timestamp: Date.now(),
      moodId: 'ritual',
      moodName: '归星仪式',
      whisper: `通过「${selectedPose?.name || '归星'}」完成今晚的睡前仪式`,
      stardustEarned: earned,
      isFirstCheckIn: userData.checkInHistory.length === 0,
      triggeredBy: 'ritual',
      poseId: selectedPose?.id,
    };

    saveUserData({
      ...userData,
      totalDays: userData.totalDays + 1,
      continuousDays: newContinuousDays,
      stardust: userData.stardust + earned,
      checkInHistory: [newEntry, ...userData.checkInHistory],
    });
  };

  const closeRitual = () => {
    ritualActiveRef.current = false;
    clearRitualTimers();
    setShowRitual(false);
    setRitualPhase('select');
    setBreathPhase('inhale');
  };

  useEffect(() => {
    return () => {
      ritualActiveRef.current = false;
      clearRitualTimers();
    };
  }, []);

  // 计算已解锁的徽章
  const unlockedBadges = BADGES.filter(badge => {
    if (badge.minDays && displayContinuousDays >= badge.minDays) return true;
    if (badge.minHugs && userData.totalHugs >= badge.minHugs) return true;
    if (badge.minFollows && userData.totalFollows >= badge.minFollows) return true;
    return false;
  });

  const totalBadges = BADGES.length;

  if (showSettings) {
    return (
      <SettingsPanel
        isDark={isDark}
        theme={theme}
        setTheme={setTheme}
        userData={userData}
        saveUserData={saveUserData}
        onClose={() => setShowSettings(false)}
        onReset={() => {
          setUserData({ ...INITIAL_USER_DATA });
          setShowSettings(false);
        }}
      />
    );
  }

  if (showWishPool) {
    return (
      <div className="animate-fade-in pb-10">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowWishPool(false)}
            className={`p-2 rounded-full ${isDark ? 'bg-[#171724] text-gray-400' : 'bg-white text-gray-500 shadow-sm'}`}
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <h2 className="text-lg font-medium">心愿池</h2>
        </div>
        <WishPoolView isDark={isDark} userData={userData} saveUserData={saveUserData} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10 space-y-5">
      {/* === 1. 顶部精简个人信息 === */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${isDark ? 'bg-[#171724] border border-indigo-500/20' : 'bg-white shadow-sm border border-indigo-100'}`}>
            {userData.avatarEmoji || '🪐'}
          </div>
          <div>
            <h2 className="text-base font-medium">{userData.displayName || '星星旅人'}</h2>
            <div className="flex items-center gap-1">
              <Moon size={10} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
              <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                连续 {displayContinuousDays} 夜
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className={`p-2 rounded-full ${isDark ? 'bg-[#171724] text-gray-400' : 'bg-white text-gray-500 shadow-sm'}`}
        >
          <Settings size={18} />
        </button>
      </div>

      {/* === 2. 今日状态卡片 === */}
      <div className={`p-5 rounded-[24px] relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#171724] border border-indigo-500/15' : 'bg-gradient-to-br from-indigo-50/70 to-white border border-indigo-100'}`}>
        <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full bg-indigo-300/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-6 w-24 h-24 rounded-full bg-purple-300/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>今晚状态</p>
              <h3 className={`text-lg font-medium ${hasCheckedInToday ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-indigo-300' : 'text-indigo-600')}`}>
                {hasCheckedInToday ? '已归星' : '尚未归星'}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hasCheckedInToday ? (isDark ? 'bg-emerald-500/15' : 'bg-emerald-50') : (isDark ? 'bg-indigo-500/15' : 'bg-indigo-50')}`}>
              {hasCheckedInToday ? (
                <CheckCircle2 size={24} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
              ) : (
                <Moon size={24} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Flame size={12} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
              <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                连续 {displayContinuousDays} 天
              </span>
            </div>
            <div className={`w-px h-3 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
              <span className={`text-xs font-medium ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                {userData.stardust} 星尘
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* === 3. 归星仪式入口 === */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        <div className="flex items-center gap-2 mb-3">
          <Moon size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
          <h3 className="text-sm font-medium">睡前归星仪式</h3>
        </div>

        {/* 睡姿快速选择 */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          {SLEEP_POSES.map((pose) => (
            <button
              key={pose.id}
              onClick={() => setSelectedPose(pose)}
              className={`p-2 rounded-xl text-center transition-all active:scale-95 ${
                selectedPose?.id === pose.id
                  ? (isDark ? 'bg-indigo-500/15 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200')
                  : (isDark ? 'bg-[#1f1f2e] border border-transparent' : 'bg-gray-50 border border-transparent')
              }`}
            >
              <span className="text-xl block">{pose.emoji}</span>
            </button>
          ))}
        </div>

        {/* 选中睡姿描述 */}
        <div className={`p-3 rounded-xl mb-4 text-center ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'}`}>
          <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="font-medium">{selectedPose.name}</span>
            <span className={`text-[10px] ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{selectedPose.desc}</span>
          </p>
        </div>

        {/* 夜声配置 */}
        <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'}`}>
          <Music size={14} className={isDark ? 'text-cyan-400' : 'text-cyan-500'} />
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>伴眠夜声</p>
            <p className="text-xs font-medium">{selectedSound.name}</p>
          </div>
          <button
            onClick={togglePlay}
            className={`p-1.5 rounded-full transition-all active:scale-95 ${
              isPlaying
                ? (isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-600')
                : (isDark ? 'bg-white/5 text-gray-400' : 'bg-white text-gray-500 shadow-sm')
            }`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={() => setShowSoundPicker(true)}
            className={`p-1.5 rounded-full transition-all active:scale-95 ${isDark ? 'bg-white/5 text-gray-400' : 'bg-white text-gray-500 shadow-sm'}`}
          >
            <Wind size={14} />
          </button>
        </div>

        {/* 大按钮入口 */}
        <button
          onClick={() => {
            if (!hasCheckedInToday) {
              setShowRitual(true);
              setRitualPhase('breathing');
              // 2.5秒后自动完成
              const timer = setTimeout(() => {
                completeRitual();
              }, 2500);
              ritualTimersRef.current.push(timer);
            }
          }}
          disabled={hasCheckedInToday}
          className={`w-full py-4 rounded-2xl font-medium tracking-wider transition-all flex items-center justify-center gap-2 ${
            hasCheckedInToday
              ? (isDark ? 'bg-[#1f1f2e] text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
              : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-95'
          }`}
        >
          <Moon size={20} />
          {hasCheckedInToday ? '今晚已归星' : '开始归星'}
        </button>
      </div>

      {/* === 4. 成就徽章墙 === */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award size={16} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
            <h3 className="text-sm font-medium">成就徽章</h3>
          </div>
          <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {unlockedBadges.length}/{totalBadges}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {BADGES.map((badge) => {
            const isUnlocked = unlockedBadges.some(b => b.id === badge.id);
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={`p-3 rounded-xl text-center transition-all ${
                  isUnlocked
                    ? (isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100')
                    : (isDark ? 'bg-[#1f1f2e] border border-transparent opacity-50' : 'bg-gray-50 border border-transparent opacity-50')
                }`}
              >
                <Icon
                  size={20}
                  className={`mx-auto mb-1.5 ${
                    isUnlocked
                      ? (isDark ? 'text-amber-400' : 'text-amber-500')
                      : (isDark ? 'text-gray-600' : 'text-gray-400')
                  }`}
                />
                <p className={`text-[10px] font-medium ${isUnlocked ? (isDark ? 'text-amber-300' : 'text-amber-600') : (isDark ? 'text-gray-600' : 'text-gray-400')}`}>
                  {badge.name}
                </p>
                <p className={`text-[8px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {badge.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* === 5. 数据概览 === */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className={`text-2xl font-medium mb-1 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
              {userData.totalDays}
            </p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>累积夜晚</p>
          </div>
          <div>
            <p className={`text-2xl font-medium mb-1 ${isDark ? 'text-pink-300' : 'text-pink-500'}`}>
              {userData.totalHugs}
            </p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>传递温暖</p>
          </div>
          <div>
            <p className={`text-2xl font-medium mb-1 ${isDark ? 'text-cyan-300' : 'text-cyan-500'}`}>
              {userData.totalFollows}
            </p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>同行者</p>
          </div>
        </div>
      </div>

      {/* === 6. 底部心愿池入口 === */}
      <button
        onClick={() => setShowWishPool(true)}
        className={`w-full py-4 rounded-2xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 ${
          isDark
            ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
        }`}
      >
        <Heart size={16} />
        进入心愿池
        <ChevronRight size={14} />
      </button>

      {/* === 夜声选择器弹窗 === */}
      {showSoundPicker && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowSoundPicker(false)}>
            <div className={`w-full max-w-sm p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative`} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowSoundPicker(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200">
                <X size={20} />
              </button>
              <h3 className="text-lg font-medium mb-5 text-center">选择夜声</h3>

              <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                {NIGHT_SOUNDS.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => {
                      setSelectedSound(sound);
                      setShowSoundPicker(false);
                      setIsPlaying(false);
                    }}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                      selectedSound.id === sound.id
                        ? (isDark ? 'bg-indigo-500/15 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200')
                        : (isDark ? 'bg-[#1f1f2e] hover:bg-white/5' : 'bg-gray-50 hover:bg-white')
                    }`}
                  >
                    <Wind size={16} className={isDark ? 'text-cyan-400' : 'text-cyan-500'} />
                    <div>
                      <p className="text-xs font-medium">{sound.name}</p>
                      <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{sound.desc}</p>
                    </div>
                    {selectedSound.id === sound.id && (
                      <CheckCircle2 size={16} className={`ml-auto ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* === 归星仪式弹窗 === */}
      {showRitual && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-center justify-center ${isDark ? 'bg-[#0f0f1a]' : 'bg-[#f8fafc]'} animate-fade-in`}>
            {/* 粒子汇聚阶段 */}
            {ritualPhase === 'breathing' && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* 周围粒子向中心汇聚 */}
                {Array.from({ length: 20 }).map((_, i) => {
                  const angle = (i * 18) * (Math.PI / 180);
                  const distance = 120 + Math.random() * 80;
                  const startX = Math.cos(angle) * distance;
                  const startY = Math.sin(angle) * distance;
                  const size = 2 + Math.random() * 3;
                  const delay = Math.random() * 0.5;
                  return (
                    <div
                      key={i}
                      className="absolute rounded-full animate-particle-gather"
                      style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        backgroundColor: isDark ? '#818cf8' : '#6366f1',
                        '--start-x': `${startX}px`,
                        '--start-y': `${startY}px`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                })}

                {/* 中央呼吸圆 */}
                <div className="relative">
                  <div
                    className={`w-32 h-32 rounded-full ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'} animate-ritual-breathe`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl">{selectedPose?.emoji}</span>
                  </div>
                </div>

                {/* 文案 */}
                <div className="absolute bottom-32 text-center">
                  <p className={`text-lg font-light ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                    正在归星...
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    让星光带你回到自己
                  </p>
                </div>
              </div>
            )}

            {/* 完成后星星爆开 */}
            {ritualPhase === 'complete' && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* 爆开的星星 */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30) * (Math.PI / 180);
                  const distance = 60 + Math.random() * 40;
                  const dx = Math.cos(angle) * distance;
                  const dy = Math.sin(angle) * distance;
                  return (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-amber-400 animate-star-burst"
                      style={{
                        '--dx': `${dx}px`,
                        '--dy': `${dy}px`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  );
                })}

                <div className="text-center">
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl bg-emerald-500/10">
                    <CheckCircle2 size={40} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
                  </div>
                  <h3 className="text-xl font-light mb-2">归星完成</h3>
                  <p className={`text-xs mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    今晚的你，已经回到自己的星空。
                  </p>

                  <div className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-center gap-6">
                      <div className="text-center">
                        <p className={`text-lg font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>+1</p>
                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>累积夜晚</p>
                      </div>
                      <div className={`w-[1px] h-8 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      <div className="text-center">
                        <p className={`text-lg font-medium ${isDark ? 'text-amber-300' : 'text-amber-500'}`}>+10</p>
                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>星尘</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={closeRitual}
                    className="px-8 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                  >
                    晚安
                  </button>
                </div>
              </div>
            )}

            {ritualPhase === 'already-completed' && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl bg-indigo-500/10">
                  <Moon size={40} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                </div>
                <h3 className="text-xl font-light mb-2">今晚已经归星过了</h3>
                <p className={`text-xs mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  不用再来一次，可以真的去睡了。
                </p>
                <button
                  onClick={closeRitual}
                  className="px-8 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  晚安
                </button>
              </div>
            )}
          </div>
        </Portal>
      )}
    </div>
  );
}
