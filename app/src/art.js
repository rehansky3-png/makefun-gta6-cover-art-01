// art.js — every picture in this app is drawn here, in code, from shapes and
// gradients. No photo, no Rockstar asset, no downloaded image. Each scene paints
// into the rectangle (x, y, w, h) on the given 2D context. All randomness is
// seeded, so the same scene always draws the same way.

/** Deterministic pseudo-random generator (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lin(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}

function clipRect(g, x, y, w, h, fn) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  fn();
  g.restore();
}

/** A palm tree silhouette. (x, y) is the base, s the height, lean the top drift. */
export function palm(g, x, y, s, lean, color, flip = 1) {
  g.save();
  g.translate(x, y);
  g.scale(flip, 1);
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineCap = 'round';
  // trunk
  g.lineWidth = Math.max(2, s * 0.055);
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(s * 0.06, -s * 0.55, lean * s, -s * 0.94);
  g.stroke();
  const cx = lean * s;
  const cy = -s * 0.94;
  // fronds: long drooping arcs from the crown
  g.lineWidth = Math.max(1.5, s * 0.035);
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.08) - (i * Math.PI) / 8.2; // fan from up-left to down-right
    const len = s * (0.42 + (i % 3) * 0.05);
    const ex = cx + Math.cos(a) * len;
    const ey = cy + Math.sin(a) * len * 0.55 + s * 0.16;
    g.beginPath();
    g.moveTo(cx, cy);
    g.quadraticCurveTo(cx + Math.cos(a) * len * 0.5, cy - s * 0.1, ex, ey);
    g.stroke();
  }
  // coconuts
  g.beginPath();
  g.arc(cx - s * 0.03, cy + s * 0.03, s * 0.035, 0, Math.PI * 2);
  g.arc(cx + s * 0.04, cy + s * 0.04, s * 0.03, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** A retro sun: a gradient disc with horizontal slits cut across its lower half. */
function retroSun(g, cx, cy, r, skyGrad) {
  const sun = g.createRadialGradient(cx, cy - r * 0.3, r * 0.1, cx, cy, r);
  sun.addColorStop(0, '#ffe98a');
  sun.addColorStop(0.55, '#ffb347');
  sun.addColorStop(1, '#ff5e62');
  g.fillStyle = sun;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  // slits show the sky behind: fill the bars with the same sky gradient
  g.fillStyle = skyGrad;
  let y = cy + r * 0.08;
  let h = r * 0.07;
  while (y < cy + r) {
    g.fillRect(cx - r - 2, y, r * 2 + 4, h);
    y += h + r * 0.16;
    h *= 1.35;
  }
}

/** A dark skyline with a few lit windows. */
function skyline(g, x, yBase, w, h, color, seed, lit = '#ffd76a') {
  const R = rng(seed);
  g.fillStyle = color;
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.05 + R() * 0.09);
    const bh = h * (0.35 + R() * 0.65);
    g.fillRect(bx, yBase - bh, bw, bh);
    // antenna on some towers
    if (R() < 0.3) {
      g.fillRect(bx + bw / 2 - 1, yBase - bh - h * 0.12, 2, h * 0.12);
    }
    // lit windows
    g.fillStyle = lit;
    const cols = Math.max(1, Math.floor(bw / 14));
    const rows = Math.max(1, Math.floor(bh / 16));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (R() < 0.16) {
          g.globalAlpha = 0.5 + R() * 0.5;
          g.fillRect(bx + 4 + c * 14, yBase - bh + 6 + r * 16, 5, 7);
        }
      }
    }
    g.globalAlpha = 1;
    g.fillStyle = color;
    bx += bw + w * 0.012;
  }
}

function birds(g, x, y, s, color, seed) {
  const R = rng(seed);
  g.strokeStyle = color;
  g.lineWidth = Math.max(1.5, s * 0.06);
  g.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const bx = x + R() * s * 3;
    const by = y + R() * s * 0.8;
    const w = s * (0.5 + R() * 0.3);
    g.beginPath();
    g.moveTo(bx - w / 2, by);
    g.quadraticCurveTo(bx - w * 0.15, by - s * 0.28, bx, by);
    g.quadraticCurveTo(bx + w * 0.15, by - s * 0.28, bx + w / 2, by);
    g.stroke();
  }
}

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

