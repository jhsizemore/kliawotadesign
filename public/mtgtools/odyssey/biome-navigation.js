/* Habitat and colour-affinity navigation. Art-direction metadata only; never edits cards. */
(function(root){
'use strict';
const atlas=root.ODYSSEY_BIOME_ATLAS;if(!atlas)return;
const index=new Map(atlas.artworks.map(a=>[a.artId,a]));
const profiles=new Map(atlas.profiles.map(p=>[p.code,p]));
const families=new Map(atlas.families.map(f=>[f.id,f.label]));
const state={color:'',family:'',review:'linked',match:'exact'};
function canonical(value){const s=String(value||'').toUpperCase();if(s==='C')return 'C';if(!/^[WUBRG]+$/.test(s))return '';return [...'WUBRG'].filter(c=>s.includes(c)).join('');}
function hasFilters(options=state){return !!(options.color||options.family||options.review!=='linked');}
function colorMatch(actual,wanted,mode){if(!wanted)return true;if(mode!=='contains'||wanted==='C'||actual==='C')return actual===wanted;return !!actual&&[...wanted].every(c=>actual.includes(c));}
function matches(art,options=state){
 if(!hasFilters(options))return true;
 const a=index.get(art.artId||art.id);if(!a||!a.isLandscape)return false;
 const color=canonical(options.color),cm=x=>colorMatch(x,color,options.match);
 if(options.family&&!a.biomes.includes(options.family))return false;
 if(options.review==='fits')return a.reviewedFits.some(cm);
 if(options.review==='studies')return a.studies.some(cm);
 if(options.review==='suggestions')return a.review==='Metadata suggestion'&&(!color||cm(a.primaryColor));
 if(options.review==='unclassified')return !a.primaryColor&&!color;
 if(!color)return true;
 return cm(a.primaryColor)||a.reviewedFits.some(cm)||a.studies.some(cm);
}
function relation(a,color){
 if(!color)return a.review;
 if(a.reviewedFits.includes(color))return 'Reviewed colour-direction fit';
 if(a.studies.includes(color))return 'Partial study — not a complete scene';
 return 'Provisional colour suggestion';
}
function element(tag,content,cls){const e=document.createElement(tag);if(content)e.textContent=content;if(cls)e.className=cls;return e;}
function option(select,label,value){const o=element('option',label);o.value=value;select.append(o);}
function fillControls(parent,prefix,onchange){
 const controls={};
 for(const [key,label] of [['color','Colour affinity'],['match','Colour matching'],['family','Physical habitat'],['review','Assessment']]){
  const wrap=element('label',label),select=element('select');select.id=prefix+key;select.setAttribute('aria-label',label);wrap.append(select);parent.append(wrap);controls[key]=select;
 }
 option(controls.color,'All colour affinities','');
 for(const p of atlas.profiles)option(controls.color,p.code+' · '+p.name,p.code);
 option(controls.match,'Exact combination','exact');option(controls.match,'Includes these colours','contains');
 option(controls.family,'All physical habitats','');for(const f of atlas.families)option(controls.family,f.label,f.id);
 for(const [v,l] of [['linked','All linked candidates'],['fits','Reviewed colour-direction fits'],['studies','Partial studies only'],['suggestions','Metadata suggestions only'],['unclassified','No colour assigned']])option(controls.review,l,v);
 for(const [key,select] of Object.entries(controls)){select.value=state[key];select.onchange=()=>{state[key]=select.value;if(key==='review'&&state.review==='unclassified'){state.color='';controls.color.value='';}onchange();};}
 return controls;
}
function describeSelection(){const p=profiles.get(state.color);if(!p)return 'Colour affinity is an art-direction judgement, not card colour identity. Unclassified does not mean colourless.';return p.code+' — '+p.biomes.join(' / ')+'. '+p.fitCount+' reviewed fits; '+p.studyCount+' partial studies. '+p.gapNote;}
function setState(values={}){if(values.color!==undefined)state.color=canonical(values.color);if(values.family!==undefined)state.family=families.has(values.family)?values.family:'';if(['linked','fits','studies','suggestions','unclassified'].includes(values.review))state.review=values.review;if(['exact','contains'].includes(values.match))state.match=values.match;}
function mountStudio(){
 const grid=document.getElementById('artOptionsGrid');if(!grid||document.getElementById('biomePickerTools'))return;
 const actions=document.querySelector('.top-actions');if(actions&&!document.getElementById('openBiomeAtlas')){const link=element('a','Colour & biome atlas','btn secondary');link.id='openBiomeAtlas';link.href='/mtgtools/odyssey/biome-atlas.html';actions.append(link);}
 const tools=element('section','','biome-tools');tools.id='biomePickerTools';tools.setAttribute('aria-label','Colour and biome filters');grid.before(tools);
 const selects=element('div','','biome-selects');tools.append(selects);const info=element('p','','biome-selection-summary');info.id='biomeSelectionSummary';tools.append(info);
 const render=()=>{info.textContent=describeSelection();const all=document.querySelector('[data-art-search-scope="all"]');if(all)all.click();else if(typeof root.renderArtOptions==='function')root.renderArtOptions(false);};
 const controls=fillControls(selects,'biome-picker-',render);info.textContent=describeSelection();
 const links=element('div','','biome-picker-links'),clear=element('button','Clear biome filters');clear.type='button';clear.onclick=()=>{Object.assign(state,{color:'',family:'',review:'linked',match:'exact'});for(const [key,c] of Object.entries(controls))c.value=state[key];render();};
 const atlasLink=element('a','Browse all 32 directions');atlasLink.href='/mtgtools/odyssey/biome-atlas.html';atlasLink.target='_blank';atlasLink.rel='noopener';const brief=element('a','Next search instruction');brief.href='/mtgtools/odyssey/data/biome-search-next-action.md';brief.target='_blank';brief.rel='noopener';links.append(clear,atlasLink,brief);tools.append(links);
 const style=element('style');style.textContent='.biome-tools{padding:10px 14px;margin:8px 0;background:#222820;border:1px solid #596044;border-radius:7px}.biome-selects{display:flex;gap:12px;flex-wrap:wrap}.biome-selects label{display:flex;flex-direction:column;gap:4px;font-size:11px;flex:1;min-width:155px}.biome-selects select{background:#151b17;color:#eee8d8;padding:8px;max-width:100%;border:1px solid #69705c;border-radius:4px}.biome-selection-summary{font-size:12px;line-height:1.5;margin:9px 0}.biome-picker-links{display:flex;flex-wrap:wrap;gap:16px;align-items:center;font-size:12px}.biome-picker-links a{color:#dfca8f}.biome-picker-links button{font:inherit;cursor:pointer}.biome-tile-note{font-size:11px;line-height:1.4;margin-top:6px;color:#c2d0b1}';document.head.append(style);
 const decorate=()=>{for(const tile of grid.querySelectorAll('[data-art-option]')){const a=index.get(tile.dataset.artOption);if(!a||!a.isLandscape||tile.querySelector('.biome-tile-note'))continue;const note=element('p',(a.primaryColor||'Unclassified')+' · '+a.biomes.map(x=>families.get(x)||x).join(', ')+' · '+relation(a,state.color),'biome-tile-note');note.title=a.basis+(a.warning?' '+a.warning:'');(tile.querySelector('.art-option-body')||tile).append(note);}};
 new MutationObserver(decorate).observe(grid,{childList:true});decorate();
 const url=new URLSearchParams(location.search);if(url.has('color')||url.has('biome')){setState({color:url.get('color')||'',family:url.get('biome')||'',review:url.get('assessment')||'linked'});for(const [key,c] of Object.entries(controls))c.value=state[key];setTimeout(()=>{root.OdysseyLandscapeLibrary?.open('');render();},500);}
}
root.OdysseyBiomeAtlas={atlas,index,profiles,families,state,canonical,hasFilters,matches,relation,setState,fillControls,describeSelection};
if(typeof module!=='undefined'&&module.exports)module.exports=root.OdysseyBiomeAtlas;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountStudio,{once:true});else mountStudio();}
})(typeof window==='undefined'?globalThis:window);
