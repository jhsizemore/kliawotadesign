"""Guarded Odyssey performance patch. Card data and saved-edit namespaces are untouched."""
from pathlib import Path
import re, json, base64, hashlib
ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'public/mtgtools/odyssey'
p=APP/'app.html';s=p.read_text()
alreadyApplied='const imageRequestQueue=' in s
CORE=r'''/* Read-only delivery layer: exact artwork identity, native full images, separate thumbnails. */
(function(root){
 'use strict';
 const manifest=root.ODYSSEY_ARTWORK_MANIFEST||{artworks:{}};
 const memo=new WeakMap();
 function entry(art,data=manifest){
  if(!art||typeof art!=='object')return null;
  if(data===manifest&&memo.has(art))return memo.get(art);
  const row=data.artworks?.[art.id];
  const found=row&&row.status==='verified'&&row.source===art.source&&row.title===art.title?row:null;
  if(data===manifest)memo.set(art,found);return found;
 }
 function unavailable(art,data=manifest){const row=data.artworks?.[art?.id];return !!(row&&row.source===art.source&&row.title===art.title&&row.status!=='verified');}
 function safeAsset(url){return typeof url==='string'&&/^\/mtgtools\/odyssey\/assets\/artwork\/ART-\d+\.[a-f0-9]{12}\.(full|thumb)\.(webp|jpg)$/.test(url)?url:'';}
 function safeExternal(url){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch(_){return '';}}
 function full(art,data=manifest){const e=entry(art,data);return e?(safeAsset(e.full?.url)||safeExternal(e.originalUrl)):'';}
 function thumb(art,data=manifest){const e=entry(art,data);return e?(safeAsset(e.thumb?.url)||full(art,data)):'';}
 function dimensions(art,url,data=manifest){const e=entry(art,data);if(!e||!url||url!==full(art,data))return null;const w=e.full?.width||e.width,h=e.full?.height||e.height;return w>0&&h>0?{w,h,via:'decoded-source-audit'}:null;}
 function freshFailure(failure,now=Date.now(),ttl=120000){const t=Date.parse(failure?.at||'');return Number.isFinite(t)&&now>=t&&now-t<ttl;}
 function createQueue(limit=4){
  limit=Math.max(1,Math.min(8,Number(limit)||4));let active=0;const pending=[],inflight=new Map();
  function pump(){while(active<limit&&pending.length){const job=pending.shift();active++;Promise.resolve().then(job.task).then(job.resolve,job.reject).finally(()=>{active--;inflight.delete(job.key);pump();});}}
  return {run(key,task){if(inflight.has(key))return inflight.get(key);const promise=new Promise((resolve,reject)=>pending.push({key,task,resolve,reject}));inflight.set(key,promise);pump();return promise;},get active(){return active;},get size(){return inflight.size;}};
 }
 const api={entry,full,thumb,dimensions,unavailable,freshFailure,createQueue};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.OdysseyArtDelivery=api;
})(typeof window!=='undefined'?window:globalThis);
'''
(APP/'artwork-delivery.js').write_text(CORE)
# Externalize exact existing symbol bytes; never redraw or alter the Greek symbols.
m=re.search(r'const MANA_PIP_DATA=(\{[^\n]+\});',s);assert m,'Greek symbol table not found'
pips=json.loads(m.group(1));out={}
for key,value in pips.items():
 if value.startswith('/mtgtools/odyssey/assets/mana-pips/'):out[key]=value;continue
 assert value.startswith('data:image/png;base64,')
 raw=base64.b64decode(value.split(',',1)[1],validate=True);assert raw.startswith(b'\x89PNG\r\n\x1a\n')
 name=key+'.'+hashlib.sha256(raw).hexdigest()[:12]+'.png'
 dest=APP/'assets/mana-pips'/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw)
 out[key]='/mtgtools/odyssey/assets/mana-pips/'+name
s=s[:m.start()]+'const MANA_PIP_DATA='+json.dumps(out,separators=(',',':'))+';'+s[m.end():]
# Slim, content-addressed manifest; full diagnostics stay out of the editor's boot path.
mf=APP/'data/artwork-manifest.json';assert mf.exists(),'Run source audit first'
manifest=json.loads(mf.read_text());slim={k:manifest[k] for k in ['schema','revision','checkedAt','summary']};slim['artworks']={}
for key,row in manifest['artworks'].items():
 slim['artworks'][key]={k:row[k] for k in ['id','title','source','status','delivery','originalUrl','width','height','full','thumb'] if k in row}
