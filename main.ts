// Leonida Cover Maker — the program that hands the entry in.
//
// Node 22, standard library only. It copies this repository's app/ (the
// offline cover-maker web app) and screenshots/ into the output directory
// and writes /output/dossier.json, the summary the judge reads, using the
// vendored make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR stands
// in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The app is the entry: refuse to hand in a repository without it, or with
// an index.html the gate would refuse (over its 1 MiB cap).
if (!existsSync(join(here, 'app', 'index.html'))) {
  throw new Error('app/index.html is missing: nothing to hand in');
}
if (statSync(join(here, 'app', 'index.html')).size > 1048576) {
  throw new Error('app/index.html is over the 1 MiB gate cap');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });

const shots = join(here, 'screenshots');
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shots)) {
  cpSync(shots, join(out, 'screenshots'), { recursive: true });
}
const shotCount = readdirSync(join(out, 'screenshots')).filter((f) => !f.startsWith('.')).length;
if (shotCount < 3 || shotCount > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shotCount}`);
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the dossier's bytes; the other caps refuse an entry the scorer would
// refuse (more than 4 screenshots or one over 256 KiB; more than 993 files
// in app/ or 48 MiB of app files in all, or a path under app/ over 1000
// bytes: app/ counts beside /output's own 1000-entry cap, its screenshots/
// and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`Leonida Cover Maker handed in: app/ + ${shotCount} screenshots + dossier.json -> ${out}`);
