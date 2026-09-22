# Recognition and exploitation revision

Scope: four existing slots. The candidate now changes 37 cards, including 24
commons. Names, artwork assignments, rarities and colour identities are retained
in this pass. Iphigenia remains actually sacrificed for the war effort.

## Selected designs

| Slot | Intent | Revision |
|---|---|---|
| 007 — Wash the Stranger’s Feet | Care exposes the familiar person under the disguise | {1}{W} instant; blink your creature back tapped, then gain 2 life. |
| 051 — Mentor, Trusted Counselor | Recognition helps an ally act | Add turning face up to the recognition untap event; cap that ability at one trigger each turn. Keep the separate library-exile tap ability. |
| 090 — Nausicaa, Princess of Scheria | Discover, welcome, then strengthen the traveller | Add turning face up to her untap/counter event. Keep its once-per-turn limit and the existing Manifest Fate Adventure. |
| 056 — Antinous, First Suitor | Consume household resources to increase personal power | At your end step, optionally sacrifice another creature or Food; Antinous gets a counter and each opponent loses 1 life. Retain {1}{W}{B}, 3/3, uncommon. |

The foot-washing scene is grounded in Eurycleia identifying the scar in
[Book 19](https://classics.mit.edu/Homer/odyssey.19.xix.html). Blink is a game
abstraction of recognition. Mentor’s assistance distinguishes the adviser from
Athena taking his likeness in [Book 2](https://classics.mit.edu/Homer/odyssey.2.ii.html).
Nausicaa offers care before learning the stranger’s identity in
[Book 6](https://classics.mit.edu/Homer/odyssey.6.vi.html). Antinous’s consumption and
refusal to share appear in [Book 17](https://classics.mit.edu/Homer/odyssey.17.xvii.html).

## Alternatives considered

- A second blink alone would leave face-up play disconnected from the signposts.
  Adding face-up rewards alone would still leave just one common direct-return
  spell. The candidate makes both modest changes while preserving enchantment
  and creature density.
- Replacing Spread Guest Bedding with a blink instant would reduce common
  enchantment support. Reusing the foot-washing spell preserves all nine common
  enchantments and strengthens an existing recognition scene.
- Food-only Antinous would have just three common Food sources in WB. Allowing
  another creature as well connects death effects, Medon and the existing creature
  pool. A repeatable activated outlet would permit many sacrifices in response to
  removal; end-step timing supplies a more bounded test version.
- Opponent-resource theft would portray parasitism more literally but require
  additional costs and restrictions. The chosen design treats the controller’s
  board as the occupied household. This limitation is explicit in its flavour score.

## Reference comparisons

- Cloudshift costs {W}; the revised washing spell costs one more, returns tapped,
  and gains two life. Ephemerate is the efficient repeat-blink ceiling. A tapped
  return does not stop entry triggers or prevent other effects from untapping it.
- Secret Plans rewards face-up events with cards. Mentor and Nausicaa supply tempo
  and counters on creature bodies instead; their recognition triggers are limited.
- Ravenous Squirrel costs one hybrid mana for a 1/1 and grows on every artifact or
  creature sacrifice, with a paid draw outlet. Antinous starts bigger at three mana,
  restricts what he consumes, and operates at the end step. His opponent life loss
  scales in multiplayer. These are component comparisons, not proof of balance.

Printed facts are archived in `inputs/new-reference-facts.json`; the report uses
these comparisons for the changed cards. Production reference refresh is pending.

## Manual interaction traces

These are rules analyses, not played games or a full rules-engine simulation.

| Setup | Expected result |
|---|---|
| Wash a manifested creature card | It returns face up and tapped as a new object; direct-return triggers can fire. This is not a turn-face-up event. |
| Wash a manifested instant or sorcery | It is exiled and cannot enter the battlefield. The life gain still happens if the spell resolved. The card is revealed as it changes zones. |
| Wash a token creature | It cannot return after leaving the battlefield. Do not present this as reusable token protection. |
| Turn a manifested creature face up with both signposts present | Both recognition abilities can trigger if their limits are unused. Nausicaa untaps/strengthens it; Mentor can ready a different ally. Neither event is an ETB. |
| Resolve Find the Castaway | Manifesting alone does not trigger Nausicaa’s recognition ability. The later face-up action or blink is the supported second step. |
| Blink a signpost after its limit was used | The returning signpost is a new object; its limit resets. Paid blink can repeat value; the text is not a global turn-wide lock. |
| Antinous with a Food at your end step | Sacrifice that Food or keep it. On sacrifice, a 3/3 Antinous becomes 4/4 and each opponent loses 1 life. No Food activation life gain is received. |
| Antinous sacrifices a creature while Medon is present | Antinous grows/drains; Medon’s separate death trigger can gain life. No hand-return rescue remains on Antinous. |
| Antinous is removed before his end-step trigger resolves | The trigger still exists. A sacrifice can still cause opponent life loss; no counter can be put on the departed Antinous. |
| Antinous enters after the end step began | He supplies no trigger for that already-started end step. |
| Copy Antinous’s trigger or create another end step | Another sacrifice opportunity can occur. The design is tied to end-step events, not an explicit once-per-turn restriction. |

## Completion and next work

The WU event mismatch and Antinous portrayal now have concrete candidate fixes.
Common direct blink rises from one to two; common enchantments remain nine.
Actual rates, draft access, repeat-value behaviour and theme recognition still
need games. The next identified flavour mismatches are the immovable bed’s blink
engine and the opened wind bag’s reward-only sequence.