function sceneSunset(g, x, y, w, h) {
  clipRect(g, x, y, w, h, () => {
    const sky = lin(g, x, y, x, y + h, [
      [0, '#2b1055'], [0.42, '#7b2d8b'], [0.68, '#ff5e7a'], [1, '#ff9a3d'],
    ]);
    g.fillStyle = sky;
    g.fillRect(x, y, w, h);
    retroSun(g, x + w * 0.66, y + h * 0.6, h * 0.27, sky);
    birds(g, x + w * 0.08, y + h * 0.12, h * 0.05, 'rgba(30,10,50,0.85)', 7);
    // water with a sun reflection
    const waterY = y + h * 0.78;
    g.fillStyle = lin(g, x, waterY, x, y + h, [[0, '#ff7a3d'], [1, '#4a1560']]);
    g.fillRect(x, waterY, w, y + h - waterY);
    const R = rng(21);
    g.fillStyle = 'rgba(255, 214, 120, 0.75)';
    for (let i = 0; i < 26; i++) {
      const ry = waterY + 4 + R() * (y + h - waterY - 8);
      const rw = (10 + R() * 46) * (1 - (ry - waterY) / (y + h - waterY));
      const rx = x + w * 0.66 + (R() - 0.5) * w * 0.3;
      g.globalAlpha = 0.25 + R() * 0.55;
      g.fillRect(rx - rw / 2, ry, rw, 2.5);
    }
    g.globalAlpha = 1;
    // skyline
    skyline(g, x, waterY, w, h * 0.34, '#1d0b33', 99);
    // palms left and right
    palm(g, x + w * 0.06, waterY + 2, h * 0.42, 0.16, '#160a24');
    palm(g, x + w * 0.95, waterY + 2, h * 0.34, -0.14, '#160a24', -1);
  });
}

