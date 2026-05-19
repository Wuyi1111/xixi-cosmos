/**
 * TonightView.jsx — 首页"此刻"。
 *
 * 屏幕从上到下：
 *   1) 标题"息息·宇宙"
 *   2) 安神助手（折叠 / 展开）→ 舒缓调息 / 宇宙白噪音
 *   3) 核心打卡区：未打卡 → 三阶段（召唤 → 网格选情绪 → 写心语 → 安放）
 *                  已打卡 → "夜航已启程"状态卡
 *   4) 本周星轨印记（7 天小日历）+ "全月星轨"按钮 → 月历 modal
 *   5) 潜意识梦境舱（DreamCard）
 *
 * 改什么：
 *   - 改打卡的三阶段交互、动画、文案 → 这里 selectedMood / isMoodSelectorOpen 分支
 *   - 改"夜航已启程"状态卡（图标 / 文案 / 连签徽章）→ 这里 hasCheckedInToday 分支
 *   - 改 6 个情绪选项（图标、颜色、安慰语）→ src/constants.js 的 EMOTIONS
 *   - 改本周 / 全月日历布局 → 这里 currentWeekDays / showCalendar 区块
 *   - "舒缓调息"按钮的具体功能 → src/widgets/BreathingWidget.jsx
 *   - "宇宙白噪音"按钮（目前是占位，没接音乐）→ 这里给它加 onClick
 *
 * 不在这里改：
 *   - 打卡后给多少星尘 / 连签 bonus → src/App.jsx 的 handleCheckIn()
 *   - 梦境舱本身的交互 → src/widgets/DreamCard.jsx
 */

