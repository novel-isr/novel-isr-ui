import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import ts from 'typescript';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../..', import.meta.url));
const output = process.env.TABS_TEST_OUTPUT || '/tmp/ui-language-tabs';
const code = `import React,{useState}from'react';import{createRoot}from'react-dom/client';import{flushSync}from'react-dom';
import{Tabs,TabList,Tab,TabPanel,Textarea,KeyValueEditor,ThemeProvider,useTheme}from'/dist/index.js';import'/dist/styles.css';
function App(){const{setTheme,setPalette}=useTheme();const[scheme,color]=useState('brand');const[value,select]=useState('en');
window.fixture={theme:(theme,palette)=>flushSync(()=>{setTheme(theme);setPalette(palette)}),color:c=>flushSync(()=>color(c)),select:v=>flushSync(()=>select(v))};
return <Tabs value={value} onValueChange={select} variant='pills' colorScheme={scheme} activationMode='manual'>
<TabList aria-label='Languages'>{['en','ja','disabled','zh-hans','fr','de','es','it','pt-br','ko'].map(v=><Tab key={v} value={v} disabled={v==='disabled'}>{v}</Tab>)}</TabList>
<TabPanel value={value}><Textarea aria-label='Notes' resize='both' rows={3} defaultValue={'long text\\n'.repeat(40)}/>
<KeyValueEditor entries={[{id:'1',key:'home',value:'Welcome'}]} onChange={()=>{}}/><textarea aria-label='Native'/></TabPanel></Tabs>}
createRoot(document.getElementById('root')).render(<ThemeProvider defaultTheme='light' defaultPalette='graphite' disableStorage><App/></ThemeProvider>);`;
const server = await createServer({ root, configFile: false, cacheDir: '/tmp/ui-language-tabs-vite',
  server: { host: '127.0.0.1', port: 0 }, plugins: [{ name: 'language-tabs',
    resolveId: id => id === '/fixture.tsx' ? '\0language-tabs' : undefined,
    load: id => id === '\0language-tabs' ? ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText : undefined,
    configureServer(vite) { vite.middlewares.use(async (req, res, next) => {
      if (new URL(req.url, 'http://localhost').pathname !== '/') return next();
      try { res.setHeader('Content-Type', 'text/html'); res.end(await vite.transformIndexHtml(req.url,
        '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/fixture.tsx"></script></body></html>'));
      } catch (error) { next(error); }
    }); },
  }],
});
let browser;
try {
  await server.listen(); await mkdir(output, { recursive: true });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
  const list = page.getByRole('tablist', { name: 'Languages' }); await list.waitFor();
  const selected = () => list.getByRole('tab', { selected: true });
  const settled = () => page.locator('.ui-tabs').evaluate(async el => {
    await Promise.allSettled(el.getAnimations({ subtree: true }).map(animation => animation.finished));
  });
  for (const width of [1280, 390, 320]) for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width, height: 700 });
    for (const palette of ['editorial', 'tech', 'graphite', 'cool']) {
      await page.evaluate(({ theme, palette }) => window.fixture.theme(theme, palette), { theme, palette });
      for (const scheme of ['brand', 'gray', 'success', 'warning', 'danger']) {
        await page.evaluate(scheme => window.fixture.color(scheme), scheme); await settled();
        const inspect = () => selected().evaluate(el => {
          const s = getComputedStyle(el); const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1; const ctx = canvas.getContext('2d');
          const lum = color => { ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
            const rgb = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).map(v => { const c = v / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; });
            return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722; };
          const fg = lum(s.color), bg = lum(s.backgroundColor);
          return { contrast: (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05), color: s.color, background: s.backgroundColor, radius: parseFloat(s.borderRadius), shadow: s.boxShadow };
        });
        const before = await inspect();
        assert.ok(before.contrast >= 4.5, `${palette}/${theme}/${scheme} contrast ${before.contrast}`);
        assert.ok(before.radius > 0 && before.radius <= 8); assert.equal(before.shadow, 'none');
        await selected().hover(); await settled(); assert.deepEqual(await inspect(), before, 'selected hover must preserve its color');
      }
    }
    await page.evaluate(theme => { window.fixture.theme(theme, 'graphite'); window.fixture.color('brand'); }, theme);
    await settled();
    assert.ok(await list.evaluate(el => parseFloat(getComputedStyle(el).gap) >= 8));
    assert.ok(await page.locator('textarea').evaluateAll(fields => fields.every(el => getComputedStyle(el).resize === 'none')));
    const notes = page.getByRole('textbox', { name: 'Notes' });
    assert.ok(await notes.evaluate(el => { el.scrollTop = el.scrollHeight; return el.scrollTop > 0; }));
    await list.getByRole('tab', { name: 'en', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.activeElement.textContent === 'ja');
    assert.equal(await selected().innerText(), 'en');
    await page.keyboard.press('Enter'); assert.equal(await selected().innerText(), 'ja');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.activeElement.textContent === 'zh-hans');
    await page.keyboard.press('End');
    await page.waitForFunction(() => document.activeElement.textContent === 'ko');
    await page.keyboard.press('Enter');
    assert.equal(await selected().innerText(), 'ko');
    assert.ok(await selected().evaluate(el => { const box = el.getBoundingClientRect(); const list = el.closest('[role="tablist"]').getBoundingClientRect(); return box.left >= list.left - 1 && box.right <= list.right + 1; }));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const panelId = await selected().getAttribute('aria-controls');
    assert.equal(await page.getByRole('tabpanel').getAttribute('id'), panelId);
    await page.mouse.move(0, 650); await settled();
    await page.screenshot({ path: `${output}/tabs-${width}-${theme}.png` });
    await list.getByRole('tab', { name: 'en', exact: true }).click();
    await page.evaluate(() => window.fixture.select('ko'));
    assert.ok(await selected().evaluate(el => { const box = el.getBoundingClientRect(); const list = el.closest('[role="tablist"]').getBoundingClientRect(); return box.left >= list.left - 1 && box.right <= list.right + 1; }), 'programmatic selection reveals an offscreen tab');
    await page.evaluate(() => window.fixture.select('en'));
  }
  assert.deepEqual(errors, []); console.log('PASS: 120 palette/theme/color/viewport combinations, keyboard tabs, panel linkage, fixed textareas with scrolling');
} finally { await browser?.close(); await server.close(); }
