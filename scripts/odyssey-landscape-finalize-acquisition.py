#!/usr/bin/env python3
"""Finish the already-cached catalogue acquisition; no card or production writes."""
import concurrent.futures as cf
import hashlib,io,json,re
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from PIL import Image,ImageDraw
OUT=Path('landscape-import-output');records=json.loads((OUT/'records.json').read_text());s=requests.Session()
s.headers['User-Agent']='Odyssey-Art-Catalogue/1.0 (bounded historical landscape research)'
def fix(r):
    if r['collection']!='True to Nature':return r
    try:
        p=OUT/'html'/hashlib.sha256(r['source'].encode()).hexdigest()
        d=BeautifulSoup(p.read_text(),'html.parser')
        def text(el):return re.sub(r'\s+',' ',el.get_text(' ',strip=True)).strip() if el else ''
        r['title']=text(d.select_one('h2.surtitre')) or r['title']
        r['artist']=re.sub(r'^\d+[.\s–-]*','',text(d.select_one('h1.entry-title')))
        m=re.search(r',\s*((?:c\.|ca\.|about|circa|before|after)?\s*1[6789]\d\d(?:[–-]\d{2,4})?)\s*$',r['title'],re.I)
        if m:r['date']=m[1].strip();r['title']=r['title'][:m.start()]
        pars=[text(el) for el in d.select('p')]
        medium=next((v for v in pars if re.match(r'^(Oil |Graphite|Pencil|Watercolou?r|Tempera|Gouache)',v,re.I)),'')
        r['medium']=re.split(r'\s+[.–-]\s+\d',medium)[0][:180]
        r['institution']=next((v for v in pars if re.match(r'^(National Gallery|Fondation Custodia,|The Fitzwilliam|Fitzwilliam|Private collection|Collection particulière)',v,re.I) and len(v)<600),'Fondation Custodia exhibition; holding collection not stated')
        r['objectId']='True to Nature catalogue '+str(r['catalogueNumber'])
        im=d.select_one('img.spip_logo[src]')
        if not im:raise ValueError('Object image element absent')
        u=urljoin(r['source'],im['src']);res=s.get(u,timeout=(12,40));res.raise_for_status();b=res.content
        if len(b)>35000000:raise ValueError('Review image exceeds size limit')
        image=Image.open(io.BytesIO(b));image.load();w,h=image.size
        if w<250 or h<150:raise ValueError('Object image below review size')
        name=hashlib.sha256(r['source'].encode()).hexdigest()[:16]+'.jpg';image=image.convert('RGB');image.thumbnail((1920,1920));image.save(OUT/'images'/name,quality=90)
        r.update(imageUrl=u,width=w,height=h,reviewFile='images/'+name,downloadStatus='Downloaded and decoded',imageSha256=hashlib.sha256(b).hexdigest());r.pop('error',None)
    except Exception as e:r.update(downloadStatus='Source or image retrieval failed',error=str(e))
    return r
with cf.ThreadPoolExecutor(max_workers=5) as pool:records=list(pool.map(fix,records))
# Preserve actual measured dimensions of the packaged review derivative separately from its source.
for r in records:
    if r.get('reviewFile'):
        r['deliveryWidth'],r['deliveryHeight']=Image.open(OUT/r['reviewFile']).size
(OUT/'records.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
counts={}
for r in records:
    c=counts.setdefault(r['collection'],{'records':0,'decodedImages':0});c['records']+=1;c['decodedImages']+=int(r.get('downloadStatus')=='Downloaded and decoded')
summary={'collections':counts,'records':len(records),'decodedImages':sum(c['decodedImages'] for c in counts.values()),'cardsChanged':0}
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
