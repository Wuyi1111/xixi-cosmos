/**
 * utils.js — 纯函数工具，无副作用。
 *
 * - formatBytes(bytes): 把字节数变成 "12.34 KB" / "1.20 MB" 这种可读字符串
 * - getLanguageLabel(): 读 navigator.language，返回 { code, label }（如 zh-CN → "简体中文"）
 * - computeStreakInfo(userData, currentDateStr): 从 checkInHistory 推导出
 *      lastCheckInDate / hasCheckedInToday / displayContinuousDays。
 *      StarView + GalaxyView 都用这个，避免每个 view 各自抄一遍逻辑。
 *
 * 加新的小工具函数也放这里。
 */

// 把字节数格式化为 KB / MB
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// 友好显示浏览器/系统语言
export function getLanguageLabel() {
  const lang = (typeof navigator !== 'undefined' && navigator.language) || 'zh-CN';
  const map = {
    'zh-CN': '简体中文', 'zh-TW': '繁體中文', 'zh-HK': '繁體中文（香港）', 'zh': '中文',
    'en-US': 'English (US)', 'en-GB': 'English (UK)', 'en': 'English',
    'ja-JP': '日本語', 'ja': '日本語', 'ko-KR': '한국어', 'ko': '한국어',
  };
  return { code: lang, label: map[lang] || map[lang.split('-')[0]] || lang };
}

// 从 checkInHistory 推导今天的打卡状态 + "显示用"连签天数
// - lastCheckInDate：最近一次打卡的日期字符串（toDateString 格式）
// - hasCheckedInToday：今天打过卡了
// - displayContinuousDays：基础是 userData.continuousDays，但如果今天没打卡
//   且上次打卡不是昨天 → 连签已断 → 显示 0（不修改实际 userData）
export function computeStreakInfo(userData, currentDateStr) {
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

  return { lastCheckInDate, hasCheckedInToday, displayContinuousDays };
}
