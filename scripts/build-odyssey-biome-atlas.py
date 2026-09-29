#!/usr/bin/env python3
"""Build an additive art-direction atlas. Colour affinity is NOT card colour identity.
Physical habitat, actual place, story interpretation and review confidence remain separate.
No source record, card, assignment, crop, rules or artist credit is rewritten.
"""
from pathlib import Path
from collections import Counter
import json,re,subprocess,csv,itertools
ROOT=Path(__file__).resolve().parents[1];PUB=ROOT/'public/mtgtools/odyssey';DATA=PUB/'data';OUT=ROOT/'biome-atlas-report';OUT.mkdir(exist_ok=True)
BOOK=lambda n:'https://www.theoi.com/Text/HomerOdyssey'+str(n)+'.html'
# code, name, first landscape, second landscape, story anchors, art-direction rationale,
# books, visually checked fits, visually checked partial studies, two sourcing queries.
P=[
('C','Colourless','Bare limestone skerries','Salt-worn shingle and exposed stone','The impersonal rocks and landing hazards of the voyage.','Form, weathering and scale without allegiance; colourless is not a synonym for unclassified.',[5,12],[766,757],[839],'Mediterranean bare limestone rocks seashore oil study','Ionian shingle shore weathered stone watercolour'),
('W','White','Sunlit grazing and cereal plains','Coastal sacrificial pasture','Helios\' cattle country; the cultivated mainland and Nestor\'s shore.','Open ground, sustenance, collective life and sacred boundaries.',[3,12],[661,865],[843],'Mediterranean cattle pasture sunlight historical painting','Sparta Eurotas plain wheat fields landscape engraving'),
('U','Blue','Open island channels','Still, sheltered landing coves','The sea voyage and Phorcys\' protected harbour on Ithaca.','Depth, distance, orientation and navigable water.',[5,13],[709,839],[645],'Ionian islands sea channel panorama Edward Lear','Ithaca enclosed cove quiet sea watercolour'),
('B','Black','Cimmerian mistbound shore','Asphodel meadow in deep shade','The coast of the dead and their meadow, not a medieval inferno.','Loss, concealment and mortality; darkness must come from the scene, not a dark scan.',[11,24],[],[832,764],'shadowed meadow mist riverbank landscape oil study','Cimmerian shore asphodel meadow historical painting'),
('R','Red','Volcanic scree and crater rims','Storm-scoured rocky headlands','Cape Malea\'s dangerous turn; southern Italian volcanic analogues for elemental peril.','Exposed energy, unstable ground and weather. Homer does not identify Aeolus\' island as a volcano.',[9,10],[795,799],[837],'Vesuvius crater scree plein air oil study','Cape Malea rocky headland storm historical landscape'),
('G','Green','Ithacan olive woodland','Parnassian boar-country thickets','Ithaca\'s trees and the wooded mountain hunt of Odysseus\' youth.','Rooted growth, shelter, age and unmanicured terrain.',[13,19,23],[748,749],[734],'Ithaca olive grove old trees landscape painting','Parnassus wooded ravine oak thicket historical landscape'),
('WU','White–Blue / Azorius','Sheltered Phaeacian harbour coast','Luminous Olympian high ridges','Scheria\'s harbour society and the gods\' serene height.','Refuge, ordered passage and clear distance. These are landscape readings, not Ravnican locations.',[6,7],[659],[716,630],'Corfu sheltered harbour wooded headland historic watercolour','Mount Olympus luminous summit Edward Lear landscape'),
('UB','Blue–Black / Dimir','Shadowed river confluences','Cave pools beneath a dark threshold','Oceanus, the rivers of Hades and the approach to the dead.','Water that hides its destination; submerged depth and loss.',[10,11],[649],[832],'Acheron dark river confluence willow banks painting','Mediterranean cave pool reflected light oil study'),
('BR','Black–Red / Rakdos','Night volcanic coast','Ash, fumaroles and scorched rock','Southern Italian volcanic analogues for destruction and the fiery river named in Circe\'s directions.','Irrecoverable violence and heat. Volcanoes are analogues, not proven Homeric coordinates.',[10,12],[801,802],[799],'Stromboli eruption night sea oil painting','Vesuvius fumarole black ash lava historical study'),
('RG','Red–Green / Gruul','Rugged volcanic foothills','Wind-bent upland scrub and rock','Cyclopean country through its Sicilian tradition; the wild mountain interior.','Vigorous growth against geological force, not a generic tropical jungle.',[9,19],[838],[791],'Etna foothills vegetation volcanic rock Thomas Cole Edward Lear','Mediterranean maquis wind bent trees rocky hillside oil study'),
('WG','White–Green / Selesnya','Laertes\' mixed-fruit orchard','Managed olive pasture and farm terraces','The remembered fruit trees of Laertes and Ithacan husbandry.','Cultivation, care and continuity. An olive grove alone is not the mixed orchard of Book 24.',[13,14,24],[858],[627,641,748],'Mediterranean pear fig apple pomegranate orchard landscape','Greek olive terraces sheep pasture historical painting'),
('WB','White–Black / Orzhov','Ancestral burial-mound plains','Pale funerary meadow margins','The burial and remembrance of the Trojan dead; the meadow of shades.','Memory maintained by ritual; open light beside mortality.',[11,24],[684,682],[],'Troad Achilles tumulus grass plain William Gell','classical burial mound cypress meadow landscape painting'),
('UR','Blue–Red / Izzet','Wind-lashed island straits','Thunderheads over breaking surf','Aeolus\' released winds and Poseidon\'s storm.','Moving air and water in collision; electricity is optional, not required.',[5,10],[818,754],[774],'Mediterranean thunderstorm coast oil study Johann Jakob Frey','breaking waves rocky shore sunset nineteenth century painting'),
('BG','Black–Green / Golgari','Persephone\'s willow-and-poplar grove','Root-torn woodland floor and fallen timber','Circe names the grove at the edge of the dead; deadwood is an environmental extension.','Growth and mortality intertwined, without inventing a tropical swamp.',[10],[746,747],[832],'willow poplar dark river grove landscape oil study','Mediterranean fallen tree roots decaying woodland painting'),
('WR','White–Red / Boros','Sun-struck limestone headlands','Dry citadel-country ridges and plains','Sounion and the heroic mainland approached through open, exposed country.','Clarity, vigilance and endurance in hard ground; avoid later fortresses as Bronze Age evidence.',[3,4],[860],[652,837],'Sounion sunlit limestone headland historical landscape','Mycenae dry ridge Argive plain landscape print'),
('UG','Blue–Green / Simic','Nausicaa\'s wooded river mouth','Spring-fed grotto and riparian woodland','Odysseus\' refuge at Scheria\'s river and Ogygia\'s fresh springs.','Freshwater renewal and protective growth, not simply blue sea beside a green hill.',[5,6],[841],[619,734],'Corfu wooded river mouth freshwater spring landscape','Mediterranean alder poplar cypress spring grotto painting'),
('WUB','White–Blue–Black / Esper','Sacred cave harbour','Ritual river junction under pale cliffs','Phorcys\' harbour and the Nymphs\' Cave; the rites at the meeting of the infernal rivers.','Protection, passage and mortality in a single threshold scene.',[10,11,13],[],[649,853],'Ithaca nymphs cave harbour limestone sacred landscape','river confluence dark cave pale cliffs historical painting'),
('UBR','Blue–Black–Red / Grixis','Charybdis\' lethal constriction','Night surf below a volcanic shore','The devouring passage and catastrophic weather of the voyage.','Water, destruction and unseen danger; a calm Messina postcard is not enough.',[12],[800],[774,801,837],'Strait Messina whirlpool storm rocks landscape painting','night volcanic coast heavy sea historical oil painting'),
('BRG','Black–Red–Green / Jund','Cyclopean cave-and-pasture wilderness','Scorched scrub with returning growth','The Cyclops\' herds and cave; Sicilian fire-and-regrowth imagery is an analogue.','Predation, vitality and disturbance in one environment, not three unrelated motifs.',[9],[],[838,746,795],'Sicily pastoral cave goats volcanic foothills painting','Mediterranean fire scorched scrub new growth oil study'),
('WRG','White–Red–Green / Naya','Ithacan upland farm mosaic','Sunlit pasture below rugged mountains','Ithacan crops and herds; Thrinacia\'s sacred abundance.','Food, inhabited continuity and muscular terrain; mountain-backed Thrinacia is a proposed composition.',[12,13,24],[843,862],[858],'Greek mountain backed pasture cultivated plain landscape','Ithaca olive terraces grazing land rugged hills painting'),
('WUG','White–Blue–Green / Bant','Scheria\'s garden-to-harbour landscape','Elysian meadow beside gentle sea','Alcinous\' irrigated abundance and the peaceful Elysium promised to Menelaus.','Shelter, fruitful order and living water. Elysium is not an Odysseus voyage stop.',[4,6,7],[630],[713,627],'Corfu sheltered green bay orchard landscape watercolour','classical Elysian meadow gentle coast landscape painting'),
('WBG','White–Black–Green / Abzan','Ancient orchard with dead and living wood','Ancestral grove beside tended fields','Laertes\' orchard as a meeting of generations; a grave beside it would be an invention.','Care persists across age and loss; require old growth and cultivation together.',[24],[],[748,746,684],'old Mediterranean orchard gnarled fruit trees fallen branch painting','cypress grove cultivated fields ancestral landscape oil'),
('WUR','White–Blue–Red / Jeskai','Delphic spring below bright crags','Beacon headland above an active sea','Pytho\'s oracle and the homeward sailors\' distant fires.','Sanctuary, orientation and elemental height; surviving Classical structures are later than the story.',[8,10],[646,872],[754],'Delphi Castalian spring cliff landscape Dodwell','Greek headland beacon sea sunset historical landscape'),
('UBG','Blue–Black–Green / Sultai','Ogygia\'s enclosing spring grove','Damp woodland channels at the dead\'s border','Calypso\'s beautiful captivity and Persephone\'s named riverbank trees.','Abundance plus enclosure and dark water; pretty vegetation alone is insufficient.',[5,10],[],[649,758,832],'dark cypress alder grove spring cave landscape painting','willow poplar river shaded roots nineteenth century oil'),
('WBR','White–Black–Red / Mardu','Troad burial ridge above the landing coast','Sunlit crag beside an inescapable killing cave','The cost of heroic war and the terrible choice at Scylla.','Duty and remembrance under violent exposure; a narrative reading of the landscape.',[12,24],[681],[684,837],'Troy tumulus ridge coast heroic landscape engraving','Scilla sheer cliff cave bright rock storm painting'),
('URG','Blue–Red–Green / Temur','Aeaean wooded ravine and torrent','Wild island mountain meeting a rough sea','Circe\'s wooded island and the voyage\'s untamed terrain.','Water movement, unruly growth and rock energy in one view.',[9,10],[734],[831,838],'Mediterranean wooded torrent rocky ravine plein air painting','wild island mountain forest rough sea historical landscape'),
('WUBR','Four colours — without Green','Bare strait of opposing perils','Salt-scarred shore of wrecks and burial cairns','Scylla and Charybdis as a composite landscape direction.','Keep sea, hard boundaries, danger and exposed light dominant; no-green does not mean no vegetation.',[12,24],[],[837,774,801],'Messina bare cliff storm sea cave landscape painting','rocky shore wreck burial mound historical seascape'),
('WUBG','Four colours — without Red','Ogygia\'s still four-spring enclosure','Orchard and shade meadow in quiet balance','Calypso\'s four springs; living and remembered land as a thematic synthesis.','Cultivation, water, mortality and growth without making action or fire the subject.',[5,24],[],[619,649,627],'enclosed Mediterranean garden four springs cave landscape','old orchard still water shadowed meadow painting'),
('WURG','Four colours — without Black','Living homeland watershed','Radiant summit-to-valley-to-sea panorama','Ithaca\'s varied land and Scheria\'s living abundance.','A continuous landscape of growth, water, cultivated order and energetic height, without death as its focus.',[6,7,13],[],[851,645,784],'Greek mountain valley cultivated fields coast panorama painting','Ithaca landscape orchard mountains harbour light watercolour'),
('WBRG','Four colours — without Blue','The inland oar-pilgrimage country','Dry pasture, old trees and a stony ridge','Tiresias\' inland prophecy and the enduring agricultural world.','Earth, work, age and harsh terrain; do not invent an exact inland route or require literal absence of every stream.',[11,24],[],[865,746,860],'Greek inland dry agricultural valley old trees painting','Mediterranean shepherd pasture stony ridge gnarled tree oil study'),
('UBRG','Four colours — without White','Unsettled island wilderness','Wooded ravine descending to volcanic tempest sea','Cyclopean and Aeaean wilderness read together as an art-direction synthesis.','Water, danger, geological force and growth without civic or cultivated order dominating.',[9,10],[],[838,734,758,799],'Sicily wild ravine vegetation volcanic coast storm painting','Mediterranean cave forest torrent mountain sea landscape'),
('WUBRG','Five colours','The complete homecoming landscape','An epic sea–land–sky panorama','Ithaca\'s return unites cultivated ground, wild hills, sea, weather and the weight of memory.','One coherent whole, not five stripes, five pasted scenes, or an automatic tag on every landscape.',[13,24],[],[645,851,659,784],'Ithaca panoramic landscape harbour cultivated valley wild mountain','Mediterranean epic landscape sea mountains orchard storm clearing')]
FAMILIES=[
('open-sea','Open sea and island channels',r'channel|\bat sea\b|\bsea\b|seascape|dardanell','U'),
('sheltered-cove','Harbours and sheltered coves',r'harbo[u]?r|\bcove\b|\bbay\b|\bport\b|\bgulf\b','U'),
('surf-coast','Breaking surf and storm coast',r'waves|surf|shipwreck|wreck|rough sea|sea storms','UR'),
('pale-headland','Rocky headlands and shore',r'cape|headland|scilla|scylla|coast|shore|faraglioni','C'),
('river-mouth','River mouths and riparian corridors',r'river|confluence|nile|alfeios|pineios|simois|simoes|scamander|pleistos','UG'),
('reed-marsh','Reedbeds and marshes',r'marsh|reedbed|wetland|swamp','BG'),
('dark-river','Shadowed rivers and backwaters',r'acheron|cocytus|styx|blackwater|dark river','UB'),
('lake','Still lakes and pools',r'lake|pool|stymphalia','U'),
('sea-cave','Wet caves and grotto pools',r'water cave|sea cave|cave pool|catabothra','UB'),
('dry-cave','Dry caves and rocky enclosures',r'grotto|cave','B'),
('olive-grove','Olive groves',r'olive|oliivi','G'),
('mixed-orchard','Mixed orchards and cultivated gardens',r'orchard|orange gardens|garden|pergola','WG'),
('dense-wood','Woodland and canopy',r'wood|forest|tree|grove|beech','G'),
('deadwood','Deadwood and exposed roots',r'dead tree|fallen|uproot|root','BG'),
('mountain-wood','Mountain woodland and scrub',r'wooded mountain|maquis|mountain forest','RG'),
('high-ridge','Mountain ridges and rock masses',r'mount|mountain|parnass|tayget|ridge|\brock|cliff|pinnacle|boulder','R'),
('volcanic-slope','Volcanic slopes and craters',r'etna|vesuvi|volcan|crater|stromboli','R'),
('volcanic-vent','Eruptions, lava and fumaroles',r'erupt|lava|fumarole|ash','BR'),
('pasture','Grazing pasture',r'cattle|cow|herd|pastur|shepherd|swineherd','WG'),
('farm-plain','Plains and farm mosaics',r'plain|field|agricultur|farm|campagna|\bvalley\b','W'),
('burial-plain','Burial mounds and remembered ground',r'tomb|burial|tumulus|cemetery|sepul','WB'),
('dim-meadow','Misty meadows and dark open ground',r'misty landscape|asphodel|cimmerian|moonlit landscape','B'),
('dunes','Sand dunes and shingle',r'dune|shingle|sand beach','C'),
('sky','Sky and weather studies',r'cloud|sky|skies|sunset|sunrise|dawn|storm|sunlight','U'),
('layered-panorama','Layered island and watershed panoramas',r'panorama|panoramic|view from the summit','')]
# Current canonical runtime merge, identical to the deployed Studio loading route.
js="const fs=require('fs'),vm=require('vm');const c={console};c.window=c;c.globalThis=c;vm.createContext(c);for(const f of ['data/odyssey-data.js','live-sheet-sync.js','live-sheet-art-patch.js','data/landscape-import.20260929.js','landscape-library.js'])vm.runInContext(fs.readFileSync('public/mtgtools/odyssey/'+f,'utf8'),c);process.stdout.write(JSON.stringify(c.ODYSSEY_DATA.artworks));"
arts=json.loads(subprocess.check_output(['node','-e',js],cwd=ROOT));assert len(arts)>=873
ids={a['id'] for a in arts};A={a['id']:a for a in arts};artid=lambda n:f'ART-{n:03d}'
profiles=[];fit_owner={};study_map={}
for code,name,b1,b2,story,why,books,fits,studies,q1,q2 in P:
 fits=[artid(n) for n in fits];studies=[artid(n) for n in studies]
 for aid in fits:
  assert aid in ids and aid not in fit_owner;fit_owner[aid]=code
 for aid in studies:assert aid in ids;study_map.setdefault(aid,[]).append(code)
 profiles.append(dict(code=code,name=name,colors=[] if code=='C' else list(code),biomes=[b1,b2],story=story,rationale=why,sources=[BOOK(n) for n in books],fitIds=fits,studyIds=studies,queries=[q1,q2],coverage='Reviewed landscape fit' if fits else 'Full-scene gap; partial references only',minimumNewDistinct=2 if len(code)<=2 or code=='C' else 1))
