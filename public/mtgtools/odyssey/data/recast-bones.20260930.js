/* Recast candidates, 30 Sep 2026.
 * Their prior complete designs live in recast-archive.20260930.json.
 * Keep structural slots and story/art direction; leave playable text open.
 */
(function(root){
'use strict';
const NUMBERS=[14,154,160,165,167,216,241,275,283,285,290,297];
const SET=new Set(NUMBERS);
function apply(data){
 if(!data||!Array.isArray(data.cards))return data;
 for(const card of data.cards){
  if(!SET.has(Number(card.number)))continue;
  card.rules='';
  card.mechanics='';
  card.pt='';
  card.flavor='';
  card.status='REVISE';
  card.designDisposition='RECAST';
  card.functionalWords=0;
  card.flavorMatchScore=null;
  card.flavorMatchRationale='Prior design archived; structural slot retained for a new design.';
  card.artReviewRequired=true;
  card.rulesSource='Recast skeleton · archived 2026-09-30';
  if(!String(card.changeStatus||'').includes('recast-archived-20260930'))card.changeStatus=[card.changeStatus,'recast-archived-20260930'].filter(Boolean).join(' · ');
  if(Number(card.number)===154){
   card.origin='NEW';card.originFull='New';card.underlyingName='';card.treatment='';
  }
 }
 data.generatedAt='2026-09-30T00:00:00.000Z';
 data.candidate=Object.assign({},data.candidate,{latestReleaseAt:data.generatedAt,productionFilesModified:true,recastArchive:'recast-archive.20260930.json'});
 return data;
}
root.OdysseyRecastBones={numbers:NUMBERS,apply};
if(root.ODYSSEY_DATA)root.ODYSSEY_DATA=apply(root.ODYSSEY_DATA);
if(typeof module!=='undefined'&&module.exports)module.exports={numbers:NUMBERS,apply};
})(typeof window!=='undefined'?window:globalThis);
