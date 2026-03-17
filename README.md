# ZeroUpload

[![Build](https://github.com/cybermax-008/zeroupload/actions/workflows/build.yml/badge.svg)](https://github.com/cybermax-008/zeroupload/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Private PDF & image tools that run entirely on your device.**

No uploads. No servers. No tracking. Every operation happens in your browser — your files never leave your machine.

## Why ZeroUpload?

Most online file tools upload your documents to remote servers for processing. ZeroUpload takes a different approach: **everything runs locally** using WebAssembly and browser APIs. This means:

- Your files stay on your device — always
- Works offline after first load (PWA)
- No accounts, no sign-ups, no cookies
- You can verify the code yourself — it's all here

## Tools

**Image Tools**
- **Resize** — Scale images to exact dimensions or presets
- **Compress** — Reduce file size with quality control
- **Convert** — PNG, JPG, WebP, AVIF, and more
- **Crop** — Select and export a region

**PDF Tools**
- **Merge** — Combine multiple PDFs into one
- **Split** — Extract specific pages
- **Compress** — Reduce PDF file size
- **Rotate** — Fix page orientation
- **Watermark** — Add text watermarks
- **Page Numbers** — Add page numbering
- **Image to PDF** — Combine images into a PDF
- **PDF to Image** — Convert pages to JPEG or PNG

## Run Locally

Requires **Node.js 20+** (see `.nvmrc`).

```bash
git clone https://github.com/cybermax-008/zeroupload.git
cd zeroupload
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — that's it. All tools work immediately.

### Build for Production

```bash
npm run build     # Output → dist/
npm run preview   # Preview the build locally
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, your own server, etc.).

## Image Processing Engine

ZeroUpload uses a dual-engine system that auto-selects the best available option:

| Engine | Powered by | When it activates |
|--------|-----------|-------------------|
| **wasm-vips** | libvips (same as Sharp) | When `SharedArrayBuffer` is available |
| **Pica.js** | Lanczos3 resampling | Automatic fallback otherwise |

Both engines produce high-quality results. wasm-vips gives you professional-grade processing (AVIF/TIFF support, smart sharpening); Pica.js works everywhere with zero setup.

> **Note:** For wasm-vips to activate, your server must send `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` headers. The dev server includes these automatically. Without them, Pica.js kicks in — still great quality, just fewer format options.

## Self-Hosting

If you're deploying to your own server, add these headers for the best experience:

**Nginx**
```nginx
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
```

**Vercel** (`vercel.json`)
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

**Netlify / Cloudflare Pages** (`_headers`)
```
/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
```

## Tech Stack

- **React 18** + **Vite** — Fast dev experience, optimized builds
- **wasm-vips** — WebAssembly port of libvips for image processing
- **Pica.js** — Lightweight image resize fallback
- **pdf-lib** — PDF manipulation in pure JavaScript
- **pdfjs-dist** — PDF rendering to canvas
- **vite-plugin-pwa** — Offline support via Workbox service worker
- **Capacitor** — Optional iOS/Android packaging

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md) code of conduct.

## License

[MIT](LICENSE)
