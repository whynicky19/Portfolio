// A frozen-frame diagnostic, separate from the real-time opening/video evidence.
const {chromium}=require('playwright');const sharp=require('sharp');const fs=require('node:fs/promises');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/pixel-assembly';
(async()=>{
 const browser=await chromium.launch();const p=await browser.newPage({viewport:{width:1440,height:1000}});
 await p.addInitScript(()=>{
  const raf=window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame=fn=>raf(t=>{
   if(window.qaFrozen)return;
   fn(t);const start=window.portfolioEntrance?.start;
   if(start&&t-start>=1450&&t-start<1500)window.qaFrozen=true;
  });
 });
 await p.goto('http://127.0.0.1:4173');await p.waitForFunction(()=>window.qaFrozen,{},{timeout:3000,polling:20});
 const box=await p.locator('.pixel-name').boundingBox();
 await p.screenshot({path:out+'/handoff-canvas.png',clip:box});
 await p.evaluate(()=>{document.documentElement.classList.add('assembly-name-done');document.querySelector('.pixel-name canvas').remove()});
 await p.screenshot({path:out+'/handoff-real-text.png',clip:box});
 const a=await sharp(out+'/handoff-canvas.png').removeAlpha().raw().toBuffer({resolveWithObject:true});
 const b=await sharp(out+'/handoff-real-text.png').removeAlpha().raw().toBuffer();
 let mismatch=0;for(let i=0;i<b.length;i+=3)if((a.data[i]<80)!==(b[i]<80))mismatch++;
 const result={method:'Frozen at the completed mask, then native text at identical bounds',width:a.info.width,height:a.info.height,inkMismatchPixels:mismatch,fraction:mismatch/(a.info.width*a.info.height)};
 await fs.writeFile(out+'/handoff-check.json',JSON.stringify(result,null,2));console.log(result);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
