// --- 组件：底部Tab按钮 ---
export default function TabButton({ id, icon: Icon, label, active, onClick, isDark }) {
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
