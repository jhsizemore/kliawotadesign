'use strict';
// One-time, guarded source edit on the feature branch; removed before the feature commit.
const fs=require('node:fs'), path=require('node:path');
const root=process.cwd(), dir=path.join(root,'public/mtgtools/odyssey');
const read=n=>fs.readFileSync(path.join(dir,n),'utf8');
function replaceOnce(s,before,after,label){if(s.split(before).length!==2)throw Error('Source changed: '+label);return s.replace(before,()=>after)}
const helpers=String.raw`
  // Use the actual basic-land type, never the title or brown land frame. A
  // nonbasic temple, or a basic with custom abilities, must keep its rules box.
  function basicLandMana(model) {
    const type = frontType(model), parts = type.split(/\s*[—–-]\s*/);
    const head = parts[0].trim().split(/\s+/);
    if (!head.some(t => /^Basic$/i.test(t)) || !head.some(t => /^Land$/i.test(t)) ||
        head.some(t => !/^(Basic|Snow|Land)$/i.test(t)) ||
        !['standard', ''].includes(String(model.layout || 'standard').toLowerCase())) return null;
    const subtypes = (parts[1] || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    const colors = {plains:'W', island:'U', swamp:'B', mountain:'R', forest:'G'};
    let mana = subtypes.length === 1 ? colors[subtypes[0]] : null;
    if (!subtypes.length && /^Wastes$/i.test(String(model.name || model.displayName || '').trim())) mana = 'C';
    if (!mana) return null;
    const rules = String(model.rules || '').trim().replace(/^\((.*)\)$/s, '$1').trim();
    const reminder = new RegExp('^\\{T\\}\\s*:\\s*Add\\s+\\{' + mana + '\\}\\.?$', 'i');
    return !rules || reminder.test(rules) ? mana : null;
  }

  function isFullArtBasic(model) {
    return model.frameStyle === 'full-art' && !!basicLandMana(model);
  }

  function decorateBasicLand(card, model) {
    card.classList.remove('basic-land-full-art');
    delete card.dataset.basicLandMana;
    card.querySelectorAll('.basic-land-medallion').forEach(el => el.remove());
    if (!isFullArtBasic(model)) return;
    const typebar = card.querySelector('.typebar');
    if (!typebar) return;
    const mana = basicLandMana(model);
    const medal = card.ownerDocument.createElement('span');
    medal.className = 'basic-land-medallion';
    medal.setAttribute('role', 'img');
    medal.setAttribute('aria-label', ({W:'White',U:'Blue',B:'Black',R:'Red',G:'Green',C:'Colorless'})[mana] + ' mana');
    // Reuse Studio's approved mana artwork in both editor and public renderer.
    medal.innerHTML = '<span aria-hidden="true">' + manaHTML(mana) + '</span>';
    typebar.before(medal);
    card.classList.add('basic-land-full-art');
    card.dataset.basicLandMana = mana;
  }

`;
let frames=read('frame-system.js');
frames=replaceOnce(frames,'  function applyFrameSystem(card, model) {',helpers+'  function applyFrameSystem(card, model) {','frame decorator insertion');
frames=replaceOnce(frames,"    if (family === 'battle') decorateBattleStats(card, model);","    if (family === 'battle') decorateBattleStats(card, model);\n    decorateBasicLand(card, model);",'shared frame hook');
frames=replaceOnce(frames,"    const treatment = model.frameStyle === 'full-art' ? 'Full art' : 'Standard art';","    const treatment = isFullArtBasic(model) ? 'Full art — FF basic land' : model.frameStyle === 'full-art' ? 'Full art' : 'Standard art';",'frame summary');
frames=replaceOnce(frames,"  function updateReadout(model) {\n    const readout",String.raw`  function updateReadout(model) {
    const select = document.getElementById('fFrameStyle');
    const option = select && [...select.options].find(o => o.value === 'full-art');
    if (option && model) {
      option.textContent = basicLandMana(model) ? 'Full art — FF basic land' : 'Full art';
      option.label = option.textContent;
    }
    let hint = document.getElementById('basicLandFrameHint');
    if (!hint && select) {
      hint = document.createElement('div');
      hint.id = 'basicLandFrameHint';
      hint.className = 'hint';
      select.closest('label')?.after(hint);
    }
    if (hint && model) {
      hint.hidden = !basicLandMana(model);
      hint.textContent = 'Full art uses a floating name bar, low type bar and mana medallion. Mana reminder and flavour stay in the editor, not on the full-art card. Custom abilities keep their rules box.';
    }
    const readout`,'inspector option');
