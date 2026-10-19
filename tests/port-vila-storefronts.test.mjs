import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import * as THREE from 'three';
const site='public/portvilasandbox/';
const original=fs.readFileSync(site+'assets/index-iSZdlO1J.js','utf8');
const revised=fs.readFileSync(site+'assets/index-storefront-1.js','utf8');
const evidence=JSON.parse(fs.readFileSync('source/port-vila/storefront-observations-2026-09-29.json'));
const world=JSON.parse(fs.readFileSync(site+'data/world.json'));
function extract(text,name){let start=text.indexOf('function '+name+'(');assert.ok(start>=0,name);let p=text.indexOf('{',start),depth=0;for(let i=p;i<text.length;i++){if(text[i]==='{')depth++;else if(text[i]==='}') {depth--;if(depth===0)return text.slice(start,i+1);}}throw Error('Unclosed '+name)}
const adapter={Br:THREE.Group,Wo:THREE.BoxGeometry,Ra:THREE.Mesh,ws:THREE.Shape,cc:THREE.ExtrudeGeometry,A:THREE.Vector2,MR:{},IR:()=>null,PV_STOREFRONT_EVIDENCE:evidence};
function factory(text,overlay){const context=vm.createContext({...adapter});const src=['de','TR','Uz','Wz'].map(n=>extract(text,n)).join('\n')+(overlay?'\n'+fs.readFileSync('scripts/port-vila-storefronts.fragment.js','utf8'):'');vm.runInContext(src,context);return context;}
const before=factory(original,false),after=factory(revised,true);
const mat=(name,colour)=>new THREE.MeshBasicMaterial({color:colour});
const feature=id=>world.buildings.find(b=>String(b.sourceId)===id);
const profile=(levels)=>({levels,height:levels*3.3+.4,groundHeight:3.3,roofHeight:.4,lowerGround:0,evidence:{}});
function meshes(g){const a=[];g.traverse(m=>{if(m.isMesh)a.push(m)});return a;}
function dispose(g){for(const m of meshes(g)){m.geometry.dispose();m.material.dispose();}}
test('pristine release and world checksum retained',()=>{assert.equal(crypto.createHash('sha256').update(original).digest('hex'),'d320752f376c178925127817f057842046671e5c8d3293ae560b117b0b705a5e');assert.equal(world.manifest.checksum,evidence.baselineChecksum);assert.ok(!revised.includes('__pvEngine'));});
test('two scoped buildings get 9 paired windows / 4 ribbons; shell envelopes unchanged',()=>{for(const [id,r] of Object.entries(evidence.buildings)){const f=feature(id),p=profile(r.observedLevels),old=before.Wz(f,p,2,mat),next=after.Wz(f,p,2,mat),m=meshes(next);assert.equal(m.filter(x=>/^paired-window-\d/.test(x.name)).length,id==='319762715'?9:0);assert.equal(m.filter(x=>/^ribbon-window-/.test(x.name)).length,id==='332685581'?4:0);assert.equal(m.filter(x=>x.name==='observed-arched-opening').length,id==='319762715'?1:0);for(const shell of meshes(old).filter(x=>/^storey-shell-|^floor-slab-|roof-parapet/.test(x.name))){const changed=next.getObjectByName(shell.name);assert.ok(changed);assert.deepEqual(Array.from(changed.geometry.attributes.position.array),Array.from(shell.geometry.attributes.position.array));assert.deepEqual(changed.position.toArray(),shell.position.toArray());}dispose(old);dispose(next);}});
test('legacy upper mullions removed only from observed Aircalin faces',()=>{const f=feature('332685581'),p=profile(3),g=after.Wz(f,p,3,mat),edges=after.Uz(f.footprint),floors=after.TR(p);for(const m of meshes(g).filter(x=>x.name==='window-mullion'&&x.position.y>3+floors[0].top)){assert.ok(![2,3].some(i=>after.de([m.position.x,m.position.z],edges[i].a,edges[i].c)<1.3&&Math.abs(Math.sin(m.rotation.y-edges[i].yaw))<.015));}assert.ok(meshes(g).some(m=>m.name==='window-mullion'));dispose(g);});
test('demolished, edited levels, edited footprints and unrelated buildings bypass overlay',()=>{const f=feature('319762715');for(const [obj,p] of [[f,profile(0)],[f,profile(2)],[{...f,footprint:f.footprint.map(([x,z])=>[x+.01,z])},profile(4)],[{...f,sourceId:'unknown'},profile(4)]]){const g=after.Wz(obj,p,2,mat);assert.ok(!g.getObjectByName('photo-matched-facade'));dispose(g);}});
test('new details follow foundation base without sinking or floating',()=>{const f=feature('319762715'),p=profile(4),a=after.Wz(f,p,0,mat),b=after.Wz(f,p,10,mat);const aa=a.getObjectByName('photo-matched-facade').children,bb=b.getObjectByName('photo-matched-facade').children;assert.equal(aa.length,bb.length);aa.forEach((m,i)=>assert.ok(Math.abs(bb[i].position.y-m.position.y-10)<1e-9));dispose(a);dispose(b);});
test('release module graph is internally consistent and old chunks retained',()=>{const build=JSON.parse(fs.readFileSync(site+'BUILD.json'));assert.equal(build.version,'0.1.25');assert.ok(build.districtTiles.length>80);for(const asset of build.assets){assert.ok(fs.existsSync(site+asset));if(!asset.endsWith('.js'))continue;const text=fs.readFileSync(site+asset,'utf8');for(const old of ['index-iSZdlO1J.js','research-CJAMIhjN.js','research-data-DXfJnZDb.js','vision-CScsXS3G.js'])assert.ok(!text.includes(old),asset+' imports '+old);}assert.ok(fs.readFileSync(site+'index.html','utf8').includes('index-storefront-1.js'));});
