# Odyssey flavour foundation — first-pass checkpoint

Status: review candidate; the design contract is not complete.

Base: main at `7d8828cd15ecc92a0de7eb1d577a8ad6bcbde03d`, Studio release
`2026-09-22.5`, dataset `2026-09-22.3`. Retrieved 22 September 2026.

## Completed in this checkpoint

- Reconciled the live dataset, repository and 13 core authoring-sheet fields across
  all 309 records. No normalized sheet differences. Archived seven open notes.
- Authored 309 first-pass briefs: actions, sequences, emotions, portrayal
  distinctions and mechanical hooks. Commons were assessed first. Higher-rarity
  attributes are currently expressed within the action and portrayal prose.
- Created an isolated 33-card candidate, including 23 commons, five Omens,
  Saga-unweaving rare Penelope and Iphigenia’s actual sacrifice (corrected by Hunter).
- Preserved 309 cards, the rarity allocation, 40 lands, one DFC and artwork
  assignments. Common enchantments rise from two to nine; creatures from 33 to 36.
- Recorded all 309 cards as missing dedicated quotation text, and verified five
  short quotation candidates. Existing flavour commentary is not quotation text.
- Recorded source distinctions, cycle membership, reference comparisons and
  per-card test questions. Twelve changes have newly verified benchmark cards.

## Verification and limits

Candidate structural assertions pass. Existing reference-card tests pass 11/11.
The generated report's JavaScript was executed against a DOM stub: all 309 cards,
33 changed-card results, 23 changed commons and the Penelope search behaved as
expected. This is functional verification, not visual browser verification.
Chromium installation failed; rendered desktop/mobile inspection remains pending.

No matches, drafts or Commander games have been played. Pack-access calculations
are explicitly hypothetical analytical diagnostics. Most source passages and
quotation choices still require detailed review. Production references, quotation
fields, card renders and authoring-sheet updates remain outstanding.

Production data, the authoring sheet and the live Studio note queue are unchanged.
Nothing in this checkpoint represents deployment or note closure.

## Resume here

1. Test the selected directions in `decisions.md`: WU Penelope; Iphigenia’s
   actual sacrifice, preserving the UB slot. Retain the current 16 Saga
   faces and signpost exceptions provisionally while their architecture is reviewed.
2. Finish passage checks and quotation candidates, prioritising changed commons
   and their associated signposts. Keep adaptations and ancient variants distinct.
3. Test the common foundations and repeated Omen/Penelope interactions using
   `candidate-changes.json` questions. Record actual results separately from models.
4. Develop the flagged Antinous, immovable-bed and opened-wind-bag mismatches.
5. Refresh final comparisons, integrate accepted designs with concurrency checks,
   support quotation provenance in data/rendering, inspect card space, then publish
   and verify before closing notes.

## Reproduce

From the repository root, run these scripts in order:

```sh
python3 scripts/odyssey-design-round-audit.py
python3 scripts/odyssey-design-round-candidate.py
python3 scripts/odyssey-common-mechanics-audit.py
python3 scripts/odyssey-design-round-report.py
```

The audit replays archived evidence in `inputs/`; it does not perform a fresh
network read. Refresh those inputs deliberately before a new live reconciliation.
The report is written beside the repository as
`odyssey-making-of-first-pass.html`. The JSON records and scripts are the resumable
source; that standalone HTML is the user-facing review copy.

## Delivery checkpoint

The first pass was committed locally on `odyssey/flavour-foundation-20260922`.
Automatic approval review blocked the attempted GitHub push because explicit
authorization for exporting the design documents and source snapshots to that
destination was not established. No fallback push or pull request was attempted.
The standalone review report and a complete checkpoint ZIP were prepared for
private delivery. Resume from the ZIP if the transient checkout is unavailable.

Hunter subsequently authorized the checkpoint push and WU Penelope, then explicitly rejected the Iphigenia rescue tradition. The current candidate reflects actual sacrifice. The earlier push blocker was authorization; the authorized shell retry then failed for missing Git credentials. The connected GitHub route is being used to publish the checkpoint.

