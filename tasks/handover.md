# Session Handover — 2026-03-19

## What was done
- Renamed ZeroUpload → Acorn Tools across all 17 files (code, configs, docs, URLs)
- Updated GitHub repo: new name `Acorn-tools`, description, 10 topics, homepage URL, social preview image, OG/Twitter meta tags
- Built usage gating system: 5 free operations/day, tracked in localStorage, resets at midnight
- Integrated Stripe Payment Link ($6.99 one-time lifetime) with redirect-based pro activation
- Added persistent "Go Pro — $6.99" button in header, Free vs Pro pricing comparison cards on home page
- Contextual paywall modal: shows "Go Pro" copy when user clicks upgrade, "Daily limit reached" when gate blocks
- License key system: Stripe session ID serves as license key, shown after payment with copy button
- Restore Purchase flow: modal to paste license key, verified via Vercel serverless function (`/api/verify-license`) calling Stripe API
- "Restore Purchase" link in paywall modal and footer
- Created `vercel.json` with COOP/COEP headers
- Capacitor builds bypass gate entirely (native app purchase = pro)

## Key decisions
- **Client-side gating with Stripe Payment Links** — no accounts, no backend auth. Gate is a soft honesty system, not DRM. Acceptable because privacy-first positioning means minimal infrastructure.
- **Stripe session ID as license key** — avoids building a separate key generation system. Session IDs are long but verifiable via Stripe API. Receipt email serves as backup.
- **Vercel serverless function for verification** — single `/api/verify-license` endpoint, ~30 lines. Only called during restore, not on every use. Requires `STRIPE_SECRET_KEY` env var on Vercel.
- **Gate at processing time, not tool browsing** — users can explore all tools freely, gate only triggers when they click process/export. Maximizes perceived value before friction.
- **Stayed with Stripe** instead of switching to Lemon Squeezy. Stripe fees are lower ($0.50 vs $0.85 per sale), but no Merchant of Record — user handles tax compliance.

## Next steps
1. **Test full payment flow in Stripe live mode** — test card works, need to verify live payments
2. **SEO landing pages** — add React Router, create per-tool routes (`/compress-pdf`, `/resize-image`) with meta tags. This is the #1 growth lever.
3. **More tools** — PDF redaction (big for compliance audience), batch processing (natural upsell for pro)
4. **Landing page redesign** — "safe default" positioning with comparison diagram (iLovePDF vs Acorn Tools)
5. **Content marketing** — blog posts targeting compliance-conscious users (lawyers, healthcare, finance)
6. **Browser extension** — Chrome/Firefox extension for right-click processing
7. **ProductHunt / HN launch** — time with polished landing page + gating in place

## Gotchas / things to watch
- `STRIPE_SECRET_KEY` must be set in Vercel environment variables for license verification to work
- Stripe Payment Link success URL is `https://www.acorntools.net?session_id={CHECKOUT_SESSION_ID}`
- 100% promo code payments may not send Stripe receipt emails — users rely on the in-app license key display
- `vercel.json` sets COOP/COEP headers — needed for wasm-vips SharedArrayBuffer support
- Pro status in localStorage can be lost if user clears browser data — Restore Purchase flow is the recovery mechanism
- The Stripe Payment Link URL is hardcoded in `src/lib/usageGate.js` — update if you regenerate the link
