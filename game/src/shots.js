// nightfall: staged deterministic screenshot scenes.
// ?shot=<name>&seed=<n> sets the world up exactly, renders a single frame and stops.
// Scenes: patrol (sneaking past cones), chase (alarm + pursuit), intel (grabbing
// intel in the inner wing), escape (exit gate open, clean getaway moment).
import { MAP } from './level.js';
import { TILE, VIEW_W, VIEW_H } from './config.js';
import { render } from './render.js';

function centerOf(ch) {
  for (let y = 0; y < MAP.length; y++) {
    const x = MAP[y].indexOf(ch);
    if (x >= 0) return { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
  }
  return null;
}

export function takeShot(ctx, game, name) {
  const g = game;
  const p = centerOf.bind(null);
  if (name === 'patrol') {
    g.player.pos = { ...p('P') };
    g.player.dir = -0.6;
    g.player.mode = 'sneak';
    g.guards[0].pos = { x: 15 * TILE, y: 3 * TILE };
    g.guards[0].dir = Math.PI;
    g.guards[1].pos = { x: 3 * TILE, y: 9 * TILE };
    g.guards[1].dir = 0;
    g.guards[2].pos = { x: 21 * TILE, y: 10 * TILE };
    g.guards[2].dir = Math.PI / 2;
    g.detection = 0.15;
    g.ripples = [{ x: g.player.pos.x, y: g.player.pos.y, r: 40 }];
  } else if (name === 'chase') {
    g.player.pos = { x: 10 * TILE, y: 10 * TILE };
    g.player.dir = -Math.PI / 2;
    g.guards[0].pos = { x: 11 * TILE, y: 12 * TILE };
    g.guards[0].dir = -Math.PI / 2;
    g.guards[0].state = 'alert';
    g.guards[0].detect = 1;
    g.guards[1].pos = { x: 5 * TILE, y: 12 * TILE };
    g.guards[1].dir = 0;
    g.guards[1].state = 'suspicious';
    g.guards[1].detect = 0.55;
    g.guards[2].pos = { x: 21 * TILE, y: 10 * TILE };
    g.guards[2].dir = Math.PI;
    g.alarm = 2;
    g.detection = 1;
    g.ripples = [{ x: 10 * TILE, y: 10 * TILE, r: 90 }];
  } else if (name === 'intel') {
    g.player.intel = 2;
    g.player.pos = { x: 14 * TILE, y: 13.5 * TILE };
    g.player.dir = -Math.PI / 2;
    g.player.mode = 'sneak';
    g.guards[0].pos = { x: 15 * TILE, y: 3 * TILE };
    g.guards[0].dir = Math.PI / 2;
    g.guards[1].pos = { x: 3 * TILE, y: 9 * TILE };
    g.guards[1].dir = -Math.PI / 3;
    g.guards[2].pos = { x: 21 * TILE, y: 10 * TILE };
    g.guards[2].dir = Math.PI / 2;
    g.detection = 0.05;
    g.time = 42;
    g.ripples = [];
  } else if (name === 'escape') {
    g.player.intel = 3;
    g.exitOpen = true;
    g.player.pos = { x: 27 * TILE, y: 9.5 * TILE };
    g.player.dir = 0;
    g.guards[0].pos = { x: 15 * TILE, y: 3 * TILE };
    g.guards[0].dir = Math.PI / 2;
    g.guards[1].pos = { x: 3 * TILE, y: 9 * TILE };
    g.guards[1].dir = Math.PI;
    g.guards[2].pos = { x: 21 * TILE, y: 10.5 * TILE };
    g.guards[2].dir = Math.PI;
    g.guards[2].state = 'search';
    g.detection = 0.2;
    g.time = 96;
    g.ripples = [];
  }

  render(ctx, g, null);
}
