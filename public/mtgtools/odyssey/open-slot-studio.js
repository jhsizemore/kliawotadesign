(function(root){
'use strict';
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function paint(){
 const panel=document.getElementById('odOpenSlotBrief');if(!panel)return;
 const m=model(selected),p=m.placeholder;panel.hidden=!p;
 const open=CARDS.filter(c=>model(c.number).slotState==='OPEN').length;
 document.getElementById('odOpenSlotCount').textContent=open+' open design slots';
 if(!p)return;
 const t=p.target,f=p.fill,o=p.origin;
 panel.innerHTML='<div class="od-slot-heading"><strong>'+(m.slotState==='OPEN'?'Open slot':'New design in this slot')+'</strong><span>'+esc(f.priority)+' priority</span></div>'+
  '<p class="od-slot-role">'+esc(f.role)+'</p><p>'+esc(f.direction)+'</p>'+
  '<dl><dt>Starting target</dt><dd>'+esc([t.color,t.rarity,t.type,'MV '+t.mv,t.mana].filter(Boolean).join(' · '))+'</dd>'+
  '<dt>Supports</dt><dd>'+esc(t.archetypes||'Review against the set')+'</dd>'+
  '<dt>Story direction</dt><dd>'+esc(t.story||'Open')+'</dd>'+
  '<dt>Previously</dt><dd>'+esc(o.previousName)+(o.names?.length>1?' <small>('+esc(o.names.filter(n=>n&&n!==o.previousName).join(' · '))+')</small>':'')+'</dd>'+
  '<dt>Why open</dt><dd>'+esc(o.reason)+'</dd></dl>'+
  (f.avoid?.length?'<p><b>Avoid:</b> '+f.avoid.map(esc).join(' ')+'</p>':'')+
  '<p class="od-slot-note">The target is a starting point. The old title, mana cost, and exact design can change.</p>'+
  '<details><summary>Earlier design and provenance</summary><p>'+esc(o.previousDesign?.type||'')+' · '+esc(o.previousDesign?.mana||'—')+'</p><pre>'+esc(o.previousDesign?.rules||'No complete rules text was available at capture.')+'</pre>'+
  (o.absorbedBy?.length?'<p>Existing card: '+o.absorbedBy.map(n=>'<button type="button" class="btn secondary small" data-existing="'+n+'">#'+String(n).padStart(3,'0')+' · '+esc(model(n).displayName)+'</button>').join(' ')+'</p>':'')+
  (o.archive?'<a href="'+esc(o.archive)+'" target="_blank" rel="noopener">Complete archived designs</a>':'')+
  '<p class="od-slot-note">'+esc(f.basis)+'</p></details>';
 panel.querySelectorAll('[data-existing]').forEach(b=>b.onclick=()=>selectCard(+b.dataset.existing));
 if(m.slotState==='OPEN')document.getElementById('selectedTitle').textContent=String(selected).padStart(3,'0')+' · '+p.label;
 if(m.slotState==='OPEN')document.getElementById('selectedSub').textContent='OPEN SLOT · '+[t.color,t.rarity,t.type,'formerly '+o.previousName].filter(Boolean).join(' · ');
}
function mount(){
 if(typeof model!=='function'||document.getElementById('odOpenSlotBrief'))return;
 const panel=document.createElement('section');panel.id='odOpenSlotBrief';panel.className='section od-slot';panel.hidden=true;
 const rules=document.getElementById('fRules')?.closest('.section');rules?.insertAdjacentElement('beforebegin',panel);
 const badge=document.createElement('span');badge.id='odOpenSlotCount';document.querySelector('.topstats')?.append(badge);
 const style=document.createElement('style');style.textContent=`
 .od-slot[hidden]{display:none}.od-slot{border:1px solid #77613b;border-radius:10px;margin:10px;background:#28231a;padding:12px;color:#ede3ce;font:12px/1.5 system-ui,sans-serif}
 .od-slot-heading{display:flex;gap:8px;align-items:center;justify-content:space-between;color:#e8cd89}.od-slot-heading strong{font-size:16px}.od-slot-heading span{font-size:10px;text-transform:uppercase}
 .od-slot p{margin:8px 0}.od-slot-role{font-weight:700}.od-slot dl{margin:10px 0}.od-slot dt{font-size:10px;text-transform:uppercase;color:#c4ad7b;margin-top:8px;font-weight:700}.od-slot dd{margin:2px 0;overflow-wrap:anywhere}.od-slot-note,.od-slot small{color:#b7ad98;font-size:11px}.od-slot summary{cursor:pointer;color:#e8cd89}.od-slot pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 system-ui,sans-serif;background:#17150f;padding:10px;border-radius:6px}.od-slot a{color:#e8cd89}.od-slot button{margin:3px 0}
 @media print{.od-slot{display:none}}
 `;document.head.append(style);
 const preview=renderPreview;renderPreview=function(){const result=preview.apply(this,arguments);paint();return result;};
 paint();
 if(typeof OPEN_SLOT_MIGRATION!=='undefined'&&OPEN_SLOT_MIGRATION.blocked)toast('Open slot migration could not save its archive; earlier local edits have been retained.');
}
root.OdysseyOpenSlotStudio={paint,mount};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(window);
