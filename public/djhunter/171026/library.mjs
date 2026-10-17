export const normalize = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[’‘]/g, "'");
export const formatDuration = value => Number.isFinite(value) && value > 0 ? `${Math.floor(Math.round(value) / 60)}:${String(Math.round(value) % 60).padStart(2, '0')}` : '—';
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
export function collectionViews(data) {
  return [...data.playlists, ...(data.views || []).filter(view => !data.playlists.some(p => p.id === view.id))];
}
export function mainPlaylistId(data) {
  const collections = collectionViews(data);
  return collections.some(p => p.id === data.presentation?.mainPlaylistId) ? data.presentation.mainPlaylistId : data.rootPlaylistId;
}
export function requestsPlaylistId(data) {
  return collectionViews(data).some(p => p.id === data.presentation?.requestPlaylistId) ? data.presentation.requestPlaylistId : null;
}
export function validateLibrary(data) {
  if (data?.schemaVersion !== 1 || !Array.isArray(data.tracks) || !Array.isArray(data.playlists)) throw new Error('Unsupported library');
  const ids = new Set(data.tracks.map(t => t.id));
  if (ids.size !== data.tracks.length || !data.playlists.some(p => p.id === data.rootPlaylistId)) throw new Error('Invalid library identities');
  if (data.views !== undefined && !Array.isArray(data.views)) throw new Error('Invalid collection views');
  if (collectionViews(data).some(p => !Array.isArray(p.trackIds) || new Set(p.trackIds).size !== p.trackIds.length || p.trackIds.some(id => !ids.has(id)))) throw new Error('Invalid playlist memberships');
  return data;
}
export function selectTracks(data, state, shortlist = {}) {
  const collections = collectionViews(data);
  const playlist = collections.find(p => p.id === state.playlist) || collections.find(p => p.id === data.rootPlaylistId);
  const order = state.playlist === 'shortlist' ? Object.keys(shortlist).filter(id => shortlist[id]?.starred).sort((a, b) => (shortlist[a].addedAt || 0) - (shortlist[b].addedAt || 0)) : playlist.trackIds;
  const positions = new Map(order.map((id, i) => [id, i]));
  const queries = normalize(state.q).trim().split(/\s+/).filter(Boolean);
  const names = new Map(data.playlists.map(p => [p.id, p.name]));
  const viewNames = (data.views || []).map(view => ({ name: view.name, ids: new Set(view.trackIds) }));
  const min = state.min === '' ? null : Number(state.min);
  const max = state.max === '' ? null : Number(state.max);
  const rows = data.tracks.filter(t => {
    if (!positions.has(t.id)) return false;
    if (min !== null && (!Number.isFinite(t.bpm) || t.bpm < min)) return false;
    if (max !== null && (!Number.isFinite(t.bpm) || t.bpm > max)) return false;
    if (state.key && t.key !== state.key) return false;
    if (state.genre && t.genre !== state.genre) return false;
    const haystack = normalize([t.title, t.artist, t.remixer, t.version, t.album, t.genre, t.year, ...(t.playlistIds || []).map(id => names.get(id) || ''), ...viewNames.filter(view => view.ids.has(t.id)).map(view => view.name)].join(' '));
    return queries.every(q => haystack.includes(q));
  });
  const sort = state.sort || 'order', direction = state.dir === 'desc' ? -1 : 1;
  rows.sort((a, b) => {
    if (sort === 'order') return (positions.get(a.id) - positions.get(b.id)) * direction;
    let av = a[sort], bv = b[sort];
    const missingA = av === null || av === undefined || av === '' || (typeof av === 'number' && !Number.isFinite(av));
    const missingB = bv === null || bv === undefined || bv === '' || (typeof bv === 'number' && !Number.isFinite(bv));
    if (missingA || missingB) return missingA === missingB ? positions.get(a.id) - positions.get(b.id) : missingA ? 1 : -1;
    if (sort === 'key') { av = parseInt(av, 10) * 2 + (String(av).endsWith('B') ? 1 : 0); bv = parseInt(bv, 10) * 2 + (String(bv).endsWith('B') ? 1 : 0); }
    return (typeof av === 'number' && typeof bv === 'number' ? av - bv : collator.compare(av, bv)) * direction || positions.get(a.id) - positions.get(b.id);
  });
  return { rows, positions, total: order.length };
}
export function csvForTracks(tracks, data, shortlist = {}) {
  const names = new Map(data.playlists.map(p => [p.id, p.name]));
  const escape = value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const rows = [['Position','Track','Artist','Version','Remixer','BPM','Key','Duration','Year','Genre','Playlists','Shortlisted','Personal note','Recording ID'], ...tracks.map((t, i) => [i + 1,t.title,t.artist,t.version,t.remixer,t.bpm,t.key,formatDuration(t.durationSeconds),t.year,t.genre,(t.playlistIds || []).map(id => names.get(id)).filter(Boolean).join(' | '),shortlist[t.id]?.starred ? 'Yes' : '',shortlist[t.id]?.note || '',t.id])];
  return '\uFEFF' + rows.map(row => row.map(escape).join(',')).join('\r\n');
}
export function cleanShortlist(input, validIds) {
  const result = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return result;
  for (const [id, value] of Object.entries(input)) {
    if (!validIds.has(id) || !value || typeof value !== 'object') continue;
    if (!value.starred && !value.note) continue;
    result[id] = { starred: value.starred === true, note: typeof value.note === 'string' ? value.note.slice(0, 2000) : '', addedAt: Number.isFinite(value.addedAt) && value.addedAt > 0 ? value.addedAt : Date.now() };
  }
  return result;
}
