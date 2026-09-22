#!/usr/bin/env python3
"""Build current-card design and costing references for the complete Odyssey set from one Scryfall bulk snapshot.

The generator intentionally downloads Scryfall's Oracle Cards bulk file once rather than issuing
hundreds of API searches. It chooses up to three distinct paper cards per original Odyssey card:
a rules-template analogue, a mechanics/play-pattern analogue, and a rate/role benchmark.
Annotations are generated only from objective overlaps (rules skeleton, keywords, mana/type/rate).
"""
from __future__ import annotations
import collections, datetime as dt, gzip, hashlib, json, math, os, re, statistics, sys, time
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'public/mtgtools/odyssey'
DATA=json.loads((APP/'data/odyssey-data.json').read_text())
OUT=APP/'data/card-references.json'
OUTJS=APP/'data/card-references.js'
REPORT=Path('/tmp/odyssey-card-references')
REPORT.mkdir(parents=True,exist_ok=True)
UA='KliawotaOdysseyReferenceBuilder/1.0 (+https://kliawota.design/mtgtools/odyssey/)'
ACCEPT='application/json;q=0.9,*/*;q=0.8'
STOP=set("""the a an and or of to in on at for from with without under your you control controls controlled
this that it its they their them each one another target targets up as if when whenever while then
until end turn beginning may can can't cannot gets get gains gain have has had is are was were be
being been card cards creature creatures permanent permanents spell spells player players opponent
opponents battlefield library hand graveyard mana value color coloured colored into put puts return
returns exile exiled create creates token tokens choose chosen all any more less only first second
next other owner owners""".split())
MECH_TERMS={
'flying','reach','vigilance','flash','haste','trample','menace','lifelink','deathtouch','defender',
'indestructible','hexproof','ward','first strike','double strike','scry','surveil','mill','connive',
'cycling','landcycling','islandcycling','swampcycling','mountaincycling','forestcycling','plainscycling',
'manifest','morph','disguise','cloak','foretell','adventure','cascade','storm','prowess','heroic',
'constellation','devotion','crew','goad','fight','investigate','explore','discover','escape','flashback',
'disturb','embalm','eternalize','unearth','rebound','convoke','delve','improvise','affinity','kicker',
'multikicker','buyback','madness','spectacle','riot','adapt','evolve','proliferate','populate',
'treasure','food','clue','blood','map','sacrifice','discard','draw','untap','tap','counter','counters',
'exile','graveyard','equipment','vehicle','aura','saga','battle','token','tokens','transform','face-down','faceup','survival','monstrosity','strive','constellation','devotion','heroic','foretell','gift','landfall','plot','bargain','boast','miracle','hideaway','suspend','aftermath'
}
TRIGGER_PHRASES=[
'when ~ enters','whenever ~ attacks','whenever one or more','at the beginning of combat',
'at the beginning of your end step','at the beginning of each end step','whenever you cast',
'whenever another creature','whenever a creature you control dies','as long as','activate only as a sorcery',
'this ability triggers only once each turn','for the first time each turn','until end of turn',
'exile target','return target','return it to the battlefield','create a treasure token','draw a card',
'put a +1/+1 counter','gets +1/+1','gain control of','can\'t be blocked','attacks this combat if able',
'add {w}','add {u}','add {b}','add {r}','add {g}'
]

def fetch_json(url:str):
    req=Request(url,headers={'User-Agent':UA,'Accept':ACCEPT})
    with urlopen(req,timeout=60) as r:
        return json.load(r)

def download(url:str,path:Path):
    req=Request(url,headers={'User-Agent':UA,'Accept':ACCEPT})
    with urlopen(req,timeout=120) as r,path.open('wb') as f:
        while True:
            b=r.read(1024*1024)
            if not b: break
            f.write(b)

