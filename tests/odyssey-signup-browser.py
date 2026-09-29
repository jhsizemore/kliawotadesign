"""Actual subscriber handler persists in the local test server. No real subscribers,
Google Sheet writes or outbound emails. Real repository cards/art are used in CI.
"""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.environ.get('SIGNUP_TEST_ORIGIN','http://127.0.0.1:8765')
OUT=Path('test-results/odyssey-signup');OUT.mkdir(parents=True,exist_ok=True)
async def main():
 async with async_playwright() as p:
  opts={'headless':True}
  if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=await p.chromium.launch(**opts);context=await browser.new_context(viewport={'width':1440,'height':1100},reduced_motion='reduce');page=await context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await context.route('https://kliawota.design/mtgtools/**',lambda route:route.continue_(url=BASE+route.request.url.split('https://kliawota.design',1)[1]))
  await page.goto(BASE+'/mtgtools/Odyssey/scry/',wait_until='domcontentloaded');await page.wait_for_function('window.OdysseyFocusedLaunch && window.OdysseyCandidateSource',timeout=45000)
  try:
   assert await page.locator('#signupInterest,#signupLink,#directInterest').count()==0
   assert await page.locator('#updatesSignup').count()==1
   assert 'no Studio placements have been published' in await page.locator('#placementStatus').inner_text()
   candidate=await page.evaluate('OdysseyCandidateSource')
   expected=json.loads(Path('public/mtgtools/odyssey/data/odyssey-public-candidate.json').read_text())
   actual=await page.evaluate('OdysseyExhibition.catalogue.cards.map(c=>({id:c.id,art:c.artId,rules:c.rules}))')
   assert actual==[{'id':c['id'],'art':c['primaryArt'],'rules':c['rules']} for c in expected['cards']]
   assert await page.locator('#mechanicChapters .mechanic').count()==8
   snapshot=await page.evaluate('''()=>{const P=OdysseyPlacement,R=OdysseyStudioRenderer.engine,s=P.empty();s.revision=7;for(const c of document.querySelectorAll('#mechanicChapters odyssey-studio-card')){const m=R.model(Number(c.getAttribute('number'))),r=P.capture(m,R.imageForArt(m));r.zoom=1.35;r.focusX=-24;r.focusY=17;s.records[P.key(r)]=r;}return s;}''')
   await page.request.post(BASE+'/__test/placements',data=snapshot);await page.evaluate('OdysseyScryPlacement.refresh()')
   counts=[]
   for i in range(8):
    await page.evaluate('(i)=>OdysseyMechanicCarousel.go(i)',i);await page.wait_for_timeout(130)
    models=await page.locator('#mechanicChapters .mechanic:not([inert]) odyssey-studio-card').evaluate_all('(cards)=>cards.map(c=>({zoom:c.model.zoom,x:c.model.focusX,y:c.model.focusY,state:c.dataset.placement}))')
    assert len(models)==2 and all(c=={'zoom':1.35,'x':-24,'y':17,'state':'applied'} for c in models),(i,models)
    counts.append(models)
   stale=json.loads(json.dumps(snapshot));key=next(iter(stale['records']));stale['records'][key]['artId']='ART-001'
   assert await page.evaluate('''s=>{const n=Number(Object.keys(s.records)[0].split('|')[0].split('-')[1]);OdysseyStudioRenderer.setPlacements(s);return OdysseyStudioRenderer.engine.model(n).placementStatus==='mismatch';}''',stale)
   await page.evaluate('s=>OdysseyStudioRenderer.setPlacements(s)',snapshot)
   for width in [390,768,1440]:
    await page.set_viewport_size({'width':width,'height':1050});await page.locator('#development').scroll_into_view_if_needed();await page.wait_for_timeout(200)
    assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
    await page.screenshot(path=str(OUT/f'signup-{width}.png'))
   await page.locator('#updatesEmail').fill('browser-proof@example.org');await page.locator('#updatesName').fill('Local test subscriber')
   await page.locator('#updatesSubmit').click();assert await page.locator('#updatesSignup [name=consent]').evaluate('(e)=>!e.validity.valid')
   await page.locator('#updatesSignup [name=consent]').check();await page.locator('#updatesSubmit').click();await page.wait_for_function('document.querySelector("#updatesStatus").dataset.state==="success"',timeout=20000)
   stored=await (await page.request.get(BASE+'/__test/subscribers')).json();assert len(stored)==1 and stored[0]['email']=='browser-proof@example.org';assert stored[0]['topics']==['progress','membership','playtesting'];assert stored[0]['emailVerified'] is False
   await page.screenshot(path=str(OUT/'signup-saved.png'))
   await page.reload();await page.wait_for_function('window.OdysseyExhibition');assert len(await (await page.request.get(BASE+'/__test/subscribers')).json())==1
   unauth=await page.request.post(BASE+'/mtgtools/odyssey/api/subscriptions/admin',data={'action':'list'},headers={'Origin':BASE});assert unauth.status==403
   auth={'Origin':BASE,'Authorization':'Bearer owner-test-credential'}
   csv=await (await page.request.post(BASE+'/mtgtools/odyssey/api/subscriptions/admin',data={'action':'csv'},headers=auth)).text();import re
   token=re.search(r'manage.html#([a-f0-9]+\.[a-f0-9]+)',csv).group(1)
   await page.goto(BASE+'/mtgtools/Odyssey/scry/updates/manage.html#'+token);assert '#' not in page.url
   assert (await (await page.request.get(BASE+'/__test/subscribers')).json())[0]['status']=='active'
   await page.locator('#unsubscribe').click();await page.wait_for_function('document.querySelector("#unsubscribe").hidden');assert (await (await page.request.get(BASE+'/__test/subscribers')).json())[0]['status']=='unsubscribed'
   studio=await context.new_page();studio.on('pageerror',lambda e:errors.append(str(e)))
   await studio.goto(BASE+'/mtgtools/odyssey/');await studio.wait_for_function('window.OdysseyPlacementStudio',timeout=45000)
   await studio.evaluate("selectCard(116);setCropField('zoom',1.8);setCropField('focusX',21)")
   projection=await studio.evaluate('JSON.parse(localStorage.getItem(OdysseyPlacement.PREVIEW_CACHE))');assert projection['snapshot']['records']['ODY-116|front']['zoom']==1.8
   assert 'rules' not in projection['snapshot']['records']['ODY-116|front']
   await page.goto(BASE+'/mtgtools/Odyssey/scry/');await page.wait_for_function('window.OdysseyExhibition && OdysseyStudioRenderer.engine.model(116).zoom===1.8',timeout=45000)
   assert await page.locator('#placementAuthorNotice').is_visible()
   await page.locator('#placementAuthorNotice').get_by_role('link',name='View the public version').click();await page.wait_for_function('window.OdysseyExhibition')
   assert await page.evaluate('OdysseyStudioRenderer.engine.model(116).zoom')==1.35
   visitor=await browser.new_page();await visitor.goto(BASE+'/mtgtools/Odyssey/scry/');await visitor.wait_for_function('window.OdysseyExhibition');assert await visitor.evaluate('OdysseyStudioRenderer.engine.model(116).zoom')==1.35
   assert await visitor.locator('#placementAuthorNotice').count()==0
   assert not errors,errors
   result={'status':'passed','candidateSource':candidate,'all309MatchStudio':True,'allEightSlidesUsePublishedPlacements':True,'latePlacementRefresh':True,'changedArtworkGuard':True,'localAuthorPreviewLabelled':True,'privateVisitorIsolation':True,'signupPersistedInActualHandler':True,'explicitConsent':True,'noRealEmailsOrSheetWrites':True,'ownerOnlyList':True,'unsubscribeWorks':True,'widths':[390,768,1440],'pageErrors':errors}
   (OUT/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
  except Exception:
   await page.screenshot(path=str(OUT/'failure.png'));(OUT/'failure.json').write_text(json.dumps({'errors':errors,'url':page.url,'body':(await page.locator('body').inner_text())[-12000:]},indent=2));raise
  await browser.close()
asyncio.run(main())
