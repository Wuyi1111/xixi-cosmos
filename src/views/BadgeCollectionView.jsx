/**
 * BadgeCollectionView.jsx — 成就徽章全览子界面
 *
 * 按分类展示所有徽章，已解锁和未解锁状态区分显示
 */

import { useMemo } from 'react';
import { ChevronRight, Lock, Moon, Heart, Users, Sparkles, Music, Compass, Star, Flame, Award } from 'lucide-react';

// 成就徽章定义（分类）
export const BADGE_CATEGORIES = [
  {
    id: 'streak',
    name: '归星成就',
    icon: Moon,
    color: 'sky',
    badges: [
      { id: 'first_star', name: '初星', desc: '完成首次归星', icon: Star, check: (u) => u.totalDays >= 1 },
      { id: 'nights_7', name: '7夜行者', desc: '连续归星7天', icon: Moon, check: (u) => u.continuousDays >= 7 },
      { id: 'nights_30', name: '月度星旅', desc: '连续归星30天', icon: Moon, check: (u) => u.continuousDays >= 30 },
      { id: 'nights_100', name: '百日星辰', desc: '连续归星100天', icon: Star, check: (u) => u.continuousDays >= 100 },
      { id: 'nights_365', name: '周年守夜', desc: '连续归星365天', icon: Moon, check: (u) => u.continuousDays >= 365 },
      { id: 'total_10', name: '夜行者', desc: '累计归星10天', icon: Flame, check: (u) => u.totalDays >= 10 },
      { id: 'total_50', name: '深空旅人', desc: '累计归星50天', icon: Flame, check: (u) => u.totalDays >= 50 },
      { id: 'total_100', name: '星际漫游', desc: '累计归星100天', icon: Flame, check: (u) => u.totalDays >= 100 },
    ],
  },
  {
    id: 'warmth',
    name: '温暖成就',
    icon: Heart,
    color: 'pink',
    badges: [
      { id: 'hugs_10', name: '温暖使者', desc: '传递温暖10次', icon: Heart, check: (u) => u.totalHugs >= 10 },
      { id: 'hugs_50', name: '光之传递', desc: '传递温暖50次', icon: Heart, check: (u) => u.totalHugs >= 50 },
      { id: 'hugs_100', name: '星河拥抱', desc: '传递温暖100次', icon: Heart, check: (u) => u.totalHugs >= 100 },
      { id: 'hugs_500', name: '宇宙暖意', desc: '传递温暖500次', icon: Heart, check: (u) => u.totalHugs >= 500 },
    ],
  },
  {
    id: 'social',
    name: '社交成就',
    icon: Users,
    color: 'indigo',
    badges: [
      { id: 'follows_5', name: '同行者', desc: '跟随5个任务', icon: Users, check: (u) => u.totalFollows >= 5 },
      { id: 'follows_20', name: '星际伙伴', desc: '跟随20个任务', icon: Users, check: (u) => u.totalFollows >= 20 },
      { id: 'follows_50', name: '星群领袖', desc: '跟随50个任务', icon: Users, check: (u) => u.totalFollows >= 50 },
    ],
  },
  {
    id: 'explore',
    name: '探索成就',
    icon: Compass,
    color: 'amber',
    badges: [
      { id: 'personality', name: '人格觉醒', desc: '完成人格测试', icon: Sparkles, check: (u) => !!u.personality },
      { id: 'galaxy', name: '星系居民', desc: '查看星系图谱', icon: Star, check: (u) => !!u.personality },
      { id: 'sound_5', name: '夜声探索者', desc: '使用过5种夜声', icon: Music, check: (u) => false },
      { id: 'wish', name: '心愿播种', desc: '在心愿池许愿', icon: Star, check: (u) => false },
    ],
  },
];

// 计算已解锁的徽章ID集合
export function computeUnlockedBadgeIds(userData) {
  const unlocked = new Set();
  BADGE_CATEGORIES.forEach((cat) => {
    cat.badges.forEach((badge) => {
      if (badge.check(userData)) {
        unlocked.add(badge.id);
      }
    });
  });
  return unlocked;
}

// 获取首页展示的4个徽章（优先已解锁，不足则补未解锁）
export function getHomeBadges(userData) {
  const unlocked = computeUnlockedBadgeIds(userData);
  const allBadges = [];
  BADGE_CATEGORIES.forEach((cat) => {
    cat.badges.forEach((b) => {
      allBadges.push({ ...b, category: cat.id, categoryName: cat.name, color: cat.color });
    });
  });

  // 已解锁的排前面
  const unlockedList = allBadges.filter((b) => unlocked.has(b.id));
  const lockedList = allBadges.filter((b) => !unlocked.has(b.id));

  // 取前4个
  const result = [...unlockedList, ...lockedList].slice(0, 4);
  return result.map((b) => ({ ...b, isUnlocked: unlocked.has(b.id) }));
}

