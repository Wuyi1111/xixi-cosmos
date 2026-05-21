/**
 * StarField.jsx — 动态星空背景组件
 *
 * 深色模式：白色/淡蓝色星星，不同亮度缓慢闪烁
 * 浅色模式：淡金色/银色微光粒子，像阳光下的尘埃
 */

import { useMemo } from 'react';

export default function StarField({ isDark }) {
  // 生成固定数量的星星，避免每次渲染重新生成导致闪烁
  const stars = useMemo(() => {
    const count = isDark ? 80 : 50;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
    }));
  }, [isDark]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full animate-twinkle"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: isDark
              ? `rgba(200, 220, 255, ${star.opacity})`
              : `rgba(180, 160, 120, ${star.opacity * 0.5})`,
            boxShadow: isDark
              ? `0 0 ${star.size * 2}px rgba(200, 220, 255, ${star.opacity * 0.5})`
              : `0 0 ${star.size * 2}px rgba(180, 160, 120, ${star.opacity * 0.3})`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}

      {/* 深色模式下的星云光晕 */}
      {isDark && (
        <>
          <div
            className="absolute w-96 h-96 rounded-full opacity-20"
            style={{
              top: '10%',
              left: '20%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            className="absolute w-80 h-80 rounded-full opacity-15"
            style={{
              top: '50%',
              right: '10%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
          <div
            className="absolute w-64 h-64 rounded-full opacity-10"
            style={{
              bottom: '20%',
              left: '30%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
        </>
      )}

      {/* 浅色模式下的柔和光晕 */}
      {!isDark && (
        <>
          <div
            className="absolute w-96 h-96 rounded-full opacity-30"
            style={{
              top: '5%',
              right: '15%',
              background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            className="absolute w-80 h-80 rounded-full opacity-20"
            style={{
              bottom: '30%',
              left: '10%',
              background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
        </>
      )}
    </div>
  );
}
