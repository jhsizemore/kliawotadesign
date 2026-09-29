import fs from 'node:fs';
import {chromium} from 'playwright';
const root='public/portvilasandbox/';
fs.mkdirSync('evidence/storefront-check',{recursive:true});
const html=fs.readFileSync(root+'index.html','utf8');
fs.writeFileSync(root+'before-storefront-test.html',html.replace('index-storefront-1.js','index-iSZdlO1J.js'));
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const results=[];
try {
 for(const mode of ['before','after','mobile']) {
  const context=await browser.newContext({viewport:mode==='mobile'?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:1,isMobile:mode==='mobile',hasTouch:mode==='mobile'});
  const page=await context.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/assets/index-*.js',async route=>{
   const response=await route.fetch(); let text=await response.text();
   text=text.replace('Object.assign(window,{sandbox:{get stats()','Object.assign(window,{__pvEngine:$,__pvWorld:$H,sandbox:{get stats()');
   await route.fulfill({response,body:text});
  });
  try {
   await page.goto('http://127.0.0.1:8765/portvilasandbox/'+(mode==='before'?'before-storefront-test.html':'')+'?backend=webgl&diagnostic=1',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>window.__pvEngine?.ready,{timeout:150000});
   await page.waitForTimeout(2000);
   const snapshot=await page.evaluate(()=>{
    const e=window.__pvEngine; e.controls.target.set(-229,4,-448);e.controls.distance=120;e.controls.theta=.30;e.controls.phi=.98;e.controls.apply();
    const groups=[];e.scene.traverse(o=>{if(o.name==='photo-matched-facade')groups.push({meshes:o.children.length,source:o.userData.reference});});
    return {groups,stats:window.sandbox.stats,camera:window.sandbox.camera};
   });
   await page.waitForTimeout(2500);
   await page.screenshot({path:'evidence/storefront-check/'+mode+'-overview.png',timeout:45000});
   if(mode==='after') {
    for(const [name,x,z,distance] of [['fung-kuei',-254,-467,58],['aircalin',-205,-433,65]]) {
     await page.evaluate(({x,z,distance})=>{const e=window.__pvEngine;e.controls.target.set(x,3,z);e.controls.distance=distance;e.controls.theta=.4;e.controls.phi=1.15;e.controls.apply();},{x,z,distance});
     await page.waitForTimeout(1500);await page.screenshot({path:'evidence/storefront-check/'+name+'.png',timeout:45000});
    }
   }
   results.push({mode,ok:errors.length===0,errors,...snapshot});
   if(mode!=='before'&&snapshot.groups.length!==2) throw Error('Expected two live photo-matched facade groups, got '+snapshot.groups.length);
  } catch(error) {
   results.push({mode,ok:false,error:String(error),errors});
   await page.screenshot({path:'evidence/storefront-check/'+mode+'-failure.png',timeout:10000}).catch(()=>{});
   throw error;
  } finally {await context.close();}
 }
 if(results.some(r=>!r.ok))throw Error('Browser reported runtime errors');
} finally {
 fs.writeFileSync('evidence/storefront-check/browser-results.json',JSON.stringify(results,null,2));
 fs.rmSync(root+'before-storefront-test.html',{force:true});
 await browser.close();
}
