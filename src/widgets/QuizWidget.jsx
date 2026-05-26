/**
 * QuizWidget.jsx — 睡眠特质 MBTI 16 型测试，12 道题。
 *
 * 从"我的 → 探索内宇宙特质"卡片打开。每题二选一，最后聚合成
 * 4 字母 MBTI 类型（如 INFP），查 COSMIC_PERSONALITIES 给出人格名 + 描述。
 */

import { useState, useCallback } from 'react';
import { X, RotateCcw, Sparkles } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import { COSMIC_PERSONALITIES } from '../constants.js';

// 12道题，每道对应一个MBTI维度倾向
// 选项A对应第一个字母，选项B对应第二个字母
const QUESTIONS = [
  // I/E: A=I, B=E
  { q: "结束一天后，你更想怎么度过睡前时光？", a: "独自窝在房间里，享受一个人的宁静", b: "和朋友聊聊天，或者刷社交软件", aVal: 'I', bVal: 'E' },
  { q: "如果半夜醒来睡不着，你会？", a: "静静地躺着，让思绪自己飘散", b: "拿起手机，看看有没有人发消息", aVal: 'I', bVal: 'E' },
  { q: "睡前复盘今天，你的脑海里更多是？", a: "自己内心的感受和想法", b: "今天和别人发生的互动和对话", aVal: 'I', bVal: 'E' },
  // S/N: A=S, B=N
  { q: "你的梦境通常是怎样的？", a: "很日常，像是现实场景的延续", b: "光怪陆离，像在看科幻电影", aVal: 'S', bVal: 'N' },
  { q: "躺下准备睡觉时，你更容易注意到？", a: "被子有点皱、枕头高度不合适", b: "突然想到一个很久没解决的问题", aVal: 'S', bVal: 'N' },
  { q: "早上醒来还记得梦的内容吗？", a: "很少记得，或者只记得片段", b: "经常记得，而且细节很清晰", aVal: 'S', bVal: 'N' },
  // T/F: A=T, B=F
  { q: "如果睡前想到白天的一个矛盾，你会？", a: "分析谁对谁错，理清逻辑", b: "感受自己的情绪，谁受伤了", aVal: 'T', bVal: 'F' },
  { q: "朋友睡前找你倾诉烦恼，你更倾向于？", a: "帮TA分析问题，给解决方案", b: "先安慰TA，让TA感觉被理解", aVal: 'T', bVal: 'F' },
  { q: "选择睡前音乐时，你更看重？", a: "节奏和音质的搭配是否科学助眠", b: "旋律是否能触动此刻的心情", aVal: 'T', bVal: 'F' },
  // J/P: A=J, B=P
  { q: "你的就寝时间通常是？", a: "相对固定，到点就准备睡觉", b: "看心情，困了就睡不困就熬", aVal: 'J', bVal: 'P' },
  { q: "睡前你会为明天做准备吗？", a: "会，提前想好明天穿什么、做什么", b: "不会，明天的事明天再说", aVal: 'J', bVal: 'P' },
  { q: "周末的睡眠习惯是？", a: "和平时差不多，保持规律", b: "彻底放松，睡到自然醒", aVal: 'J', bVal: 'P' },
];

export default function QuizWidget({ isDark, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);

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
    const q = QUESTIONS[step];
    const val = choice === 'A' ? q.aVal : q.bVal;
    const nextAnswers = [...answers, val];
    setAnswers(nextAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // 最后一题，显示结果
      setShowResult(true);
    }
  };

  const result = showResult ? computeResult(answers) : null;

  const handleClose = () => {
    if (!result) {
      onClose();
      return;
    }
    // 测试完成自动保存
    onComplete(result);
  };

  const handleRetake = () => {
    setStep(0);
    setAnswers([]);
    setShowResult(false);
  };

  const progress = ((step + 1) / QUESTIONS.length) * 100;

  return (
    <Portal>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-[#0f0f1a]/90' : 'bg-[#f8fafc]/90'} animate-fade-in backdrop-blur-sm`}>
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-[max(env(safe-area-inset-top)+0.5rem,1.5rem)] p-2 text-gray-400 hover:text-gray-200 z-10"
        >
          <X size={24} />
        </button>

        {!showResult ? (
          /* ===== 答题阶段 ===== */
          <div className="w-full max-w-sm space-y-8">
            {/* 进度 */}
            <div className="space-y-2">
              <p className={`text-center text-xs tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                — 睡眠特质探测 —
              </p>
              <div className={`h-1 w-full rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-right text-[10px] text-gray-500">{step + 1} / {QUESTIONS.length}</p>
            </div>

            {/* 题目 */}
            <h2 className={`text-xl font-light text-center leading-relaxed min-h-[80px] flex items-center justify-center ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              <span className="animate-fade-in">{QUESTIONS[step].q}</span>
            </h2>

            {/* 选项 */}
            <div className="space-y-4 pt-4">
              <button
                onClick={() => handleAnswer('A')}
                className={`w-full p-4 rounded-2xl text-sm transition-all active:scale-95 border animate-fade-in ${
                  isDark ? 'bg-[#171724] border-gray-800 hover:border-indigo-500/50 hover:bg-[#1f1f2e]' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm hover:bg-indigo-50/50'
                }`}
              >
                {QUESTIONS[step].a}
              </button>
              <button
                onClick={() => handleAnswer('B')}
                className={`w-full p-4 rounded-2xl text-sm transition-all active:scale-95 border animate-fade-in ${
                  isDark ? 'bg-[#171724] border-gray-800 hover:border-indigo-500/50 hover:bg-[#1f1f2e]' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm hover:bg-indigo-50/50'
                }`}
                style={{ animationDelay: '0.1s' }}
              >
                {QUESTIONS[step].b}
              </button>
            </div>
          </div>
        ) : (
          /* ===== 结果阶段 ===== */
          <div className={`w-full max-w-sm rounded-[28px] border p-6 space-y-5 animate-fade-in ${
            isDark ? 'bg-[#171724] border-white/10' : 'bg-white border-gray-100 shadow-lg'
          }`}>
            {/* 头部 */}
            <div className="text-center space-y-2">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-100'}`}>
                <Sparkles size={28} className={isDark ? 'text-indigo-300' : 'text-indigo-500'} />
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
