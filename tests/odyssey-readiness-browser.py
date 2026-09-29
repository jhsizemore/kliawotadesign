"""Actual owner UI and subscriber handler in an isolated local server.
Google identity/Sheets are simulated. No real list, Sheet, inbox or OAuth grant is used.
"""
import asyncio,json,os,mimetypes
from pathlib import Path
from urllib.parse import urlsplit,unquote
from playwright.async_api import async_playwright
BASE=os.environ.get('READINESS_TEST_ORIGIN','http://127.0.0.1:8765')
OUT=Path('test-results/odyssey-readiness');OUT.mkdir(parents=True,exist_ok=True)
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
  context=await browser.new_context(viewport={'width':390,'height':950},reduced_motion='reduce')
  errors=[]
  async def asset(route):
   root=Path('public').resolve();file=(root/unquote(urlsplit(route.request.url).path).lstrip('/')).resolve()
   if file.is_relative_to(root) and file.is_file():await route.fulfill(path=str(file),content_type=mimetypes.guess_type(file)[0] or 'application/octet-stream')
   else:await route.continue_()
  await context.route('https://kliawota.design/mtgtools/**',asset)
  async def newpage():
   page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));return page
  page=await newpage()
  async def unavailable(route):await route.fulfill(status=503,json={'error':'Controlled collection outage'})
  await context.route('**/data/odyssey-public-candidate.json',unavailable)
  await page.goto(BASE+'/mtgtools/Odyssey/scry/',wait_until='domcontentloaded')
  await page.get_by_role('button',name='Retry collection',exact=True).wait_for()
  assert await page.locator('#updatesEmail').count()==1
  await context.unroute('**/data/odyssey-public-candidate.json',unavailable)
  await page.get_by_role('button',name='Retry collection',exact=True).click()
  await page.wait_for_function('window.OdysseyFocusedLaunch && window.OdysseyCandidateSource',timeout=45000)
  await page.locator('#updatesEmail').fill('readiness-owner-flow@example.org')
  await page.locator('#updatesName').fill('Controlled readiness test')
  await page.locator('#updatesSignup [name=consent]').check()
  async def fail_save(route):
   if route.request.method=='POST':await route.fulfill(status=503,json={'error':'Controlled temporary save failure'})
   else:await route.continue_()
  await context.route('**/api/subscriptions',fail_save)
  await page.locator('#updatesSubmit').click()
  await page.wait_for_function('document.querySelector("#updatesStatus").dataset.state==="error"')
  assert await page.locator('#updatesEmail').input_value()=='readiness-owner-flow@example.org'
  assert await page.locator('#updatesSignup [name=consent]').is_checked()
  await context.unroute('**/api/subscriptions',fail_save)
  await page.locator('#updatesSubmit').click()
  await page.wait_for_function('document.querySelector("#updatesStatus").dataset.state==="success"')
  async def gis(route):
   await route.fulfill(content_type='application/javascript',body="window.google={accounts:{oauth2:{initTokenClient:(o)=>({requestAccessToken:()=>o.callback({access_token:'owner-test-credential',expires_in:3600})})}}};")
  await context.route('https://accounts.google.com/gsi/client',gis)
  admin=await newpage();await admin.goto(BASE+'/mtgtools/Odyssey/scry/subscribers/')
  await admin.locator('#clientId').fill('123-test.apps.googleusercontent.com')
  async def login():
   await admin.locator('#connect').click();await admin.locator('#manager').wait_for(state='visible')
  await login();assert 'readiness-owner-flow@example.org' in await admin.locator('#rows').inner_text()
  assert await admin.locator('#exportState').get_attribute('data-stale')=='true'
  await admin.set_viewport_size({'width':1280,'height':900});await admin.screenshot(path=str(OUT/'owner-manager-before-export.png'))
  async with admin.expect_download() as file:await admin.locator('#csv').click()
  download=await file.value;csv=Path(await download.path()).read_text()
  assert 'readiness-owner-flow@example.org' in csv and 'Email verified' in csv
  admin.on('dialog',lambda dialog:dialog.accept())
  await admin.locator('#sheet').click()
  await admin.wait_for_function('document.querySelector("#status").textContent.includes("records exported and verified")')
  assert await admin.locator('#exportState').get_attribute('data-stale')=='false'
  sheet=await(await admin.request.get(BASE+'/__test/sheet')).json();assert any('readiness-owner-flow@example.org' in row for row in sheet['rows'])
  row=admin.locator('#rows tr').filter(has_text='readiness-owner-flow@example.org')
  await row.get_by_role('button',name='Unsubscribe',exact=True).click()
  await admin.wait_for_function('document.querySelector("#status").textContent.startsWith("Updated.")')
  assert await admin.locator('#exportState').get_attribute('data-stale')=='true'
  async with admin.expect_download() as file:await admin.locator('#csv').click()
  assert 'readiness-owner-flow@example.org' not in Path(await(await file.value).path()).read_text()
  await row.get_by_role('button',name='Delete personal details',exact=True).click()
  await admin.wait_for_function('document.querySelector("#status").textContent.startsWith("Updated.")')
  assert 'readiness-owner-flow@example.org' not in await admin.locator('#rows').inner_text()
  await admin.locator('#sheet').click();await admin.wait_for_function('document.querySelector("#status").textContent.includes("records exported and verified")')
  sheet=await(await admin.request.get(BASE+'/__test/sheet')).json();assert 'readiness-owner-flow@example.org' not in json.dumps(sheet)
  await admin.screenshot(path=str(OUT/'owner-manager-after-cleanup.png'))
  async def expired(route):await route.fulfill(status=401,json={'error':'Your Google session expired. Sign in again.'})
  await context.route('**/api/subscriptions/admin',expired)
  await admin.locator('#refresh').click();await admin.locator('#auth').wait_for(state='visible')
  assert await admin.locator('#manager').is_hidden() and await admin.locator('#rows tr').count()==0
  await context.unroute('**/api/subscriptions/admin',expired);await login()
  waiting=asyncio.Event()
  async def slow_list(route):
   if route.request.post_data_json.get('action')=='list':
    waiting.set();await asyncio.sleep(1.2)
    try:await route.fulfill(json={'rows':[{'email':'late-private@example.org','name':'late','status':'active','topics':[],'consentAt':'test','emailVerified':False}],'active':1,'total':1,'revision':1,'sheetNeedsRefresh':True})
    except Exception:pass
   else:await route.continue_()
  await context.route('**/api/subscriptions/admin',slow_list)
  await admin.locator('#refresh').click();await asyncio.wait_for(waiting.wait(),5);await admin.locator('#logout').click();await asyncio.sleep(1.5)
  assert await admin.locator('#manager').is_hidden();assert not await admin.locator('#rows tr').count()
  assert 'late-private' not in await admin.locator('body').inner_text()
  await context.unroute('**/api/subscriptions/admin',slow_list)
  delayed=await newpage()
  async def slow_data(route):await asyncio.sleep(2);await route.continue_()
  await context.route('**/data/odyssey-public-candidate.json',slow_data)
  await delayed.goto(BASE+'/mtgtools/Odyssey/scry/',wait_until='domcontentloaded')
  assert await delayed.locator('#updatesEmail').count()==1
  await delayed.wait_for_function('window.OdysseyFocusedLaunch',timeout=45000)
  await context.unroute('**/data/odyssey-public-candidate.json',slow_data)
  for width in [390,768,1440]:
   await delayed.set_viewport_size({'width':width,'height':950});await delayed.evaluate('window.scrollTo(0,0)');await delayed.wait_for_timeout(250)
   assert not await delayed.evaluate('document.documentElement.scrollWidth>innerWidth+1'),width
  await delayed.evaluate("(()=>{const i=document.querySelector('#heroImage img');i.removeAttribute('srcset');i.src='/__missing_readiness_artwork.jpg';})()")
  await delayed.wait_for_function('document.querySelector("#heroImage .failure-caption")')
  assert await delayed.locator('#heroCredit a').count()>0
  cutoff=await delayed.evaluate('Date.parse(OdysseyExhibitionCore.previewClosesAt)')
  await delayed.evaluate('(t)=>{window.__realDate=Date;window.__testNow=t;const Native=Date;window.Date=class extends Native{constructor(...a){super(...(a.length?a:[window.__testNow]));}static now(){return window.__testNow;}};}',cutoff-60000)
  await delayed.get_by_role('button',name='Open spoiler ↗',exact=True).click()
  assert await delayed.locator('#cardGrid odyssey-studio-card').count()>0
  await delayed.evaluate('(t)=>{window.__testNow=t;window.dispatchEvent(new Event("focus"));}',cutoff+1)
  await delayed.locator('#previewClosed').wait_for(state='visible')
  assert await delayed.locator('#cardGrid').is_hidden();assert await delayed.locator('#cardGrid odyssey-studio-card').count()==0
  await delayed.locator('#backExhibition').click();assert await delayed.locator('#updatesSignup').count()==1
  await delayed.locator('#heroCard button').click();assert await delayed.locator('#detailDialog').is_visible()
  await delayed.keyboard.press('Escape')
  social=await newpage();await social.add_init_script('(function(){const Native=Date;window.__testNow='+str(int(cutoff-60000))+';window.Date=class extends Native{constructor(...a){super(...(a.length?a:[window.__testNow]));}static now(){return window.__testNow;}};})();')
  await social.goto(BASE+'/mtgtools/Odyssey/scry/social/?cards=1,61',wait_until='domcontentloaded');await social.wait_for_function('window.OdysseyExhibition',timeout=45000)
  assert await social.locator('.promo-select').first.locator('option').count()==310
  await social.locator('.promo-select').first.select_option('61');await social.locator('#promoHeadline').fill('A curated voyage')
  await social.evaluate('(t)=>{window.__testNow=t;window.dispatchEvent(new Event("focus"));}',cutoff+1)
  assert await social.locator('.promo-select').first.locator('option').count()<100
  assert await social.locator('.promo-select').first.input_value()=='61';assert await social.locator('#promoHeadline').input_value()=='A curated voyage'
  nojs=await browser.new_context(java_script_enabled=False);raw=await nojs.new_page();await raw.goto(BASE+'/mtgtools/Odyssey/scry/')
  assert 'Homer' in await raw.locator('body').inner_text();assert await raw.locator('noscript').count()>0
  assert not errors,errors
  result={'status':'passed','ownerUI':'real manager JavaScript + actual subscriber handler; external Google identity and Sheets simulated','productionOwnerOAuth':'not accessed','productionSubscribersTouched':False,'campaignsSent':False,'signupFailurePreservesInput':True,'candidateRetryWorks':True,'sheetExportAndDeletionReadBack':True,'activeCSVHonoursUnsubscribe':True,'expiredTokenClearsPrivateData':True,'lateResponseAfterSignoutIgnored':True,'temporaryKeysAlarm':'unit-tested','slowCandidateDelayMs':2000,'widths':[390,768,1440],'imageFailureRetainsCredit':True,'alreadyOpenGalleryCloses':True,'openSocialNarrowsToCurated':True,'curatedCardsAndSignupRemain':True,'noscriptReadable':True,'pageErrors':errors}
  (OUT/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
  await browser.close()
asyncio.run(main())
