// Look ahead like a walker: compare a low collider with the surface we will stand on there.
export function blockedAhead(game, player, direction) {
  const w = game.world, R = w.R;
  for (const distance of [0.35, 0.7, 1.05]) {
    const q = player.dir.clone().addScaledVector(direction, distance / R).normalize();
    const surface = w.ground(q, 1e9);
    if (distance < 1 && surface.kind === 'terrain' && w.ground(q, player.feet).h - player.feet > 0.46) return true;
    // A stair rises over the lookahead distance. Its low flank blockers sit below the stair surface;
    // comparing them with the player's current feet falsely treats a climbable stair as a wall.
    const feet = surface.kind === 'terrain' ? player.feet : surface.h;
    for (const collider of w.walk.nearColliders(q)) {
      if ((collider.top === undefined || collider.top > feet + 0.05) && Math.acos(Math.max(-1, Math.min(1, q.dot(collider.dir)))) * R < collider.r + 0.3) return true;
    }
  }
  return false;
}
