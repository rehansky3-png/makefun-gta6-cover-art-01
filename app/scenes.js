// Leonida Cover Maker — procedural scenes.
//
// Every scene is painted in code on a 2D canvas at whatever resolution the
// cover needs, so a 1920 x 1080 export is as sharp as the preview. No
// photograph, no Rockstar artwork: sun, palms, skyline and neon are all
// gradients, silhouettes and glow drawn here. Each painter takes the canvas
// context, the width and height to fill, and a seeded random function so a
// scene always looks the same at any size.

// Deterministic random: mulberry32, so a scene paints identically every run.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fill the canvas with a vertical sky gradient.
export function paintSky(ctx, w, h, stops) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of stops) sky.addColorStop(at, color);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
}

// A glowing sun disc: hot core, wide halo.
export function paintSun(ctx, x, y, r, core, halo) {
  const glow = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 3.2);
  glow.addColorStop(0, halo);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// A palm silhouette: curved trunk and a crown of drooping fronds.
export function paintPalm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk, slightly bowed.
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -52, 2, -104);
  ctx.stroke();
  // Crown of fronds.
  ctx.lineWidth = 5;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.08 - (i * Math.PI) / 7.4;
    const tipX = 2 + Math.cos(a) * 52;
    const tipY = -104 + Math.sin(a) * 34;
    const midX = 2 + Math.cos(a) * 30;
    const midY = -104 + Math.sin(a) * 8 - 12;
    ctx.beginPath();
    ctx.moveTo(2, -104);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(-3, -98, 4, 0, Math.PI * 2);
  ctx.arc(5, -96, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// A row of flat-roofed buildings with a few lit windows.
export function paintBuildingRow(ctx, w, baseY, count, minH, maxH, color, lit, rng) {
  let x = -w * 0.02;
  const slot = (w * 1.04) / count;
  for (let i = 0; i < count; i++) {
    const bw = slot * (0.62 + rng() * 0.34);
    const bh = minH + rng() * (maxH - minH);
    ctx.fillStyle = color;
    ctx.fillRect(x, baseY - bh, bw, bh);
    // Antenna on some roofs.
    if (rng() > 0.6) {
      ctx.fillRect(x + bw * 0.5, baseY - bh - 14, 2, 14);
      ctx.fillStyle = lit;
      ctx.beginPath();
      ctx.arc(x + bw * 0.5 + 1, baseY - bh - 16, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
    }
    // Lit windows: sparse and dim, so the facade reads as a building, not a
    // dot grid. A few windows glow warm, a rarer one cool.
    const cols = Math.max(1, Math.floor(bw / 30));
    const rows = Math.max(1, Math.floor(bh / 34));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rng() > 0.86) {
          ctx.fillStyle = rng() > 0.88 ? '#9fd8ff' : lit;
          ctx.globalAlpha = 0.7;
          ctx.fillRect(x + 8 + c * 30, baseY - bh + 11 + r * 34, 7, 10);
          ctx.globalAlpha = 1;
          ctx.fillStyle = color;
        }
      }
    }
    x += slot;
  }
}

// A shimmering column of light on water under the sun.
export function paintSunGlitter(ctx, x, y, w, h, color, rng) {
  ctx.save();
  for (let i = 0; i < 90; i++) {
    const yy = y + rng() * h;
    const spread = (yy - y) / h;
    const ww = (14 + rng() * 60) * (0.4 + spread);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.12 + rng() * 0.3 * (1 - spread * 0.6);
    ctx.fillRect(x - ww / 2 + (rng() - 0.5) * 30, yy, ww, 2 + rng() * 3);
  }
  ctx.restore();
}

// Thin horizontal fog bands.
export function paintFog(ctx, w, h, y0, y1, color, rng) {
  ctx.save();
  for (let i = 0; i < 7; i++) {
    const y = y0 + ((y1 - y0) * i) / 6 + rng() * 8;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.10 + rng() * 0.12;
    ctx.fillRect(0, y, w, 10 + rng() * 22);
  }
  ctx.restore();
}

