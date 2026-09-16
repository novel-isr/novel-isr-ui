/** @vitest-environment happy-dom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { compile } from 'sass';
import { afterEach, expect, it, vi } from 'vitest';
import { Tabs, TabList, Tab, TabPanel } from '../Tabs';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const container = document.createElement('div');
document.body.append(container);
let root = createRoot(container);
afterEach(() => { act(() => root.unmount()); root = createRoot(container); });

it('applies per-tab semantic colors without leaking props or changing controlled selection', () => {
  const onValueChange = vi.fn();
  act(() => root.render(<Tabs variant="pills" colorScheme="danger" value="brand" onValueChange={onValueChange} activationMode="manual">
    <TabList aria-label="Languages">
      {(['brand', 'gray', 'success', 'warning', 'danger'] as const).map(colorScheme =>
        <Tab key={colorScheme} value={colorScheme} colorScheme={colorScheme} disabled={colorScheme === 'gray'}>{colorScheme}</Tab>)}
      <Tab value="inherited">Inherited</Tab>
    </TabList>
    <TabPanel value="brand">Editor</TabPanel>
  </Tabs>));
  const tabs = container.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  for (const [index, scheme] of ['brand', 'gray', 'success', 'warning', 'danger'].entries()) {
    expect(tabs[index]!.classList.contains(`ui-tabs-color-${scheme}`)).toBe(true);
    expect(tabs[index]!.hasAttribute('colorScheme')).toBe(false);
  }
  expect(tabs[5]!.className).toBe('ui-tabs-trigger');
  act(() => tabs[2]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
  expect(onValueChange).toHaveBeenCalledWith('success');
  expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
  expect(tabs[1]!.disabled).toBe(true);
  act(() => tabs[1]!.click());
  expect(onValueChange).toHaveBeenCalledTimes(1);
});

it('supports separated pill tabs with a configurable semantic color', () => {
  for (const colorScheme of ['brand', 'gray', 'success', 'warning', 'danger'] as const) {
    act(() => root.render(<Tabs variant="pills" colorScheme={colorScheme} defaultValue="en">
      <TabList aria-label="Languages"><Tab value="en">English</Tab></TabList>
      <TabPanel value="en">Translation editor</TabPanel>
    </Tabs>));
    expect(container.firstElementChild?.classList.contains('ui-tabs-variant-pills')).toBe(true);
    expect(container.firstElementChild?.classList.contains(`ui-tabs-color-${colorScheme}`)).toBe(true);
    expect(container.firstElementChild?.hasAttribute('colorScheme')).toBe(false);
  }
});

it('keeps explicit colors readable and selection distinct across palettes and themes', () => {
  const style = document.createElement('style');
  style.textContent = compile('src/styles/index.scss', { style: 'compressed' }).css;
  document.head.append(style);
  const luminance = (color: string) => {
    const channels = color.startsWith('#')
      ? color.slice(1).match(color.length === 4 ? /./g : /../g)!.map(value => parseInt(value.length === 1 ? value + value : value, 16))
      : color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    expect(channels, color).toHaveLength(3);
    const rgb = channels.map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
  };
  try {
    for (const palette of ['editorial', 'tech', 'graphite', 'cool']) {
      for (const theme of ['light', 'dark']) {
        container.dataset.palette = palette;
        container.dataset.theme = theme;
        const backgrounds = new Set<string>();
        for (const colorScheme of ['brand', 'gray', 'success', 'warning', 'danger'] as const) {
          act(() => root.render(<Tabs variant="pills" colorScheme="danger" value="selected">
            <TabList aria-label="Languages">
              <Tab value="selected" colorScheme={colorScheme}>Selected</Tab>
              <Tab value="inactive" colorScheme={colorScheme}>Inactive</Tab>
              <Tab value="disabled" colorScheme={colorScheme} disabled>Disabled</Tab>
            </TabList>
          </Tabs>));
          const [selected, inactive, disabled] = Array.from(container.querySelectorAll('[role="tab"]'), tab => getComputedStyle(tab));
          expect(inactive!.backgroundColor).not.toBe(selected!.backgroundColor);
          expect(inactive!.color).not.toBe(selected!.color);
          expect(selected!.borderBottomStyle).toBe('none');
          expect(inactive!.borderBottomStyle).toBe('none');
          expect(Number(disabled!.opacity)).toBe(0.5);
          backgrounds.add(inactive!.backgroundColor);
          for (const tab of [selected!, inactive!]) {
            const fg = luminance(tab.color);
            const bg = luminance(tab.backgroundColor);
            expect((Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05), `${palette}/${theme}/${colorScheme}`).toBeGreaterThanOrEqual(4.5);
          }
        }
        expect(backgrounds.size).toBe(5);
      }
    }
  } finally {
    style.remove();
    delete container.dataset.palette;
    delete container.dataset.theme;
  }
}, 30000);

it('does not apply colored pill selection to nested non-pill variants', () => {
  const style = document.createElement('style');
  style.textContent = compile('src/styles/index.scss', { style: 'compressed' }).css;
  document.head.append(style);
  const inspect = () => {
    const tab = container.querySelector('[aria-label="Nested"] [role="tab"]')!;
    const css = getComputedStyle(tab);
    return [css.backgroundColor, css.color, css.borderBottomStyle, css.borderBottomWidth, css.borderBottomColor];
  };
  try {
    for (const variant of ['line', 'enclosed', 'soft'] as const) {
      const inner = <Tabs variant={variant} value="inner"><TabList aria-label="Nested">
        <Tab value="inner" colorScheme="warning">Inner</Tab>
      </TabList></Tabs>;
      act(() => root.render(inner));
      const standalone = inspect();
      act(() => root.render(<Tabs variant="pills" value="outer">
        <TabList><Tab value="outer">Outer</Tab></TabList>
        <TabPanel value="outer">{inner}</TabPanel>
      </Tabs>));
      expect(inspect(), variant).toEqual(standalone);
    }
  } finally { style.remove(); }
});

it('connects the selected language to its editor and leaves controlled changes to the parent', () => {
  const onValueChange = vi.fn();
  const render = (value: string) => act(() => root.render(<Tabs value={value} onValueChange={onValueChange} activationMode="manual">
    <TabList aria-label="Languages"><Tab value="en">English</Tab><Tab value="ja">Japanese</Tab><Tab value="de" disabled>German</Tab></TabList>
    <TabPanel value={value}>Editor: {value}</TabPanel>
  </Tabs>));
  render('en');
  const tabs = container.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  act(() => tabs[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
  expect(onValueChange).toHaveBeenCalledWith('ja');
  expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
  act(() => tabs[2]!.click());
  expect(onValueChange).toHaveBeenCalledTimes(1);
  render('ja');
  const panel = container.querySelector('[role="tabpanel"]')!;
  expect(panel.id).toBe(tabs[1]!.getAttribute('aria-controls'));
  expect(panel.getAttribute('aria-labelledby')).toBe(tabs[1]!.id);
  expect(panel.textContent).toBe('Editor: ja');
});
