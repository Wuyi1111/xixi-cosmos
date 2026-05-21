/**
 * BreathingWidget.jsx — 呼吸训练全屏（升级版）。
 *
 * 对标 Apple Watch 正念体验，简洁不复杂：
 * 1. 设置页：时长（1/2/3分钟）、速率（慢/中/快）
 * 2. 练习中：宇宙之花/光晕缩放动画 + 触觉反馈 + 轻点暂停 + 下滑结束
 * 3. 完成页：显示本次时长 + 自动返回主界面
 */

import { useState, useEffect, useRef } from 'react';
import { X, Pause, Play, ChevronDown } from 'lucide-react';
import Portal from '../components/Portal.jsx';

// 呼吸配置
const DURATION_OPTIONS = [
  { label: '1 分钟', value: 60 },
  { label: '2 分钟', value: 120 },
  { label: '3 分钟', value: 180 },
];

const RATE_OPTIONS = [
  { label: '慢', inhale: 6, hold: 0, exhale: 6 },    // 12秒周期
  { label: '中', inhale: 4, hold: 0, exhale: 4 },    // 8秒周期
  { label: '快', inhale: 3, hold: 0, exhale: 3 },    // 6秒周期
];

export default function BreathingWidget({ isDark, onClose }) {
  const [screen, setScreen] = useState('setup'); // setup | practice | complete
  const [duration, setDuration] = useState(120); // 默认2分钟
  const [rateOption, setRateOption] = useState(1); // 默认中等
  const [phase, setPhase] = useState('准备'); // 准备 | 吸气 | 呼气 | 暂停
  const [remainingTime, setRemainingTime] = useState(120);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const phaseTimerRef = useRef(null);
  const touchStartYRef = useRef(null);

  const rate = RATE_OPTIONS[rateOption];

  // 开始练习
  const startPractice = () => {
    setRemainingTime(duration);
    setElapsedTime(0);
    setIsPaused(false);
    setScreen('practice');
  };

  // 完成练习
  const completePractice = () => {
    setScreen('complete');
    clearInterval(timerRef.current);
    clearInterval(phaseTimerRef.current);
    // 2秒后自动返回
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  // 清理所有计时器
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(phaseTimerRef.current);
    };
  }, []);

  // 练习计时器
  useEffect(() => {
    if (screen !== 'practice' || isPaused) return;

    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          completePractice();
          return 0;
        }
        return prev - 1;
      });
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [screen, isPaused]);

  // 呼吸相位计时器
  useEffect(() => {
    if (screen !== 'practice' || isPaused) return;

    let currentPhaseIndex = 0;
    const phases = ['吸气', '呼气'];

    const nextPhase = () => {
      const currentPhase = phases[currentPhaseIndex];
      setPhase(currentPhase);

      // 触觉反馈：吸气时轻振
      if (currentPhase === '吸气' && navigator.vibrate) {
        navigator.vibrate([30]);
      }

      const phaseDuration = currentPhase === '吸气' ? rate.inhale * 1000 : rate.exhale * 1000;
      currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
      phaseTimerRef.current = setTimeout(nextPhase, phaseDuration);
    };

    // 初始相位
    nextPhase();

    return () => clearTimeout(phaseTimerRef.current);
  }, [screen, isPaused, rateOption]);

  // 暂停/继续
  const togglePause = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      setPhase('吸气'); // 恢复时从吸气开始
    } else {
      setPhase('暂停');
    }
  };

  // 触摸事件处理：下滑结束
  const handleTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartYRef.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchEndY - touchStartYRef.current;
    if (diff > 50) {
      // 下滑超过50px，结束练习
      completePractice();
    }
    touchStartYRef.current = null;
  };

  // 格式化时间显示
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 设置页面
  if (screen === 'setup') {
    return (
      <Portal>
        <div data-no-pull-refresh="true" className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in">
          {/* 半透明遮罩层 */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          {/* 卡片容器 */}
          <div className={`relative w-full max-w-sm flex flex-col rounded-[28px] overflow-hidden shadow-2xl ${isDark ? 'bg-[#171724] shadow-black/50' : 'bg-white shadow-gray-200/50'}`}>
            {/* 顶部装饰区 */}
            <div className={`relative px-6 pt-[max(env(safe-area-inset-top)+1rem,1.5rem)] pb-6 ${isDark ? 'bg-[#1f1f2e]' : 'bg-indigo-50/50'}`}>
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className={`absolute top-[max(env(safe-area-inset-top)+1rem,1.5rem)] right-6 p-2 rounded-full transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                <X size={20} />
              </button>

              {/* 标题与图标 */}
              <div className="flex flex-col items-center pt-4 space-y-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                  <span className="text-2xl">🌬️</span>
                </div>
                <div className="text-center">
                  <h1 className={`text-lg font-medium tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>舒缓调息</h1>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>跟随呼吸，回归平静</p>
                </div>
              </div>
            </div>

            {/* 选项区 */}
            <div className="flex-1 px-6 py-8 space-y-8">
              {/* 时长选择 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-4 rounded-full bg-indigo-500`} />
                  <h2 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>时长</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {DURATION_OPTIONS.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setDuration(opt.value)}
                      className={`relative py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
                        duration === opt.value
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]'
                          : isDark
                          ? 'bg-[#1f1f2e] text-gray-400 border border-gray-800 hover:border-gray-700 hover:bg-[#262638]'
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-indigo-200 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      {opt.label}
                      {duration === opt.value && (
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-indigo-400 border-2 ${isDark ? 'border-[#171724]' : 'border-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 速率选择 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-4 rounded-full bg-indigo-500`} />
                  <h2 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>速率</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {RATE_OPTIONS.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setRateOption(idx)}
                      className={`relative py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
                        rateOption === idx
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]'
                          : isDark
                          ? 'bg-[#1f1f2e] text-gray-400 border border-gray-800 hover:border-gray-700 hover:bg-[#262638]'
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-indigo-200 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      {opt.label}
                      {rateOption === idx && (
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-indigo-400 border-2 ${isDark ? 'border-[#171724]' : 'border-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 底部按钮区 */}
            <div className={`px-6 pb-[max(env(safe-area-inset-bottom)+1rem,1.5rem)] pt-2 ${isDark ? 'bg-[#1f1f2e]' : 'bg-indigo-50/50'}`}>
              <button
                onClick={startPractice}
                className="w-full py-4 rounded-2xl text-white font-medium tracking-wider bg-indigo-500 hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                <span>开始练习</span>
                <span className="text-lg">🧘</span>
              </button>
            </div>
          </div>
        </div>
      </Portal>
    );
  }

  // 练习页面
  if (screen === 'practice') {
    const scale = isPaused ? 0.7 : phase === '吸气' ? 1.3 : 0.7;
    const opacity = isPaused ? 0.5 : phase === '吸气' ? 1 : 0.6;
    const progress = duration > 0 ? ((duration - remainingTime) / duration) * 100 : 0;

    return (
      <Portal>
        <div
          data-no-pull-refresh="true"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in"
          style={{ backgroundColor: isDark ? '#0f0f1a' : '#f8fafc' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* 顶部区域 */}
          <div className="absolute top-[max(env(safe-area-inset-top)+1rem,3rem)] flex flex-col items-center space-y-3">
            {/* 计时器 */}
            <div className={`px-6 py-2 rounded-full ${isDark ? 'bg-[#171724]' : 'bg-white'} shadow-sm`}>
              <span className={`text-2xl font-light tracking-widest tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatTime(remainingTime)}
              </span>
            </div>
            {/* 进度条 */}
            <div className={`w-32 h-1 rounded-full overflow-hidden ${isDark ? 'bg-[#171724]' : 'bg-gray-200'}`}>
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 宇宙之花/光晕动画 */}
          <div className="relative w-80 h-80 flex items-center justify-center">
            {/* 最外层光晕 */}
            <div
              className="absolute inset-0 rounded-full transition-all duration-1000 ease-in-out"
              style={{
                transform: `scale(${isPaused ? 0.5 : phase === '吸气' ? 1.5 : 0.7})`,
                opacity: isPaused ? 0.15 : 0.12,
                background: isDark
                  ? 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
              }}
            />

            {/* 外层光晕 */}
            <div
              className="absolute inset-2 rounded-full transition-all duration-1000 ease-in-out"
              style={{
                transform: `scale(${isPaused ? 0.55 : phase === '吸气' ? 1.35 : 0.75})`,
                opacity: isPaused ? 0.25 : 0.2,
                background: isDark
                  ? 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 65%)'
                  : 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 65%)',
              }}
            />

            {/* 中层花瓣 */}
            <div
              className="absolute inset-6 rounded-full transition-all duration-1000 ease-in-out"
              style={{
                transform: `scale(${isPaused ? 0.6 : phase === '吸气' ? 1.2 : 0.8})`,
                opacity: isPaused ? 0.35 : 0.4,
                background: isDark
                  ? 'radial-gradient(circle, rgba(167,139,250,0.5) 0%, transparent 60%)'
                  : 'radial-gradient(circle, rgba(167,139,250,0.35) 0%, transparent 60%)',
              }}
            />

            {/* 内层光晕 */}
            <div
              className="absolute inset-10 rounded-full transition-all duration-1000 ease-in-out"
              style={{
                transform: `scale(${isPaused ? 0.65 : phase === '吸气' ? 1.1 : 0.85})`,
                opacity: isPaused ? 0.45 : 0.55,
                background: isDark
                  ? 'radial-gradient(circle, rgba(196,181,253,0.5) 0%, rgba(139,92,246,0.2) 50%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(196,181,253,0.4) 0%, rgba(139,92,246,0.15) 50%, transparent 70%)',
              }}
            />

            {/* 核心光晕 */}
            <div
              className="absolute inset-14 rounded-full transition-all duration-1000 ease-in-out"
              style={{
                transform: `scale(${scale})`,
                opacity: opacity,
                background: isDark
                  ? 'radial-gradient(circle, rgba(221,214,254,0.6) 0%, rgba(165,180,252,0.3) 40%, rgba(99,102,241,0.1) 70%, transparent 80%)'
                  : 'radial-gradient(circle, rgba(221,214,254,0.5) 0%, rgba(165,180,252,0.25) 40%, rgba(99,102,241,0.08) 70%, transparent 80%)',
              }}
            />

            {/* 相位文字 */}
            <div className="z-10 flex flex-col items-center space-y-2">
              <span className={`text-4xl font-light tracking-[0.2em] transition-all duration-500 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {isPaused ? '暂停' : phase}
              </span>
              {!isPaused && (
                <span className={`text-xs tracking-wider transition-all duration-500 ${isDark ? 'text-indigo-300/70' : 'text-indigo-500/60'}`}>
                  {phase === '吸气' ? '慢慢吸气...' : '缓缓呼气...'}
                </span>
              )}
            </div>
          </div>

          {/* 底部控制区 */}
          <div className="absolute bottom-[max(env(safe-area-inset-bottom)+1rem,3rem)] flex flex-col items-center space-y-6">
            {/* 暂停按钮 */}
            <button
              onClick={togglePause}
              className={`p-4 rounded-full transition-all duration-300 shadow-lg ${
                isPaused
                  ? isDark
                    ? 'bg-indigo-500 text-white shadow-indigo-500/30 hover:bg-indigo-600'
                    : 'bg-indigo-500 text-white shadow-indigo-500/30 hover:bg-indigo-600'
                  : isDark
                  ? 'bg-[#171724] text-gray-300 border border-gray-800 hover:border-indigo-500/30 hover:bg-[#1f1f2e]'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-200 hover:shadow-md'
              }`}
            >
              {isPaused ? <Play size={24} /> : <Pause size={24} />}
            </button>

            {/* 下滑提示 */}
            <div className="flex flex-col items-center opacity-50">
              <ChevronDown size={18} className={`animate-bounce ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={`text-[10px] mt-1 tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>下滑结束</span>
            </div>
          </div>
        </div>
      </Portal>
    );
  }

  // 完成页面
  if (screen === 'complete') {
    return (
      <Portal>
        <div data-no-pull-refresh="true" className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in" style={{ backgroundColor: isDark ? '#0f0f1a' : '#f8fafc' }}>
          <div className="text-center space-y-6">
            {/* 完成图标 */}
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
              <span className="text-4xl">✨</span>
            </div>

            <div className="space-y-2">
              <h2 className={`text-2xl font-medium tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>
                完成
              </h2>
              <p className={`text-4xl font-light ${isDark ? 'text-indigo-300' : 'text-indigo-500'}`}>
                {formatTime(elapsedTime)}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                本次呼吸时长
              </p>
            </div>
          </div>

          {/* 自动返回倒计时提示 */}
          <p className={`absolute bottom-[max(env(safe-area-inset-bottom)+3rem,5rem)] text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            即将返回...
          </p>
        </div>
      </Portal>
    );
  }

  return null;
}
