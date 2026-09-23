# Timing and interaction review

Method: manual rules traces of specified states, checked against the linked rules
notes. These are analytical outcomes, not executed Magic-engine tests or played
matches. The two small-creature recovery cases concern the revised candidate.

| Case | Starting state / action | Outcome / design consequence |
|---|---|---|
| Survival through crewing | A Survival creature crews Black-Hulled Ship before combat; the ship attacks; the creature remains tapped | Its Survival condition can be met at the start and resolution of the second-main trigger. The candidate ship untaps it only at the end step. |
| Untap before second main | The same crew member is untapped by Beach the Ship during combat | It will not trigger Survival. This can be a legitimate tactical trade, not inherently an error. |
| Untap in response | Survival triggers while tapped; the creature is then untapped | The intervening condition fails on resolution. Resolve friendly Survival rewards before a separate untap trigger when ordering allows. |
| Ordeal ownership | You control an Ordeal attached to an opponent’s creature | The creature’s controller receives the granted Survival ability. Its named Aura-controller instruction preserves the intended sacrifice actor. Do not replace that referent with the creature’s controller. |
| Lore removal | Penelope removes a counter, taking a Saga from two to one | No chapter fires from removal. A later increase to two can trigger chapter II again. |
| Final chapter response | Chapter III is on the stack; a flash Omen triggers Penelope and removes a lore counter | Chapter III remains on the stack. With only two counters after it resolves, this three-chapter Saga is retained. |
| Too late to rewind | Chapter III has resolved with three counters still present | State-based sacrifice occurs before a player can newly cast an Omen. |
| Once each turn | Penelope triggers on one enchantment, then another enchantment enters that turn | Her limit prevents another trigger that turn; a different player’s turn resets the allowance. Blink creates a new Penelope object and can reset that object’s limit. No global once-per-turn lock is claimed. |
| Paid repeat, not automatic infinite loop | Penelope plus a cheap flash Omen, with an available Saga | Replaying the Omen requires getting it back and paying again. Her own recovery is four mana and tapping, and requires the Omen in the graveyard. External free loops remain a Commander test risk. |
| Mill then recover | Pour to the Dead resolves with no eligible creature initially in the graveyard, but mills one | Revised non-targeted choice can return that newly milled creature. The previous target-based wording could not. Graveyard replacement effects may still leave no eligible card. |
| Swine self-recovery | Spellbound Swine dies as an enchantment creature | Revised “another enchantment card” excludes that card. Other copies remain eligible; paid two-copy recursion is a separate test case, not an automatic infinite loop. |
| Gift and target loss | Supper was promised with one target; that target becomes illegal | The spell does not resolve: neither Food nor other effects happen. Choosing zero targets when casting avoids having an illegal sole target. |
| Omen and target loss | Green Omen’s sole chosen target becomes illegal | Its entry ability fails, including Food creation. The enchantment stays. Zero targets is legal and can still produce Food. |
| Sacrifice as a cost | Iphigenia’s Sacrifice is cast, then countered | The creature is already sacrificed; tapping and drawing do not happen. The spell itself provides no rescue or refund. |
| Manifest versus revelation | A manifested creature later turns face up | Turning face up is not entering. Basin, Swineherd and the revised Mentor and Nausicaa explicitly reward it; their old direct-return text alone did not. |
| Foretell and return | Dolphins is foretold and later cast | It is cast from exile, then enters from the stack. This enables Tiresias’s cast condition, not a direct enters-from-exile condition. |
| Enchantment versus enchanted | Spellbound Swine dies without an Aura attached | Its enchantment type alone does not enable Circe’s “enchanted” condition. Face-down and enchanted are separate states. |

## Source basis

- [Duskmourn release notes](https://magic.wizards.com/en/news/feature/duskmourn-house-of-horror-release-notes): Survival condition and face-up behaviour.
- [Theros Beyond Death release notes](https://magic.wizards.com/en/news/feature/theros-beyond-death-release-notes-2020-01-10): counter changes and Saga sacrifice.
- [Bloomburrow release notes](https://magic.wizards.com/en/news/feature/bloomburrow-release-notes): Gift timing and failure to resolve.

The traces apply those rules to custom Odyssey cards. The project’s Manifest Fate
action still needs a canonical visible rules definition; it must not be silently
replaced with published manifest dread. No claim of exhaustive Commander-loop
coverage is made.

The recognition and Antinous pass adds eleven manual cases in `recognition-and-antinous.md`, including blinked tokens/nonpermanents, trigger-limit resets and end-step sacrifice timing.
