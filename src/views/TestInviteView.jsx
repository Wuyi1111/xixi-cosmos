/**
 * TestInviteView.jsx — 测试邀请界面
 *
 * 启动页结束后显示，用户可选择开始测试或跳过
 */

import { Sparkles } from 'lucide-react';

export default function TestInviteView({ isDark, onStartTest, onSkip }) {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-[#0f0f1a]' : 'bg-[#f8fafc]'}`}>
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* 图标 */}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
          <Sparkles size={40} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
        </div>

        {/* 文字 */}
        <div className="space-y-2">
          <h1 className="text-2xl font-medium">探索睡眠人格</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            8 道题，发现属于你的宇宙归属
          </p>
        </div>

        {/* 按钮 */}
        <div className="space-y-3">
          <button
            onClick={onStartTest}
            className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
          >
            开始测试
          </button>
          <button
            onClick={onSkip}
            className={`w-full py-3 rounded-2xl text-sm transition-all active:scale-95 ${
              isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            先跳过，以后再说
          </button>
        </div>
      </div>
    </div>
  );
}
