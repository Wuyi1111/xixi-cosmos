/**
 * TonightView.jsx — "此刻"板块（v4.41.0 情绪陪伴对话版）
 *
 * 纯情绪疏导，不做功能跳转。
 * 多轮对话 + 互动元素：宇宙拥抱、呼吸引导、丢进黑洞、随机星语。
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Moon, Sun, CloudRain, Coffee, Flame, Brain, Sparkles,
  Heart, Wind, Shuffle, RotateCcw, Send, X, ChevronRight
} from 'lucide-react';

/* ─────────────── 温暖语录库 ─────────────── */
const WARM_QUOTES = [
  { text: '今天的你已经很棒了，明天会更好。', author: '宇宙' },
  { text: '你走过的每一步，都在成为更好的自己。', author: '星星' },
  { text: '不必着急，慢慢来也是一种力量。', author: '月光' },
  { text: '你的努力，宇宙都看在眼里。', author: '星云' },
  { text: '即使今天不够完美，也值得被温柔以待。', author: '晚风' },
  { text: '相信自己，你比想象中更强大。', author: '银河' },
  { text: '每一个平凡的日子，都藏着不平凡的光芒。', author: '星辰' },
  { text: '累了就休息，明天的太阳依旧会升起。', author: '晨曦' },
  { text: '你的存在本身，就是一份美好的礼物。', author: '宇宙' },
  { text: '不必和别人比较，你的节奏就是最好的节奏。', author: '行星' },
  { text: '今天的疲惫，会在梦里化作星光。', author: '夜空' },
  { text: '你已经做得很好了，真的。', author: '云朵' },
  { text: '生活也许不易，但你一直在勇敢前行。', author: '流星' },
  { text: '给自己一个拥抱，你值得被温柔对待。', author: '星光' },
  { text: '明天的你，会比今天更接近心中的光。', author: '日出' },
  { text: '无论今天经历了什么，此刻请安心入眠。', author: '潮汐' },
  { text: '你的坚持，终将成为照亮前路的光。', author: '灯塔' },
  { text: '放下今天的烦恼，让心灵在星空中自由漂浮。', author: '深空' },
  { text: '你是一颗独一无二的星，闪耀着属于自己的光芒。', author: '星座' },
  { text: '晚安，愿你的梦里充满温柔与希望。', author: '月亮' },
];

