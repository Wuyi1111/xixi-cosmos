/**
 * StarView.jsx — "归星"板块（v4.27.0 简化版）
 *
 * 页面结构：
 *   1) 顶部精简个人信息：头像 + 名字 + 设置
 *   2) 今日状态卡片：今晚归星状态 / 连续天数 / 心情
 *   3) 伴眠夜声：独立声音播放卡片
 *   4) 开始归星：点击后显示随机温暖话术，完成归星
 *   5) 成就徽章墙：累积夜晚 / 传递温暖 / 同行者
 *   6) 底部：心愿池独立入口
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Sparkles, Moon, Heart, Users, Play, Pause, Wind, ChevronRight, X, CheckCircle2, Award, Flame, Music, Quote } from 'lucide-react';
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

// 温暖话术库 — 每次归星随机显示一条
const WARM_MESSAGES = [
  { text: '今天的你已经很棒了，明天会更好。', author: '宇宙' },
  { text: '你走过的每一步，都在成为更好的自己。', author: '星星' },
  { text: '不必着急，慢慢来也是一种力量。', author: '月光' },
  { text: '你的努力，宇宙都看在眼里。', author: '星云' },
  { text: '即使今天不够完美，也值得被温柔以待。', author: '晚风' },
  { text: '相信自己，你比想象中更强大。', author: '银河' },
  { text: '每一个平凡的日子，都藏着不平凡的光芒。', author: '星辰' },
  { text: '累了就休息，明天的太阳依旧会升起。', author: '晨曦' },
  { text: '你的存在本身，就是一份美好的礼物。', author: '宇宙' },
  { text: '不必和别人比较，你的节奏就是最好的节奏。', author: '行星' },
  { text: '今天的疲惫，会在梦里化作星光。', author: '夜空' },
  { text: '你已经做得很好了，真的。', author: '云朵' },
  { text: '生活也许不易，但你一直在勇敢前行。', author: '流星' },
  { text: '给自己一个拥抱，你值得被温柔对待。', author: '星光' },
  { text: '明天的你，会比今天更接近心中的光。', author: '日出' },
  { text: '无论今天经历了什么，此刻请安心入眠。', author: '潮汐' },
  { text: '你的坚持，终将成为照亮前路的光。', author: '灯塔' },
  { text: '放下今天的烦恼，让心灵在星空中自由漂浮。', author: '深空' },
  { text: '你是一颗独一无二的星，闪耀着属于自己的光芒。', author: '星座' },
  { text: '晚安，愿你的梦里充满温柔与希望。', author: '月亮' },
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

  // 归星状态
  const [showRitual, setShowRitual] = useState(false);
  const [ritualPhase, setRitualPhase] = useState('message');
  const [warmMessage, setWarmMessage] = useState(null);
  const ritualTimersRef = useRef([]);

  const clearRitualTimers = () => {
    ritualTimersRef.current.forEach(id => clearTimeout(id));
    ritualTimersRef.current = [];
  };

  // 连续夜晚显示
  const { lastCheckInDate, hasCheckedInToday, displayContinuousDays } =
    computeStreakInfo(userData, currentDateStr);

  // 夜声播放（模拟）
  const togglePlay = () => setIsPlaying(!isPlaying);

  // 随机获取一条温暖话术
  const getRandomMessage = useCallback(() => {
    const index = Math.floor(Math.random() * WARM_MESSAGES.length);
    return WARM_MESSAGES[index];
  }, []);

  const startRitual = () => {
    if (hasCheckedInToday) return;
    const message = getRandomMessage();
    setWarmMessage(message);
    setRitualPhase('message');
    setShowRitual(true);
  };

  const completeRitual = () => {
    if (hasCheckedInToday) {
      setRitualPhase('already-completed');
      return;
    }

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
      whisper: warmMessage ? `「${warmMessage.text}」— ${warmMessage.author}` : '完成今晚的归星',
      stardustEarned: earned,
      isFirstCheckIn: userData.checkInHistory.length === 0,
      triggeredBy: 'ritual',
    };

    saveUserData({
      ...userData,
      totalDays: userData.totalDays + 1,
      continuousDays: newContinuousDays,
      stardust: userData.stardust + earned,
      checkInHistory: [newEntry, ...userData.checkInHistory],
    });

    setRitualPhase('complete');
  };

  const closeRitual = () => {
    clearRitualTimers();
    setShowRitual(false);
    setRitualPhase('message');
    setWarmMessage(null);
  };

  useEffect(() => {
    return () => {
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

      {/* === 3. 伴眠夜声（独立卡片） === */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Music size={16} className={isDark ? 'text-cyan-400' : 'text-cyan-500'} />
            <h3 className="text-sm font-medium">伴眠夜声</h3>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-cyan-500/10 text-cyan-300' : 'bg-cyan-50 text-cyan-600'}`}>
            {selectedSound.name}
          </span>
        </div>

        <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'}`}>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>当前播放</p>
            <p className="text-xs font-medium">{selectedSound.name}</p>
            <p className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{selectedSound.desc}</p>
          </div>
          <button
            onClick={togglePlay}
            className={`p-2.5 rounded-full transition-all active:scale-95 ${
              isPlaying
                ? (isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-600')
                : (isDark ? 'bg-white/5 text-gray-400' : 'bg-white text-gray-500 shadow-sm')
            }`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={() => setShowSoundPicker(true)}
            className={`p-2.5 rounded-full transition-all active:scale-95 ${isDark ? 'bg-white/5 text-gray-400' : 'bg-white text-gray-500 shadow-sm'}`}
          >
            <Wind size={18} />
          </button>
        </div>

        {/* 快捷声音选择 */}
        <div className="grid grid-cols-4 gap-2">
          {NIGHT_SOUNDS.slice(0, 4).map((sound) => (
            <button
              key={sound.id}
              onClick={() => {
                setSelectedSound(sound);
                setIsPlaying(false);
              }}
              className={`p-2 rounded-xl text-center transition-all active:scale-95 ${
                selectedSound.id === sound.id
                  ? (isDark ? 'bg-cyan-500/15 border border-cyan-500/30' : 'bg-cyan-50 border border-cyan-200')
                  : (isDark ? 'bg-[#1f1f2e] border border-transparent' : 'bg-gray-50 border border-transparent')
              }`}
            >
              <p className={`text-[10px] font-medium ${selectedSound.id === sound.id ? (isDark ? 'text-cyan-300' : 'text-cyan-600') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                {sound.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* === 4. 开始归星 === */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        <div className="flex items-center gap-2 mb-3">
          <Moon size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
          <h3 className="text-sm font-medium">开始归星</h3>
        </div>

        <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          点击开始，接收来自宇宙的温暖话语
        </p>

        {/* 大按钮入口 */}
        <button
          onClick={startRitual}
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
            {/* 温暖话术阶段 */}
            {ritualPhase === 'message' && warmMessage && (
              <div className="w-full max-w-sm mx-6 text-center">
                {/* 装饰星星 */}
                <div className="relative mb-8">
                  <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                    <Quote size={32} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                  </div>
                  {/* 浮动小星星 */}
                  <div className="absolute top-0 left-1/4 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <div className="absolute bottom-2 right-1/4 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute top-4 right-1/3 w-1 h-1 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                {/* 话术内容 */}
                <div className={`p-6 rounded-[24px] mb-8 ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
                  <p className={`text-lg font-light leading-relaxed mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    「{warmMessage.text}」
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    —— {warmMessage.author}
                  </p>
                </div>

                {/* 完成按钮 */}
                <button
                  onClick={completeRitual}
                  className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  接收这份温暖，完成归星
                </button>
              </div>
            )}

            {/* 完成后 */}
            {ritualPhase === 'complete' && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl bg-emerald-500/10">
                  <CheckCircle2 size={40} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
                </div>
                <h3 className="text-xl font-light mb-2">归星完成</h3>
                <p className={`text-xs mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  今晚的你，已经收到宇宙的温柔。
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
