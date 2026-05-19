/**
 * DreamCard.jsx — "潜意识梦境舱"卡片，挂在 TonightView 底部。
 *
 * 用户写一段梦 → 点"保存并接收宇宙寄语" → 本地随机抽一句寄语，存进
 * userData.dreamLogs。所有处理在本机，不发送到任何远程接口。
 *
 * 改什么：
 *   - 改 / 加宇宙寄语池（让随机抽更丰富）→ src/constants.js 的 COSMIC_DREAM_INTERPRETATIONS
 *   - 改"伪 AI 等待时间"（默认 900ms）→ handleInterpret 里的 setTimeout
 *   - 改梦境最大长度（默认 300 字）→ textarea 的 maxLength
 *   - 改文案（"潜意识梦境舱" / "保存并接收宇宙寄语" / "宇宙的寄语" 等）→ 这里 JSX
 *   - 改单条梦境的交互（展开 / 收藏 / 编辑 / 删除）→ toggleFavorite / startEdit / triggerDelete
 *
 * 注意：编辑一条梦的内容时，对应的"宇宙寄语"不会自动重新生成，这是有意的
 *      （保留首次记下时的那句寄语，避免覆盖。要做"重新摇一签"，加一个新按钮）。
 */

import { useState } from 'react';
import { Cloud, Plus, Loader2, Sparkles, Star, ChevronDown, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import { COSMIC_DREAM_INTERPRETATIONS } from '../constants.js';

// 独立的梦境与AI解梦卡片组件
export default function DreamCard({ isDark, userData, saveUserData, currentDateStr }) {
  const [isWriting, setIsWriting] = useState(false);
  const [dreamInput, setDreamInput] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editInput, setEditInput] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const dreamLogs = userData.dreamLogs || [];

  const handleInterpret = () => {
    if (!dreamInput.trim()) return;
    setIsInterpreting(true);

    // 本地随机抽一句宇宙寄语，模拟一段"接收宇宙信号"的等待
    const text = COSMIC_DREAM_INTERPRETATIONS[
      Math.floor(Math.random() * COSMIC_DREAM_INTERPRETATIONS.length)
    ];

    setTimeout(() => {
      const newLog = {
        id: Date.now(),
        date: currentDateStr,
        dream: dreamInput,
        interpretation: text,
        isFavorite: false,
      };
      saveUserData({
        ...userData,
        dreamLogs: [newLog, ...dreamLogs],
      });
      setDreamInput('');
      setIsWriting(false);
      setExpandedId(newLog.id);
      setIsInterpreting(false);
    }, 900);
  };

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    const newLogs = dreamLogs.map(log => log.id === id ? { ...log, isFavorite: !log.isFavorite } : log);
    saveUserData({ ...userData, dreamLogs: newLogs });
  };

  const triggerDelete = (id, e) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    saveUserData({ ...userData, dreamLogs: dreamLogs.filter(log => log.id !== deleteConfirmId) });
    setDeleteConfirmId(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const startEdit = (log, e) => {
    e.stopPropagation();
    setEditingId(log.id);
    setEditInput(log.dream);
    setExpandedId(log.id);
  };

  const saveEdit = (id) => {
    if(!editInput.trim()) return;
    const newLogs = dreamLogs.map(log => log.id === id ? { ...log, dream: editInput } : log);
    saveUserData({ ...userData, dreamLogs: newLogs });
    setEditingId(null);
  };

  return (
    <section className={`p-6 rounded-[32px] relative overflow-hidden transition-colors ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#171724] border border-purple-500/10' : 'bg-gradient-to-br from-purple-50/50 to-indigo-50/30 border border-purple-100 shadow-sm'}`}>
      <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-purple-600/10' : 'bg-purple-300/20'}`}></div>
      <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-indigo-600/10' : 'bg-indigo-300/20'}`}></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-center mb-5">
          <h2 className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
            <Cloud size={18} className={isDark ? 'text-purple-400' : 'text-purple-500'} />
            潜意识梦境舱
          </h2>
          {!isWriting && (
            <button
              onClick={() => setIsWriting(true)}
              className={`p-1.5 rounded-full transition-colors ${isDark ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {isWriting ? (
          <div className="space-y-4 relative animate-fade-in">
            <div className="flex justify-between items-center px-1">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>记录今夜漫游...</span>
              <button onClick={() => setIsWriting(false)} className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>取消</button>
            </div>
            <textarea
              className={`w-full p-4 rounded-2xl resize-none h-28 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-colors relative z-10 ${
                isDark ? 'bg-white/[0.03] border border-white/5 text-gray-200 placeholder-gray-500' : 'bg-white/60 backdrop-blur-md border border-white/50 text-gray-800 placeholder-gray-400 shadow-sm'
              }`}
              placeholder="你梦到了什么奇妙的场景？"
              maxLength={300}
              value={dreamInput}
              onChange={e => setDreamInput(e.target.value)}
            ></textarea>

            <button
              onClick={handleInterpret}
              disabled={!dreamInput.trim() || isInterpreting}
              className={`w-full py-3.5 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2 relative z-10 ${
                dreamInput.trim() && !isInterpreting
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white shadow-lg shadow-purple-500/25 active:scale-95'
                  : (isDark ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
              }`}
            >
              {isInterpreting ? (
                <><Loader2 size={16} className="animate-spin" /> 正在接收宇宙寄语...</>
              ) : (
                <><Sparkles size={16} /> 保存并接收宇宙寄语</>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[360px] overflow-y-auto no-scrollbar pr-1 animate-fade-in">
            {dreamLogs.length === 0 ? (
              <div className={`py-10 text-center text-xs flex flex-col items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <Cloud size={24} className="opacity-50" />
                宇宙舱空空如也，等待收集你的梦。
              </div>
            ) : (
              dreamLogs.map(log => {
                const isExpanded = expandedId === log.id;
                const isEditing = editingId === log.id;

                return (
                  <div
                    key={log.id}
                    onClick={() => !isEditing && setExpandedId(isExpanded ? null : log.id)}
                    className={`rounded-[20px] transition-all duration-300 border cursor-pointer group ${
                      isExpanded ? (isDark ? 'bg-[#1f1f2e] border-purple-500/30 shadow-lg shadow-purple-500/5' : 'bg-white border-purple-200 shadow-md')
                                 : (isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-purple-500/20' : 'bg-white/60 border-white/50 hover:bg-white hover:border-purple-100 shadow-sm')
                    } active:scale-[0.98]`}
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex flex-col gap-1 overflow-hidden pr-2">
                        <span className={`text-[10px] font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                          {log.date}
                        </span>
                        {!isExpanded && (
                          <span className={`text-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {log.dream}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button onClick={(e) => toggleFavorite(log.id, e)} className="p-1 hover:scale-110 transition-transform">
                          <Star size={16} className={`${log.isFavorite ? 'text-yellow-400 fill-yellow-400' : (isDark ? 'text-gray-600' : 'text-gray-300')} transition-colors`} />
                        </button>
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          <ChevronDown size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                        </div>
                      </div>
                    </div>

                    <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-4 pt-1 border-t border-white/5">
                          {isEditing ? (
                            <div className="space-y-3 mt-2" onClick={e => e.stopPropagation()}>
                              <textarea
                                className={`w-full p-3 rounded-xl resize-none h-24 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-colors ${
                                  isDark ? 'bg-black/20 border border-white/5 text-gray-200' : 'bg-gray-50 border border-gray-200 text-gray-800'
                                }`}
                                value={editInput}
                                onChange={e => setEditInput(e.target.value)}
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingId(null)} className={`text-xs px-3 py-1.5 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>取消</button>
                                <button onClick={() => saveEdit(log.id)} className="text-xs px-3 py-1.5 rounded-lg bg-purple-500 text-white shadow-sm">保存记录</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className={`p-3 rounded-xl ${isDark ? 'bg-black/20' : 'bg-gray-50/80'}`}>
                                <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{log.dream}</p>
                              </div>
                              <div className="relative p-4 rounded-xl border bg-gradient-to-br from-purple-500/10 to-indigo-500/5 shadow-inner">
                                <Sparkles size={14} className={`absolute top-3 right-3 ${isDark ? 'text-purple-400/50' : 'text-purple-400'}`} />
                                <p className={`text-[10px] mb-1.5 font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>宇宙的寄语</p>
                                <p className={`text-xs leading-relaxed ${isDark ? 'text-purple-100/90' : 'text-purple-900/90'}`}>
                                  {log.interpretation}
                                </p>
                              </div>

                              <div className="flex justify-end items-center gap-4 pt-2">
                                <button onClick={(e) => startEdit(log, e)} className={`flex items-center gap-1 text-[10px] hover:text-purple-400 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  <Edit3 size={12} /> 编辑
                                </button>
                                <button onClick={(e) => triggerDelete(log.id, e)} className={`flex items-center gap-1 text-[10px] hover:text-red-400 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  <Trash2 size={12} /> 消散
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {deleteConfirmId && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={cancelDelete}>
            <div className={`w-full max-w-xs p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative text-center`} onClick={e => e.stopPropagation()}>
              <div className="mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
                <AlertTriangle size={24} />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>确认消散</h3>
              <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                确定要执行消散操作吗？此操作不可撤销。
              </p>
              <div className="flex gap-3">
                <button onClick={cancelDelete} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-[#1f1f2e] hover:bg-[#262638] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                  取消
                </button>
                <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20 active:scale-95">
                  确认
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </section>
  );
}