text='window.ODYSSEY_ARTWORK_MANIFEST='+json.dumps(slim,ensure_ascii=False,separators=(',',':'))+';\n'
manifest_name='artwork-delivery-manifest.'+hashlib.sha256(text.encode()).hexdigest()[:12]+'.js'
(APP/'data'/manifest_name).write_text(text)
header='<script src="/mtgtools/odyssey/data/'+manifest_name+'"></script>\n<script src="/mtgtools/odyssey/artwork-delivery.js?v=20260919-1"></script>\n'
if 'artwork-delivery.js?v=' not in s:
 anchor='<script src="/mtgtools/odyssey/data/odyssey-data.js?v=20260919-live2"></script>';assert anchor in s;s=s.replace(anchor,header+anchor,1)
else:s=re.sub(r'/data/artwork-delivery-manifest\.[a-f0-9]+\.js','/data/'+manifest_name,s)
def function(name,new):
 global s
 if alreadyApplied:return
 match=re.search(r'^(?:async )?function '+name+r'\([^\n]*\n',s,re.M)
 assert match,name+' missing or no longer single-line; inspect before changing'
 s=s[:match.start()]+new.strip()+'\n'+s[match.end():]
if 'const imageRequestQueue=' not in s:
 s=s.replace("const ART_DIM_CACHE_KEY='ody_art_dimensions_v06';","const imageRequestQueue=OdysseyArtDelivery.createQueue(4), imageProbes=new Map();\nlet candidateUsageCache=null,candidateUsageResolver=null,artCacheTimer=0;\nconst ART_DIM_CACHE_KEY='ody_art_dimensions_v06';",1)
