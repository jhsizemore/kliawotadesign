#!/usr/bin/env python3
"""Initial high-confidence Oracle templating pass for original Odyssey cards.

Scope is deliberately conservative:
- wording/grammar/Oracle presentation only;
- no mana costs, stats, targets, quantities, timings or card roles are redesigned;
- reprints and Basic Lands are untouched;
- each changed rule is recorded with Scryfall-reference evidence when available.
"""
from pathlib import Path
import hashlib,json,re,time
ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'public/mtgtools/odyssey'
DATA=APP/'data'
VERSION='2026-09-19.4'
REVISION='templating-v1'
read=lambda f:json.loads((DATA/f).read_text())
current=read('odyssey-data.json');candidate=read('odyssey-analysis-candidate-v1.json');refs=read('card-references.json')
assert current['datasetVersion']=='2026-09-19.3',current['datasetVersion']
assert current['cards']==candidate['cards'],'Candidate and Current must agree before a templating release'
before=json.loads(json.dumps(current['cards']))
by_num={c['number']:c for c in current['cards']}
ref_by_id=refs.get('cards',{})
changes=[]

SKIP_AUTHORING_ROWS={146}
def original(c):
    return c.get('number') not in SKIP_AUTHORING_ROWS and str(c.get('originFull','New')).lower()=='new' and str(c.get('origin','')).upper()!='RPR' and 'Basic Land' not in c.get('type','')

def ref_evidence(c):
    rows=ref_by_id.get(c['id'],{}).get('references',[])
    return [{'name':r['card']['name'],'role':r['role'],'oracleText':r['card'].get('oracleText',''),'scryfallUri':r['card'].get('scryfallUri','')} for r in rows[:3]]

def apply(c,new,reason):
    old=c['rules']
    if new==old:return
    old_words=c.get('functionalWords')
    old_status=c.get('changeStatus','')
    c['rules']=new
    c['functionalWords']=max(0,int(old_words or len(old.split()))+len(new.split())-len(old.split()))
    if REVISION not in old_status:c['changeStatus']=(old_status+' · '+REVISION).strip(' ·')
    changes.append({'id':c['id'],'number':c['number'],'name':c['name'],'before':old,'after':new,'functionalWordsBefore':old_words,'functionalWordsAfter':c['functionalWords'],'changeStatusBefore':old_status,'changeStatusAfter':c.get('changeStatus',''),'reason':reason,'references':ref_evidence(c)})

def modern_self_reference(c,text):
    name=re.escape(c['name'])
    typ=c.get('type','')
    if 'Legendary' in typ:return text,[]
    reasons=[]
    noun=None
    if re.search(r'\bVehicle\b',typ):noun='Vehicle'
    elif re.search(r'\bCreature\b',typ):noun='creature'
    elif re.search(r'\bLand\b',typ):noun='land'
    elif re.search(r'\bEnchantment\b',typ):noun='enchantment'
    elif re.search(r'\bArtifact\b',typ):noun='artifact'
    if not noun:return text,reasons
    patterns=[
      (rf'\bWhen {name} enters\b',f'When this {noun} enters'),
      (rf'\bWhenever {name} enters\b',f'Whenever this {noun} enters'),
      (rf'\bWhen {name} dies\b',f'When this {noun} dies'),
      (rf'\bWhenever {name} dies\b',f'Whenever this {noun} dies'),
      (rf'\bWhenever {name} attacks\b',f'Whenever this {noun} attacks'),
      (rf'\bWhen {name} attacks\b',f'When this {noun} attacks'),
      (rf'\bif {name} is tapped\b',f'if this {noun} is tapped'),
      (rf'\bIf {name} is tapped\b',f'If this {noun} is tapped'),
      (rf'\b{name} enters tapped\b',f'This {noun} enters tapped'),
      (rf'\bSacrifice {name}\b',f'Sacrifice this {noun}'),
      (rf'\b{name} gets\b',f'this {noun} gets'),
      (rf'\b{name} gains\b',f'this {noun} gains'),
      (rf'\b{name} has\b',f'this {noun} has'),
      (rf'\b{name} deals\b',f'this {noun} deals'),
      (rf'\buntil {name} leaves the battlefield\b',f'until this {noun} leaves the battlefield'),
      (rf'\bWhen {name} leaves the battlefield\b',f'When this {noun} leaves the battlefield'),
      (rf'\bWhenever {name} leaves the battlefield\b',f'Whenever this {noun} leaves the battlefield'),
      (rf'\bfought {name} this way\b',f'fought this {noun} this way'),
      (rf'\bcrewed {name} this turn\b',f'crewed this {noun} this turn'),
    ]
    for pat,repl in patterns:
        text,n=re.subn(pat,repl,text)
        if n:reasons.append('modern nonlegendary self-reference')
    counter_pat=rf'\bput ((?:a|an|one|two|three|four|five|six|seven|eight|nine|ten|\d+|X) [^,.]*?counter(?:s)?) on {name}\b'
    text,n=re.subn(counter_pat,lambda m:f'put {m.group(1)} on this {noun}',text)
    if n:reasons.append('modern nonlegendary self-reference')
    return text,reasons

