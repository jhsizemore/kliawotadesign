"""Real Studio/Scry pages; Google authorization/publication boundary is mocked.
The server's Google protocol is independently tested. No real Sheet writes.
"""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.environ.get('PLACEMENT_TEST_ORIGIN','http://127.0.0.1:8765')
OUT=Path('test-results/odyssey-placement');OUT.mkdir(parents=True,exist_ok=True)
SCHEMA='odyssey-art-placement/v1'
FIELDS=['artHeight','frameStyle','fit','zoom','focusX','focusY']
async def main():
 published={'schema':SCHEMA,'revision':0,'records':{}};live={};errors=[]
 def error(label,e):errors.append(label+': '+str(e));print(errors[-1],flush=True)
 def eq(a,b):
  if a is None or b is None:return a is b
  return all(a.get(k)==b.get(k) for k in a if k not in ['updatedAt','revision'])
 async def endpoint(route):
  request=route.request
  if request.method=='GET':return await route.fulfill(json=published)
  assert request.headers.get('authorization')=='Bearer test-google-credential'
  b=request.post_data_json;plan={'writes':[],'already':[],'conflicts':[]}
  for d in b.get('changes',[]):
   k=d['after']['cardId']+'|'+d['after']['face'];current=live.get(k)
   if eq(d['after'],current):plan['already'].append(d)
   elif eq(d['before'],current):plan['writes'].append(d)
   else:plan['conflicts'].append({'key':k,**d,'live':current})
  if b['action']=='review':return await route.fulfill(json={'schema':SCHEMA,'records':live,**plan})
  if plan['conflicts']:return await route.fulfill(status=409,json={'error':'Sheet placements changed.',**plan})
  for d in plan['writes']:
   k=d['after']['cardId']+'|'+d['after']['face'];live[k]={**d['after'],'revision':live.get(k,{}).get('revision',0)+1,'updatedAt':'2026-09-29T00:00:00Z'}
  published['revision']+=1;published['records']=json.loads(json.dumps(live))
  return await route.fulfill(json={**published,'verified':True,'written':len(plan['writes'])})
 async with async_playwright() as p:
  launch={'headless':True}
  if os.environ.get('CHROMIUM_PATH'):launch['executable_path']=os.environ['CHROMIUM_PATH']
  browser=await p.chromium.launch(**launch)
  context=await browser.new_context(viewport={'width':1440,'height':1050},reduced_motion='reduce')
  await context.route('**/api/art-placement',endpoint)
  await context.add_init_script("window.ODYSSEY_SHEET_TEST_TOKEN='test-google-credential';if(!sessionStorage.getItem('seeded')){localStorage.setItem('odyssey-layout-overrides-v02',JSON.stringify({'61':{zoom:1.8,focusX:24,focusY:-33,fit:'cover',displayName:'PRIVATE NAME TEST'}}));sessionStorage.setItem('seeded','1');}")
  studio=await context.new_page();studio.on('pageerror',lambda e:error('Studio',e))
  async def wait(page,expression):
   try:await page.wait_for_function(expression,timeout=45000)
   except Exception:
    await page.screenshot(path=str(OUT/'failure.png'))
    diagnostic={'url':page.url,'expression':expression,'pageErrors':errors,'text':await page.locator('body').inner_text()}
    (OUT/'failure.json').write_text(json.dumps(diagnostic,indent=2));print(json.dumps(diagnostic),flush=True);raise
  dialog=studio.locator('#odysseyPlacementDialog')
  async def status(text):
   await wait(studio,"document.querySelector('#odysseyPlacementDialog [data-status]')?.textContent.includes("+json.dumps(text)+")")
  await studio.goto(BASE+'/mtgtools/odyssey/',wait_until='domcontentloaded')
  await wait(studio,'!!window.OdysseyPlacementStudio')
  await studio.evaluate('selectCard(61)')
  assert await studio.evaluate('model(61).zoom')==1.8
  assert await studio.evaluate('OdysseyPlacementStudio.changes().some(d=>d.after.cardId==="ODY-061")')
  initial=await studio.evaluate('OdysseyPlacementStudio.changes().length')
  await studio.evaluate("(()=>{const m=model(61);m.rules+=' ';diffOverride(61,m)})()")
  assert await studio.evaluate('OdysseyPlacementStudio.changes().length')==initial,'Text created an extra placement'
  await studio.locator('#odysseyPlacementSync').click();await dialog.locator('[data-review]').click();await status('placements reviewed')
  await dialog.locator('[data-confirm]').check();await dialog.locator('[data-publish]').click();await status('Verified:')
  assert published['records']['ODY-061|front']['focusY']==-33
  assert not await studio.evaluate('OdysseyPlacementStudio.changes().length')
  await studio.screenshot(path=str(OUT/'studio-published.png'));await dialog.locator('[data-close]').click()
  public_context=await browser.new_context(viewport={'width':1440,'height':1050},reduced_motion='reduce')
  await public_context.route('**/api/art-placement',endpoint)
  await public_context.add_init_script("const native=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(String(k).startsWith('odyssey-'))throw Error('Private editor storage read: '+k);return native.call(this,k)}")
  scry=await public_context.new_page();scry.on('pageerror',lambda e:error('Scry',e))
  await scry.goto(BASE+'/mtgtools/Odyssey/scry/?view=cards#card-61',wait_until='domcontentloaded')
  await wait(scry,'window.OdysseyStudioRenderer?.engine?.model(61)?.zoom===1.8')
  assert await scry.evaluate('OdysseyStudioRenderer.engine.model(61).displayName')!='PRIVATE NAME TEST'
  async def geometry(page,expr):return await page.evaluate('(()=>{const m='+expr+';return Object.fromEntries('+json.dumps(FIELDS)+'.map(k=>[k,m[k]]))})()')
  assert await geometry(studio,'model(61)')==await geometry(scry,'OdysseyStudioRenderer.engine.model(61)')
  await wait(scry,'document.querySelector("#detailVisual odyssey-studio-card")?.shadowRoot.querySelector(".art-img")?.naturalWidth>0')
  await scry.screenshot(path=str(OUT/'scry-published-1440.png'))
  ratios=[]
  for width in [390,768,1440]:
   await scry.set_viewport_size({'width':width,'height':1000});await scry.wait_for_timeout(200)
   row=await scry.evaluate("(()=>{const c=document.querySelector('#detailVisual odyssey-studio-card'),i=c.shadowRoot.querySelector('.art-img');return{width:"+str(width)+",zoom:c.model.zoom,focusX:c.model.focusX,focusY:c.model.focusY,imageWidth:i.style.width,imageHeight:i.style.height,transform:i.style.transform}})()")
   assert row['zoom']==1.8 and row['focusY']==-33;ratios.append(row)
  assert all(r['imageWidth']==ratios[0]['imageWidth'] and r['transform']==ratios[0]['transform'] for r in ratios)
  await scry.set_viewport_size({'width':390,'height':900});await scry.screenshot(path=str(OUT/'scry-published-390.png'))
  await studio.evaluate("selected=61;setCropField('zoom',2.25)")
  assert await scry.evaluate('OdysseyStudioRenderer.engine.model(61).zoom')==1.8
  preview=await context.new_page();preview.on('pageerror',lambda e:error('Preview',e))
  await preview.goto(BASE+'/mtgtools/Odyssey/scry/?placementPreview=1&view=cards#card-61',wait_until='domcontentloaded')
  await wait(preview,'window.OdysseyStudioRenderer?.engine?.model(61)?.zoom===2.25')
  assert await preview.get_by_text('LOCAL ARTWORK PREVIEW',exact=False).count()==1
  live['ODY-061|front']['zoom']=3
  await studio.locator('#odysseyPlacementSync').click();await dialog.locator('[data-pull]').click();await status('conflicting local edits')
  assert await studio.evaluate('model(61).zoom')==2.25
  assert await dialog.locator('[data-conflicts] button').count()==2
  await dialog.get_by_role('button',name='Use Sheet placement',exact=True).click()
  assert await studio.evaluate('model(61).zoom')==3
  await dialog.locator('[data-confirm]').check();await dialog.locator('[data-refresh]').click();await status('now published')
  await scry.evaluate('OdysseyScryPlacement.refresh()')
  assert await scry.evaluate('OdysseyStudioRenderer.engine.model(61).zoom')==3
  assert await scry.evaluate('document.querySelector("#detailVisual odyssey-studio-card").model.zoom')==3,'Existing card did not refresh'
  await dialog.locator('[data-close]').click()
  await studio.evaluate("selected=61;document.getElementById('resetCrop').click()")
  reset=await studio.evaluate('OdysseyPlacementStudio.changes().find(d=>d.after.cardId==="ODY-061")')
  assert reset and reset['after']['zoom']==1 and reset['after']['focusX']==0 and reset['before']['zoom']==3
  await studio.reload(wait_until='domcontentloaded');await wait(studio,'window.OdysseyPlacementStudio')
  assert await studio.evaluate('model(61).zoom')==1
  assert await scry.evaluate("(()=>{const old=OdysseyScryPlacement.published,r=structuredClone(old);r.records['ODY-061|front'].artId='ART-001';OdysseyStudioRenderer.setPlacements(r);const rejected=OdysseyStudioRenderer.engine.model(61).zoom===1;OdysseyStudioRenderer.setPlacements(old);return rejected})()")
  all_cards=await scry.evaluate("(()=>{const engine=OdysseyStudioRenderer.engine,rows=OdysseyExhibition.catalogue.cards;return rows.map(c=>{try{return {number:c.number,ok:!!engine.node(c.number).el}}catch(e){return{number:c.number,error:e.message}}})})()")
  assert len(all_cards)==309 and all(r.get('ok') for r in all_cards)
  assert not errors,'\n'.join(errors)
  result={'status':'passed','realCards':309,'nativeStudioRenderer':True,'legacySavedCropMigrated':True,'studioSheetScryRoundtrip':True,'readOnlyVisitor':True,'unpublishedDraftIsolated':True,'explicitLocalPreview':True,'sheetConflictPreservesDraft':True,'useSheetThenPublish':True,'existingCardRerenders':True,'resetPersistsReload':True,'changedArtworkGuard':True,'responsiveGeometry':ratios,'pageErrors':errors,'googleBoundary':'mocked; server Google protocol separately tested; no real spreadsheet writes'}
  (OUT/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2),flush=True)
  await browser.close()
asyncio.run(main())
