/**
 * ThemeProvider —— 主题选择 + cookie 持久化。
 *
 * 用 cookie（不是 localStorage）持久化 —— 让 SSR 框架能在 server 端读到
 * 用户上次的偏好，server-render 出正确的 `<html data-theme={...}>`，
 * 没 hydration mismatch、没 mount 后才切主题的 FOUC。next-themes /
 * shadcn / Vercel 都是这条路。
 *
 * 用法：
 *   <ThemeProvider defaultTheme="dark">  // SSR 从 cookie 读出来的值
 *     <App />
 *   </ThemeProvider>
 *
 *   const { theme, setTheme, resolvedTheme } = useTheme();
 *
 * theme = 'system' 时跟随 prefers-color-scheme，监听媒体查询自动切。
 *
 * cookie 名 / 类型 / 解析规则全部从 theme-utils 来 —— 单一真值源。
 */
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  THEME_COOKIE_MAX_AGE,
  THEME_COOKIE_NAME,
  parseThemeCookie,
  type ResolvedTheme,
  type Theme,
} from './theme-utils';

interface ThemeContextValue {
  /** 用户的选择（system 表示跟随操作系统） */
  theme: Theme;
  /** 实际生效的主题（system → 解析后是 light/dark） */
  resolvedTheme: ResolvedTheme;
  /** 切主题 —— 写 cookie + 更新 documentElement.dataset.theme */
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readCookieTheme(): Theme {
  if (typeof document === 'undefined') return 'system';
  // 简单 substring 解析就够 —— 不引入 cookie parser 依赖
  const prefix = `${THEME_COOKIE_NAME}=`;
  const segment = document.cookie.split('; ').find(s => s.startsWith(prefix));
  return parseThemeCookie(segment?.slice(prefix.length));
}

function writeCookieTheme(value: Theme): void {
  if (typeof document === 'undefined') return;
  // SameSite=Lax —— 跟 next-themes / Vercel 对齐：跨站 GET（外链跳进来）也能带上偏好。
  // 不加 Secure —— 主题不是机密，HTTP / HTTPS 站点都得能用。
  document.cookie = `${THEME_COOKIE_NAME}=${value}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolved);
}

interface ThemeProviderProps {
  /**
   * 默认主题。SSR 场景下应由外层 Layout 从 request cookie 读出来传进来
   * （用 parseThemeCookie 解析 RequestContext.cookies[THEME_COOKIE_NAME]），
   * 这样 server 渲染的 `<html data-theme>` 跟客户端 hydration 完全一致。
   */
  defaultTheme?: Theme;
  /** 是否禁用持久化（测试用） */
  disableStorage?: boolean;
  children: ReactNode;
}

export function ThemeProvider({
  defaultTheme = 'system',
  disableStorage = false,
  children,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  // hydrate 后从 cookie 读最新值。如果 server 已经从 cookie 读到正确值传进来作为
  // defaultTheme，这一步是 no-op（值相同 setState 不触发重渲染）。仅在 cookie
  // 跟 defaultTheme 不一致时（dev 手改 cookie / 多 tab 切换）才同步。
  useEffect(() => {
    if (disableStorage) return;
    const stored = readCookieTheme();
    if (stored !== theme) setThemeState(stored);
    // 初始化一次，theme 是 init value 不进依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disableStorage]);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === 'system') return getSystemTheme();
    return theme;
  }, [theme]);

  // 应用 data-theme + 监听 system 变化
  useEffect(() => {
    applyTheme(resolvedTheme);
    if (theme !== 'system') return;
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(getSystemTheme());
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme, resolvedTheme]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      if (!disableStorage) writeCookieTheme(next);
    },
    [disableStorage]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error(
      '[@novel-isr/ui] useTheme() called outside <ThemeProvider>. Wrap your app root with <ThemeProvider>.'
    );
  }
  return ctx;
}
