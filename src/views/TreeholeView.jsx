/**
 * TreeholeView.jsx — "微澜"树洞，三栏 tab：星际回音 / 发射台 / 我的信号。
 *
 * 三个 mode：
 *   - 'browse' 星际回音：浏览 5 条示例心语，每张卡底部"送出温暖"心形按钮
 *   - 'emit'   发射台：选标签 + 写心语 + 选可见度 + 发射（每日上限 5 条）
 *   - 'mine'   我的信号：搜索 / 展开 / 收藏 / 删除自己发过的心语
 *
 * 改什么：
 *   - 改"星际回音"展示的 5 条示例 → src/constants.js 的 MOCK_WHISPERS
 *   - 改发射台的预设波段标签 → src/constants.js 的 PRESET_TAGS
 *   - 改每日发射上限（默认 5 次）→ 这里 postsLeft 那行的 5
 *   - 改"送出温暖"心形点亮 / 取消交互、粒子动效 → handleToggleHug
 *   - 改发射成功后的 toast 文案 → 文件底部 showToast 那块
 *   - 改"我的信号"的搜索 / 展开 / 删除交互 → mode === 'mine' 分支
 *
 * 注意：当前没有后端，"散落星海"和"深空折叠"两个可见度选项目前只是 UI 标签，
 *      心语全都只保存在本地。要做真"匿名公开"得自己加后端。
 */

import { useState, useEffect, useRef } from 'react';
import { Radio, Heart, Search, X, Star, ChevronDown, Trash2, Send, AlertTriangle } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import { MOCK_WHISPERS, PRESET_TAGS } from '../constants.js';

