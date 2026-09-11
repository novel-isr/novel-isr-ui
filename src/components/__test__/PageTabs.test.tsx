/** @vitest-environment happy-dom */
import { act, createElement as h, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import * as UI from '../../index';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const container = document.createElement('div');
document.body.append(container);
let root = createRoot(container);
afterEach(() => { act(() => root.unmount()); root = createRoot(container); vi.restoreAllMocks(); });

it('uses the shared tooltip on keyboard focus instead of a duplicate native title', async () => {
  act(() => root.render(h(UI.PageTab, { value: 'article', label: 'Complete article title', active: true })));
  const trigger = container.querySelector<HTMLButtonElement>('.ui-page-tab-trigger')!;
  expect(trigger.hasAttribute('title')).toBe(false);
  await act(async () => trigger.focus());
  const tooltip = document.querySelector('[role="tooltip"]');
  expect(tooltip?.textContent).toBe('Complete article title');
  expect(trigger.getAttribute('aria-describedby')).toBe(tooltip?.id);
  expect(trigger.getAttribute('aria-current')).toBe('page');
  await act(async () => trigger.blur());
  expect(document.querySelector('[role="tooltip"]')).toBeNull();
});

it('exposes disabled presentation state without changing the action control', () => {
  act(() => root.render(h(UI.PageTab, { value: 'draft', label: 'Draft', disabled: true,
    action: h(UI.IconButton, { label: 'Close Draft' }, 'x') })));
  expect(container.querySelector('.ui-page-tab')?.hasAttribute('data-disabled')).toBe(true);
  expect(container.querySelector<HTMLButtonElement>('.ui-page-tab-trigger')?.disabled).toBe(true);
  expect(container.querySelector<HTMLButtonElement>('[aria-label="Close Draft"]')?.disabled).toBe(false);
});

it('exposes route navigation without inventing tab panels or nesting controls', () => {
  expect(UI).toHaveProperty('PageTabs');
  const select = vi.fn();
  const close = vi.fn();
  const ref = createRef<HTMLDivElement>();
  act(() => root.render(h(UI.PageTabs, { label: 'Open pages', activeValue: 'article', children:
    h(UI.PageTab, { value: 'article', label: 'Article', active: true, onSelect: select, ref,
      action: h(UI.IconButton, { label: 'Close Article', onClick: close }, 'x') }) })));
  expect(container.querySelector('nav')?.getAttribute('aria-label')).toBe('Open pages');
  expect(container.querySelector('[role="tablist"], [role="tabpanel"]')).toBeNull();
  const trigger = container.querySelector<HTMLButtonElement>('[aria-current="page"]')!;
  expect(trigger.textContent).toBe('Article');
  expect(trigger.querySelector('button')).toBeNull();
  expect(ref.current?.dataset.value).toBe('article');
  act(() => trigger.click());
  expect(select).toHaveBeenCalledTimes(1);
  act(() => container.querySelector<HTMLButtonElement>('[aria-label="Close Article"]')!.click());
  expect(close).toHaveBeenCalledTimes(1);
  expect(select).toHaveBeenCalledTimes(1);
});

it('forwards context-menu events to the item wrapper and supports disabled selection', () => {
  expect(UI).toHaveProperty('PageTab');
  const context = vi.fn();
  const select = vi.fn();
  act(() => root.render(h(UI.PageTab, { value: 'draft', label: 'Draft', disabled: true,
    onSelect: select, onContextMenu: context })));
  act(() => container.querySelector<HTMLButtonElement>('button')!.click());
  expect(select).not.toHaveBeenCalled();
  act(() => container.querySelector('.ui-page-tab')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true })));
  expect(context).toHaveBeenCalledTimes(1);
  expect(container.querySelector('[aria-current]')).toBeNull();
});

it('keeps global actions outside the scrollable list and hides unnecessary scroll controls', () => {
  expect(UI).toHaveProperty('PageTabs');
  act(() => root.render(h(UI.PageTabs, { label: 'Open pages', activeValue: 'draft',
    actions: h(UI.IconButton, { label: 'Page menu' }, '...'), children:
  h(UI.PageTab, { value: 'draft', label: 'Draft', active: true }) })));
  expect(container.querySelector('.ui-page-tabs-list [aria-label="Page menu"]')).toBeNull();
  expect(container.querySelector('[aria-label="Page menu"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Scroll pages left"]')).toBeNull();
  expect(container.querySelector('[aria-label="Scroll pages right"]')).toBeNull();
});

