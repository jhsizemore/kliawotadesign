const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function makeContext() {
  const app = { innerHTML: '', addEventListener() {} };
  const context = {
    console,
    Math,
    Date,
    JSON,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    queueMicrotask,
    localStorage: {
      getItem() { return null; },
      setItem() {},
      removeItem() {}
    },
    location: { search: '' },
    window: { print() {} },
    document: {
      modelContext: null,
      getElementById() { return app; },
      addEventListener() {},
      body: { classList: { toggle() {} } }
    }
  };
  context.globalThis = context;
  vm.createContext(context);
  for (const file of [
    'public/climate-game/scenarios.js',
    'public/climate-game/game.js',
    'public/climate-game/logistics.js'
  ]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  }
  return context;
}

function run(context, source) {
  return vm.runInContext(source, context);
}

test('outer-island material projects enter freight instead of resolving immediately', () => {
  const c = makeContext();
  const out = run(c, `
    startGame(2);
    state.hand=['roofs'];
    state.stats.budget=8;
    state.stats.supplies=6;
    const beforeShelter=state.stats.shelter;
    playCard('roofs',null,'north');
    ({
      construction: state.construction.map(x=>({...x})),
      beforeShelter,
      shelter: state.stats.shelter,
      supplies: state.stats.supplies,
      hand:[...state.hand]
    });
  `);
  assert.equal(out.construction.length, 1);
  assert.equal(out.construction[0].zoneId, 'north');
  assert.equal(out.construction[0].status, 'in-transit');
  assert.equal(out.shelter, out.beforeShelter);
  assert.equal(out.supplies, 4);
  assert.deepEqual([...out.hand], []);
});

test('shipping disruption delays remote freight, while a maintained wharf lets it arrive and construction continue', () => {
  const c = makeContext();
  const out = run(c, `
    startGame(2);
    state.hand=['roofs'];
    state.stats.budget=8;
    state.stats.supplies=6;
    playCard('roofs',null,'north');
    progressConstruction('shipping');
    const delayed={
      count:state.construction.length,
      status:state.construction[0]?.status,
      shelter:state.stats.shelter
    };
    state.active=['wharf'];
    state.tags=['wharf'];
    state.placements=[{cardId:'wharf',zoneId:'port',round:1}];
    progressConstruction('shipping');
    const arrived={
      count:state.construction.length,
      status:state.construction[0]?.status,
      shelter:state.stats.shelter,
      placed:state.placements.some(p=>p.cardId==='roofs'&&p.zoneId==='north')
    };
    progressConstruction('dry');
    ({
      delayed,
      arrived,
      after:{
        count:state.construction.length,
        shelter:state.stats.shelter,
        roofsActive:state.active.includes('roofs'),
        placed:state.placements.some(p=>p.cardId==='roofs'&&p.zoneId==='north')
      }
    });
  `);
  assert.equal(out.delayed.count, 1);
  assert.equal(out.delayed.status, 'delayed');
  assert.equal(out.delayed.shelter, 3);
  assert.equal(out.arrived.count, 1);
  assert.equal(out.arrived.status, 'building');
  assert.equal(out.arrived.shelter, 3);
  assert.equal(out.arrived.placed, false);
  assert.equal(out.after.count, 0);
  assert.equal(out.after.shelter, 5);
  assert.equal(out.after.roofsActive, true);
  assert.equal(out.after.placed, true);
});

test('pre-positioned supplies travel first, then create a cache that lets later construction avoid freight', () => {
  const c = makeContext();
  const out = run(c, `
    startGame(2);
    state.hand=['stock','roofs'];
    state.stats.budget=8;
    state.stats.supplies=0;
    playCard('stock',null,'north');
    const stockInTransit={cache:localCache('north'),count:state.construction.length,status:state.construction[0]?.status};
    progressConstruction('dry');
    const cachedBefore=localCache('north');
    const suppliesBefore=state.stats.supplies;
    playCard('roofs',null,'north');
    const roofsBuilding={cache:localCache('north'),count:state.construction.length,status:state.construction[0]?.status,shelter:state.stats.shelter};
    progressConstruction('dry');
    ({
      stockInTransit,
      cachedBefore,
      suppliesBefore,
      roofsBuilding,
      cacheAfter:localCache('north'),
      suppliesAfter:state.stats.supplies,
      construction:state.construction.length,
      shelter:state.stats.shelter,
      placed:state.placements.map(p=>p.cardId+':'+p.zoneId)
    });
  `);
  assert.equal(out.stockInTransit.cache, 0);
  assert.equal(out.stockInTransit.count, 1);
  assert.equal(out.stockInTransit.status, 'in-transit');
  assert.equal(out.cachedBefore, 2);
  assert.equal(out.roofsBuilding.cache, 0);
  assert.equal(out.roofsBuilding.count, 1);
  assert.equal(out.roofsBuilding.status, 'building');
  assert.equal(out.roofsBuilding.shelter, 3);
  assert.equal(out.suppliesBefore, 0);
  assert.equal(out.suppliesAfter, 0);
  assert.equal(out.construction, 0);
  assert.equal(out.shelter, 5);
  assert.ok([...out.placed].includes('stock:north'));
  assert.ok([...out.placed].includes('roofs:north'));
});

test('hazards create local pressure only where local protection is absent', () => {
  const c = makeContext();
  const out = run(c, `
    startGame(2);
    state.active=['drain'];
    state.tags=['drain'];
    state.placements=[{cardId:'drain',zoneId:'town',round:1}];
    const local=applyLocalHazard('rain');
    ({
      local,
      stress:{...state.zoneStress}
    });
  `);
  const town=[...out.local].find(x=>x.zoneId==='town');
  const coast=[...out.local].find(x=>x.zoneId==='coast');
  const gardens=[...out.local].find(x=>x.zoneId==='gardens');
  assert.ok(town.protectedBy.includes('Clear drainage routes'));
  assert.equal(out.stress.town || 0, 0);
  assert.equal(out.stress.coast, 1);
  assert.equal(out.stress.gardens, 1);
  assert.equal(coast.protectedBy.length, 0);
  assert.equal(gardens.protectedBy.length, 0);
});
