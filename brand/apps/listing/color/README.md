# App listing images: colour system (2026-11-27)

Replaces the blue (`../f.png`, `../s*.png`, `../wf-*.png`, `../webflow-1280/*.png`) and black & white (`../mono/`, `../webflow-1280/mono/`) sets. Those stay in the repo only as the record of what was uploaded before; upload these instead. Nothing here has been uploaded to any marketplace (the Shopify listing is locked while it is in review).

| Marketplace | Files | Size |
|---|---|---|
| Shopify App Store | `shopify/alphaa-shopify-feature.png` (feature image), `shopify/alphaa-shopify-1-ai-answers.png`, `-2-social.png`, `-3-content.png`, `-4-email.png` (screenshots) | 1600x900 PNG. **No prices on any image** (plans live in Shopify's own pricing section; Shopify-billed stores don't get the 90-day guarantee, so it isn't mentioned) |
| Webflow Marketplace | `webflow/alphaa-webflow-1.png` … `-4.png` (4 = plans: Starter $99, Pro $499, Growth $799 early access) | 1280x846 PNG |
| App icons (Shopify, Webflow, Canva, Wix) | `icons/alphaa-icon-{1200,900,512,256}.png` (orb on white) | 900px is under 50KB for the Webflow form |

Product screenshots are the NEW dashboard, taken from the dev-only `/preview?ws=…` pages (sample data, never a real account), labelled "EXAMPLE DATA". The ads page is left out while ads are in early access.

Rebuild:
```
npx next dev -p 3218                        # in the alphaa repo
node brand/apps/listing/color/shoot.mjs     # dashboard shots -> src/shots/
node brand/apps/listing/color/make.mjs      # frames, icons, ../preview-color.png
```
Copy rules: today's truth only (Starter $99 = AI search; Pro $499 = everything except ads; Growth $799 = + Google or Meta ads, early access), social = "ready to publish in one tap", no invented numbers, no stock/AI photos, no people.