assert len(profiles)==32
assert {p['code'] for p in profiles}=={'C'}|{''.join(x) for n in range(1,6) for x in itertools.combinations('WUBRG',n)}
# Older landscape records are included without pulling narrative figures or pottery into the habitat index.
OLDER={57,59,60,64,69,71,77,78,89,90,116,119,122,124,144,145,147,153,166,169,170,251,252,253,254,255,256,257,258,259,260,261,262,264,288,303,332,384,395,396,452,453,454,455,456,457,458,463,466,467,471,472,476,545,546,568,570,586,587}
# Specific visual checks supersede title-only habitat guesses; no claim of a new species identification.
OVERRIDE={766:['high-ridge'],757:['pale-headland'],661:['farm-plain','dense-wood'],865:['farm-plain','high-ridge'],709:['open-sea','high-ridge'],839:['pale-headland','open-sea'],764:['dry-cave'],795:['volcanic-slope'],799:['volcanic-vent'],748:['olive-grove'],749:['dense-wood'],716:['sheltered-cove'],659:['high-ridge','farm-plain'],759:['dry-cave'],801:['volcanic-vent','surf-coast'],802:['volcanic-vent'],838:['volcanic-slope','high-ridge'],791:['mountain-wood','high-ridge'],858:['farm-plain','river-mouth','dense-wood'],641:['farm-plain','mixed-orchard'],684:['burial-plain'],682:['burial-plain','farm-plain'],818:['sky','pale-headland'],754:['surf-coast'],746:['deadwood','high-ridge'],747:['deadwood','dense-wood'],652:['pale-headland'],860:['high-ridge','farm-plain'],619:['dry-cave','dense-wood'],841:['river-mouth','dense-wood'],649:['sea-cave','lake'],853:['dry-cave','river-mouth'],774:['surf-coast','open-sea'],800:['volcanic-vent','open-sea'],805:['volcanic-slope'],843:['high-ridge','farm-plain'],862:['farm-plain','sheltered-cove'],630:['sheltered-cove','pale-headland'],713:['river-mouth','sheltered-cove'],646:['river-mouth','high-ridge'],872:['high-ridge','mountain-wood'],758:['dry-cave'],832:['dim-meadow','dense-wood'],681:['burial-plain','farm-plain','pale-headland'],837:['pale-headland'],734:['river-mouth','dense-wood','high-ridge'],831:['mountain-wood','sky'],851:['layered-panorama','high-ridge','open-sea'],645:['layered-panorama','sheltered-cove','farm-plain'],784:['sky','farm-plain'],627:['mixed-orchard','sheltered-cove']}
WARN={627:'Orange orchard is not the named fruit mixture of Alcinous or Laertes; botanical-period review required.',641:'Foreground spiky rosette plants need botanical-period review; do not present this as a literal ancient orchard.',652:'Classical temple dominates; unsuitable as a literal Bronze Age building.',716:'Modern rigged vessels and inhabited waterfront; landscape reference, not an ancient reconstruction.',774:'Modern ship dominates the foreground; weather study only without a safe crop.',805:'Pompeian architecture dominates the foreground; not an ancient Greek city.',837:'Only 500 × 309 px and a later castle: location reference, not print-ready.',758:'Dry grotto; no visible spring has been established. Do not classify as a wet cave.',759:'Dry grotto; no visible water has been established. Do not classify as a wet cave.',619:'Later stairs and buildings intrude; a glen does not by itself establish a spring.',831:'Alpine setting outside the Mediterranean; compositional reference only.'}
PRIMARY_FAMILY_ORDER=['deadwood','olive-grove','mixed-orchard','volcanic-vent','volcanic-slope','sea-cave','dark-river','reed-marsh','burial-plain','dim-meadow','surf-coast','pasture','mountain-wood','dense-wood','river-mouth','sheltered-cove','lake','dry-cave','high-ridge','farm-plain','pale-headland','dunes','sky','open-sea','layered-panorama']
family_map={f[0]:f for f in FAMILIES};entries=[]
for a in arts:
 aid=a['id'];n=int(aid[4:]);eligible=n>=617 or n in OLDER
 fam=[];primary='';review='Not a landscape';basis='No biome classification applied to narrative, object or figure art.'
 if eligible:
  title=str(a.get('title',''))
  fam=OVERRIDE.get(n,[f[0] for f in FAMILIES if re.search(f[2],title,re.I)])
  if 'sea-cave' in fam and 'dry-cave' in fam:fam.remove('dry-cave')
  # Empty records remain unclassified; never convert missing data to colourless.
  if not fam:review='Needs habitat review';basis='Landscape record has no reliable habitat token in its catalogue title.'
  else:
   fam=sorted(set(fam),key=PRIMARY_FAMILY_ORDER.index)
   primary=fit_owner.get(aid) or family_map[fam[0]][3]
   review='Visual fit' if aid in fit_owner else ('Visual study' if n in OVERRIDE else 'Metadata suggestion')
   basis='Composition checked; colour assignment is a curatorial interpretation, not a source fact.' if n in OVERRIDE else 'Candidate habitats and colour inferred from catalogue title; visual confirmation required.'
  if not a.get('imageUrl'):review='Source only';basis='No acquired image; metadata classification is provisional.'
 if aid in fit_owner:primary=fit_owner[aid]
 warning=WARN.get(n,'')
 if eligible and not warning and re.search(r'castle|monastery|temple|church|village|town|ruins|house|bridge|cemetery|pergola',str(a.get('title','')),re.I):warning='Review later architecture, costume and framing before any ancient-world card crop.'
 entries.append(dict(artId=aid,isLandscape=eligible,primaryColor=primary,biomes=fam,review=review,reviewedFits=[fit_owner[aid]] if aid in fit_owner else [],studies=study_map.get(aid,[]),basis=basis,warning=warning,title=a.get('title',''),artist=a.get('artist',''),source=a.get('source',''),imageUrl=a.get('imageUrl',''),rights=a.get('rights',''),medium=a.get('medium',''),institution=a.get('institution',''),collection=a.get('landscapeCollection',''),tags=a.get('tags',''),imageWidth=a.get('imageWidth',''),imageHeight=a.get('imageHeight','')))
