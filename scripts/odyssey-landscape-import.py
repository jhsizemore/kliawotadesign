#!/usr/bin/env python3
"""Acquire the approved Odyssey landscape collections for review, without changing cards.
Network failures and rights uncertainty remain explicit. No source text is executable.
"""
import concurrent.futures as cf
import hashlib, io, json, os, re, shutil, time
from pathlib import Path
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageOps, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'landscape-import-output'
OUT.mkdir(exist_ok=True)
(OUT/'images').mkdir(exist_ok=True)
(OUT/'html').mkdir(exist_ok=True)
S=requests.Session()
S.headers.update({'User-Agent':'Odyssey-Art-Catalogue/1.0 (historical landscape research; bounded requests)'})
ERRORS=[]
RECORDS=[]
SEEN=set()

def get(url, binary=False):
    key=hashlib.sha256(url.encode()).hexdigest()
    cache=OUT/'html'/key
    if cache.exists() and not binary:return cache.read_text()
    r=S.get(url,timeout=(12,30));r.raise_for_status()
    if binary:
        if len(r.content)>35000000:raise ValueError('Image exceeds 35 MB review limit')
        return r.content
    text=r.text;cache.write_text(text);return text

def soup(url):return BeautifulSoup(get(url),'html.parser')
def text(el):return re.sub(r'\s+',' ',el.get_text(' ',strip=True)) if el else ''
def clean_title(t):return re.sub(r'\s+',' ',t).strip()
def record(group,url,title,artist='',date='',medium='',institution='',rights='YELLOW — image reuse terms not verified',image='',extra=None):
    url=url.split('#')[0]
    if url in SEEN:return
    SEEN.add(url)
    r=dict(collection=group,source=url,title=clean_title(title),artist=artist,date=date,medium=medium,institution=institution,rights=rights,imageUrl=image,status='RESEARCH',visualReview='Pending',downloadStatus='Pending',width=0,height=0)
    if extra:r.update(extra)
    RECORDS.append(r);return r

def image_candidates(doc,url):
    candidates=[]
    for m in doc.select('meta[property="og:image"],meta[name="twitter:image"]'):
        if m.get('content'):candidates.append(urljoin(url,m['content']))
    for a in doc.select('a[href]'):
        h=a.get('href','')
        if re.search(r'\.(jpg|jpeg|png|webp)(?:\?|$)',h,re.I) and not re.search(r'logo|icon|banner|sprite',h,re.I):candidates.append(urljoin(url,h))
    for im in doc.select('img'):
        h=im.get('data-src') or im.get('src') or ''
        if h and not re.search(r'logo|icon|banner|sprite|flag|loading|spacer|footer',h,re.I):candidates.append(urljoin(url,h))
    return list(dict.fromkeys(candidates))

def travel_collection(cid,group,artist,date):
    url=f'https://eng.travelogues.gr/collection.php?view={cid}'
    doc=soup(url);links={}
    for a in doc.select('a[href*="item.php?view="]'):
        title=text(a)
        if title:links[urljoin(url,a['href'])]=title
    for u,t in links.items():
        # Preserve collection review coverage, but exclude non-landscape material from art import.
        if re.search(r'^(map|title page(?!.*view)|relief and capital)|dinner at|dance of the dervishes|gathering of devout|bazaar of|procession|festival|street of|agios markos square|plan of|coins of',t,re.I):
            ERRORS.append({'collection':group,'source':u,'excluded':t,'reason':'Non-landscape or later social/architectural scene'});continue
        record(group,u,t,artist,date,'Published landscape print','Aikaterini Laskaridis Foundation / Travelogues',extra={'collectionSource':url,'period':'19th century','notes':'Historical landscape, not a Bronze Age reconstruction. Review later buildings, clothing and vegetation. Source digitisation rights unresolved.'})
    print(group,len(links),'indexed',flush=True)

for args in [(4,'Lear — Ionian Islands','Edward Lear','1863; digitised 1979 facsimile'),(315,'Dodwell — Views in Greece','After Edward Dodwell','1819'),(238,'Gell — Troy','William Gell','1804'),(39,'Gell — Ithaca','William Gell','1807')]:
    try:travel_collection(*args)
    except Exception as e:ERRORS.append({'collection':args[1],'error':str(e)})

