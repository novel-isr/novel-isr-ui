import { compile } from 'sass';
import { expect, it } from 'vitest';

const css = compile('src/components/Modal/Modal.scss').css;

it('wraps plain modal text without changing nested code whitespace', () => {
  for (const selector of ['header', 'description', 'body']) {
    expect(css).toMatch(new RegExp(`\\.ui-modal-${selector}[^{}]*\\{[^}]*overflow-wrap:\\s*anywhere`));
  }
  expect(css).not.toMatch(/\.ui-modal-body\s+(?:pre|code)[^{]*\{[^}]*(?:white-space:\s*normal|overflow-x:\s*hidden)/);
});

it('reserves title space only when the close button is rendered', () => {
  expect(css).toMatch(/\.ui-modal-content:has\(> \.ui-modal-close\) \.ui-modal-header\s*\{[^}]*padding-right:/);
});

it('bounds footer actions and lets long command labels wrap', () => {
  expect(css).toMatch(/\.ui-modal-footer > \*\s*\{[^}]*max-width:\s*100%/);
  expect(css).toMatch(/\.ui-modal-footer \.ui-button-label\s*\{[^}]*white-space:\s*normal/);
});

it('keeps form content after the description and bounds oversized fixed regions', () => {
  expect(css).toMatch(/\.ui-modal-content > form[^{}]*\{[^}]*order:\s*2/);
  for (const selector of ['header', 'description', 'footer']) {
    expect(css).toMatch(new RegExp(`\\.ui-modal-${selector}\\s*\\{[^}]*max-height:\\s*\\d+dvh;[^}]*overflow-y:\\s*auto`));
  }
});
