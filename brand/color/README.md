# Alphaa brand kit: colour system (2026-11-26)

Replaces the black & white kit in `brand/mono/` (retired; kept only for images that were already posted).
Source of truth is the live site and dashboard:
- **Mark:** the orb, a conic gradient `#5ac8fa → #0071e3 → #af52de → #ff2d55 → #ff9500 → #5ac8fa` from 12 o'clock, clockwise (`.ax-orb` in `src/app/(dashboard)/workspace.css`, `.v3-orb` in `src/components/marketing/v3/v3.css`). It turns slowly in the site header; everywhere else it is static.
- **Wordmark:** lowercase `alphaa`, heavy weight (800 on the site, Inter Bold in the SVG lockup), tracking -0.03em, ink `#111114`.
- **Tones** (the homepage service pills, `v3.css`): Social media pink `#e8457a` (tint `#fff0f4`, soft `#ffd6e2`), Ads blue `#2f6fde` (`#eef4ff`, `#d4e3ff`), Content yellow `#b07a00` (`#fffaeb`, `#ffedb3`), SEO & AI search green `#1f9d55` (`#effaf3`, `#c9efd8`), Email purple `#7a4fd6` (`#f5f0ff`, `#e1d4ff`). Ink `#111114`, white, and the final-CTA / savings gradients (pastel corner blobs over a pink → purple → blue tint; pink → purple → blue → green text gradient).
- **Type:** the system sans (SF Pro on Apple, Inter elsewhere), big tight headlines (800, -0.045em).

**Rules:** text, typography and gradient art only. No stock, web-sourced or AI photos, no people (see `~/growth-ops/rules/legal-safety.md`). Social post images keep the 4-5 word headline rule (`~/growth-ops/rules/social_post_rules.md`). Label any example answer or agent message "Example".

## Files

| File | Use |
|---|---|
| `logo/alphaa-orb.svg`, `logo/alphaa-orb-{512,900,1024}.png` | Orb mark, transparent |
| `logo/alphaa-orb-on-white.svg`, `logo/alphaa-orb-on-white-{512,900,1024}.png` | Orb on white (app icons, listings) |
| `logo/alphaa-orb-on-white-900-small.png` | Under 50KB, for marketplace forms with a size cap |
| `logo/alphaa-lockup.svg/.png`, `-on-white.png`, `-white-ink.svg/.png` | Orb + wordmark (light backgrounds / dark backgrounds) |
| `covers/alphaa-avatar-1080.png` | Social profile picture (orb centred, safe for circle crops) |
| `covers/alphaa-linkedin-cover-1128x191.png`, `-4200x700.png` | LinkedIn page cover (text starts at 300px: the page logo overlaps bottom-left) |
| `covers/alphaa-facebook-cover-1640x624.png` | Facebook page cover (content inside the centre 1000x460: phones crop the sides) |
| `covers/alphaa-x-header-1500x500.png` | X header (content right of centre, clear of the avatar and the top/bottom crop) |
| `covers/alphaa-newsletter-logo-512.png` | LinkedIn newsletter logo ("The Answer") |
| `covers/alphaa-newsletter-cover-example-1920x1080.png` | Example of the article / newsletter cover template |
| `../social/base-color.css` | Base stylesheet for post images: `body.p` 1080x1350, `body.sq` 1080x1080, `body.x` 1600x900; tone class `t-mk / t-ad / t-ct / t-se / t-em`; `.orb`, `.brand`, `.tag`, `.panel`, `.pill` |
| `preview.png` | Everything on one sheet |

## Make

```
node brand/color/make.mjs              # orb, lockup, avatar, covers, preview.png
node brand/color/make-site-icons.mjs   # favicon.ico, icon.png, apple-icon.png, public/logo.png, the /og orb
python3 brand/social/posts/build.py    # social post images (colour) into brand/social/posts/color/
```

Article / LinkedIn newsletter cover (1920x1080, text only):

```
node brand/color/render-cover.mjs --title "How dentists get recommended by AI" \
  --kicker "The Answer · Issue 5" --sub "One short line." --tone se \
  --out brand/social/newsletter/2026-12-01-dentists.png
```

Tones: `mk` pink, `ad` blue (default), `ct` yellow, `se` green, `em` purple.

Generators: `orb.mjs` (orb as SVG wedges, so sharp/resvg can draw it; the app's twin is `src/lib/brand-orb.ts`), `chrome.mjs` (headless Chrome screenshots, needs Google Chrome in /Applications), HTML in `src/`.
