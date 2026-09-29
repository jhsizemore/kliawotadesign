"""One-time exact-anchor integration; no canonical cards, art assignments or saved crops changed."""
from pathlib import Path
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1];web=R/'public/mtgtools/Odyssey/scry'
def replace(path,old,new):
 p=R/path;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(path,s.count(old),old[:100])
 p.write_text(s.replace(old,new))
f='scripts/build-odyssey-public-renderer.cjs'
replace(f,"function node(number,side='front'){const m=shown(number,side);if(!m)throw Error('Unknown Odyssey card '+number);", "function node(number,side='front',frameStyle=null){let m=shown(number,side);if(!m)throw Error('Unknown Odyssey card '+number);if(frameStyle==='full-art'||frameStyle==='standard')m={...m,frameStyle};")
replace(f,"return ['number','face'];", "return ['number','face','frame-style'];")
replace(f,"const key=this.getAttribute('number')+'|'+(this.getAttribute('face')||'front');", "const key=this.getAttribute('number')+'|'+(this.getAttribute('face')||'front')+'|'+(this.getAttribute('frame-style')||'');")
replace(f,"engine.node(Number(this.getAttribute('number')),this.getAttribute('face')||'front')", "engine.node(Number(this.getAttribute('number')),this.getAttribute('face')||'front',this.getAttribute('frame-style'))")
replace(f,'return {model:shown,node,fit,applyArtView,imageForArt,frameFamily,sourceHash,setPlacements', 'return {model:shown,node,fit,applyArtView,imageForArt,frameFamily,sourceHash,symbol:setSymbolHTML,rules:formatRulesText,setPlacements')
f='public/mtgtools/Odyssey/scry/focused-launch.js'
replace(f,'C.mechanics=FEATURES;','FEATURES.forEach(feature=>Object.assign(feature,window.OdysseySetShowcase.features[feature.id]));\nC.mechanics=FEATURES;')
replace(f,"+'</p><div class=\"feature-colours\"", "+'</p>'+window.OdysseySetShowcase.rules(cat,f)+'<div class=\"feature-colours\"")
replace(f,"+credit(a)+'</div></article>';", "+credit(a)+'<p class=\"landscape-context\">'+C.esc(f.landscapeNote||'')+'</p></div></article>';")
s=BeautifulSoup((web/'index.html').read_text(),'html.parser')
s.select_one('.opening-sub').clear();s.select_one('.opening-sub').append(BeautifulSoup('Homer’s famous epic, retold as a <strong>Magic: The Gathering</strong> set.<br/>Gods, monsters and the long voyage home—illustrated by historical art.','html.parser'))
if not s.select_one('script[src*="set-showcase.js"]'):
 script=s.select_one('script[src*="focused-launch.js"]');script.insert_before(BeautifulSoup('<script defer src="/mtgtools/Odyssey/scry/set-showcase.js?v=20260929-showcase1"></script>','html.parser'))
 s.head.append(BeautifulSoup('<link rel="stylesheet" href="/mtgtools/Odyssey/scry/set-showcase.css?v=20260929-showcase1"/><script defer src="/mtgtools/Odyssey/scry/contact-form.js?v=20260929-showcase1"></script>','html.parser'))
for el in s.select('script[src]'):
 if 'focused-launch.js' in el['src'] or 'public-renderer.generated.js' in el['src']:el['src']=el['src'].split('?')[0]+'?v=20260929-showcase1'
(web/'index.html').write_text(str(s))
for name in ['social/index.html','art.html']:
 p=web/name;s=p.read_text();import re
 s=re.sub(r'(public-renderer.generated.js\?v=)[^"\s>]+',r'\g<1>20260929-showcase1',s);p.write_text(s)
replace('src/odyssey-worker.js',"import { routePlacements } from './odyssey-placement.mjs';", "import { routePlacements } from './odyssey-placement.mjs';\nimport { routeContact } from './odyssey-contact.mjs';")
replace('src/odyssey-worker.js','const response = await routePlacements(request, env)', 'const response = await routeContact(request, env) || await routePlacements(request, env)')
p=R/'tests/odyssey-exhibition-browser.py';s=p.read_text();s=s.replace("url.split('?')[0].endswith('/api/art-placement')", "url.split('?')[0].endswith(('/api/art-placement','/api/contact'))");p.write_text(s)
print('Ship, native full-art treatment, enlarged rules, landscape direction and optional contact endpoint integrated.')
