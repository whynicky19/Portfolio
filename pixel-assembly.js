/* Pixel Assembly: glyph-exact, deterministic fragments; real DOM text is never replaced. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const entrance = window.portfolioEntrance;
  const active = new Set();
  const uiAnimations = [];
  let heroFrame = 0, frameSVG, heroMask, contactMask, contactObserver;
  let finished = !entrance;
  const ease = n => 1 - Math.pow(1 - Math.max(0,Math.min(1,n)),3);
  const hash = (x,y) => ((x * 73 + y * 151 + x * y * 19) % 997) / 997;

  function fragments(element) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const dpr = Math.max(2,Math.min(devicePixelRatio || 1,3));
    const width = Math.ceil(rect.width * dpr), height = Math.ceil(rect.height * dpr);
    const scaleX=width/rect.width, scaleY=height/rect.height;
    if (!width || !height) throw new Error('Empty text bounds');
    const source = document.createElement('canvas');
    source.width = width; source.height = height;
    const ink = source.getContext('2d', {willReadFrequently:true});
    if (!ink) throw new Error('Canvas unavailable');
    ink.scale(scaleX,scaleY);
    ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ink.fillStyle = style.color;
    ink.textBaseline = 'alphabetic';
    // DOM ranges supply the exact positions, including tracking, alignment and line breaks.
    // No alternate glyph outlines or guessed letter spacing are used.
    const walker = document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
    let node;
    const glyphs=[];
    while ((node = walker.nextNode())) {
      // A zero-size inline marker measures the actual browser baseline. Font metric
      // rounding alone differs by a subpixel between Canvas and DOM in some engines.
      const marker=document.createElement('span');
      marker.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline;font-size:0;line-height:0';
      node.before(marker);
      const baseline=marker.getBoundingClientRect().top-rect.top;
      marker.remove();
      for (let i=0; i<node.length; i++) {
        const glyph = node.data[i];
        if (/\s/.test(glyph)) continue;
        const range = document.createRange();
        range.setStart(node,i); range.setEnd(node,i+1);
        const box = range.getBoundingClientRect();
        const metrics = ink.measureText(glyph);
        const x=box.left-rect.left;
        ink.fillText(glyph,x,baseline);
        glyphs.push({left:(x-metrics.actualBoundingBoxLeft)*scaleX,top:(baseline-metrics.actualBoundingBoxAscent)*scaleY,
          right:(x+metrics.actualBoundingBoxRight)*scaleX,bottom:(baseline+metrics.actualBoundingBoxDescent)*scaleY});
      }
    }
    const pixels = ink.getImageData(0,0,width,height).data;
    // Silkscreen's design grid is 1/8 em. Partition each glyph on that grid,
    // rather than slicing stems into arbitrary slivers across the whole word.
    const cell = parseFloat(style.fontSize) / 8 * scaleX;
    const cellY = parseFloat(style.fontSize) / 8 * scaleY;
    const tiles = [];
    glyphs.forEach((glyph,letter)=>{
      const cols=Math.max(1,Math.round((glyph.right-glyph.left)/cell));
      const rows=Math.max(1,Math.round((glyph.bottom-glyph.top)/cellY));
      for(let row=0;row<rows;row++) for(let col=0;col<cols;col++) {
        const x=Math.max(0,col===0?Math.floor(glyph.left):Math.round(glyph.left+col*cell));
        const y=Math.max(0,row===0?Math.floor(glyph.top):Math.round(glyph.top+row*cellY));
        const right=Math.min(width,col===cols-1?Math.ceil(glyph.right):Math.round(glyph.left+(col+1)*cell));
        const bottom=Math.min(height,row===rows-1?Math.ceil(glyph.bottom):Math.round(glyph.top+(row+1)*cellY));
        const w=right-x,h=bottom-y;
        let coverage=0;
        for(let yy=y;yy<bottom;yy++) for(let xx=x;xx<right;xx++) coverage+=pixels[(yy*width+xx)*4+3];
        // Discard antialias-only fringes, not intentional ink cells.
        if(coverage>w*h*255*.12) tiles.push({x,y,w,h,col,row,letter,rank:hash(col+letter*7,row),
          dx:((col+letter)%3-1)*cell,dy:((row+letter)%3-1)*cell});
      }
    });
    const canvas = document.createElement('canvas');
    canvas.width=width; canvas.height=height;
    canvas.className='pixel-fragment-canvas'; canvas.setAttribute('aria-hidden','true');
    const ctx=canvas.getContext('2d');
    if(!ctx) throw new Error('Canvas unavailable');
    ctx.imageSmoothingEnabled=false;
    element.append(canvas);
    const mask = {
      element, canvas, tiles,
      draw(time, short=false) {
        ctx.clearRect(0,0,width,height);
        // Hold the complete, full-resolution glyph mask before handing back to DOM text.
        if(time>=(short?610:1450)) {ctx.drawImage(source,0,0);return;}
        tiles.forEach((tile,i)=>{
          // Eight quiet seed fragments; then a diagonal, deterministic field of arrivals.
          const seed = i===0 || tiles[i-1].letter!==tile.letter;
          const start = short ? tile.rank*320+tile.row*12 : seed ? 80+tile.rank*260 : 450+tile.letter*60+tile.rank*240;
          const duration = short ? 220 : 300;
          if(time<start) return;
          const p=ease((time-start)/duration);
          const dx=Math.round(tile.dx*(1-p)),dy=Math.round(tile.dy*(1-p));
          ctx.drawImage(source,tile.x,tile.y,tile.w,tile.h,tile.x+dx,tile.y+dy,tile.w,tile.h);
        });
      },
      remove() { canvas.remove(); element.classList.remove('pixel-fragments-active'); active.delete(mask); }
    };
    active.add(mask);
    return mask;
  }

  function finish(reason='complete') {
    if(finished) return;
    finished=true; cancelAnimationFrame(heroFrame); clearTimeout(entrance?.timer);
    heroMask?.remove(); frameSVG?.remove();
    root.classList.remove('assembly-intro','assembly-name-done','assembly-frame-done');
    uiAnimations.forEach(a=>a.cancel());
    root.dataset.assemblyState=reason;
  }
  function animateUI(selector, delay, duration, y=0, from=0) {
    document.querySelectorAll(selector).forEach(el=>{
      const animation=el.animate([{opacity:from,translate:`0 ${y}px`},{opacity:1,translate:'0 0'}],
        {duration,delay:delay-(performance.now()-entrance.start),easing:'cubic-bezier(.2,.75,.25,1)',fill:'both'});
      uiAnimations.push(animation);
    });
  }
  async function startHero() {
    if(!entrance) {root.dataset.assemblyState='skipped';return;}
    try {
      const loaded=await Promise.race([document.fonts.load('700 100px Silkscreen'),new Promise(r=>setTimeout(()=>r([]),600))]);
      if(finished) return;
      if(!loaded.length||reduced.matches||!root.classList.contains('assembly-intro')) {finish('skipped');return;}
      heroMask=fragments(document.querySelector('.pixel-name'));
      const board=document.querySelector('.identity-board');
      const svgNS='http://www.w3.org/2000/svg';
      frameSVG=document.createElementNS(svgNS,'svg');frameSVG.classList.add('assembly-frame');frameSVG.setAttribute('aria-hidden','true');
      const line=document.createElementNS(svgNS,'rect');
      line.setAttribute('x','.75');line.setAttribute('y','.75');line.setAttribute('width',board.offsetWidth-1.5);line.setAttribute('height',board.offsetHeight-1.5);
      line.setAttribute('fill','none');line.setAttribute('stroke','#c7542f');line.setAttribute('stroke-width','1.5');line.setAttribute('pathLength','1');line.setAttribute('stroke-dasharray','1');
      frameSVG.append(line);board.append(frameSVG);
      // Start the visual clock only once the real font and fragment geometry
      // exist. Network/font delay must not consume the assembly before paint.
      clearTimeout(entrance.timer);
      entrance.start=performance.now();
      entrance.timer=setTimeout(()=>finish('fallback'),3400);
      root.dataset.assemblyCount='1';
      heroMask.draw(0);
      uiAnimations.push(line.animate([{strokeDashoffset:1},{strokeDashoffset:0}],{duration:500,delay:1500-(performance.now()-entrance.start),fill:'both',easing:'cubic-bezier(.2,.75,.25,1)'}));
      ['.note-mint','.note-yellow','.note-peach','.note-blue'].forEach((s,i)=>animateUI(s,1500+i*65,300,8));
      animateUI('.notebook-intro',1800,300,0);
      animateUI('.notebook-statement',2050,450,10);
      animateUI('.notebook-description',2140,410,6);
      animateUI('.notebook-actions',2220,400,6);
      animateUI('.notebook-colophon',2300,350,0);
      animateUI('.apple-nav',2050,500,0,.18);
      root.dataset.assemblyState='running';root.dataset.assemblyStart=String(entrance.start);
      function tick(now) {
        if(finished) return;
        const elapsed=now-entrance.start;
        try {
          if(elapsed<1500) heroMask.draw(elapsed);
          else if(!root.classList.contains('assembly-name-done')) {root.classList.add('assembly-name-done');heroMask.remove();}
          if(elapsed>=2000&&!root.classList.contains('assembly-frame-done')) {root.classList.add('assembly-frame-done');frameSVG.remove();}
          if(elapsed>=2650) {finish();return;}
          heroFrame=requestAnimationFrame(tick);
        } catch (_) {finish('fallback');}
      }
      heroFrame=requestAnimationFrame(tick);
    } catch (_) {finish('fallback');}
  }

  async function prepareContact() {
    // Unlike the load-time Hero, this word is already visible when its scroll
    // observer runs. Keep the real text in place during mobile swipes.
    const mobile = matchMedia('(max-width:800px), (pointer:coarse)');
    if (mobile.matches) return;
    if(reduced.matches||!('IntersectionObserver' in window)) return;
    const word=document.querySelector('.contact-word');
    if(!word) return;
    try {
      await document.fonts.load('700 100px Silkscreen');
      if(reduced.matches || mobile.matches) return;
      contactObserver=new IntersectionObserver(entries=>{
        if(!entries.some(e=>e.isIntersecting)) return;
        contactObserver.disconnect();
        if(reduced.matches || mobile.matches) return;
        try {
          contactMask=fragments(word);word.classList.add('pixel-fragments-active');
          word.dataset.assemblyState='running';const start=performance.now();
          function tick(now) {
            if(!contactMask||reduced.matches||mobile.matches) {contactMask?.remove();contactMask=null;word.dataset.assemblyState='skipped';return;}
            try {
              const elapsed=now-start;
              if(elapsed>=650) {contactMask.remove();contactMask=null;word.dataset.assemblyState='complete';return;}
              contactMask.draw(elapsed,true);requestAnimationFrame(tick);
            } catch (_) {contactMask?.remove();contactMask=null;word.dataset.assemblyState='fallback';}
          }
          requestAnimationFrame(tick);
        } catch (_) {contactMask?.remove();}
      },{threshold:.08});
      contactObserver.observe(word);
    } catch (_) { /* Static text is the fallback. */ }
  }
  // Native scrolling (wheel, touch and keyboard) never owns the entrance clock.
  // Mobile browser chrome can resize the viewport while scrolling; only a real
  // width change invalidates the glyph geometry captured by the canvas.
  let glyphViewportWidth=innerWidth;
  addEventListener('resize',()=>{
    if(innerWidth===glyphViewportWidth)return;
    glyphViewportWidth=innerWidth;
    finish('resized');contactMask?.remove();contactMask=null;
  });
  addEventListener('pagehide',()=>{finish('navigation');active.forEach(m=>m.remove());contactMask=null;});
  reduced.addEventListener('change',()=>{if(reduced.matches){finish('reduced');active.forEach(m=>m.remove());contactMask=null;contactObserver?.disconnect();}});
  startHero();prepareContact();
})();
