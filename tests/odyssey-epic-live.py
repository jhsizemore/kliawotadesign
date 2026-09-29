"""Read-only smoke test of the actual production URL after deployment.
No network interception, form submissions, storage changes or renderer overrides.
"""
import asyncio,io,json
from pathlib import Path
from PIL import Image,ImageStat
from playwright.async_api import async_playwright
from odyssey_delivery import wait_for_delivery
URL='https://kliawota.design/mtgtools/Odyssey/scry/'
OUT=Path('test-results/odyssey-epic-live');OUT.mkdir(parents=True,exist_ok=True)
async def images(page,selector):
 await page.locator(selector).evaluate('''async root=>{const all=[...root.querySelectorAll('img')].filter(i=>!i.closest('[inert]'));for(const c of root.querySelectorAll('odyssey-studio-card'))if(!c.closest('[inert]'))all.push(...c.shadowRoot.querySelectorAll('img'));await Promise.all(all.map(i=>{i.loading='eager';if(i.complete&&i.naturalWidth)return;return new Promise((ok,bad)=>{const t=setTimeout(()=>bad(Error('Image not delivered: '+i.src)),30000);i.addEventListener('load',()=>{clearTimeout(t);ok();},{once:true});i.addEventListener('error',()=>{clearTimeout(t);bad(Error('Image failed: '+i.src));},{once:true});});}));}''')
async def main():
 # The caller runs after Cloudflare's completed build. Verify canonical page
 # contracts and the precise versioned URLs used by its browser first.
 await asyncio.to_thread(wait_for_delivery)
 async with async_playwright() as p:
  browser=await p.chromium.launch();page=await browser.new_page(viewport={'width':1440,'height':1150},reduced_motion='reduce');errors=[];writes=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:writes.append(r.url) if r.method not in ['GET','HEAD','OPTIONS'] else None)
  try:
   await page.goto(URL,wait_until='domcontentloaded');await page.wait_for_function('document.documentElement.dataset.rulesSpotlights==="ready"',timeout=60000)
   await images(page,'#top');await page.wait_for_function('document.querySelector("#heroCard odyssey-studio-card")?.dataset.artPaint==="ready"',timeout=45000)
   rect=await page.locator('#heroCard').bounding_box();png=await page.screenshot(path=str(OUT/'live-hero.png'));im=Image.open(io.BytesIO(png)).convert('RGB');x,y,w,h=[rect[k] for k in ['x','y','width','height']]
   sample=im.crop((round(x+w*.3),round(y+h*.25),round(x+w*.7),round(y+h*.48)));variance=ImageStat.Stat(sample).stddev;assert max(variance)>8
   assert await page.locator('#heroCard').evaluate('e=>getComputedStyle(e).transform')!='none'
   assert await page.locator('#heroCard odyssey-studio-card').get_attribute('frame-style')=='full-art'
   assert await page.locator('#epicArtifact').count()==1
   await page.locator('.epic-introduction').scroll_into_view_if_needed();await images(page,'.epic-introduction');await page.screenshot(path=str(OUT/'live-odyssey-introduction.png'))
   highlights=[]
   for i in range(8):
    await page.evaluate('i=>OdysseyMechanicCarousel.go(i)',i);await images(page,'#mechanicChapters')
    active=page.locator('#mechanicChapters .mechanic:not([inert])');definition=await active.locator('.spotlight-oracle').inner_text();assert len(definition)>50
    assert 'may change during development' in await active.locator('.spotlight-development').inner_text()
    art=await active.locator('.mechanic-bg img').get_attribute('data-artwork-id');highlights.append({'slide':i+1,'definition':definition,'art':art})
    if i==0:
     assert 'top two cards' in definition and 'exile the other' in definition
     await active.scroll_into_view_if_needed();await page.screenshot(path=str(OUT/'live-manifest-fate.png'))
   assert len({a['art'] for a in highlights})==8
   await page.locator('#preview').scroll_into_view_if_needed();await images(page,'#preview');await page.screenshot(path=str(OUT/'live-autolycus-inset.png'))
   assert 'Charles Robert Leslie' in await page.locator('#spoilerCredit').inner_text()
   assert 'not an episode from Homer' in await page.locator('#spoilerCredit').inner_text()
   assert await page.locator('.spoiler-inset #spoilerImage img').evaluate('i=>getComputedStyle(i).objectFit')=='contain'
   await page.set_viewport_size({'width':390,'height':1000});await page.locator('#heroCard').scroll_into_view_if_needed();await images(page,'#heroCard');await page.screenshot(path=str(OUT/'live-mobile-hero.png'))
   assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
   assert not errors,errors
   assert not [u for u in writes if '/mtgtools/odyssey/api/' in u],writes
   result={'status':'passed','url':page.url,'actualProductionPage':True,'networkInterception':False,'mutationRequests':writes,'tiltedNativeFullArtPixels':variance,'artifact':'The Met 09.182.50','workingHighlights':highlights,'autolycusInset':True,'mobileWidth':390,'pageErrors':errors}
   (OUT/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False,indent=2),flush=True)
  except Exception:
   await page.screenshot(path=str(OUT/'live-failure.png'));(OUT/'live-failure.json').write_text(json.dumps({'url':page.url,'errors':errors,'writes':writes,'text':(await page.locator('body').inner_text())[:10000]},indent=2));raise
  await browser.close()
asyncio.run(main())
