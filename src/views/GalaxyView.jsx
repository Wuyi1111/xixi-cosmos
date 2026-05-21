/**
 * GalaxyView.jsx — "星系"板块。
 *
 * 页面结构：
 *   1) 顶部信息区：宇宙坐标 / 连续驻留夜晚 / 当前星尘
 *   2) 所在星系示意图：星系视觉 + 星系总星尘 + 超新星数量
 *   3) 超新星规则说明
 *   4) 星系里程碑：发展阶段 + 当前阶段 + 距离下一阶段
 *   5) 同星系星尘排名
 */

import { useState } from 'react';
import { MapPin, Moon, Sparkles, Star, Trophy, ChevronRight, Zap, Users } from 'lucide-react';
import Portal from '../components/Portal.jsx';

// 星系发展阶段
const GALAXY_STAGES = [
  { id: 0, name: '虚空尘埃', desc: '微光在虚空中闪烁', minStardust: 0, color: 'gray' },
  { id: 1, name: '星雾聚集', desc: '紫色光晕开始聚拢', minStardust: 500, color: 'purple' },
  { id: 2, name: '初生星核', desc: '中央主星体诞生', minStardust: 2000, color: 'indigo' },
  { id: 3, name: '星环觉醒', desc: '星环缓缓展开', minStardust: 5000, color: 'blue' },
  { id: 4, name: '伴星环绕', desc: '小星体开始公转', minStardust: 10000, color: 'cyan' },
  { id: 5, name: '双月引力', desc: '星系引力场增强', minStardust: 20000, color: 'emerald' },
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

  // 计算星系总星尘（个人 + 模拟同星系成员）
  const galaxyTotalStardust = userData.stardust + MOCK_RANKINGS.reduce((sum, u) => sum + u.stardust, 0);

  // 超新星数量（模拟：基于总互动数）
  const supernovaCount = Math.floor((userData.totalHugs + (userData.totalFollows || 0)) / 10) + 3;

  // 当前星系阶段
  const currentStage = [...GALAXY_STAGES].reverse().find(s => galaxyTotalStardust >= s.minStardust) || GALAXY_STAGES[0];
  const nextStage = GALAXY_STAGES.find(s => s.minStardust > galaxyTotalStardust);
  const progressToNext = nextStage
    ? Math.min(100, Math.round(((galaxyTotalStardust - currentStage.minStardust) / (nextStage.minStardust - currentStage.minStardust)) * 100))
    : 100;

  // 同星系排名（加入当前用户）
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
    indigo: isDark ? 'text-indigo-400' : 'text-indigo-500',
    blue: isDark ? 'text-blue-400' : 'text-blue-500',
    cyan: isDark ? 'text-cyan-400' : 'text-cyan-500',
    emerald: isDark ? 'text-emerald-400' : 'text-emerald-500',
    amber: isDark ? 'text-amber-400' : 'text-amber-500',
  };

  const stageBgMap = {
    gray: isDark ? 'bg-gray-500/10 border-gray-500/20' : 'bg-gray-50 border-gray-200',
    purple: isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200',
    indigo: isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200',
    blue: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200',
    cyan: isDark ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200',
    emerald: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200',
    amber: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200',
  };

  return (
    <div className="animate-fade-in pb-10 space-y-6">
      {/* === 顶部信息区 === */}
      <div className={`p-5 rounded-[28px] ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#171724] border-white/5' : 'bg-gradient-to-br from-indigo-50/50 to-white border-indigo-50'} border shadow-sm`}>
        <div className="flex items-center justify-between">
          {/* 左侧：宇宙坐标 */}
          <div className="flex items-center gap-2">
            <MapPin size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              坐标 #{userData.id}
            </span>
          </div>

          {/* 中部：连续夜晚 */}
          <div className="flex items-center gap-1.5">
            <Moon size={14} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
            <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              连续 {displayContinuousDays} 夜
            </span>
          </div>

          {/* 右侧：星尘 */}
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
            <span className={`text-xs font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
              {userData.stardust}
            </span>
          </div>
        </div>
      </div>

      {/* === 所在星系示意图 === */}
      <div className={`p-6 rounded-[28px] relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1a1a2e] to-[#171724] border border-indigo-500/15' : 'bg-gradient-to-br from-indigo-50/70 to-white border border-indigo-100'}`}>
        <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full bg-indigo-300/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -left-6 w-24 h-24 rounded-full bg-purple-300/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 text-center">
          {/* 星系视觉 */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-100'} animate-pulse`}></div>
            <div className={`absolute inset-4 rounded-full ${isDark ? 'bg-indigo-400/15' : 'bg-indigo-50'} animate-pulse`} style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl">🌌</span>
            </div>
            {/* 轨道环 */}
            <div className={`absolute inset-2 rounded-full border-2 border-dashed ${isDark ? 'border-indigo-500/20' : 'border-indigo-200'} animate-spin`} style={{ animationDuration: '20s' }}></div>
          </div>

          <h2 className="text-lg font-light mb-1 tracking-wide">宁静星系</h2>
          <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            这是你与 {MOCK_RANKINGS.length + 1} 位星旅人共同的星系
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#1f1f2e]' : 'bg-white/60'}`}>
              <p className={`text-2xl font-medium mb-1 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                {galaxyTotalStardust.toLocaleString()}
              </p>
              <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>星系累计星尘</p>
            </div>
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#1f1f2e]' : 'bg-white/60'}`}>
              <p className={`text-2xl font-medium mb-1 ${isDark ? 'text-amber-300' : 'text-amber-500'}`}>
                {supernovaCount}
              </p>
              <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>超新星数量</p>
            </div>
          </div>
        </div>
      </div>

      {/* === 超新星规则 === */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={16} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
            <h3 className="text-sm font-medium">超新星</h3>
          </div>
          <button
            onClick={() => setShowSupernovaRules(true)}
            className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
          >
            了解规则 <ChevronRight size={12} />
          </button>
        </div>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          超新星是星系中的优秀作品。当发射台的内容获得足够多的温暖与跟随后，
          便会成为照亮整个星系的超新星，为所属用户带来额外星尘奖励。
        </p>
      </div>

      {/* === 星系里程碑 === */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={16} className={isDark ? 'text-cyan-400' : 'text-cyan-500'} />
            <h3 className="text-sm font-medium">星系里程碑</h3>
          </div>
          <span className={`text-[10px] px-2 py-1 rounded-full ${stageBgMap[currentStage.color]}`}>
            <span className={stageColorMap[currentStage.color]}>{currentStage.name}</span>
          </span>
        </div>

        {/* 进度条 */}
        {nextStage && (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] mb-1.5">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                距离 {nextStage.name}
              </span>
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                还需 {(nextStage.minStardust - galaxyTotalStardust).toLocaleString()} 星尘
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-100'}`}>
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isDark ? 'bg-gradient-to-r from-indigo-500 to-cyan-400' : 'bg-gradient-to-r from-indigo-400 to-cyan-400'
                }`}
                style={{ width: `${progressToNext}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* 阶段列表 */}
        <div className="space-y-2">
          {GALAXY_STAGES.map((stage) => {
            const isCurrent = stage.id === currentStage.id;
            const isPast = stage.minStardust < currentStage.minStardust;
            return (
              <div
                key={stage.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isCurrent
                    ? (isDark ? 'bg-[#1f1f2e] border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100')
                    : (isDark ? 'bg-transparent' : 'bg-transparent')
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                  isCurrent
                    ? (isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600')
                    : isPast
                    ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-500')
                    : (isDark ? 'bg-[#1f1f2e] text-gray-600' : 'bg-gray-100 text-gray-400')
                }`}>
                  {isPast ? '✓' : stage.id + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${isCurrent ? (isDark ? 'text-indigo-300' : 'text-indigo-600') : (isDark ? 'text-gray-300' : 'text-gray-700')}`}>
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

      {/* === 同星系星尘排名 === */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={16} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
          <h3 className="text-sm font-medium">同星系星尘排名</h3>
        </div>

        <div className="space-y-2">
          {allRankings.slice(0, 6).map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                user.isMe
                  ? (isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100')
                  : (isDark ? 'bg-[#1f1f2e]/50' : 'bg-gray-50/50')
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
                <p className={`text-xs font-medium truncate ${user.isMe ? (isDark ? 'text-indigo-300' : 'text-indigo-600') : (isDark ? 'text-gray-200' : 'text-gray-700')}`}>
                  {user.name} {user.isMe && '(你)'}
                </p>
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                {user.stardust}
              </span>
            </div>
          ))}
        </div>

        {myRank > 6 && (
          <div className={`mt-2 p-3 rounded-xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium w-5 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {myRank}
              </span>
              <span className="text-lg">{userData.avatarEmoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                  {userData.displayName} (你)
                </p>
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                {userData.stardust}
              </span>
            </div>
          </div>
        )}

        <div className={`mt-3 p-3 rounded-xl text-center ${isDark ? 'bg-[#1f1f2e]/50' : 'bg-gray-50/50'}`}>
          <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <Users size={10} className="inline mr-1" />
            同星系共 {MOCK_RANKINGS.length + 1} 人，每个人都在为星系成长贡献力量
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
