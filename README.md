# Inkline · Markdown Writing Desk

A writing desk between ink and paper — a PWA deployed on GitHub Pages.
No download, no app store: open the link in a browser and install it to your home screen / desktop.

## Features

- **Live preview** — write on the left, see it typeset on the right in real time (mobile uses a top "Write / Preview" tab switch)
- **Local-first** — content auto-saved in `localStorage`; works offline
- **One-tap export**
  - `.md` — Markdown source file
  - `.html` — single-file inlined styles, shareable as-is
  - `PDF` — via `window.print()`, choose «Save as PDF» in the print dialog
- **Installable** — "＋ Install" in the status bar, or browser "Add to Home Screen"
- **Bilingual** — English by default, one-tap switch to 中文 (preference saved)
- **Light / Dark theme** — paper-white & deep-indigo night, auto-follows system

## Tech Stack

Pure static, zero-build: `HTML + CSS + vanilla JS`. Dependencies are vendored locally for full offline support.

- `markdown-it` — Markdown parsing
- `highlight.js` — code highlighting
- Service Worker — offline caching
- Web App Manifest — installability

## Deploy to GitHub Pages

```bash
# From the repo root (project files should be at repo root)
git add -A
git commit -m "feat: Inkline markdown editor PWA"
git push origin main
```

Then in repo **Settings → Pages**:
- **Source**: Deploy from a branch
- **Branch**: `main` / `/ (root)`

Wait 1–2 minutes, then visit `https://<username>.github.io/inkline/`.

> PWA Service Workers require HTTPS — GitHub Pages provides this by default.
> The project includes `.nojekyll` to prevent Jekyll from processing static assets.

## Local Preview

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## File Structure

```
inkline/
├── index.html            # structure & entry
├── app.js                # editor / render / export / PWA / i18n
├── styles.css            # screen styles (light / dark theme)
├── print.css             # PDF print typography
├── manifest.webmanifest  # PWA manifest
├── sw.js                 # service worker (offline cache)
├── icons/                # app icons (incl. maskable)
├── vendor/               # local dependencies
└── .nojekyll
```

## Shortcuts

- `Tab` — insert indentation
- `⌘/Ctrl + S` — export Markdown
