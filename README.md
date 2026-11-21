# kuntinku/stealth-game

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/kuntinku/stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/kuntinku/stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

**Nightfall Estate** — a top-down stealth infiltration game. Sneak through a night-time
estate, slip in and out of three patrolling guards' flashlight vision cones, hide in bushes
and behind crates, gather 3 intel folders, and reach the glowing EXIT gate unseen. Guards
patrol on learnable routes, hear your footsteps and whistles, escalate from suspicious to
alert chase to search, and the alarm cools if you stay out of sight — a detection system
that always gives you a chance to recover. Full HUD (intel counter, alarm stars, detection
"eye" meter), noise ripples, WebAudio footsteps, win/lose screens. Pure HTML5 canvas +
vanilla JS ES modules, no libraries, no CDN, fully offline.

Controls: WASD move · SHIFT sneak · SPACE run · E whistle lure · R restart.

## Run it

```sh
node serve.ts            # serves game/ on http://localhost:8080
```

Deterministic screenshot scenes: `?shot=patrol|chase|intel|escape&seed=7` (see `screenshots/`).

Source layout: `config.js` tuning · `level.js` map, collision, line-of-sight raycast ·
`player.js` movement/noise · `guards.js` patrol–suspicious–alert–search AI · `audio.js`
synth · `render.js` lighting, cones, HUD · `game.js` state machine · `shots.js` staged
deterministic scenes.

---

<sub>Entered on [make.fun](https://make.fun/?ref=m88kv07r&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
