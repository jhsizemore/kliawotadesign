#!/usr/bin/env python3
"""Build real-card references for every original Odyssey design from one Scryfall bulk snapshot.

The generator intentionally downloads Scryfall's Oracle Cards bulk file once rather than issuing
hundreds of API searches. It chooses up to three distinct paper cards per original Odyssey card:
a rules-template analogue, a mechanics/play-pattern analogue, and a rate/role benchmark.
Annotations are generated only from objective overlaps (rules skeleton, keywords, mana/type/rate).
"""
from __future__ import annotations
import collections, datetime as dt, gzip, hashlib, json, math, os, re, sys, time
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
'exile','graveyard','legendary','equipment','vehicle','aura','saga','battle','enchantment','artifact',
'instant','sorcery','land','creature','token','tokens','transform','face-down','faceup','face-down',
'combat','attack','attacks','attacking','dies','enters','leaves','cast','casts'
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
        if phrase:bits.append('shared wording skeleton: “'+phrase+'”')
        if shared_shapes:bits.append('same '+', '.join(sorted(shared_shapes)[:2]))
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
    for c in raw:
        if 'paper' not in (c.get('games') or []):continue
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
    originals=[c for c in DATA['cards'] if str(c.get('originFull','New')).lower()=='new' and str(c.get('origin','')).upper()!='RPR']
    refs={}
    audit=[]
    for pos,o in enumerate(originals,1):
        onorm=norm_text((o.get('rules') or '')+' '+(o.get('mechanics') or ''),o.get('name',''))
        otokens=set(feature_tokens(onorm));omech=mechanisms((o.get('rules') or '')+' '+(o.get('mechanics') or ''));oshape=trigger_shapes(onorm);otype=broad_type(o.get('type',''));ocol=set(re.findall(r'[WUBRG]',o.get('color','') or o.get('frame','') or ''))
        ranked_tokens=sorted(otokens,key=lambda t:idf(t),reverse=True)[:16]
        cand=set()
        for t in ranked_tokens:cand.update(inv.get(t,[])[:4000])
        # Always admit a modest same-type/rate pool, crucial for vanilla-ish creatures and lands.
        if len(cand)<500:
            cand.update(i for i,c in enumerate(pool) if c['_type']==otype and abs(float(c.get('cmc') or 0)-float(o.get('mv') or 0))<=2)
        scores=[]
        for i in cand:
            c=pool[i];ct=c['_tokens'];inter=otokens&ct;union=otokens|ct
            j=len(inter)/max(1,len(union))
            weighted=sum(idf(t) for t in inter)/max(1,sum(idf(t) for t in otokens))
            shared_mech=omech&c['_mech'];shared_shape=oshape&c['_shape'];phrase=overlap_phrase(onorm,c['_norm'])
            template=min(1,0.48*j+0.37*weighted+0.07*len(shared_shape)+(0.13 if phrase else 0))
            mech=min(1,0.18*len(shared_mech)+0.12*len(shared_shape)+0.30*weighted)
            same_type=1 if c['_type']==otype else 0
            cmv=float(c.get('cmc') or 0);omv=float(o.get('mv') or 0);mv=max(0,1-abs(cmv-omv)/4)
            cc=colors_of(c);color=(len(ocol&cc)/max(1,len(ocol|cc))) if (ocol or cc) else 1
            stats=.5
            op,ot=power_num(o.get('power')),power_num(o.get('toughness'));cp,ctough=power_num(c.get('power')),power_num(c.get('toughness'))
            if op is not None and ot is not None and cp is not None and ctough is not None:stats=max(0,1-(abs(op-cp)+abs(ot-ctough))/8)
            rate=.38*same_type+.28*mv+.22*color+.12*stats
            total=.55*template+.30*mech+.15*rate
            # Prefer cards with images and modern/current Oracle presentation for review.
            if image_urls(c):total+=.03
            scores.append((total,template,mech,rate,i,shared_mech,shared_shape,phrase))
        if not scores:
            raise RuntimeError('No Scryfall candidates for '+o['id'])
        chosen=[];used=set()
        for role,si,threshold in [('template',1,.12),('mechanic',2,.12),('rate',3,.45)]:
            for item in sorted(scores,key=lambda x:(x[si],x[0]),reverse=True):
                c=pool[item[4]]
                oid=c.get('oracle_id') or c['id']
                if oid in used or item[si]<threshold:continue
                # Mechanic slot must have an actual shared mechanism or trigger shape.
                if role=='mechanic' and not (item[5] or item[6]):continue
                used.add(oid)
                chosen.append({
                  'role':role,'score':round(item[si],3),'annotation':annotation(role,o,c,item[5],item[6],item[7]),
                  'sharedMechanics':sorted(item[5]),'sharedPatterns':sorted(item[6]),'card':scry_row(c)
                });break
        # Guarantee at least two useful references when possible using overall similarity.
        if len(chosen)<2:
            for item in sorted(scores,reverse=True):
                c=pool[item[4]];oid=c.get('oracle_id') or c['id']
                if oid in used or item[0]<.12:continue
                used.add(oid);chosen.append({'role':'analogue','score':round(item[0],3),'annotation':'General analogue: closest combined rules, mechanics, color and rate profile in the Scryfall Oracle snapshot.','sharedMechanics':sorted(item[5]),'sharedPatterns':sorted(item[6]),'card':scry_row(c)})
                if len(chosen)>=2:break
        refs[o['id']]={'id':o['id'],'number':o['number'],'name':o['name'],'references':chosen[:3]}
        audit.append({'id':o['id'],'number':o['number'],'name':o['name'],'count':len(chosen[:3]),'references':[{'name':x['card']['name'],'role':x['role'],'score':x['score'],'annotation':x['annotation']} for x in chosen[:3]]})
        if pos%25==0:print('curated',pos,'/',len(originals),flush=True)
    missing=[o['id'] for o in originals if not refs[o['id']]['references']]
    if missing:raise RuntimeError('Original cards without reference cards: '+', '.join(missing))
    payload={'schema':'odyssey-reference-cards/v1','generatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'datasetVersion':DATA['datasetVersion'],'scryfallBulk':{'type':meta.get('type'),'updatedAt':meta.get('updated_at'),'downloadUri':uri,'format':'jsonl.gz' if uri.endswith('.gz') else 'json'},'method':'automated design-reference curation from Scryfall Oracle bulk data; each role chosen independently and annotated from objective shared rules/mechanics/rate features','originalCards':len(originals),'cards':refs}
    OUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n')
    OUTJS.write_text('window.ODYSSEY_CARD_REFERENCES='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n')
    summary={'originalCards':len(originals),'referencedCards':len(refs),'totalReferences':sum(len(x['references']) for x in refs.values()),'oneRef':sum(len(x['references'])==1 for x in refs.values()),'twoRefs':sum(len(x['references'])==2 for x in refs.values()),'threeRefs':sum(len(x['references'])==3 for x in refs.values()),'missing':missing,'scryfallUpdatedAt':meta.get('updated_at')}
    (REPORT/'summary.json').write_text(json.dumps(summary,indent=2))
    (REPORT/'audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
    print(json.dumps(summary,indent=2))

if __name__=='__main__':main()