# Cartwright: discover the actual portfolio identifier from its known item, not an invented URL.
try:
    u='https://eng.travelogues.gr/item.php?view=53950';d=soup(u)
    link=next((a['href'] for a in d.select('a[href*="collection.php?view="]') if 'CARTWRIGHT' in text(a).upper()),None)
    if not link:link=next((a['href'] for a in d.select('a[href*="collection.php?view="]')),None)
    if link:travel_collection(re.search(r'view=(\d+)',link)[1],'Cartwright — Ionian portfolio','Robert Havell, after Joseph Cartwright','1821')
    else:raise ValueError('Cartwright collection link not found')
except Exception as e:ERRORS.append({'collection':'Cartwright — Ionian portfolio','error':str(e)})

# This exhibition is bounded. Import Mediterranean and natural-environment studies, not unrelated city architecture.
try:
    base='https://www.fondationcustodia.fr/True-to-Nature-Open-air-Painting-in-Europe-1780-1870'
    d=soup(base);links={}
    for a in d.select('a[href]'):
        h=urljoin(base,a['href']);name=text(a)
        if re.search(r'/(?:\d+)-[A-Za-z]',h) and 'fondationcustodia.fr' in h:links[h]=name
    for u,t in links.items():record('True to Nature',u,t or 'Exhibition object — metadata pending',institution='Fondation Custodia exhibition catalogue',extra={'collectionSource':base,'exhibitionCandidate':True})
    print('True to Nature',len(links),'objects',flush=True)
except Exception as e:ERRORS.append({'collection':'True to Nature','error':str(e)})

MUSEUM=[
('Italian museum landscapes','https://www.nga.gov/artworks/206659-monte-circello','Monte Circello','Ludwig Richter','1831','ART-617'),
('Italian museum landscapes','https://www.clevelandart.org/art/1961.228','Natural Bridge, Sorrento','William Stanley Haseltine','1856','ART-618'),
('Italian museum landscapes','https://www.metmuseum.org/art/collection/search/341211','A Glen in Sorrento','Thomas Hartley Cromek','','ART-619'),
('Italian museum landscapes','https://www.metmuseum.org/art/collection/search/664666','A Grotto near Sorrento, with a Distant View of the Vesuvius','Heinrich Reinhold','1823','ART-620'),
('Italian museum landscapes','https://www.nga.gov/artworks/164353-cliffs-overhanging-river-gorge-near-sorrento-recto','Cliffs Overhanging a River Gorge near Sorrento (recto)','Johann Joachim Faber','1823','ART-621'),
('Italian museum landscapes','https://www.nga.gov/artworks/134224-sorrento','Sorrento','François-Édouard Bertin','','ART-622'),
('Italian museum landscapes','https://www.nga.gov/artworks/40227-sorrento','Sorrento','Hans Thoma','1909',''),
('Italian museum landscapes','https://www.nga.gov/artworks/211521-view-through-temple-venus-baia','View through the Temple of Venus, Baia','Giacinto Gigante','',''),
('Kellogg — Egypt','https://americanart.si.edu/artwork/nile-37229','Nile','Miner Kilbourne Kellogg','','ART-623'),
('Kellogg — Egypt','https://americanart.si.edu/artwork/nile-37232','Nile','Miner Kilbourne Kellogg','','ART-624'),
('Kellogg — Egypt','https://americanart.si.edu/artwork/luxor-37359','Luxor','Miner Kilbourne Kellogg','',''),
('Cole — Etna and volcanic landscapes','https://collections.lacma.org/object/33451','Distant View of Mount Etna','Thomas Cole','1842',''),
('Cole — Etna and volcanic landscapes','https://artsandculture.google.com/asset/view-of-mount-etna/jAH22wo0eNVVbA','View of Mount Etna','Thomas Cole','1842',''),
('Cole — Etna and volcanic landscapes','https://www.artsbma.org/happy-birthday-thomas-cole/','View of Mount Etna','Thomas Cole','c. 1842',''),
('Lear — original drawings','https://www.metmuseum.org/art/collection/search/355390','Mount Olympus from Larissa, Thessaly, Greece','Edward Lear','1850–85','ART-546'),
('Lear — original drawings','https://emuseum.toledomuseum.org/objects/49104/canea-crete','Canea, Crete','Edward Lear','1864',''),
('Lear — original drawings','https://artsandculture.google.com/asset/gozo-near-malta-edward-lear-1812%E2%80%931888-british/dQFPtVxR00tX4g','Gozo, near Malta','Edward Lear','1866','')]
for group,u,t,a,dt,eid in MUSEUM:record(group,u,t,a,dt,extra={'existingId':eid} if eid else None)

