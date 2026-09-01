/**
 * @vitest-environment happy-dom
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from '../ThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function ThemeHarness() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button data-resolved-theme={resolvedTheme} onClick={() => setTheme('dark')}>
      dark
    </button>
  );
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

  it('updates resolvedTheme when the system preference changes', () => {
    let onChange: ((event: MediaQueryListEvent) => void) | undefined;
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (() => ({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        onChange = listener;
      },
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    })) as typeof window.matchMedia;

    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(
        <ThemeProvider defaultTheme="system" disableStorage>
          <ThemeHarness />
        </ThemeProvider>
      );
    });
    expect(container.querySelector('button')?.dataset.resolvedTheme).toBe('light');

    act(() => onChange?.({ matches: true } as MediaQueryListEvent));
    expect(container.querySelector('button')?.dataset.resolvedTheme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');

    act(() => root.unmount());
    window.matchMedia = originalMatchMedia;
  });
});
