# Odyssey focused launch — 29 September 2026

## Public structure

1. **Hero:** unmistakably a fan-made Magic: The Gathering set retelling Homer’s epic; the approved PNG wordmark and ODY-061, *Odysseus, Cunning Voyager*, appear immediately.
2. **The Odyssey in Magic:** eight controlled carousel highlights, with two native Studio card candidates in each.
3. **Help decide what survives:** one full-bleed Sirens painting, left-hand contrast gradient and the existing voluntary email-interest action.
4. **Temporary full spoiler:** Autolycus’s assigned artwork and the existing November 1, 2026 preview cutoff.

The earlier extended exhibition is retained at `art.html`. Its twenty-work index, material and narrative carousels and source viewer remain available through the header/footer links. The social builder remains at `social/`.

## Deliberate artwork choices

The editable `PLAN` and eight `FEATURES` in `focused-launch.js` are the single launch art-direction configuration. They do not change card assignments or Studio placement.

- **Hero:** ART-239, Turner’s *Ulysses Deriding Polyphemus*. The intent is an emotionally charged departure and perilous scale, not comprehensive plot coverage. The hero card retains its own assigned Ingres artwork.
- **Participation:** ART-236, Herbert James Draper’s *Ulysses and the Sirens*. This replaces the Waterhouse face tile on the main page. It is one continuous crop, not repeated images stitched together. Desktop keeps the encounter beside the copy; mobile opens on the artwork and fades into the invitation.
- **Spoiler:** the current artwork of ODY-303, *Autolycus, Master of Cunning*. The source is accurately credited as Jacob Toorenvliet’s *Mercury*; the site does not mislabel the historical drawing as a depiction of Autolycus.
- **Branding:** the existing PNG’s alpha is preserved. Header and footer use `brightness(0)` to make only its non-transparent pixels black, with no rectangular fill. The hero uses the original coloured logo.

## Eight set highlights

| Highlight | Featured candidates |
| --- | --- |
| Manifest Fate | 063, 308 |
| Survival and Ordeals | 017, 064 |
| Living Saga creatures | 209, 222 |
| Gods and devotion | 062, 198 |
| Omens and constellation | 116, 004 |
| Homecoming and blink | 199, 036 |
| Troy to Ithaca: transforming Saga and Adventure land | 229, 188 |
| Divine relics and devotion-gated equipment | 295, 296 |

All claims and filters are tied to the current candidate file. There are eleven distinct principal backgrounds and seventeen staged card appearances. A card may intentionally refer to the historical work being featured; repeated background selection is rejected.

## Unchanged foundations

No canonical rules, names, artwork assignments, Google Sheet values, stored crops, placement publication code or generated Studio rendering source is edited by this launch pass. The public cards and social exports continue using the source-derived renderer and published placement settings. Every card remains a candidate; the planned January 7, 2027 release and November 1 preview deadline are distinct. Email interest is not represented as an automatic mailing-list service.

## Verification

`tests/odyssey-focused-launch.py` checks the four-section structure, eight slides and their filters, all 309 native cards, real loaded artworks, PNG transparency and contrast, published hero placement and 320/390/768/1440 layouts.

`tests/odyssey-exhibition-browser.py` now starts at `art.html`, retaining the full art-exhibition, renderer, source isolation, preview cutoff and twenty social-layout/export checks.

Both run in the permanent read-only exhibition verification workflow. Test screenshots are evidence from the actual repository artwork and card file, not generated substitutes.
