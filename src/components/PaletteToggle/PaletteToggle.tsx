/**
 * PaletteToggle —— editorial / tech 色身切换控件。
 *
 * 跟 ThemeToggle 是两个正交开关：mode（亮/暗/跟随）独立于 palette（文学/科技）。
 * 两个 toggle 视觉上同款（同一组样式 .ui-theme-toggle*），业务侧并排放即可。
 *
 * 依赖 ThemeProvider/useTheme，把 palette 状态统一落到 documentElement[data-palette]。
 */
'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { useTheme } from '../ThemeProvider';
import { type Palette } from '../theme-utils';

export interface PaletteToggleProps extends HTMLAttributes<HTMLDivElement> {
  labels?: Partial<Record<Palette, string>>;
}

const ITEMS: Palette[] = ['editorial', 'tech'];

const DEFAULT_LABELS: Record<Palette, string> = {
  editorial: '文学',
  tech: '科技',
};

export function PaletteToggle({
  labels,
  className,
  ...rest
}: PaletteToggleProps) {
  const { palette, setPalette } = useTheme();
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };

  return (
    <div
      className={cn('ui-theme-toggle', className)}
      aria-label={`当前色身 ${palette}`}
      {...rest}
    >
      {ITEMS.map(item => (
        <button
          key={item}
          className="ui-theme-toggle-item"
          data-active={palette === item || undefined}
          type="button"
          onClick={() => setPalette(item)}
        >
          {mergedLabels[item]}
        </button>
      ))}
    </div>
  );
}
