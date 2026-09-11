import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import ts from 'typescript';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../..', import.meta.url));
const output = process.env.PAGE_TABS_TEST_OUTPUT || '/tmp/ui-page-tabs-presentation';
const label = 'Article-' + 'LongUnbrokenTitle'.repeat(8);
const code = `
import React,{useState}from'react';import{createRoot}from'react-dom/client';import{flushSync}from'react-dom';
import{FileText,X,MoreHorizontal}from'lucide-react';
import{PageTabs,PageTab,IconButton,ThemeProvider,useTheme}from'/dist/index.js';import'/dist/styles.css';
function Fixture(){const{setTheme}=useTheme();const[active,setActive]=useState('article');
window.fixture={theme:value=>flushSync(()=>setTheme(value)),select:value=>flushSync(()=>setActive(value))};
return <><PageTabs label='Open pages' activeValue={active} actions={<IconButton label='Page menu'><MoreHorizontal/></IconButton>}>
{['home','article','disabled'].map(value=><PageTab key={value} value={value} label={value==='article'?${JSON.stringify(label)}:value}
active={active===value} disabled={value==='disabled'} icon={<FileText/>} onSelect={()=>{window.selected=value;setActive(value);}}
action={<IconButton size='xs' label={'Close '+value} onClick={()=>window.closedPage=value}><X/></IconButton>}/>)}</PageTabs>
<button id='outside'>Outside</button></>;
}createRoot(document.getElementById('root')).render(<ThemeProvider defaultTheme='light' defaultPalette='graphite' disableStorage><Fixture/></ThemeProvider>);`;
const server = await createServer({
  root, configFile: false, cacheDir: '/tmp/ui-page-tabs-presentation-vite',
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{
    name: 'page-tabs-presentation',
    resolveId: id => id === '/fixture.tsx' ? '\0page-tabs-presentation' : undefined,
    load: id => id === '\0page-tabs-presentation'
      ? ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText : undefined,
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (new URL(req.url, 'http://localhost').pathname !== '/') return next();
        try {
          const html = await vite.transformIndexHtml(req.url, '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/fixture.tsx"></script></body></html>');
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
  await page.goto(base);await page.locator('.ui-page-tabs').waitFor();
  const item = page.locator('.ui-page-tab[data-value="article"]');
  const trigger = item.locator('.ui-page-tab-trigger');
  const style = locator => locator.evaluate(el => {
    const s = getComputedStyle(el);const r = el.getBoundingClientRect();
    return { background: s.backgroundColor, color: s.color, borderWidth: s.borderBottomWidth,
      radius: s.borderRadius, shadow: s.boxShadow, width: r.width, height: r.height, top: r.top, bottom: r.bottom, transform: s.transform };
  });
  const settled = async () => {
    await page.locator('.ui-page-tabs').evaluate(async el => {
      while (el.getAnimations({ subtree: true }).some(animation => animation.playState === 'running')) {
        await Promise.allSettled(el.getAnimations({ subtree: true }).map(animation => animation.finished));
      }
    });
  };
  const contrast = locator => locator.evaluate(el => {
    const canvas = document.createElement('canvas');canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');const s = getComputedStyle(el);
    const luminance = color => {
      ctx.fillStyle = getComputedStyle(el.closest('nav')).backgroundColor;ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = color;ctx.fillRect(0, 0, 1, 1);
      const rgb = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).map(value => {
        const c = value / 255;return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    };
    const fg = luminance(s.color);const bg = luminance(s.backgroundColor);
    return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
  });
  for (const width of [1280, 390, 320]) for (const theme of ['light','dark']) {
    await page.setViewportSize({ width, height: 400 });await page.evaluate(theme => window.fixture.theme(theme), theme);
    await page.locator('#outside').click();await page.evaluate(() => window.fixture.select('article'));await settled();
    const before = await style(item);
    const nav = await style(page.locator('.ui-page-tabs'));
    assert.equal(nav.height, 48, 'navigation keeps its 48px footprint');
    assert.equal(before.height, 36, 'page items have a stable 36px surface');
    assert.equal(before.radius, '8px', 'page items have rounded corners');
    assert.equal(before.borderWidth, '0px', 'selection has no bottom indicator');
    assert.equal(before.shadow, 'none', 'page items remain flat');
    assert.ok(before.top > nav.top && before.bottom < nav.bottom, 'items are vertically inset');
    assert.equal(await page.locator('.ui-page-tabs-list').evaluate(el => getComputedStyle(el).gap), '8px');
    assert.equal(await item.evaluate(el => {
      const previous = el.previousElementSibling.getBoundingClientRect();
      return el.getBoundingClientRect().left - previous.right;
    }), 8, 'adjacent surfaces are separated');
    await trigger.hover();await settled();
    const hovered = await style(item);
    assert.ok(await contrast(item) >= 4.5, 'selected hover retains readable text contrast');
    await page.screenshot({ path: `${output}/${theme}-${width}-selected-hover.png` });
    assert.equal((await style(trigger)).background, 'rgba(0, 0, 0, 0)', 'hover belongs to the entire page item, not a nested button rectangle');
    assert.notEqual(hovered.background, before.background, 'selected hover is distinguishable');
    assert.equal(hovered.borderWidth, '0px', 'hover does not introduce a bottom indicator');
    assert.equal(hovered.radius, before.radius);assert.equal(hovered.shadow, 'none');
    assert.equal(hovered.width, before.width);assert.equal(hovered.height, before.height);
    assert.equal(await trigger.getAttribute('title'), null);
    const tooltip = page.getByRole('tooltip');await tooltip.waitFor();assert.equal(await tooltip.textContent(), label);
    assert.equal(await trigger.getAttribute('aria-describedby'), await tooltip.getAttribute('id'));
    assert.equal(await page.locator('.ui-page-tabs [role="tooltip"]').count(), 0, 'tooltip is portaled outside clipping viewport');
    const bubble = page.locator('.ui-tooltip-content').filter({ has: tooltip });
    assert.ok(await bubble.evaluate(el => { const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&el.scrollWidth<=el.clientWidth+1; }), 'long title tooltip fits the viewport');
    await page.screenshot({ path: `${output}/${theme}-${width}-tooltip.png` });
    await page.keyboard.press('Escape');await tooltip.waitFor({ state: 'detached' });
    await page.mouse.down();assert.equal((await style(trigger)).transform, 'none', 'pressing a route label must not shrink its selected surface');await page.mouse.up();
    const close = item.getByRole('button', { name: 'Close article', exact: true });
    await close.hover();await settled();assert.equal((await style(item)).background, hovered.background, 'action hover shares the item surface');
    await close.click();assert.equal(await page.evaluate(() => window.closedPage), 'article');
    await page.locator('#outside').click();await trigger.focus();await tooltip.waitFor();assert.equal(await tooltip.textContent(), label);
    await page.keyboard.press('Escape');await tooltip.waitFor({ state: 'detached' });
    await page.locator('#outside').click();await page.evaluate(() => window.fixture.select('home'));await settled();
    const inactive = await style(item);await trigger.hover();await settled();assert.notEqual((await style(item)).background, inactive.background);
    assert.ok(await contrast(item) >= 4.5, 'inactive hover retains readable text contrast');
    assert.equal((await style(trigger)).background, 'rgba(0, 0, 0, 0)');
    await page.locator('#outside').click();const disabled = page.locator('.ui-page-tab[data-value="disabled"]');
    const disabledBefore = await style(disabled);await disabled.hover();await settled();assert.equal((await style(disabled)).background, disabledBefore.background);
    assert.equal(await disabled.locator('.ui-page-tab-trigger').isDisabled(), true);
    assert.equal(await page.locator('button button').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  }
  assert.deepEqual(errors, []);
  console.log('PASS PageTabs: flat separated rounded tabs, 48px nav/36px items/8px radius and gaps, no indicator/shadow, readable hover contrast, stable press geometry, shared pointer/focus tooltips, long titles, disabled items, actions, light/dark desktop/mobile');
} finally { await browser?.close();await server.close(); }
