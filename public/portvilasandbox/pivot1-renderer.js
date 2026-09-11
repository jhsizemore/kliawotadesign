'use strict';
let pvGraphics=null,pvWaterFrame=0,pvEnvRT=null,pvSkyTexture=null,pvSun=null,pvPost=null,pvAO=null,pvPostEnabled=false;

function detectGraphicsProfile(){
  const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<820;
  const mem=Number(navigator.deviceMemory||4),cores=Number(navigator.hardwareConcurrency||4),dpr=devicePixelRatio||1;
  const name=!mobile&&mem>=8&&cores>=8?'high':(mobile||mem<=4||cores<=4?'mobile':'balanced');
  return {name,mobile,pixelRatio:name==='high'?Math.min(dpr,1.9):name==='balanced'?Math.min(dpr,1.55):Math.min(dpr,1.25),samples:name==='high'?4:2,shadowMap:name==='high'?2048:1024,waterSegments:name==='high'?96:name==='balanced'?72:48,waterNormalEvery:name==='high'?2:name==='balanced'?3:5};
}

function makeSkyTexture(){
  const w=pvGraphics.name==='high'?1024:512,h=w/2,cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const ctx=cv.getContext('2d'),img=ctx.createImageData(w,h),d=img.data;
  const zen=[70,137,191],horizon=[184,219,224],warm=[238,202,148],ground=[66,92,80];
  const sunX=.70*w,sunY=.35*h;
  for(let y=0;y<h;y++){
    const v=y/(h-1),upper=v<.5,t=upper?v/.5:(v-.5)/.5;
    for(let x=0;x<w;x++){
      let c;
      if(upper)c=zen.map((a,i)=>a+(horizon[i]-a)*Math.pow(t,.72));
      else c=horizon.map((a,i)=>a+(ground[i]-a)*Math.pow(t,.8));
      const dx=Math.min(Math.abs(x-sunX),w-Math.abs(x-sunX))/(w*.15),dy=(y-sunY)/(h*.18),r=Math.hypot(dx,dy),glow=Math.max(0,1-r);
      if(glow>0)c=c.map((a,i)=>a+(warm[i]-a)*glow*glow*.72);
      const haze=Math.max(0,1-Math.abs(v-.5)*10)*.16;c=c.map(a=>a+(232-a)*haze);
      const k=(y*w+x)*4;d[k]=Math.max(0,Math.min(255,c[0]));d[k+1]=Math.max(0,Math.min(255,c[1]));d[k+2]=Math.max(0,Math.min(255,c[2]));d[k+3]=255;
    }
  }
  ctx.putImageData(img,0,0);const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.mapping=THREE.EquirectangularReflectionMapping;tex.needsUpdate=true;return tex;
}

async function setupEnvironment(){
  pvSkyTexture=makeSkyTexture();scene.background=pvSkyTexture;scene.backgroundIntensity=.92;scene.backgroundBlurriness=pvGraphics.mobile?.05:.025;
  scene.environmentIntensity=pvGraphics.mobile?.72:.90;
  try{
    const pmrem=new THREE.PMREMGenerator(renderer);pvEnvRT=pmrem.fromEquirectangular(pvSkyTexture);scene.environment=pvEnvRT.texture;pmrem.dispose();
  }catch(err){console.warn('PMREM environment fallback',err);scene.environment=pvSkyTexture;}
}

