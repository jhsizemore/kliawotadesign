/* Odyssey Studio v3.25: isolate and inherit art direction across Current and named candidate datasets. */
(function (root) {
  'use strict';
  const VERSION = 'art-transfer/v1';
  const CANDIDATES = new Set(['analysis-candidate-v1','analysis-candidate-v2']);
  const PREFIX = 'odyssey-art-transfer-v1';
  const BASE = {
    overrides: 'odyssey-layout-overrides-v02',
    crops: 'odyssey-art-crop-profiles-v04',
    review: 'odyssey-card-review-v04',
    profileReview: 'odyssey-profile-review-v05'
  };
  const ART_KEYS = ['artId', 'imageUrl', 'credit', 'source', 'zoom', 'focusX', 'focusY', 'fit', 'artHeight', 'frameStyle'];
  const CROP_KEYS = ['zoom', 'focusX', 'focusY', 'fit'];
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const clone = o => JSON.parse(JSON.stringify(o));
  const record = o => o && typeof o === 'object' && !Array.isArray(o);
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const pick = o => Object.fromEntries(ART_KEYS.filter(k => own(o, k)).map(k => [k, o[k]]));

  function read(storage, key) {
    const raw = storage.getItem(key);
    if (raw === null) return {};
    const value = JSON.parse(raw);
    if (!record(value)) throw new Error('Invalid saved art settings: ' + key);
    return value;
  }
  function writeBatch(storage, values) {
    const entries = Object.entries(values);
    const before = entries.map(([key]) => [key, storage.getItem(key)]);
    try {
      entries.forEach(([key, value]) => storage.setItem(key, JSON.stringify(value)));
    } catch (error) {
      // Free space used by the attempted transaction before restoring its snapshot.
      before.forEach(([key]) => storage.removeItem(key));
      before.forEach(([key, value]) => { if (value !== null) storage.setItem(key, value); });
      throw error;
    }
  }
  function indexDataset(data) {
    const ids = new Map(), artworks = new Map(), coverage = new Map();
    for (const card of data.cards || []) {
      // Duplicate IDs are ambiguous. Never guess from a name or collector position.
      if (card.id) ids.set(card.id, ids.has(card.id) ? null : card);
    }
    for (const art of data.artworks || []) artworks.set(art.id, art);
    for (const row of data.coverage || []) coverage.set(row.number, row);
    return { ids, artworks, coverage };
  }
  function defaults(card, index) {
    const id = card.primaryArt || index.coverage.get(card.number)?.primary || '';
    const art = index.artworks.get(id) || {};
    return {
      artId: id, imageUrl: card.imageUrl || art.imageUrl || '',
      credit: card.credit || art.credit || '', source: card.source || art.source || '',
      zoom: 1, focusX: 0, focusY: 0, fit: 'cover',
      layout: card.layout || 'standard', artHeight: 'normal', frameStyle: 'standard'
    };
  }
  function profileKey(m) {
    return `${m.artId || 'NOART'}|${m.layout || 'standard'}|${m.artHeight || 'normal'}${m.frameStyle === 'full-art' ? '|full-art' : ''}`;
  }
  function effective(card, index, overrides, profiles) {
    const o = overrides[card.number] || {};
    const m = Object.assign(defaults(card, index), o);
    const profile = profiles[profileKey(m)];
    if (profile) CROP_KEYS.forEach(k => {
      if (!own(o, k) && profile[k] !== undefined) m[k] = profile[k];
    });
    return m;
  }
  function artOverride(card, index, old, desired, profiles) {
    // Match Studio's diffOverride rules, retaining inheritance from shared profiles.
    const d = defaults(card, index);
    const probe = Object.assign({}, d, old, desired);
    const profile = profiles[profileKey(probe)];
    if (profile) CROP_KEYS.forEach(k => { if (profile[k] !== undefined) d[k] = profile[k]; });
    const next = Object.fromEntries(Object.entries(old).filter(([key]) => !ART_KEYS.includes(key)));
    ART_KEYS.forEach(k => { if (String(desired[k] ?? '') !== String(d[k] ?? '')) next[k] = desired[k]; });
    return next;
  }
  function transfer(input) {
    const { baseline, candidate, sourceOverrides = {}, sourceProfiles = {}, preserveCandidateArt = false } = input;
    const targetOverrides = clone(input.targetOverrides || {});
    const targetProfiles = clone(input.targetProfiles || {});
    const beforeProfiles = clone(targetProfiles);
    const meta = clone(input.meta || {});
    meta.cards ||= {};
    const source = indexDataset(baseline), target = indexDataset(candidate);
    const report = { applied: 0, changed: 0, kept: 0, curatedArtKept: 0, unmatched: 0, missingArt: 0, transient: 0, layoutReview: 0, profilesCopied: 0 };
    // Existing candidate profiles always win. New source profiles remain shared crops,
    // rather than turning every inherited card into a card-specific crop exception.
    Object.entries(sourceProfiles).forEach(([key, profile]) => {
      const id = key.split('|')[0];
      if (record(profile) && !own(targetProfiles, key) && (id === 'NOART' || target.artworks.has(id))) {
        targetProfiles[key] = clone(profile);
        report.profilesCopied++;
      }
    });
    for (const card of candidate.cards || []) {
      const old = targetOverrides[card.number] || {};
      const before = effective(card, target, targetOverrides, beforeProfiles);
      const keep = () => {
        // A newly copied shared profile must not indirectly change a skipped card.
        const current = effective(card, target, targetOverrides, targetProfiles);
        if (!equal(pick(current), pick(before))) {
          const held = artOverride(card, target, old, pick(before), targetProfiles);
          if (Object.keys(held).length) targetOverrides[card.number] = held;
          else delete targetOverrides[card.number];
        }
      };
      const original = source.ids.get(card.id);
      if (!original || target.ids.get(card.id) !== card) { report.unmatched++; keep(); continue; }
      const previous = meta.cards[card.id];
      const existingProfile = beforeProfiles[profileKey(before)];
      const edited = previous
        ? !equal(pick(before), previous.visual)
        : ART_KEYS.some(k => own(old, k)) || (existingProfile && !equal(existingProfile, sourceProfiles[profileKey(before)]));
      if (edited) { report.kept++; keep(); continue; }
      const from = effective(original, source, sourceOverrides, sourceProfiles);
      if (preserveCandidateArt && String(from.artId || '') !== String(before.artId || '')) {
        report.curatedArtKept++; keep(); meta.cards[card.id] = { visual: pick(before), sourceNumber: original.number }; continue;
      }
      if (from.artId && !target.artworks.has(from.artId)) { report.missingArt++; keep(); continue; }
      if (/^blob:/i.test(from.imageUrl || '')) { report.transient++; keep(); continue; }
      const desired = preserveCandidateArt
        ? Object.assign(pick(before), Object.fromEntries([...CROP_KEYS,'artHeight','frameStyle'].filter(k=>own(from,k)).map(k=>[k,from[k]])))
        : pick(from);
      // Layout, type, rules, stats, mana and names are deliberately outside ART_KEYS.
      const next = artOverride(card, target, old, desired, targetProfiles);
      if (Object.keys(next).length) targetOverrides[card.number] = next;
      else delete targetOverrides[card.number];
      const after = effective(card, target, targetOverrides, targetProfiles);
      if (!equal(pick(before), pick(after))) report.changed++;
      if (from.layout !== after.layout) report.layoutReview++;
      meta.cards[card.id] = { visual: pick(after), sourceNumber: original.number };
      report.applied++;
    }
    meta.version = VERSION;
    meta.initialized = true;
    meta.updatedAt = new Date().toISOString();
    meta.report = report;
    return { overrides: targetOverrides, crops: targetProfiles, meta, report };
  }
  function prepare(baseline, active, storage) {
    const candidateVersion = CANDIDATES.has(active.datasetVersion) ? active.datasetVersion : '';
    const candidate = !!candidateVersion;
    const keys = Object.fromEntries(Object.entries(BASE).map(([k, v]) => [k, candidate ? `${v}::${candidateVersion}` : v]));
    const metaKey = `${PREFIX}::${candidateVersion || 'current'}`;
    const state = { candidate, candidateVersion, keys, baseline, active, storage, metaKey, report: null };
    if (!candidate) {
      // Records that the legacy shared store now belongs to Current set only.
      try { storage.setItem(`${PREFIX}-source-ready`, 'true'); } catch (_) { /* No migration needed. */ }
      return state;
    }
    const meta = read(storage, metaKey);
    if (meta.initialized) { state.report = meta.report; return state; }
    const sourceOverrides = read(storage, BASE.overrides), sourceProfiles = read(storage, BASE.crops);
    const legacyCandidate = candidateVersion === 'analysis-candidate-v1' && storage.getItem(`${PREFIX}-source-ready`) !== 'true';
    const existed = storage.getItem(keys.overrides) !== null;
    // Older builds shared one store. When first opened on the candidate, retain
    // its existing overrides rather than trying to infer which set created them.
    const oldOverrides = existed ? read(storage, keys.overrides) : legacyCandidate ? sourceOverrides : {};
    const oldProfiles = storage.getItem(keys.crops) !== null ? read(storage, keys.crops) : legacyCandidate ? sourceProfiles : {};
    const result = transfer({ baseline, candidate: active, sourceOverrides, sourceProfiles,
      targetOverrides: oldOverrides, targetProfiles: oldProfiles, meta,
      preserveCandidateArt: candidateVersion === 'analysis-candidate-v2' });
    result.meta.legacySharedSettings = legacyCandidate;
    const writes = {
      [`${PREFIX}-legacy-backup`]: {
        capturedAt: new Date().toISOString(), activeDataset: active.datasetVersion,
        overrides: sourceOverrides, crops: sourceProfiles,
        review: read(storage, BASE.review), profileReview: read(storage, BASE.profileReview)
      },
      [`${metaKey}-last-backup`]: { overrides: oldOverrides, crops: oldProfiles, meta },
      [keys.overrides]: result.overrides, [keys.crops]: result.crops,
      [metaKey]: result.meta
    };
    // Do not overwrite a backup from the first migration or existing review state.
    if (storage.getItem(`${PREFIX}-legacy-backup`) !== null) delete writes[`${PREFIX}-legacy-backup`];
    for (const k of ['review', 'profileReview']) {
      if (storage.getItem(keys[k]) === null) writes[keys[k]] = legacyCandidate ? read(storage, BASE[k]) : {};
    }
    writeBatch(storage, writes);
    state.report = result.report;
    return state;
  }
  function copyAgain(state) {
    const { storage, keys, metaKey, baseline, active } = state;
    const overrides = read(storage, keys.overrides), crops = read(storage, keys.crops), meta = read(storage, metaKey);
    const result = transfer({ baseline, candidate: active,
      sourceOverrides: read(storage, BASE.overrides), sourceProfiles: read(storage, BASE.crops),
      targetOverrides: overrides, targetProfiles: crops, meta,
      preserveCandidateArt: state.candidateVersion === 'analysis-candidate-v2' });
    writeBatch(storage, {
      [`${metaKey}-last-backup`]: { overrides, crops, meta },
      [keys.overrides]: result.overrides, [keys.crops]: result.crops, [metaKey]: result.meta
    });
    state.report = result.report;
    return result;
  }
  function reportText(r) {
    if (!r) return '';
    const parts = [`${r.applied} cards inherited art settings`, `${r.kept} existing art edits kept`];
    if (r.curatedArtKept) parts.push(`${r.curatedArtKept} Candidate 2 art choices preserved`);
    if (r.layoutReview) parts.push(`${r.layoutReview} changed layouts to check`);
    if (r.unmatched) parts.push(`${r.unmatched} unmatched cards skipped`);
    if (r.missingArt) parts.push(`${r.missingArt} unavailable artworks skipped`);
    if (r.transient) parts.push(`${r.transient} session-only images skipped`);
    return parts.join(' · ');
  }
  function mount(state) {
    const install = () => {
      const version = document.querySelector('.topbar .version');
      if (version) version.textContent = 'v3.15 · inherited artwork';
      if (!state.candidate || document.getElementById('copyOriginalArt')) return;
      const picker = document.getElementById('datasetPicker');
      if (!picker) return;
      const button = document.createElement('button');
      button.id = 'copyOriginalArt';
      button.className = 'btn secondary small';
      button.type = 'button';
      const curatedCandidate = state.candidateVersion === 'analysis-candidate-v2';
      button.textContent = curatedCandidate ? 'Copy matching crops from Current set' : 'Copy art from Current set';
      button.title = curatedCandidate ? 'Copy crop/zoom treatment only when Current uses the same artwork. Keep Candidate 2 curated art choices, candidate-specific edits and all rules/layouts.' : 'Copy artwork and crops from Current set in this browser. Keep candidate-specific art edits and all candidate rules/layouts.';
      picker.insertAdjacentElement('afterend', button);
      const info = document.createElement('div');
      info.id = 'artTransferStatus';
      info.className = 'info-meta';
      info.setAttribute('role', 'status');
      info.style.marginTop = '8px';
      const anchor = document.getElementById('cropProfileInfo') || button;
      anchor.insertAdjacentElement('afterend', info);
      const update = () => { info.textContent = 'From Current set in this browser: ' + reportText(state.report) + '. Candidate rules and structural layouts are unchanged.'; };
      update();
      button.onclick = () => {
        button.disabled = true;
        try {
          const result = copyAgain(state);
          // These bindings are owned by the existing, non-module Studio script.
          overrides = result.overrides;
          cropProfiles = result.crops;
          root.renderPreview();
          root.renderList();
          root.updateReviewTop();
          if (document.getElementById('profileGallery')?.classList.contains('open')) root.renderProfileGallery();
          update();
          root.toast('Art settings copied; candidate edits kept');
        } catch (error) {
          info.textContent = 'Art copy failed: ' + error.message + '. Existing settings were not replaced.';
        } finally { button.disabled = false; }
      };
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
    else install();
  }
  const api = { prepare, transfer, copyAgain, mount, reportText, indexDataset, effective, profileKey, BASE, ART_KEYS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OdysseyArtTransfer = api;
})(typeof window !== 'undefined' ? window : globalThis);
