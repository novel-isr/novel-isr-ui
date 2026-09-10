import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import ts from 'typescript';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../..', import.meta.url));
const output = process.env.UI_TEST_OUTPUT || '/tmp/ui-json-field';
function luminance(color) {
 const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(value=>{const v=value/255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;});
 return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
}
const code = String.raw`import React,{useState}from'react';import{createRoot}from'react-dom/client';
import{JsonField,FormField,FormLayout,Button,ThemeProvider,Alert,VStack}from'/dist/index.js';import'/dist/styles.css';
window.changes=[];window.events=[];window.submissions=[];
function Fixture(){
 const [value,setValue]=useState('{"title":"Draft"}'),[disabled,setDisabled]=useState(false),[readonly,setReadonly]=useState(false),[business,setBusiness]=useState(false);
 window.setValue=setValue;window.setDisabled=setDisabled;window.setReadonly=setReadonly;window.setBusiness=setBusiness;
 return <main style={{maxWidth:760,padding:16,margin:'auto'}}><VStack gap={4}>
 <FormLayout id='settings' noValidate onSubmit={e=>{e.preventDefault();window.submissions.push(Object.fromEntries(new FormData(e.currentTarget)))}}>
 <FormField label='Dictionary' helperText='Translations' isDisabled={disabled} isReadOnly={readonly} isRequired isInvalid={business} errorMessage={business?'Dictionary must contain string values':undefined}>
 <JsonField name='dictionary' rows={10} resize='vertical' value={value} onChange={v=>{window.changes.push(v);setValue(v)}}
 formatLabel='Format JSON' validLabel='Valid JSON syntax' invalidLabel='Invalid JSON syntax' aria-describedby='external-help'
 onFocus={()=>window.events.push('focus')} onBlur={()=>window.events.push('blur')}/>
 </FormField><span id='external-help'>JSON</span><Button type='submit'>Save</Button></FormLayout>
 <Alert title={'Long_alert_title_'.repeat(25)} status='danger'>{'Long_identifier_'.repeat(50)}</Alert>
 </VStack></main>;
}
createRoot(document.getElementById('root')).render(<ThemeProvider defaultTheme={new URLSearchParams(location.search).get('theme')} defaultPalette='graphite' disableStorage><Fixture/></ThemeProvider>);`;
const server = await createServer({root,configFile:false,cacheDir:'/tmp/ui-json-field-vite',server:{host:'127.0.0.1',port:0},plugins:[{
 name:'json-field-fixture',resolveId:id=>id==='/fixture.tsx'?'\0fixture':undefined,
 load:id=>id==='\0fixture'?ts.transpileModule(code,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText:undefined,
 configureServer(vite){vite.middlewares.use((req,res,next)=>{
  if(new URL(req.url,'http://localhost').pathname!=='/')return next();
  res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:var(--ui-color-canvas);color:var(--ui-color-fg);font-family:var(--ui-font-family-sans)}*{box-sizing:border-box}</style></head><body><div id="root"></div><script type="module" src="/fixture.tsx"></script></body></html>');
 });},
}]});
await server.listen();
let browser;
try {
 browser=await chromium.launch({channel:'chrome',headless:true});
 await mkdir(output,{recursive:true});
 for(const theme of ['light','dark']) {
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  page.setDefaultTimeout(10000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?theme=${theme}`);
  const field=page.getByRole('textbox',{name:'Dictionary',exact:true});await field.waitFor();
  const setValue=async value=>{await page.evaluate(value=>window.setValue(value),value);await page.waitForFunction(value=>document.querySelector('textarea')?.value===value,value);};
  const formatButton=page.getByRole('button',{name:'Format JSON',exact:true});
  await page.locator('label').filter({hasText:'Dictionary'}).click();
  assert.ok(await field.evaluate(el=>el===document.activeElement));
  await page.keyboard.press('Shift+Tab');
  assert.ok(await formatButton.evaluate(el=>el===document.activeElement));
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>window.changes.length===1);
  assert.equal(await field.inputValue(),'{\n  "title": "Draft"\n}');
  assert.equal(await page.evaluate(()=>window.submissions.length),0);
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>window.changes.length),1,'no-op formatting is not a write');
  await formatButton.hover();await page.getByRole('tooltip').waitFor();
  assert.match(await page.getByRole('tooltip').innerText(),/Format JSON/);
  await field.fill('{');
  assert.doesNotMatch(await page.getByRole('status').innerText(),/Valid|Invalid/);
  await field.press('Tab');
  await page.getByText(/Invalid JSON syntax/).waitFor();
  assert.equal(await field.getAttribute('aria-invalid'),'true');
  const statusId=await page.getByRole('status').getAttribute('id');
  assert.ok((await field.getAttribute('aria-describedby')).split(' ').includes(statusId));
  assert.match(await field.getAttribute('aria-describedby'),/external-help/);
  const beforeInvalid=await page.evaluate(()=>window.changes.length);
  await formatButton.click();assert.equal(await page.evaluate(()=>window.changes.length),beforeInvalid);
  await setValue('{"external":true}');
  await page.getByText('Valid JSON syntax',{exact:true}).waitFor();
  assert.notEqual(await field.getAttribute('aria-invalid'),'true');
  await page.evaluate(()=>window.setBusiness(true));
  await page.getByRole('alert').filter({hasText:'Dictionary must contain string values'}).waitFor();
  assert.equal(await field.getAttribute('aria-invalid'),'true');
  await page.evaluate(()=>window.setBusiness(false));
  for(const setter of ['setDisabled','setReadonly']) {
   await page.evaluate(setter=>window[setter](true),setter);
   await page.waitForFunction(setter=>document.querySelector('.ui-json-field button').disabled && document.querySelector('textarea')[setter==='setDisabled'?'disabled':'readOnly'],setter);
   assert.equal(await formatButton.isDisabled(),true);
   assert.equal(await field.evaluate((el,setter)=>setter==='setDisabled'?el.disabled:el.readOnly,setter),true);
   await page.getByRole('button',{name:'Save',exact:true}).click();
   assert.equal(await page.evaluate(()=>Object.hasOwn(window.submissions.at(-1),'dictionary')),setter==='setReadonly');
   await page.evaluate(setter=>window[setter](false),setter);
   await page.waitForFunction(()=>!document.querySelector('.ui-json-field button').disabled);
  }
  const lossless='{"n":9007199254740993,"exponent":1e400,"escaped":"\\u0061","duplicate":1,"duplicate":2}';
  await setValue(lossless);await formatButton.click();
  const formatted=await field.inputValue();
  assert.match(formatted,/9007199254740993/);assert.match(formatted,/1e400/);assert.match(formatted,/\\u0061/);
  assert.equal(formatted.match(/"duplicate"/g).length,2);
  await setValue('{"markup":"<img src=x onerror=alert(1)>"}');
  assert.equal(await page.locator('img').count(),0);
  for(const width of [1440,390,320]) {
   await page.setViewportSize({width,height:1000});
   await setValue('{"long":"'+'unbroken_value_'.repeat(80)+'"}');
   assert.ok(await field.evaluate(el=>el.scrollWidth>el.clientWidth));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.ok(await page.locator('.ui-alert').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
   await page.screenshot({path:`${output}/${theme}-${width}.png`,fullPage:true});
   await setValue('invalid_'+'long_error_'.repeat(80));
   await page.getByText(/Invalid JSON syntax/).waitFor();
   const colors=await page.getByRole('status').evaluate(el=>({foreground:getComputedStyle(el).color,background:getComputedStyle(document.body).backgroundColor}));
   const a=luminance(colors.foreground),b=luminance(colors.background);
   assert.ok((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)>=4.5,'syntax error text contrast');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:`${output}/${theme}-${width}-error.png`,fullPage:true});
  }
  assert.deepEqual(errors,[]);
  assert.ok(await page.evaluate(()=>window.events.includes('focus')&&window.events.includes('blur')));
  await page.close();
  console.log('PASS',theme,'keyboard/tooltip, native form, disabled/readonly, external values, validation, lossless formatting, narrow JSON/alert/error layout');
 }
} finally {await browser?.close();await server.close();}
