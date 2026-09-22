#!/usr/bin/env python3
"""Inventory and exact draw diagnostics; not a game or draft simulator."""
from pathlib import Path
from math import comb
from collections import Counter
import json
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'docs/odyssey-design-round-20260922'
cards=json.loads((OUT/'candidate-cards.json').read_text())['cards']; by={c['number']:c for c in cards}
common=[c for c in cards if c['rarity']=='C' and 'Land' not in c['type']]
# Manually reviewed rules-based roles. Enchantment creature is not "enchanted";
# casting a card from exile is not entering the battlefield directly from exile.
roles={'foodSource':[8,31,74,108,136,137,139,141], 'manifest':[80,88,116],
 'directBlink':[5,7], 'castFromExile':[14,112,123], 'ownGraveyardDeparture':[37,123,125,142,220],
 'selfMill':[123,125,126,128,142,214], 'creatureSacrificeOutlet':[101],
 'survival':[12,32,117,132,140,220], 'vehicle':[64,85,145],
 'creatureInteraction':[8,14,23,26,37,38,45,46,49,94,113,120,122,127,129,135],
 'combatTrick':[1,7,13,23,41,44,118,131], 'fixing':[3,48,105,107,119,128,134]}
for nums in roles.values():
 assert all(by[n]['rarity']=='C' for n in nums)
notes={
'WU':('Recognition / return','bridge added; needs games','Two common direct-return spells (005, 007) now support both signposts. Mentor and Nausicaa also explicitly reward turning face up; the common Omen and Nausicaa Adventure supply hidden creatures. Casting a foretold creature still enters from the stack. Mentor’s recognition untap is capped once each turn; choose timing carefully around Survival.'),
'UB':('Hidden identity / graveyard','split support','Tiresias has Foretell, Escape and recovery support. Circe has two common Manifest sources but no friendly common Aura in these colours. Enchantment creatures do not satisfy enchanted. Plan: make the face-down sacrifice line the initial Circe test; do not count the Omens as creature enchantment.'),
'BR':('Consumption / sacrifice','testable, narrow Food','Two attack-trigger signposts supply repeatable outlets, and black has several death effects. Only colourless Salt-Cured Fish supplies Food at common in this pair. Plan: test artifact/creature sacrifice first; treat Hearthfire Cook as cross-pair support rather than a BR theme guarantee.'),
'RG':('Labour / combat / Survival','testable','Five common Survival bodies, big creatures and shared Vehicles form a clear route. Early untap tricks compete with Survival; using them can still be correct to save a creature. Plan: compare attack-first and crew-first lines without automatically moving every untap to the end step.'),
'GW':('Hospitality / household labour','testable','The pair has seven coloured common Food sources plus Salt-Cured Fish, four Survival bodies and cheap white creatures. Laertes has Libation Attendant, Traveler’s Amulet and Olive-Oil Lamp as common nonland MV1 recovery targets, alongside lands. Plan: test whether this narrow second signpost earns its slot.'),
'WB':('Death / household attrition','exploitation engine added','Antinous consumes another creature or Food at your end step, grows and drains opponents. Medon rewards creature deaths while protecting continuity through recovery. Common Food sources 008, 108 and 136 and death-effect creatures supply the engine. The timing prevents an ordinary free sacrifice outlet on demand; copied triggers and extra end steps remain possible.'),
'UR':('Seafaring / spells','two distinct lanes','Aeolus rewards Vehicles while the Wooden Horse rewards instants/sorceries. Flash Omens are enchantment spells and do not feed the Saga’s recovery or discount. Plan: test a Vehicle deck with useful instants; do not label every spell as instant/sorcery support.'),
'BG':('Graveyard departures / endurance','testable','Five common own-graveyard departure sources across the pair, counting Maidservants targeting your own graveyard; Escape can move several cards at once, while land recovery needs a land in the graveyard and a tapped worker. Plan: track available fuel and legal recovery objects, not just mill counts.'),
'RW':('Crew / coordinated attack','testable','Three colourless Vehicles and three common Survival bodies are accessible. Delayed ship recovery preserves Survival. Plan: test the three-mana ship and team-tap spell together for overly decisive attacks; resolve Telemachus after other relevant Survival triggers.'),
'GU':('Manifest / uncertain voyage','density watch','Two common Manifest sources feed both signposts. Four owned cards in exile is a separate, demanding threshold: foretold cards stop contributing after being cast. Plan: measure sustained exile counts; do not infer four cards in exile from four past exile events.')}
deck_common={
'WU':[103,103,108,108,77,87,87,110,112,115,115,107,119,64,85,5,7,8,94,113,116],
'UB':[77,87,87,80,80,112,115,119,123,124,125,125,126,128,64,26,101,113,116,127,142],
'BR':[67,67,83,84,80,123,124,125,126,126,128,117,132,133,134,64,26,38,101,127,135],
'RG':[48,48,67,84,88,88,105,117,130,132,133,137,140,141,220,64,31,38,41,135,139],
'GW':[103,108,108,48,32,88,107,110,111,137,140,141,220,64,85,5,8,23,31,74,139],
'WB':[103,108,108,110,111,123,124,125,125,126,126,128,37,64,8,26,94,101,127,129,142],
'UR':[77,77,87,112,115,119,67,67,83,117,132,133,134,64,85,11,14,35,38,113,135],
'BG':[48,48,80,88,105,123,124,125,125,126,128,137,140,141,220,64,26,101,127,139,142],
'RW':[103,108,108,12,110,111,107,67,83,117,132,133,134,64,85,145,8,23,38,44,135],
'GU':[48,48,77,87,88,88,112,115,119,105,137,140,141,220,64,14,35,41,113,116,139]}
def accessible(c,pair):return c['color']=='C' or set(c['color'])<=set(pair)
def probability_at_least(N,K,n,k):
 return sum(comb(K,i)*comb(N-K,n-i) for i in range(k,min(K,n)+1) if 0<=n-i<=N-K)/comb(N,n)
