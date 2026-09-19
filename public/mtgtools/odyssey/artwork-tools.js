/* Odyssey artwork tools v3.18: live DPI, subject pools, and searchable full-library artwork browsing.
   This is a read-only view over the active dataset; it never rewrites art assignments. */
(function (root) {
  'use strict';
  const VERSION = '3.19';
  const normalize = value => String(value == null ? '' : value).normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const textOf = (record, keys) => normalize(keys.map(key => {
    const value = record && record[key];
    return Array.isArray(value) ? value.join(' ') : typeof value === 'string' ? value : '';
  }).join(' '));
  const contains = (text, phrase) => !!phrase && (' ' + text + ' ').includes(' ' + phrase + ' ');
  const unique = values => [...new Set(values.filter(Boolean))];
  const NAME_KEYS = ['displayName', 'name'];
  const ART_KEYS = ['title', 'tags', 'subject', 'subjects', 'characters', 'entities', 'theme', 'themes', 'candidateCards', 'description', 'cropNotes'];
  const ART_SEARCH_KEYS = ['id','title','artist','tags','subject','subjects','characters','entities','theme','themes','candidateCards','description','cropNotes','date','period','medium','institution','matchType','status'];
  function artworkSearchText(art) { return textOf(art || {}, ART_SEARCH_KEYS); }
  const searchFieldCache = new WeakMap();
  function searchFields(art) {
    if (!art || typeof art !== 'object') return {title:'',tags:'',candidates:'',artist:'',rest:''};
    if (searchFieldCache.has(art)) return searchFieldCache.get(art);
    const fields={title:normalize(art.title),tags:normalize(art.tags),candidates:normalize(art.candidateCards),artist:normalize(art.artist),rest:artworkSearchText(art)};
    searchFieldCache.set(art,fields); return fields;
  }
  function artworkSearchScore(art, query) {
    const q = normalize(query), terms = q.split(/\s+/).filter(Boolean);
    if (!terms.length) return 0;
    const fields = searchFields(art);
    if (!terms.every(term => fields.rest.includes(term))) return -1;
    let score = 0;
    terms.forEach(term => {
      if (fields.title === term) score += 120; else if (fields.title.includes(term)) score += 55;
      if (fields.tags.includes(term)) score += 45;
      if (fields.candidates.includes(term)) score += 35;
      if (fields.artist.includes(term)) score += 15;
    });
    if (q && fields.title.includes(q)) score += 80;
    if (q && fields.tags.includes(q)) score += 55;
    if (q && fields.candidates.includes(q)) score += 40;
    return score;
  }
  function searchArtworks(artworks, query) {
    const q = normalize(query);
    if (!q) return [...(artworks || [])];
    return (artworks || []).map(art => ({art, score: artworkSearchScore(art, q)}))
      .filter(row => row.score >= 0)
      .sort((a,b) => b.score - a.score || String(a.art.title || a.art.id).localeCompare(String(b.art.title || b.art.id), undefined, {sensitivity:'base', numeric:true}))
      .map(row => row.art);
  }
  const ENTITY_ALIASES = [
    'Odysseus|Ulysses|Ulisse|Ulysse', 'Penelope|Penelopeia', 'Telemachus|Telemakhos|Telemachos|Telemaque',
    'Athena|Athene|Minerva|Pallas Athena', 'Poseidon|Neptune|Neptunus', 'Zeus|Jupiter',
    'Hermes|Mercury|Mercurius', 'Hera|Juno', 'Aphrodite|Venus', 'Hephaestus|Hephaistos|Vulcan',
    'Artemis|Diana', 'Apollo|Apollon', 'Ares|Mars', 'Dionysus|Dionysos|Bacchus', 'Demeter|Ceres',
    'Hades|Pluto', 'Persephone|Proserpina|Proserpine', 'Helios', 'Hyperion',
    'Scylla|Skylla', 'Charybdis|Kharybdis', 'Polyphemus|Polyphemos|Polyphème',
    'Circe|Kirke', 'Calypso|Kalypso', 'Aeolus|Aiolos|Eolus', 'Tiresias|Teiresias',
    'Nausicaa|Nausikaa', 'Alcinous|Alkinoos', 'Arete', 'Eumaeus|Eumaios', 'Eurycleia|Eurykleia',
    'Laertes', 'Argos|Argus', 'Elpenor', 'Eurylochus|Eurylokhos', 'Anticleia|Antikleia',
    'Antinous|Antinoos', 'Eurymachus|Eurymakhos', 'Amphinomus|Amphinomos', 'Melanthius|Melanthios',
    'Melantho', 'Phemius|Phemios', 'Demodocus|Demodokos', 'Theoclymenus|Theoklymenos',
    'Peisistratus|Pisistratus', 'Nestor', 'Menelaus|Menelaos', 'Helen|Helene',
    'Agamemnon', 'Clytemnestra|Klytemnestra', 'Aegisthus|Aigisthos', 'Orestes',
    'Achilles|Akhilleus', 'Patroclus|Patroklos', 'Ajax|Aias', 'Hector|Hektor', 'Priam|Priamos',
    'Cassandra|Kassandra', 'Diomedes', 'Heracles|Herakles|Hercules', 'Sisyphus|Sisyphos',
    'Tantalus|Tantalos', 'Ino|Leucothea|Leukothea', 'Antiphates', 'Cerberus|Kerberos'
  ];
  const SUBJECT_ALIASES = [
    'Ships and watercraft|ship|ships|boat|boats|watercraft|galley|galleys|trireme|triremes|bireme|biremes|raft|rafts|fleet|fleets|sail|sails|sailing|sailboat|sailboats|warship|warships|longship|longships|shipwreck|shipwrecks|oared|rowing|seagoing vessel',
    'Sea and waves|sea|seas|ocean|oceans|wave|waves|surf|seascape|seascapes|seashore',
    'Storms and lightning|storm|storms|stormy|tempest|tempests|lightning|thunderbolt|thunderbolts',
    'Weaving and looms|weaving|weaver|weavers|loom|looms|spindle|spindles|tapestry|tapestries',
    'Bows and archery|bow|bows|archer|archers|archery|arrow|arrows',
    'Temples and shrines|temple|temples|shrine|shrines|sanctuary|sanctuaries|altar|altars',
    'Underworld and spirits|underworld|necromancy|ghost|ghosts|shade|shades|spirits of the dead',
    'Sirens|siren|sirens', 'Cyclopes|cyclops|cyclopes', 'Lotus eaters|lotus|lotophagi|lotus eater|lotus eaters',
    'Laestrygonians|laestrygonian|laestrygonians|lestrygonian|lestrygonians',
    'Ithaca|Ithacan|Ithaka', 'Troy|Trojan|Ilium', 'Scheria|Phaeacian|Phaeacians|Phaeacia',
    'Ogygia|Ogygian', 'Aeaea|Aiaia', 'Thrinacia', 'Sparta|Spartan', 'Pylos|Pylian'
  ];

  function definitions(cards, artworks) {
    const defs = [], used = new Set();
    function add(line, kind) {
      const names = line.split('|').map(x => x.trim()).filter(Boolean);
      const aliases = unique(names.map(normalize));
      if (!aliases.length || aliases.some(x => used.has(x))) return;
      aliases.forEach(x => used.add(x));
      defs.push({ key: aliases[0], label: names[0], aliases, kind });
    }
    ENTITY_ALIASES.forEach(x => add(x, 'character'));
    SUBJECT_ALIASES.forEach(x => add(x, 'subject'));
    // Also learn explicit, capitalized library tags that occur in card names. This covers
    // minor nonlegendary characters without treating artist names or credits as subjects.
    const generic = new Set('greek roman ancient classical homer homeric odyssey art artwork figure human man woman portrait landscape scene myth mythology warrior soldier god goddess monster'.split(' '));
    const cardNames = cards.map(card => textOf(card, NAME_KEYS));
    artworks.forEach(art => {
      const tags = Array.isArray(art.tags) ? art.tags : String(art.tags || '').split(/[;,]/);
      tags.forEach(raw => {
        const tag = String(raw).trim(), key = normalize(tag);
        if (!/^\p{Lu}/u.test(tag) || key.length < 4 || key.split(' ').length > 3 || generic.has(key)) return;
        if (cardNames.some(name => contains(name, key))) add(tag, 'subject');
      });
    });
    // Learn additional named characters from the active set, including imported datasets.
    cards.forEach(card => {
      if (!/\blegendary\b/i.test(card.type || '') || !/\bcreature\b/i.test(card.type || '')) return;
      NAME_KEYS.forEach(key => {
        const name = String(card[key] || '').split(',')[0].trim();
        if (!name || /^the\s/i.test(name) || name.split(/\s+/).length > 3) return;
        if (!defs.some(d => d.aliases.some(a => contains(normalize(name), a)))) add(name, 'character');
      });
    });
    return defs;
  }

  function createRelatedIndex(cards, artworks, coverage) {
    const defs = definitions(cards, artworks);
    const byId = new Map(artworks.filter(a => a.id).map(a => [a.id, a]));
    const byNumber = new Map(cards.map(c => [Number(c.number), c]));
    const joins = new Map(coverage.map(c => [Number(c.number), c]));
    const groups = new Map(defs.map(d => [d.key, new Set()]));
    const directByName = new Map(), cache = new Map();
    const matches = text => defs.filter(d => d.aliases.some(a => contains(text, a)));
    function subjects(card) {
      const named = matches(textOf(card, NAME_KEYS));
      // A named Scylla card must not inherit all Odysseus images merely because its story mentions him.
      return named.length ? named : matches(textOf(card, ['story', 'theme', 'characters', 'subjects']));
    }
    function addToGroups(ds, ids) {
      ds.forEach(d => ids.forEach(id => { if (byId.has(id)) groups.get(d.key).add(id); }));
    }
    artworks.forEach(art => {
      addToGroups(matches(textOf(art, ART_KEYS)), [art.id]);
      const names = Array.isArray(art.candidateCards) ? art.candidateCards : String(art.candidateCards || '').split(/[;\n]/);
      names.forEach(name => {
        const key = normalize(name);
        if (!key) return;
        if (!directByName.has(key)) directByName.set(key, new Set());
        directByName.get(key).add(art.id);
      });
    });
    function directIds(card) {
      return unique(NAME_KEYS.flatMap(key => [...(directByName.get(normalize(card[key])) || [])]));
    }
    // Pool only original joins: never recursively pool expanded matches or a user's new selection.
    cards.forEach(card => {
      const join = joins.get(Number(card.number)) || {};
      addToGroups(subjects(card), unique([...(join.candidateIds || []), join.primary, card.primaryArt, ...directIds(card)]));
    });
    return {
      forCard(current) {
        const card = { ...(byNumber.get(Number(current.number)) || {}), ...current };
        const key = JSON.stringify([card.number, ...NAME_KEYS.map(k => card[k]), card.story, card.theme, card.characters, card.subjects]);
        if (cache.has(key)) return cache.get(key);
        const ds = subjects(card), reasons = new Map();
        ds.forEach(d => groups.get(d.key).forEach(id => {
          if (!reasons.has(id)) reasons.set(id, []);
          reasons.get(id).push(d.label);
        }));
        directIds(card).forEach(id => { if (!reasons.has(id)) reasons.set(id, ['Card-name match']); });
        const result = { ids: [...reasons.keys()], labels: ds.map(d => d.label), reasons };
        if (cache.size > 1000) cache.clear();
        cache.set(key, result);
        return result;
      }
    };
  }

  function warningState(q, minimum = 240) {
    const measured = !!q && Number.isFinite(q.dpi) && q.dpi > 0;
    const low = measured && q.dpi < minimum;
    // Floor the warning readout so a failing 239.99 DPI crop never appears to pass at 240.
    const dpi = measured ? (Math.floor(q.dpi * 10) / 10).toFixed(1).replace(/\.0$/, '') : '';
    return { measured, low, text: low ? `${dpi} DPI · below ${minimum}` : '' };
  }

  const STYLE = `
#previewShell .artbox > .art-dpi-frame{position:absolute;inset:0;z-index:90;pointer-events:none;border:3px solid #ff4545;border-radius:inherit;box-shadow:inset 0 0 0 1px #390808;display:none}
#previewShell .artbox.dpi-below-minimum > .art-dpi-frame{display:block}
#previewShell .art-dpi-label{position:absolute;top:7px;left:7px;max-width:calc(100% - 14px);padding:4px 7px;border-radius:4px;background:#8d1010;color:#fff;font:700 11px/1.3 system-ui,sans-serif;text-shadow:none}
#cropOverviewWindow.dpi-below-minimum{border-color:#ff4545!important;box-shadow:0 0 0 1px #8d1010!important}
.art-related-note{font:12px/1.5 system-ui,sans-serif;color:#c7c9b9;margin:8px 0 12px}
.art-opt-badge.related{background:#274b55;color:#e4f5f8}
.art-related-browse{margin-top:7px}
.art-dpi-status{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}

.art-search-tools{display:grid;grid-template-columns:auto minmax(180px,1fr) auto;align-items:center;gap:9px;padding:10px 13px;border-bottom:1px solid #343a30;background:#171a15}
.art-search-scope{display:flex;gap:3px;padding:3px;border:1px solid #41483a;border-radius:9px;background:#10120f}
.art-search-scope button{min-height:34px;padding:6px 10px;border:0;border-radius:6px;background:transparent;color:#aeb3a0;font:800 10px/1 system-ui,sans-serif;cursor:pointer}
.art-search-scope button.active{background:#39402f;color:#f1ead8;box-shadow:inset 0 0 0 1px #606952}
.art-search-input{width:100%;min-width:0;height:38px;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid #4b5242;background:#0f110e;color:#f1eee3;font:13px/1.2 system-ui,sans-serif}
.art-search-input:focus{outline:2px solid #b99c58;outline-offset:1px}
.art-search-count{color:#9ca18f;font:800 9px/1.2 system-ui,sans-serif;white-space:nowrap}
.art-option-use-indicator{position:absolute;z-index:3;right:7px;bottom:7px;padding:3px 6px;border-radius:999px;background:rgba(18,20,17,.68);border:1px solid rgba(230,226,210,.18);color:rgba(239,236,224,.74);font:700 7px/1.1 system-ui,sans-serif;letter-spacing:.045em;text-transform:uppercase;backdrop-filter:blur(3px)}
.art-option-use-indicator::before{content:"";display:inline-block;width:4px;height:4px;margin-right:4px;border-radius:50%;background:currentColor;vertical-align:1px;opacity:.8}
@media(max-width:760px){.art-search-tools{grid-template-columns:1fr auto;padding:8px}.art-search-scope{grid-column:1/-1}.art-search-scope button{flex:1;min-height:40px}.art-search-input{font-size:16px;height:42px}.art-search-count{font-size:8px}}
@media print{.art-dpi-frame,.art-dpi-status,.art-related-browse,.art-related-note{display:none!important}}
`;

  function install() {
    if (root.OdysseyArtworkToolsInstalled) return;
    if (typeof ART === 'undefined' || typeof CARDS === 'undefined' || typeof COVERAGE === 'undefined' ||
        typeof root.applyArtView !== 'function' || typeof root.effectiveCandidateIds !== 'function') {
      console.warn('Odyssey artwork tools: active Studio API is unavailable.');
      return;
    }
    root.OdysseyArtworkToolsInstalled = VERSION;
    const style = document.createElement('style');
    style.id = 'odyssey-artwork-tools-style'; style.textContent = STYLE; document.head.appendChild(style);
    const index = createRelatedIndex(CARDS, ART, COVERAGE);
    const originalCandidates = root.effectiveCandidateIds;
    const getRelated = n => index.forCard(root.model(n));
    root.effectiveCandidateIds = function (n) {
      return unique([...originalCandidates(n), ...getRelated(n).ids]);
    };
    const status = document.createElement('div');
    status.className = 'art-dpi-status'; status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
    document.body.appendChild(status);
    let lastLow = false;
    function updateWarning(m, img, artbox) {
      if (!artbox || !artbox.closest('#previewShell')) return;
      const q = root.qualityAssessment(m);
      // Unknown/loading/broken images must not keep a stale red warning.
      const available = img && img.complete && img.naturalWidth > 0 && img.style.display !== 'none';
      const state = warningState(available ? q : null, typeof PRINT_DPI_MIN === 'number' ? PRINT_DPI_MIN : 240);
      let frame = artbox.querySelector('.art-dpi-frame');
      if (state.low && !frame) {
        frame = document.createElement('span'); frame.className = 'art-dpi-frame'; frame.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span'); label.className = 'art-dpi-label'; frame.appendChild(label); artbox.appendChild(frame);
      }
      artbox.classList.toggle('dpi-below-minimum', state.low);
      if (frame) frame.firstChild.textContent = state.text;
      document.getElementById('cropOverviewWindow')?.classList.toggle('dpi-below-minimum', state.low);
      if (lastLow !== state.low) status.textContent = state.low
        ? 'Artwork resolution is below 240 DPI. Reduce zoom or use a higher-resolution source.'
        : state.measured ? 'Artwork resolution is back within the 240 DPI limit.' : '';
      lastLow = state.low;
    }
    const originalApply = root.applyArtView;
    root.applyArtView = function (img, m, artbox) {
      const result = originalApply.apply(this, arguments);
      updateWarning(m, img, artbox || img?.closest('.artbox'));
      return result;
    };
    const originalQuality = root.renderCropQuality;
    root.renderCropQuality = function () {
      const result = originalQuality.apply(this, arguments);
      const img = document.querySelector('#previewShell .art-img');
      const m = (typeof artViewModels !== 'undefined' && img && artViewModels.get(img)) || root.model(selected);
      updateWarning(m, img, document.querySelector('#previewShell .artbox')); 
      return result;
    };
    // Image load/error and layout ResizeObserver paths all flow through the existing renderer.
    document.getElementById('previewShell')?.addEventListener('error', event => {
      if (event.target.matches?.('.art-img')) updateWarning(root.model(selected), null, event.target.closest('.artbox'));
    }, true);
    const originalInspector = root.renderInspector;
    root.renderInspector = function () {
      const result = originalInspector.apply(this, arguments);
      const n = selected, related = getRelated(n), assigned = new Set(originalCandidates(n));
      const extra = related.ids.filter(id => !assigned.has(id)).length;
      if (extra) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'btn secondary small art-related-browse';
        button.textContent = `Browse all ${root.effectiveCandidateIds(n).length} artworks (+${extra} related)`;
        button.onclick = () => root.openArtOptions(n);
        document.getElementById('candidateChips')?.appendChild(button);
      }
      return result;
    };
    const originalOptions = root.renderArtOptions;
    const suggestedCandidates = root.effectiveCandidateIds;
    let artSearchCard = null, artSearchScope = 'suggested', artSearchQuery = '';

    function assignedUsage() {
      const use = new Map();
      CARDS.forEach(card => {
        const current = root.model(card.number), id = current && current.artId;
        if (!id) return;
        if (!use.has(id)) use.set(id, []);
        use.get(id).push(card.number);
      });
      return use;
    }
    function ensureSearchTools() {
      const grid = document.getElementById('artOptionsGrid');
      if (!grid) return null;
      let tools = document.getElementById('artSearchTools');
      if (!tools) {
        tools = document.createElement('div'); tools.id = 'artSearchTools'; tools.className = 'art-search-tools';
        tools.innerHTML = '<div class="art-search-scope" role="group" aria-label="Artwork search scope"><button type="button" data-art-search-scope="suggested">Suggested</button><button type="button" data-art-search-scope="all">Search all</button></div><input id="artOptionSearch" class="art-search-input" type="search" autocomplete="off" enterkeyhint="search" aria-label="Search artworks"><span id="artSearchCount" class="art-search-count" role="status" aria-live="polite"></span>';
        grid.before(tools);
        tools.querySelectorAll('[data-art-search-scope]').forEach(button => button.onclick = () => {
          artSearchScope = button.dataset.artSearchScope;
          root.renderArtOptions(false);
          requestAnimationFrame(() => {
            const search = document.getElementById('artOptionSearch');
            if (search) search.focus({preventScroll:true});
          });
        });
        let searchTimer = 0;
        tools.querySelector('#artOptionSearch').addEventListener('input', event => {
          artSearchQuery = event.target.value;
          clearTimeout(searchTimer);
          searchTimer = setTimeout(() => {
            if(document.getElementById('artOptionsOverlay')?.classList.contains('open')) root.renderArtOptions(false);
          }, 100);
        });
      }
      return tools;
    }
    function resultIds(n) {
      const suggested = suggestedCandidates(n);
      const source = artSearchScope === 'all' ? ART : suggested.map(id => artById[id]).filter(Boolean);
      const rows = searchArtworks(source, artSearchQuery);
      if (!artSearchQuery && artSearchScope === 'suggested') return [...suggested];
      const suggestedSet = new Set(suggested);
      return rows.map(a => a.id).filter(Boolean).sort((a,b) => {
        const sa = artworkSearchScore(artById[a], artSearchQuery), sb = artworkSearchScore(artById[b], artSearchQuery);
        if (artSearchQuery && sb !== sa) return sb - sa;
        if (artSearchScope === 'all' && suggestedSet.has(a) !== suggestedSet.has(b)) return Number(suggestedSet.has(b)) - Number(suggestedSet.has(a));
        return String((artById[a] && artById[a].title) || a).localeCompare(String((artById[b] && artById[b].title) || b), undefined, {sensitivity:'base', numeric:true});
      });
    }
    root.renderArtOptions = function () {
      const overlay = document.getElementById('artOptionsOverlay');
      if (!overlay || !overlay.classList.contains('open')) return originalOptions.apply(this, arguments);
      const n = selected;
      if (artSearchCard !== n) { artSearchCard = n; artSearchScope = 'suggested'; artSearchQuery = ''; }
      const suggested = suggestedCandidates(n), suggestedSet = new Set(suggested), visible = resultIds(n);
      const savedCandidates = root.effectiveCandidateIds;
      root.effectiveCandidateIds = target => Number(target) === Number(n) ? visible : savedCandidates(target);
      let result;
      try { result = originalOptions.apply(this, arguments); }
      finally { root.effectiveCandidateIds = savedCandidates; }

      const tools = ensureSearchTools(), input = tools && tools.querySelector('#artOptionSearch');
      if (input && input.value !== artSearchQuery) input.value = artSearchQuery;
      if (tools) tools.querySelectorAll('[data-art-search-scope]').forEach(button => {
        const active = button.dataset.artSearchScope === artSearchScope;
        button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
      });
      if (input) input.placeholder = artSearchScope === 'all'
        ? 'Search all ' + ART.length + ' artworks — title, artist, subject, place…'
        : 'Search ' + suggested.length + ' suggested artworks…';
      const count = tools && tools.querySelector('#artSearchCount');
      if (count) count.textContent = artSearchQuery
        ? visible.length + ' result' + (visible.length === 1 ? '' : 's') + ' · ' + (artSearchScope === 'all' ? 'all library' : 'suggested')
        : artSearchScope === 'all' ? ART.length + ' artworks' : suggested.length + ' suggested';

      const grid = document.getElementById('artOptionsGrid'), usage = assignedUsage();
      const order = new Map(visible.map((id,i)=>[id,i]));
      const tiles = grid ? [...grid.querySelectorAll('[data-art-option]')] : [];
      tiles.sort((a,b)=>(order.get(a.dataset.artOption)??9999)-(order.get(b.dataset.artOption)??9999)).forEach(tile=>grid.appendChild(tile));
      tiles.forEach(tile => {
        const id = tile.dataset.artOption;
        if (artSearchScope === 'all' && !suggestedSet.has(id)) {
          tile.classList.remove('new');
          const newBadge = tile.querySelector('.art-opt-badge.new');
          if (newBadge) newBadge.remove();
          tile.querySelectorAll('.art-option-badges .art-opt-badge').forEach(candidateBadge => {
            if (candidateBadge.classList.contains('unique') || /^×\d+$/i.test(candidateBadge.textContent.trim())) candidateBadge.remove();
          });
          const art = artById[id], meta = tile.querySelector('.art-option-meta');
          if (art && meta) {
            meta.textContent = '';
            const artist = document.createElement('b'); artist.textContent = art.artist || 'Unknown artist'; meta.appendChild(artist);
            meta.appendChild(document.createElement('br')); meta.appendChild(document.createTextNode(art.institution || ''));
            meta.appendChild(document.createElement('br')); meta.appendChild(document.createTextNode(id + ' · full library'));
          }
        }
        const otherUses = (usage.get(id) || []).filter(number => Number(number) !== Number(n));
        if (otherUses.length && !tile.querySelector('.art-option-use-indicator')) {
          const badge = document.createElement('span'); badge.className = 'art-option-use-indicator';
          badge.textContent = otherUses.length === 1 ? 'used' : 'used ×' + otherUses.length;
          badge.title = 'Already assigned to ' + otherUses.map(number => {
            const card = CARDS.find(c => Number(c.number) === Number(number)), current = root.model(number);
            return card ? String(number).padStart(3,'0') + ' ' + ((current && current.displayName) || card.name) : String(number);
          }).join(' · ');
          const thumb = tile.querySelector('.art-option-thumb');
          if (thumb) thumb.appendChild(badge);
        }
      });

      const related = getRelated(n), assigned = new Set(originalCandidates(n));
      let note = document.getElementById('artRelatedNote');
      if (!note && grid) {
        note = document.createElement('div'); note.id = 'artRelatedNote'; note.className = 'art-related-note';
        if (tools) tools.after(note); else grid.before(note);
      }
      const extra = related.ids.filter(id => !assigned.has(id)).length;
      if (note) {
        if (artSearchScope === 'all') note.textContent = 'Searching the full ' + ART.length + '-artwork library. Suggested and related matches still appear first when relevant; existing assignments change only when you select an image.';
        else if (artSearchQuery) note.textContent = 'Searching this card\'s ' + suggested.length + ' suggested and related artworks' + (extra ? ', including ' + extra + ' broader library matches.' : '.');
        else note.textContent = extra
          ? extra + ' additional library matches' + (related.labels.length ? ' · ' + related.labels.join(' · ') : '') + '. Existing assignments are unchanged; low-resolution sources remain unavailable.'
          : 'Showing assigned artwork and all matching library entries. Existing assignments are unchanged.';
      }
      tiles.forEach(tile => {
        const id = tile.dataset.artOption;
        if (assigned.has(id) || !suggestedSet.has(id) || tile.querySelector('.art-opt-badge.related')) return;
        const badge = document.createElement('span'); badge.className = 'art-opt-badge related'; badge.textContent = 'RELATED';
        badge.title = (related.reasons.get(id) || []).join(' · ');
        const badges = tile.querySelector('.art-option-badges');
        if (badges) badges.appendChild(badge);
      });
      const meta = document.getElementById('artOptionsMeta');
      if (meta) meta.textContent = visible.length + ' shown · ' + suggested.length + ' suggested · ' + ART.length + ' total · current ' + (root.model(n).artId || 'none');
      return result;
    };
    root.renderPreview();
    const label = document.querySelector('.topbar .version');
    if (label) label.textContent = `v${VERSION} · shared artwork + live DPI`;
  }
  const api = { VERSION, normalize, createRelatedIndex, warningState, artworkSearchScore, searchArtworks, install };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OdysseyArtworkTools = api;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
    else install();
  }
})(typeof window !== 'undefined' ? window : globalThis);
