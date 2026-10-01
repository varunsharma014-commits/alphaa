#!/usr/bin/env node
// Ping IndexNow (Bing, Yandex, Seznam, Naver…) about new or updated URLs.
//
//   node scripts/indexnow.mjs https://alphaa.app/blog/<slug> [more urls…]
//
// The key is public by design: it is verified against
// https://alphaa.app/24fbcf1a3b054f9bb7d34ccdd951e113.txt
const HOST = "alphaa.app"
const KEY = "24fbcf1a3b054f9bb7d34ccdd951e113"

const urls = process.argv.slice(2).map((u) => (u.startsWith("/") ? `https://${HOST}${u}` : u))
if (!urls.length) {
  console.error("usage: node scripts/indexnow.mjs <url...>")
  process.exit(1)
}
const bad = urls.filter((u) => {
  try {
    return new URL(u).host !== HOST
  } catch {
    return true
  }
})
if (bad.length) {
  console.error(`indexnow: every URL must be on https://${HOST}. Rejected: ${bad.join(", ")}`)
  process.exit(1)
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
})
const text = await res.text().catch(() => "")
// 200 = accepted, 202 = accepted (key validation pending). Anything else is a failure.
if (res.status === 200 || res.status === 202) {
  console.log(`indexnow: ${res.status} accepted ${urls.length} URL(s)`)
  for (const u of urls) console.log(`  ${u}`)
} else {
  console.error(`indexnow: HTTP ${res.status} ${text.slice(0, 300)}`)
  process.exit(1)
}
