import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
let assetLayer=null,ready=false;
const templates=new Map();
const DIMS={
  pv_commercial_2storey_A:{x:12,z:6,y:7.4},pv_commercial_2storey_B:{x:11.2,z:6.4,y:7.3},
  pv_commercial_corner_A:{x:10,z:8,y:6.7},pv_shopfront_1storey_A:{x:10,z:5.8,y:4.7},
  pv_shopfront_1storey_B:{x:9.5,z:6.2,y:4.5},pv_warehouse_corrugated_A:{x:14,z:8,y:6.6},
  pv_house_lightweight_A:{x:8,z:6,y:5.1},pv_house_masonry_A:{x:9,z:7,y:5.2},
  pv_ac_unit_A:{x:1.1,z:.45,y:.9},pv_water_tank_A:{x:1.8,z:1.8,y:1.55},
  pv_sign_A:{x:2.8,z:.12,y:2.05},pv_balcony_A:{x:4.6,z:1.4,y:1.0},
  pv_seawall_A:{x:8,z:1.45,y:1.5},pv_streetlight_A:{x:2,z:.5,y:6},
  pv_powerpole_A:{x:3.2,z:.3,y:9},pv_bollard_A:{x:.22,z:.22,y:.97},pv_bin_A:{x:.72,z:.72,y:1.18},
  pv_container_blue_A:{x:6.1,z:2.45,y:2.6},pv_container_rust_A:{x:6.1,z:2.45,y:2.6},
  pv_palm_A:{x:7,z:7,y:7.5},pv_palm_B:{x:8,z:8,y:8.4}
};