Publication completed through the connected GitHub account: branch `odyssey/flavour-foundation-20260922`, draft PR https://github.com/jhsizemore/kliawotadesign/pull/4, initial remote checkpoint commit `1d367e4028553365c934b13859e7d48e226c12b3`. Production remains unchanged.

## Second checkpoint: common mechanics

All ten pairs have a rules-based allocation and a hand-built 40-card diagnostic list. Seventeen manual timing traces distinguish analytical conclusions from played games. Candidate fixes affect ODY-125 and ODY-142; 33 changed slots and all structural totals remain fixed. Re-run the mechanics audit before the report generator. The next priority is WU recognition support and the Antinous story mismatch; see the new audit and timing documents.

## Third checkpoint: recognition and Antinous

Recovered the exact published branch after workspace maintenance. Revised ODY-007, ODY-051, ODY-090 and ODY-056; 37 total changed slots, 24 commons. WU has two common direct-blink sources and both signposts explicitly reward face-up events. Antinous consumes household resources at the end step. Updated four briefs, comparisons, WU diagnostic deck and timing traces; no production integration or games claimed. Resume with `recognition-and-antinous.md`. The next specific redesigns are ODY-213 (immovable bed) and ODY-235 (opened wind bag).

## Fourth checkpoint: bed and opened wind bag

ODY-213 now binds its protection and two-legend reunion draw to a chosen land; ODY-235 now sequences impulse access, red mana and land sacrifice. The candidate changes 39 slots, still 24 commons, and preserves all structural totals. `bed-and-wind-bag.md` records the source interpretations, printed comparisons and twelve manual cases, including Penelope before/after the final chapter triggers. The wind bag’s existing boar-hunt art is flagged for separate review. No played games or deployment are claimed. These designs supersede the earlier bed/wind-bag mismatch backlog. Next contract gates: remaining source/quotation work, architecture and collation, final references, gameplay testing and production integration.


## Fifth checkpoint: architecture and Omen sources

The architecture review resolves two provisional discrepancies without changing any card slots. Keep 16 Saga-bearing physical cards: the skeleton has 15 Saga-layout cards plus the Saga face of the single permitted DFC. Keep all four nonlegendary signposts because each carries an intentional mechanical bridge: ODY-153 UR spells, ODY-059 RW Vehicles/Survival, ODY-179 BG graveyard departures and ODY-060 GU Manifest Fate/exile. The stale signpost cycle register omitted ODY-153 and now records the same 20 signposts as the card data.

Passage-level review of the five common Omens verified their intended Homeric scenes. Three candidate records still carried pre-Omen source prose and are corrected: ODY-127 now uses Theoclymenus's darkened-hall vision in Book XX; ODY-135 uses the bellowing slaughtered cattle in Book XII; ODY-139 uses the hawk carrying a dove in Book XV. The white clear-sky thunder and blue dream of the geese remain correctly mapped. Five short exact Butler-translation quotation candidates are added to the candidate bank; none is yet final flavour text or written into production card records.

Production data, the 14A2 authoring Sheet and live Studio remain unchanged. Next concrete gate: audit all five enemy-hybrid Sagas under the hybrid colour-pie rule, then continue changed-common passage verification and collation before any integration.


## Sixth checkpoint: hybrid Saga gate

The enemy-hybrid Saga cycle has been audited under the actual hybrid “or” rule rather than gold-card logic. Three candidate revisions are added, bringing the isolated candidate from 39 to **42 changed slots** without altering the 309-card skeleton, rarity counts, lands or DFC count.

- ODY-097 becomes **Song of Hephaestus's Net**; Odyssey VIII confirms Demodocus performs the scene as a song.
- ODY-162 keeps BG, but chapter II now simply creates a Food and a Treasure.
- ODY-245 keeps GU, but chapter III now untaps up to two creatures and/or lands rather than arbitrary permanents.
- ODY-163 RW and ODY-232 WB pass without mechanical revision.

