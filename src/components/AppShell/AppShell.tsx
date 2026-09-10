'use client';

import { forwardRef, useEffect, useId, useRef, useState, useSyncExternalStore, type HTMLAttributes, type ReactNode } from 'react';
import { PanelLeftClose, PanelLeftOpen, Pin, PinOff } from 'lucide-react';
import { DrawerRoot, DrawerTrigger, DrawerContent, DrawerHeader, DrawerBody } from '../Drawer/Drawer';
import { IconButton } from '../Button/IconButton';
import { cn } from '../../utils/cn';

export type AppShellSidebarMode = 'expanded' | 'compact' | 'floating';
export interface AppShellNavigationState {
  collapsed: boolean;
  isMobile: boolean;
  closeNavigation: () => void;
  expandNavigation: () => void;
}
export interface AppShellLabels {
  expand: string;
  collapse: string;
  enableFloating: string;
  disableFloating: string;
  openNavigation: string;
  closeNavigation: string;
}
export interface AppShellProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  brand: ReactNode;
  brandIcon?: ReactNode;
  navigation: (state: AppShellNavigationState) => ReactNode;
  navigationLabel?: string;
  /** Change this when a route commits to dismiss temporary navigation. */
  navigationKey?: string;
  headerActions?: ReactNode;
  pageNavigation?: ReactNode;
  children?: ReactNode;
  sidebarMode?: AppShellSidebarMode;
  defaultSidebarMode?: AppShellSidebarMode;
  onSidebarModeChange?: (mode: AppShellSidebarMode) => void;
  labels?: Partial<AppShellLabels>;
}

const mobileQuery = '(max-width: 768px)';
const subscribeMobile = (changed: () => void) => {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener('change', changed);
  return () => query.removeEventListener('change', changed);
};
const getMobile = () => window.matchMedia(mobileQuery).matches;
const getServerMobile = () => false;
const defaultLabels: AppShellLabels = {
  expand: 'Expand sidebar', collapse: 'Collapse sidebar',
  enableFloating: 'Enable floating sidebar', disableFloating: 'Disable floating sidebar',
  openNavigation: 'Open navigation', closeNavigation: 'Close navigation',
};

export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell({
  brand, brandIcon, navigation, navigationLabel = 'Navigation', navigationKey,
  headerActions, pageNavigation, children, sidebarMode, defaultSidebarMode = 'expanded',
  onSidebarModeChange, labels: labelOverrides, className, ...rest
}, ref) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const [localMode, setLocalMode] = useState(defaultSidebarMode);
  const mode = sidebarMode ?? localMode;
  const isMobile = useSyncExternalStore(subscribeMobile, getMobile, getServerMobile);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const headerToggle = useRef<HTMLButtonElement>(null);
  const sidebarId = useId();
  const previousMobile = useRef(isMobile);
  const collapsed = !isMobile && mode !== 'expanded' && !(mode === 'floating' && (hovered || keyboardFocus));
  const setMode = (next: AppShellSidebarMode) => {
    if (sidebarMode === undefined) setLocalMode(next);
    onSidebarModeChange?.(next);
  };
  const closeNavigation = () => setMobileOpen(false);
  const state: AppShellNavigationState = { collapsed, isMobile, closeNavigation, expandNavigation: () => setMode('expanded') };
  const toggleSidebar = () => setMode(mode === 'expanded' ? 'compact' : 'expanded');
  const compactMode = mode !== 'expanded';

  useEffect(() => setMobileOpen(false), [navigationKey]);
  useEffect(() => {
    if (previousMobile.current === isMobile) return;
    previousMobile.current = isMobile;
    setMobileOpen(false);
    setHovered(false);
    setKeyboardFocus(false);
    if (mobileOpen && !isMobile) headerToggle.current?.focus();
  }, [isMobile, mobileOpen]);

  const collapseControl = (inHeader = false) => <IconButton
    ref={inHeader ? headerToggle : undefined} size="sm" label={compactMode ? labels.expand : labels.collapse}
    aria-controls={sidebarId} aria-expanded={!collapsed}
    onClick={toggleSidebar}>
    {compactMode ? <PanelLeftOpen /> : <PanelLeftClose />}
  </IconButton>;

  return <DrawerRoot open={isMobile && mobileOpen} onOpenChange={setMobileOpen}>
    <div ref={ref} className={cn('ui-app-shell', className)} data-sidebar-mode={mode}
      data-mobile={isMobile || undefined} data-sidebar-expanded={!collapsed || undefined} {...rest}>
      {!isMobile && <aside id={sidebarId} className="ui-app-shell-sidebar" aria-label={navigationLabel}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        onFocusCapture={event => { if (event.target.matches(':focus-visible')) setKeyboardFocus(true); }}
        onKeyDownCapture={event => { if (event.key === 'Tab') setKeyboardFocus(true); }}
        onPointerDownCapture={() => setKeyboardFocus(false)}
        onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocus(false); }}>
        <div className="ui-app-shell-brand">
          {brandIcon && <span className="ui-app-shell-brand-icon" aria-hidden="true">{brandIcon}</span>}
          <span className="ui-app-shell-brand-label">{brand}</span>
        </div>
        <div className="ui-app-shell-navigation">{navigation(state)}</div>
        <div className="ui-app-shell-sidebar-actions">
          {collapseControl()}
          <IconButton size="sm" aria-pressed={mode === 'floating'}
            label={mode === 'floating' ? labels.disableFloating : labels.enableFloating}
            onClick={() => setMode(mode === 'floating' ? 'compact' : 'floating')}>
            {mode === 'floating' ? <PinOff /> : <Pin />}
          </IconButton>
        </div>
      </aside>}
      <div className="ui-app-shell-workspace">
        <header className="ui-app-shell-header">
          {isMobile ? <DrawerTrigger asChild>
            <IconButton ref={headerToggle} size="sm" label={labels.openNavigation}><PanelLeftOpen /></IconButton>
          </DrawerTrigger> : collapseControl(true)}
          <div className="ui-app-shell-header-actions">{headerActions}</div>
        </header>
        {pageNavigation}
        <main className="ui-app-shell-content">{children}</main>
      </div>
    </div>
    {isMobile && <DrawerContent side="left" size="md" closeLabel={labels.closeNavigation}
      onCloseAutoFocus={event => {
        event.preventDefault();
        headerToggle.current?.focus();
      }}>
      <DrawerHeader>{navigationLabel}</DrawerHeader>
      <DrawerBody className="ui-app-shell-mobile-navigation">{navigation(state)}</DrawerBody>
    </DrawerContent>}
  </DrawerRoot>;
});
