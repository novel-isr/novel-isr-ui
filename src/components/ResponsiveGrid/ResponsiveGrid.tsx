import { forwardRef, type CSSProperties, type ElementType, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { resolveSpace as space } from '../../utils/space';

export type GridColumns = number | { base?: number; sm?: number; md?: number; lg?: number };
export interface ResponsiveGridProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** Container breakpoints: base, sm (480px), md (768px), lg (1200px). */
  columns?: GridColumns;
  gap?: string | number;
  rowGap?: string | number;
  columnGap?: string | number;
}

export const ResponsiveGrid = forwardRef<HTMLElement, ResponsiveGridProps>(function ResponsiveGrid({
  as: Tag = 'div', columns = 1, gap = 4, rowGap = gap, columnGap = gap,
  children, className, style, ...rest
}, ref) {
  const counts = typeof columns === 'number' ? { base: columns } : columns;
  const variables: Record<string, string | number> = {};
  let previous = 1;
  for (const key of ['base', 'sm', 'md', 'lg'] as const) {
    const value = counts[key] ?? previous;
    if (!Number.isInteger(value) || value < 1 || value > 12) {
      throw new RangeError('ResponsiveGrid columns must be integers from 1 to 12');
    }
    variables[`--ui-grid-${key}`] = value;
    previous = value;
  }
  variables['--ui-grid-row-gap'] = space(rowGap);
  variables['--ui-grid-column-gap'] = space(columnGap);
  return <Tag ref={ref} className={cn('ui-responsive-grid', className)}
    style={{ ...variables, ...style } as CSSProperties} {...rest}>
    <div className="ui-responsive-grid-layout">{children}</div>
  </Tag>;
});
