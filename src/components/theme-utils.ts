/**
 * Theme 单一真值源 —— 类型 / 常量 / 纯函数都在这里，
 * ThemeProvider（client）跟 SSR 框架（server）共用同一份定义。
 *
 * 不带 'use client'：server / client 都能 import；server component
 * 拿到的是真正的纯函数，不是 client reference。
 *
 * SSR Layout 用法（cookie-based 主题，对齐 next-themes / Vercel 路线）：
 *
 *   import { parseThemeCookie, resolveServerTheme, THEME_COOKIE_NAME } from '@novel-isr/ui';
 *   import { getRequestContext } from '@novel-isr/engine/rsc';
 *
 *   const initialTheme = parseThemeCookie(getRequestContext()?.cookies?.[THEME_COOKIE_NAME]);
 *   const serverTheme  = resolveServerTheme(initialTheme);
 *   <html data-theme={serverTheme}>
 *     <ThemeProvider defaultTheme={initialTheme}>...</ThemeProvider>
 *   </html>
 */

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** Cookie 名 —— ThemeProvider 切换时写、Layout SSR 时读，跨 client / server 单一真值。 */
export const THEME_COOKIE_NAME = 'theme';

/** Cookie 过期 1 年（Vercel / Shopify / GitHub 同档），主题偏好不需要短期过期。 */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Cookie 原始字符串 → 合法 Theme；非法值 / undefined 统一回退到 system。 */
export function parseThemeCookie(value: string | undefined): Theme {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

/**
 * Theme → server 端可渲染的 data-theme 值。
 *
 * server 看不到 prefers-color-scheme，'system' 没法在 SSR 解析 —— 兜底 dark
 * （跟 next-themes / shadcn 默认行为一致）。客户端 ThemeProvider mount 后若
 * 系统是 light 才切一帧（仅用户主动选 system 才触发）。
 */
export function resolveServerTheme(theme: Theme): ResolvedTheme {
  return theme === 'light' ? 'light' : 'dark';
}