The generator/report inputs are also updated so the earlier Omen source corrections and expanded ten-card quotation bank survive a rebuild rather than being overwritten.

No played matches have been performed. Production data, the 14A2 authoring Sheet and live Studio remain unchanged. Next gate: continue passage verification across the remaining changed commons, then collation/reference refresh before integration.


## Seventh checkpoint: changed-common source pass complete

All **24 changed commons** now have passage-level review or an explicit extension classification. The final ten pending common briefs were checked against Odyssey III, V, VII, IX, XI, XII and XXIV.

Six are directly grounded in the narrated action: ODY-044 rowing under command, ODY-064 ordinary ship/oar labour, ODY-074 bread set before the stranger, ODY-103 libation service, ODY-108 mixed wine service, and ODY-142 the drink-offering to the dead.

Four are intentionally not represented as literal Homeric actions:
- **ODY-087 Seabird Lookout:** Book V supplies cormorant and sea-gull imagery; mortal bird-reading navigation is an explicit seamanship/natural-world extension.
- **ODY-112 Dolphins Beside the Bow:** Book XII explicitly contains dolphins as Scylla's prey; dolphins pacing a ship are an explicit fauna extension.
- **ODY-115 Depth-Sounding Sailor:** Book IX supplies practical ship/oar work but no sounding. Historical sounding practice is separately sourced as an ancient-Mediterranean seamanship extension.
- **ODY-123 Shade of the Waiting House:** Book XXIV supplies named ghosts in Hades; Escape back into play is explicitly fantasy extension.

This closes the **changed-common passage-verification gate** without claiming that extension material appears in Homer. The report generator now preserves those classifications on rebuild.

Production data, 14A2 and live Studio remain unchanged. Next contract gate: settle booster/collation assumptions and use them to test whether the common mechanical foundation is actually reachable in Limited, then refresh candidate references before played games.


## Eighth checkpoint: Limited collation locked

The Odyssey candidate's rarity skeleton is now reconciled to the actual FIN product structure: the 106 records marked common comprise **80 ordinary commons + 10 common dual lands + 16 basics**, exactly matching FIN's 309-card main-set lattice.

For analytical Limited work, lock **odyssey-core-fin-playbooster-v1**: seven ordinary commons, three uncommons, a FIN-ratio wildcard, guaranteed rare/mythic, FIN-ratio foil wildcard and a 55/45 common-dual/basic land slot. Odyssey has no external Through the Ages-style sheet, so the FIN one-third replacement of a common remains a sensitivity case rather than a fabricated Odyssey product feature.

The core model averages **7.7515 ordinary commons per pack** and **2.325 copies of each specific common across a 24-pack table**. The strict FIN bonus-sheet sensitivity falls only to 7.4182 commons per pack, so earlier theme-density concerns are not artifacts of using the wrong common-slot count.

Common infrastructure under this model: enchantments, Food and Survival are visible; Omens recur strongly. Escape and the single common Constellation payoff are accents. Gift and Foretell are support. GU Manifest remains the clearest density watch and should be tested through supply/pick simulation before another common slot is changed.

No draft picks or played games are claimed. Next: run the locked pack/table supply audit, then a conservative pick-behaviour simulation focused on GU Manifest, WU recognition, WB exploitation and signpost availability. After that, refresh printed-card references.


## Ninth checkpoint: pick-stress model

A fixed-intent 8-seat passing stress model now tests the locked FIN-style collation without pretending to be a real draft. Relevant support is treated as a high pick by any compatible competitor; no card ratings, signalling, pivots, deck construction or gameplay are simulated. Each scenario uses 5,000 seeded runs.

