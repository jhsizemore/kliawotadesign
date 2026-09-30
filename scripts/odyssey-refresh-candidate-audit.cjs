'use strict';
// Candidate 1 is an editable design dataset. Refresh summaries, never designs or historical targets.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const tally = (cards, key) => cards.reduce((out, card) => {
  const value = typeof key === 'function' ? key(card) : card[key];
  out[value] = (out[value] || 0) + 1;
  return out;
}, {});
const rarity = cards => Object.fromEntries(['C', 'U', 'R', 'M'].map(r => [r, cards.filter(c => c.rarity === r).length]));
const presentRarity = cards => Object.fromEntries(Object.entries(rarity(cards)).filter(([, count]) => count));
const mean = cards => cards.length ? +(cards.reduce((sum, c) => sum + c.flavorMatchScore, 0) / cards.length).toFixed(2) : null;
const isDFC = c => c.layout === 'transform' || /\/\/BACK\/\//.test(c.rules || '');

function refreshCandidateAudit(source) {
  assert.equal(source.datasetVersion, 'analysis-candidate-v1');
  assert.equal(source.cards.length, 309, 'Inspect unexpected card-count changes before refreshing');
  assert.equal(new Set(source.cards.map(c => c.id)).size, 309, 'Duplicate card identities');
  assert.equal(source.integrity.sha256Scope, 'cards-json-stringify-utf8-v1');
  assert.equal(source.integrity.sha256, hash(source.cards), 'Card checksum mismatch: inspect the source rather than blessing an unreviewed edit');
  for (const card of source.cards) {
    assert.ok(Number.isInteger(card.flavorMatchScore) && card.flavorMatchScore >= 0 && card.flavorMatchScore <= 5, card.id + ' flavor score');
    assert.ok(Number.isInteger(card.functionalWords) && card.functionalWords >= 0, card.id + ' functional words');
    assert.ok(Number.isFinite(card.mv) && card.mv >= 0, card.id + ' mana value');
  }
  // Low-match entries are editorial review records. Do not invent them during an arithmetic refresh.
  assert.equal(source.flavorAudit.lowMatchCards.length, source.cards.filter(c => c.flavorMatchScore <= 2).length, 'Low-match review needs reconciliation');
  const d = structuredClone(source), cards = d.cards, f = d.ffSkeleton;
  const legends = cards.filter(c => /\bLegendary\b/.test(c.type));
  const dfcs = cards.filter(isDFC), nonlands = cards.filter(c => !/\bLand\b/.test(c.type));
  const signposts = cards.filter(c => c.cycleIds?.includes('ff-analog-gold-signposts'));
  const curve = tally(nonlands, c => c.mv >= 7 ? '7+' : String(c.mv));
  f.actual = {
    ...f.actual,
    physicalCards: cards.length,
    rarity: rarity(cards),
    layouts: {singleFace: cards.length - dfcs.length, doubleFace: dfcs.length, byLayout: tally(cards, c => isDFC(c) ? 'double-face-battle' : c.layout || 'standard')},
    sagaCards: cards.filter(c => /\bSaga\b/.test(c.type)).length,
    lands: cards.length - nonlands.length,
    legendaryCards: legends.length,
    legendaryByRarity: rarity(legends),
    sixPlusManaValue: nonlands.filter(c => c.mv >= 6).length,
    goldUncommonLegendarySignposts: signposts.filter(c => c.rarity === 'U' && /\bLegendary\b/.test(c.type)).length,
    signpostPairs: tally(signposts, c => c.signpostPair || c.color),
    manaCurve: curve
  };
  for (const program of f.showcasePrograms) {
    const members = cards.filter(c => c.showcase?.includes(program.id));
    program.count = members.length;
    if (!program.physicalCardId || program.cardIds) program.cardIds = members.map(c => c.id);
    if (program.rarity) program.rarity = presentRarity(members);
    // A single physical card's 15 planned art treatments remain a separate, untouched target.
  }
  f.actual.showcase = Object.fromEntries(f.showcasePrograms.map(p => [p.id, p.count]));
  for (const cycle of f.cycles) {
    const members = cards.filter(c => c.cycleIds?.includes(cycle.id));
    cycle.count = members.length;
    cycle.cardIds = members.map(c => c.id);
    if (cycle.rarity) cycle.rarity = presentRarity(members);
  }
  f.softAudit.functionalWordMeans = Object.fromEntries(['C', 'U', 'R', 'M'].map(r => {
    const group = cards.filter(c => c.rarity === r && !/\bBasic\b/.test(c.type));
    return [r, {count: group.length, mean: group.length ? +(group.reduce((sum, c) => sum + c.functionalWords, 0) / group.length).toFixed(1) : null}];
  }));
  f.softAudit.typeTexture.actual = Object.fromEntries(['Creature', 'Artifact', 'Enchantment', 'Instant', 'Sorcery', 'Land'].map(type => [type, cards.filter(c => new RegExp('\\b' + type + '\\b').test(c.type)).length]));
  f.softAudit.manaCurve.actual = curve;
  d.flavorAudit.cards = cards.length;
  d.flavorAudit.average = mean(cards);
  d.flavorAudit.distribution = Object.fromEntries([0, 1, 2, 3, 4, 5].map(score => [score, cards.filter(c => c.flavorMatchScore === score).length]));
  d.flavorAudit.averageByEra = Object.fromEntries([...new Set(cards.map(c => c.narrativeEra))].map(era => [era, mean(cards.filter(c => c.narrativeEra === era))]));
  d.flavorAudit.averageByRarity = Object.fromEntries(['C', 'U', 'R', 'M'].map(r => [r, mean(cards.filter(c => c.rarity === r))]));
  d.storyApportionment.totalCards = cards.length;
  d.storyApportionment.actual = tally(cards, 'narrativeEra');
  const outerEra = cards.filter(c => c.narrativeEra !== 'Odyssey');
  Object.assign(d.storyApportionment.rethemeStatus, {
    complete: cards.every(c => !c.storyRethemeRequired),
    artReviewRequired: cards.filter(c => c.artReviewRequired).length,
    outerEraCards: outerEra.length,
    outerEraArtReviewRequired: outerEra.filter(c => c.artReviewRequired).length
  });
  d.release.knownBenchmarkDifferences.legendaryCards.actual = legends.length;
  d.release.knownBenchmarkDifferences.showcase = {...f.actual.showcase};
  for (const key of ['cards', 'artworks', 'coverage', 'integrity']) assert.deepEqual(d[key], source[key], key + ' must stay unchanged');
  assert.deepEqual(f.target, source.ffSkeleton.target);
  assert.deepEqual(d.storyApportionment.target, source.storyApportionment.target);
  return d;
}

if (require.main === module) {
  const mode = process.argv[2] || '--check';
  assert.ok(['--check', '--write'].includes(mode) && process.argv.length <= 3, 'Usage: node scripts/odyssey-refresh-candidate-audit.cjs [--check|--write]');
  const filename = path.resolve(__dirname, '../public/mtgtools/odyssey/data/odyssey-analysis-candidate-v1.json');
  const data = JSON.parse(fs.readFileSync(filename, 'utf8')), refreshed = refreshCandidateAudit(data);
  if (mode === '--write') fs.writeFileSync(filename, JSON.stringify(refreshed, null, 2) + '\n');
  else assert.deepEqual(data, refreshed, 'Candidate audit is stale; review and run with --write');
  console.log(`Candidate 1 audit ${mode === '--write' ? 'refreshed' : 'verified'}; ${data.cards.length} card records, artwork, coverage, targets, history and card checksum preserved.`);
}

module.exports = {refreshCandidateAudit};
