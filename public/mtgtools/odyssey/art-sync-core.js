/* Shared, dependency-free sync protocol. Null values are retained as tombstones. */
(function (root) {
  'use strict';
  const ART_KEYS = ['artId','imageUrl','credit','source','zoom','focusX','focusY','fit','artHeight','frameStyle'];
  const CROP_KEYS = ['zoom','focusX','focusY','fit','updated','fromCard'];
  const MAX_RECORDS = 4000;
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const object = o => o !== null && typeof o === 'object' && !Array.isArray(o);
  const canonical = o => Array.isArray(o) ? o.map(canonical) : object(o) ? Object.fromEntries(Object.keys(o).sort().map(k => [k,canonical(o[k])])) : o ?? null;
  const stable = o => JSON.stringify(canonical(o));
  const equal = (a,b) => stable(a) === stable(b);
  function validKey(key) { return typeof key === 'string' && /^(?:current|analysis-candidate-v1):(?:card:[A-Za-z0-9_.-]{1,100}|crop:[A-Za-z0-9_.| -]{1,180})$/.test(key); }
  function validValue(key, value) {
    if (!validKey(key)) return false;
    if (value === null) return true;
    if (!object(value) || JSON.stringify(value).length > 7000) return false;
    const allowed = key.includes(':card:') ? ART_KEYS : CROP_KEYS;
    for (const [k,v] of Object.entries(value)) {
      if (!allowed.includes(k)) return false;
      if (['zoom','focusX','focusY','fromCard'].includes(k)) {
        if (typeof v !== 'number' || !Number.isFinite(v)) return false;
        if (k === 'zoom' && (v < .1 || v > 20)) return false;
        if (k.startsWith('focus') && Math.abs(v) > 1000000) return false;
        if (k === 'fromCard' && (!Number.isInteger(v) || v < 1 || v > 10000)) return false;
      } else {
        if (typeof v !== 'string' || v.length > (['imageUrl','source'].includes(k) ? 2048 : 1000)) return false;
        if (k === 'fit' && !['cover','contain'].includes(v)) return false;
        if (k === 'frameStyle' && !['standard','full-art'].includes(v)) return false;
        if (k === 'artHeight' && !['normal','tall','short'].includes(v)) return false;
        if (k === 'imageUrl' && v && !/^https?:\/\/[^\s]+$/i.test(v)) return false;
      }
    }
    return true;
  }
  function validRecords(records) {
    return object(records) && Object.keys(records).length <= MAX_RECORDS && Object.entries(records).every(([key,entry]) =>
      object(entry) && Number.isSafeInteger(entry.revision) && entry.revision >= 0 && own(entry,'value') && validValue(key,entry.value));
  }
  function reconcile(base, local, remote) {
    const next = {...local}, nextBase = {...base}, pending = [], conflicts = [], downloaded = [];
    for (const key of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])) {
      const b = base[key] || {revision:0,value:null}, r = remote[key] || {revision:0,value:null};
      const l = own(local,key) ? local[key] : null;
      if (equal(l,r.value)) nextBase[key] = r;
      else if (equal(l,b.value)) {
        if (r.value === null) delete next[key]; else next[key] = r.value;
        nextBase[key] = r; downloaded.push(key);
      } else if (r.revision === b.revision && equal(r.value,b.value)) pending.push({key,baseRevision:r.revision,value:l});
      else conflicts.push({key,local:l,remote:r,base:b});
    }
    return {local:next,base:nextBase,pending,conflicts,downloaded};
  }
  function applyChanges(records, changes) {
    if (!Array.isArray(changes) || changes.length > 64) throw new Error('Send at most 64 changes per request.');
    const keys = new Set();
    for (const change of changes) {
      if (!object(change) || !validValue(change.key,change.value) || !Number.isSafeInteger(change.baseRevision) || change.baseRevision < 0 || keys.has(change.key)) throw new Error('Invalid or duplicate artwork change.');
      keys.add(change.key);
    }
    const next = {...records}, accepted = {}, conflicts = {};
    for (const {key,baseRevision,value} of changes) {
      const old = next[key] || {revision:0,value:null};
      // Retried requests with an already applied value are idempotent.
      if (equal(old.value,value)) accepted[key] = old;
      else if (old.revision !== baseRevision) conflicts[key] = old;
      else { const row = {revision:old.revision+1,value}; next[key] = row; accepted[key] = row; }
    }
    if (Object.keys(next).length > MAX_RECORDS) throw new Error('Workspace record limit reached.');
    return {records:next,accepted,conflicts};
  }
  const api = {ART_KEYS,CROP_KEYS,MAX_RECORDS,own,equal,validKey,validValue,validRecords,reconcile,applyChanges};
  root.OdysseySyncCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
