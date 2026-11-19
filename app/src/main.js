// main.js — wires the editor: photos, panels, caption, grade, size, export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, defaultState, layout, SIZES, GRADES, PANEL_NAMES, DEFAULT_SCENES } from './cover.js';
import { SCENES } from './art.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const panelList = document.getElementById('panel-list');
const sceneSelect = document.getElementById('scene');
const sourceRadios = [...document.querySelectorAll('input[name="source"]')];
const photoRow = document.getElementById('photo-row');
const zoom = document.getElementById('zoom');

const state = defaultState();
const photos = [];
let selected = 0;
let currentLayout = null;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  currentLayout = drawCover(canvas, state, photos);
  if (!new URLSearchParams(location.search).has('shot')) highlightSelected();
}

function highlightSelected() {
  if (!currentLayout) return;
  const r = currentLayout.panels[selected];
  const g = canvas.getContext('2d');
  g.save();
  g.strokeStyle = '#37e6ff';
  g.lineWidth = 4;
  g.setLineDash([14, 8]);
  g.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
  g.setLineDash([]);
  g.restore();
}

function syncPanelControls() {
  const p = state.panels[selected];
  [...panelList.children].forEach((b, i) => b.classList.toggle('active', i === selected));
  sceneSelect.value = p.scene;
  sourceRadios.forEach((r) => { r.checked = (r.value === 'scene') === (p.source === 'scene'); });
  photoRow.innerHTML = '';
  photos.forEach((img, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb' + (p.source === 'photo' && p.photo === i ? ' active' : '');
    b.textContent = `Photo ${i + 1}`;
    b.addEventListener('click', () => {
      p.source = 'photo';
      p.photo = i;
      syncPanelControls();
      redraw();
    });
    photoRow.appendChild(b);
  });
  zoom.value = Math.round(p.zoom * 100);
  document.getElementById('panel-name').textContent =
    `Panel ${selected + 1} · ${PANEL_NAMES[selected]}`;
}

// panel buttons
PANEL_NAMES.forEach((name, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = `${i + 1} · ${name}`;
  b.addEventListener('click', () => { selected = i; syncPanelControls(); redraw(); });
  panelList.appendChild(b);
});

// scene select
Object.entries(SCENES).forEach(([key, s]) => {
  const o = document.createElement('option');
  o.value = key;
  o.textContent = s.name;
  sceneSelect.appendChild(o);
});
sceneSelect.addEventListener('change', () => {
  const p = state.panels[selected];
  p.scene = sceneSelect.value;
  p.source = 'scene';
  syncPanelControls();
  redraw();
});
sourceRadios.forEach((r) => r.addEventListener('change', () => {
  const p = state.panels[selected];
  if (r.value === 'scene') p.source = 'scene';
  else if (photos.length) { p.source = 'photo'; p.photo = 0; }
  syncPanelControls();
  redraw();
}));
zoom.addEventListener('input', () => {
  state.panels[selected].zoom = Number(zoom.value) / 100;
  redraw();
});

// drag on the preview pans the selected panel's picture
let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  const hit = currentLayout.panels.findIndex((r) => mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h);
  if (hit >= 0) {
    selected = hit;
    syncPanelControls();
    dragging = { x: mx, y: my, ox: state.panels[hit].ox, oy: state.panels[hit].oy };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  const p = state.panels[selected];
  p.ox = dragging.ox + (mx - dragging.x);
  p.oy = dragging.oy + (my - dragging.y);
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });

// photos
document.getElementById('photo').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    if (photos.length >= 6) break;
    photos.push(await loadImage(URL.createObjectURL(file)));
  }
  // first photo goes straight into the hero panel
  if (photos.length === 1) {
    state.panels[0].source = 'photo';
    state.panels[0].photo = 0;
  }
  syncPanelControls();
  redraw();
  status.textContent = `${photos.length} photo${photos.length === 1 ? '' : 's'} loaded — click a panel, then a photo, to place it.`;
});

// caption + subtitle
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

// grade swatches
document.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => {
  state.grade = b.dataset.grade;
  document.querySelectorAll('[data-grade]').forEach((x) => x.classList.toggle('active', x === b));
  redraw();
}));

// size buttons
document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
  state.size = b.dataset.size;
  document.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('active', x === b));
  canvas.style.aspectRatio = `${SIZES[state.size].w} / ${SIZES[state.size].h}`;
  redraw();
}));

// shuffle the built-in scenes across the panels
document.getElementById('shuffle').addEventListener('click', () => {
  const scenes = [...DEFAULT_SCENES];
  for (let i = scenes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [scenes[i], scenes[j]] = [scenes[j], scenes[i]];
  }
  state.panels.forEach((p, i) => { p.scene = scenes[i]; p.source = 'scene'; });
  syncPanelControls();
  redraw();
});

// export the cover as a PNG at the chosen size
document.getElementById('export').addEventListener('click', () => {
  const off = document.createElement('canvas');
  drawCover(off, state, photos);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leonida-cover-${state.size}.png`;
    a.click();
    status.textContent = `Saved leonida-cover-${state.size}.png (${SIZES[state.size].w} × ${SIZES[state.size].h})`;
  }, 'image/png');
});

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  // wait for the display font so the shot is lettered in Bebas Neue
  const go = () => runShot(shot, new URLSearchParams(location.search), {
    loadImage,
    setState(next) {
      Object.assign(state, next);
      captionInput.value = state.caption;
      subtitleInput.value = state.subtitle;
      syncPanelControls();
      redraw();
    },
    photos,
    redraw,
  });
  if (document.fonts && document.fonts.load) {
    document.fonts.load('100px "Bebas Neue"').catch(() => {}).finally(go);
  } else go();
} else {
  syncPanelControls();
  // draw once fonts are ready so the title uses Bebas Neue
  if (document.fonts && document.fonts.ready) {
    document.fonts.load('100px "Bebas Neue"').catch(() => {}).finally(() => redraw());
    document.fonts.ready.then(() => redraw());
  }
  redraw();
}
