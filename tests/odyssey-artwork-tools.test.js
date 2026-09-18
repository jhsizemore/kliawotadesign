'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRelatedIndex, warningState, normalize } = require('../public/mtgtools/odyssey/artwork-tools.js');
const cards = [
  { number: 1, name: 'Scylla, Six-Mawed Horror', type: 'Legendary Creature', primaryArt: 'ART-001', story: 'Odysseus sails past Scylla' },
  { number: 2, name: 'Scylla Takes Her Due', primaryArt: 'ART-002' },
  { number: 3, name: 'Burn the Beached Ship', primaryArt: 'ART-003' },
  { number: 4, name: 'Phaeacian Galley', primaryArt: 'ART-004' },
  { number: 5, name: 'Odysseus, Cunning Voyager', type: 'Legendary Creature', primaryArt: 'ART-005' },
  { number: 6, name: 'Athena, Guide Unseen', type: 'Legendary Creature' },
  { number: 7, name: 'Eurycleia, Keeper of the Scar', type: 'Legendary Creature' },
  { number: 8, name: 'Mentor Gives Counsel' },
  { number: 9, name: 'Newhero, Faithful Friend', type: 'Legendary Creature' },
  { number: 10, name: 'A Quiet Arrival', story: 'Nausicaa meets the castaway' },
  { number: 11, name: 'Shipwright at Work', story: 'Odysseus builds a ship' }
];
const artworks = [
  { id: 'ART-001', title: 'Scylla devours the sailors', tags: 'Scylla; Odysseus' },
  { id: 'ART-002', title: 'Sixfold Terror', tags: 'Monsters', candidateCards: 'Scylla Takes Her Due' },
  { id: 'ART-003', title: 'Ships at anchor', tags: 'Ships' },
  { id: 'ART-004', title: 'Ancient galley', tags: 'Watercraft' },
  { id: 'ART-005', title: 'Ulysses resting alone', tags: 'Odysseus' },
  { id: 'ART-006', title: 'Skylla at the strait' },
  { id: 'ART-007', title: 'Roman trireme' },
  { id: 'ART-008', title: 'Minerva advising Ulysses' },
  { id: 'ART-009', title: 'Eurykleia washing feet' },
  { id: 'ART-010', title: 'The Counsellor', tags: 'Mentor' },
  { id: 'ART-011', title: 'Portrait of Newhero' },
  { id: 'ART-012', title: 'Nausicaa on the beach' },
  { id: 'ART-013', title: 'A bowl', artist: 'Scylla Smith', institution: 'Ships Museum', medium: 'Clay vessel' },
  { id: 'ART-014', title: 'Deep passage', candidateCards: 'Scylla Takes Her Due; Other Card' },
  { id: 'ART-015', title: 'Vases beside a hearth', tags: 'Vessels' }
];
const coverage = cards.map(c => ({ number: c.number, primary: c.primaryArt || '', candidateIds: c.primaryArt ? [c.primaryArt] : [] }));
const index = createRelatedIndex(cards, artworks, coverage);
const ids = n => index.forCard(cards.find(c => c.number === n)).ids;

test('Scylla cards share all named, alias and original-association images', () => {
  for (const n of [1, 2]) for (const id of ['ART-001', 'ART-002', 'ART-006', 'ART-014']) assert.ok(ids(n).includes(id), `${n}: ${id}`);
});
test('Named card does not inherit all protagonist imagery from its story', () => {
  assert.ok(!ids(1).includes('ART-005')); assert.ok(!ids(2).includes('ART-008'));
});
test('A shared multi-character artwork does not cause transitive pool contamination', () => {
  assert.ok(!ids(5).includes('ART-006'));
});
test('Ship and galley cards share watercraft, including unassigned triremes', () => {
  for (const n of [3, 4]) for (const id of ['ART-003', 'ART-004', 'ART-007']) assert.ok(ids(n).includes(id));
});
test('Bare pottery vessels do not become boats; artist and institution names are not subjects', () => {
  for (const n of [1, 3]) for (const id of ['ART-013', 'ART-015']) assert.ok(!ids(n).includes(id));
});
test('Greek/Latin and transliteration aliases find existing art', () => {
  assert.ok(ids(6).includes('ART-008')); assert.ok(ids(7).includes('ART-009'));
});
test('Minor named characters can be learned from explicit library tags', () => assert.ok(ids(8).includes('ART-010')));
test('Additional legendary characters are learned from the active card file', () => assert.ok(ids(9).includes('ART-011')));
test('A nondescript card can match its explicit story subject', () => assert.ok(ids(10).includes('ART-012')));
test('Candidates are deduplicated and cached', () => {
  assert.equal(ids(1).length, new Set(ids(1)).size);
  assert.equal(index.forCard(cards[0]), index.forCard(cards[0]));
});
test('No card, artwork, coverage, credit or crop data is mutated', () => {
  const before = JSON.stringify({ cards, artworks, coverage });
  const fresh = createRelatedIndex(cards, artworks, coverage);
  cards.forEach(c => fresh.forCard({ ...c, zoom: 4, focusX: 27, credit: 'Existing credit' }));
  assert.equal(JSON.stringify({ cards, artworks, coverage }), before);
});
test('Manual artwork choices do not contaminate other subject pools', () => {
  index.forCard({ ...cards[0], artId: 'ART-005' });
  assert.ok(!ids(2).includes('ART-005'));
});
test('Custom datasets get their own independent index', () => {
  const other = createRelatedIndex([{ number: 1, name: 'Scylla' }], [{ id: 'CUSTOM', tags: 'Scylla' }], []);
  assert.deepEqual(other.forCard({ number: 1 }).ids, ['CUSTOM']);
});
test('Normalization handles accents, apostrophes and hyphens with word boundaries', () => {
  assert.equal(normalize('Éurykleia’s Ship-Bow'), 'eurykleia s ship bow');
  const x = createRelatedIndex([{ number: 1, name: 'Mars' }], [{ id: 'X', title: 'Marsh reeds' }], []);
  assert.deepEqual(x.forCard({ number: 1 }).ids, []);
});
test('Exactly 240 DPI is safe; just below it warns without rounding to 240', () => {
  assert.equal(warningState({ dpi: 240 }).low, false);
  assert.equal(warningState({ dpi: 239.9999 }).low, true);
  assert.equal(warningState({ dpi: 239.9999 }).text, '239.9 DPI · below 240');
});
test('Returning above threshold clears the warning immediately', () => {
  assert.equal(warningState({ dpi: 180 }).low, true);
  assert.equal(warningState({ dpi: 240.0001 }).low, false);
  assert.equal(warningState({ dpi: 300 }).text, '');
});
test('Unknown, unresolved and invalid resolutions are never reported as measured warnings', () => {
  for (const q of [null, {}, { state: 'unknown' }, { dpi: NaN }, { dpi: Infinity }, { dpi: 0 }]) {
    assert.equal(warningState(q).measured, false); assert.equal(warningState(q).low, false);
  }
});
test('Warning follows effective crop DPI, not baseline source eligibility', () => {
  assert.equal(warningState({ dpi: 300, sourceExcluded: true }).low, false);
  assert.equal(warningState({ dpi: 200, sourceExcluded: false }).low, true);
});
