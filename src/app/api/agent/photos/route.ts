export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { addPhoto, listPhotos, MAX_PHOTOS, MAX_UPLOAD_BYTES } from "@/lib/brand-photos"
import { imageInfo } from "@/lib/photo-render"

// The owner adds a photo of their own in the chat (the "file" form field posts here).
// image/* only, up to 8 MB, re-encoded as JPEG (EXIF/GPS dropped) into their photo library.
export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let file: File | null = null
  try {
    const fd = await req.formData()
    const f = fd.get("file")
    file = f instanceof File ? f : null
  } catch {
    return NextResponse.json({ error: "That upload didn’t come through. Try again." }, { status: 400 })
  }
  if (!file) return NextResponse.json({ error: "Choose a photo first." }, { status: 400 })
  if (!/^image\//i.test(file.type)) return NextResponse.json({ error: `${file.name} isn’t a photo. Use a JPG or PNG.` }, { status: 415 })
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: `${file.name} is over 8 MB. Try a smaller copy.` }, { status: 413 })
  if ((await listPhotos(user.id)).length >= MAX_PHOTOS) return NextResponse.json({ error: `You have ${MAX_PHOTOS} photos already. Remove a few first.` }, { status: 409 })
  const buf = Buffer.from(await file.arrayBuffer())
  const info = imageInfo(buf)
  if (info.w && info.h && Math.min(info.w, info.h) < 600) return NextResponse.json({ error: `${file.name} is too small to look sharp. Use one at least 600 pixels on each side.` }, { status: 400 })
  const p = await addPhoto(user.id, buf, { source: "upload" })
  if (!p) return NextResponse.json({ error: `I couldn’t use ${file.name}. It may already be in your photos, or it’s a format I can’t read. Try a JPG.` }, { status: 400 })
  return NextResponse.json({ id: p.id })
}