# Known primary IIIF identifiers. Explore the archival finding aid only for Mediterranean locations.
try:
    finding='https://hollisarchives.lib.harvard.edu/catalog/hou01475'
    d=soup(finding)
    mediterranean=re.compile(r'Greece|Greek|Corfu|Ithaca|Acheron|Suli|Souli|Crete|Olympus|Sparta|Epirus|Calabria|Sicil|Messina|Scilla|Gaeta|Malta|Gozo|Sorrento|Naples|Cythera|Lefk|Zante|Cephal|Pylos|Navarino|Delphi|Parnass|Sounion|Troy|Troad|Mytilene|Lemnos|Skyros|Dodona|Elis|Cyprus|Sidon|Gibraltar',re.I)
    for a in d.select('a[href]'):
        h=urljoin(finding,a['href']);context=text(a.parent)
        if ('iiif.lib.harvard.edu' in h or 'nrs.harvard.edu' in h) and mediterranean.search(context):
            record('Harvard — Lear Mediterranean',h,context[:350],'Edward Lear',institution='Houghton Library, Harvard University',extra={'collectionSource':finding})
except Exception as e:ERRORS.append({'collection':'Harvard — Lear Mediterranean','source':finding,'error':str(e),'scope':'Full Mediterranean finding-aid sweep remains blocked if this read fails.'})
for iid,t in [('28324351','Acheron (Gorge of Suli)'),('28324352','Acheron (Suli)')]:
    record('Harvard — Lear Mediterranean',f'https://iiif.lib.harvard.edu/manifests/ids:{iid}',t,'Edward Lear',institution='Houghton Library, Harvard University',extra={'isIIIF':True})

GEO=re.compile(r'Italy|Italian|Rome|Roman|Naples|Neapol|Napoli|Sorrento|Capri|Sicil|Etna|Stromboli|Vesuvi|Circe|Greece|Greek|Corfu|Ithaca|Olympus|Parnass|Delphi|Egypt|Nile|Luxor|Gozo|Malta|Gaeta|Baia|Tivoli|Subiaco|Civit|Frascati|Olevano|Albano|Nemi|Viterbo|Palestrina|Posillipo|Castel Gandolfo|Ischia',re.I)
NATURE=re.compile(r'cloud|sky|skies|rock|tree|wood|forest|waterfall|river|stream|lake|sea|coast|shore|cave|grotto|mountain|sunset|sunrise|storm|grass|field|meadow|plain|oak|olive|chêne|arbre|rocher|ciel|nuage|étude|study of',re.I)

def enrich(r):
    try:
        u=r['source'];d=None;candidates=[]
        if r.get('isIIIF'):
            j=json.loads(get(u));canvases=j.get('sequences',[{}])[0].get('canvases',[])
            if not canvases:raise ValueError('No IIIF canvases')
            c=canvases[0];res=c['images'][0]['resource'];candidates=[res.get('@id','')]
            if j.get('license'):r['rights']='YELLOW — source license: '+str(j['license'])
        elif 'metmuseum.org/art/collection/search/' in u:
            oid=u.rsplit('/',1)[-1]
            j=json.loads(get('https://collectionapi.metmuseum.org/public/collection/v1/objects/'+oid))
            r.update(title=j.get('title') or r['title'],artist=j.get('artistDisplayName') or r['artist'],date=j.get('objectDate') or r['date'],medium=j.get('medium',''),institution='The Metropolitan Museum of Art',objectId=j.get('accessionNumber',''))
            if j.get('isPublicDomain'):r['rights']='GREEN — Public Domain / Met Open Access'
            candidates=[j.get('primaryImage',''),j.get('primaryImageSmall','')]
        else:
            d=soup(u);body=text(d.select_one('main') or d.select_one('article') or d)
            candidates=image_candidates(d,u)
            if r.get('exhibitionCandidate'):
                h=d.select_one('h1');r['artist']=re.sub(r'^\d+\s*[. –-]*','',text(h))
                article=d.select_one('.texte') or d.select_one('article') or d.select_one('main')
                if article:
                    r['catalogueText']=text(article)[:3000]
                    # Short catalogue subject keeps geography grounded; don't import all northern urban views.
                    pars=[text(x) for x in article.select('p') if text(x)]
                    if pars:r['title']=' / '.join(pars[:2])[:300]
                match_text=r['title']+' '+r.get('catalogueText','')
                if not GEO.search(match_text) and not NATURE.search(match_text):r['excluded']='Outside Mediterranean landscape/natural-environment scope';return r
                r['notes']='Exhibition discovery record; actual subject and holding collection retained in catalogueText. Environmental analogues must not be relabelled as Homeric locations.'
            if 'nga.gov/' in u:
                r['institution']='National Gallery of Art'
                if re.search(r'public domain|free to use',body,re.I):r['rights']='GREEN — institution marks media Public Domain / free to use'
            if 'americanart.si.edu' in u:
                r['institution']='Smithsonian American Art Museum'
                if re.search(r'free to use|CC0|public domain',body,re.I):r['rights']='GREEN — Smithsonian marks image free to use'
            if 'clevelandart.org' in u:
                r['institution']='Cleveland Museum of Art'
                if re.search(r'public domain|CC0|open access',body,re.I):r['rights']='GREEN — museum Public Domain / Open Access'
            if 'travelogues.gr' in u:
                # Original object image is linked; prefer it over collection badges and UI icons.
                candidates=[v for v in candidates if re.search(r'files|images|pictures|uploads|media',v,re.I)] or candidates
        images=[]
        for imgurl in candidates[:5]:
            if not imgurl:continue
            try:
                data=get(imgurl,True)
                im=Image.open(io.BytesIO(data));im.load();w,h=im.size
                if w<250 or h<150:continue
                images.append((w*h,imgurl,data,w,h))
                if w>=900:break
            except Exception:continue
        if images:
            _,iu,data,w,h=max(images)
            key=hashlib.sha256(u.encode()).hexdigest()[:16]
            im=Image.open(io.BytesIO(data)).convert('RGB');im.thumbnail((1920,1920))
            name=key+'.jpg';im.save(OUT/'images'/name,quality=90)
            r.update(imageUrl=iu,width=w,height=h,reviewFile='images/'+name,downloadStatus='Downloaded and decoded',imageSha256=hashlib.sha256(data).hexdigest())
        else:r['downloadStatus']='No decodable image retrieved'
    except Exception as e:r['downloadStatus']='Source or image retrieval failed';r['error']=str(e)
    return r

