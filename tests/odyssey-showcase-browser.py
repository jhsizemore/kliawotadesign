import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.environ.get('EXHIBITION_TEST_URL','http://127.0.0.1:8765/mtgtools/Odyssey/scry/')
OUT=Path('test-results/odyssey-showcase');OUT.mkdir(parents=True,exist_ok=True)
async def settle(page,selector):
 await page.locator(selector).evaluate('''async root=>{const images=[...root.querySelectorAll('img')].filter(i=>!i.closest('[inert]'));for(const c of root.querySelectorAll('odyssey-studio-card'))if(!c.closest('[inert]'))images.push(...c.shadowRoot.querySelectorAll('img'));await Promise.all(images.map(i=>{i.loading='eager';if(i.complete&&i.naturalWidth)return;return new Promise((res,rej)=>{const t=setTimeout(()=>rej(Error(i.src)),30000);i.addEventListener('load',()=>{clearTimeout(t);res()},{once:true});i.addEventListener('error',()=>{clearTimeout(t);rej(Error(i.src))},{once:true});});}));}''')
 await page.wait_for_timeout(200)
async def screenshot(page,selector,name):
 await page.locator(selector).evaluate('e=>e.scrollIntoView({block:"start",behavior:"instant"})');await settle(page,selector);await page.screenshot(path=str(OUT/name))
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch();page=await browser.new_page(viewport={'width':1440,'height':1100},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.route('**/api/contact',lambda route:route.fulfill(json={'enabled':False}))
  try:
   await page.goto(BASE,wait_until='domcontentloaded');await page.wait_for_function('document.documentElement.dataset.rulesSpotlights==="ready"',timeout=45000)
   assert await page.locator('#top .opening-sub').inner_text()=='Homer’s famous epic, retold as a Magic: The Gathering set.\nGods, monsters and the long voyage home—illustrated by historical art.'
   assert await page.locator('#heroCard odyssey-studio-card').get_attribute('frame-style')=='full-art'
   assert await page.evaluate("document.querySelector('#heroCard odyssey-studio-card').model.frameStyle==='full-art'")
   assert await page.evaluate("OdysseyStudioRenderer.engine.model(61).frameStyle!=='full-art'"),'Editorial treatment must not change the stored candidate'
   assert await page.evaluate("(()=>{const a=document.querySelector('.ship-emblem svg path').getAttribute('d'),b=document.querySelector('#heroCard odyssey-studio-card').shadowRoot.querySelector('.set-symbol svg path').getAttribute('d');return a===b})()")
   assert await page.locator('.ship-emblem svg').evaluate('e=>e.getBoundingClientRect().width>=100')
   await screenshot(page,'#top','full-art-hero-1440.png')
   # Loaded metadata alone is not proof that a composited image actually painted.
   from PIL import Image,ImageStat
   import io
   pixels=Image.open(io.BytesIO(await page.locator('#heroCard').screenshot())).convert('RGB');w,h=pixels.size
   deviation=ImageStat.Stat(pixels.crop((int(w*.25),int(h*.18),int(w*.75),int(h*.45)))).stddev
   assert max(deviation)>6, 'The loaded full-art image did not paint inside its frame'
   await screenshot(page,'#mechanics','ship-and-rules-1440.png')
   highlights=[]
   for i in range(8):
    await page.evaluate('i=>OdysseyMechanicCarousel.go(i)',i);await settle(page,'#mechanicChapters')
    slide=page.locator('#mechanicChapters .mechanic:not([inert])');assert await slide.locator('.rules-spotlight').count()==1
    info=await page.evaluate('i=>{const f=OdysseyFocusedLaunch.features[i],q=OdysseySetShowcase.excerpt(OdysseyExhibition.catalogue,f.id);return {id:f.id,card:q.card.number,excerpt:q.text,source:q.card.rules.includes(q.text),art:f.artId}}',i)
    assert info['source'];assert await slide.locator('.spotlight-oracle').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)>=20 && e.scrollHeight<=e.clientHeight+1')
    assert await page.evaluate('(id)=>{const a=OdysseyExhibition.catalogue.arts.get(id),j=OdysseyJourneyAssets.assets[id];return (j?.full.width||a.width)>=1900}',info['art'])
    assert await slide.locator('.mechanic-bg img').evaluate('i=>i.complete&&i.naturalWidth>0')
    await slide.locator('.spotlight-source').click();assert await page.locator('#detailDialog').is_visible();await page.keyboard.press('Escape')
    highlights.append(info)
    if i in [1,3,5,7]:await screenshot(page,'#mechanicChapters','rules-'+info['id']+'.png')
   assert len({x['art'] for x in highlights})==8
   await screenshot(page,'#development','come-aboard-right-1440.png')
   assert await page.locator('#developmentImage img').evaluate('i=>{const a=i.getBoundingClientRect(),b=i.parentElement.getBoundingClientRect();return a.left<=b.left+1&&a.right>=b.right&&a.top<=b.top+1&&a.bottom>=b.bottom-1}')
   for width in [390,768,1440]:
    await page.set_viewport_size({'width':width,'height':1000});await page.evaluate('window.scrollTo({top:0,behavior:"instant"})');await page.wait_for_timeout(250)
    assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),width
    if width==390:await screenshot(page,'#top','full-art-hero-390.png');await screenshot(page,'#mechanics','rules-390.png');await screenshot(page,'#development','come-aboard-390.png')
   assert await page.locator('#signupInterest').is_visible();assert await page.locator('#directInterest').count()==0
   # No provider account is impersonated: only these test requests are simulated.
   formpage=await browser.new_page(viewport={'width':1440,'height':1150},reduced_motion='reduce');formpage.on('pageerror',lambda e:errors.append(str(e)))
   attempts=[];fail={'value':True}
   async def endpoint(route):
    if route.request.method=='GET':return await route.fulfill(json={'enabled':True,'sitekey':'mock-site-key-for-browser'})
    payload=route.request.post_data_json;attempts.append(payload)
    if fail['value']:return await route.fulfill(status=502,json={'error':'Test sending failure; your message was not sent.'})
    return await route.fulfill(status=202,json={'submitted':True,'message':'Your message has been submitted to Hunter.'})
   await formpage.route('**/api/contact',endpoint)
   await formpage.add_init_script("window.turnstile={ready:cb=>cb(),render:(el,o)=>{window.testTurnstileCallback=o.callback;setTimeout(()=>o.callback('test-turnstile-token'),10);return'1';},reset:()=>setTimeout(()=>window.testTurnstileCallback('test-turnstile-token'),10)}")
   await formpage.goto(BASE,wait_until='domcontentloaded');await formpage.wait_for_function('document.querySelector("#directInterest:not([hidden])")',timeout=40000)
   form=formpage.locator('#directInterest');await form.locator('[name=name]').fill('Test visitor');await form.locator('[name=email]').fill('visitor@example.org');await form.locator('[name=role]').select_option('playtesting');await form.locator('[name=message]').fill('Please include me in a playtest.');await form.locator('[name=consent]').check();await form.get_by_role('button',name='Send my message ↗').click()
   await formpage.wait_for_function('document.querySelector(".send-status").textContent.includes("Test sending failure")')
   assert await form.locator('[name=message]').input_value()=='Please include me in a playtest.'
   await screenshot(formpage,'#development','direct-form-ready-example.png')
   fail['value']=False;await form.get_by_role('button',name='Send my message ↗').click();await formpage.wait_for_function('document.querySelector(".send-status").textContent.includes("submitted to Hunter")')
   assert len(attempts)==2;assert attempts[0]['consent'] is True;assert attempts[0]['email']=='visitor@example.org';assert await form.locator('[name=email]').input_value()==''
   assert not errors,errors
   result={'status':'passed','nativeFullArtHero':True,'storedCropUnaffected':True,'sharedShipSymbol':True,'eightExactRulesSpotlights':highlights,'widths':[390,768,1440],'disabledFormKeepsEmailLink':True,'failedSendPreservesMessage':True,'successfulSendResetsForm':True,'liveEmailDelivery':'not tested; Cloudflare setup required; browser delivery is mocked','pageErrors':errors}
   (OUT/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
  except Exception:
   await page.screenshot(path=str(OUT/'failure.png'));(OUT/'failure.json').write_text(json.dumps({'url':page.url,'errors':errors},indent=2));raise
  await browser.close()
asyncio.run(main())
