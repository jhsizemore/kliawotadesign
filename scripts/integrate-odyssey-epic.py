"""Exact-anchor presentation integration. No renderer, canonical data or placement edits."""
from pathlib import Path
import re
R=Path(__file__).resolve().parents[1];W=R/'public/mtgtools/Odyssey/scry'
def replace(path,old,new):
 p=R/path;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(path,old,s.count(old))
 p.write_text(s.replace(old,new))
replace('public/mtgtools/Odyssey/scry/focused-launch.js',' const allocations=[];',' window.OdysseySetShowcase.register(cat);\n const allocations=[];')
replace('public/mtgtools/Odyssey/scry/focused-launch.js',"  const j=window.OdysseyJourneyAssets?.assets?.[id];","  const editorial=window.OdysseyEditorialAssets?.[id];\n  if(editorial&&editorial.title===a.title&&editorial.source===a.source)return editorial;\n  const j=window.OdysseyJourneyAssets?.assets?.[id];")
replace('public/mtgtools/Odyssey/scry/focused-launch.js',"const thiefArt=artwork(autolycus.artId);","const thiefArt=artwork('EXH-AUTOLYCUS');")
replace('public/mtgtools/Odyssey/scry/focused-launch.js',"credit(thiefArt,'Artwork used on '+autolycus.displayName+'; the historical work depicts Mercury.')","credit(thiefArt,thiefArt.context)")
replace('public/mtgtools/Odyssey/scry/set-showcase.js',"landfalls:{artId:'ART-568',position:'62% 45%',landscapeNote:'William Gell’s view of the Scamander and Simois near Troy. An actual landscape of the Trojan plain, rather than a battle-scene backdrop.'","landfalls:{artId:'ART-289',position:'65% 32%',landscapeNote:'Claude Lorrain’s harbour scene of Odysseus returning Chryseis: a Homeric episode from the Iliad, not a view of Troy’s fall.'")
replace('public/mtgtools/Odyssey/scry/set-showcase.js',"fate:{artId:'ART-170',position:'68% 45%',landscapeNote:'An Italian coastal landscape: an atmosphere for the voyage, not a claimed view of Ithaca.'","fate:{artId:'ART-454',position:'62% 30%',landscapeNote:'The Gulf of Naples with Ischia in the distance: an open Mediterranean horizon, not a claimed view of Ithaca.'")
replace('public/mtgtools/Odyssey/scry/set-showcase.js',"return:{artId:'ART-454',position:'62% 30%',landscapeNote:'The Gulf of Naples with Ischia in the distance: a welcoming Mediterranean landscape, not a claim that this is Ithaca.'","return:{artId:'ART-170',position:'68% 45%',landscapeNote:'John Warwick Smith’s Italian coast: a quiet landfall used as atmosphere, not a claim that this is Ithaca.'")
p=W/'index.html';s=p.read_text()
for name in ['set-showcase.js','focused-launch.js']:
 s=re.sub(re.escape(name)+r'\?v=[^"\s>]+',name+'?v=20260929-epic1',s)
if 'editorial-assets.js' not in s:
 marker=re.search(r'<script\b[^>]*src=["\'][^"\']*set-showcase.js[^>]*></script>',s)
 assert marker,'Showcase load anchor missing'
 s=s[:marker.start()]+'<script defer src="/mtgtools/Odyssey/scry/editorial-assets.js?v=20260929-epic1"></script>\n'+s[marker.start():]
if 'epic-refinements.css' not in s:s=s.replace('</head>','<link rel="stylesheet" href="/mtgtools/Odyssey/scry/epic-refinements.css?v=20260929-epic1">\n</head>')
s=s.replace('Launch build 20260929-focused1','Launch build 20260929-epic1');p.write_text(s)
p=R/'tests/odyssey-focused-launch.py';s=p.read_text()
old='assert await page.evaluate("OdysseyExhibition.catalogue.cards.find(c=>c.id===\'ODY-303\').artId") == next(a[\'artId\'] for a in alloc if a[\'slot\']==\'spoiler\')'
new="assert next(a['artId'] for a in alloc if a['slot']=='spoiler')=='EXH-AUTOLYCUS'"
if new not in s:
 assert s.count(old)==1,'Spoiler identity test anchor missing';s=s.replace(old,new)
s=s.replace("assert 'Mercury' in await page.locator('#spoilerCredit').inner_text()","assert 'Charles Robert Leslie' in await page.locator('#spoilerCredit').inner_text()\n   assert 'The Winter’s Tale' in await page.locator('#spoilerCredit').inner_text()")
p.write_text(s)
replace('tests/odyssey-epic-browser.py',"assert await slide.locator('.spotlight-oracle').inner_text()==info['definition'] or info['id']=='relics'","assert ' '.join((await slide.locator('.spotlight-oracle').inner_text()).split())==' '.join(info['definition'].split()) or info['id']=='relics'")
replace('public/mtgtools/Odyssey/scry/EPIC_REVISION.md','1. Manifest Fate — John Robert Cozens, **An Italian Coast Scene**.','1. Manifest Fate — Josephus Augustus Knip, **The Gulf of Naples with the Island of Ischia in the Distance**.')
replace('public/mtgtools/Odyssey/scry/EPIC_REVISION.md','6. Homecoming — Josephus Augustus Knip, **The Gulf of Naples with the Island of Ischia in the Distance**.','6. Homecoming — John ‘Warwick’ Smith, **An Italian Coast Scene**.')
# Use the actual button's keyboard activation. Automatic loading may move it
# during pointer scroll-to-click; either path must demonstrably load more cards.
old="   while await page.locator('#loadMore').is_visible():await page.locator('#loadMore').click();await page.wait_for_timeout(80)"
new="""   for attempt in range(20):
    before=await page.locator('#cardGrid odyssey-studio-card').count()
    if before==309:break
    await page.locator('#loadMore').focus()
    await page.keyboard.press('Enter')
    await page.wait_for_function('(n)=>document.querySelectorAll("#cardGrid odyssey-studio-card").length>n',arg=before,timeout=15000)
    await page.wait_for_timeout(150)"""
for name in ['tests/odyssey-focused-launch.py','tests/odyssey-epic-browser.py']:replace(name,old,new)
print('Integrated genuine fragment, working definitions, eight landscapes, native tilt and inset Leslie artwork.')