pairs=[]; decks=[]
for pair,(theme,status,note) in notes.items():
 pool=[c for c in common if accessible(c,pair)]
 signposts=[c for c in cards if c.get('signpostPair')==pair]
 assert len(signposts)==2
 allocation={role:[by[n]['id'] for n in nums if accessible(by[n],pair)] for role,nums in roles.items()}
 entry={'pair':pair,'theme':theme,'status':status,'assessment':note,'commonPool':[c['id'] for c in pool],
 'creatures':[c['id'] for c in pool if 'Creature' in c['type']],
 'cheapCreatures':[c['id'] for c in pool if 'Creature' in c['type'] and c['mv']<=2],
 'enchantments':[c['id'] for c in pool if 'Enchantment' in c['type']],
 'signposts':[{'id':c['id'],'name':c['name'],'rules':c['rules']} for c in signposts], 'roles':allocation}
 pairs.append(entry)
 nums=deck_common[pair]; assert len(nums)==21
 assert all(by[n]['rarity']=='C' and accessible(by[n],pair) for n in nums)
 selected=[by[n] for n in nums]+signposts
 cheap=sum('Creature' in c['type'] and c['mv']<=2 for c in selected)
 deck={'pair':pair,'construction':'Hand-built diagnostic list, not drafted or played. 21 commons + both uncommon signposts + 17 basic lands split 9/8. Doubles assume availability, not a real pool.',
 'nonlands':[{'id':by[n]['id'],'name':by[n]['name'],'copies':qty} for n,qty in sorted(Counter(c['number'] for c in selected).items())],
 'basicLands':{pair[0]:9,pair[1]:8},'cards':40,'creatures':sum('Creature' in c['type'] for c in selected),
 'cheapCreatureCopies':cheap,'manaValueCurve':dict(sorted(Counter(c['mv'] for c in selected).items())),
 'chanceCheapCreatureInFirst8':round(probability_at_least(40,cheap,8,1),4),
 'chanceAtLeast3LandsInFirst9':round(probability_at_least(40,17,9,3),4)}
 decks.append(deck)
result={'schema':'odyssey-common-mechanics-audit/v1','method':'Manual role classification with exact hypergeometric draw calculations. Probabilities ignore mulligans, casting colours and sequencing. Card counts are distinct IDs; deck counts include copies. No booster distribution, drafting, opponent decisions or actual games are simulated.',
 'pairs':pairs,'diagnosticDecks':decks,'playedMatches':0,'drafts':0,
 'fixedDefects':[{'id':'ODY-142','issue':'Target is selected before milling.','fix':'Choose the small creature during resolution so newly milled cards are eligible.'},{'id':'ODY-125','issue':'Adding enchantment type enables unintended self-recovery.','fix':'Recover another enchantment card; maintain access to other enchantments.'}],
 'remainingGates':['Lock booster distribution before draft claims.','Expose the canonical Manifest Fate reminder; published card records use the custom action without defining it. Audit uses existing reference notes: top two, manifest one, exile the other.','WU recognition and WB exploitation now have revised cards; rates, repeatability and draft access still need games.','Play these lists; these calculations are not results of played games.']}
(OUT/'common-mechanics-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
lines=['# Common mechanics pass','',result['method'],'','| Pair | Creatures | MV ≤2 creatures | Enchantments | Status |','|---|---:|---:|---:|---|']
for p in pairs:lines.append(f"| {p['pair']} | {len(p['creatures'])} | {len(p['cheapCreatures'])} | {len(p['enchantments'])} | {p['status']} |")
for p in pairs:lines.extend(['',f"## {p['pair']} — {p['theme']}",'',p['assessment']])
lines.extend(['','## Diagnostic deck access','','Ten 40-card hand-built lists are stored in the JSON. These are test fixtures, not drafted pools or recommended finished decks.','', '| Pair | Creatures | Cheap copies | Cheap creature in first 8 |','|---|---:|---:|---:|'])
for d in decks:lines.append(f"| {d['pair']} | {d['creatures']} | {d['cheapCreatureCopies']} | {d['chanceCheapCreatureInFirst8']:.1%} |")
lines.extend(['','## Remaining gates','']+['- '+x for x in result['remainingGates']])
(OUT/'common-mechanics-audit.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'pairs':len(pairs),'diagnosticDecks':len(decks),'playedMatches':0,'fixedDefects':result['fixedDefects']},indent=2))
