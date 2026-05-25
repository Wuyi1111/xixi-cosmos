/**
 * App.jsx — 应用最外壳 + 全局 state。
 *
 * 这里只做三件事：
 *   1) 持有全部全局 state（userData / theme / activeTab）+ localStorage 读写 / 迁移
 *   2) 下拉刷新逻辑（仅刷新当前 tab）
 *   3) tab 路由切换（此刻 / 雷达 / 心愿池 / 我的）
 *
 * 改什么：
 *   - 改 userData 字段、加新字段、写迁移 → 这里 useState 初值 + 初始化 useEffect
 *   - 改打卡奖励规则（连签 bonus / 星尘换算）→ handleCheckIn() / handleInteractionCheckIn()
 *   - 调整下拉刷新阻尼或阈值 → useEffect 内 onTouchMove / onTouchEnd
 *   - 加 / 改 / 删 tab 本身 → 同步改 main 里的条件渲染 + nav 里的 TabButton
 *   - 加全局装饰光晕（深色背景的紫色 blur）→ "fixed inset-0 pointer-events-none" 那块
 *
 * 不在这里改：
 *   - 单个 tab 的内容 → 去对应的 src/views/*.jsx
 *   - 主题颜色 / keyframes → src/index.css
 *   - 常量数据 → src/constants.js
 */

import { useState, useEffect } from 'react';
import { Home, Radar, Sparkles, Moon } from 'lucide-react';

import TabButton from './components/TabButton.jsx';
import TonightView from './views/TonightView.jsx';
import TreeholeView from './views/TreeholeView.jsx';
import GalaxyView from './views/GalaxyView.jsx';
import StarView from './views/StarView.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import StarField from './components/StarField.jsx';
import { EMOTIONS, INITIAL_USER_DATA } from './constants.js';

