// nightfall: tile grid, collision, line of sight and the level layout.
// Legend: # wall, . floor, B bush (hides you, blocks nothing), C crate (blocks sight),
//         D door, I intel, X exit, P player start, digits = guard waypoints (same digit chains)
import { TILE } from './config.js';
export { TILE };

export const MAP = [
  '##############################',
  '#...1......BBBB......#.......#',
  '#.####.C...B..B..1..1#.####..#',
  '#.#..#.......C.....1.#.#..#..#',
  '#.#..#..B.........C..#.#..#..#',
  '#.#..#....####.###...D.#..#..#',
  '#.####....#II..#......###..###',
  '#.........#..C.#.............#',
  '#..2.C......###....####C####.#',
  '#.2..........C....#.........X#',
  '#...........B.....#..3....I..#',
  '#..P..............#....3....##',
  '#....2...####..####D.....3...#',
  '#..C.....#.........#..C..B...#',
  '#........#....I....#.........#',
  '##############################',
  '#....B........C.......B......#',
  '#..C.......B.............C...#',
  '##############################',
];

export const MAP_W = MAP[0].length;
export const MAP_H = MAP.length;

// tile properties
export function isWall(c) { return c === '#'; }
export function blocksSight(c) { return c === '#' || c === 'C'; }
export function isBush(c) { return c === 'B'; }

export function tileAt(x, y) {
  const cx = Math.floor(x / TILE), cy = Math.floor(y / TILE);
  if (cx < 0 || cy < 0 || cx >= MAP_W || cy >= MAP_H) return '#';
  return MAP[cy][cx];
}

// circle-vs-grid collision, radius r around position {x,y}
export function collide(pos, r) {
  for (const [dx, dy] of [[-r, 0], [r, 0], [0, -r], [0, r], [-r * .7, -r * .7], [r * .7, -r * .7], [-r * .7, r * .7], [r * .7, r * .7]]) {
    if (isWall(tileAt(pos.x + dx, pos.y + dy))) return true;
  }
  return false;
}

// move with axis separation so you slide along walls
export function moveEntity(pos, vx, vy, dt, r) {
  const nx = pos.x + vx * dt;
  if (!collide({ x: nx, y: pos.y }, r)) pos.x = nx;
  const ny = pos.y + vy * dt;
  if (!collide({ x: pos.x, y: ny }, r)) pos.y = ny;
}

// raycast: is the straight line a->b blocked by a sight-blocking tile?
export function hasSight(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const steps = Math.ceil(dist / (TILE / 2));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blocksSight(tileAt(a.x + dx * t, a.y + dy * t))) return false;
  }
  return true;
}

// parse static pickups, doors, exits and guard waypoints out of the grid
export function parseLevel() {
  const intel = [], doors = [], exits = [], waypoints = {};
  let start = { x: 64, y: 64 };
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const c = MAP[y][x];
      const px = x * TILE + TILE / 2, py = y * TILE + TILE / 2;
      if (c === 'P') start = { x: px, y: py };
      else if (c === 'I') intel.push({ x: px, y: py, taken: false });
      else if (c === 'X') exits.push({ x: px, y: py, w: TILE, h: TILE });
      else if (c === 'D') doors.push({ x, y, open: false });
      else if (c >= '1' && c <= '9') {
        (waypoints[c] = waypoints[c] || []).push({ x: px, y: py });
      }
    }
  }
  return { start, intel, doors, exits, waypoints };
}