frames=replaceOnce(frames,'module.exports = {frameFamily, frameTraits, parseSagaText};','module.exports = {frameFamily, frameTraits, parseSagaText, basicLandMana, isFullArtBasic, frameSummary, applyFrameSystem};','test exports');
fs.writeFileSync(path.join(dir,'frame-system.js'),frames);
let css=read('frame-system.css');
if(css.includes('FF-style full-art basics'))throw Error('Basic-land CSS already present');
css+=String.raw`

/* FF-style full-art basics. Selection remains the existing per-card full-art
   treatment, sharing its crop profile, export and rendering pipeline. */
.render-card.treatment-full-art.basic-land-full-art {
  --bl-unit: 1px;
  --bl-tint: #e9e2ce;
}
.render-card.basic-land-full-art[data-basic-land-mana="U"] { --bl-tint: #cadbe2; }
.render-card.basic-land-full-art[data-basic-land-mana="B"] { --bl-tint: #d3cfce; }
.render-card.basic-land-full-art[data-basic-land-mana="R"] { --bl-tint: #e6c8b8; }
.render-card.basic-land-full-art[data-basic-land-mana="G"] { --bl-tint: #cfdbbf; }
.render-card.basic-land-full-art[data-basic-land-mana="C"] { --bl-tint: #d8d6ce; }
.render-card.treatment-full-art.basic-land-full-art .frame {
  background: #171716 !important;
}
.render-card.treatment-full-art.basic-land-full-art .inner {
  background: #242722 !important;
}
.render-card.treatment-full-art.basic-land-full-art .inner::before,
.render-card.treatment-full-art.basic-land-full-art .inner::after,
.render-card.treatment-full-art.basic-land-full-art .rules,
.render-card.treatment-full-art.basic-land-full-art .pt,
.render-card.treatment-full-art.basic-land-full-art .titlebar > .mana {
  display: none !important;
}
.render-card.treatment-full-art.basic-land-full-art .artbox {
  inset: 0 !important; height: auto !important; border: 0 !important;
  border-radius: 0 !important; clip-path: none !important;
}
.render-card.treatment-full-art.basic-land-full-art .titlebar,
.render-card.treatment-full-art.basic-land-full-art .typebar,
.render-card.treatment-full-art.basic-land-full-art .basic-land-medallion {
  color: #242320 !important;
  border: calc(1.2 * var(--bl-unit)) solid #292923 !important;
  background: linear-gradient(115deg, #f7f5e9 0%, var(--bl-tint) 28%, #fbf9ec 46%, var(--bl-tint) 72%, #eeeade 100%) !important;
  box-shadow: inset 0 0 0 calc(1 * var(--bl-unit)) #fffdf3,
    0 0 0 calc(1.8 * var(--bl-unit)) #e9e9dd,
    0 0 0 calc(3.1 * var(--bl-unit)) #272823,
    0 calc(3 * var(--bl-unit)) calc(5 * var(--bl-unit)) #0009 !important;
  backdrop-filter: none !important;
}
.render-card.treatment-full-art.basic-land-full-art .titlebar {
  top: calc(7 * var(--bl-unit)) !important;
  left: calc(7 * var(--bl-unit)) !important; right: calc(7 * var(--bl-unit)) !important;
  height: calc(36 * var(--bl-unit)) !important;
  padding: 0 calc(10 * var(--bl-unit)) !important;
  border-radius: calc(12 * var(--bl-unit)) / calc(18 * var(--bl-unit)) !important;
}
.render-card.treatment-full-art.basic-land-full-art .name {
  color: #242320 !important; text-shadow: none !important; text-transform: none !important;
}
.render-card.treatment-full-art.basic-land-full-art .under-name { color: #555249 !important; }
.render-card.treatment-full-art.basic-land-full-art .typebar {
  top: auto !important; bottom: calc(36 * var(--bl-unit)) !important;
  left: calc(40 * var(--bl-unit)) !important; right: calc(7 * var(--bl-unit)) !important;
  height: calc(34 * var(--bl-unit)) !important;
  padding: 0 calc(7 * var(--bl-unit)) 0 calc(11 * var(--bl-unit)) !important;
  border-radius: 0 calc(9 * var(--bl-unit)) calc(9 * var(--bl-unit)) 0 !important;
  z-index: 5 !important;
}
.render-card.treatment-full-art.basic-land-full-art .basic-land-medallion {
  position: absolute; left: calc(4 * var(--bl-unit)); bottom: calc(29 * var(--bl-unit));
  width: calc(48 * var(--bl-unit)); height: calc(48 * var(--bl-unit));
  display: grid; place-items: center; border-radius: 50% !important;
  z-index: 6; pointer-events: none;
}
.render-card.treatment-full-art.basic-land-full-art .basic-land-medallion > span {
  width: calc(38 * var(--bl-unit)); height: calc(38 * var(--bl-unit)); display: grid; place-items: center;
}
.render-card.treatment-full-art.basic-land-full-art .basic-land-medallion .mana-symbol {
  width: calc(38 * var(--bl-unit)) !important; height: calc(38 * var(--bl-unit)) !important;
  background: transparent !important; border: 0 !important; box-shadow: none !important;
  margin: 0 !important; padding: 0 !important;
}
.render-card.treatment-full-art.basic-land-full-art .basic-land-medallion img {
  filter: grayscale(1); border-radius: 50%;
}
.render-card.treatment-full-art.basic-land-full-art .footer {
  left: 0 !important; right: 0 !important; bottom: 0 !important;
  height: calc(31 * var(--bl-unit)) !important;
  padding: calc(3 * var(--bl-unit)) calc(8 * var(--bl-unit)) calc(2 * var(--bl-unit)) !important;
  background: linear-gradient(180deg, #141514aa, #141514 35%) !important; z-index: 4;
}
.render-card.treatment-full-art.basic-land-full-art .credit {
  color: #f5f0df !important; font-size: calc(7.5 * var(--bl-unit)) !important;
  line-height: 1.1 !important; margin: 0 0 calc(2 * var(--bl-unit)) !important;
  -webkit-line-clamp: 2;
}
.render-card.treatment-full-art.basic-land-full-art .collector-line {
  color: #f5f0df !important; font-size: calc(7.6 * var(--bl-unit)) !important;
}
@media print {
  .print-sheet .render-card.treatment-full-art.basic-land-full-art { --bl-unit: .166667mm; }
}
`;
fs.writeFileSync(path.join(dir,'frame-system.css'),css);
const buildPath=path.join(root,'scripts/build-odyssey-public-renderer.cjs');
let build=fs.readFileSync(buildPath,'utf8');
build=replaceOnce(build,"'decorateBattleStats','applyFrameSystem'","'decorateBattleStats','basicLandMana','isFullArtBasic','decorateBasicLand','applyFrameSystem'",'public renderer dependencies');
fs.writeFileSync(buildPath,build);
let index=read('index.html');
for(const file of ['frame-system.js','frame-system.css']){
 const re=new RegExp(file.replace('.','\\.')+'\\?v=[^\"\\\'<>\\s]+','g');
 if((index.match(re)||[]).length!==1)throw Error('Loader changed: '+file);
 index=index.replace(re,file+'?v=20260929-full-art-basics1');
}
fs.writeFileSync(path.join(dir,'index.html'),index);
console.log('Applied optional FF-style basic-land frame; no dataset or artwork changes.');
