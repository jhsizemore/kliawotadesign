'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../public/mtgtools/odyssey/data/odyssey-data.json');
const {frameFamily, parseSagaText} = require('../public/mtgtools/odyssey/frame-system.js');
const polish = require('../public/mtgtools/odyssey/studio-polish.js');

test('a Saga creature keeps its ordinary ability and every grouped chapter', () => {
  const card = data.cards.find(c => c.number === 208);
  assert.equal(frameFamily(card), 'saga-creature');
  const parsed = parseSagaText(card.rules);
  assert.equal(parsed.ordinary, 'Defender');
  assert.deepEqual(parsed.chapters.map(c => c.numeral), ['I, II', 'III']);
  assert.match(parsed.chapters[0].text, /Return up to one target nonland permanent/);
  assert.match(parsed.chapters[1].text, /Put up to one target creature/);
});

test('same-line chapters and transform back faces do not merge into one effect', () => {
  for (const number of [212, 221, 228, 229]) {
    const card = data.cards.find(c => c.number === number);
    const chapters = parseSagaText(card.rules).chapters;
    assert.deepEqual(chapters.map(c => c.numeral), number === 212 ? ['I', 'II', 'III', 'IV'] : ['I', 'II', 'III']);
    assert.ok(chapters.every(c => c.text.length > 10), `chapter text missing from #${number}`);
    assert.ok(chapters.every(c => !c.text.includes('//BACK//')), `back face leaked into #${number}`);
  }
});

test('each two-colour cost stays one labelled pip with both source glyphs', () => {
  for (const cost of ['W/U', 'U/R', 'B/G', 'R/W', 'W/B', 'G/U']) {
    const [a, b] = cost.split('/');
    const html = polish.symbolHTML(cost, true, {[a]: `${a}.png`, [b]: `${b}.png`});
    assert.equal((html.match(/class="od-hybrid-half/g) || []).length, 2);
    assert.match(html, new RegExp(`${a}\\.png`));
    assert.match(html, new RegExp(`${b}\\.png`));
    assert.match(html, /role="img"/);
  }
});