def norm_text(s:str,name:str='')->str:
    s=(s or '').lower().replace('−','-').replace('—','-')
    if name:
        for part in sorted(set(re.findall(r"[a-z0-9']+",name.lower())),key=len,reverse=True):
            if len(part)>=4:s=re.sub(r'\b'+re.escape(part)+r'\b','~',s)
    s=re.sub(r'\bthis creature\b','~',s)
    s=re.sub(r'\{\d+\}','{n}',s)
    s=re.sub(r'\b\d+\b','n',s)
    return re.sub(r'\s+',' ',s).strip()

def toks(text:str):
    return re.findall(r"[a-z]+(?:-[a-z]+)?|\{[wubrgcxtn/]++\}|\+n/\+n|-n/-n",text.lower())

def feature_tokens(text:str):
    return [x for x in toks(text) if len(x)>2 and x not in STOP]

def broad_type(type_line:str):
    for t in ['Creature','Land','Artifact','Enchantment','Instant','Sorcery','Battle','Planeswalker']:
        if re.search(r'\b'+t+r'\b',type_line or ''):return t
    return (type_line or '').split(' — ')[0].strip()

def image_urls(c):
    iu=c.get('image_uris') or {}
    if not iu and c.get('card_faces'): iu=(c['card_faces'][0].get('image_uris') or {})
    return {k:iu.get(k,'') for k in ('small','normal','large','png','art_crop') if iu.get(k)}

def face_oracle(c):
    if c.get('oracle_text'):return c['oracle_text']
    return '\n//\n'.join(f.get('oracle_text','') for f in c.get('card_faces',[]) if f.get('oracle_text'))

def colors_of(c):
    x=c.get('color_identity') or c.get('colors') or []
    return set(x)

def power_num(v):
    try:return float(v)
    except:return None

def scry_row(c):
    return {
      'id':c['id'],'oracleId':c.get('oracle_id',''),'name':c['name'],'manaCost':c.get('mana_cost',''),
      'manaValue':c.get('cmc',0),'type':c.get('type_line',''),'oracleText':face_oracle(c),
      'power':c.get('power',''),'toughness':c.get('toughness',''),'loyalty':c.get('loyalty',''),
      'colors':c.get('colors') or [],'colorIdentity':c.get('color_identity') or [],
      'keywords':c.get('keywords') or [],'rarity':c.get('rarity',''),'set':c.get('set',''),
      'setName':c.get('set_name',''),'collectorNumber':c.get('collector_number',''),
      'releasedAt':c.get('released_at',''),'scryfallUri':c.get('scryfall_uri',''),'images':image_urls(c)
    }

def overlap_phrase(a,b):
    aw=feature_tokens(a);bw=feature_tokens(b)
    if not aw or not bw:return ''
    # longest contiguous run of meaningful normalized words, capped for concise annotation
    pos=collections.defaultdict(list)
    for j,w in enumerate(bw):pos[w].append(j)
    best=[]
    for i,w in enumerate(aw):
        for j in pos.get(w,[]):
            run=[];ii=i;jj=j
            while ii<len(aw) and jj<len(bw) and aw[ii]==bw[jj] and len(run)<10:
                run.append(aw[ii]);ii+=1;jj+=1
            if len(run)>len(best):best=run
    return ' '.join(best) if len(best)>=3 else ''

def mechanisms(text,keywords=()):
    n=norm_text(text)
    found={m for m in MECH_TERMS if re.search(r'(?<![a-z-])'+re.escape(m)+r'(?![a-z-])',n)}
    found|={k.lower() for k in keywords}
    return found

def trigger_shapes(text):
    n=norm_text(text)
    result=set()
    for p in TRIGGER_PHRASES:
        if p in n:result.add(p)
    if re.search(r'whenever .* attacks',n):result.add('attack trigger')
    if re.search(r'when .* enters',n):result.add('enters trigger')
    if re.search(r'\{[^}]+\}.*:',n):result.add('activated ability')
    if 'only once each turn' in n or 'first time each turn' in n:result.add('once-per-turn guardrail')
    return result

