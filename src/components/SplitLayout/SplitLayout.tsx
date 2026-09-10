import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { resolveSpace as space } from '../../utils/space'

export interface SplitLayoutProps extends HTMLAttributes<HTMLDivElement> {
  aside: ReactNode
  /** Width in pixels; must be finite and positive. Defaults to 320. */
  asideWidth?: number
  /** Container breakpoints: md (768px), lg (1200px). Defaults to md. */
  collapseBelow?: 'md' | 'lg'
  /** Numbers and numeric strings reference spacing tokens. Defaults to 6. */
  gap?: string | number
}

export const SplitLayout = forwardRef<HTMLDivElement, SplitLayoutProps>(function SplitLayout({
  aside, asideWidth = 320, collapseBelow = 'md', gap = 6,
  children, className, style, ...rest
}, ref) {
  if (!Number.isFinite(asideWidth) || asideWidth <= 0) {
    throw new RangeError('SplitLayout asideWidth must be a finite positive number')
  }
  const hasAside = aside !== null && aside !== undefined && aside !== false

  return (
    <div ref={ref} className={cn('ui-split-layout', className)}
      style={{
        '--ui-split-layout-aside-width': `${asideWidth}px`,
        '--ui-split-layout-gap': space(gap, true),
        ...style,
      } as CSSProperties} {...rest}>
      <div className={cn(
        'ui-split-layout-grid',
        `ui-split-layout-grid--${collapseBelow}`,
        hasAside && 'ui-split-layout-grid--has-aside',
      )}>
        <div className="ui-split-layout-main">{children}</div>
        {hasAside && <div className="ui-split-layout-aside">{aside}</div>}
      </div>
    </div>
  )
})
