const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const base=path.resolve('public/mtgtools/odyssey');
const ctx={console};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
function run(file){vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),ctx,{filename:file});}
run('data/odyssey-data.js');run('live-sheet-sync.js');run('live-sheet-art-patch.js');
const old=JSON.parse(JSON.stringify(ctx.ODYSSEY_DATA));
run('data/landscape-import.20260929.js');run('landscape-library.js');
const now=ctx.ODYSSEY_DATA,p=ctx.ODYSSEY_LANDSCAPE_IMPORT;
assert.equal(now.cards.length,309);assert.equal(now.artworks.length,836);
assert.equal(JSON.stringify(now.cards),JSON.stringify(old.cards),'Cards/assignments changed');
assert.equal(JSON.stringify(now.coverage),JSON.stringify(old.coverage),'Coverage changed');
assert.equal(new Set(now.artworks.map(a=>a.id)).size,now.artworks.length);
assert.equal(p.summary.newRecords,212);assert.equal(p.summary.enrichedExisting,8);assert.equal(p.summary.previewImages,217);
const ids=new Map(now.artworks.map(a=>[a.id,a]));
for(const a of old.artworks){assert(ids.has(a.id));for(const key of ['title','source','imageUrl','cropNotes','status'])assert.equal(ids.get(a.id)[key],a[key],a.id+' existing '+key+' changed');}
const again=ctx.OdysseyLandscapeLibrary.merge(now);assert.equal(JSON.stringify(again.artworks),JSON.stringify(now.artworks),'Merge is not idempotent');
ctx.OdysseyLandscapeLibrary.registerWithSheetSync();assert.equal(ctx.OdysseySheetSync.artRows.length,836,'Sheet-sync rows not deduplicated');
for(const a of p.artworks){if(!a.imageUrl)continue;const u=new URL(a.imageUrl);assert.equal(u.origin,'https://kliawota.design');const file=path.resolve('public'+u.pathname);assert(fs.existsSync(file),a.id+' preview missing');assert(a.imageWidth>0&&a.imageHeight>0);}
const app=fs.readFileSync(path.join(base,'app.html'),'utf8');assert(app.includes('window.OdysseyLandscapeLibrary.merge(loadOdysseyDataset())'));
const result={cards:309,artworks:836,newRecords:212,existingEnriched:8,previewImages:217,sourceOnly:3,cardAssignmentsChanged:0,coverageChanged:0,idempotent:true};
fs.mkdirSync('landscape-publication-report',{recursive:true});fs.writeFileSync('landscape-publication-report/integration-test.json',JSON.stringify(result,null,2));console.log(result);
