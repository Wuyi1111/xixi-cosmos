/**
 * SplashScreen.jsx — 极简文字启动页（v4.47.17）
 *
 * 只有「息息·宇宙」四个字，居中淡入，2.5 秒后自动进入。
 * 去掉一切装饰，纯粹、安静。
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export default function SplashScreen({ onComplete, isDark }) {
  const [phase, setPhase] = useState('enter'); // enter | hold | exit | done
  const isDoneRef = useRef(false);

  const finish = useCallback(() => {
    if (isDoneRef.current) return;
    isDoneRef.current = true;
    setPhase('exit');
    setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 600);
  }, [onComplete]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 100);
    const t2 = setTimeout(() => finish(), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [finish]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-600 ${
        phase === 'exit' || phase === 'done' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${isDark ? 'bg-[#0f0f1a]' : 'bg-[#f8fafc]'}`}
    >
      <h1
        className={`text-3xl font-light tracking-[0.3em] transition-all duration-1000 ease-out ${
          isDark ? 'text-gray-200' : 'text-gray-700'
        } ${
          phase === 'enter'
            ? 'opacity-0 translate-y-4 scale-95'
            : 'opacity-100 translate-y-0 scale-100'
        }`}
      >
        息息·宇宙
      </h1>
    </div>
  );
}
