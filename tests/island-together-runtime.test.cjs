const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const root=path.resolve(__dirname,'..');
const gameRoot=path.join(root,'public','climate-game');
const app={innerHTML:'',addEventListener(){}};
const store=new Map();
const context={
  console,Math,JSON,Object,Array,Set,Map,Number,String,Boolean,Date,Promise,URLSearchParams,queueMicrotask,setTimeout,clearTimeout,
  location:{search:''},
  window:{print(){}},
  localStorage:{
    getItem:k=>store.get(k)||null,
    setItem:(k,v)=>store.set(k,String(v)),
    removeItem:k=>store.delete(k)
  },
  document:{
    getElementById:()=>app,
    body:{classList:{toggle(){}}},
    addEventListener(){},
    modelContext:null
  }
};
vm.createContext(context);
for(const file of ['scenarios.js','game.js','logistics.js','world.js']){
  const source=fs.readFileSync(path.join(gameRoot,file),'utf8');
  vm.runInContext(source,context,{filename:file});
}

function run(code){return vm.runInContext(code,context)}
function reset(scenario,mode){
  run("state=null; selectedScenarioId="+JSON.stringify(scenario)+"; selectedPlayMode="+JSON.stringify(mode||'quick')+"; startGame(2);");
}

reset('atoll_water','workshop');
assert.equal(run('state.scenarioId'),'atoll_water');
assert.equal(run('state.workshopMode'),true);
assert.ok(run('worldScenario().landforms.length')>=10);

run("state.hand=['tank','roofs','stock','wharf']; state.stats.budget=8; state.stats.supplies=6; state.played=[]; state.active=[]; state.tags=[]; state.construction=[]; state.placements=[]; state.logistics.caches={};");
run("worldPlaceAndBuild('tank','north')");
assert.equal(run("state.construction.some(q=>q.cardId==='tank'&&q.zoneId==='north')"),true);
assert.equal(run("state.placements.some(p=>p.cardId==='tank')"),false);
run("state.pendingEvent='shipping'; state.forecast=['shipping','dry']; resolveRound(); showImpact(); advance();");
assert.equal(run("state.construction.some(q=>q.cardId==='tank'&&q.delays>=1)"),true);

reset('archipelago_logistics','quick');
run("state.zoneStress.port=3; state.phase='event'; state.eventStage='impact'; state.lastEvent={id:'dry',local:[]};");
run('advance()');
assert.equal(run("state.log.some(x=>x.title==='Port bottleneck')"),true);

reset('relocation_pathways','quick');
assert.equal(run('state.relocation.households'),3);
run("state.placements.push({cardId:'tank',zoneId:'north',round:1},{cardId:'roofs',zoneId:'north',round:1});");
assert.equal(run("relocationReadiness('north').ready"),true);
run("state.stats.budget=4; state.played=[]; state.relocation.usedThisSeason=false; moveRelocationHousehold('north');");
assert.equal(run('state.relocation.moved'),1);

reset('relocation_pathways','quick');
run("state.zoneStress.coast=2; state.pendingEvent='tide'; state.forecast=['tide','dry'];");
const beforeCommunity=run('state.stats.community');
run('resolveRound()');
assert.equal(run('state.relocation.unplannedEvents'),1);
assert.equal(run('state.stats.community'),Math.max(0,beforeCommunity-1));

run('state=null; render()');
assert.equal((app.innerHTML.match(/data-scenario=/g)||[]).length,3);
assert.equal(app.innerHTML.includes('Workshop'),true);

reset('atoll_water','quick');
const map=run('worldMapMarkup()');
assert.equal(map.includes('island-west-1'),true);
assert.equal(map.includes('feature-lagoon'),true);
assert.equal(map.includes('feature-reef-flat'),true);

reset('archipelago_logistics','quick');
run("state.placements=[{cardId:'tank',zoneId:'coast',round:1},{cardId:'reef',zoneId:'coast',round:1}];");
const scenicMap=run('worldMapMarkup()');
assert.equal(scenicMap.includes('settlement-layer'),true);
assert.equal(scenicMap.includes('scene-house'),true);
assert.equal(scenicMap.includes('project-tank'),true);
assert.equal(scenicMap.includes('project-reef'),true);
assert.equal(scenicMap.includes('scene-person'),true);

console.log('Island Together runtime tests passed.');
