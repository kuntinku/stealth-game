// nightfall: the infiltrator — movement, noise footprint, intel pickup.
import { SPEED_RUN, SPEED_WALK, SPEED_SNEAK, NOISE_RUN, NOISE_WALK, NOISE_SNEAK, WHISTLE_NOISE } from './config.js';
import { moveEntity, isBush, tileAt } from './level.js';

export class Player {
  constructor(start) {
    this.pos = { x: start.x, y: start.y };
    this.r = 10;
    this.dir = 0;               // facing angle (mouse)
    this.mode = 'walk';         // run | walk | sneak
    this.noise = 0;             // current noise radius, px
    this.moving = false;
    this.intel = 0;
  }

  update(dt, input, world) {
    let vx = 0, vy = 0;
    if (input.has('KeyW') || input.has('ArrowUp')) vy -= 1;
    if (input.has('KeyS') || input.has('ArrowDown')) vy += 1;
    if (input.has('KeyA') || input.has('ArrowLeft')) vx -= 1;
    if (input.has('KeyD') || input.has('ArrowRight')) vx += 1;
    const len = Math.hypot(vx, vy) || 1;
    vx /= len; vy /= len;

    if (input.has('ShiftLeft') || input.has('ShiftRight')) this.mode = 'sneak';
    else if (input.has('Space')) this.mode = 'run';
    else this.mode = 'walk';

    const speed = this.mode === 'run' ? SPEED_RUN : this.mode === 'sneak' ? SPEED_SNEAK : SPEED_WALK;
    this.moving = vx !== 0 || vy !== 0;
    if (this.moving) moveEntity(this.pos, vx * speed, vy * speed, dt, this.r);
    this.dir = Math.atan2(input.mouse.y - this.pos.y + 0, input.mouse.x - this.pos.x + 0) || 0;

    // noise footprint: bigger when running, almost none sneaking
    this.noise = this.moving
      ? (this.mode === 'run' ? NOISE_RUN : this.mode === 'sneak' ? NOISE_SNEAK : NOISE_WALK)
      : 6;

    // whistle: a deliberate lure the guards investigate
    if (input.takeWhistle()) world.noiseEvents.push({ x: this.pos.x, y: this.pos.y, r: WHISTLE_NOISE });

    // footsteps that guards hear
    this.stepTimer = (this.stepTimer || 0) + dt * (this.moving ? (this.mode === 'run' ? 5 : this.mode === 'sneak' ? 1.5 : 3) : 0);
    if (this.stepTimer > 1) {
      this.stepTimer = 0;
      world.noiseEvents.push({ x: this.pos.x, y: this.pos.y, r: this.noise });
    }

    // pick up intel you walk over
    for (const it of world.level.intel) {
      if (!it.taken && Math.hypot(it.x - this.pos.x, it.y - this.pos.y) < 18) {
        it.taken = true;
        this.intel++;
        world.audio.pickup();
      }
    }
  }

  // bushes swallow your silhouette: guards only spot you inside one at point-blank range
  hiddenInBush() { return isBush(tileAt(this.pos.x, this.pos.y)); }
}
