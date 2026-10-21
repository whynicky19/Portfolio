const {chromium}=require('playwright');
const fs=require('fs'), path=require('path'), assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const out='/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/icons-navigation';
const base='http://127.0.0.1:4173/';
const retired=['chatra.html','soyle.html','digital-urpaq.html'];
(async()=>{
 fs.mkdirSync(out,{recursive:true});const b=await chromium.launch(),report={pages:[],redirects:[]};
 for(const width of [1440,390,320])for(const file of ['index.html','projects.html','about.html','contact.html']){
  const c=await b.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),p=await c.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.goto(base+file);
  await p.evaluate(async()=>{await document.fonts.ready;for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
  await p.waitForTimeout(150);
  const r=await p.evaluate(()=>{
   const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),symbols=[];let n;
   while(n=walk.nextNode())if(!n.parentElement.closest('script,style,svg')&&/[↗↙→←×]|\p{Emoji_Presentation}/u.test(n.textContent))symbols.push(n.textContent);
   return {overflow:document.documentElement.scrollWidth>innerWidth,icons:document.querySelectorAll('.ui-icon').length,emptyIcons:[...document.querySelectorAll('.ui-icon')].filter(s=>s.getClientRects().length&&!s.getBBox().width).map(s=>s.outerHTML),symbols,links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')),projects:document.querySelectorAll('.project-story').length};
  });
  r.file=file;r.width=width;r.errors=errors;r.badLinks=[];
  for(const href of r.links){if(/^(https?:|mailto:|tel:)/.test(href))continue;const [pathname,hash]=href.split('#'),target=pathname||file;
   if(retired.includes(target)||!fs.existsSync(path.join(root,target)))r.badLinks.push(href);
   else if(hash&&target.endsWith('.html')&&!fs.readFileSync(path.join(root,target),'utf8').includes('id="'+hash+'"'))r.badLinks.push(href);
  }
  const target=file==='projects.html'?'#chatra-project':file==='contact.html'?'.contact-split':file==='about.html'?'.intro':'.notebook-hero';
  if(width!==320)await p.locator(target).screenshot({path:path.join(out,file.replace('.html','')+'-'+width+'.png')});
  if(width===390){await p.locator('#navBurger').click();assert.equal(await p.locator('#navBurger').getAttribute('aria-expanded'),'true');await p.locator('#navBurger').click();}
  if(width===1440){await p.locator('#themeToggle').click();await p.waitForTimeout(300);await p.locator(target).screenshot({path:path.join(out,file.replace('.html','')+'-dark.png')});}
  report.pages.push(r);console.log(file,width,{icons:r.icons,empty:r.emptyIcons.length,overflow:r.overflow,badLinks:r.badLinks,errors});await c.close();
 }
 for(const javaScriptEnabled of [true,false])for(const [file,id]of [['chatra.html','chatra-project'],['soyle.html','soyle-project'],['digital-urpaq.html','digital-urpaq-project']]){
  const c=await b.newContext({javaScriptEnabled,reducedMotion:'reduce'}),p=await c.newPage();await p.goto(base+file);await p.waitForURL(base+'projects.html#'+id);await p.locator('#'+id+' h2').waitFor();report.redirects.push({file,javaScriptEnabled,url:p.url()});await c.close();
 }
 const c=await b.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'}),p=await c.newPage();
 await p.goto(base+'about.html');await p.locator('.certificate-open').first().click();await p.locator('#certificate-dialog[open]').waitFor();
 await p.locator('.certificate-next').click();await p.locator('.certificate-prev').click();assert(await p.locator('#certificate-dialog .ui-icon').evaluateAll(es=>es.every(e=>e.getBBox().width>0)));await p.screenshot({path:out+'/certificate-dialog-390.png'});await p.locator('.dialog-close').click();assert.equal(await p.locator('#certificate-dialog').getAttribute('open'),null);
 await p.goto(base+'contact.html');await p.route('https://formspree.io/**',route=>route.fulfill({status:503,contentType:'application/json',body:'{}'}));
 await p.locator('#cf-name').fill('Local browser test');await p.locator('#cf-email').fill('test@example.com');await p.locator('#cf-msg').fill('Mocked request: this message is never sent.');await p.locator('#cfSubmit').click();await p.waitForFunction(()=>document.querySelector('#formFeedback').dataset.state==='error');
 report.form={label:await p.locator('#cfSubmitLabel').textContent(),icons:await p.locator('#cfSubmit .ui-icon').count(),network:'intercepted locally; not sent'};
 await p.locator('#cfSubmit').screenshot({path:out+'/contact-retry-button.png'});await c.close();await b.close();
 fs.writeFileSync(out+'/results.json',JSON.stringify(report,null,2));
 assert(report.pages.every(r=>!r.overflow&&!r.emptyIcons.length&&!r.symbols.length&&!r.badLinks.length&&!r.errors.length));
 assert(report.pages.filter(r=>r.file==='projects.html').every(r=>r.projects===10));
 assert.equal(report.form.label,'Send message');assert.equal(report.form.icons,1);
 console.log('Icons, local links, redirects, mobile menu, certificate controls and mocked form recovery passed.');
})();
