"""Verify full-art visibility in actual viewport screenshots.
No substitute artwork, image regeneration or real email submission.
An element screenshot can itself trigger a repaint, so check the original page capture.
"""
import asyncio, io, json, os
from pathlib import Path
from PIL import Image, ImageStat
from playwright.async_api import async_playwright
BASE=os.environ.get('EXHIBITION_TEST_URL','http://127.0.0.1:8765/mtgtools/Odyssey/scry/')
OUT=Path('test-results/odyssey-fullart-paint');OUT.mkdir(parents=True,exist_ok=True)
async def capture(page,name):
 await page.wait_for_function('document.querySelector("#heroCard odyssey-studio-card")?.dataset.artPaint==="ready"',timeout=45000)
 rect=await page.locator('#heroCard').bounding_box()
 assert rect and rect['width']>100
 image=Image.open(io.BytesIO(await page.screenshot(path=str(OUT/(name+'.png')))))).convert('RGB')
 x,y,w,h=(rect[k] for k in ['x','y','width','height'])
 box=(round(x+w*.3),round(y+h*.25),round(x+w*.7),round(y+h*.5))
 assert box[0]>=0 and box[1]>=0 and box[2]<=image.width and box[3]<=image.height,'Art sample is outside the captured viewport'
 sample=image.crop(box);deviation=ImageStat.Stat(sample).stddev
 assert max(deviation)>8,f'Full-art image absent from {name}: {deviation}'
 return {'name':name,'sample':box,'channelDeviation':deviation}
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch()
  page=await browser.new_page(viewport={'width':1440,'height':1100},reduced_motion='reduce')
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.route('**/api/art-placement',lambda r:r.fulfill(json={'schema':'odyssey-art-placement/v1','revision':0,'records':{}}))
  await page.route('**/api/contact',lambda r:r.fulfill(json={'enabled':False}))
  samples=[]
  try:
   await page.goto(BASE,wait_until='domcontentloaded')
   await page.wait_for_function('window.OdysseyFocusedLaunch',timeout=45000)
   samples.append(await capture(page,'hero-first-1440'))
   for width in [390,768,1440]:
    await page.set_viewport_size({'width':width,'height':1100})
    await page.locator('#heroCard').evaluate('e=>e.scrollIntoView({block:"center",behavior:"instant"})')
    await page.wait_for_timeout(250)
    samples.append(await capture(page,'hero-'+str(width)))
   await page.evaluate('''()=>{const P=OdysseyPlacement,R=OdysseyStudioRenderer,m=R.engine.model(61),r=P.capture(m,R.engine.imageForArt(m));r.zoom=1.1;r.focusX=8;const s=P.empty();s.records[P.key(r)]=r;R.setPlacements(s);}''')
   samples.append(await capture(page,'hero-published-crop'))
   assert await page.evaluate('document.querySelector("#heroCard odyssey-studio-card").model.zoom')==1.1
   assert await page.evaluate('OdysseyStudioRenderer.engine.model(61).frameStyle')!='full-art','Presentation changed the stored card treatment'
   relic=await page.evaluate('OdysseySetShowcase.excerpt(OdysseyExhibition.catalogue,"relics").text')
   assert relic.startswith('Equip ') and 'devotion' in relic.lower() and not relic.startswith('Equipped ')
   assert not errors,errors
   result={'status':'passed','source':'actual repository artwork and native Studio renderer','captures':samples,'firstViewportPixelsChecked':True,'publishedCropRepaints':True,'relicHighlight':relic,'errors':errors}
   (OUT/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
  except Exception:
   await page.screenshot(path=str(OUT/'failure.png'))
   (OUT/'failure.json').write_text(json.dumps({'errors':errors,'url':page.url,'passedCaptures':samples},indent=2))
   raise
  await browser.close()
asyncio.run(main())
