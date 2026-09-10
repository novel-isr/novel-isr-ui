import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import ts from 'typescript';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../..', import.meta.url));
const output = process.env.UI_TEST_OUTPUT || '/tmp/ui-form-layout';
const code = String.raw`import React from 'react';import{createRoot}from'react-dom/client';
import{FormLayout,GridItem,FormField,Input,Textarea,Button,ResponsiveGrid,VStack,Toolbar,IconButton,ThemeProvider}from'/dist/index.js';import'/dist/styles.css';
window.submissions=[];window.resets=0;
createRoot(document.getElementById('root')).render(<ThemeProvider defaultTheme={new URLSearchParams(location.search).get('theme')} defaultPalette='graphite' disableStorage>
<main style={{padding:16}}><VStack id='container' gap={4} style={{width:280,maxWidth:'100%'}}>
<FormLayout id='metadata' aria-label='Metadata' columns={{base:1,sm:2,md:3}} noValidate onReset={()=>window.resets++} onSubmit={event=>{event.preventDefault();window.submissions.push(Object.fromEntries(new FormData(event.currentTarget)))}}>
<GridItem fullWidth asChild><FormField label='Title' helperText='Public title'><Input name='title' defaultValue='Draft'/></FormField></GridItem>
<FormField label='Category'><Input name='category' defaultValue='Article'/></FormField>
<FormField label='Schedule'><Toolbar wrap={false}><Input name='schedule' type='datetime-local'/><IconButton type='button' label='Clear schedule'>X</IconButton></Toolbar></FormField>
<GridItem fullWidth asChild><FormField label='Description'><Textarea name='description' defaultValue={'longtext'.repeat(80)} /></FormField></GridItem>
<GridItem fullWidth><ResponsiveGrid id='nested' columns={{base:1,sm:2}}><Input aria-label='Nested first'/><Input aria-label='Nested second'/></ResponsiveGrid></GridItem>
</FormLayout>
<Toolbar><Button type='submit' form='metadata'>Save</Button><Button type='reset' form='metadata'>Reset</Button></Toolbar>
</VStack></main></ThemeProvider>);`;
const server = await createServer({root,configFile:false,cacheDir:'/tmp/ui-form-layout-vite',server:{host:'127.0.0.1',port:0},plugins:[{
    name:'form-layout-fixture',resolveId:id=>id==='/fixture.tsx'?'\0fixture':undefined,
    load:id=>id==='\0fixture'?ts.transpileModule(code,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText:undefined,
    configureServer(vite){vite.middlewares.use((req,res,next)=>{
        if(new URL(req.url,'http://localhost').pathname!=='/')return next();
        res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><div id="root"></div><script type="module" src="/fixture.tsx"></script></body></html>');
    });},
}]});
await server.listen();
let browser;
try {
    browser=await chromium.launch({channel:'chrome',headless:true});
    await mkdir(output,{recursive:true});
    for(const theme of ['light','dark']) {
        const page=await browser.newPage({viewport:{width:1440,height:1000}});
        page.setDefaultTimeout(10000);
        const errors=[];page.on('pageerror',error=>errors.push(error.message));
        await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?theme=${theme}`);
        const title=page.getByRole('textbox',{name:'Title',exact:true});await title.waitFor();
        for(const [width,columns] of [[280,1],[480,2],[768,3],[1200,3]]) {
            await page.locator('#container').evaluate((el,width)=>el.style.width=width+'px',width);
            const geometry=await page.locator('#metadata > .ui-responsive-grid > .ui-responsive-grid-layout').evaluate(el=>({
                columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,
                fullRows:[...el.querySelectorAll(':scope > .ui-grid-item-full-width')].every(item=>Math.abs(item.getBoundingClientRect().width-el.getBoundingClientRect().width)<1),
                overflow:el.scrollWidth>el.clientWidth+1,
            }));
            assert.deepEqual(geometry,{columns,fullRows:true,overflow:false});
            assert.equal(await page.locator('#nested > div').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),width>=480?2:1);
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
            await page.screenshot({path:`${output}/${theme}-${width}.png`});
        }
        await page.locator('label').filter({hasText:/^Title$/}).click();
        assert.ok(await title.evaluate(el=>el===document.activeElement));
        await page.keyboard.press('Tab');assert.ok(await page.getByRole('textbox',{name:'Category',exact:true}).evaluate(el=>el===document.activeElement));
        await title.fill('Edited');await title.press('Enter');
        await page.waitForFunction(()=>window.submissions.length===1);
        assert.equal(await page.evaluate(()=>window.submissions[0].title),'Edited');
        await page.getByRole('button',{name:'Save',exact:true}).click();
        await page.waitForFunction(()=>window.submissions.length===2);
        await page.locator('#metadata').evaluate(el=>el.requestSubmit());
        await page.waitForFunction(()=>window.submissions.length===3);
        await page.getByRole('button',{name:'Reset',exact:true}).click();
        assert.equal(await title.inputValue(),'Draft');assert.equal(await page.evaluate(()=>window.resets),1);
        await page.setViewportSize({width:320,height:800});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        assert.ok(await page.getByLabel('Schedule',{exact:true}).evaluate(el=>el.getBoundingClientRect().right<=innerWidth));
        await page.screenshot({path:`${output}/${theme}-mobile.png`});
        assert.deepEqual(errors,[]);await page.close();
        console.log('PASS',theme,'container columns/full rows/nesting, labels/tab order, Enter/external/requestSubmit/FormData/reset, mobile');
    }
} finally {
    await browser?.close();
    await server.close();
}
