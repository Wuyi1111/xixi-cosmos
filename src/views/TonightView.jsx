/**
 * TonightView.jsx — "此刻"板块（v4.46.0 守护者对话版）
 *
 * 全屏沉浸式对话，3 轮固定对话结构。
 * 守护者主动问候 → 轻触情绪 → 收束安抚。
 * 聊完即走，不导向任何操作。
 */

import { useState, useEffect } from 'react';
import { Moon } from 'lucide-react';

/* ─────────────── 对话树配置 ─────────────── */
const DIALOG_TREE = {
  // 第一轮：问候（时段匹配，动态替换）
  greeting: {
    text: '', // 运行时由 getGreetingText() 填充
    options: [
      { text: '有，想说说', next: 'choice_a' },
      { text: '没什么，就是来看看', next: 'choice_b' },
      { text: '不太好，但不想说', next: 'choice_c' },
    ],
  },

  // 第二轮：收束与安抚
  choice_a: {
    text: '谢谢你愿意说。不过今晚不用告诉我具体发生了什么，把它放在心里，然后好好休息。明天的事交给明天的引力。',
    options: null, // 结束，无选项
  },
  choice_b: {
    text: '来看看本身就是一种温柔的举动。不需要有什么目的，在这里待一会儿就好。',
    options: null,
  },
  choice_c: {
    text: '不想说就不说。有些感受需要时间才能被翻译。今晚先把它们放在枕头下面。',
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

/* ─────────────── 主组件 ─────────────── */
export default function TonightView({ isDark }) {
  const [currentNode, setCurrentNode] = useState('greeting');
  const [displayText, setDisplayText] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[today.getDay()];

  const node = DIALOG_TREE[currentNode];

  /* 初始化开场 */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayText(getGreetingText());
      setShowOptions(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  /* 处理选择 */
  const handleOption = (option) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setShowOptions(false);

    setDisplayText('');

    setTimeout(() => {
      const nextNode = DIALOG_TREE[option.next];
      setCurrentNode(option.next);

      setTimeout(() => {
        setDisplayText(nextNode.text);
        setShowOptions(true);
        setIsTransitioning(false);

        if (nextNode.options === null) {
          setTimeout(() => {
            setIsFinished(true);
          }, 2000);
        }
      }, 200);
    }, 300);
  };

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
        className={`rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm overflow-hidden`}
      >
        <div className="flex flex-col items-center justify-center min-h-[420px] p-6 relative">
          {/* 顶部问候（仅在开场显示） */}
          {currentNode === 'greeting' && (
            <div className="text-center mb-6 animate-fade-in">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
                isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'
              } ${isFinished ? 'animate-breathe' : ''}`}>
                <Moon size={24} className={`${isDark ? 'text-indigo-400' : 'text-indigo-500'} ${isFinished ? 'animate-glow' : ''}`} />
              </div>
            </div>
          )}

          {/* 对话结束后安静状态 */}
          {isFinished && (
            <div className="text-center mb-6 animate-fade-in">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 animate-breathe ${
                isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'
              }`}>
                <Moon size={24} className={`${isDark ? 'text-indigo-400' : 'text-indigo-500'} animate-glow`} />
              </div>
            </div>
          )}

          {/* 主对话内容 */}
          <div className="text-center mb-8 flex-1 flex flex-col items-center justify-center">
            <div
              className={`transition-all duration-300 ${
                displayText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <p className={`text-base leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                {displayText}
              </p>
            </div>
          </div>

          {/* 选项按钮 */}
          <div
            className={`w-full max-w-sm space-y-2.5 transition-all duration-300 ${
              showOptions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            {node?.options?.map((option, idx) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
