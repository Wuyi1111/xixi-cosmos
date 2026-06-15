/**
 * TabButton.jsx — 底部导航的单个 tab 按钮。
 *
 * 浮岛胶囊风格：图标+文字，选中态有药丸形高亮背景。
 */

export default function TabButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-300 active:scale-90 ${
        active
          ? 'bg-white/15'
          : 'bg-transparent hover:bg-white/5'
      }`}
    >
      <Icon
        size={20}
        className={`transition-colors duration-300 ${
          active ? 'text-white' : 'text-gray-400'
        }`}
        strokeWidth={active ? 2.5 : 2}
      />
      <span
        className={`text-[10px] transition-colors duration-300 ${
          active ? 'text-white font-medium' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
