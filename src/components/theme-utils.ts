/**
 * Theme + Palette 单一真值源 —— 类型 / 常量 / inline init script。
 *
 * 不带 'use client'：server component（Layout）能直接 import；本文件被
 * `@novel-isr/ui/theme-utils` sub-entry 暴露，避开主入口的 `'use client'` banner。
 *
 * 主题维度（正交）：
 *   theme    light / dark / system     模式（浅深 / 跟随系统）
 *   palette  editorial / tech          色身（文学暖白 / 科技冷调）
 *
 * SSR Layout 用法：
 *
 *   import { THEME_INIT_SCRIPT } from '@novel-isr/ui/theme-utils';
 *
 *   <html suppressHydrationWarning>
 *     <head>
 *       <script suppressHydrationWarning
 *               dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
 *     </head>
 *     <body><ThemeProvider>...</ThemeProvider></body>
 *   </html>
 *
 * 同步阻塞脚本在 hydrate 之前执行：读两个 cookie / prefers-color-scheme，
 * 写 documentElement.dataset.theme + dataset.palette。body 渲染前两个 attr 已就绪，
 * 无 FOUC。
 */

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type Palette = 'editorial' | 'tech';

/** Cookie 名 —— 切换时写、inline script 启动时读，跨 client / server 单一真值。 */
export const THEME_COOKIE_NAME = 'theme';
export const PALETTE_COOKIE_NAME = 'palette';

/** Cookie 过期 1 年（Vercel / Shopify / GitHub 同档），主题偏好不需要短期过期。 */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** 默认 palette = editorial（小说评分本命视觉）。 */
export const DEFAULT_PALETTE: Palette = 'editorial';

/** Cookie 原始字符串 → 合法 Theme；非法值 / undefined 统一回退到 system。 */
export function parseThemeCookie(value: string | undefined): Theme {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

/** Cookie 原始字符串 → 合法 Palette；非法值 / undefined 统一回退到 default。 */
export function parsePaletteCookie(value: string | undefined): Palette {
  return value === 'editorial' || value === 'tech' ? value : DEFAULT_PALETTE;
}

/**
 * Inline blocking script —— 业务侧 SSR Layout 注入 `<head>`，hydrate 前同步：
 *   1. 读 cookie `theme` / `palette` 拿用户偏好
 *   2. theme='system' 或缺失 → prefers-color-scheme 解析
 *   3. palette 缺失/非法 → editorial（默认）
 *   4. 写 documentElement.dataset.theme + .palette
 *
 * 写在 documentElement 上不参与 hydration diff，没有 mismatch。
 * 字符串是常量，server / client 输出完全一致；script 上加 suppressHydrationWarning，
 * 浏览器扩展（Dark Reader / 沉浸式翻译）篡改也不 throw。
 *
 * cookie 名跟 *_COOKIE_NAME 联动 —— 单一真值。
 */
export const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement,c=document.cookie;var tm=c.match(/(?:^|; )${THEME_COOKIE_NAME}=([^;]+)/);var t=tm?tm[1]:'system';if(t!=='light'&&t!=='dark'&&t!=='system')t='system';if(t==='system')t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.dataset.theme=t;var pm=c.match(/(?:^|; )${PALETTE_COOKIE_NAME}=([^;]+)/);var p=pm?pm[1]:'${DEFAULT_PALETTE}';if(p!=='editorial'&&p!=='tech')p='${DEFAULT_PALETTE}';d.dataset.palette=p;}catch(e){}})();`;
