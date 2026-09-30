'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {refreshCandidateAudit} = require('../scripts/odyssey-refresh-candidate-audit.cjs');
const candidate = require('../public/mtgtools/odyssey/data/odyssey-analysis-candidate-v1.json');
const baseline = require('./fixtures/odyssey-candidate-20260930-preservation.json');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const tally = (cards, key) => cards.reduce((out, c) => { const value = typeof key === 'function' ? key(c) : c[key]; out[value] = (out[value] || 0) + 1; return out; }, {});
const mean = cards => +(cards.reduce((sum, c) => sum + c.flavorMatchScore, 0) / cards.length).toFixed(2);

// Remove only the explicitly derived metadata this repair is permitted to update.
function protectedData(data) {
  const d = structuredClone(data);
  delete d.ffSkeleton.actual;
  for (const group of [...d.ffSkeleton.cycles, ...d.ffSkeleton.showcasePrograms]) {
    delete group.count; delete group.cardIds; delete group.rarity;
  }
  delete d.ffSkeleton.softAudit.functionalWordMeans;
  delete d.ffSkeleton.softAudit.typeTexture.actual;
  delete d.ffSkeleton.softAudit.manaCurve.actual;
  delete d.storyApportionment.totalCards;
  delete d.storyApportionment.actual;
  for (const key of ['complete', 'artReviewRequired', 'outerEraCards', 'outerEraArtReviewRequired']) delete d.storyApportionment.rethemeStatus[key];
  for (const key of ['cards', 'average', 'distribution', 'averageByEra', 'averageByRarity']) delete d.flavorAudit[key];
  delete d.release.knownBenchmarkDifferences.legendaryCards.actual;
  delete d.release.knownBenchmarkDifferences.showcase;
  return d;
}

test('candidate audit repair preserves every card, artwork and coverage record from the approved source', () => {
  assert.equal(baseline.source.commit, '7a77341bbfc56863bf747fbb93b06f30e9a834b3');
  for (const [filename, fingerprints] of Object.entries(baseline.datasets)) {
    const dataset = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/mtgtools/odyssey/data', filename), 'utf8'));
    for (const [key, expected] of Object.entries(fingerprints)) {
      if (expected === null) assert.equal(Object.hasOwn(dataset, key), false, filename + ': keep absent ' + key + ' absent');
      else assert.equal(hash(dataset[key]), expected, filename + ' ' + key);
    }
  }
  assert.equal(hash(candidate.cards), 'eac77d3db8b86799a6a36006d4d62d84815fbe5d2b941049990021a6d8818e81');
  assert.equal(candidate.integrity.sha256, baseline.hashes.cards);
  assert.equal(hash(protectedData(candidate)), baseline.hashes.protectedData, 'Targets, policies, timestamps, design history and all non-derived data remain unchanged');
});

test('all eight Homeric phrase designs plus Proteus and Tell Me, O Muse retain their complete records', () => {
  assert.deepEqual(baseline.designs.map(c => [c.number, c.name]), [
    [11, 'Hollow Ships'], [17, 'Winged Words'], [59, 'Much-Enduring'], [93, 'Rosy-Fingered Dawn'],
    [115, 'The Unresting Sea'], [307, 'The Wine-Dark Sea'], [62, 'Athena, Flashing-Eyed'],
    [242, 'Zeus, Cloud-Gatherer'], [291, 'Proteus, Reluctant Oracle'], [302, 'Tell Me, O Muse']
  ]);
  for (const design of baseline.designs) {
    const card = candidate.cards.find(c => c.number === design.number);
    assert.equal(card.name, design.name);
    assert.equal(card.displayName, design.name);
    assert.equal(hash(card), design.sha256, design.name + ': no rules, cost, story, art or other design fields may be changed by this repair');
  }
  assert.equal(candidate.cards.find(c => c.number === 291).layout, 'saga');
  assert.equal(candidate.cards.find(c => c.number === 302).type, 'Instant');
});

test('candidate summaries are reproducible and the refresh is pure and idempotent', () => {
  const before = structuredClone(candidate), once = refreshCandidateAudit(candidate);
  assert.deepEqual(candidate, before, 'No mutation of input');
  assert.deepEqual(once, candidate, 'Checked-in metadata must already be synchronized');
  assert.deepEqual(refreshCandidateAudit(once), once);
});

test('an audit refresh repairs stale aggregates without editing historical benchmarks or recorded reviews', () => {
  const stale = structuredClone(candidate);
  stale.flavorAudit.distribution['4'] = 176;
  stale.flavorAudit.average = 4.35;
  stale.storyApportionment.rethemeStatus.outerEraCards = 91;
  stale.ffSkeleton.actual.sagaCards = 15;
  stale.ffSkeleton.actual.legendaryCards = 103;
  stale.ffSkeleton.showcasePrograms[0].rarity.U = 13;
  stale.ffSkeleton.softAudit.functionalWordMeans.C = {count: 90, mean: 17.5};
  assert.deepEqual(refreshCandidateAudit(stale), candidate);
  assert.equal(hash(protectedData(stale)), baseline.hashes.protectedData);
});

test('an audit refresh refuses a modified card with an unreviewed checksum or an invalid score', () => {
  const altered = structuredClone(candidate);
  altered.cards[10].rules = 'Obsolete historical rules';
  assert.throws(() => refreshCandidateAudit(altered), /Card checksum mismatch/);
  altered.cards[10].flavorMatchScore = 6;
  altered.integrity.sha256 = hash(altered.cards);
  assert.throws(() => refreshCandidateAudit(altered), /flavor score/);
});

