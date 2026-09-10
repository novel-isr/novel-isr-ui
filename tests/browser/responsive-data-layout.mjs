import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import ts from 'typescript';

// Use an installed Playwright runner; browser tooling is not a UI runtime dependency.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../..', import.meta.url));
const output = process.env.UI_TEST_OUTPUT || '/tmp/ui-data-layout';
const code = String.raw`import React from 'react';import{createRoot}from'react-dom/client';
import{ResponsiveGrid,TableCellContent,CodeBlock,Page,PageHeader,Table,StatCard,ThemeProvider,Toolbar,Select,SelectItem,IconButton}from'/dist/index.js';import'/dist/styles.css';
const long='https://example.test/'+ 'unbroken'.repeat(32);
const rows=Array.from({length:20},(_,id)=>({id,title:long}));
createRoot(document.getElementById('root')).render(<ThemeProvider defaultTheme={new URLSearchParams(location.search).get('theme')} defaultPalette='graphite' disableStorage>
<Page maxWidth={1280}><PageHeader title='Data layout'/>
<div id='container' style={{width:280,maxWidth:'100%'}}>
<Toolbar wrap={false}><Select aria-label='Event'><SelectItem value='short'>Short</SelectItem><SelectItem value='long'>{'long_event_identifier_'.repeat(12)}</SelectItem></Select><IconButton label='Refresh'>R</IconButton></Toolbar>
<ResponsiveGrid id='metrics' columns={{base:1,sm:2,md:3,lg:6}} gap={3}>
{Array.from({length:6},(_,i)=><StatCard key={i} label={'Metric '+i} value={i} description='Current reporting period'/>)}</ResponsiveGrid>
<ResponsiveGrid id='nested-outer' columns={2}><ResponsiveGrid id='nested-inner'><span>Nested A</span><span>Nested B</span></ResponsiveGrid><span>Sibling</span></ResponsiveGrid>
<Table aria-label='Records' variant='bordered' scroll={{x:800,y:240}} rowKey={r=>r.id} data={rows} columns={[
{key:'id',header:'ID',fixed:'left',width:80},
{key:'title',header:'Resource',render:r=><TableCellContent primary={r.title} secondary='Source description' monospace maxWidth={300}/>},
{key:'other',header:'Status',width:120,render:()=> 'Available'}]}/>
<Table aria-label='Empty records' variant='bordered' data={[]} columns={[{key:'id',header:'ID'}]}/>
<CodeBlock aria-label='Wrapped JSON' maxHeight={140}>{JSON.stringify({resource:long,html:'<img src=x onerror=alert(1)>'},null,2)}</CodeBlock>
<CodeBlock aria-label='Scrollable log' wrap={false} maxHeight={140}>{Array.from({length:40},(_,i)=>i+' '+long).join('\n')}</CodeBlock>
</div></Page></ThemeProvider>);`;
const server = await createServer({ root, configFile:false, cacheDir:'/tmp/ui-data-layout-vite',
    server:{host:'127.0.0.1',port:0}, plugins:[{
        name:'data-layout-fixture',
        resolveId:id=>id==='/fixture.tsx'?'\0fixture':undefined,
        load:id=>id==='\0fixture'?ts.transpileModule(code,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText:undefined,
        configureServer(vite){vite.middlewares.use((req,res,next)=>{
            if(new URL(req.url,'http://localhost').pathname!=='/')return next();
            res.setHeader('Content-Type','text/html');
            res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><div id="root"></div><script type="module" src="/fixture.tsx"></script></body></html>');
        });},
    }],
});
await server.listen();
const browser = await chromium.launch({channel:'chrome',headless:true});
await mkdir(output,{recursive:true});
try {
    for(const theme of ['light','dark']) {
        const page = await browser.newPage({viewport:{width:1440,height:1000}});
        page.setDefaultTimeout(10000);
        const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?theme=${theme}`);
        await page.getByRole('heading',{name:'Data layout'}).waitFor();
        for(const [width,columns] of [[280,1],[480,2],[768,3],[1200,6]]) {
            await page.locator('#container').evaluate((el,width)=>el.style.width=width+'px',width);
            const actual=await page.locator('#metrics > div').evaluate(el=>({
                columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,
                gap:getComputedStyle(el).columnGap,
            }));
            assert.deepEqual(actual,{columns,gap:'12px'});
            assert.equal(await page.locator('#nested-inner > div').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1);
            assert.ok(await page.locator('.ui-table-cell-content').evaluateAll(els=>els.every(el=>el.scrollWidth<=el.clientWidth+1)));
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
            await page.screenshot({path:`${output}/${theme}-${width}.png`});
            console.log('PASS container',theme,width,columns);
        }
        await page.locator('#container').evaluate(el=>el.style.width='280px');
        const wrapper=page.getByRole('table',{name:'Records',exact:true}).locator('..');
        assert.equal(await wrapper.evaluate(el=>getComputedStyle(el).overflowX),'auto');
        const before=await page.getByRole('columnheader',{name:'ID',exact:true}).first().boundingBox();
        await wrapper.evaluate(el=>{el.scrollLeft=200;el.scrollTop=150;});
        assert.ok(await wrapper.evaluate(el=>el.scrollLeft>0 && el.scrollTop>0));
        const after=await page.getByRole('columnheader',{name:'ID',exact:true}).first().boundingBox();
        assert.ok(Math.abs(before.x-after.x)<2 && Math.abs(before.y-after.y)<2,'Sticky header and fixed column retain position');
        console.log('PASS table scroll and sticky',theme);
        const wrapped=page.getByRole('region',{name:'Wrapped JSON'});
        assert.equal(await wrapped.locator('img').count(),0);
        assert.ok(await wrapped.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
        const log=page.getByRole('region',{name:'Scrollable log'});
        await log.focus();await page.keyboard.press('PageDown');
        await page.waitForFunction(()=>document.querySelector('[aria-label="Scrollable log"]').scrollTop>0);
        console.log('PASS vertical keyboard scroll',theme);
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(()=>document.querySelector('[aria-label="Scrollable log"]').scrollLeft>0);
        assert.ok(await log.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'));
        await page.setViewportSize({width:320,height:800});
        const select=page.getByRole('combobox',{name:'Event'});
        await select.click();
        const popup=await page.getByRole('listbox').boundingBox();
        assert.ok(popup.x>=0 && popup.x+popup.width<=321,'Popup fits viewport');
        const option=page.getByRole('option',{name:'long_event_identifier_'.repeat(12),exact:true});
        assert.ok(await option.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
        await option.click();
        const trigger=await select.boundingBox();
        const refresh=await page.getByRole('button',{name:'Refresh',exact:true}).boundingBox();
        assert.ok(refresh.x+refresh.width<=320 && Math.abs(trigger.y-refresh.y)<3);
        assert.ok(await select.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
        await select.focus();await page.keyboard.press('ArrowDown');
        await page.getByRole('listbox').waitFor();await page.keyboard.press('Escape');
        await page.getByRole('listbox').waitFor({state:'hidden'});
        await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Event');
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        assert.deepEqual(errors,[]);
        await page.close();
        console.log('PASS',theme,'4 container widths, nested grid, wrapping, table scroll/sticky, keyboard code region, mobile');
    }
} catch (error) {
    console.error(error);
    throw error;
} finally {
    await browser.close();
    await server.close();
}
