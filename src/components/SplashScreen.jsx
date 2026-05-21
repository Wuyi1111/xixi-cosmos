import { useState, useEffect, useRef, useCallback } from 'react';
import { SkipForward } from 'lucide-react';

export default function SplashScreen({ onComplete, isDark }) {
  const [phase, setPhase] = useState('intro'); // intro | breathing | done
  const [breathPhase, setBreathPhase] = useState('prepare'); // prepare | inhale | exhale
  const [cycleCount, setCycleCount] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const timersRef = useRef([]);
  const isSkippedRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  }, []);

  const finish = useCallback(() => {
    if (isSkippedRef.current) return;
    isSkippedRef.current = true;
    clearAllTimers();
    setPhase('done');
    setTimeout(() => {
      onComplete();
    }, 600);
  }, [onComplete, clearAllTimers]);

  // 呼吸循环：每个循环约 4-5 秒，3 个循环共 12-15 秒
  useEffect(() => {
    const runBreathing = () => {
      // 准备阶段显示 1 秒
      const t1 = setTimeout(() => {
        setShowContent(true);
        setPhase('breathing');
      }, 600);
      timersRef.current.push(t1);

      let currentCycle = 0;
      const maxCycles = 3;

      const runCycle = () => {
        if (isSkippedRef.current) return;
        if (currentCycle >= maxCycles) {
          finish();
          return;
        }

        // 吸气 2.5 秒
        setBreathPhase('inhale');
        const tInhale = setTimeout(() => {
          if (isSkippedRef.current) return;
          // 呼气 2.5 秒
          setBreathPhase('exhale');
          const tExhale = setTimeout(() => {
            if (isSkippedRef.current) return;
            currentCycle++;
            setCycleCount(currentCycle);
            runCycle();
          }, 2500);
          timersRef.current.push(tExhale);
        }, 2500);
        timersRef.current.push(tInhale);
      };

      // 开始呼吸循环
      const tStart = setTimeout(() => {
        runCycle();
      }, 1200);
      timersRef.current.push(tStart);
    };

    runBreathing();

    return () => clearAllTimers();
  }, [finish, clearAllTimers]);

  const handleSkip = () => {
    finish();
  };

  const breatheScale = breathPhase === 'inhale' ? 1.25 : breathPhase === 'exhale' ? 0.85 : 1;
  const breatheOpacity = breathPhase === 'inhale' ? 1 : breathPhase === 'exhale' ? 0.6 : 0.8;

  const breathText = {
    prepare: '开始前，先一起呼吸吧',
    inhale: '吸气',
    exhale: '呼气',
  };

  const breathSubText = {
    prepare: '让自己慢下来',
    inhale: '把星空吸进身体',
    exhale: '把疲惫交给宇宙',
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-700 ${
        phase === 'done' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${isDark ? 'bg-[#0f0f1a]' : 'bg-[#f8fafc]'}`}
    >
      {/* 背景光晕 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full transition-all duration-[2500ms] ease-in-out ${
            isDark ? 'bg-indigo-500/8' : 'bg-indigo-400/8'
          }`}
          style={{
            transform: `translate(-50%, -50%) scale(${breatheScale * 1.5})`,
            opacity: breatheOpacity,
          }}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full transition-all duration-[2500ms] ease-in-out ${
            isDark ? 'bg-purple-500/6' : 'bg-purple-400/6'
          }`}
          style={{
            transform: `translate(-50%, -50%) scale(${breatheScale * 1.2})`,
            opacity: breatheOpacity * 0.8,
          }}
        />
      </div>

      {/* 跳过按钮 */}
      <button
        onClick={handleSkip}
        className={`absolute top-[max(env(safe-area-inset-top)+1rem,1.5rem)] right-5 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] transition-all active:scale-95 ${
          isDark
            ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        }`}
      >
        <SkipForward size={12} />
        跳过
      </button>

      {/* 内容区域 */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-6 transition-all duration-700 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* 品牌标语 */}
        <div className="mb-10">
          <h1
            className={`text-4xl font-light tracking-[0.15em] mb-3 ${
              isDark
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500'
            }`}
          >
            息息 · 宇宙
          </h1>
          <p className={`text-xs tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            与繁星作伴，和内心和解
          </p>
        </div>

        {/* 呼吸动画 */}
        <div className="flex flex-col items-center">
          {/* 呼吸圆环 */}
          <div
            className="relative w-28 h-28 mb-6 transition-all duration-[2500ms] ease-in-out"
            style={{
              transform: `scale(${breatheScale})`,
              opacity: breatheOpacity,
            }}
          >
            {/* 外环 */}
            <div
              className={`absolute inset-0 rounded-full border-2 transition-colors duration-1000 ${
                breathPhase === 'inhale'
                  ? (isDark ? 'border-indigo-400/40' : 'border-indigo-400/50')
                  : (isDark ? 'border-indigo-500/15' : 'border-indigo-300/20')
              }`}
            />
            {/* 内环 */}
            <div
              className={`absolute inset-3 rounded-full border transition-colors duration-1000 ${
                breathPhase === 'inhale'
                  ? (isDark ? 'border-purple-400/30' : 'border-purple-400/40')
                  : (isDark ? 'border-purple-500/10' : 'border-purple-300/15')
              }`}
            />
            {/* 中心 */}
            <div className={`absolute inset-0 flex items-center justify-center`}>
              <span className="text-2xl">🌙</span>
            </div>
          </div>

          {/* 呼吸文字 */}
          <div className="space-y-2">
            <p
              className={`text-lg font-light tracking-widest transition-all duration-1000 ${
                isDark ? 'text-indigo-200' : 'text-indigo-600'
              }`}
            >
              {breathText[breathPhase]}
            </p>
            <p className={`text-xs transition-all duration-1000 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {breathSubText[breathPhase]}
            </p>
          </div>

          {/* 循环进度点 */}
          {phase === 'breathing' && (
            <div className="flex items-center gap-2 mt-8">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-500 ${
                    i < cycleCount
                      ? 'w-4 h-1.5 bg-indigo-500'
                      : i === cycleCount && breathPhase !== 'prepare'
                      ? 'w-4 h-1.5 bg-indigo-500/50'
                      : 'w-1.5 h-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
