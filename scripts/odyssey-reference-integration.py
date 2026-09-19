from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'public/mtgtools/odyssey'
refs=json.loads((APP/'data/card-references.json').read_text())
assert refs['schema']=='odyssey-reference-cards/v1'
assert refs['cards'] and refs['originalCards']==len(refs['cards'])
app=APP/'app.html';s=app.read_text()
needle='<script src="/mtgtools/odyssey/data/odyssey-data.js?v=20260919-live3"></script>'
assert needle in s
if 'card-references.js' not in s:
    s=s.replace(needle,needle+'\n<script src="/mtgtools/odyssey/data/card-references.js?v=20260919-1"></script>\n<script src="/mtgtools/odyssey/card-reference-browser.js?v=20260919-1"></script>',1)
app.write_text(s)
idx=APP/'index.html';x=idx.read_text().replace('app.html?v=20260919-19','app.html?v=20260919-20');idx.write_text(x)
pol=APP/'studio-polish.js';x=pol.read_text().replace('v3.21 · full authoring','v3.22 · card references');pol.write_text(x)
release=APP/'data/release.json';d=json.loads(release.read_text());d['appRevision']='card-references-v1';d['referenceCards']={'schema':refs['schema'],'originalCards':refs['originalCards'],'totalReferences':sum(len(v['references']) for v in refs['cards'].values()),'scryfallBulkUpdatedAt':refs['scryfallBulk'].get('updatedAt'),'source':'Scryfall Oracle Cards bulk data'};release.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
rt=ROOT/'tests/odyssey-release.test.cjs';t=rt.read_text().replace('app\\.html\\?v=20260919-19','app\\.html\\?v=20260919-20');rt.write_text(t)
print(json.dumps(d['referenceCards'],indent=2))
