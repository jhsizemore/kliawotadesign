'use strict';
// Verify the fresh Studio composition, including its additive artwork catalogues.
// This is read-only and never loads browser drafts or updates a card record.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const FILES=['data/odyssey-data.js','data/reminder-review.20260927a.js','live-sheet-sync.js','live-sheet-art-patch.js','data/notes-resolution.20260929.js','data/recast-bones.20260930.js','data/landscape-import.20260929.js','landscape-library.js','data/temple-sanctuaries.20260929.js','temple-sanctuaries.js','data/locale-lands.20260930.js','data/reassigned-rare-slots.20260930.js'];
function sourceOrder(app){
 const actual=[...app.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(m=>new URL(m[1],'https://example.test/mtgtools/odyssey/').pathname.replace('/mtgtools/odyssey/','')).filter(f=>FILES.includes(f));
 if(JSON.stringify(actual)!==JSON.stringify(FILES))throw Error('Studio dataset source order changed; review the runtime contract');
}
function summarize(data){return {version:data.datasetVersion,cards:data.cards.length,artworks:data.artworks.length,coverage:data.coverage.length,newArt:data.artworks.filter(a=>Number(String(a.id||'').replace('ART-',''))>553).length,assigned:data.cards.filter(c=>c.primaryArt).length};}
function assembleRuntime(root=path.resolve(__dirname,'..')){
 const dir=path.join(root,'public/mtgtools/odyssey'),app=fs.readFileSync(path.join(dir,'app.html'),'utf8');
 sourceOrder(app);
 const sandbox={window:{},structuredClone};vm.createContext(sandbox);
 for(const file of FILES)vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),sandbox,{filename:file,timeout:5000});
 const initialization=app.match(/^const ODYSSEY_DATASET=[^\n]+/m)?.[0];
 if(!initialization)throw Error('Studio dataset initialization missing');
 // A fresh browser context has no saved dataset, so loadOdysseyDataset returns the bundle.
 vm.runInContext('const loadOdysseyDataset=()=>window.ODYSSEY_DATA;\n'+initialization+'\nthis.runtimeData=ODYSSEY_DATASET;',sandbox,{timeout:5000});
 return JSON.parse(JSON.stringify(sandbox.runtimeData));
}
module.exports={FILES,sourceOrder,summarize,assembleRuntime};
if(require.main===module)console.log(JSON.stringify(summarize(assembleRuntime())));
