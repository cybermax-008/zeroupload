# Session Handover — 2026-03-19

## What was done
- **SEO routing**: React Router with 15 dedicated routes (`/compress-pdf`, `/resize-image`, etc.), each with unique title, meta description, canonical URL, OG tags. Added `robots.txt`, `sitemap.xml`, Vercel SPA rewrites, PWA `navigateFallback`
- **Homepage redesign**: Split PDF Toolkit into 9 individual tool cards. Added privacy comparison section (flow diagrams: typical tools vs Acorn Tools). Added trust signal cards for legal, healthcare, finance audiences
- **Footer redesign**: Self-host callout card with `npm install && npm run dev`, "View on GitHub" button, cleaner layout
- **Light/dark mode**: CSS custom properties for all theme colors. Toggle in header, persists to localStorage, respects OS preference, no-flash inline script. Cleaned up hardcoded rgba colors across 8 components
- **UX audit + fixes**: Fixed light mode contrast (WCAG AA), added `prefers-reduced-motion`, aria-labels on interactive elements, usage counter tooltip, generic license placeholder, `min=0` on NumInputs, responsive layout for small phones, bigger toggle touch targets, inline page range validation, scroll-to-top on PDF mode switch
- **Engine reliability**: Fixed wasm-vips never working in production (Vite content-hashing broke WASM resolution). Added `copyVipsWasm` build plugin. Service worker `skipWaiting` + `clientsClaim`. 30s init timeout. Graceful vips-to-Pica fallback on any failure
- **Service worker migration**: Auto-reload on `controllerchange` event. Removed PNG from compress tool (was inflating files)

## Key decisions
- **CSS custom properties for theming** — All colors are `var(--at-xxx)` so existing component code works without changes. Light/dark defined in `:root` / `[data-theme="light"]`. Theme toggle in header, not settings page.
- **Vite plugin for WASM** — `copyVipsWasm()` copies unhashed `vips.wasm` to `dist/assets/` alongside the hashed version. wasm-vips resolves filenames at runtime via `import.meta.url` and needs the original name.
- **Dual-engine fallback is essential** — All vips operations (resize, compress, convert, crop) now catch errors and fall through to Pica/Canvas. Never let a vips failure kill the operation.
- **SW migration is hard** — Old SW serves old `index.html`, creating a chicken-and-egg problem. `controllerchange` listener + `skipWaiting` handles it but takes 1-2 visits to propagate. Accepted trade-off.

## In progress / incomplete
- Service worker migration: users with stale SWs need 1-2 visits to fully update. No action needed — it self-heals.

## Next steps
1. **PDF redaction tool** — High-value for compliance audience (lawyers, healthcare, finance). Strong SEO term. Natural pro upsell.
2. **Batch processing** — Another pro upsell lever. Users hitting the 5-op limit on individual files would definitely hit it with batch.
3. **Feedback section** — Quick win from user testing. Builds trust.
4. **Content marketing** — Blog posts targeting compliance-conscious users (HIPAA, GDPR angle)
5. **Browser extension** — Chrome/Firefox, right-click processing
6. **ProductHunt / HN launch** — Time with polished landing page + gating in place

## Gotchas / things to watch
- **wasm-vips on WebKit**: Works on iOS (Safari, Dia, Arc) but may need SW cache flush after deploys. Chrome always works.
- **Service worker caching**: `skipWaiting` + `clientsClaim` + `controllerchange` listener handle updates, but first-time migration from a stale SW takes 1-2 page loads.
- **Vercel SPA rewrite catch-all** masks missing assets with HTML (200 + `index.html` instead of 404). Any dynamically-loaded asset must exist in the build output with the exact expected filename.
- **Light mode contrast**: Adjusted colors pass WCAG AA but may need further tuning based on user feedback.
- Engineering lessons documented in `memory/feedback_lessons.md` — keep updating as issues arise.
