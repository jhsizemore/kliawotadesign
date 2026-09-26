/* Odyssey frame system v3.13
   Automatic type-aware frames with MTG-style structural layouts. */
(function () {
  'use strict';

  const FRAME_CLASSES = [
    'kind-creature', 'kind-instant', 'kind-sorcery', 'kind-land',
    'kind-artifact', 'kind-artifact-creature', 'kind-enchantment',
    'kind-enchantment-creature', 'kind-planeswalker', 'kind-token',
    'kind-adventure', 'kind-prepare', 'kind-battle', 'kind-saga', 'kind-saga-creature',
    'kind-vehicle', 'trait-equipment', 'trait-food', 'trait-god',
    'trait-aura', 'trait-legendary', 'trait-transform',
    'trait-enchantment-artifact', 'trait-enchantment-land'
  ];

  function frontType(model) {
    return String(model.type || '').split('//')[0].trim();
  }

  function frameFamily(model) {
    const layout = String(model.layout || 'standard').toLowerCase();
    const type = frontType(model);
    if (layout === 'battle' || /\bBattle\b/i.test(type)) return 'battle';
    if (layout === 'adventure') return 'adventure';
    if (layout === 'prepare') return 'prepare';
    if (/\bSaga\b/i.test(type) && /\bCreature\b/i.test(type)) return 'saga-creature';
    if (layout === 'saga' || /\bSaga\b/i.test(type)) return 'saga';
    if (layout === 'vehicle' || /\bVehicle\b/i.test(type)) return 'vehicle';
    if (/\bPlaneswalker\b/i.test(type)) return 'planeswalker';
    if (/\bLand\b/i.test(type)) return 'land';
    if (/\bToken\b/i.test(type)) return 'token';
    if (/\bArtifact\b/i.test(type) && /\bCreature\b/i.test(type)) return 'artifact-creature';
    if (/\bEnchantment\b/i.test(type) && /\bCreature\b/i.test(type)) return 'enchantment-creature';
    if (/\bArtifact\b/i.test(type)) return 'artifact';
    if (/\bEnchantment\b/i.test(type)) return 'enchantment';
    if (/\bCreature\b/i.test(type)) return 'creature';
    if (/\bInstant\b/i.test(type)) return 'instant';
    if (/\bSorcery\b/i.test(type)) return 'sorcery';
    return 'sorcery';
  }

  function isLegendary(model) {
    const supertypes = frontType(model).split(/[—–]/)[0];
    return /\bLegendary\b/i.test(supertypes);
  }

  function frameTraits(model) {
    const type = frontType(model);
    const layout = String(model.layout || 'standard').toLowerCase();
    const traits = [];
    if (isLegendary(model)) traits.push('legendary');
    if (layout === 'transform') traits.push('transform');
    if (/\bEquipment\b/i.test(type)) traits.push('equipment');
    if (/\bFood\b/i.test(type)) traits.push('food');
    if (/\bGod\b/i.test(type)) traits.push('god');
    if (/\bAura\b/i.test(type)) traits.push('aura');
    if (/\bEnchantment\b/i.test(type) && /\bArtifact\b/i.test(type)) traits.push('enchantment-artifact');
    if (/\bEnchantment\b/i.test(type) && /\bLand\b/i.test(type)) traits.push('enchantment-land');
    return traits;
  }

  function familyLabel(family) {
    return ({
      creature: 'Creature', instant: 'Instant', sorcery: 'Sorcery', land: 'Land',
      artifact: 'Artifact', 'artifact-creature': 'Artifact creature',
      enchantment: 'Enchantment', 'enchantment-creature': 'Enchantment creature',
      planeswalker: 'Planeswalker', token: 'Token', adventure: 'Adventure',
      prepare: 'Prepared', battle: 'Battle', saga: 'Saga', 'saga-creature': 'Saga creature', vehicle: 'Vehicle'
    })[family] || family;
  }

  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parseSagaText(value) {
    const source = String(value || '').split('//BACK//')[0].trim();
    const markers = [...source.matchAll(/(?:^|\s)((?:IV|V|III|II|I)(?:\s*,\s*(?:IV|V|III|II|I))*)\s*[—-]\s*/g)];
    return {
      ordinary: markers.length ? source.slice(0, markers[0].index).trim() : source,
      chapters: markers.map((match, index) => ({
        numeral: match[1],
        text: source.slice(match.index + match[0].length, markers[index + 1]?.index ?? source.length).trim()
      }))
    };
  }

  function decorateSaga(card, model) {
    const rules = card.querySelector('.rules');
    const main = rules?.querySelector('.rule-main');
    if (!main || main.querySelector('.saga-chapters') || card.querySelector('.saga-creature-panel')) return;
    const {ordinary, chapters} = parseSagaText(model.rules);
    if (!chapters.length) return;
    const chapterHTML = `<div class="saga-chapters">${chapters.map(chapter =>
      `<div class="saga-chapter"><span class="saga-medallion" aria-hidden="true">${chapter.numeral}</span><span>${escapeHTML(chapter.text)}</span></div>`
    ).join('')}</div>`;
    if (card.classList.contains('kind-saga-creature')) {
      const panel = document.createElement('div');
      panel.className = 'saga-creature-panel';
      panel.innerHTML = chapterHTML;
      card.querySelector('.typebar')?.before(panel);
      const reminder = document.createElement('div');
      reminder.className = 'saga-creature-reminder';
      reminder.textContent = `(As this Saga enters and after your draw step, add a lore counter. Sacrifice after ${chapters.at(-1).numeral.split(',').at(-1).trim()}.)`;
      card.querySelector('.titlebar')?.after(reminder);
      main.innerHTML = ordinary ? `<span class="saga-creature-ability">${escapeHTML(ordinary)}</span>` : '';
    } else {
      main.innerHTML = chapterHTML;
    }
  }

  function decorateBattleStats(card, model) {
    const stat = card.querySelector('.pt');
    if (!stat || stat.querySelector('.defense-value')) return;
    const source = String(model.pt || '');
    const defense = source.match(/Defense\s*(\d+)/i)?.[1] || source.match(/\d+/)?.[0] || '—';
    const back = source.match(/\/\/\s*([0-9*]+\s*\/\s*[0-9*]+)/)?.[1] || '';
    stat.setAttribute('aria-label', `Defense ${defense}${back ? `; back face ${back}` : ''}`);
    stat.innerHTML = `<span class="defense-label">DEFENSE</span><span class="defense-value">${defense}</span>${back ? `<span class="battle-back-stat">${back}</span>` : ''}`;
  }

  function applyFrameSystem(card, model) {
    if (!card || !model) return card;
    card.classList.remove(...FRAME_CLASSES);
    const family = frameFamily(model);
    const traits = frameTraits(model);
    card.classList.add(`kind-${family}`, ...traits.map(t => `trait-${t}`));
    card.dataset.frameFamily = family;
    card.dataset.frameLabel = familyLabel(family);
    if (family === 'saga' || family === 'saga-creature') decorateSaga(card, model);
    if (family === 'battle') decorateBattleStats(card, model);
    return card;
  }

  function frameSummary(model) {
    const family = frameFamily(model);
    const traits = frameTraits(model).map(t => t[0].toUpperCase() + t.slice(1));
    const treatment = model.frameStyle === 'full-art' ? 'Full art' : 'Standard art';
    return [familyLabel(family), ...traits, treatment].join(' · ');
  }

  function installReadout() {
    const select = document.getElementById('fFrameStyle');
    const section = select?.closest('.section');
    if (!section || document.getElementById('frameSystemReadout')) return;
    const readout = document.createElement('div');
    readout.id = 'frameSystemReadout';
    readout.className = 'frame-system-readout';
    readout.setAttribute('aria-live', 'polite');
    section.appendChild(readout);
  }

  function updateReadout(model) {
    const readout = document.getElementById('frameSystemReadout');
    if (readout && model) {
      readout.innerHTML = `<span>AUTO FRAME</span><strong>${frameSummary(model)}</strong>`;
    }
  }

  function currentNumber() {
    const titleNumber = Number.parseInt(document.querySelector('#selectedTitle')?.textContent, 10);
    if (Number.isFinite(titleNumber) && titleNumber > 0) return titleNumber;
    const active = document.querySelector('.card-row.active');
    const value = Number(active?.dataset.n);
    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  function upgradeVersionLabel() {
    const label = document.querySelector('.topbar .version');
    if (label) label.textContent = 'v3.13 · MTG structural frames';
  }

  function upgradeInspectorLabels() {
    const labels = {
      standard: 'Standard MTG frame',
      adventure: 'Adventure split frame',
      prepare: 'Prepared split frame',
      battle: 'Battle — landscape',
      saga: 'Saga — story panel',
      transform: 'Transform — front/back proxy',
      vehicle: 'Vehicle — artifact frame'
    };
    const select = document.getElementById('fLayout');
    if (select) [...select.options].forEach(option => {
      const value = option.value;
      option.label = labels[value] || labels[option.textContent] || option.textContent;
      option.value = value;
    });
  }

  function install() {
    if (typeof window.model !== 'function' || typeof window.renderPreview !== 'function') {
      window.setTimeout(install, 30);
      return;
    }
    installReadout();
    upgradeVersionLabel();
    upgradeInspectorLabels();

    const originalMakeCardShell = window.makeCardShell;
    window.makeCardShell = function (model) {
      const shell = originalMakeCardShell(model);
      applyFrameSystem(shell.querySelector('.render-card'), model);
      return shell;
    };

    const originalRenderPreview = window.renderPreview;
    window.renderPreview = function () {
      const result = originalRenderPreview.apply(this, arguments);
      const current = window.model(currentNumber());
      const card = document.querySelector('#previewShell .render-card');
      const shown = window.OdysseyTransformFaces?.face(current, card?.dataset.face) || current;
      applyFrameSystem(card, shown);
      updateReadout(shown);
      return result;
    };

    const originalRenderInspector = window.renderInspector;
    window.renderInspector = function () {
      const result = originalRenderInspector.apply(this, arguments);
      updateReadout(window.model(currentNumber()));
      return result;
    };

    const observer = new MutationObserver(() => {
      const card = document.querySelector('#previewShell .render-card:not([data-frame-family])');
      if (!card) return;
      const current = window.model(currentNumber());
      const shown = window.OdysseyTransformFaces?.face(current, card.dataset.face) || current;
      applyFrameSystem(card, shown);
      updateReadout(shown);
    });
    const preview = document.getElementById('previewShell');
    if (preview) observer.observe(preview, { childList: true, subtree: true });

    window.renderPreview();
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = {frameFamily, frameTraits, parseSagaText};
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
