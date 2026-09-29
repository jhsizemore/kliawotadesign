/* The exact published candidate that Studio loads, excluding browser drafts.
 * Source order is checked against the Studio app before building. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const FILES=['data/odyssey-data.js','data/reminder-review.20260927a.js','live-sheet-sync.js','live-sheet-art-patch.js'];
function assemble(root){
 const dir=path.join(root,'public/mtgtools/odyssey'),app=fs.readFileSync(path.join(dir,'app.html'),'utf8');let last=-1;
 const sandbox={window:{},structuredClone};vm.createContext(sandbox);const sources=[];
 for(const file of FILES){const at=app.indexOf('/mtgtools/odyssey/'+file+'?');if(at<last||at<0)throw Error('Candidate source order differs from Studio: '+file);last=at;const src=fs.readFileSync(path.join(dir,file),'utf8');sources.push({file,sha256:crypto.createHash('sha256').update(src).digest('hex')});vm.runInContext(src,sandbox,{timeout:5000,filename:file});}
 const data=JSON.parse(JSON.stringify(sandbox.window.ODYSSEY_DATA));
 if(!data?.cards?.length||new Set(data.cards.map(c=>c.id)).size!==data.cards.length)throw Error('Invalid candidate card identities');
 if(data.sources?.cardFile?.id!=='1-OTRpW8vrSJWcXcL06l3eMJESwFtt6hQqCEl9J3sdEE'||data.sources.cardFile.sheet!=='Card File v1.0 Candidate')throw Error('Unexpected candidate authority');
 data.publicCandidate={schema:'odyssey-public-candidate/v1',status:'candidate',label:'Current candidate file',sourceSheet:data.sources.cardFile,sourceVersion:data.datasetVersion,sourceFingerprint:crypto.createHash('sha256').update(JSON.stringify(sources)).digest('hex'),cardsSha256:crypto.createHash('sha256').update(JSON.stringify(data.cards)).digest('hex'),sources};
 return data;
}
function build({root=path.resolve(__dirname,'..'),check=false}={}){const data=assemble(root),out=path.join(root,'public/mtgtools/odyssey/data/odyssey-public-candidate.json'),text=JSON.stringify(data,null,2)+'\n';if(check){if(!fs.existsSync(out)||fs.readFileSync(out,'utf8')!==text)throw Error('Published candidate is stale. Run npm run build:renderer.');}else fs.writeFileSync(out,text);return data;}
module.exports={FILES,assemble,build};if(require.main===module){const d=build({check:process.argv.includes('--check')});console.log(JSON.stringify({candidate:d.datasetVersion,cards:d.cards.length,artworks:d.artworks.length,fingerprint:d.publicCandidate.sourceFingerprint}));}
