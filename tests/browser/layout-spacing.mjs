import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import ts from 'typescript';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../..', import.meta.url));
const code = String.raw`
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Stack, HStack, VStack, SplitLayout, ResponsiveGrid, FormLayout } from '/dist/index.js';
import '/dist/styles.css';

function Samples({ id, value, style }) {
  return <section id={id} style={style}>
    <Box data-part="box" p={value} m={value}><span>Box</span></Box>
    <Stack data-part="stack" gap={value}><span>First</span><span>Second</span></Stack>
    <HStack data-part="hstack" gap={value}><span>First</span><span>Second</span></HStack>
    <VStack data-part="vstack" gap={value}><span>First</span><span>Second</span></VStack>
    <SplitLayout gap={value} aside={<span>Aside</span>}><span>Main</span></SplitLayout>
    <ResponsiveGrid data-part="grid" columns={2} gap={value}><span>First</span><span>Second</span></ResponsiveGrid>
    <FormLayout gap={value}><span>First</span><span>Second</span></FormLayout>
  </section>;
}

createRoot(document.getElementById('root')).render(<main style={{ '--fixture-gap': '5px' }}>
  <Samples id="half-number" value={0.5} />
  <Samples id="half-string" value="0.5" />
  <Samples id="integer-number" value={4} />
  <Samples id="integer-string" value="4" />
  <Samples id="zero-number" value={0} />
  <Samples id="zero-string" value="0" />
  <Samples id="defaults" value={undefined} />
  <Samples id="pixels" value="3px" />
  <Samples id="rem" value="0.5rem" />
  <Samples id="calc" value="calc(1rem + 2px)" />
  <Samples id="variable" value="var(--fixture-gap)" />
  <Samples id="token-override" value={0.5} style={{ '--ui-space-0-5': '7px' }} />
  <Samples id="integer-override" value="4" style={{ '--ui-space-4': '19px' }} />
  <Samples id="custom-token" value={99} style={{ '--ui-space-99': '23px' }} />
  <Samples id="custom-token-string" value="99" style={{ '--ui-space-99': '23px' }} />
  <section id="style-overrides">
    <Box data-part="box" p={0.5} m="0.5" style={{ padding: '9px', margin: '11px' }}>Box</Box>
    <Stack data-part="stack" gap={0.5} style={{ gap: '9px' }}>Stack</Stack>
    <HStack data-part="hstack" gap="0.5" style={{ gap: '9px' }}>HStack</HStack>
    <VStack data-part="vstack" gap={0.5} style={{ gap: '9px' }}>VStack</VStack>
    <SplitLayout gap={0.5} aside="Aside" style={{ '--ui-split-layout-gap': '9px' }}>Main</SplitLayout>
    <ResponsiveGrid data-part="grid" gap={0.5} style={{ '--ui-grid-row-gap': '9px', '--ui-grid-column-gap': '11px' }}>Grid</ResponsiveGrid>
    <Box data-part="priority" p={4} px={2} pl={0.5} m={4} my={2} mt="0.5" w={0.5}
      style={{ paddingRight: '9px', marginBottom: '7px' }}>Priority</Box>
    <Box data-part="dimension" w={0.5} />
  </section>
  <section id="grid-axes">
    <ResponsiveGrid data-part="grid" gap={4} rowGap={0.5} columnGap="0.5">Grid</ResponsiveGrid>
    <FormLayout gap={4} rowGap="0.5" columnGap={0.5}>Form</FormLayout>
  </section>
</main>);
`;

