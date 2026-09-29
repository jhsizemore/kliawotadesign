const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const base='public/mtgtools/odyssey/';const ctx={console};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
for(const file of ['data/odyssey-data.js','live-sheet-sync.js','live-sheet-art-patch.js','data/landscape-import.20260929.js','landscape-library.js'])vm.runInContext(fs.readFileSync(base+file,'utf8'),ctx);
const snapshot=JSON.stringify(ctx.ODYSSEY_DATA),count=ctx.ODYSSEY_DATA.artworks.length;
for(const file of ['data/biome-atlas.20260929.js','biome-navigation.js'])vm.runInContext(fs.readFileSync(base+file,'utf8'),ctx);
const api=ctx.OdysseyBiomeAtlas,data=api.atlas,entries=data.artworks;
assert.equal(data.profiles.length,32);assert.equal(new Set(data.profiles.map(x=>x.code)).size,32);assert.equal(data.artworks.length,count);assert.equal(JSON.stringify(ctx.ODYSSEY_DATA),snapshot);
assert.equal(api.canonical('GUR'),'URG');assert.equal(api.canonical('unknown'),'');assert.equal(api.canonical('C'),'C');
const result=[];for(const p of data.profiles){const exact={color:p.code,family:'',review:'fits',match:'exact'};const fits=entries.filter(a=>api.matches(a,exact));assert.equal(fits.length,p.fitIds.length,p.code+' fit mismatch');assert(fits.every(a=>a.reviewedFits.includes(p.code)));const linked=entries.filter(a=>api.matches(a,{...exact,review:'linked'}));assert(linked.length>=fits.length);result.push({color:p.code,fits:fits.length,linked:linked.length});}
const empty=entries.find(a=>a.isLandscape&&!a.primaryColor&&!a.reviewedFits.length&&!a.studies.includes('C'));assert(empty);assert.equal(api.matches(empty,{color:'C',family:'',review:'linked',match:'exact'}),false,'Unclassified leaked into colourless');
assert(entries.filter(a=>api.matches(a,{color:'G',family:'',review:'linked',match:'contains'})).length>=entries.filter(a=>api.matches(a,{color:'G',family:'',review:'linked',match:'exact'})).length);
assert.equal(entries.filter(a=>api.matches(a,{color:'WUBRG',family:'',review:'fits',match:'exact'})).length,0,'Five colours falsely reports completed scene');
const app=fs.readFileSync(base+'app.html','utf8'),tools=fs.readFileSync(base+'artwork-tools.js','utf8');assert(app.includes('biome-navigation.js'));assert(tools.includes('root.OdysseyBiomeAtlas.matches(a)'));assert(fs.readFileSync(base+'landscape-library.html','utf8').includes('legacyBiomeFilters'));
fs.writeFileSync('biome-atlas-report/tests.json',JSON.stringify({passed:true,artworks:count,cards:ctx.ODYSSEY_DATA.cards.length,protectedDataUnchanged:true,allProfilesTested:result},null,2));console.log('All 32 colour profiles and data preservation tests passed.');