function sceneDuo(g, x, y, w, h) {
  clipRect(g, x, y, w, h, () => {
    g.fillStyle = lin(g, x, y, x, y + h, [[0, '#12002e'], [0.5, '#5b1a6e'], [1, '#ff2e88']]);
    g.fillRect(x, y, w, h);
    // bokeh city lights
    const R = rng(31);
    for (let i = 0; i < 26; i++) {
      const bx = x + R() * w;
      const by = y + h * 0.45 + R() * h * 0.5;
      const br = 3 + R() * 14;
      const col = ['#ffd76a', '#ff5e9c', '#37e6ff', '#ff8a3d'][Math.floor(R() * 4)];
      const rg = g.createRadialGradient(bx, by, 0, bx, by, br);
      rg.addColorStop(0, col);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = 0.25 + R() * 0.45;
      g.fillStyle = rg;
      g.beginPath();
      g.arc(bx, by, br, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    // ground shadow
    g.fillStyle = 'rgba(10,2,24,0.55)';
    g.beginPath();
    g.ellipse(x + w * 0.5, y + h * 0.94, w * 0.34, h * 0.045, 0, 0, Math.PI * 2);
    g.fill();

    const cx = x + w * 0.5;
    const base = y + h * 0.94;
    const H = h * 0.78; // figure height
    const s = H / 100; // unit
    const ink = '#150822';

    // rim light: pink copy offset left, dark copy on top
    function figures(dx, dy, fill) {
      g.fillStyle = fill;
      g.strokeStyle = fill;
      // ---- Lucia (left, long hair, hand on hip) ----
      g.save();
      g.translate(cx - 13 * s + dx, base + dy);
      g.scale(s, s);
      // hair: a flowing sheet down her back, narrower than the body
      g.beginPath();
      g.moveTo(-12, -97);
      g.bezierCurveTo(-22, -92, -23, -66, -19, -44);
      g.bezierCurveTo(-17, -34, -14, -28, -11, -26);
      g.lineTo(-8, -40);
      g.bezierCurveTo(-10, -60, -8, -82, -4, -96);
      g.closePath();
      g.fill();
      // head
      g.beginPath();
      g.arc(-5, -89, 8, 0, Math.PI * 2);
      g.fill();
      // torso / jacket, with a waist
      g.beginPath();
      g.moveTo(-13, -78);
      g.bezierCurveTo(-15, -64, -12, -52, -10, -44);
      g.lineTo(-9, -38);
      g.lineTo(1, -38);
      g.bezierCurveTo(2, -52, 1, -66, -2, -78);
      g.closePath();
      g.fill();
      // left arm akimbo: a bent stroke with a gap at the hip
      g.lineWidth = 4.5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-12, -76);
      g.bezierCurveTo(-22, -68, -24, -56, -17, -47);
      g.stroke();
      // right arm hanging
      g.beginPath();
      g.moveTo(0, -76);
      g.bezierCurveTo(4, -64, 4, -52, 2, -40);
      g.stroke();
      // legs, slightly apart
      g.beginPath();
      g.moveTo(-10, -38);
      g.lineTo(-13, 0);
      g.lineTo(-7, 0);
      g.lineTo(-5, -36);
      g.closePath();
      g.fill();
      g.beginPath();
      g.moveTo(-3, -38);
      g.lineTo(-1, 0);
      g.lineTo(5, 0);
      g.lineTo(3, -38);
      g.closePath();
      g.fill();
      g.restore();

      // ---- Jason (right, cap, broad shoulders) ----
      g.save();
      g.translate(cx + 12 * s + dx, base + dy);
      g.scale(s, s);
      // head + cap with a brim
      g.beginPath();
      g.arc(6, -89, 8, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(-3, -91);
      g.arc(6, -91, 8.5, Math.PI, 0);
      g.lineTo(16, -91);
      g.lineTo(19, -88);
      g.lineTo(-3, -88);
      g.closePath();
      g.fill();
      // torso, broad shoulders
      g.beginPath();
      g.moveTo(-6, -80);
      g.bezierCurveTo(-9, -62, -8, -48, -6, -38);
      g.lineTo(17, -38);
      g.bezierCurveTo(19, -52, 19, -66, 15, -80);
      g.closePath();
      g.fill();
      // arms hanging, clear of the torso
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-5, -78);
      g.bezierCurveTo(-12, -66, -12, -52, -9, -40);
      g.stroke();
      g.beginPath();
      g.moveTo(15, -78);
      g.bezierCurveTo(22, -66, 22, -52, 19, -40);
      g.stroke();
      // legs in a stance
      g.beginPath();
      g.moveTo(-6, -38);
      g.lineTo(-9, 0);
      g.lineTo(-2, 0);
      g.lineTo(0, -36);
      g.closePath();
      g.fill();
      g.beginPath();
      g.moveTo(7, -38);
      g.lineTo(9, 0);
      g.lineTo(16, 0);
      g.lineTo(14, -38);
      g.closePath();
      g.fill();
      g.restore();
    }
    figures(-2.5, 0, 'rgba(255, 94, 156, 0.9)');
    figures(0, 0, ink);
    // palm edge, right
    palm(g, x + w * 0.96, y + h * 0.99, h * 0.3, -0.2, 'rgba(18,4,32,0.9)', -1);
  });
}

function sceneBeach(g, x, y, w, h) {
  clipRect(g, x, y, w, h, () => {
    g.fillStyle = lin(g, x, y, x, y + h, [[0, '#bfe9ff'], [0.5, '#ffe3b3'], [1, '#ffd194']]);
    g.fillRect(x, y, w, h);
    // sun
    g.fillStyle = '#fff3c4';
    g.beginPath();
    g.arc(x + w * 0.74, y + h * 0.2, h * 0.11, 0, Math.PI * 2);
    g.fill();
    // sea
    const seaY = y + h * 0.46;
    g.fillStyle = lin(g, x, seaY, x, y + h * 0.68, [[0, '#19b8c4'], [1, '#0a7f9e']]);
    g.fillRect(x, seaY, w, h * 0.22);
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = 2;
    const R = rng(41);
    for (let i = 0; i < 8; i++) {
      const wy = seaY + 6 + R() * h * 0.16;
      g.beginPath();
      g.moveTo(x + R() * w * 0.5, wy);
      g.quadraticCurveTo(x + w * 0.5, wy - 3, x + w * (0.5 + R() * 0.5), wy);
      g.stroke();
    }
    // sand
    g.fillStyle = lin(g, x, y + h * 0.66, x, y + h, [[0, '#f7d9a0'], [1, '#e8b96f']]);
    g.fillRect(x, y + h * 0.66, w, h * 0.34);
    // umbrella
    const ux = x + w * 0.3;
    const uy = y + h * 0.72;
    g.strokeStyle = '#7a4a21';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(ux, uy);
    g.lineTo(ux, uy - h * 0.22);
    g.stroke();
    for (let i = 0; i < 6; i++) {
      g.fillStyle = i % 2 ? '#fff' : '#ff5e7a';
      g.beginPath();
      g.moveTo(ux, uy - h * 0.22);
      const a0 = Math.PI + (i * Math.PI) / 6;
      const a1 = Math.PI + ((i + 1) * Math.PI) / 6;
      g.arc(ux, uy - h * 0.22, Math.min(w * 0.21, h * 0.28), a0, a1);
      g.closePath();
      g.fill();
    }
    // pier posts on the horizon
    g.fillStyle = 'rgba(90,50,30,0.8)';
    for (let i = 0; i < 5; i++) g.fillRect(x + w * 0.62 + i * 10, seaY - 8, 4, 12);
    g.fillRect(x + w * 0.6, seaY - 10, 58, 4);
    // starfish on the sand
    const sx = x + w * 0.82;
    const sy2 = y + h * 0.84;
    g.fillStyle = '#ff8a5c';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 5 : 12;
      const px = sx + Math.cos(a) * r;
      const py = sy2 + Math.sin(a) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
  });
}

function sceneSwamp(g, x, y, w, h) {
  clipRect(g, x, y, w, h, () => {
    g.fillStyle = lin(g, x, y, x, y + h, [[0, '#0f3d3a'], [0.55, '#1f6f5c'], [1, '#0a2e2b']]);
    g.fillRect(x, y, w, h);
    // low sun glow
    const glow = g.createRadialGradient(x + w * 0.7, y + h * 0.42, 0, x + w * 0.7, y + h * 0.42, h * 0.5);
    glow.addColorStop(0, 'rgba(255, 214, 140, 0.5)');
    glow.addColorStop(1, 'rgba(255, 214, 140, 0)');
    g.fillStyle = glow;
    g.fillRect(x, y, w, h);
    // mist bands
    g.fillStyle = 'rgba(220, 240, 230, 0.10)';
    g.fillRect(x, y + h * 0.34, w, h * 0.06);
    g.fillRect(x, y + h * 0.52, w, h * 0.05);
    // water
    const wy = y + h * 0.62;
    g.fillStyle = '#082622';
    g.fillRect(x, wy, w, y + h - wy);
    g.strokeStyle = 'rgba(120, 220, 190, 0.35)';
    g.lineWidth = 1.5;
    const R = rng(55);
    for (let i = 0; i < 10; i++) {
      const ry = wy + 4 + R() * (y + h - wy - 8);
      g.beginPath();
      g.moveTo(x + R() * w * 0.6, ry);
      g.lineTo(x + w * (0.4 + R() * 0.6), ry);
      g.stroke();
    }
    // cypress trees: curved trunks, ragged canopies, hanging moss
    function cypress(tx, th, lean) {
      g.strokeStyle = '#04120f';
      g.fillStyle = '#04120f';
      g.lineWidth = th * 0.055;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(tx, wy + 4);
      g.quadraticCurveTo(tx + lean * 0.4, wy - th * 0.5, tx + lean, wy - th * 0.92);
      g.stroke();
      // a low branch
      g.lineWidth = th * 0.03;
      g.beginPath();
      g.moveTo(tx + lean * 0.3, wy - th * 0.55);
      g.quadraticCurveTo(tx + lean * 0.9, wy - th * 0.62, tx + lean * 1.5, wy - th * 0.58);
      g.stroke();
      // ragged canopy: overlapping blobs
      const cxp = tx + lean;
      const cyp = wy - th * 0.98;
      for (const [ox, oy, rx, ry] of [[-0.16, 0, 0.2, 0.1], [0, -0.05, 0.24, 0.12], [0.17, 0.01, 0.18, 0.09], [-0.04, 0.06, 0.16, 0.08]]) {
        g.beginPath();
        g.ellipse(cxp + ox * th, cyp + oy * th, rx * th, ry * th, 0, 0, Math.PI * 2);
        g.fill();
      }
      // hanging moss: long pale strands
      g.strokeStyle = 'rgba(150, 210, 160, 0.65)';
      g.lineWidth = 1.4;
      for (let i = 0; i < 7; i++) {
        const mx = cxp - th * 0.2 + i * th * 0.065;
        g.beginPath();
        g.moveTo(mx, cyp + th * 0.02);
        g.quadraticCurveTo(mx + 3, cyp + th * 0.14, mx - 2, cyp + th * 0.26);
        g.stroke();
      }
    }
    cypress(x + w * 0.14, h * 0.5, 8);
    cypress(x + w * 0.86, h * 0.58, -10);
    cypress(x + w * 0.5, h * 0.38, 4);
    // airboat silhouette, bigger
    const ax = x + w * 0.36;
    const ay = wy + (y + h - wy) * 0.38;
    g.fillStyle = '#020d0b';
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(ax + w * 0.36, ay);
    g.lineTo(ax + w * 0.32, ay + 12);
    g.lineTo(ax + w * 0.04, ay + 12);
    g.closePath();
    g.fill();
    // seat
    g.fillRect(ax + w * 0.1, ay - 10, w * 0.07, 10);
    g.strokeStyle = '#020d0b';
    g.lineWidth = 3.5;
    g.beginPath();
    g.arc(ax + w * 0.24, ay - 16, 16, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.moveTo(ax + w * 0.24, ay - 32);
    g.lineTo(ax + w * 0.24, ay + 1);
    g.moveTo(ax + w * 0.24 - 15, ay - 16);
    g.lineTo(ax + w * 0.24 + 15, ay - 16);
    g.stroke();
    // heron
    g.strokeStyle = '#020d0b';
    g.fillStyle = '#020d0b';
    g.lineWidth = 2;
    const hx = x + w * 0.78;
    const hy = wy + (y + h - wy) * 0.55;
    g.beginPath();
    g.ellipse(hx, hy, 9, 5, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(hx + 6, hy - 3);
    g.quadraticCurveTo(hx + 12, hy - 14, hx + 9, hy - 18);
    g.stroke();
    g.beginPath();
    g.moveTo(hx - 6, hy + 4);
    g.lineTo(hx - 7, hy + 16);
    g.moveTo(hx - 1, hy + 4);
    g.lineTo(hx, hy + 16);
    g.stroke();
  });
}

function sceneNeon(g, x, y, w, h) {
  clipRect(g, x, y, w, h, () => {
    g.fillStyle = lin(g, x, y, x, y + h, [[0, '#0b1030'], [0.6, '#1b0f3d'], [1, '#2a0a3d']]);
    g.fillRect(x, y, w, h);
    // buildings
    g.fillStyle = '#07081c';
    g.fillRect(x, y + h * 0.08, w * 0.2, h * 0.5);
    g.fillRect(x + w * 0.82, y + h * 0.04, w * 0.18, h * 0.54);
    // neon signs
    function sign(sx, sy, sw, sh, text, color) {
      g.save();
      g.shadowColor = color;
      g.shadowBlur = 18;
      g.strokeStyle = color;
      g.lineWidth = 2.5;
      g.strokeRect(sx, sy, sw, sh);
      g.fillStyle = color;
      let fs = Math.floor(sh * 0.52);
      g.font = `${fs}px "Bebas Neue", "Arial Narrow", sans-serif`;
      while (g.measureText(text).width > sw * 0.86 && fs > 8) {
        fs -= 1;
        g.font = `${fs}px "Bebas Neue", "Arial Narrow", sans-serif`;
      }
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(text, sx + sw / 2, sy + sh / 2 + 1);
      g.restore();
    }
    sign(x + w * 0.05, y + h * 0.12, w * 0.3, h * 0.2, 'VICE', '#ff2e88');
    sign(x + w * 0.62, y + h * 0.08, w * 0.32, h * 0.2, 'LEONIDA', '#37e6ff');
    sign(x + w * 0.4, y + h * 0.34, w * 0.2, h * 0.18, '24 HR', '#ffd76a');
    // wet street
    const sy = y + h * 0.58;
    g.fillStyle = '#0a0a18';
    g.fillRect(x, sy, w, y + h - sy);
    const R = rng(77);
    const cols = ['#ff2e88', '#37e6ff', '#ffd76a'];
    for (let i = 0; i < 14; i++) {
      const rx = x + R() * w;
      const rw = 3 + R() * 8;
      const rh = (y + h - sy) * (0.4 + R() * 0.6);
      const gr = g.createLinearGradient(0, sy, 0, y + h);
      const c = cols[Math.floor(R() * 3)];
      gr.addColorStop(0, c);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = 0.35 + R() * 0.4;
      g.fillStyle = gr;
      g.fillRect(rx, sy, rw, rh);
    }
    g.globalAlpha = 1;
    // sports car silhouette — low, long, with a glass cabin and neon underglow
    const cx = x + w * 0.5;
    const cy = sy + (y + h - sy) * 0.38;
    const cw = w * 0.74;
    const chh = h * 0.17;
    // underglow
    g.save();
    g.shadowColor = '#ff2e88';
    g.shadowBlur = 18;
    g.fillStyle = '#ff2e88';
    g.fillRect(cx - cw * 0.42, cy + 6, cw * 0.84, 3);
    g.restore();
    g.fillStyle = '#05050f';
    g.beginPath();
    g.moveTo(cx - cw / 2, cy);
    g.lineTo(cx - cw * 0.36, cy - chh * 0.3);
    g.lineTo(cx - cw * 0.14, cy - chh);
    g.lineTo(cx + cw * 0.2, cy - chh * 0.94);
    g.lineTo(cx + cw * 0.4, cy - chh * 0.28);
    g.lineTo(cx + cw / 2, cy);
    g.closePath();
    g.fill();
    // cabin glass
    g.fillStyle = '#1b2a52';
    g.beginPath();
    g.moveTo(cx - cw * 0.12, cy - chh * 0.86);
    g.lineTo(cx + cw * 0.18, cy - chh * 0.82);
    g.lineTo(cx + cw * 0.3, cy - chh * 0.32);
    g.lineTo(cx - cw * 0.26, cy - chh * 0.32);
    g.closePath();
    g.fill();
    g.fillStyle = '#05050f';
    g.fillRect(cx - cw / 2, cy - 2, cw, 7);
    g.beginPath();
    g.arc(cx - cw * 0.3, cy + 5, chh * 0.26, 0, Math.PI * 2);
    g.arc(cx + cw * 0.3, cy + 5, chh * 0.26, 0, Math.PI * 2);
    g.fill();
    // headlights
    g.save();
    g.shadowColor = '#ffe98a';
    g.shadowBlur = 18;
    g.fillStyle = '#fff3c4';
    g.beginPath();
    g.arc(cx + cw * 0.47, cy - chh * 0.26, 4.5, 0, Math.PI * 2);
    g.fill();
    g.restore();
    palm(g, x + w * 0.94, sy + 2, h * 0.3, -0.16, '#05050f', -1);
  });
}

function sceneFlamingo(g, x, y, w, h) {
  clipRect(g, x, y, w, h, () => {
    g.fillStyle = lin(g, x, y, x, y + h, [[0, '#ffb3c8'], [0.5, '#c77dff'], [1, '#5b2a86']]);
    g.fillRect(x, y, w, h);
    // low sun
    g.fillStyle = 'rgba(255, 240, 200, 0.9)';
    g.beginPath();
    g.arc(x + w * 0.68, y + h * 0.42, h * 0.09, 0, Math.PI * 2);
    g.fill();
    // water
    const wy = y + h * 0.58;
    g.fillStyle = lin(g, x, wy, x, y + h, [[0, '#8a3a9e'], [1, '#2b1055']]);
    g.fillRect(x, wy, w, y + h - wy);
    g.fillStyle = 'rgba(255, 179, 200, 0.5)';
    const R = rng(91);
    for (let i = 0; i < 12; i++) {
      g.globalAlpha = 0.2 + R() * 0.4;
      g.fillRect(x + R() * w, wy + 4 + R() * (y + h - wy - 8), 14 + R() * 30, 2);
    }
    g.globalAlpha = 1;
    // flamingo
    const fx = x + w * 0.46;
    const fy = wy - h * 0.02;
    const fs = h / 100;
    g.save();
    g.translate(fx, fy);
    g.scale(fs, fs);
    g.fillStyle = '#2a0a33';
    g.strokeStyle = '#2a0a33';
    // legs (one straight, one bent)
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(-2, 8);
    g.lineTo(-3, 42);
    g.moveTo(4, 8);
    g.lineTo(10, 26);
    g.lineTo(4, 42);
    g.stroke();
    // body
    g.beginPath();
    g.ellipse(0, 0, 20, 12, -0.15, 0, Math.PI * 2);
    g.fill();
    // wing
    g.beginPath();
    g.ellipse(-3, -2, 13, 7, -0.3, 0, Math.PI * 2);
    g.fillStyle = '#1c0626';
    g.fill();
    g.fillStyle = '#2a0a33';
    // neck: a slim S-curve
    g.lineWidth = 4;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(13, -8);
    g.bezierCurveTo(24, -20, 26, -32, 20, -42);
    g.bezierCurveTo(17, -47, 12, -47, 10, -44);
    g.stroke();
    // head + beak
    g.beginPath();
    g.arc(10, -46, 5, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(14, -47);
    g.lineTo(23, -44);
    g.lineTo(14, -42);
    g.closePath();
    g.fill();
    g.restore();
    // reflection: a soft vertical streak under the legs
    g.save();
    g.globalAlpha = 0.18;
    g.fillStyle = '#2a0a33';
    g.fillRect(fx - 3, fy + h * 0.3, 6, h * 0.14);
    g.restore();
    // framing fronds
    palm(g, x + w * 0.02, y + h * 0.06, h * 0.34, 0.3, 'rgba(30,8,46,0.9)');
    palm(g, x + w * 0.98, y + h * 0.04, h * 0.3, -0.3, 'rgba(30,8,46,0.9)', -1);
  });
}

/** All scenes by key, with a display name for the editor. */
export const SCENES = {
  sunset: { name: 'Sunset Skyline', draw: sceneSunset },
  duo: { name: 'Lucia & Jason', draw: sceneDuo },
  beach: { name: 'Vice Beach', draw: sceneBeach },
  swamp: { name: 'Leonida Swamps', draw: sceneSwamp },
  neon: { name: 'Neon Street', draw: sceneNeon },
  flamingo: { name: 'Flamingo Dusk', draw: sceneFlamingo },
};

/** Draws one scene into a rectangle. */
export function drawScene(g, key, x, y, w, h) {
  const s = SCENES[key] || SCENES.sunset;
  s.draw(g, x, y, w, h);
}
