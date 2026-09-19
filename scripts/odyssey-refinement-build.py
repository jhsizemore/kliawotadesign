"""Guarded release build for the explicitly approved text/locales refinement."""
from pathlib import Path
import concurrent.futures, hashlib, json, re, time, types
ROOT=Path(__file__).resolve().parents[1];APP=ROOT/'public/mtgtools/odyssey';OUT=Path('/tmp/odyssey-refinement');OUT.mkdir(parents=True,exist_ok=True)
plan=json.loads((ROOT/'scripts/odyssey-refinement-plan.json').read_text());revision=plan['revision']
read=lambda f:json.loads((APP/'data'/f).read_text())
current=read('odyssey-data.json');candidate=read('odyssey-analysis-candidate-v1.json')
assert current['datasetVersion']=='2026-09-19.2','Unexpected baseline: reconcile instead of overwriting a newer design release.'
assert current['cards']==candidate['cards'];assert len(current['cards'])==309;assert len(current['artworks'])==450
before=json.loads(json.dumps(current));manifest=read('artwork-manifest.json')
# Reuse exact-source acquisition, full native composition and independently decoded thumbnails.
p=ROOT/'scripts/odyssey-artwork-audit.py';audit=types.ModuleType('source_audit');audit.__file__=str(p);exec(compile(p.read_text(),str(p),'exec'),audit.__dict__)
def acquire(seed):
 art=dict(seed);art.update(period='Historical landscape / architectural reception',rights='Public Domain',matchType='Evocative locale / environment',heroScore=4,status='CURATED',imageUrl='')
 if 'metmuseum.org/' in art['source']:
  oid=re.search(r'/search/(\d+)',art['source']).group(1);record=audit.get('https://collectionapi.metmuseum.org/public/collection/v1/objects/'+oid,True)
  assert record.get('isPublicDomain') is True,(art['id'],'Museum has not marked this image public domain')
  assert record.get('primaryImage'),(art['id'],'No full image provided')
  art['imageUrl']=record['primaryImage'];art['rights']='Public Domain / Met Open Access'
 else:art['rights']='Public Domain / Rijksmuseum'
 art['credit']='Art: '+art['artist']+' · '+('The Met' if 'metmuseum.org/' in art['source'] else 'Rijksmuseum')
 row=audit.audit(art);assert row['status']=='verified' and row.get('delivery')=='same-origin',(art['id'],row)
 art.update(imageWidth=row['width'],imageHeight=row['height'],imageChecked=time.strftime('%Y-%m-%d'))
 art['imageUrl']=row['originalUrl'];return art,row
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:acquired=list(pool.map(acquire,plan['artworks']))
for art,row in acquired:
 assert not any(a['id']==art['id'] or a['source']==art['source'] for a in current['artworks']),art['id']
 current['artworks'].append(art);manifest['artworks'][art['id']]=row
artById={a['id']:a for a in current['artworks']};cards={c['number']:c for c in current['cards']};oldCards={c['number']:c for c in before['cards']}
report={'revision':revision,'version':plan['version'],'landCycle':plan['lands'],'artworksAdded':[a for a,_ in acquired],'rateLimitAudit':[],'lateSlotPolicy':plan['lateSlotPolicy'],'sharedLateCardCutsApplied':[],'sharedLateCardCutNote':'The shared authoring rows exposed no explicit Remove/Recast labels. Device-local review choices are interpreted and exported by Studio; no unmarked shared design is deleted.'}
def changed(c):c['changeStatus']=c.get('changeStatus','')+' · '+revision
def words(c,old):c['functionalWords']=max(0,old.get('functionalWords',len(old['rules'].split()))+len(c['rules'].split())-len(old['rules'].split()))
for land in plan['lands']:
 c=cards[land['number']];old=oldCards[c['number']];assert 'ff-analog-common-town-duals' in c.get('cycleIds',[])
 assert all(id in artById and manifest['artworks'][id]['status']=='verified' for id in land['candidates'])
 c.update(name=land['name'],displayName=land['name'],type='Land',mechanics='Tapped dual land; Colour fixing',rules=land['name']+' enters tapped.\n{T}: Add {'+land['pair'][0]+'} or {'+land['pair'][1]+'}.',story=land['story'],storyTarget=land['story'],flavorStoryElement=land['story'],flavorMatchRationale=land['artNote'],localeCycle=plan['cycleId'],nameAliases=list(dict.fromkeys(c.get('nameAliases',[])+[old['name'],old['displayName']])))
 c['cycleIds']=[plan['cycleId'] if id=='ff-analog-common-town-duals' else id for id in c['cycleIds']]
 a=artById[land['primary']];c.update(primaryArt=a['id'],credit=a['credit'],source=a['source'],imageUrl=a.get('imageUrl',''))
 c['previousPrimaryArt']=old['primaryArt'];changed(c);words(c,old)
 cv=next(row for row in current['coverage'] if row['number']==c['number']);cv.update(name=c['name'],previousCandidateIds=cv['candidateIds'],previousPrimary=cv['primary'],candidateIds=land['candidates'],primary=a['id'],status='SELECTED',layer='Environment-led / historical landscape',notes=land['artNote'])
 for aid in land['candidates']:
  a=artById[aid];a['candidateCards']='; '.join(dict.fromkeys([x.strip() for x in a.get('candidateCards','').split(';') if x.strip()]+[c['name']]))
