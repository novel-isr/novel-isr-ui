/**
 * theme-utils —— ThemeProvider 跟 SSR 框架共享的纯函数行为锁定。
 *
 * 关键不变量：
 *   - parseThemeCookie 只接受 'light' / 'dark' / 'system'，其它一律回退到 system
 *   - resolveServerTheme 把 'light' 映射到 'light'，'dark' 跟 'system' 都到 'dark'
 *     （server 看不到 prefers-color-scheme，'system' 必须有兜底；选 dark 跟
 *     next-themes / shadcn 默认行为一致）
 *
 * 这两个函数是 client + server 跨 lib 共用，行为漂移会直接造成 hydration mismatch
 * 或 FOUC，必须锁死。
 */
import { describe, expect, it } from 'vitest';
import {
  THEME_COOKIE_MAX_AGE,
  THEME_COOKIE_NAME,
  parseThemeCookie,
  resolveServerTheme,
} from '../theme-utils';

describe('parseThemeCookie', () => {
  it('合法值原样返回', () => {
    expect(parseThemeCookie('light')).toBe('light');
    expect(parseThemeCookie('dark')).toBe('dark');
    expect(parseThemeCookie('system')).toBe('system');
  });

  it('undefined → system 兜底', () => {
    expect(parseThemeCookie(undefined)).toBe('system');
  });

  it('非法 / 残缺值 → system 兜底（防 cookie 损坏 / 跨版本残留）', () => {
    expect(parseThemeCookie('')).toBe('system');
    expect(parseThemeCookie('LIGHT')).toBe('system');
    expect(parseThemeCookie('auto')).toBe('system');
    expect(parseThemeCookie('null')).toBe('system');
  });
});

describe('resolveServerTheme', () => {
  it('light → light', () => {
    expect(resolveServerTheme('light')).toBe('light');
  });

  it('dark → dark', () => {
    expect(resolveServerTheme('dark')).toBe('dark');
  });

  it('system 在 server 端兜底为 dark（next-themes / shadcn 同款）', () => {
    expect(resolveServerTheme('system')).toBe('dark');
  });
});

describe('cookie 常量', () => {
  it('cookie 名固定为 "theme"，对齐 next-themes 默认（迁移友好）', () => {
    expect(THEME_COOKIE_NAME).toBe('theme');
  });

  it('过期时间为 1 年（行业惯例：主题偏好不需要短期过期）', () => {
    expect(THEME_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 365);
  });
});
