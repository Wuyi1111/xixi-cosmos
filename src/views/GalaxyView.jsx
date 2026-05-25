/**
 * GalaxyView.jsx — "星系"板块（简化版，方案A）
 *
 * 页面结构：
 *   1) 顶部信息区：坐标 / 连续夜晚 / 星尘（一行简化）
 *   2) 星系概览：视觉 + 累计星尘 + 超新星（缩小）
 *   3) 超新星规则 — 默认折叠
 *   4) 星系里程碑 — 只显示当前阶段+进度条，列表折叠
 *   5) 同星系排名 — 只显示前3名+自己，其余折叠
 */

import { useState } from 'react';
import { MapPin, Moon, Sparkles, Star, Trophy, ChevronRight, ChevronDown, Zap, Users } from 'lucide-react';
import Portal from '../components/Portal.jsx';

// 星系发展阶段
const GALAXY_STAGES = [
  { id: 0, name: '虚空尘埃', desc: '微光在虚空中闪烁', minStardust: 0, color: 'gray' },
  { id: 1, name: '星雾聚集', desc: '紫色光晕开始聚拢', minStardust: 500, color: 'purple' },
  { id: 2, name: '初生星核', desc: '中央主星体诞生', minStardust: 2000, color: 'amber' },
  { id: 3, name: '星环觉醒', desc: '星环缓缓展开', minStardust: 5000, color: 'blue' },
  { id: 4, name: '伴星环绕', desc: '小星体开始公转', minStardust: 10000, color: 'amber' },
  { id: 5, name: '双月引力', desc: '星系引力场增强', minStardust: 20000, color: 'amber' },
  { id: 6, name: '宁静星系', desc: '星系进入稳定运转', minStardust: 50000, color: 'amber' },
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

export default function GalaxyView({ isDark, userData }) {
  const [showSupernovaRules, setShowSupernovaRules] = useState(false);
  const [milestonesExpanded, setMilestonesExpanded] = useState(false);
  const [rankingExpanded, setRankingExpanded] = useState(false);

  // 计算星系总星尘
  const galaxyTotalStardust = userData.stardust + MOCK_RANKINGS.reduce((sum, u) => sum + u.stardust, 0);

  // 超新星数量
  const supernovaCount = Math.floor((userData.totalHugs + (userData.totalFollows || 0)) / 10) + 3;

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

  // 连续夜晚显示
  const lastCheckInDate = userData.checkInHistory[0]?.date;
  const todayStr = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const hasCheckedInToday = lastCheckInDate === todayStr;
  let displayContinuousDays = userData.continuousDays;
  if (!hasCheckedInToday && userData.checkInHistory.length > 0) {
    if (lastCheckInDate !== yesterday.toDateString()) {
      displayContinuousDays = 0;
    }
  }

  const stageColorMap = {
    gray: isDark ? 'text-gray-400' : 'text-gray-500',
    purple: isDark ? 'text-purple-400' : 'text-purple-500',
    amber: isDark ? 'text-amber-400' : 'text-amber-500',
    blue: isDark ? 'text-blue-400' : 'text-blue-500',
  };

  const stageBgMap = {
    gray: isDark ? 'bg-gray-500/10 border-gray-500/20' : 'bg-gray-50 border-gray-200',
    purple: isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200',
    amber: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200',
    blue: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200',
  };

  return (
    <div className="animate-fade-in pb-10 space-y-5">
      {/* === 顶部信息区 — 简化为一行 === */}
      <div className={`p-4 rounded-[20px] flex items-center justify-between ${isDark ? 'bg-[#171724] border-white/5' : 'bg-white border-gray-100'} border shadow-sm`}>
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
          <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>#{userData.id}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Moon size={12} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
          <span className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{displayContinuousDays} 夜</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
          <span className={`text-[10px] font-medium ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{userData.stardust}</span>
        </div>
      </div>

      {/* === 星系概览 — 缩小 === */}
      <div className={`p-5 rounded-[24px] relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#171724] border border-amber-500/15' : 'bg-gradient-to-br from-amber-50/70 to-white border border-amber-100'}`}>
        <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full bg-amber-300/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -left-6 w-24 h-24 rounded-full bg-orange-300/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-4">
          {/* 星系视觉 — 缩小 */}
          <div className="relative w-20 h-20 shrink-0">
            <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-amber-500/10' : 'bg-amber-100'} animate-pulse`}></div>
            <div className={`absolute inset-2 rounded-full ${isDark ? 'bg-amber-400/15' : 'bg-amber-50'} animate-pulse`} style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🌌</span>
            </div>
            <div className={`absolute inset-1 rounded-full border-2 border-dashed ${isDark ? 'border-amber-500/20' : 'border-amber-200'} animate-spin`} style={{ animationDuration: '20s' }}></div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-light tracking-wide mb-1">宁静星系</h2>
            <p className={`text-[10px] mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {MOCK_RANKINGS.length + 1} 位星旅人
            </p>
            <div className="flex gap-3">
              <div>
                <p className={`text-lg font-medium ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{galaxyTotalStardust.toLocaleString()}</p>
                <p className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>累计星尘</p>
              </div>
              <div>
                <p className={`text-lg font-medium ${isDark ? 'text-amber-300' : 'text-amber-500'}`}>{supernovaCount}</p>
                <p className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>超新星</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === 超新星规则 — 默认折叠 === */}
      <div className={`rounded-[20px] border overflow-hidden ${isDark ? 'bg-[#171724] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div
          onClick={() => setShowSupernovaRules(true)}
          className="p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2">
            <Star size={14} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
            <h3 className="text-sm font-medium">超新星</h3>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>了解规则</span>
            <ChevronRight size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
          </div>
        </div>
      </div>

      {/* === 星系里程碑 — 当前阶段+进度条，列表折叠 === */}
      <div className={`rounded-[20px] border overflow-hidden ${isDark ? 'bg-[#171724] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
        {/* 标题栏 */}
        <div
          onClick={() => setMilestonesExpanded(!milestonesExpanded)}
          className="p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2">
            <Zap size={14} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
            <h3 className="text-sm font-medium">星系里程碑</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${stageBgMap[currentStage.color]}`}>
              <span className={stageColorMap[currentStage.color]}>{currentStage.name}</span>
            </span>
            <div className={`transition-transform duration-300 ${milestonesExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
            </div>
          </div>
        </div>

        {/* 进度条 — 始终显示 */}
        {nextStage && (
          <div className="px-4 pb-3">
            <div className="flex justify-between text-[10px] mb-1.5">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>距离 {nextStage.name}</span>
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>还需 {(nextStage.minStardust - galaxyTotalStardust).toLocaleString()} 星尘</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-100'}`}>
              <div className={`h-full rounded-full transition-all duration-1000 ${isDark ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`} style={{ width: `${progressToNext}%` }}></div>
            </div>
          </div>
        )}

        {/* 阶段列表 — 折叠 */}
        <div className={`grid transition-all duration-300 ease-in-out ${milestonesExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2">
              {GALAXY_STAGES.map((stage) => {
                const isCurrent = stage.id === currentStage.id;
                const isPast = stage.minStardust < currentStage.minStardust;
                return (
                  <div
                    key={stage.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isCurrent ? (isDark ? 'bg-[#1f1f2e] border border-amber-500/20' : 'bg-amber-50 border border-amber-100') : ''
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                      isCurrent ? (isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-600')
                      : isPast ? (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-500')
                      : (isDark ? 'bg-[#1f1f2e] text-gray-600' : 'bg-gray-100 text-gray-400')
                    }`}>
                      {isPast ? '✓' : stage.id + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${isCurrent ? (isDark ? 'text-amber-300' : 'text-amber-600') : (isDark ? 'text-gray-300' : 'text-gray-700')}`}>
                        {stage.name}
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {stage.desc} · {stage.minStardust.toLocaleString()} 星尘
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* === 同星系排名 — 前3名+自己，其余折叠 === */}
      <div className={`rounded-[20px] border overflow-hidden ${isDark ? 'bg-[#171724] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
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
            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>第 {myRank} 名</span>
            <div className={`transition-transform duration-300 ${rankingExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
            </div>
          </div>
        </div>

        {/* 前3名 + 自己 — 始终显示 */}
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

      {/* === 超新星规则弹窗 === */}
      {showSupernovaRules && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowSupernovaRules(false)}>
            <div className={`w-full max-w-sm p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative max-h-[80vh] overflow-y-auto no-scrollbar`} onClick={e => e.stopPropagation()}>
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