// --- 主应用组件：全局 state + pull-to-refresh + 路由壳 ---
export default function App() {
  const [activeTab, setActiveTab] = useState('tonight');
  const [theme, setTheme] = useState('light');

  // userData 形态来自 constants.js 的 INITIAL_USER_DATA（单一来源）
  const [userData, setUserData] = useState(INITIAL_USER_DATA);

  const [currentDateStr, setCurrentDateStr] = useState(new Date().toDateString());

  // 启动页状态：每次打开都显示
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().toDateString();
      if (now !== currentDateStr) setCurrentDateStr(now);
    }, 60000);
    return () => clearInterval(timer);
  }, [currentDateStr]);

  // 初始化加载数据 + 字段迁移
  // 策略：先把 parsed 与 INITIAL_USER_DATA 浅合并补齐缺失字段，再针对类型敏感字段做防御
  useEffect(() => {
    try {
      const saved = localStorage.getItem('xixi_cosmos_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = { ...INITIAL_USER_DATA, ...parsed, id: 'TR755' };
        // 类型/形态敏感字段防御（防止旧版数据里残留 null / 错误类型）
        if (typeof merged.fontScale !== 'number') merged.fontScale = INITIAL_USER_DATA.fontScale;
        if (typeof merged.tomorrowDoneTotal !== 'number') merged.tomorrowDoneTotal = 0;
        if (!merged.tomorrowDoneToday || typeof merged.tomorrowDoneToday !== 'object') {
          merged.tomorrowDoneToday = { date: '', ids: [] };
        }
        for (const key of ['huggedWhispers', 'checkInHistory', 'dreamLogs', 'myWhispers',
                            'interactionHistory', 'followedSuggestions', 'userChallenges',
                            'myTomorrowTasks', 'taskFootprints']) {
          if (!Array.isArray(merged[key])) merged[key] = [];
        }
        setUserData(merged);
      }
    } catch {
      // localStorage 中的 JSON 损坏，清除并使用初始 state，避免白屏
      localStorage.removeItem('xixi_cosmos_data');
    }
    const savedTheme = localStorage.getItem('xixi_cosmos_theme') || 'light';
    setTheme(savedTheme);
  }, []);

  // 全局字号缩放：写到 <html> font-size 上，所有 rem 跟着变
  // 基准 18.4px (= 16 * 1.15)
  useEffect(() => {
    const scale = userData.fontScale ?? 0.85;
    document.documentElement.style.fontSize = (18.4 * scale) + 'px';
  }, [userData.fontScale]);

  // 主题切换
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    let activeTheme = theme;
    if (theme === 'auto') {
      const hour = new Date().getHours();
      activeTheme = (hour >= 18 || hour < 6) ? 'dark' : 'light';
    }
    root.classList.add(activeTheme);
    localStorage.setItem('xixi_cosmos_theme', theme);
  }, [theme]);

  const saveUserData = (newData) => {
    setUserData(newData);
    localStorage.setItem('xixi_cosmos_data', JSON.stringify(newData));
  };

  const lastCheckInDate = userData.checkInHistory[0]?.date;
  const hasCheckedInToday = lastCheckInDate === currentDateStr;

  let displayContinuousDays = userData.continuousDays;
  if (!hasCheckedInToday && userData.checkInHistory.length > 0) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastCheckInDate !== yesterday.toDateString()) {
      displayContinuousDays = 0;
    }
  }

  const handleCheckIn = (moodId, whisper, isReset = false) => {
    if (isReset) {
      // 重置今天的打卡记录
      const [todayRecord, ...restHistory] = userData.checkInHistory;
      if (todayRecord && todayRecord.date === currentDateStr) {
        // 撤销今天的星尘和连续天数（如果需要）
        // 这里我们简单移除今天的记录，连续天数保持不变（因为用户还没真正度过新的一天）
        saveUserData({
          ...userData,
          checkInHistory: restHistory
        });
      }
      return;
    }

    if (hasCheckedInToday) return;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isConsecutive = lastCheckInDate === yesterday.toDateString();
    const newContinuousDays = isConsecutive ? userData.continuousDays + 1 : 1;

    const streakBonus = isConsecutive ? Math.min((newContinuousDays - 1) * 2, 10) : 0;
    const earned = 10 + streakBonus;

    const emotion = EMOTIONS.find(e => e.id === moodId);

    const hours = today.getHours().toString().padStart(2, '0');
    const minutes = today.getMinutes().toString().padStart(2, '0');

    const newEntry = {
      id: Date.now(),
      date: currentDateStr,
      timeStr: `${hours}:${minutes}`,
      timestamp: Date.now(),
      moodId,
      moodName: emotion.name,
      whisper,
      stardustEarned: earned,
      isFirstCheckIn: userData.checkInHistory.length === 0
    };

    saveUserData({
      ...userData,
      totalDays: userData.totalDays + 1,
      continuousDays: newContinuousDays,
      stardust: userData.stardust + earned,
      checkInHistory: [newEntry, ...userData.checkInHistory]
    });
    // 不再强制 setTheme('dark')，保留用户在设置里的主题偏好
  };

  // === 新打卡逻辑：用户点击「送出温暖」或「跟随」时触发打卡 ===
  //
  // ⚠️ 第三个参数 extraPatch 是 caller 的"附带更新"（送温暖时是 huggedWhispers+totalHugs，
  //    跟随时是 followedSuggestions+totalFollows+myTomorrowTasks）。
  //    必须由本函数统一合并到 nextUserData 后做一次 saveUserData，
  //    否则 caller 自己 saveUserData + 本函数 saveUserData 会用各自的旧闭包覆盖对方。
  const handleInteractionCheckIn = (type, targetId, extraPatch = {}) => {
    // type: 'hug' | 'follow'
    // targetId: 被互动对象的标识
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isFirstInteractionToday = userData.lastInteractionDate !== currentDateStr;

    // 记录互动行为
    const newInteraction = {
      id: Date.now(),
      type,
      targetId,
      date: currentDateStr,
      timestamp: Date.now(),
    };

    let nextUserData = {
      ...userData,
      ...extraPatch,  // caller 的附带更新先 merge，避免被 interactionHistory 覆盖
      interactionHistory: [newInteraction, ...(userData.interactionHistory || [])],
      lastInteractionDate: currentDateStr,
    };

    // 24小时内首次点击记为当天打卡，给予星尘
    if (isFirstInteractionToday) {
      const lastCheckIn = userData.checkInHistory[0]?.date;
      const isConsecutive = lastCheckIn === yesterday.toDateString();
      const newContinuousDays = isConsecutive ? userData.continuousDays + 1 : 1;
      const streakBonus = isConsecutive ? Math.min((newContinuousDays - 1) * 2, 10) : 0;
      const earned = 10 + streakBonus;

      const hours = today.getHours().toString().padStart(2, '0');
      const minutes = today.getMinutes().toString().padStart(2, '0');

      const newEntry = {
        id: Date.now(),
        date: currentDateStr,
        timeStr: `${hours}:${minutes}`,
        timestamp: Date.now(),
        moodId: 'interaction',
        moodName: type === 'hug' ? '送出温暖' : '跟随',
        whisper: `通过「${type === 'hug' ? '送出温暖' : '跟随'}」完成今日打卡`,
        stardustEarned: earned,
        isFirstCheckIn: userData.checkInHistory.length === 0,
        triggeredBy: type,
        targetId,
      };

      nextUserData = {
        ...nextUserData,
        totalDays: userData.totalDays + 1,
        continuousDays: newContinuousDays,
        stardust: userData.stardust + earned,
        checkInHistory: [newEntry, ...userData.checkInHistory],
      };
    }

    saveUserData(nextUserData);
  };

  const isDark = theme === 'dark' || (theme === 'auto' && (new Date().getHours() >= 18 || new Date().getHours() < 6));



  return (
    <>
      {/* 启动页 */}
      {showSplash && (
        <SplashScreen
          isDark={isDark}
          onComplete={handleSplashComplete}
        />
      )}

      <div className={`min-h-screen transition-colors duration-1000 ${isDark ? 'dark bg-[#0f0f1a] text-[#f1f5f9]' : 'bg-[#f8fafc] text-[#1e293b]'}`}>

      {/* 暗色模式下的全局装饰光晕 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {isDark && (
          <>
            <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-40 right-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
          </>
        )}
      </div>

      {/* 星空背景 */}
      <StarField isDark={isDark} />

      <main
        className="relative z-10 px-4 max-w-md mx-auto min-h-screen pt-[max(env(safe-area-inset-top),0.75rem)] pb-[calc(env(safe-area-inset-bottom)+6rem)]"
      >
        {activeTab === 'tonight' && (
          <TonightView
            isDark={isDark}
            userData={userData}
            saveUserData={saveUserData}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'radar' && (
          <TreeholeView
            isDark={isDark}
            userData={userData}
            saveUserData={saveUserData}
            currentDateStr={currentDateStr}
            onGiveHug={(whisperId, patch) => handleInteractionCheckIn('hug', whisperId, patch)}
            onFollow={(suggestionId, patch) => handleInteractionCheckIn('follow', suggestionId, patch)}
          />
        )}

        {activeTab === 'galaxy' && (
          <GalaxyView
            isDark={isDark}
            userData={userData}
          />
        )}
        {activeTab === 'star' && (
          <StarView
            isDark={isDark}
            theme={theme}
            setTheme={setTheme}
            userData={userData}
            saveUserData={saveUserData}
            setUserData={(d) => {
              setUserData(d);
              localStorage.removeItem('xixi_cosmos_data');
            }}
          />
        )}
      </main>

      <nav className={`fixed bottom-0 w-full z-50 transition-colors duration-500 ${isDark ? 'bg-[#13131a]/90 border-[#2a2a35]' : 'bg-white/90 border-gray-200'} backdrop-blur-md border-t pb-[env(safe-area-inset-bottom)]`}>
        <div className="max-w-md mx-auto flex justify-around items-center h-20 px-4">
          <TabButton id="tonight" icon={Home} label="此刻" active={activeTab === 'tonight'} onClick={() => setActiveTab('tonight')} isDark={isDark} />
          <TabButton id="radar" icon={Radar} label="雷达" active={activeTab === 'radar'} onClick={() => setActiveTab('radar')} isDark={isDark} />
          <TabButton id="galaxy" icon={Sparkles} label="星系" active={activeTab === 'galaxy'} onClick={() => setActiveTab('galaxy')} isDark={isDark} />
          <TabButton id="star" icon={Moon} label="归星" active={activeTab === 'star'} onClick={() => setActiveTab('star')} isDark={isDark} />
        </div>
      </nav>
    </div>
    </>
  );
}
