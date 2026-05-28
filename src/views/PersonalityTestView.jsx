/**
 * PersonalityTestView.jsx — 睡眠人格测试独立子界面
 *
 * 首次用户启动页后自动进入，参考卡片式布局
 * 8道题，做完显示结果，然后进入 TonightView
 */

import { useState, useCallback } from 'react';
import { Sparkles, Moon, Sun, Cloud, Heart, Brain, Zap, Compass, Star, RotateCcw } from 'lucide-react';
import { COSMIC_PERSONALITIES } from '../constants.js';

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

export default function PersonalityTestView({ isDark, onComplete }) {
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
    return { ...personality, type };
  }, []);

  const handleAnswer = (choice) => {
    if (isTransitioning) return;
    setSelectedChoice(choice);
    setIsTransitioning(true);

    const q = QUESTIONS[step];
    const val = choice === 'A' ? q.aVal : q.bVal;
    const nextAnswers = [...answers, val];

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

  const handleFinish = () => {
    const result = computeResult(answers);
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

  if (showResult) {
    const result = computeResult(answers);
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]' : 'bg-[#f8fafc]'}`}>
        <div className={`w-full max-w-sm rounded-[28px] p-8 space-y-6 ${isDark ? 'bg-[#171724] border border-white/10' : 'bg-white border border-gray-100 shadow-lg'}`}>
          {/* 头部 */}
          <div className="text-center space-y-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-100'}`}>
              <Sparkles size={32} className={isDark ? 'text-indigo-300' : 'text-indigo-500'} />
            </div>
            <p className={`text-[10px] font-medium tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              你的宇宙睡眠人格
            </p>
            <h2 className={`text-2xl font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {result.name}
            </h2>
            <span className={`inline-block text-xs px-3 py-1 rounded-full font-mono ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              {result.type}
            </span>
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap justify-center gap-2">
            {result.tags.map((tag, idx) => (
              <span key={idx} className={`text-[10px] px-3 py-1.5 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}>
                {tag}
              </span>
            ))}
          </div>

          {/* 描述 */}
          <p className={`text-sm leading-relaxed text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {result.desc}
          </p>

          {/* 按钮 */}
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
              onClick={handleFinish}
              className="flex-1 py-3 rounded-2xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 active:scale-95 transition-all"
            >
              进入宇宙
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]' : 'bg-[#f8fafc]'}`}>
      <div className="w-full max-w-sm space-y-8">
        {/* 顶部标题 */}
        <div>
          <h1 className="text-xl font-medium mb-1">探索睡眠人格</h1>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            8 道题，发现属于你的宇宙归属
          </p>
        </div>

        {/* 进度 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>进度</span>
            <span className="text-[10px] text-gray-500">{step + 1} / {QUESTIONS.length}</span>
          </div>
          <div className={`h-1 w-full rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <div className="h-full bg-indigo-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* 题目卡片 */}
        <div className={`p-6 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}>
          {/* emoji */}
          <div className={`text-4xl text-center mb-4 ${isTransitioning ? 'opacity-0 scale-90 transition-all duration-300' : 'opacity-100 scale-100 transition-all duration-300'}`}>
            {currentQ.emoji}
          </div>

          {/* 题目 */}
          <h2 className={`text-lg font-light text-center leading-relaxed mb-6 ${isDark ? 'text-gray-200' : 'text-gray-800'} ${isTransitioning ? 'opacity-0 translate-x-[-20px] transition-all duration-300' : 'opacity-100 translate-x-0 transition-all duration-300'}`}>
            {currentQ.q}
          </h2>

          {/* 选项 */}
          <div className="space-y-3">
            <button
              onClick={() => handleAnswer('A')}
              disabled={isTransitioning}
              className={`w-full p-4 rounded-2xl text-sm transition-all border flex items-center gap-3 ${
                selectedChoice === 'A'
                  ? (isDark ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-indigo-50 border-indigo-300')
                  : (isDark ? 'bg-[#1f1f2e] border-gray-800 hover:border-indigo-500/30' : 'bg-gray-50 border-gray-100 hover:border-indigo-200')
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
                  ? (isDark ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-indigo-50 border-indigo-300')
                  : (isDark ? 'bg-[#1f1f2e] border-gray-800 hover:border-indigo-500/30' : 'bg-gray-50 border-gray-100 hover:border-indigo-200')
              } ${isTransitioning ? 'pointer-events-none' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                <BIcon size={18} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
              </div>
              <span className="flex-1 text-left">{currentQ.b}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
