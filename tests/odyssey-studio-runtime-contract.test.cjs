'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {FILES,sourceOrder,summarize,assembleRuntime}=require('../scripts/odyssey-studio-runtime-contract.cjs');
const root=path.resolve(__dirname,'..'),app=fs.readFileSync(path.join(root,'public/mtgtools/odyssey/app.html'),'utf8');

test('fresh Studio runtime expectations include the landscape and sanctuary overlays',()=>{
 const data=assembleRuntime(root),summary=summarize(data);
 assert.deepEqual(summary,{version:'2026-09-29.1',cards:309,artworks:883,coverage:309,newArt:330,assigned:309});
 const sync=require('../public/mtgtools/odyssey/live-sheet-sync.js').META;
 assert.notEqual(summary.version,sync.version);
 assert.notEqual(summary.artworks,sync.artworks);
 assert.equal(new Set(data.artworks.map(a=>a.id)).size,summary.artworks);
 assert.equal(data.landscapeImport.conflicts.length,0);
});

test('runtime contract fails when a required layer is omitted or reordered',()=>{
 assert.doesNotThrow(()=>sourceOrder(app));
 assert.throws(()=>sourceOrder(app.replace('data/landscape-import.20260929.js?v=landscapes2','removed.js')),/source order/);
 const first=FILES[0],second=FILES[1];
 assert.throws(()=>sourceOrder(app.replace(first,'TEMP-SOURCE').replace(second,first).replace('TEMP-SOURCE',second)),/source order/);
});

test('runtime composition is repeatable and the artwork verifier checks every derived count',()=>{
 assert.deepEqual(assembleRuntime(root),assembleRuntime(root));
 const source=fs.readFileSync(path.join(root,'scripts/odyssey-production-artwork.py'),'utf8');
 assert.match(source,/odyssey-studio-runtime-contract\.cjs/);
 assert.match(source,/for key,value in expected_runtime\.items\(\):assert runtime\[key\]==value/);
 assert.doesNotMatch(source,/expected=\{'version':sync_meta\['version'\]/);
});
