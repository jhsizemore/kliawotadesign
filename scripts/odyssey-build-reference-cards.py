#!/usr/bin/env python3
"""Build editorially selected references against a checked current-card snapshot.

Scryfall supplies card facts, never the editorial judgment that a rate is good.
Every nonbasic has a reviewed pair and a card-specific comparison. Source drift
fails closed. Refreshing printings cannot silently change those selections.
"""
from __future__ import annotations
import argparse, collections, datetime as dt, gzip, hashlib, json, re, time
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'public/mtgtools/odyssey'
REPORT=Path('/tmp/odyssey-card-references')
FIELDS=('name','mana','mv','pt','type','rules','mechanics','layout','cycleIds')
UA='KliawotaOdysseyReferenceBuilder/3.0 (+https://kliawota.design/mtgtools/odyssey/)'

def fetch_json(url):
    with urlopen(Request(url,headers={'User-Agent':UA,'Accept':'application/json'}),timeout=60) as r:
        return json.load(r)

def source_card(card):
    return {k:card.get(k,'') for k in FIELDS}

def eligible(c,cutoff):
    return ('paper' in c.get('games',[]) and c.get('released_at','9999')<=cutoff
        and c.get('security_stamp')!='acorn' and c.get('border_color')!='silver'
        and not {'playtest','funny'} & set(c.get('promo_types',[]))
        and any(v in ('legal','restricted','banned') for v in c.get('legalities',{}).values())
        and c.get('layout') not in ('token','double_faced_token','emblem','art_series','scheme','vanguard','planar'))

def scry_row(c):
    faces=c.get('card_faces') or []
    front=faces[0] if faces else c
    images=c.get('image_uris') or front.get('image_uris') or {}
    return {'id':c['id'],'oracleId':c.get('oracle_id',''),'name':c['name'],
        'manaCost':front.get('mana_cost',''),'manaValue':c.get('cmc',0),
        'type':c.get('type_line',''),'oracleText':c.get('oracle_text') or '\n//\n'.join(f.get('name','')+'\n'+f.get('oracle_text','') for f in faces),
        'power':front.get('power',''),'toughness':front.get('toughness',''),
        'colors':front.get('colors',c.get('colors',[])),'colorIdentity':c.get('color_identity',[]),
        'keywords':c.get('keywords',[]),'rarity':c.get('rarity',''),'set':c.get('set',''),
        'setName':c.get('set_name',''),'collectorNumber':c.get('collector_number',''),
        'releasedAt':c.get('released_at',''),'scryfallUri':c.get('scryfall_uri',''),
        'images':{k:images[k] for k in ('small','normal','large','png','art_crop') if k in images},
        'layout':c.get('layout','normal'),
        'faces':[{'name':f.get('name',''),'manaCost':f.get('mana_cost',''),'type':f.get('type_line',''),
            'oracleText':f.get('oracle_text',''),'power':f.get('power',''),'toughness':f.get('toughness',''),
            'images':f.get('image_uris',{})} for f in faces]}

