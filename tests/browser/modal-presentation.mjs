import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import ts from 'typescript';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../..', import.meta.url));
const output = process.env.MODAL_TEST_OUTPUT || '/tmp/ui-modal-presentation';
const code = String.raw`
import React,{useState}from'react';import{createRoot}from'react-dom/client';import{flushSync}from'react-dom';
import{ThemeProvider,useTheme,Modal,ModalBody,ModalFooter,Button,FormField,Input,Prose,LoadingState}from'/dist/index.js';import'/dist/styles.css';
const path='/articles/'+ 'unbroken-path'.repeat(25);
function Fixture(){const{setTheme}=useTheme();const[open,setOpen]=useState(false);const[mode,setMode]=useState('long');const[loading,setLoading]=useState(null);
window.fixture={theme:v=>flushSync(()=>setTheme(v)),mode:v=>flushSync(()=>setMode(v)),loading:v=>flushSync(()=>setLoading(v))};
if(loading)return <LoadingState {...loading}/>;
const actions=<ModalFooter><Button variant='ghost' onClick={()=>setOpen(false)}>Cancel</Button><Button type={mode==='form'?'submit':'button'}>{mode==='long'?'PermanentlyDeleteThisDocumentAndItsMetadata':'Save changes'}</Button></ModalFooter>;
const body=<ModalBody>{mode==='form'?Array.from({length:18},(_,i)=><FormField key={i} label={'Field '+(i+1)}><Input autoFocus={i===0} defaultValue={'Value '+i}/></FormField>):<><p>{path}</p><Prose><pre><code>{'const preserve = '+ 'long_code'.repeat(35)+';\nsecond line'}</code></pre></Prose><p>End of content</p></>}</ModalBody>;
return <><Button onClick={()=>setOpen(true)}>Open dialog</Button><Modal isOpen={open} onClose={()=>setOpen(false)} hideCloseButton={mode==='hidden'} title={mode==='oversized'?'ReviewLongDocumentIdentifierBeforePermanentDeletion'.repeat(12):mode==='long'?'ReviewLongDocumentIdentifierBeforePermanentDeletion':'Edit document'} description={mode==='long'?'MetadataIdentifierWithoutBreaks'.repeat(3):'Document metadata'}>{mode==='form'?<form onSubmit={event=>{event.preventDefault();window.submitted=(window.submitted||0)+1;}}>{body}{actions}</form>:<>{body}{actions}</>}</Modal></>;}
createRoot(document.getElementById('root')).render(<ThemeProvider defaultTheme='light' defaultPalette='graphite' disableStorage><Fixture/></ThemeProvider>);`;
const server = await createServer({
  root, configFile:false, cacheDir:'/tmp/ui-modal-presentation-vite', server:{host:'127.0.0.1',port:0},
  plugins:[{
    name:'modal-presentation',resolveId:id=>id==='/fixture.tsx'?'\0modal-presentation':undefined,
    load:id=>id==='\0modal-presentation'?ts.transpileModule(code,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText:undefined,
    configureServer(vite){vite.middlewares.use(async(req,res,next)=>{
      if(new URL(req.url,'http://localhost').pathname!=='/')return next();
      try{const html=await vite.transformIndexHtml(req.url,'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/fixture.tsx"></script></body></html>');res.setHeader('Content-Type','text/html');res.end(html);}catch(error){next(error);}
    });},
  }],
});
let browser;
try {
  await server.listen();await mkdir(output,{recursive:true});
  const base=`http://127.0.0.1:${server.httpServer.address().port}`;
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  await page.goto(base);
  const trigger=page.getByRole('button',{name:'Open dialog',exact:true});
  await trigger.waitFor();
  for (const [width,viewportHeight] of [[1280,900],[390,900],[320,900],[320,480]]) {
    await page.setViewportSize({width,height:viewportHeight});
    for (const theme of ['light','dark']) {
      await page.evaluate(value=>window.fixture.theme(value),theme);
      for (const [size,height] of [['compact',64],['default',160],['lg',240]]) {
        for (const label of ['正在加载文章记录', 'LoadingUnbrokenDocumentIdentifier'.repeat(10)]) {
          await page.evaluate(value=>window.fixture.loading(value),{size,label});
          await page.getByRole('status').evaluate(element=>Promise.all(element.getAnimations().map(animation=>animation.finished)));
          const loading=page.getByRole('status');
          assert.equal(await loading.count(),1,'one loading status region');
          assert.equal(await loading.innerText(),label);
          const geometry=await loading.evaluate(element=>{
            const box=element.getBoundingClientRect(),label=element.querySelector('.ui-loading-state-label');
            return {className:element.className,minHeight:getComputedStyle(element).minHeight,height:box.height,left:box.left,right:box.right,viewport:innerWidth,scroll:element.scrollWidth,client:element.clientWidth,labelScroll:label.scrollWidth,labelClient:label.clientWidth};
          });
          assert.ok(geometry.height>=height&&geometry.left>=0&&geometry.right<=geometry.viewport&&geometry.scroll<=geometry.client+1&&geometry.labelScroll<=geometry.labelClient+1,`loading text wraps and size reserves space: ${JSON.stringify({width,theme,size,geometry})}`);
          assert.equal(await loading.locator('.ui-spinner').evaluate(element=>getComputedStyle(element).animationName),'none');
          assert.equal(await loading.getAttribute('aria-busy'),null);
          await page.screenshot({path:`${output}/${theme}-${width}-loading-${size}-${label.length>30?'long':'short'}.png`});
        }
      }
      await page.evaluate(()=>window.fixture.loading(null));
      for (const mode of ['long','form','hidden','oversized']) {
        await page.evaluate(value=>window.fixture.mode(value),mode);
        await trigger.click();
        const dialog=page.getByRole('dialog');await dialog.waitFor();
        await dialog.evaluate(element=>Promise.all(element.getAnimations().map(animation=>animation.finished)));
        const body=dialog.locator('.ui-modal-body');
        const heading=dialog.locator('.ui-modal-header');
        const desc=dialog.locator('.ui-modal-description');
        for (const node of [heading,desc,body.locator('p').first()]) {
          if(await node.count()) assert.ok(await node.evaluate(element=>element.scrollWidth<=element.clientWidth+1),'long plain text wraps within its container');
        }
        assert.ok(await body.evaluate(element=>element.clientHeight>=40),'body retains usable scroll area');
        assert.ok(await dialog.evaluate(element=>{const box=element.getBoundingClientRect();return box.left>=0&&box.right<=innerWidth+1&&box.top>=0&&box.bottom<=innerHeight+1;}),'dialog remains within viewport');
        for(const button of await dialog.locator('.ui-modal-footer button').all()) {
          assert.ok(await button.evaluate(element=>{const outer=element.closest('.ui-modal-footer').getBoundingClientRect(),box=element.getBoundingClientRect();return box.left>=outer.left&&box.right<=outer.right&&element.scrollWidth<=element.clientWidth+1;}),'footer actions wrap without clipping text');
        }
        if(mode!=='hidden') {
          const close=dialog.getByRole('button',{name:'关闭',exact:true});
          const closeBox=await close.boundingBox();
          assert.ok(await heading.evaluate((element,close)=>{const range=document.createRange();range.selectNodeContents(element);return [...range.getClientRects()].every(rect=>rect.right<=close.x||rect.left>=close.x+close.width||rect.bottom<=close.y||rect.top>=close.y+close.height);},closeBox),'close button cannot occlude title text');
        } else assert.equal(await dialog.getByRole('button',{name:'关闭',exact:true}).count(),0);
        if(mode==='form') {
          const positions=await dialog.evaluate(element=>['.ui-modal-header','.ui-modal-description','.ui-modal-body','.ui-modal-footer'].map(selector=>{const box=element.querySelector(selector).getBoundingClientRect();return {top:box.top,bottom:box.bottom};}));
          for(let i=1;i<positions.length;i++)assert.ok(positions[i-1].bottom<=positions[i].top+1,'header, description, form body and footer retain reading order');
          assert.ok(await body.evaluate(element=>element.scrollHeight>element.clientHeight),'form body scrolls without moving footer');
          await dialog.getByRole('button',{name:'Save changes',exact:true}).click();
          assert.ok(await page.evaluate(()=>window.submitted>0));
          await dialog.getByRole('textbox',{name:'Field 18',exact:true}).focus();
          await page.keyboard.press('Tab');
          assert.ok(await dialog.evaluate(element=>element.contains(document.activeElement)),'Tab remains trapped in dialog');
        } else {
          assert.equal(await dialog.locator('pre').evaluate(element=>getComputedStyle(element).whiteSpace),'pre','intentional code whitespace is preserved');
          assert.ok(await dialog.locator('pre').evaluate(element=>element.scrollWidth>element.clientWidth),'code keeps local horizontal scrolling');
        }
        await page.screenshot({path:`${output}/${theme}-${width}-${viewportHeight}-${mode}.png`,fullPage:true});
        await page.keyboard.press('Escape');
        await dialog.waitFor({state:'hidden'});
        await page.waitForFunction(()=>document.activeElement?.matches('button') && document.activeElement.textContent==='Open dialog', undefined, {timeout:3000});
        assert.ok(await trigger.evaluate(element=>element===document.activeElement),'controlled Modal restores focus to the opener');
      }
    }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS LoadingState and Modal: loading sizes/wrapping/reduced motion, long text/actions, close clearance, code scrolling, form scroll/submit, focus trap/return, light/dark and desktop/mobile');
} finally {await browser?.close();await server.close();}