for p in profiles:
 p['suggestedCount']=sum(e['isLandscape'] and e['primaryColor']==p['code'] and not e['reviewedFits'] and e['review']!='Source only' for e in entries)
 p['fitCount']=len(p['fitIds']);p['studyCount']=len(p['studyIds'])
 p['gapNote']='No reviewed full-scene fit. Studies are ingredients, not proof that this combination is covered.' if not p['fitIds'] else 'Existing fits cover part of this direction; final rights, crop and print checks remain separate.'
summary={'artworksScanned':len(arts),'landscapeRecords':sum(e['isLandscape'] for e in entries),'classifiedLandscapes':sum(e['isLandscape'] and bool(e['biomes']) for e in entries),'visualFits':len(fit_owner),'visuallyInspectedCompositions':len(OVERRIDE),'colourIdentities':32,'biomeDirections':64,'physicalHabitatFamilies':len(FAMILIES),'fullSceneGapIdentities':[p['code'] for p in profiles if not p['fitIds']],'cardAssignmentsChanged':0,'originalArtworkRecordsChanged':0}
notice='Art-direction affinities, not card colour identities or Homeric facts. Named settings, real depicted places and environmental analogues remain distinct. Four- and five-colour directions are compositional syntheses; references do not equal complete coverage.'
payload={'schema':'odyssey-biome-atlas/v1','version':'20260929-biomes1','notice':notice,'summary':summary,'profiles':profiles,'families':[{'id':f[0],'label':f[1]} for f in FAMILIES],'artworks':entries}
raw=json.dumps(payload,ensure_ascii=False,indent=2);(DATA/'biome-atlas.20260929.json').write_text(raw);(DATA/'biome-atlas.20260929.js').write_text('window.ODYSSEY_BIOME_ATLAS = '+raw.replace('</','<\\/')+';\n')
(OUT/'summary.json').write_text(json.dumps(summary,indent=2));(OUT/'payload.json').write_text(raw)
# Canonical spreadsheet import tables retain exact IDs and intentionally do not rewrite original A:U.
with (OUT/'artwork-index.tsv').open('w',newline='') as f:
 w=csv.writer(f,delimiter='\t');w.writerow(['Art ID','Primary colour affinity','Biome families','Assessment','Other colour studies'])
 for e in entries:
  if e['isLandscape']:w.writerow([e['artId'],e['primaryColor'],'; '.join(e['biomes']),e['review'],'; '.join(e['studies'])])