def technology(c):
    """Whole-word mechanic checks; all relevant mechanics survive independently."""
    text=(c.get('rules','')+' '+c.get('mechanics','')).lower()
    mana=c.get('mana','');typ=c.get('type','')
    result=[]
    def add(name,note):result.append((name,note))
    if 'quest counter' in text:
        add("Last Light of Durin's Day",'Modern quest-counter progression: compare the qualifying action, number of turns and conversion of counters into a payoff.')
        quests={'W':'Quest for the Holy Relic','U':'Quest for Ancient Secrets','B':'Quest for the Gravelord','R':'Quest for Pure Flame','G':'Quest for Renewal'}
        col=next((x for x in 'WUBRG' if x in mana),'U')
        add(quests[col],'Original Zendikar Quest family: compare completion threshold, immediate versus deferred payoff and whether the enchantment remains afterwards.')
    if 'survival' in text:
        add('Glimmer Seeker' if 'W' in mana else 'Kona, Rescue Beastie','Survival checks the tapped condition at the beginning of the second main phase; untap timing and repeatability are central to the rate.')
    if 'ordeal' in c.get('name','').lower() and 'Aura' in typ:
        god={'W':'Heliod','U':'Thassa','B':'Erebos','R':'Purphoros','G':'Nylea'}
        col=next((x for x in 'WUBRG' if x in mana),'U')
        add('Ordeal of '+god[col],'Matching-color Theros Ordeal: compare three +1/+1 counters, who sacrifices the Aura and the actual sacrifice reward. Survival changes the enabling action.')
    if 'manifest fate' in text:
        add('Whisperwood Elemental','Manifest precedent: a face-down 2/2 and face-up conversion. Manifest Fate selects from two and exiles the other; it is not mechanically identical to manifest or manifest dread.')
        add('Hauntwoods Shrieker','Manifest dread / face-down engine: the unused card goes to the graveyard rather than exile, so graveyard and exile synergies differ.')
    rules=[(r'\bheroic\b','Favored Hoplite','Targeted-spell trigger, counter growth and damage-prevention wording.'),
        (r'\bconstellation\b','Eidolon of Blossoms','Enchantment-entry trigger wording and enchantment-density payoff.'),
        (r'\bstrive\b',"Ajani's Presence",'Additional per-target payment, target count and resolving for remaining legal targets.'),
        (r'\bforetell\b','Saw It Coming','Paying to foretell and later casting from exile are separate costs and actions.'),
        (r'\bmonstrosity\b','Polukranos, World Eater','Monstrous status, one-time counter addition and the follow-up trigger.'),
        (r'\bgift a food\b','Crumb and Get It','Gift is promised while casting; compare the opponent Food payment and conditional upgraded effect.'),
        (r'\bstorm\b','Grapeshot','Spell-copy counting and how much additional scaling the card can sustain.'),
        (r'\bflashback\b','Think Twice','Graveyard casting payment and the exile replacement after using flashback.')]
    for pattern,name,note in rules:
        if re.search(pattern,text):add(name,note)
    if 'God' in typ and ('devotion' in text or 'mana symbols' in text):
        add('Iroas, God of Victory','Two-color devotion God technology: indestructibility persists when the permanent is not a creature; the seven-symbol threshold is a deck-building restriction.')
    if 'Saga' in typ:
        add('The Eldest Reborn','Saga chapter timing, lore counters and sacrifice after the final chapter. Compare each chapter separately from the aggregate mana rate.')
        if '/' in mana:add('Dramatic Finale','Hybrid access precedent only: each possible single-color payment must justify the whole effect package. This is not a Saga-cost benchmark.')
    if c.get('layout')=='prepare' or '//Prep//' in c.get('rules',''):
        add('Emeritus of Ideation','Actual Prepare technology, including both spell and creature faces and the recharge condition; Adventure is not interchangeable with Prepare.')
    if 'Adventure' in c.get('rules','') or c.get('layout')=='adventure':
        if 'Land' in typ:
            names={'W':'Ishgard, the Holy See','U':'Jidoor, Aristocratic Capital','B':'Midgar, City of Mako','R':'Lindblum, Industrial Regency','G':'Zanarkand, Ancient Metropolis'}
            col=next((x for x in 'WUBRG' if re.search(r'Add \{'+x+r'\}',c.get('rules',''))),'U')
            add(names[col],'FINAL FANTASY Adventure-land structure. Price the spell half separately; the front is a land with no mana cost, and playing it later uses a land play.')
            if 'Enchantment Land' in typ:add('Urza\'s Saga','Enchantment-land card-type precedent only; enchantment synergies and vulnerability apply without paying a spell mana cost.')
        else:add('Bonecrusher Giant','Adventure spell plus a separately cast permanent from exile; compare both costs and the retained card value.')
    # Test is a custom design pattern, not a keyword printed on arbitrary cards.
    if re.search(r'\btest\b',c.get('mechanics','').lower()) or re.search(r'\btest\b',c.get('name','').lower()):
        add('Gaea\'s Gift','Conditional combat/protection design comparison. Test is an Odyssey design pattern, not a printed MTG keyword.')
    return result

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--bulk-file');parser.add_argument('--bulk-meta');args=parser.parse_args()
    REPORT.mkdir(parents=True,exist_ok=True)
    data=json.loads((APP/'data/odyssey-data.json').read_text())
    policy=json.loads((ROOT/'scripts/odyssey-reference-policy.json').read_text())
    for c in data['cards']:
        if 'Basic Land' not in c['type']:
            p=policy['cards'].get(c['id'])
            if not p or p['source']!=source_card(c):raise RuntimeError('Reassess reference policy for changed/missing card '+c['id'])
    listing=json.loads(Path(args.bulk_meta).read_text()) if args.bulk_meta else fetch_json('https://api.scryfall.com/bulk-data')
    meta=next(x for x in listing['data'] if x['type']=='oracle_cards')
    uri=meta.get('jsonl_download_uri') or meta.get('download_uri')
    bulk=Path(args.bulk_file) if args.bulk_file else REPORT/('oracle-cards.jsonl.gz' if uri.endswith('.gz') else 'oracle-cards.json')
    if not args.bulk_file:
        with urlopen(Request(uri,headers={'User-Agent':UA}),timeout=120) as response,bulk.open('wb') as f:
            while chunk:=response.read(1024*1024):f.write(chunk)
    cutoff=dt.datetime.now(dt.timezone.utc).date().isoformat()
    if bulk.suffix=='.gz':
        with gzip.open(bulk,'rt') as f:raw=[json.loads(x) for x in f if x.strip()]
    else:raw=json.loads(bulk.read_text())
    all_names={};by_name={};fallback={}
    for c in raw:

        if c.get('layout') in ('art_series','token','double_faced_token','emblem') or not c.get('oracle_id'):continue
        names=[c['name']]+[f['name'] for f in c.get('card_faces',[])[:1]]
        for n in names:
            all_names[n.casefold()]=c
            if eligible(c,cutoff):by_name[n.casefold()]=c
    def find(name):
        key=name.casefold()
        if key in by_name:return by_name[key]
        cache=REPORT/('printing-'+hashlib.sha256(key.encode()).hexdigest()[:16]+'.json')
        if cache.exists():
            cached=json.loads(cache.read_text())
            if eligible(cached,cutoff):by_name[key]=cached;return cached
        # Oracle bulk chooses one printing, which can be a forthcoming reprint.
        # Fetch a released printing of the SAME identity, never substitute a name.
        if key not in all_names:raise RuntimeError('Unknown selected reference '+name)
        original=all_names[key]
        if 'playtest' in original.get('promo_types',[]):raise RuntimeError('Playtest reference forbidden: '+name)
        q='!"'+original['name']+'" game:paper date<='+cutoff
        print('Resolve released printing: '+name,flush=True)
        results=fetch_json('https://api.scryfall.com/cards/search?q='+quote(q)+'&unique=prints&order=released&dir=desc')['data']
        c=next((x for x in results if x.get('oracle_id')==original.get('oracle_id') and eligible(x,cutoff)),None)
        if not c:raise RuntimeError('No eligible released printing for '+name)
        cache.write_text(json.dumps(c))
        by_name[key]=c;fallback[name]={'id':c['id'],'releasedAt':c['released_at']};time.sleep(.12)
        return c
    entries={};changes=[]
    old=json.loads((APP/'data/card-references.json').read_text())
    for c in data['cards']:
        refs=[];by_oracle={}
        def add(role,name,note):
            s=find(name);key=s.get('oracle_id',s['id'])
            if key in by_oracle:
                r=by_oracle[key]
                if role not in r['roles']:r['roles'].append(role)
                r['notes'].append({'role':role,'text':note});return
            row=scry_row(s)
            if not row['images']:raise RuntimeError('Missing image '+name)
            r={'role':role,'roles':[role],'score':1,'selection':'editorial','annotation':note,
                'notes':[{'role':role,'text':note}],'sharedMechanics':[],'sharedPatterns':[],'card':row}
            by_oracle[key]=r;refs.append(r)
        src=source_card(c)
        if 'Basic Land' in c['type']:
            name=re.search(r'—\s*(Plains|Island|Swamp|Mountain|Forest|Wastes)',c['type']).group(1)
            add('identity',name,'Oracle identity: the exact basic-land subtype, including renamed landmark treatments.')
        else:
            p=policy['cards'][c['id']]
            for role,label in [('best','Best-rate benchmark'),('normal','Normal-rate benchmark')]:
                s=find(p[role]);f=(s.get('card_faces') or [s])[0]
                pt='/'.join([str(f.get('power','')),str(f.get('toughness',''))]).strip('/')
                facts='Printed front: '+(f.get('mana_cost') or 'no mana cost')+(', '+pt if pt else '')+'. Odyssey: '+(c['mana'] or 'land')+(', '+c['pt'] if c.get('pt') else '')+'. '
                note=label+': '+facts+p['comparison']
                note+=' '+('Selected strong comparison for the stated component; not a claim of a universal maximum or an exact whole-card equivalent.' if role=='best' else 'Baseline for the stated component; use the printed conditions, speed and extra costs, not rarity alone.')
                add('rate-'+role,p[role],note)
            identity=c.get('underlyingName') or (c['name'] if 'reprint' in c.get('originFull','').lower() or c.get('origin')=='RPR' else '')
            if identity and identity.casefold() in all_names:add('identity',identity,'Oracle identity: printed underlying card for this reprint/reskin; preserve the exact identity separately from design comparisons.')
            for name,note in technology(c):add('tech',name,'Mechanic / set-tech precedent: '+note)
            for spin in p.get('spins',[]):add('buildaround',spin['name'],'Build-around / interesting spin: '+spin['note'])
        digest=hashlib.sha256(json.dumps(src,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
        entries[c['id']]={'id':c['id'],'number':c['number'],'name':c['name'],'sourceCard':src,'sourceFingerprint':digest,
            'assessment':'Editorial component comparisons; card facts verified against Scryfall. Balance still requires playtesting.',
            'references':refs}
        previous=old.get('cards',{}).get(c['id'],{})
        changes.append({'id':c['id'],'name':c['name'],'before':[{'name':r['card']['name'],'roles':r.get('roles',[r['role']])} for r in previous.get('references',[])],
            'after':[{'name':r['card']['name'],'roles':r['roles']} for r in refs]})
    payload={'schema':'odyssey-reference-cards/v2','policyRevision':policy['revision'],'generatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),
        'datasetVersion':data['datasetVersion'],'scryfallBulk':{'type':meta['type'],'updatedAt':meta['updated_at'],'downloadUri':uri,'releasedOnOrBefore':cutoff},
        'method':'Explicit current-text component benchmarks and mechanic/cycle/build-around selections; no lexical ranking or rarity proxy for power.',
        'totalCards':len(entries),'cards':entries}
    text=json.dumps(payload,ensure_ascii=False,separators=(',',':'))
    (APP/'data/card-references.json').write_text(text+'\n');(APP/'data/card-references.js').write_text('window.ODYSSEY_CARD_REFERENCES='+text+';\n')
    summary={'policyRevision':policy['revision'],'cards':len(entries),'nonbasicRatePairs':len(policy['cards']),'references':sum(len(e['references']) for e in entries.values()),
        'roleCounts':dict(collections.Counter(role for e in entries.values() for r in e['references'] for role in r['roles'])),
        'maxRefs':max(len(e['references']) for e in entries.values()),'releasedPrintingFallbacks':fallback,'changes':changes}
    (APP/'data/reference-refresh-audit.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
    (REPORT/'summary.json').write_text(json.dumps({k:v for k,v in summary.items() if k!='changes'},indent=2))
    print(json.dumps({k:v for k,v in summary.items() if k not in ('changes','releasedPrintingFallbacks')},indent=2))

if __name__=='__main__':main()
