/* Odyssey rules presentation and art-led design review. No automatic deletion or card-rule simulation. */
(function(root){
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function sentences(value){
  const text=String(value??'').replace(/\r\n?/g,'\n');
  const out=[];let buffer='',parentheses=0,braces=0;
  const flush=()=>{if(buffer.trim())out.push(buffer.trim());buffer='';};
  for(let i=0;i<text.length;i++){
   const ch=text[i];
   if(ch==='\n'&&!parentheses&&!braces){flush();continue;}
   buffer+=ch;
   if(ch==='(')parentheses++;else if(ch===')')parentheses=Math.max(0,parentheses-1);
   else if(ch==='{')braces++;else if(ch==='}')braces=Math.max(0,braces-1);
   if(!parentheses&&!braces&&/[.!?]/.test(ch)&&(!text[i+1]||/\s/.test(text[i+1]))){
    // A reminder belongs to the preceding sentence, not a separate ability.
    if(/^\s*\(/.test(text.slice(i+1)))continue;
    flush();
   }else if(ch===')'&&!parentheses&&/[.!?]\s*\([^]*\)$/.test(buffer)&&/^(?:\s+[A-Z{]|$)/.test(text.slice(i+1))){flush();}
  }
  flush();
  const keyword=/^(?:flying|reach|vigilance|flash|haste|trample|menace|lifelink|deathtouch|first strike|double strike|defender|indestructible|hexproof|shroud)$/i;
  return out.flatMap(line=>{
   const period=line.endsWith('.'),parts=line.replace(/\.$/,'').split(/\s*,\s*/);
   if(parts.length<2||!parts.every(part=>keyword.test(part)))return [line];
   return parts.map((part,i)=>part[0].toUpperCase()+part.slice(1)+(period&&i===parts.length-1?'.':''));
  });
 }
 function isDevotion(line){return /^As long as (?:your devotion\b|the number of (?:white|blue|black|red|green)[^]*mana symbols[^]*less than)/i.test(line);}
 function rulesHTML(value,renderSymbol){
  const inline=s=>esc(s).replace(/(\([^()]*\))/g,'<span class="reminder">$1</span>').replace(/\{([^{}\n]+)\}/g,(all,t)=>renderSymbol?renderSymbol(t):all);
  return sentences(value).map(line=>'<span class="od-rule-sentence" data-rule-sentence="true">'+(isDevotion(line)?'<strong class="od-ability-label" title="Devotion counts coloured mana symbols in permanent mana costs. This is a presentation label, not a new rules ability.">Devotion — </strong>':'')+inline(line)+'</span>').join('<br class="od-sentence-return">');
 }
 function utilityGlyph(t){
  const svg=body=>'<svg class="od-utility-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+body+'</svg>';
  if(t==='C')return svg('<path fill="currentColor" fill-rule="evenodd" d="M12 1.5 22.5 12 12 22.5 1.5 12Zm0 5L6.5 12l5.5 5.5 5.5-5.5Z"/><path d="m12 6.5 2 2-2 2-2-2M17.5 12l-2 2-2-2 2-2M12 17.5l-2-2 2-2 2 2M6.5 12l2-2 2 2-2 2" fill="none" stroke="currentColor" stroke-width=".8"/>');
  if(t==='T'||t==='Q')return svg('<g'+(t==='Q'?' transform="translate(24 0) scale(-1 1)"':'')+'><path d="M5 19V10a6 6 0 0 1 12-1v5" fill="none" stroke="currentColor" stroke-width="3.1" stroke-linecap="square"/><path d="m11 12 6 9 6-9Z" fill="currentColor"/></g>');
  if(t==='S')return svg('<g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7"/><path d="m9 4 3 3 3-3m-6 16 3-3 3 3M4 10l4-.3-1.5-3.6M20 14l-4 .3 1.5 3.6M4 14l4 .3-1.5 3.6M20 10l-4-.3 1.5-3.6"/></g>');
  if(t==='P')return svg('<circle cx="12" cy="11.5" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 1.5v21" stroke="currentColor" stroke-width="2.6"/>');
  if(t==='E')return svg('<path d="M13.5 1.5 4 13h6l-1 9.5L21 9h-7l2-7.5Z" fill="currentColor"/>');
  return '';
 }
 function disposition(card,override={},hasLocalImage=false){
  if(!card||Number(card.number)<=270)return '';
  const text=[override.designDisposition,card.designDisposition,override.status,card.status].filter(Boolean).join(' ').toLowerCase();
  const name=String(override.displayName||card.displayName||card.name||'');
  if(/\brecast\b/.test(text)||/^\[?recast\]?\s*(?:$|[:—-])/i.test(name))return 'recast';
  if(/\b(?:replace-slot|replace|remove|cut)\b/.test(text)||/^\[?(?:remove|cut)\]?\s*(?:$|[:—-])/i.test(name))return 'replace-slot';
  const selectedArt=Object.hasOwn(override,'artId')?override.artId:card.artId??card.primaryArt;
  const image=Object.hasOwn(override,'imageUrl')?override.imageUrl:card.imageUrl;
  // A download failure is not an absent assignment. Never cut a card merely because a host is unavailable.
  return !selectedArt&&!image&&!hasLocalImage?'replace-slot':'';
 }
 function mount(){
  if(!root.document||root.OdysseyDesignReviewMounted||typeof root.model!=='function')return;
  root.OdysseyDesignReviewMounted=true;
  const current=n=>{const m=root.model(n);return disposition(m,overrides[n]||{},!!localImageUrls[n]);};
  const queue=()=>CARDS.filter(c=>c.number>270).map(c=>{const m=root.model(c.number),action=current(c.number);return action?{id:c.id,number:c.number,name:m.displayName,action,rarity:m.rarity,color:c.color,manaValue:c.mv,type:m.type,artId:m.artId,slotPreserved:true,instruction:action==='recast'?'Recast this slot around defensible source artwork; preserve its required colour, rarity and Limited role.':'Archive this design and refill its slot with a new art-led design; do not just restore the rejected image.'}:null;}).filter(Boolean);
  root.odysseyReplacementQueue=queue;
  const change=action=>{if(selected<=270)return;const m=root.model(selected);m.designDisposition=action;root.diffOverride(selected,m);root.renderPreview();root.toast(action==='recast'?'Marked Recast: redesign around source artwork':action==='replace-slot'?'Marked for retirement and slot replacement':'Explicit replacement mark cleared');};
  const buttons=document.createElement('div');buttons.className='od-design-review';buttons.innerHTML='<div class="od-design-review-status" role="status"></div><div class="buttons"><button class="btn secondary small" data-design-action="recast">Recast design</button><button class="btn secondary small" data-design-action="replace-slot">Replace design</button><button class="btn secondary small" data-design-action="">Clear mark</button></div>';
  const anchor=document.getElementById('removeArtCard');anchor?.parentElement.insertAdjacentElement('afterend',buttons);
  buttons.querySelectorAll('[data-design-action]').forEach(b=>b.onclick=()=>change(b.dataset.designAction));
  const update=()=>{buttons.hidden=selected<=270;const state=current(selected);buttons.querySelector('[role="status"]').textContent=state==='recast'?'RECAST — preserve the slot, redesign around usable artwork.':state==='replace-slot'?'REPLACE SLOT — retire this design and find a new way to fill the slot.':'Late-set design: no replacement mark.';};
  const oldRender=root.renderPreview;root.renderPreview=function(){const result=oldRender.apply(this,arguments);update();return result;};
  const oldRemove=anchor?.onclick;if(anchor)anchor.onclick=function(){oldRemove?.call(this);if(selected>270){const m=root.model(selected);if(current(selected)!=='recast'){m.designDisposition='replace-slot';root.diffOverride(selected,m);}root.renderPreview();root.toast(current(selected)==='recast'?'Artwork removed; Recast instruction retained':'Artwork removed; late-set design queued for replacement');}};
  const open=()=>{
   document.getElementById('odReplacementDialog')?.remove();const dialog=document.createElement('dialog');dialog.id='odReplacementDialog';dialog.className='od-sync-dialog';
   const rows=queue();dialog.innerHTML='<h2>Art-led replacement queue</h2><p>'+rows.length+' flagged slots. Removing artwork after card 270 retires the design; Recast keeps the slot for an art-led redesign. Network failures do not enter this queue.</p>'+rows.map(r=>'<div class="od-sync-row"><strong>'+r.number+' · '+esc(r.name)+'</strong><p>'+esc(r.action==='recast'?'RECAST':'REPLACE SLOT')+' · '+esc(r.color)+' · '+esc(r.rarity)+'</p><p>'+esc(r.instruction)+'</p></div>').join('')+(rows.length?'':'<p>No applicable marks are present in this browser. Shared card rows are not deleted or inferred from unseen device edits.</p>')+'<div class="buttons"><button class="btn" data-export>Export replacement queue</button><button class="btn secondary" data-close>Close</button></div>';
   dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.querySelector('[data-export]').onclick=()=>root.download('odyssey-replacement-queue.json',JSON.stringify({schema:'odyssey-replacement-queue/v1',exportedAt:new Date().toISOString(),datasetVersion:ODYSSEY_DATASET.datasetVersion,slots:rows},null,2));document.body.appendChild(dialog);dialog.showModal();
  };
  const button=document.createElement('button');button.className='btn secondary';button.textContent='Replacement queue';button.onclick=open;document.querySelector('.top-actions')?.appendChild(button);
  update();
 }
 const api={sentences,isDevotion,rulesHTML,utilityGlyph,disposition,mount};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;root.OdysseyRefinement=api;
})(typeof window==='undefined'?globalThis:window);
