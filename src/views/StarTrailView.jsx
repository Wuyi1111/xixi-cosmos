/**
 * StarTrailView.jsx — 星际足迹子界面
 *
 * 参考微信读书"我的阅读"风格：
 *   - 顶部返回按钮 + 标题
 *   - 统计卡片：本月完成天数 / 连续完成天数 / 总任务数
 *   - 日历视图：当月日历，有完成任务的日子显示标记
 *   - 任务列表：按日期倒序排列的历史完成任务
 */

import { useState, useMemo } from 'react';
import { ChevronLeft, CheckCircle2, ChevronDown, Calendar, Trophy, TrendingUp } from 'lucide-react';

export default function StarTrailView({ isDark, userData, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedDates, setExpandedDates] = useState(() => {
    const todayStr = new Date().toDateString();
    return { [todayStr]: true };
  });

  // 获取所有已完成的任务（从 taskFootprints 中读取）
  const completedTasks = useMemo(() => {
    const tasks = userData.taskFootprints || [];
    return tasks.sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date));
  }, [userData.taskFootprints]);

  // 按日期分组
  const tasksByDate = useMemo(() => {
    const groups = {};
    completedTasks.forEach(task => {
      const date = new Date(task.completedAt || task.date);
      const dateStr = date.toDateString();
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(task);
    });
    return groups;
  }, [completedTasks]);

  // 统计
  const currentMonthStr = currentMonth.toISOString().slice(0, 7); // "2026-05"
  const monthTasks = completedTasks.filter(t => {
    const date = new Date(t.completedAt || t.date);
    return date.toISOString().slice(0, 7) === currentMonthStr;
  });
  const monthDays = new Set(monthTasks.map(t => {
    const date = new Date(t.completedAt || t.date);
    return date.toDateString();
  })).size;

  const toggleDate = (dateStr) => {
    setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  // 日历数据
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay(); // 0=周日
    const daysInMonth = lastDay.getDate();

    const days = [];
    // 上月填充
    for (let i = 0; i < startPadding; i++) {
      days.push({ type: 'padding' });
    }
    // 当月
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toDateString();
      const hasTask = tasksByDate[dateStr] && tasksByDate[dateStr].length > 0;
      const isToday = date.toDateString() === new Date().toDateString();
      days.push({ type: 'day', day: d, hasTask, isToday });
    }
    return days;
  }, [currentMonth, tasksByDate]);

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="animate-fade-in pb-10 space-y-5">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className={`p-2 rounded-full ${isDark ? 'bg-[#171724] text-gray-400' : 'bg-white text-gray-500 shadow-sm'}`}
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-medium">星际足迹</h2>
      </div>

      {/* 统计卡片 */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-100'}`}>
              <Calendar size={18} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
            </div>
            <p className={`text-xl font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>{monthDays}</p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>本月约定天数</p>
          </div>
          <div>
            <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-100'}`}>
              <Trophy size={18} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
            </div>
            <p className={`text-xl font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>{completedTasks.length}</p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>总完成约定</p>
          </div>
        </div>
      </div>

      {/* 日历视图 */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        {/* 月份切换 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className={`p-1.5 rounded-lg transition-all active:scale-95 ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <ChevronLeft size={16} />
          </button>
          <h3 className="text-sm font-medium">
            {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
          </h3>
          <button
            onClick={nextMonth}
            className={`p-1.5 rounded-lg transition-all active:scale-95 ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <ChevronLeft size={16} className="rotate-180" />
          </button>
        </div>

        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(d => (
            <div key={d} className={`text-center text-[10px] py-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div key={index} className="aspect-square">
              {day.type === 'day' ? (
                <div
                  className={`w-full h-full rounded-xl flex flex-col items-center justify-center text-[11px] relative ${
                    day.isToday
                      ? (isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-600')
                      : (isDark ? 'text-gray-300' : 'text-gray-700')
                  }`}
                >
                  {day.day}
                  {day.hasTask && (
                    <div className={`w-1 h-1 rounded-full mt-0.5 ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                  )}
                </div>
              ) : (
                <div />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 任务列表 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <TrendingUp size={14} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
          <h3 className="text-sm font-medium">完成记录</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
            {completedTasks.length}
          </span>
        </div>

        {Object.entries(tasksByDate).length === 0 ? (
          <div className={`p-8 rounded-[20px] text-center ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>还没有完成约定</p>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>完成明日小事后会在这里留下足迹</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(tasksByDate).map(([dateStr, tasks]) => {
              const date = new Date(dateStr);
              const isToday = dateStr === new Date().toDateString();
              const isExpanded = expandedDates[dateStr];
              return (
                <div key={dateStr}>
                  {/* 日期标题（可点击折叠） */}
                  <button
                    onClick={() => toggleDate(dateStr)}
                    className={`w-full flex items-center justify-between p-3 rounded-[16px] transition-all ${
                      isDark ? 'bg-[#171724] border border-white/5 hover:bg-[#1f1f2e]' : 'bg-white border border-gray-100 shadow-sm hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                      <span className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {isToday ? '今天' : `${date.getMonth() + 1}月${date.getDate()}日`}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {tasks.length} 个约定
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${isExpanded ? 'rotate-180' : ''} ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                    />
                  </button>

                  {/* 任务卡片（可折叠） */}
                  {isExpanded && (
                    <div className="mt-2 space-y-2 px-1">
                      {tasks.map((task, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-[16px] border flex items-center gap-3 ${
                            isDark ? 'bg-[#171724]/70 border-white/5' : 'bg-white border-gray-100 shadow-sm'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                            {task.emoji || '✅'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{task.main}</p>
                          </div>
                          <CheckCircle2 size={16} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
