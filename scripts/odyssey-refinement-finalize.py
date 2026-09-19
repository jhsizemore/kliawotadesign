"""Preserve an unfinished authoring row and measure real text instead of decorative panel boxes."""
from pathlib import Path
import json,re,hashlib
ROOT=Path(__file__).resolve().parents[1];APP=ROOT/'public/mtgtools/odyssey';OUT=Path('/tmp/odyssey-refinement')
read=lambda f:json.loads((APP/'data'/f).read_text())
write=lambda f,d:(APP/'data'/f).write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
planPath=ROOT/'scripts/odyssey-refinement-plan.json';plan=json.loads(planPath.read_text());plan['removeLimits'].pop('146',None);plan['deferredLimits']={'146':'Shared authoring row 147 is partially cleared, including its rules cell. Preserve the published rule and do not restore or infer discarded authoring values.'};planPath.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
current=read('odyssey-data.json');candidate=read('odyssey-analysis-candidate-v1.json');report=read('refinement-report.json')
item=next(r for r in report['rateLimitAudit'] if r['number']==146);oldRule=item['before']
for d in [current,candidate]:
 c=next(c for c in d['cards'] if c['number']==146)
 if c['rules']!=oldRule:
  c['functionalWords']+=len(oldRule.split())-len(c['rules'].split());c['rules']=oldRule;c['changeStatus']=c['changeStatus'].replace(' · '+plan['revision'],'')
 for c in d['cards']:
  if c.get('localeCycle')==plan['cycleId']:
   c['underlyingName']='';c['treatment']=''  # These custom taplands are not functional Holdout Settlement reprints.
  if c.get('devotionPresentation') and re.search(r'\bDevotion\b',c.get('mechanics','').split('; Devotion')[0]):c['mechanics']=c['mechanics'].removesuffix('; Devotion')
 d['ffSkeleton']['softAudit']['functionalWordMeans']={r:{'count':len(group),'mean':round(sum(c['functionalWords'] for c in group)/len(group),1)} for r in ['C','U','R','M'] if (group:=[c for c in d['cards'] if c['rarity']==r and 'Basic' not in c['type']])}
 d['integrity']['sha256']=hashlib.sha256(json.dumps(d['cards'],ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
item.update(decision='defer — cleared authoring row',reason=plan['deferredLimits']['146'],after=oldRule)
report['limitsRemoved']=15;report['rulesChanged']=25;report['deferredLimitRows']=plan['deferredLimits']
write('odyssey-data.json',current);write('odyssey-analysis-candidate-v1.json',candidate)
(APP/'data/odyssey-data.js').write_text('window.ODYSSEY_DATA='+json.dumps(current,ensure_ascii=False,separators=(',',':'))+';\n')
release=read('release.json');release['cardsSha256']=current['integrity']['sha256'];write('release.json',release);write('refinement-report.json',report)
(OUT/'refinement-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
changes=json.loads((OUT/'changed-cards.json').read_text());nums={c['number'] for c in changes}-{146};(OUT/'changed-cards.json').write_text(json.dumps([c for c in current['cards'] if c['number'] in nums],ensure_ascii=False,indent=2))
test=ROOT/'tests/odyssey-refinement.test.cjs';test.write_text(test.read_text().replace('intended 16 restrictions','intended 15 restrictions').replace('report.limitsRemoved,16','report.limitsRemoved,15'))
app=APP/'app.html';s=app.read_text()
start=s.index(' const overflow=()=>{',s.index('function fitCardTypography(card)'))
end=s.index('\n let size=fitDown',start)
new=r''' const overflow=()=>{
  if(rules.scrollHeight>rules.clientHeight+.5)return true;
  const ruleRect=rules.getBoundingClientRect(),visualScale=ruleRect.height/rules.offsetHeight;
  const bottomLimit=ruleRect.bottom-((parseFloat(getComputedStyle(rules).paddingBottom)||0)+2*scale)*visualScale;
  const walker=document.createTreeWalker(rules,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){
   if(!node.nodeValue.trim()||node.parentElement.closest('.od-symbol,.saga-medallion'))continue;
   const range=document.createRange();range.selectNodeContents(node);
   const rects=[...range.getClientRects()].filter(r=>r.height>0&&r.width>0);
   if(!rects.length)continue;
   let limit=bottomLimit;
   const panel=node.parentElement.closest('.special-box,.rule-main');
   if(panel&&rules.contains(panel)){
    const style=getComputedStyle(panel),rect=panel.getBoundingClientRect();
    if(style.overflowY==='hidden'||style.overflowY==='clip')limit=Math.min(limit,rect.bottom-(parseFloat(style.paddingBottom)||0)*visualScale);
   }
   if(rects.some(r=>r.bottom>limit+.5))return true;
  }
  return false;
 };'''
s=s[:start]+new+s[end:];app.write_text(s)
polish=APP/'studio-polish.js';s=polish.read_text();s=s.replace('      decorate(card);\n      oldFit(card);','      decorate(card);\n      card.classList.remove("od-rules-compact");\n      oldFit(card);\n      if(card.querySelector(".rules")?.dataset.fitState==="overflow"){card.classList.add("od-rules-compact");oldFit(card);}',1);polish.write_text(s)
css=APP/'studio-polish.css';css.write_text(css.read_text()+'''
/* A requested return is a soft line break, not paragraph spacing. */
.rules br.od-sentence-return{display:revert!important;content:normal!important;margin:0!important}
.render-card.od-rules-compact:not(.kind-saga):not(.kind-battle):not(.kind-adventure):not(.kind-prepare) .rules{padding-top:8px!important;padding-bottom:6px!important;line-height:1.12!important}
.render-card.od-rules-compact.kind-adventure .rule-main,.render-card.od-rules-compact.kind-prepare .rule-main{padding-top:8px;padding-bottom:5px}
.render-card.od-rules-compact.kind-adventure .special-box,.render-card.od-rules-compact.kind-prepare .special-box{padding-top:7px!important;padding-bottom:5px!important;padding-left:24px!important}
.od-hybrid-parts[data-parts="2"] .od-hybrid-half>.od-generic-value{position:absolute;width:60%;height:60%;display:grid;place-items:center;font-size:.72em;line-height:1}
''')
print('15 rate-limit clauses changed; cleared row 147 preserved. Soft returns and content-aware text-fit checks applied.')
