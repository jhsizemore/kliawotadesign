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
    ready=templates.size>=18;
    return ready;
  }catch(e){console.warn('PV asset kit v0.2 fallback',e);return false;}
}
function clone(name,r=.5){
  const src=templates.get(name);if(!src)return null;
  const o=cloneMaterials(src.clone(true));tintAsset(o,r);return o;
}
function clear(){
  if(!assetLayer)return;
  while(assetLayer.children.length){
    const o=assetLayer.children.pop();
    o.traverse(n=>{if(Array.isArray(n.material))n.material.forEach(m=>m.dispose?.());else n.material?.dispose?.();});
  }
}
function choose(m,hash){
  const a=m.userData.arch||{},r=hash(m.userData.id+'asset5');
  if(a.type==='commercial'){
    if(a.levels>=2)return r>.72?'pv_commercial_corner_A':r>.34?'pv_commercial_2storey_B':'pv_commercial_2storey_A';
    return r>.48?'pv_shopfront_1storey_B':'pv_shopfront_1storey_A';
  }
  if(a.type==='industrial')return'pv_warehouse_corrugated_A';
  if(a.type==='residential')return r>.48?'pv_house_masonry_A':'pv_house_lightweight_A';
  return null;
}
function addRoofDetail(ctx,base,f,arch,r,counts){
  const {hash,pvGraphics}=ctx;
  if(pvGraphics?.mobile&&r<.62)return;
  const rooftopY=base.position.y+arch.h+.35;
  const detailName=(arch.type==='commercial'&&r>.42)?'pv_ac_unit_A':r>.76?'pv_water_tank_A':null;
  if(!detailName)return;
  const o=clone(detailName,hash(base.userData.id+'detailTint'));if(!o)return;
  const along=(hash(base.userData.id+'detailPos')-.5)*Math.min(f.u*.9,5);
  o.position.set(base.position.x+along*f.ca,rooftopY,base.position.z+along*f.sa);
  o.rotation.y=-f.angle;
  assetLayer.add(o);counts.details++;
  if(arch.type==='commercial'&&!pvGraphics?.mobile&&hash(base.userData.id+'detail2')>.68){
    const o2=clone('pv_ac_unit_A',hash(base.userData.id+'detailTint2'));if(o2){
      o2.position.set(base.position.x-along*.55*f.ca,rooftopY,base.position.z-along*.55*f.sa);
      o2.rotation.y=-f.angle;assetLayer.add(o2);counts.details++;
    }
  }
}
function addContainerBeside(ctx,base,f,r,counts){
  const {pvGraphics}=ctx;if(pvGraphics?.mobile&&r<.65)return;
  const name=r>.5?'pv_container_blue_A':'pv_container_rust_A',o=clone(name,r);if(!o)return;
  const side=f.v+2.0,sign=r>.5?1:-1;
  o.position.set(base.position.x-f.sa*side*sign,base.position.y+.15,base.position.z+f.ca*side*sign);
  o.rotation.y=-f.angle;assetLayer.add(o);counts.details++;
}
function replaceBuildings(c){
  const {buildingMeshes,hash,pvGraphics,osmData,world,principal}=c;
  const ways=new Map((osmData?.elements||[]).filter(e=>e.type==='way'&&e.tags?.building&&e.geometry?.length>3).map(e=>[String(e.id),e]));
  const cand=buildingMeshes.map((m,i)=>{
    const w=ways.get(String(m.userData.id));if(!w)return null;
    const ps=w.geometry.slice(0,-1).map(g=>world(g.lon,g.lat)),f=principal(ps,m.userData.cx,m.userData.cz);
    return{m,i,f,d:m.userData.cx*m.userData.cx+m.userData.cz*m.userData.cz};
  }).filter(o=>{
    if(!o)return false;const a=o.m.userData.arch;if(!a||!choose(o.m,hash))return false;
    const ratio=Math.max(o.f.u,o.f.v)/Math.max(1,Math.min(o.f.u,o.f.v));
    return a.area>42&&a.area<1200&&ratio<3.4;
  }).sort((a,b)=>a.d-b.d);
  const cap=pvGraphics?.name==='high'?155:pvGraphics?.name==='balanced'?96:54;
  const counts={buildings:0,details:0};
  for(const q of cand.slice(0,cap)){
    const base=q.m,name=choose(base,hash),r=hash(base.userData.id+'assetTint5'),a=clone(name,r);if(!a)continue;
    const f=q.f,d=DIMS[name],arch=base.userData.arch;
    a.scale.set(Math.max(.55,Math.min(2.9,f.u*1.88/d.x)),Math.max(.72,Math.min(1.7,arch.h/d.y)),Math.max(.55,Math.min(2.9,f.v*1.88/d.z)));
    a.rotation.y=-f.angle;a.position.copy(base.position);
    a.userData={...base.userData,kind:'building',asset:name,proceduralBase:base};
    base.visible=false;assetLayer.add(a);buildingMeshes[q.i]=a;counts.buildings++;
    addRoofDetail(c,base,f,arch,r,counts);
    if(arch.type==='industrial')addContainerBeside(c,base,f,r,counts);
  }
  return counts;
}
function sample(a,b,spacing,cb){
  const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);if(l<spacing)return;
  const ux=dx/l,uz=dz/l;
  for(let d=spacing*.5;d<l;d+=spacing)cb({x:a.x+ux*d,z:a.z+uz*d,ux,uz});
}
function palms(c){
  const {osmData,mergeCoast,polyLen,terrainY,hash,pvGraphics}=c;
  if(!osmData||!templates.has('pv_palm_A'))return 0;
  const main=mergeCoast((osmData.elements||[]).filter(e=>e.tags?.natural==='coastline')).sort((a,b)=>polyLen(b)-polyLen(a))[0];
  if(!main)return 0;let n=0,cap=pvGraphics?.mobile?24:44;
  for(let i=1;i<main.length&&n<cap;i++)sample(main[i-1],main[i],68,p=>{
    if(n>=cap||p.x<-540||p.x>210||p.z<-1000||p.z>1000)return;
    const rr=hash('palm5'+n),name=rr>.52?'pv_palm_B':'pv_palm_A',a=clone(name,rr);if(!a)return;
    const s=.76+rr*.46,side=hash('palmSide'+n)>.5?1:-1;
    a.scale.set(s,s*(.92+rr*.12),s);
    const off=10+hash('palmOff'+n)*8;
    a.position.set(p.x-p.uz*off*side,terrainY(p.x-p.uz*off*side,p.z+p.ux*off*side)+.55,p.z+p.ux*off*side);
    a.rotation.y=rr*Math.PI*2;assetLayer.add(a);n++;
  });return n;
}
function roadside(c){
  const {osmData,roadStyle,world,terrainY,pvGraphics,hash}=c;
  const ways=(osmData?.elements||[]).filter(e=>['primary','secondary','tertiary'].includes(e.tags?.highway)&&e.geometry?.length>1);
  let lights=0,poles=0,capL=pvGraphics?.mobile?28:60,capP=pvGraphics?.mobile?14:32;
  for(const w of ways){
    const st=roadStyle(w.tags||{}),ps=w.geometry.map(g=>world(g.lon,g.lat));
    for(let i=1;i<ps.length&&(lights<capL||poles<capP);i++)sample(ps[i-1],ps[i],96,p=>{
      const side=(lights+poles)%2?1:-1,ox=-p.uz*(st.w/2+2.0)*side,oz=p.ux*(st.w/2+2.0)*side;
      if(lights<capL&&hash(`light${w.id}-${i}-${lights}`)>.18){
        const a=clone('pv_streetlight_A',.5);if(a){a.position.set(p.x+ox,terrainY(p.x+ox,p.z+oz)+.7,p.z+oz);a.rotation.y=Math.atan2(p.ux,p.uz);assetLayer.add(a);lights++;}
      }else if(poles<capP){
        const a=clone('pv_powerpole_A',.5);if(a){a.position.set(p.x-ox,terrainY(p.x-ox,p.z-oz)+.5,p.z-oz);a.rotation.y=Math.atan2(p.ux,p.uz);assetLayer.add(a);poles++;}
      }
    });
  }return{lights,poles};
}
function promenadeProps(c){
  const {osmData,mergeCoast,polyLen,terrainY,pvGraphics,hash}=c;
  const main=mergeCoast((osmData?.elements||[]).filter(e=>e.tags?.natural==='coastline')).sort((a,b)=>polyLen(b)-polyLen(a))[0];
  if(!main)return{bins:0,bollards:0,seawall:0};
  let bins=0,bollards=0,seawall=0,capS=pvGraphics?.mobile?30:64;
  for(let i=1;i<main.length&&seawall<capS;i++)sample(main[i-1],main[i],8.1,p=>{
    if(seawall>=capS||p.x<-520||p.x>160||p.z<-880||p.z>880)return;
    const a=clone('pv_seawall_A',.5);if(!a)return;a.position.set(p.x,Math.max(.15,terrainY(p.x,p.z)-.05),p.z);a.rotation.y=-Math.atan2(p.uz,p.ux);assetLayer.add(a);seawall++;
    if(seawall%5===0&&bollards<(pvGraphics?.mobile?8:18)){
      const b=clone('pv_bollard_A',.5);if(b){b.position.set(p.x-p.uz*2.1,terrainY(p.x-p.uz*2.1,p.z+p.ux*2.1)+.15,p.z+p.ux*2.1);assetLayer.add(b);bollards++;}
    }
    if(seawall%9===0&&bins<(pvGraphics?.mobile?4:10)){
      const rr=hash('bin'+seawall),b=clone('pv_bin_A',rr);if(b){b.position.set(p.x-p.uz*3.2,terrainY(p.x-p.uz*3.2,p.z+p.ux*3.2)+.15,p.z+p.ux*3.2);b.rotation.y=rr*Math.PI*2;assetLayer.add(b);bins++;}
    }
  });return{bins,bollards,seawall};
}
export function rebuildPVAssets(ctx){
  if(!ready||!assetLayer)return{buildings:0,details:0,palms:0,lights:0,poles:0,seawall:0,bins:0,bollards:0};
  clear();
  const b=replaceBuildings(ctx),r=roadside(ctx),p=promenadeProps(ctx);
  const s={buildings:b.buildings,details:b.details,palms:palms(ctx),lights:r.lights,poles:r.poles,seawall:p.seawall,bins:p.bins,bollards:p.bollards};
  window.pvAssetStats=s;return s;
}
export function assetsReady(){return ready;}
