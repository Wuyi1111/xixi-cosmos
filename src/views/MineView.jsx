/**
 * MineView.jsx — "我的"页面（个人主页）。
 *
 * 屏幕从上到下：
 *   1) 头像区（emoji + 用户名 + #ID + 当前称号 + 性格）+ 右上角设置齿轮
 *   2) 性格测试入口（已测过显示卡片，未测显示 +30 星尘的引导）
 *   3) 三宫格统计：累计夜晚 / 星尘 / 传递温暖
 *   4) 称号徽章网格（6 个，按 totalHugs 渐进解锁）
 *
 * 改什么：
 *   - **改头像编辑弹窗的样式 / 字段 → 这里 showProfileEdit 那块**
 *   - 改可选头像 emoji 列表（默认 22 个星体）→ src/constants.js 的 AVATAR_EMOJIS
 *   - 改用户名最大长度（默认 20）→ 这里 saveProfile 的 slice(0, 20) + input maxLength
 *   - 改徽章解锁门槛 / 名字 / 图标 → src/constants.js 的 TITLES
 *   - 改首次性格测试的奖励星尘（默认 30）→ 这里 onComplete 处的 30
 *   - 改人格描述本身 → src/constants.js 的 COSMIC_PERSONALITIES
 *
 * 注意：#TR755 是固定 ID，所有用户都看到这个编号，UI 上有"不可修改"标签。
 *      想改这个 ID 默认值，去 src/App.jsx 的 userData 初值 + 初始化迁移。
 */

import { useState } from 'react';
import { Settings, Edit3, X, Compass, Sparkles, ChevronRight } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import QuizWidget from '../widgets/QuizWidget.jsx';
import SettingsPanel from './SettingsPanel.jsx';
import { TITLES, AVATAR_EMOJIS } from '../constants.js';

