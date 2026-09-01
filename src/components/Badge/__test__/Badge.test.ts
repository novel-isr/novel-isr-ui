import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Badge', () => {
  it('uses the palette-aware inverse foreground for every solid color', () => {
    const css = readFileSync(
      path.join(process.cwd(), 'src/components/Badge/Badge.scss'),
      'utf8',
    );
    const solidRules = css.match(/\.ui-badge-variant-solid[^}]+}/g) ?? [];

    expect(solidRules).toHaveLength(5);
    for (const rule of solidRules) {
      expect(rule).toContain('color: var(--ui-color-fg-inverse)');
      expect(rule).not.toMatch(/#fff(?:fff)?/i);
    }
  });
});
