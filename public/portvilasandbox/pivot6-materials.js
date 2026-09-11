let textureBank=null;

function seeded(x){let n=(x|0)+0x6d2b79f5;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return((n^(n>>>14))>>>0)/4294967296;}
function canvasTex(THREE,w,h,draw,{srgb=true,repeat=[1,1]}={}){
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');draw(ctx,w,h);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat[0],repeat[1]);
  if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.needsUpdate=true;return t;
}
function buildTextures(THREE){
  if(textureBank)return textureBank;
  const concrete=canvasTex(THREE,128,128,(c,w,h)=>{c.fillStyle='#f1eee7';c.fillRect(0,0,w,h);for(let i=0;i<900;i++){const r=seeded(i),x=seeded(i*3+4)*w,y=seeded(i*5+9)*h,a=.015+r*.045,v=Math.floor(185+r*55);c.fillStyle=`rgba(${v},${v-2},${v-5},${a})`;c.fillRect(x,y,1+r*2,1+r*2);}for(let i=0;i<8;i++){const y=seeded(i*13+7)*h,g=c.createLinearGradient(0,y,0,y+8);g.addColorStop(0,'rgba(80,75,67,0)');g.addColorStop(.5,'rgba(80,75,67,.05)');g.addColorStop(1,'rgba(80,75,67,0)');c.fillStyle=g;c.fillRect(0,y,w,10);}}, {repeat:[3,3]});
  const concreteBump=canvasTex(THREE,128,128,(c,w,h)=>{c.fillStyle='#888';c.fillRect(0,0,w,h);for(let i=0;i<1500;i++){const v=105+Math.floor(seeded(i*11)*60);c.fillStyle=`rgb(${v},${v},${v})`;c.fillRect(seeded(i*7)*w,seeded(i*17)*h,1,1);}}, {srgb:false,repeat:[4,4]});
  const corr=canvasTex(THREE,128,128,(c,w,h)=>{c.fillStyle='#e8ecea';c.fillRect(0,0,w,h);for(let x=0;x<w;x++){const wave=(Math.sin(x*Math.PI/4)+1)*.5,v=Math.floor(196+wave*48);c.fillStyle=`rgb(${v},${v+2},${v+3})`;c.fillRect(x,0,1,h);}for(let i=0;i<50;i++){const y=seeded(i*19)*h;c.fillStyle='rgba(85,78,70,.05)';c.fillRect(0,y,w,1);}}, {repeat:[6,2]});
  const corrBump=canvasTex(THREE,128,128,(c,w,h)=>{for(let x=0;x<w;x++){const wave=(Math.sin(x*Math.PI/4)+1)*.5,v=Math.floor(55+wave*190);c.fillStyle=`rgb(${v},${v},${v})`;c.fillRect(x,0,1,h);}}, {srgb:false,repeat:[7,2]});
  const asphalt=canvasTex(THREE,128,128,(c,w,h)=>{c.fillStyle='#8d8c87';c.fillRect(0,0,w,h);for(let i=0;i<2400;i++){const r=seeded(i*29),v=85+Math.floor(r*90),a=.16+seeded(i*31)*.22;c.fillStyle=`rgba(${v},${v},${v-2},${a})`;const s=seeded(i*37)>.9?2:1;c.fillRect(seeded(i*41)*w,seeded(i*43)*h,s,s);}}, {repeat:[12,12]});
  const asphaltBump=canvasTex(THREE,128,128,(c,w,h)=>{c.fillStyle='#777';c.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const v=70+Math.floor(seeded(i*47)*120);c.fillStyle=`rgb(${v},${v},${v})`;c.fillRect(seeded(i*53)*w,seeded(i*59)*h,1,1);}}, {srgb:false,repeat:[14,14]});
  const timber=canvasTex(THREE,128,128,(c,w,h)=>{c.fillStyle='#ddd0b7';c.fillRect(0,0,w,h);for(let y=0;y<h;y++){const v=205+Math.floor(Math.sin(y*.42)*16+seeded(y*3)*10);c.fillStyle=`rgb(${v},${Math.max(0,v-16)},${Math.max(0,v-35)})`;c.fillRect(0,y,w,1);}for(let i=0;i<12;i++){const y=seeded(i*61)*h;c.fillStyle='rgba(70,43,20,.12)';c.fillRect(0,y,w,1);}}, {repeat:[2,5]});
  const paving=canvasTex(THREE,128,128,(c,w,h)=>{c.fillStyle='#ddd8ce';c.fillRect(0,0,w,h);c.strokeStyle='rgba(90,88,82,.15)';c.lineWidth=1;for(let y=0;y<h;y+=16){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}for(let x=0;x<w;x+=32){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let i=0;i<320;i++){const v=150+Math.floor(seeded(i*67)*65);c.fillStyle=`rgba(${v},${v},${v},.08)`;c.fillRect(seeded(i*71)*w,seeded(i*73)*h,1,1);}}, {repeat:[5,5]});
  const leaf=canvasTex(THREE,64,64,(c,w,h)=>{const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#c8e0b9');g.addColorStop(1,'#7fac72');c.fillStyle=g;c.fillRect(0,0,w,h);for(let i=0;i<500;i++){const a=.05+seeded(i*79)*.1;c.fillStyle=`rgba(25,70,26,${a})`;c.fillRect(seeded(i*83)*w,seeded(i*89)*h,1,1);}}, {repeat:[2,2]});
  const sign=canvasTex(THREE,256,64,(c,w,h)=>{c.fillStyle='#f3eee2';c.fillRect(0,0,w,h);const bands=['#154d6b','#b52d22','#d2a536','#327057'];for(let i=0;i<4;i++){c.fillStyle=bands[i];c.fillRect(i*w/4,0,w/4,h);}c.fillStyle='rgba(255,255,255,.9)';for(let i=0;i<11;i++){const x=8+i*22,y=16+(i%3)*10;c.fillRect(x,y,10+(i%4)*3,4);}}, {repeat:[1,1]});
  textureBank={concrete,concreteBump,corr,corrBump,asphalt,asphaltBump,timber,paving,leaf,sign};return textureBank;
}
function ensureUV(THREE,g){
  if(!g?.attributes?.position||g.attributes.uv)return;
  g.computeBoundingBox();const p=g.attributes.position,n=g.attributes.normal,b=g.boundingBox,min=b.min,max=b.max,sx=Math.max(.001,max.x-min.x),sy=Math.max(.001,max.y-min.y),sz=Math.max(.001,max.z-min.z),uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=n?.getX(i)||0,ny=n?.getY(i)||1,nz=n?.getZ(i)||0,ax=Math.abs(nx),ay=Math.abs(ny),az=Math.abs(nz);let u,v;
    if(ay>=ax&&ay>=az){u=(x-min.x)/sx;v=(z-min.z)/sz;}else if(ax>=az){u=(z-min.z)/sz;v=(y-min.y)/sy;}else{u=(x-min.x)/sx;v=(y-min.y)/sy;}
    uv[i*2]=u;uv[i*2+1]=v;
  }
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
}
function inGroup(o,g){for(let p=o;p;p=p.parent)if(p===g)return true;return false;}
function mapMaterial(THREE,o,m,T,profile,G){
  if(!m||m.isSpriteMaterial||m.isLineBasicMaterial)return false;ensureUV(THREE,o.geometry);
  const name=(m.name||'').toLowerCase(),isRoad=inGroup(o,G?.roads),isUrban=inGroup(o,G?.urban),isAsset=inGroup(o,G?.assets),isBase=inGroup(o,G?.buildings);
  if(isRoad){m.map=T.asphalt;m.bumpMap=T.asphaltBump;m.bumpScale=.07;m.roughness=.96;m.metalness=0;m.needsUpdate=true;return true;}
  if(isUrban){m.map=T.paving;m.bumpMap=T.concreteBump;m.bumpScale=.035;m.roughness=.93;m.metalness=0;m.needsUpdate=true;return true;}
  if(/glass/.test(name)){m.roughness=.16;m.metalness=.10;m.envMapIntensity=1.35;if(m.color)m.color.multiplyScalar(.88);m.needsUpdate=true;return true;}
  if(/metalroof|container|metaldark/.test(name)||(isBase&&(m.metalness||0)>.07&&(m.roughness||1)<.72)){m.map=T.corr;m.bumpMap=T.corrBump;m.bumpScale=.10;m.roughness=Math.min(.56,m.roughness??.5);m.metalness=Math.max(.14,m.metalness||0);m.needsUpdate=true;return true;}
  if(/timber/.test(name)){m.map=T.timber;m.bumpMap=T.concreteBump;m.bumpScale=.025;m.roughness=.82;m.needsUpdate=true;return true;}
  if(/leaf/.test(name)){m.map=T.leaf;m.roughness=.88;m.metalness=0;m.needsUpdate=true;return true;}
  if(/signred|signblue/.test(name)){m.map=T.sign;m.roughness=.48;m.metalness=.02;m.needsUpdate=true;return true;}
  if(/concrete|masonry|houselight|awning|tank/.test(name)||isAsset||isBase){m.map=T.concrete;m.bumpMap=T.concreteBump;m.bumpScale=profile?.mobile?.018:.032;m.roughness=Math.max(.76,m.roughness??.82);m.metalness=Math.min(.04,m.metalness||0);m.needsUpdate=true;return true;}
  return false;
}
export function applySurfacePass({THREE,scene,G,pvGraphics}){
  if(!THREE||!scene)return{meshes:0,materials:0,uvs:0};const T=buildTextures(THREE);let meshes=0,materials=0,uvs=0;
  scene.traverse(o=>{if(!o.isMesh||!o.material)return;meshes++;const had=!!o.geometry?.attributes?.uv;ensureUV(THREE,o.geometry);if(!had&&o.geometry?.attributes?.uv)uvs++;const arr=Array.isArray(o.material)?o.material:[o.material];for(const m of arr)if(mapMaterial(THREE,o,m,T,pvGraphics,G))materials++;});
  window.pvSurfaceStats={meshes,materials,uvs};return window.pvSurfaceStats;
}
