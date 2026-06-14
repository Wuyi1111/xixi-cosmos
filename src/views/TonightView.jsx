/**
 * TonightView.jsx — "此刻"板块（v4.47.16 分阶段动画优化版）
 *
 * 全屏沉浸式对话，3 入口 × 3 轮有来有回结构。
 * 动画优化：
 *   - 分阶段进入：标题 → 月亮 → 文字 → 按钮依次出现
 *   - 月亮全程可见，跟随情绪变化颜色
 *   - 对话切换流畅过渡：fade-out → fade-in
 *   - 打字机速度微变化，更自然
 *   - 情绪颜色柔和过渡
 *   - 背景星星有漂浮感
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Moon, Sparkles } from 'lucide-react';

/* ─────────────── 对话树配置 ─────────────── */
const DIALOG_TREE = {
  // 第1轮：问候（时段匹配，动态替换）
  greeting: {
    text: '',
    options: [
      { text: '有点累，不想说话', next: 'tired', color: 'slate' },
      { text: '有点开心，想分享', next: 'happy', color: 'amber' },
      { text: '就是有点烦', next: 'annoyed', color: 'indigo' },
    ],
  },

  // 第2轮：累 → 陪伴
  tired: {
    lines: [
      '不想说话就不说。',
      '有些疲惫不需要被解释。',
      '你今天能坚持下来，就已经很了不起了。',
    ],
    options: [
      { text: '说点别的', next: 'chat_tired', color: 'indigo' },
      { text: '晚安，谢谢', next: 'ending_warm', color: 'slate' },
    ],
  },

  // 第2轮：开心 → 发光
  happy: {
    lines: [
      '开心是值得被记住的 ✨',
      '这种感觉是今天的小礼物。',
      '谢谢你愿意把它分享给我。',
    ],
    options: [
      { text: '说点别的', next: 'chat_happy', color: 'amber' },
      { text: '晚安，谢谢', next: 'ending_warm', color: 'slate' },
    ],
  },

  // 第2轮：烦 → 陪伴
  annoyed: {
    lines: [
      '烦躁也是夜晚的一部分。',
      '没关系，今晚不用急着整理。',
      '有些情绪不需要被解决，只需要被看见。',
    ],
    options: [
      { text: '说点别的', next: 'chat_annoyed', color: 'indigo' },
      { text: '晚安，谢谢', next: 'ending_warm', color: 'slate' },
    ],
  },

  // 第3轮：闲聊（累分支）
  chat_tired: {
    lines: [
      '那我给你讲一个小秘密。',
      '今天的月亮其实一直在偷偷看你。',
      '它说，你辛苦了。',
    ],
    options: [
      { text: '谢谢你', next: 'ending_warm', color: 'amber' },
      { text: '晚安', next: 'ending_warm', color: 'slate' },
    ],
  },

  // 第3轮：闲聊（开心分支）
  chat_happy: {
    lines: [
      '你知道吗。',
      '星星有一半的时间是被云层挡住的。',
      '但没关系，它一直都在。',
    ],
    options: [
      { text: '这个比喻不错', next: 'ending_warm', color: 'indigo' },
      { text: '晚安', next: 'ending_warm', color: 'slate' },
    ],
  },

  // 第3轮：闲聊（烦分支）
  chat_annoyed: {
    lines: [
      '我有一个不太科学的理论——',
      '烦躁的时候，都是宇宙在后台帮你整理内存。',
      '明天就好了。',
    ],
    options: [
      { text: '这个想法很可爱', next: 'ending_warm', color: 'amber' },
      { text: '晚安', next: 'ending_warm', color: 'slate' },
    ],
  },

  // 结束：温暖收尾
  ending_warm: {
    lines: [
      '那就这样吧。',
      '今晚也要好好睡觉，明天见。',
    ],
    options: null,
  },
};

