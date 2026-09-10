import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import ts from 'typescript';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../..', import.meta.url));
const output = process.env.TOOLBAR_TEST_OUTPUT || '/tmp/ui-toolbar-presentation';
const code = String.raw`
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Bold, Italic } from 'lucide-react';
import { Toolbar, Divider, Card, IconButton, ThemeProvider, useTheme } from '/dist/index.js';
import '/dist/styles.css';
function Fixture() {
  const { setTheme } = useTheme();
  const [config, setConfig] = useState({ density: 'compact', asChild: false, wrap: true });
  window.fixture = {
    configure: value => flushSync(() => setConfig(value)),
    theme: value => flushSync(() => setTheme(value)),
  };
  const controls = <>
    {Array.from({ length: 12 }, (_, index) => <React.Fragment key={index}>
      {index === 4 || index === 8 ? <Divider orientation='vertical' /> : null}
      <IconButton label={'Command ' + index} size='sm' onClick={() => window.activated = index}>
        {index % 2 ? <Italic /> : <Bold />}
      </IconButton>
    </React.Fragment>)}
  </>;
  return <>
    <Toolbar {...config} aria-label='Commands' ref={node => window.toolbar = node}>
      {config.asChild ? <Card as='section' padding='none' variant='elevated'>{controls}</Card> : controls}
    </Toolbar>
    <div data-standalone style={{ height: 40 }}><Divider orientation='vertical' /></div>
    <Divider data-horizontal />
  </>;
}
createRoot(document.getElementById('root')).render(
  <ThemeProvider defaultTheme='light' defaultPalette='graphite' disableStorage><Fixture /></ThemeProvider>
);`;
const server = await createServer({
  root, configFile: false, cacheDir: '/tmp/ui-toolbar-presentation-vite',
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{
    name: 'toolbar-presentation',
    resolveId: id => id === '/fixture.tsx' ? '\0toolbar-presentation' : undefined,
    load: id => id === '\0toolbar-presentation'
      ? ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
      : undefined,
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (new URL(req.url, 'http://localhost').pathname !== '/') return next();
        try {
          const html = await vite.transformIndexHtml(req.url,
            '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/fixture.tsx"></script></body></html>');
          res.setHeader('Content-Type', 'text/html');
          res.end(html);
        } catch (error) { next(error); }
      });
    },
  }],
});
let browser;
try {
  await server.listen();
  await mkdir(output, { recursive: true });
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await page.goto(base);
  const toolbar = page.getByRole('group', { name: 'Commands', exact: true });
  await toolbar.waitFor();
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 600 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => window.fixture.theme(value), theme);
      for (const density of ['compact', 'default']) {
        for (const asChild of [false, true]) {
          await page.evaluate(value => window.fixture.configure(value), { density, asChild, wrap: true });
          await toolbar.evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
          assert.equal(await toolbar.evaluate(element => getComputedStyle(element).gap), density === 'compact' ? '4px' : '12px');
          assert.equal(await toolbar.evaluate(element => getComputedStyle(element).display), 'flex', 'Card must not replace toolbar flex layout');
          assert.equal(await toolbar.evaluate(element => element === window.toolbar), true, 'public ref targets the actual toolbar');
          assert.equal(await toolbar.evaluate(element => element.tagName), asChild ? 'SECTION' : 'DIV');
          assert.equal(await toolbar.locator('.ui-toolbar').count(), 0, 'composition adds no toolbar wrapper');
          assert.equal(await toolbar.getAttribute('density'), null);
          assert.equal(await toolbar.getAttribute('asChild'), null);
          assert.ok(await toolbar.evaluate(element => element.scrollWidth <= element.clientWidth + 1));
          const buttons = toolbar.getByRole('button');
          assert.equal(await buttons.count(), 12);
          const rows = await buttons.evaluateAll(elements => [...new Set(elements.map(element => Math.round(element.getBoundingClientRect().top)))]);
          if (width === 1280) assert.equal(rows.length, 1, 'desktop commands share one row');
          if (width === 320) assert.ok(rows.length > 1, 'compact commands retain wrapping on narrow screens');
          const gap = await buttons.evaluateAll(elements => elements[1].getBoundingClientRect().left - elements[0].getBoundingClientRect().right);
          assert.ok(Math.abs(gap - (density === 'compact' ? 4 : 12)) < 1, 'computed spacing is reflected in actual geometry');
          if (density === 'compact') {
            for (const divider of await toolbar.getByRole('separator').all()) {
              const box = await divider.boundingBox();
              assert.equal(box.height, 20);
              assert.equal(box.width, 1);
              assert.equal(await divider.getAttribute('aria-orientation'), 'vertical');
              assert.ok(await divider.evaluate(element => {
                const rect = element.getBoundingClientRect();
                return [element.previousElementSibling, element.nextElementSibling].filter(Boolean).some(sibling => {
                  const box = sibling.getBoundingClientRect();
                  return Math.abs(rect.top + rect.height / 2 - box.top - box.height / 2) < 1;
                });
              }), 'divider centers on its adjacent command row');
            }
          }
          assert.equal((await page.locator('[data-standalone] > .ui-divider').boundingBox()).height, 40);
          assert.equal((await page.locator('[data-horizontal]').boundingBox()).height, 1);
          await buttons.first().focus();
          await page.keyboard.press('Enter');
          assert.equal(await page.evaluate(() => window.activated), 0);
          await page.keyboard.press('Tab');
          assert.equal(await buttons.nth(1).evaluate(element => element === document.activeElement), true);
          await page.keyboard.press('Space');
          assert.equal(await page.evaluate(() => window.activated), 1);
          await page.screenshot({ path: `${output}/${theme}-${width}-${density}-${asChild ? 'card' : 'plain'}.png` });
        }
      }
    }
  }
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.evaluate(() => window.fixture.configure({ density: 'compact', wrap: false, asChild: false }));
  assert.equal(await toolbar.evaluate(element => getComputedStyle(element).flexWrap), 'nowrap');
  assert.deepEqual(errors, []);
  console.log('PASS Toolbar: default/compact, Card composition, separator bounds, native keyboard commands, wrapping, light/dark desktop/mobile');
} finally {
  await browser?.close();
  await server.close();
}
