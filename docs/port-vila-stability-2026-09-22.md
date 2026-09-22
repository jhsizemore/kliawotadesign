# Port Vila stability repair — 22 September 2026

## Reproduced cause

The production HTML imports `index-DKcirIOB.js?v=mobile-onboarding-4`,
while Plan Layers and DUAP Vision import `index-DKcirIOB.js` without the
query. ES modules identify these as different modules. Opening a lazy panel
therefore runs the entry point again, replaces the app DOM, and creates a
second renderer and controller set. The live browser reproduced a map reset
on opening Plan Layers and logged “Multiple instances of Three.js”.

The cloud test browser also cannot obtain a WebGL2 context. This is a test
environment limit, not evidence that every user's phone lacks graphics.
The live release shows an error requiring manual plan fallback. The repair
opens the existing packaged plan automatically when 3D initialization fails.

## Changes

- A new canonical entry URL shared by the HTML and both lazy chunks. Original
  compiled assets remain untouched for rollback and older in-flight clients.
- `replaceState` retains the Back-navigation guard across city/mode changes.
- Map, model-kit and saved-draft loads have deadlines; blocked IndexedDB
  connections fail promptly and close if they open after abandonment.
- Rendering validates the first frame, retries with Light graphics after a
  rendering failure, then stops and offers plan-view/export recovery if needed.
  Graphics context/device loss exposes the same recovery, preserving the
  current proposal. Returning from browser back-forward cache restarts one loop.
- Smaller shadow maps (1024 mobile / 2048 desktop) and reflection targets reduce
  GPU demand; narrow screens also use the mobile profile.
- Plan fallback exposes selection/layer state to Back navigation. Its return
  to 3D button remains accessible despite the hidden introductory card.
- Static initial loading content prevents an entirely empty page if the entry
  module cannot be downloaded.

The Vite authoring sources are absent from this repository. The guarded Python
build script applies explicit, counted replacements to the preserved upstream
bundle and emits the new module graph. Runtime guards live in a separate readable
module. This is a scoped repair, not a renderer rewrite.

## Verification

11 targeted checks pass, covering the transitive module graph, navigation state,
load deadline, blocked/late storage, initial and later render failure, context
loss, back-forward cache, and executing the actual startup/fallback functions
with an unsupported GPU while preserving the same saved scenario.
JavaScript syntax checks pass. CI rebuilds and requires byte-identical output.
Production verification checks the entry HTML and all four new module files.

The repaired build has not had a full GPU-enabled browser/mobile-device run.
The available cloud browser reproduced the original failure but lacks WebGL2;
this static project has no supported local browser-preview server. GPU performance
improvement is expected from lower render targets, not a measured FPS claim.

## Publication status

Prepared against main `7d8828cd15ecc92a0de7eb1d577a8ad6bcbde03d`.
Cloudflare Wrangler reports this session is not authenticated. No Cloudflare
connector is available. A GitHub push alone does not deploy this Worker.
The review branch/PR preserves the complete fix, but production remains unchanged
until a credentialed deployment runs from an up-to-date merged checkout.
Do not deploy this older full checkout over newer unrelated Odyssey changes.
