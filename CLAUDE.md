# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (localhost:5173, CORS headers auto-configured)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run cap:sync   # Build + sync to iOS/Android (Capacitor)
```

No test framework is configured. No linter is configured.

## Architecture

VaultKit is a privacy-first file processing PWA (React 18 + Vite) that runs entirely client-side. No server-side processing — all file operations happen in-browser. Deploys as a static site or to iOS/Android via Capacitor.

### Dual Image Engine (the core architectural pattern)

`src/lib/imageEngine.js` implements a fallback engine system:

- **wasm-vips** (primary): Requires `SharedArrayBuffer` + COOP/COEP headers. Works with `ArrayBuffer` directly. ~4MB WASM binary. Objects must be explicitly `.delete()`d to prevent memory leaks.
- **Pica.js** (fallback): Activates automatically when SharedArrayBuffer is unavailable. Works with `HTMLImageElement`/Canvas. Uses Lanczos3 via JS/WASM/WebWorker auto-selection.

Engine state is stored as **module-level variables** (not React state) — a single global instance initialized once on App mount and cleaned up on unmount. The engine type determines the input conversion path in `resizeImage()`.

### PDF Engine

`src/lib/pdfEngine.js` wraps pdf-lib for merge, split, and image-to-PDF. All operations return `{ blob, pageCount, download() }`. Unsupported image formats (WebP, AVIF) are converted to PNG via canvas before PDF embedding.

### Styling

All styling is inline React style objects — no CSS files or class names. Design tokens are centralized in `src/lib/theme.js`. Global styles are injected by `theme.js` at import time.

### Platform Layer

`src/lib/fileUtils.js` abstracts file I/O with `isCapacitor()` detection:
- Browser: blob URL + `<a download>`
- Capacitor: `Filesystem.writeFile()` + native Share sheet

### Component Structure

Each tab component (`ResizeTab`, `ImgToPdfTab`, `PdfToolsTab`) manages its own local state with `useState` — no global state management. Shared UI primitives (`DropZone`, `Btn`, `Toggle`, `StatusBadge`, etc.) live in `src/components/ui.jsx` with no domain logic.

## Deployment

Production hosting **must** serve these headers for wasm-vips to work (without them, Pica.js fallback activates automatically):

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

These are already configured in `vite.config.js` for dev/preview servers.
