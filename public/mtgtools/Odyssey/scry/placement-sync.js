/* Public cards consume only the published placement snapshot. Browser drafts are
 * read exclusively in the explicitly labelled, opt-in Studio preview. */
(function(root){
'use strict';
const P=root.OdysseyPlacement,preview=new URLSearchParams(location.search).get('placementPreview')==='1';
let published=P.empty(),timer,loading=false,lastApplied='';
function apply(){let value=published;if(preview){try{const local=JSON.parse(localStorage.getItem(P.CACHE)||'null');if(local?.schema===P.SCHEMA){const base=P.snapshot(local.remote);value={...base,records:{...base.records}};for(const d of Object.values(local.drafts||{}))if(P.valid(d.after))value.records[P.key(d.after)]=d.after;}}catch(_){}}
 root.ODYSSEY_PUBLIC_PLACEMENT=value;const fingerprint=JSON.stringify(value);if(fingerprint!==lastApplied){root.OdysseyStudioRenderer?.setPlacements(value);lastApplied=fingerprint;}
}
async function refresh(){if(loading||document.hidden)return;loading=true;try{const r=await fetch(P.API,{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Placement service returned '+r.status);published=P.snapshot(await r.json());document.documentElement.dataset.placementStatus='published';apply();}catch(e){document.documentElement.dataset.placementStatus='unavailable';/* Do not replace an already displayed crop on an outage. */}finally{loading=false;}}
if(preview){const banner=document.createElement('div');banner.setAttribute('role','status');banner.textContent='LOCAL ARTWORK PREVIEW — saved Studio crops from this browser. Publish in Studio to show them to everyone.';banner.style.cssText='position:fixed;bottom:12px;left:12px;right:12px;z-index:9999;padding:12px;background:#181d22;color:white;border:1px solid #cfb974;font:14px system-ui;text-align:center';document.addEventListener('DOMContentLoaded',()=>document.body.append(banner),{once:true});root.addEventListener('storage',e=>{if(e.key===P.CACHE)apply();});}
apply();refresh();document.addEventListener('odyssey:exhibition-ready',apply);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});root.addEventListener('focus',refresh);timer=setInterval(refresh,60000);root.addEventListener('pagehide',()=>clearInterval(timer));
root.OdysseyScryPlacement={refresh,get published(){return published;},preview};
})(window);
