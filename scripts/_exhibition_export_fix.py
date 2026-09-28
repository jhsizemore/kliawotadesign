from pathlib import Path
p=Path('public/mtgtools/Odyssey/scry/exhibition.js');s=p.read_text()
old="  const imgs=components.flatMap(c=>[...c.shadowRoot.querySelectorAll('img')]);"
new="  const imgs=[...$('promoStage').querySelectorAll('img'),...components.flatMap(c=>[...c.shadowRoot.querySelectorAll('img')])];"
assert s.count(old)==1;s=s.replace(old,new)
old='  await Promise.all(imgs.map(img=>img.decode()));'
new='''  // The browser may evict decoded large images when the export button scrolls
  // them off screen. Do not force every full-resolution original into memory.
  // Wait for source metadata; validate and resize each fetched export image below.
  for(const image of imgs){image.loading='eager';if(image.complete&&image.naturalWidth)continue;await new Promise((resolve,reject)=>{const done=()=>{clearTimeout(timer);image.removeEventListener('load',loaded);image.removeEventListener('error',failed);};const loaded=()=>{done();image.naturalWidth?resolve():reject(Error('Artwork has no dimensions: '+image.src));};const failed=()=>{done();reject(Error('Cannot load artwork: '+image.src));};const timer=setTimeout(()=>{done();reject(Error('Artwork load timed out: '+image.src));},20000);image.addEventListener('load',loaded,{once:true});image.addEventListener('error',failed,{once:true});if(image.complete&&image.naturalWidth)loaded();});}
  hydrateCards($('promoStage'));
  const dimensions=new Map(imgs.map(i=>[i.currentSrc||i.src,{width:i.naturalWidth,height:i.naturalHeight}]));'''
assert s.count(old)==1;s=s.replace(old,new)
old='urls.set(src,dataImage(src))';new='urls.set(src,dataImage(src,dimensions.get(src)))'
assert s.count(old)==1;s=s.replace(old,new)
start=s.index('async function dataImage(');end=s.index('\nfunction expandedClone(',start)
s=s[:start]+'''async function dataImage(src,dimensions){
 const response=await fetch(src,{signal:AbortSignal.timeout(20000),cache:'force-cache'});
 if(!response.ok)throw Error('Artwork fetch failed: '+src);
 const blob=await response.blob();if(!blob.type.startsWith('image/'))throw Error('An artwork URL did not return an image.');
 if(blob.type!=='image/svg+xml'){
  const width=dimensions?.width||0,height=dimensions?.height||0,ratio=width&&height?Math.min(1,2048/Math.max(width,height)):1;
  const options=width&&height?{resizeWidth:Math.max(1,Math.round(width*ratio)),resizeHeight:Math.max(1,Math.round(height*ratio)),resizeQuality:'high'}:{};
  let bitmap;try{bitmap=await createImageBitmap(blob,options);}catch{throw Error('Cannot prepare artwork pixels for export: '+src);}
  try{const factor=Math.min(1,2048/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*factor));canvas.height=Math.max(1,Math.round(bitmap.height*factor));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);return canvas.toDataURL(Math.max(canvas.width,canvas.height)<128?'image/png':'image/webp',.96);}finally{bitmap.close();}
 }
 return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);});
}
'''+s[end:]
old="img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await img.decode();"
new="img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await img.decode().catch(()=>{window.__odysseyFailedExportSVG=svg;throw Error('Cannot decode the composed SVG ('+svg.length+' characters).');});"
assert s.count(old)==1;s=s.replace(old,new);p.write_text(s)
p=Path('tests/odyssey-exhibition-browser.py');s=p.read_text()
old="            print('EXPORT FAILURE STATUS:',status,flush=True)"
new=old+"\n            failed_svg=await page.evaluate('window.__odysseyFailedExportSVG || null')\n            if failed_svg: (OUT/'export-failure.svg').write_text(failed_svg)"
assert s.count(old)==1;s=s.replace(old,new)
old='    await page.wait_for_timeout(350)'
new='''    await page.locator(selector).evaluate("""async root => {
        const visible = e => !e.closest('[inert]') && e.getClientRects().length;
        const images=[...root.querySelectorAll('img')].filter(visible);
        for(const card of root.querySelectorAll('odyssey-studio-card'))if(visible(card))images.push(...card.shadowRoot.querySelectorAll('img'));
        await Promise.all(images.map(i=>{i.loading='eager';if(i.complete&&i.naturalWidth)return;return new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Screenshot image did not load: '+i.src)),20000);i.addEventListener('load',()=>{clearTimeout(t);resolve();},{once:true});i.addEventListener('error',()=>{clearTimeout(t);reject(Error('Screenshot image failed: '+i.src));},{once:true});});}));
    }""")
    await page.wait_for_timeout(350)'''
assert s.count(old)==1;s=s.replace(old,new);p.write_text(s)