it('reveals the active page within its own viewport and updates overflow controls when scrolling', () => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
    return this.classList.contains('ui-page-tabs-viewport') ? 200 : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
    return this.classList.contains('ui-page-tabs-viewport') ? 600 : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const x = this.classList.contains('ui-page-tab') ? 400 - (container.querySelector('.ui-page-tabs-viewport')?.scrollLeft || 0) : 0;
    return { x, y: 0, width: 200, height: 48, left: x, right: x + 200, top: 0, bottom: 48, toJSON() {} };
  });
  act(() => root.render(h(UI.PageTabs, { label: 'Open pages', activeValue: 'last', children:
    h(UI.PageTab, { value: 'last', label: 'Last', active: true }) })));
  const viewport = container.querySelector<HTMLDivElement>('.ui-page-tabs-viewport')!;
  expect(viewport.scrollLeft).toBe(400);
  const left = container.querySelector<HTMLButtonElement>('[aria-label="Scroll pages left"]')!;
  const right = container.querySelector<HTMLButtonElement>('[aria-label="Scroll pages right"]')!;
  expect(right.disabled).toBe(true);
  expect(left.disabled).toBe(false);
  act(() => left.click());
  expect(viewport.scrollLeft).toBe(240);
  expect(right.disabled).toBe(false);
  act(() => { viewport.scrollLeft = 0; viewport.dispatchEvent(new Event('scroll')); });
  expect(left.disabled).toBe(true);
});

it('returns focus to the current page when a focused item is removed, without stealing unrelated focus', () => {
  const render = (removed = false) => root.render(h(UI.PageTabs, { label: 'Open pages', activeValue: removed ? 'home' : 'draft', children: [
    h(UI.PageTab, { key: 'home', value: 'home', label: 'Home', active: removed }),
    !removed && h(UI.PageTab, { key: 'draft', value: 'draft', label: 'Draft', active: true,
      action: h(UI.IconButton, { label: 'Close Draft' }, 'x') }),
  ] }));
  act(() => render());
  act(() => container.querySelector<HTMLButtonElement>('[aria-label="Close Draft"]')!.focus());
  act(() => render(true));
  expect(document.activeElement?.getAttribute('aria-current')).toBe('page');
  const outside = document.createElement('button');
  document.body.append(outside);
  act(() => outside.focus());
  act(() => render());
  expect(document.activeElement).toBe(outside);
  outside.remove();
});

function scrollingGeometry(viewWidth = 200, itemWidth = 200) {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(viewWidth);
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(600);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const item = this.classList.contains('ui-page-tab');
    const x = item ? 400 - (container.querySelector('.ui-page-tabs-viewport')?.scrollLeft || 0) : 0;
    const width = item ? itemWidth : viewWidth;
    return { x, y: 0, width, height: 48, left: x, right: x + width, top: 0, bottom: 48, toJSON() {} };
  });
}

it('preserves manual scrolling through unrelated parent rerenders', () => {
  scrollingGeometry();
  const render = () => root.render(h(UI.PageTabs, { label: 'Open pages', activeValue: 'last', children:
    h(UI.PageTab, { value: 'last', label: 'Last', active: true }) }));
  act(render);
  act(() => container.querySelector<HTMLButtonElement>('[aria-label="Scroll pages left"]')!.click());
  const viewport = container.querySelector('.ui-page-tabs-viewport')!;
  expect(viewport.scrollLeft).toBe(240);
  act(render);
  expect(viewport.scrollLeft).toBe(240);
});

it('measures overflowing pages even when the current route has no active item', () => {
  scrollingGeometry();
  act(() => root.render(h(UI.PageTabs, { label: 'Open pages', activeValue: '', children:
    h(UI.PageTab, { value: 'last', label: 'Last' }) })));
  expect(container.querySelector('[aria-label="Scroll pages right"]')).not.toBeNull();
});

it('aligns an oversized active item consistently instead of alternating its edges', () => {
  scrollingGeometry(150, 200);
  act(() => root.render(h(UI.PageTabs, { label: 'Open pages', activeValue: 'last', children:
    h(UI.PageTab, { value: 'last', label: 'Last', active: true }) })));
  expect(container.querySelector('.ui-page-tabs-viewport')!.scrollLeft).toBe(400);
});

it('restores the current page focus after removal through a portaled context menu', async () => {
  let removed = false;
  const render = () => root.render(h(UI.PageTabs, { label: 'Open pages', activeValue: removed ? 'home' : 'draft', children: [
    h(UI.PageTab, { key: 'home', value: 'home', label: 'Home', active: removed }),
    !removed && h(UI.ContextMenu, { key: 'draft', items: [{ key: 'close', label: 'Close draft' }],
      onSelect: () => { removed = true; render(); }, children:
        h(UI.PageTab, { value: 'draft', label: 'Draft', active: true }) }),
  ] }));
  act(render);
  const trigger = container.querySelector<HTMLButtonElement>('[aria-current="page"]')!;
  act(() => trigger.focus());
  await act(async () => { trigger.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, button: 2 })); });
  const item = document.querySelector<HTMLElement>('[role="menuitem"]')!;
  expect(item).not.toBeNull();
  act(() => item.focus());
  await act(async () => item.click());
  expect(document.activeElement?.textContent).toBe('Home');
  expect(document.activeElement?.getAttribute('aria-current')).toBe('page');
});
