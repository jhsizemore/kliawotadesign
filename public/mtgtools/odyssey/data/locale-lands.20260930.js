/* One ten-card Odyssey dual-land cycle. The five overlapping rare duals are
 * archived in retired-dual-archive.20260930.json and await new designs.
 */
(function(root){
'use strict';
const PAIRS={70:'WU',71:'UB',143:'BR',267:'RG',268:'GW',269:'WB',270:'UR',271:'BG',272:'RW',273:'GU'};
const LOCALE_NAMES={270:'Windward Isle',271:'Asphodel Mire'};
const RETIRED=new Set([72,193,194,195,196]);
const RESERVE={
 72:{name:'Temple of Poseidon',story:'A coastal sanctuary to the god who opposes the homeward voyage.',cycleIds:['group.gods','cast.poseidon']},
 193:{name:'Tomb of Achilles',story:'The burial and remembrance of Achilles after the fighting at Troy.',cycleIds:['story.trojan-war-and-youth']},
 194:{name:'Sacred Grove of Persephone',story:'A shadowed grove suggesting passage between the living world and the dead.',cycleIds:['story.underworld','cast.persephone']},
 195:{name:'Temple Ruins',story:'The ruins of a sanctuary become a sign of time and fading divine favor.',cycleIds:['flavor.greek-concepts']},
 196:{name:"Naiads' Grotto",story:'Book XIII / the grotto on Ithaca shelters the gifts Odysseus brings home.',cycleIds:['story.return-disguise']}
};
const MARKER='one-locale-scry-cycle-20260930';
const RESERVE_REASON='Former overlapping dual design archived; story and artwork slot reserved for a new non-dual design.';
function updateSheetRows(sync){
 if(!Array.isArray(sync?.cardRows))return;
 for(const row of sync.cardRows){
  const n=Number(row[0]),pair=PAIRS[n];
  if(pair){
   if(LOCALE_NAMES[n])row[1]=row[14]=LOCALE_NAMES[n];
   row[9]='Tapped dual land; scry 1; color fixing';
   row[10]=`This land enters tapped.\nWhen this land enters, scry 1.\n{T}: Add {${pair[0]}} or {${pair[1]}}.`;
   row[26]='11';
  }else if(RETIRED.has(n)){
   const d=RESERVE[n];
   row[1]=row[14]=d.name;row[8]='New';row[9]=row[10]=row[11]='';
   row[12]=row[29]=row[36]=d.story;row[13]='REVISE';
   row[15]=row[16]='';row[21]=d.cycleIds.join('; ');row[26]='0';
   row[30]='YES';row[31]='To be sourced for redesign';row[37]='';row[38]=RESERVE_REASON;
  }else continue;
  if(!String(row[27]||'').includes(MARKER))row[27]=[row[27],MARKER].filter(Boolean).join(' · ');
 }
 if(sync.META?.templeSanctuaries)sync.META.templeSanctuaries={...sync.META.templeSanctuaries,mainAssignments:0,reserveCandidates:10};
}
function apply(data){
 if(!data||!Array.isArray(data.cards))return data;
 for(const card of data.cards){
  const n=Number(card.number),pair=PAIRS[n];
  if(pair){
   if(LOCALE_NAMES[n])card.name=card.displayName=LOCALE_NAMES[n];
   card.rules=`This land enters tapped.\nWhen this land enters, scry 1.\n{T}: Add {${pair[0]}} or {${pair[1]}}.`;
   card.mechanics='Tapped dual land; scry 1; color fixing';
   card.functionalWords=11;
   card.rulesSource='Odyssey locale scry cycle · 2026-09-30';
  }else if(RETIRED.has(n)){
   card.name=RESERVE[n].name;
   card.displayName=RESERVE[n].name;
   card.origin='NEW';card.originFull='New';card.underlyingName='';card.treatment='';
   card.story=RESERVE[n].story;card.storyTarget=RESERVE[n].story;
   card.storyRethemeRequired=true;card.storySourceBand='To be sourced for redesign';
   card.flavorStoryElement=RESERVE[n].story;card.archetypes='';
   card.rules='';
   card.mechanics='';
   card.pt='';
   card.status='REVISE';
   card.designDisposition='REASSIGN';
   card.functionalWords=0;
   card.flavorMatchScore=null;
   card.flavorMatchRationale=RESERVE_REASON;
   card.rulesSource='Retired dual skeleton · archived 2026-09-30';
   card.cycleIds=RESERVE[n].cycleIds;
  }else continue;
  if(!String(card.changeStatus||'').includes(MARKER))card.changeStatus=[card.changeStatus,MARKER].filter(Boolean).join(' · ');
 }
 data.localeCycle={id:'cycle.odyssean-locales',name:'Odyssey locales',count:10,rarity:'C',rulesType:'Land',sharedAbility:'This land enters tapped. When this land enters, scry 1.',numbers:Object.keys(PAIRS).map(Number),names:Object.fromEntries(Object.keys(PAIRS).map(n=>[n,data.cards.find(c=>Number(c.number)===Number(n)).displayName]))};
 data.emptySlots={revision:MARKER,count:RETIRED.size,slots:[...RETIRED],reason:'Retired duplicate rare dual designs; story and artwork held for non-dual reassignment.'};
 if(data.templeSanctuaryImport)data.templeSanctuaryImport={...data.templeSanctuaryImport,mainAssignments:0,reserveCandidates:10,status:'archived artwork and design reference'};
 data.candidate=Object.assign({},data.candidate,{landCycle:'one ten-card tapped scry dual cycle',retiredDualArchive:'retired-dual-archive.20260930.json'});
 return data;
}
root.OdysseyLocaleLands={pairs:PAIRS,retired:[...RETIRED],apply};
updateSheetRows(root.OdysseySheetSync);
if(root.ODYSSEY_DATA)root.ODYSSEY_DATA=apply(root.ODYSSEY_DATA);
if(typeof module!=='undefined'&&module.exports)module.exports={pairs:PAIRS,retired:[...RETIRED],apply};
})(typeof window!=='undefined'?window:globalThis);
