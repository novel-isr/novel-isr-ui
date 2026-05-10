/**
 * ThemeProvider —— theme（light/dark/system）+ palette（editorial/tech）双轴持久化。
 *
 * Cookie 持久化（不是 localStorage）—— SSR 框架 server 端读 cookie 渲染出
 * 正确的 `<html data-theme data-palette>`，无 hydration mismatch 无 FOUC。
 *
 * 用法：
 *   <ThemeProvider defaultTheme="dark" defaultPalette="editorial">
 *     <App />
 *   </ThemeProvider>
 *
 *   const { theme, palette, resolvedTheme, setTheme, setPalette } = useTheme();
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
  DEFAULT_PALETTE,
  PALETTE_COOKIE_NAME,
  THEME_COOKIE_MAX_AGE,
  THEME_COOKIE_NAME,
  parsePaletteCookie,
  parseThemeCookie,
  type Palette,
  type ResolvedTheme,
  type Theme,
} from './theme-utils';

interface ThemeContextValue {
  /** 用户的模式选择（system 表示跟随操作系统） */
  theme: Theme;
  /** 实际生效的模式（system → 解析后是 light/dark） */
  resolvedTheme: ResolvedTheme;
  /** 当前色身 */
  palette: Palette;
  /** 切模式 —— 写 cookie + 更新 documentElement.dataset.theme */
  setTheme: (theme: Theme) => void;
  /** 切色身 —— 写 cookie + 更新 documentElement.dataset.palette */
  setPalette: (palette: Palette) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const prefix = `${name}=`;
  const segment = document.cookie.split('; ').find(s => s.startsWith(prefix));
  return segment?.slice(prefix.length);
}

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  // SameSite=Lax —— 跟 next-themes / Vercel 对齐：跨站 GET（外链跳进来）也能带上偏好。
  // 不加 Secure —— 主题/色身不是机密，HTTP / HTTPS 站点都得能用。
  document.cookie = `${name}=${value}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolved);
}

function applyPalette(palette: Palette): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-palette', palette);
}

interface ThemeProviderProps {
  /**
   * 默认模式。SSR 场景应由外层 Layout 从 request cookie 读出来传进来
   * （parseThemeCookie(RequestContext.cookies[THEME_COOKIE_NAME])），
   * 这样 server 渲染的 `<html data-theme>` 跟客户端 hydration 完全一致。
   */
  defaultTheme?: Theme;
  /**
   * 默认色身。SSR 场景同 defaultTheme：
   * parsePaletteCookie(RequestContext.cookies[PALETTE_COOKIE_NAME])。
   */
  defaultPalette?: Palette;
  /** 是否禁用持久化（测试用） */
  disableStorage?: boolean;
  children: ReactNode;
}

export function ThemeProvider({
  defaultTheme = 'system',
  defaultPalette = DEFAULT_PALETTE,
  disableStorage = false,
  children,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [palette, setPaletteState] = useState<Palette>(defaultPalette);

  // hydrate 后从 cookie 读最新值。如果 server 已经从 cookie 读到正确值传进来作为
  // default*，这一步是 no-op（值相同 setState 不触发重渲染）。仅在 cookie
  // 跟 default* 不一致时（dev 手改 cookie / 多 tab 切换）才同步。
  useEffect(() => {
    if (disableStorage) return;
    const storedTheme = parseThemeCookie(readCookie(THEME_COOKIE_NAME));
    const storedPalette = parsePaletteCookie(readCookie(PALETTE_COOKIE_NAME));
    if (storedTheme !== theme) setThemeState(storedTheme);
    if (storedPalette !== palette) setPaletteState(storedPalette);
    // 初始化一次，default* 是 init value 不进依赖
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

  // 应用 data-palette
  useEffect(() => {
    applyPalette(palette);
  }, [palette]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      if (!disableStorage) writeCookie(THEME_COOKIE_NAME, next);
    },
    [disableStorage]
  );

  const setPalette = useCallback(
    (next: Palette) => {
      setPaletteState(next);
      if (!disableStorage) writeCookie(PALETTE_COOKIE_NAME, next);
    },
    [disableStorage]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, palette, setTheme, setPalette }),
    [theme, resolvedTheme, palette, setTheme, setPalette]
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