GU remains the thin lane, but it clears the current structural threshold without another common. Its direct package is ODY-088 G and ODY-116 U at common plus ODY-017 U at uncommon. In an open lane the GU seat averages 5.36 direct enablers; with one blue and one green competitor it averages 2.49, with a 72.7% chance of at least two and 45.4% chance of at least three. Two competitors in each colour reduce the mean to 1.66. The green uncommon ODY-042 and blue uncommon ODY-018 provide additional voyage/exile bridges, while ODY-060 and ODY-176 are the two GU signposts.

Decision: **do not spend another common slot on Manifest Fate before real draft evidence.** WU recognition and the narrow WB exploitation resource package are more robust under the same stress assumptions. GU remains the first archetype to watch in actual drafts, especially Voyage into Unknown Shores's four-cards-in-exile threshold.

Production data, 14A2 and live Studio remain unchanged. Next contract gate: refresh printed-card/reference comparisons for the now-stable 42-card candidate, then move into actual draft/game testing before integration.


## Tenth checkpoint: printed-reference gate complete

Printed component comparisons are now reconciled for all **42 candidate changes**. Thirteen changed cards requested fresh benchmarks and all requested references are present; 28 retain existing production benchmarks; ODY-097 is naming-only and requires no rate refresh. Missing requested comparisons: **0**.

The final missing research inputs were Altar's Reap for Iphigenia's additional-cost sacrifice/draw-two component; Flotsam and Tough Cookie for the repaired BG hybrid Saga; and Shore Up/Tamiyo's Safekeeping as protection-component checks for the repaired GU Saga. These are component precedents only. **No candidate rate is certified by this pass.**

The report generator is also repaired so a future rebuild preserves the locked collation/pick-stress validation instead of reviving the obsolete 90-common placeholder model.

Production data, 14A2 and live Studio remain unchanged. The next contract gate is gameplay evidence: build reproducible Draft/Sealed test pools and matchup decks under the locked collation, then test the specific unresolved questions (GU Manifest acquisition and four-card exile threshold; WU recognition repeatability; WB Antinous consumption; Omen repetition; hybrid Saga rates; Penelope/Iphigenia/bed/wind-bag rates). Final quotation/layout decisions and integration follow gameplay.


## Eleventh checkpoint: gameplay preflight and packet

The structural/reference phase is complete enough to enter gameplay. A deterministic goldfish preflight was run only to set expectations; it is explicitly not recorded as played Magic.

For GU, the current core diagnostic deck reaches Voyage into Unknown Shores's four-card exile draw threshold by turn ten in only about 2.3% of all runs, or 5.6% of runs where Voyage itself has been seen. An intentionally engine-heavy version reaches 7.0% / 17.4%. Keep the threshold at four for now because Voyage already ramps on its first Manifest; treat the draw as a late bonus. If real long games never reach it, test three before changing common density.

For WB, conditional on casting the single Antinous on turn three, the diagnostic model has Food preloaded about 42.1% of the time and some Food/cheap-creature sacrifice material about 75.2%. Keep the 3/3 for first games, with 2/3 recorded as the first fallback if the Food line proves too automatic.

A reproducible playtest packet now defines GU core/engine, WU recognition, WB Antinous, UB Iphigenia, WU Penelope/Saga, hybrid-Saga and Bag tests plus a nine-match matrix and game-record fields.

No candidate rules changed in this checkpoint. Production, 14A2 and live Studio remain unchanged. The next honest gate is **played gameplay evidence**. Analytical work may still prepare pools and records, but it must not be reported as matches.


## Twelfth checkpoint: structural phase rolled up

The mechanics/reference-preparation phase is closed for now. The 42-card isolated candidate, architecture decisions, FIN-style collation, pick-stress model, component-reference refresh and gameplay packet are all preserved. Actual played matches remain outstanding and are deferred rather than fabricated.

The project now moves to **full-set editorial completion**.

