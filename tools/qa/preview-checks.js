// Evaluate this file in the collaborative preview after boot. No browser process is launched.
// await __review.step() advances one real story interaction; repeat until done.
(() => {
  const g = window.__game;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const errors = [];
  addEventListener('error', (event) => errors.push(event.message));
  addEventListener('unhandledrejection', (event) => errors.push(String(event.reason)));
  const settle = async (maxMs = 30000) => {
    const start = performance.now();
    while (performance.now() - start < maxMs) {
      if (g.ui.talking) g.ui.advance();
      else if (!g.busy && !g.player.riding && !g.cam.diving) {
        await sleep(200);
        if (!g.ui.talking && !g.busy && !g.player.riding && !g.cam.diving) return;
      }
      await sleep(70);
    }
    throw new Error('Story did not settle within ' + maxMs + ' ms');
  };
  window.__review = {
    errors,
    settle,
    rows: [],
    running: false,
    run() {
      if (this.running) return;
      this.running = true;
      void (async () => {
        try {
          for (let i = 0; i < 40; i++) {
            const row = await this.step();
            this.rows.push(row);
            if (row.done) break;
          }
        } catch (error) { errors.push(String(error)); }
        finally { this.running = false; }
      })();
    },
    async step() {
      await settle();
      if (g.jobs.allDone()) return { done: true, endVisible: !document.querySelector('#end').hidden, state: { ...g.jobs.state }, errors: [...errors] };
      const target = g.jobs.trackedStep()?.step.to ?? [...g.jobs.givers()][0];
      if (!target) throw new Error('No delivery target');
      const npc = g.npc(target);
      if (!npc) throw new Error('Missing NPC: ' + target);
      g.nearNpc(target);
      await sleep(600);
      await settle();
      const before = JSON.stringify(g.jobs.state);
      void g.talk(npc);
      await sleep(200);
      await settle();
      return { target, changed: before !== JSON.stringify(g.jobs.state), state: { ...g.jobs.state }, errors: [...errors] };
    },
    labels() {
      const labels = [...document.querySelectorAll('.zonelabel')].filter((el) => getComputedStyle(el).visibility !== 'hidden');
      const boxes = labels.map((el) => ({ name: el.textContent, tracked: el.classList.contains('tracked'), box: el.getBoundingClientRect() }));
      const overlaps = boxes.flatMap((a, i) => boxes.slice(i + 1).filter((b) => a.box.left < b.box.right && a.box.right > b.box.left && a.box.top < b.box.bottom && a.box.bottom > b.box.top).map((b) => [a.name, b.name]));
      const offscreen = boxes.filter(({ box: b }) => b.left < 0 || b.right > innerWidth || b.top < 0 || b.bottom > innerHeight);
      return { count: labels.length, names: boxes.map((b) => b.name), tracked: boxes.filter((b) => b.tracked).map((b) => b.name), overlaps, offscreen: offscreen.map((b) => b.name), fov: g.cam.cam.fov };
    },
    async currentLocks() {
      const p = g.player;
      const lane = g.world.walk.lanes.find((s) => s.id === 'lane-jinbe');
      p.place(lane.a, lane.b.clone().addScaledVector(lane.a, -lane.a.dot(lane.b)).normalize());
      const start = p.dir.clone();
      p.locked = true;
      await sleep(400);
      const dialogueDrift = start.distanceTo(p.dir) * g.world.R;
      p.locked = false;
      g.openLogBook('jobs');
      await sleep(400);
      const menuDrift = start.distanceTo(p.dir) * g.world.R;
      g.ui.closePanel();
      await sleep(400);
      return { dialogueDrift, menuDrift, resumedDistance: start.distanceTo(p.dir) * g.world.R };
    },
  };
  return { ready: true, boot: window.__boot };
})()
