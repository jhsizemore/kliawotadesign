#!/usr/bin/env python3
"""Publish the inspected round-two selection. Existing cards, artwork and crops are unchanged."""
from pathlib import Path
from collections import Counter
import json,hashlib,shutil,re,csv,subprocess
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];IN=ROOT/'landscape-round2';PUB=ROOT/'public/mtgtools/odyssey';DATA=PUB/'data';OUT=ROOT/'landscape-round2-publication';OUT.mkdir(exist_ok=True)
records=json.loads((IN/'records.json').read_text());assert len(records)==48
excluded={14:'Temple dominates rather than landscape',21:'Temple columns dominate rather than landscape',25:'Built tombs dominate the immediate foreground',35:'Roman aqueduct dominates; not a natural landscape',39:'Later village dominates; printed prose intrudes',41:'Temple study rather than landscape',42:'Christian monastery dominates foreground',47:'Sculpted relief, not a landscape'}
selected=[r for r in records if r.get('imageDecoded') and int(r['reviewId'][3:]) not in excluded];assert len(selected)==37
pfile=DATA/'landscape-import.20260929.json';payload=json.loads(pfile.read_text());assert payload['summary']['totalLibrary']==836,'Baseline changed; reconcile before publication'
old=json.loads(json.dumps(payload));(OUT/'baseline-payload.json').write_text(json.dumps(old,ensure_ascii=False))
keys=['id','tags','title','artist','date','period','medium','institution','objectId','rights','source','credit','matchType','heroScore','candidateCards','cropNotes','status','imageUrl','imageWidth','imageHeight','imageChecked']
new=[];existing_sources={a['source'].replace('/en/art/','/art/').rstrip('/') for a in payload['artworks']}
base=json.loads((DATA/'odyssey-data.json').read_text());existing_sources.update(a.get('source','').replace('/en/art/','/art/').rstrip('/') for a in base.get('artworks',[]))
for idx,r in enumerate(selected,837):
 source=r['source'];assert source.replace('/en/art/','/art/').rstrip('/') not in existing_sources,source;existing_sources.add(source)
 n=int(r['reviewId'][3:]);aid='ART-'+str(idx);title=r['title'];date=r['date'];artist=r['artist'];medium=r['medium'];institution=r['institution']
 if r['collection'].startswith('Stackelberg'):
  date='1830 (publication)';group='Stackelberg — Greek landscapes';ctag='collectionstackelberg';credit='Art: after Otto Magnus von Stackelberg · La Grèce (1830)';bibliography='La Grèce. Vues Pittoresques et Topographiques (1830)'
 elif r['collection'].startswith('Wordsworth'):
  date='1882 (edition)';artist='Unidentified illustrator (Wordsworth, Greece, 1882)';group='Wordsworth — Greek landscapes';ctag='collectionwordsworth';credit='Art: unidentified illustrator · Wordsworth, Greece (1882)';bibliography='Greece Pictorial, Descriptive, & Historical (1882 edition)'
 elif n==4:
  group='Lear — Southern Calabria';ctag='collectionlearcalabria';credit='Art: Edward Lear · Journals, Southern Calabria (1852)';bibliography='Journals of a Landscape Painter in Southern Calabria (1852)'
 else:
  group='Lear — original museum landscapes';ctag='collectionlearmuseum';credit='Art: Edward Lear · The Met';bibliography='Metropolitan Museum of Art collection'
 tags=['landscape','import20260929','landscaperound2',ctag];leg=[]
 for pattern,label,tag in [(r'Scilla','Scylla setting analogue','localescylla'),(r'Etna|Sciacca|Sicily','Sicily','localesicily'),(r'Sparta|Taygetus|Eurotas','Sparta','localesparta'),(r'Euboea','Euboea','localeeuboea'),(r'Parnassus','Parnassus','localeparnassus'),(r'Delphi|Pleistos','Delphi','localedelphi'),(r'Cythera','Kythera','localekythera'),(r'Sounio|Sounion','Cape Sounion','localesounion'),(r'Olympia|Alfeios','Elis','localeelis'),(r'Mycenae','Mycenae','localemycenae'),(r'Tempe|Gonnoi','Vale of Tempe','localetempe')]:
  if re.search(pattern,title,re.I):tags.extend([label,tag]);leg.append(tag)
 for pattern,tag in [(r'mount|Taygetus|Parnassus|cliff|hill','envrock'),(r'river|valley|Tempe|Pleistos','envfreshwater'),(r'coast|gulf|island|Scilla|Sciacca|Cythera','envcoast'),(r'plain|pasture|Olympia|Argolis','envplain')]:
  if re.search(pattern,title,re.I):tags.append(tag)
 note='Round 2: composition visually reviewed; final card crop and print suitability pending. Keep the actual depicted place; mythic use is an analogue. No card assignment changed.'
 if n==4:note+=' Only 500×309 pixels: reference preview, not print-ready. The Met verifies the plate; this scan is from Nonsenselit, not the Met impression.'
 elif n in [5,6]:note+=' Museum Open Access image acquired; full-resolution original URL retained in the digital record.'
 else:note+=' Supplied digitisation terms remain unverified. Check later buildings, costumes, page borders and folds.'
 if n==27:note+=' Two views on one plate: select one panel for any future card crop.'
 if n==22:note+=' Oracle of Trophonius is wider Greek sacred geography, not a claimed Odysseus visit.'
 b=(IN/r['imageFile']).read_bytes();sha=hashlib.sha256(b).hexdigest()[:12];filename=aid+'.'+sha+'.jpg';dest=PUB/'assets/landscapes'/filename;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b);w,h=Image.open(dest).size
 a=dict(id=aid,tags='; '.join(dict.fromkeys(tags)),title=title,artist=artist,date=date,period='Historical landscape study',medium=medium,institution=institution,objectId=r['objectId'],rights=r['rights'],source=source,credit=credit,matchType='Landscape / geographical or environmental reference',heroScore='',candidateCards='',cropNotes=note,status='RESEARCH',imageUrl='https://kliawota.design/mtgtools/odyssey/assets/landscapes/'+filename,imageWidth=w,imageHeight=h,imageChecked='2026-09-29',originalImageUrl=r['imageUrl'],originalImageWidth=r['sourceWidth'],originalImageHeight=r['sourceHeight'],imageSourcePage=r.get('imageSourcePage',source),metadataSource=r.get('metadataSource',source),collectionSource=r.get('collectionSource',''),bibliography=bibliography,landscapeCollection=group,collectionTag=ctag,legendaryTags='; '.join(leg),acquisitionStatus='Preview acquired; final card crop and use review pending',reviewId=r['reviewId'],importRound=2)
 new.append(a)