/* ─────────────── 情绪对话配置 ─────────────── */
const EMOTION_FLOW = {
  tired: {
    icon: Coffee,
    responses: [
      '累的时候，星星也会变暗一点，这很正常。',
      '宇宙不会催你，你可以慢慢走。',
      '今天的你已经很努力了，真的。',
    ],
    actions: [
      { key: 'hug', label: '给我一个宇宙拥抱', icon: Heart },
      { key: 'breathe', label: '潮汐呼吸', icon: Wind },
      { key: 'blackhole', label: '把累写下来，丢进黑洞', icon: Sparkles },
      { key: 'quote', label: '来句随机的宇宙安慰', icon: Shuffle },
    ],
  },
  good: {
    icon: Sun,
    responses: [
      '真好，星星也会为你多亮一点。',
      '带着这份光入睡，梦会更甜。',
      '宇宙喜欢看到开心的你。',
    ],
    actions: [
      { key: 'quote', label: '抽一张宇宙祝福', icon: Shuffle },
      { key: 'hug', label: '把这份温暖存起来', icon: Heart },
      { key: 'wish', label: '对着星空许个愿', icon: Sparkles },
    ],
  },
  gloomy: {
    icon: CloudRain,
    responses: [
      '云挡住了星光，但星星还在那里。',
      '这种天气，适合躲进被窝里。',
      '没关系，宇宙会陪你等云散。',
    ],
    actions: [
      { key: 'quote', label: '来句温暖的话', icon: Shuffle },
      { key: 'breathe', label: '深呼吸，让心静下来', icon: Wind },
      { key: 'blackhole', label: '把闷写下来，丢进黑洞', icon: Sparkles },
    ],
  },
  anxious: {
    icon: Flame,
    responses: [
      '烦躁的时候，连星星都会闪得更快。',
      '试着把注意力放在呼吸上，就像看着潮汐来去。',
      '这股能量会过去的，就像流星划过。',
    ],
    actions: [
      { key: 'breathe', label: '潮汐呼吸', icon: Wind },
      { key: 'blackhole', label: '把烦躁丢进黑洞', icon: Sparkles },
      { key: 'quote', label: '来句冷静的话', icon: Shuffle },
    ],
  },
  racing: {
    icon: Brain,
    responses: [
      '脑子停不下来的时候，就像彗星乱飞。',
      '试着把它们写下来，宇宙会帮你保管。',
      '一件一件来，不用急着解决所有问题。',
    ],
    actions: [
      { key: 'blackhole', label: '把杂念写下来，丢进黑洞', icon: Sparkles },
      { key: 'breathe', label: '潮汐呼吸', icon: Wind },
      { key: 'quote', label: '来句安心的话', icon: Shuffle },
    ],
  },
  calm: {
    icon: Moon,
    responses: [
      '像深空一样安静，这是最好的状态。',
      '享受这份宁静，宇宙也在休息。',
      '平静的心，会吸引美好的梦。',
    ],
    actions: [
      { key: 'quote', label: '抽一张晚安祝福', icon: Shuffle },
      { key: 'wish', label: '对着星空许个愿', icon: Sparkles },
      { key: 'hug', label: '存一份温暖', icon: Heart },
    ],
  },
  happy: {
    icon: Sparkles,
    responses: [
      '哇，今天的你闪闪发光！',
      '这份快乐像超新星爆发一样耀眼。',
      '宇宙也想分享你的喜悦。',
    ],
    actions: [
      { key: 'quote', label: '抽一张庆祝祝福', icon: Shuffle },
      { key: 'wish', label: '把快乐存进星星', icon: Sparkles },
      { key: 'hug', label: '把温暖传递出去', icon: Heart },
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
  const [step, setStep] = useState('greeting');
  const [emotionKey, setEmotionKey] = useState(null);
  const [responseIndex, setResponseIndex] = useState(0);
  const [activeInteraction, setActiveInteraction] = useState(null);
  const [blackholeText, setBlackholeText] = useState('');
  const [wishText, setWishText] = useState('');
  const [quote, setQuote] = useState(null);
  const [hugVisible, setHugVisible] = useState(false);
  const [showGoodnight, setShowGoodnight] = useState(false);

  const blackholeRef = useRef(null);

  /* 随机选一条语录 */
  const drawQuote = useCallback(() => {
    const idx = Math.floor(Math.random() * WARM_QUOTES.length);
    setQuote(WARM_QUOTES[idx]);
  }, []);

  /* 选择情绪 */
  const pickEmotion = (key) => {
    setEmotionKey(key);
    setResponseIndex(Math.floor(Math.random() * EMOTION_FLOW[key].responses.length));
    setStep('responding');
  };

  /* 执行互动 */
  const doInteraction = (key) => {
    setActiveInteraction(key);
    if (key === 'quote') drawQuote();
    if (key === 'hug') {
      setHugVisible(true);
      setTimeout(() => setHugVisible(false), 2500);
    }
  };

  /* 丢进黑洞 */
  const throwToBlackhole = () => {
    if (!blackholeText.trim()) return;
    setBlackholeText('');
    setActiveInteraction('blackhole-done');
    setTimeout(() => setActiveInteraction(null), 2000);
  };

  /* 许愿 */
  const makeWish = () => {
    if (!wishText.trim()) return;
    setWishText('');
    setActiveInteraction('wish-done');
    setTimeout(() => setActiveInteraction(null), 2000);
  };

  /* 返回重新选择 */
  const reset = () => {
    setStep('greeting');
    setEmotionKey(null);
    setActiveInteraction(null);
    setQuote(null);
    setShowGoodnight(false);
    setBlackholeText('');
    setWishText('');
  };

  /* 晚安 */
  const goodnight = () => {
    setShowGoodnight(true);
  };

  const greeting = getGreeting();
  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[today.getDay()];

  const emotion = emotionKey ? EMOTION_FLOW[emotionKey] : null;
  const EmotionIcon = emotion?.icon || Moon;

  return (
    <div className="animate-fade-in pb-10 space-y-5">
      {/* === 标题区 === */}
      <div>
        <h1 className="text-xl font-medium tracking-wide">息息·宇宙</h1>
        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {month}月{date}日 {weekDay}
        </p>
      </div>

      {/* === 对话互动区 === */}
      <div className={`p-6 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm relative overflow-hidden`}>

        {/* ── 宇宙拥抱动画层 ── */}
        {hugVisible && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="relative">
              <div className={`w-40 h-40 rounded-full ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'} animate-hug-expand`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart size={48} className="text-rose-400 animate-hug-pulse" fill="currentColor" />
              </div>
            </div>
            <div className="absolute bottom-20 text-center">
              <p className={`text-sm font-medium ${isDark ? 'text-rose-300' : 'text-rose-500'}`}>宇宙抱了抱你</p>
            </div>
          </div>
        )}

        {/* ── 问候 / 情绪选择 ── */}
        {step === 'greeting' && !showGoodnight && (
          <>
            <div className="text-center space-y-3 mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                <Moon size={28} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
              </div>
              <h2 className="text-lg font-medium">{greeting.text}</h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{greeting.sub}</p>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>今天的小宇宙是什么状态？</p>
            </div>

            <div className="space-y-2.5">
              {[
                { key: 'tired', text: '有点累，像被重力压着的星', icon: Coffee },
                { key: 'good', text: '还不错，今天有小小的光', icon: Sun },
                { key: 'gloomy', text: '有点闷，云挡住了星光', icon: CloudRain },
                { key: 'anxious', text: '很烦躁，像要爆发的超新星', icon: Flame },
                { key: 'racing', text: '脑子里停不下来，像乱飞的彗星', icon: Brain },
                { key: 'calm', text: '很平静，像深空一样安静', icon: Moon },
                { key: 'happy', text: '超开心，想分享这份光芒', icon: Sparkles },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => pickEmotion(item.key)}
                    className={`w-full p-3.5 rounded-2xl text-sm transition-all border flex items-center gap-3 active:scale-[0.98] ${
                      isDark
                        ? 'bg-[#1f1f2e] border-gray-800 hover:border-indigo-500/30'
                        : 'bg-gray-50 border-gray-100 hover:border-indigo-200'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                      <Icon size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                    </div>
                    <span className="flex-1 text-left">{item.text}</span>
                    <ChevronRight size={14} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── 情绪回应 + 互动选项 ── */}
        {step === 'responding' && emotion && !showGoodnight && (
          <>
            <div className="text-center space-y-3 mb-6">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                <EmotionIcon size={24} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
              </div>
              <h2 className="text-base font-medium">{emotion.responses[responseIndex]}</h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>想试试这个吗？</p>
            </div>

            {/* 互动内容区 */}
            <div className="mb-4">
              {/* 随机语录 */}
              {activeInteraction === 'quote' && quote && (
                <div className={`p-4 rounded-2xl text-center animate-fade-in ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
                  <p className={`text-sm italic mb-2 ${isDark ? 'text-indigo-200' : 'text-indigo-700'}`}>"{quote.text}"</p>
                  <p className={`text-xs ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}>— {quote.author}</p>
                </div>
              )}

              {/* 呼吸引导 */}
              {activeInteraction === 'breathe' && (
                <div className="flex flex-col items-center py-6 animate-fade-in">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-indigo-400/20 animate-breathe-ring" />
                    <div className="absolute inset-4 rounded-full bg-indigo-400/10 animate-breathe-ring-delay" />
                    <Wind size={32} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                  </div>
                  <p className={`text-xs mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>跟着圆环，吸气…呼气…</p>
                </div>
              )}

              {/* 丢进黑洞输入 */}
              {activeInteraction === 'blackhole' && (
                <div className="animate-fade-in space-y-3">
                  <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>写下来，然后让它消失</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={blackholeText}
                      onChange={(e) => setBlackholeText(e.target.value)}
                      placeholder="写下你想丢掉的东西…"
                      className={`flex-1 px-4 py-3 rounded-xl text-sm outline-none border ${
                        isDark
                          ? 'bg-[#1f1f2e] border-gray-700 text-white placeholder-gray-600'
                          : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                      }`}
                      onKeyDown={(e) => e.key === 'Enter' && throwToBlackhole()}
                    />
                    <button
                      onClick={throwToBlackhole}
                      className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm active:scale-95 transition-transform"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* 黑洞吸入动画 */}
              {activeInteraction === 'blackhole-done' && (
                <div className="py-8 text-center animate-fade-in">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <div className={`w-20 h-20 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} animate-blackhole-suck`} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles size={24} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                    </div>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>已经丢进黑洞了</p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>宇宙帮你保管，不再打扰你</p>
                </div>
              )}

              {/* 许愿输入 */}
              {activeInteraction === 'wish' && (
                <div className="animate-fade-in space-y-3">
                  <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>对着星空许个愿吧</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={wishText}
                      onChange={(e) => setWishText(e.target.value)}
                      placeholder="写下你的愿望…"
                      className={`flex-1 px-4 py-3 rounded-xl text-sm outline-none border ${
                        isDark
                          ? 'bg-[#1f1f2e] border-gray-700 text-white placeholder-gray-600'
                          : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                      }`}
                      onKeyDown={(e) => e.key === 'Enter' && makeWish()}
                    />
                    <button
                      onClick={makeWish}
                      className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm active:scale-95 transition-transform"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* 许愿完成 */}
              {activeInteraction === 'wish-done' && (
                <div className="py-8 text-center animate-fade-in">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <Sparkles size={40} className={`mx-auto animate-wish-fly ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>愿望已飞向星空</p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>宇宙收到了，会帮你守着</p>
                </div>
              )}
            </div>

            {/* 互动按钮 */}
            {!activeInteraction?.includes('-done') && (
              <div className="space-y-2 mb-4">
                {emotion.actions.map((action) => {
                  const ActionIcon = action.icon;
                  const isActive = activeInteraction === action.key;
                  return (
                    <button
                      key={action.key}
                      onClick={() => doInteraction(action.key)}
                      className={`w-full p-3 rounded-xl text-sm transition-all border flex items-center gap-2.5 active:scale-[0.98] ${
                        isActive
                          ? isDark
                            ? 'bg-indigo-500/20 border-indigo-500/40'
                            : 'bg-indigo-50 border-indigo-300'
                          : isDark
                            ? 'bg-[#1f1f2e] border-gray-800 hover:border-indigo-500/30'
                            : 'bg-gray-50 border-gray-100 hover:border-indigo-200'
                      }`}
                    >
                      <ActionIcon size={15} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                      <span className="flex-1 text-left">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 底部操作 */}
            <div className="flex gap-2 pt-2 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}">
              <button
                onClick={reset}
                className={`flex-1 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <RotateCcw size={13} />
                还想聊聊
              </button>
              <button
                onClick={goodnight}
                className={`flex-1 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 ${
                  isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                <Moon size={13} />
                好了，晚安
              </button>
            </div>
          </>
        )}

        {/* ── 晚安祝福 ── */}
        {showGoodnight && (
          <div className="text-center py-8 space-y-4 animate-fade-in">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
              <Moon size={36} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
            </div>
            <h2 className="text-lg font-medium">晚安，星星旅人</h2>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              愿你的梦里充满温柔与星光
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              宇宙会一直陪着你，直到天亮
            </p>
            <button
              onClick={reset}
              className={`mt-4 px-6 py-2.5 rounded-xl text-sm transition-colors ${
                isDark ? 'bg-[#1f1f2e] text-gray-300 border border-gray-700' : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              再聊一次
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