const server = await createServer({
  root, configFile: false, cacheDir: '/tmp/ui-layout-spacing-vite',
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{
    name: 'layout-spacing-fixture',
    resolveId: id => id === '/fixture.tsx' ? '\0fixture' : undefined,
    load: id => id === '\0fixture' ? ts.transpileModule(code, {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
    }).outputText : undefined,
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (new URL(req.url, 'http://localhost').pathname !== '/') return next();
        try {
          const html = await vite.transformIndexHtml(req.url, '<!doctype html><html style="font-size:16px"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/fixture.tsx"></script></body></html>');
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
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const width of [1280, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/`);
    await page.locator('#half-number [data-part="box"]').waitFor();
    const check = async (selector, expected) => {
      const actual = await page.locator(selector).evaluate((element, properties) => {
        const style = getComputedStyle(element);
        return Object.fromEntries(properties.map(property => [property, style.getPropertyValue(property)]));
      }, Object.keys(expected));
      assert.deepEqual(actual, expected, `${width}px: ${selector}`);
    };
    for (const [id, expected] of [
      ['half-number', '2px'], ['half-string', '2px'],
      ['integer-number', '16px'], ['integer-string', '16px'],
      ['zero-number', '0px'], ['zero-string', '0px'],
      ['pixels', '3px'], ['rem', '8px'], ['calc', '18px'], ['variable', '5px'],
      ['token-override', '7px'], ['integer-override', '19px'],
      ['custom-token', '23px'], ['custom-token-string', '23px'],
    ]) {
      await check(`#${id} [data-part="box"]`, {
        'padding-top': expected, 'padding-right': expected, 'padding-bottom': expected, 'padding-left': expected,
        'margin-top': expected, 'margin-right': expected, 'margin-bottom': expected, 'margin-left': expected,
      });
      for (const selector of [
        '[data-part="stack"]', '[data-part="hstack"]', '[data-part="vstack"]',
        '.ui-split-layout-grid', '[data-part="grid"] > .ui-responsive-grid-layout',
        '.ui-form-layout .ui-responsive-grid-layout',
      ]) {
        await check(`#${id} ${selector}`, { 'row-gap': expected, 'column-gap': expected });
      }
    }
    await check('#defaults [data-part="box"]', { padding: '0px', margin: '0px' });
    for (const part of ['stack', 'hstack', 'vstack']) {
      await check(`#defaults [data-part="${part}"]`, { gap: 'normal' });
      await check(`#style-overrides [data-part="${part}"]`, { gap: '9px' });
    }
    await check('#defaults .ui-split-layout-grid', { gap: '24px' });
    for (const selector of ['[data-part="grid"] > .ui-responsive-grid-layout', '.ui-form-layout .ui-responsive-grid-layout']) {
      await check(`#defaults ${selector}`, { 'row-gap': '16px', 'column-gap': '16px' });
      await check(`#grid-axes ${selector}`, { 'row-gap': '2px', 'column-gap': '2px' });
    }
    await check('#style-overrides [data-part="box"]', { padding: '9px', margin: '11px' });
    await check('#style-overrides .ui-split-layout-grid', { gap: '9px' });
    await check('#style-overrides [data-part="grid"] > .ui-responsive-grid-layout', { 'row-gap': '9px', 'column-gap': '11px' });
    await check('#style-overrides [data-part="priority"]', {
      'padding-top': '16px', 'padding-left': '2px', 'padding-right': '9px',
      'margin-left': '16px', 'margin-top': '2px', 'margin-bottom': '7px',
    });
    await check('#style-overrides [data-part="dimension"]', { width: '0.5px' });
    await page.locator('#token-override').evaluate(element => element.style.setProperty('--ui-space-0-5', '13px'));
    await check('#token-override [data-part="box"]', { padding: '13px', margin: '13px' });
    await check('#token-override [data-part="stack"]', { gap: '13px' });
    await check('#token-override .ui-split-layout-grid', { gap: '13px' });
    await check('#token-override [data-part="grid"] > .ui-responsive-grid-layout', { 'row-gap': '13px', 'column-gap': '13px' });
    assert.deepEqual(errors, []);
    await page.close();
    console.log('PASS', width, 'computed half-step 2px, integers/zero/defaults, CSS literals, axes, style and dynamic token overrides');
  }
} finally {
  await browser?.close();
  await server.close();
}