Starting audit:
- **309/309** cards have first-pass emotional making-of briefs with sequence, emotion, attributes, hooks and distinction/assessment.
- **62/309** briefs had passage-level source review before the signpost batch; the remaining source-verification backlog is the primary making-of task.
- Production printed-card references cover **309 cards / 912 references** under reference-quality-v3; the 42 changed cards have no missing requested benchmark.
- The flavour-text audit initially still showed all 309 as missing because research candidates had not been folded back into the audit. The signpost pass now fixes that state.
- The verified quotation bank grows from **10 to 28 cards** in this checkpoint.
- **ODY-060 Voyage into Unknown Shores** and **ODY-179 Keeper of Ancestral Graves** receive explicit no-direct-quote outcomes because they are composites; forcing a single Homeric line would misrepresent them.

Completion rule for this phase: every card must end with current reference coverage, a source-grounded emotional brief, and a verified flavour-text candidate or explicit no-text/no-direct-quote outcome before final layout selection and integration.

Next work order: clear source verification and flavour outcomes by narrative cluster rather than rarity—Telemachy (Books I–IV), Calypso/Phaeacia (V–VIII), wanderings (IX–XII), return/reconnaissance (XIII–XVI), palace recognition/conflict (XVII–XX), bow/battle/reconciliation (XXI–XXIV), then Trojan/pre-Odyssey, post-Odyssey and modern reception.

## Thirteenth checkpoint: Books I–IV editorial pass

The first narrative content cluster is substantially complete. Books I–IV material was reviewed as a unit rather than card-by-card in isolation.

This pass adds **17 verified quotation candidates**, bringing the bank to **45**, and records two further deliberate no-direct-quote outcomes. **ODY-004 Keep the Long Watch** remains a household endurance composite rather than being falsely pinned to Penelope or Telemachus; **ODY-252 Pylos Before the War** is explicitly an earlier-period interpretation rather than the Pylos of Telemachus's visit.

Key making-of corrections: Telemachus's young version now centres on learning to act under Athena's pressure; Nestor on intergenerational reassurance; Storeroom Keeper on continuous custodianship; Storeroom Hunger and Empty the Storeroom on deliberate household predation; Seals on the Sunlit Rocks is explicitly Menelaus's Proteus setting, not an Odysseus adventure. **Rosy-Fingered Dawn** is relabelled as a recurring epic formula rather than Book I-specific. **Winged Words** is treated as translation-sensitive: A. T. Murray preserves the formula literally, while Butler generally naturalizes it.

Two cards remain intentionally open from this cluster: **ODY-072 Aulis, Harbor of Omens** belongs to the Trojan/pre-Odyssey source pass, and **ODY-294 Helen, Remembered and Rewritten** still needs its specific later-reception source before flavour text can be completed.

The new inputs/editorial-register.json is authoritative for incremental source-review, making-of and flavour outcomes. Generator wiring is updated separately so future regeneration cannot erase researched quotation states.


## Fourteenth checkpoint: Books V–VIII editorial pass

The Calypso/Scheria/Phaeacian cluster is substantially complete. All 51 Odyssey V–VIII cards in this source band now have explicit passage or extension review in the making layer.

This pass adds **9 exact quotation candidates**, **35 source-led adaptation candidates**, and **3 deliberate no-flavour decisions** for the three Island basics. Existing Nausicaa, Calypso, Euryalus and Wooden Horse quotation candidates are retained.

The key editorial distinction is now explicit: direct episodes (raft construction, the storm, Nausicaa's welcome, Arete's judgement, Demodocus, the games, the wooden horse) are separated from deliberate world-building extensions such as Shipyard Sparks, Potter at the Kiln, Weatherwise Sailor, Phaeacian Shipwright, invented landscape names and the living Caryatid treatment.

Calypso's three portrayals are differentiated: the uncommon is an accessible exile/face-down engine, the mythic magnifies seductive stasis, and Refuge or Captivity now explicitly preserves the source's unequal power and non-consensual cohabitation rather than drifting into romance.

