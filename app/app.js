// Leonida Cover Maker — editor logic.
//
// State, layouts, photo panels, the cover render pipeline and the export.
// The cover is rendered by renderCover(w, h): scene first, then the photo
// panels, then the grade, then the title block, grain and vignette. The
// preview is the same render at a smaller size, so what you see is what the
// PNG holds.

import { paintScene, SCENES, seededRandom } from './scenes.js';
import { applyGrade, applyGrain, applyVignette, gradeById, GRADES } from './grades.js';

const SIZES = {
  square: { label: '1080 × 1080 · Square', w: 1080, h: 1080 },
  portrait: { label: '1080 × 1350 · Portrait', w: 1080, h: 1350 },
  wide: { label: '1920 × 1080 · Wide', w: 1920, h: 1080 },
};

const LAYOUTS = [
  { id: 'grid4', name: 'Four Panel', panels: 4 },
  { id: 'hero3', name: 'Hero + Three', panels: 4 },
  { id: 'mosaic9', name: 'Nine Panel', panels: 9 },
  { id: 'fullbleed', name: 'Full Bleed', panels: 1 },
];

const state = {
  scene: 'boulevard',
  layout: 'grid4',
  grade: 'sunset',
  size: 'square',
  title: 'LEONIDA',
  subtitle: 'WELCOME BACK TO VICE CITY',
  titleScale: 1,
  titleTop: false,
  grain: true,
  vignette: true,
  selectedPanel: 0,
  panels: [],
};

function freshPanels() {
  return Array.from({ length: 9 }, () => ({
    photo: null,
    photoName: '',
    zoom: 1,
    panX: 0,
    panY: 0,
  }));
}
state.panels = freshPanels();

// Panel rectangles for a layout, as fractions of the cover. The title band
// keeps the bottom of the cover for the caption; full-bleed uses it all.
export function layoutPanels(layoutId, w, h) {
  const band = layoutId === 'fullbleed' ? 0 : h * 0.2;
  const areaH = h - band;
  const g = Math.max(6, w * 0.008); // white gutter between panels
  const inset = Math.max(10, w * 0.014); // outer frame
  const x0 = inset;
  const y0 = inset;
  const x1 = w - inset;
  const y1 = areaH - inset * 0.5;
  const panels = [];
  if (layoutId === 'grid4') {
    const cw = (x1 - x0 - g) / 2;
    const ch = (y1 - y0 - g) / 2;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        panels.push({ x: x0 + c * (cw + g), y: y0 + r * (ch + g), w: cw, h: ch });
      }
    }
  } else if (layoutId === 'hero3') {
    const heroW = (x1 - x0 - g) * 0.58;
    const sideW = (x1 - x0 - g) * 0.42;
    const sh = (y1 - y0 - g * 2) / 3;
    panels.push({ x: x0, y: y0, w: heroW, h: y1 - y0 });
    for (let i = 0; i < 3; i++) {
      panels.push({ x: x0 + heroW + g, y: y0 + i * (sh + g), w: sideW, h: sh });
    }
  } else if (layoutId === 'mosaic9') {
    const cw = (x1 - x0 - g * 2) / 3;
    const ch = (y1 - y0 - g * 2) / 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        panels.push({ x: x0 + c * (cw + g), y: y0 + r * (ch + g), w: cw, h: ch });
      }
    }
  } else {
    panels.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  }
  return panels;
}

