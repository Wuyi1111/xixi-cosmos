/**
 * App.jsx — 应用最外壳 + 全局 state。
 *
 * 这里只做三件事：
 *   1) 持有全部全局 state（userData / theme / activeTab）+ localStorage 读写 / 迁移
 *   2) 下拉刷新逻辑（仅刷新当前 tab）
 *   3) tab 路由切换（此刻 / 微澜 / 星系 / 我的）
 *
 * 改什么：
 *   - 改 userData 字段、加新字段、写迁移 → 这里 useState 初值 + 初始化 useEffect
 *   - 改打卡奖励规则（连签 bonus / 星尘换算）→ handleCheckIn()
 *   - 调整下拉刷新阻尼或阈值 → useEffect 内 onTouchMove / onTouchEnd
 *   - 加 / 改 / 删 tab 本身 → 同步改 main 里的条件渲染 + nav 里的 TabButton
 *   - 加全局装饰光晕（深色背景的紫色 blur）→ "fixed inset-0 pointer-events-none" 那块
 *
 * 不在这里改：
 *   - 单个 tab 的内容 → 去对应的 src/views/*.jsx
 *   - 主题颜色 / keyframes → src/index.css
 *   - 常量数据 → src/constants.js
 */

import { useState, useEffect, useRef } from 'react';
import { Moon, Wind, Sparkles, User, Loader2, ChevronUp, ChevronDown } from 'lucide-react';

import TabButton from './components/TabButton.jsx';
import TonightView from './views/TonightView.jsx';
import TreeholeView from './views/TreeholeView.jsx';
import GalaxyView from './views/GalaxyView.jsx';
import MineView from './views/MineView.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import { EMOTIONS } from './constants.js';

