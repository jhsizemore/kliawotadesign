#!/usr/bin/env python3
"""Publish the reviewed landscape batch additively; never touch cards or coverage."""
from pathlib import Path
from collections import Counter
from urllib.parse import urlparse, parse_qs
import csv, hashlib, json, re, shutil
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
INPUT=ROOT/'landscape-import-output'
PUB=ROOT/'public/mtgtools/odyssey'
DATA=PUB/'data';IMG=PUB/'assets/landscapes';REPORT=ROOT/'landscape-publication-report'
for p in [DATA,IMG,REPORT]:p.mkdir(parents=True,exist_ok=True)
records=json.loads((INPUT/'records.json').read_text())
assert len(records)==235, 'Acquisition changed; review again before assigning IDs'
# Decisions made by inspecting all twelve contact sheets, not by guessing from filenames.
EXCLUDE={26:'Architecture-led Parthenon scene',27:'Architecture-led Parthenon scene',28:'Architecture-led Erechtheion scene',29:'Later city gate rather than landscape',34:'Temple interior rather than landscape',41:'Later religious building dominates',126:'Composite display of nine paintings; individual works require separate sources',169:'Later coastal fortress dominates',173:'Later town dominates',183:'Roman tomb and medieval fortification dominate',206:'Later Capri buildings dominate',211:'Later domestic interior, not landscape'}
REUSE={58:'ART-568',69:'ART-586',118:'ART-546'}
ENRICH={104:'ART-617',105:'ART-618',106:'ART-619',107:'ART-620',108:'ART-621',109:'ART-622',112:'ART-623',113:'ART-624'}
GROUPS={
 'Lear — Ionian Islands':('Lear — Ionian Islands','collectionlearionian'),
 'Dodwell — Views in Greece':('Dodwell — Greece','collectiondodwell'),
 'Gell — Troy':('Gell — Troy','collectiongelltroy'),
 'Gell — Ithaca':('Gell — Ithaca','collectiongellithaca'),
 'Cartwright — Ionian portfolio':('Cartwright — Ionian Islands','collectioncartwright'),
 'Italian museum landscapes':('Italian museum landscapes','collectionitalianmuseums'),
 'Kellogg — Egypt':('Kellogg — Egypt','collectionkellogg'),
 'Cole — Etna and volcanic landscapes':('Cole — Etna','collectioncoleetna'),
 'Lear — original drawings':('Lear — original drawings','collectionlearoriginals'),
 'Harvard — Lear Mediterranean':('Harvard — Lear source records','collectionharvardlear'),
 'True to Nature':('True to Nature — oil studies','collectiontruetonature')}
KEYS=['id','tags','title','artist','date','period','medium','institution','objectId','rights','source','credit','matchType','heroScore','candidateCards','cropNotes','status','imageUrl','imageWidth','imageHeight','imageChecked']
HEADERS=['Art ID','Subjects / Tags','Artwork Title','Artist / Creator','Date','Period','Medium','Institution','Object / Accession ID','Rights','Source URL','Card Credit (short)','Match Type','Hero Score','Candidate Cards','Crop / Use Notes','Status','Direct image URL','Image width (px)','Image height (px)','Image checked (UTC)']

def clean(s):return re.sub(r'\s+',' ',str(s or '')).strip()
def tags_for(r):
 title=r['title'];tags=['landscape','import20260929',GROUPS[r['collection']][1]];leg=[]
 for pattern,label,tag in [
  (r'\bOlympus\b|Olympos','Mount Olympus','localeolympus'),
  (r'Ithaca|Ithaki|Arethusa|Corax|Cor[ay]x','Ithaca','localeithaca'),
  (r'Corfu|Kerkyra|Pantocrator|Palaiokastritsa','Scheria analogue','localescheria'),
  (r'Circello|Circeo','Aeaea analogue','localeaeaea'),
  (r'Avernus|Acheron|Suli|Souli','Underworld approach analogue','localeunderworld'),
  (r'Stromboli|Lipari','Aeolia analogue','localeaeolia'),
  (r'Gozo','Ogygia analogue','localeogygia'),
  (r'\bTroy\b|Troad|Scamander|Simoes|Simois|Bunarba','Troad','localetroy'),
  (r'\bEtna\b','Cyclopes country analogue','localecyclopes'),
  (r'Sorrento|Posillipo|Capri','Siren-coast regional analogue','localesirencoast'),
  (r'Nile|Luxor','Egypt','localeegypt')]:
  if re.search(pattern,title,re.I):tags.extend([label,tag]);leg.append(tag)
 for pattern,tag in [(r'cloud|sky|skies|sunset|sunrise|dawn|storm','envsky'),(r'tree|olive|wood|forest|grove','envwoodland'),(r'cave|grotto|glen|gorge','envcave'),(r'river|spring|waterfall|lake|Nile','envfreshwater'),(r'mount|rock|cliff|Etna|volcan|Vesuvi','envrock'),(r'sea|coast|shore|bay|harbo|strait','envcoast'),(r'plain|field|pasture|garden|meadow','envplain')]:
  if re.search(pattern,title,re.I):tags.append(tag)
 return '; '.join(dict.fromkeys(tags)),'; '.join(leg)

