const {chromium}=require('playwright');
const fs=require('fs');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/integrated-projects';
(async()=>{
 const b=await chromium.launch();
 for(const width of[1440,390]){
  const c=await b.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390,recordVideo:{dir:out,size:{width,height:900}}});
  const p=await c.newPage();await p.goto('http://127.0.0.1:4173/projects.html');await p.waitForTimeout(1700);
  const firstTop=await p.locator('#chatra-project').evaluate(e=>e.offsetTop);
  await p.mouse.wheel(0,firstTop-820);await p.waitForTimeout(120);
  for(let i=0;i<5;i++){await p.mouse.wheel(0,150);await p.waitForTimeout(150);}await p.waitForTimeout(600);
  for(const id of['soyle-project','digital-urpaq-project','freelanceos','forge','portfolio','chatra-backend','learning']){
   const top=await p.locator('#'+id).evaluate(e=>e.offsetTop);
   const delta=top-await p.evaluate(()=>scrollY);
   for(let i=0;i<3;i++){await p.mouse.wheel(0,delta/3);await p.waitForTimeout(130);}await p.waitForTimeout(650);
  }
  await p.mouse.wheel(0,-600);await p.waitForTimeout(400);await p.mouse.wheel(0,600);await p.waitForTimeout(400);
  const v=p.video();await c.close();await v.saveAs(out+`/scroll-${width}.webm`);console.log(width,'recorded');
 }
 await b.close();
})();
