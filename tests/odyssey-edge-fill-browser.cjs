'use strict';
// Exercise real Studio, its source-derived public renderer and print geometry.
// All changes are confined to a disposable browser; remote writes are blocked.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const runtime=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const {chromium}=require(runtime?path.join(runtime,'playwright'):'playwright');
const sharp=require(runtime?path.join(runtime,'sharp'):'sharp');
const root=path.resolve(__dirname,'../public'),out=path.resolve(__dirname,'../test-results/odyssey-edge-fill');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.svg':'image/svg+xml'};
test('automatic continuation preserves source pixels across Studio, public and print',async()=>{
 fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}catch(_){res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.ODYSSEY_CHROME_EXECUTABLE||undefined});
  const context=await browser.newContext({viewport:{width:1500,height:1050}});
  await context.route('**/*',route=>route.request().method()!=='GET'||!route.request().url().startsWith(base)?route.abort():route.continue());
  const page=await context.newPage();await page.goto(base+'/mtgtools/odyssey/');
  await page.waitForFunction(()=>typeof applyArtView==='function'&&document.getElementById('frameSystemReadout'));
  const fixture=await page.evaluate(async()=>{
   const canvas=document.createElement('canvas');canvas.width=600;canvas.height=800;
   const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,800);
   gradient.addColorStop(0,'#bad6de');gradient.addColorStop(.6,'#719594');gradient.addColorStop(1,'#384944');ctx.fillStyle=gradient;ctx.fillRect(0,0,600,800);
   ctx.fillStyle='#dd9f62';ctx.fillRect(140,160,240,440);ctx.fillStyle='#373734';ctx.fillRect(200,250,70,190);
   const url=canvas.toDataURL(),transparent=document.createElement('canvas');transparent.width=600;transparent.height=800;transparent.getContext('2d').fillRect(100,100,200,400);
   window.edgeFixture={url,transparent:transparent.toDataURL()};
   const m={...model(selected),imageUrl:url,frameStyle:'full-art',fit:'cover',zoom:1,focusX:0,focusY:0};
   window.edgeModel=m;const shell=makeCardShell(m);shell.id='edgeProof';shell.style.cssText='position:fixed;top:30px;left:30px;z-index:99999;margin:0';document.body.append(shell);
   const img=shell.querySelector('.art-img');img.src=url;await img.decode();applyArtView(img,m);
   return {url,number:selected};
  });
  const report={};
  async function position(side,gap){
   return page.evaluate(({side,gap})=>{
    const box=document.querySelector('#edgeProof .artbox'),img=box.querySelector('.art-img'),m=edgeModel;
    m.zoom=1;m.focusX=m.focusY=0;const met=artViewportMetrics(img,box,m);
    const x=side.includes('left')?(met.rw-met.W)/2+gap:side.includes('right')?-(met.rw-met.W)/2-gap:0;
    const y=side.includes('top')?(met.rh-met.H)/2+gap:side.includes('bottom')?-(met.rh-met.H)/2-gap:0;
    setArtPan(m,met,x,y);applyArtView(img,m);const state=box._artEdgeFill;
    return {geometry:artEdgeGeometry(met,artPanPixels(met,m)),count:box.querySelectorAll('.art-edge-fill').length,blur:state?.blur.style.filter,canvas:state&&{width:state.sample.width,height:state.sample.height},sourceFilter:getComputedStyle(img).filter,sourceMask:getComputedStyle(img).maskImage,sourceUnchanged:img.src===edgeFixture.url};
   },{side,gap});
  }
  report.covered=await position('',0);assert.equal(report.covered.count,0);
  const covered=await page.locator('#edgeProof .artbox').screenshot();
  await page.evaluate(()=>{const b=document.querySelector('#edgeProof .artbox');b.style.background='#ff00ff';applyArtView(b.querySelector('.art-img'),edgeModel);});
  assert.deepEqual(await page.locator('#edgeProof .artbox').screenshot(),covered,'fully covered painting remains identical');
  report.tiny=await position('left',2);assert.equal(report.tiny.count,2);assert.ok(parseFloat(report.tiny.blur.slice(5))<2);
  for(const side of ['left','right','top','bottom','left-top','right-bottom']){
   report[side]=await position(side,40);assert.equal(report[side].count,2);assert.equal(report[side].sourceFilter,'none');assert.equal(report[side].sourceMask,'none');assert.equal(report[side].sourceUnchanged,true);
   const img=await page.locator('#edgeProof .artbox').screenshot();fs.writeFileSync(path.join(out,side+'.png'),img);
   const raw=await sharp(img).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   const x=side.includes('left')?6:side.includes('right')?raw.info.width-7:Math.floor(raw.info.width/2),y=side.includes('top')?6:side.includes('bottom')?raw.info.height-7:Math.floor(raw.info.height/2),offset=(y*raw.info.width+x)*4;
   assert.ok(!(raw.data[offset]>245&&raw.data[offset+1]<5&&raw.data[offset+2]>245),'exposed '+side+' retains no empty background');
  }
  report.largeBlur=parseFloat(report.left.blur.slice(5));assert.ok(report.largeBlur>parseFloat(report.tiny.blur.slice(5)));
  // Compare the actual source area with and without both continuation layers.
  const withFill=await page.locator('#edgeProof .artbox').screenshot();
  await page.evaluate(()=>document.querySelectorAll('#edgeProof .art-edge-fill').forEach(c=>c.style.visibility='hidden'));
  const withoutFill=await page.locator('#edgeProof .artbox').screenshot();
  const patch={left:100,top:100,width:120,height:140};
  assert.deepEqual(await sharp(withFill).extract(patch).raw().toBuffer(),await sharp(withoutFill).extract(patch).raw().toBuffer(),'sharp source pixels remain identical');
  await page.evaluate(()=>document.querySelectorAll('#edgeProof .art-edge-fill').forEach(c=>c.style.visibility=''));
  await page.evaluate(async()=>{const img=document.querySelector('#edgeProof .art-img');img.src=edgeFixture.transparent;await img.decode();applyArtView(img,edgeModel);const state=img.closest('.artbox')._artEdgeFill,met=artViewportMetrics(img,img.closest('.artbox'),edgeModel),geo=artEdgeGeometry(met,artPanPixels(met,edgeModel));const pad=parseFloat(state.sample.style.left)*-met.W/100,scale=state.sample.width/(met.W+pad*2),p=state.sample.getContext('2d').getImageData(Math.floor((geo.left+pad+met.rw/2)*scale),Math.floor((geo.top+pad+met.rh/2)*scale),1,1).data;if(p[3]!==0)throw Error('Continuation paints beneath transparent source');img.src=edgeFixture.url;await img.decode();applyArtView(img,edgeModel);});
  report.restored=await position('',0);assert.equal(report.restored.count,0);
  // All frame families inherit the behavior, with no per-card opt-in.
  for(const layout of ['standard','adventure','prepare','saga','battle']){
   await page.evaluate(async layout=>{edgeModel.layout=layout;edgeModel.frameStyle=layout==='standard'?'standard':'full-art';const previous=document.getElementById('edgeProof'),sh=makeCardShell(edgeModel);sh.id='edgeProof';sh.style.cssText=previous.style.cssText;previous.replaceWith(sh);const img=sh.querySelector('.art-img');img.src=edgeFixture.url;await img.decode();applyArtView(img,edgeModel);},layout);
   assert.equal((await position('left',20)).count,2,layout);
  }
  // Print uses its physical aperture dimensions and the same source geometry.
  await page.evaluate(async()=>{document.getElementById('edgeProof').remove();Object.assign(edgeModel,{layout:'standard',type:'Basic Land — Island',rules:'',frameStyle:'full-art'});const sh=makeCardShell(edgeModel);sh.id='edgeProof';document.getElementById('printSheetStage').append(sh);document.body.classList.add('print-current');const img=sh.querySelector('.art-img');img.src=edgeFixture.url;await img.decode();});
  await page.emulateMedia({media:'print'});report.print=await position('left',20);assert.equal(report.print.count,2);
  await page.locator('#edgeProof').screenshot({path:path.join(out,'print.png')});await page.emulateMedia({media:'screen'});
  await page.evaluate(()=>{const sh=document.getElementById('edgeProof');sh.style.cssText='position:fixed;top:30px;left:30px;z-index:99999;margin:0';document.body.append(sh);});
  // A museum source that cannot be read by canvas must still render its fill.
  const museum=await sharp(Buffer.from(fixture.url.split(',')[1],'base64')).png().toBuffer();
  await context.route('https://museum.example/art.png',route=>route.fulfill({contentType:'image/png',body:museum}));
  report.crossOrigin=await page.evaluate(async()=>{const img=document.querySelector('#edgeProof .art-img');img.src='https://museum.example/art.png';await img.decode();applyArtView(img,edgeModel);const state=img.closest('.artbox')._artEdgeFill;let tainted=false;try{state.sample.getContext('2d').getImageData(0,0,1,1);}catch(e){tainted=e.name==='SecurityError';}return {tainted,count:img.closest('.artbox').querySelectorAll('.art-edge-fill').length};});
  assert.deepEqual(report.crossOrigin,{tainted:true,count:2});
  const publicPage=await context.newPage();await publicPage.goto(base+'/mtgtools/Odyssey/scry/');await publicPage.waitForFunction(()=>window.OdysseyStudioRenderer?.engine);
  report.public=await publicPage.evaluate(async({number,url})=>{
   const engine=OdysseyStudioRenderer.engine,{el,model:m}=engine.node(number,'front','full-art');
   const shell=document.createElement('div');shell.style.cssText='position:fixed;top:20px;left:20px;width:378px;height:528px;z-index:99999';const shadow=shell.attachShadow({mode:'open'}),style=document.createElement('style');style.textContent=OdysseyStudioRenderer.css;shadow.append(style,el);document.body.append(shell);
   const img=el.querySelector('.art-img');img.src=url;await img.decode();Object.assign(m,{focusX:0,focusY:0,zoom:1,fit:'contain'});engine.applyArtView(img,m);
   const box=img.closest('.artbox');return {count:box.querySelectorAll('.art-edge-fill').length,filter:getComputedStyle(img).filter,mask:getComputedStyle(img).maskImage};
  },fixture);
  assert.deepEqual(report.public,{count:2,filter:'none',mask:'none'});
  // Inspect an actual shipped painting at desktop and phone sizes as well.
  await page.evaluate(async()=>{
   document.getElementById('edgeProof').remove();const m={...model(CARDS.find(c=>/Odysseus.*Cunning/i.test(c.name||c.displayName))?.number||selected),frameStyle:'full-art',fit:'cover',zoom:1,focusX:0,focusY:0};
   const sh=makeCardShell(m);sh.id='paintingProof';sh.style.cssText='position:fixed;top:20px;left:20px;z-index:99999;margin:0';document.body.append(sh);
   const img=sh.querySelector('.art-img');img.src='/mtgtools/odyssey/assets/artwork/ART-239.3576d8b6d103.full.webp';await img.decode();const met=artViewportMetrics(img,img.closest('.artbox'),m);m.focusX=((met.rw-met.W)/2+25)/met.maxX*100;applyArtView(img,m);window.paintingModel=m;
  });
  await page.locator('#paintingProof').screenshot({path:path.join(out,'painting-desktop.png')});
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{document.getElementById('paintingProof').style.transform='scale(.9)';});
  await page.locator('#paintingProof').screenshot({path:path.join(out,'painting-mobile.png')});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