for c in current['cards']:
 old=oldCards[c['number']]
 if re.search(r'once|first time|first .*each turn',old['rules'],re.I):
  removal=plan['removeLimits'].get(str(c['number']));text=c['rules']
  if removal:
   if c['number']==274:text=text.replace(' for the first time each turn','')
   else:text=re.sub(r'\s*(?:This ability triggers|Activate) only once each turn\.','',text,count=1)
   assert text!=c['rules'],c['number'];c['rules']=text.strip();changed(c);words(c,old)
  if removal:reason=removal
  elif re.search(r'untap',old['rules'],re.I):reason='Retained: repeatable untapping can refund mana or support a blink/sacrifice loop; a tap cost elsewhere is not sufficient protection.'
  elif re.search(r'draw|surveil|mill|scry',old['rules'],re.I):reason='Retained: protects repeatable card flow, library processing or a linked payoff. Existing first/second-event thresholds remain part of the design.'
  elif re.search(r'create|return|exile|graveyard',old['rules'],re.I):reason='Retained: limits repeatable token production, recursion, exile value or its compounding payoff.'
  elif re.search(r'gain control|damage|loses',old['rules'],re.I):reason='Retained: controls a high-impact theft, damage or drain engine rather than merely shortening text.'
  else:reason='Retained: the first-event restriction materially caps accumulating counters or a downside; removing it would alter the intended turn pattern.'
  report['rateLimitAudit'].append({'id':c['id'],'number':c['number'],'name':c['name'],'decision':'remove duplicate clause; first-event cap retained' if c['number']==176 else 'remove' if removal else 'retain','reason':reason,'before':old['rules'],'after':c['rules']})
 if re.search(r'As long as (?:your devotion|the number of (?:white|blue|black|red|green).*mana symbols)',c['rules'],re.I):
  c['devotionPresentation']='Devotion —';c['mechanics']='; '.join(dict.fromkeys([x.strip() for x in c['mechanics'].split(';')]+['Devotion']))
# Every unrequested card-rule change is forbidden.
changedNums={l['number'] for l in plan['lands']}|{int(n) for n in plan['removeLimits']}
for n,c in cards.items():
 if n not in changedNums:assert c['rules']==oldCards[n]['rules'],n
 for field in ['id','number','rarity','mana','mv','color','layout','pt']:
  assert c[field]==oldCards[n][field],(n,field)
