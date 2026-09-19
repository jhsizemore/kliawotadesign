"""Repair exact sources without substituting unrelated works or altering card data."""
from pathlib import Path
import csv, io, json, re, time, types, concurrent.futures
p=Path(__file__).with_name('odyssey-artwork-audit.py')
a=types.ModuleType('source_audit');a.__file__=str(p)
code=p.read_text().replace('if total > 65 * 1024 * 1024:',"if total > (128 if 'PK.OPB.0177.033.tif' in url else 65) * 1024 * 1024:")
exec(compile(code,str(p),'exec'),a.__dict__)
manifest=json.loads((a.APP/'data/artwork-manifest.json').read_text())
missing={k for k,v in manifest['artworks'].items() if v['status']!='verified'}
notes={}
nga={111489:'ART-143',151069:'ART-145',45099:'ART-165',143861:'ART-170',157097:'ART-177',44055:'ART-191',221932:'ART-192',69829:'ART-424'}
# This public metadata table is much larger than a single image. Stream it; retain only eight exact records.
try:
 with a.requests.get('https://raw.githubusercontent.com/NationalGalleryOfArt/opendata/main/data/published_images.csv',stream=True,timeout=(10,60),headers={'User-Agent':a.UA}) as response:
  response.raise_for_status();response.raw.decode_content=True
  matches=[];chosen={}
  for rawrow in csv.DictReader(io.TextIOWrapper(response.raw,encoding='utf-8-sig',newline='')):
   row={k.lower():v for k,v in rawrow.items()}
   try:oid=int(row.get('depictstmsobjectid',row.get('objectid','0')))
   except ValueError:continue
   if oid not in nga:continue
   matches.append(row)
   if row.get('openaccess')!='1' or row.get('viewtype','').lower()!='primary':continue
   old=chosen.get(oid)
   if old and int(old.get('sequence') or '999')<=int(row.get('sequence') or '999'):continue
   chosen[oid]=row
  for oid,row in chosen.items():
   url=row.get('iiifurl','') or row.get('iiifthumburl','')
   if not url and row.get('uuid'):url='https://api.nga.gov/iiif/'+row['uuid']
   if url:
    url=re.sub(r'/full/.*$','',url.rstrip('/')).replace('http://','https://')
    a.KNOWN[nga[oid]]=url+'/full/max/0/default.jpg'
    notes[nga[oid]]={'source':'NGA official published_images.csv','objectId':oid,'record':row}
  (a.OUT/'nga-records.json').write_text(json.dumps(matches,indent=2))
  print('NGA primary open-access records:',len(chosen),flush=True)
except Exception as e:
 notes['ngaError']=str(e);print('NGA metadata error:',str(e),flush=True)
for art in a.DATA['artworks']:
 if art['id']=='ART-026':art['objectId']='RP-P-1975-75-53'
a.KNOWN['ART-421']=a.commons_original('https://commons.wikimedia.org/wiki/File:Drawing,_Zeus_Deciding_on_the_Destiny_of_Troy,_Palazzo_Gessi,_Faenza,_1813_(CH_18110481).jpg')
notes['ART-421']={'source':'Smithsonian Open Access reproduction on Wikimedia Commons','objectId':'1901-39-1640'}
for art in a.DATA['artworks']:
 if art['id']=='ART-200':
  try:
   record=a.get('https://collectionapi.metmuseum.org/public/collection/v1/objects/253618',True)
   (a.OUT/'met-253618.json').write_text(json.dumps(record,indent=2))
   if not record.get('primaryImage') and not record.get('primaryImageSmall'):
    notes['ART-200']={'reason':'The Met currently publishes no image for accession 41.11.1 / object 253618. Kept as a documented source record, not silently replaced.','officialSource':art['source']}
  except Exception as e:notes['ART-200']={'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for row in pool.map(a.audit,[art for art in a.DATA['artworks'] if art['id'] in missing]):
  if row['id'] in notes:row['recoveryProvenance']=notes[row['id']]
  manifest['artworks'][row['id']]=row
rows=manifest['artworks'].values()
summary={'total':len(manifest['artworks']),'verified':sum(r['status']=='verified' for r in rows),'sameOrigin':sum(r.get('delivery')=='same-origin' for r in rows),'externalPreviews':[r['id'] for r in rows if r.get('delivery')=='external-preview'],'unavailable':[r['id'] for r in rows if r['status']!='verified'],'originalBytes':sum(r.get('originalBytes',0) for r in rows),'fullBytes':sum(r.get('full',{}).get('bytes',0) for r in rows),'thumbnailBytes':sum(r.get('thumb',{}).get('bytes',0) for r in rows)}
manifest['summary']=summary;manifest['checkedAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime());manifest['revision']='artwork-performance-v1'
text=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
(a.APP/'data/artwork-manifest.json').write_text(text)
(a.OUT/'artwork-audit.json').write_text(text)
(a.OUT/'summary.json').write_text(json.dumps(summary,indent=2))
(a.OUT/'recovery-notes.json').write_text(json.dumps(notes,indent=2))
print(json.dumps(summary,indent=2),flush=True)
