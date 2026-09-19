/* Read-only delivery layer: exact artwork identity, native full images, separate thumbnails. */
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
