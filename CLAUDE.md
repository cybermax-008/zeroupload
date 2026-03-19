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

Acorn Tools is a privacy-first file processing PWA (React 18 + Vite) that runs entirely client-side. No server-side processing — all file operations happen in-browser. Deploys as a static site or to iOS/Android via Capacitor.

### Dual Image Engine (the core architectural pattern)

`src/lib/imageEngine.js` implements a fallback engine system:

- **wasm-vips** (primary): Requires `SharedArrayBuffer` + COOP/COEP headers. Works with `ArrayBuffer` directly. ~5.5MB WASM binary. Objects must be explicitly `.delete()`d to prevent memory leaks. All vips operations have try/catch that falls through to Pica on failure.
- **Pica.js** (fallback): Activates automatically when vips fails or SharedArrayBuffer is unavailable. Works with `HTMLImageElement`/Canvas. Uses Lanczos3 via JS/WASM/WebWorker auto-selection.

Engine state is stored as **module-level variables** (not React state) — a single global instance initialized once on App mount and cleaned up on unmount. The engine type determines the input conversion path in `resizeImage()`.

**WASM loading**: Vite content-hashes WASM files but wasm-vips resolves filenames at runtime. The `copyVipsWasm()` plugin in `vite.config.js` copies the unhashed `vips.wasm` to `dist/assets/` so the runtime lookup works. Without this, vips silently falls back to Pica in production.

### PDF Engine

`src/lib/pdfEngine.js` wraps pdf-lib for merge, split, and image-to-PDF. All operations return `{ blob, pageCount, download() }`. Unsupported image formats (WebP, AVIF) are converted to PNG via canvas before PDF embedding.

### Additional Engines

- `src/lib/metadataEngine.js` — EXIF/metadata stripping for images (canvas re-encode) and PDFs (pdf-lib field clearing). Includes a lightweight JPEG EXIF parser for display.
- `src/lib/pdfPageEngine.js` — Page-level PDF operations (reorder, delete, insert, thumbnails) using pdf-lib + pdfjs-dist.
**Note:** pdf-lib does NOT support PDF encryption. Do not attempt `save({ userPassword })` — it silently produces an unencrypted file.

**PDF Compression** has two modes:
- **Smart** (default): `src/lib/pdfSmartCompressEngine.js` enumerates embedded images via pdf-lib's `context.enumerateIndirectObjects()`, decodes DCTDecode/FlateDecode streams, runs SSIM-guided binary search for optimal MozJPEG quality, and replaces streams in-place. Preserves text, vectors, fonts. Uses `src/lib/ssim.js` for perceptual quality measurement.
- **Aggressive**: Rasterizes every page to canvas via pdfjs-dist and re-encodes as JPEG. Smaller files but loses text selectability.

### Routing

React Router v6 with `BrowserRouter` (or `MemoryRouter` for Capacitor). `App.jsx` is the layout component with `<Outlet>`. Route config in `src/lib/routes.js`. Each tool has a dedicated SEO route (e.g., `/compress-pdf`, `/resize-image`) with per-page meta tags via `react-helmet-async`. `ToolPage.jsx` wraps tool components with SEO content. `HomePage.jsx` renders the tool grid.

### Styling & Theming

All styling is inline React style objects — no CSS files or class names. Design tokens use **CSS custom properties** (`var(--at-xxx)`) defined in `src/lib/theme.js`, with dark and light color sets. Theme toggle persists to localStorage and respects `prefers-color-scheme`. An inline script in `index.html` sets `data-theme` before React renders to prevent flash.

### Platform Layer

`src/lib/fileUtils.js` abstracts file I/O with `isCapacitor()` detection:
- Browser: blob URL + `<a download>`
- Capacitor: `Filesystem.writeFile()` + native Share sheet

### Usage Gate & Monetization

`src/lib/usageGate.js` — client-side usage tracking with localStorage. Free users get 5 operations/day; Pro users get unlimited. Gate checks happen at processing time via `onBeforeProcess`/`onOperationComplete` callbacks passed from `App.jsx` to all tool tabs.

- **Stripe Payment Link** for $6.99 one-time purchase. URL hardcoded in `usageGate.js`.
- **License key** = Stripe Checkout Session ID. Shown after payment, verifiable via `/api/verify-license`.
- **Restore Purchase** flow: user pastes license key → serverless function verifies with Stripe API.
- **Capacitor builds** bypass the gate entirely (`isCapacitor()` → always pro).

`api/verify-license.js` — Vercel serverless function that validates license keys against Stripe API. Requires `STRIPE_SECRET_KEY` env var.

### Component Structure

Each tab component (`ResizeTab`, `ImgToPdfTab`, `PdfToolsTab`) manages its own local state with `useState` — no global state management. `onBeforeProcess`/`onOperationComplete` callbacks are passed via React Router's outlet context. Shared UI primitives (`DropZone`, `Btn`, `Toggle`, `StatusBadge`, `PaywallModal`, `RestoreModal`, etc.) live in `src/components/ui.jsx` with no domain logic.

## Deployment

Hosted on **Vercel** at `www.acorntools.net`. `vercel.json` configures COOP/COEP headers, SPA rewrite rules, and the `/api` serverless functions. The SPA catch-all rewrite (`/(.*) → /index.html`) means missing assets get HTML instead of 404 — always ensure dynamically-loaded files exist with their expected names in the build output.

Production hosting **must** serve these headers for wasm-vips to work (without them, Pica.js fallback activates automatically):

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

These are configured in `vercel.json` for production and `vite.config.js` for dev/preview servers.
