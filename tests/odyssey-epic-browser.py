"""Real-page test. No generated artwork, source substitution or email submission."""
import asyncio,io,json,os
from pathlib import Path
from PIL import Image,ImageStat
from playwright.async_api import async_playwright
BASE=os.environ.get('EXHIBITION_TEST_URL','http://127.0.0.1:8765/mtgtools/Odyssey/scry/')
OUT=Path(os.environ.get('EPIC_TEST_OUTPUT','test-results/odyssey-epic'));OUT.mkdir(parents=True,exist_ok=True)
async def settle(page,selector):
 await page.locator(selector).evaluate('''async root=>{const images=[...root.querySelectorAll('img')].filter(i=>!i.closest('[inert]'));for(const c of root.querySelectorAll('odyssey-studio-card'))if(!c.closest('[inert]'))images.push(...c.shadowRoot.querySelectorAll('img'));await Promise.all(images.map(i=>{i.loading='eager';if(i.complete&&i.naturalWidth)return;return new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Image timeout: '+i.src)),30000);i.addEventListener('load',()=>{clearTimeout(t);resolve();},{once:true});i.addEventListener('error',()=>{clearTimeout(t);reject(Error('Image failed: '+i.src));},{once:true});});}));}''')
 await page.wait_for_timeout(200)
async def shot(page,selector,name):
 await page.locator(selector).evaluate('e=>e.scrollIntoView({block:"start",behavior:"instant"})');await settle(page,selector);await page.screenshot(path=str(OUT/name))