// --- 页面 4：我的 (Mine) ---
export default function MineView({ isDark, theme, setTheme, userData, setUserData, saveUserData }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [nameDraft, setNameDraft] = useState(userData.displayName || '星海旅人');
  const [emojiDraft, setEmojiDraft] = useState(userData.avatarEmoji || '🪐');

  const unlockedTitles = TITLES.filter(t => userData.totalHugs >= t.count);
  const highestTitle = unlockedTitles.length > 0 ? unlockedTitles[unlockedTitles.length - 1].title : '星辰初学者';

  const personalityData = typeof userData.personality === 'object' ? userData.personality : null;
  const displayPersonalityName = personalityData?.name || (typeof userData.personality === 'string' ? userData.personality : '尚未探测内宇宙');

  const openProfileEdit = () => {
    setNameDraft(userData.displayName || '星海旅人');
    setEmojiDraft(userData.avatarEmoji || '🪐');
    setShowProfileEdit(true);
  };
  const saveProfile = () => {
    const trimmed = (nameDraft || '').trim().slice(0, 20) || '星海旅人';
    saveUserData({ ...userData, displayName: trimmed, avatarEmoji: emojiDraft });
    setShowProfileEdit(false);
  };

  if (showSettings) {
    return <SettingsPanel isDark={isDark} theme={theme} setTheme={setTheme} userData={userData} saveUserData={saveUserData} onClose={() => setShowSettings(false)} onReset={() => {
      setUserData({
        id: 'TR755',
        displayName: '星海旅人',
        avatarEmoji: '🪐',
        fontScale: 1.0,
        totalDays: 0, continuousDays: 0, stardust: 0, totalHugs: 0, huggedWhispers: [], checkInHistory: [], dreamLogs: [], myWhispers: [], personality: null, dailyPosts: 0, lastPostDate: '', reminderEnabled: false, reminderTime: '22:30'
      });
      setShowSettings(false);
    }}/>;
  }

  if (showQuiz) {
    return <QuizWidget isDark={isDark} onClose={() => setShowQuiz(false)} onComplete={(resultObj) => {
      const earnedStardust = userData.personality ? 0 : 30;
      saveUserData({ ...userData, personality: resultObj, stardust: userData.stardust + earnedStardust });
      setShowQuiz(false);
    }}/>;
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <button onClick={openProfileEdit} className="flex items-center gap-4 text-left active:scale-[0.98] transition-transform">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${isDark ? 'bg-[#171724]' : 'bg-white shadow-sm'} border border-indigo-500/20 relative overflow-hidden`}>
            {personalityData ? <div className="absolute inset-0 bg-indigo-500/20 blur-md animate-pulse"></div> : null}
            <span className="relative z-10">{userData.avatarEmoji || '🪐'}</span>
          </div>
          <div>
            <h2 className="text-lg font-medium mb-1 flex items-center gap-1.5">
              {userData.displayName || '星海旅人'}
              <span className={`text-xs font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>#{userData.id}</span>
              <Edit3 size={12} className="text-gray-400" />
            </h2>
            <p className={`text-xs ${isDark ? 'text-indigo-400' : 'text-indigo-600'} font-medium`}>
              {highestTitle} · {displayPersonalityName}
            </p>
          </div>
        </button>
        <button onClick={() => setShowSettings(true)} className={`p-2 rounded-full ${isDark ? 'bg-[#171724] text-gray-400' : 'bg-white text-gray-500 shadow-sm'}`}>
          <Settings size={20} />
        </button>
      </div>

      {/* 编辑个人资料弹窗 */}
      {showProfileEdit && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowProfileEdit(false)}>
            <div className={`w-full max-w-sm p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative`} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowProfileEdit(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200"><X size={20} /></button>
              <h3 className="text-lg font-medium mb-5 text-center">编辑资料</h3>

              <div className="flex flex-col items-center gap-2 mb-5">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-5xl ${isDark ? 'bg-[#0f0f1a] border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-100'}`}>
                  {emojiDraft}
                </div>
                <p className="text-base font-medium">{(nameDraft || '').trim() || '星海旅人'} <span className={`text-xs ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>#{userData.id}</span></p>
              </div>

              <div className="mb-4">
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择星体头像</p>
                <div className={`grid grid-cols-6 gap-2 p-3 rounded-2xl max-h-44 overflow-y-auto no-scrollbar ${isDark ? 'bg-[#0f0f1a]' : 'bg-gray-50'}`}>
                  {AVATAR_EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => setEmojiDraft(e)}
                      className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${
                        emojiDraft === e
                          ? (isDark ? 'bg-indigo-500/30 ring-2 ring-indigo-400' : 'bg-indigo-100 ring-2 ring-indigo-400')
                          : (isDark ? 'hover:bg-white/5' : 'hover:bg-white')
                      }`}
                    >{e}</button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>名字</p>
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={20}
                  placeholder="星海旅人"
                  className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors ${
                    isDark
                      ? 'bg-[#0f0f1a] border border-gray-800 focus:border-indigo-500 text-gray-200 placeholder-gray-600'
                      : 'bg-gray-50 border border-gray-200 focus:border-indigo-400 text-gray-800 placeholder-gray-400'
                  }`}
                />
                <p className={`text-[11px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>最多 20 个字符</p>
              </div>

              <div className={`mb-5 px-4 py-3 rounded-xl flex items-center justify-between ${isDark ? 'bg-[#0f0f1a] border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>星际编号（固定）</p>
                  <p className="text-sm font-mono mt-0.5">#{userData.id}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-md ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>不可修改</span>
              </div>

              <button
                onClick={saveProfile}
                className="w-full py-3 rounded-xl text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                保存
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* 睡眠性格测试区 */}
      {!personalityData ? (
        <div
          onClick={() => setShowQuiz(true)}
          className={`p-5 rounded-[28px] cursor-pointer border transition-all hover:scale-[1.02] active:scale-95 ${
            isDark ? 'bg-gradient-to-r from-[#1f1f2e] to-[#171724] border-indigo-500/20' : 'bg-gradient-to-r from-indigo-50 to-white border-indigo-100 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-sm mb-1 flex items-center gap-2">
                <Compass size={16} className="text-indigo-500" />
                探索内宇宙特质
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>完成 10 题睡眠测试，解锁你的专属星体身份</p>
            </div>
            <div className="px-3 py-1 bg-indigo-500 text-white text-[10px] rounded-full whitespace-nowrap shadow-md shadow-indigo-500/30">
              +30 星尘
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setShowQuiz(true)}
          className={`p-6 rounded-[28px] cursor-pointer border transition-all hover:scale-[1.01] active:scale-95 relative overflow-hidden ${
            isDark ? 'bg-[#1f1f2e] border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]' : 'bg-indigo-50 border-indigo-200 shadow-sm'
          }`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className={`text-[10px] mb-1 font-medium tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>你的宇宙睡眠人格</p>
              <h3 className="text-xl font-medium tracking-wide flex items-center gap-2">
                {personalityData.name}
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500 border border-gray-200'}`}>
                  {personalityData.type}
                </span>
              </h3>
            </div>
            <Sparkles size={20} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
          </div>

          <div className="flex flex-wrap gap-2 mb-4 relative z-10">
            {personalityData.tags.map((tag, idx) => (
              <span key={idx} className={`text-[10px] px-2.5 py-1 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-200' : 'bg-indigo-100/80 text-indigo-700'}`}>
                {tag}
              </span>
            ))}
          </div>

          <p className={`text-xs leading-relaxed font-light relative z-10 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            "{personalityData.desc}"
          </p>

          <p className={`text-[9px] mt-4 text-right opacity-60 flex items-center justify-end gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            点击可重新探测 <ChevronRight size={10} />
          </p>
        </div>
      )}

      <div className={`p-6 rounded-[28px] grid grid-cols-3 gap-4 text-center ${isDark ? 'bg-[#171724]' : 'bg-white shadow-sm'}`}>
        <div>
          <p className="text-xl font-medium mb-1">{userData.totalDays}</p>
          <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>累计夜晚</p>
        </div>
        <div className={`border-x ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <p className="text-xl font-medium mb-1 text-indigo-400">{userData.stardust}</p>
          <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>星尘</p>
        </div>
        <div>
          <p className="text-xl font-medium mb-1 text-pink-400">{userData.totalHugs}</p>
          <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>传递温暖</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-medium">称号徽章</h3>
          <span className="text-[10px] text-gray-500">{unlockedTitles.length}/{TITLES.length}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TITLES.map((title) => {
            const isUnlocked = userData.totalHugs >= title.count;
            return (
              <div
                key={title.id}
                className={`p-4 rounded-2xl flex flex-col items-center gap-2 border ${
                  isUnlocked
                    ? (isDark ? 'bg-indigo-900/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100')
                    : (isDark ? 'bg-[#1f1f2e] border-transparent opacity-50 grayscale' : 'bg-gray-50 border-transparent opacity-60 grayscale')
                }`}
              >
                <span className="text-4xl">{title.icon}</span>
                <span className="text-xs font-medium">{title.title}</span>
                <span className="text-[9px] text-gray-500">送出 {title.count} 次温暖解锁</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
