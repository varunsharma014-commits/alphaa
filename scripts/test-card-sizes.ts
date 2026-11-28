// Renders every social image size × every card style (+ the house style) and the photo overlay in
// every size to PNG/JPEG files, checks their pixel sizes and that nothing but background sits in
// the 9:16 safe zones (top 250px / bottom 340px), and picks the size per platform.
// No database, no network, no AI. Run: npx tsx scripts/test-card-sizes.ts [outDir]
// Then LOOK at the files (they're written to outDir, default ./tmp-card-sizes).
import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { Resvg } from "@resvg/resvg-js"
import jpeg from "jpeg-js"
import * as React from "react"
import { captionCut, formatForPlatform, IMAGE_FORMATS, OUT_PX, STORY_SAFE, type ImageFormat } from "../src/lib/image-formats"

// social-card → brand-kit → … → lib/auth uses React's server-only cache(); outside Next a pass-through is enough.
const react = ((React as unknown as { default?: object }).default ?? React) as { cache?: unknown }
if (typeof react.cache !== "function") react.cache = <T,>(f: T) => f

const out = process.argv[2] || path.join(process.cwd(), "tmp-card-sizes")
const brand = { logo: null, primary: "#0b6e4f" }
const HEADLINE = "Fix your leaking tap today"

/** A synthetic "photo" (gradients + shapes, drawn here; never a stock or web image). */
function fakePhoto(w: number, h: number): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fc5e8"/><stop offset="1" stop-color="#f6b26b"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#a)"/><circle cx="${w * 0.7}" cy="${h * 0.3}" r="${Math.min(w, h) * 0.2}" fill="#fff" opacity=".5"/><rect x="${w * 0.1}" y="${h * 0.55}" width="${w * 0.5}" height="${h * 0.3}" rx="30" fill="#6aa84f" opacity=".6"/></svg>`
  const r = new Resvg(svg).render()
  return Buffer.from(jpeg.encode({ data: Buffer.from(r.pixels), width: r.width, height: r.height }, 90).data)
}

const sizeOfJpeg = (b: Buffer) => { const d = jpeg.decode(b, { useTArray: true }); return { w: d.width, h: d.height, data: d.data } }

/** How many pixel rows in [y0, y1) have sharp edges (text, logos); smooth gradients and soft shapes don't count. */
function busyRows(img: { w: number; h: number; data: Uint8Array }, y0: number, y1: number, cols: [number, number]): number {
  let busy = 0
  for (let y = y0; y < y1; y++) {
    let hit = 0
    for (let x = cols[0] + 3; x < cols[1]; x += 2) {
      const i = (y * img.w + x) * 4, j = (y * img.w + x - 3) * 4
      if (Math.abs(img.data[i] - img.data[j]) + Math.abs(img.data[i + 1] - img.data[j + 1]) + Math.abs(img.data[i + 2] - img.data[j + 2]) > 90) hit++
    }
    if (hit > 0) busy++
  }
  return busy
}

async function main() {
  const { CARD_STYLES, renderCardJpeg, renderCardPng } = await import("../src/lib/social-card")
  const { renderPhotoCard } = await import("../src/lib/photo-render")
  await mkdir(out, { recursive: true })
  let n = 0
  const styles = [...CARD_STYLES, "house"] as const
  for (const format of IMAGE_FORMATS) {
    for (const s of styles) {
      const input = { headline: HEADLINE, businessName: "Sample Plumbing Co", brand, subline: "Same-day visits across the city", ...(s === "house" ? { house: true } : { style: s }) }
      const j = await renderCardJpeg(input, format)
      assert.ok(j, `${format} ${s} rendered`)
      const img = sizeOfJpeg(j!)
      assert.deepEqual({ w: img.w, h: img.h }, OUT_PX[format], `${format} ${s} size`)
      if (format === "story") {
        // Text stays out of the platform UI zones (decor like the editorial top bar is 12px, allowed).
        // The headline columns are 96..984; the gradient's soft circle is low contrast (under the threshold).
        assert.equal(busyRows(img, 20, STORY_SAFE.top, [96, 984]), 0, `${s}: nothing drawn in the top ${STORY_SAFE.top}px`)
        assert.equal(busyRows(img, img.h - STORY_SAFE.bottom, img.h - 10, [96, 984]), 0, `${s}: nothing drawn in the bottom ${STORY_SAFE.bottom}px`)
      }
      const png = await renderCardPng(input, format)
      await writeFile(path.join(out, `card-${format}-${s}.png`), png!)
      n++
    }
    const photo = fakePhoto(1600, 1200)
    const p = await renderPhotoCard({ photo, headline: HEADLINE, businessName: "Sample Plumbing Co", brand, size: format })
    assert.ok(p, `photo ${format}`)
    const pimg = sizeOfJpeg(p!)
    assert.deepEqual({ w: pimg.w, h: pimg.h }, OUT_PX[format], `photo ${format} size`)
    await writeFile(path.join(out, `photo-${format}.jpg`), p!)
    n++
  }
  // The 1200×630 blog cover keeps its old layout path (dims).
  const cover = await renderPhotoCard({ photo: fakePhoto(1600, 900), headline: HEADLINE, businessName: "Sample Plumbing Co", brand, dims: { w: 1200, h: 630 } })
  assert.deepEqual((({ w, h }) => ({ w, h }))(sizeOfJpeg(cover!)), { w: 1200, h: 630 })
  await writeFile(path.join(out, "photo-cover-1200x630.jpg"), cover!)

  // Size per platform when posting.
  const want: [string, ImageFormat][] = [["instagram", "portrait"], ["facebook", "portrait"], ["linkedin", "link"], ["x", "link"], ["tiktok", "story"], ["google", "square"]]
  for (const [p, f] of want) assert.equal(formatForPlatform(p), f, p)
  assert.equal(formatForPlatform("instagram", "story"), "story")

  // Caption cut points (word boundary, "more").
  assert.deepEqual(captionCut("short one", 125), { shown: "short one", cut: false })
  const long = "word ".repeat(60).trim()
  const c = captionCut(long, 125)
  assert.ok(c.cut && c.shown.length <= 125 && !c.shown.endsWith(" "))

  console.log(`ok - ${n} images in ${out}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
