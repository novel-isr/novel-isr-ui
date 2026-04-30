/**
 * ThemeToggle —— light / dark / system 主题切换控件。
 *
 * 依赖 ThemeProvider/useTheme，把主题状态统一落到 documentElement[data-theme]。
 * 业务后台和前台不需要重复实现本地主题状态。
 */
'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { type Theme, useTheme } from '../ThemeProvider';

export interface ThemeToggleProps extends HTMLAttributes<HTMLDivElement> {
  showSystem?: boolean;
  labels?: Partial<Record<Theme, string>>;
}

const DEFAULT_LABELS: Record<Theme, string> = {
  light: '亮',
  dark: '暗',
  system: '跟随',
};

export function ThemeToggle({
  showSystem = true,
  labels,
  className,
  ...rest
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };
  const items: Theme[] = showSystem ? ['light', 'dark', 'system'] : ['light', 'dark'];

  return (
    <div
      className={cn('ui-theme-toggle', className)}
      aria-label={`当前主题 ${resolvedTheme}`}
      {...rest}
    >
      {items.map(item => (
        <button
          key={item}
          className="ui-theme-toggle-item"
          data-active={theme === item || undefined}
          type="button"
          onClick={() => setTheme(item)}
        >
          {mergedLabels[item]}
        </button>
      ))}
    </div>
  );
}
