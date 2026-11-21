// nightfall: renderer — night estate, flashlight cones cut out of the darkness,
// noise ripples, characters, HUD and the win/lose screens.
import { TILE, VIEW_W, VIEW_H, GUARD_RANGE, GUARD_HALF_ANGLE, PLAYER_LIGHT_RANGE, INTEL_TOTAL } from './config.js';
import { MAP, MAP_W, MAP_H } from './level.js';

const COLORS = {
  grass: '#1c2b1e', grass2: '#20331f', wall: '#3d4653', wallTop: '#556273',
  crate: '#7a5a33', bush: '#2f5d2f', floor: '#2a2a30', door: '#8a744a',
  intel: '#ffd24d', exit: '#59d97a', player: '#6fc3ff', guard: '#e05252',
};

export function render(ctx, game, input) {
  ctx.fillStyle = '#10131c';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const cam = camera(game);
  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  drawGround(ctx, cam);
  drawTiles(ctx, cam);
  drawIntel(ctx, game);
  drawNoiseRipples(ctx, game);
  drawGuardCones(ctx, game, cam);
  drawExits(ctx, game);   // exits glow above the darkness so the escape reads at a glance
  drawGuards(ctx, game);
  drawPlayer(ctx, game);

  ctx.restore();
  drawVignette(ctx, cam);
  drawHUD(ctx, game);
  if (game.state !== 'playing') drawEndScreen(ctx, game, input);
}

function camera(game) {
  const p = game.player.pos;
  return { x: Math.max(0, Math.min(p.x - VIEW_W / 2, MAP_W * TILE - VIEW_W)), y: Math.max(0, Math.min(p.y - VIEW_H / 2, MAP_H * TILE - VIEW_H)) };
}

