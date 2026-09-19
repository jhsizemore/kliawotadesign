from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'public/mtgtools/odyssey'
p=APP/'app.html';s=p.read_text()
old="function defaultsFor(n){const b=baseCard(n),cv=cov(n),aid=b.primaryArt||cv.primary||'',a=artById[aid]||{};return{displayName:b.displayName||b.name,mana:b.mana,frame:b.frame,type:b.type,rules:b.rules,rarity:b.rarity,pt:b.pt,flavor:'',layout:b.layout,artHeight:'normal',frameStyle:'standard',artId:aid,imageUrl:b.imageUrl||a.imageUrl||'',credit:b.credit||a.credit||'',source:b.source||a.source||'',zoom:1,focusX:0,focusY:0,fit:'cover',designDisposition:b.designDisposition||''}}"
new="function defaultsFor(n){const b=baseCard(n),cv=cov(n),aid=b.primaryArt||cv.primary||'',a=artById[aid]||{},yes=v=>v===true||String(v||'').toUpperCase()==='YES';return{name:b.name,displayName:b.displayName||b.name,underlyingName:b.underlyingName||'',mana:b.mana,mv:b.mv,color:b.color,frame:b.frame,type:b.type,rules:b.rules,rarity:b.rarity,pt:b.pt,origin:b.origin||'',originFull:b.originFull||((b.origin==='RPR'||b.origin==='Reprint')?'Reprint':'New'),mechanics:b.mechanics||'',archetypes:b.archetypes||'',story:b.story||'',status:b.status||'',treatment:b.treatment||'',skeletonClass:b.skeletonClass||'',cycleIds:[...(b.cycleIds||[])],showcase:[...(b.showcase||[])],productLayer:b.productLayer||'',singleFaceSpecialPlan:b.singleFaceSpecialPlan||'',signpostPair:b.signpostPair||'',functionalWords:b.functionalWords??'',changeStatus:b.changeStatus||'',narrativeEra:b.narrativeEra||'',storyTarget:b.storyTarget||'',storyRethemeRequired:yes(b.storyRethemeRequired),storySourceBand:b.storySourceBand||'',artReviewRequired:yes(b.artReviewRequired),flavorStoryElement:b.flavorStoryElement||'',flavorMatchScore:b.flavorMatchScore??'',flavorMatchRationale:b.flavorMatchRationale||'',flavor:'',layout:b.layout,artHeight:'normal',frameStyle:'standard',artId:aid,imageUrl:b.imageUrl||a.imageUrl||'',credit:b.credit||a.credit||'',source:b.source||a.source||'',zoom:1,focusX:0,focusY:0,fit:'cover',designDisposition:b.designDisposition||''}}"
assert old in s,'defaultsFor baseline changed'
s=s.replace(old,new,1)
needle='<script src="/mtgtools/odyssey/data/odyssey-data.js?v=20260919-live3"></script>'
assert needle in s
if 'card-sheet-editor.js' not in s:s=s.replace(needle,needle+'\n<script src="/mtgtools/odyssey/card-sheet-editor.js?v=20260919-1"></script>',1)
start=s.index('function renderList(){');end=s.index('\nfunction selectCard',start)
block=s[start:end]
block=block.replace("m.displayName+' '+b.name+' '+(b.underlyingName||'')+' '+m.rules+' '+(b.mechanics||'')+' '+(b.archetypes||'')+' '+(b.story||'')+' '+m.type","m.displayName+' '+m.name+' '+(m.underlyingName||'')+' '+m.rules+' '+(m.mechanics||'')+' '+(m.archetypes||'')+' '+(m.story||'')+' '+m.type")
block=block.replace("b.status!=='PROTOTYPE'","m.status!=='PROTOTYPE'").replace("b.status!=='REVISE'","m.status!=='REVISE'").replace("b.status!=='REPRINT TEST'","m.status!=='REPRINT TEST'").replace("b.status!=='KEEP'","m.status!=='KEEP'").replace("b.treatment!=='GODZILLA'","m.treatment!=='GODZILLA'")
block=block.replace("esc(b.status||'')","esc(m.status||'')").replace("b.status==='REVISE'","m.status==='REVISE'")
s=s[:start]+block+s[end:]
s=s.replace("const liveUrl='https://docs.google.com/spreadsheets/d/1ZDM1yAqYIpQpeHMfK45tbrZaVoi0K00515Z-t8jsUgg/edit';","const liveUrl='https://docs.google.com/spreadsheets/d/1RtYrpZq3NuBZz4jbalJSYZysNN_bHQyqMPfqb4AV66Q/edit';",1)
p.write_text(s)
idx=APP/'index.html';x=idx.read_text().replace('app.html?v=20260919-18','app.html?v=20260919-19');idx.write_text(x)
pol=APP/'studio-polish.js';x=pol.read_text().replace("v3.20 · text & locales","v3.21 · full authoring");pol.write_text(x)
rel=APP/'data/release.json';d=json.loads(rel.read_text());d['appRevision']='full-sheet-editor-v1';d['sheetEditor']={'spreadsheetId':'1RtYrpZq3NuBZz4jbalJSYZysNN_bHQyqMPfqb4AV66Q','sheetName':'Card File v1.0 Candidate','fields':35,'slotAndJsonIdLocked':True,'writeMode':'review + optimistic concurrency + RAW changed-cell writes + read-back verification'};rel.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
print('Full authoring fields integrated; canonical Card File link and v3.21 cache version set.')

rt=ROOT/'tests/odyssey-release.test.cjs';t=rt.read_text().replace('app\\.html\\?v=20260919-18','app\\.html\\?v=20260919-19');rt.write_text(t)
