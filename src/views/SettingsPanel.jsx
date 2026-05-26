/**
 * SettingsPanel.jsx — "我的"右上齿轮打开的设置页。
 *
 * 顶到底分组：
 *   1) 视觉主题：浅色 / 深色 / 跟随系统
 *   2) 整体字号：滑动条 0.85x ~ 1.30x（影响 html font-size）
 *   3) 系统语言：只读显示 navigator.language
 *   4) 账号与安全：复制星际编号 / 导出数据 JSON / 导入数据 JSON
 *   5) 睡眠守护：睡前提醒开关 + 时间（注意：未接入 Web 推送，开关旁有
 *      "暂不支持推送" amber 标签提示用户；功能保留作 roadmap）
 *   6) 存储与隐私：本地用量统计 / 隐私协议弹窗 / 清空所有数据
 *   7) 关于息息：版本号 / 构建时间 / 检查更新按钮
 *   8) 开发者测试控制台：密码 186638 → 时空跃迁 / 注入温暖 / 撤销打卡 / 重置 / 毁灭重生
 *
 * 改什么：
 *   - **改开发者控制台密码 → 顶部 DEV_CONSOLE_PASSWORD 常量**
 *   - 改字号滑动条范围（默认 0.85-1.30）→ "整体字号"区块 input min/max
 *   - 改数据导出文件名 / 结构 → handleExportData
 *   - 改数据导入校验逻辑（目前只检查 parsed.userData 存在）→ handleImportFile
 *   - 改"清空所有数据"的二次确认文案 → handleClearAll
 *   - 改"检查更新"行为（目前对比 buildTime / version）→ handleCheckVersion
 *   - 加 / 改开发者测试按钮（mock 数据、撤销操作等）→ handleFillMockData /
 *     injectHugs / resetTodayCheckIn / resetPersonality / resetTreeholeLimits
 *   - 改隐私协议正文 → 文件底部 showPrivacyModal 那块
 *
 * 内部还有两个通用 modal：confirmDialog（红色危险确认）和 alertDialog（提示）。
 * 想做新的"先确认再执行"按钮，直接 setConfirmDialog({ title, message, onConfirm })
 * 就行，不用自己再写一套 modal。
 */

