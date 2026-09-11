'use strict';
let pvLandmarkMod=null;
const pv7Context=()=>({THREE,scene,G,pvGraphics,buildingMeshes,osmData,world,principal,terrainY,roadStyle,hash,isLand});
async function pvApplyPivot7(){
  try{
    if(!pvLandmarkMod)pvLandmarkMod=await import('./pivot7-landmarks.js?v=7-1');
    const s=pvLandmarkMod.rebuildPivot7(pv7Context());
    if(typeof pvApplySurfaces==='function')await pvApplySurfaces();
    window.pvLandmarkStats=s;
    return s;
  }catch(e){console.warn('Pivot 7 landmark fallback',e);return null;}
}
const _pv6Ensure=ensurePVAssets;
ensurePVAssets=async function(){
  const a=await _pv6Ensure();
  const s=await pvApplyPivot7();
  document.title='Port Vila Sandbox — Visual Pivot 7';
  const badge=document.querySelector('.title b');if(badge)badge.textContent='VISUAL PIVOT 7';
  const label=document.querySelector('aside .label');if(label)label.textContent='VISUAL PIPELINE · STAGE 7';
  const h=document.querySelector('aside h2');if(h)h.textContent='Recognisable landmarks + street life';
  const p=document.querySelector('aside p');if(p){p.textContent=s?`Port Vila Market, Sacré-Cœur Cathedral and Parliament now use landmark-specific silhouettes, while this graphics profile adds ${s.vehicles} street vehicles and ${s.trees} broadleaf trees around the mapped city.`:'Landmark layer unavailable — core mapped city remains active.';}
  const hint=document.querySelector('.hint');if(hint)hint.textContent='© OpenStreetMap contributors · Terrain Tiles / Mapzen on AWS · landmark models are visual reconstructions';
  return a;
};
const _pv7Refresh=refreshAll;
refreshAll=function(){_pv7Refresh();if(pvLandmarkMod){pvLandmarkMod.rebuildPivot7(pv7Context());if(typeof pvApplySurfaces==='function')pvApplySurfaces();}};
const status7=$('status');if(status7){const fix=()=>{if(/^Pivot [456]/.test(status7.textContent))status7.textContent=status7.textContent.replace(/^Pivot [456]/,'Pivot 7');};new MutationObserver(fix).observe(status7,{childList:true,characterData:true,subtree:true});fix();}
