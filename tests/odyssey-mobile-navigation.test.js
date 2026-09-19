const test = require('node:test');
const assert = require('node:assert/strict');
const { neighbour, orderedRows, VERSION } = require('../public/mtgtools/odyssey/mobile-navigation.js');
test('version', () => assert.equal(VERSION, '3.16'));
test('empty queue has no next', () => assert.equal(neighbour([], 1, 1), null));
test('empty queue has no previous', () => assert.equal(neighbour([], 1, -1), null));
test('next follows filtered sequence, not collector number', () => assert.equal(neighbour([3, 8, 21], 3, 1), 8));
test('previous follows filtered sequence', () => assert.equal(neighbour([3, 8, 21], 21, -1), 8));
test('first card cannot wrap backward', () => assert.equal(neighbour([3, 8, 21], 3, -1), null));
test('last card cannot wrap forward', () => assert.equal(neighbour([3, 8, 21], 21, 1), null));
test('outside filter enters at beginning going forward', () => assert.equal(neighbour([8, 21], 3, 1), 8));
test('outside filter enters at end going backward', () => assert.equal(neighbour([8, 21], 3, -1), 21));
test('single selected card cannot move', () => { assert.equal(neighbour([3], 3, 1), null); assert.equal(neighbour([3], 3, -1), null); });
test('collector order is numeric', () => assert.deepEqual(orderedRows([{ number: 21 }, { number: 3 }, { number: 8 }], 'number').map(r => r.number), [3, 8, 21]));
test('alphabetic order ignores case', () => assert.deepEqual(orderedRows([{ number: 1, name: 'Scylla' }, { number: 2, name: 'athena' }], 'name').map(r => r.number), [2, 1]));
test('duplicate names have deterministic number ordering', () => assert.deepEqual(orderedRows([{ number: 21, name: 'Scylla' }, { number: 3, name: 'Scylla' }], 'name').map(r => r.number), [3, 21]));
test('sorting does not mutate caller array', () => { const rows = [{ number: 2 }, { number: 1 }]; orderedRows(rows, 'number'); assert.equal(rows[0].number, 2); });
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const loader = fs.readFileSync(path.join(__dirname, '../public/mtgtools/odyssey/index.html'), 'utf8');
const script = loader.slice(loader.indexOf('<script>') + 8, loader.lastIndexOf('</script>'));
const fixture = "<html><head></head><body><script>const STORAGE='odyssey-layout-overrides-v02';\nconst CROP_PROFILE_STORAGE='odyssey-art-crop-profiles-v04', REVIEW_STORAGE='odyssey-card-review-v04', PROFILE_REVIEW_STORAGE='odyssey-profile-review-v05';</script></body></html>";
async function runLoader(source, ok = true) {
  let output = '', error = '';
  const document = { open() {}, write(s) { output = s; }, close() {}, body: { innerHTML: '' }, getElementById() { return { set textContent(s) { error = s; } }; } };
  await vm.runInNewContext(script, { fetch: async () => ({ ok, status: 503, text: async () => source }), document, location: { hash: '', pathname: '/mtgtools/odyssey/', search: '' }, window: {}, history: { replaceState() {} } });
  return { output, error };
}
test('loader retains inherited-art patches and mounts mobile last', async () => {
  const { output, error } = await runLoader(fixture);
  assert.equal(error, '');
  assert.ok(output.includes('OdysseyArtTransfer.prepare('));
  assert.ok(output.includes('CROP_PROFILE_STORAGE=ODYSSEY_ART_STATE.keys.crops'));
  assert.ok(output.includes('mobile-navigation.css?v=20260918-5'));
  assert.ok(output.indexOf('mobile-navigation.js') > output.indexOf('OdysseyArtTransfer.mount('));
});
test('loader fails safely when art-storage integration has changed', async () => {
  const { output, error } = await runLoader('<html><head></head><body></body></html>');
  assert.equal(output, ''); assert.match(error, /saved settings have not been changed/);
});
test('loader reports source fetch failures rather than writing an incomplete app', async () => {
  const { output, error } = await runLoader('', false);
  assert.equal(output, ''); assert.match(error, /503/);
});
