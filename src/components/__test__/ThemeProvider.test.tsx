/**
 * @vitest-environment happy-dom
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from '../ThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function ThemeHarness() {
  const { setTheme } = useTheme();
  return <button onClick={() => setTheme('dark')}>dark</button>;
}

describe('ThemeProvider', () => {
  it('keeps native browser controls in sync with the resolved theme', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <ThemeProvider defaultTheme="light" disableStorage>
          <ThemeHarness />
        </ThemeProvider>
      );
    });
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');

    act(() => {
      container.querySelector('button')?.click();
    });
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');

    act(() => root.unmount());
  });
});
