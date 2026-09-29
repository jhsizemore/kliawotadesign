/* Public snapshot for everyone. A geometry-only Studio projection enables a clearly
 * labelled same-browser author preview; private editor drafts are never read here. */
(function(root){
'use strict';
const P=root.OdysseyPlacement,choice=new URLSearchParams(location.search).get('placementPreview');
let published=P.empty(),effective=P.empty(),loading=false,lastApplied='',timer,mode='public',localCount=0;
function localProjection(){
 if(choice==='0')return null;
 try{
  const value=JSON.parse(localStorage.getItem(P.PREVIEW_CACHE)||'null');
  if(value?.schema===P.SCHEMA&&value.authorPreview===true)return P.snapshot(value.snapshot);
  if(choice==='1'){const older=JSON.parse(localStorage.getItem(P.CACHE)||'null');if(older?.schema===P.SCHEMA){const result=P.snapshot(older.remote);for(const d of Object.values(older.drafts||{}))if(P.valid(d.after))result.records[P.key(d.after)]=P.normalize(d.after);return result;}}
 }catch(_){}
 return null;
}
function paint(){
 if(!document.body)return;
 let banner=document.getElementById('placementAuthorNotice');
 if(mode==='local'&&localCount){
  if(!banner){banner=document.createElement('aside');banner.id='placementAuthorNotice';banner.className='placement-preview-banner';banner.setAttribute('role','status');document.body.append(banner);}
  banner.replaceChildren();const text=document.createElement('span');text.textContent='YOUR STUDIO FRAMING PREVIEW · '+localCount+' saved placements from this browser. Only you see unpublished crops. ';
  const studio=document.createElement('a');studio.href='/mtgtools/odyssey/';studio.textContent='Publish with Artwork sync in Studio';
  const publicView=document.createElement('a'),u=new URL(location.href);u.searchParams.set('placementPreview','0');publicView.href=u;publicView.textContent='View the public version';banner.append(text,studio,document.createTextNode(' · '),publicView);
 }else if(banner)banner.remove();
 const status=document.getElementById('placementStatus');if(status){
  const count=Object.keys(published.records).length;
  status.textContent=mode==='local'?'Your saved Studio framing is being previewed on these cards. Publish in Studio to share it with everyone.':document.documentElement.dataset.placementStatus==='unavailable'?'Artwork placement service is unavailable. The last loaded published placement is retained.':count?count+' published artwork placements loaded. Saved framing is applied only to matching artwork and faces.':'Artwork framing: no Studio placements have been published yet. Cards currently use the candidate file’s default framing.';
 }
}
function apply(){const local=localProjection();localCount=local?Object.keys(local.records).length:0;mode=localCount?'local':'public';effective=localCount?{...published,records:{...published.records,...local.records}}:published;
 root.ODYSSEY_PUBLIC_PLACEMENT=effective;const fingerprint=JSON.stringify(effective);if(fingerprint!==lastApplied){root.OdysseyStudioRenderer?.setPlacements(effective);lastApplied=fingerprint;}
 document.documentElement.dataset.placementMode=mode;paint();
}
async function refresh(){if(loading||document.hidden)return;loading=true;try{const r=await fetch(P.API,{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Placement service returned '+r.status);published=P.snapshot(await r.json());document.documentElement.dataset.placementStatus='published';}catch(_){document.documentElement.dataset.placementStatus='unavailable';}finally{loading=false;apply();}}
apply();refresh();document.addEventListener('DOMContentLoaded',paint,{once:true});document.addEventListener('odyssey:exhibition-ready',apply);document.addEventListener('odyssey:focused-launch-ready',apply);
root.addEventListener('storage',e=>{if(e.key===P.PREVIEW_CACHE||(choice==='1'&&e.key===P.CACHE))apply();});
root.addEventListener('focus',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});timer=setInterval(refresh,60000);root.addEventListener('pagehide',()=>clearInterval(timer));
root.OdysseyScryPlacement={refresh,apply,get published(){return published;},get effective(){return effective;},get preview(){return mode==='local';}};
})(window);