async function setupContactDepth(){
  try{
    const {pass,mrt,output,normalView}=await import('three/tsl');
    const {ao}=await import('three/addons/tsl/display/GTAONode.js');
    pvPost=new THREE.PostProcessing(renderer);
    const scenePass=pass(scene,camera);
    scenePass.setMRT(mrt({output,normal:normalView}));
    const color=scenePass.getTextureNode('output');
    const normal=scenePass.getTextureNode('normal');
    const depth=scenePass.getTextureNode('depth');
    pvAO=ao(depth,normal,camera);
    if(pvGraphics.name==='high'){
      pvAO.resolutionScale=.50;pvAO.samples.value=16;pvAO.radius.value=13;pvAO.thickness.value=22;pvAO.scale.value=1.0;
    }else if(pvGraphics.name==='balanced'){
      pvAO.resolutionScale=.42;pvAO.samples.value=12;pvAO.radius.value=11;pvAO.thickness.value=19;pvAO.scale.value=.95;
    }else{
      pvAO.resolutionScale=.30;pvAO.samples.value=8;pvAO.radius.value=8;pvAO.thickness.value=15;pvAO.scale.value=.85;
    }
    pvAO.distanceExponent.value=2.0;pvAO.distanceFallOff.value=.82;
    const strength=pvGraphics.name==='high'?.62:pvGraphics.name==='balanced'?.54:.42;
    const aoFactor=pvAO.getTextureNode().r.mul(strength).add(1-strength);
    pvPost.outputNode=color.mul(aoFactor);
    pvPostEnabled=true;
  }catch(err){
    pvPostEnabled=false;console.warn('GTAO post-processing fallback',err);
  }
}

function makePhysicalWater(){
  const geo=new THREE.PlaneGeometry(7000,7000,pvGraphics.waterSegments,pvGraphics.waterSegments);geo.userData.base=Float32Array.from(geo.attributes.position.array);
  waterMat=new THREE.MeshPhysicalMaterial({color:0x2f8295,roughness:.12,metalness:0,clearcoat:1,clearcoatRoughness:.10,ior:1.333,reflectivity:.55,transparent:true,opacity:.94,side:THREE.DoubleSide,depthWrite:true});
  waterMesh=new THREE.Mesh(geo,waterMat);waterMesh.rotation.x=-Math.PI/2;waterMesh.position.y=-.65;waterMesh.name='water-pbr';waterMesh.receiveShadow=true;scene.add(waterMesh);
}
function updatePhysicalWater(t){
  if(!waterMesh?.visible)return;const g=waterMesh.geometry,p=g.attributes.position,b=g.userData.base;if(!b)return;
  for(let i=0;i<p.count;i++){const x=b[i*3],y=b[i*3+1];p.setZ(i,Math.sin(x*.010+t*.62)*.34+Math.sin(y*.015-t*.47)*.22+Math.sin((x+y)*.006+t*.28)*.15)}
  p.needsUpdate=true;if(++pvWaterFrame%pvGraphics.waterNormalEvery===0)g.computeVertexNormals();
}

function tuneMaterial(m,obj){
  if(!m||m.isSpriteMaterial||m.isLineBasicMaterial)return;
  if(m.isMeshPhysicalMaterial&&obj===waterMesh)return;
  if(m.isMeshStandardMaterial||m.isMeshPhysicalMaterial){
    const hex=m.color?.getHex?.()??0;
    const dark=((hex>>16)&255)+((hex>>8)&255)+(hex&255)<300;
    if(obj?.parent===G?.roads||obj?.parent===G?.urban){m.roughness=Math.max(.88,m.roughness??.9);m.metalness=0;}
    else if((m.roughness??1)<.7){m.roughness=Math.max(.48,m.roughness);m.metalness=Math.max(.08,m.metalness||0);}
    else{m.roughness=Math.min(.9,Math.max(.72,m.roughness??.82));m.metalness=0;}
    if(dark&&m.color)m.color.multiplyScalar(1.04);
    m.needsUpdate=true;
  }
}
function tuneWorldMaterials(){
  scene.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>tuneMaterial(m,o));if(o!==waterMesh&&o.parent===G?.buildings){o.castShadow=true;o.receiveShadow=true;}});
}
function wrapRefresh(){
  if(typeof refreshAll!=='function'||refreshAll._pivot3)return;const prior=refreshAll;refreshAll=function(){prior();tuneWorldMaterials();};refreshAll._pivot3=true;
}

