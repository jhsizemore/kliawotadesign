#!/usr/bin/env python3
"""Second pass: approved oil-study catalogue and museum images; no card writes."""
import concurrent.futures as cf
import csv, hashlib, io, json, re
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'landscape-import-output'
records=json.loads((OUT/'records.json').read_text());issues=json.loads((OUT/'issues.json').read_text())
s=requests.Session();s.headers['User-Agent']='Odyssey-Art-Catalogue/1.0 (bounded historical landscape research)'
def get(u,binary=False):
    p=OUT/'html'/hashlib.sha256(u.encode()).hexdigest()
    if p.exists() and not binary:return p.read_text()
    x=s.get(u,timeout=(12,35));x.raise_for_status()
    if binary:
        if len(x.content)>35000000:raise ValueError('Review image exceeds 35 MB')
        return x.content
    if 'charset' not in x.headers.get('Content-Type','').lower():x.encoding='utf-8'
    p.write_text(x.text);return x.text

def txt(x):return re.sub(r'\s+',' ',x.get_text(' ',strip=True)).strip() if x else ''
def save_image(r,u):
    b=get(u,True);im=Image.open(io.BytesIO(b));im.load();w,h=im.size
    if w<250 or h<150:raise ValueError('Image too small')
    name=hashlib.sha256(r['source'].encode()).hexdigest()[:16]+'.jpg'
    im=im.convert('RGB');im.thumbnail((1920,1920));im.save(OUT/'images'/name,quality=90)
    r.update(imageUrl=u,width=w,height=h,reviewFile='images/'+name,downloadStatus='Downloaded and decoded',imageSha256=hashlib.sha256(b).hexdigest())
    r.pop('error',None)

def candidate(group,u,title,artist=''):
    return dict(collection=group,source=u,title=title,artist=artist,date='',medium='',institution='',rights='YELLOW — supplied image terms need verification',imageUrl='',status='RESEARCH',visualReview='Pending',downloadStatus='Pending',width=0,height=0)

base='https://www.fondationcustodia.fr/True-to-Nature-Open-air-Painting-1780-1870-177'
# Exclude portrait/paintbox, later urban architecture and northern built interiors.
exclude=set([2,6,7,8,*range(61,72),116,128,129,130,131,*range(132,158)])
new=[]
try:
    d=BeautifulSoup(get(base),'html.parser');seen=set()
    for a in d.select('a[href]'):
        u=urljoin(base,a['href']);m=re.search(r'/(\d+)-[A-Za-z]',u)
        if not m or 'fondationcustodia.fr' not in u or u in seen:continue
        seen.add(u);n=int(m[1])
        if not 1<=n<=157:continue
        if n in exclude:
            issues.append({'collection':'True to Nature','source':u,'excluded':'Outside landscape/natural-environment scope: catalogue '+str(n)});continue
        r=candidate('True to Nature',u,txt(a));r.update(catalogueNumber=n,collectionSource=base);new.append(r)
except Exception as e:issues.append({'collection':'True to Nature','error':str(e)})

def custodia(r):
    try:
        d=BeautifulSoup(get(r['source']),'html.parser')
        h1=d.select_one('h1');r['artist']=re.sub(r'^\d+[.\s–-]*','',txt(h1))
        article=d.select_one('.texte') or d.select_one('article') or d
        h2=article.select('h2')
        # The first h2 is the artist's birth/death places; second is artwork title.
        if len(h2)>=2:r['title']=txt(h2[1])
        elif h2:r['title']=txt(h2[0])
        pars=[txt(p) for p in article.select('p') if txt(p)]
        factual=[p for p in pars if re.match(r'^(Oil |Graphite|Pencil|Watercolou?r|Tempera|Gouache|National Gallery|Fondation Custodia|The Fitzwilliam|Fitzwilliam|Private collection|Collection particulière)',p,re.I)]
        r['medium']=next((p[:160] for p in factual if re.match(r'^(Oil |Graphite|Pencil|Watercolou?r|Tempera|Gouache)',p,re.I)),'')
        r['institution']=next((p[:250] for p in factual if re.match(r'^(National Gallery|Fondation Custodia|The Fitzwilliam|Fitzwilliam|Private collection|Collection particulière)',p,re.I)),'Fondation Custodia exhibition; holding collection pending')
        dt=re.search(r',\s*((?:c\.|ca\.|about|circa|before|after)?\s*1[6789]\d\d(?:[–-]\d{2,4})?)\s*$',r['title'],re.I)
        if dt:r['date']=dt[1].strip();r['title']=r['title'][:dt.start()].strip()
        r['notes']='Landscape or natural-environment study. Preserve actual place; do not relabel analogues as a literal Homeric location. Image terms and final card crop require review.'
        urls=[]
        for a in article.select('a[href]'):
            if re.search(r'\.(jpg|jpeg|png)(?:\?|$)',a['href'],re.I):urls.append(urljoin(r['source'],a['href']))
        for im in article.select('img[src]'):
            if not re.search(r'logo|icon',im['src'],re.I):urls.append(urljoin(r['source'],im['src']))
        for u in dict.fromkeys(urls):
            try:save_image(r,u);break
            except Exception as e:r['error']=str(e)
        if not r.get('reviewFile'):r['downloadStatus']='No decodable object image retrieved'
    except Exception as e:r.update(downloadStatus='Source or image retrieval failed',error=str(e))
    return r
