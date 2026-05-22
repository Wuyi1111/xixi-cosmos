/**
 * WishPoolView.jsx — "星愿池"商城页（mock 阶段）。
 *
 * 从 MineView 的"星尘"统计块点击进入。当前是变现路径的"前端 mock"：
 *   1) Header：返回 + "星愿池" + 我的星尘余额
 *   2) 主 banner + 大按钮"许下我的星愿"
 *   3) 本月睡眠精选（横向滑动 8 个商品卡）
 *   4) 别人正在被点亮的星愿墙（垂直列表 8 条）
 *
 * 改什么：
 *   - 加 / 改商品（emoji / 名字 / 规格 / 星尘价 / 现金价）→ src/constants.js 的 WISH_PRODUCTS
 *   - 加 / 改别人的愿望卡片 → src/constants.js 的 MOCK_WISHES
 *   - 改许愿弹窗的字段 / 字数上限 / 文案 → 这里 showWishModal 那块
 *   - 改"我也想要"点击行为（目前只 toast）→ handleJoinWish
 *   - 改主 banner 文案 / 配色 / 渐变 → 顶部那个 <section>
 *
 * 真接通后端 / 支付时改这些点：
 *   - 拉取商品 / 愿望列表（替换 import 的 mock 数据）
 *   - 许愿成功后 POST 接口、扣星尘、写入用户的 myWishes（userData 新字段）
 *   - "我也想要"接 +1 接口 + 持久化
 */

import { useState } from 'react';
import { ChevronLeft, Sparkles, Heart, Send, X } from 'lucide-react';
import Portal from '../components/Portal.jsx';
import { WISH_PRODUCTS, MOCK_WISHES } from '../constants.js';

