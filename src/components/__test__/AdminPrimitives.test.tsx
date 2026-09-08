/** @vitest-environment happy-dom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as UI from '../../index';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const container = document.createElement('div');
document.body.append(container);
let root = createRoot(container);
afterEach(() => { act(() => root.unmount()); root = createRoot(container); });

describe('operations primitives', () => {
  it('exports shared presentation instead of requiring app-owned primitives', () => {
    for (const name of ['Page', 'PageHeader', 'PageSection', 'Toolbar', 'StatCard', 'IconButton', 'DataTable', 'Menu', 'ContextMenu']) {
      expect(UI).toHaveProperty(name);
    }
  });

  it('keeps supplied server-page rows on page two and emits page changes', () => {
    expect(UI).toHaveProperty('DataTable');
    const onPageChange = vi.fn();
    act(() => root.render(createElement(UI.DataTable, {
      columns: [{ key: 'name', header: 'Name' }], data: [{ name: 'Page two row' }],
      pagination: { page: 2, pageSize: 10, total: 30, onPageChange },
    })));
    expect(container.querySelector('tbody')?.textContent).toContain('Page two row');
    act(() => (container.querySelector('[aria-label="下一页"]') as HTMLButtonElement).click());
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('shows retry instead of stale rows and hides pagination on error', () => {
    expect(UI).toHaveProperty('DataTable');
    const onRetry = vi.fn();
    act(() => root.render(createElement(UI.DataTable, {
      columns: [{ key: 'name', header: 'Name' }], data: [{ name: 'stale row' }],
      error: 'Request failed', onRetry,
      pagination: { page: 1, pageSize: 10, total: 20, onPageChange: vi.fn() },
    })));
    expect(container.textContent).toContain('Request failed');
    expect(container.textContent).not.toContain('stale row');
    expect(container.querySelector('nav')).toBeNull();
    act(() => (container.querySelector('button') as HTMLButtonElement).click());
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders semantic headings and an accessible non-submitting icon button', () => {
    expect(UI).toHaveProperty('PageHeader');
    act(() => root.render(createElement(UI.PageHeader, {
      title: 'Accounts', description: 'Directory',
      actions: createElement(UI.IconButton, { label: 'Refresh', children: 'R', disabled: true }),
    })));
    expect(container.querySelector('h1')?.textContent).toBe('Accounts');
    const button = container.querySelector('button');
    expect(button?.getAttribute('aria-label')).toBe('Refresh');
    expect(button?.type).toBe('button');
    expect(button?.disabled).toBe(true);
  });

  it('exposes menu items, ignores disabled actions, and closes after selection', async () => {
    const onSelect = vi.fn();
    await act(async () => root.render(createElement(UI.Menu, {
      items: [{ key: 'disabled', label: 'Disabled', disabled: true }, { key: 'edit', label: 'Edit' }],
      onSelect,
      children: createElement(UI.IconButton, { label: 'Actions', children: '...' }),
    })));
    const trigger = container.querySelector('button')!;
    await act(async () => trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })));
    const disabled = document.querySelector('[role="menuitem"][data-disabled]') as HTMLElement;
    expect(disabled?.textContent).toBe('Disabled');
    await act(async () => disabled.click());
    expect(onSelect).not.toHaveBeenCalled();
    const item = document.querySelector('[role="menuitem"]:not([data-disabled])') as HTMLElement;
    await act(async () => item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ key: 'edit' }));
    expect(document.querySelector('[role="menu"]')).toBeNull();
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps menu focus and Escape inside an enclosing modal', async () => {
    const onClose = vi.fn();
    await act(async () => root.render(createElement(UI.Modal, {
      isOpen: true, onClose, title: 'Settings',
      children: createElement(UI.Menu, { items: [{ key: 'edit', label: 'Edit' }],
        children: createElement(UI.IconButton, { label: 'Nested actions', children: '...' }),
      }),
    })));
    const trigger = document.querySelector('[aria-label="Nested actions"]') as HTMLElement;
    await act(async () => trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
    await act(async () => document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(onClose).not.toHaveBeenCalled();
    expect(document.querySelector('[role="menu"]')).toBeNull();
  });
});
