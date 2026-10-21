const {chromium}=require('playwright'),fs=require('fs');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/project-scenes-v2';
(async()=>{
 const b=await chromium.launch();
 for(const width of [1440,390]){
  const ctx=await b.newContext({viewport:{width,height:900},recordVideo:{dir:out+'/recordings',size:{width,height:900}}});
  const p=await ctx.newPage();
  await p.goto('http://127.0.0.1:4173/projects.html',{waitUntil:'networkidle'});
  await p.evaluate(async()=>{for(const i of document.querySelectorAll('.editorial-collection img'))i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
  await p.locator('#chatra-project').evaluate(e=>scrollTo(0,e.offsetTop-innerHeight+20));
  await p.waitForTimeout(450);
  for(let i=0;i<40;i++){await p.mouse.wheel(0,25);await p.waitForTimeout(70);if([7,18,28].includes(i))await p.screenshot({path:`${out}/entry-${width}-${i}.png`});}
  await p.waitForTimeout(500);
  for(let i=0;i<24;i++){await p.mouse.wheel(0,32);await p.waitForTimeout(65);}
  await p.waitForTimeout(600);
  await p.locator('#freelanceos').evaluate(e=>scrollTo(0,e.offsetTop-innerHeight*.7));
  await p.waitForTimeout(400);
  for(let i=0;i<24;i++){await p.mouse.wheel(0,32);await p.waitForTimeout(70);}
  await p.waitForTimeout(400);
  await p.emulateMedia({reducedMotion:'reduce'});
  for(let i=0;i<14;i++){await p.mouse.wheel(0,-30);await p.waitForTimeout(70);}
  await p.waitForTimeout(500);
  const video=p.video();await ctx.close();await video.saveAs(`${out}/scroll-${width}.webm`);console.log('RECORDED',width);
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
