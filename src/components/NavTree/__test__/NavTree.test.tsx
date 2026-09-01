/**
 * @vitest-environment happy-dom
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { NavTree } from '../NavTree';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('NavTree', () => {
  it('keeps active item content and trailing metadata visible', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <NavTree
          activeId="analytics"
          sections={[
            {
              id: 'main',
              items: [
                {
                  id: 'analytics',
                  label: '访问统计',
                  icon: <span>chart</span>,
                  endContent: <span data-testid="status">3</span>,
                },
              ],
            },
          ]}
        />,
      );
    });

    const activeItem = container.querySelector('.ui-nav-tree-item-active');
    expect(activeItem?.textContent).toContain('访问统计');
    expect(activeItem?.querySelector('[data-testid="status"]')?.textContent).toBe('3');

    act(() => root.unmount());
  });

  it('uses semantic theme tokens for the active state', () => {
    const css = readFileSync(
      path.join(process.cwd(), 'src/components/NavTree/NavTree.scss'),
      'utf8',
    );

    expect(css).toMatch(
      /\.ui-nav-tree-item-active\s*\{[^}]*background:\s*var\(--ui-color-selected\)[^}]*color:\s*var\(--ui-color-fg\)/s,
    );
    expect(css).toMatch(
      /\.ui-nav-tree-item-active \.ui-nav-tree-icon\s*\{[^}]*color:\s*var\(--ui-color-brand-500\)/s,
    );
    expect(css).toMatch(/\.ui-nav-tree-item-active:hover/);
    expect(css).toMatch(/\.ui-nav-tree-item-active:focus-visible/);
    expect(css).not.toMatch(/inset\s+3px\s+0\s+0/);
  });

  it('notifies consumers when a collapsed branch is selected', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    const onItemSelect = vi.fn();

    act(() => {
      root.render(
        <NavTree
          collapsed
          onItemSelect={onItemSelect}
          sections={[
            {
              id: 'main',
              items: [
                {
                  id: 'operations',
                  label: '运营',
                  children: [{ id: 'analytics', label: '访问统计' }],
                },
              ],
            },
          ]}
        />,
      );
    });

    act(() => container.querySelector('button')?.click());
    expect(onItemSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'operations' }));

    act(() => root.unmount());
  });

  it('lets controlled expanded ids reopen an explicitly collapsed active branch', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    const sections = [
      {
        id: 'main',
        items: [
          {
            id: 'operations',
            label: '运营',
            children: [{ id: 'analytics', label: '访问统计' }],
          },
        ],
      },
    ];

    act(() => {
      root.render(<NavTree activeId="analytics" expandedIds={[]} sections={sections} />);
    });
    expect(container.textContent).toContain('访问统计');

    act(() => container.querySelector('button')?.click());
    expect(container.textContent).not.toContain('访问统计');

    act(() => {
      root.render(<NavTree activeId="analytics" expandedIds={['operations']} sections={sections} />);
    });
    expect(container.textContent).toContain('访问统计');

    act(() => root.unmount());
  });
});
