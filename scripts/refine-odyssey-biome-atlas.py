#!/usr/bin/env python3
"""Harden derived suggestions without changing artwork provenance or the reviewed seed choices."""
from pathlib import Path
import json,re,subprocess,csv
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'public/mtgtools/odyssey';OUT=ROOT/'biome-atlas-report';DATA=P/'data'
a=json.loads((DATA/'biome-atlas.20260929.json').read_text())
# Explicit token boundaries prevent 'landscape' matching 'cape' and 'watercolour' matching 'water'.
RULES={
'open-sea':r'\b(?:channels?|at sea|sea|ocean|seascapes?|dardanelles)\b',
'sheltered-cove':r'\b(?:harbou?rs?|coves?|bays?|ports?|gulfs?)\b',
'surf-coast':r'\b(?:waves?|surf|shipwrecks?|wrecks?|rough sea|stormy seas?)\b',
'pale-headland':r'\b(?:capes?|headlands?|scilla|scylla|coasts?|coastal|shores?|shoreline|faraglioni)\b',
'river-mouth':r'\b(?:rivers?|confluence|nile|alfeios|pineios|simois|simoes|scamander|pleistos|springs?|fountains?|waterfalls?|falls|cascades?|cascatelli)\b',
'reed-marsh':r'\b(?:marsh|marshes|reedbeds?|wetlands?|swamps?)\b',
'dark-river':r'\b(?:acheron|cocytus|styx|blackwater|dark river)\b',
'lake':r'\b(?:lakes?|pools?|stymphalia)\b',
'sea-cave':r'\b(?:water cave|sea cave|cave pool|catabothra)\b',
'dry-cave':r'\b(?:grottos?|grottoes|caves?)\b',
'olive-grove':r'\b(?:olives?|oliivimetsä)\b',
'mixed-orchard':r'\b(?:orchards?|orange gardens?|gardens?|pergolas?)\b',
'dense-wood':r'\b(?:woods?|wooded|woodland|forests?|trees?|groves?|beech)\b',
'deadwood':r'\b(?:dead tree|fallen|uprooted|roots?)\b',
'mountain-wood':r'\b(?:wooded mountain|maquis|mountain forest)\b',
'high-ridge':r'\b(?:mount|mountains?|parnassus|taygetus|ridges?|rocks?|rocky|cliffs?|pinnacles?|boulders?)\b',
'volcanic-slope':r'\b(?:etna|vesuvius|volcano|volcanic|craters?|stromboli)\b',
'volcanic-vent':r'\b(?:eruption|eruptions|lava|fumaroles?|ash)\b',
'pasture':r'\b(?:cattle|cows?|herds?|herdsmen|pastures?|shepherds?|swineherds?)\b',
'farm-plain':r'\b(?:plains?|fields?|agricultural|agriculture|farms?|campagna|valleys?|ploughman|plowman)\b',
'burial-plain':r'\b(?:tombs?|burial|tumulus|cemetery|sepulchre)\b',
'dim-meadow':r'\b(?:misty landscape|asphodel|cimmerian|moonlit landscape)\b',
'dunes':r'\b(?:dunes?|shingle|sand beach)\b',
'sky':r'\b(?:clouds?|sky|skies|sunset|sunrise|dawn|storm|thunderstorm|sunlight)\b',
'layered-panorama':r'\b(?:panorama|panoramic|view from the summit)\b'}
ORDER=['deadwood','olive-grove','mixed-orchard','volcanic-vent','volcanic-slope','sea-cave','dark-river','reed-marsh','burial-plain','dim-meadow','surf-coast','pasture','mountain-wood','dense-wood','river-mouth','sheltered-cove','lake','dry-cave','high-ridge','farm-plain','pale-headland','dunes','sky','open-sea','layered-panorama']
COLORS=dict(zip(ORDER,['BG','G','WG','BR','R','UB','UB','BG','WB','B','UR','WG','RG','G','UG','U','U','','R','W','C','C','U','U','']))
# Reuse the production delivery layer's identity checks for earlier catalogue records.
script="const fs=require('fs'),vm=require('vm');const c={console,URL};c.window=c;c.globalThis=c;vm.createContext(c);for(const f of ['data/artwork-delivery-manifest.20260925a.js','artwork-delivery.js'])vm.runInContext(fs.readFileSync('public/mtgtools/odyssey/'+f,'utf8'),c);const entries=JSON.parse(fs.readFileSync('public/mtgtools/odyssey/data/biome-atlas.20260929.json','utf8')).artworks;process.stdout.write(JSON.stringify(Object.fromEntries(entries.filter(a=>a.isLandscape&&!a.imageUrl).map(a=>{const art={id:a.artId,title:a.title,source:a.source};return [a.artId,c.OdysseyArtDelivery.full(art)];}))));"
urls=json.loads(subprocess.check_output(['node','-e',script],cwd=ROOT));resolved=0
for e in a['artworks']:
 if not e['isLandscape']:continue
 if not e['imageUrl'] and urls.get(e['artId']):
  url=urls[e['artId']];e['imageUrl']='https://kliawota.design'+url if url.startswith('/') else url;resolved+=1
  if e['review']=='Source only':e['review']='Metadata suggestion'
 if e['review'] in ('Visual fit','Visual study'):continue
 # Abstract, non-natural work can remain indexed without a fabricated physical habitat.
 title=re.sub(r'\bSaint[- ]Cloud\b','SaintCloud',e['title'],flags=re.I)
 if e['artId']=='ART-384':families=[]
 else:families=[k for k in ORDER if re.search(RULES[k],title,re.I)]
 if 'sea-cave' in families and 'dry-cave' in families:families.remove('dry-cave')
 e['biomes']=families;e['primaryColor']=COLORS[families[0]] if families else ''
 e['review']='Source only' if not e['imageUrl'] else ('Metadata suggestion' if families else 'Needs habitat review')
 e['basis']='Candidate habitats and colour inferred from bounded catalogue-title terms; visual confirmation required.' if families else 'No reliable physical habitat established from this catalogue title; retained for manual review.'
 if not e['imageUrl']:e['basis']='No direct or identity-verified delivery preview is available in this index; metadata remains provisional.'
 if e['artId']=='ART-452':e['warning']='Explicitly tropical setting: reference only, not a Mediterranean landscape.'
