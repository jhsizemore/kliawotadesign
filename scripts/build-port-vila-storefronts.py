#!/usr/bin/env python3
"""Reproducible, fail-closed two-building overlay for the retained 0.1.24 release."""
from pathlib import Path
import hashlib, json, sys
ROOT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1]
SITE=ROOT/'public/portvilasandbox'
ASSETS=SITE/'assets'
SOURCE='index-iSZdlO1J.js'
EXPECTED='d320752f376c178925127817f057842046671e5c8d3293ae560b117b0b705a5e'
source=(ASSETS/SOURCE).read_bytes()
if hashlib.sha256(source).hexdigest()!=EXPECTED: raise SystemExit('Baseline entry changed; rebase the scoped patch before building.')
evidence=json.loads((ROOT/'source/port-vila/storefront-observations-2026-09-29.json').read_text())
world=json.loads((SITE/'data/world.json').read_text())
if world['manifest']['checksum']!=evidence['baselineChecksum']: raise SystemExit('World baseline changed.')
by_id={str(b['sourceId']):b for b in world['buildings']}
for key,record in evidence['buildings'].items():
    if by_id[key]['footprint']!=record['footprint']: raise SystemExit('Reference footprint no longer matches '+key)
fragment=(ROOT/'scripts/port-vila-storefronts.fragment.js').read_text()
text=source.decode()
a=text.index('function Wz('); b=text.index('function Gz(',a)
function=text[a:b]
if not function.endswith('return i}'): raise SystemExit('Renderer terminal return changed.')
function=function[:-len('return i}')]+'''return pvRefineFacade(i,e,t,n,r,{Group:Br,BoxGeometry:Wo,Mesh:Ra,Shape:ws,ExtrudeGeometry:cc,edges:Uz,floors:TR,distanceToEdge:de})}'''
text=text[:a]+'const PV_STOREFRONT_EVIDENCE='+json.dumps(evidence,separators=(',',':'))+';\n'+fragment+'\n'+function+text[b:]
notes={
 '319762715':'Partial façade match: yellow parking-facing wall, nine paired upper openings and an arched ground opening. Shop wings, signage and unseen elevations remain schematic.',
 '332685581':'Partial façade match: white corner block with narrow window bands on two photographed upper elevations. Ground-floor signs, pane counts and folded roof detail remain unverified.'}
palettes={key:dict(wall=int(rec['palette']['wall'][1:],16),roof=int(rec['palette']['roof'][1:],16),page=22,note=notes[key]) for key,rec in evidence['buildings'].items()}
needle='MR={1350722273:'
if text.count(needle)!=1: raise SystemExit('Palette insertion point changed.')
text=text.replace(needle,'MR={'+json.dumps(palettes,separators=(',',':'))[1:-1]+',1350722273:')
files={SOURCE:'index-storefront-1.js','research-CJAMIhjN.js':'research-storefront-1.js','research-data-DXfJnZDb.js':'research-data-storefront-1.js','vision-CScsXS3G.js':'vision-storefront-1.js'}
for old,new in files.items():
    content=text if old==SOURCE else (ASSETS/old).read_text()
    for old_import,new_import in files.items(): content=content.replace(old_import,new_import)
    (ASSETS/new).write_text(content)
index=SITE/'index.html'; index.write_text(index.read_text().replace(SOURCE,files[SOURCE]))
build=SITE/'BUILD.json'; data=json.loads(build.read_text())
data.update(version='0.1.25',publishedAt='2026-09-29T01:15:00.000Z',release='north-frontage-photo-1',note='Partial photo-reference pass on Fung Kuei and Aircalin near the former Olympic clearance. Independent DUAP July 2025 report, page 22; no Street View imagery, current-occupancy claim, footprint, floor, foundation or demolition change.')
data['assets']=[('assets/'+files.get(Path(p).name,Path(p).name)) for p in data['assets']]
build.write_text(json.dumps(data,indent=2)+'\n')
print(json.dumps({'release':data['release'],'buildings':list(evidence['buildings']),'entry':files[SOURCE],'entry_bytes':(ASSETS/files[SOURCE]).stat().st_size,'preserved_original_sha256':EXPECTED},indent=2))
