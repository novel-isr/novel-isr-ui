import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import ts from 'typescript';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../..', import.meta.url));
const output = process.env.UI_TEST_OUTPUT || '/tmp/ui-list-feedback';
const entry = String.raw`
import React from 'react';
import {createRoot} from 'react-dom/client';
import {List,ListItem,Button,IconButton,EmptyState,ThemeProvider,VStack,Box} from '/dist/index.js';
import {KeyRound,Trash2} from 'lucide-react';
import '/dist/styles.css';
window.actions=[];
function Fixture(){return <Box as="main" maxW={640} mx="auto" p={4}><VStack gap={6}>
{['default','compact'].map(density=><List key={density} density={density} aria-label={density}>
<ListItem primary={'Device_identifier_'.repeat(24)} secondary={'Created_and_last_used_metadata_'.repeat(12)}
icon={<KeyRound/>} actions={<IconButton label={'Remove '+density} onClick={()=>window.actions.push(density)}><Trash2/></IconButton>}/>
<ListItem primary={0} secondary={0} actions={<IconButton label={'Disabled '+density} disabled><Trash2/></IconButton>}/>
<ListItem primary="Long action" secondary="Metadata" actions={<Button onClick={()=>window.actions.push('long')}>{'Long_action_label_'.repeat(10)}</Button>}/>
</List>)}
<List aria-label="Unseparated" dividers={false}><ListItem primary="First"/><ListItem primary="Second"/></List>
<EmptyState role="alert" title="Render error" description={'Unbroken_error_identifier_'.repeat(30)}
action={<Button onClick={()=>window.actions.push('retry')}>{'Retry_action_'.repeat(12)}</Button>}
secondaryAction={<Button disabled>Unavailable</Button>}/>
</VStack></Box>}
createRoot(document.getElementById('root')).render(<ThemeProvider defaultTheme={new URLSearchParams(location.search).get('theme')} defaultPalette="graphite" disableStorage><Fixture/></ThemeProvider>);
`;
const server = await createServer({
  root, configFile:false, cacheDir:'/tmp/ui-list-feedback-vite',
  optimizeDeps:{include:['react','react-dom/client','react/jsx-runtime','lucide-react']},
  server:{host:'127.0.0.1',port:0},
  plugins:[{
    name:'list-feedback-fixture',
    resolveId:id=>id==='/fixture.tsx'?'\0list-fixture':undefined,
    load:id=>id==='\0list-fixture'?ts.transpileModule(entry,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText:undefined,
    configureServer(vite){vite.middlewares.use(async(req,res,next)=>{
      if(new URL(req.url,'http://localhost').pathname!=='/')return next();
      try{
        const html=await vite.transformIndexHtml(req.url,'<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:var(--ui-color-canvas);color:var(--ui-color-fg)}*{box-sizing:border-box}</style></head><body><div id="root"></div><script type="module" src="/fixture.tsx"></script></body></html>');
        res.setHeader('Content-Type','text/html');res.end(html);
      }catch(error){next(error);}
    });},
  }],
});
let browser;
try{
  await mkdir(output,{recursive:true});
  await server.listen();
  browser=await chromium.launch({channel:'chrome',headless:true});
  for(const theme of ['light','dark']){
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?theme=${theme}`);
    const normal=page.getByRole('list',{name:'default',exact:true});
    await normal.waitFor();
    assert.equal(await normal.evaluate(el=>el.tagName),'UL');
    assert.equal(await normal.getByRole('listitem').count(),3);
    assert.equal(await normal.getByRole('listitem').nth(1).locator('.ui-list-item-primary').innerText(),'0');
    assert.equal(await normal.getByRole('listitem').nth(1).locator('.ui-list-item-secondary').innerText(),'0');
    const first=page.getByRole('button',{name:'Remove default',exact:true});
    await first.focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>window.actions.length===1);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'Long_action_label_'.repeat(10));
    await page.keyboard.press('Space');
    await page.waitForFunction(()=>window.actions.length===2);
    assert.deepEqual(await page.evaluate(()=>window.actions),['default','long']);
    const heights=await page.evaluate(()=>['default','compact'].map(d=>document.querySelector('[aria-label="'+d+'"] .ui-list-item:nth-child(2)').getBoundingClientRect().height));
    assert.ok(heights[0]>heights[1],'compact rows must actually be shorter');
    const borders=await page.evaluate(()=>['default','Unseparated'].map(d=>getComputedStyle(document.querySelector('[aria-label="'+d+'"] .ui-list-item:nth-child(2)')).borderTopWidth));
    assert.deepEqual(borders,['1px','0px']);
    for(const width of [1440,390,320]){
      await page.setViewportSize({width,height:1000});
      const result=await page.evaluate(()=>({
        overflow:document.documentElement.scrollWidth-innerWidth,
        rows:[...document.querySelectorAll('.ui-list-item')].filter(el=>el.querySelector('.ui-list-item-actions')).map(row=>{
          const text=row.querySelector('.ui-list-item-content').getBoundingClientRect();
          const actions=row.querySelector('.ui-list-item-actions').getBoundingClientRect();
          return {textRight:text.right,actionLeft:actions.left,right:actions.right};
        }),
        clipped:[...document.querySelectorAll('.ui-button-label')].some(el=>el.scrollWidth>el.clientWidth+1),
        error:document.querySelector('.ui-empty-state').getBoundingClientRect().right,
      }));
      assert.ok(result.overflow<=1,`${theme}/${width}: page overflow ${result.overflow}`);
      assert.ok(result.rows.every(row=>row.textRight<=row.actionLeft&&row.right<=width),`${theme}/${width}: overlapping row`);
      assert.equal(result.clipped,false,`${theme}/${width}: clipped action label`);
      assert.ok(result.error<=width);
      await page.screenshot({path:`${output}/${theme}-${width}.png`,fullPage:true});
    }
    assert.deepEqual(errors,[]);
    await page.close();
    console.log(`PASS ${theme}: native lists, keyboard actions, disabled skip, density, dividers, long text/actions, 3 widths`);
  }
}finally{
  if(browser)await browser.close();
  await server.close();
}
