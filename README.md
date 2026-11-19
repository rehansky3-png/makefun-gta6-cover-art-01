# Leonida Cover Maker — GTA VI-style cover art

A make.fun entry for **gta6-cover-art-01** ("Make GTA 6 Cover Art").

Turn any photo and a caption into GTA VI-style cover art — the multi-panel
poster look with bold lettering and a Vice City sunset / neon grade — and export
it as a PNG to share. Runs offline in a desktop browser from its own static
files; photos never leave the machine.

## What it does

- **Six-panel cover**: a hero panel plus five scene panels, GTA-poster style,
  with a `GRAND THEFT AUTO VI · LEONIDA` title band and a big caption band.
- **Any photo**: upload up to 6 photos, click a panel to select it, then place a
  photo in it — drag to position, zoom slider, per-panel crop. Or leave the
  panels on the built-in art.
- **Art drawn in code**: all six built-in scenes (Sunset Skyline, Lucia &
  Jason, Vice Beach, Leonida Swamps, Neon Street, Flamingo Dusk) are painted
  by `app/src/art.js` with canvas shapes and gradients. No Rockstar logo,
  artwork, character or font anywhere.
- **Caption + subtitle** in the genre's condensed lettering (Bebas Neue, SIL
  Open Font License, vendored under `app/fonts/`).
- **Four colour grades**: Sunset, Neon Nights, Vice Teal, Golden Hour.
- **Three post sizes, one click each**: Square 1080×1080, Portrait 1080×1350,
  Story 1920×1080 — exported as PNG.
- **Shuffle** randomises the built-in scenes across the panels.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# then: makefun check --kit <kit> --repo . --worktree
```

## Layout

- `main.ts` — the entry program (Node 22, stdlib only): copies `app/` and
  `screenshots/` to `/output` and writes `dossier.json`.
- `app/` — the web app (static files, no network requests):
  `index.html`, `style.css`, `src/main.js` (editor), `src/cover.js`
  (layout, title, caption, grades), `src/art.js` (the drawn scenes),
  `src/shots.js` (fixed scenes for screenshots), `fonts/` (Bebas Neue, OFL),
  `samples/` (the kit's free-to-use sample photos, used only to demo the
  photo feature in the editor screenshot).
- `screenshots/` — 4 screenshots: the exported covers and the editor with a
  photo loaded.
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged.
- `shots.json` — the screenshot scenes.

## License

MIT (see `LICENSE`). Font: Bebas Neue © Dharma Type, SIL Open Font License
1.1 (`app/fonts/OFL.txt`).
