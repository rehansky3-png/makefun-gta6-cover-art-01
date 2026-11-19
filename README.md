# Leonida Cover Maker

An offline web app that turns any photo and a caption into GTA VI-style
cover art — the multi-panel poster look with bold Bebas Neue lettering and a
Vice City sunset or neon grade — exported as a PNG to share. Everything runs
from static files in `app/`; photos are read on your own machine and never
uploaded.

## How to use it

```sh
# serve app/ with any static server, then open it in a desktop browser
node serve.ts            # or: python3 -m http.server -d app 8080
```

1. Pick one of six Leonida scenes (Boulevard Sunset, Pier Dusk, Skyline
   Night, Swamp Dawn, Beach Day, Neon Street) — every one is painted in code
   on a canvas, no photograph and no Rockstar artwork.
2. Pick a layout: Four Panel, Hero + Three, Nine Panel, or Full Bleed.
3. Load a photo into a panel (click a panel to select it, then Upload, or
   Fill all panels with one photo). Drag a photo to move it, scroll to zoom,
   or use the zoom slider. Two sample photos are included to try it with.
4. Write the title and subtitle, set the title size and position.
5. Pick a colour grade (Sunset, Neon, Vice, Noir) and toggle film grain and
   vignette.
6. Pick a post size — 1080 × 1080, 1080 × 1350 or 1920 × 1080 — and hit
   Export PNG. The preview is exactly what the PNG holds.

Your choices are remembered in the browser (localStorage); photos are not
stored anywhere.

## How it is built

- `app/index.html` + `app/styles.css` — the editor.
- `app/app.js` — state, the four layouts, the photo panels (cover-fit, zoom
  and pan per panel), the cover render pipeline and the export.
- `app/scenes.js` — the six procedural scenes: gradients, sun glow, palm
  silhouettes, building rows with lit windows, neon signs, fog, water
  glitter. Each scene is drawn at whatever resolution the cover needs.
- `app/grades.js` — the four grades (canvas filter plus top and bottom
  colour washes), the vignette and the seeded film grain.
- `app/fonts/BebasNeue-Regular.ttf` — Bebas Neue under the SIL Open Font
  License (`app/fonts/OFL.txt` beside it).
- `app/samples/boulevard.jpg`, `app/samples/pier.jpg` — the two sample
  photos the kit ships for entrants to use, made with an image model for
  make.fun and free to use. No real person, no Rockstar artwork.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to
  `/output` and writes `/output/dossier.json` with the vendored make.fun
  library (`vendor/makefun-app.ts`, the kit's copy, unchanged).

Run it yourself:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `main.ts` — the entry program (Node 22, standard library only).
- `app/` — the whole web app, static files only, no network request.
- `screenshots/` — 4 screenshots: the wide cover the app exported, the
  editor with a photo loaded, a portrait neon cover, and a square mosaic
  cover.
- `LICENSE` — MIT.

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/rehansky3-png/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/rehansky3-png/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
