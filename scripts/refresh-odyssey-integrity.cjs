/* Refresh derived checksums only. A release must not advertise an earlier card hash.
 * Refuses to change a single card, artwork, or coverage entry. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../public/mtgtools/odyssey/data');
const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'));
const hash=c=>crypto.createHash('sha256').update(JSON.stringify(c)).digest('hex');
const current=read('odyssey-data.json'),candidate=read('odyssey-analysis-candidate-v2.json'),release=read('release.json');
const before=JSON.stringify([current.cards,current.artworks,current.coverage,candidate.cards]);
assert.deepEqual(candidate.cards,current.cards,'Candidate 2 diverged; do not silently retarget it.');
for(const d of [current,candidate]){assert.equal(d.integrity.sha256Scope,'cards-json-stringify-utf8-v1');d.integrity.sha256=hash(d.cards);}
candidate.candidate.productionDatasetVersion=current.datasetVersion;
release.version=current.datasetVersion;release.cardsSha256=current.integrity.sha256;
assert.equal(before,JSON.stringify([current.cards,current.artworks,current.coverage,candidate.cards]));
for(const [name,d]of [['odyssey-data.json',current],['odyssey-analysis-candidate-v2.json',candidate],['release.json',release]]){
 const file=path.join(dir,name),old=fs.readFileSync(file,'utf8'),pretty=old.includes('\n  "');fs.writeFileSync(file,JSON.stringify(d,null,pretty?2:undefined)+(old.endsWith('\n')?'\n':''));
}
fs.writeFileSync(path.join(dir,'odyssey-data.js'),'window.ODYSSEY_DATA='+JSON.stringify(current)+';\n');
console.log(JSON.stringify({version:current.datasetVersion,cardsSha256:current.integrity.sha256,cardAndArtEntriesUnchanged:true}));
