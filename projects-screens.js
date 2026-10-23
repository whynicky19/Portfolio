/* Render authentic source pixels directly, avoiding compressed, pre-warped UI.
   Photographic scenes remain the no-JavaScript fallback. */
(async () => {
  'use strict';
  const response = await fetch('assets/projects/unified/live-screens.json');
  if (!response.ok) return;
  const manifest = await response.json();
  const records = [];
  // Solve the eight projective coefficients mapping a rectangle to four corners.
  function projection(width, height, quad) {
    const corners = [[0,0],[width,0],[width,height],[0,height]];
    const matrix = [];
    corners.forEach(([x,y], i) => {
      const [u,v] = quad[i];
      matrix.push([x,y,1,0,0,0,-u*x,-u*y,u]);
      matrix.push([0,0,0,x,y,1,-v*x,-v*y,v]);
    });
    for (let col=0; col<8; col++) {
      let pivot=col;
      for (let row=col+1;row<8;row++) if (Math.abs(matrix[row][col])>Math.abs(matrix[pivot][col])) pivot=row;
      [matrix[col],matrix[pivot]]=[matrix[pivot],matrix[col]];
      const divisor=matrix[col][col];
      if (Math.abs(divisor)<1e-12) throw new Error('Invalid screen geometry');
      for (let j=col;j<9;j++) matrix[col][j]/=divisor;
      for (let row=0;row<8;row++) if(row!==col) {
        const factor=matrix[row][col];
        for(let j=col;j<9;j++) matrix[row][j]-=factor*matrix[col][j];
      }
    }
    const [a,b,c,d,e,f,g,h]=matrix.map(row=>row[8]);
    return `matrix3d(${[a,d,0,g,b,e,0,h,0,0,1,0,c,f,0,1].join(',')})`;
  }
  function position(value) {
    if (value==='left'||value==='top') return 0;
    if (value==='right'||value==='bottom') return 1;
    if (value==='center') return .5;
    return parseFloat(value)/100;
  }
  document.querySelectorAll('[data-screen-scene]').forEach(article => {
    const variants=manifest[article.dataset.screenScene];
    if (!variants) return;
    const scene=article.querySelector('.project-scene');
    const photo=scene.querySelector('.unified-showcase');
    const layer=document.createElement('span');
    layer.className='project-live-screens';
    layer.setAttribute('aria-hidden','true');
    scene.append(layer);
    records.push({article,scene,photo,layer,variants,variant:null,active:false});
  });
  let frame=0;
  function update() {
    frame=0;
    const measurements=records.filter(record=>record.active).map(record=> {
      const {article,photo,variants}=record;
      const variant=innerWidth>=1280 ? (article.classList.contains('scene-left')&&variants.left?'left':'wide') : 'square';
      const scene=variants[variant];
      const [sw,sh]=scene.size;
      const style=getComputedStyle(photo);
      const w=photo.clientWidth,h=photo.clientHeight;
      const scale=style.objectFit==='contain'?Math.min(w/sw,h/sh):Math.max(w/sw,h/sh);
      const [px,py]=style.objectPosition.split(' ');
      return {record,variant,scene,scale,x:(w-sw*scale)*position(px),y:(h-sh*scale)*position(py||'50%')};
    });
    measurements.forEach(({record,variant,scene,scale,x,y})=> {
      if (record.variant!==variant) {
        record.layer.replaceChildren();
        record.planes=scene.screens.map(screen=> {
          const plane=document.createElement('span');
          plane.className='project-screen-plane'+(screen.phone?' phone-screen':'');
          const image=new Image();
          image.alt='';image.decoding='async';image.loading='lazy';image.src=screen.source;
          image.style.objectFit=screen.fit||'contain';
          image.style.objectPosition=screen.position||'center';
          image.addEventListener('load',()=>{if(record.photo.complete&&record.photo.naturalWidth)plane.classList.add('screen-ready');},{once:true});
          plane.append(image);record.layer.append(plane);
          return plane;
        });
        record.variant=variant;
      }
      scene.screens.forEach((screen,i)=> {
        const [cw,ch]=screen.canvas;
        const quad=screen.quad.map(([qx,qy])=>[qx*scale+x,qy*scale+y]);
        const plane=record.planes[i];
        plane.style.width=cw+'px';plane.style.height=ch+'px';
        plane.style.transform=projection(cw,ch,quad);
      });
    });
  }
  function schedule() {if (!frame) frame=requestAnimationFrame(update);}
  const observer=new ResizeObserver(schedule);
  records.forEach(record=>{observer.observe(record.scene);record.photo.addEventListener('load',()=>{record.planes?.forEach(plane=>{if(plane.firstElementChild.complete&&plane.firstElementChild.naturalWidth)plane.classList.add('screen-ready');});schedule();});});
  window.addEventListener('resize',schedule,{passive:true});
  // Do not decode and allocate every perspective screen while the hero paints.
  // The original high-quality scene remains visible until its real screen is ready.
  if ('IntersectionObserver' in window) {
    const nearby = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const record = records.find(record => record.scene === entry.target);
        if (record) record.active = entry.isIntersecting;
      });
      schedule();
    }, {rootMargin:'200px 0px',threshold:0});
    records.forEach(record => nearby.observe(record.scene));
  } else {
    records.forEach(record => {record.active=true;});
    update();
  }
})().catch(() => { /* Keep the original photographic scenes on load failure. */ });
