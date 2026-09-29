#!/usr/bin/env python3
"""Publish navigation and derived metadata only. No changes to underlying art/card files."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'public/mtgtools/odyssey';OUT=ROOT/'biome-atlas-report';OUT.mkdir(exist_ok=True)
protected=['data/odyssey-data.js','live-sheet-sync.js','live-sheet-art-patch.js','data/landscape-import.20260929.js','data/landscape-import.20260929.json']
before={x:hashlib.sha256((P/x).read_bytes()).hexdigest() for x in protected}
subprocess.run(['python','scripts/build-odyssey-biome-atlas.py'],cwd=ROOT,check=True)
# Install the matcher in the existing search path, preserving the free-text search and selection workflow.
p=P/'artwork-tools.js';s=p.read_text()
old='const rows = searchArtworks(source, artSearchQuery);'
new='const rows = searchArtworks(source, artSearchQuery).filter(a => !root.OdysseyBiomeAtlas || root.OdysseyBiomeAtlas.matches(a));'
if old in s:s=s.replace(old,new,1)
else:assert new in s,'Artwork search integration changed'
old="if (!artSearchQuery && artSearchScope === 'suggested') return [...suggested];"
new="if (!artSearchQuery && artSearchScope === 'suggested' && !root.OdysseyBiomeAtlas?.hasFilters()) return [...suggested];"
if old in s:s=s.replace(old,new,1)
else:assert new in s,'Suggested-list integration changed'
old=": artSearchScope === 'all' ? ART.length + ' artworks' : suggested.length + ' suggested';"
new=": root.OdysseyBiomeAtlas?.hasFilters() ? visible.length + ' biome matches' : artSearchScope === 'all' ? ART.length + ' artworks' : suggested.length + ' suggested';"
if old in s:s=s.replace(old,new,1)
else:assert new in s,'Search count integration changed'
p.write_text(s)
# Load before the app's inline logic; the module mounts after DOMContentLoaded.
p=P/'app.html';s=p.read_text()
if 'biome-navigation.js' not in s:
 marker='<script src="/mtgtools/odyssey/transform-faces.js'
 assert s.count(marker)==1
 s=s.replace(marker,'<script src="/mtgtools/odyssey/data/biome-atlas.20260929.js?v=biomes1"></script>\n<script src="/mtgtools/odyssey/biome-navigation.js?v=biomes1"></script>\n'+marker,1)
# artwork-tools is loaded by a resource loader in some versions; bump only that cache key.
s=re.sub(r'(artwork-tools\.js\?v=)[^"\s\'<>]+',r'\g<1>biomes1',s)
p.write_text(s)
# Existing gallery keeps its own collection/round scope and adds the shared filters.
p=P/'landscape-library.html';s=p.read_text()
if 'biome-navigation.js' not in s:
 s=s.replace('<nav>','<nav><a href="./biome-atlas.html">Colour &amp; biome atlas</a> · ',1)
 s=s.replace('<p id="status"','<div id="legacyBiomeFilters" class="biome-selects"></div><p id="legacyBiomeSummary"></p><p id="status"',1)
 s=s.replace('<script src="./data/landscape-import.20260929.js','<script src="./data/biome-atlas.20260929.js?v=biomes1"></script><script src="./biome-navigation.js?v=biomes1"></script><script src="./data/landscape-import.20260929.js',1)
 old="list=data.artworks.filter(a=>(!group.value"
 new="list=data.artworks.filter(a=>window.OdysseyBiomeAtlas.matches(a)&&(!group.value"
 assert old in s;s=s.replace(old,new,1)
 marker="if(new URLSearchParams(location.search).get('round')==='2')"
 init="window.OdysseyBiomeAtlas.fillControls(document.getElementById('legacyBiomeFilters'),'legacy-biome-',()=>{document.getElementById('legacyBiomeSummary').textContent=window.OdysseyBiomeAtlas.describeSelection();render();});"
 assert marker in s;s=s.replace(marker,init+marker,1)
 s=s.replace('</style>','.biome-selects{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.biome-selects label{display:flex;flex-direction:column;flex:1;min-width:175px;font-size:12px}.biome-selects select{width:100%;font-size:13px}#legacyBiomeSummary{font-size:13px;color:#c8d1bb}</style>',1)
p.write_text(s)
after={x:hashlib.sha256((P/x).read_bytes()).hexdigest() for x in protected};assert before==after,'Protected artwork/card data changed'
(OUT/'protected-files.json').write_text(json.dumps({'before':before,'after':after,'unchanged':True},indent=2))
# Save runtime input for read-only verification without requiring another network round trip.
for name in ['biome-navigation.js','biome-atlas.html','landscape-library.html']:(OUT/name).write_bytes((P/name).read_bytes())
(P/'data/biome-atlas-audit.20260929.json').write_text(json.dumps({'scope':'Derived metadata and navigation only','protectedFilesUnchanged':True,'cardAssignmentsChanged':0,'allThirtyTwoColourSubsets':True,'taxonomy':'Curatorial interpretation; primary-source book links attached to each direction','assessment':'Visual direction fits, partial studies, metadata suggestions and source-only records are distinct'},indent=2))
print('Biome atlas built; protected files unchanged.')
