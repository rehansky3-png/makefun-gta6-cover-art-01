// Leonida Cover Maker — colour grades.
//
// A grade is a canvas filter plus two translucent gradient washes (one from
// the top, one from the bottom) and a vignette strength. Grades are applied
// after the scene and the photo panels are composed, so the whole cover gets
// one consistent look — the Vice City sunset or the neon night.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    filter: 'saturate(1.3) contrast(1.06) brightness(1.03)',
    topWash: ['rgba(255, 126, 95, 0.20)', 'rgba(255, 126, 95, 0)'],
    bottomWash: ['rgba(43, 16, 85, 0)', 'rgba(43, 16, 85, 0.26)'],
    vignette: 0.22,
  },
  {
    id: 'neon',
    name: 'Neon',
    filter: 'saturate(1.45) contrast(1.12) brightness(0.98)',
    topWash: ['rgba(255, 46, 136, 0.22)', 'rgba(255, 46, 136, 0)'],
    bottomWash: ['rgba(34, 211, 238, 0)', 'rgba(34, 211, 238, 0.28)'],
    vignette: 0.3,
  },
  {
    id: 'vice',
    name: 'Vice',
    filter: 'saturate(1.6) contrast(1.18) brightness(1.0) hue-rotate(-12deg)',
    topWash: ['rgba(255, 0, 128, 0.26)', 'rgba(255, 0, 128, 0)'],
    bottomWash: ['rgba(255, 140, 0, 0)', 'rgba(255, 140, 0, 0.3)'],
    vignette: 0.26,
  },
  {
    id: 'noir',
    name: 'Noir',
    filter: 'saturate(0.25) contrast(1.28) brightness(0.96)',
    topWash: ['rgba(10, 20, 40, 0.18)', 'rgba(10, 20, 40, 0)'],
    bottomWash: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.34)'],
    vignette: 0.38,
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

// Apply a grade to a canvas in place: filter pass, then the two washes.
export function applyGrade(canvas, grade) {
  const w = canvas.width;
  const h = canvas.height;
  const work = document.createElement('canvas');
  work.width = w;
  work.height = h;
  const wctx = work.getContext('2d');
  wctx.filter = grade.filter;
  wctx.drawImage(canvas, 0, 0);
  const ctx = canvas.getContext('2d');
  ctx.filter = 'none';
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(work, 0, 0);
  const top = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  top.addColorStop(0, grade.topWash[0]);
  top.addColorStop(1, grade.topWash[1]);
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h * 0.55);
  const bottom = ctx.createLinearGradient(0, h * 0.45, 0, h);
  bottom.addColorStop(0, grade.bottomWash[0]);
  bottom.addColorStop(1, grade.bottomWash[1]);
  ctx.fillStyle = bottom;
  ctx.fillRect(0, h * 0.45, w, h * 0.55);
}

// Darken the corners so the title and the panels sit in the frame.
export function applyVignette(ctx, w, h, strength) {
  if (strength <= 0) return;
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.72,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// Film grain from a seeded random so an export is reproducible.
export function applyGrain(ctx, w, h, amount, rng) {
  if (amount <= 0) return;
  const count = Math.floor((w * h) / 260);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const v = rng() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${(rng() * amount).toFixed(3)})`;
    ctx.fillRect(rng() * w, rng() * h, 1.4, 1.4);
  }
  ctx.restore();
}
