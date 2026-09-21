(function(root){
"use strict";
const VERSION="1.0";
let overlay=null,current=null;

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function findReference(id){
  const d=root.ODYSSEY_CARD_REFERENCES||{},cards=d.cards||{};
  for(const entry of Object.values(cards))for(const ref of entry&&entry.references||[]){
    const c=ref&&ref.card||{};if(String(c.id||c.oracleId||"")===String(id||""))return c;
  }
  return null;
}
function style(){
  if(document.getElementById("odyssey-media-preview-css"))return;
  const s=document.createElement("style");s.id="odyssey-media-preview-css";s.textContent=
".od-media-overlay{position:fixed;inset:0;z-index:140;display:none;background:rgba(4,5,4,.9);backdrop-filter:blur(9px);padding:14px}"+
".od-media-overlay.open{display:flex;align-items:center;justify-content:center}.od-media-shell{width:min(1180px,100%);height:min(94vh,920px);display:flex;flex-direction:column;overflow:hidden;background:#141711;border:1px solid #4b5242;border-radius:15px;box-shadow:0 30px 100px rgba(0,0,0,.72)}"+
".od-media-head{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #373d32;background:#1a1e17}.od-media-head h2{margin:0;font:700 17px/1.15 Georgia,serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.od-media-head .grow{flex:1}.od-media-meta{font-size:10px;color:#aeb3a0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:42vw}"+
".od-media-stage{flex:1;min-height:0;display:grid;place-items:center;overflow:auto;padding:12px;background:#0b0d0a}.od-media-stage img{display:block;max-width:100%;max-height:100%;object-fit:contain;box-shadow:0 10px 34px rgba(0,0,0,.45);user-select:none;-webkit-user-drag:none}"+
".od-media-stage.card img{max-height:82vh;border-radius:4.8%}.od-media-stage.art img{max-width:min(1100px,96vw);max-height:78vh}"+
".od-media-foot{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:9px 12px;border-top:1px solid #343a30;background:#171a14}.od-media-foot .grow{flex:1}.od-media-dims{font-size:9px;color:#929785}.od-media-link{color:#ead59a;text-decoration:none;font-size:10px;font-weight:800}"+
".od-ref-image{cursor:zoom-in}.art-option-thumb{cursor:zoom-in}.art-option-thumb::after{content:'PREVIEW';position:absolute;z-index:4;right:6px;top:6px;padding:2px 5px;border-radius:999px;background:rgba(10,12,9,.7);color:#e9e7dc;border:1px solid rgba(255,255,255,.25);font:800 7px/1.3 system-ui,sans-serif;letter-spacing:.04em;opacity:0;transition:opacity .12s}.art-option-thumb:hover::after{opacity:1}"+
"@media(hover:none){.art-option-thumb::after{opacity:.72}}@media(max-width:760px){.od-media-overlay{padding:0}.od-media-shell{width:100vw;height:100vh;max-height:none;border-radius:0;border:0}.od-media-head{padding-top:max(10px,env(safe-area-inset-top))}.od-media-meta{display:none}.od-media-stage{padding:8px}.od-media-stage.card img{max-height:79vh}.od-media-foot{padding-bottom:max(9px,env(safe-area-inset-bottom))}}"+
"@media print{.od-media-overlay{display:none!important}}";
  document.head.appendChild(s);
}
function create(){
  if(overlay)return;
  overlay=document.createElement("div");overlay.className="od-media-overlay";overlay.setAttribute("aria-hidden","true");
  overlay.innerHTML='<div class="od-media-shell" role="dialog" aria-modal="true" aria-label="Large preview"><div class="od-media-head"><h2 data-media-title>Preview</h2><span class="od-media-meta" data-media-meta></span><div class="grow"></div><button class="btn secondary small" data-media-close>Close</button></div><div class="od-media-stage" data-media-stage><img data-media-img alt=""></div><div class="od-media-foot"><span class="od-media-dims" data-media-dims></span><div class="grow"></div><button class="btn secondary small" data-media-note>Add card note</button><button class="btn small" data-media-use hidden>Use artwork</button><a class="od-media-link" data-media-link target="_blank" rel="noopener noreferrer" hidden>Open source ↗</a></div></div>';
  document.body.appendChild(overlay);
  overlay.querySelector("[data-media-close]").onclick=close;
  overlay.onclick=e=>{if(e.target===overlay)close()};
  overlay.querySelector("[data-media-note]").onclick=()=>{
    if(root.OdysseyReviewNotes&&typeof root.OdysseyReviewNotes.compose==="function")root.OdysseyReviewNotes.compose(current&&current.context||"Preview");
  };
  overlay.querySelector("[data-media-use]").onclick=()=>{
    if(current&&current.kind==="art"&&current.id&&typeof applyArt==="function"){applyArt(current.id);close()}
  };
  const img=overlay.querySelector("[data-media-img]");
  img.onload=()=>{overlay.querySelector("[data-media-dims]").textContent=img.naturalWidth&&img.naturalHeight?img.naturalWidth+" × "+img.naturalHeight+" px":""};
  img.onerror=()=>{overlay.querySelector("[data-media-dims]").textContent="Preview image could not be loaded"};
}
function open(data){
  create();current=data;
  const stage=overlay.querySelector("[data-media-stage]"),img=overlay.querySelector("[data-media-img]"),link=overlay.querySelector("[data-media-link]"),use=overlay.querySelector("[data-media-use]");
  stage.className="od-media-stage "+(data.kind==="reference"?"card":"art");
  overlay.querySelector("[data-media-title]").textContent=data.title||"Preview";
  overlay.querySelector("[data-media-meta]").textContent=data.meta||"";
  overlay.querySelector("[data-media-dims]").textContent="";
  img.alt=data.title||"Preview";img.src=data.url||"";
  if(data.source){link.hidden=false;link.href=data.source;link.textContent=data.kind==="reference"?"Open on Scryfall ↗":"Open source ↗"}else{link.hidden=true;link.removeAttribute("href")}
  use.hidden=!(data.kind==="art"&&data.usable);
  overlay.classList.add("open");overlay.setAttribute("aria-hidden","false");
}
function close(){if(!overlay)return;overlay.classList.remove("open");overlay.setAttribute("aria-hidden","true");const img=overlay.querySelector("[data-media-img]");img.removeAttribute("src");current=null}
function openReference(anchor){
  const article=anchor.closest(".od-ref-card"),id=article&&article.dataset.refId,c=findReference(id)||{};
  const img=anchor.querySelector("img"),images=c.images||{},url=images.large||images.normal||images.small||(img&&img.currentSrc)||"";
  if(!url)return;
  const title=c.name||(img&&img.alt)||"Magic reference card";
  const meta=[c.manaCost,c.type,c.rarity&&String(c.rarity).toUpperCase()].filter(Boolean).join(" · ");
  open({kind:"reference",id:id,title:title,meta:meta,url:url,source:c.scryfallUri||anchor.href||"",context:"Real-card reference: "+title});
}
function openArtwork(tile){
  const button=tile.closest("[data-art-option]"),id=button&&button.dataset.artOption;if(!id)return;
  let a={};try{a=(typeof artById!=="undefined"&&artById[id])||{}}catch(_){}
  let url="";try{url=(root.OdysseyArtDelivery&&root.OdysseyArtDelivery.full(a))||(typeof directArtUrl==="function"&&directArtUrl(id))||(typeof candidateThumbUrl==="function"&&candidateThumbUrl(id))||""}catch(_){}
  const img=tile.querySelector("img");if(!url&&img)url=img.currentSrc||img.src;if(!url)return;
  const title=a.title||id,meta=[a.artist,a.date,a.institution].filter(Boolean).join(" · ");
  open({kind:"art",id:id,title:title,meta:meta,url:url,source:a.source||"",usable:!button.disabled,context:"Artwork "+id+": "+title});
}
function install(){
  if(root.OdysseyMediaPreviewInstalled||typeof document==="undefined")return;root.OdysseyMediaPreviewInstalled=true;style();create();
  document.addEventListener("click",e=>{
    const target=e.target&&e.target.closest?e.target:null;if(!target)return;
    const ref=target.closest(".od-ref-image");
    if(ref&&ref.querySelector("img")){e.preventDefault();e.stopPropagation();openReference(ref);return}
    const art=target.closest(".art-option-thumb");
    if(art&&art.closest("[data-art-option]")){e.preventDefault();e.stopPropagation();openArtwork(art)}
  },true);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&overlay&&overlay.classList.contains("open")){e.preventDefault();close()}});
}
const api={VERSION,open,close,install,findReference};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.OdysseyMediaPreview=api;
if(typeof document!=="undefined"){if(document.readyState==="complete")setTimeout(install,0);else root.addEventListener("load",()=>setTimeout(install,0),{once:true})}
})(typeof window!=="undefined"?window:globalThis);
