import React, { useState, useEffect, useRef } from 'react';
// 请在顶部的 import 列表中增加 Bug, RotateCcw, Zap, Beaker 图标
import { Moon, Wind, Music, Sparkles, Send, Heart, Settings, User, Compass, CheckCircle2, X, ChevronRight, Info, Cloud, AlertTriangle, ChevronDown, Calendar, Loader2, Star, Trash2, Edit3, ChevronUp, Plus, Search, Radio, ChevronLeft, Bug, RotateCcw, Zap, Beaker } from 'lucide-react';

// --- 全局常量及模拟数据 ---

const EMOTIONS = [
  { id: 'warm', name: '余温', symbol: '◐', color: '#FFB347', texts: ['今天尚有余温，请好好珍藏。', '带着这份温暖的记忆入睡吧。', '世界偶尔温柔，今天你也是。'] },
  { id: 'calm', name: '静谧', symbol: '◯', color: '#87CEEB', texts: ['安静的夜晚，适合倾听自己的心跳。', '让一切归于平静，晚安。', '这一刻，世界只属于你。'] },
  { id: 'unclear', name: '星尘', symbol: '◌', color: '#E6E6FA', texts: ['说不清也没关系，宇宙包容一切。', '纷乱的思绪，就化作星尘吧。', '有些情绪，不需要急着去定义。'] },
  { id: 'joyful', name: '欢愉', symbol: '◠', color: '#FFD700', texts: ['真开心你度过了美好的一天。', '将这份喜悦打包，送进梦乡。', '你的快乐，让星空也变得明亮。'] },
  { id: 'anxious', name: '忐忑', symbol: '◡', color: '#FFA07A', texts: ['深呼吸，不用害怕，我们都在这里。', '不安是暂时的，夜晚会抚平它。', '哪怕在黑夜里，也有微光指引。'] },
  { id: 'tired', name: '疲惫', symbol: '◔', color: '#B0C4DE', texts: ['辛苦了，今天你已经做得很好了。', '卸下疲惫，安心睡个好觉吧。', '闭上眼睛，让一切重新充电。'] }
];

const PRESET_TAGS = {
  positive: ['今天有一件小事让我开心', '我想感谢', '今天我被治愈了', '我想记住今天的感觉'],
  neutral: ['其实我有点累了', '最近有件事一直压在心上', '有时候觉得挺孤独的']
};

const MOCK_WHISPERS = [
  { id: 1, text: '今天下班路上看到了一场很美的晚霞，想分享给不知道在哪里的你。', emotion: '小确幸', isPositive: true },
  { id: 2, text: '面试又失败了，感觉自己好没用。但是今晚的星星很亮。', emotion: '失落', isPositive: false },
  { id: 3, text: '买到了最后一块草莓蛋糕，开心！', emotion: '治愈', isPositive: true },
  { id: 4, text: '突然觉得，平平淡淡的日子才是最难得的。', emotion: '平静', isPositive: true },
  { id: 5, text: '想家了，不敢给爸妈打电话怕哭出来。', emotion: '孤独', isPositive: false }
];

// 16种宇宙睡眠人格图谱
const COSMIC_PERSONALITIES = {
  'ISTJ': { name: '恒定白矮星', tags: ['极其自律', '深度休眠', '无梦之境'], desc: '你的睡眠如同白矮星般稳定且致密。作息规律，雷打不动，外界的喧嚣很难干扰你纯粹的休息。' },
  'ISFJ': { name: '温柔引力波', tags: ['准时安静', '感性梦境', '守护者'], desc: '你习惯在安静中规律入睡，但潜意识里充满了温柔的涟漪，常在梦中重温现实中的感动与羁绊。' },
  'INFJ': { name: '深空观测者', tags: ['规律作息', '清醒梦境', '直觉敏锐'], desc: '你在规律的表象下，拥有极其活跃的潜意识。即使在浅睡的轨道上，你也在梦境中默默观测着宇宙的奥秘。' },
  'INTJ': { name: '秩序脉冲星', tags: ['精准自律', '高频浅睡', '理性大脑'], desc: '你的睡眠犹如脉冲星般精准。哪怕睡眠较浅，大脑也能在短暂的休眠中高效整理碎片信息，保持绝对理性。' },
  'ISTP': { name: '独行小行星', tags: ['随性而息', '深度沉浸', '不拘一格'], desc: '你不受固定轨道的束缚，困了就睡，一旦入睡便如同漂浮在深空的小行星，彻底切断与外界的联系。' },
  'ISFP': { name: '梦幻星云', tags: ['随性静默', '色彩斑斓', '感性漫游'], desc: '你的睡前时光宁静而随性，入睡后则化身为绚丽的星云，梦境中交织着极其丰富和浪漫的情感色彩。' },
  'INFP': { name: '浪漫流星雨', tags: ['熬夜修仙', '浅睡多梦', '天马行空'], desc: '你的作息像流星般难以捉摸。夜晚是你灵感迸发的主场，梦境更是你天马行空、构建奇幻平行宇宙的乐园。' },
  'INTP': { name: '游离暗物质', tags: ['随性潜行', '无梦观测', '思绪游离'], desc: '你像暗物质一样难以被规律捕捉。睡前习惯深度思考，哪怕处于浅睡边缘，你的大脑也在默默推演宇宙的真理。' },
  'ESTP': { name: '活跃超新星', tags: ['冲浪达人', '倒头就睡', '现实主义'], desc: '睡前你是活跃的星际冲浪者，但只要决定休息，就能像超新星爆发后一样瞬间切断电源，陷入无梦的深眠。' },
  'ESFP': { name: '绚烂极光', tags: ['睡前冲浪', '沉浸深睡', '梦境丰富'], desc: '你的夜晚总是丰富多彩。哪怕带着满脑子的星际电波入睡，也能快速沉浸，并在梦中继续上演快乐的极光狂欢。' },
  'ENFP': { name: '跳跃虫洞', tags: ['随性活跃', '浅睡多梦', '时空穿梭'], desc: '你的思维在睡前异常活跃，在各个网络黑洞中穿梭。入睡后往往睡眠较浅，梦境犹如虫洞般连接着无数奇幻场景。' },
  'ENTP': { name: '混沌星系', tags: ['随性冲浪', '浅睡少梦', '思维不息'], desc: '规则对你来说就是用来打破的。睡前还在吸收海量信息，导致睡眠常常处于浅轨运行状态，但大脑乐在其中。' },
  'ESTJ': { name: '导航北极星', tags: ['规律作息', '睡前摄入', '深度休眠'], desc: '你是自己宇宙的绝对掌控者。哪怕睡前还在处理信息，一到就寝时间也能准时闭眼，进入高效的深度休眠。' },
  'ESFJ': { name: '温暖伴星', tags: ['规律陪伴', '睡前冲浪', '梦境交织'], desc: '你习惯在睡前与世界保持连接，但又坚守健康的作息。你的梦境常常充满人情味，如同伴星般散发着温暖的光芒。' },
  'ENFJ': { name: '引力灯塔', tags: ['规律作息', '信息雷达', '多梦体质'], desc: '你关注着宇宙中发出的每一个信号。规律的作息让你保持能量，但在浅睡的夜晚，梦境总是映照出你对他人的关怀。' },
  'ENTJ': { name: '主序星核', tags: ['高效掌控', '睡前规划', '浅睡少梦'], desc: '你像星核一样充满能量并掌控全局。睡前的时间常被用来规划明天，高效的浅睡足以支撑你应对现实的引力。' }
};

