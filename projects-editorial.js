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
    if(dirty){[hero,recent,...stories].forEach(measure);dirty=false;}
    const mobile=innerWidth<=800?.7:1;
    const h=geometry.get(hero), progress=reduced.matches?0:clamp((scrollY-h.top)/h.height);
    set(hero,'--sky-y',px(progress*h.height*.62));
    set(hero,'--light-x',px(-progress*innerWidth*.18));
    set(hero,'--light-y',px(progress*h.height*.25));
    set(hero,'--title-y',px(progress*h.height*.3));
    set(hero,'--title-alpha',(1-clamp((progress-.48)/.4)).toFixed(3));
    set(hero,'--paper-mix',clamp((progress-.25)/.75).toFixed(3));
    const r=geometry.get(recent),top=r.top-scrollY;
    const editorial=reduced.matches?1:clamp((innerHeight*.94-top)/(innerHeight*.48));
    set(recent,'--paper-rise',px((1-editorial)*72*mobile));
    set(recent,'--recent-one',clamp(editorial/ .78).toFixed(4));
    set(recent,'--recent-two',clamp((editorial-.16)/.84).toFixed(4));
    set(recent,'--recent-copy',clamp((editorial-.4)/.6).toFixed(4));
    // One scene-level aperture reveals background and hardware together.
    // No independent media mask: it produced a second, disconnected cut edge.
    if(stories[0]){
      const entryTop=geometry.get(stories[0]).top-scrollY;
      const opening=reduced.matches?1:clamp((innerHeight*.98-entryTop)/(innerHeight*.65));
      const smooth=t=>t*t*(3-2*t);
      set(stories[0],'--gallery-open',smooth(opening).toFixed(4));
      set(stories[0],'--copy-open',clamp((opening-.08)/.55).toFixed(4));
      set(stories[0],'--actions-open',clamp((opening-.2)/.7).toFixed(4));
    }
    stories.forEach(story=>{
      const r=geometry.get(story),top=r.top-scrollY;
      if(!reduced.matches&&(top>innerHeight+100||top+r.height<-100))return;
      const p=reduced.matches?.5:clamp((innerHeight-top)/(innerHeight+r.height));
      set(story,'--back-y',px((p-.5)*180*mobile));
      set(story,'--atmosphere-x',`${((p-.5)*42*mobile).toFixed(2)}%`);
      set(story,'--atmosphere-y',px((p-.5)*-140*mobile));
    });
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
  function resize(){dirty=true;schedule();}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',resize,{passive:true});
  if('ResizeObserver'in window)new ResizeObserver(resize).observe(document.querySelector('main'));
  document.fonts?.ready.then(resize);
  paint();
  document.body.classList.add('gallery-ready');

  // Discrete pixel rows reveal the live HTML glyphs, rather than assembling a raster copy.
  function finishReveal(){stopped=true;cancelAnimationFrame(revealFrame);title.style.removeProperty('clip-path');title.style.removeProperty('translate');hero.dataset.reveal='complete';}
  async function reveal(){
    if(reduced.matches||location.hash){finishReveal();return;}
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
  addEventListener('resize',finishReveal,{once:true});
  const reveals=[];
  reduced.addEventListener('change',()=>{if(reduced.matches){finishReveal();reveals.forEach(a=>a.cancel());}schedule();});
  if('IntersectionObserver'in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      if(!reduced.matches){
          const copy=entry.target;
          // Pixel-row mask on live type; all glyphs keep their original geometry.
          reveals.push(copy.querySelector('h2').animate([{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:420,easing:'steps(7,end)'}));
          // Copy reveals independently of static hardware and the moving environment.
          copy.querySelectorAll('.project-deck,.project-description,.project-role,.project-stack').forEach((el,i)=>reveals.push(el.animate([{clipPath:'inset(0 100% 0 0)',opacity:.6},{clipPath:'inset(0 0 0 0)',opacity:1}],{duration:480,delay:Math.min(i*60,150),easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'})));
      }
      observer.unobserve(entry.target);
    }),{threshold:.2});stories.slice(1).forEach(s=>observer.observe(s.querySelector('.project-copy')));
  }
})();
