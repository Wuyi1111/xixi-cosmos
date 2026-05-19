import { createPortal } from 'react-dom';

// 将 fixed inset-0 类全屏 modal 渲染到 <body>，避开 <main> transform 树的影响
export default function Portal({ children }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
