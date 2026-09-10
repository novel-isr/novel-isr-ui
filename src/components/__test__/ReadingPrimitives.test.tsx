/** @vitest-environment happy-dom */
import { act, createElement, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it } from 'vitest';
import * as UI from '../../index';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const container = document.createElement('div');
document.body.append(container);
let root = createRoot(container);
afterEach(() => { act(() => root.unmount()); root = createRoot(container); });

it('styles a routed anchor without nesting interactive elements or losing its ref', () => {
  expect(UI).toHaveProperty('TextLink');
  const ref = createRef<HTMLAnchorElement>();
  act(() => root.render(createElement(UI.TextLink, { asChild: true, variant: 'action', ref },
    createElement('a', { href: '/settings', className: 'router-link' }, 'Settings'))));
  const link = container.querySelector('a')!;
  expect(container.querySelectorAll('a')).toHaveLength(1);
  expect(link.getAttribute('href')).toBe('/settings');
  expect(link.classList.contains('ui-text-link')).toBe(true);
  expect(link.classList.contains('router-link')).toBe(true);
  expect(link.querySelector('button, a')).toBeNull();
  expect(ref.current).toBe(link);
});

it('separates a metric value from its explanatory text, including a real zero', () => {
  act(() => root.render(createElement(UI.StatCard, { label: 'Articles', value: 0, description: 'No drafts' })));
  expect(container.querySelector('dt')?.textContent).toBe('Articles');
  expect(container.querySelector('dd')?.textContent).toBe('0');
  expect(container.querySelector('.ui-stat-description')?.textContent).toBe('No drafts');
  expect(container.querySelector('[description]')).toBeNull();
});

it('gives quiet navigation a visible non-color cue without duplicating its anchor', () => {
  act(() => root.render(createElement(UI.TextLink, { asChild: true, variant: 'subtle' },
    createElement('a', { href: '/articles' }, 'Articles'))));
  expect(container.querySelectorAll('a')).toHaveLength(1);
  expect(container.querySelector('a svg[aria-hidden="true"]')).not.toBeNull();
  expect(container.querySelector('a')?.textContent).toBe('Articles');
});

it('renders account metadata as labeled fields rather than large statistics', () => {
  expect(UI).toHaveProperty('DescriptionList');
  act(() => root.render(createElement(UI.DescriptionList, { items: [
    { key: 'id', label: 'Account ID', value: createElement('code', null, '12345678-1234-4234-8234-123456789012') },
    { key: 'keys', label: 'Passkeys', value: 0 },
  ] })));
  expect([...container.querySelectorAll('dt')].map(el => el.textContent)).toEqual(['Account ID', 'Passkeys']);
  expect([...container.querySelectorAll('dd')].map(el => el.textContent)).toEqual(['12345678-1234-4234-8234-123456789012', '0']);
  expect(container.querySelector('.ui-stat-card')).toBeNull();
});
