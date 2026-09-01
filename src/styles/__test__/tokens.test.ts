import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync(new URL('../tokens.scss', import.meta.url), 'utf8');
const themeToggle = readFileSync(
  new URL('../../components/ThemeToggle/ThemeToggle.scss', import.meta.url),
  'utf8'
);

describe('application palette token contract', () => {
  it.each(['graphite', 'cool'])('%s defines light and dark palette selectors', palette => {
    expect(tokens).toContain(`[data-palette='${palette}'][data-theme='light']`);
    expect(tokens).toContain(`[data-palette='${palette}'][data-theme='dark']`);
  });

  it.each([
    '--ui-color-canvas',
    '--ui-color-surface',
    '--ui-color-surface-raised',
    '--ui-color-control',
    '--ui-color-hover',
    '--ui-color-selected',
    '--ui-color-divider',
    '--ui-color-focus-ring',
  ])('exports the shared %s role', token => {
    expect(tokens).toContain(`${token}:`);
  });

  it('does not use dark-only ThemeToggle surface overrides', () => {
    expect(themeToggle).not.toContain("[data-theme='dark'] .ui-theme-toggle");
  });
});