function('saveArtCaches',r'''function saveArtCaches(){if(!artCacheTimer)artCacheTimer=setTimeout(flushArtCaches,250)}
function flushArtCaches(){clearTimeout(artCacheTimer);artCacheTimer=0;try{localStorage.setItem(ART_URL_CACHE_KEY,JSON.stringify(resolvedArtUrls));localStorage.setItem(ART_FAIL_CACHE_KEY,JSON.stringify(failedArtUrls));localStorage.setItem(ART_BAD_CACHE_KEY,JSON.stringify(badArtUrls));localStorage.setItem(ART_DIM_CACHE_KEY,JSON.stringify(artImageDims))}catch(_){} }''')
function('isBadUrl',r'''function isBadUrl(id,u){const k=badKeyUrl(u);return OdysseyArtDelivery.freshFailure(badArtUrls[id]?.[k])}''')
function('staticArtCandidates',r'''function staticArtCandidates(a){if(!a)return[];const verified=OdysseyArtDelivery.full(a),row=OdysseyArtDelivery.entry(a);const vals=[verified,resolvedArtUrls[a.id],a.imageUrl,KNOWN_IMAGE_URLS[a.id],row?.originalUrl,...ngaOfficialUrls(a.id)];for(const u of [...vals]){const orig=wikimediaOriginalUrl(u);if(orig&&orig!==u)vals.push(orig)}return dedupeUrls(vals).filter(u=>!isBadUrl(a.id,u))}''')
function('dimensionsFor',r'''function dimensionsFor(m){const u=imageForArt(m);return u?(artImageDims[u]||OdysseyArtDelivery.dimensions(artById[m.artId],u)):null}''')
function('probeImage',r'''function probeImage(url,timeout=16000){
 if(!url)return Promise.reject(new Error('No image URL'));
 if(imageProbes.has(url))return imageProbes.get(url);
 const job=new Promise((resolve,reject)=>{
  const im=new Image();im.decoding='async';im.referrerPolicy='no-referrer';
  const clean=()=>{clearTimeout(timer);im.onload=im.onerror=null;};
  const timer=setTimeout(()=>{clean();im.src='';reject(new Error('Image probe timed out'));},timeout);
  im.onload=()=>{const w=im.naturalWidth,h=im.naturalHeight;clean();if(!w||!h){reject(new Error('Empty image'));return;}cacheImageDimensions(url,w,h);resolve({w,h});};
  im.onerror=()=>{clean();reject(new Error('Image could not be loaded'));};im.src=url;
 }).finally(()=>imageProbes.delete(url));imageProbes.set(url,job);return job;
}''')
function('resolveArtUrl',r'''async function resolveArtUrl(a,force=false){
 if(!a)throw new Error('No artwork record');
 if(OdysseyArtDelivery.unavailable(a))throw new Error('The collection currently publishes no usable image for '+a.id+'. The source record is preserved; no substitute artwork was assigned.');
 const existing=directArtUrl(a.id);if(existing&&!force)return existing;
 return imageRequestQueue.run(a.id,async()=>{
  try{
   const tried=new Set();let lastError;
   const attempt=async urls=>{for(const u of urls){if(tried.has(u)||isBadUrl(a.id,u))continue;tried.add(u);try{await probeImage(u);resolvedArtUrls[a.id]=u;clearBadUrl(a.id,u);delete failedArtUrls[a.id];saveArtCaches();return u;}catch(error){lastError=error;markBadUrl(a.id,u,error.message);}}return '';};
   let u=await attempt(staticArtCandidates(a));
   if(!u){try{u=await attempt(dedupeUrls(await providerCandidates(a)));}catch(error){lastError=error;}}
   if(!u)throw lastError||new Error('No verified image available for '+a.id);return u;
  }catch(error){failedArtUrls[a.id]={message:String(error.message||error),at:new Date().toISOString()};saveArtCaches();throw error;}
 });
}''')
function('bindImageQuality',r'''function bindImageQuality(img,m){artViewModels.set(img,m);img.decoding='async';img.referrerPolicy='no-referrer';requestAnimationFrame(()=>applyArtView(img,m));img.onload=()=>{if(!img.isConnected)return;img.style.display='block';img.style.opacity='1';cacheImageDimensions(img.currentSrc||img.src,img.naturalWidth,img.naturalHeight);clearBadUrl(m.artId,img.currentSrc||img.src);try{applyArtView(img,m)}catch(_){}updateResolveUI();};img.onerror=()=>{img.closest('.artbox')?.classList.remove('has-loaded-art');if(img.dataset.recovering==='1'||!img.isConnected)return;recoverBrokenArtImage(img,m,img.currentSrc||img.src);};if(img.complete&&img.naturalWidth>0)img.onload();}''')
function('candidateThumbUrl',r'''function candidateThumbUrl(id){return OdysseyArtDelivery.thumb(artById[id])||directArtUrl(id)}''')
function('qualityCounts',r'''function qualityCounts(){let measured=0,excluded=0;const uses=new Map();for(const c of CARDS){const m=model(c.number);if(!m.artId)continue;const group=uses.get(m.artId)||[];group.push(m);uses.set(m.artId,group);}for(const a of ART){const u=directArtUrl(a.id),d=u&&(artImageDims[u]||OdysseyArtDelivery.dimensions(a,u));if(d?.w){measured++;const refs=uses.get(a.id)||[];if(refs.length&&!refs.some(m=>!qualityAssessment(m).sourceExcluded))excluded++;}}return{measured,excluded};}''')
function('candidateUsage',r'''function candidateUsage(){if(candidateUsageCache&&candidateUsageResolver===effectiveCandidateIds)return candidateUsageCache;const use={};CARDS.forEach(c=>effectiveCandidateIds(c.number).forEach(id=>{(use[id]??=[]).push(c.number)}));candidateUsageResolver=effectiveCandidateIds;return candidateUsageCache=use;}''')
function('uniqueArtGapCards',r'''function uniqueArtGapCards(){const use=candidateUsage();return CARDS.filter(c=>!effectiveCandidateIds(c.number).some(id=>(use[id]||[]).length===1)).map(c=>c.number)}''')
function('uniqueArtCounts',r'''function uniqueArtCounts(){const gaps=uniqueArtGapCards().length;return{covered:CARDS.length-gaps,gaps,total:CARDS.length}}''')
s=s.replace('function renderPreview(){if(previewCropCleanup)','function renderPreview(){candidateUsageCache=null;if(previewCropCleanup)',1)
s=s.replace('function save(){localStorage.setItem(STORAGE,JSON.stringify(overrides));}','function save(){candidateUsageCache=null;localStorage.setItem(STORAGE,JSON.stringify(overrides));}',1)
# Thumbnail errors must not blacklist the independent, full-resolution file.
start=s.index("$('artOptionsGrid').querySelectorAll('img[data-art-thumb]').forEach");end=s.index(';if(resolveMissing)',start)
s=s[:start]+r'''$('artOptionsGrid').querySelectorAll('img[data-art-thumb]').forEach(img=>{img.decoding='async';img.referrerPolicy='no-referrer';img.onerror=()=>{if(!img.isConnected)return;const fallback=directArtUrl(img.dataset.artThumb);if(img.dataset.recovering!=='1'&&fallback&&badKeyUrl(fallback)!==badKeyUrl(img.src)){img.dataset.recovering='1';img.src=fallback;}else{img.style.display='none';img.closest('.art-option-thumb')?.classList.add('image-unavailable');}}})'''+s[end:]
s=re.sub(r'(?:decoding="async" )*data-art-thumb="\$\{esc\(id\)\}" src=','decoding="async" data-art-thumb="${esc(id)}" src=',s)
s=s.replace('isNew=!isArtSeen(id),low=candidateSourceExcluded(id,m);','isNew=!isArtSeen(id),unavailable=OdysseyArtDelivery.unavailable(a),low=candidateSourceExcluded(id,m);',1)
s=s.replace("${low?'disabled title=\"Excluded: source below print minimum\"':''}","${unavailable?'disabled title=\"The museum currently publishes no image; source record retained\"':low?'disabled title=\"Excluded: source below print minimum\"':''}",1)
s=s.replace("${!url?'<span class=\"art-option-resolving\">resolving…</span>':''}","${unavailable?'<span class=\"art-option-resolving\">Source has no image</span>':!url?'<span class=\"art-option-resolving\">resolving…</span>':''}",1)
s=s.replace('ordered.filter(id=>!candidateThumbUrl(id)&&artById[id])','ordered.filter(id=>!candidateThumbUrl(id)&&artById[id]&&!OdysseyArtDelivery.unavailable(artById[id]))',1)
anchor='uiIntegrityCheck();';assert anchor in s
seed="ART.forEach(a=>{const u=OdysseyArtDelivery.full(a),d=OdysseyArtDelivery.dimensions(a,u);if(d&&!artImageDims[u])artImageDims[u]=d;});\nwindow.addEventListener('pagehide',flushArtCaches);\n"
if "window.addEventListener('pagehide',flushArtCaches)" not in s:s=s.replace(anchor,seed+anchor,1)
p.write_text(s)
# Cache normalized search metadata and debounce text input.
a=APP/'artwork-tools.js';art=a.read_text()
if 'const searchFieldCache =' not in art:
 anchor='  function artworkSearchScore(art, query) {'
 helper="""  const searchFieldCache = new WeakMap();
  function searchFields(art) {
    if (!art || typeof art !== 'object') return {title:'',tags:'',candidates:'',artist:'',rest:''};
    if (searchFieldCache.has(art)) return searchFieldCache.get(art);
    const fields={title:normalize(art.title),tags:normalize(art.tags),candidates:normalize(art.candidateCards),artist:normalize(art.artist),rest:artworkSearchText(art)};
    searchFieldCache.set(art,fields); return fields;
  }
"""
 assert anchor in art;art=art.replace(anchor,helper+anchor,1)
 before="""    const fields = {
      title: normalize(art && art.title), tags: normalize(art && art.tags), candidates: normalize(art && art.candidateCards),
      artist: normalize(art && art.artist), rest: artworkSearchText(art)
    };"""
 assert before in art;art=art.replace(before,'    const fields = searchFields(art);',1)
 before="""        tools.querySelector('#artOptionSearch').addEventListener('input', event => {
          artSearchQuery = event.target.value;
          root.renderArtOptions(false);
        });"""
 after="""        let searchTimer = 0;
        tools.querySelector('#artOptionSearch').addEventListener('input', event => {
          artSearchQuery = event.target.value;
          clearTimeout(searchTimer);
          searchTimer = setTimeout(() => {
            if(document.getElementById('artOptionsOverlay')?.classList.contains('open')) root.renderArtOptions(false);
          }, 100);
        });"""
 assert before in art;art=art.replace(before,after,1)
 art=art.replace("const VERSION = '3.18';","const VERSION = '3.19';",1);a.write_text(art)
