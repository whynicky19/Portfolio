const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const out = '/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/home-stack';
fs.mkdirSync(out, { recursive:true });
(async () => {
  const browser = await chromium.launch({ headless:true });
  const results = [];
  for (const width of [1440,1280,768,390,320]) {
    const page = await browser.newPage({ viewport:{ width,height:1000 }, deviceScaleFactor:1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/index.html', { waitUntil:'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const stack = page.locator('.home-stack');
    await stack.scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await stack.screenshot({ path:path.join(out,`stack-${width}.png`) });
    const state = await stack.evaluate(el => ({
      height:el.offsetHeight,
      overflow:document.documentElement.scrollWidth > innerWidth,
      missing:[...el.querySelectorAll('img')].filter(i => !i.complete || !i.naturalWidth).map(i => i.src),
      font:getComputedStyle(el.querySelector('h2')).fontFamily,
      titleColor:getComputedStyle(el.querySelector('h2')).color,
      labels:[...el.querySelectorAll('li')].map(i => i.textContent.trim()),
      childOverflow:[...el.querySelectorAll('.stack-shell *')].filter(e => {const r=e.getBoundingClientRect();return r.left < 0 || r.right > innerWidth + 1;}).map(e => e.className),
    }));
    assert.equal(state.overflow,false);
    assert.equal(state.missing.length,0);
    assert.equal(state.childOverflow.length,0);
    assert.equal(state.labels.length,13);
    assert.equal(errors.length,0);
    const motion = [];
    for (const progress of [.2,.5,.8]) {
      await stack.evaluate((el,p) => scrollTo(0,el.offsetTop-innerHeight+p*(innerHeight+el.offsetHeight)), progress);
      await page.waitForTimeout(150);
      motion.push(await stack.evaluate(el => ({
        y:scrollY, sky:getComputedStyle(el.querySelector('.stack-sky')).transform,
        logo:getComputedStyle(el.querySelector('.stack-primary img')).transform,
        title:getComputedStyle(el.querySelector('h2')).transform,
      })));
      if (width===1440) await page.screenshot({path:path.join(out,`parallax-${progress}.png`)});
    }
    assert.notEqual(motion[0].sky,motion[2].sky);
    assert(motion.every(m=>m.logo==='none' && m.title==='none'));
    await page.emulateMedia({ reducedMotion:'reduce' });
    await stack.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    const reduced = await stack.evaluate(el => ({sky:getComputedStyle(el.querySelector('.stack-sky')).transform, animations:el.getAnimations({subtree:true}).length}));
    assert.equal(reduced.sky,'none');
    assert.equal(reduced.animations,0);
    results.push({width,...state,motion,reduced,errors});
    await page.close();
    console.log(`PASS ${width}`);
  }
  const original=fs.readFileSync('/tmp/portfolio-stack-baseline/index.html','utf8');
  const current=fs.readFileSync('index.html','utf8');
  const strip=s=>s.replace(/    <section class="h-toolkit[\s\S]*?(?=    <section class="h-contact")/,'').replace(/^.*(?:home-stack\.css|home-stack\.js).*\n/gm,'');
  assert.equal(strip(original),strip(current),'Home outside MY STACK changed');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
