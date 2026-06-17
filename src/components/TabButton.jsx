/**
 * TabButton.jsx — 底部导航的单个 tab 按钮。
 *
 * 浮岛胶囊风格：图标+文字，选中态有药丸形高亮背景。
 * 根据主题切换配色，确保浅色模式下选中态清晰可见。
 */

export default function TabButton({ icon: Icon, label, active, onClick, isDark }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-300 active:scale-90 ${
        active
          ? (isDark ? 'bg-white/15' : 'bg-indigo-500 shadow-sm shadow-indigo-500/30')
          : (isDark ? 'bg-transparent hover:bg-white/5' : 'bg-transparent hover:bg-gray-100')
      }`}
    >
      <Icon
        size={20}
        className={`transition-colors duration-300 ${
          active
            ? (isDark ? 'text-white' : 'text-white')
            : (isDark ? 'text-gray-400' : 'text-gray-500')
        }`}
        strokeWidth={active ? 2 : 1.5}
      />
      <span
        className={`text-[10px] transition-colors duration-300 ${
          active
            ? (isDark ? 'text-white font-medium' : 'text-white font-medium')
            : (isDark ? 'text-gray-500' : 'text-gray-500')
        }`}
      >
        {label}
      </span>
    </button>
  );
}
