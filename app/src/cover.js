// cover.js — composes the cover: title band, multi-panel grid, caption band,
// colour grade. Panels are either a built-in drawn scene or a user photo
// (cover-fit, with zoom and pan). Everything is drawn in code.

import { drawScene, SCENES } from './art.js';

export const SIZES = {
  square: { label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  story: { label: 'Story · 1920 × 1080', w: 1920, h: 1080 },
};

export const GRADES = {
  sunset: { name: 'Sunset', top: 'rgba(255,122,61,0.10)', bottom: 'rgba(255,46,136,0.14)' },
  neon: { name: 'Neon Nights', top: 'rgba(55,230,255,0.13)', bottom: 'rgba(255,46,136,0.24)' },
  vice: { name: 'Vice Teal', top: 'rgba(25,184,196,0.15)', bottom: 'rgba(11,16,48,0.24)' },
  golden: { name: 'Golden Hour', top: 'rgba(255,214,106,0.15)', bottom: 'rgba(255,122,61,0.17)' },
};

export const PANEL_NAMES = ['Hero', 'Duo', 'Beach', 'Swamp', 'Neon', 'Flamingo'];
export const DEFAULT_SCENES = ['sunset', 'duo', 'beach', 'swamp', 'neon', 'flamingo'];

/** Fresh default state for a new cover. */
export function defaultState() {
  return {
    size: 'square',
    grade: 'sunset',
    caption: 'SUNSET HEIST',
    subtitle: 'LUCIA & JASON · LEONIDA',
    panels: DEFAULT_SCENES.map((scene) => ({
      source: 'scene', scene, photo: -1, zoom: 1, ox: 0, oy: 0,
    })),
  };
}

/** Panel rectangles for each size, in cover coordinates. */
export function layout(sizeKey, w, h) {
  const gap = Math.round(w * 0.011);
  const m = Math.round(w * 0.022);
  if (sizeKey === 'story') {
    const railW = Math.round(w * 0.27);
    const gx = railW + gap;
    const gw = w - gx - m;
    const gh = h - m * 2;
    const cw = (gw - gap) / 2;
    const heroH = Math.round(gh * 0.34);
    const rowH = Math.round((gh - heroH - gap * 2) / 3);
    const y0 = m;
    return {
      title: { x: m, y: m, w: railW - gap, h: gh, rail: true },
      panels: [
        { x: gx, y: y0, w: gw, h: heroH },
        { x: gx, y: y0 + heroH + gap, w: cw, h: rowH },
        { x: gx + cw + gap, y: y0 + heroH + gap, w: cw, h: rowH },
        { x: gx, y: y0 + heroH + gap * 2 + rowH, w: cw, h: rowH },
        { x: gx + cw + gap, y: y0 + heroH + gap * 2 + rowH, w: cw, h: rowH },
        { x: gx, y: y0 + heroH + gap * 3 + rowH * 2, w: gw, h: rowH },
      ],
      caption: { x: m, y: h - m - Math.round(h * 0.1), w: railW - gap, h: Math.round(h * 0.1), rail: true },
    };
  }
  // square + portrait: title band on top, grid, caption band at the foot
  const titleH = Math.round(h * (sizeKey === 'portrait' ? 0.15 : 0.155));
  const capH = Math.round(h * (sizeKey === 'portrait' ? 0.13 : 0.185));
  const gy = titleH + gap;
  const gh = h - gy - capH - gap;
  const gw = w - m * 2;
  const colW = (gw - gap * 3) / 4;
  const rowH = (gh - gap) / 2;
  const x0 = m;
  const heroW = colW * 2 + gap;
  const duoW = gw - heroW - gap;
  return {
    title: { x: 0, y: 0, w, h: titleH, rail: false },
    panels: [
      { x: x0, y: gy, w: heroW, h: rowH },
      { x: x0 + heroW + gap, y: gy, w: duoW, h: rowH },
      { x: x0, y: gy + rowH + gap, w: colW, h: rowH },
      { x: x0 + colW + gap, y: gy + rowH + gap, w: colW, h: rowH },
      { x: x0 + colW * 2 + gap * 2, y: gy + rowH + gap, w: colW, h: rowH },
      { x: x0 + colW * 3 + gap * 3, y: gy + rowH + gap, w: colW, h: rowH },
    ],
    caption: { x: 0, y: h - capH, w, h: capH, rail: false },
  };
}

/** Draws one panel: a scene, or a photo cover-fit with zoom + pan. */
function drawPanel(g, panel, rect, photos) {
  const { x, y, w, h } = rect;
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  if (panel.source === 'photo' && photos[panel.photo]) {
    const img = photos[panel.photo];
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * panel.zoom;
    const pw = img.naturalWidth * scale;
    const ph = img.naturalHeight * scale;
    g.drawImage(img, x + (w - pw) / 2 + panel.ox, y + (h - ph) / 2 + panel.oy, pw, ph);
  } else {
    drawScene(g, panel.scene, x, y, w, h);
  }
  // thin inner edge so panels read as a poster grid
  g.strokeStyle = 'rgba(255,255,255,0.28)';
  g.lineWidth = 1.5;
  g.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
  g.restore();
}

function fitFont(g, text, maxW, startSize, family, weight = '') {
  let size = startSize;
  g.font = `${weight} ${size}px ${family}`;
  while (g.measureText(text).width > maxW && size > 10) {
    size -= 2;
    g.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

const DISPLAY = '"Bebas Neue", "Arial Narrow", "Impact", sans-serif';

function drawTitle(g, rect, w, h) {
  const { x, y, w: tw, h: th, rail } = rect;
  // deep plum band with a neon hairline
  g.fillStyle = '#160a24';
  g.fillRect(x, y, tw, th);
  g.fillStyle = '#ff2e88';
  if (rail) g.fillRect(x + tw - 3, y, 3, th);
  else g.fillRect(x, y + th - 3, tw, 3);

  if (rail) {
    // stacked title down the rail
    const cx = x + tw / 2;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    let size = fitFont(g, 'GRAND THEFT', tw * 0.9, th * 0.085, DISPLAY);
    g.fillStyle = '#ffffff';
    g.fillText('GRAND THEFT', cx, y + th * 0.2);
    size = fitFont(g, 'AUTO', tw * 0.9, th * 0.085, DISPLAY);
    g.fillText('AUTO', cx, y + th * 0.2 + size * 1.05);
    // giant VI
    const vi = g.createLinearGradient(cx - 60, 0, cx + 60, 0);
    vi.addColorStop(0, '#ffd76a');
    vi.addColorStop(0.5, '#ff5e7a');
    vi.addColorStop(1, '#ff2e88');
    g.fillStyle = vi;
    g.font = `${Math.round(th * 0.22)}px ${DISPLAY}`;
    g.fillText('VI', cx, y + th * 0.56);
    g.fillStyle = '#37e6ff';
    g.save();
    g.shadowColor = '#37e6ff';
    g.shadowBlur = 16;
    g.font = `${Math.round(th * 0.045)}px ${DISPLAY}`;
    try { g.letterSpacing = '6px'; } catch { /* older canvas */ }
    g.fillText('L E O N I D A', cx, y + th * 0.74);
    g.restore();
    return;
  }
  // horizontal title band
  const cy = y + th * 0.44;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  const pad = w * 0.024;
  const line = 'GRAND THEFT AUTO';
  let size = fitFont(g, line, w * 0.62, th * 0.52, DISPLAY);
  g.save();
  g.shadowColor = 'rgba(255,46,136,0.8)';
  g.shadowBlur = th * 0.12;
  g.fillStyle = '#ffffff';
  g.fillText(line, pad, cy);
  g.restore();
  // giant VI on the right
  const vi = g.createLinearGradient(w * 0.72, 0, w * 0.98, 0);
  vi.addColorStop(0, '#ffd76a');
  vi.addColorStop(0.55, '#ff5e7a');
  vi.addColorStop(1, '#ff2e88');
  g.fillStyle = vi;
  g.textAlign = 'right';
  g.font = `${Math.round(th * 0.94)}px ${DISPLAY}`;
  g.fillText('VI', w - pad, y + th * 0.52);
  // LEONIDA tagline under the title
  g.textAlign = 'left';
  g.fillStyle = '#37e6ff';
  g.save();
  g.shadowColor = '#37e6ff';
  g.shadowBlur = 10;
  const tagSize = Math.round(th * 0.2);
  g.font = `${tagSize}px ${DISPLAY}`;
  try { g.letterSpacing = '8px'; } catch { /* older canvas */ }
  g.fillText('L E O N I D A', pad, y + th * 0.84);
  g.restore();
  try { g.letterSpacing = '0px'; } catch { /* older canvas */ }
}

function drawCaption(g, rect, caption, subtitle, w) {
  const { x, y, w: cw, h: ch, rail } = rect;
  g.fillStyle = '#160a24';
  g.fillRect(x, y, cw, ch);
  g.fillStyle = '#ff2e88';
  if (rail) g.fillRect(x, y, cw, 3);
  else g.fillRect(x, y, cw, 3);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const text = (caption.trim() || 'UNTITLED').toUpperCase();
  if (rail) {
    const size = fitFont(g, text, cw * 0.92, ch * 0.42, DISPLAY);
    g.fillStyle = '#ffffff';
    g.fillText(text, x + cw / 2, y + ch * 0.34);
    g.fillStyle = '#ffd76a';
    g.font = `${Math.round(ch * 0.16)}px ${DISPLAY}`;
    try { g.letterSpacing = '3px'; } catch { /* older canvas */ }
    g.fillText((subtitle || '').toUpperCase(), x + cw / 2, y + ch * 0.72);
    try { g.letterSpacing = '0px'; } catch { /* older canvas */ }
    return;
  }
  const size = fitFont(g, text, w * 0.86, ch * 0.52, DISPLAY);
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.6)';
  g.shadowBlur = size * 0.12;
  g.shadowOffsetY = size * 0.05;
  g.lineWidth = Math.max(2, size * 0.06);
  g.strokeStyle = '#ff2e88';
  g.strokeText(text, w / 2, y + ch * 0.38);
  g.fillStyle = '#ffffff';
  g.fillText(text, w / 2, y + ch * 0.38);
  g.restore();
  if (subtitle && subtitle.trim()) {
    g.fillStyle = '#ffd76a';
    const subSize = Math.round(ch * 0.17);
    g.font = `${subSize}px ${DISPLAY}`;
    try { g.letterSpacing = '4px'; } catch { /* older canvas */ }
    g.fillText(subtitle.trim().toUpperCase(), w / 2, y + ch * 0.78);
    try { g.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}

/**
 * Draws the whole cover onto `canvas` (sized by state.size) from `state`
 * and the loaded `photos` (array of HTMLImageElement).
 */
export function drawCover(canvas, state, photos) {
  const size = SIZES[state.size] || SIZES.square;
  if (canvas.width !== size.w) canvas.width = size.w;
  if (canvas.height !== size.h) canvas.height = size.h;
  const g = canvas.getContext('2d');
  const { w, h } = size;
  g.fillStyle = '#160a24';
  g.fillRect(0, 0, w, h);

  const lay = layout(state.size, w, h);
  state.panels.forEach((panel, i) => drawPanel(g, panel, lay.panels[i], photos));
  drawTitle(g, lay.title, w, h);
  drawCaption(g, lay.caption, state.caption, state.subtitle, w);

  // colour grade over everything, then a vignette
  const grade = GRADES[state.grade] || GRADES.sunset;
  const tint = g.createLinearGradient(0, 0, 0, h);
  tint.addColorStop(0, grade.top);
  tint.addColorStop(1, grade.bottom);
  g.fillStyle = tint;
  g.fillRect(0, 0, w, h);
  const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,2,20,0.34)');
  g.fillStyle = vg;
  g.fillRect(0, 0, w, h);
  return lay;
}

export { SCENES };
