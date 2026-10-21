const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),sharp=require('sharp');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/project-scenes-v2';
const baseline=JSON.parse(fs.readFileSync('/tmp/portfolio-scenes-baseline/structure.json'));
const original=fs.readFileSync('/tmp/portfolio-scenes-baseline/projects.html','utf8');
const current=fs.readFileSync('projects.html','utf8');
const strip=s=>s.replace(/    <section class="editorial-collection"[\s\S]*?(?=    <section class="projects-close")/,'').replace(/^.*projects-scenes\.css.*\n/gm,'').replace('projects-editorial.js?v=5','projects-editorial.js?v=4');
assert.equal(strip(original),strip(current),'Changed markup outside project collection');
const oldScript=fs.readFileSync('/tmp/portfolio-scenes-baseline/projects-editorial.js','utf8');
const newScript=fs.readFileSync('projects-editorial.js','utf8');
assert.equal(oldScript.split('  if(\'IntersectionObserver\'in window)')[0],newScript.split('  if(\'IntersectionObserver\'in window)')[0],'Hero/intro/parallax code changed');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch(),report=[];
 for(const width of [1440,1280,768,390,320]){
  const p=await browser.newPage({viewport:{width,height:900}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4173/projects.html',{waitUntil:'networkidle'});
  await p.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));await document.fonts.ready;});
  const state=await p.evaluate(base=>({
   uniqueBackgrounds:new Set([...document.querySelectorAll('.story-environment img')].map(i=>i.src)).size,
   laptops:document.querySelectorAll('.device-laptop').length,phones:document.querySelectorAll('.device-phone').length,
   missing:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),
   content:[...document.querySelectorAll('.project-story')].every((s,i)=>s.querySelector('.project-copy').innerHTML===base.projects[i].copy&&JSON.stringify([...s.querySelectorAll('a')].map(a=>a.getAttribute('href')))===JSON.stringify(base.projects[i].links)&&JSON.stringify([...s.querySelectorAll('.authentic-screen')].map(i=>i.getAttribute('src')))===JSON.stringify(base.projects[i].screens))
  }),baseline);
  assert.equal(state.uniqueBackgrounds,10);assert.equal(state.laptops,8);assert.equal(state.phones,4);assert.equal(state.missing.length,0);assert(state.content);
  const scenes=[];
  for(const story of await p.locator('.project-story').all()){
   const id=await story.getAttribute('id');
   const values=[];
   for(const progress of [.25,.5,.75]){
    await story.evaluate((e,progress)=>scrollTo({top:e.offsetTop-innerHeight+progress*(innerHeight+e.offsetHeight),behavior:'instant'}),progress);
    await p.waitForTimeout(170);
    values.push(await story.evaluate(e=>{const c=e.querySelector('.project-scene').getBoundingClientRect();return {background:getComputedStyle(e.querySelector('.scene-background')).transform,light:getComputedStyle(e.querySelector('.story-environment'),'::after').transform,media:[...e.querySelectorAll('.scene-depth img')].map(i=>{const r=i.getBoundingClientRect();return[r.x-c.x,r.y-c.y,r.width,r.height]})}}));
   }
   const delta=Math.max(...values.flatMap(v=>v.media.flatMap((a,i)=>a.map((x,j)=>Math.abs(x-values[0].media[i][j])))));
   assert(delta<.01,`${id}: device moved ${delta}`);assert.notEqual(values[0].background,values[2].background);
   assert.notEqual(values[0].light,values[2].light);
   await story.scrollIntoViewIfNeeded();await p.waitForTimeout(700);
   const geometry=await story.evaluate(e=>{
    const c=e.querySelector('.project-copy').getBoundingClientRect();
    const h=e.querySelector('h2'),range=document.createRange();range.selectNodeContents(h);const t=range.getBoundingClientRect();
    return {overflow:document.documentElement.scrollWidth>innerWidth,headingOverflow:t.left<c.left-1||t.right>c.right+1,screenTransforms:[...e.querySelectorAll('.authentic-screen')].map(i=>getComputedStyle(i).transform)};
   });
   assert(!geometry.overflow,`${width}/${id}: page overflow`);assert(!geometry.headingOverflow,`${width}/${id}: title overflow`);
   assert(geometry.screenTransforms.every(x=>x==='none'));
   if(width===1440||width===390)await story.screenshot({path:`${out}/${id}-${width}.png`});
   scenes.push({id,delta,values,geometry});
  }
  await p.addScriptTag({path:'/tmp/portfolio-a11y.nJVQC6/node_modules/axe-core/axe.min.js'});
  const violations=await p.evaluate(async()=>(await axe.run(document.querySelector('.editorial-collection'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
  assert.equal(violations.length,0,JSON.stringify(violations));
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(200);
  for(const story of await p.locator('.project-story').all()){
   assert.equal(await story.locator('.scene-background').evaluate(e=>getComputedStyle(e).transform),'none');
   assert.equal(await story.locator('.story-environment').evaluate(e=>getComputedStyle(e,'::after').transform),'none');
  }
  if(width===1440){
   for(const [name,sel] of Object.entries({hero:'.projects-hero',intro:'.recent-work',footer:'#site-footer'})){
    const buffer=await p.locator(sel).screenshot({path:`${out}/unchanged-${name}.png`});
    const before=await sharp(`/tmp/portfolio-scenes-baseline/${name}.png`).raw().toBuffer();
    const after=await sharp(buffer).raw().toBuffer();assert(before.equals(after),`${name}: visual changed`);
   }
  }
  assert.equal(errors.length,0);report.push({width,state,scenes,violations,errors});await p.close();console.log('PASS',width);
 }
 const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await p.goto('http://127.0.0.1:4173/projects.html',{waitUntil:'networkidle'});await p.locator('#chatra-project').scrollIntoViewIfNeeded();
 assert.equal(await p.locator('.editorial-collection').evaluate(e=>e.getAnimations({subtree:true}).length),0);await p.close();
 const nojs=await browser.newPage({viewport:{width:320,height:844},javaScriptEnabled:false});await nojs.goto('http://127.0.0.1:4173/projects.html');assert.equal(await nojs.locator('.project-story h2:visible').count(),10);await nojs.close();
 fs.writeFileSync(out+'/results.json',JSON.stringify(report,null,2));await browser.close();console.log('ALL PASS');
})().catch(e=>{console.error(e);process.exit(1)});
