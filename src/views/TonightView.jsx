/**
 * TonightView.jsx — "此刻"板块（v4.42.0 聊天记录式对话版）
 *
 * 纯对话流，不做功能跳转。
 * 像聊天一样：App 说 → 用户选回复 → App 回应 → 继续聊。
 * 开场 3 个选项，多轮对话深入，最后自然晚安收尾。
 */

import { useState, useEffect, useRef } from 'react';
import { Moon, RotateCcw } from 'lucide-react';

/* ─────────────── 对话树配置 ─────────────── */
const DIALOG_TREE = {
  // 开场
  greeting: {
    type: 'app',
    text: '今天的小宇宙是什么状态？',
    options: [
      { text: '有点累，像被重力压着的星', next: 'tired_1' },
      { text: '还不错，今天有小小的光', next: 'good_1' },
      { text: '有点闷，云挡住了星光', next: 'gloomy_1' },
    ],
  },

  // ── 累了分支 ──
  tired_1: {
    type: 'app',
    text: '累的时候，星星也会变暗一点，这很正常。\n宇宙不会催你，你可以慢慢走。',
    options: [
      { text: '工作/学习太累了', next: 'tired_work' },
      { text: '说不清，就是累', next: 'tired_vague' },
      { text: '不想说，想被安慰', next: 'tired_comfort' },
    ],
  },
  tired_work: {
    type: 'app',
    text: '辛苦了。今天的任务已经完成了，剩下的交给明天的自己。\n现在，把重力交给宇宙，你只管休息。',
    options: [
      { text: '嗯，我会的', next: 'tired_better' },
      { text: '但还是有点焦虑', next: 'tired_anxious' },
      { text: '可以陪我说说话吗', next: 'tired_talk' },
    ],
  },
  tired_vague: {
    type: 'app',
    text: '有时候累不需要理由，就像星星也会无缘无故变暗。\n没关系，宇宙会陪着你，直到你重新亮起来。',
    options: [
      { text: '谢谢你懂我', next: 'tired_better' },
      { text: '还是睡不着怎么办', next: 'tired_sleep' },
      { text: '想听点温暖的话', next: 'tired_quote' },
    ],
  },
  tired_comfort: {
    type: 'app',
    text: '那我就不问了。\n只是想说：你已经做得很好了。\n现在，深呼吸，让宇宙抱一抱你。',
    options: [
      { text: '感觉好一点了', next: 'tired_better' },
      { text: '可以多抱一会儿吗', next: 'tired_more_hug' },
      { text: '我想去睡了', next: 'goodnight' },
    ],
  },
  tired_better: {
    type: 'app',
    text: '真好。记住这种感觉，它是属于你的光。\n今晚，让这份温柔陪你入梦吧。',
    options: [
      { text: '晚安，宇宙', next: 'goodnight' },
      { text: '还想再聊聊', next: 'tired_talk' },
    ],
  },
  tired_anxious: {
    type: 'app',
    text: '焦虑的时候，试着把注意力放在呼吸上。\n吸气…呼气…就像潮汐来去，一切都会平静。',
    options: [
      { text: '嗯，我试试', next: 'tired_better' },
      { text: '还是放不下', next: 'tired_letgo' },
    ],
  },
  tired_talk: {
    type: 'app',
    text: '我在听。宇宙有很多时间，我们可以慢慢聊。\n不过如果你困了，也不用勉强，去睡吧。',
    options: [
      { text: '其实也没什么了', next: 'tired_better' },
      { text: '我想去睡了', next: 'goodnight' },
    ],
  },
  tired_sleep: {
    type: 'app',
    text: '睡不着的时候，不要强迫自己。\n试着闭上眼睛，想象自己漂浮在星空中，没有重力，没有烦恼。',
    options: [
      { text: '我试试', next: 'goodnight' },
      { text: '还是睡不着', next: 'tired_still_awake' },
    ],
  },
  tired_quote: {
    type: 'app',
    text: '"今天的疲惫，会在梦里化作星光。"\n—— 夜空',
    options: [
      { text: '这句话真好', next: 'tired_better' },
      { text: '还有吗', next: 'tired_quote2' },
    ],
  },
  tired_quote2: {
    type: 'app',
    text: '"你已经做得很好了，真的。"\n—— 云朵',
    options: [
      { text: '谢谢你', next: 'tired_better' },
      { text: '我想去睡了', next: 'goodnight' },
    ],
  },
  tired_more_hug: {
    type: 'app',
    text: '宇宙抱得更紧了一点。\n你可以把脸埋进星光里，哭一会儿也没关系。',
    options: [
      { text: '好了，谢谢你', next: 'tired_better' },
      { text: '我想去睡了', next: 'goodnight' },
    ],
  },
  tired_letgo: {
    type: 'app',
    text: '放不下也没关系，不用逼自己。\n有些重量，需要时间慢慢变轻。\n今晚，先允许自己带着它休息。',
    options: [
      { text: '嗯，我懂了', next: 'tired_better' },
      { text: '我想去睡了', next: 'goodnight' },
    ],
  },
  tired_still_awake: {
    type: 'app',
    text: '那我们就再聊一会儿。\n或者，你可以试着数星星，从最近的那颗开始…',
    options: [
      { text: '一颗…两颗…', next: 'goodnight' },
      { text: '还是聊天吧', next: 'tired_talk' },
    ],
  },

  // ── 不错分支 ──
  good_1: {
    type: 'app',
    text: '真好，星星也会为你多亮一点。\n带着这份光入睡，梦会更甜。',
    options: [
      { text: '今天发生了开心的事', next: 'good_share' },
      { text: '就是觉得平静', next: 'good_calm' },
      { text: '想分享这份光芒', next: 'good_spread' },
    ],
  },
  good_share: {
    type: 'app',
    text: '宇宙也想听听。\n（虽然我不能真的听见，但我能感受到你的喜悦。）',
    options: [
      { text: '其实也没什么大事', next: 'good_calm' },
      { text: '就是小确幸', next: 'good_small_joy' },
    ],
  },
  good_calm: {
    type: 'app',
    text: '平静本身就是一种幸福。\n像深空一样安静，没有波澜，却藏着无限。',
    options: [
      { text: '说得真好', next: 'good_better' },
      { text: '我想去睡了', next: 'goodnight' },
    ],
  },
  good_spread: {
    type: 'app',
    text: '你的光芒已经照亮了这片星空。\n明天，它会继续温暖更多的人。',
    options: [
      { text: '谢谢你', next: 'good_better' },
      { text: '晚安', next: 'goodnight' },
    ],
  },
  good_small_joy: {
    type: 'app',
    text: '小确幸最珍贵。\n一杯热茶、一缕阳光、一句问候…\n宇宙就是由这些微小的光组成的。',
    options: [
      { text: '对，就是这样', next: 'good_better' },
      { text: '我想去睡了', next: 'goodnight' },
    ],
  },
  good_better: {
    type: 'app',
    text: '带着这份好心情入梦吧。\n明天，宇宙会给你更多惊喜。',
    options: [
      { text: '晚安，宇宙', next: 'goodnight' },
      { text: '还想再聊聊', next: 'good_talk' },
    ],
  },
  good_talk: {
    type: 'app',
    text: '我在。想聊什么？\n或者，我们可以一起静静地看星星。',
    options: [
      { text: '就这样静静待着也好', next: 'goodnight' },
      { text: '晚安', next: 'goodnight' },
    ],
  },

  // ── 闷了分支 ──
  gloomy_1: {
    type: 'app',
    text: '云挡住了星光，但星星还在那里。\n没关系，宇宙会陪你等云散。',
    options: [
      { text: '不知道为什么闷', next: 'gloomy_vague' },
      { text: '有点孤独', next: 'gloomy_lonely' },
      { text: '想被安慰', next: 'gloomy_comfort' },
    ],
  },
  gloomy_vague: {
    type: 'app',
    text: '有时候闷也不需要理由，就像天气会无缘无故转阴。\n这种时候，允许自己闷一会儿，也是一种温柔。',
    options: [
      { text: '嗯，我允许自己闷着', next: 'gloomy_allow' },
      { text: '但想快点好起来', next: 'gloomy_better' },
    ],
  },
  gloomy_lonely: {
    type: 'app',
    text: '孤独的时候，星星也在彼此远离。\n但它们的光芒，穿越亿万公里，最终还是会相遇。\n你并不孤单，宇宙和你在一起。',
    options: [
      { text: '谢谢你陪着我', next: 'gloomy_better' },
      { text: '还是很难受', next: 'gloomy_comfort' },
    ],
  },
  gloomy_comfort: {
    type: 'app',
    text: '我在这里，不会离开。\n你可以把闷说出来，或者就这样安静地待着。\n宇宙有很多耐心。',
    options: [
      { text: '感觉好一点了', next: 'gloomy_better' },
      { text: '我想去睡了', next: 'goodnight' },
    ],
  },
  gloomy_allow: {
    type: 'app',
    text: '真好。接纳自己的情绪，是最勇敢的温柔。\n云会散的，星光会重新照进来。',
    options: [
      { text: '嗯，我等云散', next: 'gloomy_better' },
      { text: '我想去睡了', next: 'goodnight' },
    ],
  },
  gloomy_better: {
    type: 'app',
    text: '你看，云已经开始变薄了。\n你的光，从来都在。',
    options: [
      { text: '晚安，宇宙', next: 'goodnight' },
      { text: '还想再聊聊', next: 'gloomy_talk' },
    ],
  },
  gloomy_talk: {
    type: 'app',
    text: '我在。不管聊什么，或者什么都不聊，都可以。\n宇宙会一直在这里。',
    options: [
      { text: '就这样吧', next: 'goodnight' },
      { text: '晚安', next: 'goodnight' },
    ],
  },

  // ── 晚安结束 ──
  goodnight: {
    type: 'app',
    text: '晚安，星星旅人。\n愿你的梦里充满温柔与星光。\n宇宙会一直陪着你，直到天亮。',
    options: [
      { text: '再聊一次', next: 'reset' },
    ],
  },
};

