/** @vitest-environment jsdom */
import { execSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { compile, compileString } from 'sass';
import { expect, it } from 'vitest';

const mixinPath = resolve('src/styles/prose.scss');
const componentPath = resolve('src/components/Prose/Prose.scss');
const compileHost = () => compileString(`
  @use 'prose' as typography;
  .editor-host { @include typography.prose; }
`, { loadPaths: [resolve('src/styles')] });

function declarations(css: string, selector: string) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  try {
    const rule = Array.from(style.sheet!.cssRules).find(
      rule => (rule as CSSStyleRule).selectorText === selector,
    ) as CSSStyleRule | undefined;
    expect(rule, selector).toBeDefined();
    return rule!.style;
  } finally {
    style.remove();
  }
}

it('compiles a standalone mixin without emitting global styles or importing dependencies', () => {
  expect(compile(mixinPath).css).toBe('');
  const result = compileHost();
  expect(result.loadedUrls.map(url => url.href)).toEqual([pathToFileURL(mixinPath).href]);
  expect(declarations(result.css, '.editor-host').getPropertyValue('font-family'))
    .toBe('var(--ui-font-family-sans)');
  expect(result.css).not.toMatch(/:root|\.ui-prose|Milkdown|Vditor|ProseMirror|taskItem|!important/i);
});

it('compiles the component from the same mixin with identical rules and selector specificity', () => {
  const component = compile(componentPath);
  expect(component.loadedUrls.map(url => url.href)).toContain(pathToFileURL(mixinPath).href);
  expect(component.css).toBe(compileHost().css.replaceAll('.editor-host', '.ui-prose'));
});

it('makes normal body fonts and heading padding and borders explicit', () => {
  const css = compile(componentPath).css;
  const host = declarations(css, '.ui-prose');
  expect(host.getPropertyValue('font-weight')).toBe('var(--ui-font-weight-regular)');
  expect(host.getPropertyValue('font-style')).toBe('normal');
  const headings = declarations(css, '.ui-prose :where(h1, h2, h3, h4, h5, h6)');
  expect(headings.getPropertyValue('font-family')).toBe('inherit');
  expect(headings.getPropertyValue('font-style')).toBe('inherit');
  expect(headings.getPropertyValue('padding')).toBe('0px');
  expect(headings.getPropertyValue('border')).toBe('0px');
  const body = declarations(css, '.ui-prose :where(p, ul, ol, li, blockquote)');
  for (const property of ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height']) {
    expect(body.getPropertyValue(property), property).toBe('inherit');
  }
  expect(declarations(css, '.ui-prose :where(p)').getPropertyValue('padding')).toBe('0px');
  expect(declarations(css, '.ui-prose :where(blockquote)').getPropertyValue('border')).toBe('0px');
});

it('preserves code whitespace, syntax colors and native table layout without broad resets', () => {
  const css = compileHost().css;
  const pre = declarations(css, '.editor-host :where(pre)');
  expect(pre.getPropertyValue('white-space')).toBe('pre');
  expect(pre.getPropertyValue('overflow-wrap')).toBe('normal');
  const code = declarations(css, '.editor-host :where(pre code)');
  expect(code.getPropertyValue('white-space')).toBe('pre');
  expect(code.getPropertyValue('padding')).toBe('0px');
  const table = declarations(css, '.editor-host :where(table)');
  expect(table.getPropertyValue('display')).toBe('table');
  expect(declarations(css, '.editor-host :where(tr)').getPropertyValue('background')).toBe('transparent');
  expect(declarations(css, '.editor-host :where(tr)').getPropertyValue('border')).toBe('0px');
  expect(declarations(css, '.editor-host :where(th, td)').getPropertyValue('white-space')).toBe('normal');
  expect(declarations(css, '.editor-host :where(hr)').getPropertyValue('height')).toBe('0px');
  expect(declarations(css, '.editor-host :where(hr)').getPropertyValue('padding')).toBe('0px');
  expect(declarations(css, '.editor-host :where(hr)').getPropertyValue('background')).toBe('transparent');
  expect(table.getPropertyValue('overflow-wrap')).toBe('normal');
  expect(css).toContain('hljs-punctuation');
  expect(css).not.toMatch(/\*|:where\((?:span|div)\)|line-number|linenumber|counter-|content:/i);
});

it('builds and resolves the public Sass export with self-contained source in the published files', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  expect(pkg.exports['./prose.scss']).toBe('./dist/prose.scss');
  expect(pkg.files).toContain('dist');
  rmSync(resolve('dist/prose.scss'), { force: true });
  execSync('pnpm run build', {
    cwd: resolve('.'), stdio: 'pipe', timeout: 90_000,
    env: { ...process.env, NODE_ENV: 'production' },
  });
  const require = createRequire(pathToFileURL(resolve('package.json')));
  const builtPath = require.resolve('@novel-isr/ui/prose.scss');
  expect(readFileSync(builtPath, 'utf8')).toBe(readFileSync(mixinPath, 'utf8'));
  const css = compileString(`
    @use '@novel-isr/ui/prose.scss' as typography;
    .editor-host { @include typography.prose; }
  `, {
    importers: [{ findFileUrl: url => new URL(pathToFileURL(require.resolve(url)).href) }],
  }).css;
  expect(css).toBe(compileHost().css);
}, 120_000);
