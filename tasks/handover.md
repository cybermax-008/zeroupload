# Session Handover — 2026-03-20

## What was done
- Added 2 more blog articles: legal/NDA compliance, SOX/finance compliance (5 articles total)
- Added JSON-LD structured data on all pages (WebApplication, SoftwareApplication, FAQPage, BreadcrumbList)
- Added collapsible FAQ sections to every tool page (3-4 questions each targeting common search queries)
- Polished landing page for launch: stats bar, "Under the hood" tech section, trust signals linked to blog articles
- Bumped free daily limit from 5 to 10 operations
- Drafted Show HN and ProductHunt launch copy (not posted — launch on hold)

## Key decisions
- **PH/HN launch on hold** — Vision expanded to building a comprehensive client-side tool suite beyond PDF/image before launching. More tools = stronger launch impact.
- **Free limit bumped to 10** — Less friction for users, better reception when launch eventually happens.

## Next steps
1. **Plan and prioritize new tool categories** — Candidate tools:
   - High value: JSON/CSV/XML formatter, Base64/URL encode-decode, hash generator, password generator, diff tool, QR code
   - WASM-powered: video compression (FFmpeg), audio trimmer, video to GIF, SVG optimizer
   - Utility: ZIP/unzip, word counter, regex tester, color converter, Markdown to HTML
2. **Build new tool categories** — Implement prioritized tools
3. **Browser extension** — Chrome/Firefox right-click processing
4. **Launch** — PH, HN, Reddit once tool suite is comprehensive

## Gotchas / things to watch
- New tool categories will need new sections in the homepage grid, new route entries, and potentially new engine files
- Blog article content is plain strings — no inline markdown parsing. If bold/links needed in article body, a parser would need to be added
- Sitemap is static — must be manually updated for new routes
- FAQ data lives in `routes.js` alongside route config (not a separate file)