The flavour-completion rule is also tightened. Exact quotations are not mandatory: a source-led adaptation counts as a valid candidate. Conversely, “no direct quote” alone is not complete unless the card has an adaptation or a deliberate no-flavour/layout decision.

Production, 14A2 and live Studio remain unchanged. Next narrative cluster: **Books IX–XII — the wanderings, monsters and crew failures**.


## Fifteenth checkpoint: Books IX–XII editorial pass

The wanderings/monsters/crew-failure cluster is substantially complete. **71 source-led flavour adaptations** and **5 deliberate no-flavour basic-land decisions** are added. Existing exact quotation candidates for Tiresias, Eurylochus, Anticleia, the Deck-Captain, the cattle omen, Aeolus, Polites and Circe are retained.

Source classification is now explicit across the cluster: direct Homeric episodes are separated from funerary composites, ancient-Mediterranean seamanship extensions, natural-world extensions, imagined songs and set-level voyage metaphors. Two misplaced cards are deferred rather than falsely verified here: **ODY-180 Black-Hulled Achaean Galley** belongs to Trojan/pre-Odyssey material, and **ODY-182 Nobody, Self-Invented** belongs to later reception.

A genuine source-placement error is corrected: **ODY-194 Circe's Enchanted Garden** is Book X/Aeaea material, not Book XI.

The making layer is sharpened around the actual emotional engines of the wanderings: hospitality inverted into predation; anonymity undone by pride; temptation as relief; memory as a paid cost; restraint as precommitment; unavoidable loss between Scylla and Charybdis; and crew failure as short-term reasoning repeatedly defeating long-term homecoming.

Production, 14A2 and live Studio remain unchanged. Next narrative cluster: **Books XIII–XVI — return, disguise and reconnaissance**.


## Sixteenth checkpoint: Books XIII–XVI editorial pass

The return/disguise/reconnaissance cluster is substantially complete. This pass adds **5 exact Butler quotation candidates** and **14 source-led adaptations**; the existing hawk Omen quotation remains in place.

The making layer now distinguishes four related but different homecoming emotions: **Book XIII** is physical arrival without recognition, followed by Athena restoring context and imposing disguise; **Book XIV** tests loyalty before identity is disclosed; **Book XV** makes Telemachus's return urgent and threatened; **Book XVI** converts private recognition into coordinated conspiracy.

Athena's cards are differentiated accordingly: Athena's Intervention is a specific disguise/appearance intervention; Athena, Far-Seeing Guide is the larger manager of visibility and timing; Athena and Odysseus, Minds Alike centres their explicit delight in shared cunning. Eumaeus likewise splits cleanly across common hospitality, the cloak test, the uncommon loyalty engine and the hut as operational refuge.

Production, 14A2 and live Studio remain unchanged. Next narrative cluster: **Books XVII–XX — palace recognition, suitors, Penelope's interrogation and omens**.


## Seventeenth checkpoint: Books XVII–XX editorial pass

The palace-recognition/omen cluster is substantially complete. This pass adds **7 exact Butler quotation candidates**, **11 source-led adaptations**, and **1 deliberate no-flavour basic-land decision**. Existing exact candidates for Argos, the clear-sky thunder, Penelope's geese dream and the veiled-hall omen are retained.

The recognition vertical is now differentiated rather than repetitive: **Wash the Stranger's Feet** is care approaching recognition; **Eurycleia's Basin** is the object where touch makes identity undeniable; **Eurycleia, Keeper of the Scar** is recognition disciplined into secrecy; **Odysseus's Cloak and Brooch** is remembered private evidence; **Penelope Questions the Beggar** is active evidentiary testing rather than passive hope. Argos likewise splits between the legendary recognition/death moment and the common fidelity treatment without repeating the same line twice.

One source-placement problem is corrected by deferral: **ODY-172 Mother Lion's Charge** is not supported as a Book XX scene and moves to the later Homeric-simile audit.

