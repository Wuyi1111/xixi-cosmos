/**
 * GalaxyView.jsx — "星系"板块（v4.24.0 重构版）
 *
 * 方案：A（成就驱动）+ C（动态星系概览）结合
 *
 * 页面结构：
 *   1) 今日星系状态 — 阶段图标 + 进度 + 坐标/连续夜/星尘
 *   2) 星系概览 — 中央大星球 + 环绕小星球（动态轨道）
 *   3) 星系里程碑 — 横向时间轴，当前高亮，已完成✓，未解锁灰色
 *   4) 同星系排名 — 前3名+自己，增加"距离上一名还差XX星尘"
 *   5) 超新星 — 底部半屏抽屉
 */

import { useState } from 'react';
import { MapPin, Moon, Sparkles, Star, Trophy, ChevronDown, Zap, Users, Target } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import { computeStreakInfo } from '../utils.js';

// 星系发展阶段
const GALAXY_STAGES = [
  { id: 0, name: '虚空尘埃', desc: '微光在虚空中闪烁', minStardust: 0, color: 'gray', icon: '💨' },
  { id: 1, name: '星雾聚集', desc: '紫色光晕开始聚拢', minStardust: 500, color: 'purple', icon: '🌫️' },
  { id: 2, name: '初生星核', desc: '中央主星体诞生', minStardust: 2000, color: 'amber', icon: '⭐' },
  { id: 3, name: '星环觉醒', desc: '星环缓缓展开', minStardust: 5000, color: 'blue', icon: '💫' },
  { id: 4, name: '伴星环绕', desc: '小星体开始公转', minStardust: 10000, color: 'amber', icon: '🪐' },
  { id: 5, name: '双月引力', desc: '星系引力场增强', minStardust: 20000, color: 'amber', icon: '🌙' },
  { id: 6, name: '宁静星系', desc: '星系进入稳定运转', minStardust: 50000, color: 'amber', icon: '🌌' },
];

// 模拟同星系用户排名
const MOCK_RANKINGS = [
  { id: 'TR0312', name: '星海旅人', avatar: '🌌', stardust: 2840 },
  { id: 'TR1989', name: '月行者', avatar: '🌙', stardust: 2156 },
  { id: 'TR0007', name: '星云漫步', avatar: '🪐', stardust: 1890 },
  { id: 'TR2024', name: '极光猎人', avatar: '☄️', stardust: 1650 },
  { id: 'TR0411', name: '深空观测', avatar: '✨', stardust: 1420 },
  { id: 'TR8888', name: '星际漫游', avatar: '💫', stardust: 1280 },
  { id: 'TR0521', name: '彗星尾巴', avatar: '🌟', stardust: 980 },
  { id: 'TR1101', name: '银河拾荒', avatar: '🌠', stardust: 860 },
];

