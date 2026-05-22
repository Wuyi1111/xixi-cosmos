/**
 * GalaxyView.jsx — "星系"成长图谱。
 *
 * 屏幕从上到下：
 *   1) 头部统计："连续驻留 N 夜晚" + "星尘数量"
 *   2) 星系可视化卡：根据 totalDays 渐进解锁层级
 *      0 天：紫色弥散云团
 *      1 天：+ 颜色渐变内核
 *      7 天：+ 中央太阳
 *      14 天：+ 倾斜星环
 *      21 天：+ 公转伴星
 *      30 天：+ 第二条逆时针轨道
 *      60 天：+ 整体自转晕染
 *   3) 星轨里程碑印记：7 个徽章卡片（点击弹出详情）
 *
 * 改什么：
 *   - 加 / 改阶段、改解锁天数 → src/constants.js 的 MILESTONES
 *     （注意 milestoneIcons 数组里 emoji 顺序要和 MILESTONES.id 对齐）
 *   - 调光晕跟随手指的灵敏度 / 阻尼 → layersRef 三层的 factor / scaleFactor / dragScale
 *   - 改光晕拖动的最大偏移半径（默认 60px）→ MAX_OFFSET
 *   - 改各阶段的具体视觉（颜色 / 大小 / 动画）→ renderGalaxyVisual 里
 *     `days >= N && (...)` 的条件块
 *
 * 性能注意：useEffect 里的 RAF 循环 60fps 一直跑，即使光晕在中心也每帧重写
 *          transform。在 galaxy tab 切走时 effect cleanup 会停。可以加
 *          "已静止则停 RAF" 短路再 wake，但目前无感知问题。
 */

import { useState, useEffect, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import { MILESTONES } from '../constants.js';

// --- 页面 3：星系 (Galaxy) ---
export default function GalaxyView({ isDark, userData, saveUserData, currentDateStr }) {
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  const currentMilestoneIndex = (() => {
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (userData.totalDays >= MILESTONES[i].days) return i;
    }
    return 0;
  })();
  const currentMilestone = MILESTONES[currentMilestoneIndex];
  const milestoneIcons = ['🌌', '🌫️', '⭐', '🪐', '💫', '🌗', '🌀'];

  // === 光晕跟随手指：RAF 多层缓动，模拟云雾散开 ===
  const glowAreaRef = useRef(null);
  const ambientRef = useRef(null);
  const mainGlowRef = useRef(null);
  const coreGlowRef = useRef(null);
  const targetOffsetRef = useRef({ x: 0, y: 0 });
  const layersRef = useRef([
    { x: 0, y: 0, scale: 1, factor: 0.06, scaleFactor: 0.12, dragScale: 1.18 },
    { x: 0, y: 0, scale: 1, factor: 0.13, scaleFactor: 0.15, dragScale: 1.12 },
    { x: 0, y: 0, scale: 1, factor: 0.24, scaleFactor: 0.18, dragScale: 1.06 },
  ]);
  const draggingRef = useRef(false);

  const MAX_OFFSET = 60;

  const updateTarget = (clientX, clientY) => {
    const el = glowAreaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = clientX - rect.left - rect.width / 2;
    const dy = clientY - rect.top - rect.height / 2;
    targetOffsetRef.current = {
      x: Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dx * 0.65)),
      y: Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dy * 0.65)),
    };
  };

  useEffect(() => {
    let raf;
    let active = true;
    const refs = [ambientRef, mainGlowRef, coreGlowRef];

    const tick = () => {
      const t = targetOffsetRef.current;
      const dragging = draggingRef.current;

      for (let i = 0; i < layersRef.current.length; i++) {
        const layer = layersRef.current[i];
        layer.x += (t.x - layer.x) * layer.factor;
        layer.y += (t.y - layer.y) * layer.factor;
        const targetScale = dragging ? layer.dragScale : 1;
        layer.scale += (targetScale - layer.scale) * layer.scaleFactor;

        const el = refs[i].current;
        if (el) {
          el.style.transform =
            `translate3d(${layer.x.toFixed(2)}px, ${layer.y.toFixed(2)}px, 0) scale(${layer.scale.toFixed(3)})`;
        }
      }
      if (active) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { active = false; cancelAnimationFrame(raf); };
  }, []);

  const onGlowDown = (e) => {
    draggingRef.current = true;
    const t = e.touches?.[0];
    if (t) updateTarget(t.clientX, t.clientY);
    else updateTarget(e.clientX, e.clientY);
  };
  const onGlowMove = (e) => {
    if (!draggingRef.current) return;
    const t = e.touches?.[0];
    if (t) updateTarget(t.clientX, t.clientY);
    else updateTarget(e.clientX, e.clientY);
  };
  const onGlowEnd = () => {
    draggingRef.current = false;
    targetOffsetRef.current = { x: 0, y: 0 };
  };

  const days = userData.totalDays;
  const followTransitionStyle = { willChange: 'transform' };

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
      <div
        ref={glowAreaRef}
        data-no-pull-refresh="true"
        onTouchStart={onGlowDown}
        onTouchMove={onGlowMove}
        onTouchEnd={onGlowEnd}
        onTouchCancel={onGlowEnd}
        onMouseDown={onGlowDown}
        onMouseMove={onGlowMove}
        onMouseUp={onGlowEnd}
        onMouseLeave={onGlowEnd}
        style={{ touchAction: 'none' }}
        className={`py-8 rounded-[32px] border space-y-6 relative overflow-hidden flex flex-col items-center select-none cursor-grab active:cursor-grabbing ${isDark ? 'bg-black/20 border-indigo-500/10' : 'bg-indigo-50/50 border-indigo-100 shadow-sm'}`}
      >
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* 外层弥散云团：最慢、最朦胧 */}
          <div
            ref={ambientRef}
            className={`absolute -inset-2 rounded-full filter blur-[40px] opacity-70 ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-400/20'}`}
            style={followTransitionStyle}
          ></div>

          {/* 主光晕：中速跟随 */}
          <div
            ref={mainGlowRef}
            className="absolute inset-4 bg-indigo-600/10 rounded-full filter blur-xl animate-pulse"
            style={followTransitionStyle}
          ></div>

          {days >= 0 && (
            <div className={`absolute inset-0 border rounded-full galaxy-spin ${isDark ? 'border-white/5' : 'border-indigo-200/50'}`}></div>
          )}
          {days >= 1 && (
            <div
              ref={coreGlowRef}
              className="absolute inset-4 bg-gradient-to-tr from-indigo-500/10 to-blue-500/10 rounded-full filter blur-md animate-pulse"
              style={followTransitionStyle}
            ></div>
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

        <div className="space-y-1 z-10 px-6 text-center pointer-events-none">
          <span className={`text-[10px] px-3 py-1 rounded-full border ${isDark ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-indigo-100 text-indigo-600 border-indigo-200'}`}>
            阶段 {currentMilestoneIndex + 1}：{currentMilestone.name}
          </span>
          <p className={`text-xs pt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{currentMilestone.desc}</p>
        </div>
      </div>

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
        <Portal>
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
        </Portal>
      )}
    </div>
  );
}
