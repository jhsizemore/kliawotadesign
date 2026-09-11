let landmarkLayer=null,lifeLayer=null;
let landmarkStats={landmarks:0,vehicles:0,trees:0};

const LANDMARKS=[
  {key:'market',label:'Port Vila Market',lon:168.31397,lat:-17.74017,match:/market/i,make:makeMarket},
  {key:'cathedral',label:'Sacré-Cœur Cathedral',lon:168.315347,lat:-17.734626,match:/cathedral|sacr[eé]|sacred heart/i,make:makeCathedral},
  {key:'parliament',label:'Vanuatu Parliament',lon:168.31524,lat:-17.74546,match:/parliament|parlement/i,make:makeParliament}
];

function M(THREE,name,color,rough=.8,metal=0){const m=new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});m.name=name;return m}
function addBox(THREE,g,name,mat,sx,sy,sz,x,y,z,ry=0,rz=0){const o=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mat);o.name=name;o.scale.set(sx,sy,sz);o.position.set(x,y,z);o.rotation.set(0,ry,rz);o.castShadow=o.receiveShadow=true;g.add(o);return o}
function addCyl(THREE,g,name,mat,rt,rb,h,rad,x,y,z,ry=0,rz=0){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,rad),mat);o.name=name;o.position.set(x,y,z);o.rotation.set(0,ry,rz);o.castShadow=o.receiveShadow=true;g.add(o);return o}
function addTriPrism(THREE,g,name,mat,w,h,d,x,y,z){const sh=new THREE.Shape();sh.moveTo(-w/2,0);sh.lineTo(w/2,0);sh.lineTo(0,h);sh.closePath();const geo=new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false});geo.translate(0,0,-d/2);const o=new THREE.Mesh(geo,mat);o.name=name;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o}

function baseMats(THREE){return{
  white:M(THREE,'concreteWhite',0xd7d4ca,.87,0), warm:M(THREE,'concreteWarm',0xb8aa91,.84,0),
  cool:M(THREE,'concreteCool',0xaab3af,.84,0), dark:M(THREE,'metalDark',0x273235,.48,.18),
  roof:M(THREE,'metalRoof',0x9b5a46,.46,.18), roofSilver:M(THREE,'metalRoof',0x95a7aa,.42,.22),
  glass:M(THREE,'glass',0x223b42,.16,.1), timber:M(THREE,'timber',0x6e5135,.82,0),
  leaf:M(THREE,'leaf',0x3f6d3a,.9,0), leaf2:M(THREE,'leafLight',0x5a824b,.9,0),
  stallA:M(THREE,'awning',0xdca54e,.75,0),stallB:M(THREE,'awning',0x4c7890,.75,0),stallC:M(THREE,'awning',0xa94e3d,.75,0)
}}

function makeMarket(THREE){
  const g=new THREE.Group();g.name='landmark_market';const m=baseMats(THREE);
  const zs=[-8,-4,0,4,8];
  for(const z of zs){
    addBox(THREE,g,'marketColumn',m.cool,.7,5.4,.7,-8.3,2.7,z);
    addBox(THREE,g,'marketColumn',m.cool,.7,5.4,.7,8.3,2.7,z);
    const arch=new THREE.Mesh(new THREE.TorusGeometry(8.3,.43,8,32,Math.PI),m.cool);arch.name='marketArch';arch.position.set(0,5.25,z);arch.castShadow=arch.receiveShadow=true;g.add(arch);
  }
  addBox(THREE,g,'roofL',m.roofSilver,9.5,.32,19,-4.25,9.05,0,0,.32);
  addBox(THREE,g,'roofR',m.roofSilver,9.5,.32,19,4.25,9.05,0,0,-.32);
  addBox(THREE,g,'ridge',m.dark,.35,.35,19,0,10.45,0);
  const stalls=[[-5,-5,m.stallA],[-1.7,-5,m.stallB],[2,-5,m.stallC],[5.2,-5,m.stallA],[-5,0,m.stallC],[-1.7,0,m.stallA],[2,0,m.stallB],[5.2,0,m.stallC],[-4.2,5,m.stallB],[0,5,m.stallC],[4.2,5,m.stallA]];
  for(const [x,z,mat] of stalls){addBox(THREE,g,'marketTable',m.timber,2.5,.55,1.4,x,.85,z);addBox(THREE,g,'marketProduce',mat,2.2,.28,1.15,x,1.25,z)}
  return {group:g,dims:{x:18,z:19,y:10.7}};
}

