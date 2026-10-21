const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const out = '/Users/whynicky/.codex/visualizations/2026/10/20/01a15a07-2edc-7470-a0fd-e9178a7fb6a1/device-clip-fix';
(async () => {
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch();
  const report = [];
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, recordVideo: { dir: out, size: { width, height: 900 } } });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/projects.html');
    await page.evaluate(async () => { for (const i of document.images) i.loading = 'eager'; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
    await page.waitForTimeout(1700);
    const timing = await page.evaluate(async () => {
      const first = document.querySelector('.scene-chatra');
      const end = first.offsetTop + first.offsetHeight - innerHeight * .65;
      const start = performance.now(), frames = []; let previous = start;
      await new Promise(resolve => { function tick(now) {
        frames.push(now - previous); previous = now;
        const p = Math.min(1, (now - start) / 16000);
        scrollTo({ top: end * p, behavior: 'instant' });
        if (p < 1) requestAnimationFrame(tick); else resolve();
      } requestAnimationFrame(tick); });
      return { frames: frames.length, mean: frames.reduce((a,b) => a+b,0)/frames.length, over50ms: frames.filter(n => n > 50).length };
    });
    await page.waitForTimeout(600);
    const video = page.video(); await context.close(); await video.saveAs(`${out}/gallery-entry-${width}.webm`);
    const p = await browser.newPage({ viewport: { width, height: 900 } });
    await p.goto('http://127.0.0.1:4173/projects.html'); await p.waitForTimeout(1800);
    const samples = [];
    for (const progress of [0, .35, .7, 1, .35]) {
      await p.evaluate(t => scrollTo({ top: document.querySelector('.scene-chatra').offsetTop - innerHeight * (.98 - .65*t), behavior: 'instant' }), progress);
      await p.waitForTimeout(120);
      const values = await p.locator('.scene-chatra').evaluate(e => ({ open: e.style.getPropertyValue('--gallery-open'), left: getComputedStyle(e,'::before').transform, right: getComputedStyle(e,'::after').transform, mediaMask: getComputedStyle(e.querySelector('.project-scene')).clipPath }));
      assert.equal(values.mediaMask, 'none', 'Mockups must not have an independent clipping mask');
      samples.push({ progress, ...values });
      await p.screenshot({ path: `${out}/entry-${width}-${progress}.png` });
    }
    assert(Number(samples[3].open) > .99); assert(Math.abs(Number(samples[1].open)-Number(samples[4].open)) < .002);
    await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForTimeout(100);
    assert.equal(await p.locator('.scene-chatra').evaluate(e => getComputedStyle(e,'::before').display), 'none');
    assert.equal(await p.locator('.scene-chatra .project-scene').evaluate(e => getComputedStyle(e).clipPath), 'none');
    await p.screenshot({ path: `${out}/entry-reduced-${width}.png` });
    report.push({ width, timing, samples, reducedMotion: 'shutters hidden; media unclipped', reversible: true });
    await p.close();
  }
  await fs.writeFile(`${out}/entry-motion.json`, JSON.stringify(report,null,2));
  await browser.close(); console.log(JSON.stringify(report));
})().catch(e => { console.error(e); process.exit(1); });
