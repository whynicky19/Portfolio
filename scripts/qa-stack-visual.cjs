const {chromium}=require('playwright');
const sharp=require('sharp');
const fs=require('fs');
const assert=require('assert/strict');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/home-stack';
const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
(async()=>{
 const browser=await chromium.launch();
 const results=[];
 for(const width of [1440,1280,768,390,320]) {
  const page=await browser.newPage({viewport:{width,height:1100},reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'networkidle'});
  const stack=page.locator('.home-stack');
  await stack.scrollIntoViewIfNeeded();
  const boxes=await stack.evaluate(el=>{
   const s=el.getBoundingClientRect();
   return [...el.querySelectorAll('h2,p,h3,li span')].map(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return {text:e.textContent,x:r.x-s.x,y:r.y-s.y,w:r.width,h:r.height,color:c.color.match(/\d+/g).slice(0,3).map(Number),large:parseFloat(c.fontSize)>=24};});
  });
  await page.addStyleTag({content:'.home-stack .stack-shell {visibility:hidden}'});
  const {data,info}=await sharp(await stack.screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const scores=boxes.map(b=>{
   let min=Infinity;
   for(let y=Math.max(0,Math.ceil(b.y));y<Math.min(info.height,b.y+b.h);y+=2)for(let x=Math.max(0,Math.ceil(b.x));x<Math.min(info.width,b.x+b.w);x+=2){
    const i=(y*info.width+x)*3,background=luminance([data[i],data[i+1],data[i+2]]),ink=luminance(b.color);
    min=Math.min(min,(Math.max(background,ink)+.05)/(Math.min(background,ink)+.05));
   }
   assert(min>=(b.large?3:4.5),`${width}: ${b.text} contrast ${min}`);
   return {text:b.text,minContrast:+min.toFixed(2)};
  });
  results.push({width,scores});
  await page.close();
  console.log(`Contrast PASS ${width}: ${Math.min(...scores.map(s=>s.minContrast))}`);
 }
 // Fresh reduced-motion load (not just switching the setting after entry).
 const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await reduced.goto('http://127.0.0.1:4173/index.html',{waitUntil:'networkidle'});
 await reduced.locator('.home-stack').scrollIntoViewIfNeeded();
 assert.equal(await reduced.locator('.home-stack').evaluate(el=>el.getAnimations({subtree:true}).length),0);
 await reduced.locator('.home-stack').screenshot({path:out+'/stack-reduced-390.png'});
 await reduced.close();
 // The static, semantic content also survives unavailable JavaScript.
 const nojs=await browser.newPage({viewport:{width:320,height:1100},javaScriptEnabled:false});
 await nojs.goto('http://127.0.0.1:4173/index.html',{waitUntil:'networkidle'});
 assert.equal(await nojs.locator('.home-stack li').count(),13);
 assert(await nojs.locator('#toolkit-title').isVisible());
 await nojs.close();
 // Real browser wheel scrolling, with no programmatic animation of scene content.
 const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:out+'/video',size:{width:1440,height:1000}}});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'networkidle'});
 await page.locator('.home-stack').evaluate(el=>scrollTo(0,el.offsetTop-innerHeight+40));
 await page.waitForTimeout(400);
 for(let i=0;i<24;i++){await page.mouse.wheel(0,42);await page.waitForTimeout(90);}
 await page.waitForTimeout(800);
 for(let i=0;i<12;i++){await page.mouse.wheel(0,-48);await page.waitForTimeout(90);}
 await page.waitForTimeout(500);
 await page.emulateMedia({reducedMotion:'reduce'});
 for(let i=0;i<10;i++){await page.mouse.wheel(0,40);await page.waitForTimeout(90);}
 const video=page.video();
 await context.close();
 await video.saveAs(out+'/stack-scroll.webm');
 fs.writeFileSync(out+'/visual-checks.json',JSON.stringify({contrast:results,reducedFresh:true,noJavaScript:true},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
