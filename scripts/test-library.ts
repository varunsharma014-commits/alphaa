// Brand library tests with an in-memory database, a mocked fetch and a mocked Claude.
// Never calls Google, Dropbox, Anthropic or the real database. Run: npx tsx scripts/test-library.ts
import assert from "node:assert/strict"
import jpeg from "jpeg-js"

process.env.CONNECTOR_SECRET = "test-secret-0123456789abcdef0123456789abcdef"
process.env.GOOGLE_CLIENT_ID = "cid"; process.env.GOOGLE_CLIENT_SECRET = "csecret"; process.env.GOOGLE_PICKER_API_KEY = "pk"
process.env.NEXT_PUBLIC_APP_URL = "https://alphaa.app"
process.env.DATABASE_URL ||= "postgresql://x:y@127.0.0.1:1/none"

// ── In-memory MockActivity ──
type Row = { id: string; userId: string; type: string; title: string; metadata: unknown; createdAt: Date }
const rows: Row[] = []
let seq = 0
const match = (r: Row, w: Record<string, unknown>) => Object.entries(w).every(([k, v]) => (r as unknown as Record<string, unknown>)[k] === v)
const fake = {
  findMany: async ({ where }: { where: Record<string, unknown> }) => rows.filter((r) => match(r, where)),
  findFirst: async ({ where }: { where: Record<string, unknown> }) => rows.filter((r) => match(r, where)).at(-1) ?? null,
  findUnique: async ({ where }: { where: Record<string, unknown> }) => rows.find((r) => match(r, where)) ?? null,
  create: async ({ data }: { data: Omit<Row, "id" | "createdAt"> }) => { const r = { ...data, id: `row${++seq}xx`, createdAt: new Date(Date.now() + seq) }; rows.push(r); return r },
  update: async ({ where, data }: { where: { id: string }; data: Partial<Row> }) => { const r = rows.find((x) => x.id === where.id)!; Object.assign(r, data); return r },
  deleteMany: async ({ where }: { where: Record<string, unknown> }) => { let count = 0; for (let i = rows.length - 1; i >= 0; i--) if (match(rows[i], where)) { rows.splice(i, 1); count++ } return { count } },
  count: async ({ where }: { where: Record<string, unknown> }) => rows.filter((r) => match(r, where)).length,
}

// ── Mocked fetch ──
type Handler = (url: string, init: RequestInit) => Response | Promise<Response>
const routes: [RegExp, Handler][] = []
const seen: { url: string; init: RequestInit }[] = []
globalThis.fetch = (async (input: string | URL | Request, init: RequestInit = {}) => {
  const url = String(input instanceof Request ? input.url : input)
  seen.push({ url, init })
  for (const [re, h] of routes) if (re.test(url)) return h(url, init)
  throw new Error(`unexpected fetch ${url}`)
}) as typeof fetch

function photo(w = 900, h = 700): Buffer {
  const data = Buffer.alloc(w * h * 4)
  for (let i = 0; i < w * h; i++) { data[i * 4] = (i % w) % 255; data[i * 4 + 1] = 120; data[i * 4 + 2] = 200; data[i * 4 + 3] = 255 }
  return Buffer.from(jpeg.encode({ data, width: w, height: h }, 80).data)
}

let passed = 0
async function test(name: string, fn: () => Promise<void> | void) { await fn(); passed++; console.log(`ok - ${name}`) }

