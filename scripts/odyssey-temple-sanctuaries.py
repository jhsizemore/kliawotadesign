#!/usr/bin/env python3
"""Import the user-selected temple artworks, preserving the existing 309-card skeleton."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote
from html import escape
import hashlib, io, json, re, subprocess, time, requests
from PIL import Image, ImageOps, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
PUB=ROOT/'public/mtgtools/odyssey'
OUT=ROOT/'temple-sanctuary-report';OUT.mkdir(exist_ok=True)
ASSETS=PUB/'assets/sanctuaries';ASSETS.mkdir(parents=True,exist_ok=True)
MANIFEST=json.loads((ROOT/'scripts/data/odyssey-temple-sanctuaries.20260929.json').read_text())
VERSION=MANIFEST['version']; selections=MANIFEST['selections']
assert len(selections)==10 and len({s['pair'] for s in selections})==10
Image.MAX_IMAGE_PIXELS=120_000_000
HEADERS={'User-Agent':'OdysseyArtLibrary/1.0 (public-domain source verification; https://kliawota.design/)'}

def request(url):
    r=requests.get(url,headers=HEADERS,timeout=(15,60));r.raise_for_status()
    if len(r.content)>110_000_000:raise ValueError('Image exceeds acquisition limit')
    return r

def acquire(s):
    urls=[];fn=s.get('commonsFile')
    if fn:
        name=fn.replace(' ','_');h=hashlib.md5(name.encode()).hexdigest();encoded=quote(name,safe='(),_-\'.')
        original='https://upload.wikimedia.org/wikipedia/commons/'+h[0]+'/'+h[:2]+'/'+encoded
        urls.append(original)
    urls+=s.get('fallbacks',[])
    errors=[];im=None;used=''
    for url in urls:
        try:
            response=request(url);im=ImageOps.exif_transpose(Image.open(io.BytesIO(response.content)));im.load()
            if min(im.size)<500:raise ValueError('Image too small: '+str(im.size))
            used=response.url;break
        except Exception as e:errors.append(str(e)[:240]);im=None
    if im is None and s.get('metObjectId'):
        try:
            meta=request('https://collectionapi.metmuseum.org/public/collection/v1/objects/'+str(s['metObjectId'])).json()
            url=meta['primaryImage'];response=request(url);im=ImageOps.exif_transpose(Image.open(io.BytesIO(response.content)));im.load();used=response.url
        except Exception as e:errors.append(str(e)[:240]);im=None
    if im is None and fn:
        try:
            api='https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles='+quote('File:'+fn)
            pages=request(api).json()['query']['pages'];url=next(p['imageinfo'][0]['url'] for p in pages.values() if p.get('imageinfo'))
            response=request(url);im=ImageOps.exif_transpose(Image.open(io.BytesIO(response.content)));im.load();used=response.url
        except Exception as e:errors.append(str(e)[:240]);im=None
    if im is None:
        try:
            text=request(s['source']).text
            candidates=re.findall(r'<meta[^>]+(?:property|name)=[\"\'](?:og:image|twitter:image)[\"\'][^>]+content=[\"\']([^\"\']+)',text,re.I)
            for url in candidates:
                try:
                    response=request(url.replace('&amp;','&'));im=ImageOps.exif_transpose(Image.open(io.BytesIO(response.content)));im.load()
                    if min(im.size)<500:raise ValueError('Only a small site thumbnail available')
                    used=response.url;break
                except Exception as e:errors.append(str(e)[:240]);im=None
        except Exception as e:errors.append(str(e)[:240])
    if im is None:return {'id':s['id'],'ok':False,'errors':errors}
    im=im.convert('RGB');w,h=im.size
    full=ASSETS/(s['id']+'.sanctuary-v1.full.webp');im.save(full,'WEBP',quality=95,method=4)
    preview=im.copy();preview.thumbnail((2800,2800),Image.Resampling.LANCZOS)
    path=ASSETS/(s['id']+'.sanctuary-v1.jpg');preview.save(path,'JPEG',quality=94,optimize=True)
    return {'id':s['id'],'ok':True,'width':preview.width,'height':preview.height,'sourceWidth':w,'sourceHeight':h,'sourceImageUrl':used,'imageUrl':'https://kliawota.design/mtgtools/odyssey/assets/sanctuaries/'+path.name,'fullImageUrl':'https://kliawota.design/mtgtools/odyssey/assets/sanctuaries/'+full.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'errors':errors}

results=list(ThreadPoolExecutor(max_workers=3).map(acquire,selections))
(OUT/'acquisition.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print(json.dumps(results,ensure_ascii=False,indent=2),flush=True)
if not all(r['ok'] for r in results):raise SystemExit('Some selected images could not be acquired; no card integration was published.')
images={r['id']:r for r in results};artworks=[];designs=[]
for s in selections:
    r=images[s['id']]
    tags='; '.join(['templecycle20260929','sanctuary','temple','landscape',s['god'],s['pair'],'cast.'+s['god'].lower()])
    slot='Main #'+str(s['number']) if s['number'] else 'Reserve candidate — no main slot'
    note=s['cropNotes']+' User-selected artwork for '+s['displayName']+'. Image acquired and decoded; final crop and print proof remain editable.'
    a={k:s[k] for k in ['id','title','artist','date','period','medium','institution','objectId','rights','source','credit','matchType']}
    a.update(subjects=tags,tags=tags,heroScore='',candidateCards=s['displayName']+' / '+s['underlyingName']+' / '+slot,cropNotes=note,status='CURATED',imageUrl=r['imageUrl'],imageWidth=r['width'],imageHeight=r['height'],imageChecked='2026-09-29',originalImageUrl=r['sourceImageUrl'],originalImageWidth=r['sourceWidth'],originalImageHeight=r['sourceHeight'],fullImageUrl=r['fullImageUrl'],sanctuaryGod=s['god'],sanctuaryPair=s['pair'],acquisitionStatus='Image acquired; user-selected; crop editable')
    artworks.append(a)
    band='Odyssey Book X; later visual reception' if s['god']=='Circe' else 'Greek divine sanctuary / wider Homeric world; later visual reception'
    story='Sanctuary of '+s['god']+' represented by '+s['title']+'. '+s['cropNotes']
    pair=s['pair'];rules='This land enters tapped.\nWhen this land enters, scry 1.\n{T}: Add {'+pair[0]+'} or {'+pair[1]+'}.'
    designs.append({'id':'ODY-'+str(s['number']).zfill(3) if s['number'] else 'ODY-TEMPLE-'+pair,'number':s['number'],'god':s['god'],'pair':pair,'displayName':s['displayName'],'name':s['underlyingName'],'underlyingName':s['underlyingName'],'type':'Land','rarity':'R','origin':'RPR','mana':'','mv':0,'color':pair,'frame':'L','layout':'standard','rules':rules,'primaryArt':s['id'],'credit':s['credit'],'source':s['source'],'imageUrl':r['imageUrl'],'status':'MAIN' if s['number'] else 'CANDIDATE — no main slot','previousDisplayName':s.get('previousDisplayName',''),'previousArt':s.get('previousArt',''),'story':story,'sourceBand':band,'rationale':s['matchType']+'. '+s['cropNotes'],'matchLayer':'1 — Direct / iconic' if s['god'] in ['Athena','Poseidon','Circe','Zeus','Helios'] else '3 — Evocative / abstract'})
payload={'version':VERSION,'generatedAt':'2026-09-29','artworks':artworks,'designs':designs,'summary':{'newArtworks':10,'mainAssignments':5,'reserveCandidates':5,'mainCards':309,'rulesChanged':0,'finalCropsLocked':0}}
raw=json.dumps(payload,ensure_ascii=False,indent=2)
(PUB/'data/temple-sanctuaries.20260929.json').write_text(raw)
(PUB/'data/temple-sanctuaries.20260929.js').write_text('window.ODYSSEY_TEMPLE_SANCTUARIES = '+raw.replace('</','<\\/')+';\n')
(OUT/'records.json').write_text(raw)
# Add scripts after the existing landscape merge; they also wrap any subsequent sheet reapply.
app=PUB/'app.html';text=app.read_text()
if 'src="temple-sanctuaries.js' not in text:
    pattern=r'(<script\b[^>]*src=[\"\'][^\"\']*landscape-library\.js[^\"\']*[\"\'][^>]*>\s*</script>)'
    insertion='\n<script src="data/temple-sanctuaries.20260929.js?v=sanctuaries1"></script>\n<script src="temple-sanctuaries.js?v=sanctuaries1"></script>'
    text,n=re.subn(pattern,lambda m:m.group(0)+insertion,text,count=1)
    assert n==1,'Studio landscape script insertion point missing'
    app.write_text(text)
# This gallery keeps the five unallocated designs out of the 309-card main list.
blocks=[]
for d in designs:
    a=artworks[designs.index(d)];src='assets/sanctuaries/'+a['id']+'.sanctuary-v1.jpg'
    blocks.append('<article id="'+d['pair']+'"><div class="eyebrow">'+escape(d['pair']+' · '+d['god']+' · '+d['status'])+'</div><h2>'+escape(d['displayName'])+'</h2><p class="oracle">'+escape(d['underlyingName'])+'</p><a href="'+escape(a['fullImageUrl'],quote=True)+'"><img src="'+src+'" alt="'+escape(a['title'],quote=True)+'" loading="lazy"></a><div class="rules">'+escape(d['rules']).replace('\n','<br>')+'</div><h3>'+escape(a['title'])+'</h3><p>'+escape(a['artist']+' · '+a['date']+' · '+a['institution'])+'</p><p class="note">'+escape(a['cropNotes'])+'</p><p><a href="'+escape(a['source'],quote=True)+'">Original source and provenance</a> · '+escape(a['id'])+'</p></article>')
html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Odyssey · Ten Temple Sanctuaries</title><style>body{margin:0;background:#131812;color:#eeeadc;font:16px/1.5 system-ui}header,main,footer{max-width:1400px;margin:auto;padding:32px}h1,h2,h3{font-family:Georgia,serif}h1{font-size:48px;margin:.2em 0}h2{font-size:29px;margin:.2em 0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px}article{padding:24px;background:#22271f;border:1px solid #464c3a;border-radius:12px}img{width:100%;height:300px;object-fit:contain;background:#0d100d}.eyebrow,.oracle{color:#c3b88f;font-size:13px}.rules{padding:18px;margin-top:16px;background:#eee8d5;color:#29271c;font-family:Georgia,serif;border-radius:6px}.note{font-size:14px;color:#bfc5b5}a{color:#ddc283}footer{font-size:13px}@media(max-width:800px){.grid{grid-template-columns:1fr}header,main,footer{padding:18px}h1{font-size:36px}}</style><header><p class="eyebrow">THE ODYSSEY · SANCTUARY CYCLE · 29 SEPTEMBER 2026</p><h1>Ten gods. Ten sacred places.</h1><p>Every design enters tapped, scries 1 on entry, and taps for either colour in its pair.</p><p>Five enemy-pair temples are assigned in the 309-card main set. Five allied-pair temples are fully linked reserve candidates, not additional main cards. Artwork is selected; final crops remain editable.</p><p><a href="app.html">Open Odyssey Studio</a> · <a href="https://docs.google.com/spreadsheets/d/1YyWqX2dwrtnSEtrbTKVxdQaDSaY_tlcxZgMp_-DyA6o/edit">Artwork Library</a></p></header><main class="grid">'''+''.join(blocks)+'''</main><footer>Original artwork titles and real-world subjects are retained separately from the mythic temple identities. Five existing Adventure lands, all other main cards, prior artwork and saved user edits are untouched.</footer></html>'''
(PUB/'temple-sanctuaries.html').write_text(html)
# Integration test uses the production data pipeline, not a mock set.
js=r'''const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');const base='public/mtgtools/odyssey/';const c={console};c.window=c;c.globalThis=c;vm.createContext(c);for(const f of ['data/odyssey-data.js','live-sheet-sync.js','live-sheet-art-patch.js','data/landscape-import.20260929.js','landscape-library.js'])vm.runInContext(fs.readFileSync(base+f,'utf8'),c);const before=JSON.parse(JSON.stringify(c.ODYSSEY_DATA));for(const f of ['data/temple-sanctuaries.20260929.js','temple-sanctuaries.js'])vm.runInContext(fs.readFileSync(base+f,'utf8'),c);const after=JSON.parse(JSON.stringify(c.ODYSSEY_DATA));const ids=new Set([72,193,194,195,196]);assert.equal(before.cards.length,309);assert.equal(after.cards.length,309);assert.equal(after.artworks.length,before.artworks.length+10);assert.equal(new Set(after.artworks.map(a=>a.id)).size,after.artworks.length);for(const old of before.cards){const now=after.cards.find(c=>c.number===old.number);for(const key of ['id','number','name','underlyingName','mana','mv','color','type','pt','rarity','rules'])assert.deepEqual(now[key],old[key],key+' changed for '+old.number);if(!ids.has(old.number))assert.deepEqual(now,old,'Non-temple changed: '+old.number);}for(const old of before.artworks)assert.deepEqual(after.artworks.find(a=>a.id===old.id),old,'Existing art changed: '+old.id);for(const old of before.coverage)if(!ids.has(old.number))assert.deepEqual(after.coverage.find(a=>a.number===old.number),old);assert.equal(after.templeSanctuaries.length,10);assert.equal(after.templeSanctuaries.filter(d=>!d.number).length,5);assert.equal(JSON.stringify(c.OdysseyTempleSanctuaries.apply(c.ODYSSEY_DATA)),JSON.stringify(c.ODYSSEY_DATA),'Not idempotent');const reapplied=c.OdysseySheetSync.apply(c.ODYSSEY_DATA);for(const d of after.templeSanctuaries.filter(d=>d.number))assert.equal(reapplied.cards.find(a=>a.number===d.number).primaryArt,d.primaryArt);fs.writeFileSync('temple-sanctuary-report/previous-main-cards.json',JSON.stringify(before.cards.filter(c=>ids.has(c.number)),null,2));console.log(JSON.stringify({beforeArtworks:before.artworks.length,afterArtworks:after.artworks.length,cards:309,mainAssignments:5,reserveCandidates:5,unrelatedCardsUnchanged:304,existingArtworkUnchanged:before.artworks.length,rulesChanged:0,idempotent:true}));'''
test=subprocess.run(['node','-e',js],check=True,capture_output=True,text=True)
(OUT/'integration-test.json').write_text(test.stdout);print(test.stdout)
# Compact visual proof of the acquired originals; no speculative crop is committed.
sheet=Image.new('RGB',(1600,1500),'#eee8d7');draw=ImageDraw.Draw(sheet)
for i,s in enumerate(selections):
    im=Image.open(ASSETS/(s['id']+'.sanctuary-v1.jpg'));im.thumbnail((740,245))
    x=(i%2)*800+25;y=(i//2)*300+35;sheet.paste(im,(x,y));draw.text((x,y-23),s['pair']+' '+s['god']+' | '+s['id'],fill='#161d16')
sheet.save(OUT/'contact-sheet.jpg',quality=93)
print('Published files prepared; tests passed. All ten downloaded images decoded.',flush=True)
