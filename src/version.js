/**
 * version.js — 暴露当前 bundle 的版本号 / 构建时间给 UI 用。
 *
 * 值由 vite.config.js 的 `define` 在 build 时注入（读自 package.json 的 version 字段
 * 和当时的 Date.now()）。本文件不需要手改，只是把两个全局变量包装成 named export。
 *
 * 升版本号 → 改 package.json 的 "version" 字段。
 * 谁在用 → SettingsPanel 的"关于息息"和"检查更新"功能。
 */

// 当前构建的版本号与构建时间，由 vite.config.js 的 define 注入
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
export const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 0;
