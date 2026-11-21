// nightfall: entry point — canvas, seeded RNG, main loop, shot mode for
// deterministic screenshots (?shot=<name>&seed=<n> renders one staged frame).
import { VIEW_W, VIEW_H, TILE } from './config.js';
import { Input } from './input.js';
import { Game } from './game.js';
import { render } from './render.js';
import { takeShot } from './shots.js';

// mulberry32 seeded PRNG so guard wiggles are reproducible
export function seedRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const params = new URLSearchParams(location.search);
const seed = parseInt(params.get('seed') || '7', 10) || 7;
const canvas = document.getElementById('game');
canvas.width = VIEW_W; canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const game = new Game(seedRandom(seed));

// deterministic screenshot scenes: skip the live loop entirely
const shotName = params.get('shot');
if (shotName) {
  takeShot(ctx, game, shotName);
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game.update(dt, input);
    render(ctx, game, input);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
