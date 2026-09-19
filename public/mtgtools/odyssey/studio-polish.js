/* Odyssey Studio v3.17: canonical symbol notation and uncropped title typography. */
(function (root) {
  'use strict';
  const refinement=root.OdysseyRefinement||(typeof require==='function'?require('./design-refinement.js'):null);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const TOKEN = /^(?:\d{1,3}|[WUBRGCSXYZTQEP]|[WUBRGC2]\/[WUBRGC]|[WUBRG]\/P|[WUBRG]\/[WUBRG]\/P|∞|½)$/;
  const COMPACT = /(?:[WUBRG]\/[WUBRG]\/P|[WUBRGC2]\/[WUBRGC]|[WUBRG]\/P|\d{1,3}|[WUBRGCSXYZTQEP]|∞|½)/y;
  const LABELS = {W:'white mana',U:'blue mana',B:'black mana',R:'red mana',G:'green mana',C:'colorless mana',S:'snow mana',T:'Tap',Q:'Untap',E:'Energy',P:'Phyrexian mana',X:'X mana',Y:'Y mana',Z:'Z mana'};
  function token(value) {
    let t = String(value ?? '').replace(/\s/g, '').toUpperCase();
    if (t === 'TAP') t = 'T';
    if (t === 'UNTAP') t = 'Q';
    return TOKEN.test(t) ? t : null;
  }
  function tokens(value) {
    const source = String(value ?? '').trim().toUpperCase();
    if (!source || /^[—–-]$/.test(source)) return [];
    const out = []; let i = 0;
    while (i < source.length) {
      if (/\s/.test(source[i])) { i++; continue; }
      if (source[i] === '{') {
        const end = source.indexOf('}', i + 1);
        if (end < 0) return null;
        const t = token(source.slice(i + 1, end));
        if (!t) return null;
        out.push(t); i = end + 1;
      } else {
        COMPACT.lastIndex = i;
        const match = COMPACT.exec(source);
        if (!match) return null;
        out.push(match[0]); i = COMPACT.lastIndex;
      }
    }
    return out;
  }
  function normalizeCost(value) {
    const parsed = tokens(value);
    return parsed === null ? String(value ?? '') : parsed.map(t => `{${t}}`).join('');
  }
  function normalizeRules(value) {
    let s = String(value ?? '').replace(/\{([^{}\n]+)\}/g, (whole, inner) => token(inner) ? `{${token(inner)}}` : whole);
    // Legacy card data uses compact costs in prose as well as in mana fields.
    // A number followed by a color code is unambiguous; do not rewrite ordinary numbers.
    s = s.replace(/(?<![\w{])(?:\d+)?[WUBRGCX]+(?![\w}])/g, cost => normalizeCost(cost));
    s = s.replace(/\b(Ward|Equip|Foretell|Flashback|Bestow|Escape|Miracle|Boast|Plot|Unearth|Kicker|Cycling) ([WUBRGC]+|\d+)(?=[.,;: \n]|$)/g, (_, word, cost) => word + ' ' + normalizeCost(cost));
    s = s.replace(/\b(Add|Pay|pay|costs?) ([WUBRGC]+|\d+)(?=[.,;: \n]|$)/g, (_, word, cost) => word + ' ' + normalizeCost(cost));
    // Only standalone T/Q in an activated cost, never the English instruction “Tap”.
    s = s.replace(/(^|[^A-Za-z0-9{])([TQ])(?=[ \t]*(?:,|:))/g, '$1{$2}');
    s = s.replace(/(^|\n|[.!?] +)([ \t]*)(\d+)(?=[ \t]*(?:,[ \t]*\{[TQ]\}|:))/g, '$1$2{$3}');
    // An inset spell's header has an explicit cost field, unlike arbitrary rules prose.
    s = s.replace(/(^|\n)([^\n]+?[ \t]+[—–-][ \t]+)([^\n]+?)([ \t]+[—–-][ \t]+(?:Instant|Sorcery)\b)/gi,
      (whole, start, name, cost, type) => tokens(cost) === null ? whole : start + name + normalizeCost(cost) + type);
    return s;
  }
  function normalizeCard(card) {
    if (!card || typeof card !== 'object') return card;
    for (const key of ['mana', 'manaCost', 'mana_cost']) if (typeof card[key] === 'string') card[key] = normalizeCost(card[key]);
    if (typeof card.rules === 'string') card.rules = normalizeRules(card.rules);
    return card;
  }
  function normalizeDataset(data) {
    if (Array.isArray(data?.cards)) data.cards.forEach(normalizeCard);
    return data;
  }
  function label(t) {
    return LABELS[t] || (t.includes('/') ? t.split('/').map(x => LABELS[x] || x).join(' or ') : `${t} generic mana`);
  }
  function glyph(t, pips) {
    const utility=refinement?.utilityGlyph(t);if(utility)return utility;
    const src = pips?.[t];
    if (src) return `<img class="mana-pip" src="${escapeHTML(src)}" alt="" aria-hidden="true">`;
    if (t === 'T' || t === 'Q') return `<svg class="od-tap-glyph" viewBox="0 0 24 24" aria-hidden="true"><g${t === 'Q' ? ' transform="translate(24 0) scale(-1 1)"' : ''}><path d="M5 17V7a3 3 0 0 1 3-3h7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M11 1h9v9l-3-3-6 6-3-3 6-6z" fill="currentColor"/><path d="M3 17h10v4H3z" fill="currentColor"/></g></svg>`;
    if (t === 'S') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 3 3-3M9 20l3-3 3 3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
    if (t === 'P') return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 1v22" stroke="currentColor" stroke-width="2.2"/></svg>';
    if (t.includes('/')) return `<span class="od-hybrid-parts" data-parts="${t.split('/').length}">${t.split('/').map(p => `<span class="od-hybrid-half m${/^[WUBRGC]$/.test(p) ? p : 'N'}">${glyph(p, pips)}</span>`).join('')}</span>`;
    return `<span class="od-generic-value${t.length > 2 ? ' od-small-number' : ''}">${escapeHTML(t)}</span>`;
  }
  function symbolHTML(value, inline, pips = {}) {
    const t = token(value);
    if (!t) return escapeHTML(`{${value}}`);
    const art = !!pips[t]&&!refinement?.utilityGlyph(t), special = ['C','T','Q','S','P','E'].includes(t), hybrid = t.includes('/');
    const classes = [inline ? 'inline-mana' : 'mana-symbol', 'od-symbol', art ? 'pip-art' : 'od-vector', hybrid ? 'od-hybrid' : '', special ? 'od-special-symbol' : '', `m${/^[WUBRGC]$/.test(t) ? t : 'N'}`].filter(Boolean).join(' ');
    return `<span class="${classes}" data-symbol="${escapeHTML(t)}" role="img" aria-label="${escapeHTML(label(t))}">${glyph(t, pips)}</span>`;
  }
  function costHTML(value, pips) {
    const parsed = tokens(value);
    if (parsed === null) return `<span class="od-symbol-error" title="Unrecognized mana notation; original value retained">${escapeHTML(value)}</span>`;
    return parsed.map(t => symbolHTML(t, false, pips)).join('');
  }
  function rulesHTML(value, pips) {
    return refinement.rulesHTML(normalizeRules(value),t=>token(t)?symbolHTML(t,true,pips):escapeHTML('{'+t+'}'));
  }
  function install() {
    if (root.OdysseyPolishInstalled || typeof root.model !== 'function') return;
    root.OdysseyPolishInstalled = '3.17';
    const pips = typeof MANA_PIP_DATA === 'undefined' ? {} : MANA_PIP_DATA;
    // Retain valid artwork approvals across notation-only normalization.
    const reviewed = typeof cardReview === 'undefined' || typeof root.reviewSignature !== 'function' ? [] : Object.entries(cardReview).filter(([n,r]) => r?.signature && r.signature === root.reviewSignature(+n)).map(([n]) => n);
    normalizeDataset(ODYSSEY_DATASET);
    if (root.ODYSSEY_DATA) normalizeDataset(root.ODYSSEY_DATA);
    Object.values(overrides).forEach(normalizeCard);
    root.manaHTML = cost => costHTML(cost, pips);
    root.inlineManaTokenHTML = t => symbolHTML(t, true, pips);
    root.formatRulesText = text => rulesHTML(text, pips);
    if (reviewed.length) { reviewed.forEach(n => { cardReview[n].signature = root.reviewSignature(+n); }); try { root.saveReview?.(); } catch (_) { /* Local quota must not prevent rendering. */ } }
    const oldDiff = root.diffOverride;
    root.diffOverride = function (n, data) { return oldDiff.call(this, n, normalizeCard({...data})); };
    const oldModel = root.model;
    root.model = function () { return normalizeCard(oldModel.apply(this, arguments)); };
    // Canonicalize explicit symbol fields in imported overrides and JSON exports too.
    const oldSave = root.save;
    root.save = function () { Object.values(overrides).forEach(normalizeCard); return oldSave.apply(this, arguments); };
    const oldDownload = root.download;
    if (typeof oldDownload === 'function') root.download = function (filename, content, ...rest) {
      if (/\.json$/i.test(filename) && typeof content === 'string') {
        try {
          const data = JSON.parse(content);
          normalizeDataset(data);
          const changes = data.overrides;
          if (changes && typeof changes === 'object') Object.values(changes).forEach(normalizeCard);
          content = JSON.stringify(data, null, 2);
        } catch (_) { /* Non-JSON downloads are not changed. */ }
      }
      return oldDownload.call(this, filename, content, ...rest);
    };
    function decorate(card) {
      for(const host of card.querySelectorAll('.saga-chapter > span:last-child')){
        if(host.dataset.odSentenceLayout)continue;
        const source=host.textContent;host.innerHTML=rulesHTML(source,pips);host.dataset.odSentenceLayout='1';
      }
      for(const host of card.querySelectorAll('.special-meta')){
        if(host.dataset.odSymbols)continue;
        const text=host.textContent.split(' · ').map(x=>tokens(x)?.length?normalizeCost(x):x).join(' · ');
        host.innerHTML=escapeHTML(text).replace(/\{([^{}]+)\}/g,(whole,t)=>token(t)?symbolHTML(t,true,pips):whole);host.dataset.odSymbols='1';
      }
    }
    const oldFit = root.fitCardTypography;
    root.fitCardTypography = function (card) {
      if (!card) return;
      decorate(card);
      // Undo only this helper's transient geometry, including when print CSS changes.
      for(const saved of card.odTextGeometry||[]){
        if(saved.value)saved.element.style.setProperty(saved.property,saved.value,saved.priority);
        else saved.element.style.removeProperty(saved.property);
      }
      card.odTextGeometry=[];delete card.dataset.rulesExpansion;
      card.classList.remove('od-rules-compact');
      oldFit(card);
      const rules=card.querySelector('.rules');
      if(rules?.dataset.fitState==='overflow'){card.classList.add('od-rules-compact');oldFit(card);}
      if(rules?.dataset.fitState==='overflow'&&!card.matches('.kind-saga,.kind-battle')&&card.offsetWidth){
        const scale=card.offsetWidth/378,art=card.querySelector('.artbox'),typebar=card.querySelector('.typebar');
        const amount=Math.min(24*scale,Math.max(14*scale,rules.scrollHeight-rules.clientHeight+8*scale));
        const move=(element,property,delta)=>{
          if(!element)return;
          const current=parseFloat(getComputedStyle(element)[property]);if(!Number.isFinite(current))return;
          card.odTextGeometry.push({element,property,value:element.style.getPropertyValue(property),priority:element.style.getPropertyPriority(property)});
          element.style.setProperty(property,Math.max(0,current+delta)+'px','important');
        };
        // The full native image and saved pan/zoom remain intact; only a little art-window height yields to text.
        if(!card.classList.contains('treatment-full-art'))move(art,'height',-amount);
        move(typebar,'top',-amount);move(rules,'top',-amount);
        card.dataset.rulesExpansion=(amount/scale).toFixed(1);oldFit(card);
        for(const img of card.querySelectorAll('.art-img')){const m=artViewModels.get(img);if(m)applyArtView(img,m);}
      }
      const name = card.querySelector('.name'), text = card.querySelector('.title-text'), bar = card.querySelector('.titlebar');
      if (!name || !text || !bar || !card.offsetWidth) return;
      const scale = card.offsetWidth / 378;
      const available = bar.clientHeight - 2 * scale;
      let size = parseFloat(getComputedStyle(name).fontSize);
      while (size > 9 * scale && (name.scrollWidth > text.clientWidth + .5 || text.offsetHeight > available + .5)) {
        size = Math.max(9 * scale, size - .2 * scale);
        name.style.setProperty('font-size', `${size}px`, 'important');
      }
      name.dataset.fitState = name.scrollWidth > text.clientWidth + .5 || text.offsetHeight > available + .5 ? 'overflow' : 'fit';
    };
    const oldOptions = root.renderArtOptions;
    let previousCard;
    root.renderArtOptions = function () {
      const grid = document.getElementById('artOptionsGrid');
      const sameCard = previousCard === selected, y = sameCard ? grid?.scrollTop || 0 : 0;
      const focused = sameCard ? document.activeElement?.closest('[data-art-option]')?.dataset.artOption : null;
      const result = oldOptions.apply(this, arguments);
      previousCard = selected;
      if (grid) grid.scrollTop = y;
      if (focused) grid?.querySelector(`[data-art-option="${CSS.escape(focused)}"]`)?.focus({preventScroll:true});
      return result;
    };
    document.querySelectorAll('#fMana,#fRules').forEach(input => {
      input.addEventListener('blur', () => {
        const value = input.id === 'fMana' ? normalizeCost(input.value) : normalizeRules(input.value);
        if (value !== input.value) { input.value = value; input.dispatchEvent(new Event('input', {bubbles:true})); }
      });
    });
    const label = document.querySelector('.topbar .version');
    if (label) label.textContent = 'v3.21 · full authoring';
    refinement.mount();
    root.renderPreview();
    document.fonts?.ready.then(() => document.querySelectorAll('.render-card').forEach(root.fitCardTypography));
  }
  const api = {token, tokens, normalizeCost, normalizeRules, normalizeCard, normalizeDataset, symbolHTML, costHTML, rulesHTML, install};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OdysseyPolish = api;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
    else install();
  }
})(typeof window === 'undefined' ? globalThis : window);
