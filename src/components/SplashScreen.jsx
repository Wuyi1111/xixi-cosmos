/**
 * SplashScreen.jsx — 极简充能呼吸启动页（v4.39.1）
 *
 * 多层同心圆脉冲扩散，营造能量汇聚感
 * 大圆呼吸缩放，持续 5 秒后自动进入主页
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

  // 呼吸循环
  useEffect(() => {
    const runBreathing = () => {
      setBreathPhase('inhale');
      const t1 = setTimeout(() => {
        if (isDoneRef.current) return;
        setBreathPhase('exhale');
        const t2 = setTimeout(() => {
          if (isDoneRef.current) return;
          setBreathPhase('inhale');
          const t3 = setTimeout(() => {
            if (isDoneRef.current) return;
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

    const tForce = setTimeout(() => {
      finish();
    }, 5000);
    timersRef.current.push(tForce);

    return () => clearAllTimers();
  }, [finish, clearAllTimers]);

  const scale = breathPhase === 'inhale' ? 1.2 : 0.85;
  const coreOpacity = breathPhase === 'inhale' ? 1 : 0.4;
  const glowOpacity = breathPhase === 'inhale' ? 0.6 : 0.2;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-700 ${
        phase === 'fading' || phase === 'done' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${isDark ? 'bg-[#0f0f1a]' : 'bg-[#f8fafc]'}`}
    >
      {/* 能量核心容器 */}
      <div className="relative flex items-center justify-center">
        {/* 外层脉冲环 2 */}
        <div
          className="absolute rounded-full transition-all duration-[1200ms] ease-in-out"
          style={{
            width: '320px',
            height: '320px',
            transform: `scale(${scale})`,
            background: isDark
              ? 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
            opacity: glowOpacity * 0.5,
          }}
        />

        {/* 外层脉冲环 1 */}
        <div
          className="absolute rounded-full transition-all duration-[1200ms] ease-in-out"
          style={{
            width: '260px',
            height: '260px',
            transform: `scale(${scale})`,
            background: isDark
              ? 'radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)',
            opacity: glowOpacity * 0.7,
          }}
        />

        {/* 主圆 */}
        <div
          className="relative flex items-center justify-center transition-transform duration-[1200ms] ease-in-out"
          style={{ transform: `scale(${scale})` }}
        >
          <div
            className="w-56 h-56 rounded-full"
            style={{
              background: isDark
                ? 'radial-gradient(circle at 40% 40%, rgba(147,197,253,0.25), rgba(99,102,241,0.15) 50%, rgba(99,102,241,0.05) 100%)'
                : 'radial-gradient(circle at 40% 40%, rgba(147,197,253,0.35), rgba(99,102,241,0.2) 50%, rgba(99,102,241,0.08) 100%)',
              boxShadow: isDark
                ? `0 0 80px rgba(99,102,241,${glowOpacity * 0.3}), 0 0 160px rgba(99,102,241,${glowOpacity * 0.15}), inset 0 0 60px rgba(147,197,253,${glowOpacity * 0.1})`
                : `0 0 80px rgba(99,102,241,${glowOpacity * 0.25}), 0 0 160px rgba(99,102,241,${glowOpacity * 0.12}), inset 0 0 60px rgba(147,197,253,${glowOpacity * 0.08})`,
            }}
          />

          {/* 中心亮点 */}
          <div
            className="absolute w-3 h-3 rounded-full transition-opacity duration-[1200ms]"
            style={{
              background: isDark ? 'rgba(191,219,254,0.9)' : 'rgba(99,102,241,0.8)',
              boxShadow: isDark
                ? `0 0 20px rgba(191,219,254,${coreOpacity}), 0 0 40px rgba(191,219,254,${coreOpacity * 0.5})`
                : `0 0 20px rgba(99,102,241,${coreOpacity}), 0 0 40px rgba(99,102,241,${coreOpacity * 0.5})`,
              opacity: coreOpacity,
            }}
          />
        </div>
      </div>

      {/* 底部品牌名 */}
      <div
        className="absolute bottom-16 left-0 right-0 text-center transition-opacity duration-1000"
        style={{ opacity: breathPhase === 'inhale' ? 0.5 : 0.2 }}
      >
        <p className={`text-[10px] tracking-[0.4em] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          息息 · 宇宙
        </p>
      </div>
    </div>
  );
}