with (OUT/'colour-atlas.tsv').open('w',newline='') as f:
 w=csv.writer(f,delimiter='\t');w.writerow(['Colour','Name','Biome direction 1','Biome direction 2','Story anchor','Colour rationale','Reviewed fits','Partial studies','Coverage','Search 1','Search 2','Sources'])
 for p in profiles:w.writerow([p['code'],p['name'],*p['biomes'],p['story'],p['rationale'],', '.join(p['fitIds']),', '.join(p['studyIds']),p['coverage'],*p['queries'],' ; '.join(p['sources'])])
# The next action is prepared, not scheduled or silently executed.
brief='''# NEXT ACTION — Odyssey biome-led landscape sourcing

Execute a targeted acquisition round using the current Colour & Biome Atlas, not a generic search for beautiful Greek scenery.

## Objective and scope
Find existing historical paintings, watercolours, drawings and prints that fill named ecological and compositional gaps. Do not generate substitute art. Retain every original artwork title, depicted location, artist, date, medium, institution and source identity. Do not change card designs, card colour identity, current art assignments, locked art or saved crops.

The atlas covers all 32 subsets of W/U/B/R/G, including colourless. Colour affinity is a curatorial proposal; it is not measured from pixel colour and is not an established Homeric fact. Four-colour directions describe a scene emphasis, not the literal absence of plants, water or death. Five-colour work must be a unified landscape, not automatically every multicoloured image.

## First acquisition priorities
1. Black, blue–black and black–green: dim open meadow, dark freshwater confluence, willow/poplar grove, riparian roots and decay. Do not substitute a dry grotto for wetland or a monochrome print for black atmosphere.
2. White–green, white–black–green and blue–black–green: old mixed-fruit orchard, fallen and living wood together, an enclosing freshwater grove. Existing olive pictures and orange gardens do not establish the specific orchard of Homer.
3. White–blue–black, black–red–green and white–black–red: a sacred wet cave threshold, genuinely integrated cave/pasture/geological terrain, and burial ridge with an exposed shore. Require the combined environment, not isolated ingredients.
4. Named geographical gaps: Phorcys' harbour and cave, Ogygia's four springs, the Sirens' meadow, Thrinacian pasture, Telepylus' enclosing harbour, Acheron and Dodona. Keep real-place traditions qualified. No precise invented ancient coordinates.
5. Four-colour and five-colour panoramas: attempt after the lower-colour habitat gaps; do not let these consume the whole round. A partial view remains a study.

## Search order
Start with complete object catalogues and coherent portfolios already known: Travelogues/Laskaridis (Lear, Cartwright, Dodwell, Gell, Stackelberg, Wordsworth); Albertina's Cartwright impressions; The Met, NGA, Cleveland, Smithsonian and Art Institute open collections; Fondation Custodia's object catalogue and the underlying holding museums. Harvard's Lear archive is a geographically filtered search, not a claim to have imported all 3,500 drawings. Respect rate limits and access blocks; do not evade them. Recover the known missing Canea and Acheron images only from a lawful accessible source, and update existing IDs rather than duplicate them.

Search exact places first, then the same Mediterranean habitat, then a clearly labelled environmental analogue outside the region. Use artist and historical spelling variants: Ithaca/Ithaki/Vathy/Vathi; Corfu/Kerkyra; Circeo/Circello; Acheron/Souli/Suli; Sparta/Eurotas/Taygetus; Cephalonia/Kefalonia; Zante/Zakynthos; Cythera/Kythera/Cerigo; Pylos/Navarino; Etna/Aetna; Messina/Messene; Scilla/Scylla; Avernus/Averno. An artist's birthplace in metadata is not the depicted place.

Use habitat terms as well as names: olive grove, mixed orchard, pasture, reedbed, willow, poplar, cave pool, root mass, river mouth, shingle, maquis, limestone cliff, fumarole, volcanic scree, burial mound, rough sea, shadowed meadow. Expand in French (oliviers, verger, marais, saules, peupliers, grotte, rivage, sous-bois), Italian (uliveto, frutteto, palude, salice, pioppo, grotta, scogliera), German (Olivenhain, Obstgarten, Sumpf, Weiden, Pappeln, Grotte, Felsküste). These are search prompts, not asserted catalogue titles.

## Literary checks
Book 5: Ogygia has alder, poplar, cypress, a vine, four springs and flowering meadow; do not default to a tropical palm island. Books 6–7: distinguish the river refuge, harbour and irrigated orchard of Scheria. Book 10: Persephone's named poplars and willows; the rivers' meeting place; Aeaea's woodland. Book 12: distinguish Scylla's high cave from Charybdis' low rock and water; Thrinacia needs pasture. Book 13: Phorcys' sheltered harbour and Nymphs' Cave. Book 19: Parnassian hunt. Book 24: Laertes' remembered pear, apple, fig and vine planting. Elysium in Book 4 concerns Menelaus. The colour assignments and most mixed landscape briefs are our design interpretation, not Homer's explicit classifications.

## Acquisition and deduplication
For each candidate collect the institution object page and object ID; artist, date, medium and actual place; distinct composition ID; stable source-image URL; actual downloaded pixel dimensions; supplied-image rights statement and its URL; source checksum and preview checksum; rights/print/crop caveats; proposed habitat IDs; exactly supported colour affinity; scene-fit versus partial study; literary hook and geography relationship. Use existing ART IDs on a match. Deduplicate by accession, canonical source, title+artist+date and perceptual composition comparison. Different scans, crops and reprints of one composition are not new artworks. Versions genuinely painted separately require separate object evidence.

Download and decode the actual image before counting it as acquired. Prefer 2,000+ pixels wide or a source supporting the intended card crop at 300 ppi; lower-resolution discoveries can enter the reference queue but do not count toward print-ready coverage. Test both standard and larger-art crops against the real Studio art window. Do not upscale merely to pass a pixel threshold. Keep uncropped originals available and never overwrite a locked crop.

## Review and acceptance
Inspect the full image, not just the caption. Reject irrelevant vegetation, later dominant castles/churches/ships/clothes, decorative frames or a modern city that a safe crop cannot remove. Check for introduced plants rather than assuming all nineteenth-century Mediterranean scenes are ancient-compatible. A dry cave is not a spring grotto; a forest is not necessarily willow/poplar; a vague landscape is not five-colour coverage. Unknown species, rights or geography remain unknown. Preserve uncertain and restricted items as source leads with appropriate flags; never silently mark them production-cleared.

Target 40–60 distinct review candidates, then promote at least two credible options per high-priority one-/two-colour gap and one per difficult three-colour scene where evidence allows. Counts are goals, not permission to pad. For each full-scene gap report either a qualifying work or the exact sources searched and the unresolved feature. Four-/five-colour profiles can remain gaps. No new card art is assigned during this search action.

## Publish and verify
Append or enrich the canonical Artwork Library without changing A:U of unrelated records. Update biome associations, source rights, crop warnings and the catalogue's exact and partial counts. Refresh both Odyssey Studio and the landscape/biome galleries; maintain old deep links, collection and round filters. Check ID uniqueness, all new preview responses and decoded dimensions, exact colour filters, family filters, reviewed-only and suggested views, empty states, and unchanged card/coverage/crop data. Report new works, recovered images, duplicate/rejected counts, exact gaps closed, partial-only gaps, and live verification links separately.

## Per-colour query pairs and current scene gaps
'''
for p in profiles:
 brief+='\n### '+p['code']+' — '+p['name']+'\n'
 brief+='Directions: '+p['biomes'][0]+'; '+p['biomes'][1]+'.\n\n'
 brief+='Story: '+p['story']+'\n\n'
 brief+='Search: `'+p['queries'][0]+'`\n\nSearch: `'+p['queries'][1]+'`\n\n'
 brief+='Existing reviewed fits: '+(', '.join(p['fitIds']) or 'none')+'. Partial studies: '+(', '.join(p['studyIds']) or 'none')+'. '+p['gapNote']+'\n'
 brief+='Sources: '+' ; '.join(p['sources'])+'\n'
(DATA/'biome-search-next-action.md').write_text(brief);(OUT/'next-action.md').write_text(brief)
print(json.dumps(summary,indent=2))