import { useState, useEffect, useRef } from 'react';
import { X, Compass, User, Moon, Info, ChevronDown, ChevronUp, ChevronRight, Trash2, Loader2, RotateCcw, Zap, Bug, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import { APP_VERSION, BUILD_TIME } from '../version.js';
import { formatBytes, getLanguageLabel } from '../utils.js';
import { INITIAL_USER_DATA } from '../constants.js';

// 开发者测试控制台访问密码
const DEV_CONSOLE_PASSWORD = '186638';

// 下拉栏：title 是常驻条，children 折叠展开
// 用 grid-rows 0fr ↔ 1fr 做平滑高度过渡（不需要测量子元素高度）
function Section({ id, title, icon: Icon, isDark, isOpen, onToggle, children, danger }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#171724]' : 'bg-white shadow-sm'}`}>
      <button
        onClick={() => onToggle(id)}
        className={`w-full px-4 py-3.5 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'}`}
        aria-expanded={isOpen}
      >
        <span className={`text-sm font-medium flex items-center gap-2 ${danger ? 'text-indigo-500' : ''}`}>
          {Icon && <Icon size={14} className={danger ? 'text-indigo-500' : (isDark ? 'text-gray-400' : 'text-gray-500')} />}
          {title}
        </span>
        <ChevronRight size={16} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className={`px-4 pb-4 pt-2 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// 设置面板：集合全部用户偏好 + 开发者控制台
export default function SettingsPanel({ isDark, theme, setTheme, userData, saveUserData, onClose, onReset }) {
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [alertDialog, setAlertDialog] = useState(null);

  // 下拉栏开合：默认全部收起（首屏干净）；用户点哪个开哪个
  const [openSections, setOpenSections] = useState(() => new Set());
  const toggleSection = (id) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 关于息息（版本检查）
  const [versionCheckState, setVersionCheckState] = useState('idle');
  const [latestVersionInfo, setLatestVersionInfo] = useState(null);

  // 隐私协议查看
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // 数据导入文件输入
  const fileInputRef = useRef(null);

  // 开发者测试控制台密码门
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

  // --- 检查更新 ---
  // 5 秒超时：网络差时不会永远 loading。AbortController 触发的 abort 会让 fetch
  // 抛 DOMException("AbortError")，被外层 catch 统一吞掉 → 显示"无法连接宇宙网络"。
  const handleCheckVersion = async () => {
    setVersionCheckState('checking');
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch(
        `${import.meta.env.BASE_URL}version.json?t=${Date.now()}`,
        { cache: 'no-store', signal: ctrl.signal }
      );
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setLatestVersionInfo(data);
      const isNewer =
        (data.buildTime && BUILD_TIME && data.buildTime > BUILD_TIME) ||
        (data.version && data.version !== APP_VERSION);
      setVersionCheckState(isNewer ? 'update' : 'latest');
    } catch (e) {
      setVersionCheckState('error');
    } finally {
      clearTimeout(timeoutId);
    }
  };
  const handleApplyUpdate = () => { window.location.reload(); };

  // --- 复制星际编号 ---
  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(userData.id);
      setAlertDialog({ title: '复制成功', message: `星际编号 ${userData.id} 已复制到剪贴板。` });
    } catch {
      setAlertDialog({ title: '请手动复制', message: `星际编号：${userData.id}` });
    }
  };

  // --- 导出数据备份 JSON ---
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

  // --- 导入数据恢复 ---
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

  // --- 用量统计 ---
  const dataString = JSON.stringify(userData);
  const dataBytes = new Blob([dataString]).size;
  const checkInCount = userData.checkInHistory?.length || 0;
  const dreamCount = userData.dreamLogs?.length || 0;
  const whisperCount = userData.myWhispers?.length || 0;

  const [storageQuota, setStorageQuota] = useState(null);
  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(est => {
        setStorageQuota({ usage: est.usage || 0, quota: est.quota || 0 });
      }).catch(() => {});
    }
  }, []);

  const handleClearAll = () => {
    setConfirmDialog({
      title: '清空所有数据',
      message: '所有打卡、梦境、心语、徽章都将被清除，此操作不可撤销。确定吗？',
      onConfirm: () => { onReset(); }
    });
  };

  const language = getLanguageLabel();

  // --- 开发者控制台行为 ---
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

  const injectHugs = () => {
    saveUserData({ ...userData, totalHugs: userData.totalHugs + 50 });
    setAlertDialog({ title: '注入成功', message: '已注入 50 次温暖传递，所有称号徽章现已解锁！' });
  };

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

  const resetPersonality = () => {
    saveUserData({ ...userData, personality: null });
    setAlertDialog({ title: '重置成功', message: '已清除宇宙性格数据，入口已恢复，可重新进行内宇宙探测！' });
  };

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

      <Section id="theme" title="视觉主题" isDark={isDark} isOpen={openSections.has('theme')} onToggle={toggleSection}>
        <div className={`p-1 rounded-2xl flex ${isDark ? 'bg-[#0f0f1a]' : 'bg-gray-100'}`}>
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
      </Section>

      {/* === 整体字号 === */}
      <Section id="font" title="整体字号" isDark={isDark} isOpen={openSections.has('font')} onToggle={toggleSection}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>偏小</span>
            <span className="text-base font-medium">示例文字 · Aa</span>
            <span className={`text-xl font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>偏大</span>
          </div>
          {/*
            字号滑动条：拖动时只更新内存（persist=false），松手时才一次性落盘。
            - onChange  拖动每一步触发：高频，所以不写 localStorage
            - onMouseUp / onTouchEnd  释放时触发：写一次 localStorage
            - onBlur                  键盘用户调完上下键后切到下个控件时落盘
          */}
          <input
            type="range"
            min="0.85"
            max="1.3"
            step="0.05"
            value={userData.fontScale ?? INITIAL_USER_DATA.fontScale}
            onChange={(e) => saveUserData({ ...userData, fontScale: parseFloat(e.target.value) }, false)}
            onMouseUp={(e) => saveUserData({ ...userData, fontScale: parseFloat(e.target.value) }, true)}
            onTouchEnd={(e) => saveUserData({ ...userData, fontScale: parseFloat(e.target.value) }, true)}
            onBlur={(e) => saveUserData({ ...userData, fontScale: parseFloat(e.target.value) }, true)}
            className="font-scale-slider w-full"
          />
          <div className="flex justify-between mt-2 text-[10px] text-gray-500">
            <span>85%</span>
            <span>当前 {Math.round(((userData.fontScale ?? INITIAL_USER_DATA.fontScale)) * 100)}%</span>
            <span>130%</span>
          </div>
          <button
            onClick={() => saveUserData({ ...userData, fontScale: INITIAL_USER_DATA.fontScale })}
            className={`mt-3 w-full py-2 rounded-xl text-xs font-medium transition-colors ${
              isDark
                ? 'bg-[#0f0f1a] text-gray-400 hover:text-gray-200'
                : 'bg-gray-50 text-gray-500 hover:text-gray-700'
            }`}
          >
            恢复默认 ({Math.round(INITIAL_USER_DATA.fontScale * 100)}%)
          </button>
        </div>
      </Section>

      {/* === 系统语言 === */}
      <Section id="lang" title="系统语言" icon={Compass} isDark={isDark} isOpen={openSections.has('lang')} onToggle={toggleSection}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">{language.label}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{language.code} · 跟随浏览器设置</p>
          </div>
          <span className={`text-[10px] px-2 py-1 rounded-md ${isDark ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-500'}`}>自动</span>
        </div>
      </Section>

      {/* === 账号与安全 === */}
      <Section id="account" title="账号与安全" icon={User} isDark={isDark} isOpen={openSections.has('account')} onToggle={toggleSection}>
        <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#0f0f1a]' : 'bg-gray-50/60'}`}>
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
        <p className="text-[11px] text-gray-500 mt-2">
          数据仅存于本机，导出文件即唯一备份，请妥善保管。
        </p>
      </Section>

      <Section id="reminder" title="睡眠守护" icon={Moon} isDark={isDark} isOpen={openSections.has('reminder')} onToggle={toggleSection}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">睡前提醒</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-600'
              }`}>
                暂不支持推送
              </span>
            </div>
            <button
              onClick={() => saveUserData({...userData, reminderEnabled: !userData.reminderEnabled})}
              className={`w-12 h-6 rounded-full transition-colors relative ${userData.reminderEnabled ? 'bg-indigo-500' : (isDark ? 'bg-gray-700' : 'bg-gray-300')}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all`} style={{ left: userData.reminderEnabled ? 'calc(100% - 22px)' : '2px' }}></div>
            </button>
          </div>

          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            此功能尚未接入 Web 推送，开启后<b>不会</b>真的发出系统通知。
            目前请用手机自带的闹钟陪你睡前 wind down，未来版本会补上 Service Worker 推送实现。
          </p>

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
      </Section>

      {/* === 存储与隐私 === */}
      <Section id="privacy" title="存储与隐私" icon={Trash2} isDark={isDark} isOpen={openSections.has('privacy')} onToggle={toggleSection}>
        <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#0f0f1a]' : 'bg-gray-50/60'}`}>
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

          <button onClick={() => setShowPrivacyModal(true)} className={`w-full p-4 flex items-center justify-between border-b transition-colors ${isDark ? 'border-gray-800 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <User size={16} className="text-gray-400" />
              <span className="text-sm">隐私守护协议</span>
            </div>
            <ChevronRight size={16} className="text-gray-500" />
          </button>

          <button onClick={handleClearAll} className={`w-full p-4 flex items-center justify-between text-red-500 transition-colors ${isDark ? 'hover:bg-red-500/5' : 'hover:bg-red-50'}`}>
            <div className="flex items-center gap-3">
              <Trash2 size={16} />
              <span className="text-sm">清空所有数据</span>
            </div>
            <ChevronRight size={16} className="text-red-400/50" />
          </button>
        </div>
        <p className="text-[11px] text-gray-500 mt-2">
          清空操作不可撤销，建议先导出备份。
        </p>
      </Section>

      {/* === 关于息息 === */}
      <Section id="about" title="关于息息" icon={Info} isDark={isDark} isOpen={openSections.has('about')} onToggle={toggleSection}>
        <div>
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
      </Section>

      {/* 开发者测试控制台 */}
      <Section id="dev" title="开发者测试控制台" icon={Bug} isDark={isDark} isOpen={openSections.has('dev')} onToggle={toggleSection} danger>
        {devUnlocked && (
          <div className="flex justify-end mb-3">
            <button
              onClick={() => { setDevUnlocked(false); setDevPasswordInput(''); setDevPasswordError(false); }}
              className="text-[10px] font-normal text-gray-500 hover:text-indigo-400 underline-offset-2 hover:underline"
              title="锁定控制台"
            >
              锁定
            </button>
          </div>
        )}

        {!devUnlocked ? (
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
              onConfirm: () => { onReset(); }
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
      </Section>

      {/* === 隐私守护协议弹窗 === */}
      {showPrivacyModal && (
        <Portal>
          <div className={`fixed inset-0 z-[70] flex items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]/90' : 'bg-[#f8fafc]/90'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowPrivacyModal(false)}>
            <div className={`w-full max-w-sm p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative`} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowPrivacyModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200"><X size={20} /></button>
              <h3 className="text-lg font-medium mb-4 text-center">隐私守护协议</h3>
              <div className={`space-y-4 text-sm font-light leading-relaxed max-h-72 overflow-y-auto no-scrollbar ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <p><strong>1. 信息的温柔对待</strong><br/>你在宇宙中留下的每一句心语、每一次情绪打卡、每一段梦境，都仅存储在你的设备本地（浏览器 LocalStorage），我们没有任何服务器，也无法收集或窥探你的内心世界。</p>
                <p><strong>2. 树洞的匿名法则</strong><br/>你写下的心语会保存在你自己设备上的"我的信号"里。当前版本「星际回音」展示的是示例内容，并未接入任何远程服务，也没有把你的内容发送出去。</p>
                <p><strong>3. 梦境完全本机处理</strong><br/>「潜意识梦境舱」的"宇宙寄语"完全由你设备上的本地代码生成，不向任何外部接口发送你的梦境内容。</p>
                <p><strong>4. 数据控制权</strong><br/>你可以随时在「存储与隐私」中导出备份、导入恢复，或一键清除所有运行数据，让你的宇宙归于最初的虚空。</p>
                <p><strong>5. 网络请求范围</strong><br/>本应用不集成第三方分析、广告或追踪 SDK。App 唯一的对外请求是检查更新（拉取部署目录下的 <code>version.json</code>），不携带任何个人数据。</p>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* --- 自定义确认弹窗 Modal --- */}
      {confirmDialog && (
        <Portal>
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
        </Portal>
      )}

      {/* --- 自定义信息提示弹窗 Modal --- */}
      {alertDialog && (
        <Portal>
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
        </Portal>
      )}
    </div>
  );
}
