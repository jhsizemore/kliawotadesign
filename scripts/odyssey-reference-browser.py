import json,os,time
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('/tmp/odyssey-reference-cards/browser');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('AUDIT_URL','http://127.0.0.1:8787/mtgtools/odyssey/')
report={'url':BASE,'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'errors':[]}
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for name,width,height in [('desktop',1440,1000),('mobile',390,844)]:
   context=browser.new_context(viewport={'width':width,'height':height});page=context.new_page();errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(BASE,wait_until='domcontentloaded',timeout=60000)
   page.wait_for_function("window.OdysseyReferenceBrowserMounted && window.ODYSSEY_CARD_REFERENCES && Object.keys(window.ODYSSEY_CARD_REFERENCES.cards).length>0",timeout=45000)
   coverage=page.evaluate("""() => {
     const original=CARDS.filter(c=>String(c.originFull||'New').toLowerCase()==='new'&&String(c.origin||'').toUpperCase()!=='RPR');
     return {original:original.length,covered:original.filter(c=>OdysseyReferenceBrowser.refsFor(c.number).length>0).length,max:Math.max(...original.map(c=>OdysseyReferenceBrowser.refsFor(c.number).length)),min:Math.min(...original.map(c=>OdysseyReferenceBrowser.refsFor(c.number).length))};
   }""")
   assert coverage['original']==coverage['covered'] and 1<=coverage['min']<=coverage['max']<=3,coverage
   number=page.evaluate("""() => CARDS.find(c=>OdysseyReferenceBrowser.refsFor(c.number).length>=2)?.number""")
   assert number
   page.evaluate('(n)=>selectCard(n)',number)
   page.wait_for_timeout(100)
   count=page.evaluate('OdysseyReferenceBrowser.refsFor(selected).length')
   assert page.locator('#openCardReferences').is_enabled()
   assert page.locator('#odCardReferences .od-ref-card').count()==count
   page.locator('#openCardReferences').click()
   page.wait_for_selector('#odReferenceOverlay.open')
   assert page.locator('#odReferenceOverlay .od-ref-card').count()==count
   assert page.locator('#odReferenceOverlay a[href^="https://scryfall.com/card/"]').count()==count
   for i in range(count):
    img=page.locator('#odReferenceOverlay .od-ref-card img').nth(i)
    img.scroll_into_view_if_needed()
    page.wait_for_function("(i)=>{const x=document.querySelectorAll('#odReferenceOverlay .od-ref-card img')[i];return x&&x.complete&&x.naturalWidth>0}",i,timeout=30000)
   annotations=page.locator('#odReferenceOverlay .od-ref-card p').all_inner_texts()
   assert all(len(x)>20 for x in annotations)
   current_id=page.evaluate('baseCard(selected).id')
   page.locator('[data-ref-mark]').click()
   page.wait_for_timeout(100)
   assert page.evaluate('(id)=>!!JSON.parse(localStorage.getItem("odyssey-reference-review-v1")||"{}")[id]',current_id)
   page.screenshot(path=str(OUT/(name+'-references.png')),full_page=False)
   page.reload(wait_until='domcontentloaded')
   page.wait_for_function("window.OdysseyReferenceBrowserMounted",timeout=45000)
   assert page.evaluate('(id)=>!!JSON.parse(localStorage.getItem("odyssey-reference-review-v1")||"{}")[id]',current_id)
   assert not errors,errors
   report[name]={'coverage':coverage,'sampleNumber':number,'sampleReferences':count,'imagesDecoded':count,'annotationsVisible':True,'scryfallLinks':count,'reviewPersists':True,'pageErrors':errors}
   context.close()
  browser.close()
 report['passed']=True
except Exception as e:
 report['errors'].append(str(e));report['passed']=False
finally:
 (OUT/'browser-audit.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
 if not report['passed']:raise SystemExit(1)
