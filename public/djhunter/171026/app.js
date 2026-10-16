import { normalize, formatDuration, validateLibrary, selectTracks, csvForTracks, cleanShortlist } from './library.mjs';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORAGE = 'djhunter.wedding.shortlist.v1';
const SORTS = ['order','title','artist','bpm','key','durationSeconds','year'];
let data, trackMap, validIds, shortlist = {}, rows = [], positions = new Map(), page = 1, pageSize = 50, detailId = null, storageFailed = false, toastTimer;
const query = new URLSearchParams(location.search);
const numberFilter = value => value !== null && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 400 ? value : '';
const state = { playlist: query.get('list') || '', q: (query.get('q') || '').slice(0, 300), min: numberFilter(query.get('min')), max: numberFilter(query.get('max')), key: query.get('key') || '', genre: query.get('genre') || '', sort: SORTS.includes(query.get('sort')) ? query.get('sort') : 'order', dir: query.get('dir') === 'desc' ? 'desc' : 'asc' };
const descriptions = { 'Wedding':'Every track under Wedding, including tracks filed directly in the collection.', 'Originals':'The original recordings in the Wedding playlist.', 'Remixes':'The current handpicked remixes, in their original playlist order.', 'New Options':'More recordings to explore. These are options, not a rejected list.', 'New Options - Fresh Internet (64)':'The fresh internet evaluation playlist from the current library.' };
function toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4300); }
function persist() {
  try { localStorage.setItem(STORAGE, JSON.stringify(shortlist)); return true; }
  catch { if (!storageFailed) toast('Browser storage is unavailable. Save a shortlist backup before leaving.'); storageFailed = true; return false; }
}
function updateURL(push = false) {
  const params = new URLSearchParams();
  if (state.playlist !== data.rootPlaylistId) params.set('list', state.playlist);
  if (state.q) params.set('q', state.q);
  for (const key of ['min','max','key','genre']) if (state[key] !== '') params.set(key, state[key]);
  if (state.sort !== 'order') params.set('sort', state.sort);
  if (state.dir === 'desc') params.set('dir', 'desc');
  const url = location.pathname + (params.size ? '?' + params : '') + location.hash;
  if (url !== location.pathname + location.search + location.hash) history[push ? 'pushState' : 'replaceState'](null, '', url);
}
function updateShortlistCount() { const count = Object.values(shortlist).filter(v => v.starred).length; $('shortlist-count').textContent = count; $('shortlist-nav').classList.toggle('active', state.playlist === 'shortlist'); $('shortlist-nav').setAttribute('aria-current', state.playlist === 'shortlist' ? 'page' : 'false'); }
function setCollection(id) { state.playlist = id; page = 1; render(true); if (matchMedia('(max-width:700px)').matches) $('collection').scrollIntoView({ behavior: 'auto' }); }
function nav() {
  $('playlist-nav').innerHTML = data.playlists.map(p => `<button type="button" class="nav-item${p.parentId && p.parentId !== data.rootPlaylistId ? ' child' : ''}${state.playlist === p.id ? ' active' : ''}" data-list="${esc(p.id)}" aria-current="${state.playlist === p.id ? 'page' : 'false'}"><span><span class="nav-symbol" aria-hidden="true">${p.id === data.rootPlaylistId ? '▦' : '≋'}</span>${esc(p.id === data.rootPlaylistId ? 'All Wedding' : p.name.replace('New Options - Fresh Internet (64)', 'Fresh Internet'))}</span><span class="nav-count">${p.trackIds.length.toLocaleString()}</span></button>`).join('');
  updateShortlistCount();
}
function syncControls() {
  $('search').value = state.q; $('bpm-min').value = state.min; $('bpm-max').value = state.max; $('key-filter').value = state.key; $('genre-filter').value = state.genre; $('sort').value = state.sort;
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
  const playlist = data.playlists.find(p => p.id === state.playlist);
  $('view-title').textContent = state.playlist === 'shortlist' ? 'My shortlist' : playlist.id === data.rootPlaylistId ? 'All Wedding tracks' : playlist.name;
  $('view-kicker').textContent = state.playlist === 'shortlist' ? 'YOUR PERSONAL PICKS' : 'BROWSE THE LIBRARY';
  $('view-description').textContent = state.playlist === 'shortlist' ? 'Your favourites and notes, saved on this browser and device.' : descriptions[playlist.name] || `The ${playlist.name} playlist, in its current library order.`;
  $('shortlist-tools').hidden = state.playlist !== 'shortlist';
  const start = (page - 1) * pageSize, end = Math.min(start + pageSize, rows.length);
  $('results-count').textContent = rows.length ? `${(start + 1).toLocaleString()}–${end.toLocaleString()} of ${rows.length.toLocaleString()} tracks${rows.length !== selection.total ? ` · ${selection.total.toLocaleString()} in this list` : ''}` : '0 tracks';
  $('track-rows').innerHTML = rows.slice(start, end).map(t => {
    const short = shortlist[t.id]?.starred === true;
    const version = t.version && !normalize(t.title).includes(normalize(t.version)) ? `<div class="version">${esc(t.version)}</div>` : '';
    return `<tr><td class="number-col">${positions.get(t.id) + 1}</td><td class="star-col"><button class="star" type="button" data-star="${esc(t.id)}" aria-pressed="${short}" aria-label="${short ? 'Remove' : 'Add'} ${esc(t.title)} ${short ? 'from' : 'to'} shortlist">${short ? '★' : '☆'}</button></td><td><button type="button" class="track-link" data-detail="${esc(t.id)}">${esc(t.title || 'Untitled recording')}</button>${version}<span class="mobile-artist">${esc(t.artist || 'Artist not tagged')}</span></td><td class="artist-cell"><div class="artist-name">${esc(t.artist || 'Artist not tagged')}</div></td><td class="numeric">${Number.isFinite(t.bpm) ? Number(t.bpm.toFixed(1)) : '—'}</td><td>${t.key ? `<span class="key-badge" title="${esc(t.keyName)}">${esc(t.key)}</span>` : '—'}</td><td class="numeric">${formatDuration(t.durationSeconds)}</td><td class="lists-cell">${badges(t)}</td><td class="more-cell"><button class="more-button" type="button" data-detail="${esc(t.id)}" aria-label="Details for ${esc(t.title)}">↗</button></td></tr>`;
  }).join('');
  const invalidRange = state.min !== '' && state.max !== '' && Number(state.min) > Number(state.max);
  $('empty').hidden = rows.length > 0;
  $('empty').innerHTML = invalidRange ? '<h3>That tempo range is reversed.</h3><p>Set the minimum BPM below the maximum, or reset the filters.</p><button class="button outline" type="button" data-reset>Reset filters</button>' : state.playlist === 'shortlist' && !selection.total ? '<h3>Your night starts with a favourite.</h3><p>Tap the star beside any track to keep it here.</p><button class="button outline" type="button" data-all>Explore all Wedding tracks</button>' : '<h3>No tracks match this view.</h3><p>Try a different search, widen the tempo range or clear the filters.</p><button class="button outline" type="button" data-reset>Clear search & filters</button>';
  $('page-label').textContent = `Page ${page} of ${pages}`;
  $('prev').disabled = page <= 1; $('next').disabled = page >= pages; $('export').disabled = !rows.length;
  syncControls(); nav(); updateURL(push);
  if (focusKey && !document.contains(active)) {
    const replacement = document.querySelector(`[data-${focusKey[0]}="${CSS.escape(focusKey[1])}"]`);
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
function updateDetailStar() { const button = $('detail-star'); if (button) { button.textContent = shortlist[detailId]?.starred ? '★  In your shortlist' : '☆  Add to my shortlist'; button.setAttribute('aria-pressed', shortlist[detailId]?.starred ? 'true' : 'false'); } }
function openDetail(id) {
  const track = trackMap.get(id); if (!track) return;
  detailId = id;
  const lookup = `${track.artist || ''} ${track.title || ''}`.trim();
  const fields = [['Tempo',Number.isFinite(track.bpm) ? `${Number(track.bpm.toFixed(1))} BPM` : 'Not tagged'],['Musical key',track.key ? `${track.key} · ${track.keyName}` : 'Not tagged'],['Length',formatDuration(track.durationSeconds)],['Year',track.year || 'Not tagged'],['Genre',track.genre || 'Not tagged'],['Remixer',track.remixer || 'Not tagged']];
  $('track-detail').innerHTML = `<h2 id="detail-title">${esc(track.title)}</h2><p class="detail-artist">${esc(track.artist || 'Artist not tagged')}</p>${track.version ? `<p class="version">Version: ${esc(track.version)}</p>` : ''}<dl class="detail-grid">${fields.map(([name,value]) => `<div><dt>${esc(name)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${track.album ? `<p class="version">Album: ${esc(track.album)}</p>` : ''}<span class="detail-label">Find it in</span><div class="detail-playlists">${data.playlists.filter(p => track.playlistIds.includes(p.id)).map(p => `<button class="list-badge" type="button" data-detail-list="${esc(p.id)}">${esc(p.name)}</button>`).join('')}</div><span class="detail-label">Look up this recording</span><div class="lookup-links"><a href="https://www.youtube.com/results?search_query=${encodeURIComponent(lookup)}" target="_blank" rel="noopener noreferrer">YouTube ↗</a><a href="https://soundcloud.com/search/sounds?q=${encodeURIComponent(lookup)}" target="_blank" rel="noopener noreferrer">SoundCloud ↗</a><a href="https://open.spotify.com/search/${encodeURIComponent(lookup)}" target="_blank" rel="noopener noreferrer">Spotify ↗</a></div><p class="lookup-hint">Search results may include other versions. Match the artist and treatment.</p><button id="detail-star" class="button detail-star" type="button"></button><label class="detail-note">Your note<textarea id="detail-note" maxlength="2000" placeholder="A must-play, a moment, a memory…">${esc(shortlist[id]?.note || '')}</textarea></label><p class="note-hint">Notes save as you type on this device. Adding a note also stars the track.</p>`;
  updateDetailStar(); $('track-dialog').showModal();
}
function reset() { Object.assign(state, { q:'',min:'',max:'',key:'',genre:'' }); page = 1; render(); }
function download(content, name, mime) { const url = URL.createObjectURL(new Blob([content], { type: mime })); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); }
async function load() {
  $('load-error').hidden = true;
  try {
    const response = await fetch('./wedding-library.json', { cache: 'no-cache' }); if (!response.ok) throw new Error(`Library HTTP ${response.status}`);
    data = validateLibrary(await response.json()); trackMap = new Map(data.tracks.map(t => [t.id,t])); validIds = new Set(trackMap.keys());
    if (!data.playlists.some(p => p.id === state.playlist) && state.playlist !== 'shortlist') state.playlist = data.rootPlaylistId;
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
    $('help-snapshot').textContent = `${data.tracks.length} recordings across ${data.playlists.length - 1} playlists, plus the full Wedding view. Playlist order follows the current Engine library. Missing source metadata is shown as “not tagged”.`;
    render();
  } catch (error) { $('load-error').hidden = false; $('results-count').textContent = 'Collection unavailable'; $('empty').hidden = true; console.error('Wedding library could not load:', error.message); }
}
$('search').addEventListener('input', event => { state.q = event.target.value.slice(0, 300); page = 1; render(); });
for (const [id,key] of [['bpm-min','min'],['bpm-max','max'],['key-filter','key'],['genre-filter','genre']]) $(id).addEventListener('input', event => { state[key] = key === 'min' || key === 'max' ? numberFilter(event.target.value) : event.target.value; page = 1; render(); });
$('filter-toggle').addEventListener('click', () => { const open = $('filters').hidden; $('filters').hidden = !open; $('filter-toggle').setAttribute('aria-expanded', String(open)); });
$('reset-filters').addEventListener('click', reset);
$('shortlist-nav').addEventListener('click', () => setCollection('shortlist'));
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
$('share').addEventListener('click', async () => { if (!data) return; updateURL(); const url = new URL(location.href); if (state.playlist === 'shortlist') url.searchParams.delete('list'); try { await navigator.clipboard.writeText(url.href); toast(state.playlist === 'shortlist' ? 'All Wedding view link copied. Export your shortlist to share your picks.' : 'View link copied · playlist, search, filters and sort included'); } catch { toast(state.playlist === 'shortlist' ? 'Export your shortlist to share your picks.' : 'Copy the address bar to share this view. Your filters are in the link.'); } });
$('export').addEventListener('click', () => { download(csvForTracks(rows, data, shortlist), `DJ-Hunter-${state.playlist === 'shortlist' ? 'shortlist' : (data.playlists.find(p => p.id === state.playlist)?.name || 'Wedding').replace(/[^a-z0-9]+/gi,'-')}.csv`, 'text/csv;charset=utf-8'); toast(`Exported ${rows.length} tracks in the current sort order`); });
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
  Object.assign(state, { playlist:requested === 'shortlist' || data.playlists.some(p => p.id === requested) ? requested : data.rootPlaylistId, q:(params.get('q') || '').slice(0,300), min:numberFilter(params.get('min')), max:numberFilter(params.get('max')), key:params.get('key') || '', genre:params.get('genre') || '', sort:SORTS.includes(params.get('sort')) ? params.get('sort') : 'order', dir:params.get('dir') === 'desc' ? 'desc' : 'asc' });
  page = 1; render();
});
$('track-dialog').addEventListener('close', () => {
  requestAnimationFrame(() => {
    const active = document.activeElement;
    if (active !== document.body && active?.getClientRects().length && !active.closest('dialog')) return;
    const opener = detailId && document.querySelector(`[data-detail="${CSS.escape(detailId)}"]`);
    if (opener) opener.focus({ preventScroll:true });
    else { $('view-title').tabIndex = -1; $('view-title').focus({ preventScroll:true }); }
  });
});
document.addEventListener('keydown', event => { if (event.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { event.preventDefault(); $('search').focus(); } });
$('retry').addEventListener('click', load);
load();
