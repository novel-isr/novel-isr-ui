import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import ts from 'typescript';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../..', import.meta.url));
const output = process.env.UI_TEST_OUTPUT || '/tmp/ui-editor-presentation';
const code = String.raw`import React from 'react';import{createRoot}from'react-dom/client';
import{SplitLayout,Prose,FormField,Input,ThemeProvider,VStack}from'/dist/index.js';import'/dist/styles.css';
const long='https://example.test/'+ 'longword'.repeat(40);
const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
createRoot(document.getElementById('root')).render(<ThemeProvider defaultTheme={new URLSearchParams(location.search).get('theme')} defaultPalette='graphite' disableStorage>
<main style={{padding:16}}><VStack id='container' gap={4} style={{width:280,maxWidth:'100%'}}>
<SplitLayout id='split' aside={<FormField label='Aside field'><Input /></FormField>}><FormField label='Main field'><Input /></FormField>
<SplitLayout id='nested' aside={<span>Nested aside</span>}><span>Nested main</span></SplitLayout></SplitLayout>
<SplitLayout id='large' collapseBelow='lg' asideWidth={1000} aside={<span>Bounded aside</span>}><span>Main</span></SplitLayout>
<SplitLayout id='alone' aside={null} gap={0.5}><span>Only main</span></SplitLayout>
<div id='document-scroll' role='region' aria-label='Document' tabIndex={0} style={{overflowX:'auto',background:'var(--ui-color-surface)'}}>
<Prose id='document'><h1>Document title</h1><p>{long}</p><p><a href='#document'>Readable reference</a> <span style={{color:'rgb(18, 52, 86)',fontFamily:'serif'}}>Author formatting</span></p>
<h2>Notes</h2><blockquote><p>Readable quote without decorative overlay.</p></blockquote>
<ul><li>First item<ul><li>Nested item</li></ul></li><li>Second item</li></ul>
<pre tabIndex={0} aria-label='Code'><code><span className='hljs-keyword'>const</span>{' answer '}<span className='hljs-operator'>=</span>{' '}<span className='hljs-number'>42</span><span className='hljs-punctuation'>;</span>{'\n'}<span className='hljs-comment'>// Readable comment</span>{'\n'}<span className='hljs-string'>{long}</span></code></pre>
<p><mark>Highlighted text</mark></p><img id='image' src={pixel} width={1200} alt='Layout test bitmap'/>
<table aria-label='Native table'><thead><tr>{Array.from({length:8},(_,i)=><th scope='col' key={i}>Column {i}</th>)}</tr></thead><tbody><tr>{Array.from({length:8},(_,i)=><td key={i}>Value {i}</td>)}</tr></tbody></table><hr/><p>Final paragraph</p>
</Prose></div></VStack></main></ThemeProvider>);`;
const server=await createServer({root,configFile:false,cacheDir:'/tmp/ui-editor-presentation-vite',server:{host:'127.0.0.1',port:0},plugins:[{
    name:'editor-presentation-fixture',resolveId:id=>id==='/fixture.tsx'?'\0fixture':undefined,
    load:id=>id==='\0fixture'?ts.transpileModule(code,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText:undefined,
    configureServer(vite){vite.middlewares.use(async (req,res,next)=>{
        if(new URL(req.url,'http://localhost').pathname!=='/')return next();
        try {
            const html=await vite.transformIndexHtml(req.url,'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><div id="root"></div><script type="module" src="/fixture.tsx"></script></body></html>');
            res.setHeader('Content-Type','text/html');res.end(html);
        } catch(error) { next(error); }
    });},
}]});
await server.listen();
let browser;
try {
    browser=await chromium.launch({channel:'chrome',headless:true});await mkdir(output,{recursive:true});
    for(const theme of ['light','dark']) {
        const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(10000);
        const errors=[];page.on('pageerror',error=>{errors.push(error.message);console.error(error);});
        await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?theme=${theme}`);
        await page.getByRole('heading',{name:'Document title',exact:true}).waitFor();
        for(const width of [280,767,768,1200]) {
            await page.locator('#container').evaluate((el,width)=>el.style.width=width+'px',width);
            const layout=await page.locator('#split').evaluate(el=>{
                const grid=el.firstElementChild,main=grid.firstElementChild,aside=grid.lastElementChild;
                return {columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,aside:aside.getBoundingClientRect().width,main:main.getBoundingClientRect().width,order:main.getBoundingClientRect().y<=aside.getBoundingClientRect().y};
            });
            assert.equal(layout.columns,width>=768?2:1);assert.equal(layout.aside,width>=768?320:width);assert.ok(layout.order);
            assert.equal(await page.locator('#alone > div').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1);
            assert.equal(await page.locator('#alone > div').evaluate(el=>getComputedStyle(el).gap),'2px');
            assert.equal(await page.locator('#nested > div').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),layout.main>=768?2:1);
            const large=await page.locator('#large > div').evaluate(el=>({columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,aside:el.lastElementChild.getBoundingClientRect().width}));
            assert.equal(large.columns,width>=1200?2:1);assert.equal(large.aside,width>=1200?width/2:width);
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
            await page.screenshot({path:`${output}/${theme}-${width}.png`,fullPage:true});
        }
        await page.getByLabel('Main field',{exact:true}).focus();await page.keyboard.press('Tab');
        assert.ok(await page.getByLabel('Aside field',{exact:true}).evaluate(el=>el===document.activeElement));
        await page.locator('#container').evaluate(el=>el.style.width='280px');
        const pre=page.getByLabel('Code',{exact:true});await pre.focus();await page.keyboard.press('ArrowRight');
        await page.waitForFunction(()=>document.querySelector('pre').scrollLeft>0);
        await pre.evaluate(el=>{el.style.whiteSpace='pre-wrap';el.scrollLeft=0;});
        assert.equal(await pre.locator('code').evaluate(el=>getComputedStyle(el).whiteSpace),'pre');
        assert.ok(await pre.evaluate(el=>el.scrollWidth>el.clientWidth));
        const contrast=await pre.evaluate(el=>{
            const luminance=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};
            const bg=luminance(getComputedStyle(el).backgroundColor);
            return [...el.querySelectorAll('span')].map(span=>{const fg=luminance(getComputedStyle(span).color);return {name:span.className,ratio:(Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05)}});
        });
        assert.ok(contrast.every(item=>item.ratio>=4.5),JSON.stringify({theme,contrast}));
        assert.equal(await page.locator('.hljs-punctuation').evaluate(el=>getComputedStyle(el).color),await page.locator('#document').evaluate(el=>getComputedStyle(el).color));
        assert.equal(await page.locator('blockquote').evaluate(el=>getComputedStyle(el,'::before').content),'none');
        assert.equal(await pre.evaluate(el=>getComputedStyle(el).backgroundImage),'none');
        assert.equal(await page.getByRole('table',{name:'Native table'}).evaluate(el=>getComputedStyle(el).display),'table');
        assert.equal(await page.getByRole('columnheader').count(),8);
        assert.equal(await page.getByRole('columnheader').first().evaluate(el=>getComputedStyle(el).overflowWrap),'normal');
        assert.ok(await page.locator('#document-scroll').evaluate(el=>el.scrollWidth>el.clientWidth),'wide table scrolls rather than splitting words');
        assert.equal(await page.getByText('Author formatting',{exact:true}).evaluate(el=>getComputedStyle(el).color),'rgb(18, 52, 86)');
        await page.locator('#image').scrollIntoViewIfNeeded();const before=await page.locator('#image').boundingBox();
        await page.locator('#image').hover();const after=await page.locator('#image').boundingBox();
        assert.deepEqual(after,before);assert.ok(after.width<=280);
        assert.ok(await page.locator('#image').evaluate(el=>el.complete && el.naturalWidth>0));
        await page.setViewportSize({width:320,height:800});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        assert.deepEqual(errors,[]);await page.close();
        console.log('PASS',theme,'split/nesting/oversized/missing aside, tab order, wrapping, code scroll/contrast, native tables, author styles, stable raster image, mobile');
    }
} finally {await browser?.close();await server.close();}