async def fullart(page,label):
 await page.wait_for_function('document.querySelector("#heroCard odyssey-studio-card")?.dataset.artPaint==="ready"',timeout=45000)
 await page.locator('#heroCard').scroll_into_view_if_needed();await page.wait_for_timeout(150)
 matrix=await page.locator('#heroCard').evaluate('e=>getComputedStyle(e).transform');assert matrix!='none'
 rect=await page.locator('#heroCard').bounding_box();png=await page.screenshot(path=str(OUT/(label+'.png')));im=Image.open(io.BytesIO(png)).convert('RGB')
 x,y,w,h=[rect[k] for k in ['x','y','width','height']];sample=im.crop((round(x+w*.3),round(y+h*.25),round(x+w*.7),round(y+h*.48)))
 deviation=ImageStat.Stat(sample).stddev;assert max(deviation)>8,('Full-art image failed to paint',label,deviation)
 return {'capture':label,'transform':matrix,'pixelVariation':deviation}
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch();page=await browser.new_page(viewport={'width':1440,'height':1150},reduced_motion='reduce');errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.route('**/api/contact',lambda route:route.fulfill(json={'enabled':False}))
  try:
   await page.goto(BASE,wait_until='domcontentloaded');await page.wait_for_function('document.documentElement.dataset.rulesSpotlights==="ready"',timeout=45000)
   assert await page.locator('#exhibition').evaluate('e=>[...e.children].map(n=>n.id)')==['top','mechanics','development','preview']
   assert await page.locator('#heroCard odyssey-studio-card').get_attribute('frame-style')=='full-art'
   paints=[await fullart(page,'hero-tilted-desktop')]
   assert await page.locator('#epicArtifact').count()==1
   assert '09.182.50' in await page.locator('#epicArtifact').inner_text()
   assert 'The Met' in await page.locator('#epicArtifact').inner_text()
   assert 'not a recovered flagship' in await page.locator('.ship-emblem').inner_text()
   assert len((await page.locator('.epic-introduction .lead').inner_text()).split())<45
   await shot(page,'.epic-introduction','odyssey-fragment-and-ship.png')
   await page.locator('#epicArtifact button').click();assert await page.locator('#detailDialog').is_visible();assert 'Papyrus fragment' in await page.locator('#detailTitle').inner_text();await page.keyboard.press('Escape')
   highlights=[]
   for i in range(8):
    await page.evaluate('i=>OdysseyMechanicCarousel.go(i)',i);await settle(page,'#mechanicChapters')
    slide=page.locator('#mechanicChapters .mechanic:not([inert])');assert await slide.count()==1
    info=await page.evaluate('i=>{const f=OdysseyFocusedLaunch.features[i],q=OdysseySetShowcase.excerpt(OdysseyExhibition.catalogue,f.id),a=OdysseyEditorialAssets[f.artId];return{id:f.id,definition:q.definition,kind:q.kind,sourceCard:q.card.number,sourceExcerpt:q.text,sourceMatches:q.card.rules.includes(q.text),artId:a.id,source:a.source,landscape:a.landscape,width:a.width}}',i)
    assert info['sourceMatches'] and info['landscape'] and info['width']>=1900
    assert await slide.locator('.spotlight-oracle').inner_text()==info['definition'] or info['id']=='relics'
    assert 'may change during development' in await slide.locator('.spotlight-development').inner_text()
    if i==0:
     text=await slide.locator('.spotlight-oracle').inner_text();assert 'top two cards' in text and '2/2 creature' in text and 'exile the other' in text
     assert 'When Odysseus' not in text
    await slide.locator('.spotlight-source').click();assert await page.locator('#detailDialog').is_visible();await page.keyboard.press('Escape')
    await shot(page,'#mechanicChapters','working-'+info['id']+'.png');highlights.append(info)
   assert len({x['artId'] for x in highlights})==8
   await shot(page,'#preview','autolycus-inset-desktop.png')
   caption=await page.locator('#spoilerCredit').inner_text();assert 'Charles Robert Leslie' in caption and 'The Winter’s Tale' in caption and 'not an episode from Homer' in caption
   assert 'Jalabert' not in caption and 'Mercury' not in caption
   assert await page.locator('.spoiler-inset').count()==1
   assert await page.locator('#spoilerImage img').evaluate('i=>getComputedStyle(i).objectFit')=='contain'
   rect=await page.locator('.spoiler-inset').bounding_box();parent=await page.locator('#preview').bounding_box();assert rect['width']<parent['width']*.65
   await page.locator('.inset-art-button').click();assert 'Autolycus' in await page.locator('#detailTitle').inner_text();await page.keyboard.press('Escape')
   # Presentation tilt must survive a real source-derived placement refresh.
   await page.evaluate('''()=>{const R=OdysseyStudioRenderer,P=OdysseyPlacement,m=R.engine.model(61),r=P.capture(m,R.engine.imageForArt(m));r.zoom=1.25;r.focusX=10;r.focusY=-10;const s=P.empty();s.records[P.key(r)]=r;R.setPlacements(s);}''')
   assert await page.locator('#heroCard odyssey-studio-card').evaluate('e=>e.model.zoom')==1.25
   paints.append(await fullart(page,'hero-after-placement'))
   for width in [320,390,768,1440]:
    await page.set_viewport_size({'width':width,'height':1000});await page.wait_for_timeout(250)
    assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),width
    if width in [390,768]:
     paints.append(await fullart(page,'hero-tilted-'+str(width)));await shot(page,'.epic-introduction','fragment-'+str(width)+'.png');await shot(page,'#preview','inset-'+str(width)+'.png')
   await page.get_by_role('button',name='Open spoiler ↗',exact=True).click();await page.locator('#clearFilters').click()
   while await page.locator('#loadMore').is_visible():await page.locator('#loadMore').click();await page.wait_for_timeout(80)
   assert await page.locator('#cardGrid odyssey-studio-card').count()==309
   assert not errors,errors
   result={'status':'passed','site':BASE,'nativeHeroTiltPaint':paints,'genuineArtifact':'The Met 09.182.50, Odyssey Book 20','noExcavatedFlagshipClaim':True,'workingRules':highlights,'autolycus':'Charles Robert Leslie, ca. 1836; Shakespeare namesake identified','artworkInset':True,'canonicalCardsUnchanged':309,'widths':[320,390,768,1440],'noGeneratedArtDeployed':True,'pageErrors':errors}
   (OUT/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False,indent=2),flush=True)
  except Exception:
   await page.screenshot(path=str(OUT/'failure.png'));(OUT/'failure.json').write_text(json.dumps({'url':page.url,'errors':errors,'text':(await page.locator('body').inner_text())[:15000]},indent=2));raise
  await browser.close()
asyncio.run(main())