// A neon sign: glowing rounded box with a word in it.
export function paintNeonSign(ctx, x, y, w, h, word, color, font) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.font = `${Math.round(h * 0.52)}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 14;
  ctx.fillText(word, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

// --- The six scenes -------------------------------------------------------

function paintBoulevardSunset(ctx, w, h, rng) {
  paintSky(ctx, w, h, [
    [0, '#2b1055'],
    [0.42, '#7597de'],
    [0.58, '#ff7e5f'],
    [0.78, '#feb47b'],
    [1, '#ffcf8a'],
  ]);
  paintSun(ctx, w * 0.5, h * 0.58, h * 0.085, '#fff3c4', 'rgba(255, 190, 90, 0.55)');
  // Far buildings.
  paintBuildingRow(ctx, w, h * 0.62, 9, h * 0.05, h * 0.14, '#3a1c5e', '#ffd28a', rng);
  // Road in perspective.
  ctx.fillStyle = '#241335';
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.62);
  ctx.lineTo(w * 0.58, h * 0.62);
  ctx.lineTo(w * 0.78, h);
  ctx.lineTo(w * 0.22, h);
  ctx.closePath();
  ctx.fill();
  // Centre dashes.
  ctx.fillStyle = '#ffd28a';
  for (let i = 0; i < 5; i++) {
    const t = i / 5;
    const y = h * (0.64 + t * 0.34);
    const dw = 2 + t * 10;
    ctx.globalAlpha = 0.9 - t * 0.4;
    ctx.fillRect(w * 0.5 - dw / 2, y, dw, 4 + t * 14);
  }
  ctx.globalAlpha = 1;
  // Palm-lined verges.
  for (let i = 0; i < 4; i++) {
    const t = i / 4;
    const s = (0.5 + t * 1.1) * (h / 620);
    paintPalm(ctx, w * (0.36 - t * 0.16), h * (0.66 + t * 0.32), s, -0.12, '#1d0b2e');
    paintPalm(ctx, w * (0.64 + t * 0.16), h * (0.66 + t * 0.32), s, 0.12, '#1d0b2e');
  }
}

function paintPierDusk(ctx, w, h, rng) {
  paintSky(ctx, w, h, [
    [0, '#0f2a43'],
    [0.4, '#2e6f8e'],
    [0.58, '#f2a65a'],
    [0.66, '#e07856'],
    [1, '#7a4a6b'],
  ]);
  paintSun(ctx, w * 0.68, h * 0.52, h * 0.07, '#ffe9b0', 'rgba(255, 180, 110, 0.5)');
  // Sea.
  const sea = ctx.createLinearGradient(0, h * 0.6, 0, h);
  sea.addColorStop(0, '#3f7d8c');
  sea.addColorStop(1, '#123240');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);
  paintSunGlitter(ctx, w * 0.68, h * 0.62, w, h * 0.36, '#ffcf8a', rng);
  // Distant skyline.
  paintBuildingRow(ctx, w, h * 0.6, 10, h * 0.03, h * 0.09, '#241a33', '#ffd28a', rng);
  // Wooden pier from bottom-left to the horizon.
  ctx.fillStyle = '#4a3220';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.34, h * 0.62);
  ctx.lineTo(w * 0.52, h * 0.62);
  ctx.lineTo(w * 0.3, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5d4028';
  for (let i = 0; i < 9; i++) {
    const t = i / 9;
    const y = h * (0.64 + t * 0.36);
    ctx.fillRect(w * (0.02 + t * 0.05), y, w * (0.44 - t * 0.1), 2 + t * 5);
  }
  // Pier posts.
  ctx.fillStyle = '#332216';
  for (let i = 0; i < 4; i++) {
    const t = i / 4;
    const x = w * (0.36 + t * 0.05);
    const y = h * (0.63 + t * 0.12);
    ctx.fillRect(x, y - 26 - t * 30, 5 + t * 7, 30 + t * 34);
  }
  // A lone palm at the pier head.
  paintPalm(ctx, w * 0.44, h * 0.62, (h / 620) * 0.9, 0.1, '#1d0b2e');
}

function paintSkylineNight(ctx, w, h, rng) {
  paintSky(ctx, w, h, [
    [0, '#050914'],
    [0.55, '#0d1b3a'],
    [0.8, '#274b7a'],
    [1, '#3a6ea5'],
  ]);
  // Stars.
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 90; i++) {
    ctx.globalAlpha = 0.25 + rng() * 0.65;
    ctx.fillRect(rng() * w, rng() * h * 0.4, 1.6, 1.6);
  }
  ctx.globalAlpha = 1;
  // Moon.
  paintSun(ctx, w * 0.82, h * 0.16, h * 0.045, '#f4f1de', 'rgba(220, 225, 255, 0.28)');
  // Back towers.
  paintBuildingRow(ctx, w, h * 0.78, 12, h * 0.16, h * 0.42, '#0a1230', '#ffd28a', rng);
  // Front towers, darker and taller.
  paintBuildingRow(ctx, w, h, 7, h * 0.24, h * 0.55, '#060a1c', '#9fd8ff', rng);
  // Neon signs on two front towers.
  paintNeonSign(ctx, w * 0.14, h * 0.52, w * 0.16, h * 0.055, 'VICE', '#ff2e88');
  paintNeonSign(ctx, w * 0.66, h * 0.44, w * 0.18, h * 0.055, 'LEONIDA', '#22d3ee');
}

function paintSwampDawn(ctx, w, h, rng) {
  paintSky(ctx, w, h, [
    [0, '#cfe8d8'],
    [0.45, '#9dc3a4'],
    [0.62, '#e8d9a0'],
    [1, '#5d7a68'],
  ]);
  paintSun(ctx, w * 0.5, h * 0.5, h * 0.06, '#fff8d6', 'rgba(255, 240, 180, 0.5)');
  // Still water.
  const water = ctx.createLinearGradient(0, h * 0.58, 0, h);
  water.addColorStop(0, '#8fae94');
  water.addColorStop(1, '#2e4a3a');
  ctx.fillStyle = water;
  ctx.fillRect(0, h * 0.58, w, h * 0.42);
  paintSunGlitter(ctx, w * 0.5, h * 0.6, w, h * 0.36, '#fff3c4', rng);
  // Cypress silhouettes with hanging moss.
  ctx.fillStyle = '#1e3327';
  for (let i = 0; i < 6; i++) {
    const x = w * (0.04 + i * 0.17 + rng() * 0.05);
    const top = h * (0.16 + rng() * 0.14);
    const base = h * 0.62;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.035, base);
    ctx.quadraticCurveTo(x - w * 0.02, top + h * 0.12, x, top);
    ctx.quadraticCurveTo(x + w * 0.02, top + h * 0.12, x + w * 0.035, base);
    ctx.closePath();
    ctx.fill();
    // Moss drips.
    ctx.strokeStyle = '#1e3327';
    ctx.lineWidth = 2;
    for (let m = 0; m < 5; m++) {
      const mx = x - w * 0.02 + rng() * w * 0.04;
      const my = top + h * (0.1 + rng() * 0.2);
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + 2, my + h * (0.04 + rng() * 0.05));
      ctx.stroke();
    }
  }
  paintFog(ctx, w, h, h * 0.42, h * 0.66, '#e8f0e4', rng);
}

function paintBeachDay(ctx, w, h, rng) {
  paintSky(ctx, w, h, [
    [0, '#3fa7d6'],
    [0.45, '#7ec8e3'],
    [0.62, '#ffe9a8'],
    [1, '#ffd98a'],
  ]);
  paintSun(ctx, w * 0.78, h * 0.2, h * 0.075, '#fffbe8', 'rgba(255, 245, 190, 0.5)');
  // Clouds.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 5; i++) {
    const cx = rng() * w;
    const cy = h * (0.08 + rng() * 0.22);
    const cw = w * (0.06 + rng() * 0.08);
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw, cw * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Sea.
  const sea = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.78);
  sea.addColorStop(0, '#2ec4b6');
  sea.addColorStop(1, '#0a7d8c');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.55, w, h * 0.23);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 26; i++) {
    const wx = rng() * w;
    const wy = h * (0.56 + rng() * 0.2);
    ctx.fillRect(wx, wy, 18 + rng() * 40, 2);
  }
  // Sand.
  const sand = ctx.createLinearGradient(0, h * 0.78, 0, h);
  sand.addColorStop(0, '#f4d58d');
  sand.addColorStop(1, '#d9a441');
  ctx.fillStyle = sand;
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
  // Leaning palm on the sand.
  paintPalm(ctx, w * 0.16, h * 0.98, (h / 620) * 1.25, -0.5, '#234d2c');
  // Beach umbrella.
  ctx.fillStyle = '#ff5d8f';
  ctx.beginPath();
  ctx.moveTo(w * 0.72, h * 0.86);
  ctx.quadraticCurveTo(w * 0.8, h * 0.76, w * 0.88, h * 0.86);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(w * 0.8, h * 0.86);
  ctx.quadraticCurveTo(w * 0.8, h * 0.76, w * 0.84, h * 0.86);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#7a4a21';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.8, h * 0.86);
  ctx.lineTo(w * 0.8, h);
  ctx.stroke();
}

function paintNeonStreet(ctx, w, h, rng) {
  paintSky(ctx, w, h, [
    [0, '#0b0618'],
    [0.6, '#160b2e'],
    [1, '#2b1150'],
  ]);
  // Wet street.
  const street = ctx.createLinearGradient(0, h * 0.6, 0, h);
  street.addColorStop(0, '#1a0f2e');
  street.addColorStop(1, '#0a0616');
  ctx.fillStyle = street;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);
  // Buildings left and right, warm lit windows.
  paintBuildingRow(ctx, w, h * 0.62, 6, h * 0.2, h * 0.45, '#0d0719', '#ffd28a', rng);
  // Neon signs.
  paintNeonSign(ctx, w * 0.06, h * 0.2, w * 0.2, h * 0.07, 'HOTEL', '#ff2e88');
  paintNeonSign(ctx, w * 0.3, h * 0.32, w * 0.16, h * 0.06, 'DINER', '#22d3ee');
  paintNeonSign(ctx, w * 0.72, h * 0.16, w * 0.22, h * 0.07, 'LEONIDA', '#facc15');
  paintNeonSign(ctx, w * 0.58, h * 0.38, w * 0.14, h * 0.05, 'BAR', '#a78bfa');
  // Neon reflections on the wet street: thin shimmer streaks, not blocks.
  ctx.save();
  for (const [x, color, ww] of [
    [w * 0.16, '#ff2e88', 26],
    [w * 0.38, '#22d3ee', 20],
    [w * 0.83, '#facc15', 30],
    [w * 0.62, '#a78bfa', 16],
  ]) {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.10 + rng() * 0.16;
      ctx.fillRect(x - ww / 2 + (rng() - 0.5) * 14, h * (0.64 + rng() * 0.3), ww * (0.4 + rng() * 0.6), 2 + rng() * 3);
    }
  }
  ctx.restore();
  // A low car silhouette with headlights.
  ctx.fillStyle = '#05030a';
  ctx.beginPath();
  ctx.moveTo(w * 0.34, h * 0.86);
  ctx.lineTo(w * 0.4, h * 0.76);
  ctx.lineTo(w * 0.62, h * 0.76);
  ctx.lineTo(w * 0.68, h * 0.86);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(w * 0.32, h * 0.84, w * 0.38, h * 0.05);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(w * 0.68, h * 0.87, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff2e55';
  ctx.beginPath();
  ctx.arc(w * 0.33, h * 0.87, 4, 0, Math.PI * 2);
  ctx.fill();
  // Palm silhouette against the signs.
  paintPalm(ctx, w * 0.52, h * 0.64, (h / 620) * 0.8, 0.08, '#05030a');
}

export const SCENES = [
  { id: 'boulevard', name: 'Boulevard Sunset', paint: paintBoulevardSunset, seed: 11 },
  { id: 'pier', name: 'Pier Dusk', paint: paintPierDusk, seed: 23 },
  { id: 'skyline', name: 'Skyline Night', paint: paintSkylineNight, seed: 37 },
  { id: 'swamp', name: 'Swamp Dawn', paint: paintSwampDawn, seed: 41 },
  { id: 'beach', name: 'Beach Day', paint: paintBeachDay, seed: 53 },
  { id: 'downtown', name: 'Neon Street', paint: paintNeonStreet, seed: 67 },
];

// Paint a scene by id onto ctx at w x h.
export function paintScene(ctx, sceneId, w, h) {
  const scene = SCENES.find((s) => s.id === sceneId) ?? SCENES[0];
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  scene.paint(ctx, w, h, seededRandom(scene.seed));
  ctx.restore();
}
