# Session Handover — 2026-03-20

## What was done
- Set up Discord channel integration (bot token, pairing, allowlist policy)
- Configured Claude Code permissions to auto-allow Discord MCP tools (no more prompts for reply/react/edit/fetch/download)
- Previous session: SEO structured data, FAQ sections, 5 blog articles, landing page polish, free limit bumped to 10 ops/day

## Key decisions
- **PH/HN launch on hold** — Vision expanded to building a comprehensive client-side tool suite beyond PDF/image before launching. More tools = stronger launch impact.
- **Free limit bumped to 10** — Less friction for users, better reception when launch eventually happens.
- **Discord DM policy set to allowlist** — Only approved senders can reach the bot.

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