// Draw one photo into a panel rect with cover-fit, zoom and pan.
function drawPhotoInto(ctx, img, rect, zoom, panX, panY) {
  const base = Math.max(rect.w / img.width, rect.h / img.height);
  const dw = img.width * base * zoom;
  const dh = img.height * base * zoom;
  const dx = rect.x + (rect.w - dw) / 2 + panX * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + panY * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// A panel with no photo shows a different slice of the scene itself, so the
// cover looks finished before any photo is loaded. Each panel zooms into the
// scene at its own magnification and pans to its own spot, so the panels
// read as separate vignettes of one place instead of the same picture three
// times over.
function drawSceneCropInto(ctx, sceneCanvas, rect, index) {
  const sw = sceneCanvas.width;
  const sh = sceneCanvas.height;
  const zooms = [1.6, 1.25, 1.8, 1.4, 1.15, 1.7, 1.3, 1.5, 1.2];
  const fracs = [0, 0.5, 1, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6];
  const zoom = zooms[index % zooms.length];
  const frac = fracs[index % fracs.length];
  const scale = Math.max(rect.w / sw, rect.h / sh) * zoom;
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = rect.x + (rect.w - dw) * frac;
  const dy = rect.y + (rect.h - dh) * 0.3;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(sceneCanvas, dx, dy, dw, dh);
  ctx.restore();
}

// The title block: a dark band, the big Bebas title with a hard outline and
// a letterspaced subtitle in the accent colour.
function drawTitleBlock(ctx, w, h) {
  const bandH = h * 0.2;
  const bandY = state.titleTop ? 0 : h - bandH;
  const g = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  if (state.titleTop) {
    g.addColorStop(0, 'rgba(0,0,0,0.9)');
    g.addColorStop(1, 'rgba(0,0,0,0.35)');
  } else {
    g.addColorStop(0, 'rgba(0,0,0,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0.9)');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, bandY, w, bandH);
  // A thin gold rule where the band meets the panels.
  ctx.fillStyle = 'rgba(255, 209, 102, 0.85)';
  ctx.fillRect(0, state.titleTop ? bandY + bandH - 3 : bandY, w, 3);
  const pad = w * 0.045;
  const titleSize = h * 0.105 * state.titleScale;
  const subSize = h * 0.026;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const titleY = state.titleTop ? bandY + bandH * 0.42 : h - bandH * 0.3;
  const subY = state.titleTop ? bandY + bandH * 0.78 : h - bandH * 0.08;
  // Subtitle first (it sits above the title when the band is at the bottom).
  ctx.save();
  try { ctx.letterSpacing = `${Math.round(subSize * 0.32)}px`; } catch (e) { /* older canvas */ }
  ctx.font = `${Math.round(subSize)}px "Bebas Neue", "Arial Narrow", sans-serif`;
  ctx.fillStyle = '#ffd166';
  ctx.fillText((state.subtitle || '').toUpperCase(), pad, state.titleTop ? titleY + titleSize * 0.62 : subY);
  ctx.restore();
  // Title with a hard dark outline.
  ctx.font = `${Math.round(titleSize)}px "Bebas Neue", "Arial Narrow", sans-serif`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = Math.max(3, titleSize * 0.09);
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = titleSize * 0.12;
  ctx.shadowOffsetY = titleSize * 0.03;
  ctx.strokeText((state.title || 'LEONIDA').toUpperCase(), pad, titleY);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ffffff';
  ctx.fillText((state.title || 'LEONIDA').toUpperCase(), pad, titleY);
}

// Render the whole cover at any size. Used for the preview and the export.
export function renderCover(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  // Scene background.
  paintScene(ctx, state.scene, w, h);
  const sceneCanvas = document.createElement('canvas');
  sceneCanvas.width = w;
  sceneCanvas.height = h;
  paintScene(sceneCanvas.getContext('2d'), state.scene, w, h);
  // Photo panels with white poster frames.
  const rects = layoutPanels(state.layout, w, h);
  const layout = LAYOUTS.find((l) => l.id === state.layout);
  for (let i = 0; i < layout.panels; i++) {
    const rect = rects[i];
    const panel = state.panels[i];
    if (panel.photo) {
      drawPhotoInto(ctx, panel.photo, rect, panel.zoom, panel.panX, panel.panY);
    } else {
      drawSceneCropInto(ctx, sceneCanvas, rect, i);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }
  // Grade, title, grain, vignette.
  applyGrade(canvas, gradeById(state.grade));
  const gctx = canvas.getContext('2d');
  drawTitleBlock(gctx, w, h);
  if (state.vignette) applyVignette(gctx, w, h, gradeById(state.grade).vignette);
  if (state.grain) applyGrain(gctx, w, h, 0.05, seededRandom(7));
  // Thin poster border.
  gctx.strokeStyle = 'rgba(255,255,255,0.55)';
  gctx.lineWidth = Math.max(2, w * 0.002);
  gctx.strokeRect(w * 0.008, h * 0.008, w * 0.984, h * 0.984);
  return canvas;
}

// --- Preview and UI -------------------------------------------------------

const preview = document.getElementById('preview');
const previewWrap = document.getElementById('previewWrap');

function renderPreview() {
  const size = SIZES[state.size];
  const maxSide = 620;
  const scale = Math.min(maxSide / size.w, maxSide / size.h);
  const pw = Math.round(size.w * scale);
  const ph = Math.round(size.h * scale);
  preview.width = pw;
  preview.height = ph;
  const cover = renderCover(pw, ph);
  const ctx = preview.getContext('2d');
  ctx.clearRect(0, 0, pw, ph);
  ctx.drawImage(cover, 0, 0);
  // Selected-panel outline.
  const rects = layoutPanels(state.layout, pw, ph);
  const layout = LAYOUTS.find((l) => l.id === state.layout);
  if (state.selectedPanel < layout.panels) {
    const r = rects[state.selectedPanel];
    ctx.save();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
    ctx.restore();
  }
}

function loadPhotoFile(file, applyToAll) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const targets = applyToAll
      ? state.panels
      : [state.panels[state.selectedPanel]];
    for (const panel of targets) {
      panel.photo = img;
      panel.photoName = file.name;
      panel.zoom = 1;
      panel.panX = 0;
      panel.panY = 0;
    }
    document.getElementById('photoName').textContent = file.name;
    renderPreview();
  };
  img.src = url;
}

