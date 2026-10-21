const {chromium}=require('playwright');const fs=require('node:fs/promises');const assert=require('node:assert/strict');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/product-showcase';const origin='http://127.0.0.1:4173/';
(async()=>{await fs.mkdir(out,{recursive:true});const b=await chromium.launch(),report=[];const baseline=JSON.parse(await fs.readFile(require('node:path').join(__dirname,'fixtures/projects-showcase-baseline.json'),'utf8'));
 for(const width of [1440,1280,1024,768,430,390,320]){
  const p=await b.newPage({viewport:{width,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(origin+'projects.html');await p.waitForTimeout(2100);
  await p.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
  assert.equal(await p.locator('.project-story').count(),10);assert(await p.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)));
  const unchanged=await p.evaluate(base=>{const parser=new DOMParser();const recent=parser.parseFromString(base.recent,'text/html').body.firstChild;return{recent:recent.innerHTML===document.querySelector('.recent-work').innerHTML,hero:parser.parseFromString(base.hero,'text/html').body.firstChild.innerHTML===document.querySelector('.projects-hero').innerHTML,content:[...document.querySelectorAll('.project-story')].every((s,i)=>s.id===base.stories[i].id&&(s.id==='portfolio'||s.querySelector('.project-description').textContent===base.stories[i].description)&&JSON.stringify([...s.querySelectorAll('a')].map(a=>a.getAttribute('href')))===JSON.stringify(base.stories[i].links))}},baseline);assert(unchanged.recent&&unchanged.hero&&unchanged.content);
  assert.equal(await p.locator('.project-index').evaluateAll(es=>es.some(e=>/^\d/.test(e.textContent))),false);
  if(width>800)assert.equal(await p.locator('.projects-hero').evaluate(e=>e.offsetHeight),810);
  const title=await p.locator('.projects-hero h1').boundingBox();assert(Math.abs(title.x+title.width/2-width/2)<1);
  const scenes=[];
  for(const story of await p.locator('.project-story').all()){
   const id=await story.getAttribute('id'),card=story.locator('.project-scene'),y=await card.evaluate(e=>e.getBoundingClientRect().top+scrollY);const snapshots=[];
   const measure=()=>card.evaluate(e=>{const c=e.getBoundingClientRect();return [...e.querySelectorAll('.scene-depth img')].map(i=>{const r=i.getBoundingClientRect();return[r.x-c.x,r.y-c.y,r.width,r.height]})});
   for(const offset of [500,220,0]){await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.max(0,y-offset));await p.waitForTimeout(100);snapshots.push(await measure());}
   await card.hover();await p.waitForTimeout(250);snapshots.push(await measure());const delta=Math.max(...snapshots.flatMap(s=>s.flatMap((r,j)=>r.map((n,k)=>Math.abs(n-snapshots[0][j][k])))));assert(delta<.01,id+' media moved '+delta);
   assert(snapshots[0].every(r=>r[2]>45&&r[3]>70),id+' collapsed screenshot');
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(width===1440||width===390){await story.scrollIntoViewIfNeeded();await p.waitForTimeout(650);await story.screenshot({path:`${out}/${id}-${width}.png`});}
   scenes.push({id,delta});
  }
  await p.addScriptTag({path:'/tmp/portfolio-a11y.nJVQC6/node_modules/axe-core/axe.min.js'});const violations=await p.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));assert.equal(violations.length,0,JSON.stringify(violations));
  await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>scrollTo(0,1800));await p.waitForTimeout(100);assert.equal(await p.locator('.scene-background').first().evaluate(e=>getComputedStyle(e).transform),'none');assert.equal(await p.locator('.story-environment').first().evaluate(e=>getComputedStyle(e,'::after').transform),'none');
  await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(500);if(width===1440||width===390)await p.screenshot({path:`${out}/full-${width}.png`,fullPage:true});
  if(width<=768){await p.locator('#navBurger').click();assert.equal(await p.locator('#navBurger').getAttribute('aria-expanded'),'true');await p.keyboard.press('Escape');}
  assert.equal(errors.length,0);report.push({width,unchanged,scenes,violations,errors});await p.close();console.log('PASS',width);
 }
 const ctx=await b.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),p=await ctx.newPage();await p.goto(origin+'projects.html');assert(await p.locator('#chatra-project h2').isVisible());assert(await p.locator('.recent-line').first().isVisible());await ctx.close();
 await fs.writeFile(out+'/results.json',JSON.stringify(report,null,2));await b.close();console.log('ALL PASS');
})().catch(e=>{console.error(e);process.exit(1)});
