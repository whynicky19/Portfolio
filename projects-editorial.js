/* Projects only: native scroll, stationary links, separate entrance and depth layers. */
(() => {
  'use strict';
  const hero = document.querySelector('.projects-hero');
  if (!hero) return;
  const title = hero.querySelector('h1');
  const recent = document.querySelector('.recent-work');
  const stories = [...document.querySelectorAll('.project-story')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const geometry = new Map(), values = new WeakMap();
  let frame = 0, dirty = true, revealFrame = 0, stopped = false;
  const clamp = n => Math.min(1,Math.max(0,n));
  const px = n => `${n.toFixed(2)}px`;
  function set(el,key,value) {
    let old=values.get(el);if(!old)values.set(el,old=new Map());
    if(old.get(key)===value)return;
    el.style.setProperty(key,value);old.set(key,value);
  }
  function measure(el) {
    let top=0;for(let e=el;e;e=e.offsetParent)top+=e.offsetTop;
    geometry.set(el,{top,height:el.offsetHeight});
  }
  function paint() {
    frame=0;
    if(dirty){[hero,...stories].forEach(measure);dirty=false;}
    const mobile=innerWidth<=800?.55:1;
    const h=geometry.get(hero), progress=reduced.matches?0:clamp((scrollY-h.top)/h.height);
    set(hero,'--sky-y',px(progress*110*mobile));
    set(hero,'--title-y',px(progress*48*mobile));
    stories.forEach((story,i)=>{
      const r=geometry.get(story),top=r.top-scrollY;
      if(!reduced.matches&&(top>innerHeight+100||top+r.height<-100))return;
      const p=reduced.matches?.5:clamp((innerHeight-top)/(innerHeight+r.height));
      set(story,'--back-y',px((p-.5)*48*mobile));
      set(story,'--screen-y',px((p-.5)*-72*mobile));
      set(story,'--screen-x',px((p-.5)*(i%2?-12:12)*mobile));
    });
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
  function resize(){dirty=true;schedule();}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',resize,{passive:true});
  if('ResizeObserver'in window)new ResizeObserver(resize).observe(document.querySelector('main'));
  document.fonts?.ready.then(resize);
  paint();

  // Discrete pixel rows reveal the live HTML glyphs, rather than assembling a raster copy.
  function finishReveal(){stopped=true;cancelAnimationFrame(revealFrame);title.style.removeProperty('clip-path');title.style.removeProperty('translate');hero.dataset.reveal='complete';}
  async function reveal(){
    if(reduced.matches||scrollY>24||location.hash){finishReveal();return;}
    title.style.clipPath='inset(100% 0 0)';
    const safety=setTimeout(finishReveal,2100);
    try {
      await Promise.race([document.fonts.load('700 100px Silkscreen'),new Promise(r=>setTimeout(r,450))]);
      if(stopped)return;
      const start=performance.now();hero.dataset.reveal='running';
      function tick(now){
        if(stopped)return;
        const t=(now-start)/1500;
        if(t>=1){clearTimeout(safety);finishReveal();return;}
        const points=[];
        for(let x=0;x<8;x++){
          const delay=(x/7)*.2;
          const p=clamp((t-delay)/.68),row=1-Math.floor(p*8)/8;
          points.push(`${x/8*100}% ${row*100}%`,`${(x+1)/8*100}% ${row*100}%`);
        }
        title.style.clipPath=`polygon(${points.join(',')},100% 100%,0% 100%)`;
        title.style.translate=`0 ${((1-clamp(t/.85))*8).toFixed(2)}px`;
        revealFrame=requestAnimationFrame(tick);
      }
      revealFrame=requestAnimationFrame(tick);
    }catch(_){clearTimeout(safety);finishReveal();}
  }
  reveal();
  addEventListener('scroll',()=>{if(scrollY>24&&!stopped)finishReveal();},{passive:true});
  addEventListener('keydown',finishReveal,{once:true});
  addEventListener('pointerdown',finishReveal,{once:true,passive:true});
  addEventListener('resize',finishReveal,{once:true});
  const reveals=[];
  reduced.addEventListener('change',()=>{if(reduced.matches){finishReveal();reveals.forEach(a=>a.cancel());}schedule();});
  if('IntersectionObserver'in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      if(!reduced.matches){
        for(const [i,el]of [...recent.children].entries())reveals.push(el.animate([{opacity:.25,translate:'0 20px'},{opacity:1,translate:'0 0'}],{duration:600,delay:i*100,easing:'cubic-bezier(.2,.7,.2,1)'}));
      }
      observer.unobserve(entry.target);
    }),{threshold:.25});observer.observe(recent);
  }
})();
