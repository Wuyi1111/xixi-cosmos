/**
 * QuizWidget.jsx — 睡眠特质 MBTI 16 型测试，10 道题。
 *
 * 从"我的 → 探索内宇宙特质"卡片打开。每题二选一，最后聚合成
 * 4 字母 MBTI 类型（如 INFP），查 COSMIC_PERSONALITIES 给出人格名 + 描述。
 *
 * 改什么：
 *   - 加 / 删 / 改测试题目（题面 + 两个选项 + 倾向字母）→ 这里 questions 数组
 *   - 改最终人格的名字、标签、文案 → src/constants.js 的 COSMIC_PERSONALITIES
 *   - 改 4 维聚合算法（哪些题对应哪个维度）→ handleSelect 里的 count(...) 比较
 *   - 改首测奖励星尘数（默认 30）→ src/views/MineView.jsx 的 onComplete 处
 */

import { useState } from 'react';
import { X, Save, RotateCcw, CheckCircle2 } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import { COSMIC_PERSONALITIES } from '../constants.js';

// 性格测试小组件 (MBTI宇宙版 - 10道题)
export default function QuizWidget({ isDark, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const questions = [
    { q: "你的就寝时间通常是？", options: [{ text: "像恒星日出日落般规律", val: 'J' }, { text: "像流星一样随机出没", val: 'P' }] },
    { q: "睡前半小时，你更倾向于？", options: [{ text: "刷手机接收「星际电波」", val: 'E' }, { text: "听音乐/发呆进入「静默舱」", val: 'I' }] },
    { q: "躺下后，你进入睡眠的速度？", options: [{ text: "瞬间断电，跌入黑洞", val: 'N' }, { text: "辗转反侧，在轨道上徘徊", val: 'S' }] },
    { q: "你的梦境通常是怎样的？", options: [{ text: "很少做梦，或梦境很日常现实", val: 'T' }, { text: "光怪陆离的平行宇宙", val: 'F' }] },
    { q: "睡着后，外界的声音能轻易唤醒你吗？", options: [{ text: "一点风吹草动就醒", val: 'S' }, { text: "雷打不动，深度休眠", val: 'N' }] },
    { q: "闭上眼睛时，你的脑海里？", options: [{ text: "思绪万千，像一场星际风暴", val: 'E' }, { text: "逐渐清空，归于虚无", val: 'I' }] },
    { q: "到了周末，你的睡眠习惯会？", options: [{ text: "保持原本的轨道运行", val: 'J' }, { text: "彻底脱轨，睡到自然醒", val: 'P' }] },
    { q: "早上醒来后，你还记得昨晚的梦吗？", options: [{ text: "醒来就忘，只留下模糊的星尘", val: 'T' }, { text: "历历在目，像看了一场全息电影", val: 'F' }] },
    { q: "如果半夜醒来睡不着，你会怎么做？", options: [{ text: "拿起手机重新连接宇宙网络", val: 'E' }, { text: "闭着眼尝试冥想呼吸", val: 'I' }] },
    { q: "早晨的闹钟设置是？", options: [{ text: "一个闹钟，准时唤醒", val: 'J' }, { text: "多个闹钟，像陨石带一样密集", val: 'P' }] }
  ];

  const handleSelect = (val) => {
    const newAnswers = [...answers, val];
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(s => s + 1);
    } else {
      const count = (char) => newAnswers.filter(a => a === char).length;
      const type = [
        count('I') >= count('E') ? 'I' : 'E',
        count('S') >= count('N') ? 'S' : 'N',
        count('F') >= count('T') ? 'F' : 'T',
        count('J') >= count('P') ? 'J' : 'P'
      ].join('');
      const personalityResult = COSMIC_PERSONALITIES[type] || COSMIC_PERSONALITIES['ISFJ'];
      setResult({ ...personalityResult, type });
    }
  };

  const handleSave = () => {
    onComplete(result);
    setIsSaved(true);
  };

  const handleCloseWithoutSave = () => {
    onComplete(null, result);
  };

  const handleRetake = () => {
    setStep(0);
    setAnswers([]);
    setResult(null);
    setIsSaved(false);
  };

  return (
    <Portal>
      <div data-no-pull-refresh="true" className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]' : 'bg-[#f8fafc]'} animate-fade-in`}>
        <button onClick={onClose} className="absolute right-6 p-2 text-gray-400 hover:text-gray-200 top-[max(env(safe-area-inset-top)+0.5rem,2.5rem)]">
          <X size={24} />
        </button>

        {/* 结果弹窗 */}
        {result ? (
          <div className="w-full max-w-sm flex flex-col items-center justify-center space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <p className={`text-xs tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                — 探测完成 —
              </p>
              <h2 className={`text-3xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {result.name}
              </h2>
              <span className={`inline-block text-sm font-mono px-3 py-1 rounded-full ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                {result.type}
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {result.tags.map((tag, idx) => (
                <span key={idx} className={`text-xs px-3 py-1.5 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}>
                  {tag}
                </span>
              ))}
            </div>

            <p className={`text-sm leading-relaxed text-center max-w-[280px] font-light ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {result.desc}
            </p>

            <div className="flex gap-3 w-full pt-4">
              {isSaved ? (
                <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={16} />
                  已保存
                </div>
              ) : (
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors active:scale-95"
                >
                  <Save size={16} />
                  保存结果
                </button>
              )}
              <button
                onClick={handleCloseWithoutSave}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium border transition-colors active:scale-95 ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                <X size={16} />
                关闭
              </button>
            </div>

            <button
              onClick={handleRetake}
              className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
            >
              <RotateCcw size={12} />
              重新测试
            </button>
          </div>
        ) : (
          /* 测试界面 */
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2">
              <p className={`text-center text-xs tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                — 睡眠特质探测 —
              </p>
              <div className={`h-1 w-full rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${((step + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-right text-[10px] text-gray-500">{step + 1} / {questions.length}</p>
            </div>

            <h2 className={`text-xl font-light text-center leading-relaxed h-20 flex items-center justify-center ${isDark ? 'text-gray-200' : 'text-gray-800'}`} key={step}>
              <span className="animate-fade-in">{questions[step].q}</span>
            </h2>

            <div className="space-y-4 pt-4">
              {questions[step].options.map((opt, i) => (
                <button
                  key={i + '-' + step}
                  onClick={() => handleSelect(opt.val)}
                  className={`w-full p-4 rounded-2xl text-sm transition-all active:scale-95 border animate-fade-in ${
                    isDark ? 'bg-[#171724] border-gray-800 hover:border-indigo-500/50 hover:bg-[#1f1f2e]' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm hover:bg-indigo-50/50'
                  }`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Portal>
  );
}
