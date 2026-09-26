"""Verify production artwork bytes and the live editor in fresh browser contexts.
No writes are made to any existing user workspace or card dataset.
"""
import concurrent.futures, hashlib, io, json, os, re, threading, time
from pathlib import Path
import requests
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];APP=ROOT/'public/mtgtools/odyssey'
OUT=Path('/tmp/odyssey-production-artwork');OUT.mkdir(parents=True,exist_ok=True)
BASE='https://kliawota.design';URL=BASE+'/mtgtools/odyssey/'
manifest=json.loads((APP/'data/artwork-manifest.json').read_text())
report={'commit':os.environ.get('GITHUB_SHA'),'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'summary':manifest['summary'],'errors':[]}
local=threading.local()
def sha(data):return hashlib.sha256(data).hexdigest()
def session():
 if not hasattr(local,'session'):local.session=requests.Session();local.session.headers.update({'User-Agent':'OdysseyProductionVerifier/1.0','Cache-Control':'no-cache'})
 return local.session

def wait_for_painted_art(page):
 page.wait_for_function("document.querySelector('#previewShell .art-img')?.complete && document.querySelector('#previewShell .art-img')?.naturalWidth>0",timeout=45000)
 return page.evaluate("""async () => {
  const img=document.querySelector('#previewShell .art-img');await img.decode();
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const box=img.closest('.artbox').getBoundingClientRect(),rect=img.getBoundingClientRect(),style=getComputedStyle(img);
  const overlap=Math.min(rect.right,box.right)>Math.max(rect.left,box.left)&&Math.min(rect.bottom,box.bottom)>Math.max(rect.top,box.top);
  if(!overlap||style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)throw Error('Artwork decoded but is not visible in its frame');
  return {width:img.naturalWidth,height:img.naturalHeight,visible:true};
 }""")
try:
 for attempt in range(60):
  try:
   r=session().get(URL+'app.html?verify='+str(report['commit']),timeout=15)
   if r.ok and sha(r.content)==sha((APP/'app.html').read_bytes()):break
  except requests.RequestException:pass
  time.sleep(5)
 else:raise RuntimeError('Production did not serve the new app within the deployment window')
 paths=['index.html','app.html','live-sheet-sync.js','artwork-delivery.js','artwork-tools.js','data/release.json','data/artwork-manifest.json','data/odyssey-data.js','data/odyssey-data.json','data/odyssey-analysis-candidate-v1.json']
 boot=re.search(r'/data/(artwork-delivery-manifest\.[a-f0-9]+\.js)',(APP/'app.html').read_text()).group(1);paths.append('data/'+boot)
 report['sourceFiles']=[]
 for file in paths:
  r=session().get(URL+file+'?verify='+str(report['commit']),timeout=30);r.raise_for_status()
  assert sha(r.content)==sha((APP/file).read_bytes()),'Live source mismatch: '+file
  report['sourceFiles'].append(file)
 assets=[]
 for row in manifest['artworks'].values():
  for kind in ['full','thumb']:
   if row.get(kind):assets.append({'id':row['id'],'kind':kind,**row[kind]})
 def verify(row):
  error=''
  for attempt in range(3):
   try:
    with session().get(BASE+row['url'],stream=True,timeout=(10,35)) as response:
     response.raise_for_status();assert response.headers.get('Content-Type','').startswith('image/'),'Not an image'
     digest=hashlib.sha256();size=0
     for block in response.iter_content(65536):digest.update(block);size+=len(block)
     assert size==row['bytes'],'Wrong image byte count'
     assert digest.hexdigest()==row['sha256'],'Image differs from browser-tested original'
     return {'id':row['id'],'kind':row['kind'],'ok':True,'bytes':size,'immutable':'immutable' in response.headers.get('Cache-Control','')}
   except Exception as e:error=str(e);time.sleep(attempt+1)
  return {'id':row['id'],'kind':row['kind'],'ok':False,'error':error}
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:report['assets']=list(pool.map(verify,assets))
 failed=[r for r in report['assets'] if not r['ok']];assert not failed,failed
 report['localImagesVerified']=sum(r['kind']=='full' for r in report['assets']);report['thumbnailsVerified']=sum(r['kind']=='thumb' for r in report['assets'])
 report['immutableAssets']=sum(r.get('immutable',False) for r in report['assets'])
 report['externalPreviews']=[];report['externalPreviewWarnings']=[]
 for id in manifest['summary']['externalPreviews']:
  row=manifest['artworks'][id];r=None
  for attempt in range(4):
   candidate=session().get(row['originalUrl'],timeout=30)
   if candidate.status_code!=429:
    candidate.raise_for_status();r=candidate;break
   if attempt<3:time.sleep(1.5*(attempt+1))
  if r is None:
   report['externalPreviewWarnings'].append({'id':id,'status':429,'note':'Provider rate-limited bulk audit; browser resolver remains independently tested.'})
   continue
  with Image.open(io.BytesIO(r.content)) as im:im.load();assert im.size==(row['width'],row['height'])
  report['externalPreviews'].append({'id':id,'verified':True,'width':row['width'],'height':row['height'],'printRestricted':True})
 report['viewports']={}
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for name,width,height in [('desktop',1440,1000),('mobile',390,844)]:
   context=browser.new_context(viewport={'width':width,'height':height});page=context.new_page();errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(URL,wait_until='domcontentloaded',timeout=60000)
   page.wait_for_function("typeof CARDS!=='undefined'&&CARDS.length===309&&typeof OdysseyArtDelivery!=='undefined'&&typeof OdysseySheetSync!=='undefined'",timeout=60000)
   runtime=page.evaluate("({version:ODYSSEY_DATASET.datasetVersion,cards:CARDS.length,artworks:ART.length,coverage:COVERAGE.length,newArt:ART.filter(a=>Number(String(a.id||'').replace('ART-',''))>553).length,assigned:CARDS.filter(c=>c.primaryArt).length})")
   assert runtime=={'version':'2026-09-26.2','cards':309,'artworks':581,'coverage':309,'newArt':28,'assigned':302},runtime
   initial=wait_for_painted_art(page)
   missing=page.evaluate("[...new Set(CARDS.map(c=>c.primaryArt).filter(Boolean))].filter(id=>!directArtUrl(id))")
   if missing:
    page.evaluate("""async ids => { for (const id of ids) { const art=artById[id]; if (!art) continue; try { await resolveArtUrl(art,false); } catch (_) {} } }""", missing)
   unresolved=page.evaluate("[...new Set(CARDS.map(c=>c.primaryArt).filter(Boolean))].filter(id=>!directArtUrl(id))")
   assert not unresolved, 'Unresolved default artworks: '+', '.join(unresolved)
   freshPaint={}
   for number,expected in [(12,'ART-578'),(67,'ART-554'),(117,'ART-564')]:
    page.evaluate("n=>selectCard(n)",number)
    page.wait_for_function("(id)=>model(selected).artId===id",arg=expected,timeout=10000)
    freshPaint[str(number)]={'artId':expected,**wait_for_painted_art(page)}
   report.setdefault('freshRuntimeArtwork',{})[name]=freshPaint
   page.evaluate("selectCard(1);applyArt('ART-432');setCropField('zoom',1.23);setCropField('focusX',43);setCropField('focusY',57)")
   page.wait_for_function("document.querySelector('#previewShell .art-img')?.naturalWidth===7195&&document.querySelector('#previewShell .art-img')?.src.includes('/assets/artwork/')",timeout=45000)
   wait_for_painted_art(page)
   saved=page.evaluate("({a:model(1).artId,z:model(1).zoom,x:model(1).focusX,y:model(1).focusY})")
   page.reload(wait_until='domcontentloaded');page.wait_for_function("typeof CARDS!=='undefined'&&CARDS.length===309",timeout=45000)
   page.evaluate('selectCard(1)')
   page.wait_for_function("document.querySelector('#previewShell .art-img')?.naturalWidth===7195",timeout=45000)
   painted=wait_for_painted_art(page)
   assert page.evaluate("({a:model(1).artId,z:model(1).zoom,x:model(1).focusX,y:model(1).focusY})")==saved
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
   page.screenshot(path=str(OUT/(name+'-live.png')),full_page=False)
   page.evaluate('openArtOptions(1)');page.locator('[data-art-search-scope="all"]').click();page.locator('#artOptionSearch').fill('odysseus');page.wait_for_timeout(250)
   assert page.locator('#artOptionsGrid [data-art-option]').count()>5
   page.screenshot(path=str(OUT/(name+'-artwork-live.png')),full_page=False)
   assert not errors,errors
   report['viewports'][name]={'cards':309,'defaultArtworksVerified':True,'artworkSelectionReloadPreserved':True,'cropReloadPreserved':True,'searchVerified':True,'paintedArtwork':painted,'pageErrors':errors}
   context.close()
  browser.close()
 report['passed']=True
except Exception as error:report['errors'].append(str(error));report['passed']=False
finally:
 (OUT/'production-artwork.json').write_text(json.dumps(report,indent=2))
 print(json.dumps({k:v for k,v in report.items() if k!='assets'},indent=2),flush=True)
 if not report['passed']:raise SystemExit(1)
