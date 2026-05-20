/**
 * BreathingWidget.jsx — 呼吸训练全屏。
 *
 * 从"此刻 → 安神助手 → 舒缓调息"打开。中央双层光环 + "吸气 / 呼气"文字交替。
 *
 * 改什么：
 *   - 改吸 / 呼切换节奏 → 这里 setInterval 的 4000ms
 *   - 改光环动画（缩放、颜色、节拍）→ src/index.css 里的
 *     @keyframes breathe / .breathe-circle（注意保持周期与上面 4000ms 协调）
 *   - 改文案"吸气 / 呼气 / 跟随光环的节奏" → 这里 JSX
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Portal from '../components/Portal.jsx';

export default function BreathingWidget({ isDark, onClose }) {
  const [phase, setPhase] = useState('吸气');

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase(p => p === '吸气' ? '呼气' : '吸气');
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Portal>
      <div data-no-pull-refresh="true" className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ backgroundColor: isDark ? '#0f0f1a' : '#f8fafc' }}>
        <button onClick={onClose} className="absolute right-6 p-2 rounded-full bg-gray-800/20 text-gray-400 top-[max(env(safe-area-inset-top)+0.5rem,2.5rem)]">
          <X size={24} />
        </button>
        <div className="flex flex-col items-center justify-center h-full space-y-16">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 breathe-circle"></div>
            <div className="absolute inset-4 rounded-full bg-indigo-400/20 breathe-circle" style={{ animationDelay: '0.2s' }}></div>
            <div className={`z-10 text-2xl font-light tracking-widest ${isDark ? 'text-white' : 'text-gray-800'} transition-opacity duration-1000`}>
              {phase}
            </div>
          </div>
          <p className={`text-sm font-light ${isDark ? 'text-gray-400' : 'text-gray-500'} tracking-widest`}>跟随光环的节奏</p>
        </div>
      </div>
    </Portal>
  );
}
