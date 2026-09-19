"""Real Chromium smoke, full-image decoding and save/reload audit on a permitted browser host."""
import json, os, time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'public/mtgtools/odyssey'
OUT=Path(os.environ.get('AUDIT_OUT','/tmp/odyssey-browser-audit'));OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('AUDIT_URL','http://127.0.0.1:8787/mtgtools/odyssey/')
manifest=json.loads((APP/'data/artwork-manifest.json').read_text())
report={'url':BASE,'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'viewports':{},'images':[],'errors':[]}
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for name,width,height in [('desktop',1440,1000),('mobile',390,844)]:
   context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1)
   page=context.new_page();errors=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   started=time.perf_counter()
   page.goto(BASE,wait_until='domcontentloaded',timeout=60000)
   page.wait_for_function("typeof CARDS!=='undefined' && CARDS.length===309 && typeof OdysseyArtDelivery!=='undefined'",timeout=60000)
   page.wait_for_function("document.querySelector('#previewShell .art-img')?.naturalWidth>0",timeout=45000)
   ready=round((time.perf_counter()-started)*1000)
   assert page.evaluate('ART.length')==450
   page.evaluate("selectCard(1);setCropField('zoom',1.23);setCropField('focusX',43);setCropField('focusY',57)")
   expected=page.evaluate("({zoom:model(1).zoom,x:model(1).focusX,y:model(1).focusY,art:model(1).artId,rules:model(1).rules})")
   page.reload(wait_until='domcontentloaded')
   page.wait_for_function("typeof CARDS!=='undefined' && CARDS.length===309",timeout=45000)
   actual=page.evaluate("({zoom:model(1).zoom,x:model(1).focusX,y:model(1).focusY,art:model(1).artId,rules:model(1).rules})")
   assert actual==expected,(name,'crop changed after reload',expected,actual)
   page.evaluate('selectCard(1)')
   page.wait_for_function("document.querySelector('#previewShell .art-img')?.naturalWidth>0",timeout=45000)
   page.screenshot(path=str(OUT/(name+'-studio.png')),full_page=False)
   page.evaluate("setCropField('zoom',20)")
   page.wait_for_function("document.querySelector('#previewShell .artbox')?.classList.contains('dpi-below-minimum')",timeout=15000)
   page.evaluate("setCropField('zoom',1.23)")
   frames=page.evaluate("Object.values(CARDS.reduce((m,c)=>(m[c.layout||'standard']??=c.number,m),{}))")
   for number in frames:
    page.evaluate('(n)=>selectCard(n)',number)
    page.wait_for_timeout(80)
    assert page.locator('#previewShell .render-card').count()==1
   page.evaluate("selectCard(1);applyArt('ART-432');setCropField('zoom',1.23);setCropField('focusX',43);setCropField('focusY',57)")
   page.wait_for_function("document.querySelector('#previewShell .art-img')?.naturalWidth===7195 && document.querySelector('#previewShell .art-img')?.src.includes('/assets/artwork/')",timeout=45000)
   chosen=page.evaluate("({zoom:model(1).zoom,x:model(1).focusX,y:model(1).focusY,art:model(1).artId})")
   page.reload(wait_until='domcontentloaded')
   page.wait_for_function("typeof CARDS!=='undefined' && CARDS.length===309",timeout=45000)
   page.evaluate('selectCard(1)')
   page.wait_for_function("document.querySelector('#previewShell .art-img')?.naturalWidth===7195 && document.querySelector('#previewShell .art-img')?.src.includes('/assets/artwork/')",timeout=45000)
   assert page.evaluate("({zoom:model(1).zoom,x:model(1).focusX,y:model(1).focusY,art:model(1).artId})")==chosen
   assert page.evaluate("model(1).artId")== 'ART-432'
   if name=='desktop':
    assert page.evaluate("document.querySelector('.topbar .topstats').getBoundingClientRect().bottom <= document.querySelector('.topbar').getBoundingClientRect().bottom"), 'Desktop status badges overlap card browser'
   page.screenshot(path=str(OUT/(name+'-studio.png')),full_page=False)
   page.evaluate('selectCard(1);openArtOptions(1)')
   page.wait_for_selector('#artOptionsGrid [data-art-option]',timeout=10000)
   page.locator('[data-art-search-scope="all"]').click()
   page.locator('#artOptionSearch').fill('odysseus')
   page.wait_for_timeout(250)
   found=page.locator('#artOptionsGrid [data-art-option]').count();assert found>5,found
   page.screenshot(path=str(OUT/(name+'-artwork.png')),full_page=False)
   page.evaluate('closeArtOptions()')
   timings=page.evaluate("""() => {let a=performance.now();for(let i=0;i<20;i++)qualityCounts();let quality=(performance.now()-a)/20;a=performance.now();for(const art of ART)candidateUseCount(art.id);return {qualityScanMs:quality,allUseBadgesMs:performance.now()-a,documentWidth:document.documentElement.scrollWidth,viewport:innerWidth};}""")
   assert timings['documentWidth']<=width+2,(name,'horizontal overflow',timings)
   assert not errors,errors
   report['viewports'][name]={'readyMs':ready,'searchMatches':found,'cropReloadPreserved':True,'selectedArtworkReloadVerified':True,'dpiWarningVerified':True,'frameFamilies':len(frames),'measurements':timings,'pageErrors':errors}
   if name=='desktop':
    images=[]
    for id,row in manifest['artworks'].items():
     if row['status']!='verified':continue
     images.append({'id':id,'url':row.get('full',{}).get('url') or row['originalUrl'],'width':row.get('full',{}).get('width') or row['width'],'height':row.get('full',{}).get('height') or row['height'],'kind':'full'})
     if row.get('thumb'):images.append({'id':id,'url':row['thumb']['url'],'width':row['thumb']['width'],'height':row['thumb']['height'],'kind':'thumb'})
    report['images']=page.evaluate("""async rows => {
      let next=0;const results=[];
      async function work(){while(next<rows.length){const row=rows[next++],img=new Image();img.decoding='async';img.referrerPolicy='no-referrer';let timer;try{await new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),25000);img.onload=resolve;img.onerror=()=>reject(Error('decode failed'));img.src=row.url;});await img.decode();results.push({...row,ok:img.naturalWidth===row.width&&img.naturalHeight===row.height,actualWidth:img.naturalWidth,actualHeight:img.naturalHeight});}catch(e){results.push({...row,ok:false,error:String(e)});}finally{clearTimeout(timer);img.onload=img.onerror=null;img.src='';}}}
      await Promise.all(Array.from({length:3},()=>work()));return results;
    }""",images)
    report['imageFailures']=[r for r in report['images'] if not r['ok']]
    assert not report['imageFailures'],report['imageFailures']
    primaries=page.evaluate("CARDS.map(c=>{const a=artById[c.primaryArt];return {id:c.id,art:c.primaryArt,verified:!!OdysseyArtDelivery.full(a)}})")
    assert all(c['verified'] for c in primaries),[c for c in primaries if not c['verified']]
    report['cardAssignmentsVerified']=len(primaries)
   context.close()
  browser.close()
 report['passed']=True
except Exception as error:
 report['errors'].append(str(error));report['passed']=False
finally:
 report['fullImagesDecoded']=sum(r['kind']=='full' and r['ok'] for r in report['images'])
 report['thumbnailsDecoded']=sum(r['kind']=='thumb' and r['ok'] for r in report['images'])
 (OUT/'browser-audit.json').write_text(json.dumps(report,indent=2))
 print(json.dumps({k:v for k,v in report.items() if k!='images'},indent=2),flush=True)
 if not report['passed']:raise SystemExit(1)