function drawGround(ctx, cam) {
  for (let y = Math.floor(cam.y / TILE); y <= (cam.y + VIEW_H) / TILE; y++) {
    for (let x = Math.floor(cam.x / TILE); x <= (cam.x + VIEW_W) / TILE; x++) {
      if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
      ctx.fillStyle = (x + y) % 2 ? COLORS.grass : COLORS.grass2;
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
}

function drawTiles(ctx, cam) {
  for (let y = Math.floor(cam.y / TILE); y <= (cam.y + VIEW_H) / TILE; y++) {
    for (let x = Math.floor(cam.x / TILE); x <= (cam.x + VIEW_W) / TILE; x++) {
      if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
      const c = MAP[y][x];
      if (c === '#') {
        ctx.fillStyle = COLORS.wall; ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop; ctx.fillRect(x * TILE, y * TILE, TILE, 6);
      } else if (c === 'C') {
        ctx.fillStyle = COLORS.crate; ctx.fillRect(x * TILE + 3, y * TILE + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = '#5c431f'; ctx.strokeRect(x * TILE + 3.5, y * TILE + 3.5, TILE - 7, TILE - 7);
      } else if (c === 'B') {
        ctx.fillStyle = COLORS.bush;
        for (const [ox, oy, r] of [[10, 12, 11], [22, 10, 9], [16, 22, 10]]) {
          ctx.beginPath(); ctx.arc(x * TILE + ox, y * TILE + oy, r, 0, Math.PI * 2); ctx.fill();
        }
      } else if (c === 'D') {
        ctx.fillStyle = COLORS.door; ctx.fillRect(x * TILE, y * TILE + 8, TILE, TILE - 16);
      }
    }
  }
}

function drawIntel(ctx, game) {
  for (const it of game.level.intel) {
    if (it.taken) continue;
    const pulse = 4 + Math.sin(game.time * 4) * 2;
    ctx.fillStyle = COLORS.intel;
    ctx.beginPath(); ctx.arc(it.x, it.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.intel; ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.arc(it.x, it.y, 12 + pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawExits(ctx, game) {
  for (const ex of game.level.exits) {
    ctx.fillStyle = game.exitOpen ? COLORS.exit : '#33553f';
    ctx.fillRect(ex.x - TILE / 2 + 2, ex.y - TILE / 2 + 2, TILE - 4, TILE - 4);
    if (game.exitOpen) {
      const glow = ctx.createRadialGradient(ex.x, ex.y, 4, ex.x, ex.y, 60);
      glow.addColorStop(0, 'rgba(89,217,122,0.5)');
      glow.addColorStop(1, 'rgba(89,217,122,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(ex.x - 60, ex.y - 60, 120, 120);
      ctx.fillStyle = '#08240f';
      ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
      ctx.fillText('EXIT', ex.x, ex.y + 4);
      ctx.textAlign = 'left';
    }
  }
}

function drawNoiseRipples(ctx, game) {
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  for (const ev of game.ripples || []) {
    ctx.beginPath(); ctx.arc(ev.x, ev.y, ev.r, 0, Math.PI * 2); ctx.stroke();
  }
}

// guard flashlight cones: cut out of the darkness so danger reads at a glance
function drawGuardCones(ctx, game, cam) {
  ctx.save();
  // darkness layer, softly cut open by the player's own light
  ctx.fillStyle = 'rgba(4,6,14,0.62)';
  ctx.fillRect(cam.x, cam.y, VIEW_W, VIEW_H);
  const p = game.player.pos;
  const hole = ctx.createRadialGradient(p.x, p.y, 20, p.x, p.y, PLAYER_LIGHT_RANGE);
  hole.addColorStop(0, 'rgba(0,0,0,1)');
  hole.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = hole;
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER_LIGHT_RANGE, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  for (const g of game.guards) {
    const grad = ctx.createRadialGradient(g.pos.x, g.pos.y, 10, g.pos.x, g.pos.y, GUARD_RANGE);
    const tint = g.state === 'alert' ? '255,60,60' : g.state === 'suspicious' ? '255,190,60' : '255,225,150';
    grad.addColorStop(0, `rgba(${tint},0.35)`);
    grad.addColorStop(1, `rgba(${tint},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(g.pos.x, g.pos.y);
    ctx.arc(g.pos.x, g.pos.y, GUARD_RANGE, g.dir - GUARD_HALF_ANGLE, g.dir + GUARD_HALF_ANGLE);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawGuards(ctx, game) {
  for (const g of game.guards) {
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath(); ctx.arc(g.pos.x, g.pos.y, g.r, 0, Math.PI * 2); ctx.fill();
    // facing tick
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.pos.x, g.pos.y);
    ctx.lineTo(g.pos.x + Math.cos(g.dir) * 14, g.pos.y + Math.sin(g.dir) * 14);
    ctx.stroke();
    // state pip
    ctx.fillStyle = g.state === 'alert' ? '#ff3030' : g.state === 'suspicious' ? '#ffcc33' : '#66dd88';
    ctx.beginPath(); ctx.arc(g.pos.x, g.pos.y - 16, 4, 0, Math.PI * 2); ctx.fill();
    // detection mini-meter
    if (g.detect > 0.02) {
      ctx.fillStyle = '#000'; ctx.fillRect(g.pos.x - 14, g.pos.y - 24, 28, 5);
      ctx.fillStyle = '#ff4040'; ctx.fillRect(g.pos.x - 13, g.pos.y - 23, 26 * g.detect, 3);
    }
  }
}

function drawPlayer(ctx, game) {
  const p = game.player;
  ctx.fillStyle = COLORS.player;
  ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y, p.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.pos.x, p.pos.y);
  ctx.lineTo(p.pos.x + Math.cos(p.dir) * 13, p.pos.y + Math.sin(p.dir) * 13);
  ctx.stroke();
}

function drawVignette(ctx, cam) {
  const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H / 3, VIEW_W / 2, VIEW_H / 2, VIEW_H);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,10,0.5)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawHUD(ctx, game) {
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(8,10,20,0.78)';
  ctx.fillRect(0, 0, VIEW_W, 54);
  ctx.fillRect(0, VIEW_H - 34, VIEW_W, 34);

  ctx.font = '14px monospace';
  ctx.fillStyle = '#dfe6ff';
  ctx.fillText(`NIGHTFALL ESTATE`, 12, 21);

  // intel counter
  ctx.fillStyle = COLORS.intel;
  ctx.fillText(`INTEL ${game.player.intel}/${INTEL_TOTAL}`, 12, 41);

  // alarm stars
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < Math.round(game.alarm) ? '#ff4444' : '#3a2a2a';
    ctx.font = '16px monospace';
    ctx.fillText('\u25B2', 110 + i * 18, 24);
  }

  // detection eye meter
  const d = game.detection;
  ctx.fillStyle = '#000'; ctx.fillRect(180, 30, 160, 14);
  ctx.fillStyle = d > 0.6 ? '#ff4040' : d > 0.25 ? '#ffcc33' : '#396b45';
  ctx.fillRect(182, 32, 156 * d, 10);
  ctx.fillStyle = '#dfe6ff'; ctx.font = '11px monospace';
  ctx.fillText(d > 0.75 ? 'SPOTTED!' : d > 0.25 ? 'SUSPICIOUS' : 'UNSEEN', 348, 41);

  // objective line
  ctx.fillStyle = game.exitOpen ? COLORS.exit : '#9aa7c7';
  ctx.font = '13px monospace';
  ctx.fillText(game.exitOpen ? 'OBJECTIVE: reach the EXIT gate' : 'OBJECTIVE: gather 3 intel, stay unseen', 560, 21);
  ctx.fillStyle = '#8fa0c5'; ctx.font = '11px monospace';
  ctx.fillText('WASD move · SHIFT sneak · SPACE run · E whistle · R restart', 560, 41);

  // alarm banner
  if (game.alarm >= 1) {
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,40,40,${0.5 + Math.sin(game.time * 8) * 0.3})`;
    ctx.font = 'bold 18px monospace';
    ctx.fillText('ALARM — HIDE AND WAIT IT OUT', VIEW_W / 2, VIEW_H - 12);
    ctx.textAlign = 'left';
  }
}

function drawEndScreen(ctx, game, input) {
  ctx.fillStyle = 'rgba(2,4,10,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  const won = game.state === 'won';
  ctx.font = 'bold 44px monospace';
  ctx.fillStyle = won ? COLORS.exit : COLORS.guard;
  ctx.fillText(won ? 'CLEAN GETAWAY' : 'BUSTED', VIEW_W / 2, VIEW_H / 2 - 30);
  ctx.font = '15px monospace';
  ctx.fillStyle = '#dfe6ff';
  ctx.fillText(game.endReason, VIEW_W / 2, VIEW_H / 2 + 6);
  ctx.fillText(`intel ${game.player.intel}/${INTEL_TOTAL} · time ${game.time.toFixed(1)}s · alarm ${Math.round(game.alarm)}`, VIEW_W / 2, VIEW_H / 2 + 30);
  ctx.font = '13px monospace';
  ctx.fillStyle = '#8fa0c5';
  ctx.fillText('press R to try the estate again', VIEW_W / 2, VIEW_H / 2 + 60);
  ctx.textAlign = 'left';
}
