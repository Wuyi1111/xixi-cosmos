/**
 * StarView.jsx — "归星"板块（原"我的"页面重构）。
 *
 * 页面结构：
 *   1) 顶部精简个人信息
 *   2) 品牌意义卡片："今晚，回到自己"
 *   3) 夜声白噪音板块
 *   4) 睡前归星仪式（睡姿选择 + 调息动画）
 *   5) 星辰板块（星尘 + 心愿池入口）
 *   6) 三个数据记录：累积夜晚 / 传递温暖 / 同行者
 */

import { useState, useEffect, useRef } from 'react';
import { Settings, Sparkles, Moon, Heart, Users, Play, Pause, RefreshCw, Wind, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import SettingsPanel from './SettingsPanel.jsx';
import WishPoolView from './WishPoolView.jsx';
import { INITIAL_USER_DATA } from '../constants.js';

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

export default function StarView({ isDark, theme, setTheme, userData, saveUserData, setUserData }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showWishPool, setShowWishPool] = useState(false);

  // 夜声状态
  const [selectedSound, setSelectedSound] = useState(NIGHT_SOUNDS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  // 归星仪式状态
  const [selectedPose, setSelectedPose] = useState(null);
  const [showRitual, setShowRitual] = useState(false);
  const [ritualPhase, setRitualPhase] = useState('select'); // select | breathing | complete
  const [breathPhase, setBreathPhase] = useState('inhale'); // inhale | hold | exhale
  // 所有调息 setTimeout 的 ID 都丢这里；closeRitual 时统一 clear
  const ritualTimersRef = useRef([]);
  // 标记仪式是否仍在进行；定时器链回调里短路用，避免关闭后还触发 completeRitual
  const ritualActiveRef = useRef(false);

  const clearRitualTimers = () => {
    ritualTimersRef.current.forEach(id => clearTimeout(id));
    ritualTimersRef.current = [];
  };

  // 连续夜晚显示
  const lastCheckInDate = userData.checkInHistory[0]?.date;
  const todayStr = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const hasCheckedInToday = lastCheckInDate === todayStr;
  let displayContinuousDays = userData.continuousDays;
  if (!hasCheckedInToday && userData.checkInHistory.length > 0) {
    if (lastCheckInDate !== yesterday.toDateString()) {
      displayContinuousDays = 0;
    }
  }

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
    // 防御 1：仪式已被关闭 → 短路（定时器链余波）
    if (!ritualActiveRef.current) return;
    // 防御 2：今日已打卡 → 不再发放奖励（避免重复打卡）
    if (hasCheckedInToday) {
      ritualActiveRef.current = false;
      clearRitualTimers();
      setRitualPhase('complete');
      return;
    }
    ritualActiveRef.current = false;
    clearRitualTimers();
    setRitualPhase('complete');

    // 给予奖励
    const isConsecutive = lastCheckInDate === yesterday.toDateString();
    const newContinuousDays = isConsecutive ? userData.continuousDays + 1 : 1;
    const streakBonus = isConsecutive ? Math.min((newContinuousDays - 1) * 2, 10) : 0;
    const earned = 10 + streakBonus;

    const today = new Date();
    const hours = today.getHours().toString().padStart(2, '0');
    const minutes = today.getMinutes().toString().padStart(2, '0');

    const newEntry = {
      id: Date.now(),
      date: todayStr,
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
    // 关闭即"打断"：先翻 active 标记，再清所有挂起的 setTimeout
    ritualActiveRef.current = false;
    clearRitualTimers();
    setShowRitual(false);
    setRitualPhase('select');
    setSelectedPose(null);
    setBreathPhase('inhale');
  };

  // 组件卸载时也清干净，避免内存泄漏
  useEffect(() => {
    return () => {
      ritualActiveRef.current = false;
      clearRitualTimers();
    };
  }, []);

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
          // 直接复用 constants.js 的单一来源，避免后续加字段时这里漏改
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
    <div className="animate-fade-in pb-10 space-y-6">
      {/* === 顶部精简个人信息 === */}
      <div className={`p-5 rounded-[28px] relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#171724] border border-indigo-500/15' : 'bg-gradient-to-br from-indigo-50/70 to-white border border-indigo-100'}`}>
        <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full bg-indigo-300/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -left-6 w-24 h-24 rounded-full bg-purple-300/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${isDark ? 'bg-[#171724] border border-indigo-500/20' : 'bg-white shadow-sm border border-indigo-100'} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-indigo-500/10 blur-md animate-pulse"></div>
                <span className="relative z-10">{userData.avatarEmoji || '🪐'}</span>
              </div>
              <div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>晚安，星旅人</p>
                <h2 className="text-base font-medium">{userData.displayName || '星星旅人'}</h2>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-full ${isDark ? 'bg-[#171724] text-gray-400' : 'bg-white text-gray-500 shadow-sm'}`}
            >
              <Settings size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Moon size={14} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
              <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                连续归星 {displayContinuousDays} 个夜晚
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
              <span className={`text-xs font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                星尘 {userData.stardust}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* === 品牌意义卡片 === */}
      <div className={`p-6 rounded-[28px] relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1a1a24] to-[#171724] border border-purple-500/15' : 'bg-gradient-to-br from-purple-50/70 to-white border border-purple-100'}`}>
        <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full bg-purple-300/15 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -left-6 w-24 h-24 rounded-full bg-indigo-300/15 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <h2 className="text-lg font-light mb-3 tracking-wide">今晚，回到自己</h2>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            生活会让人奔跑、消耗、偏航。<br/>
            但在息息里，你可以慢下来，听见自己。<br/>
            每一次表达，都是一颗星发光；<br/>
            每一次共鸣，都是一束光抵达；<br/>
            每一次归星，都是你重新回到自己的时刻。
          </p>
        </div>
      </div>

      {/* === 夜声白噪音 === */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Wind size={16} className={isDark ? 'text-cyan-400' : 'text-cyan-500'} />
          <h3 className="text-sm font-medium">夜声</h3>
        </div>
        <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          选择今晚陪你入眠的声音。
        </p>

        <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>当前选择</p>
              <p className="text-sm font-medium mt-0.5">{selectedSound.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className={`p-2.5 rounded-full transition-all active:scale-95 ${
                  isPlaying
                    ? (isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-600')
                    : (isDark ? 'bg-white/5 text-gray-400' : 'bg-white text-gray-500 shadow-sm')
                }`}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={() => setShowSoundPicker(true)}
                className={`p-2.5 rounded-full transition-all active:scale-95 ${isDark ? 'bg-white/5 text-gray-400' : 'bg-white text-gray-500 shadow-sm'}`}
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {isPlaying && (
            <div className="mt-3 flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full ${isDark ? 'bg-cyan-500/30' : 'bg-cyan-200'}`}
                  style={{
                    animation: `sound-wave 1s ease-in-out ${i * 0.15}s infinite alternate`,
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* === 睡前归星仪式 === */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Moon size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
          <h3 className="text-sm font-medium">睡前归星仪式</h3>
        </div>
        <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          选择今晚的睡姿，让身体先替你安静下来。
        </p>

        {/* 睡姿选择 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {SLEEP_POSES.map((pose) => (
            <button
              key={pose.id}
              onClick={() => setSelectedPose(pose)}
              className={`p-3 rounded-2xl text-center transition-all active:scale-95 ${
                selectedPose?.id === pose.id
                  ? (isDark ? 'bg-indigo-500/15 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200')
                  : (isDark ? 'bg-[#1f1f2e] border border-transparent' : 'bg-gray-50 border border-transparent')
              }`}
            >
              <span className="text-2xl block mb-1">{pose.emoji}</span>
              <span className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{pose.name}</span>
            </button>
          ))}
        </div>

        {selectedPose && (
          <div className={`p-3 rounded-xl mb-4 text-center ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              今晚选择：<span className="font-medium">{selectedPose.name}</span>
            </p>
            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{selectedPose.desc}</p>
          </div>
        )}

        <button
          onClick={() => {
            if (selectedPose) {
              setShowRitual(true);
              setRitualPhase('select');
            }
          }}
          disabled={!selectedPose || hasCheckedInToday}
          className={`w-full py-3.5 rounded-2xl font-medium tracking-wider transition-all flex items-center justify-center gap-2 ${
            selectedPose && !hasCheckedInToday
              ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-95'
              : (isDark ? 'bg-[#1f1f2e] text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
          }`}
        >
          <Moon size={18} />
          {hasCheckedInToday ? '今晚已归星' : '开始归星'}
        </button>
      </div>

      {/* === 星辰板块 === */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
          <h3 className="text-sm font-medium">星辰</h3>
        </div>

        <div className={`p-4 rounded-2xl mb-4 ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'}`}>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>当前星尘</p>
          <p className={`text-2xl font-medium mt-1 ${isDark ? 'text-amber-300' : 'text-amber-500'}`}>
            {userData.stardust}
          </p>
        </div>

        <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          星尘不是用来消费的，而是用来兑换认真生活后的奖励。<br/>
          息息不做产品销售，这里只准备心愿兑换。
        </p>

        <button
          onClick={() => setShowWishPool(true)}
          className={`w-full py-3 rounded-2xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 ${
            isDark
              ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Heart size={16} />
          进入心愿池
        </button>
      </div>

      {/* === 三个数据记录 === */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className={`text-xl font-medium mb-1 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
              {userData.totalDays}
            </p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>累积夜晚</p>
          </div>
          <div>
            <p className={`text-xl font-medium mb-1 ${isDark ? 'text-pink-300' : 'text-pink-500'}`}>
              {userData.totalHugs}
            </p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>传递温暖</p>
          </div>
          <div>
            <p className={`text-xl font-medium mb-1 ${isDark ? 'text-cyan-300' : 'text-cyan-500'}`}>
              {userData.totalFollows}
            </p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>同行者</p>
          </div>
        </div>
      </div>

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
          <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/90' : 'bg-[#f8fafc]/90'} backdrop-blur-md animate-fade-in`}>
            {ritualPhase === 'select' && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl bg-indigo-500/10">
                  {selectedPose?.emoji}
                </div>
                <h3 className="text-xl font-light mb-2">{selectedPose?.name}</h3>
                <p className={`text-xs mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedPose?.desc}
                </p>
                <button
                  onClick={startBreathing}
                  className="px-8 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  开始调息
                </button>
                <button
                  onClick={closeRitual}
                  className={`block mx-auto mt-4 text-xs ${isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  取消
                </button>
              </div>
            )}

            {ritualPhase === 'breathing' && (
              <div className="text-center">
                <div className="relative w-40 h-40 mx-auto mb-6">
                  <div
                    className={`absolute inset-0 rounded-full ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-100'} transition-all duration-[3000ms] ease-in-out`}
                    style={{
                      transform: breathPhase === 'inhale' ? 'scale(1.3)' : breathPhase === 'exhale' ? 'scale(0.8)' : 'scale(1.1)',
                      opacity: breathPhase === 'inhale' ? 0.3 : breathPhase === 'exhale' ? 0.1 : 0.2,
                    }}
                  ></div>
                  <div
                    className={`absolute inset-4 rounded-full ${isDark ? 'bg-indigo-400/15' : 'bg-indigo-50'} transition-all duration-[3000ms] ease-in-out`}
                    style={{
                      transform: breathPhase === 'inhale' ? 'scale(1.2)' : breathPhase === 'exhale' ? 'scale(0.85)' : 'scale(1.05)',
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl">{selectedPose?.emoji}</span>
                  </div>
                </div>

                <p className="text-lg font-light mb-2">
                  {breathPhase === 'inhale' ? '吸气' : breathPhase === 'hold' ? '屏息' : '呼气'}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {breathPhase === 'inhale'
                    ? '把自己收回来。'
                    : breathPhase === 'hold'
                    ? '让气息在体内停留片刻。'
                    : '把疲惫交给星空。'}
                </p>

                <button
                  onClick={closeRitual}
                  className={`mt-8 text-xs ${isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  跳过
                </button>
              </div>
            )}

            {ritualPhase === 'complete' && (
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
                    <div className={`w-[1px] h-8 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
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
          </div>
        </Portal>
      )}
    </div>
  );
}
