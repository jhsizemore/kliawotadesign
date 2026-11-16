# Kliawota Disaen Pages CMS trial

This is a copy of the homepage, not a change to kliawota.design.

## Editing

1. Open https://app.pagescms.org and sign in with GitHub.
2. Connect Pages CMS to `jhsizemore/kliawotadesign` only.
3. Select branch `codex/pages-cms-trial`. Do not choose `main`.
4. Open **Homepage — editing trial**.
5. Change text, upload an image, or edit the work links, then save.
6. In the preview, click **Refresh saved content**. GitHub caching can delay edits by a few minutes.

Only this branch contains the trial CMS configuration and `cms-trial/home.json`.
The public homepage source and production deployment configuration are unchanged.
Do not merge the trial branch into main.

## What is being tested

This is real Pages CMS editing of a JSON content file. The preview reads that public trial file over HTTPS; uploaded images are read from the same branch. Its design, motion, and existing project links come from the homepage. Existing project links open the original website.

This preview intentionally uses a live content fetch to make a trial possible without changing the production pipeline. For client delivery, use an authenticated CMS editing flow plus a build on content changes, so the published page does not depend on GitHub for each visit.

## Costs and responsibilities

No paid subscription is configured. Pages CMS access requires the user's GitHub sign-in and authorization. Access to the existing repository is repository-wide, not restricted to this branch. For a client production deployment, prefer a dedicated website repository and review permissions.

The original text remains visible if the remote content cannot be loaded; the trial bar reports this explicitly. Version history in GitHub provides recovery for saved edits.

## Local preview

Serve `dist` with any static server. `?source=local` uses `dist/content/home.json` for offline verification. Normal mode uses the isolated GitHub trial branch.
