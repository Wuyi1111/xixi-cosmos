/**
 * MyWhispersView.jsx — "我的心语"子界面
 *
 * 统一排版风格（参考星际足迹）：
 *   - 顶部返回按钮 + 标题
 *   - 统计卡片：总心语数 / 收藏数 / 今日发射
 *   - 心语列表：按日期倒序排列，可展开折叠
 */

import { useState } from 'react';
import { Star, Trash2, Radio, ChevronLeft, Heart, Calendar, MessageCircle, ChevronDown } from 'lucide-react';

export default function MyWhispersView({ isDark, userData, saveUserData, onClose, currentDateStr }) {
  const myWhispers = userData.myWhispers || [];
  const [expandedDates, setExpandedDates] = useState(() => {
    const todayStr = new Date().toDateString();
    return { [todayStr]: true };
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // 统计数据
  const totalWhispers = myWhispers.length;
  const favoriteCount = myWhispers.filter(w => w.isFavorite).length;
  const todayWhispers = myWhispers.filter(w => w.date === currentDateStr).length;

  // 按日期分组
  const whispersByDate = myWhispers.reduce((groups, whisper) => {
    const dateStr = whisper.date;
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(whisper);
    return groups;
  }, {});

  const toggleDate = (dateStr) => {
    setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  const toggleFavoriteWhisper = (id) => {
    const newList = myWhispers.map(log =>
      log.id === id ? { ...log, isFavorite: !log.isFavorite } : log
    );
    saveUserData({ ...userData, myWhispers: newList });
  };

  const confirmDeleteWhisper = () => {
    if (!deleteConfirmId) return;
    saveUserData({ ...userData, myWhispers: myWhispers.filter(log => log.id !== deleteConfirmId) });
    setDeleteConfirmId(null);
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
        <h2 className="text-lg font-medium">我的心语</h2>
      </div>

      {/* 统计卡片 */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${isDark ? 'bg-pink-500/15' : 'bg-pink-100'}`}>
              <MessageCircle size={18} className={isDark ? 'text-pink-400' : 'text-pink-500'} />
            </div>
            <p className={`text-xl font-medium ${isDark ? 'text-pink-400' : 'text-pink-500'}`}>{totalWhispers}</p>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>总心语数</p>
          </div>
          <div>
            <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${isDark ? 'bg-pink-500/15' : 'bg-pink-100'}`}>
              <Heart size={18} className={isDark ? 'text-pink-400' : 'text-pink-500'} />
            </div>
            <p className={`text-xl font-medium ${isDark ? 'text-pink-400' : 'text-pink-500'}`}>{favoriteCount}</p>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>收藏数</p>
          </div>
          <div>
            <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${isDark ? 'bg-pink-500/15' : 'bg-pink-100'}`}>
              <Calendar size={18} className={isDark ? 'text-pink-400' : 'text-pink-500'} />
            </div>
            <p className={`text-xl font-medium ${isDark ? 'text-pink-400' : 'text-pink-500'}`}>{todayWhispers}</p>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>今日发射</p>
          </div>
        </div>
      </div>

      {/* 心语列表 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Radio size={14} className={isDark ? 'text-pink-400' : 'text-pink-500'} />
          <h3 className="text-sm font-medium">发射记录</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-pink-500/10 text-pink-300' : 'bg-pink-50 text-pink-600'}`}>
            {myWhispers.length}
          </span>
        </div>

        {Object.entries(whispersByDate).length === 0 ? (
          <div className={`p-8 rounded-[20px] text-center ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-pink-500/10' : 'bg-pink-50'}`}>
              <Radio size={28} className={isDark ? 'text-pink-400' : 'text-pink-500'} />
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>还没有心语</p>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>去发射你的第一条信号吧</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(whispersByDate).map(([dateStr, whispers]) => {
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
                      <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-pink-400' : 'bg-pink-500'}`} />
                      <span className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {isToday ? '今天' : `${date.getMonth() + 1}月${date.getDate()}日`}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {whispers.length} 条心语
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${isExpanded ? 'rotate-180' : ''} ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                    />
                  </button>

                  {/* 心语卡片（可折叠） */}
                  {isExpanded && (
                    <div className="mt-2 space-y-2 px-1">
                      {whispers.map((whisper) => (
                        <div
                          key={whisper.id}
                          className={`p-3 rounded-[16px] border ${
                            isDark ? 'bg-[#171724]/70 border-white/5' : 'bg-white border-gray-100 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md ${isDark ? 'bg-pink-500/10 text-pink-400' : 'bg-pink-50 text-pink-600'}`}>
                              {whisper.emotion}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleFavoriteWhisper(whisper.id)}
                                className="p-1.5 hover:scale-110 transition-transform"
                              >
                                <Star
                                  size={14}
                                  className={`${whisper.isFavorite ? 'text-yellow-400 fill-yellow-400' : (isDark ? 'text-gray-600' : 'text-gray-300')}`}
                                />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(whisper.id)}
                                className={`p-1.5 ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <p className={`text-sm font-light leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            {whisper.text}
                          </p>
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

      {/* 删除确认弹窗 */}
      {deleteConfirmId && (
        <div className={`fixed inset-0 z-[70] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setDeleteConfirmId(null)}>
          <div className={`w-full max-w-xs p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative text-center`} onClick={e => e.stopPropagation()}>
            <div className="mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
              <Trash2 size={24} />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>确认消散</h3>
            <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>确定要让这段信号消散在宇宙中吗？此操作不可撤销。</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-[#1f1f2e] hover:bg-[#262638] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>保留</button>
              <button onClick={confirmDeleteWhisper} className="flex-1 py-3 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20 active:scale-95">消散</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
