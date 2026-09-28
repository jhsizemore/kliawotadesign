"""One-time, anchor-checked integration. Never alters card or artwork datasets."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
def edit(name,old,new):
 p=ROOT/name;s=p.read_text()
 if new in s:return
 if s.count(old)!=1:raise RuntimeError(f'{name}: expected one integration anchor, got {s.count(old)}')
 p.write_text(s.replace(old,new))
edit('src/odyssey-worker.js',"import { handleSync } from './odyssey-sync.mjs';","import { handleSync } from './odyssey-sync.mjs';\nimport { routePlacements } from './odyssey-placement.mjs';")
edit('src/odyssey-worker.js','const response = await handleSync(request, env);','const response = await routePlacements(request, env) || await handleSync(request, env);')
edit('src/odyssey-sync.mjs',"import core from '../public/mtgtools/odyssey/art-sync-core.js';","import core from '../public/mtgtools/odyssey/art-sync-core.js';\nimport { placementWorkspace } from './odyssey-placement.mjs';")
edit('src/odyssey-sync.mjs',"    if (url.pathname === NOTES_API) return this.fetchNotes(request);","    if (url.pathname === '/mtgtools/odyssey/api/art-placement') {\n      const task = (this.placementTail || Promise.resolve()).then(() => placementWorkspace(request, this.ctx.storage));\n      this.placementTail = task.catch(() => {});\n      return task;\n    }\n    if (url.pathname === NOTES_API) return this.fetchNotes(request);")
edit('public/mtgtools/odyssey/app.html','</body></html>','<script src="/mtgtools/odyssey/art-placement-core.js?v=20260929-placement1"></script>\n<script src="/mtgtools/odyssey/art-placement-studio.js?v=20260929-placement1"></script>\n</body></html>')
p=ROOT/'public/mtgtools/odyssey/index.html';s=p.read_text();s=re.sub(r'(app\.html\?v=)[^"\s<>]+',r'\g<1>20260929-placement1',s);p.write_text(s)
for name in ['public/mtgtools/Odyssey/scry/index.html','public/mtgtools/Odyssey/scry/social/index.html']:
 p=ROOT/name;s=p.read_text()
 if 'scry/placement-sync.js' not in s:
  marker=re.search(r'<script\b[^>]*src=["\']/mtgtools/odyssey/public-renderer.generated.js[^>]*></script>',s)
  if not marker:raise RuntimeError(name+': renderer script missing')
  old=marker.group();new='<script defer src="/mtgtools/odyssey/art-placement-core.js?v=20260929-placement1"></script>'+re.sub(r'(public-renderer.generated.js\?v=)[^"\']+',r'\g<1>20260929-placement1',old)+'<script defer src="/mtgtools/Odyssey/scry/placement-sync.js?v=20260929-placement1"></script>'
  s=s.replace(old,new);p.write_text(s)
f='scripts/build-odyssey-public-renderer.cjs'
edit(f,"read('transform-faces.js')].join", "read('transform-faces.js'),read('art-placement-core.js')].join")
edit(f,'function createEngine(data){\\n','function createEngine(data,placementSnapshot=window.ODYSSEY_PUBLIC_PLACEMENT||window.OdysseyPlacement.empty()){\\n let placementRecords=window.OdysseyPlacement.snapshot(placementSnapshot).records;\\n')
edit(f,"return window.OdysseyPolish.normalizeCard(window.OdysseyTransformFaces.face(model(number),side));", "const m=window.OdysseyPolish.normalizeCard(window.OdysseyTransformFaces.face(model(number),side));return window.OdysseyPlacement.apply(m,placementRecords,imageForArt(m));")
edit(f,'return {model:shown,node,fit,applyArtView,imageForArt,frameFamily,sourceHash};','return {model:shown,node,fit,applyArtView,imageForArt,frameFamily,sourceHash,setPlacements(value){placementRecords=window.OdysseyPlacement.snapshot(value).records;}};')
edit(f,'window.OdysseyStudioRenderer={initialize,createEngine,sourceHash,css,get engine(){return engine;}};','window.OdysseyStudioRenderer={initialize,createEngine,sourceHash,css,setPlacements(value){window.ODYSSEY_PUBLIC_PLACEMENT=window.OdysseyPlacement.snapshot(value);if(engine){engine.setPlacements(value);document.querySelectorAll(\'odyssey-studio-card\').forEach(el=>{el.renderKey=null;el.render();});}},get engine(){return engine;}};')
edit(f,"document.querySelectorAll('odyssey-studio-card').forEach(el=>el.render());return engine;", "document.querySelectorAll('odyssey-studio-card').forEach(el=>{el.renderKey=null;el.render();});return engine;")
edit('tests/odyssey-exhibition-browser.py', "assert not api_requests, 'The public page requested the editor API'", "assert all(url.split('?')[0].endswith('/api/art-placement') for url in api_requests), 'The public page requested a private editor API'")
print('Artwork placement integration installed; canonical card data unchanged.')