artworks=[];new=[];enriched=[];reused=[];excluded=[];next_id=625;hashes=set()
for r in records:
 n=int(r['reviewId'].split('-')[1])
 if n in EXCLUDE:excluded.append({'reviewId':r['reviewId'],'source':r['source'],'title':r['title'],'reason':EXCLUDE[n]});continue
 if n in REUSE:reused.append({'reviewId':r['reviewId'],'existingId':REUSE[n],'source':r['source'],'title':r['title']});continue
 if r.get('imageSha256') in hashes:raise ValueError('Unexpected duplicate decoded image: '+r['reviewId'])
 if r.get('imageSha256'):hashes.add(r['imageSha256'])
 aid=ENRICH.get(n)
 if not aid:aid=f'ART-{next_id}';next_id+=1
 title=clean(r['title']);artist=clean(r['artist']);medium=clean(r.get('medium'));institution=clean(r.get('institution'))
 if not medium and 'Kellogg' in r['collection']:medium='Pencil on paper'
 if not institution:
  institution={'Italian museum landscapes':'National Gallery of Art','Kellogg — Egypt':'Smithsonian American Art Museum','Cole — Etna and volcanic landscapes':'Institution identified on canonical source'}.get(r['collection'],'Holding collection identified on canonical source')
 objectid=clean(r.get('objectId'))
 if not objectid and 'travelogues.gr' in r['source']:objectid='Travelogues item '+parse_qs(urlparse(r['source']).query).get('view',[''])[0]
 if not objectid and r.get('catalogueNumber'):objectid='True to Nature catalogue '+str(r['catalogueNumber'])
 tags,legendary=tags_for(r)
 note='29 Sep 2026 batch import. Full composition inspected on a contact sheet; no final card crop approved. Preserve the actual depicted place; mythic uses are analogues.'
 if re.search(r'castle|monastery|temple|church|convent|house|village|town|bridge|ruins|pergola|terrace',title,re.I):note+=' Later architecture/costume needs crop review.'
 if r['collection']=='Gell — Troy':note+=' Gell\'s historical site identifications are not archaeological proof.'
 if 'True to Nature'==r['collection'] and not legendary:note+=' General environmental reference, not claimed Homeric topography.'
 if r['collection']=='Harvard — Lear Mediterranean':note='Exact archival source lead; image retrieval failed. Not visually reviewed. The wider Mediterranean archive remains unimported.'
 image='';w=h=0
 if r.get('reviewFile'):
  src=INPUT/r['reviewFile'];b=src.read_bytes();digest=hashlib.sha256(b).hexdigest()[:12]
  dest=IMG/f'{aid}.{digest}.jpg';shutil.copyfile(src,dest);w,h=Image.open(dest).size
  image='https://kliawota.design/mtgtools/odyssey/assets/landscapes/'+dest.name
  if w<1000:note+=' Sub-1000px preview; seek a higher-resolution scan before printing.'
 else:note+=' Source record only; no downloadable preview verified.'
 source=r['source']
 # Keep the existing canonical spelling so additive merge does not create a false conflict.
 if aid=='ART-620':source='https://www.metmuseum.org/en/art/collection/search/664666'
 a=dict(id=aid,tags=tags,title=title,artist=artist,date=clean(r.get('date')),period='Historical landscape study',medium=medium,institution=institution,objectId=objectid,rights=clean(r['rights']),source=source,credit='Art: '+artist+' · '+institution,matchType='Landscape / environmental reference',heroScore='',candidateCards='',cropNotes=note,status='RESEARCH',imageUrl=image,imageWidth=w or '',imageHeight=h or '',imageChecked='2026-09-29' if image else '',originalImageUrl=r.get('imageUrl',''),originalImageWidth=r.get('width',0),originalImageHeight=r.get('height',0),landscapeCollection=r['collection'],collectionTag=GROUPS[r['collection']][1],legendaryTags=legendary,acquisitionStatus='Preview acquired; crop and rights review pending' if image else 'Source only; image unavailable',reviewId=r['reviewId'])
 artworks.append(a)
 (enriched if n in ENRICH else new).append(a)