function makeCathedral(THREE){
  const g=new THREE.Group();g.name='landmark_cathedral';const m=baseMats(THREE);
  addBox(THREE,g,'cathedralBody',m.white,19,5.4,13,0,2.7,0);
  addBox(THREE,g,'facadeScreen',m.dark,15.5,4.5,.22,0,4.6,-6.62);
  for(let x=-7;x<=7;x+=2.3)addBox(THREE,g,'screenMullion',m.white,.16,4.6,.3,x,4.6,-6.78);
  addBox(THREE,g,'porchRoof',m.white,16,.35,4.8,0,3.0,-8.5);
  for(const x of [-6,-2,2,6])addBox(THREE,g,'porchPost',m.dark,.24,3,.24,x,1.5,-9.9);
  addBox(THREE,g,'cathedralRoofMain',m.roofSilver,21,.5,15,-1.2,8.15,0,0,.27);
  addBox(THREE,g,'cathedralRoofWing',m.roofSilver,10,.42,11,6.2,6.85,1.0,0,-.17);
  addBox(THREE,g,'crossV',m.dark,.52,3.5,.28,-1.0,5.8,-6.95);
  addBox(THREE,g,'crossH',m.dark,2.3,.5,.28,-1.0,6.25,-6.95);
  return {group:g,dims:{x:21,z:20,y:11}};
}

function makeParliament(THREE){
  const g=new THREE.Group();g.name='landmark_parliament';const m=baseMats(THREE);
  addBox(THREE,g,'parliamentMain',m.white,24,3.8,9,0,1.9,0);
  addBox(THREE,g,'parliamentWingL',m.white,14,3.2,8,-18,1.6,1.3);
  addBox(THREE,g,'parliamentWingR',m.white,14,3.2,8,18,1.6,1.3);
  addBox(THREE,g,'roofMain',m.roof,25,.38,10,0,4.15,0);
  addBox(THREE,g,'roofL',m.roof,15,.35,9,-18,3.85,1.3);
  addBox(THREE,g,'roofR',m.roof,15,.35,9,18,3.85,1.3);
  addBox(THREE,g,'entryGlass',m.glass,7,2.7,.18,0,1.55,-4.62);
  for(const x of [-3.1,-1.05,1.05,3.1])addBox(THREE,g,'porticoColumn',m.white,.35,3.5,.35,x,1.75,-6.0);
  addTriPrism(THREE,g,'porticoPediment',m.white,9,3.1,2.3,0,3.5,-6.15);
  addCyl(THREE,g,'flagPole',m.dark,.09,.12,10,8,0,5,-13);
  addBox(THREE,g,'monumentBase',m.cool,3.1,.7,1.5,-7,.35,-12.2);
  addCyl(THREE,g,'figure1',m.dark,.28,.35,2.6,7,-7.5,2,-12.2);
  addCyl(THREE,g,'figure2',m.dark,.28,.35,2.35,7,-6.4,1.9,-12.1);
  for(let x=-21;x<=21;x+=3)addBox(THREE,g,'hedge',m.leaf,2.2,1.15,1.2,x,.58,-10.0);
  return {group:g,dims:{x:50,z:16,y:8.5}};
}

function findLandmarkBuilding(ctx,def){
  const {buildingMeshes,world}=ctx,target=world(def.lon,def.lat);let named=null,nearest=null,nd=Infinity;
  for(let i=0;i<buildingMeshes.length;i++){
    const b=buildingMeshes[i];if(!b?.userData)continue;const t=b.userData.t||{},name=[t.name,t['name:en'],t.operator].filter(Boolean).join(' ');
    const d=Math.hypot((b.userData.cx??b.position.x)-target.x,(b.userData.cz??b.position.z)-target.z);
    if(def.match.test(name)&&d<220){named={b,i,d};break}
    if(d<nd){nd=d;nearest={b,i,d}}
  }
  return named||(nearest&&nearest.d<95?nearest:null);
}
function footprintFrame(ctx,b){
  const {osmData,world,principal}=ctx;const w=(osmData?.elements||[]).find(e=>e.type==='way'&&String(e.id)===String(b.userData.id)&&e.geometry?.length>3);
  if(!w)return null;const ps=w.geometry.slice(0,-1).map(p=>world(p.lon,p.lat));return principal(ps,b.userData.cx,b.userData.cz);
}
function clearLayer(layer){if(!layer)return;while(layer.children.length){const o=layer.children.pop();o.traverse?.(n=>{n.geometry?.dispose?.();if(Array.isArray(n.material))n.material.forEach(m=>m.dispose?.());else n.material?.dispose?.()})}}

