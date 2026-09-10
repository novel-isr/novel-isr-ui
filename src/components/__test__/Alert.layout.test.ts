import { compile } from 'sass';
import { expect, it } from 'vitest';

const css = compile('src/components/Alert/Alert.scss').css;

it('allows the alert root to shrink inside flex and grid layouts', () => {
  expect(css).toMatch(/\.ui-alert\s*\{[^}]*min-width:\s*0\s*;/);
});

it('lets alert titles and content inherit wrapping for unbroken text', () => {
  expect(css).toMatch(/\.ui-alert\s*\{[^}]*overflow-wrap:\s*anywhere\s*;/);
});
