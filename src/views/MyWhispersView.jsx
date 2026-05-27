/**
 * MyWhispersView.jsx — "我的心语"独立子界面
 *
 * 显示用户发射过的所有心语，支持展开、收藏、删除
 */

import { useState } from 'react';
import { X, Star, Trash2, Radio, ChevronLeft } from 'lucide-react';
import Portal from '../components/Portal.jsx';

export default function MyWhispersView({ isDark, userData, saveUserData, onClose }) {
  const myWhispers = userData.myWhispers || [];
  const [expandedWhisperId, setExpandedWhisperId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const toggleFavoriteWhisper = (id) => {
    const newList = myWhispers.map(log =>
      log.id === id ? { ...log, isFavorite: !log.isFavorite } : log
    );
    saveUserData({ ...userData, myWhispers: newList });
  };

  const confirmDeleteWhisper = () => {
    saveUserData({ ...userData, myWhispers: myWhispers.filter(log => log.id !== deleteConfirmId) });
    setDeleteConfirmId(null);
  };

  return (
    <Portal>
      <div className={`fixed inset-0 z-[60] ${isDark ? 'bg-[#0f0f1a]' : 'bg-[#f8fafc]'} animate-fade-in flex flex-col`}>
        {/* 顶部导航 */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
          >
            <ChevronLeft size={20} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
          </button>
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-pink-400" />
            <h2 className={`text-base font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>我的心语</h2>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full ml-auto ${isDark ? 'bg-[#1f1f2e] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
            {myWhispers.length} 条
          </span>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {myWhispers.length > 0 ? (
            myWhispers.map(whisper => {
              const isExpanded = expandedWhisperId === whisper.id;
              return (
                <div
                  key={whisper.id}
                  onClick={() => setExpandedWhisperId(isExpanded ? null : whisper.id)}
                  className={`p-4 rounded-[20px] border cursor-pointer transition-all ${
                    isDark ? 'bg-[#171724] border-white/5 hover:bg-[#1a1a2e]' : 'bg-white border-gray-100 hover:shadow-md'
                  } active:scale-[0.98]`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2.5 py-1 rounded-md ${isDark ? 'bg-pink-500/10 text-pink-400' : 'bg-pink-50 text-pink-600'}`}>
                        {whisper.emotion}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{whisper.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavoriteWhisper(whisper.id); }}
                        className="p-1.5 hover:scale-110 transition-transform"
                      >
                        <Star
                          size={14}
                          className={`${whisper.isFavorite ? 'text-yellow-400 fill-yellow-400' : (isDark ? 'text-gray-600' : 'text-gray-300')}`}
                        />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(whisper.id); }}
                        className={`p-1.5 ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className={`text-sm font-light leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'} ${!isExpanded ? 'line-clamp-3' : ''}`}>
                    {whisper.text}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-pink-500/10' : 'bg-pink-50'}`}>
                <Radio size={28} className={isDark ? 'text-pink-400' : 'text-pink-500'} />
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>还没有心语</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>去发射你的第一条信号吧</p>
            </div>
          )}
        </div>

        {/* 删除确认弹窗 */}
        {deleteConfirmId && (
          <Portal>
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
          </Portal>
        )}
      </div>
    </Portal>
  );
}
