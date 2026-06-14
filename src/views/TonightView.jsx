/**
 * TonightView.jsx — "此刻"板块（v4.47.8 沉浸优化版）
 *
 * 全屏沉浸式对话，3 轮固定对话结构。
 * 优化内容：
 *   - 打字机效果逐字显示
 *   - 第二轮多句递进，更有层次
 *   - 月亮图标呼吸动画 + 情绪微光颜色
 *   - 对话结束后安静星空过渡
 *   - 背景极淡星星闪烁
 *   - 界面加长
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Moon, Sparkles } from 'lucide-react';

/* ─────────────── 对话树配置 ─────────────── */
const DIALOG_TREE = {
  // 第一轮：问候（时段匹配，动态替换）
  greeting: {
    text: '', // 运行时由 getGreetingText() 填充
    options: [
      { text: '有，想说说', next: 'choice_a', color: 'amber' },
      { text: '没什么，就是来看看', next: 'choice_b', color: 'indigo' },
      { text: '不太好，但不想说', next: 'choice_c', color: 'slate' },
    ],
  },

  // 第二轮：收束与安抚（多句递进）
  choice_a: {
    lines: [
      '谢谢你愿意说。',
      '不过今晚不用告诉我具体发生了什么。',
      '把它放在心里，然后好好休息。明天的事交给明天的引力。',
    ],
    options: null,
  },
  choice_b: {
    lines: [
      '来看看本身就是一种温柔的举动。',
      '不需要有什么目的，在这里待一会儿就好。',
      '星星不会因为没人看就不发光。',
    ],
    options: null,
  },
  choice_c: {
    lines: [
      '不想说就不说。',
      '有些感受需要时间才能被翻译。',
      '今晚先把它们放在枕头下面，让梦去整理。',
    ],
    options: null,
  },
};

/* ─────────────── 时段问候语 ─────────────── */
function getGreetingText() {
  const h = new Date().getHours();
  if (h >= 18 && h < 21) {
    return '刚结束一天的忙碌吧。不用急着整理自己，先喘口气。';
  }
  if (h >= 21 || h < 0) {
    return '夜深了一点。你还没睡，是有什么在脑子里转吗。';
  }
  if (h >= 0 && h < 6) {
    return '这个时间还醒着，今天可能不太好过。没关系，我陪着你。';
  }
  return '夜深了，我们都在。';
}

/* ─────────────── 打字机 hook ─────────────── */
function useTypewriter(text, speed = 45, enabled = true) {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplay(text || '');
      setDone(true);
      return;
    }
    idxRef.current = 0;
    setDisplay('');
    setDone(false);

    const timer = setInterval(() => {
      idxRef.current += 1;
      setDisplay(text.slice(0, idxRef.current));
      if (idxRef.current >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, enabled]);

  return { display, done };
}

