// nightfall: guard AI — patrol waypoints, vision cone detection,
// suspicious -> alert chase -> search -> calm, hearing noise events.
import { GUARD_RANGE, GUARD_HALF_ANGLE, DETECT_RATE, DETECT_COOL, CATCH_RADIUS, SEARCH_TIME } from './config.js';
import { hasSight, moveEntity, TILE } from './level.js';

export class Guard {
  constructor(waypoints, seedRandom) {
    this.pos = { x: waypoints[0].x, y: waypoints[0].y };
    this.waypoints = waypoints;
    this.wp = 1;
    this.r = 11;
    this.dir = 0;
    this.state = 'patrol';       // patrol | suspicious | alert | search
    this.detect = 0;             // 0..1 meter
    this.lastSeen = null;
    this.searchTimer = 0;
    this.speed = 70;
    this.chaseSpeed = 120;
    this.rng = seedRandom;
    this.wiggle = this.rng() * Math.PI * 2;
  }

  // can the guard see the player right now?
  sees(player, world) {
    const d = Math.hypot(player.pos.x - this.pos.x, player.pos.y - this.pos.y);
    if (d > GUARD_RANGE) return false;
    const ang = Math.atan2(player.pos.y - this.pos.y, player.pos.x - this.pos.x);
    let diff = Math.abs(angDiff(ang, this.dir));
    const inCone = diff < GUARD_HALF_ANGLE || d < 30;    // very close = peripheral awareness
    if (!inCone) return false;
    if (!hasSight(this.pos, player.pos)) return false;
    if (player.hiddenInBush() && d > 45) return false;
    return true;
  }

  hear(ev) {
    const d = Math.hypot(ev.x - this.pos.x, ev.y - this.pos.y);
    if (d > ev.r) return;
    // loud noises near a calm guard make them walk over and look
    if (this.state === 'patrol' || this.state === 'search') {
      this.state = 'suspicious';
      this.lastSeen = { x: ev.x, y: ev.y };
      this.detect = Math.max(this.detect, 0.35);
    } else if (this.state === 'suspicious') {
      this.lastSeen = { x: ev.x, y: ev.y };
    }
  }

  update(dt, player, world) {
    const seen = this.sees(player, world);

    if (seen) {
      const d = Math.hypot(player.pos.x - this.pos.x, player.pos.y - this.pos.y);
      const rate = DETECT_RATE * (1 - d / GUARD_RANGE * 0.6) * (player.mode === 'sneak' ? 0.6 : 1);
      this.detect = Math.min(1, this.detect + rate * dt);
      this.lastSeen = { x: player.pos.x, y: player.pos.y };
    } else {
      this.detect = Math.max(0, this.detect - DETECT_COOL * dt);
    }

    if (this.detect >= 1 && this.state !== 'alert') {
      this.state = 'alert';
      world.raiseAlarm(this);
    } else if (this.detect > 0.5 && this.state === 'patrol') {
      this.state = 'suspicious';
    }

    // behaviour per state
    if (this.state === 'patrol') {
      this.walkPath(dt, this.speed);
    } else if (this.state === 'suspicious') {
      if (this.lastSeen && this.moveTo(dt, this.lastSeen, this.speed)) {
        this.searchTimer += dt;
        if (this.searchTimer > 2.5) { this.searchTimer = 0; this.state = 'patrol'; this.detect = 0.1; }
      }
      if (seen) this.dir = Math.atan2(player.pos.y - this.pos.y, player.pos.x - this.pos.x);
    } else if (this.state === 'alert') {
      // chase the last known position; catch the player by touching them
      if (this.moveTo(dt, this.lastSeen, this.chaseSpeed) && !seen) {
        this.state = 'search';
        this.searchTimer = 0;
      }
      this.dir = Math.atan2(player.pos.y - this.pos.y, player.pos.x - this.pos.x);
    } else if (this.state === 'search') {
      // sweep around the last seen spot, then go back on patrol
      this.searchTimer += dt;
      const t = this.searchTimer * 1.2 + this.wiggle;
      const sx = this.lastSeen.x + Math.cos(t) * TILE * 1.5;
      const sy = this.lastSeen.y + Math.sin(t) * TILE * 1.5;
      this.moveTo(dt, { x: sx, y: sy }, this.speed * 0.8);
      if (this.searchTimer > SEARCH_TIME) {
        this.state = 'patrol';
        this.detect = 0;
      }
    }

    // caught: an alerted guard who reaches you ends the run
    if (this.state === 'alert' &&
        Math.hypot(player.pos.x - this.pos.x, player.pos.y - this.pos.y) < CATCH_RADIUS) {
      world.caught();
    }
  }

  // walk the waypoint loop
  walkPath(dt, speed) {
    const target = this.waypoints[this.wp];
    if (this.moveTo(dt, target, speed)) this.wp = (this.wp + 1) % this.waypoints.length;
  }

  // head toward a point one axis at a time (Manhattan steps keep guards off
  // corners); true when arrived
  moveTo(dt, target, speed) {
    const dx = target.x - this.pos.x, dy = target.y - this.pos.y;
    if (Math.hypot(dx, dy) < 6) return true;
    let vx = 0, vy = 0;
    if (Math.abs(dx) > 5) { vx = Math.sign(dx) * speed; this.dir = Math.atan2(0, Math.sign(dx)); }
    else if (Math.abs(dy) > 5) { vy = Math.sign(dy) * speed; this.dir = Math.atan2(Math.sign(dy), 0); }
    const before = { x: this.pos.x, y: this.pos.y };
    moveEntity(this.pos, vx, vy, dt, this.r);
    // blocked on the chosen axis: sidestep along the other one
    if (Math.abs(this.pos.x - before.x) < 0.01 && Math.abs(this.pos.y - before.y) < 0.01 && vx !== 0) {
      moveEntity(this.pos, 0, Math.sign(dy || 1) * speed, dt, this.r);
    }
    return false;
  }
}

function angDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function spawnGuards(waypoints, rng) {
  return Object.keys(waypoints).sort().map((k) => new Guard(waypoints[k], rng));
}
