'use strict';
let pvSurfaceMod=null;
const pvSurfaceContext=()=>({THREE,scene,G,pvGraphics});
async function pvApplySurfaces(){try{if(!pvSurfaceMod)pvSurfaceMod=await import('./pivot6-materials.js?v=6-1');const s=pvSurfaceMod.applySurfacePass(pvSurfaceContext());window.pvSurfaceStats=s;return s;}catch(e){console.warn('Pivot 6 surface fallback',e);return null;}}
const _pv5Ensure=ensurePVAssets;
ensurePVAssets=async function(){const s=await _pv5Ensure();await pvApplySurfaces();document.title='Port Vila Sandbox — Visual Pivot 6';const badge=document.querySelector('.title b');if(badge)badge.textContent='VISUAL PIVOT 6';const label=document.querySelector('aside .label');if(label)label.textContent='VISUAL PIPELINE · STAGE 6';const h=document.querySelector('aside h2');if(h)h.textContent='Weathered tropical materials + microdetail';const p=document.querySelector('aside p');if(p){const q=window.pvSurfaceStats;p.textContent=`Procedural surface maps now add concrete weathering, corrugated metal, asphalt grain, paving, timber, vegetation and reflective shop glass across the same reusable asset world${q?` · ${q.materials} materials enhanced`:''}.`;}return s;};
const _pvTune=tuneWorldMaterials;
tuneWorldMaterials=function(){_pvTune();pvApplySurfaces();};
const statusEl=$('status');if(statusEl){const fix=()=>{if(/^Pivot [45]/.test(statusEl.textContent))statusEl.textContent=statusEl.textContent.replace(/^Pivot [45]/,'Pivot 6');};new MutationObserver(fix).observe(statusEl,{childList:true,characterData:true,subtree:true});fix();}