/* ─────────────── 背景星星组件 ─────────────── */
function BackgroundStars({ isDark }) {
  const stars = useRef(
    Array.from({ length: 20 }).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 3,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-twinkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(100,100,150,0.1)',
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────── 主组件 ─────────────── */
export default function TonightView({ isDark }) {
  const [currentNode, setCurrentNode] = useState('greeting');
  const [displayText, setDisplayText] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showResetButton, setShowResetButton] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [allLinesDone, setAllLinesDone] = useState(false);

  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[today.getDay()];

  const node = DIALOG_TREE[currentNode];
  const isMultiLine = node?.lines && Array.isArray(node.lines);
  const currentLineText = isMultiLine ? node.lines[currentLineIndex] : (node?.text || '');

  // 打字机
  const { display: typedText, done: lineDone } = useTypewriter(
    currentLineText,
    50,
    displayText !== ''
  );

  // 多句递进逻辑
  useEffect(() => {
    if (!isMultiLine || !lineDone || allLinesDone) return;

    if (currentLineIndex < node.lines.length - 1) {
      // 还有下一句，延迟后继续
      const timer = setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // 全部说完
      setAllLinesDone(true);
      setTimeout(() => {
        setIsFinished(true);
      }, 1500);
    }
  }, [lineDone, currentLineIndex, isMultiLine, allLinesDone, node?.lines]);

  // 对话结束后直接显示"再说一次"
  useEffect(() => {
    if (!isFinished) {
      setShowResetButton(false);
      return;
    }
    setShowResetButton(true);
  }, [isFinished]);

  /* 初始化开场 */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayText(getGreetingText());
      setShowOptions(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  /* 处理选择 */
  const handleOption = useCallback((option) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setShowOptions(false);
    setDisplayText('');
    setCurrentLineIndex(0);
    setAllLinesDone(false);

    setTimeout(() => {
      setCurrentNode(option.next);

      setTimeout(() => {
        const nextNode = DIALOG_TREE[option.next];
        if (nextNode.lines) {
          // 多句模式
          setDisplayText(nextNode.lines[0]);
        } else {
          setDisplayText(nextNode.text);
          setShowOptions(true);
          setIsTransitioning(false);

          if (nextNode.options === null) {
            setTimeout(() => {
              setIsFinished(true);
            }, 2000);
          }
        }
      }, 200);
    }, 300);
  }, [isTransitioning]);

  /* 重置对话 */
  const handleReset = useCallback(() => {
    setCurrentNode('greeting');
    setDisplayText('');
    setIsFinished(false);
    setShowOptions(false);
    setShowResetButton(false);
    setCurrentLineIndex(0);
    setAllLinesDone(false);
    setIsTransitioning(false);
    setTimeout(() => {
      setDisplayText(getGreetingText());
      setShowOptions(true);
    }, 100);
  }, []);

  // 获取当前情绪颜色
  const getMoodColor = () => {
    if (currentNode === 'choice_a') return 'amber';
    if (currentNode === 'choice_b') return 'indigo';
    if (currentNode === 'choice_c') return 'slate';
    return 'indigo';
  };

  const moodColor = getMoodColor();
  const colorMap = {
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', glow: 'shadow-indigo-500/20' },
    slate: { bg: 'bg-slate-500/10', text: 'text-slate-400', glow: 'shadow-slate-500/20' },
  };
  const colors = colorMap[moodColor];

  return (
    <div className="animate-fade-in pb-10 space-y-5">
      {/* === 标题区 === */}
      <div>
        <h1 className="text-xl font-medium tracking-wide">息息·宇宙</h1>
        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {month}月{date}日 {weekDay}
        </p>
      </div>

      {/* === 沉浸式对话区 === */}
      <div
        className={`relative rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm overflow-hidden`}
      >
        {/* 背景星星 */}
        <BackgroundStars isDark={isDark} />

        <div className="relative flex flex-col items-center justify-center min-h-[520px] p-6">
          {/* 月亮图标 */}
          {(currentNode === 'greeting' || isFinished) && (
            <div className="text-center mb-8 animate-fade-in">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 animate-breathe ${colors.bg} ${colors.glow}`}
                style={{ boxShadow: `0 0 30px currentColor` }}
              >
                <Moon
                  size={28}
                  fill="currentColor"
                  className={`${colors.text} ${isFinished ? 'animate-glow' : ''}`}
                />
              </div>
              {isFinished && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <Sparkles size={12} className="text-amber-400/60" />
                  <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    对话已结束
                  </span>
                  <Sparkles size={12} className="text-amber-400/60" />
                </div>
              )}
            </div>
          )}

          {/* 主对话内容 */}
          <div className="text-center mb-8 flex-1 flex flex-col items-center justify-center w-full max-w-sm">
            <div
              className={`transition-all duration-300 ${
                displayText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              {/* 多句递进显示 */}
              {isMultiLine ? (
                <div className="space-y-3">
                  {node.lines.map((line, idx) => {
                    const isPast = idx < currentLineIndex;
                    const isCurrent = idx === currentLineIndex;
                    const isFuture = idx > currentLineIndex;

                    return (
                      <p
                        key={idx}
                        className={`text-base leading-relaxed transition-all duration-500 ${
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        } ${
                          isPast ? 'opacity-60' : isCurrent ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        {isCurrent ? typedText : line}
                        {isCurrent && !lineDone && (
                          <span className="inline-block w-0.5 h-4 ml-0.5 bg-current animate-pulse align-middle" />
                        )}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <p className={`text-base leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {typedText}
                  {!lineDone && displayText && (
                    <span className="inline-block w-0.5 h-4 ml-0.5 bg-current animate-pulse align-middle" />
                  )}
                </p>
              )}
            </div>
          </div>

          {/* 选项按钮 */}
          <div
            className={`w-full max-w-sm space-y-2.5 transition-all duration-300 ${
              showOptions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            {showResetButton ? (
              <button
                onClick={handleReset}
                className={`w-full p-3.5 rounded-2xl text-sm transition-all active:scale-[0.98] ${
                  isDark
                    ? 'bg-[#1f1f2e] text-gray-300 border border-gray-800 hover:border-indigo-500/30'
                    : 'bg-gray-50 text-gray-700 border border-gray-100 hover:border-indigo-200'
                }`}
              >
                再说一次
              </button>
            ) : (
              node?.options?.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOption(option)}
                  disabled={isTransitioning}
                  className={`w-full p-3.5 rounded-2xl text-sm transition-all active:scale-[0.98] disabled:opacity-50 ${
                    isDark
                      ? 'bg-[#1f1f2e] text-gray-300 border border-gray-800 hover:border-indigo-500/30'
                      : 'bg-gray-50 text-gray-700 border border-gray-100 hover:border-indigo-200'
                  }`}
                >
                  {option.text}
                </button>
              ))
            )}
          </div>


        </div>
      </div>
    </div>
  );
}
