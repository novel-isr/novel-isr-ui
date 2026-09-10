/** @vitest-environment happy-dom */
import { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as UI from '../../index';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let mobile = false;
const listeners = new Set<() => void>();
const originalMatchMedia = window.matchMedia;
beforeEach(() => {
  mobile = false;
  window.matchMedia = vi.fn(() => ({
    get matches() { return mobile; },
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  } as unknown as MediaQueryList));
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); listeners.clear(); window.matchMedia = originalMatchMedia; vi.restoreAllMocks(); });
function resize(next: boolean) { act(() => { mobile = next; for (const listener of listeners) listener(); }); }
function button(label: string) { return document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!; }
function click(label: string) { act(() => button(label).click()); }
const navigation = (state: UI.AppShellNavigationState) => <div data-testid="navigation" data-collapsed={String(state.collapsed)}>
  <button onClick={state.expandNavigation}>Expand group</button><a href="#content" onClick={state.closeNavigation}>Articles</a>
</div>;
function render(props: Partial<UI.AppShellProps> = {}) {
  expect(UI).toHaveProperty('AppShell');
  act(() => root.render(<UI.AppShell brand="Admin" brandIcon={<span>Icon</span>} navigation={navigation}
    headerActions={<button>Account</button>} pageNavigation={<nav>Open pages</nav>} {...props}>
    <h1 id="content">Articles</h1>
  </UI.AppShell>));
}
const collapsed = () => document.querySelector('[data-testid="navigation"]')?.getAttribute('data-collapsed');

it('renders semantic slots and forwards the outer ref without a second page heading', () => {
  const ref = createRef<HTMLDivElement>();
  render({ref} as Partial<UI.AppShellProps>);
  expect(ref.current?.classList.contains('ui-app-shell')).toBe(true);
  expect(container.querySelectorAll('h1')).toHaveLength(1);
  expect(container.querySelector('main')?.textContent).toBe('Articles');
  expect(container.querySelectorAll('[data-testid="navigation"]')).toHaveLength(1);
  expect(collapsed()).toBe('false');
  const toggle = container.querySelector('header button')!;
  expect(toggle.getAttribute('aria-controls')).toBe(container.querySelector('aside')?.id);
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  click('Collapse sidebar');
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
});

it('toggles compact and floating modes and expands a compact group', () => {
  render();
  click('Collapse sidebar'); expect(collapsed()).toBe('true');
  click('Enable floating sidebar');
  expect(container.querySelector('.ui-app-shell')?.getAttribute('data-sidebar-mode')).toBe('floating');
  const sidebar = container.querySelector('aside')!;
  act(() => sidebar.dispatchEvent(new MouseEvent('mouseover', {bubbles:true})));
  expect(collapsed()).toBe('false');
  act(() => sidebar.dispatchEvent(new MouseEvent('mouseout', {bubbles:true,relatedTarget:document.body})));
  expect(collapsed()).toBe('true');
  act(() => container.querySelector<HTMLButtonElement>('[data-testid="navigation"] button')!.click());
  expect(collapsed()).toBe('false');
  expect(container.querySelector('.ui-app-shell')?.getAttribute('data-sidebar-mode')).toBe('expanded');
});

it('respects controlled mode and localizes controls', () => {
  const changed = vi.fn();
  render({sidebarMode:'compact',onSidebarModeChange:changed,labels:{expand:'Expand navigation'}});
  click('Expand navigation');
  expect(changed).toHaveBeenLastCalledWith('expanded');
  expect(collapsed()).toBe('true');
  render({sidebarMode:'expanded',onSidebarModeChange:changed});
  expect(collapsed()).toBe('false');
});

it('keeps floating navigation expanded during keyboard use until focus leaves', () => {
  render({defaultSidebarMode:'floating'});
  const target = container.querySelector<HTMLButtonElement>('[data-testid="navigation"] button')!;
  act(() => {target.focus();target.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true}));});
  expect(collapsed()).toBe('false');
  act(() => button('Disable floating sidebar').dispatchEvent(new MouseEvent('mouseout',{bubbles:true,relatedTarget:document.body})));
  expect(collapsed()).toBe('false');
  act(() => container.querySelector<HTMLButtonElement>('header button')!.focus());
  expect(collapsed()).toBe('true');
});

it('uses one modal navigation on mobile and closes it on route and breakpoint changes', () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  mobile = true;
  render({navigationLabel:'Workspace navigation',navigationKey:'/one'});
  expect(container.querySelector('aside')).toBeNull();
  expect(document.querySelector('[data-testid="navigation"]')).toBeNull();
  click('Open navigation');
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Workspace navigation');
  expect(collapsed()).toBe('false');
  render({navigationLabel:'Workspace navigation',navigationKey:'/two'});
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  click('Open navigation');
  resize(false);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(container.querySelectorAll('[data-testid="navigation"]')).toHaveLength(1);
  expect(container.querySelector('aside')).not.toBeNull();
  resize(true);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(warning).not.toHaveBeenCalled();
  warning.mockRestore();
});

it('supports localized dot badges and drawer close actions without leaking extra props', () => {
  act(() => root.render(<UI.Badge variant="dot" colorScheme="warning" aria-label="Updates" />));
  expect(container.querySelector('.ui-badge-variant-dot')).not.toBeNull();
  mobile = true;
  render({labels:{closeNavigation:'Close workspace'}});
  click('Open navigation');
  expect(button('Close workspace')).not.toBeNull();
  click('Close workspace');
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});