assert len(new)==212 and len(enriched)==8 and next_id==837
assert len({a['id'] for a in artworks})==len(artworks)
collections=[{'label':label,'tag':tag,'count':sum(a['landscapeCollection']==group for a in artworks)} for group,(label,tag) in GROUPS.items()]
summary={'newRecords':len(new),'enrichedExisting':len(enriched),'reusedExisting':len(reused),'reviewedExclusions':len(excluded),'batchRecords':len(artworks),'previewImages':sum(bool(a['imageUrl']) for a in artworks),'sourceOnly':sum(not a['imageUrl'] for a in artworks),'baselineLibrary':624,'totalLibrary':624+len(new),'firstNewId':'ART-625','lastNewId':'ART-836','cardAssignmentsChanged':0,'cards':309,'harvardArchive':'Two exact source records retained; full geographically filtered archive sweep remains blocked.'}
payload={'schema':'odyssey-landscape-import/v1','version':'landscapes-20260929-v1','generatedAt':'2026-09-29','summary':summary,'collections':collections,'artworks':artworks,'existingTags':{'ART-546':'landscape; Mount Olympus; localeolympus','ART-568':'landscape; Troad; localetroy','ART-586':'landscape; Troad; localetroy'}}
raw=json.dumps(payload,ensure_ascii=False,indent=2)
(DATA/'landscape-import.20260929.json').write_text(raw)
(DATA/'landscape-import.20260929.js').write_text('window.ODYSSEY_LANDSCAPE_IMPORT = '+raw.replace('</','<\\/')+';\n')
for name,items in [('landscape-import-new.20260929.csv',new),('landscape-import-enriched.20260929.csv',enriched)]:
 with (DATA/name).open('w',newline='') as f:
  out=csv.writer(f);out.writerow(HEADERS)
  for a in items:out.writerow([a.get(k,'') for k in KEYS])
 shutil.copyfile(DATA/name,REPORT/name)
(DATA/'landscape-import-audit.20260929.json').write_text(json.dumps({'summary':summary,'collections':collections,'reused':reused,'excluded':excluded,'acquisitionRun':36528196955,'reviews':'All twelve acquisition contact sheets inspected; artwork selection remains RESEARCH. No card-specific crop approvals.'},ensure_ascii=False,indent=2))
shutil.copyfile(DATA/'landscape-import-audit.20260929.json',REPORT/'audit.json')
shutil.copyfile(DATA/'landscape-import.20260929.json',REPORT/'payload.json')
# Do not alter unrelated application code. Stop if the known integration point changed.
p=PUB/'app.html';html=p.read_text();before=html
needle='const ODYSSEY_DATASET=loadOdysseyDataset();'
replacement='const ODYSSEY_DATASET=window.OdysseyLandscapeLibrary ? window.OdysseyLandscapeLibrary.merge(loadOdysseyDataset()) : loadOdysseyDataset();'
if needle in html:html=html.replace(needle,replacement,1)
else:assert replacement in html,'Dataset integration changed; manual reconciliation required'
if 'data/landscape-import.20260929.js' not in html:
 marker='<script src="/mtgtools/odyssey/transform-faces.js'
 assert html.count(marker)==1
 html=html.replace(marker,'<script src="/mtgtools/odyssey/data/landscape-import.20260929.js?v=landscapes1"></script>\n<script src="/mtgtools/odyssey/landscape-library.js?v=landscapes1"></script>\n'+marker,1)