function mat(THREE,name,color,roughness=.8,metalness=0){const m=new THREE.MeshStandardMaterial({color,roughness,metalness});m.name=name;return m;}
function fallbackTemplate(THREE,name){
  const g=new THREE.Group();g.name=name;
  const M={
    concreteWarm:mat(THREE,'concreteWarm',0xb8a88f,.82,0),concreteCool:mat(THREE,'concreteCool',0x9faeab,.82,0),
    concreteWhite:mat(THREE,'concreteWhite',0xd1cec2,.86,0),glass:mat(THREE,'glass',0x29464f,.24,.08),
    awning:mat(THREE,'awning',0xa17645,.72,0),metalRoof:mat(THREE,'metalRoof',0x708a8f,.42,.22),
    metalDark:mat(THREE,'metalDark',0x3d4a4a,.46,.25),houseLight:mat(THREE,'houseLight',0xbabda6,.86,0),
    masonry:mat(THREE,'masonry',0xccbda0,.88,0),timber:mat(THREE,'timber',0x755438,.8,0),
    leaf:mat(THREE,'leaf',0x336333,.86,0),leafLight:mat(THREE,'leafLight',0x477a40,.84,0),
    lamp:mat(THREE,'lamp',0xc9bd94,.5,.05),signRed:mat(THREE,'signRed',0x8f261c,.62,0),signBlue:mat(THREE,'signBlue',0x21528c,.58,0),
    tank:mat(THREE,'tank',0xadb8b3,.58,.05),containerBlue:mat(THREE,'containerBlue',0x245276,.55,.2),containerRust:mat(THREE,'containerRust',0x803d21,.62,.12),dark:mat(THREE,'dark',0x1f2424,.6,.25)
  };
  const box=(n,m,x,y,z,sx,sy,sz,rz=0)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),M[m]);o.name=n;o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.z=rz;o.castShadow=o.receiveShadow=true;g.add(o);return o;};
  if(name==='pv_commercial_2storey_A'){box('body','concreteWarm',0,3.4,0,12,6.8,6);box('glass','glass',0,1.6,-3.05,10.8,2.5,.12);box('awning','awning',0,2.8,-3.8,11.5,.22,1.7);[-4,-1.35,1.35,4].forEach(x=>box('window','glass',x,4.8,-3.06,2.15,1.85,.11));box('parapet','concreteCool',0,7.05,0,12.2,.55,6.1);box('sign','signBlue',0,3.12,-3.16,7.2,.46,.1);}
  else if(name==='pv_commercial_2storey_B'){box('body','concreteWhite',0,3.4,0,11.2,6.8,6.4);box('glass','glass',0,1.6,-3.25,9.6,2.55,.12);box('awning','metalRoof',0,2.8,-4.05,10.8,.18,1.6);box('balcony','concreteCool',0,4.15,-3.75,10.6,.22,1.1);box('rail','metalDark',0,4.75,-4.2,10.2,.08,.08);box('winL','glass',-2.8,5.05,-3.25,3.8,1.7,.11);box('winR','glass',2.8,5.05,-3.25,3.8,1.7,.11);box('roof','metalRoof',0,7,0,11.7,.25,6.8);}
  else if(name==='pv_commercial_corner_A'){box('body','concreteCool',0,3.1,0,10,6.2,8);box('front','glass',0,1.55,-4.05,8.8,2.4,.12);box('side','glass',5.05,1.55,-.8,.12,2.4,5.4);box('awn','awning',0,2.85,-4.65,9.6,.22,1.3);box('roof','concreteWhite',0,6.45,0,10.4,.45,8.4);box('sign','signRed',2.2,3.25,-4.15,4.5,.55,.1);}
  else if(name==='pv_shopfront_1storey_A'||name==='pv_shopfront_1storey_B'){const b=name.endsWith('_B');box('body',b?'concreteWhite':'masonry',0,2.05,0,b?9.5:10,4.1,b?6.2:5.8);box('glass','glass',0,1.45,b?-3.16:-2.96,b?8.3:8.7,2.2,.12);box('awning',b?'metalRoof':'awning',0,2.7,-3.7,b?9.4:9.5,.2,1.5);box('sign',b?'signRed':'signBlue',0,3.25,-3.1,6,.5,.1);box('roof','metalRoof',0,4.4,0,b?9.9:10.4,.28,b?6.55:6.1);}
  else if(name==='pv_warehouse_corrugated_A'){box('body','metalDark',0,2.5,0,14,5,8);box('door','metalRoof',0,1.7,-4.05,5,3.3,.12);box('roofL','metalRoof',-2,5.35,0,7.6,.28,8.5,.315);box('roofR','metalRoof',2,5.35,0,7.6,.28,8.5,-.315);box('vent','tank',4.8,5.6,1.8,.8,.9,.8);}
  else if(name==='pv_house_lightweight_A'||name==='pv_house_masonry_A'){const m=name.includes('masonry'),w=m?9:8,d=m?7:6;box('body',m?'masonry':'houseLight',0,1.7,0,w,m?3.5:3.2,d);box('window','glass',0,1.75,-d/2-.05,m?5.8:4.6,1.25,.12);box('roofL','metalRoof',-1.2,m?4.1:3.8,0,w*.62,.24,d+.7,.35);box('roofR','metalRoof',1.2,m?4.1:3.8,0,w*.62,.24,d+.7,-.35);}
  else if(name==='pv_ac_unit_A'){box('box','concreteWhite',0,.45,0,1.1,.9,.45);box('fan','dark',0,.45,-.24,.62,.62,.05);}
  else if(name==='pv_water_tank_A'){box('tank','tank',0,.75,0,1.6,1.5,1.6);box('base','metalDark',0,.08,0,1.8,.16,1.8);}
  else if(name==='pv_sign_A'){box('panel','signRed',0,1.5,0,2.8,1.1,.12);box('post','metalDark',0,.65,.05,.12,1.3,.12);}
  else if(name==='pv_balcony_A'){box('slab','concreteCool',0,.08,0,4.6,.16,1.4);box('rail','metalDark',0,.8,-.65,4.5,.07,.07);}
  else if(name==='pv_seawall_A'){box('wall','concreteCool',0,.65,0,8,1.3,1.2);box('cap','concreteWarm',0,1.38,0,8.2,.18,1.45);}
  else if(name==='pv_streetlight_A'){box('pole','metalDark',0,3,0,.18,6,.18);box('arm','metalDark',.55,5.85,0,1.2,.12,.12);box('lamp','lamp',1.1,5.75,0,.7,.22,.42);}
  else if(name==='pv_powerpole_A'){box('pole','timber',0,4.5,0,.24,9,.24);box('cross','timber',0,8,0,3.2,.18,.18);}
  else if(name==='pv_bollard_A'){box('bollard','metalDark',0,.45,0,.18,.9,.18);box('cap','lamp',0,.92,0,.22,.10,.22);}
  else if(name==='pv_bin_A'){box('bin','metalDark',0,.55,0,.65,1.1,.65);box('lid','concreteCool',0,1.13,0,.72,.10,.72);}
  else if(name==='pv_container_blue_A'||name==='pv_container_rust_A'){const m=name.includes('blue')?'containerBlue':'containerRust';box('container',m,0,1.3,0,6.1,2.6,2.45);box('door','metalDark',0,1.3,-1.24,5.4,2.2,.05);}
  else if(name==='pv_palm_A'||name==='pv_palm_B'){const b=name.endsWith('_B'),H=b?7.8:7,leaf=b?'leafLight':'leaf',count=b?10:8;box('trunk','timber',0,H/2,0,b?.42:.5,H,b?.42:.5);for(let i=0;i<count;i++){const a=i*Math.PI*2/count,L=b?(i%2?3.6:4.3):3.8;const f=box('frond',leaf,Math.cos(a)*(b?1.9:1.6),H+.35,Math.sin(a)*(b?1.9:1.6),L,.1,.5);f.rotation.y=-a;}box('crown',leaf,0,H+.1,0,1.1,.45,1.1);}
  return g;
}
function ensureTemplates(THREE){for(const name of Object.keys(DIMS))if(!templates.has(name))templates.set(name,fallbackTemplate(THREE,name));}