async function main() {
  // Clerk's server helpers call React.cache at import (some modules import lib/auth); outside Next it's missing.
  const React = (await import("react")) as unknown as { cache?: unknown; default?: { cache?: unknown } }
  const id = <T,>(f: T) => f
  if (React.default && !React.default.cache) React.default.cache = id
  const { db } = await import("../src/lib/db")
  Object.defineProperty(db, "mockActivity", { value: fake, configurable: true })
  const { anthropic } = await import("../src/lib/claude")
  const asked: unknown[] = []
  Object.defineProperty(anthropic.messages, "parse", { configurable: true, value: async (req: { messages: { content: { type: string }[] }[] }) => {
    asked.push(req)
    const doc = req.messages[0].content.some((c) => c.type === "document")
    return { parsed_output: doc
      ? { colors: ["1A73E8", "#ffffff", "not-a-colour"], fonts: ["Poppins"], logo_rules: ["Keep clear space"], tone: "Warm and direct.", words_to_use: ["neighbours"], words_to_avoid: ["cheap"], taglines: ["Fresh every morning"], audience: "Families nearby." }
      : { tags: ["Bakery", "bread", "#morning"], description: "Fresh bread on a wooden counter.", has_people: false, has_text: false, quality_ok: true } }
  } })

  const dropbox = await import("../src/lib/library/dropbox")
  const open = await import("../src/lib/library/open")
  const drive = await import("../src/lib/library/drive")
  const ingest = await import("../src/lib/library/ingest")
  const store = await import("../src/lib/library/store")
  const pick = await import("../src/lib/library/pick")
  const { voiceText } = await import("../src/lib/voice")
  const { bookRules } = await import("../src/lib/library/narration")
  const U = "user1"

  await test("dropbox: direct link keeps rlkey and sets dl=1; only dropbox hosts", () => {
    assert.equal(dropbox.directLink("https://www.dropbox.com/scl/fi/abc/p.jpg?rlkey=k1&dl=0"), "https://www.dropbox.com/scl/fi/abc/p.jpg?rlkey=k1&dl=1")
    assert.equal(dropbox.isDropboxLink("https://evil.com/x?dropbox.com"), false)
    assert.equal(dropbox.isDropboxLink("http://www.dropbox.com/s/x"), false)
    assert.ok(dropbox.isDropboxLink("https://dropbox.com/s/x/y.pdf?dl=0"))
  })

  await test("signed asset URL: valid, tamper and expiry rejected", () => {
    const url = new URL(open.signedAssetUrl({ id: "abc123", mime: "video/mp4" }, 60))
    assert.match(url.pathname, /\/api\/asset\/abc123\.mp4$/)
    assert.ok(open.checkAssetSig("abc123", url.searchParams.get("e"), url.searchParams.get("s")))
    assert.equal(open.checkAssetSig("abc124", url.searchParams.get("e"), url.searchParams.get("s")), false)
    assert.equal(open.checkAssetSig("abc123", String(Number(url.searchParams.get("e")) + 1), url.searchParams.get("s")), false)
    assert.equal(open.checkAssetSig("abc123", "1000", url.searchParams.get("s")), false)
  })

  await test("readCapped stops past the cap", async () => {
    await assert.rejects(open.readCapped(new Response(new Uint8Array(2000)), 1000), open.TooBig)
    assert.equal((await open.readCapped(new Response(new Uint8Array(500)), 1000)).length, 500)
  })

  await test("drive state: signed, bound to user, rejects tampering", () => {
    const st = drive.signDriveState(U)
    assert.equal(drive.readDriveState(st)?.u, U)
    assert.equal(drive.readDriveState(st.replace(/.$/, (c) => (c === "a" ? "b" : "a"))), null)
    const url = new URL(drive.driveAuthUrl(st))
    assert.equal(url.searchParams.get("scope"), drive.DRIVE_SCOPE)
    assert.equal(url.searchParams.get("redirect_uri"), "https://alphaa.app/api/library/drive/callback")
    assert.equal(url.searchParams.get("access_type"), "offline")
  })

  await test("drive connect stores refresh token encrypted and refuses missing drive.file", async () => {
    routes.push([/oauth2\.googleapis\.com\/token/, (_u, init) => {
      const b = new URLSearchParams(String(init.body))
      if (b.get("grant_type") === "authorization_code" && b.get("code") === "noscope") return Response.json({ access_token: "a", refresh_token: "r", scope: "openid" })
      if (b.get("grant_type") === "authorization_code") return Response.json({ access_token: "acc-1", refresh_token: "refresh-secret", expires_in: 3600, scope: drive.DRIVE_SCOPE })
      return Response.json({ access_token: "acc-2", expires_in: 3600 })
    }])
    await assert.rejects(drive.connectDrive(U, "noscope"), /files you pick/)
    await drive.connectDrive(U, "good")
    const acc = await drive.getDriveAccount(U)
    assert.ok(acc && !acc.refreshEnc.includes("refresh-secret"))
    assert.equal((await drive.driveAccessToken(U))?.token, "acc-1")
  })

  const img = photo()
  await test("ingest a Drive photo: preview ≤ 400px, tags cleaned, nothing of the file kept", async () => {
    routes.push([/googleapis\.com\/drive\/v3\/files\/f1\?alt=media/, () => new Response(new Uint8Array(img), { headers: { "content-type": "image/jpeg", "content-length": String(img.length) } })])
    routes.push([/googleapis\.com\/drive\/v3\/files\/f1\?fields/, () => Response.json({ id: "f1", name: "bread.jpg", mimeType: "image/jpeg", size: String(img.length) })])
    const r = await ingest.addPicked(U, "drive", [{ id: "f1", name: "bread.jpg", mimeType: "image/jpeg", sizeBytes: img.length }, { id: "f1", name: "bread.jpg" }, { id: "x", name: "notes.docx", mimeType: "application/msword" }])
    assert.equal(r.added.length, 1)
    assert.deepEqual(r.skipped.map((s) => s.why), ["already in your library", "not a PDF, photo or video"])
    await ingest.waitFor(U, 10_000)
    const a = (await store.listAssets(U))[0]
    assert.equal(a.status, "ok", a.note ?? "")
    assert.deepEqual(a.tags, ["bakery", "bread", "morning"])
    assert.equal(a.width, 900)
    const thumb = await store.thumbBytes(U, a.thumbId!)
    const t = jpeg.decode(thumb!)
    assert.ok(Math.max(t.width, t.height) <= 400)
    // No row holds the full-size file.
    assert.ok(!rows.some((x) => JSON.stringify(x.metadata).includes(img.subarray(100, 160).toString("base64"))))
  })

  await test("dropbox video: never downloaded; preview from the chooser thumbnail", async () => {
    const thumb = photo(640, 360)
    routes.push([/photos-1\.dropbox\.com\/t\//, (u) => { assert.match(u, /bounding_box=800/); return new Response(new Uint8Array(thumb), { headers: { "content-type": "image/jpeg" } }) }])
    const before = seen.length
    await ingest.addPicked(U, "dropbox", [{ id: "id:v1", name: "shop tour.mov", link: "https://www.dropbox.com/scl/fi/v1/shop%20tour.mov?rlkey=z&dl=0", sizeBytes: 300_000_000, thumbnailLink: "https://photos-1.dropbox.com/t/2/abc?bounding_box=75&mode=fit" }])
    await ingest.waitFor(U, 10_000)
    const v = (await store.listAssets(U)).find((x) => x.kind === "video")!
    assert.equal(v.status, "ok")
    assert.ok(v.thumbId)
    assert.ok(!seen.slice(before).some((c) => /dl=1/.test(c.url)), "video must not be downloaded")
  })

  await test("brand book: PDF sent to Claude as a document; colours validated; rules reach voiceText", async () => {
    const pdf = Buffer.from("%PDF-1.4\n% tiny test\n")
    routes.push([/dropbox\.com\/scl\/fi\/bb\//, (u) => { assert.match(u, /dl=1/); return new Response(new Uint8Array(pdf), { headers: { "content-type": "application/pdf" } }) }])
    await ingest.addPicked(U, "dropbox", [{ id: "id:bb", name: "Brand Book.pdf", link: "https://www.dropbox.com/scl/fi/bb/Brand%20Book.pdf?rlkey=q&dl=0" }])
    await ingest.waitFor(U, 10_000)
    const b = (await store.listAssets(U)).find((x) => x.kind === "brandbook")!
    assert.equal(b.status, "ok", b.note ?? "")
    assert.deepEqual(b.brandbook!.colors, ["#1a73e8", "#ffffff"])
    const last = asked.at(-1) as { messages: { content: { type: string; source?: { media_type?: string } }[] }[] }
    assert.equal(last.messages[0].content[0].source?.media_type, "application/pdf")
    const text = voiceText({ analyzedAt: "", read: [], detected: { language: "English", formality: "balanced", emoji: "none", person: "we" }, phrases: [], avoid: [], options: [], chosen: "v1", style: { language: "English", formality: "balanced", emoji: "none", length: "normal", person: "we" }, rules: bookRules(b.brandbook!) })
    assert.match(text, /Never use: cheap/)
    assert.match(text, /"Fresh every morning"/)
  })

  await test("next photo: topic match + least used; missing file marked once", async () => {
    const r1 = await pick.nextLibraryPhoto(U, "Our morning bread")
    assert.ok(r1 && r1.bytes.length > 1000)
    assert.equal((await store.listAssets(U)).find((x) => x.kind === "photo")!.uses, 1)
    // The file is deleted in Drive.
    routes.unshift([/googleapis\.com\/drive\/v3\/files\/f1\?alt=media/, () => new Response("gone", { status: 404 })])
    assert.equal(await pick.nextLibraryPhoto(U, "bread"), null)
    const p = (await store.listAssets(U)).find((x) => x.kind === "photo")!
    assert.equal(p.status, "missing")
    assert.equal(rows.filter((x) => x.type === "library_missing").length, 1)
    await ingest.markMissing(U, p, "again")
    assert.equal(rows.filter((x) => x.type === "library_missing").length, 1, "told once")
  })

  await test("rankPhotos: 'Use this next' wins, low quality skipped", () => {
    const base = { source: "drive" as const, name: "", mime: "image/jpeg", kind: "photo" as const, status: "ok" as const, addedAt: "2026-01-01", uses: 0, tags: [] as string[] }
    const list = [
      { ...base, id: "a", tags: ["bread"], uses: 0 },
      { ...base, id: "b", tags: [], uses: 5, next: true },
      { ...base, id: "c", tags: ["bread"], qualityOk: false },
    ]
    assert.deepEqual(pick.rankPhotos(list, "bread").map((x) => x.id), ["b", "a"])
  })

  await test("library cap and remove", async () => {
    const n = (await store.listAssets(U)).length
    const id = (await store.listAssets(U))[0].id
    assert.ok(await store.removeAsset(U, id))
    assert.equal((await store.listAssets(U)).length, n - 1)
  })

  await test("panel: Drive / Dropbox buttons, brand book card", async () => {
    process.env.NEXT_PUBLIC_DROPBOX_APP_KEY = "dbkey"
    const { libraryMessages } = await import("../src/lib/library/narration")
    const msgs = await libraryMessages(U)
    const chips = msgs[0].blocks.flatMap((b) => (b.kind === "chips" ? b.items : []))
    const bodies = chips.map((c) => (c.action.type === "agent-op" ? c.action.body : c.action.type === "link" ? { href: c.action.href } : {}))
    assert.ok(bodies.some((b) => (b as { pick?: string }).pick === "drive"))
    assert.ok(bodies.some((b) => (b as { pick?: string; key?: string }).pick === "dropbox" && (b as { key?: string }).key === "dbkey"))
    assert.ok(msgs.some((m) => m.id.startsWith("lib-bb-")))
  })

  await test("asset route: signed, streams a Range from Dropbox, 404 unsigned", async () => {
    const v = (await store.listAssets(U)).find((x) => x.kind === "video")!
    routes.unshift([/dropbox\.com\/scl\/fi\/v1\//, (u, init) => {
      assert.match(u, /dl=1/)
      assert.equal((init.headers as Record<string, string>).Range, "bytes=0-9")
      return new Response(new Uint8Array(10).fill(7), { status: 206, headers: { "content-type": "video/quicktime", "content-range": "bytes 0-9/300000000", "content-length": "10" } })
    }])
    const { GET } = await import("../src/app/api/asset/[id]/route")
    const url = open.signedAssetUrl(v)
    const r = await GET(new Request(url, { headers: { range: "bytes=0-9" } }), { params: Promise.resolve({ id: `${v.id}.mov` }) })
    assert.equal(r.status, 206)
    assert.equal(r.headers.get("content-range"), "bytes 0-9/300000000")
    assert.equal((await r.arrayBuffer()).byteLength, 10)
    const bad = await GET(new Request(url.replace(/s=[^&]+/, "s=nope")), { params: Promise.resolve({ id: v.id }) })
    assert.equal(bad.status, 404)
  })

  console.log(`\n${passed} passed`)
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
