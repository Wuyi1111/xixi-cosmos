/**
 * ProfileView.jsx — 个人中心子界面
 *
 * 包含：头像、名字、ID、编辑资料、成就徽章预览、数据统计
 */

import { useState, useMemo } from 'react';
import { ChevronRight, X, Award, Edit3, Star, Moon, Flame, Heart, Users } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import BadgeCollectionView, { getHomeBadges, computeUnlockedBadgeIds, BADGE_CATEGORIES } from './BadgeCollectionView.jsx';
import { AVATAR_EMOJIS } from '../constants.js';

export default function ProfileView({ isDark, userData, saveUserData, onClose }) {
  const [showBadgeCollection, setShowBadgeCollection] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [editName, setEditName] = useState(userData.displayName || '');
  const [editAvatar, setEditAvatar] = useState(userData.avatarEmoji || '🪐');

  const homeBadges = useMemo(() => getHomeBadges(userData), [userData]);
  const unlockedIds = useMemo(() => computeUnlockedBadgeIds(userData), [userData]);
  const totalBadgesCount = BADGE_CATEGORIES.reduce((sum, cat) => sum + cat.badges.length, 0);
  const unlockedCount = unlockedIds.size;

  const saveProfile = () => {
    const trimmedName = editName.trim();
    if (trimmedName) {
      saveUserData({
        ...userData,
        displayName: trimmedName,
        avatarEmoji: editAvatar,
      });
    }
    setShowProfileEdit(false);
  };

  if (showBadgeCollection) {
    return (
      <BadgeCollectionView
        isDark={isDark}
        userData={userData}
        onClose={() => setShowBadgeCollection(false)}
      />
    );
  }

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
        <h2 className="text-lg font-medium">个人中心</h2>
      </div>

      {/* 个人信息卡片 */}
      <div className={`p-6 rounded-[24px] mb-5 ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        <div className="flex flex-col items-center text-center">
          {/* 大头像 */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-3 ${isDark ? 'bg-[#1f1f2e] border border-sky-500/20' : 'bg-white shadow-sm border border-sky-100'}`}>
            {userData.avatarEmoji || '🪐'}
          </div>

          {/* 名字 */}
          <h3 className="text-lg font-medium mb-1">{userData.displayName || '星星旅人'}</h3>

          {/* ID + 连续天数 */}
          <p className={`text-[10px] mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {userData.id} · 连续 {userData.continuousDays || 0} 夜
          </p>

          {/* 编辑资料按钮 */}
          <button
            onClick={() => {
              setEditName(userData.displayName || '星星旅人');
              setEditAvatar(userData.avatarEmoji || '🪐');
              setShowProfileEdit(true);
            }}
            className={`px-5 py-2 rounded-full text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5 ${
              isDark
                ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Edit3 size={12} />
            编辑资料
          </button>
        </div>
      </div>

      {/* 数据统计 */}
      <div className={`p-5 rounded-[24px] mb-5 ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        <h3 className="text-sm font-medium mb-4">数据统计</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${isDark ? 'bg-sky-500/10' : 'bg-sky-50'}`}>
              <Moon size={18} className={isDark ? 'text-sky-400' : 'text-sky-500'} />
            </div>
            <p className={`text-xl font-medium mb-0.5 ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>
              {userData.totalDays}
            </p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>累积夜晚</p>
          </div>
          <div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${isDark ? 'bg-pink-500/10' : 'bg-pink-50'}`}>
              <Heart size={18} className={isDark ? 'text-pink-400' : 'text-pink-500'} />
            </div>
            <p className={`text-xl font-medium mb-0.5 ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>
              {userData.totalHugs}
            </p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>传递温暖</p>
          </div>
          <div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
              <Users size={18} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
            </div>
            <p className={`text-xl font-medium mb-0.5 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
              {userData.totalFollows}
            </p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>同行者</p>
          </div>
        </div>
      </div>

      {/* 成就徽章 */}
      <div className={`p-5 rounded-[24px] ${isDark ? 'bg-[#171724] border border-white/5' : 'bg-white border border-gray-100'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award size={16} className={isDark ? 'text-sky-400' : 'text-sky-500'} />
            <h3 className="text-sm font-medium">成就徽章</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-50 text-sky-600'}`}>
              {unlockedCount}/{totalBadgesCount}
            </span>
          </div>
          <button
            onClick={() => setShowBadgeCollection(true)}
            className={`flex items-center gap-1 text-[10px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            查看全部 <ChevronRight size={12} />
          </button>
        </div>

        {/* 一排4个徽章 */}
        <div className="grid grid-cols-4 gap-3">
          {homeBadges.map((badge) => {
            const Icon = badge.icon;
            const isUnlocked = badge.isUnlocked;
            return (
              <div
                key={badge.id}
                className={`p-3 rounded-xl text-center transition-all ${
                  isUnlocked
                    ? (isDark ? 'bg-sky-500/10 border border-sky-500/20' : 'bg-sky-50 border border-sky-100')
                    : (isDark ? 'bg-[#1f1f2e] border border-transparent opacity-50' : 'bg-gray-50 border border-transparent opacity-50')
                }`}
              >
                <Icon
                  size={20}
                  className={`mx-auto mb-1.5 ${
                    isUnlocked
                      ? (isDark ? 'text-sky-400' : 'text-sky-500')
                      : (isDark ? 'text-gray-600' : 'text-gray-400')
                  }`}
                />
                <p className={`text-[10px] font-medium ${isUnlocked ? (isDark ? 'text-sky-300' : 'text-sky-600') : (isDark ? 'text-gray-600' : 'text-gray-400')}`}>
                  {badge.name}
                </p>
              </div>
            );
          })}
        </div>

        {/* 收集进度 */}
        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>收集进度</span>
            <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {Math.round(totalBadgesCount > 0 ? (unlockedCount / totalBadgesCount) * 100 : 0)}%
            </span>
          </div>
          <div className={`w-full h-1.5 rounded-full mt-1.5 ${isDark ? 'bg-[#1f1f2e]' : 'bg-gray-100'} overflow-hidden`}>
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-500"
              style={{ width: `${totalBadgesCount > 0 ? (unlockedCount / totalBadgesCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 编辑资料弹窗 */}
      {showProfileEdit && (
        <Portal>
          <div className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 ${isDark ? 'bg-[#0f0f1a]/80' : 'bg-[#f8fafc]/80'} backdrop-blur-sm animate-fade-in`} onClick={() => setShowProfileEdit(false)}>
            <div className={`w-full max-w-sm p-6 rounded-[28px] ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'} relative`} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowProfileEdit(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200">
                <X size={20} />
              </button>
              <h3 className="text-lg font-medium mb-5 text-center">编辑资料</h3>

              {/* 头像选择 */}
              <div className="mb-5">
                <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择头像</p>
                <div className="grid grid-cols-7 gap-2">
                  {AVATAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setEditAvatar(emoji)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all active:scale-90 ${
                        editAvatar === emoji
                          ? (isDark ? 'bg-sky-500/20 border border-sky-500/40' : 'bg-sky-50 border border-sky-300')
                          : (isDark ? 'bg-[#1f1f2e] border border-transparent' : 'bg-gray-50 border border-transparent')
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* 名字输入 */}
              <div className="mb-5">
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>昵称</p>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={12}
                  className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all ${
                    isDark
                      ? 'bg-[#1f1f2e] text-white border border-white/10 focus:border-sky-500/50'
                      : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-sky-300'
                  }`}
                  placeholder="输入你的昵称"
                />
              </div>

              {/* 保存按钮 */}
              <button
                onClick={saveProfile}
                className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
              >
                保存
              </button>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
