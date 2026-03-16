# ZeroUpload — Private PDF & Image Tools

> Compress, convert, resize, crop, merge — 100% offline, nothing leaves your device.

A privacy-first file processing tool that runs entirely on the user's device. No uploads, no servers, no tracking. Works offline as a PWA and deploys to iOS/Android via Capacitor.

## Architecture

```
┌─────────────────────────────────────────┐
│          ZeroUpload (React)             │
├───────────────┬─────────────────────────┤
│  Image Engine │     PDF Engine          │
│  ┌──────────┐ │  ┌────────────────────┐ │
│  │ wasm-vips│ │  │  pdf-lib / pdfjs   │ │
│  │ (primary)│ │  │  merge / split /   │ │
│  ├──────────┤ │  │  rotate / compress │ │
│  │  Pica.js │ │  │  watermark / img↔  │ │
│  │(fallback)│ │  └────────────────────┘ │
│  └──────────┘ │                         │
├───────────────┴─────────────────────────┤
│  Platform Layer                         │
│  Browser (PWA) │ iOS │ Android          │
│  Service Worker│ Capacitor WebView      │
└─────────────────────────────────────────┘
```

### Dual Image Engine

The app auto-detects the best available engine:

| Engine | Quality | Requirements | Size |
|--------|---------|-------------|------|
| **wasm-vips** | Maximum (libvips) | `SharedArrayBuffer` + CORS headers | ~4MB WASM |
| **Pica.js** | High (Lanczos3) | None | ~45KB |

- **wasm-vips** uses the same library as Sharp (the #1 Node.js image processor). It supports Lanczos3 + smart sharpening, AVIF/TIFF, and streaming pipelines.
- **Pica.js** auto-selects WebAssembly → WebWorkers → pure JS. Same Lanczos3 algorithm, slightly less control over sharpening.

The engine falls back gracefully — if `SharedArrayBuffer` isn't available (no CORS headers), Pica kicks in automatically.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (CORS headers auto-configured in vite.config.js)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Web (Static Hosting)

Build and deploy the `dist/` folder. **Critical:** your server must send these headers for wasm-vips to work:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

#### Vercel (`vercel.json`)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" }
      ]
    }
  ]
}
```

#### Netlify (`_headers`)
```
/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
```

#### Cloudflare Pages (`_headers`)
```
/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
```

#### Nginx
```nginx
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
```

> **Without these headers:** The app still works — it falls back to Pica.js (Lanczos3), which is still excellent quality. wasm-vips just adds the extra edge for professional-grade processing.

### iOS & Android (Capacitor)

```bash
# Initialize Capacitor (one-time)
npm run cap:init

# Add platforms
npm run cap:add:ios
npm run cap:add:android

# Build web → sync to native → open IDE
npm run cap:sync
npm run cap:open:ios      # Opens Xcode
npm run cap:open:android  # Opens Android Studio
```

---

## Project Structure

```
zeroupload/
├── index.html                    # Entry point
├── vite.config.js                # Vite + PWA + CORS config
├── capacitor.config.ts           # Capacitor native config
├── package.json
├── src/
│   ├── main.jsx                  # React mount
│   ├── App.jsx                   # Shell (home grid, tool views)
│   ├── components/
│   │   ├── ui.jsx                # Shared components (DropZone, Btn, etc.)
│   │   ├── ResizeTab.jsx         # Image resize
│   │   ├── CompressTab.jsx       # Image compress
│   │   ├── ConvertTab.jsx        # Image format convert
│   │   ├── CropTab.jsx           # Image crop
│   │   ├── ImgToPdfTab.jsx       # Images → PDF
│   │   ├── PdfToImageTab.jsx     # PDF → Images
│   │   └── PdfToolsTab.jsx       # PDF merge, split, rotate, compress, watermark, page #s
│   └── lib/
│       ├── imageEngine.js        # Dual engine (wasm-vips / Pica)
│       ├── pdfEngine.js          # pdf-lib wrapper
│       ├── pdfRenderEngine.js    # pdfjs-dist wrapper (PDF → Image)
│       ├── fileUtils.js          # File I/O, Capacitor bridge
│       └── theme.js              # Design tokens
└── public/
    ├── favicon.svg
    ├── pwa-192x192.png
    └── pwa-512x512.png
```

## How it works

1. **User drops a file** → `FileReader` reads it into an `ArrayBuffer` (never leaves the browser)
2. **Image resize** → Engine auto-selects wasm-vips (if available) or Pica.js
   - wasm-vips: `Image.thumbnailBuffer()` for downscale (shrink-on-load + Lanczos3 + sharpen)
   - Pica: `pica.resize()` with quality=3 (Lanczos3, window=3) + unsharp mask
3. **Format convert** → wasm-vips: `writeToBuffer('.webp')` / Pica: Canvas `toBlob()`
4. **PDF operations** → pdf-lib runs entirely in JS, no native dependencies
5. **PDF → Image** → pdfjs-dist renders pages to canvas, exports as JPEG/PNG
6. **Save** → Browser: `URL.createObjectURL()` + `<a download>` / Capacitor: `Filesystem.writeFile()` + native Share sheet

## PWA / Offline

The app uses `vite-plugin-pwa` with Workbox to:
- Pre-cache all JS/CSS/HTML/WASM on first visit
- Cache Google Fonts with CacheFirst strategy
- Cache WASM binaries (up to 10MB) for 30 days
- Auto-update service worker in background

After first load, the app works completely offline — airplane mode, no network, etc.

## Privacy Guarantees

- **Zero network requests** after initial load (all processing is local)
- **No analytics, no tracking, no cookies**
- **No server-side processing** — files are never uploaded
- **No localStorage** of user files — everything is in-memory only
- **PWA** — installable, works offline, feels native
- **Open source** — users can verify the code

## License

MIT
