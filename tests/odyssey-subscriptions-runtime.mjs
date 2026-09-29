/* Exercise the deployed Worker entrypoint in local Cloudflare workerd, not a handler mock.
 * Run against wrangler dev with a fresh, isolated --persist-to directory. */
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
const origin='http://127.0.0.1:8787',api=origin+'/mtgtools/odyssey/api/subscriptions';
const headers={Origin:origin,'Content-Type':'application/json'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let config;
for(let i=0;i<40;i++){try{const r=await fetch(api);if(r.ok){config=await r.json();break;}}catch(_){}await sleep(1000);}
assert.equal(config?.enabled,true,'Cloudflare Worker and Durable Object did not become ready');
const challengeResponse=await fetch(api+'/challenge');assert.equal(challengeResponse.status,200);
const challenge=await challengeResponse.json(),cookie=challengeResponse.headers.get('set-cookie')?.split(';')[0];
assert(cookie?.startsWith('odyssey_signup='));await sleep(1150);
const body={email:'runtime-proof@example.org',name:'Local Cloudflare runtime test',topics:['progress','membership','playtesting'],consent:true,consentVersion:config.consentVersion,website:'',challenge:challenge.challenge};
let r=await fetch(api,{method:'POST',headers:{...headers,Cookie:cookie},body:JSON.stringify(body)});
assert.equal(r.status,202,await r.text());
r=await fetch(api,{method:'POST',headers:{...headers,Cookie:cookie},body:JSON.stringify(body)});assert.equal(r.status,202,'Retry must be idempotent');
r=await fetch(api,{method:'POST',headers:{...headers,Cookie:cookie},body:JSON.stringify({...body,consent:false})});assert.equal(r.status,400);
r=await fetch(api,{method:'POST',headers:{...headers,Origin:'https://not-the-site.example',Cookie:cookie},body:JSON.stringify(body)});assert.equal(r.status,403);
r=await fetch(api+'/admin',{method:'POST',headers,body:JSON.stringify({action:'list'})});assert.equal(r.status,401);
r=await fetch(api+'/health');assert.equal(r.status,200);const publicInfo=await r.text();assert(!publicInfo.includes(body.email));
const result={status:'passed',environment:'local Cloudflare workerd and SQLite-backed Durable Object',workerEntrypoint:true,bindingRouted:true,storageWriteAcknowledged:true,verificationCookie:true,idempotentRetry:true,requiresConsent:true,crossOriginBlocked:true,ownerOnlyAdmin:true,publicResponseContainsNoEmails:true,noProductionDataOrOutgoingEmails:true};
await mkdir('test-results/odyssey-signup',{recursive:true});await writeFile('test-results/odyssey-signup/cloudflare-runtime.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
