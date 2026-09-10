/** @vitest-environment jsdom */
import { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { compile } from 'sass';
import * as UI from '../../index';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

it('exports a native Prose surface with DOM attributes, ref and events', () => {
  expect(UI).toHaveProperty('Prose');
  const ref = createRef<HTMLDivElement>();
  let clicks = 0;
  act(() => root.render(<UI.Prose ref={ref} id="document" className="consumer" aria-label="Article"
    data-owner="test" onClick={() => clicks++}><p>Article body</p></UI.Prose>));
  expect(ref.current?.tagName).toBe('DIV');
  expect(ref.current?.classList.contains('ui-prose')).toBe(true);
  expect(ref.current?.classList.contains('consumer')).toBe(true);
  expect(ref.current?.getAttribute('aria-label')).toBe('Article');
  expect(ref.current?.dataset.owner).toBe('test');
  act(() => ref.current?.click());
  expect(clicks).toBe(1);
});

it('slots an editor host without a second wrapper and composes refs and handlers', () => {
  expect(UI).toHaveProperty('Prose');
  const parentRef = createRef<HTMLDivElement>();
  const childRef = createRef<HTMLDivElement>();
  const calls: string[] = [];
  act(() => root.render(<UI.Prose asChild ref={parentRef} className="parent" onClick={() => calls.push('parent')}>
    <div ref={childRef} className="editor-host" onClick={() => calls.push('child')}><p>Draft</p></div>
  </UI.Prose>));
  expect(container.children).toHaveLength(1);
  expect(parentRef.current).toBe(childRef.current);
  expect(childRef.current?.className).toBe('ui-prose parent editor-host');
  expect(childRef.current?.hasAttribute('aschild')).toBe(false);
  act(() => childRef.current?.click());
  expect(calls).toEqual(['child', 'parent']);
});

it('preserves author inline formatting and treats string children as text, not HTML', () => {
  expect(UI).toHaveProperty('Prose');
  act(() => root.render(<UI.Prose>
    <p style={{ textAlign: 'right' }}><span style={{ color: 'rgb(18, 52, 86)', fontFamily: 'serif' }}>Author color</span></p>
    <mark style={{ backgroundColor: 'rgb(255, 240, 0)' }}>Author highlight</mark>
    {'<img src=x onerror=alert(1)>'}
  </UI.Prose>));
  expect(container.querySelector('p')?.style.textAlign).toBe('right');
  expect(container.querySelector('span')?.getAttribute('style')).toContain('color: rgb(18, 52, 86)');
  expect(container.querySelector('span')?.style.fontFamily).toBe('serif');
  expect(container.querySelector('mark')?.style.backgroundColor).toBe('rgb(255, 240, 0)');
  expect(container.querySelector('img')).toBeNull();
  expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
});

it('ships scoped semantic typography with readable syntax and no decorative transformations', () => {
  expect(UI).toHaveProperty('Prose');
  const css = compile('src/components/Prose/Prose.scss').css;
  expect(css).toMatch(/\.ui-prose\s*\{[^}]*overflow-wrap:\s*anywhere/);
  expect(css).toMatch(/:where\(blockquote\)/);
  expect(css).toMatch(/:where\(table\)\s*\{[^}]*overflow-wrap:\s*normal/);
  expect(css).toMatch(/:where\(pre\)[\s\S]*overflow-x:\s*auto/);
  expect(css).toMatch(/:where\(pre code\)\s*\{[^}]*white-space:\s*pre/);
  expect(css).toMatch(/:where\(a\)[\s\S]*text-decoration[^;]*underline/);
  expect(css).toMatch(/hljs-punctuation/);
  expect(css).toMatch(/color:\s*var\(--ui-color-fg\)/);
  expect(css).not.toMatch(/gradient|transform:|box-shadow:|content:|ProseMirror|taskItem|!important/);
  expect(css).not.toMatch(/color:\s*var\(--ui-color-border\)/);
  expect(css).not.toMatch(/(?:pre|table)[^{]*\{[^}]*display:\s*(?:block|flex|grid)/);
});