with cf.ThreadPoolExecutor(max_workers=6) as pool:
    enriched=list(pool.map(enrich,RECORDS))
RECORDS=[]
for r in enriched:
    if r.get('excluded'):ERRORS.append({'collection':r['collection'],'source':r['source'],'title':r['title'],'excluded':r['excluded']})
    else:RECORDS.append(r)
# Image hashes catch duplicate scans from different collection pages without inflating imported counts.
seen_hash={}
for r in RECORDS:
    h=r.get('imageSha256')
    if h and h in seen_hash:r['duplicateOf']=seen_hash[h]
    elif h:seen_hash[h]=r['source']
for i,r in enumerate(RECORDS,1):r['reviewId']=f'LIMP-{i:03d}'
(OUT/'records.json').write_text(json.dumps(RECORDS,ensure_ascii=False,indent=2))
(OUT/'issues.json').write_text(json.dumps(ERRORS,ensure_ascii=False,indent=2))
counts={}
for r in RECORDS:
    c=counts.setdefault(r['collection'],{'records':0,'decodedImages':0});c['records']+=1;c['decodedImages']+=int(r['downloadStatus']=='Downloaded and decoded')
(OUT/'summary.json').write_text(json.dumps({'collections':counts,'records':len(RECORDS),'decodedImages':sum(x['decodedImages'] for x in counts.values()),'issues':len(ERRORS),'cardsChanged':0},indent=2))
# Contact sheets are review evidence, never claimed as individual-card crop approval.
for page in range((len(RECORDS)+19)//20):
    grid=Image.new('RGB',(1500,1100),'#f0ede7');dr=ImageDraw.Draw(grid)
    for j,r in enumerate(RECORDS[page*20:page*20+20]):
        x=(j%4)*375;y=(j//4)*220
        if r.get('reviewFile'):
            im=Image.open(OUT/r['reviewFile']);im.thumbnail((360,170));grid.paste(im,(x+(360-im.width)//2,y))
        dr.text((x+5,y+172),r['reviewId']+' '+r['title'][:43],fill='black')
        dr.text((x+5,y+188),r['artist'][:45],fill='black')
        dr.text((x+5,y+203),r['downloadStatus'][:45],fill='black')
    grid.save(OUT/f'contact-{page+1:02d}.jpg',quality=88)
# Collect only project code/data needed to integrate the import; do not include credentials or account data.
code=OUT/'integration-context';code.mkdir(exist_ok=True)
for p in (ROOT/'public/mtgtools').rglob('*'):
    if p.is_file() and p.suffix in ('.html','.js','.json') and ('odyssey' in str(p).lower() or 'art-library' in str(p).lower()):
        if p.stat().st_size<12000000:
            dest=code/p.relative_to(ROOT);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest)
print(json.dumps(counts,indent=2),flush=True)
