(function(root){
"use strict";
var STORE="odyssey-reference-review-v1";
var data=root.ODYSSEY_CARD_REFERENCES||{cards:{},totalCards:0};
var review={};if(typeof localStorage!=="undefined"){try{review=JSON.parse(localStorage.getItem(STORE)||"{}")}catch(_){}}
var overlay=null;
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function entryFor(n){var b=baseCard(n);return b&&data.cards?data.cards[b.id]||null:null}
function refsFor(n){var e=entryFor(n);return e&&e.references?e.references:[]}
function roleLabel(r){return r==="identity"?"Oracle identity":r==="rate-best"?"Best rate":r==="rate-normal"?"Normal rate":r==="tech"?"Set / mechanic tech":r==="template"?"Template":r==="mechanic"?"Mechanics":r==="buildaround"?"Build-around / spin":"Analogue"}
function roles(ref){return ref.roles||[ref.role]}
function roleClass(r){return"od-ref-role-"+(r||"analogue")}
function save(){if(typeof localStorage!=="undefined"){try{localStorage.setItem(STORE,JSON.stringify(review))}catch(_){}}}
function sourceMatches(n){var e=entryFor(n),c=typeof model==="function"?model(n):baseCard(n);if(!e||!e.sourceCard||!c)return false;return Object.keys(e.sourceCard).every(function(k){return JSON.stringify(c[k]==null?"":c[k])===JSON.stringify(e.sourceCard[k])})}
function entrySignature(e){return JSON.stringify([data.policyRevision,e&&e.sourceFingerprint,(e&&e.references||[]).map(function(r){return[roles(r),r.card.oracleId||r.card.id,r.notes||r.annotation]})])}
function signature(n){return entrySignature(entryFor(n))}
function isReviewed(n){var b=baseCard(n),r=b&&review[b.id];return !!(sourceMatches(n)&&r&&typeof r==="object"&&r.signature===signature(n))}
function counts(){var cards=typeof CARDS!=="undefined"?CARDS:[],done=cards.filter(function(c){return isReviewed(c.number)}).length;return{done:done,total:cards.length||Object.keys(data.cards||{}).length}}
function staleNotice(n){return sourceMatches(n)?"":"<div class='od-ref-stale'>Card design has changed. These references describe an earlier version and need reassessment.</div>"}
function image(ref,size){var x=ref&&ref.card&&ref.card.images||{};return x[size||"small"]||x.normal||x.small||x.large||""}
function tile(ref,compact){
 var c=ref.card||{},url=image(ref,compact?"small":"normal"),link=c.scryfallUri||"#";
 var tags=(ref.sharedMechanics||[]).slice(0,6).map(function(x){return"<span>"+esc(x)+"</span>"}).join("");
 return "<article class='od-ref-card "+(compact?"compact":"")+"' data-ref-id='"+esc(c.id||"")+"'>"+
 "<a class='od-ref-image' href='"+esc(link)+"' target='_blank' rel='noopener noreferrer'>"+
 (url?"<img loading='lazy' decoding='async' referrerpolicy='no-referrer' src='"+esc(url)+"' alt='"+esc(c.name||"Magic reference card")+"'>":"<div class='od-ref-image-missing'>Image unavailable</div>")+"</a>"+
 "<div class='od-ref-copy'><div class='od-ref-head'><div class='od-ref-badges'>"+roles(ref).map(function(role){return "<span class='od-ref-role "+roleClass(role)+"'>"+esc(roleLabel(role))+"</span>"}).join(" ")+"</div><strong>"+esc(c.name||"Reference")+"</strong></div>"+
 "<div class='od-ref-meta'>"+esc(c.manaCost||"")+" · "+esc(c.type||"")+" · "+esc((c.rarity||"").toUpperCase())+"</div>"+
 (compact?"<p>"+esc(ref.annotation||"")+"</p>":(ref.notes||[{text:ref.annotation}]).map(function(note){return "<p>"+esc(note.text)+"</p>"}).join(""))+(compact?"":oracle(c))+(tags?"<div class='od-ref-tags'>"+tags+"</div>":"")+
 (compact?"":"<a class='source-link' href='"+esc(link)+"' target='_blank' rel='noopener noreferrer'>Open on Scryfall ↗</a>")+"</div></article>"
}
function oracle(c){
 if(c.faces&&c.faces.length)return c.faces.map(function(f){return "<div class='od-ref-oracle'><b>"+esc(f.name)+"</b><div>"+esc(f.manaCost||"No mana cost")+" · "+esc(f.type)+"</div>"+esc(f.oracleText).replace(/\n/g,"<br>")+"</div>"}).join("");
 return c.oracleText?"<div class='od-ref-oracle'><b>Oracle text</b><br>"+esc(c.oracleText).replace(/\n/g,"<br>")+"</div>":""
}
function ensureStyle(){
 if(document.getElementById("od-reference-css"))return;
 var s=document.createElement("style");s.id="od-reference-css";s.textContent=".od-ref-summary{font-size:10px;color:#aeb2a1;line-height:1.45;margin-bottom:8px}.od-ref-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.od-ref-card{background:#20241c;border:1px solid #41483a;border-radius:10px;overflow:hidden;min-width:0}.od-ref-image{display:block;background:#0e100d;overflow:hidden}.od-ref-image img{width:100%;height:100%;display:block;object-fit:contain}.od-ref-card.compact .od-ref-image{aspect-ratio:488/680}.od-ref-copy{padding:8px}.od-ref-card.compact .od-ref-copy{padding:6px}.od-ref-head{display:flex;gap:6px;align-items:center;min-width:0}.od-ref-head strong{font:700 12px/1.15 Georgia,serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.od-ref-card.compact .od-ref-head{display:block}.od-ref-card.compact .od-ref-head strong{display:block;margin-top:4px;font-size:10px}.od-ref-meta{font-size:9px;color:#9ea391;margin-top:4px;line-height:1.25}.od-ref-card p{font-size:10px;line-height:1.4;color:#d8d7cc;margin:7px 0}.od-ref-card.compact p{font-size:9px;max-height:5.5em;overflow:hidden}.od-ref-role{display:inline-block;border:1px solid #696f60;border-radius:999px;padding:2px 5px;font:800 7px/1.2 system-ui;text-transform:uppercase;letter-spacing:.04em}.od-ref-role-template{border-color:#6f89a0;color:#c7e0f3}.od-ref-role-mechanic,.od-ref-role-tech{border-color:#778f58;color:#d9edba}.od-ref-role-rate-best{border-color:#b96b5c;color:#ffd0c6}.od-ref-role-rate-normal{border-color:#a78351;color:#f0d4a5}.od-ref-role-identity{border-color:#7e7e7e;color:#ededed}.od-ref-role-buildaround{border-color:#9b72b5;color:#efd7ff}.od-ref-oracle{margin:8px 0;padding:7px;border:1px solid #3f4538;border-radius:7px;background:#171a14;font:10px/1.42 Georgia,serif;color:#e4e0d3}.od-ref-tags{display:flex;gap:4px;flex-wrap:wrap}.od-ref-tags span{border:1px solid #4a5143;border-radius:999px;padding:2px 5px;font-size:8px;color:#bfc4b4}.od-ref-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.od-ref-reviewed{color:#cce8b4}.od-ref-overlay{position:fixed;inset:0;z-index:110;background:#050605d9;backdrop-filter:blur(8px);display:none;padding:16px}.od-ref-overlay.open{display:flex;align-items:center;justify-content:center}.od-ref-shell{width:min(1120px,100%);max-height:94vh;overflow:hidden;display:flex;flex-direction:column;background:#151812;border:1px solid #4b5242;border-radius:14px;box-shadow:0 30px 90px #000b}.od-ref-modal-head{display:flex;gap:8px;align-items:center;padding:11px 13px;border-bottom:1px solid #373d32}.od-ref-modal-head h2{margin:0;font:700 18px/1.1 Georgia,serif}.od-ref-modal-head .grow{flex:1}.od-ref-grid{padding:12px;overflow:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.od-ref-grid .od-ref-card{display:grid;grid-template-columns:minmax(130px,36%) minmax(0,1fr)}.od-ref-grid .od-ref-image{align-self:start;aspect-ratio:488/680}.od-ref-stale{padding:9px;border:1px solid #c99a53;background:#342914;color:#ffe0a8;font-size:12px;line-height:1.4;grid-column:1/-1}.od-ref-badges{display:flex;gap:3px;flex-wrap:wrap}.od-ref-grid .od-ref-head{display:block}.od-ref-grid .od-ref-head strong{display:block;white-space:normal;margin-top:6px}.od-ref-modal-head{flex-wrap:wrap}.od-ref-card p{font-size:12px}.od-ref-oracle{font-size:12px}.od-ref-progress{font-size:10px;color:#aeb3a0}.od-ref-button-count{display:inline-block;margin-left:4px;border-radius:999px;background:#171a14;border:1px solid #59604f;padding:1px 5px;font-size:8px}@media(max-width:760px){.od-ref-card.compact .od-ref-meta,.od-ref-card.compact p{display:none}.od-ref-overlay{padding:0;align-items:flex-end!important}.od-ref-shell{width:100%;height:92vh;max-height:92vh;border-radius:16px 16px 0 0}.od-ref-grid{grid-template-columns:1fr;gap:9px;padding:8px}.od-ref-grid .od-ref-card{grid-template-columns:42% 1fr}.od-ref-grid .od-ref-image{min-height:0}.od-ref-modal-head h2{font-size:15px}}@media print{.od-ref-overlay,.od-ref-section,#openCardReferences{display:none!important}}";document.head.appendChild(s)
}
function nextReferenced(from){for(var i=1;i<=CARDS.length;i++){var n=((from-1+i)%CARDS.length)+1;if(refsFor(n).length)return n}return from}
function renderSection(){
 var host=document.getElementById("odCardReferences");if(!host)return;var refs=refsFor(selected),e=entryFor(selected);
 if(!refs.length){host.innerHTML=staleNotice(selected)+"<div class='od-ref-summary'>No curated real-card references for this card.</div>";return}
 host.innerHTML=staleNotice(selected)+"<div class='od-ref-summary'><b>"+refs.length+" real-card reference"+(refs.length===1?"":"s")+"</b> for "+esc(e&&e.name||model(selected).displayName)+" · "+(isReviewed(selected)?"<span class='od-ref-reviewed'>reviewed ✓</span>":"not reviewed")+"</div><div class='od-ref-strip'>"+refs.slice(0,3).map(function(r){return tile(r,true)}).join("")+"</div><div class='od-ref-actions'><button class='btn secondary small' data-open-refs>Open large</button><button class='btn secondary small' data-reviewed>"+(isReviewed(selected)?"Mark unreviewed":"Mark reviewed ✓")+"</button></div>";
 host.querySelector("[data-open-refs]").onclick=open;host.querySelector("[data-reviewed]").disabled=!sourceMatches(selected);host.querySelector("[data-reviewed]").onclick=function(){if(!sourceMatches(selected))return;var id=baseCard(selected).id;if(isReviewed(selected))delete review[id];else review[id]={at:new Date().toISOString(),signature:signature(selected)};save();renderSection();updateTop()}
}
function updateButton(){var b=document.getElementById("openCardReferences");if(!b)return;var n=refsFor(selected).length;b.disabled=!n;b.innerHTML="Refs <span class='od-ref-button-count'>"+n+"</span>"}
function updateTop(){var c=counts(),el=document.getElementById("referenceReviewTop");if(el)el.textContent=c.done+" / "+c.total+" reference sets reviewed"}
function renderModal(){
 if(!overlay)return;var refs=refsFor(selected),e=entryFor(selected),c=counts();
 overlay.querySelector("[data-ref-title]").textContent=refs.length?String(selected).padStart(3,"0")+" · "+(e&&e.name||model(selected).displayName):"No references";
 overlay.querySelector("[data-ref-progress]").textContent=c.done+"/"+c.total+" cards reviewed";
 overlay.querySelector("[data-ref-grid]").innerHTML=refs.length?staleNotice(selected)+refs.map(function(r){return tile(r,false)}).join(""):"<div class='gallery-empty'>This card has no reference set.</div>";
 var mark=overlay.querySelector("[data-ref-mark]");mark.disabled=!refs.length||!sourceMatches(selected);mark.textContent=isReviewed(selected)?"Reviewed ✓":"Mark reviewed + next"
}
function open(){if(!overlay||!refsFor(selected).length)return;overlay.classList.add("open");overlay.setAttribute("aria-hidden","false");renderModal()}
function close(){if(overlay){overlay.classList.remove("open");overlay.setAttribute("aria-hidden","true")}}
function mount(){
 if(root.OdysseyReferenceBrowserMounted||typeof model!=="function")return;root.OdysseyReferenceBrowserMounted=true;ensureStyle();
 var top=document.querySelector(".topstats");if(top){var stat=document.createElement("span");stat.id="referenceReviewTop";top.appendChild(stat)}
 var toolbar=document.querySelector(".preview-toolbar");if(toolbar){var btn=document.createElement("button");btn.className="btn secondary small";btn.id="openCardReferences";btn.onclick=open;var anchor=toolbar.querySelector("#addSheet");toolbar.insertBefore(btn,anchor)}
 var pane=document.getElementById("pane-card");if(pane){var section=document.createElement("div");section.className="section od-ref-section";section.innerHTML="<h3>Real card references</h3><div id='odCardReferences'></div>";pane.appendChild(section)}
 overlay=document.createElement("div");overlay.className="od-ref-overlay";overlay.id="odReferenceOverlay";overlay.setAttribute("aria-hidden","true");overlay.innerHTML="<div class='od-ref-shell'><div class='od-ref-modal-head'><button class='btn secondary small' data-ref-prev>←</button><button class='btn secondary small' data-ref-next>→</button><h2 data-ref-title>References</h2><span class='od-ref-progress' data-ref-progress></span><div class='grow'></div><button class='btn approve small' data-ref-mark>Mark reviewed + next</button><button class='btn secondary small' data-ref-close>Close</button></div><div class='od-ref-grid' data-ref-grid></div></div>";document.body.appendChild(overlay);
 overlay.querySelector("[data-ref-close]").onclick=close;overlay.onclick=function(e){if(e.target===overlay)close()};
 overlay.querySelector("[data-ref-prev]").onclick=function(){for(var i=1;i<=CARDS.length;i++){var n=((selected-1-i+CARDS.length)%CARDS.length)+1;if(refsFor(n).length){selectCard(n);renderModal();break}}};
 overlay.querySelector("[data-ref-next]").onclick=function(){selectCard(nextReferenced(selected));renderModal()};
 overlay.querySelector("[data-ref-mark]").onclick=function(){if(!refsFor(selected).length||!sourceMatches(selected))return;review[baseCard(selected).id]={at:new Date().toISOString(),signature:signature(selected)};save();selectCard(nextReferenced(selected));renderModal();updateTop()};
 var old=root.renderPreview;root.renderPreview=function(){var x=old.apply(this,arguments);renderSection();updateButton();if(overlay&&overlay.classList.contains("open"))renderModal();return x};
 document.addEventListener("keydown",function(e){if(e.key==="Escape"&&overlay&&overlay.classList.contains("open")){e.preventDefault();close()}});
 renderSection();updateButton();updateTop()
}
var api={sourceMatches:sourceMatches,signature:signature,isReviewed:isReviewed,roles:roles,tile:tile,entryFor:entryFor,refsFor:refsFor,counts:counts,open:open,close:close,mount:mount};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.OdysseyReferenceBrowser=api;if(typeof document!=="undefined"){if(document.readyState==="complete")setTimeout(mount,0);else root.addEventListener("load",function(){setTimeout(mount,0)},{once:true})}
})(typeof window!=="undefined"?window:globalThis);