/* ─────────────── 问候语（按时段） ─────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 22) return { text: '夜深了，星星旅人', sub: '宇宙正准备关灯' };
  if (h >= 18) return { text: '晚上好，星星旅人', sub: '今晚的宇宙很安静' };
  if (h >= 12) return { text: '下午好，星星旅人', sub: '午后阳光正好' };
  return { text: '早上好，星星旅人', sub: '新的一天开始了' };
}

/* ─────────────── 主组件 ─────────────── */
export default function TonightView({ isDark }) {
  const [messages, setMessages] = useState([]);
  const [currentNode, setCurrentNode] = useState('greeting');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  const greeting = getGreeting();
  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[today.getDay()];

  /* 滚动到底部 */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  /* 初始化：添加开场问候 */
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([
        { role: 'app', text: greeting.text, isGreeting: true },
        { role: 'app', text: greeting.sub, isSub: true },
      ]);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  /* 用户选择 */
  const handleOption = (option) => {
    // 添加用户消息
    setMessages((prev) => [...prev, { role: 'user', text: option.text }]);

    // 模拟打字中
    setIsTyping(true);

    // 延迟后添加 App 回复
    const nextNode = DIALOG_TREE[option.next];
    if (option.next === 'reset') {
      setTimeout(() => {
        setMessages([]);
        setCurrentNode('greeting');
        setIsTyping(false);
        // 重新开场
        setTimeout(() => {
          setMessages([
            { role: 'app', text: greeting.text, isGreeting: true },
            { role: 'app', text: greeting.sub, isSub: true },
          ]);
        }, 300);
      }, 500);
      return;
    }

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'app', text: nextNode.text },
      ]);
      setCurrentNode(option.next);
      setIsTyping(false);
    }, 800 + Math.random() * 400);
  };

  /* 获取当前选项 */
  const currentOptions = DIALOG_TREE[currentNode]?.options || [];
  const isGoodnight = currentNode === 'goodnight';

  return (
    <div className="animate-fade-in pb-10 space-y-5">
      {/* === 标题区 === */}
      <div>
        <h1 className="text-xl font-medium tracking-wide">息息·宇宙</h1>
        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {month}月{date}日 {weekDay}
        </p>
      </div>

      {/* === 对话区 === */}
      <div
        ref={scrollRef}
        className={`rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm overflow-hidden flex flex-col`}
        style={{ maxHeight: 'calc(100vh - 220px)' }}
      >
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              {msg.role === 'app' && (
                <div className="flex gap-2 max-w-[85%]">
                  {/* App 头像 */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>
                    <Moon size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                  </div>
                  {/* App 消息气泡 */}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
                      msg.isGreeting
                        ? isDark
                          ? 'bg-indigo-500/10 text-indigo-200 rounded-tl-2xl'
                          : 'bg-indigo-50 text-indigo-700 rounded-tl-2xl'
                        : msg.isSub
                          ? isDark
                            ? 'bg-transparent text-gray-500 text-xs px-0 py-0'
                            : 'bg-transparent text-gray-400 text-xs px-0 py-0'
                          : isDark
                            ? 'bg-[#1f1f2e] text-gray-200 rounded-tl-md'
                            : 'bg-gray-50 text-gray-700 rounded-tl-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              )}

              {msg.role === 'user' && (
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm max-w-[80%] rounded-tr-md ${
                    isDark
                      ? 'bg-indigo-500/20 text-indigo-200'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {msg.text}
                </div>
              )}
            </div>
          ))}

          {/* 打字中指示器 */}
          {isTyping && (
            <div className="flex gap-2 animate-fade-in">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>
                <Moon size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
              </div>
              <div className={`px-4 py-2.5 rounded-2xl rounded-tl-md ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-50'}`}>
                <div className="flex gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-gray-500' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '0ms' }} />
                  <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-gray-500' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '150ms' }} />
                  <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-gray-500' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 选项按钮区 */}
        {!isTyping && currentOptions.length > 0 && (
          <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
            <div className="space-y-2">
              {currentOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOption(option)}
                  className={`w-full p-3.5 rounded-2xl text-sm transition-all active:scale-[0.98] ${
                    isGoodnight
                      ? isDark
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                      : isDark
                        ? 'bg-[#1f1f2e] text-gray-300 border border-gray-800 hover:border-indigo-500/30'
                        : 'bg-gray-50 text-gray-700 border border-gray-100 hover:border-indigo-200'
                  }`}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