assert new[0]['id']=='ART-837' and new[-1]['id']=='ART-873'
payload['artworks'].extend(new);payload['version']='landscapes-20260929-v2'
for group,ctag in [(a['landscapeCollection'],a['collectionTag']) for a in new]:
 if not any(g['tag']==ctag for g in payload['collections']):payload['collections'].append({'label':group,'tag':ctag,'count':sum(a['collectionTag']==ctag for a in payload['artworks'])})
summary={'round':2,'newRecords':37,'previewImages':37,'firstNewId':'ART-837','lastNewId':'ART-873','baselineLibrary':836,'totalLibrary':873,'existingArtworkChanged':0,'cardAssignmentsChanged':0,'excludedAfterVisualReview':8,'unresolvedExistingImages':['ART-726','ART-728','ART-729'],'collections':dict(Counter(a['landscapeCollection'] for a in new))}
payload['rounds']=[{'round':1,**old['summary']},summary]
payload['summary'].update(newRecords=249,batchRecords=257,previewImages=254,totalLibrary=873,lastNewId='ART-873',latestRound=2,latestRoundNew=37)
raw=json.dumps(payload,ensure_ascii=False,indent=2);pfile.write_text(raw);(DATA/'landscape-import.20260929.js').write_text('window.ODYSSEY_LANDSCAPE_IMPORT = '+raw.replace('</','<\\/')+';\n')
audit={'summary':summary,'excluded':[{'reviewId':'R2-'+str(k).zfill(3),'reason':v,'source':records[k-1]['source']} for k,v in excluded.items()],'blocked':[{'id':r.get('existingId'),'source':r['source'],'error':r.get('error')} for r in records if not r['imageDecoded']],'review':'All four contact sheets visually inspected. Research import only; not final card-art approval.','acquisitionRun':36541143939}
(DATA/'landscape-round2-audit.20260929.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2));(OUT/'audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2));(OUT/'new-artworks.json').write_text(json.dumps(new,ensure_ascii=False,indent=2));(OUT/'rows.json').write_text(json.dumps([[a[k] for k in keys] for a in new],ensure_ascii=False,indent=2))
with (OUT/'new-artworks.tsv').open('w',newline='') as f:
 writer=csv.writer(f,delimiter='\t',quoting=csv.QUOTE_MINIMAL);writer.writerows([[a[k] for k in keys] for a in new])
