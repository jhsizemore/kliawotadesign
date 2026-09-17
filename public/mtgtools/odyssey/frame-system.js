/* Odyssey frame system v3.12
   Adds an automatic, type-aware frame taxonomy without changing card data. */
(function () {
  'use strict';

  const FRAME_CLASSES = [
    'kind-creature', 'kind-instant', 'kind-sorcery', 'kind-land',
    'kind-artifact', 'kind-artifact-creature', 'kind-enchantment',
    'kind-enchantment-creature', 'kind-planeswalker', 'kind-token',
    'kind-adventure', 'kind-prepare', 'kind-battle', 'kind-saga',
    'kind-vehicle', 'trait-equipment', 'trait-food', 'trait-god',
    'trait-aura', 'trait-legendary'
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
    const traits = [];
    if (isLegendary(model)) traits.push('legendary');
    if (/\bEquipment\b/i.test(type)) traits.push('equipment');
    if (/\bFood\b/i.test(type)) traits.push('food');
    if (/\bGod\b/i.test(type)) traits.push('god');
    if (/\bAura\b/i.test(type)) traits.push('aura');
    return traits;
  }

  function familyLabel(family) {
    return ({
      creature: 'Creature', instant: 'Instant', sorcery: 'Sorcery', land: 'Land',
      artifact: 'Artifact', 'artifact-creature': 'Artifact creature',
      enchantment: 'Enchantment', 'enchantment-creature': 'Enchantment creature',
      planeswalker: 'Planeswalker', token: 'Token', adventure: 'Adventure',
      prepare: 'Prepared', battle: 'Battle', saga: 'Saga', vehicle: 'Vehicle'
    })[family] || family;
  }

  function addOrnament(card) {
    const inner = card.querySelector('.inner');
    if (!inner || inner.querySelector('.frame-identity')) return;
    const ornament = document.createElement('div');
    ornament.className = 'frame-identity';
    ornament.setAttribute('aria-hidden', 'true');
    ornament.innerHTML = '<span class="identity-mark"></span><span class="identity-line"></span>';
    inner.appendChild(ornament);
  }

  function decorateSaga(card, model) {
    const rules = card.querySelector('.rules');
    if (!rules || rules.querySelector('.saga-rail')) return;
    const numerals = String(model.rules || '').match(/(?:^|\s)(I{1,3}|IV|V)(?=\s*[—-])/g) || [];
    const chapters = (numerals.length ? numerals : [' I', ' II', ' III'])
      .slice(0, 4)
      .map(value => value.trim());
    const rail = document.createElement('div');
    rail.className = 'saga-rail';
    rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = chapters.map(n => `<span>${n}</span>`).join('');
    rules.prepend(rail);
  }

  function decorateBattleStats(card, model) {
    const stat = card.querySelector('.pt');
    if (!stat || stat.querySelector('.defense-value')) return;
    const source = String(model.pt || '');
    const defense = source.match(/Defense\s*(\d+)/i)?.[1] || source.match(/\d+/)?.[0] || '—';
    const back = source.match(/\/\/\s*([0-9*]+\s*\/\s*[0-9*]+)/)?.[1] || '';
    stat.innerHTML = `<span class="defense-label">DEF</span><span class="defense-value">${defense}</span>${back ? `<span class="battle-back-stat">${back}</span>` : ''}`;
  }

  function decorateSpecialInset(card, family) {
    const box = card.querySelector('.special-box');
    if (!box || box.querySelector('.special-kind-mark')) return;
    const mark = document.createElement('span');
    mark.className = 'special-kind-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = family === 'adventure' ? '✦' : family === 'prepare' ? '◈' : family === 'battle' ? '◆' : '';
    box.prepend(mark);
  }

  function applyFrameSystem(card, model) {
    if (!card || !model) return card;
    card.classList.remove(...FRAME_CLASSES);
    const family = frameFamily(model);
    const traits = frameTraits(model);
    card.classList.add(`kind-${family}`, ...traits.map(t => `trait-${t}`));
    card.dataset.frameFamily = family;
    card.dataset.frameLabel = familyLabel(family);
    addOrnament(card);
    if (family === 'saga') decorateSaga(card, model);
    if (family === 'battle') decorateBattleStats(card, model);
    if (family === 'adventure' || family === 'prepare' || family === 'battle') {
      decorateSpecialInset(card, family);
    }
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
    const active = document.querySelector('.card-row.active');
    const value = Number(active?.dataset.n);
    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  function upgradeVersionLabel() {
    const label = document.querySelector('.topbar .version');
    if (label) label.textContent = 'v3.12 · complete frame system';
  }

  function install() {
    if (typeof window.model !== 'function' || typeof window.renderPreview !== 'function') {
      window.setTimeout(install, 30);
      return;
    }
    installReadout();
    upgradeVersionLabel();

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
      applyFrameSystem(document.querySelector('#previewShell .render-card'), current);
      updateReadout(current);
      return result;
    };

    const originalRenderInspector = window.renderInspector;
    window.renderInspector = function () {
      const result = originalRenderInspector.apply(this, arguments);
      updateReadout(window.model(currentNumber()));
      return result;
    };

    window.renderPreview();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
