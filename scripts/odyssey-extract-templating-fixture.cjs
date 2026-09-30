'use strict';
// Historical test evidence only. This never reads today's cards to reconstruct yesterday's designs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname, '..');
const sourcePath = 'public/mtgtools/odyssey/data/odyssey-analysis-candidate-v1.json';
const reportPath = 'public/mtgtools/odyssey/data/templating-report.json';
const beforeCommit = 'f7435dc955c51e2be11b7bc20ede076ca6a2bbf7';
const afterCommit = '5751d59e6a6eccde7a8885bb332a1e24a67a1a45';
const fields = ['id', 'number', 'name', 'mana', 'mv', 'color', 'type', 'pt', 'rarity', 'origin', 'originFull', 'layout', 'rules', 'functionalWords', 'changeStatus'];
const sha256 = value => createHash('sha256').update(value).digest('hex');
const show = (commit, filename) => execFileSync('git', ['show', `${commit}:${filename}`], {cwd: root, maxBuffer: 8 * 1024 * 1024});
function snapshot(commit) {
  const raw = show(commit, sourcePath), d = JSON.parse(raw);
  return {
    provenance: {
      commit, path: sourcePath,
      gitBlobSha1: createHash('sha1').update(`blob ${raw.length}\0`).update(raw).digest('hex'),
      fileSha256: sha256(raw), cardsSha256: sha256(JSON.stringify(d.cards)),
      projection: fields
    },
    datasetVersion: d.datasetVersion, generatedAt: d.generatedAt,
    productionDatasetVersion: d.candidate.productionDatasetVersion,
    cards: d.cards.map(card => Object.fromEntries(fields.map(field => [field, card[field]])))
  };
}
const fixture = {
  schema: 'odyssey-templating-historical-evidence/v1',
  note: 'Read-only field projections of two real Git snapshots bracketing the September 19 templating pass. These are not the mutable Candidate 1 dataset and were not reconstructed from the report.',
  report: {commit: afterCommit, path: reportPath, sha256: sha256(show(afterCommit, reportPath))},
  before: snapshot(beforeCommit), after: snapshot(afterCommit)
};
const filename = path.join(root, 'tests/fixtures/odyssey-templating-history.json');
const mode = process.argv[2] || '--check';
assert.ok(['--check', '--write'].includes(mode) && process.argv.length <= 3, 'Usage: node scripts/odyssey-extract-templating-fixture.cjs [--check|--write]');
if (mode === '--write') fs.writeFileSync(filename, JSON.stringify(fixture, null, 2) + '\n');
else assert.deepEqual(JSON.parse(fs.readFileSync(filename, 'utf8')), fixture);
console.log(`Historical templating evidence ${mode === '--write' ? 'extracted' : 'verified'} from ${beforeCommit} and ${afterCommit}; SHA-256 ${sha256(JSON.stringify(fixture))}`);
