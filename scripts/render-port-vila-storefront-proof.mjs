import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import {SVGRenderer} from 'three/addons/renderers/SVGRenderer.js';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body></body></html>');globalThis.document=dom.window.document;globalThis.window=dom.window;
const root='public/portvilasandbox/';
const original=fs.readFileSync(root+'assets/index-iSZdlO1J.js','utf8'),revised=fs.readFileSync(root+'assets/index-storefront-1.js','utf8');
const evidence=JSON.parse(fs.readFileSync('source/port-vila/storefront-observations-2026-09-29.json'));
const world=JSON.parse(fs.readFileSync(root+'data/world.json'));
function extract(text,name){let start=text.indexOf('function '+name+'('),p=text.indexOf('{',start),depth=0;if(start<0)throw Error(name);for(let i=p;i<text.length;i++){if(text[i]==='{')depth++;else if(text[i]==='}'&&--depth===0)return text.slice(start,i+1);}throw Error('Unclosed '+name);}
fs.mkdirSync('evidence/storefront-check',{recursive:true});
for(const [id,record] of Object.entries(evidence.buildings)) {
 const feature=world.buildings.find(f=>String(f.sourceId)===id);
 for(const phase of ['before','after']) {
  const palette=phase==='after'?{[id]:{wall:parseInt(record.palette.wall.slice(1),16),roof:parseInt(record.palette.roof.slice(1),16)}}:{};
  const context=vm.createContext({Br:THREE.Group,Wo:THREE.BoxGeometry,Ra:THREE.Mesh,ws:THREE.Shape,cc:THREE.ExtrudeGeometry,A:THREE.Vector2,MR:palette,IR:()=>null,PV_STOREFRONT_EVIDENCE:evidence});
  const text=phase==='after'?revised:original;
  vm.runInContext(['de','TR','Uz','Wz'].map(n=>extract(text,n)).join('\n')+(phase==='after'?'\n'+fs.readFileSync('scripts/port-vila-storefronts.fragment.js','utf8'):''),context);
  const levels=record.observedLevels,profile={levels,height:3.4+(levels-1)*3.2+.4,groundHeight:3.4,roofHeight:.4,lowerGround:0,evidence:{architecture:'office-bands'}};
  const material=(name,colour)=>new THREE.MeshLambertMaterial({color:colour});
  const group=context.Wz(feature,profile,0,material),scene=new THREE.Scene();scene.add(group);
  const cx=feature.centre[0],cz=feature.centre[1];
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(75,65),new THREE.MeshBasicMaterial({color:0xf2f0e9}));ground.rotation.x=-Math.PI/2;ground.position.set(cx,-.02,cz);ground.renderOrder=-100;scene.add(ground);
  scene.add(new THREE.AmbientLight(0xffffff,1.0));const sun=new THREE.DirectionalLight(0xffffff,.6);sun.position.set(cx-20,40,cz+25);scene.add(sun);
  const camera=new THREE.PerspectiveCamera(38,640/460,.1,300);camera.position.set(cx+16,26,cz+40);camera.lookAt(cx,profile.height*.38,cz);camera.updateMatrixWorld();
  // SVG has no depth buffer. Draw the ground first and only camera-facing wall
  // details over their host wall, avoiding large-triangle painter-sort artefacts.
  // These adjustments affect this diagnostic only, never the production renderer.
  const edges=context.Uz(feature.footprint);
  group.traverse(mesh=>{
   if(!mesh.isMesh||!/window|ribbon|paired|arched|sunshade|spandrel|canopy|balcony/.test(mesh.name))return;
   const edge=edges.reduce((a,b)=>context.de([mesh.position.x,mesh.position.z],a.a,a.c)<context.de([mesh.position.x,mesh.position.z],b.a,b.c)?a:b);
   const facing=(camera.position.x-mesh.position.x)*edge.nx+(camera.position.z-mesh.position.z)*edge.nz>0;
   mesh.visible=facing;mesh.renderOrder=/divider|mullion|sill/.test(mesh.name)?11:10;
  });
  const renderer=new SVGRenderer();renderer.setSize(640,460);renderer.setClearColor(0xfaf8ef,1);renderer.setQuality('high');renderer.render(scene,camera);
  fs.writeFileSync('evidence/storefront-check/'+(id==='319762715'?'fung-kuei':'aircalin')+'-'+phase+'-geometry.svg',renderer.domElement.outerHTML);
 }
}
fs.writeFileSync('evidence/storefront-check/geometry-preview-note.txt','Isolated geometry preview, not a screenshot of the live Sandbox. Real footprint and researched floor envelope; simplified lighting/materials, no full-city context, and original aerial roof treatments omitted in this diagnostic. SVG painter-order handling is diagnostic only. Compare photographed façade openings and wall palette only.\n');
console.log('Four isolated façade geometry previews rendered.');
