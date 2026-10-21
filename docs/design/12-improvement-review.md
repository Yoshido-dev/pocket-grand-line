# 12 — Improvement review: make the existing journey easier to read

2026-10-17. The project is a procedural, eight-delivery adventure across 33 zones on a planet with a 60 m radius. Its strongest feature is the connection between recognizable places, characters and small story moments. The unfinished decongestion work in [HANDOVER.md](../../HANDOVER.md) identified the immediate problem: too many competing silhouettes, labels and arrival notifications.

Adding more islands would increase travel and visual density before making the existing deliveries easier to follow. This pass therefore finishes the readability work and fixes interaction and save defects encountered during review. The story, procedural assets, existing crossings and local save format remain the foundation.

## Implemented decisions

- **Give each shore a clearer silhouette.** Reduce repeated tall scenery and satellite decorations, cap automatic dressing density, and shrink Laboon's visual footprint. Keep landmarks and the decks, bridges and approaches that deliveries need. Correct terrain slope sampling so stretched islands do not corrupt flora placement.
- **Separate nearby destinations from the background.** Use 18/54 m fog near/far around the Grand Line, blending to 22/64 m in the Blues. Fade outlines sooner than fills. Give the guide gull its own unfogged materials while preserving its outline and camera cut-away shaders.
- **Make the overview useful.** Start eagle eye at 30 m. Show at most six zone names, measured against their actual text bounds, with the tracked destination first, then the current shore and nearby places. Keep follow-camera pitch consistent when zooming and cap portrait FOV at 64°.
- **Recognize arrivals instead of proximity.** Require 1.5 seconds grounded on the same dry shore or deck before inking a visit. Give banners 150 seconds per place and 15 seconds globally; suppressing a banner must not suppress discovery.
- **Reduce travel and control friction.** Raise knee/waist wading to 90%/75% of land speed. Stop current drift while dialogue or menus hold the courier. Keep touch movement and camera gestures from claiming the same active finger.
- **Repair individual save fields.** Validate collections, settings, counters and job indices, preserving usable progress when another field is malformed. Store the eagle-eye hint in the same flag set that persistence writes.
- **Make verification reusable.** Enforce the expanded game's 330 KiB gzip budget. Allow the layout checker to consume measurements from the shared browser, with the same assertions as standalone QA and no separate browser launch.

## Tradeoffs and deferred work

Denser fog and fewer labels deliberately hide some distant detail; the gull, Log Pose and chart retain navigation cues. Faster wading narrows the speed advantage of Sea King bridges, which still offer dry footing and recognizable routes. Decluttering must be judged by screenshots as well as footprint numbers: an island can be smaller and still lose its identity.

New islands, villains, combat, additional deliveries, an engine rewrite and broader multiplayer work are deferred. Existing job timings and route comfort need actual traversal checks; a teleport-based story playthrough confirms progression, not walkability. Layout assertions, current drift, visual inspection, type checks and bundle size therefore remain separate evidence.

## Combined build verification

Verified in the T3 collaborative browser against the production server on port 8787, with the original preview save restored after testing.

| Check | Result |
|---|---|
| TypeScript and production build | Pass |
| `npm test` | 15 save/progression and touch-event regressions pass |
| Layout gate | All 28 assertions pass; tightest non-exempt island gap remains 4.13 m |
| Story | Fresh-save opening, all eight deliveries and finale complete; end screen visible; no page errors |
| Jinbe current, idle traversal | Arrives in 43.0 s; no land or off-lane samples; nearest approach to Laugh Tale 8.97 m |
| Current movement locks | Zero displacement during dialogue lock and Log Book; 1.32 m movement in the first 0.4 s after closing |
| Labels | Desktop overview: six, including the tracked destination, with no overlaps or offscreen labels; portrait 390 × 844 with large text also fits |
| Arrivals | Offshore and 1.4 s landfall do not enter a zone; 1.51 s does. Maximum four banners per simulated minute; same place repeats at 150 s |
| Eagle tutorial | Hint flag survives reload |
| World generation, five reloads | 458, 436, 423, 437, 422 ms; median **436 ms** on this machine |
| Complete transfer size | **324.2 KiB gzip / 268.3 KiB brotli**; enforced budget 330 KiB gzip |

The 21 changed locations were captured and inspected in [sheet 1](../../tools/qa/shots/review-sheet-1.jpg), [sheet 2](../../tools/qa/shots/review-sheet-2.jpg) and [sheet 3](../../tools/qa/shots/review-sheet-3.jpg). Landmarks, crossing structures and open-water separation remain visible. The Water 7 trestle and Enies Lobby stub are present; Impel Down remains clear of the Red Line. The high-level screenshots complement the player-height view at Drum and the portrait overview at Water 7.

Measured reductions include Sabaody's prop radius **10.02 → 8.26 m**, Mary Geoise's **10.34 → 5.91 m**, and Whisky Peak's land radius **8.98 → 7.68 m**. Drum and Twin Capes retain their previous maximum prop radius because the retained outer structures still determine that maximum; their interior scenery was reduced. The existing gate does not prove every player-driven route, and synthetic touch-event tests are not physical-device testing.

The numerical layout evidence is saved in `tools/qa/review-before-layout.json`, `review-after-layout.json`, and `review-layout-report.json`. Run `node tools/qa/gaps.mjs --data tools/qa/review-after-layout.json` to replay the assertions; capture new live measurements after future world edits. Load `tools/qa/preview-checks.js` with the preview evaluator and call `__review.run()` for the story check, then inspect `__review.rows`, `__review.running`, and `__review.errors` without holding an automation call open for the entire playthrough.
