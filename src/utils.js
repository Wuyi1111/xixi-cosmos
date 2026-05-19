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
