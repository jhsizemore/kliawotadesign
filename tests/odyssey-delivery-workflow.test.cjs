'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,'.github/workflows',name),'utf8');

test('native Cloudflare remains the only automatic publisher and manual fallback retains game checks',()=>{
 const source=read('deploy-cloudflare.yml');
 assert.match(source,/^  workflow_dispatch:/m);
 assert.doesNotMatch(source,/^  push:/m);
 assert.match(source,/if: github\.ref == 'refs\/heads\/main'/);
 assert.match(source,/Require explicit fallback credentials/);
 assert.match(source,/Island Together syntax check/);
 assert.match(source,/node --test tests\/island-together-logistics\.test\.cjs/);
 assert.match(source,/current_main=\$\(git ls-remote --exit-code origin refs\/heads\/main/);
 assert.ok(source.indexOf('Refuse a superseded manual deployment')<source.indexOf('run: npm run deploy'));
 assert.equal((source.match(/run: npm run deploy/g)||[]).length,1);
});

test('post-deployment checks use the exact main commit without handoff rehearsal scaffolding',()=>{
 const source=read('odyssey-delivery-check.yml');
 assert.match(source,/branches: \[main\]/);
 assert.doesNotMatch(source,/odyssey-production-handoff|git restore|git fetch/);
 assert.ok(!fs.existsSync(path.join(root,'.github/workflows/odyssey-production-review.yml')));
 assert.match(source,/needs: verification-contract/);
 assert.match(source,/if: github\.event_name != 'pull_request' && github\.ref == 'refs\/heads\/main'/);
 assert.equal((source.match(/ODYSSEY_TARGET_SHA: \$\{\{ github\.sha \}\}/g)||[]).length,3);
 const gate=source.indexOf('run: python -u tests/odyssey_cloudflare_gate.py');
 const live=source.indexOf('run: python -u tests/odyssey-epic-live.py');
 const final=source.indexOf('run: python -u tests/odyssey_cloudflare_gate.py --confirm-current');
 assert.ok(gate>=0&&gate<live&&live<final);
 assert.equal((source.match(/GH_TOKEN: \$\{\{ github\.token \}\}/g)||[]).length,3);
 assert.match(source,/python tests\/odyssey-delivery\.test\.py/);
 assert.match(source,/python tests\/odyssey-cloudflare-gate\.test\.py/);
 assert.match(source,/node --test tests\/\*\.test\.cjs tests\/\*\.test\.js tests\/\*\.test\.mjs/);
});

test('every main push is verified, and pull requests cover the build and delivery inputs',()=>{
 const source=read('odyssey-delivery-check.yml');
 const push=source.match(/^  push:[\s\S]*?(?=^  pull_request:)/m)?.[0];
 assert.match(push,/branches: \[main\]/);
 assert.doesNotMatch(push,/paths:/,'Every new main deployment needs its own verification even when the change is outside Odyssey');
 for(const event of ['pull_request']){
  const block=source.match(new RegExp('^  '+event+':[\\s\\S]*?(?=^  [a-z_]+:|^permissions:)','m'))?.[0];
  assert.ok(block,event);
  for(const input of ['public/mtgtools/Odyssey/scry/**','public/mtgtools/odyssey/**','public/_headers','public/_redirects','src/**','scripts/build-odyssey-*','package.json','wrangler.jsonc','tests/odyssey-delivery*','.github/workflows/deploy-cloudflare.yml'])assert.ok(block.includes("'"+input+"'"),event+' '+input);
 }
});
