# Contributing to ZeroUpload

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/cybermax-008/zeroupload.git
cd zeroupload
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` with CORS headers pre-configured so both image engines work.

## Project Structure

- `src/components/` — React components (one per tool tab + shared UI primitives)
- `src/lib/` — Core engines and utilities (imageEngine, pdfEngine, theme, fileUtils)
- `public/` — Static assets (icons, PWA manifests)
- `CLAUDE.md` — Architecture notes for developers

## Code Style

- **No CSS files** — all styling uses inline React style objects with tokens from `src/lib/theme.js`
- **No global state** — each tool tab manages its own state via `useState`
- **No external APIs** — everything runs client-side

There's no linter or formatter configured yet. Follow the patterns in existing code: consistent indentation, single quotes, arrow functions.

## Making Changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Test locally with `npm run dev` — verify both image engines work
4. Run `npm run build` to ensure production build succeeds
5. Open a pull request against `main`

## What to Contribute

- Bug fixes
- New file processing tools (image or PDF)
- Performance improvements
- Accessibility improvements
- Documentation improvements

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS info
- Whether you're using wasm-vips or Pica.js (shown in the app footer)

## Questions?

Open a discussion or issue — happy to help.
