#!/usr/bin/env python3
"""Reproducible read-only baseline audit for the flavour foundation round."""
from pathlib import Path
import collections, datetime, hashlib, json, re, subprocess
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/odyssey-design-round-20260922'
OUT.mkdir(exist_ok=True,parents=True)
DATA=ROOT/'public/mtgtools/odyssey/data'
d=json.loads((DATA/'odyssey-data.json').read_text()); cards=d['cards']
def write(name,value): (OUT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def counts(cards):
 return {'physicalCards':len(cards),'rarity':dict(collections.Counter(c['rarity'] for c in cards)),
 'lands':sum('Land' in c['type'] for c in cards),'legendaryCards':sum('Legendary' in c['type'] for c in cards),
 'sagaFaces':sum('Saga' in c['type'] for c in cards),'layouts':dict(collections.Counter(c['layout'] for c in cards)),
 'legendarySignposts':sum(bool(c.get('signpostPair')) and 'Legendary' in c['type'] for c in cards)}
def common_metrics(cards):
 cs=[c for c in cards if c['rarity']=='C']; nonlands=[c for c in cs if 'Land' not in c['type']]
 patterns={'survival':r'\bSurvival\b','manifestFate':r'\bmanifest fate\b','foretell':r'\bforetell\b','escape':r'\bescape\b','constellation':r'\bconstellation\b','gift':r'\bgift\b','scry':r'\bscry\b','foodSources':r'create a Food token','graveyardText':r'graveyard|\bmill\b|\bsurveil\b'}
 out={'commonCards':len(cs),'nonlandCards':len(nonlands),'creatures':sum('Creature' in c['type'] for c in nonlands),'vehicles':sum('Vehicle' in c['type'] for c in nonlands),'enchantments':sum('Enchantment' in c['type'] for c in nonlands),'enchantmentCreatures':sum('Enchantment Creature' in c['type'] for c in nonlands)}
 out['byColor']={color:{'cards':len(g),'creatures':sum('Creature' in c['type'] for c in g),'curve':dict(sorted(collections.Counter(str(c['mv']) for c in g).items()))} for color in ['W','U','B','R','G','C'] if (g:=[c for c in nonlands if c['color']==color])}
 out['mechanics']={k:{'count':len(g),'ids':[c['id'] for c in g]} for k,p in patterns.items() if (g:=[c for c in nonlands if re.search(p,c['rules'],re.I)]) or True}
 return out
actual=counts(cards); cycles=collections.defaultdict(list)
for c in cards:
 for cid in c.get('cycleIds',[]): cycles[cid].append(c)
register=[{'id':cid,'count':len(group),'members':[{'id':c['id'],'name':c['name'],'mana':c['mana'],'rarity':c['rarity'],'type':c['type']} for c in group]} for cid,group in sorted(cycles.items())]
sheet=json.loads((OUT/'inputs/sheet-baseline.json').read_text()); rows=sheet['values']; fields={'#':'number','Name':'name','Mana Cost':'mana','MV':'mv','Color':'color','Type':'type','P/T':'pt','Rarity':'rarity','Rules / Playtest Text':'rules','Primary Art ID':'primaryArt','Flavour Story Element':'flavorStoryElement','Flavour Match /5':'flavorMatchScore','Flavour Rationale':'flavorMatchRationale'}
norm=lambda v: '' if v is None or str(v) in ['—',''] else str(v).strip()
by_num={str(c['number']):c for c in cards}; diffs=[]
for raw in rows[1:]:
 r=dict(zip(rows[0],raw+[None]*(36-len(raw)))); c=by_num[str(r['#'])]
 for h,k in fields.items():
  if norm(r.get(h))!=norm(c.get(k)):diffs.append({'id':c['id'],'field':k,'sheet':r.get(h),'repo':c.get(k)})
notes=json.loads((OUT/'inputs/notes-baseline.json').read_text())
open_notes=[n for n in notes['notes'] if n['status']=='OPEN']
retrieval=json.loads((OUT/'inputs/retrieval-metadata.json').read_text())
canonical=hashlib.sha256(json.dumps(d,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
write('baseline.json',{'retrievedAt':retrieval['retrievedAt'],'auditGeneratedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'commit':retrieval['baselineCommit'],'release':json.loads((DATA/'release.json').read_text())['version'],'datasetVersion':d['datasetVersion'],'datasetSha256':hashlib.sha256((DATA/'odyssey-data.json').read_bytes()).hexdigest(),'liveMatchesRepository':canonical==retrieval['liveCanonicalSha256'],'sheet':d['sources']['cardFile'],'sheetRows':len(rows)-1,'comparedFields':fields,'normalizedSheetDifferences':diffs,'actual':actual,'commonMetrics':common_metrics(cards),'openNotes':open_notes})
write('cycle-register.json',register)
editorial_path=OUT/'inputs/editorial-register.json'
editorial=json.loads(editorial_path.read_text()) if editorial_path.exists() else {'cards':{}}
editorial_cards=editorial.get('cards',{})
quote_rows=[]
for c in cards:
 e=editorial_cards.get(c['id'],{}).get('flavour',{})
 if e.get('status')=='candidate-verified':
  quote_rows.append({'id':c['id'],'name':c['name'],'status':'candidate-verified','reason':'A source-verified quotation candidate exists; final selection remains pending mechanics and layout.','candidate':e.get('candidate'),'finalSelection':'pending-mechanics-and-layout'})
 elif e.get('status')=='no-direct-quote-selected':
  quote_rows.append({'id':c['id'],'name':c['name'],'status':'no-direct-quote-selected','reason':e.get('rationale',''),'candidate':None,'finalSelection':'pending-mechanics-and-layout'})
 else:
  quote_rows.append({'id':c['id'],'name':c['name'],'status':'missing','reason':'No dedicated flavour-text value is present in the current card record. Story element and rationale are design commentary, not quotations.','candidate':None,'finalSelection':'pending-mechanics-and-layout'})
write('quotation-audit.json',{'schema':'odyssey-quotation-audit/v1','scope':'Published card records and authoring columns; artwork text and old external documents are not audited quotations.','cards':quote_rows,'summary':{'totalCards':len(quote_rows),'verifiedCandidates':sum(r['status']=='candidate-verified' for r in quote_rows),'noDirectQuoteSelected':sum(r['status']=='no-direct-quote-selected' for r in quote_rows),'pending':sum(r['status']=='missing' for r in quote_rows),'finalSelections':0}})
print(json.dumps({'actual':actual,'sheetDifferences':len(diffs),'openNotes':len(open_notes),'common':common_metrics(cards)},indent=2))