// --- 主应用组件：全局 state + pull-to-refresh + 路由壳 ---
export default function App() {
  const [activeTab, setActiveTab] = useState('tonight');
  const [theme, setTheme] = useState('light');

  const [userData, setUserData] = useState({
    id: 'TR755',                  // 固定编号，不可改
    displayName: '星星旅人',
    avatarEmoji: '🪐',
    fontScale: 1.0,
    totalDays: 0,
    continuousDays: 0,
    stardust: 0,
    totalHugs: 0,
    huggedWhispers: [],
    tomorrowDoneTotal: 0,                 // "明日"建议累计完成次数（永远 +）
    tomorrowDoneToday: { date: '', ids: [] }, // 今日已完成的建议 id 列表（次日自动重置）
    checkInHistory: [],
    dreamLogs: [],
    myWhispers: [],
    personality: null,
    dailyPosts: 0,
    lastPostDate: '',
    reminderEnabled: false,
    reminderTime: '22:30'
  });

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
  useEffect(() => {
    const saved = localStorage.getItem('xixi_cosmos_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.continuousDays === undefined) parsed.continuousDays = 0;
      if (!parsed.dreamLogs) parsed.dreamLogs = [];
      if (!parsed.myWhispers) parsed.myWhispers = [];
      parsed.id = 'TR755';
      if (!parsed.displayName) parsed.displayName = '星星旅人';
      if (!parsed.avatarEmoji) parsed.avatarEmoji = '🪐';
      if (typeof parsed.fontScale !== 'number') parsed.fontScale = 1.0;
      if (!Array.isArray(parsed.huggedWhispers)) parsed.huggedWhispers = [];
      if (typeof parsed.tomorrowDoneTotal !== 'number') parsed.tomorrowDoneTotal = 0;
      if (!parsed.tomorrowDoneToday || typeof parsed.tomorrowDoneToday !== 'object') {
        parsed.tomorrowDoneToday = { date: '', ids: [] };
      }
      setUserData(parsed);
    }
    const savedTheme = localStorage.getItem('xixi_cosmos_theme') || 'light';
    setTheme(savedTheme);
  }, []);

  // 全局字号缩放：写到 <html> font-size 上，所有 rem 跟着变
  // 基准 18.4px (= 16 * 1.15)
  useEffect(() => {
    const scale = userData.fontScale || 1.0;
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

  const isDark = theme === 'dark' || (theme === 'auto' && (new Date().getHours() >= 18 || new Date().getHours() < 6));

  // === 下拉刷新：仅刷新当前 tab 内容 ===
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const pullStartY = useRef(0);
  const pullActive = useRef(false);

  useEffect(() => {
    const onTouchStart = (e) => {
      // 若 touch 落在标了 data-no-pull-refresh 的元素里（光晕可拖区、全屏 widget），不触发
      if (e.target?.closest && e.target.closest('[data-no-pull-refresh]')) {
        pullActive.current = false;
        return;
      }
      if (window.scrollY <= 0 && !refreshing) {
        pullStartY.current = e.touches[0].clientY;
        pullActive.current = true;
      } else {
        pullActive.current = false;
      }
    };
    const onTouchMove = (e) => {
      if (!pullActive.current) return;
      const dy = e.touches[0].clientY - pullStartY.current;
      if (dy <= 0) { setPullDistance(0); return; }
      const distance = Math.min(Math.pow(dy, 0.85) * 0.7, 120);
      setPullDistance(distance);
    };
    const onTouchEnd = () => {
      if (!pullActive.current) return;
      pullActive.current = false;
      if (pullDistance > 60) {
        setRefreshing(true);
        setTimeout(() => {
          try {
            const saved = localStorage.getItem('xixi_cosmos_data');
            if (saved) {
              const parsed = JSON.parse(saved);
              parsed.id = 'TR755';
              if (!parsed.displayName) parsed.displayName = '星星旅人';
              if (!parsed.avatarEmoji) parsed.avatarEmoji = '🪐';
              if (typeof parsed.fontScale !== 'number') parsed.fontScale = 1.0;
              if (!Array.isArray(parsed.huggedWhispers)) parsed.huggedWhispers = [];
              if (typeof parsed.tomorrowDoneTotal !== 'number') parsed.tomorrowDoneTotal = 0;
              if (!parsed.tomorrowDoneToday || typeof parsed.tomorrowDoneToday !== 'object') {
                parsed.tomorrowDoneToday = { date: '', ids: [] };
              }
              setUserData(parsed);
            }
          } catch {}
          setRefreshKey(k => k + 1);
          setRefreshing(false);
          setPullDistance(0);
        }, 500);
      } else {
        setPullDistance(0);
      }
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [pullDistance, refreshing]);

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
        {/* 下拉刷新指示器 */}
        {(pullDistance > 0 || refreshing) && (
          <div
            className="fixed left-0 right-0 z-[60] flex items-center justify-center pointer-events-none"
            style={{
              top: 'env(safe-area-inset-top)',
              height: refreshing ? '60px' : `${pullDistance}px`,
              transition: pullActive.current ? 'none' : 'height 0.3s ease',
            }}
          >
            <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-indigo-300' : 'text-indigo-500'}`}>
            {refreshing ? (
              <><Loader2 size={16} className="animate-spin" /> 正在刷新…</>
            ) : pullDistance > 60 ? (
              <><ChevronUp size={16} /> 释放刷新</>
            ) : (
              <><ChevronDown size={16} /> 下拉刷新</>
            )}
          </div>
        </div>
      )}

      {/* 暗色模式下的全局装饰光晕 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {isDark && (
          <>
            <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-40 right-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
          </>
        )}
      </div>

      <main
        className="relative z-10 px-4 max-w-md mx-auto min-h-screen pt-[max(env(safe-area-inset-top),0.75rem)] pb-[calc(env(safe-area-inset-bottom)+6rem)]"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullActive.current ? 'none' : 'transform 0.3s ease',
        }}
      >
        {activeTab === 'tonight' && (
          <TonightView
            key={`tonight-${refreshKey}`}
            isDark={isDark}
            hasCheckedInToday={hasCheckedInToday}
            onCheckIn={handleCheckIn}
            userData={userData}
            saveUserData={saveUserData}
            currentDateStr={currentDateStr}
          />
        )}
        {activeTab === 'treehole' && (
          <TreeholeView
            key={`treehole-${refreshKey}`}
            isDark={isDark}
            userData={userData}
            saveUserData={saveUserData}
            currentDateStr={currentDateStr}
          />
        )}
        {activeTab === 'galaxy' && (
          <GalaxyView
            key={`galaxy-${refreshKey}`}
            isDark={isDark}
            userData={{...userData, displayContinuousDays}}
            saveUserData={saveUserData}
            currentDateStr={currentDateStr}
          />
        )}
        {activeTab === 'mine' && (
          <MineView
            key={`mine-${refreshKey}`}
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
          <TabButton id="tonight" icon={Moon} label="此刻" active={activeTab === 'tonight'} onClick={() => setActiveTab('tonight')} isDark={isDark} />
          <TabButton id="treehole" icon={Wind} label="微澜" active={activeTab === 'treehole'} onClick={() => setActiveTab('treehole')} isDark={isDark} />
          <TabButton id="galaxy" icon={Sparkles} label="星系" active={activeTab === 'galaxy'} onClick={() => setActiveTab('galaxy')} isDark={isDark} />
          <TabButton id="mine" icon={User} label="我的" active={activeTab === 'mine'} onClick={() => setActiveTab('mine')} isDark={isDark} />
        </div>
      </nav>
    </div>
    </>
  );
}
