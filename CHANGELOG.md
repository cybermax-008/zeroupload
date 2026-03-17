# Changelog

## 1.0.0 — 2025-03-16

Initial open-source release.

### Image Tools
- Resize — scale to exact dimensions or presets
- Compress — reduce file size with quality control
- Convert — PNG, JPG, WebP, AVIF format conversion
- Crop — select and export a region

### PDF Tools
- Merge — combine multiple PDFs
- Split — extract specific pages
- Compress — reduce PDF file size
- Rotate — fix page orientation
- Watermark — add text watermarks
- Page Numbers — add page numbering
- Image to PDF — combine images into a PDF
- PDF to Image — convert pages to JPEG or PNG

### Architecture
- Dual image engine: wasm-vips (primary) + Pica.js (fallback)
- PDF processing via pdf-lib and pdfjs-dist
- PWA with full offline support
- Capacitor support for iOS/Android builds
