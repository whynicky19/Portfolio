const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/editorial-stability';
async function wheelTo(page,target,step=360){
 while(true){const y=await page.evaluate(()=>scrollY),remaining=target-y;if(Math.abs(remaining)<5)break;await page.mouse.wheel(0,Math.sign(remaining)*Math.min(Math.abs(remaining),step));await page.waitForTimeout(160);}
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});const b=await chromium.launch(),results=[];
 for(const [width,height,label,reduced] of [[1440,900,'desktop',false],[390,844,'mobile',false],[390,844,'reduced-motion',true]]){
  const c=await b.newContext({viewport:{width,height},isMobile:width===390,hasTouch:width===390,reducedMotion:reduced?'reduce':'no-preference',recordVideo:{dir:out,size:{width,height}}});
  await c.addInitScript(()=>{window.recordingShifts=[];new PerformanceObserver(list=>list.getEntries().forEach(e=>{if(!e.hadRecentInput)recordingShifts.push(e.value);})).observe({type:'layout-shift',buffered:true});});
  const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));await p.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(200);await p.mouse.wheel(0,330);await p.waitForTimeout(1100);
  await p.mouse.wheel(0,-330);await p.waitForTimeout(2000);
  for(const selector of ['.h-work','.h-capabilities','.home-stack','.h-contact']){
   const y=await p.locator(selector).evaluate(e=>e.getBoundingClientRect().top+scrollY);
   await wheelTo(p,y,width===390?520:430);await p.waitForTimeout(reduced?400:1200);
  }
  // Return to the stack and revisit: its reveal must not replay.
  const sy=await p.locator('.home-stack').evaluate(e=>e.getBoundingClientRect().top+scrollY);
  await wheelTo(p,sy);await p.waitForTimeout(850);
  const home=await p.evaluate(()=>({cls:recordingShifts.reduce((a,b)=>a+b,0),broken:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.currentSrc)}));
  await p.goto('http://127.0.0.1:4173/projects.html',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(250);await p.mouse.wheel(0,220);await p.waitForTimeout(1500);
  for(const selector of ['.recent-work','#chatra-project','#soyle-project','#digital-urpaq-project','#freelanceos','#rugpull','#forge','#portfolio','#chatra-backend','#chatra-mobile','#learning']){
   const y=await p.locator(selector).evaluate(e=>e.getBoundingClientRect().top+scrollY);
   await wheelTo(p,y,width===390?650:430);await p.waitForTimeout(reduced?300:1000);
  }
  await p.mouse.wheel(0,-700);await p.waitForTimeout(500);await p.mouse.wheel(0,700);await p.waitForTimeout(700);
  const projects=await p.evaluate(()=>({cls:recordingShifts.reduce((a,b)=>a+b,0),broken:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.currentSrc)}));
  const v=p.video();await c.close();await v.saveAs(path.join(out,`scroll-${label}.webm`));results.push({label,errors,home,projects});console.log(label,'recorded',JSON.stringify(results.at(-1)));
 }
 fs.writeFileSync(path.join(out,'recording-results.json'),JSON.stringify(results,null,2));await b.close();
})();