def annotation(role,o,c,shared_mech,shared_shapes,phrase):
    bits=[]
    if role=='template':
        if shared_shapes:bits.append('use for '+', '.join(sorted(shared_shapes)[:2])+' wording')
        if shared_mech:bits.append('shared '+', '.join(sorted(shared_mech)[:4])+' terminology')
        if phrase and not bits:bits.append('close multi-word Oracle wording and clause order')
        if not bits:bits.append('closest Oracle-text structure')
        lead='Rules template'
    elif role=='mechanic':
        if shared_mech:bits.append('shared '+', '.join(sorted(shared_mech)[:4]))
        if shared_shapes:bits.append(', '.join(sorted(shared_shapes)[:2]))
        lead='Mechanics / play pattern'
    else:
        omv=float(o.get('mv') or 0);cmv=float(c.get('cmc') or 0)
        bits.append('mana value '+str(int(cmv) if cmv.is_integer() else cmv))
        if broad_type(o.get('type',''))==broad_type(c.get('type_line','')):bits.append('same '+broad_type(c.get('type_line','')).lower()+' role')
        op,ot=power_num(o.get('power')),power_num(o.get('toughness'));cp,ct=power_num(c.get('power')),power_num(c.get('toughness'))
        if cp is not None and ct is not None:bits.append(str(c.get('power'))+'/'+str(c.get('toughness'))+' body')
        lead='Rate / role benchmark'
    note=lead+': '+'; '.join(bits)+'.'
    cn=norm_text(face_oracle(c));on=norm_text(o.get('rules',''))
    if ('only once each turn' in cn or 'first time each turn' in cn) and not ('only once each turn' in on or 'first time each turn' in on):
        note+=' Guardrail precedent: the reference limits repeatability; review whether Odyssey intentionally does not.'
    elif ('only once each turn' in on or 'first time each turn' in on) and not ('only once each turn' in cn or 'first time each turn' in cn):
        note+=' Contrast: Odyssey uses a turn-frequency limiter that this analogue does not.'
    return note

