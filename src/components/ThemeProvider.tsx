/**
 * ThemeProvider —— 在 root 设置 data-theme + 持久化用户偏好。
 *
 * 使用：
 *   <ThemeProvider defaultTheme="system">
 *     <App />
 *   </ThemeProvider>
 *
 * 任意子组件用：
 *   const { theme, setTheme, resolvedTheme } = useTheme();
 *
 * 设计取舍：
 *   - 不依赖任何第三方（next-themes / tailwind-darkmode 等都是为别的栈写的）
 *   - SSR 友好：第一次渲染读 localStorage 在客户端发生，服务端给 defaultTheme
 *   - "system" = 跟随 prefers-color-scheme，监听媒体查询变化
 *   - data-theme 写在 documentElement，CSS 选择器命中
 *   - 持久化 key 走 localStorage，dev 态可清掉
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

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  /** 用户的选择（system 表示跟随操作系统） */
  theme: Theme;
  /** 实际生效的主题（system → 解析后是 light/dark） */
  resolvedTheme: ResolvedTheme;
  /** 切主题，会写 localStorage + 更新 data-theme */
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'novel-isr-ui-theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* localStorage 不可用（SSR / privacy mode）→ 走 default */
  }
  return null;
}

function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolved);
}

interface ThemeProviderProps {
  /** 默认主题（用户没设过 + SSR 第一帧用） */
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

  // 客户端 hydrate 后读取 localStorage（避免 SSR mismatch）
  useEffect(() => {
    if (disableStorage) return;
    const stored = readStoredTheme();
    if (stored && stored !== theme) {
      setThemeState(stored);
    }
    // theme 字段是 init 一次，eslint exhaustive-deps 误报不修
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
      if (!disableStorage) {
        try {
          window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
          /* 写不进去就算了，下次还是 default */
        }
      }
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
