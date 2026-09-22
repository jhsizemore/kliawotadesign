from pathlib import Path
import collections,json,re
ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'public/mtgtools/odyssey'
refs=json.loads((APP/'data/card-references.json').read_text())
assert refs['schema']=='odyssey-reference-cards/v2'
assert refs['cards'] and refs['totalCards']==len(refs['cards'])

app=APP/'app.html'
s=app.read_text()
data_script=re.search(r'<script src="/mtgtools/odyssey/data/odyssey-data\.js\?v=[^"]+"></script>',s)
assert data_script, 'Odyssey data script tag not found'
if 'card-references.js' not in s:
    needle=data_script.group(0)
    s=s.replace(needle,needle+'\n<script src="/mtgtools/odyssey/data/card-references.js?v=20260922-ref2"></script>\n<script src="/mtgtools/odyssey/card-reference-browser.js?v=20260922-ref2"></script>',1)
s=re.sub(r'card-references\.js\?v=[^"\']+','card-references.js?v=20260922-ref2',s)
s=re.sub(r'card-reference-browser\.js\?v=[^"\']+','card-reference-browser.js?v=20260922-ref2',s)
app.write_text(s)

idx=APP/'index.html'
x=idx.read_text()
x=re.sub(r'app\.html\?v=[^"\']+','app.html?v=20260922-ref2',x)
idx.write_text(x)

release=APP/'data/release.json'
d=json.loads(release.read_text())
d['version']='2026-09-22.4'
d['revision']='14A2-ff-lattice-rebuild+studio-notes-20260922-v1+references-v2'
d['appRevision']='14A2-reference-rebuild-v2'
d['referenceCards']={
    'schema':refs['schema'],
    'cards':refs['totalCards'],
    'totalReferences':sum(len(v['references']) for v in refs['cards'].values()),
    'roles':dict(collections.Counter(r['role'] for v in refs['cards'].values() for r in v['references'])),
    'scryfallBulkUpdatedAt':refs['scryfallBulk'].get('updatedAt'),
    'source':'Scryfall Oracle Cards bulk data',
    'policy':'best-rate + normal-rate + mechanic/set-tech + template + splashy build-around',
}
release.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
print(json.dumps(d['referenceCards'],indent=2))