with cf.ThreadPoolExecutor(max_workers=5) as pool:records.extend(pool.map(custodia,new))

# Smithsonian: the two additional object records are distinct accessions.
for slug,title in [('nile-37228','Nile'),('nile-3rd-and-4th-view-gebel-el-fedah-37233','Nile (3rd and 4th view, Gebel el Fedah)')]:
    r=candidate('Kellogg — Egypt','https://americanart.si.edu/artwork/'+slug,title,'Miner Kilbourne Kellogg')
    r.update(medium='Pencil on paper',institution='Smithsonian American Art Museum')
    try:
        d=BeautifulSoup(get(r['source']),'html.parser');t=txt(d)
        if 'Free to use' in t:r['rights']='GREEN — Smithsonian marks image free to use'
        m=re.search(r'1991\.56\.\d+',t)
        if m:r['objectId']=m[0]
        urls=[urljoin(r['source'],a['href']) for a in d.select('a[href]') if re.search(r'\.jpg|ids\.si\.edu',a['href'])]
        urls += [urljoin(r['source'],m.get('content','')) for m in d.select('meta[property="og:image"]')]
        for u in dict.fromkeys(urls):
            try:save_image(r,u);break
            except Exception as e:r['error']=str(e)
    except Exception as e:r.update(downloadStatus='Source or image retrieval failed',error=str(e))
    records.append(r)

# Primary NGA open-data catalogue supplies stable image UUIDs even when the HTML site is unavailable.
try:
    csvurl='https://raw.githubusercontent.com/NationalGalleryOfArt/opendata/main/data/published_images.csv'
    rows=list(csv.DictReader(io.StringIO(get(csvurl))))
    targets={re.search(r'artworks/(\d+)',r['source'])[1]:r for r in records if 'nga.gov/artworks/' in r['source']}
    matches=[]
    for row in rows:
        oid=str(row.get('depictstmsobjectid') or row.get('objectid') or '')
        if oid not in targets:continue
        view=str(row.get('viewtype','')).lower()
        if view and 'primary' not in view:continue
        matches.append(row)
    (OUT/'nga-image-matches.json').write_text(json.dumps(matches,indent=2))
    for row in matches:
        r=targets[str(row.get('depictstmsobjectid') or row.get('objectid'))]
        uuid=row.get('uuid') or row.get('imageid')
        u=row.get('iiifurl') or row.get('iiif_url')
        if not u and uuid:u='https://api.nga.gov/iiif/'+uuid
        if not u:continue
        if not re.search(r'\.(jpg|png)$',u):u=u.rstrip('/')+'/full/!1920,1920/0/default.jpg'
        try:
            save_image(r,u);r['rights']='GREEN — NGA object media marked Public Domain; image acquired via official published-image catalogue'
        except Exception as e:r['error']=str(e)
except Exception as e:issues.append({'collection':'NGA museum image repair','error':str(e)})

# Remove inspected non-landscape leftovers; retain the decision in the audit.
excluded_titles=['Title page. View of','Feast of St. Jason','The quarantine station','Remains of ancient walls']
kept=[]
for r in records:
    if any(r['title'].startswith(v) for v in excluded_titles):
        issues.append({'source':r['source'],'title':r['title'],'excluded':'Inspected: title-page or non-landscape subject'});continue
    # Repair only clear mojibake without guessing missing names.
    for k in ['title','artist','medium']:
        v=r.get(k,'')
        if 'Ã' in v or 'Â' in v:
            try:r[k]=v.encode('latin1').decode('utf8')
            except (UnicodeEncodeError,UnicodeDecodeError):pass
    kept.append(r)
records=kept
for i,r in enumerate(records,1):r['reviewId']=f'LIMP-{i:03d}'
(OUT/'records.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
(OUT/'issues.json').write_text(json.dumps(issues,ensure_ascii=False,indent=2))
counts={}
for r in records:
    c=counts.setdefault(r['collection'],{'records':0,'decodedImages':0});c['records']+=1;c['decodedImages']+=int(r.get('downloadStatus')=='Downloaded and decoded')
summary={'collections':counts,'records':len(records),'decodedImages':sum(c['decodedImages'] for c in counts.values()),'issues':len(issues),'cardsChanged':0}
(OUT/'summary.json').write_text(json.dumps(summary,indent=2))
for p in OUT.glob('contact-*.jpg'):p.unlink()
for page in range((len(records)+19)//20):
    grid=Image.new('RGB',(1500,1100),'#f0ede7');dr=ImageDraw.Draw(grid)
    for j,r in enumerate(records[page*20:page*20+20]):
        x=j%4*375;y=j//4*220
        if r.get('reviewFile'):
            im=Image.open(OUT/r['reviewFile']);im.thumbnail((360,170));grid.paste(im,(x+(360-im.width)//2,y))
        dr.text((x+5,y+172),r['reviewId']+' '+r['title'][:43],fill='black');dr.text((x+5,y+188),r['artist'][:45],fill='black');dr.text((x+5,y+203),r.get('downloadStatus','')[:45],fill='black')
    grid.save(OUT/f'contact-{page+1:02d}.jpg',quality=88)
print(json.dumps(summary,indent=2))
