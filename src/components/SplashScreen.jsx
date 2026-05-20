import { useState, useEffect, useRef } from 'react';

export default function SplashScreen({ onComplete, isDark }) {
  const [phase, setPhase] = useState('particles-scatter'); // particles-scatter, particles-gather, planet-idle, dissolve
  const [showText, setShowText] = useState(false);
  const animationRef = useRef(null);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 设置 canvas 尺寸
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 初始化粒子
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
        dx: 0,
        dy: 0,
        originalAngle: angle,
        originalDistance: distance
      });
    }

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制背景渐变
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
        // 根据阶段更新粒子位置
        if (phase === 'particles-scatter') {
          // 粒子分散在屏幕周围，轻微漂浮
          particle.x += Math.sin(frame * particle.speed + index) * 0.3;
          particle.y += Math.cos(frame * particle.speed + index) * 0.3;
        } else if (phase === 'particles-gather') {
          // 聚集到星球位置
          particle.gatherProgress += particle.speed * 1.5;
          if (particle.gatherProgress > 1) particle.gatherProgress = 1;

          const eased = easeOutCubic(particle.gatherProgress);
          particle.x = lerp(
            particle.x,
            particle.targetX,
            eased * 0.08
          );
          particle.y = lerp(
            particle.y,
            particle.targetY,
            eased * 0.08
          );
        } else if (phase === 'planet-idle') {
          // 星球轻微呼吸
          const breathe = Math.sin(frame * 0.03) * 2;
          const angle = particle.originalAngle;
          const dist = planetRadius * (0.85 + Math.random() * 0.3) + breathe;
          particle.targetX = centerX + Math.cos(angle) * dist;
          particle.targetY = centerY + Math.sin(angle) * dist;

          particle.x = lerp(particle.x, particle.targetX, 0.05);
          particle.y = lerp(particle.y, particle.targetY, 0.05);
        } else if (phase === 'dissolve') {
          // 向外消散
          particle.dissolveProgress += particle.speed * 0.8;
          if (particle.dissolveProgress > 1) particle.dissolveProgress = 1;

          const eased = easeInCubic(particle.dissolveProgress);
          const dissolveDistance = particle.originalDistance * eased * 1.2;
          particle.x = lerp(particle.targetX, centerX + Math.cos(particle.originalAngle) * dissolveDistance, eased * 0.05);
          particle.y = lerp(particle.targetY, centerY + Math.sin(particle.originalAngle) * dissolveDistance, eased * 0.05);
          particle.opacity = 1 - eased;
        }

        // 绘制粒子
        if (particle.opacity > 0) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? `rgba(165, 180, 252, ${particle.opacity * 0.8})`
            : `rgba(99, 102, 241, ${particle.opacity * 0.9})`;
          ctx.fill();

          // 添加光晕
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

      // 星球核心光晕
      if (phase === 'planet-idle' || phase === 'dissolve') {
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

    // 动画时序控制
    const timers = [
      setTimeout(() => setPhase('particles-gather'), 800),
      setTimeout(() => setPhase('planet-idle'), 2800),
      setTimeout(() => {
        setShowText(true);
        setPhase('dissolve');
      }, 4500),
      setTimeout(() => {
        onComplete();
      }, 6500)
    ];

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      timers.forEach(t => clearTimeout(t));
    };
  }, [phase, isDark, onComplete]);

  // 辅助函数
  const lerp = (start, end, t) => start + (end - start) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInCubic = (t) => t * t * t;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-1000 ${
        isDark ? 'bg-[#0f0f1a]' : 'bg-[#f8fafc]'
      }`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />

      {/* "息息" 文字 */}
      <div
        className={`relative z-10 transition-all duration-1000 ${
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
          息息
        </h1>
      </div>
    </div>
  );
}
