'use strict';
let pvGraphics=null,pvWaterFrame=0;

function detectGraphicsProfile(){
  const mobile=matchMedia('(pointer:coarse)').matches||innerWidth<820;
  const mem=Number(navigator.deviceMemory||4),cores=Number(navigator.hardwareConcurrency||4),dpr=devicePixelRatio||1;
  const name=!mobile&&mem>=8&&cores>=8?'high':(mobile||mem<=4||cores<=4?'mobile':'balanced');
  return {name,mobile,pixelRatio:name==='high'?Math.min(dpr,1.9):name==='balanced'?Math.min(dpr,1.55):Math.min(dpr,1.25),samples:name==='high'?4:2,shadowMap:name==='high'?2048:1024,waterSegments:name==='high'?96:name==='balanced'?72:48,waterNormalEvery:name==='high'?2:name==='balanced'?3:5};
}
function makePhysicalWater(){
  const geo=new THREE.PlaneGeometry(7000,7000,pvGraphics.waterSegments,pvGraphics.waterSegments);
  geo.userData.base=Float32Array.from(geo.attributes.position.array);
  waterMat=new THREE.MeshPhysicalMaterial({color:0x2f8295,roughness:.16,metalness:0,clearcoat:1,clearcoatRoughness:.18,transparent:true,opacity:.96,side:THREE.DoubleSide,depthWrite:true});
  waterMesh=new THREE.Mesh(geo,waterMat);waterMesh.rotation.x=-Math.PI/2;waterMesh.position.y=-.65;waterMesh.name='water-pbr';waterMesh.receiveShadow=true;scene.add(waterMesh);
}
function updatePhysicalWater(t){
  if(!waterMesh?.visible)return;const g=waterMesh.geometry,p=g.attributes.position,b=g.userData.base;if(!b)return;
  for(let i=0;i<p.count;i++){const x=b[i*3],y=b[i*3+1];p.setZ(i,Math.sin(x*.010+t*.62)*.36+Math.sin(y*.015-t*.47)*.23+Math.sin((x+y)*.006+t*.28)*.17)}
  p.needsUpdate=true;if(++pvWaterFrame%pvGraphics.waterNormalEvery===0)g.computeVertexNormals();
}
function rendererLabel(){const b=renderer?.backend;return b?.isWebGPUBackend?'WebGPU':b?.isWebGLBackend?'WebGL 2 fallback':navigator.gpu?'WebGPU / auto':'WebGL 2 fallback'}
function startPivotLoop(){renderer.setAnimationLoop(ms=>{updatePhysicalWater(ms*.001);cameraUpdate();renderer.render(scene,camera)})}

async function init(){
  pvGraphics=detectGraphicsProfile();scene=new THREE.Scene();scene.background=new THREE.Color(0xa9bdc0);scene.fog=new THREE.FogExp2(0xa9bdc0,.00040);camera=new THREE.PerspectiveCamera(46,innerWidth/innerHeight,1,7000);
  renderer=new THREE.WebGPURenderer({canvas,antialias:true,samples:pvGraphics.samples,alpha:false});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(pvGraphics.pixelRatio);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.10;if(renderer.shadowMap)renderer.shadowMap.enabled=true;await renderer.init();
  raycaster=new THREE.Raycaster();scene.add(new THREE.HemisphereLight(0xeaf2ef,0x4c5d55,1.82));const sun=new THREE.DirectionalLight(0xffe8c0,3.8);sun.position.set(-900,1350,-720);sun.castShadow=true;sun.shadow.mapSize.set(pvGraphics.shadowMap,pvGraphics.shadowMap);sun.shadow.camera.left=-1800;sun.shadow.camera.right=1800;sun.shadow.camera.top=1800;sun.shadow.camera.bottom=-1800;sun.shadow.bias=-.00015;scene.add(sun);const fill=new THREE.DirectionalLight(0xb9d8dd,.48);fill.position.set(1000,500,900);scene.add(fill);
  ['terrain','urban','roads','buildings','labels','shore','waterFX'].forEach(group);makePhysicalWater();bindControls();bindUI();cameraUpdate();startPivotLoop();
  Promise.resolve(load()).finally(()=>{const n=$('idstat')?.textContent||'—';$('status').textContent=`Pivot 1 · ${rendererLabel()} · ${pvGraphics.name}${n!=='—'?` · ${n} identified`:''}`});
}