function rebuildLandmarks(ctx){
  const {THREE,scene,G,buildingMeshes,terrainY}=ctx;
  if(!landmarkLayer){landmarkLayer=new THREE.Group();landmarkLayer.name='landmarks';scene.add(landmarkLayer);G.landmarks=landmarkLayer}
  clearLayer(landmarkLayer);let count=0;
  for(const def of LANDMARKS){
    const found=findLandmarkBuilding(ctx,def);if(!found)continue;const base=found.b;
    if(base.userData?.landmarkBase)continue;
    const frame=footprintFrame(ctx,base);const built=def.make(THREE),obj=built.group,d=built.dims;
    if(frame){obj.scale.set(Math.max(.55,Math.min(2.8,frame.u*1.92/d.x)),1,Math.max(.55,Math.min(2.8,frame.v*1.92/d.z)));obj.rotation.y=-frame.angle}
    const cx=base.userData.cx??base.position.x,cz=base.userData.cz??base.position.z;
    obj.position.set(cx,terrainY(cx,cz)+.72,cz);
    obj.userData={...base.userData,kind:'building',asset:`landmark_${def.key}`,landmark:def.label,landmarkBase:base};
    base.visible=false;landmarkLayer.add(obj);buildingMeshes[found.i]=obj;count++;
  }
  return count;
}

