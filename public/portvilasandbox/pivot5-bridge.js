'use strict';
pvAssetMod=null;
ensurePVAssets=async function(){
  try{
    if(!pvAssetMod)pvAssetMod=await import('./pivot5-assets.js?v=5-1');
    const ok=await pvAssetMod.setupPVAssets(pvAssetContext());
    if(!ok)return null;
    const s=pvAssetMod.rebuildPVAssets(pvAssetContext());
    document.title='Port Vila Sandbox — Visual Pivot 5';
    const badge=document.querySelector('.title b');if(badge)badge.textContent='VISUAL PIVOT 5';
    const label=document.querySelector('aside .label');if(label)label.textContent='VISUAL PIPELINE · STAGE 5';
    const h=document.querySelector('aside h2');if(h)h.textContent='Higher-detail Port Vila asset world';
    const p=document.querySelector('aside p');if(p)p.textContent=`The v0.2 glTF kit adds building variants, rooftop services, power poles, containers, promenade furniture and a second palm family. This graphics profile placed ${s.buildings} kit buildings, ${s.details} detail props, ${s.palms} palms, ${s.lights} streetlights, ${s.poles} power poles and ${s.seawall} seawall modules.`;
    const hint=document.querySelector('.hint');if(hint)hint.textContent='© OpenStreetMap contributors · Terrain Tiles / Mapzen on AWS · Port Vila glTF kit v0.2';
    return s;
  }catch(e){console.warn('Pivot 5 asset pipeline fallback',e);return null;}
};
const _pvStatus=$('status');
if(_pvStatus){
  const fix=()=>{if(_pvStatus.textContent.startsWith('Pivot 4'))_pvStatus.textContent=_pvStatus.textContent.replace('Pivot 4','Pivot 5');};
  new MutationObserver(fix).observe(_pvStatus,{childList:true,characterData:true,subtree:true});
  fix();
}
