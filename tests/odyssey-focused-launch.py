"""Focused launch regression: real cards, real delivered artworks, no substitute images."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.environ.get('EXHIBITION_TEST_URL','http://127.0.0.1:8765/mtgtools/Odyssey/scry/')
OUT=Path('test-results/odyssey-focused-launch');OUT.mkdir(parents=True,exist_ok=True)
async def loaded(page,selector):
 await page.locator(selector).evaluate('''async root=>{
  const imgs=[...root.querySelectorAll('img')].filter(i=>!i.closest('[inert]'));
  for(const card of root.querySelectorAll('odyssey-studio-card'))if(!card.closest('[inert]'))imgs.push(...card.shadowRoot.querySelectorAll('img'));
  await Promise.all(imgs.map(i=>{i.loading='eager';if(i.complete&&i.naturalWidth)return;return new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Image did not load: '+i.src)),30000);i.addEventListener('load',()=>{clearTimeout(t);resolve()},{once:true});i.addEventListener('error',()=>{clearTimeout(t);reject(Error('Image failed: '+i.src))},{once:true});});}));
 }''')
 await page.wait_for_timeout(250)
async def shot(page,selector,name):
 await page.locator(selector).evaluate('(e)=>e.scrollIntoView({block:"start",behavior:"instant"})')
 await loaded(page,selector);await page.screenshot(path=str(OUT/name))
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch();page=await browser.new_page(viewport={'width':1440,'height':1100},reduced_motion='reduce')
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(BASE,wait_until='domcontentloaded');await page.wait_for_function('window.OdysseyFocusedLaunch',timeout=45000)
  try:
   assert await page.locator('#exhibition').evaluate('(e)=>[...e.children].map(n=>n.id)')==['top','mechanics','development','preview']
   assert 'FAN-MADE MAGIC: THE GATHERING' in await page.locator('#top .eyebrow').first.inner_text()
   assert await page.locator('#heroCard odyssey-studio-card').get_attribute('number')=='61'
   assert await page.locator('#mechanicChapters .mechanic').count()==8
   assert await page.locator('#mechanicChapters .carousel-tabs button').count()==8
   assert await page.locator('#exhibition odyssey-studio-card').count()==17
   assert await page.locator('#mediumChapters,#storyChapters,#social,#manifesto,#first-card').count()==0
   alloc=await page.evaluate('OdysseyFocusedLaunch.allocations')
   assert len(alloc)==11 and len({a['artId'] for a in alloc})==11
   assert next(a['artId'] for a in alloc if a['slot']=='hero')=='ART-239'
   assert next(a['artId'] for a in alloc if a['slot']=='participation')=='ART-236'
   assert next(a['artId'] for a in alloc if a['slot']=='spoiler')=='EXH-AUTOLYCUS'
   assert 'Charles Robert Leslie' in await page.locator('#spoilerCredit').inner_text()
   assert 'The Winter’s Tale' in await page.locator('#spoilerCredit').inner_text()
   assert 'Herbert James Draper' in await page.locator('#developmentCredit').inner_text()
   for sel in ['header .brand-logo','footer .brand-logo']:
    style=await page.locator(sel).evaluate('(e)=>({background:getComputedStyle(e).backgroundColor,border:getComputedStyle(e).borderTopWidth,src:e.querySelector("img").getAttribute("src"),filter:getComputedStyle(e.querySelector("img")).filter})')
    assert style['background']=='rgba(0, 0, 0, 0)' and style['border']=='0px',style
    assert style['src'].endswith('.png') and 'brightness(0)' in style['filter']
   await loaded(page,'#top')
   assert await page.locator('header .brand-logo img').evaluate('(im)=>{const c=document.createElement("canvas");c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext("2d");x.drawImage(im,0,0);return x.getImageData(0,0,1,1).data[3]===0}')
   await shot(page,'#top','hero-desktop.png')
   await page.locator('#heroCard button').click();assert await page.locator('#detailDialog').is_visible();assert 'Cunning Voyager' in await page.locator('#detailTitle').inner_text();await page.keyboard.press('Escape')
   highlights=[]
   for i in range(8):
    await page.evaluate('(i)=>OdysseyMechanicCarousel.go(i)',i)
    await loaded(page,'#mechanicChapters')
    visible=page.locator('#mechanicChapters .mechanic:not([inert])')
    assert await visible.count()==1
    info=await page.evaluate('(i)=>{const f=OdysseyFocusedLaunch.features[i];return{id:f.id,name:f.tab,count:OdysseyExhibition.catalogue.cards.filter(f.match).length,cards:f.featured,art:f.artId}}',i)
    assert info['count']>0
    assert await visible.locator('odyssey-studio-card').count()==2
    highlights.append(info)
    if i in [0,2,4,6,7]:await shot(page,'#mechanicChapters','highlight-'+info['id']+'.png')
    await visible.get_by_role('button',name='Explore these candidates ↗',exact=True).click()
    assert await page.locator('#spoiler').is_visible()
    assert await page.locator('#resultCount').inner_text()==f"{info['count']} of 309 candidates"
    await page.locator('#backExhibition').click()
   await page.locator('#mechanicChapters .carousel-viewport').focus();await page.keyboard.press('Home')
   assert await page.evaluate('OdysseyMechanicCarousel.index')==0
   await page.keyboard.press('ArrowRight');assert await page.evaluate('OdysseyMechanicCarousel.index')==1
   await page.keyboard.press('End');assert await page.evaluate('OdysseyMechanicCarousel.index')==7
   assert await page.get_by_role('button',name='Next set highlights',exact=True).is_disabled()
   await shot(page,'#development','involvement-desktop.png')
   assert await page.locator('#developmentImage img').evaluate('(i)=>i.naturalWidth')>=2000
   assert await page.locator('#development .participation-panel').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgba(0, 0, 0, 0)'
   assert await page.locator('#development').evaluate('(e)=>getComputedStyle(e,"::after").backgroundImage.includes("linear-gradient")')
   assert await page.locator('#updatesSignup').count()==1;assert await page.locator('#updatesSignup [name=email]').count()==1;assert await page.locator('#signupLink').count()==0
   await shot(page,'#preview','autolycus-spoiler.png');await shot(page,'footer','footer-logo.png')
   for width in [320,390,768,1440]:
    await page.set_viewport_size({'width':width,'height':1000});await page.evaluate('window.scrollTo({top:0,behavior:"instant"})');await page.wait_for_timeout(250)
    assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),f'Horizontal overflow at {width}'
    if width in [390,768]:
     await shot(page,'#top','hero-'+str(width)+'.png');await shot(page,'#development','involvement-'+str(width)+'.png')
    await page.evaluate('OdysseyMechanicCarousel.go(2)');await shot(page,'#mechanicChapters','sagas-'+str(width)+'.png')
   # This public page must still apply the published native Studio framing.
   assert await page.evaluate('''()=>{const R=OdysseyStudioRenderer,P=OdysseyPlacement,m=R.engine.model(61),r=P.capture(m,R.engine.imageForArt(m));r.zoom=1.6;r.focusX=12;r.focusY=-15;const s=P.empty();s.records[P.key(r)]=r;R.setPlacements(s);const ok=document.querySelector('#heroCard odyssey-studio-card').model.zoom===1.6;R.setPlacements(P.empty());return ok;}''')
   await page.get_by_role('button',name='Open spoiler ↗',exact=True).click();await page.locator('#clearFilters').click()
   for attempt in range(20):
    before=await page.locator('#cardGrid odyssey-studio-card').count()
    if before==309:break
    await page.locator('#loadMore').focus()
    await page.keyboard.press('Enter')
    await page.wait_for_function('(n)=>document.querySelectorAll("#cardGrid odyssey-studio-card").length>n',arg=before,timeout=15000)
    await page.wait_for_timeout(150)
   assert await page.locator('#cardGrid odyssey-studio-card').count()==309
   bad=await page.locator('#cardGrid odyssey-studio-card').evaluate_all('(cs)=>cs.filter(c=>c.dataset.renderError).map(c=>c.getAttribute("number"))');assert not bad,bad
   await page.goto(BASE+'art.html',wait_until='domcontentloaded');await page.wait_for_function('window.OdysseyArtJourney',timeout=45000)
   assert await page.locator('#artworkIndex').count()==1
   assert await page.evaluate('OdysseyArtJourney.allocations.length')==20
   await page.goto(BASE+'social/?cards=61,17,209,200,229',wait_until='domcontentloaded');await page.wait_for_function('window.OdysseyExhibition',timeout=45000)
   assert await page.locator('#promoStage odyssey-studio-card').count()==5
   assert not errors,errors
   result={'status':'passed','sections':['hero','eight set highlights','participation','temporary spoiler'],'heroCard':'ODY-061','cards':309,'nativeStudioPlacementsPreserved':True,'transparentPNGLogo':True,'highlights':highlights,'uniqueBackgrounds':alloc,'widths':[320,390,768,1440],'artExhibitionPreserved':True,'socialStudioPreserved':True,'pageErrors':errors}
   (OUT/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
  except Exception:
   await page.screenshot(path=str(OUT/'failure.png'));(OUT/'failure.json').write_text(json.dumps({'errors':errors,'url':page.url,'body':(await page.locator('body').inner_text())[:15000]},indent=2));raise
  await browser.close()
asyncio.run(main())