function rendererLabel(){const b=renderer?.backend;return b?.isWebGPUBackend?'WebGPU':b?.isWebGLBackend?'WebGL 2 fallback':navigator.gpu?'WebGPU / auto':'WebGL 2 fallback'}
function startPivotLoop(){renderer.setAnimationLoop(ms=>{updatePhysicalWater(ms*.001);cameraUpdate();if(pvPostEnabled&&pvPost)pvPost.render();else renderer.render(scene,camera)})}
function updatePivotUI(){
  document.title='Port Vila Sandbox — Visual Pivot 3';
  const badge=document.querySelector('.title b');if(badge)badge.textContent='VISUAL PIVOT 3';
  const label=document.querySelector('aside .label');if(label)label.textContent='VISUAL PIPELINE · STAGE 3';
  const h=document.querySelector('aside h2');if(h)h.textContent='Contact depth + grounded city';
  const p=document.querySelector('aside p');if(p)p.textContent='Screen-space ground-truth ambient occlusion now adds contact depth where buildings meet streets and terrain, scaled by device profile so the city reads as a physical place rather than floating GIS geometry.';
  const loadH=document.querySelector('.loadcard h1');if(loadH)loadH.textContent='Building contact depth…';
  const hint=document.querySelector('.hint');if(hint)hint.textContent='© OpenStreetMap contributors · Terrain Tiles / Mapzen on AWS · profile-scaled GTAO contact shading';
}

async function init(){
  updatePivotUI();pvGraphics=detectGraphicsProfile();scene=new THREE.Scene();scene.background=new THREE.Color(0xa9bdc0);scene.fog=new THREE.FogExp2(0xa8bdbe,pvGraphics.mobile?.00046:.00034);camera=new THREE.PerspectiveCamera(46,innerWidth/innerHeight,1,7000);
  renderer=new THREE.WebGPURenderer({canvas,antialias:true,samples:pvGraphics.samples,alpha:false});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(pvGraphics.pixelRatio);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=pvGraphics.mobile?1.04:1.12;if(renderer.shadowMap)renderer.shadowMap.enabled=true;await renderer.init();
  await setupEnvironment();raycaster=new THREE.Raycaster();
  scene.add(new THREE.HemisphereLight(0xcfe5e5,0x596454,pvGraphics.mobile?.72:.58));
  pvSun=new THREE.DirectionalLight(0xffdfad,pvGraphics.mobile?4.0:4.8);pvSun.position.set(-1150,1500,-820);pvSun.castShadow=true;pvSun.shadow.mapSize.set(pvGraphics.shadowMap,pvGraphics.shadowMap);pvSun.shadow.camera.left=-1700;pvSun.shadow.camera.right=1700;pvSun.shadow.camera.top=1700;pvSun.shadow.camera.bottom=-1700;pvSun.shadow.camera.near=200;pvSun.shadow.camera.far=3500;pvSun.shadow.bias=-.00008;pvSun.shadow.normalBias=.035;scene.add(pvSun);
  const skyFill=new THREE.DirectionalLight(0x9fc9d4,pvGraphics.mobile?.22:.28);skyFill.position.set(900,650,1050);scene.add(skyFill);
  const warmBounce=new THREE.DirectionalLight(0xd9b78b,pvGraphics.mobile?.10:.16);warmBounce.position.set(250,180,-700);scene.add(warmBounce);
  ['terrain','urban','roads','buildings','labels','shore','waterFX'].forEach(group);makePhysicalWater();wrapRefresh();bindControls();bindUI();cameraUpdate();await setupContactDepth();startPivotLoop();
  Promise.resolve(load()).finally(()=>{tuneWorldMaterials();const n=$('idstat')?.textContent||'—';$('status').textContent=`Pivot 3 · ${rendererLabel()} · ${pvGraphics.name} · AO ${pvPostEnabled?'on':'fallback'}${n!=='—'?` · ${n} identified`:''}`});
}