html=html.replace('curated artworks','artworks')
p.write_text(html)
# Enforce idempotent tag merging; keep user-authored annotations and current image selections.
p=PUB/'landscape-library.js';js=p.read_text()
old="[existing.tags,'landscape','import20260929',incoming.collectionTag||'',incoming.legendaryTags||''].filter(Boolean).join('; ')"
newtags="[...new Set([existing.tags,'landscape','import20260929',incoming.collectionTag||'',incoming.legendaryTags||''].flatMap(s=>String(s||'').split(';').map(t=>t.trim())).filter(Boolean))].join('; ')"
if old in js:js=js.replace(old,newtags)
marker=' return {...dataset,artworks,integrity:'
if 'payload.existingTags||{}' not in js:
 assert marker in js
 js=js.replace(marker," for(const [id,tags] of Object.entries(payload.existingTags||{})){const i=byId.get(id);if(i!==undefined)artworks[i]={...artworks[i],tags:[...new Set([artworks[i].tags,tags].flatMap(s=>String(s||'').split(';').map(t=>t.trim())).filter(Boolean))].join('; ')};}\n"+marker,1)
p.write_text(js)
# A browsable source catalogue as well as the in-Studio picker; never requires changing a selected card.
page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Odyssey Landscape Art Library</title><style>body{margin:0;background:#141814;color:#eee8d8;font:16px system-ui}main{max-width:1440px;margin:auto;padding:28px}h1{font:38px Georgia;margin-bottom:8px}a{color:#dcc78d}header{margin-bottom:24px}input,select{font:inherit;padding:10px;margin:5px 8px 10px 0;max-width:100%;background:#252c25;color:inherit;border:1px solid #6a715c;border-radius:5px}#grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:18px}article{background:#222820;padding:12px;border-radius:6px}img{width:100%;height:200px;object-fit:contain;background:#ede8dc}h2{font-size:17px}small,p{line-height:1.5}.rights{color:#ddbc76}#status{margin:12px 0}nav{margin:18px 0}</style></head><body><main><header><h1>The Odyssey · Landscape Art Library</h1><p>Historical landscapes and environmental references. Actual depicted places are preserved; mythic uses are labelled as analogues.</p><nav><a href="./?library=landscapes">Open in Odyssey Studio</a> · <a href="https://docs.google.com/spreadsheets/d/1YyWqX2dwrtnSEtrbTKVxdQaDSaY_tlcxZgMp_-DyA6o/edit#gid=1525102038">Canonical Artwork Library</a></nav><input id="q" type="search" placeholder="Search place, artist, medium or tag" aria-label="Search landscapes"><select id="group" aria-label="Landscape collection"><option value="">All collections</option></select><p id="status" role="status"></p></header><div id="grid"></div></main><script src="./data/landscape-import.20260929.js?v=landscapes1"></script><script>
const data=window.ODYSSEY_LANDSCAPE_IMPORT,grid=document.getElementById('grid'),q=document.getElementById('q'),group=document.getElementById('group');for(const c of data.collections){const o=document.createElement('option');o.value=c.tag;o.textContent=c.label+' ('+c.count+')';group.append(o)}
function el(tag,content,cls){const e=document.createElement(tag);if(content)e.textContent=content;if(cls)e.className=cls;return e}function render(){const term=q.value.toLowerCase().trim(),list=data.artworks.filter(a=>(!group.value||a.collectionTag===group.value)&&(!term||[a.id,a.title,a.artist,a.tags,a.medium].join(' ').toLowerCase().includes(term)));grid.replaceChildren();document.getElementById('status').textContent=list.length+' records · '+data.summary.previewImages+' acquired previews in this batch · research, not final card approval';for(const a of list){const article=el('article');article.dataset.artId=a.id;if(a.imageUrl){const im=el('img');im.loading='lazy';im.src=a.imageUrl;im.alt=a.title;article.append(im)}else article.append(el('p','Source record only — image acquisition remains unresolved.'));article.append(el('small',a.id+' · '+a.landscapeCollection),el('h2',a.title),el('p',a.artist+(a.date?' · '+a.date:'')),el('p',a.rights,'rights'),el('small',a.cropNotes));const p=el('p'),link=el('a','Source and provenance');link.href=a.source;link.target='_blank';link.rel='noopener noreferrer';p.append(link);article.append(p);grid.append(article)}}q.addEventListener('input',render);group.addEventListener('change',render);render();
</script></body></html>'''
(PUB/'landscape-library.html').write_text(page)
print(json.dumps(summary,indent=2))