test('type, layout, curve and signpost aggregates are independently counted from candidate cards', () => {
  const cards = candidate.cards, actual = candidate.ffSkeleton.actual;
  const nonlands = cards.filter(c => !/\bLand\b/.test(c.type));
  const legends = cards.filter(c => /\bLegendary\b/.test(c.type));
  const signposts = cards.filter(c => c.cycleIds?.includes('ff-analog-gold-signposts'));
  assert.deepEqual(actual.rarity, tally(cards, 'rarity'));
  assert.deepEqual(actual.layouts.byLayout, tally(cards, c => c.layout === 'transform' ? 'double-face-battle' : c.layout || 'standard'));
  assert.equal(actual.physicalCards, cards.length);
  assert.equal(actual.sagaCards, cards.filter(c => /\bSaga\b/.test(c.type)).length);
  assert.equal(actual.legendaryCards, legends.length);
  assert.deepEqual(actual.legendaryByRarity, tally(legends, 'rarity'));
  assert.equal(actual.lands, cards.length - nonlands.length);
  assert.equal(actual.sixPlusManaValue, nonlands.filter(c => c.mv >= 6).length);
  assert.deepEqual(actual.manaCurve, tally(nonlands, c => c.mv >= 7 ? '7+' : String(c.mv)));
  assert.deepEqual(candidate.ffSkeleton.softAudit.manaCurve.actual, actual.manaCurve);
  assert.equal(actual.goldUncommonLegendarySignposts, signposts.filter(c => c.rarity === 'U' && /\bLegendary\b/.test(c.type)).length);
  assert.deepEqual(actual.signpostPairs, tally(signposts, c => c.signpostPair || c.color));
  assert.equal(signposts.length, 20);
  assert.equal(actual.goldUncommonLegendarySignposts, 19);
  for (const [type, count] of Object.entries(candidate.ffSkeleton.softAudit.typeTexture.actual)) assert.equal(count, cards.filter(c => new RegExp('\\b' + type + '\\b').test(c.type)).length, type);
});

test('every cycle and showcase summary reflects membership including rarity subtotals', () => {
  const f = candidate.ffSkeleton;
  for (const [groups, key] of [[f.cycles, 'cycleIds'], [f.showcasePrograms, 'showcase']]) {
    for (const group of groups) {
      const members = candidate.cards.filter(c => c[key]?.includes(group.id));
      assert.equal(group.count, members.length, group.id);
      if (group.cardIds) assert.deepEqual(group.cardIds, members.map(c => c.id), group.id);
      if (group.rarity) assert.deepEqual(group.rarity, tally(members, 'rarity'), group.id);
      if (group.physicalCardId) assert.deepEqual(members.map(c => c.id), [group.physicalCardId]);
    }
  }
  assert.deepEqual(f.actual.showcase, Object.fromEntries(f.showcasePrograms.map(p => [p.id, candidate.cards.filter(c => c.showcase?.includes(p.id)).length])));
  assert.deepEqual(candidate.release.knownBenchmarkDifferences.showcase, f.actual.showcase);
  assert.equal(candidate.release.knownBenchmarkDifferences.legendaryCards.actual, f.actual.legendaryCards);
  assert.equal(f.showcasePrograms.find(p => p.id === 'odysseus-many-faces').artVariantCount, 15);
  assert.equal(f.cycles.find(c => c.id === 'ff-analog-saga-fifteen').count, 15, 'Historical tagged cycle membership is different from the 16 Saga-type cards');
});

test('functional-word and flavor summaries use the existing card scores and counts', () => {
  const cards = candidate.cards, flavor = candidate.flavorAudit;
  for (const [rarity, summary] of Object.entries(candidate.ffSkeleton.softAudit.functionalWordMeans)) {
    const members = cards.filter(c => c.rarity === rarity && !/\bBasic\b/.test(c.type));
    assert.deepEqual(summary, {count: members.length, mean: +(members.reduce((sum, c) => sum + c.functionalWords, 0) / members.length).toFixed(1)});
  }
  assert.deepEqual(flavor.distribution, {0: 0, 1: 0, 2: 0, ...tally(cards, 'flavorMatchScore')});
  assert.equal(flavor.average, mean(cards));
  assert.equal(flavor.cards, cards.length);
  for (const [era, value] of Object.entries(flavor.averageByEra)) assert.equal(value, mean(cards.filter(c => c.narrativeEra === era)), era);
  for (const [rarity, value] of Object.entries(flavor.averageByRarity)) assert.equal(value, mean(cards.filter(c => c.rarity === rarity)), rarity);
});

test('story targets remain caps and a core minimum, with actual review status counted separately', () => {
  const {storyApportionment: story, cards} = candidate;
  assert.deepEqual(story.target.map(({era, count}) => [era, count]), [['Iliad + young Odysseus', 46], ['Odyssey', 217], ['Old Odysseus beyond the Odyssey', 46]]);
  assert.deepEqual(story.actual, tally(cards, 'narrativeEra'));
  assert.deepEqual(story.actual, {'Iliad + young Odysseus': 45, Odyssey: 224, 'Old Odysseus beyond the Odyssey': 40});
  assert.equal(story.rethemeStatus.artReviewRequired, cards.filter(c => c.artReviewRequired).length);
  assert.equal(story.rethemeStatus.outerEraCards, cards.filter(c => c.narrativeEra !== 'Odyssey').length);
  assert.equal(story.rethemeStatus.outerEraArtReviewRequired, cards.filter(c => c.narrativeEra !== 'Odyssey' && c.artReviewRequired).length);
  assert.equal(candidate.ffSkeleton.target.legendaryCards, 105);
  assert.equal(candidate.ffSkeleton.target.goldUncommonLegendarySignposts, 20);
  assert.equal(candidate.ffSkeleton.target.sixPlusManaValue, 31);
});