def main():
    listing=fetch_json('https://api.scryfall.com/bulk-data')
    items=listing.get('data') or []
    meta=next((x for x in items if x.get('type')=='oracle_cards'),None)
    if not meta: raise RuntimeError('Scryfall bulk listing did not include oracle_cards')
    uri=meta.get('jsonl_download_uri') or meta.get('download_uri')
    if not uri: raise RuntimeError('Scryfall oracle_cards bulk record has no supported download URI')
    suffix='.jsonl.gz' if uri.endswith('.gz') else '.json'
    bulk=REPORT/('oracle-cards'+suffix)
    download(uri,bulk)
    if uri.endswith('.gz'):
        def rows():
            with gzip.open(bulk,'rt',encoding='utf-8') as fh:
                for line in fh:
                    line=line.strip()
                    if line: yield json.loads(line)
        raw=rows()
    else:
        raw=json.loads(bulk.read_text())
    pool=[]
    cutoff=dt.datetime.now(dt.timezone.utc).date().isoformat()
    for c in raw:
        if 'paper' not in (c.get('games') or []):continue
        if c.get('released_at') and c.get('released_at')>cutoff:continue
        if c.get('security_stamp')=='acorn' or c.get('border_color')=='silver':continue
        tl=c.get('type_line','')
        if any(x in tl for x in ['Token','Emblem','Dungeon','Card —']):continue
        text=face_oracle(c)
        if not text and broad_type(tl)!='Land':continue
        row=c.copy();row['_oracle']=text;row['_norm']=norm_text(text,c.get('name',''));row['_tokens']=set(feature_tokens(row['_norm']));row['_mech']=mechanisms(text,c.get('keywords') or []);row['_shape']=trigger_shapes(row['_norm']);row['_type']=broad_type(tl)
        pool.append(row)
    df=collections.Counter()
    inv=collections.defaultdict(list)
    for i,c in enumerate(pool):
        for t in c['_tokens']:df[t]+=1;inv[t].append(i)
    N=len(pool)
    def idf(t):return math.log((N+1)/(df[t]+1))+1
    # v2 reference policy: cover every current card, with explicit costing lanes and
    # additional mechanic/build-around precedents for the cards that need them most.
    cards=list(DATA['cards'])
    type_index=collections.defaultdict(list)
    by_name={}
    for i,c in enumerate(pool):
        type_index[c['_type']].append(i)
        key=c.get('name','').strip().lower()
        if key:
            by_name.setdefault(key,i)
            if ' // ' in key: by_name.setdefault(key.split(' // ',1)[0],i)

    TECH_ANCHORS=[
      ('cycle.progression-challenges',["Last Light of Durin's Day"],'recent quest-counter progression technology'),
      ('quest counter',["Last Light of Durin's Day"],'recent quest-counter progression technology'),
      ('cycle.survivor-ordeals-v1',['Ordeal of Heliod','Ordeal of Thassa','Ordeal of Nylea'],'Theros Ordeal cycle technology'),
      ('ordeal /',['Ordeal of Heliod','Ordeal of Thassa','Ordeal of Nylea'],'Theros Ordeal cycle technology'),
      ('manifest fate',['Mastery of the Unseen','Whisperwood Elemental','Abhorrent Oculus'],'manifest / face-down build technology'),
      ('survival',['Cautious Survivor','House Cartographer','Rip, Spawn Hunter'],'Duskmourn Survival technology'),
      ('heroic',['Favored Hoplite','Akroan Crusader'],'Theros Heroic technology'),
      ('constellation',['Eidolon of Blossoms','Setessan Champion'],'Constellation technology'),
      ('strive',["Ajani's Presence",'Launch the Fleet'],'Journey into Nyx Strive technology'),
      ('foretell',['Saw It Coming','Behold the Multiverse'],'Kaldheim Foretell technology'),
      ('monstrosity',['Polukranos, World Eater','Nessian Asp'],'Theros Monstrosity technology'),
      ('devotion',['Thassa, God of the Sea','Heliod, Sun-Crowned'],'Theros devotion / God technology'),
      ('gift a ',['Valley Rally','Nocturnal Hunger','Crumb and Get It'],'Bloomburrow Gift a Food technology'),
      ('ff-analog-adventure-lands',['Jidoor, Aristocratic Capital','Lindblum, Industrial Regency'],'FINAL FANTASY rare Adventure-land cycle technology'),
      ('adventure',['Bonecrusher Giant','Mosswood Dreadknight'],'Adventure technology'),
      ('cycle.hybrid-sagas-uncommon',['Fable of the Mirror-Breaker'],'Saga pacing / chapter technology'),
      ('prepare /',['Valki, God of Lies'],'modal / transformation-adjacent technology'),
      ('storm',['Grapeshot'],'Storm technology'),
      ('plot',['Slickshot Show-Off'],'Plot technology'),
      ('bargain',['Torch the Tower'],'Bargain technology'),
      ('flashback',['Think Twice'],'Flashback technology'),
      ('hideaway',['Windbrisk Heights'],'Hideaway technology'),
      ('miracle',['Terminus'],'Miracle technology'),
      ('boast',['Usher of the Fallen'],'Boast technology'),
      ('battle',['Invasion of Zendikar'],'Battle / transforming permanent technology'),
    ]

    def flat(v):
        if isinstance(v,list):return ' '.join(str(x) for x in v)
        if isinstance(v,dict):return ' '.join(str(x) for x in v.values())
        return str(v or '')

    def find_named(name):
        i=by_name.get(name.strip().lower())
        return pool[i] if i is not None else None

    def explicit_oracle_names(o):
        names=[]
        for k in ('underlyingOracleName','underlyingOracle','oracleName','sourceOracleName','reprintName','printedOracleName'):
            v=o.get(k)
            if isinstance(v,str) and v.strip():names.append(v.strip())
        origin=(str(o.get('originFull',''))+' '+str(o.get('origin',''))).lower()
        if ('reprint' in origin or re.search(r'\brpr\b',origin)) and o.get('name'):names.append(str(o['name']).strip())
        out=[]
        for n in names:
            if n and n not in out:out.append(n)
        return out

    def tech_anchor(o):
        hay=' '.join([flat(o.get('mechanics')),flat(o.get('rules')),flat(o.get('cycleIds')),flat(o.get('cycles')),flat(o.get('type'))]).lower()
        for needle,names,label in TECH_ANCHORS:
            if needle in hay:
                for name in names:
                    c=find_named(name)
                    if c:return c,label
        return None,None

    def ref_obj(role,score,o,c,shared_mech=(),shared_shapes=(),note=''):
        return {
          'role':role,'score':round(max(0,min(1,float(score))),3),'annotation':note,
          'sharedMechanics':sorted(shared_mech),'sharedPatterns':sorted(shared_shapes),'card':scry_row(c)
        }

    def add(chosen,used,ref,limit):
        if not ref or len(chosen)>=limit:return False
        c=ref['card'];key=c.get('oracleId') or c.get('id')
        if not key or key in used:return False
        used.add(key);chosen.append(ref);return True

    refs={}
    audit=[]
    for pos,o in enumerate(cards,1):
        onorm=norm_text((o.get('rules') or '')+' '+flat(o.get('mechanics')),o.get('name',''))
        otokens=set(feature_tokens(onorm));omech=mechanisms((o.get('rules') or '')+' '+flat(o.get('mechanics')))
        oshape=trigger_shapes(onorm);otype=broad_type(o.get('type',''))
        ocol=set(re.findall(r'[WUBRG]',flat(o.get('color'))+' '+flat(o.get('frame'))))
        ranked_tokens=sorted(otokens,key=lambda t:idf(t),reverse=True)[:18]
        cand=set()
        for t in ranked_tokens:cand.update(inv.get(t,[])[:4000])
        omv=float(o.get('mv') or 0)
        cand.update(i for i in type_index.get(otype,[]) if abs(float(pool[i].get('cmc') or 0)-omv)<=3)
        if not cand:cand.update(type_index.get(otype,[])[:5000])
        scores=[]
        for i in cand:
            c=pool[i];ct=c['_tokens'];inter=otokens&ct;union=otokens|ct
            j=len(inter)/max(1,len(union))
            weighted=sum(idf(t) for t in inter)/max(1,sum(idf(t) for t in otokens))
            shared_mech=omech&c['_mech'];shared_shape=oshape&c['_shape'];phrase=overlap_phrase(onorm,c['_norm'])
            template=min(1,0.48*j+0.37*weighted+0.07*len(shared_shape)+(0.13 if phrase else 0))
            mech=min(1,0.18*len(shared_mech)+0.12*len(shared_shape)+0.30*weighted)
            same_type=1 if c['_type']==otype else 0
            cmv=float(c.get('cmc') or 0);mv=max(0,1-abs(cmv-omv)/4)
            cc=colors_of(c);color=(len(ocol&cc)/max(1,len(ocol|cc))) if (ocol or cc) else 1
            stats=.5
            op,ot=power_num(o.get('power')),power_num(o.get('toughness'));cp,ctough=power_num(c.get('power')),power_num(c.get('toughness'))
            if op is not None and ot is not None and cp is not None and ctough is not None:stats=max(0,1-(abs(op-cp)+abs(ot-ctough))/8)
            rate=.38*same_type+.28*mv+.22*color+.12*stats
            effect=min(1,.40*weighted+.20*j+.14*len(shared_mech)+.08*len(shared_shape)+(.10 if phrase else 0)+.08*same_type)
            total=.48*template+.30*mech+.12*rate+.10*effect
            if image_urls(c):total+=.03
            scores.append((total,template,mech,rate,effect,i,shared_mech,shared_shape,j,weighted,stats))
        if not scores:raise RuntimeError('No Scryfall candidates for '+o['id'])

        rarity=str(o.get('rarity') or '').upper()
        is_basic='Basic Land' in str(o.get('type') or '')
        splashy=rarity in {'R','M'} or len(str(o.get('rules') or ''))>=220 or len(omech)>=3 or 'rare.pair-buildarounds' in flat(o.get('cycleIds'))+' '+flat(o.get('cycles'))
        limit=1 if is_basic else (7 if splashy else (6 if rarity=='U' else 5))
        chosen=[];used=set()

        # Exact Oracle identity for reprints/reskins and basics.
        exact=None
        for n in explicit_oracle_names(o)+([str(o.get('name') or '')] if is_basic else []):
            exact=find_named(n)
            if exact:break
        if exact:
            add(chosen,used,ref_obj('identity',1,o,exact,note='Oracle identity: exact printed card for this reprint, reskin, or basic-land slot.'),limit)
        if is_basic:
            refs[o['id']]={'id':o['id'],'number':o['number'],'name':o['name'],'references':chosen}
            audit.append({'id':o['id'],'number':o['number'],'name':o['name'],'count':len(chosen),'references':[{'name':x['card']['name'],'role':x['role'],'score':x['score'],'annotation':x['annotation']} for x in chosen]})
            continue

        same=[x for x in scores if pool[x[5]]['_type']==otype]
        base_pool=same or scores
        top_effect=max(x[4] for x in base_pool)
        close=[x for x in base_pool if x[4]>=max(.16,top_effect*.58)]
        if len(close)<4:close=sorted(base_pool,key=lambda x:(x[4],x[0]),reverse=True)[:24]

        def pushed_value(x):
            c=pool[x[5]];cmv=float(c.get('cmc') or 0)
            cp,ct=power_num(c.get('power')),power_num(c.get('toughness'))
            efficiency=((cp+ct)/(2*max(1,cmv))) if cp is not None and ct is not None else (1/(1+cmv))
            rarity_bonus={'mythic':1,'rare':.8,'uncommon':.35,'common':0}.get(c.get('rarity',''),.15)
            return .48*x[4]+.18*x[2]+.12*x[3]+.14*min(1,efficiency)+.08*rarity_bonus
        for x in sorted(close,key=pushed_value,reverse=True):
            c=pool[x[5]]
            note='Best-rate benchmark: a close same-type real-card match selected toward the efficient/pushed end of printed mana and stat rates. Use it as a ceiling check, not as the default baseline.'
            if add(chosen,used,ref_obj('rate-best',pushed_value(x),o,c,x[6],x[7],note),limit):break

        normal_pool=[x for x in close if pool[x[5]].get('rarity') in {'common','uncommon'}] or close
        mvs=sorted(float(pool[x[5]].get('cmc') or 0) for x in normal_pool)
        median_mv=statistics.median(mvs) if mvs else omv
        def normal_value(x):
            c=pool[x[5]];cmv=float(c.get('cmc') or 0)
            return .58*x[4]+.27*x[3]+.15*max(0,1-abs(cmv-median_mv)/4)
        for x in sorted(normal_pool,key=normal_value,reverse=True):
            c=pool[x[5]]
            note='Normal-rate benchmark: representative common/uncommon or median-rate printing among close same-type matches. Treat this as the ordinary baseline for costing the effect.'
            if add(chosen,used,ref_obj('rate-normal',normal_value(x),o,c,x[6],x[7],note),limit):break

        anchor,label=tech_anchor(o)
        if anchor:
            am=omech&anchor['_mech'];ash=oshape&anchor['_shape']
            add(chosen,used,ref_obj('tech',1,o,anchor,am,ash,'Mechanic / set-tech precedent: '+label+'. This is included deliberately even when a different card is closer on raw text or mana rate.'),limit)

        for x in sorted(scores,key=lambda x:(x[2],x[4],x[0]),reverse=True):
            if x[2]<.28 or not (x[6] or x[7]):continue
            c=pool[x[5]];phrase=''
            if add(chosen,used,ref_obj('mechanic',x[2],o,c,x[6],x[7],annotation('mechanic',o,c,x[6],x[7],phrase)),limit):break

        for x in sorted(scores,key=lambda x:(x[1],x[4],x[0]),reverse=True):
            if x[1]<.30:continue
            c=pool[x[5]];phrase=overlap_phrase(onorm,c['_norm'])
            if x[1]<.40 and not phrase and len(x[7])<2:continue
            if add(chosen,used,ref_obj('template',x[1],o,c,x[6],x[7],annotation('template',o,c,x[6],x[7],phrase)),limit):break

        if splashy and len(chosen)<limit:
            spins=[]
            for x in scores:
                c=pool[x[5]]
                if c.get('rarity') not in {'rare','mythic'}:continue
                if not (x[6] or x[7]) and x[4]<.18:continue
                novelty=max(0,1-x[8])
                score=.38*x[2]+.28*x[4]+.18*novelty+.16*(1 if c.get('rarity')=='mythic' else .8)
                spins.append((score,x))
            spin_added=0
            for score,x in sorted(spins,key=lambda z:z[0],reverse=True):
                c=pool[x[5]]
                shared=', '.join(sorted(x[6])[:4] or sorted(x[7])[:2]) or 'a closely overlapping effect package'
                note='Build-around / interesting spin: shares '+shared+' but deliberately favors a different, higher-complexity implementation. Use it to test whether a splashy Odyssey card has enough payoff, tension, and deck-building identity.'
                if add(chosen,used,ref_obj('buildaround',score,o,c,x[6],x[7],note),limit):
                    spin_added+=1
                    if spin_added>=2:break

        if not chosen:
            x=max(scores,key=lambda x:x[3]);c=pool[x[5]]
            add(chosen,used,ref_obj('rate-normal',x[3],o,c,x[6],x[7],'Normal-rate benchmark: closest available same-role printed card.'),limit)

        refs[o['id']]={'id':o['id'],'number':o['number'],'name':o['name'],'references':chosen}
        audit.append({'id':o['id'],'number':o['number'],'name':o['name'],'count':len(chosen),'references':[{'name':x['card']['name'],'role':x['role'],'score':x['score'],'annotation':x['annotation']} for x in chosen]})
        if pos%25==0:print('curated',pos,'/',len(cards),flush=True)

    missing=[o['id'] for o in cards if not refs.get(o['id'],{}).get('references')]
    if missing:raise RuntimeError('Cards without reference cards: '+', '.join(missing))
    quest_cards=[o for o in cards if 'quest counter' in ((o.get('rules') or '')+' '+flat(o.get('mechanics'))).lower()]
    for o in quest_cards:
        q=refs[o['id']]['references']
        if not any(x['role']=='tech' and x['card']['name']=="Last Light of Durin's Day" for x in q):
            raise RuntimeError('Quest-tech anchor missing for '+o['id'])
    payload={'schema':'odyssey-reference-cards/v2','generatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'datasetVersion':DATA['datasetVersion'],'scryfallBulk':{'type':meta.get('type'),'updatedAt':meta.get('updated_at'),'downloadUri':uri,'format':'jsonl.gz' if uri.endswith('.gz') else 'json','releasedOnOrBefore':cutoff},'method':'full-set reference rebuild from current Odyssey rules text and the current Scryfall Oracle bulk snapshot; roles separate pushed-rate ceiling, normal-rate baseline, mechanic/set-tech precedent, rules template, and splashy build-around precedent','totalCards':len(cards),'cards':refs}
    OUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n')
    OUTJS.write_text('window.ODYSSEY_CARD_REFERENCES='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n')
    role_counts=collections.Counter(r['role'] for e in refs.values() for r in e['references'])
    summary={'totalCards':len(cards),'referencedCards':len(refs),'totalReferences':sum(len(x['references']) for x in refs.values()),'minRefs':min(len(x['references']) for x in refs.values()),'maxRefs':max(len(x['references']) for x in refs.values()),'missing':missing,'roles':dict(sorted(role_counts.items())),'questCards':len(quest_cards),'scryfallUpdatedAt':meta.get('updated_at')}
    (REPORT/'summary.json').write_text(json.dumps(summary,indent=2))
    (REPORT/'audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
    print(json.dumps(summary,indent=2))

if __name__=='__main__':main()
