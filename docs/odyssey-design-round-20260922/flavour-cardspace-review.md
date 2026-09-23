# Flavour card-space review

The editorial content phase is complete. This checkpoint creates an isolated Studio dataset that merges the 42-card mechanical candidate with all 309 flavour outcomes.

## Studio dataset

`odyssey-editorial-candidate-v1` contains:
- 81 direct quotations
- 213 source-led adaptations
- 15 deliberate no-flavour cards

Direct quotations are rendered with a short attribution line. Full provenance remains in the editorial register.

## Text-fit audit

Studio now batch-renders all 309 cards offscreen through the same typography fitter used by the visible card and records:

- **fit** — comfortable rules/flavour fit
- **tight** — fitted below 14 px but above the comfort floor
- **compressed** — below the 12.6 px comfort floor or a playtest reminder had to be hidden
- **overflow** — does not fit even at the renderer minimum

The browser adds a Text Fit filter and an Export text fit button. This audit is intentionally renderer-derived rather than based only on word count.

No production dataset or authoring sheet is changed by this file.
