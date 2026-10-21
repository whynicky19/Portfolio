const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/about-motion';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const b=await chromium.launch();const results=[];
 for(const width of [1440,390]){
  const c=await b.newContext({viewport:{width,height:900},recordVideo:{dir:out,size:{width,height:900}}});
  const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4173/about.html');await p.waitForTimeout(1800);
  const header=await p.locator('.about-notebook').evaluate(e=>({html:e.outerHTML,height:e.offsetHeight,targets:e.querySelectorAll('[data-about-motion]').length}));
  assert.equal(header.targets,0);
  const targets=p.locator('[data-about-motion]');const n=await targets.count();
  for(let i=0;i<n;i++){
   const el=targets.nth(i);
   if(await el.getAttribute('data-motion-phase')==='complete')continue;
   const box=await el.boundingBox();
   await p.mouse.wheel(0,box.y-260);await p.waitForTimeout(170);
   if(['type','split','diagonal','chapter','paper'].includes(await el.getAttribute('data-about-motion'))){
    const kind=await el.getAttribute('data-about-motion');
    if(!fs.existsSync(`${out}/${width}-${kind}-mid.png`))await p.screenshot({path:`${out}/${width}-${kind}-mid.png`});
   }
   await p.waitForTimeout(750);
   assert.equal(await el.getAttribute('data-motion-phase'),'complete');
  }
  const states=await targets.evaluateAll(es=>es.map(e=>({kind:e.dataset.aboutMotion,phase:e.dataset.motionPhase,count:e.dataset.motionCount})));
  assert(states.every(e=>e.phase==='complete'&&e.count==='1'));
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  await p.locator('.certificate-open').first().focus();await p.keyboard.press('Enter');await p.locator('#certificate-dialog').waitFor({state:'visible'});await p.keyboard.press('Escape');
  await p.locator('#skills').evaluate(e=>scrollTo(0,e.offsetTop-80));await p.waitForTimeout(200);await p.screenshot({path:`${out}/${width}-skills-complete.png`});
  assert.equal(await p.locator('.about-notebook').evaluate(e=>e.outerHTML),header.html);
  results.push({width,effects:states.length,errors,headerUnchanged:true});
  const v=p.video();await c.close();await v.saveAs(`${out}/scroll-${width}.webm`);
 }
 for(const mode of ['reduce','no-js','focus','toggle','fast']){
  const c=await b.newContext({viewport:{width:320,height:844},reducedMotion:mode==='reduce'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js'});const p=await c.newPage();await p.goto('http://127.0.0.1:4173/about.html');
  if(mode==='toggle'){await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>!document.querySelector('[data-motion-phase="pending"]'));}
  if(mode==='focus'){await p.locator('.certificate-open').first().focus();assert.equal(await p.locator('.certificate-card').first().getAttribute('data-motion-phase'),'complete');}
  if(mode==='fast'){await p.mouse.wheel(0,16000);await p.waitForTimeout(100);await p.mouse.wheel(0,-16000);await p.waitForTimeout(900);}
  if(['reduce','no-js'].includes(mode))assert.equal(await p.locator('[data-motion-phase="pending"]').count(),0);
  if(mode==='toggle')assert.equal(await p.locator('[data-motion-phase="pending"]').count(),0);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);results.push({mode,passed:true});await c.close();
 }
 fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(results);await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