export default function GalaxyView({ isDark, userData, currentDateStr }) {
  const [showSupernovaRules, setShowSupernovaRules] = useState(false);
  const [rankingExpanded, setRankingExpanded] = useState(false);

  // 计算星系总星尘
  const galaxyTotalStardust = userData.stardust + MOCK_RANKINGS.reduce((sum, u) => sum + u.stardust, 0);

  // 超新星数量
  const supernovaCount = Math.floor((userData.totalHugs + userData.totalFollows) / 10) + 3;

  // 当前星系阶段
  const currentStage = [...GALAXY_STAGES].reverse().find(s => galaxyTotalStardust >= s.minStardust) || GALAXY_STAGES[0];
  const nextStage = GALAXY_STAGES.find(s => s.minStardust > galaxyTotalStardust);
  const progressToNext = nextStage
    ? Math.min(100, Math.round(((galaxyTotalStardust - currentStage.minStardust) / (nextStage.minStardust - currentStage.minStardust)) * 100))
    : 100;

  // 同星系排名
  const allRankings = [
    ...MOCK_RANKINGS,
    { id: userData.id, name: userData.displayName, avatar: userData.avatarEmoji, stardust: userData.stardust, isMe: true },
  ].sort((a, b) => b.stardust - a.stardust);

  const myRankIndex = allRankings.findIndex(r => r.isMe);
  const myRank = myRankIndex + 1;
  const prevUser = myRankIndex > 0 ? allRankings[myRankIndex - 1] : null;
  const gapToPrev = prevUser ? prevUser.stardust - userData.stardust : 0;

  // 连续夜晚
  const { displayContinuousDays } = computeStreakInfo(userData, currentDateStr);

  const stageColorMap = {
    gray: isDark ? 'text-gray-400' : 'text-gray-500',
    purple: isDark ? 'text-purple-400' : 'text-purple-500',
    amber: isDark ? 'text-amber-400' : 'text-amber-500',
    blue: isDark ? 'text-blue-400' : 'text-blue-500',
  };

  const stageBgMap = {
    gray: isDark ? 'bg-gray-500/15 border-gray-500/25' : 'bg-gray-100 border-gray-200',
    purple: isDark ? 'bg-purple-500/15 border-purple-500/25' : 'bg-purple-50 border-purple-200',
    amber: isDark ? 'bg-amber-500/15 border-amber-500/25' : 'bg-amber-50 border-amber-200',
    blue: isDark ? 'bg-blue-500/15 border-blue-500/25' : 'bg-blue-50 border-blue-200',
  };

  const stageDotMap = {
    gray: isDark ? 'bg-gray-500' : 'bg-gray-400',
    purple: isDark ? 'bg-purple-500' : 'bg-purple-400',
    amber: isDark ? 'bg-amber-500' : 'bg-amber-400',
    blue: isDark ? 'bg-blue-500' : 'bg-blue-400',
  };

  return (
    <div className="animate-fade-in pb-10 space-y-5">
      {/* === 1. 今日星系状态 === */}
      <div className={`p-4 rounded-[20px] border ${isDark ? 'bg-[#171724] border-white/5' : 'bg-white border-gray-100'} shadow-sm`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${stageBgMap[currentStage.color]}`}>
            {currentStage.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`text-sm font-medium ${stageColorMap[currentStage.color]}`}>{currentStage.name}</h2>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{currentStage.desc}</p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-medium ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{progressToNext}%</p>
            <p className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>阶段进度</p>
          </div>
        </div>

        {/* 进度条 */}
        {nextStage && (
          <div className="mb-3">
            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-100'}`}>
              <div className={`h-full rounded-full transition-all duration-1000 ${isDark ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`} style={{ width: `${progressToNext}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>距离 {nextStage.name}</span>
              <span className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>还需 {(nextStage.minStardust - galaxyTotalStardust).toLocaleString()} 星尘</span>
            </div>
          </div>
        )}

        {/* 三指标 */}
        <div className="flex items-center justify-between pt-2 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}">
          <div className="flex items-center gap-1">
            <MapPin size={10} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>#{userData.id}</span>
          </div>
          <div className="flex items-center gap-1">
            <Moon size={10} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
            <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{displayContinuousDays} 夜</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles size={10} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
            <span className={`text-[10px] font-medium ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{userData.stardust}</span>
          </div>
        </div>
      </div>

      {/* === 2. 星系概览 — 动态星球环绕 === */}
      <div className={`p-6 rounded-[24px] relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#171724] border border-amber-500/15' : 'bg-gradient-to-br from-amber-50/70 to-white border border-amber-100'}`}>
        <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full bg-amber-300/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-6 w-24 h-24 rounded-full bg-orange-300/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* 标题 */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-light tracking-wide">宁静星系</h2>
            <button
              onClick={() => setShowSupernovaRules(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] transition-all active:scale-95 ${isDark ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
            >
              <Star size={10} />
              {supernovaCount} 超新星
            </button>
          </div>

          {/* 动态星系视觉 */}
          <div className="relative w-full aspect-square max-w-[240px] mx-auto mb-5">
            {/* 外轨道环 */}
            <div className={`absolute inset-0 rounded-full border border-dashed ${isDark ? 'border-amber-500/15' : 'border-amber-200'} galaxy-spin`} style={{ animationDuration: '30s' }} />
            <div className={`absolute inset-[15%] rounded-full border border-dashed ${isDark ? 'border-amber-500/10' : 'border-amber-100'} galaxy-spin`} style={{ animationDuration: '20s', animationDirection: 'reverse' }} />

            {/* 环绕小星球 — 代表其他用户 */}
            {MOCK_RANKINGS.slice(0, 5).map((user, i) => {
              const angle = (i * 72 + 15) * (Math.PI / 180);
              const radius = 42; // %
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);
              return (
                <div
                  key={user.id}
                  className="absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center text-sm animate-float"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: `${3 + i * 0.3}s`,
                  }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${isDark ? 'bg-[#1f1f2e] border border-white/10' : 'bg-white border border-gray-100'} shadow-sm`}>
                    {user.avatar}
                  </div>
                </div>
              );
            })}

            {/* 中央大星球 — 代表自己 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* 光晕 */}
                <div className={`absolute -inset-4 rounded-full ${isDark ? 'bg-amber-500/10' : 'bg-amber-100'} animate-pulse`} />
                <div className={`absolute -inset-2 rounded-full ${isDark ? 'bg-amber-400/15' : 'bg-amber-50'} animate-pulse`} style={{ animationDelay: '0.5s' }} />
                {/* 本体 */}
                <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-2xl ${isDark ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30' : 'bg-gradient-to-br from-amber-100 to-orange-50 border border-amber-200'}`}>
                  {userData.avatarEmoji}
                </div>
                {/* 标签 */}
                <div className={`absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-600'}`}>
                  你
                </div>
              </div>
            </div>
          </div>

          {/* 数据 */}
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className={`text-xl font-medium ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{galaxyTotalStardust.toLocaleString()}</p>
              <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>累计星尘</p>
            </div>
            <div className="text-center">
              <p className={`text-xl font-medium ${isDark ? 'text-amber-300' : 'text-amber-500'}`}>{MOCK_RANKINGS.length + 1}</p>
              <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>星旅人</p>
            </div>
          </div>
        </div>
      </div>

      {/* === 3. 星系里程碑 — 横向时间轴 === */}
      <div className={`rounded-[20px] border overflow-hidden ${isDark ? 'bg-[#171724] border-white/5' : 'bg-white border-gray-100'} shadow-sm`}>
        <div className="p-4 flex items-center gap-2">
          <Zap size={14} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
          <h3 className="text-sm font-medium">星系里程碑</h3>
        </div>

        {/* 横向时间轴 */}
        <div className="px-4 pb-4 overflow-x-auto no-scrollbar">
          <div className="flex items-start gap-0 min-w-max">
            {GALAXY_STAGES.map((stage, index) => {
              const isCurrent = stage.id === currentStage.id;
              const isPast = stage.minStardust < currentStage.minStardust;
              const isFuture = !isCurrent && !isPast;

              return (
                <div key={stage.id} className="flex items-start">
                  {/* 节点 */}
                  <div className="flex flex-col items-center" style={{ width: '64px' }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                      isCurrent
                        ? (isDark ? 'bg-amber-500/20 text-amber-300 ring-2 ring-amber-500/50' : 'bg-amber-100 text-amber-600 ring-2 ring-amber-300')
                        : isPast
                          ? (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-500')
                          : (isDark ? 'bg-[#1f1f2e] text-gray-600' : 'bg-gray-100 text-gray-400')
                    }`}>
                      {isPast ? '✓' : stage.icon}
                    </div>
                    <p className={`text-[9px] mt-1.5 text-center leading-tight ${
                      isCurrent ? (isDark ? 'text-amber-300 font-medium' : 'text-amber-600 font-medium')
                        : isPast ? (isDark ? 'text-gray-400' : 'text-gray-500')
                        : (isDark ? 'text-gray-600' : 'text-gray-400')
                    }`}>
                      {stage.name}
                    </p>
                    <p className={`text-[8px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      {stage.minStardust >= 1000 ? `${(stage.minStardust / 1000).toFixed(0)}k` : stage.minStardust}
                    </p>
                  </div>

                  {/* 连接线 */}
                  {index < GALAXY_STAGES.length - 1 && (
                    <div className="flex-1 flex items-center justify-center" style={{ width: '24px', marginTop: '16px' }}>
                      <div className={`h-0.5 w-full ${
                        isPast ? (isDark ? 'bg-amber-500/40' : 'bg-amber-300')
                          : (isDark ? 'bg-gray-800' : 'bg-gray-200')
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* === 4. 同星系排名 — 增加追赶提示 === */}
      <div className={`rounded-[20px] border overflow-hidden ${isDark ? 'bg-[#171724] border-white/5' : 'bg-white border-gray-100'} shadow-sm`}>
        {/* 标题栏 */}
        <div
          onClick={() => setRankingExpanded(!rankingExpanded)}
          className="p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2">
            <Trophy size={14} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
            <h3 className="text-sm font-medium">同星系排名</h3>
          </div>
          <div className="flex items-center gap-2">
            {myRank > 1 && gapToPrev > 0 && (
              <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                <Target size={10} />
                差 {gapToPrev} 星尘
              </span>
            )}
            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>第 {myRank} 名</span>
            <div className={`transition-transform duration-300 ${rankingExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
            </div>
          </div>
        </div>

        {/* 前3名 + 自己 */}
        <div className="px-4 pb-3 space-y-2">
          {allRankings.slice(0, 3).map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                user.isMe ? (isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100') : (isDark ? 'bg-[#1f1f2e]/50' : 'bg-gray-50/50')
              }`}
            >
              <span className={`text-xs font-medium w-5 text-center ${
                index === 0 ? (isDark ? 'text-amber-400' : 'text-amber-500')
                : index === 1 ? (isDark ? 'text-gray-300' : 'text-gray-400')
                : index === 2 ? (isDark ? 'text-orange-400' : 'text-orange-500')
                : (isDark ? 'text-gray-500' : 'text-gray-400')
              }`}>
                {index + 1}
              </span>
              <span className="text-lg">{user.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${user.isMe ? (isDark ? 'text-amber-300' : 'text-amber-600') : (isDark ? 'text-gray-200' : 'text-gray-700')}`}>
                  {user.name} {user.isMe && '(你)'}
                </p>
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                {user.stardust}
              </span>
            </div>
          ))}

          {/* 自己如果不在前3 */}
          {myRank > 3 && (
            <div className={`p-3 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium w-5 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{myRank}</span>
                <span className="text-lg">{userData.avatarEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{userData.displayName} (你)</p>
                </div>
                <span className={`text-xs font-medium ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{userData.stardust}</span>
              </div>
            </div>
          )}
        </div>

        {/* 其余排名 — 折叠 */}
        <div className={`grid transition-all duration-300 ease-in-out ${rankingExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2">
              {allRankings.slice(3).filter(u => !u.isMe).map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-[#1f1f2e]/30' : 'bg-gray-50/30'}`}
                >
                  <span className={`text-xs font-medium w-5 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{index + 4}</span>
                  <span className="text-lg">{user.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{user.name}</p>
                  </div>
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.stardust}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <div className={`px-4 pb-3 ${rankingExpanded ? '' : 'pt-2'}`}>
          <p className={`text-[10px] text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <Users size={10} className="inline mr-1" />
            同星系共 {MOCK_RANKINGS.length + 1} 人
          </p>
        </div>
      </div>

      {/* === 5. 超新星规则 — 底部半屏抽屉 === */}
      {showSupernovaRules && (
        <Portal>
          <div
            className={`fixed inset-0 z-[60] ${isDark ? 'bg-[#0f0f1a]/60' : 'bg-[#f8fafc]/60'} backdrop-blur-sm animate-fade-in`}
            onClick={() => setShowSupernovaRules(false)}
          >
            <div
              className={`absolute bottom-0 left-0 right-0 p-6 rounded-t-[28px] ${isDark ? 'bg-[#171724] border-t border-white/5' : 'bg-white border-t border-gray-100 shadow-xl'} max-h-[70vh] overflow-y-auto no-scrollbar`}
              onClick={e => e.stopPropagation()}
            >
              {/* 拖动指示条 */}
              <div className="flex justify-center mb-4">
                <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
              </div>

              <h3 className="text-lg font-medium mb-4 text-center flex items-center justify-center gap-2">
                <Star size={20} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
                超新星规则
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">什么是超新星</h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    超新星代表星系中的优秀作品。它来源于用户在发射台中发出的内容，
                    当某一条内容获得足够多的关怀、跟随或互动后，可以成为该星系中的超新星。
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">如何成为超新星</h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    1. 在发射台公开发送内容<br/>
                    2. 内容被其他用户接收到<br/>
                    3. 内容获得送出温暖<br/>
                    4. 内容获得跟随<br/>
                    5. 内容达到超新星判定标准<br/>
                    6. 被系统记录为优秀作品
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">超新星奖励</h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    成为超新星后，该内容所属用户将获得额外星尘奖励、超新星标记，
                    作品进入星系优秀内容展示，并增加用户在星系中的影响记录。
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSupernovaRules(false)}
                className={`w-full mt-5 py-3 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-[#1f1f2e] hover:bg-[#262638] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
              >
                知道了
              </button>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
