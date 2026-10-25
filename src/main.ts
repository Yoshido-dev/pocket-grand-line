import './ui/style.css';
import { Game } from './game/game';
import { content } from './content';
import { inject } from '@vercel/analytics';

inject();

function fail(msg: string) {
  const boot = document.getElementById('boot');
  if (boot) boot.querySelector('p')!.textContent = msg;
}

async function main() {
  const canvas = document.getElementById('c') as HTMLCanvasElement;
  const probe = document.createElement('canvas').getContext('webgl2');
  if (!probe) {
    fail('This adventure needs WebGL 2. Try a recent Chrome, Edge, Firefox or Safari.');
    return;
  }
  probe.getExtension('WEBGL_lose_context')?.loseContext();

  const game = new Game(canvas, content);
  // let the loader paint before the heavy procedural build
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  const t0 = performance.now();
  game.build();
  const tBuild = performance.now() - t0;
  await game.warm();
  const tWarm = performance.now() - t0 - tBuild;
  (window as unknown as { __game: Game; __boot: object }).__game = game;
  (window as unknown as { __boot: object }).__boot = { buildMs: Math.round(tBuild), warmMs: Math.round(tWarm) };
  game.renderer.setAnimationLoop(game.loop);
  game.showTitle();
  document.getElementById('boot')?.classList.add('gone');
  setTimeout(() => document.getElementById('boot')?.remove(), 800);
}

main().catch((err) => {
  console.error(err);
  fail('Something went wrong while building the world. Please reload.');
});