# Small UI changes keep all prior collection controls and make the new round directly discoverable.
p=PUB/'landscape-library.js';js=p.read_text();assert "option('All new landscapes','import20260929');" in js
js=js.replace("option('All new landscapes','import20260929');","option('All new landscapes','import20260929');option('Round 2 — latest 37','landscaperound2');",1)
js=js.replace("const VERSION='landscapes-20260929-v1';","const VERSION='landscapes-20260929-v2';",1)
js=js.replace("setTimeout(()=>open(),250)","setTimeout(()=>open(new URLSearchParams(location.search).get('round')==='2'?'landscaperound2':'import20260929'),250)")
p.write_text(js)
p=PUB/'landscape-library.html';html=p.read_text();html=html.replace('?v=landscapes1','?v=landscapes2')
needle="q.addEventListener('input',render);group.addEventListener('change',render);render();";assert needle in html
html=html.replace(needle,"if(new URLSearchParams(location.search).get('round')==='2')q.value='landscaperound2';"+needle)
p.write_text(html)
p=PUB/'app.html';p.write_text(p.read_text().replace('?v=landscapes1','?v=landscapes2'))
# Load the actual Studio data pipeline twice to prove the old 836 records/cards/coverage are untouched.
js_test=r'''const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');const base='public/mtgtools/odyssey/';function load(p){const c={console};c.window=c;c.globalThis=c;vm.createContext(c);for(const f of ['data/odyssey-data.js','live-sheet-sync.js','live-sheet-art-patch.js'])vm.runInContext(fs.readFileSync(base+f,'utf8'),c);c.ODYSSEY_LANDSCAPE_IMPORT=p;vm.runInContext(fs.readFileSync(base+'landscape-library.js','utf8'),c);return c}const before=load(JSON.parse(fs.readFileSync('landscape-round2-publication/baseline-payload.json'))),after=load(JSON.parse(fs.readFileSync(base+'data/landscape-import.20260929.json')));assert.equal(before.ODYSSEY_DATA.artworks.length,836);assert.equal(after.ODYSSEY_DATA.artworks.length,873);assert.equal(JSON.stringify(before.ODYSSEY_DATA.cards),JSON.stringify(after.ODYSSEY_DATA.cards));assert.equal(JSON.stringify(before.ODYSSEY_DATA.coverage),JSON.stringify(after.ODYSSEY_DATA.coverage));const byId=new Map(after.ODYSSEY_DATA.artworks.map(a=>[a.id,a]));for(const a of before.ODYSSEY_DATA.artworks)assert.equal(JSON.stringify(a),JSON.stringify(byId.get(a.id)),a.id+' changed');const merged=after.OdysseyLandscapeLibrary.merge(after.ODYSSEY_DATA);assert.equal(JSON.stringify(merged.artworks),JSON.stringify(after.ODYSSEY_DATA.artworks));assert.equal(new Set(merged.artworks.map(a=>a.id)).size,873);console.log(JSON.stringify({cards:after.ODYSSEY_DATA.cards.length,artworks:873,existingArtworkUnchanged:836,cardAssignmentsChanged:0,idempotent:true}));'''
r=subprocess.run(['node','-e',js_test],check=True,capture_output=True,text=True);(OUT/'integration-test.json').write_text(r.stdout);print(r.stdout);print(json.dumps(summary))
