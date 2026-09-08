/** @vitest-environment happy-dom */
import { compile } from 'sass';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it('uses identical operations typography in both color modes', () => {
  const style = document.createElement('style');
  style.textContent = compile(resolve('src/styles/tokens.scss')).css;
  document.head.append(style);
  try {
    for (const palette of ['graphite', 'cool']) {
      document.documentElement.dataset.palette = palette;
      document.documentElement.dataset.theme = 'light';
      const light = getComputedStyle(document.documentElement).getPropertyValue('--ui-font-family-sans');
      const lightDisplay = getComputedStyle(document.documentElement).getPropertyValue('--ui-font-family-display');
      document.documentElement.dataset.theme = 'dark';
      const dark = getComputedStyle(document.documentElement).getPropertyValue('--ui-font-family-sans');
      expect(dark).toBe(light);
      expect(getComputedStyle(document.documentElement).getPropertyValue('--ui-font-family-display')).toBe(lightDisplay);
      expect(dark).toContain('PingFang SC');
    }
  } finally {
    style.remove();
    delete document.documentElement.dataset.palette;
    delete document.documentElement.dataset.theme;
  }
});
