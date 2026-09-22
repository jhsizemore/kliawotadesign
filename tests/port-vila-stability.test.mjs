import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {deadline, openStorage, startRenderLoop} from '../public/portvilasandbox/assets/stability-runtime-1.js';
const base = new URL('../public/portvilasandbox/', import.meta.url);
const read = name => fs.readFileSync(new URL(name, base), 'utf8');

test('all reachable chunks resolve to exactly one app entry URL', () => {
  const html = read('index.html');
  const entry = html.match(/type="module"[^>]+src="([^"]+)"/)[1];
  const root = new URL(entry, 'https://example.test');
  const visited = new Set();
  const visit = url => {
    if (visited.has(url.href)) return;
    visited.add(url.href);
    const source = read(url.pathname.replace('/portvilasandbox/', ''));
    for (const match of source.matchAll(/(?:from\s*|import\s*\()(["'`])([^"'`]+)\1/g)) {
      const child = new URL(match[2], url);
      if (child.origin === root.origin && child.pathname.endsWith('.js')) visit(child);
    }
  };
  visit(root);
  const entries = [...visited].filter(url => /\/index-[^/]+\.js/.test(url));
  assert.deepEqual(entries, [root.href]);
  assert.ok([...visited].some(url => url.includes('research-stability-1')));
  assert.ok([...visited].some(url => url.includes('vision-stability-1')));
});

test('view transitions retain navigation guard state', () => {
  const source = read('assets/index-stability-1.js');
  const calls = [...source.matchAll(/window.history.replaceState\(([^,]+),/g)];
  assert.equal(calls.length, 3);
  for (const match of calls) assert.equal(match[1], 'window.history.state');
});

test('deadline rejects stalled work and accepts completed work', async () => {
  assert.equal(await deadline(Promise.resolve('loaded'), 100, 'timeout'), 'loaded');
  await assert.rejects(deadline(new Promise(() => {}), 5, 'timeout'), /timeout/);
});

test('blocked storage rejects and closes a subsequently opened connection', async () => {
  const request = {};
  const prior = globalThis.indexedDB;
  globalThis.indexedDB = {open: () => request};
  try {
    const pending = openStorage();
    request.onblocked();
    await assert.rejects(pending, /busy/);
    let closed = false;
    request.result = {close() { closed = true; }};
    request.onsuccess();
    assert.ok(closed);
  } finally { globalThis.indexedDB = prior; }
});

function fixture() {
  const listeners = new Map();
  const oldWindow = globalThis.window;
  globalThis.window = {addEventListener: (name, fn) => listeners.set(name, fn)};
  const canvasEvents = new Map();
  const city = {
    quality:'balanced', finish:{},
    canvas:{addEventListener:(name,fn)=>canvasEvents.set(name,fn)},
    renderer:{setAnimationLoop(fn){this.loop=fn;}},
    setQuality(value){this.quality=value;},
  };
  return {city, listeners, canvasEvents, restore(){globalThis.window=oldWindow;}};
}
test('post-processing failure retries a light frame before reporting ready', () => {
  const f = fixture(); let calls=0;
  try {
    startRenderLoop(f.city, () => {calls++; if(f.city.finish) throw Error('post');}, () => assert.fail('unnecessary fallback'));
    assert.equal(calls,2); assert.equal(f.city.quality,'low');
    assert.equal(typeof f.city.renderer.loop,'function');
  } finally {f.restore();}
});
test('failed first frame propagates to startup fallback', () => {
  const f=fixture();
  try {
    assert.throws(()=>startRenderLoop(f.city,()=>{throw Error('no GPU');},()=>{}),/no GPU/);
    assert.equal(f.city.renderer.loop,undefined);
  } finally {f.restore();}
});
test('runtime failure stops the loop and exposes recovery once', () => {
  const f=fixture(); let broken=false, failed=0;
  try {
    startRenderLoop(f.city,()=>{if(broken)throw Error('lost');},()=>failed++);
    const callback=f.city.renderer.loop;
    broken=true; callback(); callback();
    assert.equal(failed,1); assert.equal(f.city.renderer.loop,null);
  } finally {f.restore();}
});
test('context loss stops animation and exposes recovery', () => {
  const f=fixture(); let failed=0, prevented=false;
  try {
    startRenderLoop(f.city,()=>{},()=>failed++);
    f.canvasEvents.get('webglcontextlost')({preventDefault(){prevented=true;}});
    assert.equal(failed,1); assert.ok(prevented); assert.equal(f.city.renderer.loop,null);
  } finally {f.restore();}
});
test('back-forward cache restores one animation loop', () => {
  const f=fixture();
  try {
    startRenderLoop(f.city,()=>{},()=>{});
    f.listeners.get('pagehide')(); assert.equal(f.city.renderer.loop,null);
    f.listeners.get('pageshow')({persisted:true}); assert.equal(typeof f.city.renderer.loop,'function');
  } finally {f.restore();}
});
test('startup GPU failure opens usable plan state with the same scenario', () => {
  const source=read('assets/index-stability-1.js');
  const start=source.indexOf('async function kH()');
  const end=source.indexOf('kH();export',start);
  assert.ok(start>0 && end>start);
  const functions=source.slice(start,end);
  assert.ok(functions.includes('if(qV){AH();'));
  assert.ok(functions.includes('sandbox:{get selected(){return QV}'));
  assert.ok(!functions.includes('replaceState(null'));
});
test('actual startup catches an unsupported GPU and keeps map and saved proposal in plan', async () => {
  const source=read('assets/index-stability-1.js');
  const start=source.indexOf('async function kH()');
  const end=source.indexOf('kH();export',start);
  const nodes=new Map();
  const node = selector => {
    if(!nodes.has(selector)) nodes.set(selector,{hidden:false,innerHTML:'',textContent:'',remove(){this.removed=true;}});
    return nodes.get(selector);
  };
  const world={manifest:{id:'same-map'},buildings:[]};
  const saved={title:'Keep my proposal',additions:[{id:'test-addition'}],overrides:{}};
  let rendered;
  const sandbox={
    console:{error(){}}, window:{},document:{body:{dataset:{}}},location:{search:''},URLSearchParams,
    $:node,pvLoadMap:async()=>world,pvDeadline:deadline,dR:async()=>saved,nR:()=>({}),
    rR:()=>({scenario:saved,readOnly:false}),iR:class{constructor(current){this.current=current;}},
    bH(){},DH(){},GV:'view',XV:true,CH(){},QV:null,rH:null,cH:false,fH(){},
    LV:class{async init(){throw Error('GPU not available');}},
    RV:class{constructor(map){assert.equal(map,world);}},
    gH(){rendered=sandbox.YV.current;},
  };
  vm.createContext(sandbox);vm.runInContext(source.slice(start,end),sandbox);
  await sandbox.kH();
  assert.equal(sandbox.document.body.dataset.view,'plan');
  assert.equal(rendered,saved);
  assert.equal(nodes.get('#loading').removed,true);
  assert.equal(typeof sandbox.window.sandbox.select,'function');
});
