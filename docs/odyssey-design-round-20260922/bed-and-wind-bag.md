# Rooted recognition and lost progress

Two existing slots revised; 39 candidate changes in total, including 24 commons.
Costs, colours, rarities, artwork joins and the 309-card structure are preserved.
Iphigenia remains actually sacrificed for the war effort.

## Olive-Wood Bed of Ithaca — ODY-213

{3} · Legendary Artifact · Mythic rare

> As this artifact enters, choose a land you control.
>
> As long as you control the chosen land, this artifact has hexproof and legendary creatures you control have ward {1}.
>
> At the beginning of your end step, if you control the chosen land and two or more legendary creatures, draw a card.

The intended experience is rooted security, then the satisfaction of reunion.
The construction and recognition test come from
[Homer, Odyssey 23, Butler translation](https://classics.mit.edu/Homer/odyssey.23.xxiii.html).
The particular land supplies a physical anchor; two legendary creatures represent
the reunited couple. Neither generic legends nor card draw reproduce every detail.
The old repeated-blink engine has been removed. Hexproof represents security,
not literal immunity to moving the bed.

A Forest requirement would exclude the approved white-blue Penelope Commander.
Naming both spouses would be narrower and create additional name tracking.
The selected version remains colourless and can support the household in any deck;
that flexibility makes its three-mana rate a playtest question, not a settled result.

Flowering of the White Tree is a ward benchmark; Tome of Legends is a draw benchmark.
The former also boosts creatures; the latter needs counters and a paid activation.
This proposal gives neither boost nor activated draw, but potentially repeats a free
draw while protecting itself. Inspect legend density and removal access closely.
Verified printed text is archived in `inputs/new-reference-facts.json`.

## The Bag Is Opened — ODY-235

{2}{R} · Enchantment — Saga · Rare

> I — Exile the top two cards of your library. Until the end of your next turn, you may play those cards.
>
> II — Add {R}{R}{R}.
>
> III — Sacrifice a land.

The intended sequence is temptation, released force, then lost progress. Its source
is [Homer, Odyssey 10, Butler translation](https://classics.mit.edu/Homer/odyssey.10.x.html).
The crew's imagined wealth is not actual Treasure. A creature wipe would incorrectly
suggest this episode kills the crew; land sacrifice instead abstracts a setback in
the voyage, not the destruction of Ithaca. The first two benefits make the mistake
tempting in play. The last chapter supplies the missing consequence.

Reckless Impulse supplies the initial access benchmark. Seething Song supplies an
immediate five-mana comparison against this Saga's delayed three. The Saga is not
simply those cards added together: its schedule constrains spending, while counter
manipulation can repeatedly recover its useful chapters and avoid the liability.
The Flame of Keld remains a relevant baseline example of a Saga with a costly chapter.

Penelope's postponement is deliberate design space. This candidate does not force
players to suffer the ending regardless of their choices. Compare normal progression,
rewinding chapter II, and sacrificing or blinking the Saga before chapter III begins.
The current ART-057 assignment is a boar-hunt landscape, not this scene; it remains
unchanged and is flagged here for the separate art review.

## Manual interaction review

These twelve cases are rules analyses, not played games. Saga timing follows the
[official Theros Beyond Death release notes](https://magic.wizards.com/en/news/feature/theros-beyond-death-release-notes-2020-01-10).

| Setup | Expected result |
|---|---|
| Bed enters while you control a land | Choose as it enters, without targeting or a separate choice trigger. Its static protection applies immediately. |
| Bed enters while you control no land | No land can be chosen. Its conditional protection and draw remain inactive; playing a land later does not make a choice. |
| Chosen land leaves and returns | It is a new object. This Bed no longer recognises it, even if its name is unchanged. |
| Opponent gains control of the chosen land, then you regain it without a zone change | Benefits stop, then resume while you control that same land. |
| Bed is blinked | The returning artifact is a new object and makes a new land choice. This card supplies no blink ability itself. |
| You have two legendary creatures and the chosen land at your end step; one creature or the land is lost before resolution | The intervening condition is checked again. No card is drawn if either requirement is no longer met. A creature that is also the chosen land may count in both roles. |
| You reach your end step with only one legendary creature, then flash in another | The draw ability did not trigger; meeting the condition later cannot create it retroactively. |
| Chapter I exiles a land and a spell | You may play them during the stated window, respecting timing, costs and land-play limits. This is not free casting or an extra land play. |
| Chapter II resolves in your first main phase | Add three red mana. It empties normally when the step or phase ends; the text does not retain it for later turns. |
| Penelope removes a counter while the Saga has two, before it would advance to three | It falls to one, without a chapter trigger from removal. The next ordinary increase to two triggers II again. |
| Chapter III is already on the stack; Penelope removes a counter or the Saga leaves | The chapter ability remains and still instructs you to sacrifice a land on resolution. Counter removal does not counter it. With only two counters remaining, the Saga need not be sacrificed merely because III resolved. |
| Saga is sacrificed or blinked before chapter III triggers | The old object's final chapter never triggers. A returned new Saga begins afresh. A resolved III with no land available does nothing; there is no debt carried forward. |

## Validation and remaining gates

The generator asserts fixed card, rarity, land, layout and artwork identity counts.
Both new candidate reference comparisons have populated printed benchmarks. The
common audit is rerun for consistency; neither revision changes common density.
The report includes both proposals and the source-specific briefs.

Next contract work is the remaining passage and quotation verification, the unresolved
set architecture/collation decisions and the final reference refresh, followed by
actual playtesting and integration into authoring data and Studio. The standalone
candidate does not establish balance, complete the quotation audit or deploy changes.
