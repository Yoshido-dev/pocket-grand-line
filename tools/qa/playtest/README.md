# Playtest tools

Headless Chrome (system install) + `playwright-core` from `tools/qa/node_modules`. Build and serve the game first (`npm run build`, then `npm run serve`, port 8787). Run one browser at a time: a second one slows the bot's game and causes false "stuck" events.

- `autoplay.mjs [url] [outdir]`: plays the whole story from a fresh save with real controls. It holds W toward the Log Pose aim (`game.way.route`), steers round trees, posts and terrace walls, presses E to talk and Enter to read, and accepts offers. It logs `stuck`, `swim`, `ride`, `offer`, heartbeat (`hb`, every 30 s), `busy-long` and `tick-error` events, takes screenshots, and writes `report.json` (default folder `tools/qa/shots/autoplay`). `LIMIT_MIN=40` caps the run.
- `probe-route.mjs npcId '[[lat,lon,"label"],...]'`: from each spot, follows the needle with a simple walker and prints where the aim switched and whether it arrived. Set `VIA=reverse-mountain` (or another crossing id) for forced routes.
- `probe-area.mjs lat lon [halfDeg] [stepDeg] [marks]`: ASCII map. `#` deep water, `~` wading, `.` land, `=` deck/platform, `o` collider, digits are approach nodes, capitals are NPCs.
- `probe-graph.mjs zoneId npcId`: a zone's approach-node walking graph, node to node, plus each node's walk to the target (reaches / escapes).
- `probe-walks.mjs lat lon zoneId [aimLat aimLon]`: the game's own walk check from one spot to every node of a zone.
- `probe-talkable.mjs`: every NPC keeps a standing spot within talk reach (2.8 m along the ground, 2.6 m in height).
- `probe-rescue.mjs`: where the News Coo rescue lift would land for every recipient, from six directions.
