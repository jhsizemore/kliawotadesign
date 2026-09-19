#!/usr/bin/env python3
"""Prune obscure-reference designs into explicit empty slots and recast Calchas."""
from pathlib import Path
import hashlib,json,time
ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'public/mtgtools/odyssey';DATA=APP/'data'
VERSION='2026-09-20.1';REV='empty-slot-collection-v1'
CUT_NUMBERS=[11,17,32,59,93,112,115,274,277,278,280,281,282,289,290,291,295,297,302,307]
KEEP_NUMBERS=[3,13,15,47,66,141,148,151,167,178,296]
UNNUMBERED_CUTS=["Mixing Bowl of Polyxenus","Iphthime's Dream-Image","Ctesippus, Mocking Host","Peisistratus, Pylian Companion"]
read=lambda f:json.loads((DATA/f).read_text())
current=read('odyssey-data.json');candidate=read('odyssey-analysis-candidate-v1.json')
assert current['datasetVersion']=='2026-09-19.4',current['datasetVersion']
assert current['cards']==candidate['cards']
before=json.loads(json.dumps(current['cards']));by={c['number']:c for c in current['cards']}
archive=[]
for n in CUT_NUMBERS:
    c=by[n]
    archive.append({'number':n,'id':c['id'],'name':c['name'],'rarity':c['rarity'],'color':c.get('color',''),'manaValue':c.get('mv'),'type':c.get('type',''),'rules':c.get('rules',''),'artId':c.get('primaryArt') or c.get('artId') or '','reason':'Obscure-reference pruning: freed for a new design slot.'})
    c['status']='CUT'
    c['slotState']='EMPTY'
    c['replacementNeeded']=True
    c['cutReason']=REV
    c['formerDesignName']=c['name']
    c['changeStatus']=(c.get('changeStatus','')+' · '+REV).strip(' ·')

# Calchas is retained but fully recast around the nine-bird omen.
cal=by[15]
cal.update({
    'mana':'{4}{W}{U}','mv':6,'color':'WU','frame':'M','rarity':'R',
    'mechanics':'Scry 9 / punisher sacrifice / stun pseudo-wipe',
    'rules':'Target opponent may sacrifice up to nine permanents. Scry X, where X is nine minus the number of permanents sacrificed this way. Then choose up to X creatures and/or artifacts that player controls. Tap those permanents and put a stun counter on each of them.',
    'status':'PROTOTYPE'
})
cal['functionalWords']=len(cal['rules'].replace('{',' ').replace('}',' ').split())
cal['flavorMatchRationale']='The nine-card scry directly encodes the nine birds in the Aulis omen. The opponent may sacrifice permanents as offerings to reduce the omen, while the remaining count becomes a mass delay effect rather than a literal destruction spell.'
cal['changeStatus']=(cal.get('changeStatus','')+' · omen-boardwipe-recast-v1').strip(' ·')

for n in KEEP_NUMBERS:
    assert by[n]['status']!='CUT',n

candidate['cards']=json.loads(json.dumps(current['cards']))
empty=[{'number':x['number'],'formerName':x['name'],'rarity':x['rarity'],'color':x['color']} for x in archive]
for d in (current,candidate):
    if d is current:d['datasetVersion']=VERSION
    else:d['candidate']['productionDatasetVersion']=VERSION
    d['generatedAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
    d['emptySlots']={'revision':REV,'count':len(empty),'slots':empty,'unnumberedCuts':UNNUMBERED_CUTS}
    d['integrity']['sha256']=hashlib.sha256(json.dumps(d['cards'],ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
    d['integrity']['emptySlotRevision']=REV
    if 'release' in d:d['release'].update(version=VERSION,appRevision=REV)

write=lambda f,d:(DATA/f).write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
write('odyssey-data.json',current);write('odyssey-analysis-candidate-v1.json',candidate)
(DATA/'odyssey-data.js').write_text('window.ODYSSEY_DATA='+json.dumps(current,ensure_ascii=False,separators=(',',':'))+';\n')
report={'schema':'odyssey-empty-slot-report/v1','revision':REV,'version':VERSION,'numberedEmptySlots':empty,'numberedCount':len(empty),'unnumberedCuts':UNNUMBERED_CUTS,'keptNumbers':KEEP_NUMBERS,'calchas':{'number':15,'mana':cal['mana'],'rarity':cal['rarity'],'color':cal['color'],'rules':cal['rules']},'archive':archive}
write('empty-slot-report.json',report)
release=read('release.json');release.update(version=VERSION,appRevision=REV,cardsSha256=current['integrity']['sha256'],emptySlots={'count':len(empty),'report':'data/empty-slot-report.json'},calchasRecast='omen-boardwipe-recast-v1');write('release.json',release)
app=APP/'app.html';s=app.read_text().replace('odyssey-data.js?v=20260919-live4','odyssey-data.js?v=20260920-empty1').replace('odyssey-analysis-candidate-v1.json?v=20260919-templating1','odyssey-analysis-candidate-v1.json?v=20260920-empty1');app.write_text(s)
idx=APP/'index.html';s=idx.read_text().replace('app.html?v=20260919-21','app.html?v=20260920-22');idx.write_text(s)
pol=APP/'studio-polish.js';s=pol.read_text().replace('v3.23 · templating pass','v3.24 · empty slots');pol.write_text(s)
print(json.dumps({'version':VERSION,'emptySlots':len(empty),'cutNumbers':CUT_NUMBERS,'kept':KEEP_NUMBERS,'calchas':report['calchas']},indent=2))
