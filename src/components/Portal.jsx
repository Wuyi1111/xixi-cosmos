/**
 * Portal.jsx — React Portal 小封装。
 *
 * 凡是 `fixed inset-0` 的全屏弹窗 / 全屏 widget 都用 <Portal> 包一下，
 * 这样 modal 渲染在 <body> 下，不会受 <main> 的 transform（下拉刷新会
 * translate Y）影响，避免被拉扯。
 *
 * 用法：
 *   {showXyz && (
 *     <Portal>
 *       <div className="fixed inset-0 ...">...</div>
 *     </Portal>
 *   )}
 */

import { createPortal } from 'react-dom';

// 将 fixed inset-0 类全屏 modal 渲染到 <body>，避开 <main> transform 树的影响
export default function Portal({ children }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
