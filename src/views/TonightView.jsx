/**
 * TonightView.jsx — "此刻"板块（v4.40.0 对话式版）
 *
 * 页面结构：
 *   1) 标题区：品牌名 + 日期问候
 *   2) 对话互动区：问候 → 选项 → 回应 → 引导
 *   3) 星际回音：横向滑动卡片
 *   4) 底部导航：去雷达 / 去归星
 */

import { useState, useEffect } from 'react';
import { ChevronRight, Moon, CloudRain, Sun, Coffee, Wind, Compass } from 'lucide-react';

// 对话流程定义
const DIALOG_FLOW = {
  greeting: {
    message: "晚上好，星星旅人",
    subMessage: "今晚的宇宙很安静",
    icon: Moon,
    options: [
      { text: "有点累，想放松", next: 'tired', icon: Coffee },
      { text: "心情不错", next: 'good', icon: Sun },
      { text: "有点睡不着", next: 'sleepless', icon: CloudRain },
    ],
  },
  tired: {
    message: "累了就让自己慢下来",
    subMessage: "宇宙会等你准备好",
    icon: Coffee,
    options: [
      { text: "想听听夜声", action: 'goto_star', icon: Wind },
      { text: "写条心语", action: 'write_whisper', icon: Star },
    ],
  },
  good: {
    message: "真好，带着好心情入梦",
    subMessage: "星星也会为你多亮一点",
    icon: Sun,
    options: [
      { text: "去归星", action: 'goto_star', icon: Moon },
      { text: "看看星海", action: 'goto_radar', icon: Star },
    ],
  },
  sleepless: {
    message: "没关系，很多人此刻也没睡",
    subMessage: "试着把注意力放在呼吸上",
    icon: CloudRain,
    options: [
      { text: "试试伴眠夜声", action: 'goto_star', icon: Wind },
      { text: "去雷达看看", action: 'goto_radar', icon: Compass },
    ],
  },
};

export default function TonightView({ isDark, onNavigate }) {
  const [dialogStep, setDialogStep] = useState('greeting');
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResponse, setShowResponse] = useState(false);

  const currentDialog = DIALOG_FLOW[dialogStep];

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setShowResponse(true);

    if (option.next) {
      setTimeout(() => {
        setDialogStep(option.next);
        setSelectedOption(null);
        setShowResponse(false);
      }, 1500);
    } else if (option.action) {
      setTimeout(() => {
        if (option.action === 'goto_star') {
          onNavigate('star');
        } else if (option.action === 'goto_radar') {
          onNavigate('treehole');
        } else if (option.action === 'write_whisper') {
          onNavigate('treehole');
        }
      }, 1200);
    }
  };

  // 当前日期
  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[today.getDay()];
  const hour = today.getHours();
  const greeting = hour >= 18 ? '晚上好' : hour >= 12 ? '下午好' : '早上好';

  const DialogIcon = currentDialog.icon;

  return (
    <div className="animate-fade-in pb-10 space-y-5">
      {/* === 1. 标题区 === */}
      <div>
        <h1 className="text-xl font-medium tracking-wide">息息·宇宙</h1>
        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {month}月{date}日 {weekDay}
        </p>
      </div>

      {/* === 2. 对话互动区 === */}
      <div className={`p-6 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        {/* 问候/回应 */}
        <div className="text-center space-y-3 mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
            <DialogIcon size={28} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
          </div>
          <h2 className="text-lg font-medium">{currentDialog.message}</h2>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {currentDialog.subMessage}
          </p>
        </div>

        {/* 选项按钮 */}
        {!showResponse && (
          <div className="space-y-3">
            {currentDialog.options.map((option, idx) => {
              const OptionIcon = option.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(option)}
                  className={`w-full p-4 rounded-2xl text-sm transition-all border flex items-center gap-3 active:scale-[0.98] ${
                    isDark
                      ? 'bg-[#1f1f2e] border-gray-800 hover:border-indigo-500/30'
                      : 'bg-gray-50 border-gray-100 hover:border-indigo-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                    <OptionIcon size={18} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                  </div>
                  <span className="flex-1 text-left font-medium">{option.text}</span>
                  <ChevronRight size={16} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                </button>
              );
            })}
          </div>
        )}

        {/* 选中后的反馈 */}
        {showResponse && selectedOption && (
          <div className="text-center py-4 animate-fade-in">
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              好的，带你{selectedOption.text}...
            </p>
          </div>
        )}
      </div>


    </div>
  );
}
