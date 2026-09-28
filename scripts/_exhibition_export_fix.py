from pathlib import Path
p=Path('public/mtgtools/Odyssey/scry/exhibition.js');s=p.read_text()
old='  await Promise.all(imgs.map(img=>img.decode()));'
new="  await Promise.all(imgs.map(img=>img.decode().catch(()=>{throw Error('Cannot decode card image: '+img.currentSrc);})));"
assert s.count(old)==1;s=s.replace(old,new)
old="img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await img.decode();"
new="img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await img.decode().catch(()=>{window.__odysseyFailedExportSVG=svg;throw Error('Cannot decode the composed SVG ('+svg.length+' characters).');});"
assert s.count(old)==1;s=s.replace(old,new)
# Keep full artwork on screen; bound image memory in the 1200/1920-pixel export.
old="const blob=await response.blob();if(!blob.type.startsWith('image/'))throw new Error('An artwork URL did not return an image.');return new Promise"
new="const blob=await response.blob();if(!blob.type.startsWith('image/'))throw new Error('An artwork URL did not return an image.');const bitmap=await createImageBitmap(blob);try{if(Math.max(bitmap.width,bitmap.height)>2048){const ratio=2048/Math.max(bitmap.width,bitmap.height),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/webp',.96);}}finally{bitmap.close();}return new Promise"
assert s.count(old)==1;s=s.replace(old,new);p.write_text(s)
p=Path('tests/odyssey-exhibition-browser.py');s=p.read_text()
old="            print('EXPORT FAILURE STATUS:',status,flush=True)"
new=old+"\n            failed_svg=await page.evaluate('window.__odysseyFailedExportSVG || null')\n            if failed_svg: (OUT/'export-failure.svg').write_text(failed_svg)"
assert s.count(old)==1;p.write_text(s.replace(old,new))