import React, { useState, useEffect } from 'react';
import { Music, Wind, Moon, Sparkles, Compass, ChevronDown, X, Edit3, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import BreathingWidget from '../widgets/BreathingWidget.jsx';
import DreamCard from '../widgets/DreamCard.jsx';
import { EMOTIONS } from '../constants.js';

// --- 页面 1：此刻 (Tonight) ---
export default function TonightView({ isDark, hasCheckedInToday, onCheckIn, userData, saveUserData, currentDateStr }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [whisper, setWhisper] = useState('');
  const [comfortText, setComfortText] = useState('闭上眼睛，深呼吸。今夜，你的内心是何种风景？');

  const [isAidExpanded, setIsAidExpanded] = useState(false);
  const [isMoodSelectorOpen, setIsMoodSelectorOpen] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);

  const [selectedTrackRecord, setSelectedTrackRecord] = useState(null);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(currentDateStr));

  const moodData = selectedMood ? EMOTIONS.find(e => e.id === selectedMood) : null;
  const lastRecord = userData.checkInHistory[0];

  useEffect(() => {
    if (moodData) {
      const texts = moodData.texts;
      setComfortText(texts[Math.floor(Math.random() * texts.length)]);
    }
  }, [selectedMood]);

  // 生成本周(周一至周日)的日期数组
  const currentWeekDays = React.useMemo(() => {
    const date = new Date(currentDateStr);
    const day = date.getDay();
    const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diffToMonday);

    return Array.from({length: 7}, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toDateString();
    });
  }, [currentDateStr]);

  if (showBreathing) {
    return <BreathingWidget isDark={isDark} onClose={() => setShowBreathing(false)} />;
  }

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <header className="text-center pt-1 mb-2">
        <h1 className="text-2xl font-light tracking-widest mb-2">息息·宇宙</h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} font-light`}>
          与繁星作伴，和内心和解
        </p>
      </header>

      {/* 安神助手 (折叠/展开) */}
      <section className={`p-5 rounded-[28px] transition-colors ${isDark ? 'bg-[#171724]' : 'bg-white shadow-sm'}`}>
        <button
          onClick={() => setIsAidExpanded(!isAidExpanded)}
          className="flex w-full justify-between items-center outline-none"
        >
          <h2 className="text-sm font-medium flex items-center gap-2">
            <Music size={18} className="text-indigo-400" />
            安神助手
          </h2>
          <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isAidExpanded ? 'rotate-180' : ''}`} />
        </button>

        {isAidExpanded && (
          <div className="flex gap-4 mt-4 animate-fade-in">
            <button
              onClick={() => setShowBreathing(true)}
              className={`flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors ${isDark ? 'bg-[#1f1f2e] hover:bg-[#262638]' : 'bg-gray-50 hover:bg-gray-100'}`}>
              <Wind size={20} className="text-emerald-400" />
              <span className="text-xs">舒缓调息</span>
            </button>
            <button className={`flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors ${isDark ? 'bg-[#1f1f2e] hover:bg-[#262638]' : 'bg-gray-50 hover:bg-gray-100'}`}>
              <Music size={20} className="text-indigo-400" />
              <span className="text-xs">宇宙白噪音</span>
            </button>
          </div>
        )}
      </section>

      {/* 核心打卡交互区：情绪胶囊（首页主 CTA，所以做得明显一点） */}
      {hasCheckedInToday ? (
        <section className={`p-8 rounded-[32px] text-center relative overflow-hidden transition-colors border ${isDark ? 'bg-[#1a1a24] border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.05)]' : 'bg-gradient-to-b from-indigo-50/80 to-white border-indigo-100 shadow-sm'}`}>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-20 h-20 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 relative">
            <Moon size={36} className="text-indigo-400 animate-float" />
            <div className="absolute inset-0 border-2 border-indigo-400/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
            {userData.continuousDays >= 3 && (
              <div className="absolute -top-1 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md transform rotate-12">
                连签 x{userData.continuousDays}
              </div>
            )}
          </div>

          <h2 className="text-xl font-medium mb-2 tracking-wide">夜航已启程</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
            你已在宇宙中连续驻留了 <span className="text-indigo-400 font-medium text-base">{userData.continuousDays}</span> 个夜晚
          </p>

          <div className={`p-4 rounded-2xl inline-block ${isDark ? 'bg-black/20 border border-white/5' : 'bg-white border border-indigo-50 shadow-sm'}`}>
            <p className="text-xs flex items-center justify-center gap-2">
              <Sparkles size={14} className="text-indigo-400" />
              本次探索收集 <span className="text-indigo-400 font-medium">+{lastRecord?.stardustEarned || 10}</span> 星尘
            </p>
          </div>
        </section>
      ) : (
        <section className={`transition-all duration-700 ease-in-out rounded-[32px] relative overflow-hidden border ${
          selectedMood
            ? (isDark ? 'bg-[#1a1a24] shadow-2xl' : 'bg-white shadow-xl')
            : (isDark
                ? 'bg-gradient-to-br from-[#1f1f2e] to-[#1a1a28] border-indigo-500/40 hover:border-indigo-400/60 cursor-pointer shadow-[0_0_40px_rgba(99,102,241,0.12)]'
                : 'bg-gradient-to-br from-indigo-50/80 to-white border-indigo-200 hover:border-indigo-300 cursor-pointer shadow-lg shadow-indigo-500/10')
        }`}
        style={{
           borderColor: selectedMood ? `${moodData.color}30` : '',
           boxShadow: selectedMood ? `0 10px 40px -10px ${moodData.color}15` : ''
        }}
        onClick={() => !isMoodSelectorOpen && !selectedMood && setIsMoodSelectorOpen(true)}
        >
          {selectedMood && (
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-[0.08] pointer-events-none transition-all duration-1000" style={{ backgroundColor: moodData.color }}></div>
          )}

          <div className="p-6 relative z-10">
            {!selectedMood && !isMoodSelectorOpen && (
              <div className="animate-fade-in flex flex-col justify-center items-center text-center py-3 group">
                {/* 罗盘 + 柔光晕：用 animate-pulse 慢呼吸 + animate-float 微浮，把视线拉过来 */}
                <div className="relative mb-5">
                  <div className={`absolute inset-0 -m-3 rounded-full blur-2xl ${isDark ? 'bg-indigo-500/30' : 'bg-indigo-400/30'} animate-pulse`}></div>
                  <Compass
                    size={44}
                    className={`relative animate-float transition-transform duration-500 group-hover:rotate-45 ${isDark ? 'text-indigo-300' : 'text-indigo-500'}`}
                  />
                </div>

                {/* 主问句：放大、加重，作为核心引导 */}
                <p className={`text-base font-medium leading-relaxed mb-1.5 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                  今夜，你的内心是何种风景？
                </p>
                <p className={`text-xs font-light ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  闭上眼睛，深呼吸
                </p>

                {/* 真正"长得像按钮"的 CTA，告诉用户点这里 */}
                <div className={`mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all group-hover:scale-[1.03] ${
                  isDark
                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                    : 'bg-indigo-500/10 text-indigo-600 border border-indigo-200 shadow-sm'
                }`}>
                  <span>记录今夜星象</span>
                  <ChevronDown size={14} className="animate-bounce" />
                </div>
              </div>
            )}

            {isMoodSelectorOpen && (
              <div className="animate-fade-in space-y-5 py-2">
                 <div className="flex justify-between items-center px-1">
                   <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>选一颗最像今夜的你</span>
                   <button onClick={(e) => { e.stopPropagation(); setIsMoodSelectorOpen(false); }} className="p-1 rounded-full hover:bg-gray-500/10 text-gray-400 hover:text-gray-200 transition-colors"><X size={16}/></button>
                 </div>
                 <div className="grid grid-cols-3 gap-3">
                   {EMOTIONS.map(emotion => (
                     <button
                       key={emotion.id}
                       onClick={(e) => {
                         e.stopPropagation();
                         setSelectedMood(emotion.id);
                         setIsMoodSelectorOpen(false);
                       }}
                       className={`py-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300 border ${
                         isDark ? 'bg-[#171724] border-white/5 hover:border-white/10 hover:bg-[#1f1f2e]' : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:border-indigo-200 hover:shadow-sm'
                       }`}
                     >
                       <span className="text-3xl" style={{ color: emotion.color }}>
                         {emotion.symbol}
                       </span>
                       <span className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{emotion.name}</span>
                     </button>
                   ))}
                 </div>
              </div>
            )}

            {selectedMood && (
              <div className="animate-fade-in space-y-6">
                <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: `${moodData.color}15`, color: moodData.color }}>
                      {moodData.symbol}
                    </div>
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{moodData.name}</span>
                  </div>
                  <button
                    onClick={() => { setSelectedMood(null); setIsMoodSelectorOpen(true); setWhisper(''); }}
                    className={`text-[10px] px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1 ${isDark ? 'border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    <Edit3 size={10} />重新感知
                  </button>
                </div>

                <div className="text-center py-2 px-4">
                  <p className={`text-sm font-light leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    "{comfortText}"
                  </p>
                </div>

                <div className="relative group">
                  <textarea
                    className={`w-full p-5 rounded-2xl resize-none h-28 text-sm focus:outline-none transition-all duration-300 ${
                      isDark ? 'bg-black/20 text-gray-200 placeholder-gray-600' : 'bg-gray-50/50 text-gray-800 placeholder-gray-400'
                    }`}
                    style={{ border: `1px solid ${moodData.color}20` }}
                    onFocus={(e) => e.target.style.borderColor = `${moodData.color}80`}
                    onBlur={(e) => e.target.style.borderColor = `${moodData.color}20`}
                    placeholder="把今天不想带到明天的心事，留在这里吧...（选填）"
                    maxLength={200}
                    value={whisper}
                    onChange={e => setWhisper(e.target.value)}
                  ></textarea>
                  <div className={`absolute bottom-3 right-4 text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {whisper.length}/200
                  </div>
                </div>

                <button
                  onClick={() => onCheckIn(selectedMood, whisper)}
                  className="w-full py-4 rounded-2xl text-white font-medium tracking-wider transition-all active:scale-95 flex justify-center items-center gap-2"
                  style={{ backgroundColor: '#6366f1', boxShadow: `0 8px 25px -5px ${moodData.color}60` }}
                >
                  安放情绪，晚安 <Moon size={16} />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 本周星轨印记 */}
      <section className={`p-5 rounded-[28px] transition-colors ${isDark ? 'bg-[#171724]' : 'bg-white shadow-sm'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Calendar size={16} className="text-indigo-400" />
            本周星轨印记
          </h3>
          <button
            onClick={() => setShowCalendar(true)}
            className={`flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-full transition-colors ${isDark ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-sm'}`}
          >
            <Calendar size={12} />
            <span>全月星轨</span>
          </button>
        </div>
        <div className="flex justify-between items-center px-1">
          {currentWeekDays.map((dateStr, idx) => {
            const record = userData.checkInHistory.find(r => r.date === dateStr);
            const isToday = dateStr === currentDateStr;
            const isFuture = new Date(dateStr) > new Date(currentDateStr);
            const weekNames = ['一', '二', '三', '四', '五', '六', '日'];

            return (
              <div key={dateStr} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => record ? setSelectedTrackRecord(record) : null}
                  disabled={isFuture}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    record
                      ? (isDark ? 'bg-[#1f1f2e] border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200')
                      : (isFuture
                          ? (isDark ? 'bg-transparent border border-gray-800/30 opacity-30' : 'bg-transparent border border-gray-200 opacity-50')
                          : (isDark ? 'bg-gray-800/30 border border-gray-800' : 'bg-gray-100 border border-gray-200'))
                  } ${record ? 'hover:scale-110 hover:shadow-md hover:shadow-indigo-500/20 active:scale-95 cursor-pointer' : (isFuture ? 'cursor-not-allowed' : 'cursor-default opacity-50')}`}
                >
                  {record ? (
                    <span className="text-[14px]">{EMOTIONS.find(e => e.id === record.moodId)?.symbol}</span>
                  ) : (
                    <div className={`w-1.5 h-1.5 rounded-full ${isFuture ? 'bg-transparent' : 'bg-gray-500/50'}`}></div>
                  )}
                </button>
                <span className={`text-[10px] ${isToday ? 'text-indigo-400 font-medium' : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
                  {isToday ? '今' : weekNames[idx]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 点击星轨弹出的详情 Modal */}
      {selectedTrackRecord && (
        <Portal>
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`}>
            <div className={`w-full max-w-sm p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative`}>
              <button onClick={() => setSelectedTrackRecord(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200"><X size={20} /></button>
              <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-3 ${isDark ? 'bg-[#1f1f2e]' : 'bg-indigo-50'}`}>
                  {EMOTIONS.find(e => e.id === selectedTrackRecord.moodId)?.symbol}
                </div>
                <h3 className="text-lg font-medium">{selectedTrackRecord.moodName}</h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedTrackRecord.date} {selectedTrackRecord.timeStr && `· ${selectedTrackRecord.timeStr}`}
                </p>
              </div>

              <div className={`p-4 rounded-2xl text-sm font-light leading-relaxed ${isDark ? 'bg-[#1f1f2e] text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                "{selectedTrackRecord.whisper || '这一夜很安静，宇宙只留下了你呼吸的回声。'}"
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* 展开的完整日历视图 */}
      {showCalendar && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowCalendar(false)}>
            <div className={`w-full max-w-sm p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative`} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowCalendar(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200"><X size={20} /></button>

              <div className="flex justify-between items-center mb-6 px-2 pt-2">
                <button onClick={() => {const d = new Date(calendarMonth); d.setMonth(d.getMonth() - 1); setCalendarMonth(d);}} className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400 hover:text-indigo-400' : 'hover:bg-gray-100 text-gray-500 hover:text-indigo-500'}`}><ChevronLeft size={20}/></button>
                <h3 className="text-base font-medium tracking-wider">{calendarMonth.getFullYear()}年 {calendarMonth.getMonth() + 1}月</h3>
                <button onClick={() => {const d = new Date(calendarMonth); d.setMonth(d.getMonth() + 1); setCalendarMonth(d);}} className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400 hover:text-indigo-400' : 'hover:bg-gray-100 text-gray-500 hover:text-indigo-500'}`}><ChevronRight size={20}/></button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-3">
                {['一', '二', '三', '四', '五', '六', '日'].map(day => (
                  <div key={day} className={`text-center text-[11px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-3 gap-x-1">
                {(() => {
                  const year = calendarMonth.getFullYear();
                  const month = calendarMonth.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const offset = firstDay === 0 ? 6 : firstDay - 1;

                  const grid = [];
                  for(let i=0; i<offset; i++) grid.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
                  for(let i=1; i<=daysInMonth; i++) {
                    const dStr = new Date(year, month, i).toDateString();
                    const isToday = dStr === currentDateStr;
                    const isFuture = new Date(year, month, i) > new Date(currentDateStr);
                    const record = userData.checkInHistory.find(r => r.date === dStr);

                    grid.push(
                      <div key={i} className="flex justify-center">
                        <button
                          onClick={() => {
                            if (record) {
                              setSelectedTrackRecord(record);
                              setShowCalendar(false);
                            }
                          }}
                          disabled={isFuture || !record}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] transition-all relative ${
                            record
                              ? (isDark ? 'bg-[#1f1f2e] border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 'bg-indigo-50 border border-indigo-200 shadow-sm')
                              : (isFuture
                                  ? (isDark ? 'text-gray-700 opacity-30' : 'text-gray-300 opacity-50')
                                  : (isDark ? 'text-gray-400 hover:bg-gray-800/50' : 'text-gray-600 hover:bg-gray-100'))
                          } ${isToday && !record ? 'ring-1 ring-indigo-400/50' : ''}`}
                        >
                          {record ? (
                             <span className="text-[14px]">{EMOTIONS.find(e => e.id === record.moodId)?.symbol}</span>
                          ) : (
                             i
                          )}
                          {isToday && <div className="absolute -bottom-1 w-1 h-1 bg-indigo-400 rounded-full"></div>}
                        </button>
                      </div>
                    );
                  }
                  return grid;
                })()}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* 梦境舱组件 */}
      <DreamCard
        isDark={isDark}
        userData={userData}
        saveUserData={saveUserData}
        currentDateStr={currentDateStr}
      />
    </div>
  );
}
