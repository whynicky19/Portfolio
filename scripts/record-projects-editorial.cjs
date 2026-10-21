const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/projects-editorial';
(async()=>{
 const browser=await chromium.launch();const ctx=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:out,size:{width:1440,height:900}}});
 const p=await ctx.newPage(),cdp=await ctx.newCDPSession(p);await p.goto('http://127.0.0.1:4173/projects.html',{waitUntil:'domcontentloaded'});
 const frames=[];for(const t of [200,600,1100,1900]){
  const elapsed=await p.evaluate(()=>performance.now());if(elapsed<t)await p.waitForTimeout(t-elapsed);
  const state=await p.evaluate(()=>({time:performance.now(),state:document.querySelector('.projects-hero').dataset.reveal,clip:getComputedStyle(document.querySelector('h1')).clipPath,opacity:getComputedStyle(document.querySelector('h1')).opacity}));frames.push(state);
  const shot=await cdp.send('Page.captureScreenshot',{format:'png'});await fs.writeFile(`${out}/reveal-${t}.png`,Buffer.from(shot.data,'base64'));
 }
 assert.match(frames[1].clip,/^polygon/);assert.equal(frames.at(-1).clip,'none');assert.equal(frames.at(-1).opacity,'1');
 await p.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
 const timing=await p.evaluate(async()=>{
  const start=performance.now(),end=document.documentElement.scrollHeight-innerHeight,deltas=[];let last=start;
  await new Promise(resolve=>{function tick(now){deltas.push(now-last);last=now;const t=Math.min(1,(now-start)/20000);scrollTo({top:end*t,behavior:'instant'});if(t<1)requestAnimationFrame(tick);else resolve()}requestAnimationFrame(tick)});
  return{frames:deltas.length,meanInterval:deltas.reduce((a,b)=>a+b,0)/deltas.length,maxInterval:Math.max(...deltas),intervalsOver50ms:deltas.filter(n=>n>50).length};
 });
 await fs.writeFile(`${out}/motion-recording.json`,JSON.stringify({frames,timing},null,2));const video=p.video();await ctx.close();await video.saveAs(`${out}/projects-motion.webm`);await browser.close();console.log(JSON.stringify({frames,timing}));
})().catch(e=>{console.error(e);process.exit(1)});
