# Session Handover — 2026-03-29

## What was done

### SEO Overhaul
- Created `src/lib/toolContent.js` with 2-3 rich content sections per tool page (300-500 words each)
- Updated `ToolPage.jsx` to render content sections, related tools grid, and visible breadcrumbs
- Optimized all 16 route titles/descriptions for "without uploading" long-tail keywords
- Added 5 new blog articles targeting high-volume how-to queries (compress PDF without Adobe, remove EXIF data, PNG vs JPG vs WebP, merge PDF no software, redact PDF free)
- Added full tool link bar and semantic breadcrumbs to `BlogArticlePage.jsx`
- Sitemap grew from 23 to 29 indexed URLs

### Homepage Redesign (PDFPea-inspired)
- Replaced StatsBar with a hero section (headline + benefit pills)
- Added "Why Choose Acorn Tools" section with 6 benefit cards
- Flow: Hero > Tool Grid > Why Choose > Privacy Comparison > Trust Signals > Tech Stack

### PDF Editor (new tool)
- Built full PDF editor at `/edit-pdf` matching PDFPea's architecture
- pdfjs-dist renders pages to canvas, DOM overlays for interactive elements
- react-moveable for drag/resize with 8-direction handles
- pdf-lib burns overlays into exported PDF with coordinate mapping
- Tools: Select, Text, Rectangle, Highlight, White-out, Image
- Properties panel with font/color/opacity controls
- Code-split react-moveable into its own chunk (lazy-loaded)

### Bug Fixes
- Fixed COOP/COEP headers: applied to all routes (was only on tool routes, causing Pica fallback on homepage entry)
- Fixed DropZone API mismatch in PDF editor (`onFiles` not `onFile`)
- Fixed PDF editor blank screen on mobile: race condition in canvas mounting, added auto render scale, auto-fit zoom, loading feedback

### X Post
- Logged posted tweet about PDF editor launch to `tasks/x-posts.md`

## Key decisions
- COOP/COEP headers now apply to ALL routes (`/(.*)`), not just tool routes. No external resources that would break. This ensures wasm-vips loads regardless of entry page.
- PDF editor uses DOM overlay approach (not canvas drawing) — matches PDFPea. Elements are positioned as absolute divs over the rendered canvas.
- Render scale is adaptive: 1.0 on phones, 1.25 on tablets, 1.5 on desktop to avoid mobile memory issues.
- react-moveable is code-split into its own chunk (~244KB) so it only loads when the editor is used.

## Next steps
- Test PDF editor thoroughly on mobile (was broken, fix deployed but not verified)
- Add freehand drawing tool to PDF editor (SVG path approach, like PDFPea's FreehandDrawing.js)
- Add circle tool and line tool to PDF editor
- Consider Google Search Console setup + sitemap submission
- Monitor Core Web Vitals after the SEO changes
- Write more long-tail blog content based on search query data

## Gotchas / things to watch
- The PDF editor's canvas mount uses a retry loop (up to 2s). If a very slow device takes longer, pages may still not render. Monitor for reports.
- `pdfjs-dist` transfers ArrayBuffers to its worker — always use `bytes.slice(0)` when sharing a buffer between pdfjs and pdf-lib (existing pattern, applies to the new editor too).
- The module-level `nextId` counter in PdfEditorTab resets on hot reload in dev but not on navigation. Not a bug in prod but can cause duplicate IDs in dev.
- COOP/COEP is now global — if you ever add external embeds (YouTube, analytics scripts, cross-origin fonts), they'll need `crossorigin` attributes or the headers will need to be re-scoped.