// 把 daysAgo 转成人类可读的"X 天前"
function timeAgoLabel(daysAgo) {
  if (daysAgo <= 0) return '今天';
  if (daysAgo === 1) return '昨天';
  if (daysAgo < 7) return `${daysAgo} 天前`;
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} 周前`;
  return `${Math.floor(daysAgo / 30)} 个月前`;
}

export default function WishPoolView({ isDark, userData, onClose }) {
  // 许愿弹窗
  const [showWishModal, setShowWishModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [wishText, setWishText] = useState('');

  // 顶部 toast（许愿 / 共愿 反馈）
  const [toast, setToast] = useState('');
  const fireToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  // mock：本地维护"我也想要过"的愿望 id，给按钮一个切换态
  const [joinedSet, setJoinedSet] = useState(new Set());

  const selectedProduct = WISH_PRODUCTS.find(p => p.id === selectedProductId);

  const submitWish = () => {
    if (!selectedProduct) return;
    fireToast(`你的星愿已飞向宇宙 ✨`);
    setShowWishModal(false);
    setSelectedProductId(null);
    setWishText('');
  };

  const handleJoinWish = (wishId) => {
    const next = new Set(joinedSet);
    if (next.has(wishId)) {
      next.delete(wishId);
    } else {
      next.add(wishId);
      fireToast('已加入共愿，星光多一束');
    }
    setJoinedSet(next);
  };

  return (
    <div className="animate-fade-in pb-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <button onClick={onClose} className={`p-2 -ml-2 rounded-full transition-colors ${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'}`}>
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-medium tracking-wide">星愿池</h1>
        <div className="text-right">
          <p className="text-[10px] text-gray-500">我的星尘</p>
          <p className={`text-base font-medium flex items-center gap-1 justify-end ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
            <Sparkles size={14} />
            {userData.stardust}
          </p>
        </div>
      </div>

      {/* 主 banner + 许愿 CTA */}
      <section className={`relative overflow-hidden p-6 rounded-[32px] border ${isDark ? 'bg-gradient-to-br from-indigo-900/40 to-purple-900/30 border-indigo-500/30' : 'bg-gradient-to-br from-indigo-100 to-purple-100/80 border-indigo-200'}`}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-yellow-300/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-pink-300/20 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <p className={`text-xs mb-1 tracking-widest ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>WISHING POOL</p>
          <h2 className="text-lg font-medium mb-2">把你的睡前心愿，托付给宇宙</h2>
          <p className={`text-xs leading-relaxed mb-5 ${isDark ? 'text-gray-300/80' : 'text-gray-600'}`}>
            每一颗星尘都能让心愿离你更近一步。<br/>
            许下的愿望也会被别的星海旅人看见、点亮。
          </p>

          <button
            onClick={() => setShowWishModal(true)}
            className="w-full py-3.5 rounded-2xl text-sm font-medium tracking-wider bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            许下我的星愿
          </button>
        </div>
      </section>

      {/* 商品橱窗：横滑 */}
      <section>
        <h3 className="text-sm font-medium mb-3 px-1 flex items-center gap-2">
          🛍️ 本月睡眠精选
        </h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
          {WISH_PRODUCTS.map(p => (
            <button
              key={p.id}
              onClick={() => { setSelectedProductId(p.id); setShowWishModal(true); }}
              className={`shrink-0 w-36 p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-95 ${isDark ? 'bg-[#171724] border-gray-800 hover:border-indigo-500/30' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm'}`}
            >
              <div className={`aspect-square rounded-xl flex items-center justify-center text-5xl mb-3 ${isDark ? 'bg-[#0f0f1a]' : 'bg-gradient-to-br from-indigo-50 to-purple-50'}`}>
                {p.emoji}
              </div>
              <p className="text-xs font-medium mb-1 truncate">{p.name}</p>
              <p className="text-[10px] text-gray-500 mb-2 truncate">{p.spec}</p>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-sm font-medium flex items-center gap-0.5 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                  <Sparkles size={10} />{p.stardust}
                </span>
                <span className="text-[10px] text-gray-400">/ ¥{p.price}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 别人的愿望墙 */}
      <section>
        <h3 className="text-sm font-medium mb-3 px-1 flex items-center gap-2">
          🌌 正在被点亮的星愿
        </h3>
        <div className="space-y-3">
          {MOCK_WISHES.map(w => {
            const product = WISH_PRODUCTS.find(p => p.id === w.productId);
            const joined = joinedSet.has(w.id);
            const totalJoined = w.joined + (joined ? 1 : 0);

            return (
              <div
                key={w.id}
                className={`p-4 rounded-[20px] border ${isDark ? 'bg-[#171724] border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}
              >
                {/* 顶部：匿名用户 + 时间 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xl ${isDark ? 'bg-[#0f0f1a]' : 'bg-indigo-50'}`}>
                      {w.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-medium leading-tight">{w.userName}</p>
                      <p className="text-[10px] text-gray-500 font-mono">#{w.userId}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500">{timeAgoLabel(w.daysAgo)}</span>
                </div>

                {/* 愿望文字 */}
                <p className={`text-sm leading-relaxed font-light mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  "{w.wish}"
                </p>

                {/* 商品 + 行动 */}
                <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-[#0f0f1a] border border-gray-800' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-2xl ${isDark ? 'bg-[#171724]' : 'bg-white'}`}>
                      {product?.emoji || '🎁'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{product?.name || '未知星愿'}</p>
                      <p className={`text-[10px] flex items-center gap-0.5 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                        <Sparkles size={9} /> {product?.stardust ?? '?'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinWish(w.id)}
                    className={`shrink-0 ml-2 flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                      joined
                        ? (isDark ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' : 'bg-pink-100 text-pink-600 border border-pink-200')
                        : (isDark ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50')
                    }`}
                  >
                    <Heart size={11} fill={joined ? 'currentColor' : 'none'} />
                    {totalJoined} 共愿
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-[10px] text-gray-500 mt-6">
          每一个愿望都是一颗星，宇宙正在记下它们。
        </p>
      </section>

      {/* 许愿弹窗 */}
      {showWishModal && (
        <Portal>
          <div
            className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 ${isDark ? 'bg-[#0f0f1a]/85' : 'bg-[#f8fafc]/85'} backdrop-blur-sm animate-fade-in`}
            onClick={() => setShowWishModal(false)}
          >
            <div
              className={`w-full max-w-sm p-6 rounded-[28px] relative max-h-[85vh] overflow-y-auto no-scrollbar ${isDark ? 'bg-[#171724]' : 'bg-white shadow-xl'}`}
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowWishModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200">
                <X size={20} />
              </button>
              <h3 className="text-lg font-medium mb-1 text-center">许下你的星愿</h3>
              <p className="text-[11px] text-gray-500 text-center mb-5">
                选择一件想要的物品，留下一句心声
              </p>

              {/* 商品 grid */}
              <div className="grid grid-cols-3 gap-2 mb-4 max-h-56 overflow-y-auto no-scrollbar">
                {WISH_PRODUCTS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className={`p-2.5 rounded-xl text-center transition-all ${
                      selectedProductId === p.id
                        ? (isDark ? 'bg-indigo-500/25 ring-2 ring-indigo-400' : 'bg-indigo-100 ring-2 ring-indigo-400')
                        : (isDark ? 'bg-[#0f0f1a] hover:bg-white/5' : 'bg-gray-50 hover:bg-white')
                    }`}
                  >
                    <div className="text-3xl mb-1">{p.emoji}</div>
                    <p className="text-[10px] font-medium truncate">{p.name}</p>
                    <p className={`text-[9px] mt-0.5 flex items-center justify-center gap-0.5 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                      <Sparkles size={8} />{p.stardust}
                    </p>
                  </button>
                ))}
              </div>

              {/* 愿望文字 */}
              <div className="mb-4">
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>留下一句心声（可选）</p>
                <textarea
                  value={wishText}
                  onChange={e => setWishText(e.target.value)}
                  maxLength={80}
                  rows={3}
                  placeholder="给这个心愿写一句寄语..."
                  className={`w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-colors ${
                    isDark
                      ? 'bg-[#0f0f1a] border border-gray-800 focus:border-indigo-500 text-gray-200 placeholder-gray-600'
                      : 'bg-gray-50 border border-gray-200 focus:border-indigo-400 text-gray-800 placeholder-gray-400'
                  }`}
                />
                <p className="text-right text-[10px] text-gray-500 mt-1">{wishText.length} / 80</p>
              </div>

              {/* 提交 */}
              <button
                onClick={submitWish}
                disabled={!selectedProductId}
                className={`w-full py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  selectedProductId
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                    : (isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-200 text-gray-400')
                }`}
              >
                <Send size={14} />
                {selectedProduct ? `送上宇宙 · ${selectedProduct.stardust} 颗星尘` : '请先选择一件物品'}
              </button>
              <p className="text-[10px] text-center text-gray-500 mt-3 leading-relaxed">
                此功能目前为预览版，许愿不会真的扣除星尘或下单。
              </p>
            </div>
          </div>
        </Portal>
      )}

      {/* 顶部反馈 toast */}
      {toast && (
        <Portal>
          <div className="fixed left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-indigo-500 text-white text-sm shadow-lg shadow-indigo-500/30 animate-fade-in z-[70] flex items-center gap-2 top-[max(env(safe-area-inset-top)+1rem,5rem)]">
            <Sparkles size={14} /> {toast}
          </div>
        </Portal>
      )}
    </div>
  );
}