Production, 14A2 and live Studio remain unchanged. Next narrative cluster: **Books XXI–XXIV — bow test, slaughter, Penelope reunion, Laertes and peace**.


## Eighteenth checkpoint: Books XXI–XXIV editorial pass

The final-Odyssey cluster is substantially complete. This pass adds **11 exact Butler quotation candidates**, **19 source-led adaptations**, and **1 deliberate no-flavour basic-land decision**. Existing exact candidates for Laertes and Medon and the Keeper-of-Graves adaptation are retained.

The emotional ending is now explicitly staged rather than collapsed into generic victory: the bow contest exposes rightful mastery; the hall battle is violent, coordinated household recovery; Penelope's reunion requires private proof and preserves her caution as intelligence; Laertes is recognised through land-memory and briefly regains martial agency; the poem's final political act is **Athena stopping renewed retaliation and making a covenant of peace**.

The olive vertical is separated by scale: The Olive-Wood Test is private proof; Olive-Wood Bed is the rooted marriage object; Olive Tree of Ithaca is a broader continuity symbol; Roots Beneath the House connects land and labour; House of Odysseus is system-level restoration of people, objects and relationships.

Production, 14A2 and live Studio remain unchanged. The six-book Odyssey narrative sweep is now complete enough to move into the remaining non-core source bands: **Trojan/pre-Odyssey, post-Odyssey/later ancient tradition, modern reception, Homeric-simile/material-world extensions, and residual source anomalies**.


## Nineteenth checkpoint: cross-book Odyssey synthesis cleanup

The cross-book Odyssey residue is substantially complete. This pass resolves **3 new exact quotation candidates**, **30 source-led adaptations**, and **3 additional basic-land no-flavour decisions**. The remaining two Odyssey-labelled deferrals are intentional: Mother Lion's Charge moves to the Homeric-simile audit, and Black-Hulled Achaean Galley moves to Trojan/pre-Odyssey.

The major set concepts now have explicit emotional definitions rather than placeholder prose: **nostos** is restoration of belonging beyond physical arrival; **xenia** is obligation before knowledge of the guest; **metis** is timing/concealment/leverage; **moira** fixes constraints without eliminating responsibility; **recognition** is accumulated evidence reaching certainty; hidden names change what opponents can infer and target; Zeus represents witness/sanction behind social obligation rather than guaranteed instant intervention.

Production, 14A2 and live Studio remain unchanged. Remaining editorial work is now concentrated in genuinely external/non-core bands: Trojan/pre-Odyssey and post-Odyssey tradition, modern reception, and historical/material-world/simile extensions.


## Fourteenth checkpoint: Books V–VIII complete

The flavour tracker is reconciled to the authoritative editorial register. The set currently has **78 direct quotation candidates**, **183 source-led adaptation candidates**, and **14 deliberate no-flavour decisions**. That is **261 actual flavour-text candidates**, leaving only **34 cards** without a flavour outcome—not the much larger backlog reported by the older quotation-only tracker.

Books V–VIII is now complete for editorial outcomes: **51 cards = 13 direct quotes + 35 adaptations + 3 no-flavour basic lands**, with zero pending source reviews in the cluster. Final making-of cleanup replaced the remaining generic attributes on Take the Stranger's Hand, Song of the Wooden Horse and Storm over Limestone, and strengthened the thin emotion briefs on the open-sea Island, Windswept Isle, Laurel Grounds and Palmshade Cove.

The next narrative cluster is **Books IX–XII — the wanderings, monsters and crew failures**. Gameplay remains deferred validation and does not block this editorial pass.


## Fifteenth checkpoint: Books IX–XII complete

The wanderings cluster is editorially complete for material that genuinely belongs to Books IX–XII. Of **87 cards**, **8** use direct quotation candidates, **72** use source-led adaptations, and **5** basic lands deliberately carry no flavour text. Two cards are intentionally deferred rather than falsely completed here: **ODY-180 Black-Hulled Achaean Galley** belongs to the Trojan/pre-Odyssey source band, and **ODY-182 Nobody, Self-Invented** belongs to the later-reception/constructed-identity pass.

