import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function SplashScreen({ onComplete, isDark }) {
  const [phase, setPhase] = useState('particles-scatter');
  const [showText, setShowText] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('吸气');
  const animationRef = useRef(null);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const breathingTimerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particleCount = 120;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 30;
    const planetRadius = Math.min(canvas.width, canvas.height) * 0.18;

    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.2;
      const distance = Math.random() * Math.max(canvas.width, canvas.height) * 0.8 + 100;
      particlesRef.current.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        targetX: centerX + Math.cos(angle) * (planetRadius * (0.8 + Math.random() * 0.4)),
        targetY: centerY + Math.sin(angle) * (planetRadius * (0.8 + Math.random() * 0.4)),
        size: Math.random() * 3 + 1.5,
        opacity: Math.random() * 0.5 + 0.5,
        speed: Math.random() * 0.02 + 0.015,
        gatherProgress: 0,
        dissolveProgress: 0,
        originalAngle: angle,
        originalDistance: distance
      });
    }

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.max(canvas.width, canvas.height) * 0.6
      );
      if (isDark) {
        gradient.addColorStop(0, 'rgba(30, 27, 75, 0.3)');
        gradient.addColorStop(0.5, 'rgba(15, 15, 26, 0.2)');
        gradient.addColorStop(1, 'rgba(15, 15, 26, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.05)');
        gradient.addColorStop(1, 'rgba(248, 250, 252, 0)');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        if (phase === 'particles-scatter') {
          particle.x += Math.sin(frame * particle.speed + index) * 0.3;
          particle.y += Math.cos(frame * particle.speed + index) * 0.3;
        } else if (phase === 'particles-gather') {
          particle.gatherProgress += particle.speed * 1.5;
          if (particle.gatherProgress > 1) particle.gatherProgress = 1;

          const eased = easeOutCubic(particle.gatherProgress);
          particle.x = lerp(particle.x, particle.targetX, eased * 0.08);
          particle.y = lerp(particle.y, particle.targetY, eased * 0.08);
        } else if (phase === 'planet-idle' || phase === 'breathing') {
          const breathe = Math.sin(frame * 0.03) * 2;
          const angle = particle.originalAngle;
          const dist = planetRadius * (0.85 + Math.random() * 0.3) + breathe;
          particle.targetX = centerX + Math.cos(angle) * dist;
          particle.targetY = centerY + Math.sin(angle) * dist;

          particle.x = lerp(particle.x, particle.targetX, 0.05);
          particle.y = lerp(particle.y, particle.targetY, 0.05);
        } else if (phase === 'dissolve') {
          particle.dissolveProgress += particle.speed * 0.8;
          if (particle.dissolveProgress > 1) particle.dissolveProgress = 1;

          const eased = easeInCubic(particle.dissolveProgress);
          const dissolveDistance = particle.originalDistance * eased * 1.2;
          particle.x = lerp(particle.targetX, centerX + Math.cos(particle.originalAngle) * dissolveDistance, eased * 0.05);
          particle.y = lerp(particle.targetY, centerY + Math.sin(particle.originalAngle) * dissolveDistance, eased * 0.05);
          particle.opacity = 1 - eased;
        }

        if (particle.opacity > 0) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? `rgba(165, 180, 252, ${particle.opacity * 0.8})`
            : `rgba(99, 102, 241, ${particle.opacity * 0.9})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 2.5, 0, Math.PI * 2);
          const glowGradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 2.5
          );
          glowGradient.addColorStop(0, isDark
            ? `rgba(99, 102, 241, ${particle.opacity * 0.3})`
            : `rgba(99, 102, 241, ${particle.opacity * 0.2})`);
          glowGradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
          ctx.fillStyle = glowGradient;
          ctx.fill();
        }
      });

      if (phase === 'planet-idle' || phase === 'breathing' || phase === 'dissolve') {
        const coreOpacity = phase === 'dissolve' ? 1 - particlesRef.current[0]?.dissolveProgress : 1;

        ctx.beginPath();
        ctx.arc(centerX, centerY, planetRadius * 1.3, 0, Math.PI * 2);
        const coreGradient = ctx.createRadialGradient(
          centerX, centerY, planetRadius * 0.5,
          centerX, centerY, planetRadius * 1.3
        );
        coreGradient.addColorStop(0, isDark
          ? `rgba(99, 102, 241, ${0.4 * coreOpacity})`
          : `rgba(139, 92, 246, ${0.2 * coreOpacity})`);
        coreGradient.addColorStop(0.5, isDark
          ? `rgba(129, 140, 248, ${0.2 * coreOpacity})`
          : `rgba(165, 180, 252, ${0.1 * coreOpacity})`);
        coreGradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = coreGradient;
        ctx.fill();
      }

      frame++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const timers = [
      setTimeout(() => setPhase('particles-gather'), 800),
      setTimeout(() => setPhase('planet-idle'), 2800),
      setTimeout(() => {
        setShowText(true);
        setShowBreathing(true);
        setPhase('breathing');
      }, 3500)
    ];

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      timers.forEach(t => clearTimeout(t));
      if (breathingTimerRef.current) {
        clearInterval(breathingTimerRef.current);
      }
    };
  }, [phase, isDark]);

  // 呼吸动画
  useEffect(() => {
    if (!showBreathing) return;

    const interval = setInterval(() => {
      setBreathingPhase(prev => prev === '吸气' ? '呼气' : '吸气');
    }, 4000);

    breathingTimerRef.current = interval;

    return () => clearInterval(interval);
  }, [showBreathing]);

  const handleClose = () => {
    setPhase('dissolve');
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const lerp = (start, end, t) => start + (end - start) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInCubic = (t) => t * t * t;

  const breatheScale = breathingPhase === '吸气' ? 1.1 : 0.9;
  const breatheOpacity = breathingPhase === '吸气' ? 1 : 0.7;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-1000 ${
        isDark ? 'bg-[#0f0f1a]' : 'bg-[#f8fafc]'
      }`}
    >
      {/* 关闭按钮 */}
      <button
        onClick={handleClose}
        className={`absolute top-[max(env(safe-area-inset-top)+1rem,2rem)] right-6 z-20 p-2 rounded-full transition-all active:scale-95 ${
          isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        }`}
      >
        <X size={24} />
      </button>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />

      {/* 内容区域 */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* 品牌标语 */}
        <div
          className={`transition-all duration-1000 ${
            showText
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}
        >
          <h1
            className={`text-5xl font-light tracking-widest ${
              isDark
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500'
            }`}
            style={{
              textShadow: isDark
                ? '0 0 40px rgba(99, 102, 241, 0.3)'
                : '0 0 40px rgba(99, 102, 241, 0.2)'
            }}
          >
            息息 · 宇宙
          </h1>
        </div>

        {/* 舒缓调息 */}
        <div
          className={`transition-all duration-1000 delay-500 ${
            showBreathing
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            {/* 呼吸光晕 */}
            <div
              className="relative w-32 h-32 flex items-center justify-center transition-all duration-[4000ms] ease-in-out"
              style={{
                transform: `scale(${breatheScale})`,
                opacity: breatheOpacity
              }}
            >
              <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-400/15'} blur-xl`} />
              <div className={`absolute inset-4 rounded-full ${isDark ? 'bg-indigo-400/15' : 'bg-indigo-300/10'} blur-lg`} />
              <div className={`absolute inset-8 rounded-full ${isDark ? 'bg-indigo-300/10' : 'bg-indigo-200/10'} blur-md`} />
              <span className={`text-2xl relative z-10 ${isDark ? 'text-indigo-200' : 'text-indigo-600'}`}>
                🌙
              </span>
            </div>

            {/* 呼吸文字 */}
            <div className="text-center space-y-1">
              <p className={`text-lg font-light tracking-wider transition-all duration-[4000ms] ${isDark ? 'text-indigo-200' : 'text-indigo-600'}`}>
                {breathingPhase}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                跟随呼吸，慢慢进入
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
