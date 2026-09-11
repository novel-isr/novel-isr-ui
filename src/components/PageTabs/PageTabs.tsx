import { ChevronLeft, ChevronRight } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import { IconButton } from '../Button/IconButton';
import { Tooltip, TooltipProvider } from '../Tooltip/Tooltip';
import { cn } from '../../utils/cn';

export interface PageTabsProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  label: string;
  activeValue: string;
  children: ReactNode;
  actions?: ReactNode;
  scrollLabels?: { left: string; right: string };
}

/** Route navigation, not an ARIA tablist: the application owns routes and leave guards. */
export function PageTabs({ label, activeValue, children, actions, scrollLabels = {
  left: 'Scroll pages left', right: 'Scroll pages right',
}, className, onFocusCapture, onContextMenuCapture, ...rest }: PageTabsProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const focused = useRef<HTMLElement | null>(null);
  const previousItems = useRef<string | null>(null);
  const [scroll, setScroll] = useState({ overflow: false, left: false, right: false });
  const measure = useCallback(() => {
    const el = viewport.current;
    if (!el) return;
    const next = {
      overflow: el.scrollWidth > el.clientWidth + 1,
      left: el.scrollLeft > 1,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    };
    setScroll(prev => prev.overflow === next.overflow && prev.left === next.left && prev.right === next.right ? prev : next);
  }, []);
  const revealActive = useCallback(() => {
    const el = viewport.current;
    const active = list.current?.querySelector<HTMLElement>('.ui-page-tab[data-active]');
    if (!el) return;
    if (!active) { measure(); return; }
    const view = el.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    if (item.width > view.width) el.scrollLeft += item.left - view.left;
    else if (item.left < view.left) el.scrollLeft -= view.left - item.left;
    else if (item.right > view.right) el.scrollLeft += item.right - view.right;
    measure();
  }, [measure]);
  useEffect(() => {
    const items = JSON.stringify([activeValue, ...Array.from(list.current?.querySelectorAll<HTMLElement>('.ui-page-tab') || [],
      item => [item.dataset.value, item.dataset.active])]);
    if (items !== previousItems.current) {
      previousItems.current = items;
      revealActive();
    }
    // Closing the focused item must not strand keyboard focus on the document body.
    if (focused.current && !focused.current.isConnected && document.activeElement === document.body) {
      list.current?.querySelector<HTMLButtonElement>('[aria-current="page"]')?.focus({ preventScroll: true });
    }
  });
  useEffect(() => {
    const observer = new ResizeObserver(revealActive);
    if (viewport.current) observer.observe(viewport.current);
    if (list.current) observer.observe(list.current);
    return () => observer.disconnect();
  }, [revealActive]);
  const move = (direction: number) => {
    const el = viewport.current;
    if (!el) return;
    el.scrollLeft += direction * Math.max(1, el.clientWidth * 0.8);
    measure();
  };
  return <nav {...rest} aria-label={label} className={cn('ui-page-tabs', className)}
    onFocusCapture={event => {
      // React portal events bubble through this nav; retain the originating item.
      if (event.currentTarget.contains(event.target)) {
        focused.current = event.target.closest('.ui-page-tab') ? event.target : null;
      }
      onFocusCapture?.(event);
    }} onContextMenuCapture={event => {
      const item = (event.target as Element).closest('.ui-page-tab');
      if (item) focused.current = item.querySelector<HTMLButtonElement>('.ui-page-tab-trigger');
      onContextMenuCapture?.(event);
    }}>
    {scroll.overflow && <IconButton className="ui-page-tabs-scroll" label={scrollLabels.left} size="sm"
      disabled={!scroll.left} onClick={() => move(-1)}><ChevronLeft size={18} /></IconButton>}
    <div ref={viewport} className="ui-page-tabs-viewport" onScroll={measure}>
      <div ref={list} className="ui-page-tabs-list">{children}</div>
    </div>
    {scroll.overflow && <IconButton className="ui-page-tabs-scroll" label={scrollLabels.right} size="sm"
      disabled={!scroll.right} onClick={() => move(1)}><ChevronRight size={18} /></IconButton>}
    {actions && <div className="ui-page-tabs-actions">{actions}</div>}
  </nav>;
}

export interface PageTabProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onSelect'> {
  value: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  action?: ReactNode;
  onSelect?: () => void;
}

export const PageTab = forwardRef<HTMLDivElement, PageTabProps>(function PageTab({
  value, label, active, disabled, icon, action, onSelect, className, ...rest
}, ref) {
  return <div {...rest} ref={ref} className={cn('ui-page-tab', className)} data-value={value} data-active={active || undefined}
    data-disabled={disabled || undefined}>
    <TooltipProvider>
      <Tooltip label={label} side="bottom" align="start" disabled={disabled}>
        <Button className="ui-page-tab-trigger" variant="ghost" size="sm" intent="neutral"
          aria-current={active ? 'page' : undefined} disabled={disabled} onClick={onSelect}
          leftIcon={icon ? <span aria-hidden="true">{icon}</span> : undefined}>{label}</Button>
      </Tooltip>
    </TooltipProvider>
    {action && <span className="ui-page-tab-action">{action}</span>}
  </div>;
});
