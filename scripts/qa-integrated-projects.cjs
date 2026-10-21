const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert/strict'),path=require('path');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/integrated-projects';
const base='http://127.0.0.1:4173/projects.html';
(async()=>{
 fs.mkdirSync(out,{recursive:true});const b=await chromium.launch(),report={viewports:[],fallbacks:[]};
 const before=fs.readFileSync('/tmp/portfolio-integrated-before/projects.html','utf8'),after=fs.readFileSync('projects.html','utf8');
 const section=(html,selector)=>html.match(new RegExp('<'+selector+'[\\s\\S]*?</'+selector.split(' ')[0]+'>'))?.[0];
 report.scope={hero:section(before,'header class="projects-hero"')===section(after,'header class="projects-hero"'),intro:section(before,'section class="recent-work"')===section(after,'section class="recent-work"'),tail:before.slice(before.indexOf('<section class="projects-close"'))===after.slice(after.indexOf('<section class="projects-close"'))};
 const links=html=>[...html.matchAll(/<a[^>]+href="([^"]+)"/g)].map(m=>m[1]).sort();
 report.linksPreserved=JSON.stringify(links(before))===JSON.stringify(links(after));
 report.originalMediaPreserved=JSON.stringify([...before.matchAll(/<picture>[\s\S]*?<\/picture>/g)].map(m=>m[0]))===JSON.stringify([...after.matchAll(/<picture>[\s\S]*?<\/picture>/g)].map(m=>m[0]));
 for(const width of[320,360,390,430,768,1024,1280,1440]){
  const c=await b.newContext({viewport:{width,height:900},isMobile:width<=430,hasTouch:width<=430});
  await c.addInitScript(()=>{window.qa={animations:0,shifts:[]};const a=Element.prototype.animate;Element.prototype.animate=function(...args){qa.animations++;return a.apply(this,args)};new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)qa.shifts.push(e.value)})).observe({type:'layout-shift',buffered:true});});
  const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base);
  await p.evaluate(async()=>{await document.fonts.ready;for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});await p.waitForTimeout(1700);
  // Visit every viewport slice: centering tall tablet sections skips their headings.
  const pageHeight=await p.evaluate(()=>document.documentElement.scrollHeight);
  for(let top=0;top<pageHeight;top+=550){await p.evaluate(top=>scrollTo({top,behavior:'instant'}),top);await p.waitForTimeout(55);}
  await p.waitForTimeout(650);const animations=await p.evaluate(()=>qa.animations);
  for(let repeat=0;repeat<3;repeat++)for(const fraction of[1,.7,.2,0,.5,1]){await p.evaluate(f=>scrollTo({top:document.documentElement.scrollHeight*f,behavior:'instant'}),fraction);await p.waitForTimeout(40);}
  await p.waitForTimeout(650);
  const r=await p.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,cls:qa.shifts.reduce((a,b)=>a+b,0),animations:qa.animations,detachedDetails:document.querySelectorAll('.project-details').length,brokenImages:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.currentSrc),hidden:[...document.querySelectorAll('.project-story h2,.project-intro,.project-insight,.project-links')].filter(e=>{for(let n=e;n&&n!==document.body;n=n.parentElement){let s=getComputedStyle(n);if(s.opacity==='0'||s.visibility==='hidden')return true}return false}).map(e=>e.className),clipped:[...document.querySelectorAll('.project-heading h2,.project-links')].filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth+1}).map(e=>e.className)}));
  r.errors=errors;r.restarts=r.animations-animations;r.projects=[];
  for(const el of await p.locator('.project-story').all()){
   const states=[];for(const fraction of[.1,.5,.9]){await el.evaluate((e,f)=>scrollTo({top:e.offsetTop-innerHeight+f*(e.offsetHeight+innerHeight),behavior:'instant'}),fraction);states.push(await el.evaluate(e=>{const a=e.getBoundingClientRect(),i=e.querySelector('img'),r=i.getBoundingClientRect();return {x:r.x-a.x,y:r.y-a.y,w:r.width,h:r.height,transform:getComputedStyle(i).transform};}));}
   const d=await el.evaluate(e=>{const box=s=>e.querySelector(s).getBoundingClientRect();const head=box('.project-heading'),media=box('.project-scene'),info=box('.project-insight'),actions=box('.project-actions');return {id:e.id,height:e.offsetHeight,insideScene:e.querySelector('.project-stage').contains(e.querySelector('.project-insight')),mobileOrder:head.bottom<=media.top+1&&media.bottom<=info.top+1&&info.bottom<=actions.top+1,targets:[...e.querySelectorAll('.project-links a')].every(a=>a.getBoundingClientRect().height>=44)};});
   d.static=states.every(s=>JSON.stringify(s)===JSON.stringify(states[0]));r.projects.push(d);
   if([1440,1280,768,390,320].includes(width))await el.screenshot({path:path.join(out,`${d.id}-${width}.png`)});
  }
  if([1440,1280,768,390,320].includes(width)){await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(out,`projects-${width}.png`),fullPage:true});}
  if(width===1440){await p.addScriptTag({path:'/tmp/portfolio-a11y.nJVQC6/node_modules/axe-core/axe.min.js'});r.axe=await p.evaluate(async()=>(await axe.run(document.querySelector('.editorial-collection'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));}
  report.viewports.push(r);console.log(width,JSON.stringify({overflow:r.overflow,restarts:r.restarts,hidden:r.hidden,clipped:r.clipped,errors,cls:r.cls,invalid:r.projects.filter(x=>!x.static||!x.insideScene||!x.targets||(width<=1100&&!x.mobileOrder))}));await c.close();
 }
 for(const mode of['reduce','no-js']){const c=await b.newContext({viewport:{width:390,height:844},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduce'?'reduce':'no-preference'});const p=await c.newPage();await p.goto(base);await p.locator('#chatra-project').scrollIntoViewIfNeeded();const visible=await p.locator('.project-insight').evaluateAll(es=>es.every(e=>getComputedStyle(e).opacity==='1'&&getComputedStyle(e).visibility==='visible'));report.fallbacks.push({mode,visible});await c.close();}
 await b.close();fs.writeFileSync(out+'/results.json',JSON.stringify(report,null,2));
 assert(Object.values(report.scope).every(Boolean));assert(report.linksPreserved&&report.originalMediaPreserved);
 assert(report.viewports.every(r=>!r.overflow&&!r.restarts&&!r.hidden.length&&!r.clipped.length&&!r.errors.length&&!r.brokenImages.length&&!r.detachedDetails&&r.projects.every(p=>p.static&&p.insideScene&&p.targets&&(r.width>1100||p.mobileOrder))));
 assert(report.fallbacks.every(r=>r.visible));
 console.log('All structural, responsive and motion checks passed.');
})();
