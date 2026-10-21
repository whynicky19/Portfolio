const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert/strict'),sharp=require('sharp');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/unified-showcases';
const baseline=JSON.parse(fs.readFileSync('/tmp/portfolio-unified-baseline/structure.json'));
const old=fs.readFileSync('/tmp/portfolio-unified-baseline/projects.html','utf8');
const current=fs.readFileSync('projects.html','utf8');
const outside=s=>s.replace(/    <section class="editorial-collection"[\s\S]*?(?=    <section class="projects-close")/,'').replace(/^.*projects-unified\.css.*\n/gm,'');
assert.equal(outside(old),outside(current),'Only collection and its stylesheet include may change');
assert.equal(fs.readFileSync('projects-editorial.js','utf8'),fs.readFileSync('/tmp/portfolio-unified-baseline/projects-editorial.js','utf8'),'Existing motion stays unchanged');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch(),report=[];
 for(const width of [1440,1280,768,390,320]){
  const p=await b.newPage({viewport:{width,height:900}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4173/projects.html',{waitUntil:'networkidle'});
  await p.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));await document.fonts.ready});
  assert.equal(await p.locator('.unified-showcase').count(),10);
  assert.equal(await p.locator('.editorial-collection .story-environment,.editorial-collection .device-hardware,.editorial-collection .authentic-screen,.editorial-collection .scene-depth').count(),0);
  const data=await p.locator('.project-story').evaluateAll(es=>es.map(e=>({id:e.id,copy:e.querySelector('.project-copy').innerHTML,links:[...e.querySelectorAll('a')].map(a=>a.getAttribute('href'))})));
  for(let i=0;i<10;i++){assert.equal(data[i].copy,baseline[i].copy);assert.deepEqual(data[i].links,baseline[i].links)}
  const rows=[];
  for(const story of await p.locator('.project-story').all()){
   const id=await story.getAttribute('id'),states=[];
   for(const progress of [.2,.5,.8]){
    await story.evaluate((e,t)=>scrollTo({top:e.offsetTop-innerHeight+t*(innerHeight+e.offsetHeight),behavior:'instant'}),progress);
    await p.waitForTimeout(80);
    states.push(await story.evaluate(e=>{let a=e.querySelector('.project-scene'),i=e.querySelector('img'),r=a.getBoundingClientRect(),q=i.getBoundingClientRect();return {x:q.x-r.x,y:q.y-r.y,w:q.width,h:q.height,transform:getComputedStyle(i).transform,loaded:i.naturalWidth>0,overflow:document.documentElement.scrollWidth>innerWidth,fit:getComputedStyle(i).objectFit}}));
   }
   for(const s of states){assert.equal(s.transform,'none');assert(s.loaded);assert(!s.overflow);assert.equal(s.fit,'contain');assert(Math.abs(s.w-s.h)<1);assert(Math.abs(s.x-states[0].x)<.01);assert(Math.abs(s.y-states[0].y)<.01)}
   if(width===1440||width===390){await story.scrollIntoViewIfNeeded();await p.waitForTimeout(600);await story.screenshot({path:out+'/'+id+'-'+width+'.png'});}
   rows.push({id,static:true,noCrop:true,contentAndLinksPreserved:true});
  }
  await p.emulateMedia({reducedMotion:'reduce'});
  await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(100);
  const reduced=await p.locator('.unified-showcase').evaluateAll(es=>es.every(e=>getComputedStyle(e).transform==='none'&&getComputedStyle(e).animationName==='none'));
  assert(reduced);
  if(width===1440||width===390)await p.screenshot({path:out+'/projects-full-'+width+'.png',fullPage:true});
  if(width===1440){
   for(const cls of ['projects-hero','recent-work','projects-close']){
    const file=out+'/unchanged-'+cls+'.png';await p.locator('.'+cls).screenshot({path:file});
    const a=await sharp(file).raw().toBuffer(),z=await sharp('/tmp/portfolio-unified-baseline/'+cls+'.png').raw().toBuffer();
    if(cls!=='projects-close')assert(a.equals(z),cls+' must be pixel-identical');
    else { assert.equal(a.length,z.length);const mae=a.reduce((sum,v,i)=>sum+Math.abs(v-z[i]),0)/a.length;assert(mae<1,'Footer CTA rasterization changed beyond subpixel alignment'); }
   }
  }
  const axe='/tmp/portfolio-a11y.nJVQC6/node_modules/axe-core/axe.min.js';
  let violations=[];
  if(fs.existsSync(axe)){await p.addScriptTag({path:axe});violations=await p.evaluate(async()=> (await axe.run('.editorial-collection',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.length})));assert.equal(violations.length,0,JSON.stringify(violations))}
  assert.equal(errors.length,0);
  report.push({width,projects:rows,reducedMotion:reduced,errors,violations});
  await p.close();console.log(width+' passed');
 }
 const p=await b.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
 await p.goto('http://127.0.0.1:4173/projects.html');assert.equal(await p.locator('.unified-showcase').count(),10);await p.close();
 fs.writeFileSync(out+'/results.json',JSON.stringify(report,null,2));await b.close();
})();