function cloneMaterials(o){
  o.traverse(n=>{
    if(!n.isMesh)return;
    n.castShadow=true;n.receiveShadow=true;
    if(Array.isArray(n.material))n.material=n.material.map(m=>m.clone());
    else if(n.material)n.material=n.material.clone();
  });
  return o;
}
function tintAsset(o,r){
  o.traverse(n=>{
    const m=n.material;if(!m?.color)return;
    const name=(m.name||'').toLowerCase();
    if(/concrete|masonry|houselight/.test(name)){
      const hsl={};m.color.getHSL(hsl);
      m.color.setHSL((hsl.h+(r-.5)*.025+1)%1,Math.max(0,hsl.s*(.88+r*.16)),Math.min(.92,Math.max(.24,hsl.l*(.92+r*.14))));
    } else if(/metalroof/.test(name)){
      const hsl={};m.color.getHSL(hsl);
      m.color.setHSL((hsl.h+(r-.5)*.035+1)%1,hsl.s*.85,Math.min(.72,Math.max(.28,hsl.l*(.90+r*.12))));
    }
    m.needsUpdate=true;
  });
}
export async function setupPVAssets(ctx){
  if(ready)return true;
  const {THREE,scene,G}=ctx;
  if(!assetLayer){assetLayer=new THREE.Group();assetLayer.name='assets';scene.add(assetLayer);G.assets=assetLayer;}
  try{
    const gltf=await new GLTFLoader().loadAsync('./assets/pv-kit-v2.gltf?v=5');
    for(const name of Object.keys(DIMS)){const src=gltf.scene.getObjectByName(name);if(src)templates.set(name,src);}
    ensureTemplates(THREE);ready=templates.size===Object.keys(DIMS).length;
    return ready;
  }catch(e){console.warn('PV asset kit v0.2 fallback',e);ensureTemplates(THREE);ready=true;return true;}
}
function clone(name,r=.5){const src=templates.get(name);if(!src)return null;const o=cloneMaterials(src.clone(true));tintAsset(o,r);return o;}
function clear(){if(!assetLayer)return;while(assetLayer.children.length){const o=assetLayer.children.pop();o.traverse(n=>{if(Array.isArray(n.material))n.material.forEach(m=>m.dispose?.());else n.material?.dispose?.();});}}
function choose(m,hash){const a=m.userData.arch||{},r=hash(m.userData.id+'asset5');if(a.type==='commercial'){if(a.levels>=2)return r>.72?'pv_commercial_corner_A':r>.34?'pv_commercial_2storey_B':'pv_commercial_2storey_A';return r>.48?'pv_shopfront_1storey_B':'pv_shopfront_1storey_A';}if(a.type==='industrial')return'pv_warehouse_corrugated_A';if(a.type==='residential')return r>.48?'pv_house_masonry_A':'pv_house_lightweight_A';return null;}
function addRoofDetail(ctx,base,f,arch,r,counts){const {hash,pvGraphics}=ctx;if(pvGraphics?.mobile&&r<.62)return;const rooftopY=base.position.y+arch.h+.35;const detailName=(arch.type==='commercial'&&r>.42)?'pv_ac_unit_A':r>.76?'pv_water_tank_A':null;if(!detailName)return;const o=clone(detailName,hash(base.userData.id+'detailTint'));if(!o)return;const along=(hash(base.userData.id+'detailPos')-.5)*Math.min(f.u*.9,5);o.position.set(base.position.x+along*f.ca,rooftopY,base.position.z+along*f.sa);o.rotation.y=-f.angle;assetLayer.add(o);counts.details++;if(arch.type==='commercial'&&!pvGraphics?.mobile&&hash(base.userData.id+'detail2')>.68){const o2=clone('pv_ac_unit_A',hash(base.userData.id+'detailTint2'));if(o2){o2.position.set(base.position.x-along*.55*f.ca,rooftopY,base.position.z-along*.55*f.sa);o2.rotation.y=-f.angle;assetLayer.add(o2);counts.details++;}}}
function addContainerBeside(ctx,base,f,r,counts){const {pvGraphics}=ctx;if(pvGraphics?.mobile&&r<.65)return;const name=r>.5?'pv_container_blue_A':'pv_container_rust_A',o=clone(name,r);if(!o)return;const side=f.v+2.0,sign=r>.5?1:-1;o.position.set(base.position.x-f.sa*side*sign,base.position.y+.15,base.position.z+f.ca*side*sign);o.rotation.y=-f.angle;assetLayer.add(o);counts.details++;}
function replaceBuildings(c){const {buildingMeshes,hash,pvGraphics,osmData,world,principal}=c;const ways=new Map((osmData?.elements||[]).filter(e=>e.type==='way'&&e.tags?.building&&e.geometry?.length>3).map(e=>[String(e.id),e]));const cand=buildingMeshes.map((m,i)=>{const w=ways.get(String(m.userData.id));if(!w)return null;const ps=w.geometry.slice(0,-1).map(g=>world(g.lon,g.lat)),f=principal(ps,m.userData.cx,m.userData.cz);return{m,i,f,d:m.userData.cx*m.userData.cx+m.userData.cz*m.userData.cz};}).filter(o=>{if(!o)return false;const a=o.m.userData.arch;if(!a||!choose(o.m,hash))return false;const ratio=Math.max(o.f.u,o.f.v)/Math.max(1,Math.min(o.f.u,o.f.v));return a.area>42&&a.area<1200&&ratio<3.4;}).sort((a,b)=>a.d-b.d);const cap=pvGraphics?.name==='high'?155:pvGraphics?.name==='balanced'?96:54;const counts={buildings:0,details:0};for(const q of cand.slice(0,cap)){const base=q.m,name=choose(base,hash),r=hash(base.userData.id+'assetTint5'),a=clone(name,r);if(!a)continue;const f=q.f,d=DIMS[name],arch=base.userData.arch;a.scale.set(Math.max(.55,Math.min(2.9,f.u*1.88/d.x)),Math.max(.72,Math.min(1.7,arch.h/d.y)),Math.max(.55,Math.min(2.9,f.v*1.88/d.z)));a.rotation.y=-f.angle;a.position.copy(base.position);a.userData={...base.userData,kind:'building',asset:name,proceduralBase:base};base.visible=false;assetLayer.add(a);buildingMeshes[q.i]=a;counts.buildings++;addRoofDetail(c,base,f,arch,r,counts);if(arch.type==='industrial')addContainerBeside(c,base,f,r,counts);}return counts;}
function sample(a,b,spacing,cb){const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);if(l<spacing)return;const ux=dx/l,uz=dz/l;for(let d=spacing*.5;d<l;d+=spacing)cb({x:a.x+ux*d,z:a.z+uz*d,ux,uz});}
function palms(c){const {osmData,mergeCoast,polyLen,terrainY,hash,pvGraphics}=c;if(!osmData||!templates.has('pv_palm_A'))return 0;const main=mergeCoast((osmData.elements||[]).filter(e=>e.tags?.natural==='coastline')).sort((a,b)=>polyLen(b)-polyLen(a))[0];if(!main)return 0;let n=0,cap=pvGraphics?.mobile?24:44;for(let i=1;i<main.length&&n<cap;i++)sample(main[i-1],main[i],68,p=>{if(n>=cap||p.x<-540||p.x>210||p.z<-1000||p.z>1000)return;const rr=hash('palm5'+n),name=rr>.52?'pv_palm_B':'pv_palm_A',a=clone(name,rr);if(!a)return;const s=.76+rr*.46,side=hash('palmSide'+n)>.5?1:-1;a.scale.set(s,s*(.92+rr*.12),s);const off=10+hash('palmOff'+n)*8;a.position.set(p.x-p.uz*off*side,terrainY(p.x-p.uz*off*side,p.z+p.ux*off*side)+.55,p.z+p.ux*off*side);a.rotation.y=rr*Math.PI*2;assetLayer.add(a);n++;});return n;}
function roadside(c){const {osmData,roadStyle,world,terrainY,pvGraphics,hash}=c;const ways=(osmData?.elements||[]).filter(e=>['primary','secondary','tertiary'].includes(e.tags?.highway)&&e.geometry?.length>1);let lights=0,poles=0,capL=pvGraphics?.mobile?28:60,capP=pvGraphics?.mobile?14:32;for(const w of ways){const st=roadStyle(w.tags||{}),ps=w.geometry.map(g=>world(g.lon,g.lat));for(let i=1;i<ps.length&&(lights<capL||poles<capP);i++)sample(ps[i-1],ps[i],96,p=>{const side=(lights+poles)%2?1:-1,ox=-p.uz*(st.w/2+2.0)*side,oz=p.ux*(st.w/2+2.0)*side;if(lights<capL&&hash(`light${w.id}-${i}-${lights}`)>.18){const a=clone('pv_streetlight_A',.5);if(a){a.position.set(p.x+ox,terrainY(p.x+ox,p.z+oz)+.7,p.z+oz);a.rotation.y=Math.atan2(p.ux,p.uz);assetLayer.add(a);lights++;}}else if(poles<capP){const a=clone('pv_powerpole_A',.5);if(a){a.position.set(p.x-ox,terrainY(p.x-ox,p.z-oz)+.5,p.z-oz);a.rotation.y=Math.atan2(p.ux,p.uz);assetLayer.add(a);poles++;}}});}return{lights,poles};}
function promenadeProps(c){const {osmData,mergeCoast,polyLen,terrainY,pvGraphics,hash}=c;const main=mergeCoast((osmData?.elements||[]).filter(e=>e.tags?.natural==='coastline')).sort((a,b)=>polyLen(b)-polyLen(a))[0];if(!main)return{bins:0,bollards:0,seawall:0};let bins=0,bollards=0,seawall=0,capS=pvGraphics?.mobile?30:64;for(let i=1;i<main.length&&seawall<capS;i++)sample(main[i-1],main[i],8.1,p=>{if(seawall>=capS||p.x<-520||p.x>160||p.z<-880||p.z>880)return;const a=clone('pv_seawall_A',.5);if(!a)return;a.position.set(p.x,Math.max(.15,terrainY(p.x,p.z)-.05),p.z);a.rotation.y=-Math.atan2(p.uz,p.ux);assetLayer.add(a);seawall++;if(seawall%5===0&&bollards<(pvGraphics?.mobile?8:18)){const b=clone('pv_bollard_A',.5);if(b){b.position.set(p.x-p.uz*2.1,terrainY(p.x-p.uz*2.1,p.z+p.ux*2.1)+.15,p.z+p.ux*2.1);assetLayer.add(b);bollards++;}}if(seawall%9===0&&bins<(pvGraphics?.mobile?4:10)){const rr=hash('bin'+seawall),b=clone('pv_bin_A',rr);if(b){b.position.set(p.x-p.uz*3.2,terrainY(p.x-p.uz*3.2,p.z+p.ux*3.2)+.15,p.z+p.ux*3.2);b.rotation.y=rr*Math.PI*2;assetLayer.add(b);bins++;}}});return{bins,bollards,seawall};}
export function rebuildPVAssets(ctx){if(!ready||!assetLayer)return{buildings:0,details:0,palms:0,lights:0,poles:0,seawall:0,bins:0,bollards:0};clear();const b=replaceBuildings(ctx),r=roadside(ctx),p=promenadeProps(ctx);const s={buildings:b.buildings,details:b.details,palms:palms(ctx),lights:r.lights,poles:r.poles,seawall:p.seawall,bins:p.bins,bollards:p.bollards};window.pvAssetStats=s;return s;}
export function assetsReady(){return ready;}
