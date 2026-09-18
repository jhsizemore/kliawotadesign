# Odyssey v3.16 — mobile card navigation

Baseline: main commit `137b23a6156cff4e80ae1fdad80bcccfbee715da` (v3.15).
Work branch: `odyssey/mobile-navigation-v3-16`.

## User-facing changes

At screen widths up to 760 CSS pixels, Browse cards opens a full-height native dialog rather than a 260-pixel embedded sidebar. The dialog reuses the original browser, search, filter controls, card rows and selection handlers; it does not duplicate the card dataset.

The bottom dock contains Previous, Browse cards with position/count, Next, and Edit/Close. Previous and Next follow the current filtered and sorted list and stop at its ends. For example, filtering to Scylla allows stepping between the Scylla cards rather than unrelated intervening collector numbers.

The browser provides name A–Z or collector-number sorting, an explicit collector-number jump, Current card to locate the selection, and Clear to reset search/filters/approved-card queue. A number jump intentionally clears filters. Invalid card numbers do not change selection.

Filters are collapsed initially. Card rows are at least 72 pixels tall with larger text and highlighted current selection. Search and filters persist while opening/closing the picker. Scroll position is preserved on reopening; when selection changed through the dock, reopening locates the new current card. This is in-session UI state, not cross-device or reload persistence.

Opening the picker focuses Done rather than summoning the keyboard. The layout follows visualViewport height and safe-area insets. Keyboard selection and Escape are supported; Studio's editor/approval shortcuts are suppressed while browsing.

The existing inspector remains available via the bottom dock. Its open state and scroll position are retained when stepping cards. On mobile only, Copy art from Current set is moved into the Art pane to avoid crowding the set selector. The original button and click handler are retained. Desktop restores the original sidebar, filter controls, header and copy-art position. Print excludes the dock and picker.

No card/art JSON, core app.html, frame-system files, artwork-tools.js or art-settings-transfer.js are changed. The v3.15 storage patches and integration order are preserved; mobile mounts last. Crop/pan/pinch handlers remain owned by Studio. This navigation layer adds no artwork downloads.

## Validation performed before promotion

- 17 passing Node tests: neighbour boundaries, filtered navigation, A–Z/numeric ordering, non-mutating sort, retained inherited-art loader patches, extension order, and safe loader errors. Re-run with `node --test tests/odyssey-mobile-navigation.test.js`.
- 49 passing offline Chromium checks against a 250-card navigation fixture reproducing Studio DOM, existing filter handlers, selection/render behaviour and scrollIntoView. Covered both Scylla matches, search retention, scroll retention, jumps, empty filters, touch target dimensions, keyboard isolation, inspector editing/stepping, moved copy-art handler, artwork-overlay access, repeated responsive transitions, idempotent mounting and print exclusion.
- Fixture viewport widths checked: 320, 360, 390, 412, 760 and desktop 1440 pixels; additional short 400-pixel-height viewport. No horizontal document overflow in checked phone widths.
- The Chromium fixture intentionally used synthetic cards and in-memory storage, not the full production renderer or remote artwork library. These checks are not a claim of public-site or physical-phone verification.
- The original loader was reconstructed and its Git blob SHA verified against `ee7b1820695982a2d2b4c3ccb936a44abd626243` before making the minimal integration changes.

## Rollback

Restore only `public/mtgtools/odyssey/index.html` from baseline commit `137b23a6156cff4e80ae1fdad80bcccfbee715da` to disable the extension. The two mobile assets can remain unused. No artwork-state migration or data rollback is needed. Do not force-reset main over later unrelated commits.