for c in current['cards']:
    if not original(c):continue
    old=c.get('rules','')
    if not old:continue
    text=old
    reasons=[]

    # 2024+ Oracle wording: "enters", not "enters the battlefield", when referring to the event.
    text,n=re.subn(r'\benters the battlefield\b','enters',text)
    if n:reasons.append('current Oracle “enters” wording')
    text,n=re.subn(r'\bentered the battlefield\b','entered',text)
    if n:reasons.append('current Oracle “entered” wording')

    # Current "under your control" event ordering.
    for permanent in ['creature','artifact','enchantment','land','permanent']:
        pat=rf'\bWhenever (an?|another) {permanent} enters under your control\b'
        repl=lambda m:f'Whenever {m.group(1)} {permanent} you control enters'
        text,n=re.subn(pat,repl,text)
        if n:reasons.append('current enters-under-your-control word order')
        pat=rf'\bWhen (an?|another) {permanent} enters under your control\b'
        repl=lambda m:f'When {m.group(1)} {permanent} you control enters'
        text,n=re.subn(pat,repl,text)
        if n:reasons.append('current enters-under-your-control word order')
        pat=rf'\bWhenever one or more {permanent}s enter under your control\b'
        text,n=re.subn(pat,f'Whenever one or more {permanent}s you control enter',text)
        if n:reasons.append('current enters-under-your-control word order')

    # Modern contraction used by Oracle God text.
    text,n=re.subn(r'\bis not a creature\b',"isn't a creature",text)
    if n:reasons.append('current God Oracle wording')

    # Standardized frequency and activation clauses.
    text,n=re.subn(r'This ability triggers only once per turn\.', 'This ability triggers only once each turn.', text)
    if n:reasons.append('standard once-each-turn wording')
    text,n=re.subn(r'Activate this ability only as a sorcery\.', 'Activate only as a sorcery.', text)
    if n:reasons.append('current activation wording')
    text,n=re.subn(r'Activate this ability only any time you could cast a sorcery\.', 'Activate only as a sorcery.', text)
    if n:reasons.append('current activation wording')
    text,n=re.subn(r'\buntil the end of turn\b','until end of turn',text)
    if n:reasons.append('current duration wording')

    text,self_reasons=modern_self_reference(c,text);reasons+=self_reasons

    # High-confidence card-specific fixes surfaced by the reference audit.
    if c['number']==2:
        new=text.replace('put a +1/+1 counter on him.','put a +1/+1 counter on Telemachus.')
        if new!=text:reasons.append('rules text avoids gendered pronoun; Heroic self-reference follows Oracle convention')
        text=new
    if c['number']==4:
        target='Constellation — Whenever an enchantment you control enters, if this is the first time this ability resolved this turn, create a 1/1 white Human creature token.'
        alt='Constellation — Whenever an enchantment enters under your control, if this is the first time this ability resolved this turn, create a 1/1 white Human creature token.'
        if text in (target,alt):
            text='Constellation — Whenever an enchantment you control enters, create a 1/1 white Human creature token. This ability triggers only once each turn.'
            reasons.append('replace resolution-history condition with standard trigger-frequency guardrail')
    if re.match(r'^Deathtouch\. Once each turn, when one or more permanent cards leave your graveyard,',text):
        text=text.replace('Deathtouch. Once each turn, when one or more permanent cards leave your graveyard, you may return a land card from your graveyard to the battlefield tapped.',
                          'Deathtouch. Whenever one or more permanent cards leave your graveyard, you may return a land card from your graveyard to the battlefield tapped. This ability triggers only once each turn.')
        reasons.append('move once-per-turn restriction to standard triggered-ability guardrail')
    if c['number']==303:
        target='Until end of turn, you may play that card, and you may spend mana as though it were mana of any color to cast it.'
        if target in text:
            text=text.replace(target,'Until end of turn, you may play that card. You may spend mana as though it were mana of any color to cast that spell.')
            reasons.append('separate play permission from colored-mana casting permission')
    if c['number']==239:
        target='Once each turn, whenever a permanent card enters under your control from your graveyard or from exile, put a root counter on The Olive Tree of Ithaca. Permanents you control with counters on them have ward 1.'
        if target in text:
            text=text.replace(target,'Whenever a permanent you control enters from your graveyard or from exile, put a root counter on The Olive Tree of Ithaca. This ability triggers only once each turn. Permanents you control with counters on them have ward {1}.')
            reasons.append('standard zone-change trigger, once-each-turn guardrail, and encoded ward cost')


    # Do not record formatting-only churn where normalization ended unchanged.
    if text!=old:apply(c,text,'; '.join(dict.fromkeys(reasons)) or 'Oracle wording normalization')