const MILESTONES = [
  { id: 0, days: 0, name: '虚空尘埃', desc: '深灰虚空，微光闪烁' },
  { id: 1, days: 1, name: '星雾聚集', desc: '紫色高斯模糊光晕' },
  { id: 2, days: 7, name: '初生星核', desc: '中央主星体出现' },
  { id: 3, days: 14, name: '星环觉醒', desc: '倾斜环形边框' },
  { id: 4, days: 21, name: '伴星环绕', desc: '顺时针公转小黄星' },
  { id: 5, days: 30, name: '双月引力', desc: '逆时针公转小紫星' },
  { id: 6, days: 60, name: '宁静星系', desc: '整体极慢自转' }
];

const TITLES = [
  { id: 'starter', title: '星辰初学者', count: 5, icon: '🌟' },
  { id: 'comforter', title: '温暖使者', count: 20, icon: '💫' },
  { id: 'guardian', title: '宇宙守护者', count: 50, icon: '🌙' },
  { id: 'master', title: '星系大师', count: 100, icon: '✨' },
  // v4.2.1 新增
  { id: 'comet', title: '暖意流星', count: 200, icon: '☄️' },     // 用温度划过别人的夜
  { id: 'eternal', title: '永恒银河', count: 500, icon: '🌌' }    // 你的温暖已融入银河
];

