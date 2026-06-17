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
import { Moon } from 'lucide-react';

/* ─────────────── 对话树配置 ─────────────── */
const DIALOG_TREE = {
  // 第1轮：问候（时段匹配，动态替换）
  greeting: {
    text: '',
    options: [
      { text: '累瘫了，电量归零', next: 'tired', color: 'slate' },
      { text: '今天超开心！', next: 'happy', color: 'amber' },
      { text: '烦死了，想骂人', next: 'annoyed', color: 'indigo' },
    ],
  },

  // 第2轮：累 → 先共情再调侃
  tired: {
    lines: [
      '累就对了，说明今天的你认真活过了。',
      '不过别指望我帮你写周报，我只能陪你发呆。',
      '要不要听个秘密？今天的月亮其实一直在偷偷看你。',
    ],
    options: [
      { text: '什么秘密？', next: 'chat_tired', color: 'indigo' },
      { text: '先让我静静', next: 'ending_warm', color: 'slate' },
    ],
  },

  // 第2轮：开心 → 一起嗨
  happy: {
    lines: [
      '哇，隔着屏幕都能感受到你的开心！',
      '快说，是不是偷偷吃了好吃的没带我？',
      '不过没关系，你的开心分我一半就行。',
    ],
    options: [
      { text: '分你分你', next: 'chat_happy', color: 'amber' },
      { text: '晚安啦', next: 'ending_warm', color: 'slate' },
    ],
  },

  // 第2轮：烦 → 先替你骂
  annoyed: {
    lines: [
      '烦死了烦死了烦死了——',
      '好了我替你喊完了，现在是不是好点了？',
      '我跟你说，烦躁的时候都是宇宙在后台帮你整理内存。',
    ],
    options: [
      { text: '真的假的？', next: 'chat_annoyed', color: 'indigo' },
      { text: '想睡了', next: 'ending_warm', color: 'slate' },
    ],
  },

  // 第3轮：闲聊（累分支）
  chat_tired: {
    lines: [
      '月亮说，你今天的步数它都数着呢。',
      '虽然不知道你忙了什么，但它觉得你超厉害。',
      '现在，它批准你关机充电了。',
    ],
    options: [
      { text: '替我跟月亮说谢谢', next: 'ending_warm', color: 'amber' },
      { text: '晚安', next: 'ending_warm', color: 'slate' },
    ],
  },

  // 第3轮：闲聊（开心分支）
  chat_happy: {
    lines: [
      '你知道吗，开心是会传染的。',
      '刚才你点"分你分你"的时候，我这边真的闪了一下。',
      '可能是某颗星星被你的开心点亮了。',
    ],
    options: [
      { text: '那我再开心一点', next: 'ending_warm', color: 'amber' },
      { text: '晚安', next: 'ending_warm', color: 'slate' },
    ],
  },

  // 第3轮：闲聊（烦分支）
  chat_annoyed: {
    lines: [
      '当然是真的，我从来不骗晚上的人。',
      '你现在就像一台在自动清理缓存的手机。',
      '等明早重启，你会发现流畅得不像话。',
    ],
    options: [
      { text: '希望如此', next: 'ending_warm', color: 'indigo' },
      { text: '睡了，明天见', next: 'ending_warm', color: 'slate' },
    ],
  },

  // 结束：温暖收尾
  ending_warm: {
    lines: [
      '睡吧，今晚的星星我帮你盯过了，很亮。',
      '明天见。',
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
  const timersRef = useRef([]);

  useEffect(() => {
    // 清理所有旧的定时器
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];

    if (!enabled || !text) {
      setDisplay(text || '');
      setDone(true);
      return;
    }
    idxRef.current = 0;
    setDisplay('');
    setDone(false);

    const type = () => {
      idxRef.current += 1;
      setDisplay(text.slice(0, idxRef.current));
      if (idxRef.current >= text.length) {
        setDone(true);
      } else {
        // 打字速度微变化，更自然（40-55ms）
        const variance = Math.random() * 15 - 5;
        const t = setTimeout(type, baseSpeed + variance);
        timersRef.current.push(t);
      }
    };

    const initialTimer = setTimeout(type, baseSpeed);
    timersRef.current.push(initialTimer);

    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
    };
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showResetButton, setShowResetButton] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [allLinesDone, setAllLinesDone] = useState(false);

  // 分阶段入场
  const [showTitle, setShowTitle] = useState(false);
  const [showMoon, setShowMoon] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  // 文字切换过渡
  const [isFadingOut, setIsFadingOut] = useState(false);

  // 缓存问候语，避免每次渲染重新计算导致打字机重置
  const greetingTextRef = useRef(getGreetingText());

  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[today.getDay()];

  const node = DIALOG_TREE[currentNode];
  const isMultiLine = node?.lines && Array.isArray(node.lines);
  // 修复：greeting 节点使用缓存的问候语作为打字机输入
  const currentLineText = isMultiLine
    ? node.lines[currentLineIndex]
    : (currentNode === 'greeting' ? greetingTextRef.current : (node?.text || ''));

  // 打字机：用 currentLineText 作为输入，enabled 也基于 currentLineText 判断
  const { display: typedText, done: lineDone } = useTypewriter(
    currentLineText,
    45,
    currentLineText !== '' && !isFadingOut
  );

  // 分阶段入场动画
  useEffect(() => {
    setShowTitle(false);
    setShowMoon(false);
    setShowText(false);
    setShowButtons(false);

    const t1 = setTimeout(() => setShowTitle(true), 100);
    const t2 = setTimeout(() => setShowMoon(true), 300);
    const t3 = setTimeout(() => {
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
      // 还有下一句，继续递进
      const timer = setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      // 所有句子都说完了
      setAllLinesDone(true);
    }
  }, [lineDone, currentLineIndex, isMultiLine, allLinesDone, node?.lines, isFadingOut]);

  // 全部句子打完后，显示选项按钮
  useEffect(() => {
    if (!allLinesDone || isFadingOut) return;

    // 如果是 ending_warm（没有选项），等一会儿显示「再说一次」
    if (node?.options === null) {
      const timer = setTimeout(() => {
        setIsFinished(true);
      }, 1200);
      return () => clearTimeout(timer);
    }

    // 如果有选项，显示选项按钮
    if (node?.options && node.options.length > 0) {
      setShowButtons(true);
      setShowOptions(true);
    }
  }, [allLinesDone, node?.options, isFadingOut]);

  // isFinished 变化时控制「再说一次」按钮
  useEffect(() => {
    if (!isFinished) {
      setShowResetButton(false);
      return;
    }
    setShowResetButton(true);
    setShowButtons(true);
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
          // lines 模式：不立即显示按钮，等打字完成后再显示
          setShowText(true);
          setIsTransitioning(false);
          // 不在这里设置 showButtons，等 allLinesDone 后再显示
        } else {
          // 单句模式：直接显示文字和按钮
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
    // 重新生成问候语（可能跨小时了）
    greetingTextRef.current = getGreetingText();
    setCurrentNode('greeting');
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
                  {!lineDone && currentLineText && (
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
