// nightfall: the game state machine — sneak, gather intel, reach the exit unseen.
import { INTEL_TOTAL, ALARM_DECAY } from './config.js';
import { parseLevel } from './level.js';
import { Player } from './player.js';
import { spawnGuards } from './guards.js';
import { Audio } from './audio.js';

export class Game {
  constructor(seedRandom) {
    this.rng = seedRandom;
    this.audio = new Audio();
    this.reset();
  }

  reset() {
    this.level = parseLevel();
    this.player = new Player(this.level.start);
    this.guards = spawnGuards(this.level.waypoints, this.rng);
    this.noiseEvents = [];                 // ripples guards + renderer consume
    this.alarm = 0;                        // 0..3 estate alert level
    this.detection = 0;                    // max guard meter, drives the HUD eye
    this.state = 'playing';                // playing | won | lost
    this.endReason = '';
    this.time = 0;
    this.exitOpen = false;
  }

  raiseAlarm(guard) {
    this.alarm = Math.min(3, this.alarm + 1);
    guard.state = 'alert';
    // every guard converges on the sighting once the alarm rings
    for (const g of this.guards) {
      if (g.state === 'patrol') { g.state = 'suspicious'; g.lastSeen = { x: guard.lastSeen.x, y: guard.lastSeen.y }; }
    }
    this.audio.spotted();
  }

  caught() {
    if (this.state !== 'playing') return;
    this.state = 'lost';
    this.endReason = 'A guard caught you red-handed.';
    this.audio.lose();
  }

  update(dt, input) {
    if (this.state !== 'playing') {
      if (input.has('KeyR')) this.reset();
      return;
    }
    this.time += dt;
    this.player.update(dt, input, this);

    // guards hear this frame's noises
    for (const ev of this.noiseEvents) for (const g of this.guards) g.hear(ev);
    this.noiseEvents = [];

    for (const g of this.guards) g.update(dt, this.player, this);
    this.detection = Math.max(0, ...this.guards.map((g) => g.detect));

    // alarm cools while you stay out of sight
    if (this.detection < 0.1) this.alarm = Math.max(0, this.alarm - ALARM_DECAY * dt);

    // all intel gathered opens the exit
    this.exitOpen = this.player.intel >= INTEL_TOTAL;

    if (this.exitOpen) {
      for (const ex of this.level.exits) {
        if (Math.hypot(ex.x - this.player.pos.x, ex.y - this.player.pos.y) < 24) {
          this.state = 'won';
          this.endReason = 'You slipped out of the estate with everything.';
          this.audio.win();
        }
      }
    }
  }
}