The last making-of cleanup sharpens Aeolus as a giver of enormous but trust-dependent control, and replaces one-word landscape emotions on the blood-trench Swamp, Laestrygonian harbour Mountain, Scylla-cliff Mountain and Rugged Headland with explicit player-facing emotional beats.

This cluster now cleanly carries its central emotional arc: ingenuity repeatedly creates escape, pride or appetite spends that advantage, and survival accumulates obligations rather than resetting the voyage.

Next narrative cluster: **Books XIII–XVI — return, disguise, reconnaissance and the father-son reunion**.


## Sixteenth checkpoint: Books XIII–XVI complete

The return/disguise cluster is editorially complete: **20/20 cards** have source review and a flavour-text outcome (**6 direct quotations, 14 source-led adaptations**). No cards are deferred from the cluster.

The making-of layer is also clean: zero generic character/object placeholders and, after sharpening the Eumaeus Forest, zero thin emotion fields. The cluster now consistently reads as concealed homecoming rather than generic travel: arrival precedes recognition, hospitality precedes proof, and Athena's strategic control of knowledge lets reunion happen in the right order.

Next narrative cluster: **Books XVII–XX — palace recognition, suitors, omens and mounting confrontation**.


## Seventeenth checkpoint: Books XVII–XX complete

The palace-recognition cluster is editorially complete: **22/22 cards** have source review and a flavour outcome (**10 direct quotations, 11 source-led adaptations, 1 deliberate no-flavour basic land**). The final thin setting emotion on Parnassus is now tied to the scar's delayed significance rather than generic danger.

This cluster consistently centres on recognition pressure: objects and bodies become evidence, disguised weakness becomes information gathering, omens become credible only to people willing to interpret them, and the suitors' failure is increasingly framed as refusal to recognise what is already in front of them.


## Eighteenth checkpoint: core Odyssey narrative complete

Books XXI–XXIV is editorially complete: **34/34 cards** have source review and a flavour outcome (**13 direct quotations, 20 source-led adaptations, 1 deliberate no-flavour basic land**). Final making-of cleanup replaces generic descriptions on Neck Shot, Laertes and Medon and gives the Laertes Forest and Silent Courtyard explicit emotional jobs.

With that, the **core Odyssey Books I–XXIV narrative is complete by cluster**. Cards whose true source band is Trojan/pre-Odyssey, post-Odyssey, later reception or historical-world extension remain deliberately outside that declaration rather than being forced into a Homeric book for convenience.

The remaining editorial phase is now concentrated in non-core source bands: **Trojan/prewar and Iliad material; later ancient/post-Odyssey tradition; modern reception/adaptations; Homeric similes; funerary/craft/navigation/agricultural extensions; and a small set of global making-of placeholders**.


## Nineteenth checkpoint: Trojan/prewar and later ancient batch

The highest-risk non-core source batch is reconciled without collapsing distinct traditions into Homer. **Feign Madness** is explicitly Apollodorus/Cypria tradition; **Iphigenia's Sacrifice** remains the Aeschylean actual-sacrifice tradition selected for the set; **Sparta, Hall of Oaths** uses Apollodorus's oath tradition; **Aulis** combines the Iliad II omen with the later mythographic fleet muster; the night raid is Iliad X; Achilles/Hector use Iliad XXII/VI; Callidice and Telegonus remain post-Odyssey Apollodorus material.

This batch resolves **12 previous flavour gaps**: 3 direct quotation candidates, 8 source-led adaptations and 1 deliberate no-flavour basic land. The direct candidates are Iphigenia's sacrifice, Achilles accepting his fate and Hector's duty at the Trojan front. No card is presented as an Odyssey quotation where its source is actually Aeschylus, Apollodorus or the Iliad.

Remaining flavour outcomes after this checkpoint: **22**.