# Candidate receives exactly the same templated cards.
candidate['cards']=json.loads(json.dumps(current['cards']))
changed_numbers={x['number'] for x in changes}

# Hard safety: only rules, functionalWords and changeStatus may change on affected cards.
old_by_num={c['number']:c for c in before}
for c in current['cards']:
    o=old_by_num[c['number']]
    for key in set(o)|set(c):
        if key in {'rules','functionalWords','changeStatus'}:continue
        assert c.get(key)==o.get(key),(c['number'],key,o.get(key),c.get(key))
    if c['number'] not in changed_numbers:
        assert c==o,('unexpected untouched-card mutation',c['number'])
for o,c in zip(before,current['cards']):
    if not original(o):assert c['rules']==o['rules'],('reprint/basic changed',c['number'])

# Update integrity and release identity.
def hash_cards(cards):
    return hashlib.sha256(json.dumps(cards,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
for d in (current,candidate):
    if d is current:d['datasetVersion']=VERSION
    else:d['candidate']['productionDatasetVersion']=VERSION
    d['generatedAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
    d['integrity']['sha256']=hash_cards(d['cards'])
    d['integrity']['templatingRevision']=REVISION
    d['templating']={'revision':REVISION,'changedCards':len(changes),'scope':'high-confidence Oracle wording only; no balance redesign','report':'data/templating-report.json'}
    if 'release' in d:d['release'].update(version=VERSION,appRevision=REVISION)

write=lambda f,d:(DATA/f).write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
write('odyssey-data.json',current);write('odyssey-analysis-candidate-v1.json',candidate)
(DATA/'odyssey-data.js').write_text('window.ODYSSEY_DATA='+json.dumps(current,ensure_ascii=False,separators=(',',':'))+';\n')
report={'schema':'odyssey-templating-report/v1','revision':REVISION,'version':VERSION,'changedCards':len(changes),'changes':changes,'scryfallBulkUpdatedAt':refs.get('scryfallBulk',{}).get('updatedAt')}
write('templating-report.json',report)
release=read('release.json');release.update(version=VERSION,appRevision=REVISION,cardsSha256=current['integrity']['sha256'],templating={'revision':REVISION,'changedCards':len(changes),'report':'data/templating-report.json','scryfallBulkUpdatedAt':report['scryfallBulkUpdatedAt']});write('release.json',release)

# Cache-bust the two structured datasets, preserving all local override keys.
app=APP/'app.html';s=app.read_text().replace('odyssey-data.js?v=20260919-live3','odyssey-data.js?v=20260919-live4').replace('odyssey-analysis-candidate-v1.json?v=20260919-refinement','odyssey-analysis-candidate-v1.json?v=20260919-templating1');app.write_text(s)
idx=APP/'index.html';s=idx.read_text().replace('app.html?v=20260919-20','app.html?v=20260919-21');idx.write_text(s)
pol=APP/'studio-polish.js';s=pol.read_text().replace('v3.22 · card references','v3.23 · templating pass');pol.write_text(s)
print(json.dumps({'version':VERSION,'revision':REVISION,'changedCards':len(changes),'numbers':sorted(changed_numbers)},indent=2))
