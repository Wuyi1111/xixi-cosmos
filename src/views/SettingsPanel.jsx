import { useState, useEffect, useRef } from 'react';
import { X, Compass, User, ChevronDown, ChevronUp, ChevronRight, Trash2, Loader2, RotateCcw, Zap, Bug, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import { APP_VERSION, BUILD_TIME } from '../version.js';
import { formatBytes, getLanguageLabel } from '../utils.js';

// 开发者测试控制台访问密码
const DEV_CONSOLE_PASSWORD = '186638';

// 设置面板：集合全部用户偏好 + 开发者控制台
export default function SettingsPanel({ isDark, theme, setTheme, userData, saveUserData, onClose, onReset }) {
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [alertDialog, setAlertDialog] = useState(null);

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
            <span className="text-base font-medium">示例文字 · Aa</span>
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
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all`} style={{ left: userData.reminderEnabled ? 'calc(100% - 22px)' : '2px' }}></div>
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

      {/* 开发者测试控制台 */}
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
      </div>

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
