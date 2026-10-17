import { normalize, formatDuration, validateLibrary, selectTracks, csvForTracks, cleanShortlist, collectionViews, mainPlaylistId, requestsPlaylistId } from './library.mjs';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORAGE = 'djhunter.wedding.shortlist.v1';
const SORTS = ['order','title','artist','bpm','key','durationSeconds','year'];
let data, collections = [], trackMap, validIds, shortlist = {}, rows = [], positions = new Map(), page = 1, pageSize = 50, detailId = null, storageFailed = false, toastTimer;
const query = new URLSearchParams(location.search);
const numberFilter = value => value !== null && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 400 ? value : '';
const state = { playlist: query.get('list') || '', q: (query.get('q') || '').slice(0, 300), min: numberFilter(query.get('min')), max: numberFilter(query.get('max')), key: query.get('key') || '', genre: query.get('genre') || '', sort: SORTS.includes(query.get('sort')) ? query.get('sort') : 'order', dir: query.get('dir') === 'desc' ? 'desc' : 'asc' };
const descriptions = { 'Wedding':'Every track under Wedding, including tracks filed directly in the collection.', 'Originals':'The original recordings in the Wedding playlist.', 'Remixes':'The current handpicked remixes, in their original playlist order.', 'New Options':'More recordings to explore. These are options, not a rejected list.', 'New Options - Fresh Internet (64)':'The fresh internet evaluation playlist from the current library.' };
const mainId = () => mainPlaylistId(data);
const requestId = () => requestsPlaylistId(data);
function collectionLabel(playlist) {
  if (playlist.id === mainId()) return 'Main play order';
  if (playlist.id === requestId()) return 'Requests & originals';
  if (playlist.id === data.rootPlaylistId) return 'All Wedding tracks';
  return playlist.name.replace(/New Options - Fresh Internet(?: \(\d+\))?/, 'Fresh Internet');
}
function toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4300); }
function persist() {
  try { localStorage.setItem(STORAGE, JSON.stringify(shortlist)); return true; }
  catch { if (!storageFailed) toast('Browser storage is unavailable. Save a shortlist backup before leaving.'); storageFailed = true; return false; }
}
function updateURL(push = false) {
  const params = new URLSearchParams();
  if (state.playlist !== mainId()) params.set('list', state.playlist);
  if (state.q) params.set('q', state.q);
  for (const key of ['min','max','key','genre']) if (state[key] !== '') params.set(key, state[key]);
  if (state.sort !== 'order') params.set('sort', state.sort);
  if (state.dir === 'desc') params.set('dir', 'desc');
  const url = location.pathname + (params.size ? '?' + params : '') + location.hash;
  if (url !== location.pathname + location.search + location.hash) history[push ? 'pushState' : 'replaceState'](null, '', url);
}
function updateShortlistCount() { const count = Object.values(shortlist).filter(v => v.starred).length; $('shortlist-count').textContent = count; $('shortlist-nav').classList.toggle('active', state.playlist === 'shortlist'); $('shortlist-nav').setAttribute('aria-current', state.playlist === 'shortlist' ? 'page' : 'false'); }
function setCollection(id) {
  if (!data || (id !== 'shortlist' && !collections.some(p => p.id === id))) return;
  Object.assign(state, { playlist:id, q:'', min:'', max:'', key:'', genre:'', sort:'order', dir:'asc' });
  page = 1; render(true);
  if (matchMedia('(max-width:700px)').matches) $('collection').scrollIntoView({ behavior: 'auto' });
}
function nav() {
  const primary = [...new Set([mainId(), requestId(), data.rootPlaylistId].filter(Boolean))].map(id => collections.find(p => p.id === id));
  const button = p => `<button type="button" class="nav-item${p.id === requestId() ? ' requests-nav' : ''}${state.playlist === p.id ? ' active' : ''}" data-list="${esc(p.id)}" aria-current="${state.playlist === p.id ? 'page' : 'false'}"><span><span class="nav-symbol" aria-hidden="true">${p.id === mainId() ? '≋' : p.id === requestId() ? '♡' : '▦'}</span>${esc(collectionLabel(p))}</span><span class="nav-count">${p.trackIds.length.toLocaleString()}</span></button>`;
  $('primary-nav').innerHTML = primary.map(button).join('');
  $('playlist-nav').innerHTML = collections.filter(p => !primary.includes(p)).map(button).join('');
  const count = Object.values(shortlist).filter(v => v.starred).length;
  $('mobile-primary').innerHTML = [{id:mainId(),icon:'≋',name:'Play order'},{id:requestId(),icon:'♡',name:'Requests',count:collections.find(p => p.id === requestId())?.trackIds.length},{id:data.rootPlaylistId,icon:'▦',name:'All tracks'},{id:'shortlist',icon:'☆',name:`My picks${count ? ` · ${count}` : ''}`}].filter(item => item.id).map(item => `<button type="button" data-list="${esc(item.id)}" class="${state.playlist === item.id ? 'active' : ''}" aria-current="${state.playlist === item.id ? 'page' : 'false'}"${item.count ? ` aria-label="${esc(item.name)}, ${item.count.toLocaleString()} tracks"` : ''}><span aria-hidden="true">${item.icon}</span>${esc(item.name)}${item.count ? `<span class="mobile-count" aria-hidden="true">${item.count.toLocaleString()}</span>` : ''}</button>`).join('');
  $('collection-picker').value = state.playlist;
  updateShortlistCount();
}
function syncControls() {
  $('search').value = state.q;
  if (document.activeElement !== $('bpm-min')) $('bpm-min').value = state.min;
  if (document.activeElement !== $('bpm-max')) $('bpm-max').value = state.max;
  $('key-filter').value = state.key; $('genre-filter').value = state.genre; $('sort').value = state.sort;
  $('sort').querySelector('option[value="order"]').textContent = state.playlist === mainId() ? 'Main play order' : state.playlist === 'shortlist' ? 'Date saved' : 'Playlist order';
  $('sort-direction').textContent = state.dir === 'asc' ? '↑' : '↓';
  $('sort-direction').setAttribute('aria-label', state.dir === 'asc' ? 'Sort descending' : 'Sort ascending');
  const count = ['min','max','key','genre'].filter(key => state[key] !== '').length;
  $('filter-count').hidden = !count; $('filter-count').textContent = count;
  document.querySelectorAll('th[data-active]').forEach(th => { th.removeAttribute('aria-sort'); th.removeAttribute('data-active'); });
  document.querySelectorAll('th button[data-sort]').forEach(button => { const active = button.dataset.sort === state.sort; button.querySelector('span').textContent = active ? state.dir === 'asc' ? ' ↑' : ' ↓' : ''; if (active) { button.closest('th').setAttribute('aria-sort', state.dir === 'asc' ? 'ascending' : 'descending'); button.closest('th').dataset.active = 'true'; } });
}
function badges(track) {
  const playlists = data.playlists.filter(p => p.id !== data.rootPlaylistId && track.playlistIds.includes(p.id));
  if (!playlists.length) return '<span class="version">Wedding</span>';
  return `<div class="list-badges">${playlists.slice(0, 2).map(p => `<button class="list-badge${p.name === 'Remixes' ? ' selected' : ''}" type="button" data-list="${esc(p.id)}" title="Open ${esc(p.name)}">${esc(p.name.startsWith('New Options - Fresh') ? 'Fresh Internet' : p.name)}</button>`).join('')}${playlists.length > 2 ? `<button class="list-badge" type="button" data-detail="${esc(track.id)}" aria-label="Show all ${playlists.length} playlists">+${playlists.length - 2}</button>` : ''}</div>`;
}
function render(push = false) {
  if (!data) return;
  const active = document.activeElement;
  const focusKey = active?.closest('dialog') ? null : ['star','list','detail'].map(key => active?.dataset?.[key] ? [key,active.dataset[key]] : null).find(Boolean);
  const selection = selectTracks(data, state, shortlist); rows = selection.rows; positions = selection.positions;
  const pages = Math.max(1, Math.ceil(rows.length / pageSize)); page = Math.max(1, Math.min(page, pages));
  const playlist = collections.find(p => p.id === state.playlist);
  const isMain = state.playlist === mainId(), isRequests = state.playlist === requestId();
  const searchScope = isMain ? 'main play order' : isRequests ? 'requests and originals' : state.playlist === 'shortlist' ? 'My picks' : collectionLabel(playlist);
  $('search').placeholder = isMain ? 'Search play order…' : isRequests ? 'Search requests & originals…' : state.playlist === 'shortlist' ? 'Search My picks…' : 'Search this collection…';
  $('search').setAttribute('aria-label', `Search ${searchScope} by song, artist or version`);
  const changedSequence = state.sort !== 'order' || state.dir !== 'asc' || state.q || ['min','max','key','genre'].some(k => state[k] !== '');
  $('view-title').textContent = state.playlist === 'shortlist' ? 'My picks' : collectionLabel(playlist);
  $('view-kicker').textContent = isMain ? 'THE NIGHT, IN ORDER' : isRequests ? 'THE FULL REQUEST COLLECTION' : state.playlist === 'shortlist' ? 'YOUR PERSONAL PICKS' : 'BROWSE THE LIBRARY';
  $('view-description').textContent = isMain ? 'The sequenced Wedding set. Track numbers show the intended running order.' : isRequests ? 'The request catalogue and all Originals, together in one place. Includes useful alternate recordings.' : state.playlist === 'shortlist' ? 'Your favourites and notes, saved on this browser and device.' : playlist.description || descriptions[playlist.name] || `The ${playlist.name} playlist, in its current library order.`;
  $('sequence-status').hidden = !isMain;
  $('sequence-message').textContent = changedSequence ? 'You’re exploring a sorted or filtered view. The original sequence is always one tap away.' : `${playlist?.trackIds.length.toLocaleString()} tracks · original running order`;
  $('return-sequence').hidden = !changedSequence;
  $('collection').classList.toggle('requests-view', isRequests);
  $('collection-picker').closest('label').hidden = isMain || isRequests || state.playlist === 'shortlist';
  let deezerUrl = null;
  try { const url = new URL(data.presentation?.originalsDeezerUrl); if (url.protocol === 'https:' && /(^|\.)deezer\.com$/.test(url.hostname)) deezerUrl = url.href; } catch { /* No playlist has been published yet. */ }
  $('deezer-requests').hidden = !isRequests || !deezerUrl;
  if (deezerUrl) $('deezer-requests').href = deezerUrl;
  $('shortlist-tools').hidden = state.playlist !== 'shortlist';
  const start = (page - 1) * pageSize, end = Math.min(start + pageSize, rows.length);
  $('results-count').textContent = rows.length ? `${(start + 1).toLocaleString()}–${end.toLocaleString()} of ${rows.length.toLocaleString()} tracks${rows.length !== selection.total ? ` · ${selection.total.toLocaleString()} in this list` : ''}` : '0 tracks';
  $('track-rows').innerHTML = rows.slice(start, end).map(t => {
    const short = shortlist[t.id]?.starred === true;
    const version = t.version && !normalize(t.title).includes(normalize(t.version)) ? `<div class="version">${esc(t.version)}</div>` : '';
    const bpm = Number.isFinite(t.bpm) ? Number(t.bpm.toFixed(1)) : '—';
    return `<tr><td class="number-col">${positions.get(t.id) + 1}</td><td class="star-col"><button class="star" type="button" data-star="${esc(t.id)}" aria-pressed="${short}" aria-label="${short ? 'Remove' : 'Add'} ${esc(t.title)} ${short ? 'from' : 'to'} My picks">${short ? '★' : '☆'}</button></td><td class="title-cell"><span class="card-position">${isMain ? 'PLAY ' : '#'}${String(positions.get(t.id) + 1).padStart(2,'0')}</span><button type="button" class="track-link" data-detail="${esc(t.id)}">${esc(t.title || 'Untitled recording')}</button>${version}<span class="mobile-artist">${esc(t.artist || 'Artist not tagged')}</span><div class="mobile-meta"><span>${bpm} BPM</span><span>${esc(t.key || 'Key not tagged')}</span><span>${formatDuration(t.durationSeconds)}</span><span class="tap-details" aria-hidden="true">Details ↗</span></div></td><td class="artist-cell"><div class="artist-name">${esc(t.artist || 'Artist not tagged')}</div></td><td class="numeric">${bpm}</td><td>${t.key ? `<span class="key-badge" title="${esc(t.keyName)}">${esc(t.key)}</span>` : '—'}</td><td class="numeric">${formatDuration(t.durationSeconds)}</td><td class="lists-cell">${badges(t)}</td><td class="more-cell"><button class="more-button" type="button" data-detail="${esc(t.id)}" aria-label="Details for ${esc(t.title)}">↗</button></td></tr>`;
  }).join('');
  const invalidRange = state.min !== '' && state.max !== '' && Number(state.min) > Number(state.max);
  $('empty').hidden = rows.length > 0;
  $('empty').innerHTML = invalidRange ? '<h3>That tempo range is reversed.</h3><p>Set the minimum BPM below the maximum, or reset the filters.</p><button class="button outline" type="button" data-reset>Reset filters</button>' : state.playlist === 'shortlist' && !selection.total ? '<h3>Your night starts with a favourite.</h3><p>Tap the star beside any track to keep it here.</p><button class="button outline" type="button" data-all>Explore all Wedding tracks</button>' : '<h3>No tracks match this view.</h3><p>Try a different search, widen the tempo range or clear the filters.</p><button class="button outline" type="button" data-reset>Clear search & filters</button>';
  $('page-label').textContent = `Page ${page} of ${pages}`;
  $('prev').disabled = page <= 1; $('next').disabled = page >= pages; $('export').disabled = !rows.length;
  syncControls(); nav(); updateURL(push);
  if (focusKey && !document.contains(active)) {
    const replacement = [...document.querySelectorAll(`[data-${focusKey[0]}="${CSS.escape(focusKey[1])}"]`)].find(element => element.getClientRects().length);
    if (replacement) replacement.focus({ preventScroll:true });
    else { $('view-title').tabIndex = -1; $('view-title').focus({ preventScroll:true }); }
  }
}
function toggleStar(id) {
  const previous = shortlist[id] || {};
  shortlist[id] = { note: previous.note || '', addedAt: previous.addedAt || Date.now(), starred: !previous.starred };
  if (!shortlist[id].starred && !shortlist[id].note) delete shortlist[id];
  const saved = persist(); render();
  if (detailId === id) updateDetailStar();
  if (saved) toast(shortlist[id]?.starred ? 'Added to your shortlist · saved in this browser' : 'Removed from your shortlist');
}
function updateDetailStar() { const button = $('detail-star'); if (button) { button.textContent = shortlist[detailId]?.starred ? '★  In My picks' : '☆  Add to My picks'; button.setAttribute('aria-pressed', shortlist[detailId]?.starred ? 'true' : 'false'); } }
function detailMemberships(track) {
  const available = collections.filter(p => p.trackIds.includes(track.id));
  const priorityIds = new Set([mainId(), requestId(), data.presentation?.originalsPlaylistId, ...data.playlists.filter(p => p.name === 'Remixes').map(p => p.id)]);
  let primary = available.filter(p => priorityIds.has(p.id));
  if (!primary.length) primary = available.slice(0, 2);
  const secondary = available.filter(p => !primary.includes(p));
  const buttons = playlists => playlists.map(p => `<button class="list-badge" type="button" data-detail-list="${esc(p.id)}">${esc(collectionLabel(p))}</button>`).join('');
  return `<div class="detail-playlists">${buttons(primary)}</div>${secondary.length ? `<details class="more-playlists"><summary>More playlists (${secondary.length})</summary><div class="detail-playlists">${buttons(secondary)}</div></details>` : ''}`;
}
function openDetail(id) {
  const track = trackMap.get(id); if (!track) return;
  detailId = id;
  const lookup = `${track.artist || ''} ${track.title || ''}`.trim();
  const fields = [['Tempo',Number.isFinite(track.bpm) ? `${Number(track.bpm.toFixed(1))} BPM` : 'Not tagged'],['Musical key',track.key ? `${track.key} · ${track.keyName}` : 'Not tagged'],['Length',formatDuration(track.durationSeconds)],['Year',track.year || 'Not tagged'],['Genre',track.genre || 'Not tagged'],['Remixer',track.remixer || 'Not tagged']];
  $('track-detail').innerHTML = `<h2 id="detail-title">${esc(track.title)}</h2><p class="detail-artist">${esc(track.artist || 'Artist not tagged')}</p>${track.version ? `<p class="version">Version: ${esc(track.version)}</p>` : ''}<dl class="detail-grid">${fields.map(([name,value]) => `<div><dt>${esc(name)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${track.album ? `<p class="version">Album: ${esc(track.album)}</p>` : ''}<span class="detail-label">Find it in</span>${detailMemberships(track)}<span class="detail-label">Look up this recording</span><div class="lookup-links"><a href="https://www.youtube.com/results?search_query=${encodeURIComponent(lookup)}" target="_blank" rel="noopener noreferrer">YouTube ↗</a><a href="https://soundcloud.com/search/sounds?q=${encodeURIComponent(lookup)}" target="_blank" rel="noopener noreferrer">SoundCloud ↗</a><a href="https://open.spotify.com/search/${encodeURIComponent(lookup)}" target="_blank" rel="noopener noreferrer">Spotify ↗</a></div><p class="lookup-hint">Search results may include other versions. Match the artist and treatment.</p><button id="detail-star" class="button detail-star" type="button"></button><label class="detail-note">Your note<textarea id="detail-note" maxlength="2000" placeholder="A must-play, a moment, a memory…">${esc(shortlist[id]?.note || '')}</textarea></label><p class="note-hint">Notes save as you type on this device. Adding a note also stars the track.</p>`;
  updateDetailStar(); $('track-dialog').showModal();
}
function reset() { Object.assign(state, { q:'',min:'',max:'',key:'',genre:'' }); page = 1; render(); }
function download(content, name, mime) { const url = URL.createObjectURL(new Blob([content], { type: mime })); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); }
async function load() {
  $('load-error').hidden = true;
  try {
    const response = await fetch('./wedding-library.json', { cache: 'no-cache' }); if (!response.ok) throw new Error(`Library HTTP ${response.status}`);
    data = validateLibrary(await response.json()); collections = collectionViews(data); trackMap = new Map(data.tracks.map(t => [t.id,t])); validIds = new Set(trackMap.keys());
    if (!collections.some(p => p.id === state.playlist) && state.playlist !== 'shortlist') state.playlist = mainId();
    const priorityIds = [...new Set([mainId(), requestId(), data.rootPlaylistId].filter(Boolean))];
    const orderedCollections = [...priorityIds.map(id => collections.find(p => p.id === id)), ...collections.filter(p => !priorityIds.includes(p.id))];
    $('collection-picker').innerHTML = orderedCollections.map(p => `<option value="${esc(p.id)}">${esc(collectionLabel(p))} · ${p.trackIds.length.toLocaleString()}</option>`).join('') + '<option value="shortlist">My picks</option>';
    try { shortlist = cleanShortlist(JSON.parse(localStorage.getItem(STORAGE) || '{}'), validIds); } catch { shortlist = {}; }
    const keys = [...new Set(data.tracks.map(t => t.key).filter(Boolean))].sort((a,b) => parseInt(a) - parseInt(b) || a.localeCompare(b));
    const genres = [...new Set(data.tracks.map(t => t.genre).filter(Boolean))].sort((a,b) => a.localeCompare(b));
    if (!keys.includes(state.key)) state.key = ''; if (!genres.includes(state.genre)) state.genre = '';
    $('key-filter').innerHTML = '<option value="">All keys</option>' + keys.map(k => `<option value="${esc(k)}">${esc(k)} · ${esc(data.tracks.find(t => t.key === k).keyName)}</option>`).join('');
    $('genre-filter').innerHTML = '<option value="">All genres</option>' + genres.map(g => `<option value="${esc(g)}">${esc(g)}</option>`).join('');
    $('filters').hidden = !['min','max','key','genre'].some(k => state[k] !== ''); $('filter-toggle').setAttribute('aria-expanded', String(!$('filters').hidden));
    $('collection-stats').innerHTML = `<div><strong>${data.tracks.length.toLocaleString()}</strong><span>TRACKS TO EXPLORE</span></div><div><strong>${data.playlists.length - 1}</strong><span>PLAYLISTS</span></div><span class="record" aria-hidden="true"><i></i></span>`;
    const date = new Date(data.generatedAt || data.meta?.generatedAt).toLocaleDateString('en-GB', { day:'numeric',month:'short',year:'numeric',timeZone:'Pacific/Efate' });
    $('snapshot-label').textContent = `Library snapshot · ${date}`;
    $('help-snapshot').textContent = `${data.tracks.length.toLocaleString()} recordings in Wedding. Main play order follows the native sequenced playlist. Requests combines the request catalogue with Originals without changing either source playlist. Missing source metadata is shown as “not tagged”.`;
    render();
  } catch (error) { $('load-error').hidden = false; $('results-count').textContent = 'Collection unavailable'; $('empty').hidden = true; console.error('Wedding library could not load:', error.message); }
}
$('search').addEventListener('input', event => { state.q = event.target.value.slice(0, 300); page = 1; render(); });
for (const [id,key] of [['bpm-min','min'],['bpm-max','max'],['key-filter','key'],['genre-filter','genre']]) $(id).addEventListener('input', event => { state[key] = key === 'min' || key === 'max' ? numberFilter(event.target.value) : event.target.value; page = 1; render(); });
$('filter-toggle').addEventListener('click', () => { const open = $('filters').hidden; $('filters').hidden = !open; $('filter-toggle').setAttribute('aria-expanded', String(open)); });
$('reset-filters').addEventListener('click', reset);
$('shortlist-nav').addEventListener('click', () => setCollection('shortlist'));
$('collection-picker').addEventListener('change', event => setCollection(event.target.value));
$('return-sequence').addEventListener('click', () => { setCollection(mainId()); $('view-title').tabIndex = -1; $('view-title').focus({ preventScroll:true }); });
$('sort').addEventListener('change', event => { state.sort = event.target.value; state.dir = 'asc'; page = 1; render(); });
$('sort-direction').addEventListener('click', () => { state.dir = state.dir === 'asc' ? 'desc' : 'asc'; page = 1; render(); });
$('page-size').addEventListener('change', event => { pageSize = Number(event.target.value); page = 1; render(); });
for (const [id,delta] of [['prev',-1],['next',1]]) $(id).addEventListener('click', () => { page += delta; render(); $('collection').scrollIntoView({ behavior: 'auto' }); });
document.addEventListener('click', event => {
  const target = event.target.closest('button'); if (!target || !data) return;
  if (target.dataset.list) setCollection(target.dataset.list);
  if (target.dataset.star) toggleStar(target.dataset.star);
  if (target.dataset.detail) openDetail(target.dataset.detail);
  if (target.dataset.detailList) { $('track-dialog').close(); setCollection(target.dataset.detailList); }
  if (target.dataset.sort) { state.dir = state.sort === target.dataset.sort && state.dir === 'asc' ? 'desc' : 'asc'; state.sort = target.dataset.sort; page = 1; render(); }
  if (target.hasAttribute('data-reset')) reset();
  if (target.hasAttribute('data-all')) setCollection(data.rootPlaylistId);
  if (target.id === 'detail-star') toggleStar(detailId);
  if (target.classList.contains('dialog-close')) target.closest('dialog').close();
});
$('track-detail').addEventListener('input', event => {
  if (event.target.id !== 'detail-note' || !detailId) return;
  const previous = shortlist[detailId] || {};
  shortlist[detailId] = { starred:true, addedAt:previous.addedAt || Date.now(), note:event.target.value.slice(0, 2000) };
  persist(); updateDetailStar(); render();
});
$('help-button').addEventListener('click', () => $('help-dialog').showModal());
for (const dialog of [$('help-dialog'),$('track-dialog')]) dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
$('share').addEventListener('click', async () => { if (!data) return; updateURL(); const url = new URL(location.href); if (state.playlist === 'shortlist') url.searchParams.set('list', data.rootPlaylistId); try { await navigator.clipboard.writeText(url.href); toast(state.playlist === 'shortlist' ? 'All Wedding view link copied. Export My picks to share your choices.' : 'View link copied · playlist, search, filters and sort included'); } catch { toast(state.playlist === 'shortlist' ? 'Export My picks to share your choices.' : 'Copy the address bar to share this view. Your filters are in the link.'); } });
$('export').addEventListener('click', () => { download(csvForTracks(rows, data, shortlist), `DJ-Hunter-${state.playlist === 'shortlist' ? 'shortlist' : (collectionLabel(collections.find(p => p.id === state.playlist)) || 'Wedding').replace(/[^a-z0-9]+/gi,'-')}.csv`, 'text/csv;charset=utf-8'); toast(`Exported ${rows.length} tracks in the current sort order`); });
$('backup').addEventListener('click', () => download(JSON.stringify({ app:'djhunter-wedding',schemaVersion:1,exportedAt:new Date().toISOString(),shortlist }, null, 2), 'DJ-Hunter-shortlist-backup.json', 'application/json'));
$('restore').addEventListener('click', () => $('restore-file').click());
$('restore-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try { if (file.size > 5_000_000) throw new Error('Backup is too large'); const input = JSON.parse(await file.text()); if (input.app !== 'djhunter-wedding' || input.schemaVersion !== 1 || !input.shortlist || typeof input.shortlist !== 'object' || Array.isArray(input.shortlist)) throw new Error('Choose a DJ Hunter shortlist backup'); const cleaned = cleanShortlist(input.shortlist, validIds); const unknown = Object.keys(input.shortlist).filter(id => !validIds.has(id)).length; shortlist = { ...shortlist, ...cleaned }; const saved = persist(); render(); toast(`${Object.keys(cleaned).length} saved picks and notes restored${unknown ? ` · ${unknown} unavailable recordings skipped` : ''}${saved ? '' : ' · download a backup before leaving'}`); } catch (error) { toast(error instanceof SyntaxError ? 'This backup is not valid JSON.' : error.message); } finally { event.target.value = ''; }
});
window.addEventListener('storage', event => { if (event.key === STORAGE && data) { try { shortlist = cleanShortlist(JSON.parse(event.newValue || '{}'), validIds); render(); } catch { /* Ignore malformed storage from another tab. */ } } });
window.addEventListener('popstate', () => {
  if (!data) return;
  const params = new URLSearchParams(location.search), requested = params.get('list');
  Object.assign(state, { playlist:requested === 'shortlist' || collections.some(p => p.id === requested) ? requested : mainId(), q:(params.get('q') || '').slice(0,300), min:numberFilter(params.get('min')), max:numberFilter(params.get('max')), key:params.get('key') || '', genre:params.get('genre') || '', sort:SORTS.includes(params.get('sort')) ? params.get('sort') : 'order', dir:params.get('dir') === 'desc' ? 'desc' : 'asc' });
  $('filters').hidden = !['min','max','key','genre'].some(k => state[k] !== ''); $('filter-toggle').setAttribute('aria-expanded', String(!$('filters').hidden));
  page = 1; render();
});
$('track-dialog').addEventListener('close', () => {
  requestAnimationFrame(() => {
    const active = document.activeElement;
    if (active !== document.body && active?.getClientRects().length && !active.closest('dialog')) return;
    const opener = detailId && [...document.querySelectorAll(`[data-detail="${CSS.escape(detailId)}"]`)].find(element => element.getClientRects().length);
    if (opener) opener.focus({ preventScroll:true });
    else { $('view-title').tabIndex = -1; $('view-title').focus({ preventScroll:true }); }
  });
});
document.addEventListener('keydown', event => { if (event.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { event.preventDefault(); $('search').focus(); } });
$('retry').addEventListener('click', load);
load();
