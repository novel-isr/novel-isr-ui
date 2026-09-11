/** @vitest-environment happy-dom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { Tabs, TabList, Tab, TabPanel } from '../Tabs';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const container = document.createElement('div');
document.body.append(container);
let root = createRoot(container);
afterEach(() => { act(() => root.unmount()); root = createRoot(container); });

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