// --- 页面 2：微澜 (Treehole) ---
export default function TreeholeView({ isDark, userData, saveUserData, currentDateStr }) {
  const [mode, setMode] = useState('browse');
  const [whisperText, setWhisperText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [particles, setParticles] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWhisperId, setExpandedWhisperId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const textareaRef = useRef(null);

  const isNewDay = userData.lastPostDate !== currentDateStr;
  const postsToday = isNewDay ? 0 : (userData.dailyPosts || 0);
  const postsLeft = Math.max(0, 5 - postsToday);

  const myWhispers = userData.myWhispers || [];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [whisperText, mode]);

  const handleToggleHug = (whisperId, e) => {
    const huggedList = userData.huggedWhispers || [];
    const isHugged = huggedList.includes(whisperId);

    if (isHugged) {
      saveUserData({
        ...userData,
        totalHugs: Math.max(0, userData.totalHugs - 1),
        huggedWhispers: huggedList.filter(id => id !== whisperId),
      });
    } else {
      saveUserData({
        ...userData,
        totalHugs: userData.totalHugs + 1,
        huggedWhispers: [...huggedList, whisperId],
      });
      const rect = e.currentTarget.getBoundingClientRect();
      const newParticles = Array.from({ length: 5 }).map((_, i) => ({
        id: Date.now() + i,
        x: rect.left + rect.width / 2,
        y: rect.top,
        tx: (Math.random() - 0.5) * 100 + 'px'
      }));
      setParticles(prev => [...prev, ...newParticles]);
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 1000);
    }
  };

  const handleEmit = () => {
    if(!whisperText || postsLeft <= 0) return;

    const newWhisper = {
      id: Date.now(),
      date: currentDateStr,
      text: whisperText,
      emotion: selectedTag || '无名星尘',
      visibility,
      isFavorite: false
    };

    saveUserData({
      ...userData,
      dailyPosts: postsToday + 1,
      lastPostDate: currentDateStr,
      myWhispers: [newWhisper, ...myWhispers]
    });

    setWhisperText('');
    setSelectedTag('');
    setVisibility('public');
    setMode('mine');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const toggleFavoriteWhisper = (id, e) => {
    e.stopPropagation();
    const newList = myWhispers.map(log => log.id === id ? { ...log, isFavorite: !log.isFavorite } : log);
    saveUserData({ ...userData, myWhispers: newList });
  };

  const confirmDeleteWhisper = () => {
    saveUserData({ ...userData, myWhispers: myWhispers.filter(log => log.id !== deleteConfirmId) });
    setDeleteConfirmId(null);
  };

  const filteredWhispers = myWhispers.filter(w =>
    w.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.emotion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in pb-10">
      {/* 三栏式导航 */}
      <div className="flex justify-center mb-8">
        <div className={`flex p-1 rounded-full w-full max-w-[320px] ${isDark ? 'bg-[#171724]' : 'bg-gray-200/50'}`}>
          <button
            className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors ${mode === 'browse' ? (isDark ? 'bg-[#1f1f2e] text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') : 'text-gray-400'}`}
            onClick={() => setMode('browse')}
          >
            星际回音
          </button>
          <button
            className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors ${mode === 'emit' ? (isDark ? 'bg-[#1f1f2e] text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') : 'text-gray-400'}`}
            onClick={() => setMode('emit')}
          >
            发射台
          </button>
          <button
            className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors ${mode === 'mine' ? (isDark ? 'bg-[#1f1f2e] text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') : 'text-gray-400'}`}
            onClick={() => setMode('mine')}
          >
            我的信号
          </button>
        </div>
      </div>

      {/* 模式 1: 星际回音 */}
      {mode === 'browse' && (
        <div className="space-y-6">
          {MOCK_WHISPERS.map((whisper, i) => {
            const isHugged = (userData.huggedWhispers || []).includes(whisper.id);
            return (
              <div
                key={whisper.id}
                className={`p-6 rounded-[28px] ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#171724] border-white/5' : 'bg-gradient-to-br from-indigo-50/50 to-white border-indigo-50'} border shadow-sm relative overflow-hidden group hover:scale-[1.01] transition-all duration-500`}
                style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}
              >
                <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 ${whisper.isPositive ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}></div>
                <div className={`absolute -bottom-10 -left-4 w-16 h-16 rounded-full blur-2xl opacity-30 ${whisper.isPositive ? 'bg-pink-500/10' : 'bg-indigo-500/10'}`}></div>

                <div className="flex items-center gap-2 mb-5 relative z-10">
                  <span className={`text-[10px] px-2.5 py-1 rounded-md border ${isDark ? 'bg-white/[0.03] text-gray-300 border-white/10' : 'bg-white text-gray-600 border-gray-100'}`}>
                    {whisper.emotion}
                  </span>
                  <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Radio size={10} /> 未知坐标
                  </span>
                </div>

                <p className={`text-sm leading-relaxed mb-6 font-light relative z-10 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  "{whisper.text}"
                </p>

                <div className="flex justify-end relative z-10">
                  <button
                    onClick={(e) => handleToggleHug(whisper.id, e)}
                    aria-pressed={isHugged}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 active:scale-95 ${
                      isHugged
                        ? (isDark
                            ? 'bg-pink-500/25 text-pink-300 border border-pink-400/60 shadow-[0_0_20px_rgba(236,72,153,0.35)]'
                            : 'bg-pink-100 text-pink-600 border border-pink-300 shadow-[0_0_18px_rgba(236,72,153,0.25)]')
                        : (isDark
                            ? 'bg-white/5 hover:bg-white/10 text-pink-400 border border-white/5 hover:border-pink-500/30'
                            : 'bg-pink-50 hover:bg-pink-100 text-pink-500 border border-pink-100')
                    }`}
                  >
                    <Heart
                      size={16}
                      fill={isHugged ? 'currentColor' : 'none'}
                      strokeWidth={isHugged ? 2.5 : 2}
                      className={`transition-transform duration-300 ${isHugged ? 'scale-110' : 'scale-100'}`}
                    />
                    <span className="text-xs">{isHugged ? '已送出温暖' : '送出温暖'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 模式 2: 发射台 */}
      {mode === 'emit' && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-3">
            <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>为你的信号选择一个波段：</p>
            <div className="flex flex-wrap gap-2">
              {[...PRESET_TAGS.positive, ...PRESET_TAGS.neutral].slice(0, 5).map((tag, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setWhisperText(tag + '...');
                    setSelectedTag(tag);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedTag === tag
                    ? (isDark ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-indigo-100 border-indigo-300 text-indigo-700')
                    : (isDark ? 'border-gray-700 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-500 hover:border-gray-300')
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              className={`w-full p-5 rounded-[28px] resize-none min-h-[160px] text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-colors ${
                isDark ? 'bg-[#171724] text-gray-200 placeholder-gray-600' : 'bg-white shadow-sm text-gray-800 placeholder-gray-400'
              }`}
              placeholder="宇宙无边无际，你的心声在这里不再受限。倾诉吧..."
              value={whisperText}
              onChange={e => setWhisperText(e.target.value)}
            ></textarea>
          </div>

          <div className="flex justify-between items-center px-2">
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>信号可见度：</span>
            <div className={`flex p-1 rounded-full ${isDark ? 'bg-[#171724]' : 'bg-gray-100'}`}>
              <button
                onClick={() => setVisibility('public')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors ${visibility === 'public' ? (isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white text-indigo-600 shadow-sm') : 'text-gray-400 hover:text-gray-300'}`}
              >
                散落星海 (公开)
              </button>
              <button
                onClick={() => setVisibility('private')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors ${visibility === 'private' ? (isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white text-indigo-600 shadow-sm') : 'text-gray-400 hover:text-gray-300'}`}
              >
                深空折叠 (仅自己)
              </button>
            </div>
          </div>

          <button
            onClick={handleEmit}
            disabled={!whisperText || postsLeft <= 0}
            className={`w-full py-4 rounded-2xl font-medium tracking-wider transition-all flex items-center justify-center gap-2 ${
              whisperText && postsLeft > 0
                ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-95'
                : (isDark ? 'bg-[#1f1f2e] text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
            }`}
          >
            <Send size={18} />
            {postsLeft > 0 ? '向深空发射' : '今日星际能量已耗尽'}
          </button>
          <p className="text-center text-[10px] text-gray-500">今日还可发射 {postsLeft} 次信号</p>
        </div>
      )}

      {/* 模式 3: 我的信号 */}
      {mode === 'mine' && (
        <div className="space-y-4 animate-fade-in flex flex-col h-full">
          <div className={`flex items-center px-4 py-3 rounded-2xl ${isDark ? 'bg-[#171724]' : 'bg-white shadow-sm'}`}>
            <Search size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
            <input
              type="text"
              placeholder="搜索我的心语轨迹..."
              className={`flex-1 ml-3 bg-transparent text-sm outline-none ${isDark ? 'text-gray-200 placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'}`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="max-h-[500px] overflow-y-auto no-scrollbar space-y-3 pb-6 pt-2">
            {filteredWhispers.length === 0 ? (
              <div className={`py-12 text-center text-xs flex flex-col items-center gap-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                <Radio size={32} className="opacity-40" />
                {searchQuery ? '在广袤宇宙中未寻得该信号' : '暂未发射过任何信号'}
              </div>
            ) : (
              filteredWhispers.map(whisper => {
                const isExpanded = expandedWhisperId === whisper.id;

                return (
                  <div
                    key={whisper.id}
                    onClick={() => setExpandedWhisperId(isExpanded ? null : whisper.id)}
                    className={`rounded-[24px] transition-all duration-300 border cursor-pointer ${
                      isExpanded ? (isDark ? 'bg-[#1f1f2e] border-indigo-500/30 shadow-lg shadow-indigo-500/5' : 'bg-white border-indigo-200 shadow-md')
                                 : (isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]' : 'bg-white/60 border-white/50 hover:bg-white shadow-sm')
                    } active:scale-[0.98]`}
                  >
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex flex-col gap-1.5 overflow-hidden pr-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-sm ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            {whisper.emotion}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border ${whisper.visibility === 'private' ? (isDark ? 'bg-gray-800/50 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200') : (isDark ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-500 border-indigo-100')}`}>
                            {whisper.visibility === 'private' ? '深空折叠' : '散落星海'}
                          </span>
                          <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{whisper.date}</span>
                        </div>
                        {!isExpanded && (
                          <span className={`text-sm truncate font-light ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {whisper.text}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button onClick={(e) => toggleFavoriteWhisper(whisper.id, e)} className="p-1 hover:scale-110 transition-transform">
                          <Star size={16} className={`${whisper.isFavorite ? 'text-yellow-400 fill-yellow-400' : (isDark ? 'text-gray-600' : 'text-gray-300')} transition-colors`} />
                        </button>
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          <ChevronDown size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                        </div>
                      </div>
                    </div>

                    <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="px-5 pb-5 space-y-4 pt-1 border-t border-white/5">
                          <div className={`p-4 rounded-xl ${isDark ? 'bg-black/20' : 'bg-gray-50/80'}`}>
                            <p className={`text-sm font-light leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                              {whisper.text}
                            </p>
                          </div>

                          <div className="flex justify-end items-center gap-4 pt-2">
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(whisper.id); }} className={`flex items-center gap-1 text-[10px] hover:text-red-400 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              <Trash2 size={12} /> 消散
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 粒子效果渲染 */}
      {particles.map(p => (
        <div key={p.id} className="particle text-pink-500 z-50 flex items-center justify-center" style={{ left: p.x - 10, top: p.y - 10, '--tx': p.tx }}>
          <Heart size={20} fill="currentColor" />
        </div>
      ))}

      {/* 顶部发射成功提示 */}
      {showToast && (
        <Portal>
          <div className="fixed left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-indigo-500 text-white text-sm shadow-lg shadow-indigo-500/20 animate-fade-in z-50 flex items-center gap-2 top-[max(env(safe-area-inset-top)+1rem,5rem)]">
            <Send size={14} /> 信号已封存进我的信号
          </div>
        </Portal>
      )}

      {/* 心语消散确认弹窗 */}
      {deleteConfirmId && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setDeleteConfirmId(null)}>
            <div className={`w-full max-w-xs p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative text-center`} onClick={e => e.stopPropagation()}>
              <div className="mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
                <AlertTriangle size={24} />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>确认消散</h3>
              <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                确定要让这段信号消散在宇宙中吗？此操作不可撤销。
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-[#1f1f2e] hover:bg-[#262638] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                  保留
                </button>
                <button onClick={confirmDeleteWhisper} className="flex-1 py-3 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20 active:scale-95">
                  消散
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
