/** @vitest-environment happy-dom */
import { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { compile } from 'sass';
import * as UI from '../../index';

it('declarative table headers explicitly identify their columns', () => {
  const html = renderToStaticMarkup(<UI.Table columns={[{ key: 'name', header: 'Name' }]} data={[{ name: 'A' }]} />);
  expect(html).toMatch(/<th[^>]*scope="col"/);
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

it('exports an accessible responsive grid with normalized spacing and forwarded attributes', () => {
  expect(UI).toHaveProperty('ResponsiveGrid');
  const ref = createRef<HTMLElement>();
  act(() => root.render(<UI.ResponsiveGrid ref={ref} as="section" aria-label="Metrics" className="consumer"
    columns={{base:1,sm:2,md:4}} gap={3} rowGap={2} columnGap="20px" data-testid="grid">
    <button>First</button><button>Second</button>
  </UI.ResponsiveGrid>));
  expect(ref.current?.tagName).toBe('SECTION');
  expect(ref.current?.classList.contains('consumer')).toBe(true);
  expect(ref.current?.getAttribute('aria-label')).toBe('Metrics');
  expect(ref.current?.getAttribute('role')).toBeNull();
  expect(ref.current?.hasAttribute('columns')).toBe(false);
  expect(ref.current?.style.getPropertyValue('--ui-grid-sm')).toBe('2');
  expect(ref.current?.style.getPropertyValue('--ui-grid-lg')).toBe('4');
  expect(ref.current?.style.getPropertyValue('--ui-grid-row-gap')).toBe('var(--ui-space-2)');
  expect(ref.current?.style.getPropertyValue('--ui-grid-column-gap')).toBe('20px');
  expect(Array.from(container.querySelectorAll('button'), node => node.textContent)).toEqual(['First','Second']);
});

it('resolves sparse breakpoints and resets nested grid defaults', () => {
  expect(UI).toHaveProperty('ResponsiveGrid');
  act(() => root.render(<UI.ResponsiveGrid columns={{md:3}}>
    <UI.ResponsiveGrid data-testid="inner"><span>Nested</span></UI.ResponsiveGrid>
  </UI.ResponsiveGrid>));
  const outer = container.firstElementChild as HTMLElement;
  expect(['base','sm','md','lg'].map(key => outer.style.getPropertyValue(`--ui-grid-${key}`))).toEqual(['1','1','3','3']);
  const inner = container.querySelector<HTMLElement>('[data-testid="inner"]')!;
  expect(['base','sm','md','lg'].map(key => inner.style.getPropertyValue(`--ui-grid-${key}`))).toEqual(['1','1','1','1']);
});

it('rejects invalid column counts without emitting broken CSS', () => {
  expect(UI).toHaveProperty('ResponsiveGrid');
  for (const columns of [0,-1,1.5,13,NaN,Infinity]) {
    expect(() => renderToStaticMarkup(<UI.ResponsiveGrid columns={columns} />)).toThrow(/columns/);
  }
  expect(() => renderToStaticMarkup(<UI.ResponsiveGrid columns={{md:0}} />)).toThrow(/columns/);
  expect(renderToStaticMarkup(<UI.ResponsiveGrid columns={12} />)).toContain('--ui-grid-lg:12');
});

it('renders bounded primary and secondary table content, including zero values and semantic code', () => {
  expect(UI).toHaveProperty('TableCellContent');
  const ref = createRef<HTMLDivElement>();
  act(() => root.render(<UI.TableCellContent ref={ref} primary={0} secondary={0} maxWidth={240} />));
  expect(ref.current?.style.maxWidth).toBe('240px');
  expect(container.querySelector('.ui-table-cell-primary')?.textContent).toBe('0');
  expect(container.querySelector('.ui-table-cell-secondary')?.textContent).toBe('0');
  act(() => root.render(<UI.TableCellContent primary={'<img src=x>'} monospace />));
  expect(container.querySelector('code')?.textContent).toBe('<img src=x>');
  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('.ui-table-cell-secondary')).toBeNull();
});

it('renders named keyboard-scrollable code without interpreting or reformatting its content', () => {
  expect(UI).toHaveProperty('CodeBlock');
  const text = '{\n  "text": "<script>unsafe()</script>"\n}';
  const ref = createRef<HTMLPreElement>();
  act(() => root.render(<UI.CodeBlock aria-label="Record" ref={ref}>{text}</UI.CodeBlock>));
  expect(ref.current?.getAttribute('role')).toBe('region');
  expect(ref.current?.getAttribute('aria-label')).toBe('Record');
  expect(ref.current?.tabIndex).toBe(0);
  expect(ref.current?.style.maxHeight).toBe('24rem');
  expect(container.querySelector('code')?.textContent).toBe(text);
  expect(container.querySelector('script')).toBeNull();
  expect(ref.current?.dataset.wrap).toBe('true');
  act(() => root.render(<UI.CodeBlock aria-label="Raw" wrap={false} maxHeight={200}>{text}</UI.CodeBlock>));
  expect(container.querySelector('pre')?.dataset.wrap).toBe('false');
  expect(container.querySelector('pre')?.style.maxHeight).toBe('200px');
});

it('bounds Page width through its public API without forwarding styling props to DOM', () => {
  act(() => root.render(<UI.Page maxWidth={960}>Profile</UI.Page>));
  expect((container.firstElementChild as HTMLElement).style.maxWidth).toBe('960px');
  expect(container.firstElementChild?.hasAttribute('maxwidth')).toBe(false);
});

it('does not disable table scrolling when borders are enabled', () => {
  const css = compile('src/components/Table/Table.scss').css;
  expect(css).not.toMatch(/\.ui-table-variant-bordered\s*\{[^}]*overflow:\s*hidden/);
  expect(css).toMatch(/\.ui-table-wrapper\s*\{[^}]*overflow-x:\s*auto/);
});
