/**
 * TabButton.jsx — 底部导航的单个 tab 按钮。
 *
 * 深色胶囊风格：无文字标签，选中态白色 + 下方小圆点指示器。
 */

export default function TabButton({ icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center w-12 h-12 transition-transform active:scale-90"
    >
      <Icon
        size={22}
        className={`transition-colors duration-200 ${
          active ? 'text-white' : 'text-gray-500'
        }`}
        strokeWidth={active ? 2.5 : 2}
      />
      {/* 选中指示器小圆点 */}
      <span
        className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-200 ${
          active ? 'bg-white opacity-100' : 'bg-transparent opacity-0'
        }`}
      />
    </button>
  );
}
