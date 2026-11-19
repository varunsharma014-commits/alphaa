// Logo detection checks (lib/brand-logo.ts; no network, no database). Run: npx tsx scripts/test-brand-kit.ts
import assert from "node:assert/strict"


async function main() {
  const { pickLogo, logoCandidates } = await import("../src/lib/brand-logo")

  // 1. alphaa.app-style page: no header img, a client-logo strip, schema Organization.logo.
  const alphaa = `<html><head>
    <link rel="icon" href="/favicon.ico" sizes="16x16"><link rel="icon" href="/icon.png" sizes="512x512">
    <link rel="apple-touch-icon" href="/apple-icon.png" sizes="180x180">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Alphaa","logo":"https://alphaa.app/logo.png"}</script>
  </head><body><header><a href="/"><svg></svg>Alphaa</a></header>
    <section class="case-studies"><div class="row">
      <img src="/clients/issuance-express.png" alt="Issuance Express logo">
      <img src="/clients/acme.png" alt="Acme logo"><img src="/clients/b.png" alt="Beta Co logo">
    </div></section></body></html>`
  assert.equal(pickLogo(alphaa, "alphaa.app", "Alphaa"), "https://alphaa.app/logo.png")

  // 2. Header logo linked home beats an earlier off-site partner logo.
  const header = `<body><div class="partners"><img src="https://cdn.other.com/partner-logo.png" alt="Partner Inc logo"></div>
    <header class="site-header"><a href="https://www.joesplumbing.com/"><img src="/wp-content/uploads/jp-mark.svg" alt="Joe's Plumbing"></a></header></body>`
  assert.equal(pickLogo(header, "https://www.joesplumbing.com", "Joe's Plumbing"), "https://www.joesplumbing.com/wp-content/uploads/jp-mark.svg")

  // 3. Only a client strip and an apple-touch icon: the icon wins, never the client's logo.
  const strip = `<head><link rel="apple-touch-icon" href="/touch.png"></head><body>
    <div class="trusted-by"><img src="/a.png" alt="Issuance Express logo"><img src="/b.png" alt="Other logo"><img src="/c.png" alt="Third logo"></div></body>`
  assert.equal(pickLogo(strip, "https://example.com", "Example Studio"), "https://example.com/touch.png")

  // 4. Builder CDN logo (Wix) with the brand in the file name is fine.
  const wix = `<body><header><a href="/"><img src="https://static.wixstatic.com/media/abc_bloom-logo.png" alt="logo"></a></header></body>`
  assert.equal(pickLogo(wix, "bloomflowers.ca", "Bloom Flowers"), "https://static.wixstatic.com/media/abc_bloom-logo.png")

  // 5. A hero photo in the header is not a logo.
  const hero = `<head><link rel="icon" href="/icon-192.png" sizes="192x192"></head><body><header><img src="/hero.jpg" alt="Our team at work"></header></body>`
  assert.equal(pickLogo(hero, "https://shop.test", "Shop"), "https://shop.test/icon-192.png")

  // 6. Schema logo of another organization (e.g. a review widget) loses to the site's header logo.
  const other = `<head><script type="application/ld+json">{"@type":"Organization","name":"ReviewWidget Ltd","logo":"https://reviewwidget.com/logo.png"}</script></head>
    <body><nav><a href="/"><img src="/img/logo.png" alt="Maple Dental"></a></nav></body>`
  assert.equal(pickLogo(other, "mapledental.com", "Maple Dental"), "https://mapledental.com/img/logo.png")

  assert.equal(pickLogo("<body></body>", "x.com"), null)
  assert.ok(logoCandidates(alphaa, "alphaa.app", "Alphaa").some((c) => c.url.endsWith("issuance-express.png") ? false : true))
  console.log("brand-kit logo checks: ok")
}
main().catch((e) => { console.error(e); process.exit(1) })
