# Odyssey email updates and card-source continuity

## What the public signup does

Come Aboard collects an email address, optional name, selected update topics and explicit consent. The topics are set progress/reveals, membership-opening announcements and private-playtesting-opening announcements. It is not a membership sale or an application that guarantees playtesting access.

Signups are saved in a private Cloudflare Durable Object using the existing ODYSSEY_ART_SYNC binding and a separate named object, `odyssey-private-subscribers-v1`. Subscriber data is not stored with card/art rows and is not in public assets, GitHub or browser storage. No new Cloudflare secret or Mailchimp account is needed simply to collect signups.

This is single opt-in. Records say `emailVerified: false`. No confirmation, welcome email or campaign is sent automatically. A branded sending address is a separate, unfinished configuration task.

## Managing the list

Open https://kliawota.design/mtgtools/Odyssey/scry/subscribers/ and sign in with the verified owner Google account. It reuses the public OAuth web client ID stored by Studio in the same browser. If no client ID has previously been configured, that Google OAuth setup is still required for owner access; collection works without it. Tokens stay in memory.

The private Google Sheet is https://docs.google.com/spreadsheets/d/13TFGTa8ZCAdR5ztTsMd151WEAfioIEskoFre7zhazec/edit . It was created with owner-only access. The manager's **Refresh Google Sheet** explicitly exports the latest list and verifies the written cells. This is NOT an automatic live mirror. Never use a stale export for a mailing and never make the workbook public.

**Export active signups CSV** includes active records only, selected topics, consent date/version, ownership-verification status and a signed unsubscribe URL. **Unsubscribe** stops updates. **Delete personal details** removes the address/name and retains a keyed, non-reversible suppression identifier. Refresh or remove any previous exports after deleting personal details. Editing a row in the exported Sheet does not change the live list.

Every actual campaign must include the corresponding unsubscribe link and must respect topic choices. Opening an unsubscribe link is read-only; the person confirms it on the page. Another anonymous signup cannot silently resubscribe an address that opted out.

## Protection and limits

JSON-only same-origin writes, explicit consent, bounded inputs, a short-lived signed cookie challenge, a honeypot, five submissions per ten minutes per temporary network identifier, 2,000 per day globally and a bounded private list. Raw IPs are not saved. Anti-abuse keys expire through the object's alarm. Owner list/export endpoints verify the Google account server-side. Public responses contain no subscriber records. CSV cells are formula-safe and Sheet writes use RAW values.

## Candidate file and art placement

`data/odyssey-public-candidate.json` is generated from the exact four published source scripts loaded by Studio. Its canonical authority is the 14A2 Card File v1.0 Candidate tab. It excludes editor-local card changes. `npm run build:renderer` rebuilds both this publication and the native renderer; `--check` detects drift. The full spoiler is this candidate file, not a second/final set.

Scry consumes the shared published artwork placements. A separate geometry-only projection from Studio enables a clearly labelled same-browser author preview. It contains no private rules, names or access tokens. **View the public version** disables that preview. Unpublished browser crops cannot be retrieved by the website server or this assistant: use Studio → Artwork sync → Review → Publish to Sheets & Scry once to make them visible to friends. Publication remains explicit and conflict-checked.

The release inspection found zero published placement records. No default crop was falsely labelled as Hunter's chosen crop, and no unpublished framing was automatically made public.

## Verification

Unit/protocol tests cover candidate equality, crop identity guards, consent, deduplication, owner isolation, exports, failed writes, unsubscribe and deletion. Browser tests cover all eight slide panels, delayed crop updates, the actual form handler, author/private-view isolation, mobile layouts and unsubscribe. A separate test runs the real Worker entrypoint with a local SQLite-backed Cloudflare Durable Object. Tests use only synthetic local subscribers and do not write test addresses to the real Sheet or send emails.