export default function BadgeCollectionView({ isDark, userData, onClose }) {
  const unlockedIds = useMemo(() => computeUnlockedBadgeIds(userData), [userData]);

  const totalBadges = BADGE_CATEGORIES.reduce((sum, cat) => sum + cat.badges.length, 0);
  const unlockedCount = unlockedIds.size;

  const colorMap = {
    sky: { bg: isDark ? 'bg-sky-500/10' : 'bg-sky-50', border: isDark ? 'border-sky-500/20' : 'border-sky-100', text: isDark ? 'text-sky-400' : 'text-sky-600', icon: isDark ? 'text-sky-400' : 'text-sky-500' },
    pink: { bg: isDark ? 'bg-pink-500/10' : 'bg-pink-50', border: isDark ? 'border-pink-500/20' : 'border-pink-100', text: isDark ? 'text-pink-400' : 'text-pink-600', icon: isDark ? 'text-pink-400' : 'text-pink-500' },
    indigo: { bg: isDark ? 'bg-indigo-500/10' : 'bg-indigo-50', border: isDark ? 'border-indigo-500/20' : 'border-indigo-100', text: isDark ? 'text-indigo-400' : 'text-indigo-600', icon: isDark ? 'text-indigo-400' : 'text-indigo-500' },
    amber: { bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50', border: isDark ? 'border-amber-500/20' : 'border-amber-100', text: isDark ? 'text-amber-400' : 'text-amber-600', icon: isDark ? 'text-amber-400' : 'text-amber-500' },
  };

  return (
    <div className="animate-fade-in pb-10">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onClose}
          className={`p-2 rounded-full transition-all active:scale-95 ${isDark ? 'bg-[#171724] text-gray-400' : 'bg-white text-gray-500 shadow-sm'}`}
        >
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-medium">成就徽章</h2>
          <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            已解锁 {unlockedCount}/{totalBadges}
          </p>
        </div>
      </div>

      {/* 进度概览 */}
      <div className={`p-5 rounded-[24px] mb-6 ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-sky-500/10' : 'bg-sky-50'}`}>
            <Award size={28} className={isDark ? 'text-sky-400' : 'text-sky-500'} />
          </div>
          <div className="flex-1">
            <p className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>徽章收集进度</p>
            <div className={`w-full h-2 rounded-full ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-100'} overflow-hidden`}>
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-500"
                style={{ width: `${totalBadges > 0 ? (unlockedCount / totalBadges) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className={`text-xl font-medium ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>{unlockedCount}</p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/{totalBadges}</p>
          </div>
        </div>
      </div>

      {/* 分类展示 */}
      <div className="space-y-5">
        {BADGE_CATEGORIES.map((category) => {
          const colors = colorMap[category.color];
          const CategoryIcon = category.icon;
          const catUnlocked = category.badges.filter((b) => unlockedIds.has(b.id)).length;

          return (
            <div
              key={category.id}
              className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}
            >
              {/* 分类标题 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CategoryIcon size={16} className={colors.icon} />
                  <h3 className="text-sm font-medium">{category.name}</h3>
                </div>
                <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {catUnlocked}/{category.badges.length}
                </span>
              </div>

              {/* 徽章网格 */}
              <div className="grid grid-cols-4 gap-3">
                {category.badges.map((badge) => {
                  const isUnlocked = unlockedIds.has(badge.id);
                  const Icon = badge.icon;
                  return (
                    <div
                      key={badge.id}
                      className={`p-3 rounded-xl text-center transition-all ${
                        isUnlocked
                          ? `${colors.bg} border ${colors.border}`
                          : (isDark ? 'bg-[#1f1f2e] border border-transparent opacity-50' : 'bg-gray-50 border border-transparent opacity-50')
                      }`}
                    >
                      {isUnlocked ? (
                        <Icon size={20} className={`mx-auto mb-1.5 ${colors.icon}`} />
                      ) : (
                        <Lock size={20} className={`mx-auto mb-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      )}
                      <p className={`text-[10px] font-medium ${isUnlocked ? colors.text : (isDark ? 'text-gray-600' : 'text-gray-400')}`}>
                        {badge.name}
                      </p>
                      <p className={`text-[8px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {badge.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