index=APP/'index.html';idx=index.read_text().replace('app.html?v=20260919-16','app.html?v=20260919-17').replace('artwork-tools.js?v=20260918-4','artwork-tools.js?v=20260919-1');index.write_text(idx)
headers=ROOT/'public/_headers';h=headers.read_text() if headers.exists() else ''
if '/mtgtools/odyssey/assets/artwork/*' not in h:
 h+='\n/mtgtools/odyssey/assets/artwork/*\n  Cache-Control: public, max-age=31536000, immutable\n  X-Content-Type-Options: nosniff\n\n/mtgtools/odyssey/assets/mana-pips/*\n  Cache-Control: public, max-age=31536000, immutable\n  X-Content-Type-Options: nosniff\n';headers.write_text(h)
release=APP/'data/release.json';r=json.loads(release.read_text());r['appRevision']='artwork-performance-v1';r['artworkDelivery']=manifest['summary'];release.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
test=ROOT/'tests/odyssey-release.test.cjs';t=test.read_text().replace(r'/app\.html\?v=20260919-16/',r'/app\.html\?v=20260919-17/');test.write_text(t)
print(json.dumps({'appBytes':p.stat().st_size,'manifestBytes':len(text.encode()),'manaAssets':len(out),'artworkDelivery':manifest['summary']},indent=2))
