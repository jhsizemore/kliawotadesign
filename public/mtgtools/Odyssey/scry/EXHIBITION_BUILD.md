# Odyssey exhibition — Studio renderer revision

Build: `20260928-studio2`
Landing: `/mtgtools/Odyssey/scry/`
Full preview: `/mtgtools/Odyssey/scry/?view=cards`
Social studio: `/mtgtools/Odyssey/scry/social/`

## One rendering source

The former approximate `.card-render` implementation has been removed. All visible candidates now use `<odyssey-studio-card>`, a read-only distribution generated from Studio's own `app.html`, `frame-system`, `studio-polish`, artwork geometry, symbols and transform-face implementation. Shadow DOM contains the original card styles without exposing the public page to editor UI styles. Both sides use the same source for special frames and typography.

Run `npm run build:renderer` after editing Studio rendering source. This is also run by `npm install` and `npm run deploy`. `node scripts/build-odyssey-public-renderer.cjs --check` fails if the committed distribution differs from the current source. The build records a SHA-256 source fingerprint. It parses and extracts source at build time; it does not evaluate downloaded JavaScript in visitors' browsers.

Public rendering starts from the published JSON, not local drafts. It does not initialize editor controls, access Studio local/session storage, resolve live-sheet drafts or call the synchronization API. Published front/back identities and source images are preserved. Unassigned reverse-face art stays unassigned. The build includes Studio's narrow dense-text correction: Ogygia may surrender up to 40 design pixels of artwork height rather than clipping its flavour text. No card data, wording, mechanics or artwork assignments were changed.

The PNG exporter expands the rendered shadow tree and computed styles, including pseudo-elements and local SVG paint servers. It does not substitute a second card renderer. Export stops on missing card art, failed image decoding or fetch errors. Browser image security restrictions are not bypassed.

## Page sequence

The opening and art-to-card introduction remain. The project statement now sits over a historical artwork. Material chapters occupy one finite carousel; four selected set features follow: Manifest Fate, Survival/Ordeals/crewing, blink/recognition, and Theros enchantment callbacks. A second carousel presents homecoming, temptation (including Circe's Prepare card), and monsters. The participation pitch closes the main narrative.

The six material panels and three story panels support buttons, tabs, keyboard navigation, wheel navigation when a complete panel is visible, and horizontal touch gestures. They do not autoplay or pin the document. Vertical scrolling is released at either end and retained on phones when needed to read a tall panel. Inactive panels are inert. The selected panel determines carousel height.

Cream, clay, pale stone, blue-green and paper grounds replace the predominantly dark section backgrounds. Artwork and source attribution remain visible. The social composer is a separate document, linked in the header, and no composer markup is loaded on the landing page.

## Editorial grounding

The current card rows, not stale cycle-summary metadata, govern the pitch. The five actual Ordeals are Sirens, Suitors, Cyclops, Dead and Narrow Sea. The old cycle metadata still calls the white one “Bow”; that label is not promoted here. Prepare has one current example, so it remains a character feature rather than a headline pillar. “Manifest Hope” is not used as a current-set feature.

## Participation and preview dates

The participation CTA opens a prefilled register-interest email to Hunter's contact address already published on the main website. Visitors choose updates, playtesting or contribution, then send the email themselves. No automatic subscription, database collection, background email or success claim is made. A mailing-list service can replace this explicit email route later.

The full-preview browsing window closes at **2026-11-01 00:00 in Port Vila (UTC+11)**. The gallery then presents its closed-window message, and social selectors are limited to featured candidates. This is a public presentation boundary, not authentication or a claim that public repository data becomes private. Studio and published source files are not deleted or restricted.

## Verification

`tests/odyssey-exhibition.cjs` covers published joins, exact blank assignments, provenance identity checks, media classification, actual Ordeal rows and before/at/after cutoff behavior. `tests/odyssey-exhibition-browser.py` checks all published candidates, typography overflow, special frames, reverse-face rendering, source-only isolation, desktop/tablet/phone layout, carousels, routing, sign-up transparency and all 20 social size/card-count combinations, including a PNG export using actual delivered art. Screenshots and results are uploaded by the verification workflow.

Source merging, successful browser checks and production publication are separate states. Verify the deployment and served build independently; do not infer that a merge alone changed the live site.
