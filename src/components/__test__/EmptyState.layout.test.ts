import { compile } from 'sass';
import { expect, it } from 'vitest';

const css = compile('src/components/EmptyState/EmptyState.scss').css;

it('bounds shared empty state content and wraps unbroken error descriptions', () => {
  expect(css).toMatch(/\.ui-empty-state\s*\{[^}]*min-width:\s*0\s*;/);
  expect(css).toMatch(/\.ui-empty-state\s*\{[^}]*max-width:\s*100%\s*;/);
  expect(css).toMatch(/\.ui-empty-state\s*\{[^}]*overflow-wrap:\s*anywhere\s*;/);
});

it('bounds and wraps action labels instead of expanding narrow error pages', () => {
  expect(css).toMatch(/\.ui-empty-state-actions\s*\{[^}]*max-width:\s*100%\s*;/);
  expect(css).toMatch(/\.ui-empty-state-actions > \*\s*\{[^}]*max-width:\s*100%\s*;/);
  expect(css).toMatch(/\.ui-empty-state-actions \.ui-button-label\s*\{[^}]*white-space:\s*normal\s*;/);
});
