/**
 * SplashScreen.jsx — 极简呼吸启动页（v4.38.0）
 *
 * 一个渐变圆在屏幕中央呼吸式缩放，中心淡显"息息"文字
 * 持续 5 秒后自动淡出进入主页
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export default function SplashScreen({ onComplete, isDark }) {
  const [phase, setPhase] = useState('breathing'); // breathing | fading | done
  const [breathPhase, setBreathPhase] = useState('inhale'); // inhale | exhale
  const timersRef = useRef([]);
  const isDoneRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  }, []);

  const finish = useCallback(() => {
    if (isDoneRef.current) return;
    isDoneRef.current = true;
    clearAllTimers();
    setPhase('fading');
    const t = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 800);
    timersRef.current.push(t);
  }, [onComplete, clearAllTimers]);

  // 呼吸循环：吸气 2.5s → 呼气 2.5s，循环一次后结束
  useEffect(() => {
    const runBreathing = () => {
      // 吸气
      setBreathPhase('inhale');
      const t1 = setTimeout(() => {
        if (isDoneRef.current) return;
        // 呼气
        setBreathPhase('exhale');
        const t2 = setTimeout(() => {
          if (isDoneRef.current) return;
          // 再吸气一次
          setBreathPhase('inhale');
          const t3 = setTimeout(() => {
            if (isDoneRef.current) return;
            // 再呼气，然后结束
            setBreathPhase('exhale');
            const t4 = setTimeout(() => {
              finish();
            }, 1200);
            timersRef.current.push(t4);
          }, 1200);
          timersRef.current.push(t3);
        }, 1200);
        timersRef.current.push(t2);
      }, 1200);
      timersRef.current.push(t1);
    };

    runBreathing();

    // 兜底：5秒后强制结束
    const tForce = setTimeout(() => {
      finish();
    }, 5000);
    timersRef.current.push(tForce);

    return () => clearAllTimers();
  }, [finish, clearAllTimers]);

  // 呼吸缩放值
  const scale = breathPhase === 'inhale' ? 1.15 : 0.88;
  const textOpacity = breathPhase === 'inhale' ? 0.9 : 0.5;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-700 ${
        phase === 'fading' || phase === 'done' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${isDark ? 'bg-[#0f0f1a]' : 'bg-[#f8fafc]'}`}
    >
      {/* 呼吸圆 */}
      <div
        className="relative flex items-center justify-center transition-transform duration-[1200ms] ease-in-out"
        style={{
          transform: `scale(${scale})`,
        }}
      >
        {/* 渐变圆 */}
        <div
          className={`w-40 h-40 rounded-full transition-opacity duration-[1200ms] ${
            isDark
              ? 'bg-gradient-to-br from-sky-400/20 via-indigo-400/20 to-purple-400/20'
              : 'bg-gradient-to-br from-sky-300/30 via-indigo-300/30 to-purple-300/30'
          }`}
          style={{
            boxShadow: isDark
              ? '0 0 60px rgba(99,102,241,0.15), 0 0 120px rgba(99,102,241,0.08)'
              : '0 0 60px rgba(99,102,241,0.12), 0 0 120px rgba(99,102,241,0.06)',
          }}
        />

        {/* 中心文字 */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-[1200ms]"
          style={{ opacity: textOpacity }}
        >
          <span
            className={`text-3xl font-light tracking-[0.2em] ${
              isDark ? 'text-indigo-200/80' : 'text-indigo-600/70'
            }`}
          >
            息息
          </span>
        </div>
      </div>

      {/* 底部小字 */}
      <div
        className={`absolute bottom-12 left-0 right-0 text-center transition-opacity duration-1000 ${
          breathPhase === 'inhale' ? 'opacity-40' : 'opacity-20'
        }`}
      >
        <p className={`text-[10px] tracking-[0.3em] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          宇宙之息
        </p>
      </div>
    </div>
  );
}
