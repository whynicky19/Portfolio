/* One-shot editorial entrances below the notebook. The Hero is never selected. */
(() => {
 'use strict';
 const root=document.querySelector('.about-editorial');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 if(!root || reduced.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
 const targets=new Map(), active=new Map();
 const easing='cubic-bezier(.22,.72,.18,1)';
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting) enter(entry.target);
 }),{threshold:0,rootMargin:'0px 0px -32px 0px'});
 function register(element,kind,index=0){
  if(!element || element.closest('.about-notebook')) return;
  element.dataset.aboutMotion=kind;
  // Restored pages and deep links must not hide content already passed.
  if(element.getBoundingClientRect().bottom<0 || location.hash){element.dataset.motionPhase='complete';return;}
  targets.set(element,{kind,index});
  element.dataset.motionPhase='pending';
  observer.observe(element);
 }
 function finish(element){
  observer.unobserve(element);
  element.dataset.motionPhase='complete';
  (active.get(element)||[]).forEach(a=>a.cancel());
  active.delete(element);targets.delete(element);
 }
 function enter(element){
  if(element.dataset.motionPhase!=='pending') return;
  observer.unobserve(element);
  const {kind,index}=targets.get(element);
  element.dataset.motionPhase='running';element.dataset.motionCount='1';
  const animations=[];active.set(element,animations);
  const run=(node,frames,duration=620,delay=0)=>{
   if(node) animations.push(node.animate(frames,{duration,delay,easing,fill:'backwards'}));
  };
  if(kind==='type'){
   element.querySelectorAll('.about-type-line > span').forEach((line,i)=>run(line,
    [{transform:`translate(${i%2?12:-12}%,115%)`},{transform:'translate(0,0)'}],580,i*85));
  }else if(kind==='split'){
   run(element,[{clipPath:'inset(0 50% round 12px)'},{clipPath:'inset(0 0% round 12px)'}],700);
   run(element.querySelector(':scope > div'),[{transform:`translateX(${index%2?-24:24}px)`},{transform:'translateX(0)'}],540,100);
  }else if(kind==='diagonal'){
   const reverse=index%2;
   run(element,[
    {clipPath:reverse?'polygon(100% 0,100% 0,100% 100%,100% 100%)':'polygon(0 0,0 0,0 100%,0 100%)'},
    {clipPath:reverse?'polygon(0 0,100% 0,100% 100%,24% 100%)':'polygon(0 0,100% 0,76% 100%,0 100%)',offset:.72},
    {clipPath:'polygon(0 0,100% 0,100% 100%,0 100%)'}],660);
  }else if(kind==='chapter'){
   run(element.querySelector('.road-trace'),[{transform:'scaleY(0)'},{transform:'scaleY(1)'}],700);
   run(element.querySelector('.road-date'),[{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0 0)'}],380);
   run(element.querySelector('article'),[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}],620,100);
  }else if(kind==='paper'){
   run(element,[{clipPath:'inset(100% 0 0)',transform:`translateY(20px) rotate(${index%2?1.5:-1.5}deg)`},
    {clipPath:'inset(0% 0 0)',transform:'translateY(0) rotate(0deg)'}],650);
  }
  Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(()=>finish(element));
 }
 // Preserve real text, inline emphasis and original line breaks, without clones.
 root.querySelectorAll('main section h2').forEach(heading=>{
  if(!heading.querySelector('br')) return;
  const groups=[[]];
  [...heading.childNodes].forEach(node=>node.nodeName==='BR'?groups.push([]):groups.at(-1).push(node));
  const fragment=document.createDocumentFragment();
  groups.forEach((nodes,i)=>{
   const mask=document.createElement('span'),line=document.createElement('span');
   mask.className='about-type-line';nodes.forEach(node=>line.append(node));mask.append(line);fragment.append(mask);
   if(i<groups.length-1) fragment.append(document.createTextNode(' '));
  });
  heading.replaceChildren(fragment);register(heading,'type');
 });
 root.querySelectorAll('.skills-grid > .photo-card').forEach((card,i)=>register(card,'split',i));
 root.querySelectorAll('.process .photo-card,.beyond .photo-card').forEach((card,i)=>register(card,'diagonal',i));
 root.querySelectorAll('.road > li').forEach(row=>{
  const trace=document.createElement('span');trace.className='road-trace';trace.setAttribute('aria-hidden','true');row.append(trace);register(row,'chapter');
 });
 root.querySelectorAll('.certificate-card').forEach((card,i)=>register(card,'paper',i));
 // Focus, reduced motion and BFCache restore always expose the real content.
 document.addEventListener('focusin',event=>{
  for(const element of targets.keys()) if(element.contains(event.target)) finish(element);
 });
 function finishAll(){[...targets.keys()].forEach(finish);observer.disconnect();}
 reduced.addEventListener('change',()=>{if(reduced.matches) finishAll();});
 addEventListener('pagehide',finishAll,{once:true});
})();
