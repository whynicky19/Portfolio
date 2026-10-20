const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
const output='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/notebook-hero';
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch();const results=[];
 for(const width of [1440,1280,768,390,320]){
  const p=await browser.newPage({viewport:{width,height:width<600?844:1000}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4173');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(800);
  assert.equal(await p.locator('.p-hero img').count(),0);
  const metrics=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,font:document.fonts.check('700 100px Pixelify'),clipped:[...document.querySelectorAll('.p-hero h1,.identity-note,.p-hero a')].filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth||e.scrollWidth>e.clientWidth+2}).map(e=>e.textContent)}));
  assert(!metrics.overflow&&metrics.font&&!metrics.clipped.length,JSON.stringify(metrics));
  assert.match(await p.locator('.pixel-name').evaluate(e=>getComputedStyle(e).fontFamily),/Pixelify/);
  await p.addScriptTag({path:'/tmp/portfolio-a11y.nJVQC6/node_modules/axe-core/axe.min.js'});
  const violations=await p.evaluate(async()=>(await axe.run('.p-hero',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
  assert.equal(violations.length,0,JSON.stringify(violations));
  await p.screenshot({path:`${output}/hero-${width}.png`});
  await p.locator('.notebook-actions a').first().focus();assert(await p.locator('.notebook-actions a').first().evaluate(e=>e===document.activeElement));
  for(const y of [150,400]){await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await p.waitForTimeout(300);if(width===1440||width===390)await p.screenshot({path:`${output}/scroll-${width}-${y}.png`});}
  const moving=await p.locator('.notebook-paper').evaluate(e=>getComputedStyle(e).transform);assert.notEqual(moving,'matrix(1, 0, 0, 1, 0, 0)');
  await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('.notebook-paper').evaluate(e=>getComputedStyle(e).transform),'none');
  results.push({width,...metrics,violations,errors,motion:moving});assert.equal(errors.length,0);await p.close();
 }
 await fs.writeFile(`${output}/checks.json`,JSON.stringify(results,null,2));await browser.close();console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1)});