async function loadSamplePhoto(name) {
  const res = await fetch(`samples/${name}`);
  const blob = await res.blob();
  loadPhotoFile(new File([blob], name, { type: 'image/jpeg' }), false);
}

function setScene(id) {
  state.scene = id;
  document.querySelectorAll('[data-scene]').forEach((b) => b.classList.toggle('active', b.dataset.scene === id));
  renderPreview();
}

function setLayout(id) {
  state.layout = id;
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === id));
  renderPreview();
}

function setGrade(id) {
  state.grade = id;
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === id));
  renderPreview();
}

function setSize(id) {
  state.size = id;
  renderPreview();
}

function exportCover() {
  const size = SIZES[state.size];
  const cover = renderCover(size.w, size.h);
  cover.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leonida-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}

function randomizeCover() {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  setScene(pick(SCENES).id);
  setLayout(pick(LAYOUTS).id);
  setGrade(pick(GRADES).id);
}

function buildPickerButtons() {
  const sceneRow = document.getElementById('sceneRow');
  for (const scene of SCENES) {
    const b = document.createElement('button');
    b.className = 'pick';
    b.dataset.scene = scene.id;
    b.textContent = scene.name;
    const thumb = document.createElement('canvas');
    thumb.width = 96;
    thumb.height = 54;
    paintScene(thumb.getContext('2d'), scene.id, 96, 54);
    b.prepend(thumb);
    b.addEventListener('click', () => setScene(scene.id));
    sceneRow.appendChild(b);
  }
  const layoutRow = document.getElementById('layoutRow');
  for (const layout of LAYOUTS) {
    const b = document.createElement('button');
    b.className = 'pick';
    b.dataset.layout = layout.id;
    b.textContent = layout.name;
    b.addEventListener('click', () => setLayout(layout.id));
    layoutRow.appendChild(b);
  }
  const gradeRow = document.getElementById('gradeRow');
  for (const grade of GRADES) {
    const b = document.createElement('button');
    b.className = 'pick';
    b.dataset.grade = grade.id;
    b.textContent = grade.name;
    b.addEventListener('click', () => setGrade(grade.id));
    gradeRow.appendChild(b);
  }
}

