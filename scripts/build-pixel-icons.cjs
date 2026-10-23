/* Rebuild the home icon family from the existing brand SVGs on a 20 × 20 grid. */
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const names = ['html5','css3','javascript','typescript','vuejs','nuxtjs','flutter','fastapi','python','postgresql','git','swift','swiftui'];
(async () => {
 const out = path.join(__dirname,'../assets/stack/pixel');
 await fs.mkdir(out,{recursive:true});
 for (const name of names) {
  const source = name.startsWith('swift') ? '../img/brands/swift-logo.svg' : `../assets/stack/logos/${name}.svg`;
  let svg = await fs.readFile(path.join(__dirname,source),'utf8');
  if (name === 'swiftui') svg = svg.replaceAll('#F05138','#168BD1');
  const {data,info} = await sharp(Buffer.from(svg)).resize(20,20,{fit:'contain',background:'#00000000'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const palette=[...new Set(svg.match(/#[0-9a-fA-F]{6}\b/g)||[])].map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
  palette.push([255,255,255],[0,0,0]);
  for(const h of svg.match(/#[0-9a-fA-F]{3}\b/g)||[]) palette.push([...h.slice(1)].map(v=>parseInt(v+v,16)));
  let cells='';
  for(let y=0;y<20;y++)for(let x=0;x<20;x++) {
   const i=(y*20+x)*info.channels;
   if(data[i+3]<110)continue;
   const rgb=[data[i],data[i+1],data[i+2]];
   const color=palette.reduce((a,b)=>b.reduce((s,v,j)=>s+(v-rgb[j])**2,0)<a.reduce((s,v,j)=>s+(v-rgb[j])**2,0)?b:a);
   const fill='#'+color.map(v=>v.toString(16).padStart(2,'0')).join('');
   cells+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
  }
  await fs.writeFile(path.join(out,name+'.svg'),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" shape-rendering="crispEdges">${cells}</svg>\n`);
 }
 console.log('Built 13 pixel SVG icons.');
})();
