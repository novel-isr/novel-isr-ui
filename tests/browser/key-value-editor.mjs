import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import ts from 'typescript';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../..', import.meta.url));
const output = process.env.KEY_VALUE_TEST_OUTPUT || `${root}/node_modules/.cache/key-value-editor`;
const code = `
import React,{useState}from'react';import{createRoot}from'react-dom/client';import{flushSync}from'react-dom';
import{KeyValueEditor,FormLayout,Input,Textarea,ThemeProvider,useTheme}from'/dist/index.js';import'/dist/styles.css';
function Fixture(){const{setTheme}=useTheme();const[disabled,setDisabled]=useState(false);
const[entries,setEntries]=useState([{id:'first',key:'legacy\\nkey',value:'Hello\\nworld'},
{id:'second',key:'long-key',value:'UnbrokenTranslation'.repeat(40)+'\\nSecond line'}]);
window.fixture={theme:value=>flushSync(()=>setTheme(value)),disable:value=>flushSync(()=>setDisabled(value))};
window.entries=entries;
return <FormLayout onSubmit={event=>{event.preventDefault();window.submitted=true;}}>
<KeyValueEditor entries={entries} onChange={setEntries} disabled={disabled}
keyLabel='Header key' valueLabel='Header value' addLabel='Add header' removeLabel='Delete header'
errors={{second:{value:'TranslationNeedsReview'.repeat(20)}}}/>
<section aria-label='Shared field comparison'><Input aria-label='Reference input'/>
<Textarea aria-label='Filled textarea' variant='filled'/>
<Textarea aria-label='Disabled textarea' disabled/>
<Textarea aria-label='Unstyled textarea' variant='unstyled'/></section></FormLayout>;
}createRoot(document.getElementById('root')).render(<ThemeProvider defaultTheme='light' defaultPalette='graphite' disableStorage><Fixture/></ThemeProvider>);`;
const server = await createServer({
  root, configFile: false, cacheDir: `${root}/node_modules/.cache/key-value-editor-vite`,
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{
    name: 'key-value-editor',
    resolveId: id => id === '/fixture.tsx' ? '\0key-value-editor' : undefined,
    load: id => id === '\0key-value-editor'
      ? ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText : undefined,
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (new URL(req.url, 'http://localhost').pathname !== '/') return next();
        try {
          const html = await vite.transformIndexHtml(req.url, '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:16px;background:var(--ui-color-canvas);color:var(--ui-color-fg)}#root{max-width:900px}section{display:grid;gap:16px}</style></head><body><div id="root"></div><script type="module" src="/fixture.tsx"></script></body></html>');
          res.setHeader('Content-Type', 'text/html');res.end(html);
        } catch (error) { next(error); }
      });
    },
  }],
});
let browser;
try {
  await server.listen();await mkdir(output, { recursive: true });
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await page.goto(base);await page.locator('.ui-key-value-editor').waitFor();
  const key = page.getByRole('textbox', { name: 'Header key 1', exact: true });
  const value = page.getByRole('textbox', { name: 'Header value 1', exact: true });
  assert.equal(await key.inputValue(), 'legacy\nkey');assert.equal(await value.inputValue(), 'Hello\nworld');
  assert.equal(await key.getAttribute('rows'), '1');assert.equal(await value.getAttribute('rows'), '2');
  await value.fill('Hello!\nnew world');await value.press('End');await value.press('!');
  assert.equal(await page.evaluate(() => window.entries[0].value), 'Hello!\nnew world!');
  await key.fill('legacy\nkey.updated');
  assert.equal(await page.evaluate(() => window.entries[0].key), 'legacy\nkey.updated');
  const settled = () => page.locator('#root').evaluate(async el => {
    while (el.getAnimations({ subtree: true }).some(animation => animation.playState === 'running')) {
      await Promise.allSettled(el.getAnimations({ subtree: true }).map(animation => animation.finished));
    }
  });
  const colors = locator => locator.evaluate(el => {
    const s = getComputedStyle(el);
    const token = name => {
      const probe = document.createElement('span');probe.style.color = `var(${name})`;el.parentElement.append(probe);
      const color = getComputedStyle(probe).color;probe.remove();return color;
    };
    return { background: s.backgroundColor, border: s.borderTopColor, shadow: s.boxShadow,
      bg: token('--ui-color-bg'), subtle: token('--ui-color-bg-subtle'), muted: token('--ui-color-bg-muted'),
      focus: token('--ui-color-brand-500'), focusShadow: token('--ui-color-brand-100'),
      danger: token('--ui-color-danger-500'), errorShadow: token('--ui-color-danger-50') };
  });
  for (const width of [1280, 390, 320]) for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width, height: 800 });await page.evaluate(theme => window.fixture.theme(theme), theme);
    await value.blur();await page.mouse.move(0, 0);await settled();
    const normal = await colors(value);
    assert.equal(normal.background, normal.bg, `${theme}: outline textarea matches the settled theme background`);
    const input = await colors(page.locator('.ui-input-root'));
    console.log(`${theme}-${width}: settled Textarea=${normal.background}, token=${normal.bg}, Input=${input.background}`);
    assert.equal(input.background, theme === 'dark' ? input.subtle : input.bg, `${theme}: reference Input uses its theme background`);
    const filled = page.getByRole('textbox', { name: 'Filled textarea', exact: true });
    const disabledField = page.getByRole('textbox', { name: 'Disabled textarea', exact: true });
    const unstyled = page.getByRole('textbox', { name: 'Unstyled textarea', exact: true });
    assert.equal((await colors(filled)).background, normal.muted, `${theme}: filled textarea uses muted theme background`);
    assert.equal((await colors(disabledField)).background, normal.subtle, `${theme}: disabled textarea uses subtle theme background`);
    assert.equal((await colors(unstyled)).background, 'rgba(0, 0, 0, 0)');
    await value.focus();await settled();
    const focused = await colors(value);
    assert.equal(focused.background, normal.bg, `${theme}: focused background remains themed`);
    assert.equal(focused.border, normal.focus, `${theme}: focus uses theme brand color`);
    assert.equal(focused.shadow, `${normal.focusShadow} 0px 0px 0px 3px`);
    await filled.focus();await settled();
    assert.equal((await colors(filled)).background, normal.bg, `${theme}: filled focus uses theme background`);
    await unstyled.focus();await settled();
    assert.equal((await colors(unstyled)).background, 'rgba(0, 0, 0, 0)');
    assert.equal((await colors(unstyled)).shadow, 'none');
    await key.focus();await settled();
    const a = await key.boundingBox();const b = await value.boundingBox();
    if (width > 400) {
      assert.equal(a.y, b.y, 'wide editor aligns field starts');
      assert.ok(b.x >= a.x + a.width + 7, 'wide fields are separate columns');
    } else {
      assert.equal(a.x, b.x, 'narrow editor stacks fields');
      assert.ok(b.y >= a.y + a.height + 7, 'stacked fields do not overlap');
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    assert.ok(await page.locator('.ui-key-value-editor').evaluate(el => [...el.querySelectorAll('textarea,label,[role="alert"],button')].every(node => {
      const r = node.getBoundingClientRect();const parent = el.getBoundingClientRect();
      return r.left >= parent.left - 1 && r.right <= parent.right + 1 && node.scrollWidth <= node.clientWidth + 1;
    })), 'fields, long values, labels, errors and controls fit their container');
    const invalid = page.getByRole('textbox', { name: 'Header value 2', exact: true });
    assert.equal(await invalid.getAttribute('aria-invalid'), 'true');
    assert.ok(await invalid.evaluate(el => el.getAttribute('aria-describedby').split(' ').some(id => document.getElementById(id)?.getAttribute('role') === 'alert')));
    await page.screenshot({ path: `${output}/${theme}-${width}.png`, fullPage: true });
    await invalid.focus();await settled();
    const errorFocus = await colors(invalid);
    assert.equal(errorFocus.background, normal.bg, `${theme}: focused error retains themed background`);
    assert.equal(errorFocus.border, normal.danger, `${theme}: error border survives focus`);
    assert.equal(errorFocus.shadow, `${normal.errorShadow} 0px 0px 0px 3px`);
    await page.screenshot({ path: `${output}/${theme}-${width}-focused-error.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.locator('#root').evaluate(el => { el.style.width = '300px'; });
  assert.ok((await value.boundingBox()).y > (await key.boundingBox()).y, 'narrow desktop containers stack fields');
  await page.screenshot({ path: `${output}/dark-narrow-container.png`, fullPage: true });
  await page.getByRole('button', { name: 'Add header', exact: true }).click();
  assert.equal(await page.locator('.ui-key-value-editor textarea').count(), 6);
  assert.equal(await page.evaluate(() => new Set(window.entries.map(entry => entry.id)).size), 3);
  await page.getByRole('button', { name: 'Delete header 3', exact: true }).click();
  assert.equal(await page.locator('.ui-key-value-editor textarea').count(), 4);
  assert.equal(await page.locator('form').count(), 1, 'editor does not nest a form');
  assert.equal(await page.evaluate(() => !!window.submitted), false, 'add/remove never submit the parent form');
  await page.evaluate(() => window.fixture.disable(true));
  for (const control of await page.locator('.ui-key-value-editor textarea,.ui-key-value-editor button').all()) {
    assert.equal(await control.isDisabled(), true);
  }
  assert.deepEqual(errors, []);
  console.log('PASS KeyValueEditor: settled theme backgrounds compared with Input, filled/disabled/unstyled variants, focus and error border/ring colors, controlled multiline keys/values, long content, accessible errors, form-safe add/remove, disabled controls, light/dark at 1280/390/320px and narrow desktop container');
} finally { await browser?.close();await server.close(); }