function wireControls() {
  document.getElementById('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value;
    renderPreview();
  });
  document.getElementById('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    renderPreview();
  });
  document.getElementById('titleSize').addEventListener('input', (e) => {
    state.titleScale = Number(e.target.value);
    renderPreview();
  });
  document.getElementById('titlePos').addEventListener('change', (e) => {
    state.titleTop = e.target.value === 'top';
    renderPreview();
  });
  document.getElementById('grainToggle').addEventListener('change', (e) => {
    state.grain = e.target.checked;
    renderPreview();
  });
  document.getElementById('vignetteToggle').addEventListener('change', (e) => {
    state.vignette = e.target.checked;
    renderPreview();
  });
  document.getElementById('sizeSelect').addEventListener('change', (e) => setSize(e.target.value));
  document.getElementById('zoomSlider').addEventListener('input', (e) => {
    state.panels[state.selectedPanel].zoom = Number(e.target.value);
    renderPreview();
  });
  document.getElementById('resetPanel').addEventListener('click', () => {
    const p = state.panels[state.selectedPanel];
    p.zoom = 1;
    p.panX = 0;
    p.panY = 0;
    document.getElementById('zoomSlider').value = '1';
    renderPreview();
  });
  document.getElementById('exportBtn').addEventListener('click', exportCover);
  document.getElementById('randomBtn').addEventListener('click', randomizeCover);
  const fileInput = document.getElementById('fileInput');
  document.getElementById('uploadBtn').addEventListener('click', () => fileInput.click());
  document.getElementById('fillAllBtn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const fillAll = e.target.dataset.fillAll === '1';
    e.target.dataset.fillAll = '';
    loadPhotoFile(e.target.files[0], fillAll);
    e.target.value = '';
  });
  document.getElementById('fillAllBtn').addEventListener('click', () => { fileInput.dataset.fillAll = '1'; });
  document.getElementById('sampleBoulevard').addEventListener('click', () => loadSamplePhoto('boulevard.jpg'));
  document.getElementById('samplePier').addEventListener('click', () => loadSamplePhoto('pier.jpg'));
  // Click a panel in the preview to select it; drag pans its photo.
  let dragging = null;
  preview.addEventListener('pointerdown', (e) => {
    const rect = preview.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (preview.width / rect.width);
    const y = (e.clientY - rect.top) * (preview.height / rect.height);
    const rects = layoutPanels(state.layout, preview.width, preview.height);
    const layout = LAYOUTS.find((l) => l.id === state.layout);
    for (let i = 0; i < layout.panels; i++) {
      const r = rects[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        state.selectedPanel = i;
        document.getElementById('panelLabel').textContent = `Panel ${i + 1} of ${layout.panels}`;
        document.getElementById('zoomSlider').value = String(state.panels[i].zoom);
        dragging = { x, y, panX: state.panels[i].panX, panY: state.panels[i].panY };
        renderPreview();
        break;
      }
    }
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = preview.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (preview.width / rect.width);
    const y = (e.clientY - rect.top) * (preview.height / rect.height);
    const panel = state.panels[state.selectedPanel];
    panel.panX = Math.max(-0.45, Math.min(0.45, dragging.panX + (x - dragging.x) / preview.width));
    panel.panY = Math.max(-0.45, Math.min(0.45, dragging.panY + (y - dragging.y) / preview.height));
    renderPreview();
  });
  preview.addEventListener('pointerup', () => { dragging = null; });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[state.selectedPanel];
    panel.zoom = Math.max(1, Math.min(3, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
    document.getElementById('zoomSlider').value = String(panel.zoom);
    renderPreview();
  }, { passive: false });
}

// Restore the last session's choices (photos are never stored).
function restoreState() {
  try {
    const saved = JSON.parse(localStorage.getItem('leonida-cover-maker') || '{}');
    for (const key of ['scene', 'layout', 'grade', 'size', 'title', 'subtitle', 'titleScale', 'titleTop', 'grain', 'vignette']) {
      if (saved[key] !== undefined) state[key] = saved[key];
    }
  } catch (e) { /* first run */ }
  document.getElementById('titleInput').value = state.title;
  document.getElementById('subtitleInput').value = state.subtitle;
  document.getElementById('titleSize').value = String(state.titleScale);
  document.getElementById('titlePos').value = state.titleTop ? 'top' : 'bottom';
  document.getElementById('grainToggle').checked = state.grain;
  document.getElementById('vignetteToggle').checked = state.vignette;
  document.getElementById('sizeSelect').value = state.size;
}

function saveState() {
  const { scene, layout, grade, size, title, subtitle, titleScale, titleTop, grain, vignette } = state;
  localStorage.setItem('leonida-cover-maker', JSON.stringify({
    scene, layout, grade, size, title, subtitle, titleScale, titleTop, grain, vignette,
  }));
}

async function startCoverMaker() {
  buildPickerButtons();
  wireControls();
  restoreState();
  setScene(state.scene);
  setLayout(state.layout);
  setGrade(state.grade);
  try {
    await document.fonts.load('100px "Bebas Neue"');
    await document.fonts.ready;
  } catch (e) { /* fall back to system sans */ }
  renderPreview();
  setInterval(saveState, 5000);
  window.addEventListener('beforeunload', saveState);
}

startCoverMaker();
