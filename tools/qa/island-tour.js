// Evaluate in the shared T3 preview after each Vite reload. QA only; not shipped.
(() => {
  const g = window.__game;
  if (!g) throw new Error('Wait for game boot before installing island tour');
  if (!sessionStorage.getItem('pgl-islands-dev-original')) sessionStorage.setItem('pgl-islands-dev-original', JSON.stringify(localStorage.getItem('pgl-save-v1')));
  g.started = true;
  g.busy = false;
  g.cam.mode = 'follow';
  const title = document.querySelector('#title');
  if (title) title.hidden = true;
  const style = document.createElement('style');
  style.textContent = '#labels,#banner,#toast,.toast,#eagle-hint{visibility:hidden!important}';
  document.head.append(style);
  g.ui.hud(false);
  window.__islands = {
    // Invert offsetDir's spherical exponential map in this zone's carried frame.
    // Coordinates are live local metres, even for relocated/rotated islands.
    routes(id) {
      const w = g.world, zone = w.zone(id);
      if (!zone) throw new Error('Unknown island: ' + id);
      const centre = w.localDir(id, 0, 0);
      const { east, north } = w.northAt(id, centre);
      const V = centre.constructor, degrees = Math.PI / 180;
      const round = v => Math.round(v * 1e4) / 1e4;
      return (zone.terrain?.paths ?? []).map((path, index) => ({
        index, width: path.width, color: path.color ?? 0xd9c49a,
        flatPoints: path.pts.flatMap(([lat, lon]) => {
          const a = lat * degrees, b = lon * degrees;
          const d = new V(Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b));
          const x = d.dot(east), z = d.dot(north), sine = Math.hypot(x, z);
          const cosine = Math.max(-1, Math.min(1, d.dot(centre)));
          if (sine < 1e-12) {
            if (cosine < 0) throw new Error('Antipodal path point has no unique local coordinates');
            return [0, 0];
          }
          const scale = Math.atan2(sine, cosine) * w.R / sine;
          return [round(x * scale), round(z * scale)];
        }),
      }));
    },
    // Synchronous real-controller probe; flatPoints = [x0,z0,x1,z1,...].
    // Only the first point is teleported. No jumping or route finding is added.
    walk(id, flatPoints, opts = {}) {
      if (!g.world.zone(id)) throw new Error('Unknown island: ' + id);
      if (!Array.isArray(flatPoints) || flatPoints.length < 4 || flatPoints.length % 2 || flatPoints.some(v => !Number.isFinite(v))) throw new Error('Use flat local points [x0,z0,x1,z1,...]');
      const p = g.player, w = g.world, dt = opts.hz === 120 ? 1 / 120 : 1 / 60;
      const clamp = (v, fallback, lo, hi) => Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : fallback;
      const perLeg = Math.floor(clamp(opts.perLegSteps, 300, 1, 300));
      const maxSteps = Math.floor(clamp(opts.maxSteps, 3000, 1, 3000));
      const maxMs = clamp(opts.maxMs, 1000, 10, 2000);
      const tolerance = clamp(opts.tolerance, 0.32, 0.25, 0.4);
      const distance = (a, b) => Math.acos(Math.max(-1, Math.min(1, a.dot(b)))) * w.R;
      const round = v => Math.round(v * 1000) / 1000;
      const start = performance.now(), stats = { metres: p.metres, swims: p.swims }, events = p.events;
      const rides = [], legs = [];
      let steps = 0, maxDepth = 0, deepEvents = 0, status = 'complete';
      g.teleport(id, flatPoints[0], flatPoints[1]);
      p.speed = 0;
      p.locked = false;
      p.padCooldown = p.deepCooldown = p.deepT = p.safeT = 0;
      p.lastEdgeRide = undefined;
      const initial = w.ground(p.dir, p.feet);
      p.depth = initial.kind === 'terrain' ? Math.max(0, -initial.h) : 0;
      maxDepth = p.depth;
      let minFeet = p.feet;
      // These callbacks normally produce only audio/toasts; do not burst queued
      // effects while advancing several simulated seconds in one JS task.
      p.events = { ride: ride => rides.push(ride), deep: () => deepEvents++ };
      try {
        const desired = p.dir.clone();
        for (let i = 2; i < flatPoints.length; i += 2) {
          const target = w.localDir(id, flatPoints[i], flatPoints[i + 1]);
          const before = p.dir.clone();
          let count = 0, reason = null, reached = false;
          while (count < perLeg) {
            const gap = distance(p.dir, target);
            const endpoint = w.ground(target, p.feet);
            if (gap <= tolerance && p.grounded && !p.riding && Math.abs(endpoint.h - p.feet) <= 0.5) { reached = true; break; }
            if (steps >= maxSteps) { reason = 'total-step-limit'; break; }
            if (performance.now() - start >= maxMs) { reason = 'time-limit'; break; }
            desired.copy(target).addScaledVector(p.dir, -target.dot(p.dir));
            if (desired.lengthSq() > 1e-12) desired.normalize(); else desired.set(0, 0, 0);
            p.update(dt, desired, false, false);
            count++; steps++;
            maxDepth = Math.max(maxDepth, p.depth);
            minFeet = Math.min(minFeet, p.feet);
            if (p.swims > stats.swims) { reason = 'deep-water-attempt'; break; }
          }
          if (!reached && !reason) {
            const endpoint = w.ground(target, p.feet);
            reached = distance(p.dir, target) <= tolerance && p.grounded && !p.riding && Math.abs(endpoint.h - p.feet) <= 0.5;
            if (!reached) reason = 'leg-step-limit';
          }
          legs.push({ leg: i / 2, to: flatPoints.slice(i, i + 2), reached, reason, steps: count, remaining: round(distance(p.dir, target)), moved: round(distance(before, p.dir)), feet: round(p.feet), depth: round(p.depth), grounded: p.grounded, riding: p.riding });
          if (!reached) { status = reason; break; }
        }
        return { id, status, complete: status === 'complete', blockedLeg: legs.find(l => !l.reached)?.leg ?? null, legs, steps, simulatedSeconds: round(steps * dt), elapsedMs: round(performance.now() - start), travelled: round(p.metres - stats.metres), maxDepth: round(maxDepth), minFeet: round(minFeet), deepEvents, swims: p.swims - stats.swims, rides, feet: round(p.feet), depth: round(p.depth), grounded: p.grounded, riding: p.riding, finalDir: p.dir.toArray().map(round) };
      } finally {
        p.events = events;
        p.metres = stats.metres;
        p.swims = stats.swims;
        p.speed = 0;
        p.locked = true;
      }
    },
    // Walk the approach, then steer through its last point to trigger a real
    // pad/edge ride. Only the first point teleports; ride motion uses neutral input.
    ride(id, flatPoints, expectedRide) {
      const w = g.world, p = g.player;
      if (!w.zone(id)) throw new Error('Unknown island: ' + id);
      if (!Array.isArray(flatPoints) || flatPoints.length < 4 || flatPoints.length % 2 || flatPoints.some(v => !Number.isFinite(v))) throw new Error('Use flat local points [x0,z0,x1,z1,...]');
      if (typeof expectedRide !== 'string' || !w.walk.rides.has(expectedRide)) throw new Error('Unknown ride: ' + expectedRide);
      const saved = { events: p.events, metres: p.metres, swims: p.swims, locked: p.locked, speed: p.speed };
      const started = performance.now(), dt = 1 / 60, rides = [], endedRides = [];
      const round = v => Math.round(v * 1000) / 1000;
      const distance = (a, b) => Math.acos(Math.max(-1, Math.min(1, a.dot(b)))) * w.R;
      const sample = () => {
        const ground = w.ground(p.dir, p.feet + 0.05);
        // Player.depth is not refreshed during scripted rides. Measure immersion
        // from feet while airborne, and the contacted ground after landing.
        const depth = p.riding || !p.grounded ? Math.max(0, -p.feet) : ground.kind === 'terrain' ? Math.max(0, -ground.h) : 0;
        return { dir: p.dir.toArray().map(round), position: p.dir.clone().multiplyScalar(w.R + p.feet).toArray().map(round), feet: round(p.feet), depth: round(depth), grounded: p.grounded, riding: p.riding };
      };
      let steps = 0, leg = 1, legSteps = 0, maxDepth = 0, deepEvents = 0, reason = null, start;
      try {
        g.teleport(id, flatPoints[0], flatPoints[1]);
        p.speed = 0;
        p.locked = false;
        p.padCooldown = p.deepCooldown = p.deepT = p.safeT = 0;
        p.lastEdgeRide = undefined;
        start = sample();
        p.depth = start.depth;
        maxDepth = start.depth;
        p.events = { ride: name => rides.push(name), rideEnd: name => endedRides.push(name), deep: () => deepEvents++ };
        const targets = [];
        for (let i = 2; i < flatPoints.length; i += 2) targets.push(w.localDir(id, flatPoints[i], flatPoints[i + 1]));
        const desired = p.dir.clone().set(0, 0, 0);
        while (steps < 600) {
          if (performance.now() - started >= 1000) { reason = 'time-limit'; break; }
          desired.set(0, 0, 0);
          if (!rides.length) {
            const target = targets[leg - 1], last = leg === targets.length;
            const gap = distance(p.dir, target), endpoint = w.ground(target, p.feet);
            if (!last && gap <= 0.32 && p.grounded && Math.abs(endpoint.h - p.feet) <= 0.5) { leg++; legSteps = 0; continue; }
            if (!last && legSteps >= 300) { reason = 'approach-leg-step-limit'; break; }
            if (gap > 0.05) desired.copy(target).addScaledVector(p.dir, -target.dot(p.dir)).normalize();
          }
          p.update(dt, desired, false, false);
          steps++; legSteps++;
          maxDepth = Math.max(maxDepth, sample().depth);
          if (p.swims > saved.swims) { reason = 'deep-water-attempt'; break; }
          if (rides.length && !p.riding) {
            reason = rides.length === 1 && rides[0] === expectedRide && endedRides.includes(expectedRide) ? 'complete' : 'unexpected-ride';
            break;
          }
        }
        reason ??= p.riding ? 'ride-step-limit' : rides.length ? 'ride-did-not-end' : 'ride-not-triggered';
        const end = sample();
        return { id, expectedRide, complete: reason === 'complete', reason, rides, endedRides, approachLeg: leg, steps, simulatedSeconds: round(steps * dt), elapsedMs: round(performance.now() - started), travelled: round(p.metres - saved.metres), swims: p.swims - saved.swims, deepEvents, maxDepth: round(maxDepth), feet: end.feet, depth: end.depth, riding: end.riding, start, end };
      } finally {
        p.events = saved.events;
        p.metres = saved.metres;
        p.swims = saved.swims;
        p.locked = saved.locked;
        p.speed = saved.speed;
      }
    },
    view(id, x = 0, z = 0, h = 30, rot = 0) {
      g.teleport(id, x, z, rot);
      g.player.speed = 0;
      g.player.locked = true;
      g.player.rig.group.visible = true;
      g.cam.frozen = false;
      g.cam.mode = 'follow';
      g.cam.eagle = true;
      g.cam.eagleH = h;
      for (let i = 0; i < 5; i++) g.cam.update(1, g.player.position, g.player.dir, g.player.face, false, 0, 0);
      return { id, feet: g.player.feet, ground: g.world.ground(g.player.dir).h };
    },
    ground(id, x = 0, z = 0, rot = 0) {
      this.view(id, x, z, 30, rot);
      g.cam.eagle = false;
      for (let i = 0; i < 5; i++) g.cam.update(1, g.player.position, g.player.dir, g.player.face, false, 0, 0);
    },
    portrait(id, distance = 2.4, target = .85) {
      const n = id === 'you' ? null : g.npc(id);
      if (id !== 'you' && !n) throw new Error('Unknown portrait character: ' + id);
      const subject = n ?? g.player, scale = n?.def.scale ?? 1;
      g.player.rig.group.visible = id === 'you';
      g.portrait(id, distance, target + .3);
      g.cam.cam.lookAt(subject.rig.group.position.clone().addScaledVector(subject.dir, target * scale));
    },
    // A canvas-only fallback when the host backgrounds its collaborative tab
    // and native page screenshots stop responding. Read __qaCapture in chunks
    // under the preview_evaluate result limit; this never captures UI overlays.
    capture() {
      for (let i = 0; i < 20; i++) g.frame(.05);
      g.loop();
      // Adaptation can resize/clear the buffer at the end of loop().
      g.renderer.render(g.scene, g.cam.cam);
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 800;
      canvas.getContext('2d').drawImage(g.renderer.domElement, 0, 0, 1280, 800);
      window.__qaCapture = canvas.toDataURL('image/jpeg', .85);
      return window.__qaCapture.length;
    },
  };
  return { ready: true, zones: g.world.zones.map(z => z.id) };
})()