assert len(current['cards'])==309;assert len(current['artworks'])==458
candidate['cards']=json.loads(json.dumps(current['cards']));current['datasetVersion']=plan['version'];candidate['candidate']['productionDatasetVersion']=plan['version']
# Compute hashes with the same UTF-8 JSON serialization as JavaScript JSON.stringify.
cardHash=hashlib.sha256(json.dumps(current['cards'],ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
for d in [current,candidate]:
 d['generatedAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime());d['integrity'].update(sha256=cardHash,sha256Scope='cards-json-stringify-utf8-v1',artworks=458,refinementRevision=revision)
 d['rulesPresentation']={'revision':revision,'sentenceBreaks':'soft visual returns, not new independent rules abilities','devotion':'Recognizable ability label; existing counting condition preserved, including explicit three-colour symbol-count text.'}
 d['lateSlotPolicy']=plan['lateSlotPolicy'];d['localeCycle']={'id':plan['cycleId'],'name':plan['cycleName'],'count':10,'rulesType':'Land','names':{str(l['number']):l['name'] for l in plan['lands']}}
 for cyc in d['ffSkeleton']['cycles']:
  if cyc['id']=='ff-analog-common-town-duals':cyc.update(id=plan['cycleId'],name=plan['cycleName'],legacyId='ff-analog-common-town-duals',note=plan['namingPrinciple'])
 means={}
 for rarity in ['C','U','R','M']:
  rows=[c for c in d['cards'] if c['rarity']==rarity and 'Basic' not in c['type']];means[rarity]={'count':len(rows),'mean':round(sum(c.get('functionalWords',0) for c in rows)/len(rows),1)}
 d['ffSkeleton']['softAudit']['functionalWordMeans']=means
 d['release'].update(version=plan['version'],appRevision=revision,refinementReport='data/refinement-report.json')
write=lambda f,d:(APP/'data'/f).write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
write('odyssey-data.json',current);write('odyssey-analysis-candidate-v1.json',candidate);(APP/'data/odyssey-data.js').write_text('window.ODYSSEY_DATA='+json.dumps(current,ensure_ascii=False,separators=(',',':'))+';\n')
rows=list(manifest['artworks'].values());manifest['revision']=revision;manifest['checkedAt']=current['generatedAt'];manifest['datasetVersion']=plan['version'];manifest['summary']={'total':len(rows),'verified':sum(r['status']=='verified' for r in rows),'sameOrigin':sum(r.get('delivery')=='same-origin' for r in rows),'externalPreviews':[r['id'] for r in rows if r.get('delivery')=='external-preview'],'unavailable':[r['id'] for r in rows if r['status']!='verified'],'originalBytes':sum(r.get('originalBytes',0) for r in rows),'fullBytes':sum(r.get('full',{}).get('bytes',0) for r in rows),'thumbnailBytes':sum(r.get('thumb',{}).get('bytes',0) for r in rows)}
write('artwork-manifest.json',manifest)
slim={k:manifest[k] for k in ['schema','revision','checkedAt','summary']};slim['artworks']={id:{k:row[k] for k in ['id','title','source','status','delivery','originalUrl','width','height','full','thumb'] if k in row} for id,row in manifest['artworks'].items()}
boot='window.ODYSSEY_ARTWORK_MANIFEST='+json.dumps(slim,ensure_ascii=False,separators=(',',':'))+';\n';bootName='artwork-delivery-manifest.'+hashlib.sha256(boot.encode()).hexdigest()[:12]+'.js';(APP/'data'/bootName).write_text(boot)
release=read('release.json');release.update(version=plan['version'],appRevision=revision,artworks=458,cardsSha256=cardHash,artworkDelivery=manifest['summary'],localeCycle=current['localeCycle']);write('release.json',release)
report.update(cards=309,artworks=458,limitsRemoved=len(plan['removeLimits']),rulesChanged=len(changedNums),artworkDelivery=manifest['summary'])
write('refinement-report.json',report);(OUT/'refinement-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
# Patch only the known current renderer, keeping all existing storage namespaces and artist pips.
app=APP/'app.html';s=app.read_text();s=s.replace('odyssey-data.js?v=20260919-live2','odyssey-data.js?v=20260919-live3').replace('odyssey-analysis-candidate-v1.json?v=20260919-songs','odyssey-analysis-candidate-v1.json?v=20260919-refinement')
s=re.sub(r'/data/artwork-delivery-manifest\.[a-f0-9]+\.js','/data/'+bootName,s)
anchor='<script src="/mtgtools/odyssey/artwork-delivery.js?v=20260919-1"></script>';assert anchor in s
s=s.replace(anchor,anchor+'\n<script src="/mtgtools/odyssey/design-refinement.js?v=20260919-1"></script>',1)
assert 'fit:\'cover\'}}' in s;s=s.replace("fit:'cover'}}","fit:'cover',designDisposition:b.designDisposition||''}}",1)
app.write_text(s)
polish=APP/'studio-polish.js';s=polish.read_text();s=s.replace("  'use strict';","  'use strict';\n  const refinement=root.OdysseyRefinement||(typeof require==='function'?require('./design-refinement.js'):null);",1)
s=s.replace("  function glyph(t, pips) {","  function glyph(t, pips) {\n    const utility=refinement?.utilityGlyph(t);if(utility)return utility;",1)
s=s.replace('const art = !!pips[t], special =',"const art = !!pips[t]&&!refinement?.utilityGlyph(t), special =",1).replace("['T','Q','S','P'].includes(t)","['C','T','Q','S','P','E'].includes(t)",1)
s=s.replace('<span class="od-hybrid-parts">','<span class="od-hybrid-parts" data-parts="${t.split(\'/\').length}">',1)
start=s.index('  function rulesHTML(value, pips) {');end=s.index('  function install()',start)
s=s[:start]+"  function rulesHTML(value, pips) {\n    return refinement.rulesHTML(normalizeRules(value),t=>token(t)?symbolHTML(t,true,pips):escapeHTML('{'+t+'}'));\n  }\n"+s[end:]
start=s.index('    function decorate(card) {');end=s.index('    const oldFit',start)
s=s[:start]+'''    function decorate(card) {
      for(const host of card.querySelectorAll('.saga-chapter > span:last-child')){
        if(host.dataset.odSentenceLayout)continue;
        const source=host.textContent;host.innerHTML=rulesHTML(source,pips);host.dataset.odSentenceLayout='1';
      }
      for(const host of card.querySelectorAll('.special-meta')){
        if(host.dataset.odSymbols)continue;
        const text=host.textContent.split(' · ').map(x=>tokens(x)?.length?normalizeCost(x):x).join(' · ');
        host.innerHTML=escapeHTML(text).replace(/\\{([^{}]+)\\}/g,(whole,t)=>token(t)?symbolHTML(t,true,pips):whole);host.dataset.odSymbols='1';
      }
    }
'''+s[end:]
s=s.replace("if (label) label.textContent = 'v3.17 · art continuity';","if (label) label.textContent = 'v3.20 · text & locales';\n    refinement.mount();",1);polish.write_text(s)
css=APP/'studio-polish.css';css.write_text(css.read_text()+'''\n/* Soft sentence returns preserve ability grouping and do not add paragraph padding. */
.od-rule-sentence{margin:0;padding:0}.od-ability-label{font-weight:700}.od-sentence-return{line-height:inherit}
.od-symbol[data-symbol="Q"]{background:#29271f!important;color:#f5edda!important}.od-utility-glyph{overflow:visible}
.od-generic-value{font-variant-numeric:tabular-nums;line-height:1}.od-design-review{margin-top:10px;padding:10px;border:1px solid #655e45;border-radius:7px}.od-design-review[hidden]{display:none}.od-design-review-status{font-size:12px;line-height:1.4;margin-bottom:7px}
.od-hybrid-parts[data-parts="2"]{position:relative;display:block;width:100%;height:100%}
.od-hybrid-parts[data-parts="2"] .od-hybrid-half{position:absolute;inset:0;display:block;width:100%;height:100%}
.od-hybrid-parts[data-parts="2"] .od-hybrid-half:first-child{clip-path:polygon(0 0,100% 0,0 100%)}
.od-hybrid-parts[data-parts="2"] .od-hybrid-half:last-child{clip-path:polygon(100% 0,100% 100%,0 100%)}
.od-hybrid-parts[data-parts="2"] .od-hybrid-half>img,.od-hybrid-parts[data-parts="2"] .od-hybrid-half>svg{position:absolute;width:64%!important;height:64%!important;object-fit:contain}
.od-hybrid-parts[data-parts="2"] .od-hybrid-half:first-child>*{left:-1%;top:-1%}
.od-hybrid-parts[data-parts="2"] .od-hybrid-half:last-child>*{right:-1%;bottom:-1%}
@media print{.od-design-review,#odReplacementDialog{display:none!important}}
''')
index=APP/'index.html';s=index.read_text().replace('app.html?v=20260919-17','app.html?v=20260919-18').replace('studio-polish.css?v=20260918-6','studio-polish.css?v=20260919-8').replace('studio-polish.js?v=20260918-7','studio-polish.js?v=20260919-8');index.write_text(s)
# Update current expectations; do not alter archived historical ledgers.
p=ROOT/'scripts/odyssey-release-cycles.json';p.write_text(p.read_text().replace('ff-analog-common-town-duals',plan['cycleId']))
p=ROOT/'tests/odyssey-release.test.cjs';s=p.read_text().replace("current.datasetVersion,'2026-09-19.2'","current.datasetVersion,'2026-09-19.3'").replace('current.artworks.length,450','current.artworks.length,458').replace('20260919-live2','20260919-live3').replace('20260919-songs','20260919-refinement').replace('20260919-17','20260919-18');p.write_text(s)
# A small plain data snapshot for the authorised Sheet patch; no browser overrides or private keys.
(OUT/'changed-cards.json').write_text(json.dumps([c for c in current['cards'] if c!=oldCards[c['number']]],ensure_ascii=False,indent=2))
(OUT/'new-artworks.json').write_text(json.dumps([a for a,_ in acquired],ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in report.items() if k not in ['rateLimitAudit','artworksAdded','landCycle']},indent=2),flush=True)