// --- 样式定义 ---
const styles = `
  @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
  
  @keyframes theme-transition {
    0% { background-color: var(--bg-start); color: var(--text-start); }
    100% { background-color: var(--bg-end); color: var(--text-end); }
  }

  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
    100% { transform: translateY(0px); }
  }
  .animate-float { animation: float 4s ease-in-out infinite; }

  @keyframes breathe {
    0%, 100% { transform: scale(0.85); opacity: 0.8; }
    50% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 40px rgba(99, 102, 241, 0.4); }
  }
  .breathe-circle { animation: breathe 8s cubic-bezier(0.4, 0, 0.2, 1) infinite; }

  @keyframes emit-particle {
    0% { transform: translateY(0) scale(1) translateX(0); opacity: 1; }
    100% { transform: translateY(-150px) scale(0) translateX(var(--tx)); opacity: 0; }
  }
  .particle {
    position: absolute;
    animation: emit-particle 1s ease-out forwards;
    pointer-events: none;
  }

  /* 星系动画 */
  @keyframes spin-slow { 100% { transform: rotate(360deg); } }
  .galaxy-spin { animation: spin-slow 40s linear infinite; }
  
  /* 隐藏滚动条 */
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// --- 主应用组件 ---
export default function App() {
  // 状态管理
  const [activeTab, setActiveTab] = useState('tonight');
  const [theme, setTheme] = useState('light');
  
  // 用户数据状态
  const [userData, setUserData] = useState({
    id: 'TR755',                  // 固定编号，用户不能修改
    displayName: '星海旅人',       // 用户名（可改）
    avatarEmoji: '🪐',             // 头像 emoji（可改）
    fontScale: 1.0,                // 字号缩放
    totalDays: 0,
    continuousDays: 0,
    stardust: 0,
    totalHugs: 0,
    huggedWhispers: [],            // 已点亮的心语 id 列表（可切换）
    checkInHistory: [],
    dreamLogs: [],
    myWhispers: [],
    personality: null,
    dailyPosts: 0,
    lastPostDate: '',
    reminderEnabled: false,
    reminderTime: '22:30'
  });
  
  // 动态获取今天的日期字符串
  const [currentDateStr, setCurrentDateStr] = useState(new Date().toDateString());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().toDateString();
      if (now !== currentDateStr) setCurrentDateStr(now);
    }, 60000);
    return () => clearInterval(timer);
  }, [currentDateStr]);

  // 初始化加载数据
  useEffect(() => {
    const saved = localStorage.getItem('xixi_cosmos_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.continuousDays === undefined) parsed.continuousDays = 0;
      if (!parsed.dreamLogs) parsed.dreamLogs = [];
      if (!parsed.myWhispers) parsed.myWhispers = [];
      // v4.2.0 迁移：统一固定 ID + 补默认字段
      parsed.id = 'TR755';
      if (!parsed.displayName) parsed.displayName = '星海旅人';
      if (!parsed.avatarEmoji) parsed.avatarEmoji = '🪐';
      if (typeof parsed.fontScale !== 'number') parsed.fontScale = 1.0;
      if (!Array.isArray(parsed.huggedWhispers)) parsed.huggedWhispers = [];
      setUserData(parsed);
    }
    const savedTheme = localStorage.getItem('xixi_cosmos_theme') || 'light';
    setTheme(savedTheme);
  }, []);

  // 全局字号缩放：写到 <html> 的 font-size 上，rem-based 的所有尺寸跟着变
  // 基准 18.4px (= 16 * 1.15)：v4.2.0 滑动条的 115% 在 v4.2.1 起被定为新默认 100%
  useEffect(() => {
    const scale = userData.fontScale || 1.0;
    document.documentElement.style.fontSize = (18.4 * scale) + 'px';
  }, [userData.fontScale]);

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

  const handleCheckIn = (moodId, whisper) => {
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

    const newData = {
      ...userData,
      totalDays: userData.totalDays + 1,
      continuousDays: newContinuousDays,
      stardust: userData.stardust + earned,
      checkInHistory: [newEntry, ...userData.checkInHistory]
    };

    saveUserData(newData);
    // 打卡后强制进入深色沉浸模式
    setTheme('dark');
  };

  const isDark = theme === 'dark' || (theme === 'auto' && (new Date().getHours() >= 18 || new Date().getHours() < 6));

  // === 下拉刷新（仅刷新当前 tab 内容，保留所在页面） ===
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const pullStartY = useRef(0);
  const pullActive = useRef(false);

  useEffect(() => {
    const onTouchStart = (e) => {
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
      // 阻尼效果
      const distance = Math.min(Math.pow(dy, 0.85) * 0.7, 120);
      setPullDistance(distance);
    };
    const onTouchEnd = () => {
      if (!pullActive.current) return;
      pullActive.current = false;
      if (pullDistance > 60) {
        setRefreshing(true);
        // 重新读 localStorage（保险），再让当前 tab 重新挂载
        setTimeout(() => {
          try {
            const saved = localStorage.getItem('xixi_cosmos_data');
            if (saved) {
              const parsed = JSON.parse(saved);
              parsed.id = 'TR755';
              if (!parsed.displayName) parsed.displayName = '星海旅人';
              if (!parsed.avatarEmoji) parsed.avatarEmoji = '🪐';
              if (typeof parsed.fontScale !== 'number') parsed.fontScale = 1.0;
              if (!Array.isArray(parsed.huggedWhispers)) parsed.huggedWhispers = [];
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
    <div className={`min-h-screen transition-colors duration-1000 ${isDark ? 'dark bg-[#0f0f1a] text-[#f1f5f9]' : 'bg-[#f8fafc] text-[#1e293b]'}`}>
      <style>{styles}</style>

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
  );
}

// --- 组件：底部Tab按钮 ---
function TabButton({ id, icon: Icon, label, active, onClick, isDark }) {
  const activeColor = isDark ? 'text-indigo-400' : 'text-indigo-600';
  const inactiveColor = isDark ? 'text-gray-500' : 'text-gray-400';
  
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center space-y-1 w-16 h-full transition-transform active:scale-95">
      <div className={`p-2 rounded-xl transition-colors ${active ? (isDark ? 'bg-indigo-500/10' : 'bg-indigo-50') : 'bg-transparent'}`}>
        <Icon size={22} className={active ? activeColor : inactiveColor} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className={`text-[10px] font-medium ${active ? activeColor : inactiveColor}`}>{label}</span>
    </button>
  );
}

// --- 页面 1：此刻 (Tonight) --- 深度产品化重构
function TonightView({ isDark, hasCheckedInToday, onCheckIn, userData, saveUserData, currentDateStr }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [whisper, setWhisper] = useState('');
  const [comfortText, setComfortText] = useState('闭上眼睛，深呼吸。今夜，你的内心是何种风景？');
  
  const [isAidExpanded, setIsAidExpanded] = useState(false);
  const [isMoodSelectorOpen, setIsMoodSelectorOpen] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  
  const [selectedTrackRecord, setSelectedTrackRecord] = useState(null); 
  
  // 新增：日历相关状态
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
    const day = date.getDay(); // 0(Sun) - 6(Sat)
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

      {/* 核心打卡交互区：情绪胶囊 */}
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
            : (isDark ? 'bg-[#1f1f2e] border-indigo-500/20 hover:border-indigo-500/40 cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.05)]' : 'bg-white border-indigo-100 hover:border-indigo-300 cursor-pointer shadow-sm')
        }`}
        style={{
           borderColor: selectedMood ? `${moodData.color}30` : '',
           boxShadow: selectedMood ? `0 10px 40px -10px ${moodData.color}15` : ''
        }}
        onClick={() => !isMoodSelectorOpen && !selectedMood && setIsMoodSelectorOpen(true)}
        >
          {/* 情感色彩动态光晕 */}
          {selectedMood && (
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-[0.08] pointer-events-none transition-all duration-1000" style={{ backgroundColor: moodData.color }}></div>
          )}

          <div className="p-6 relative z-10">
            {/* 状态 1：静默召唤 */}
            {!selectedMood && !isMoodSelectorOpen && (
              <div className="animate-fade-in flex flex-col justify-center items-center text-center min-h-[120px] group">
                <Compass size={32} className={`mb-4 opacity-40 transition-transform duration-500 group-hover:rotate-45 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                <p className={`text-sm font-light leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  闭上眼睛，深呼吸。今夜，你的内心是何种风景？
                </p>
                <p className={`text-[10px] mt-5 opacity-60 flex items-center gap-1 ${isDark ? 'text-indigo-300' : 'text-indigo-500'}`}>
                  点击展开星象，记录此刻 <ChevronDown size={12} className="animate-bounce" />
                </p>
              </div>
            )}

            {/* 状态 2：网格选择 */}
            {isMoodSelectorOpen && (
              <div className="animate-fade-in space-y-5 py-2">
                 <div className="flex justify-between items-center px-1">
                   <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>校准你的情绪波段...</span>
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

            {/* 状态 3：情感共鸣输入 */}
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

      {/* 需求更新：本周星轨印记与小型日历集成 */}
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
      )}

      {/* 展开的完整日历视图 */}
      {showCalendar && (
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
                            setShowCalendar(false); // 点击后关闭日历，展示记录详情
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

// 独立的梦境与AI解梦卡片组件
function DreamCard({ isDark, userData, saveUserData, currentDateStr }) {
  const [isWriting, setIsWriting] = useState(false);
  const [dreamInput, setDreamInput] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editInput, setEditInput] = useState('');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const dreamLogs = userData.dreamLogs || [];

  const handleInterpret = async () => {
    if (!dreamInput.trim()) return;
    setIsInterpreting(true);

    const apiKey = ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: `请帮我解读这个梦境：${dreamInput}` }] }],
      systemInstruction: { parts: [{ text: "你是息息宇宙的梦境守护者。用温柔、充满宇宙浪漫感、诗意、治愈的语言解读用户的梦境。篇幅控制在100字左右，不要长篇大论。" }] }
    };

    try {
      const delays = [1000, 2000, 4000, 8000];
      let data;
      for (let i = 0; i < 5; i++) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error('API error');
          data = await res.json();
          break;
        } catch(err) {
          if (i === 4) throw err;
          await new Promise(r => setTimeout(r, delays[i]));
        }
      }

      const interpretationText = data?.candidates?.[0]?.content?.parts?.[0]?.text 
        || "宇宙的信号遇到了一点扰动，但无论梦见什么，那都是潜意识给你的温柔馈赠。";

      const newLog = {
        id: Date.now(),
        date: currentDateStr,
        dream: dreamInput,
        interpretation: interpretationText,
        isFavorite: false
      };

      saveUserData({
        ...userData,
        dreamLogs: [newLog, ...dreamLogs]
      });
      
      setDreamInput('');
      setIsWriting(false);
      setExpandedId(newLog.id); 

    } catch (err) {
      console.error(err);
      alert("连接宇宙信号失败，请稍后再试。");
    } finally {
      setIsInterpreting(false);
    }
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
                <><Loader2 size={16} className="animate-spin" /> 正在连线星云解读...</>
              ) : (
                <><Sparkles size={16} /> 保存并让 AI 解读</>
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
                                <p className={`text-[10px] mb-1.5 font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>宇宙的解读</p>
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
      )}
    </section>
  );
}

function BreathingWidget({ isDark, onClose }) {
  const [phase, setPhase] = useState('吸气');
  
  useEffect(() => {
    const timer = setInterval(() => {
      setPhase(p => p === '吸气' ? '呼气' : '吸气');
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ backgroundColor: isDark ? '#0f0f1a' : '#f8fafc' }}>
      <button onClick={onClose} className="absolute right-6 p-2 rounded-full bg-gray-800/20 text-gray-400 top-[max(env(safe-area-inset-top)+0.5rem,2.5rem)]">
        <X size={24} />
      </button>
      <div className="flex flex-col items-center justify-center h-full space-y-16">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 breathe-circle"></div>
          <div className="absolute inset-4 rounded-full bg-indigo-400/20 breathe-circle" style={{ animationDelay: '0.2s' }}></div>
          <div className={`z-10 text-2xl font-light tracking-widest ${isDark ? 'text-white' : 'text-gray-800'} transition-opacity duration-1000`}>
            {phase}
          </div>
        </div>
        <p className={`text-sm font-light ${isDark ? 'text-gray-400' : 'text-gray-500'} tracking-widest`}>跟随光环的节奏</p>
      </div>
    </div>
  );
}

// --- 页面 2：微澜 (Treehole) --- 深度重构
function TreeholeView({ isDark, userData, saveUserData, currentDateStr }) {
  const [mode, setMode] = useState('browse'); // 'browse', 'emit', 'mine'
  const [whisperText, setWhisperText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [visibility, setVisibility] = useState('public'); // 新增：可见度状态 'public' | 'private'
  const [particles, setParticles] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWhisperId, setExpandedWhisperId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const textareaRef = useRef(null);

  const isNewDay = userData.lastPostDate !== currentDateStr;
  const postsToday = isNewDay ? 0 : (userData.dailyPosts || 0);
  // 修改需求2：发射台修改为每天可以发射5次
  const postsLeft = Math.max(0, 5 - postsToday);

  const myWhispers = userData.myWhispers || [];

  // 输入框自适应高度
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
      // 取消点亮
      saveUserData({
        ...userData,
        totalHugs: Math.max(0, userData.totalHugs - 1),
        huggedWhispers: huggedList.filter(id => id !== whisperId),
      });
    } else {
      // 点亮 + 粒子动效
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
      emotion: selectedTag || '无轨星尘',
      visibility: visibility, // 保存可见度设置
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
    setVisibility('public'); // 重置为默认
    setMode('mine'); // 发射成功后自动切换到我的信号以反馈
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // 我的信号快捷操作
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

      {/* 模式 1: 星际回音 (浏览他人的心语) */}
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
              {/* 情感光晕 */}
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

      {/* 模式 2: 发射台 (发布新心语) */}
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

          {/* 新增：信号可见度选择 */}
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

      {/* 模式 3: 我的信号 (个人历史记录) */}
      {mode === 'mine' && (
        <div className="space-y-4 animate-fade-in flex flex-col h-full">
          {/* 搜索框 */}
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
                          {/* 渲染可见度标识 */}
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
        <div className="fixed left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-indigo-500 text-white text-sm shadow-lg shadow-indigo-500/20 animate-fade-in z-50 flex items-center gap-2 top-[max(env(safe-area-inset-top)+1rem,5rem)]">
          <Send size={14} /> 信号已抵达深空
        </div>
      )}

      {/* 自定义心语消散确认弹窗 */}
      {deleteConfirmId && (
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
      )}
    </div>
  );
}

// --- 页面 3：星系 (Galaxy) ---
function GalaxyView({ isDark, userData, saveUserData, currentDateStr }) {
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  
  const currentMilestone = MILESTONES.slice().reverse().find(m => userData.totalDays >= m.days) || MILESTONES[0];
  const milestoneIcons = ['🌌', '🌫️', '⭐', '🪐', '💫', '🌗', '🌀']; 
  
  const renderGalaxyVisual = () => {
    const days = userData.totalDays;
    return (
      <div className={`py-8 rounded-[32px] border space-y-6 relative overflow-hidden flex flex-col items-center ${isDark ? 'bg-black/20 border-indigo-500/10' : 'bg-indigo-50/50 border-indigo-100 shadow-sm'}`}>
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div className="absolute inset-4 bg-indigo-600/10 rounded-full filter blur-xl animate-pulse"></div>

          {days >= 0 && (
            <div className={`absolute inset-0 border rounded-full galaxy-spin ${isDark ? 'border-white/5' : 'border-indigo-200/50'}`}></div>
          )}
          {days >= 1 && (
            <div className="absolute inset-4 bg-gradient-to-tr from-indigo-500/10 to-blue-500/10 rounded-full filter blur-md animate-pulse"></div>
          )}
          {days >= 7 && <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.6)] animate-pulse z-10"></div>}
          {days >= 14 && <div className={`absolute w-28 h-6 border-2 rounded-full transform -rotate-12 z-20 pointer-events-none ${isDark ? 'border-orange-300/40' : 'border-orange-400/50'}`}></div>}
          {days >= 21 && (
            <div className={`absolute w-36 h-36 border rounded-full galaxy-spin ${isDark ? 'border-white/5' : 'border-indigo-200/50'}`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-yellow-300 rounded-full shadow-[0_0_8px_#fde047]"></div>
            </div>
          )}
          {days >= 30 && (
            <div className={`absolute w-44 h-44 border rounded-full ${isDark ? 'border-indigo-500/10' : 'border-indigo-300/40'}`} style={{ animation: 'spin-slow 30s linear infinite reverse' }}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-indigo-400 rounded-full shadow-[0_0_8px_#818cf8]"></div>
            </div>
          )}
          {days >= 60 && <div className={`absolute inset-0 opacity-40 galaxy-spin rounded-full ${isDark ? 'bg-[radial-gradient(circle,transparent,rgba(15,15,26,0.8))]' : 'bg-[radial-gradient(circle,transparent,rgba(255,255,255,0.6))]'}`}></div>}
        </div>

        <div className="space-y-1 z-10 px-6 text-center">
          <span className={`text-[10px] px-3 py-1 rounded-full border ${isDark ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-indigo-100 text-indigo-600 border-indigo-200'}`}>
            阶段 {Math.min(7, Math.max(1, Math.floor(days / 7) + 1))}：{currentMilestone.name}
          </span>
          <p className={`text-xs pt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{currentMilestone.desc}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in pb-10 space-y-8">
      {/* 头部统计 */}
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-xl font-light mb-1">你的宇宙坐标</h2>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            连续驻留 <span className="text-indigo-400 font-medium">{userData.displayContinuousDays}</span> 夜晚
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end text-indigo-400 mb-1">
            <Sparkles size={16} />
            <span className="font-medium text-lg">{userData.stardust}</span>
          </div>
          <p className="text-[10px] text-gray-500">星尘数量</p>
        </div>
      </div>

      {/* 星系可视化核心 */}
      {renderGalaxyVisual()}

      {/* 星轨里程碑印记 */}
      <div className="space-y-4 px-1">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400" />
          星轨里程碑印记
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {MILESTONES.map(item => {
            const isUnlocked = userData.totalDays >= item.days;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedMilestone(item)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 relative overflow-hidden transition-all ${
                  isUnlocked 
                    ? (isDark ? 'bg-indigo-900/20 border-indigo-500/30 hover:border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-indigo-50 border-indigo-200 hover:border-indigo-300 shadow-sm') 
                    : (isDark ? 'bg-white/[0.01] border-white/[0.03] opacity-45' : 'bg-gray-50 border-gray-100 opacity-60')
                }`}
              >
                {isUnlocked && (
                  <div className="absolute -right-6 -bottom-6 w-12 h-12 rounded-full bg-indigo-500/10 blur-xl animate-pulse"></div>
                )}
                
                <div className="flex justify-between items-start w-full">
                  <span className={`text-2xl ${isUnlocked ? 'animate-float' : 'grayscale'}`}>
                    {milestoneIcons[item.id] || '✨'}
                  </span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-mono font-light uppercase tracking-wider ${
                    isUnlocked 
                      ? (isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600') 
                      : (isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-200 text-gray-500')
                  }`}>
                    {isUnlocked ? '已唤醒' : '星云笼罩'}
                  </span>
                </div>

                <div className="space-y-0.5 relative z-10">
                  <h4 className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{item.name}</h4>
                  <p className={`text-[9px] line-clamp-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {isUnlocked ? item.desc : `需要 ${item.days} 天`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 点击里程碑弹出的详情 Modal */}
      {selectedMilestone && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`}>
          <div className={`w-full max-w-sm p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative text-center`}>
            <button onClick={() => setSelectedMilestone(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200"><X size={20} /></button>
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-3 ${isDark ? 'bg-[#1f1f2e]' : 'bg-indigo-50'}`}>
              {milestoneIcons[selectedMilestone.id]}
            </div>
            <h3 className="text-lg font-medium mb-1">{selectedMilestone.name}</h3>
            <p className={`text-xs mb-4 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}>
              {userData.totalDays >= selectedMilestone.days ? '已唤醒该形态' : `还需要累计 ${selectedMilestone.days - userData.totalDays} 天即可唤醒`}
            </p>
            <div className={`p-4 rounded-2xl text-sm font-light leading-relaxed ${isDark ? 'bg-[#1f1f2e] text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
              "{selectedMilestone.desc}"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 性格测试小组件 (MBTI宇宙版 - 10道题)
function QuizWidget({ isDark, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  
  const questions = [
    { q: "你的就寝时间通常是？", options: [{ text: "像恒星日出日落般规律", val: 'J' }, { text: "像流星一样随机出没", val: 'P' }] },
    { q: "睡前半小时，你更倾向于？", options: [{ text: "刷手机接收“星际电波”", val: 'E' }, { text: "听音乐/发呆进入“静默舱”", val: 'I' }] },
    { q: "躺下后，你进入睡眠的速度？", options: [{ text: "瞬间断电，跌入黑洞", val: 'N' }, { text: "辗转反侧，在轨道上徘徊", val: 'S' }] },
    { q: "你的梦境通常是怎样的？", options: [{ text: "很少做梦，或梦境很日常现实", val: 'T' }, { text: "光怪陆离的平行宇宙", val: 'F' }] },
    { q: "睡着后，外界的声音能轻易唤醒你吗？", options: [{ text: "一点风吹草动就醒", val: 'S' }, { text: "雷打不动，深度休眠", val: 'N' }] },
    { q: "闭上眼睛时，你的脑海里？", options: [{ text: "思绪万千，像一场星际风暴", val: 'E' }, { text: "逐渐清空，归于虚无", val: 'I' }] },
    { q: "到了周末，你的睡眠习惯会？", options: [{ text: "保持原本的轨道运行", val: 'J' }, { text: "彻底脱轨，睡到自然醒", val: 'P' }] },
    { q: "早上醒来后，你还记得昨晚的梦吗？", options: [{ text: "醒来就忘，只留下模糊的星尘", val: 'T' }, { text: "历历在目，像看了一场全息电影", val: 'F' }] },
    { q: "如果半夜醒来睡不着，你会怎么做？", options: [{ text: "拿起手机重新连接宇宙网络", val: 'E' }, { text: "闭着眼尝试冥想呼吸", val: 'I' }] },
    { q: "早晨的闹钟设置是？", options: [{ text: "一个闹钟，准时唤醒", val: 'J' }, { text: "多个闹钟，像陨石带一样密集", val: 'P' }] }
  ];

  const handleSelect = (val) => {
    const newAnswers = [...answers, val];
    setAnswers(newAnswers);
    
    if (step < questions.length - 1) {
      setStep(s => s + 1);
    } else {
      // 计算结果
      const count = (char) => newAnswers.filter(a => a === char).length;
      
      const type = [
        count('I') >= count('E') ? 'I' : 'E', // E/I (题2,6,9) 3题必有胜负
        count('S') >= count('N') ? 'S' : 'N', // S/N (题3,5) 2题，平局偏S(浅睡)
        count('F') >= count('T') ? 'F' : 'T', // T/F (题4,8) 2题，平局偏F(多梦)
        count('J') >= count('P') ? 'J' : 'P'  // J/P (题1,7,10) 3题必有胜负
      ].join('');
      
      const result = COSMIC_PERSONALITIES[type] || COSMIC_PERSONALITIES['ISFJ'];
      onComplete({ ...result, type });
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]' : 'bg-[#f8fafc]'} animate-fade-in`}>
      <button onClick={onClose} className="absolute right-6 p-2 text-gray-400 hover:text-gray-200 top-[max(env(safe-area-inset-top)+0.5rem,2.5rem)]">
        <X size={24} />
      </button>
      
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <p className={`text-center text-xs tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            — 睡眠特质探测 —
          </p>
          <div className={`h-1 w-full rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <div 
              className="h-full bg-indigo-500 transition-all duration-300" 
              style={{ width: `${((step + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-right text-[10px] text-gray-500">{step + 1} / {questions.length}</p>
        </div>
        
        <h2 className={`text-xl font-light text-center leading-relaxed h-20 flex items-center justify-center ${isDark ? 'text-gray-200' : 'text-gray-800'}`} key={step}>
          <span className="animate-fade-in">{questions[step].q}</span>
        </h2>
        
        <div className="space-y-4 pt-4">
          {questions[step].options.map((opt, i) => (
            <button 
              key={i + '-' + step} 
              onClick={() => handleSelect(opt.val)}
              className={`w-full p-4 rounded-2xl text-sm transition-all active:scale-95 border animate-fade-in ${
                isDark ? 'bg-[#171724] border-gray-800 hover:border-indigo-500/50 hover:bg-[#1f1f2e]' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm hover:bg-indigo-50/50'
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 当前构建的版本号与构建时间，由 vite.config.js 的 define 注入
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 0;

// 头像可选 emoji
const AVATAR_EMOJIS = ['🪐', '🌙', '⭐', '🌟', '✨', '💫', '🌠', '🌌', '☄️', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🛸', '🚀', '🌈', '☁️', '🦄'];

// --- 页面 4：我的 (Mine) ---
function MineView({ isDark, theme, setTheme, userData, setUserData, saveUserData }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false); // 控制性格测试显示
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [nameDraft, setNameDraft] = useState(userData.displayName || '星海旅人');
  const [emojiDraft, setEmojiDraft] = useState(userData.avatarEmoji || '🪐');

  const unlockedTitles = TITLES.filter(t => userData.totalHugs >= t.count);
  const highestTitle = unlockedTitles.length > 0 ? unlockedTitles[unlockedTitles.length - 1].title : '星辰初学者';

  // 兼容旧数据的字符型 personality 或读取新版对象
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
      // 首次测试奖励 30 星尘，重测不奖励
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
        <div className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowProfileEdit(false)}>
          <div className={`w-full max-w-sm p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowProfileEdit(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200"><X size={20} /></button>
            <h3 className="text-lg font-medium mb-5 text-center">编辑资料</h3>

            {/* 预览 */}
            <div className="flex flex-col items-center gap-2 mb-5">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-5xl ${isDark ? 'bg-[#0f0f1a] border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-100'}`}>
                {emojiDraft}
              </div>
              <p className="text-base font-medium">{(nameDraft || '').trim() || '星海旅人'} <span className={`text-xs ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>#{userData.id}</span></p>
            </div>

            {/* 头像 emoji 选择 */}
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

            {/* 用户名 */}
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

            {/* ID 固定，不可改 */}
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
      )}
      
      {/* 睡眠性格测试区 (状态驱动展示) */}
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
          {/* 装饰性背景 */}
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

// 开发者测试控制台访问密码
const DEV_CONSOLE_PASSWORD = '186638';

// 把字节数格式化为 KB / MB
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// 友好显示浏览器/系统语言
function getLanguageLabel() {
  const lang = (typeof navigator !== 'undefined' && navigator.language) || 'zh-CN';
  const map = {
    'zh-CN': '简体中文', 'zh-TW': '繁體中文', 'zh-HK': '繁體中文（香港）', 'zh': '中文',
    'en-US': 'English (US)', 'en-GB': 'English (UK)', 'en': 'English',
    'ja-JP': '日本語', 'ja': '日本語', 'ko-KR': '한국어', 'ko': '한국어',
  };
  return { code: lang, label: map[lang] || map[lang.split('-')[0]] || lang };
}

// 设置面板小组件：引入完整的开发者测试闭环
function SettingsPanel({ isDark, theme, setTheme, userData, saveUserData, onClose, onReset }) {
  const [confirmDialog, setConfirmDialog] = useState(null); // 自定义确认弹窗
  const [alertDialog, setAlertDialog] = useState(null);     // 自定义提示弹窗

  // 关于息息（版本检查相关）
  const [versionCheckState, setVersionCheckState] = useState('idle'); // idle | checking | latest | update | error
  const [latestVersionInfo, setLatestVersionInfo] = useState(null);

  // 隐私协议查看
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // 数据导入文件输入
  const fileInputRef = useRef(null);

  // 开发者测试控制台的密码门
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [devPasswordInput, setDevPasswordInput] = useState('');
  const [devPasswordError, setDevPasswordError] = useState(false);

  const handleDevUnlock = (e) => {
    if (e) e.preventDefault();
    if (devPasswordInput === DEV_CONSOLE_PASSWORD) {
      setDevUnlocked(true);
      setDevPasswordInput('');
      setDevPasswordError(false);
    } else {
      setDevPasswordError(true);
    }
  };

  // --- 关于息息：检查更新 ---
  const handleCheckVersion = async () => {
    setVersionCheckState('checking');
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setLatestVersionInfo(data);
      const isNewer =
        (data.buildTime && BUILD_TIME && data.buildTime > BUILD_TIME) ||
        (data.version && data.version !== APP_VERSION);
      setVersionCheckState(isNewer ? 'update' : 'latest');
    } catch (e) {
      setVersionCheckState('error');
    }
  };
  const handleApplyUpdate = () => { window.location.reload(); };

  // --- 账号与安全：复制星际编号 ---
  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(userData.id);
      setAlertDialog({ title: '复制成功', message: `星际编号 ${userData.id} 已复制到剪贴板。` });
    } catch {
      setAlertDialog({ title: '请手动复制', message: `星际编号：${userData.id}` });
    }
  };

  // --- 账号与安全：导出数据备份 JSON ---
  const handleExportData = () => {
    try {
      const payload = {
        app: 'xixi-cosmos',
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
        theme: localStorage.getItem('xixi_cosmos_theme') || 'light',
        userData,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `xixi-cosmos-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setAlertDialog({ title: '备份完成', message: '数据已导出到下载文件夹，请妥善保管。' });
    } catch (e) {
      setAlertDialog({ title: '备份失败', message: '导出时发生错误，请稍后重试。' });
    }
  };

  // --- 账号与安全：导入数据恢复 ---
  const handleImportClick = () => { fileInputRef.current?.click(); };
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed || !parsed.userData || typeof parsed.userData !== 'object') {
          throw new Error('invalid');
        }
        setConfirmDialog({
          title: '数据恢复',
          message: '即将用备份文件覆盖当前所有记录，此操作不可撤销，确定继续吗？',
          onConfirm: () => {
            saveUserData(parsed.userData);
            if (parsed.theme && ['light', 'dark', 'auto'].includes(parsed.theme)) {
              setTheme(parsed.theme);
            }
            setAlertDialog({ title: '恢复成功', message: '已从备份文件恢复你的全部宇宙数据。' });
          }
        });
      } catch {
        setAlertDialog({ title: '恢复失败', message: '文件格式不正确，请选择由本应用导出的备份文件。' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- 存储与隐私：用量统计 ---
  const dataString = JSON.stringify(userData);
  const dataBytes = new Blob([dataString]).size;
  const checkInCount = userData.checkInHistory?.length || 0;
  const dreamCount = userData.dreamLogs?.length || 0;
  const whisperCount = userData.myWhispers?.length || 0;

  // 浏览器 quota（如可用，异步刷新一次）
  const [storageQuota, setStorageQuota] = useState(null);
  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(est => {
        setStorageQuota({ usage: est.usage || 0, quota: est.quota || 0 });
      }).catch(() => {});
    }
  }, []);

  // 用户级"清空所有数据"
  const handleClearAll = () => {
    setConfirmDialog({
      title: '清空所有数据',
      message: '所有打卡、梦境、心语、徽章都将被清除，此操作不可撤销。确定吗？',
      onConfirm: () => { onReset(); }
    });
  };

  const language = getLanguageLabel();
  
  // 1. 时空跃迁 (生成虚拟记录)
  const handleFillMockData = (days) => {
    setConfirmDialog({
      title: '时空跃迁',
      message: `即将生成过去 ${days} 天的虚拟打卡星轨。确定执行吗？`,
      onConfirm: () => {
        const mockHistory = [];
        const baseDate = new Date();
        
        for (let i = 0; i < days; i++) {
          const d = new Date(baseDate);
          d.setDate(d.getDate() - i);
          mockHistory.push({
            id: Date.now() - i * 10000,
            date: d.toDateString(),
            timeStr: "23:45",
            timestamp: d.getTime(),
            moodId: i % 3 === 0 ? 'calm' : (i % 2 === 0 ? 'joyful' : 'tired'),
            moodName: i % 3 === 0 ? '静谧' : (i % 2 === 0 ? '欢愉' : '疲惫'),
            whisper: '这是一条时空折叠产生的测试记忆...',
            stardustEarned: 10
          });
        }

        saveUserData({
          ...userData,
          totalDays: Math.max(userData.totalDays, days),
          continuousDays: days,
          stardust: userData.stardust + (days * 10),
          checkInHistory: mockHistory
        });
        setAlertDialog({ title: '跃迁完成', message: `${days}天虚拟星轨生成完毕！请前往「星系」查看演化状态。` });
      }
    });
  };

  // 2. 注入温暖 (解锁称号)
  const injectHugs = () => {
    saveUserData({ ...userData, totalHugs: userData.totalHugs + 50 });
    setAlertDialog({ title: '注入成功', message: '已注入 50 次温暖传递，所有称号徽章现已解锁！' });
  };

  // 3. 撤销今日打卡 (复用 UI 测试)
  const resetTodayCheckIn = () => {
    const todayStr = new Date().toDateString();
    if (userData.checkInHistory.length > 0 && userData.checkInHistory[0].date === todayStr) {
      const newHistory = userData.checkInHistory.slice(1);
      saveUserData({
        ...userData,
        checkInHistory: newHistory,
        totalDays: Math.max(0, userData.totalDays - 1),
        continuousDays: Math.max(0, userData.continuousDays - 1),
        stardust: Math.max(0, userData.stardust - userData.checkInHistory[0].stardustEarned)
      });
      setAlertDialog({ title: '撤销成功', message: '已撤销今日打卡状态，请返回「此刻」重新体验完整的打卡交互！' });
    } else {
      setAlertDialog({ title: '提示', message: '今日尚未打卡，无需撤销。' });
    }
  };

  // 4. 重置性格测试
  const resetPersonality = () => {
    saveUserData({ ...userData, personality: null });
    setAlertDialog({ title: '重置成功', message: '已清除宇宙性格数据，入口已恢复，可重新进行内宇宙探测！' });
  };

  // 5. 恢复发射能量
  const resetTreeholeLimits = () => {
    saveUserData({...userData, dailyPosts: 0, lastPostDate: ''});
    setAlertDialog({ title: '能量补满', message: '发射台能量已补满，今日可重新向深空发射信号！' });
  };

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <div className="flex items-center justify-between pt-2 pb-6">
        <h2 className="text-lg font-medium">内观测控制台</h2>
        <button onClick={onClose} className="p-2 -mr-2 text-gray-400">
          <X size={20} />
        </button>
      </div>

      <div>
        <h3 className="text-xs text-gray-500 mb-2 px-2">视觉主题</h3>
        <div className={`p-1 rounded-2xl flex ${isDark ? 'bg-[#171724]' : 'bg-gray-200/50'}`}>
          {['light', 'dark', 'auto'].map((t) => (
            <button 
              key={t}
              onClick={() => setTheme(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                theme === t 
                  ? (isDark ? 'bg-[#1f1f2e] text-white' : 'bg-white text-gray-900 shadow-sm') 
                  : 'text-gray-500'
              }`}
            >
              {t === 'light' ? '浅色' : t === 'dark' ? '深色' : '跟随系统'}
            </button>
          ))}
        </div>
      </div>

      {/* === 整体字号 === */}
      <div className="pt-4">
        <h3 className="text-xs text-gray-500 mb-2 px-2">整体字号</h3>
        <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#171724]' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>偏小</span>
            <span className="text-base font-medium">
              示例文字 · Aa
            </span>
            <span className={`text-xl font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>偏大</span>
          </div>
          <input
            type="range"
            min="0.85"
            max="1.3"
            step="0.05"
            value={userData.fontScale ?? 1.0}
            onChange={(e) => saveUserData({ ...userData, fontScale: parseFloat(e.target.value) })}
            className="font-scale-slider w-full"
          />
          <div className="flex justify-between mt-2 text-[10px] text-gray-500">
            <span>85%</span>
            <span>当前 {Math.round(((userData.fontScale ?? 1.0)) * 100)}%</span>
            <span>130%</span>
          </div>
          <button
            onClick={() => saveUserData({ ...userData, fontScale: 1.0 })}
            className={`mt-3 w-full py-2 rounded-xl text-xs font-medium transition-colors ${
              isDark
                ? 'bg-[#0f0f1a] text-gray-400 hover:text-gray-200'
                : 'bg-gray-50 text-gray-500 hover:text-gray-700'
            }`}
          >
            恢复默认 (100%)
          </button>
        </div>
      </div>

      {/* === 系统语言 === */}
      <div className="pt-4">
        <h3 className="text-xs text-gray-500 mb-2 px-2">系统语言</h3>
        <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#171724]' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Compass size={16} className="text-gray-400" />
              <div>
                <p className="text-sm">{language.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{language.code} · 跟随浏览器设置</p>
              </div>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-md ${isDark ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-500'}`}>自动</span>
          </div>
        </div>
      </div>

      {/* === 账号与安全 === */}
      <div className="pt-4">
        <h3 className="text-xs text-gray-500 mb-2 px-2">账号与安全</h3>
        <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#171724]' : 'bg-white shadow-sm'}`}>
          <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3">
              <User size={16} className="text-gray-400" />
              <div>
                <p className="text-sm">我的星际编号</p>
                <p className="text-[11px] text-gray-500 mt-0.5 font-mono">{userData.id}</p>
              </div>
            </div>
            <button onClick={handleCopyId} className={`text-[11px] px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
              复制
            </button>
          </div>
          <button onClick={handleExportData} className={`w-full p-4 flex items-center justify-between border-b transition-colors ${isDark ? 'border-gray-800 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <ChevronDown size={16} className="text-gray-400 rotate-0" />
              <div className="text-left">
                <p className="text-sm">导出数据备份</p>
                <p className="text-[11px] text-gray-500 mt-0.5">下载 JSON 文件保存到本地</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-500" />
          </button>
          <button onClick={handleImportClick} className={`w-full p-4 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <ChevronUp size={16} className="text-gray-400" />
              <div className="text-left">
                <p className="text-sm">导入数据恢复</p>
                <p className="text-[11px] text-gray-500 mt-0.5">从备份文件还原全部记录</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-500" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
        <p className="text-[11px] text-gray-500 mt-2 px-2">
          数据仅存于本机，导出文件即唯一备份，请妥善保管。
        </p>
      </div>

      <div className="pt-4">
        <h3 className="text-xs text-gray-500 mb-2 px-2">睡眠守护</h3>
        <div className={`p-4 rounded-2xl space-y-4 ${isDark ? 'bg-[#171724]' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm">睡前提醒</span>
            <button 
              onClick={() => saveUserData({...userData, reminderEnabled: !userData.reminderEnabled})}
              className={`w-12 h-6 rounded-full transition-colors relative ${userData.reminderEnabled ? 'bg-indigo-500' : (isDark ? 'bg-gray-700' : 'bg-gray-300')}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${userData.reminderEnabled ? 'left-6.5' : 'left-0.5'}`} style={{ left: userData.reminderEnabled ? 'calc(100% - 22px)' : '2px' }}></div>
            </button>
          </div>
          
          {userData.reminderEnabled && (
            <div className="flex justify-between items-center pt-4 border-t border-gray-500/20 animate-fade-in">
              <span className="text-sm text-gray-400">提醒时间</span>
              <input 
                type="time" 
                value={userData.reminderTime || '22:30'}
                onChange={(e) => saveUserData({...userData, reminderTime: e.target.value})}
                className={`bg-transparent text-lg font-medium outline-none text-right ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}
              />
            </div>
          )}
        </div>
      </div>

      {/* === 存储与隐私 === */}
      <div className="pt-4">
        <h3 className="text-xs text-gray-500 mb-2 px-2">存储与隐私</h3>
        <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#171724]' : 'bg-white shadow-sm'}`}>
          {/* 本地存储用量 */}
          <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm">本地存储用量</span>
              <span className={`text-xs font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                {formatBytes(dataBytes)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className={`py-2 rounded-lg ${isDark ? 'bg-black/20' : 'bg-gray-50'}`}>
                <p className="text-lg font-medium">{checkInCount}</p>
                <p className="text-[10px] text-gray-500">打卡星轨</p>
              </div>
              <div className={`py-2 rounded-lg ${isDark ? 'bg-black/20' : 'bg-gray-50'}`}>
                <p className="text-lg font-medium">{dreamCount}</p>
                <p className="text-[10px] text-gray-500">梦境记录</p>
              </div>
              <div className={`py-2 rounded-lg ${isDark ? 'bg-black/20' : 'bg-gray-50'}`}>
                <p className="text-lg font-medium">{whisperCount}</p>
                <p className="text-[10px] text-gray-500">我的心语</p>
              </div>
            </div>
            {storageQuota && storageQuota.quota > 0 && (
              <p className="text-[11px] text-gray-500 mt-3">
                浏览器整体存储：{formatBytes(storageQuota.usage)} / {formatBytes(storageQuota.quota)}
                （{((storageQuota.usage / storageQuota.quota) * 100).toFixed(2)}%）
              </p>
            )}
          </div>

          {/* 隐私协议 */}
          <button onClick={() => setShowPrivacyModal(true)} className={`w-full p-4 flex items-center justify-between border-b transition-colors ${isDark ? 'border-gray-800 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <User size={16} className="text-gray-400" />
              <span className="text-sm">隐私守护协议</span>
            </div>
            <ChevronRight size={16} className="text-gray-500" />
          </button>

          {/* 清空所有数据 */}
          <button onClick={handleClearAll} className={`w-full p-4 flex items-center justify-between text-red-500 transition-colors ${isDark ? 'hover:bg-red-500/5' : 'hover:bg-red-50'}`}>
            <div className="flex items-center gap-3">
              <Trash2 size={16} />
              <span className="text-sm">清空所有数据</span>
            </div>
            <ChevronRight size={16} className="text-red-400/50" />
          </button>
        </div>
        <p className="text-[11px] text-gray-500 mt-2 px-2">
          清空操作不可撤销，建议先导出备份。
        </p>
      </div>

      {/* === 关于息息 === */}
      <div className="pt-4">
        <h3 className="text-xs text-gray-500 mb-2 px-2">关于息息</h3>
        <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#171724]' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
              息
            </div>
            <div>
              <p className="text-sm">息息·宇宙</p>
              <p className="text-[11px] text-gray-500">V{APP_VERSION} · {BUILD_TIME ? new Date(BUILD_TIME).toLocaleString('zh-CN', { hour12: false }) : '—'}</p>
            </div>
          </div>
          <p className={`text-[12px] leading-relaxed mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            每一个夜晚都值得被认真对待，每一份情绪都值得被温柔倾听。一个宁静的宇宙空间，让你卸下白天的疲惫，纯粹与自己对话。
          </p>

          <button
            onClick={handleCheckVersion}
            disabled={versionCheckState === 'checking'}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors active:scale-95 flex items-center justify-center gap-2 ${
              versionCheckState === 'checking'
                ? (isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400')
                : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
            }`}
          >
            {versionCheckState === 'checking' ? (
              <><Loader2 size={14} className="animate-spin" /> 正在连接宇宙网络…</>
            ) : (
              <><RotateCcw size={14} /> 检查更新</>
            )}
          </button>

          {versionCheckState === 'latest' && (
            <div className={`text-xs text-center px-3 py-2 mt-3 rounded-lg ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
              ✓ 已是最新版本，可以安心入眠
            </div>
          )}
          {versionCheckState === 'error' && (
            <div className={`text-xs text-center px-3 py-2 mt-3 rounded-lg ${isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-600'}`}>
              无法连接宇宙网络，请稍后重试
            </div>
          )}
          {versionCheckState === 'update' && latestVersionInfo && (
            <div className={`p-3 mt-3 rounded-xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-100'}`}>
              <div className="flex items-center gap-2 text-xs mb-2">
                <Zap size={12} className="text-indigo-400" />
                <span className={isDark ? 'text-indigo-200' : 'text-indigo-700'}>
                  发现新版本 V{latestVersionInfo.version}
                </span>
              </div>
              <p className={`text-[11px] leading-relaxed mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                本地数据（打卡、梦境、心语）会完整保留，更新只刷新程序本身。
              </p>
              <button
                onClick={handleApplyUpdate}
                className="w-full py-2 rounded-lg text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors active:scale-95"
              >
                立即更新
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 开发者测试控制台闭环 */}
      <div className={`pt-8 space-y-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <h3 className="text-xs text-indigo-500 mb-2 px-2 flex items-center gap-1.5 font-medium">
          <Bug size={14} /> 开发者测试控制台
          {devUnlocked && (
            <button
              onClick={() => { setDevUnlocked(false); setDevPasswordInput(''); setDevPasswordError(false); }}
              className="ml-auto text-[10px] font-normal text-gray-500 hover:text-indigo-400 underline-offset-2 hover:underline"
              title="锁定控制台"
            >
              锁定
            </button>
          )}
        </h3>

        {!devUnlocked ? (
          /* 密码门：未解锁前隐藏所有开发者操作 */
          <form
            onSubmit={handleDevUnlock}
            className={`p-5 rounded-2xl space-y-3 ${isDark ? 'bg-[#1a1a28] border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}
          >
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <AlertTriangle size={12} />
              <span>此控制台仅限开发者使用，请输入访问密码</span>
            </div>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={devPasswordInput}
              onChange={(e) => { setDevPasswordInput(e.target.value); if (devPasswordError) setDevPasswordError(false); }}
              placeholder="请输入访问密码"
              className={`w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors ${
                isDark
                  ? 'bg-black/30 border border-gray-700 focus:border-indigo-500 text-gray-200 placeholder-gray-600'
                  : 'bg-white border border-gray-200 focus:border-indigo-400 text-gray-800 placeholder-gray-400'
              } ${devPasswordError ? 'border-rose-400 focus:border-rose-400' : ''}`}
            />
            {devPasswordError && (
              <p className="text-[11px] text-rose-400">密码错误，请重试</p>
            )}
            <button
              type="submit"
              disabled={!devPasswordInput}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors active:scale-95 ${
                devPasswordInput
                  ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : (isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-200 text-gray-400')
              }`}
            >
              解锁控制台
            </button>
          </form>
        ) : (
        <>
        {/* 模块1：数据注入 */}
        <div className={`p-4 rounded-2xl space-y-3 ${isDark ? 'bg-indigo-500/5 border border-indigo-500/10' : 'bg-indigo-50/50 border border-indigo-100'}`}>
           <p className="text-[10px] text-gray-500 flex items-center gap-1"><Zap size={10}/> 时空与能量注入 (正向推进)</p>
           <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleFillMockData(7)} className={`py-2 text-[11px] rounded-xl border transition-colors ${isDark ? 'bg-black/20 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/10' : 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}>+7天 星轨跃迁</button>
              <button onClick={() => handleFillMockData(60)} className={`py-2 text-[11px] rounded-xl border transition-colors ${isDark ? 'bg-black/20 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/10' : 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}>+60天 满级跃迁</button>
              <button onClick={injectHugs} className={`py-2 text-[11px] rounded-xl border transition-colors ${isDark ? 'bg-black/20 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/10' : 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}>+50次 温暖传递</button>
              <button onClick={() => { saveUserData({...userData, stardust: userData.stardust + 100}); setAlertDialog({title: '注入成功', message: '已为你收集 100 颗星尘！'}); }} className={`py-2 text-[11px] rounded-xl border transition-colors ${isDark ? 'bg-black/20 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/10' : 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}>+100 收集星尘</button>
           </div>
        </div>

        {/* 模块2：状态重塑 */}
        <div className={`p-4 rounded-2xl space-y-3 ${isDark ? 'bg-orange-500/5 border border-orange-500/10' : 'bg-orange-50/50 border border-orange-100'}`}>
           <p className="text-[10px] text-gray-500 flex items-center gap-1"><RotateCcw size={10}/> 状态重塑 (逆向撤销)</p>
           <div className="grid grid-cols-2 gap-2">
              <button onClick={resetTodayCheckIn} className={`py-2 text-[11px] rounded-xl border transition-colors ${isDark ? 'bg-black/20 border-orange-500/20 text-orange-300 hover:bg-orange-500/10' : 'bg-white border-orange-200 text-orange-600 hover:bg-orange-50'}`}>撤销今日打卡</button>
              <button onClick={resetPersonality} className={`py-2 text-[11px] rounded-xl border transition-colors ${isDark ? 'bg-black/20 border-orange-500/20 text-orange-300 hover:bg-orange-500/10' : 'bg-white border-orange-200 text-orange-600 hover:bg-orange-50'}`}>重置性格测试</button>
              <button onClick={resetTreeholeLimits} className={`col-span-2 py-2 text-[11px] rounded-xl border transition-colors ${isDark ? 'bg-black/20 border-orange-500/20 text-orange-300 hover:bg-orange-500/10' : 'bg-white border-orange-200 text-orange-600 hover:bg-orange-50'}`}>补满「微澜」今日发射能量</button>
           </div>
        </div>

        {/* 模块3：彻底清空 */}
        <button 
          onClick={() => {
            setConfirmDialog({
              title: '毁灭与重生',
              message: '重置将清空所有星辰、徽章和打卡记录。确定要重置吗？',
              onConfirm: () => {
                onReset();
                // onReset() 会关闭面板并清空数据
              }
            });
          }}
          className={`w-full p-4 rounded-2xl text-sm text-red-500 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors text-left flex justify-between items-center`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            毁灭与重生 (清空所有运行数据)
          </div>
          <ChevronRight size={16} />
        </button>
        </>
        )}
      </div>

      {/* === 隐私守护协议弹窗 === */}
      {showPrivacyModal && (
        <div className={`fixed inset-0 z-[70] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/90' : 'bg-[#f8fafc]/90'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowPrivacyModal(false)}>
          <div className={`w-full max-w-sm p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative`} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowPrivacyModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200"><X size={20} /></button>
            <h3 className="text-lg font-medium mb-4 text-center">隐私守护协议</h3>
            <div className={`space-y-4 text-sm font-light leading-relaxed max-h-72 overflow-y-auto no-scrollbar ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <p><strong>1. 信息的温柔对待</strong><br/>你在宇宙中留下的每一句心语、每一次情绪打卡，都仅存储在你的设备本地（LocalStorage），我们不会收集或窥探你的内心世界。</p>
              <p><strong>2. 树洞的匿名法则</strong><br/>当你将心语发射至「微澜」树洞时，它们将化作无名星尘，抹去所有身份标识，仅传递温暖本身。</p>
              <p><strong>3. 梦境守护机制</strong><br/>对于您使用"潜意识梦境舱"进行的 AI 梦境解读，内容将采用无标识加密通道发送至解析节点，且仅为瞬时处理，不在云端做任何永久归档保存。</p>
              <p><strong>4. 数据控制权</strong><br/>你可以随时在「存储与隐私」中导出备份、导入恢复，或一键清除所有运行数据，让你的宇宙归于最初的虚空。</p>
              <p><strong>5. 无第三方追踪</strong><br/>本应用不集成任何第三方分析、广告或追踪 SDK。打开你的浏览器开发者工具，你能看到的所有网络请求都仅与版本更新检查有关。</p>
            </div>
          </div>
        </div>
      )}

      {/* --- 自定义确认弹窗 Modal --- */}
      {confirmDialog && (
        <div className={`fixed inset-0 z-[70] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setConfirmDialog(null)}>
          <div className={`w-full max-w-xs p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative text-center`} onClick={e => e.stopPropagation()}>
            <div className="mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-indigo-500/10 text-indigo-500">
              <AlertTriangle size={24} />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{confirmDialog.title}</h3>
            <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {confirmDialog.message}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDialog(null)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-[#1f1f2e] hover:bg-[#262638] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                取消
              </button>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} className="flex-1 py-3 rounded-xl text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors shadow-lg shadow-indigo-500/20 active:scale-95">
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 自定义信息提示弹窗 Modal --- */}
      {alertDialog && (
        <div className={`fixed inset-0 z-[70] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setAlertDialog(null)}>
          <div className={`w-full max-w-xs p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative text-center`} onClick={e => e.stopPropagation()}>
            <div className="mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-indigo-500/10 text-indigo-400">
              <CheckCircle2 size={24} />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{alertDialog.title}</h3>
            <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {alertDialog.message}
            </p>
            <button onClick={() => setAlertDialog(null)} className="w-full py-3 rounded-xl text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors shadow-lg shadow-indigo-500/20 active:scale-95">
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}