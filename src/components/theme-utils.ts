/**
 * Theme 单一真值源 —— 类型 / 常量 / inline init script 都在这里。
 *
 * 不带 'use client'：server component（Layout）能直接 import；本文件被
 * `@novel-isr/ui/theme-utils` sub-entry 暴露，避开主入口的 `'use client'` banner。
 *
 * SSR Layout 用法（next-themes / shadcn / Tailwind / Vercel 同款 inline blocking script）：
 *
 *   import { THEME_INIT_SCRIPT } from '@novel-isr/ui/theme-utils';
 *
 *   <html lang={locale} suppressHydrationWarning>
 *     <head>
 *       <script suppressHydrationWarning
 *               dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
 *     </head>
 *     <body><ThemeProvider>...</ThemeProvider></body>
 *   </html>
 *
 * 同步阻塞脚本在 React hydrate 之前执行：读 cookie / prefers-color-scheme，
 * 写 documentElement.dataset.theme。body 渲染前 data-theme 已经对，无 FOUC。
 */

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** Cookie 名 —— ThemeProvider 切换时写、inline script 启动时读，跨 client / server 单一真值。 */
export const THEME_COOKIE_NAME = 'theme';

/** Cookie 过期 1 年（Vercel / Shopify / GitHub 同档），主题偏好不需要短期过期。 */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Cookie 原始字符串 → 合法 Theme；非法值 / undefined 统一回退到 system。 */
export function parseThemeCookie(value: string | undefined): Theme {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

/**
 * Inline blocking script —— 业务侧 SSR Layout 注入 `<head>`，在 hydrate 前同步：
 *   1. 读 cookie `theme` 拿用户偏好
 *   2. 'system' 或不存在 → 用 prefers-color-scheme 解析
 *   3. 写到 documentElement.dataset.theme
 *
 * 写在 documentElement 上不参与 hydration diff，没有 mismatch。
 * 字符串是常量，server / client 输出完全一致；script 上加 suppressHydrationWarning，
 * 浏览器扩展（Dark Reader / 沉浸式翻译）篡改也不 throw。
 *
 * cookie 名跟 THEME_COOKIE_NAME 联动 —— 单一真值。
 */
export const THEME_INIT_SCRIPT = `(function(){try{var c=document.cookie.match(/(?:^|; )${THEME_COOKIE_NAME}=([^;]+)/);var v=c?c[1]:'system';if(v!=='light'&&v!=='dark'&&v!=='system')v='system';if(v==='system')v=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=v;}catch(e){}})();`;
