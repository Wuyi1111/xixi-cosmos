/**
 * QuizWidget.jsx — 睡眠特质 MBTI 16 型测试，8 道题（v4.36.0 视觉升级版）
 *
 * 升级内容：
 *   - 题目配 emoji 场景图标
 *   - 选项卡片增加图标+文字
 *   - 选择后有过渡动画
 *   - 结果页增加星空粒子背景
 *   - 题目从12道精简到8道
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { X, RotateCcw, Sparkles, Star, Moon, Sun, Cloud, Heart, Brain, Zap, Compass } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import { COSMIC_PERSONALITIES } from '../constants.js';

// 8道题，每道配 emoji 场景 + 图标
const QUESTIONS = [
  {
    q: "今夜入睡前，你的思绪飘向了哪里？",
    emoji: "🌙",
    a: "回到自己的星球，独自安静",
    b: "飞向热闹的星云，与人分享",
    aIcon: Moon,
    bIcon: Sun,
    aVal: 'I', bVal: 'E'
  },
  {
    q: "梦境里，你更常看到什么？",
    emoji: "💭",
    a: "熟悉的日常，像现实的延续",
    b: "奇幻的场景，像星际旅行",
    aIcon: Cloud,
    bIcon: Star,
    aVal: 'S', bVal: 'N'
  },
  {
    q: "如果睡前想到白天的矛盾，你会？",
    emoji: "🌊",
    a: "分析来龙去脉，理清逻辑",
    b: "感受情绪波动，谁受伤了",
    aIcon: Brain,
    bIcon: Heart,
    aVal: 'T', bVal: 'F'
  },
  {
    q: "你的就寝时间通常是？",
    emoji: "⏰",
    a: "相对固定，到点就准备",
    b: "看心情，困了就睡",
    aIcon: Compass,
    bIcon: Zap,
    aVal: 'J', bVal: 'P'
  },
  {
    q: "半夜醒来时，你会？",
    emoji: "🌌",
    a: "静静躺着，等睡意回来",
    b: "拿起手机，看看消息",
    aIcon: Moon,
    bIcon: Sun,
    aVal: 'I', bVal: 'E'
  },
  {
    q: "早上醒来还记得梦吗？",
    emoji: "🌠",
    a: "很少记得，或者片段模糊",
    b: "经常记得，细节很清晰",
    aIcon: Cloud,
    bIcon: Star,
    aVal: 'S', bVal: 'N'
  },
  {
    q: "朋友睡前找你倾诉，你会？",
    emoji: "💫",
    a: "帮TA分析问题，给方案",
    b: "先安慰TA，让TA被理解",
    aIcon: Brain,
    bIcon: Heart,
    aVal: 'T', bVal: 'F'
  },
  {
    q: "周末的睡眠习惯是？",
    emoji: "🛏️",
    a: "和平时差不多，保持规律",
    b: "彻底放松，睡到自然醒",
    aIcon: Compass,
    bIcon: Zap,
    aVal: 'J', bVal: 'P'
  },
];

// 星空粒子背景组件
function StarFieldBackground({ isDark }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 星星
    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.01,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        star.opacity += star.twinkleSpeed;
        const alpha = (Math.sin(star.opacity) + 1) / 2 * 0.8 + 0.2;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(147, 197, 253, ${alpha})`
          : `rgba(99, 102, 241, ${alpha * 0.6})`;
        ctx.fill();

        // 轻微移动
        star.y -= star.speed;
        if (star.y < -5) {
          star.y = canvas.height + 5;
          star.x = Math.random() * canvas.width;
        }
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

export default function QuizWidget({ isDark, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const computeResult = useCallback((finalAnswers) => {
    const count = (char) => finalAnswers.filter(a => a === char).length;

    const i = count('I'), e = count('E');
    const s = count('S'), n = count('N');
    const t = count('T'), f = count('F');
    const j = count('J'), p = count('P');

    const type = [
      i >= e ? 'I' : 'E',
      s >= n ? 'S' : 'N',
      t >= f ? 'T' : 'F',
      j >= p ? 'J' : 'P'
    ].join('');

    const personality = COSMIC_PERSONALITIES[type] || COSMIC_PERSONALITIES['ISFJ'];

    return {
      ...personality,
      type,
    };
  }, []);

  const handleAnswer = (choice) => {
    if (isTransitioning) return;
    setSelectedChoice(choice);
    setIsTransitioning(true);

    const q = QUESTIONS[step];
    const val = choice === 'A' ? q.aVal : q.bVal;
    const nextAnswers = [...answers, val];

    // 延迟后进入下一题
    setTimeout(() => {
      setAnswers(nextAnswers);
      setSelectedChoice(null);
      setIsTransitioning(false);

      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
      } else {
        setShowResult(true);
      }
    }, 400);
  };

  const result = showResult ? computeResult(answers) : null;

  const handleClose = () => {
    if (!result) {
      onClose();
      return;
    }
    onComplete(result);
  };

  const handleRetake = () => {
    setStep(0);
    setAnswers([]);
    setShowResult(false);
    setSelectedChoice(null);
  };

  const progress = ((step + 1) / QUESTIONS.length) * 100;
  const currentQ = QUESTIONS[step];
  const AIcon = currentQ.aIcon;
  const BIcon = currentQ.bIcon;

  return (
    <Portal>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-[#0f0f1a]/95' : 'bg-[#f8fafc]/95'} animate-fade-in backdrop-blur-sm`}>
        {/* 星空背景（结果页显示） */}
        {showResult && <StarFieldBackground isDark={isDark} />}

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-[max(env(safe-area-inset-top)+0.5rem,1.5rem)] p-2 text-gray-400 hover:text-gray-200 z-10"
        >
          <X size={24} />
        </button>

        {!showResult ? (
          /* ===== 答题阶段 ===== */
          <div className="w-full max-w-sm space-y-6 relative z-10">
            {/* 进度 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className={`text-xs tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  睡眠特质探测
                </p>
                <p className="text-[10px] text-gray-500">{step + 1} / {QUESTIONS.length}</p>
              </div>
              <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <div className="h-full bg-indigo-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              {/* 星星节点 */}
              <div className="flex justify-between px-1">
                {QUESTIONS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      idx <= step ? 'bg-indigo-500 scale-100' : 'bg-gray-600 scale-75'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 题目区域 */}
            <div className="text-center space-y-4">
              {/* emoji */}
              <div className={`text-5xl animate-float ${isTransitioning ? 'opacity-0 scale-90 transition-all duration-300' : 'opacity-100 scale-100 transition-all duration-300'}`}>
                {currentQ.emoji}
              </div>

              <h2 className={`text-xl font-light text-center leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-800'} ${isTransitioning ? 'opacity-0 translate-x-[-20px] transition-all duration-300' : 'opacity-100 translate-x-0 transition-all duration-300'}`}>
                {currentQ.q}
              </h2>
            </div>

            {/* 选项 */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleAnswer('A')}
                disabled={isTransitioning}
                className={`w-full p-4 rounded-2xl text-sm transition-all border flex items-center gap-3 ${
                  selectedChoice === 'A'
                    ? (isDark ? 'bg-indigo-500/20 border-indigo-500/50 scale-[0.98]' : 'bg-indigo-50 border-indigo-300 scale-[0.98]')
                    : selectedChoice === 'B'
                      ? (isDark ? 'bg-[#171724] border-gray-800 opacity-50' : 'bg-white border-gray-100 opacity-50')
                      : (isDark ? 'bg-[#171724] border-gray-800 hover:border-indigo-500/50 hover:bg-[#1f1f2e]' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm hover:bg-indigo-50/50')
                } ${isTransitioning ? 'pointer-events-none' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                  <AIcon size={18} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                </div>
                <span className="flex-1 text-left">{currentQ.a}</span>
              </button>

              <button
                onClick={() => handleAnswer('B')}
                disabled={isTransitioning}
                className={`w-full p-4 rounded-2xl text-sm transition-all border flex items-center gap-3 ${
                  selectedChoice === 'B'
                    ? (isDark ? 'bg-indigo-500/20 border-indigo-500/50 scale-[0.98]' : 'bg-indigo-50 border-indigo-300 scale-[0.98]')
                    : selectedChoice === 'A'
                      ? (isDark ? 'bg-[#171724] border-gray-800 opacity-50' : 'bg-white border-gray-100 opacity-50')
                      : (isDark ? 'bg-[#171724] border-gray-800 hover:border-indigo-500/50 hover:bg-[#1f1f2e]' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm hover:bg-indigo-50/50')
                } ${isTransitioning ? 'pointer-events-none' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                  <BIcon size={18} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                </div>
                <span className="flex-1 text-left">{currentQ.b}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ===== 结果阶段 ===== */
          <div className={`w-full max-w-sm rounded-[28px] border p-6 space-y-5 animate-fade-in relative z-10 ${
            isDark ? 'bg-[#171724]/90 border-white/10' : 'bg-white/90 border-gray-100 shadow-lg'
          }`}>
            {/* 头部 */}
            <div className="text-center space-y-2">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-100'} animate-float`}>
                <Sparkles size={32} className={isDark ? 'text-indigo-300' : 'text-indigo-500'} />
              </div>
              <p className={`text-[10px] font-medium tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                你的宇宙睡眠人格
              </p>
              <h2 className={`text-2xl font-medium tracking-wide ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {result.name}
              </h2>
              <span className={`inline-block text-xs px-3 py-1 rounded-full font-mono ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                {result.type}
              </span>
            </div>

            {/* 标签 */}
            <div className="flex flex-wrap justify-center gap-2">
              {result.tags.map((tag, idx) => (
                <span key={idx} className={`text-[10px] px-3 py-1.5 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-200' : 'bg-indigo-100/80 text-indigo-700'}`}>
                  {tag}
                </span>
              ))}
            </div>

            {/* 描述 */}
            <p className={`text-sm leading-relaxed font-light text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {result.desc}
            </p>

            {/* 相似人数 */}
            <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                宇宙中有 <span className={`font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>{(result.type.charCodeAt(0) % 5 + 3) * 1000 + Math.floor(Math.random() * 500)}</span> 颗星星与你同类型
              </p>
            </div>

            {/* 按钮组 */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleRetake}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all active:scale-95 ${
                  isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <RotateCcw size={14} />
                重新测试
              </button>
              <button
                onClick={handleClose}
                className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all active:scale-95 ${
                  isDark ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-indigo-500 text-white hover:bg-indigo-600'
                }`}
              >
                完成
              </button>
            </div>
          </div>
        )}
      </div>
    </Portal>
  );
}