function makeVehicle(THREE,type,color){
  const g=new THREE.Group();const paint=M(THREE,'vehiclePaint',color,.38,.16),glass=M(THREE,'glass',0x203942,.16,.1),rub=M(THREE,'rubber',0x111515,.92,0),metal=M(THREE,'vehicleTrim',0xc3c5c0,.34,.35);
  const bus=type==='bus',van=type==='van',L=bus?7.6:van?5.3:4.4,W=bus?2.35:van?2.05:1.85,H=bus?2.75:van?2.2:1.55;
  addBox(THREE,g,'vehicleBody',paint,W,H*.52,L,0,H*.35,0);
  addBox(THREE,g,'vehicleCabin',glass,W*.82,H*.42,L*(bus?.77:van?.62:.52),0,H*.73,bus?.15:-.25*L);
  addBox(THREE,g,'bumper',metal,W*.9,.12,.16,0,.35,-L*.52);
  const wheelGeo=new THREE.CylinderGeometry(.34,.34,.22,10);for(const sx of [-1,1])for(const sz of [-1,1]){const w=new THREE.Mesh(wheelGeo,rub);w.rotation.z=Math.PI/2;w.position.set(sx*W*.49,.34,sz*L*.34);w.castShadow=true;g.add(w)}
  return g;
}
function sampleSegment(a,b,spacing,fn){const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);if(l<spacing)return;const ux=dx/l,uz=dz/l;for(let d=spacing*.55;d<l;d+=spacing)fn({x:a.x+ux*d,z:a.z+uz*d,ux,uz})}
function rebuildVehicles(ctx){
  const {THREE,scene,G,osmData,world,roadStyle,terrainY,pvGraphics,hash}=ctx;
  if(!lifeLayer){lifeLayer=new THREE.Group();lifeLayer.name='life';scene.add(lifeLayer);G.life=lifeLayer}
  clearLayer(lifeLayer);const roads=(osmData?.elements||[]).filter(e=>e.tags?.highway&&e.geometry?.length>1&&roadStyle(e.tags||{}).vehicle);
  const cap=pvGraphics?.mobile?18:pvGraphics?.name==='high'?48:32;let n=0;
  const colors=[0xd8d3c6,0x6e8790,0x9b5743,0x3f596c,0xb8aa77,0x5d6a57,0x33393b];
  for(const w of roads){const st=roadStyle(w.tags||{});if(st.w<4.8)continue;const ps=w.geometry.map(p=>world(p.lon,p.lat));for(let i=1;i<ps.length&&n<cap;i++)sampleSegment(ps[i-1],ps[i],115,p=>{if(n>=cap)return;const r=hash(`${w.id}/veh/${n}`);if(r<.28)return;const type=r>.92?'bus':r>.78?'van':'car',v=makeVehicle(THREE,type,colors[Math.floor(r*colors.length)%colors.length]),side=r>.5?1:-1,off=(st.w*.18)*side,px=p.x-p.uz*off,pz=p.z+p.ux*off;v.position.set(px,terrainY(px,pz)+.72,pz);v.rotation.y=Math.atan2(p.ux,p.uz)+(side<0?Math.PI:0);const s=.9+hash(`${w.id}/s/${n}`)*.16;v.scale.setScalar(s);lifeLayer.add(v);n++})}
  return n;
}
function rebuildTrees(ctx){
  const {THREE,osmData,world,roadStyle,terrainY,pvGraphics,hash,isLand}=ctx;if(!lifeLayer)return 0;
  const roads=(osmData?.elements||[]).filter(e=>['primary','secondary','tertiary','residential'].includes(e.tags?.highway)&&e.geometry?.length>1);
  const cap=pvGraphics?.mobile?34:pvGraphics?.name==='high'?105:68,candidates=[];
  for(const w of roads){const st=roadStyle(w.tags||{}),ps=w.geometry.map(p=>world(p.lon,p.lat));for(let i=1;i<ps.length&&candidates.length<cap*3;i++)sampleSegment(ps[i-1],ps[i],82,p=>{const r=hash(`${w.id}/tree/${i}/${Math.round(p.x)}`);if(r<.4)return;const side=r>.7?1:-1,off=st.w/2+5+r*5,x=p.x-p.uz*off*side,z=p.z+p.ux*off*side;if((!isLand||isLand(x,z))&&Math.abs(x)<1450&&Math.abs(z)<1700)candidates.push({x,z,r})})}
  const pts=candidates.slice(0,cap),trunkGeo=new THREE.CylinderGeometry(.24,.34,4.5,6),crownGeo=new THREE.IcosahedronGeometry(1.8,1),trunkMat=M(THREE,'timber',0x6c5138,.86,0),crownMat=M(THREE,'leaf',0x457242,.9,0),trunks=new THREE.InstancedMesh(trunkGeo,trunkMat,pts.length),crowns=new THREE.InstancedMesh(crownGeo,crownMat,pts.length),mat4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),pos=new THREE.Vector3();trunks.name='broadleafTrunks';crowns.name='broadleafCrowns';trunks.castShadow=trunks.receiveShadow=crowns.castShadow=crowns.receiveShadow=true;
  pts.forEach((p,i)=>{const s=.72+p.r*.55,y=terrainY(p.x,p.z);pos.set(p.x,y+2.25*s,p.z);sc.set(s,s,s);mat4.compose(pos,q,sc);trunks.setMatrixAt(i,mat4);pos.set(p.x,y+5.0*s,p.z);sc.set(s*(.9+p.r*.25),s*(.8+p.r*.25),s*(.9+p.r*.25));mat4.compose(pos,q,sc);crowns.setMatrixAt(i,mat4);crowns.setColorAt(i,new THREE.Color().setHSL(.28+p.r*.035,.35,.32+p.r*.09))});trunks.instanceMatrix.needsUpdate=crowns.instanceMatrix.needsUpdate=true;if(crowns.instanceColor)crowns.instanceColor.needsUpdate=true;lifeLayer.add(trunks,crowns);return pts.length;
}

export function rebuildPivot7(ctx){
  const l=rebuildLandmarks(ctx),v=rebuildVehicles(ctx),t=rebuildTrees(ctx);landmarkStats={landmarks:l,vehicles:v,trees:t};window.pvLandmarkStats=landmarkStats;return landmarkStats;
}
export function getPivot7Stats(){return landmarkStats}
