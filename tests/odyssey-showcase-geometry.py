import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('test-results/odyssey-showcase');OUT.mkdir(parents=True,exist_ok=True)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch();page=await b.new_page(viewport={'width':1440,'height':1100},reduced_motion='reduce')
  await page.goto('http://127.0.0.1:8765/mtgtools/Odyssey/scry/',wait_until='domcontentloaded');await page.wait_for_function('document.documentElement.dataset.rulesSpotlights==="ready"',timeout=45000)
  await page.wait_for_function('document.querySelector("#heroCard odyssey-studio-card").shadowRoot.querySelector(".art-img").naturalWidth>0',timeout=30000)
  geometry=await page.evaluate('''()=>{const c=document.querySelector('#heroCard odyssey-studio-card');return {model:c.model,elements:[...c.shadowRoot.querySelectorAll('.card-shell,.render-card,.frame,.inner,.artbox,.art-img')].map(e=>({class:e.className,naturalWidth:e.naturalWidth,naturalHeight:e.naturalHeight,clientWidth:e.clientWidth,clientHeight:e.clientHeight,rect:e.getBoundingClientRect().toJSON(),inline:e.getAttribute('style'),css:Object.fromEntries(['position','width','height','display','visibility','opacity','transform','top','bottom','z-index'].map(k=>[k,getComputedStyle(e).getPropertyValue(k)]))}))}}''')
  dimensions=[]
  for i in range(8):
   await page.evaluate('i=>OdysseyMechanicCarousel.go(i)',i)
   await page.locator('#mechanicChapters .mechanic:not([inert]) .mechanic-bg img').evaluate('async i=>{i.loading="eager";await i.decode()}')
   dimensions.append(await page.evaluate('''i=>{const f=OdysseyFocusedLaunch.features[i],a=OdysseyExhibition.catalogue.arts.get(f.artId),j=OdysseyJourneyAssets.assets[f.artId],im=document.querySelector('#mechanicChapters .mechanic:not([inert]) .mechanic-bg img');return{id:f.id,art:f.artId,naturalWidth:im.naturalWidth,currentSrc:im.currentSrc,width:a.width,height:a.height,journey:j?{display:j.display,full:j.full}:null}}''',i))
  result={'hero':geometry,'landscapes':dimensions};(OUT/'geometry.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2),flush=True)
  await page.locator('#top').evaluate('e=>e.scrollIntoView({behavior:"instant"})');await page.screenshot(path=str(OUT/'full-art-geometry.png'));await b.close()
asyncio.run(main())