/* ─────────────── 时段问候语 ─────────────── */
function getGreetingText() {
  const h = new Date().getHours();
  if (h >= 18 && h < 21) {
    return '晚上好。今天过得怎么样，愿意和我说说吗。';
  }
  if (h >= 21 || h < 1) {
    return '还没睡呢。这个时间点，一般是有点事，或者是单纯不想结束今天。';
  }
  if (h >= 1 && h < 6) {
    return '这个点还醒着，今天可能有点累。没关系，我陪着你。';
  }
  return '还没睡吗。今天想聊点什么。';
}

/* ─────────────── 打字机 hook（带速度微变化）─────────────── */
function useTypewriter(text, baseSpeed = 45, enabled = true) {
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

    let timer;
    const type = () => {
      idxRef.current += 1;
      setDisplay(text.slice(0, idxRef.current));
      if (idxRef.current >= text.length) {
        clearInterval(timer);
        setDone(true);
      } else {
        // 打字速度微变化，更自然（40-55ms）
        const variance = Math.random() * 15 - 5;
        timer = setTimeout(type, baseSpeed + variance);
      }
    };

    timer = setTimeout(type, baseSpeed);
    return () => clearTimeout(timer);
  }, [text, baseSpeed, enabled]);

  return { display, done };
}

/* ─────────────── 背景星星组件 ─────────────── */
function BackgroundStars({ isDark }) {
  const stars = useRef(
    Array.from({ length: 20 }).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1 + Math.random() * 2,
      twinkleDelay: Math.random() * 4,
      twinkleDuration: 2 + Math.random() * 3,
      floatX: (Math.random() - 0.5) * 20,
      floatY: -(Math.random() * 15 + 5),
      floatDelay: Math.random() * 3,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute animate-twinkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(100,100,150,0.1)',
            animationDelay: `${s.twinkleDelay}s`,
            animationDuration: `${s.twinkleDuration}s`,
            '--float-x': `${s.floatX}px`,
            '--float-y': `${s.floatY}px`,
            animation: `twinkle ${s.twinkleDuration}s ease-in-out ${s.twinkleDelay}s infinite, float-star 6s ease-in-out ${s.floatDelay}s infinite`,
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

  // 分阶段入场
  const [entrancePhase, setEntrancePhase] = useState('idle');
  const [showTitle, setShowTitle] = useState(false);
  const [showMoon, setShowMoon] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  // 文字切换过渡
  const [isFadingOut, setIsFadingOut] = useState(false);

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
    45,
    displayText !== '' && !isFadingOut
  );

  // 分阶段入场动画
  useEffect(() => {
    setEntrancePhase('idle');
    setShowTitle(false);
    setShowMoon(false);
    setShowText(false);
    setShowButtons(false);

    const t1 = setTimeout(() => setShowTitle(true), 100);
    const t2 = setTimeout(() => setShowMoon(true), 300);
    const t3 = setTimeout(() => {
      setDisplayText(getGreetingText());
      setShowText(true);
    }, 600);
    const t4 = setTimeout(() => {
      setShowOptions(true);
      setShowButtons(true);
    }, 1000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  // 多句递进逻辑
  useEffect(() => {
    if (!isMultiLine || !lineDone || allLinesDone || isFadingOut) return;

    if (currentLineIndex < node.lines.length - 1) {
      const timer = setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setAllLinesDone(true);
      setTimeout(() => {
        setIsFinished(true);
      }, 1200);
    }
  }, [lineDone, currentLineIndex, isMultiLine, allLinesDone, node?.lines, isFadingOut]);

  useEffect(() => {
    if (!isFinished) {
      setShowResetButton(false);
      return;
    }
    setShowResetButton(true);
  }, [isFinished]);

  /* 处理选择：fade-out → fade-in 过渡 */
  const handleOption = useCallback((option) => {
    if (isTransitioning || isFadingOut) return;
    setIsTransitioning(true);
    setShowOptions(false);
    setShowButtons(false);

    // fade-out 当前文字
    setIsFadingOut(true);
    setTimeout(() => {
      setIsFadingOut(false);
      setCurrentNode(option.next);
      setCurrentLineIndex(0);
      setAllLinesDone(false);

      setTimeout(() => {
        const nextNode = DIALOG_TREE[option.next];
        if (nextNode.lines) {
          setDisplayText(nextNode.lines[0]);
          setShowText(true);
          setTimeout(() => {
            setShowButtons(true);
          }, 300);
        } else {
          setDisplayText(nextNode.text);
          setShowText(true);
          setTimeout(() => {
            setShowOptions(true);
            setShowButtons(true);
            setIsTransitioning(false);
          }, 300);

          if (nextNode.options === null) {
            setTimeout(() => {
              setIsFinished(true);
            }, 1500);
          }
        }
      }, 200);
    }, 250);
  }, [isTransitioning, isFadingOut]);

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
    setIsFadingOut(false);

    // 重新执行入场动画
    setShowTitle(false);
    setShowMoon(false);
    setShowText(false);
    setShowButtons(false);

    const t1 = setTimeout(() => setShowTitle(true), 100);
    const t2 = setTimeout(() => setShowMoon(true), 300);
    const t3 = setTimeout(() => {
      setDisplayText(getGreetingText());
      setShowText(true);
    }, 600);
    const t4 = setTimeout(() => {
      setShowOptions(true);
      setShowButtons(true);
    }, 1000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  // 获取当前情绪颜色
  const getMoodColor = () => {
    if (currentNode === 'tired' || currentNode === 'chat_tired') return 'slate';
    if (currentNode === 'happy' || currentNode === 'chat_happy') return 'amber';
    if (currentNode === 'annoyed' || currentNode === 'chat_annoyed') return 'indigo';
    if (currentNode === 'ending_warm') return 'amber';
    return 'indigo';
  };

  const moodColor = getMoodColor();
  const colorMap = {
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', glow: 'shadow-amber-500/20', ring: 'ring-amber-400/30' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', glow: 'shadow-indigo-500/20', ring: 'ring-indigo-400/30' },
    slate: { bg: 'bg-slate-500/10', text: 'text-slate-400', glow: 'shadow-slate-500/20', ring: 'ring-slate-400/30' },
  };
  const colors = colorMap[moodColor];

  return (
    <div className="animate-fade-in pb-10 space-y-5">
      {/* === 标题区（分阶段入场）=== */}
      <div className={`transition-all duration-500 ${showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}>
        <h1 className="text-xl font-medium tracking-wide">息息·宇宙</h1>
        <p className={`text-[10px] transition-colors duration-500 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
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
          {/* 月亮图标（全程可见，跟随情绪颜色过渡）=== */}
          <div
            className={`text-center mb-8 transition-all duration-500 ${
              showMoon ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 animate-breathe ${colors.bg} ${colors.glow} transition-all duration-500`}
              style={{ boxShadow: `0 0 30px currentColor` }}
            >
              <Moon
                size={28}
                fill="currentColor"
                className={`${colors.text} transition-colors duration-500 ${isFinished ? 'animate-glow' : ''}`}
              />
            </div>
          </div>

          {/* 主对话内容（fade-out / fade-in 过渡）=== */}
          <div className="text-center mb-8 flex-1 flex flex-col items-center justify-center w-full max-w-sm">
            <div
              className={`transition-all duration-300 ${
                isFadingOut
                  ? 'animate-fade-out-down'
                  : showText
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-3'
              }`}
            >
              {/* 多句递进显示 */}
              {isMultiLine ? (
                <div className="space-y-3">
                  {node.lines.map((line, idx) => {
                    const isPast = idx < currentLineIndex;
                    const isCurrent = idx === currentLineIndex;

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

          {/* 选项按钮（分阶段入场 + 过渡）=== */}
          <div
            className={`w-full max-w-sm space-y-2.5 transition-all duration-300 ${
              showButtons
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
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