for p in a['profiles']:
 p['suggestedCount']=sum(e['isLandscape'] and e['primaryColor']==p['code'] and not e['reviewedFits'] and e['review']!='Source only' for e in a['artworks'])
a['summary']['classifiedLandscapes']=sum(e['isLandscape'] and bool(e['biomes']) for e in a['artworks']);a['summary']['legacyPreviewsResolved']=resolved;a['summary']['habitatTokenBoundaryRegressionTest']=True
a['notice']+=' A reviewed fit may cover one of a colour direction’s two environments; it is not proof of an exact Homeric site.'
raw=json.dumps(a,ensure_ascii=False,indent=2);(DATA/'biome-atlas.20260929.json').write_text(raw);(DATA/'biome-atlas.20260929.js').write_text('window.ODYSSEY_BIOME_ATLAS = '+raw.replace('</','<\\/')+';\n');(OUT/'payload.json').write_text(raw);(OUT/'summary.json').write_text(json.dumps(a['summary'],indent=2))
with (OUT/'artwork-index.tsv').open('w',newline='') as f:
 w=csv.writer(f,delimiter='\t');w.writerow(['Art ID','Primary colour affinity','Biome families','Assessment','Other colour studies'])
 for e in sorted(a['artworks'],key=lambda e:e['artId']):
  if e['isLandscape']:w.writerow([e['artId'],e['primaryColor'],'; '.join(e['biomes']),e['review'],'; '.join(e['studies'])])
assert not re.search(RULES['pale-headland'],'Landscape',re.I)
assert not re.search(RULES['sky'],'SaintCloud',re.I)
assert 'pale-headland' not in next(e for e in a['artworks'] if e['artId']=='ART-395')['biomes']
print(json.dumps(a['summary'],indent=2))
