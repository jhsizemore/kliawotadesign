#!/usr/bin/env python3
"""Extend the cached round-two acquisition with primary published Greek landscapes."""
from pathlib import Path
from urllib.parse import urljoin
import requests,json,re,hashlib,io,concurrent.futures as cf
from bs4 import BeautifulSoup
from PIL import Image,ImageDraw
OUT=Path('landscape-round2');records=json.loads((OUT/'records.json').read_text());issues=json.loads((OUT/'issues.json').read_text())
def get(u):
 r=requests.get(u,timeout=(8,22),headers={'User-Agent':'OdysseyLandscapeResearch/2.0 (bounded historical print research)'});r.raise_for_status();r.encoding='utf-8';(OUT/'sources'/hashlib.sha256(u.encode()).hexdigest()).write_text(r.text);return BeautifulSoup(r.text,'html.parser')
def text(el):return re.sub(r'\s+',' ',el.get_text(' ',strip=True)).strip() if el else ''
exclude=re.compile(r'costume|portrait|\bplan\b|\bmap\b|coins|capital of|inscription|sarcophagus|vase|statue of|detail of|title page|interior of|procession|dance|feast|temple of apollo|temple of jupiter|mosque|church|parthenon|erechtheion',re.I)
target=re.compile(r'Sparta|Laconia|Tayget|Eurotas|Navarino|Pylos|Sphacter|Sphakter|Delos|Dodona|Acheron|Olympus|Tempe|Parnass|Delphi|Ithaca|Corfu|Cythera|Sunium|Sounion|Malea|Messina|Scilla|Sicil|Thesprot|Parga|Sidon|Paphos|Crete|Lemnos|Lesbos|Mytilene|Euboea|Negropont|Skyros|Gibraltar|Avern',re.I)
seen={r['source'] for r in records};new=[]
# Seeds are actual object records discovered in primary/aggregated catalogues.
for seed,group,creator,limit,restrict in [
('https://eng.travelogues.gr/item.php?view=50307','Stackelberg — Greek landscapes','After Otto Magnus von Stackelberg',42,False),
('https://eng.travelogues.gr/item.php?view=47967','Wordsworth — Homeric landscapes','Illustrators of Christopher Wordsworth’s Greece',16,True)]:
 try:
  d=get(seed)
  coll=next((urljoin(seed,a['href']) for a in d.select('a[href*="collection.php?view="]') if ('STACKELBERG' if 'Stackelberg' in group else 'WORDSWORTH') in text(a).upper()),None)
  if not coll:coll=next((urljoin(seed,a['href']) for a in d.select('a[href*="collection.php?view="]')),None)
  if not coll:raise ValueError('Parent collection link not found')
  doc=get(coll);bibliography=text(doc.select_one('h1'))
  links={}
  for a in doc.select('a[href*="item.php?view="]'):
   t=text(a);u=urljoin(coll,a['href'])
   if not t or exclude.search(t) or (restrict and not target.search(t)) or u in seen:continue
   links[u]=t
  # Priority places precede wider Greek backgrounds. No generic northern-European filler.
  chosen=sorted(links.items(),key=lambda x:(not bool(target.search(x[1])),x[0]))[:limit]
  for u,t in chosen:
   seen.add(u);new.append(dict(source=u,title=t,artist=creator,date='',medium='Published landscape print',institution='Aikaterini Laskaridis Foundation / Travelogues',collection=group,objectId='Travelogues item '+u.rsplit('=',1)[1],collectionSource=coll,bibliography=bibliography,metadataSource=u,rights='YELLOW — supplied digital scan terms unverified; research preview only',imageDecoded=False))
  issues.append({'collection':group,'catalogue':coll,'candidates':len(chosen),'bibliography':bibliography})
 except Exception as e:issues.append({'source':seed,'error':str(e)})

def acquire(a):
 try:
  d=get(a['source']);body=text(d)
  # Keep source catalogue year only if stated beside a bibliographical author block.
  for b in d.select('h1,h2,h3,.bibliography,.source,.collection'):
   v=text(b)
   if any(q in v.upper() for q in ['STACKELBERG','WORDSWORTH']):
    years=re.findall(r'\b1[6789]\d\d\b',v)
    if years:a['date']=years[-1];a['bibliography']=v[:800];break
  urls=[]
  for el in d.select('a[href],img[src]'):
   u=el.get('href') or el.get('src') or ''
   if re.search(r'\.(?:jpg|jpeg|png)(?:\?|$)',u,re.I) and not re.search('logo|icon|banner|sprite|flag',u,re.I):urls.append(urljoin(a['source'],u))
  # Prefer source image files rather than user-interface badges.
  urls=sorted(dict.fromkeys(urls),key=lambda u:('files' not in u and 'images' not in u,'thumb' in u))
  for u in urls[:5]:
   try:
    r=requests.get(u,timeout=(8,20));r.raise_for_status();b=r.content
    if len(b)>25000000:continue
    im=Image.open(io.BytesIO(b));im.load();w,h=im.size
    if w<500 or h<200:continue
    im=im.convert('RGB');im.thumbnail((2400,2400));file='images/'+hashlib.sha256(a['source'].encode()).hexdigest()[:16]+'.jpg';im.save(OUT/file,quality=91)
    a.update(imageUrl=u,sourceWidth=w,sourceHeight=h,width=im.width,height=im.height,imageFile=file,imageHash=hashlib.sha256(b).hexdigest(),imageDecoded=True);break
   except Exception as e:a['error']=str(e)
  if a['imageDecoded']:a.pop('error',None)
 except Exception as e:a['error']=str(e)
 return a
with cf.ThreadPoolExecutor(max_workers=4) as pool:records.extend(pool.map(acquire,new))
for n,a in enumerate(records,1):a['reviewId']='R2-'+str(n).zfill(3)
(OUT/'records.json').write_text(json.dumps(records,ensure_ascii=False,indent=2));(OUT/'issues.json').write_text(json.dumps(issues,ensure_ascii=False,indent=2))
summary={'records':len(records),'decoded':sum(r['imageDecoded'] for r in records),'cardsChanged':0};(OUT/'summary.json').write_text(json.dumps(summary,indent=2))
for page in range((len(records)+11)//12):
 grid=Image.new('RGB',(1600,1080),'white');dr=ImageDraw.Draw(grid)
 for k,a in enumerate(records[page*12:page*12+12]):
  x=k%3*533;y=k//3*270
  if a.get('imageFile'):
   im=Image.open(OUT/a['imageFile']);im.thumbnail((510,220));grid.paste(im,(x+(510-im.width)//2,y))
  dr.text((x+6,y+225),a['reviewId']+' '+a['title'][:64],fill='black');dr.text((x+6,y+242),a['collection']+' | '+str(a.get('width',0))+'x'+str(a.get('height',0)),fill='black')
 grid.save(OUT/('contact-%02d.jpg'%(page+1)),quality=93)
print(json.dumps(summary))
