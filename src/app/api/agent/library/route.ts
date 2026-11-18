export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { agent, type Message } from "@/lib/agent/types"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { brandMessages, voiceMessages } from "@/lib/agent/voice-narration"
import { saveBrand } from "@/lib/brand-kit"
import { imageUrl } from "@/lib/images"
import { ensureVoice } from "@/lib/voice"
import { imageSettings, saveImageSettings } from "@/lib/post-images"
import { bookRules, libraryMessages } from "@/lib/library/narration"
import { addPicked, retry, waitFor } from "@/lib/library/ingest"
import { getAsset, patchAsset, removeAsset, saveLibrarySettings } from "@/lib/library/store"
import { driveConfigured, removeDriveAccount } from "@/lib/library/drive"
import { dropboxConfigured } from "@/lib/library/dropbox"

// "Your brand library" (lib/library): add files picked in Google Drive / Dropbox, remove one,
// "Use this next", and apply what the brand book says. Answers with the panel's messages.
const id = z.string().min(5).max(40)
const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("list"), all: z.boolean().optional() }),
  z.object({ op: z.literal("add"), source: z.enum(["drive", "dropbox"]), files: z.string().max(60_000) }),
  z.object({ op: z.literal("remove"), id }),
  z.object({ op: z.literal("next"), id }),
  z.object({ op: z.literal("retry"), id }),
  z.object({ op: z.literal("drive-disconnect") }),
  z.object({ op: z.literal("bb-apply"), id, what: z.enum(["all", "colors", "fonts", "rules"]) }),
  z.object({ op: z.literal("bb-unapply"), id }),
])
const Picked = z.array(z.object({
  id: z.string().max(200).optional(),
  name: z.string().max(300),
  mimeType: z.string().max(100).optional(),
  sizeBytes: z.coerce.number().nonnegative().optional(),
  resourceKey: z.string().max(200).optional(),
  link: z.string().url().max(1000).optional(),
  thumbnailLink: z.string().url().max(2000).optional(),
  durationSec: z.coerce.number().nonnegative().optional(),
})).max(50)

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ messages: await libraryMessages(user.id) })
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "That didn’t come through. Try again." }, { status: 400 })
  }
  const reply = async (said: string | null, extra: Message[] = [], all = false) =>
    NextResponse.json({ messages: [...(said ? [agent([{ kind: "text", text: said }])] : []), ...extra, ...(await libraryMessages(user.id, { all }))] })

  if (input.op === "list") return reply(null, [], !!input.all)

  if (input.op === "add") {
    if (input.source === "drive" && !driveConfigured()) return NextResponse.json({ error: "Google Drive is coming soon." }, { status: 409 })
    if (input.source === "dropbox" && !dropboxConfigured()) return NextResponse.json({ error: "Dropbox is coming soon." }, { status: 409 })
    let files: z.infer<typeof Picked>
    try { files = Picked.parse(JSON.parse(input.files)) } catch { return NextResponse.json({ error: "Those files didn’t come through. Try again." }, { status: 400 }) }
    if (!files.length) return reply("No files picked.")
    const r = await addPicked(user.id, input.source, files)
    // Give the first few a moment so their previews show; the rest keep going in the background.
    await waitFor(user.id, 20_000)
    const skipped = r.skipped.length ? ` I skipped ${r.skipped.slice(0, 3).map((s) => `${s.name} (${s.why})`).join(", ")}${r.skipped.length > 3 ? ` and ${r.skipped.length - 3} more` : ""}.` : ""
    return reply(r.added.length ? `Added ${r.added.length === 1 ? "1 file" : `${r.added.length} files`} to your brand library.${skipped}` : `Nothing new to add.${skipped}`)
  }

  if (input.op === "remove") {
    const ok = await removeAsset(user.id, input.id)
    return reply(ok ? "Removed. I won’t use it, and the file stays where it is." : "That file isn’t in your library any more.")
  }

  if (input.op === "next") {
    const a = await getAsset(user.id, input.id)
    if (!a || a.status !== "ok") return reply("I can’t use that file right now.")
    if (a.kind === "video") {
      await saveLibrarySettings(user.id, { nextVideo: a.id })
      return reply("Done. Your next Facebook and Instagram post uses this video (as a Reel on Instagram).")
    }
    if (a.kind === "photo") {
      await patchAsset(user.id, a.id, { next: true })
      const im = await imageSettings(user.id)
      const note = im.style === "photo" ? "" : " Your images are set to another style, so tap “My photos” above to use it."
      return reply(`Done. Your next post uses this photo.${note}`)
    }
    return reply("Brand books aren’t used on posts. I follow what they say instead.")
  }

  if (input.op === "retry") {
    const a = await getAsset(user.id, input.id)
    if (!a) return reply("That file isn’t in your library any more.")
    await patchAsset(user.id, a.id, { status: "pending", note: null })
    retry(user.id, a.id)
    await waitFor(user.id, 15_000)
    return reply(null)
  }

  if (input.op === "drive-disconnect") {
    await removeDriveAccount(user.id)
    return reply("Disconnected Google Drive. Files from it stop working in your posts until you connect again. You can also check Google’s side at myaccount.google.com/permissions.")
  }

  // Brand book
  const a = await getAsset(user.id, input.id)
  const b = a?.brandbook
  if (!a || !b) return reply("That brand book isn’t here any more.")
  const now = new Date().toISOString()
  const applied = { ...(b.applied ?? {}) }
  const done: string[] = []
  const s = await getAgentSettings(user.id)

  if (input.op === "bb-unapply") {
    if (s.voice) await saveAgentSettings(user.id, { voice: { ...s.voice, rules: [] } })
    delete applied.rules
    await patchAsset(user.id, a.id, { brandbook: { ...b, applied } })
    return reply("Done. I stopped following the brand book’s writing rules.", s.voice ? voiceMessages({ ...s.voice, rules: [] }) : [])
  }

  const want = (w: "colors" | "fonts" | "rules") => input.what === "all" || input.what === w
  let brand = s.brand ?? null
  if (want("colors") && b.colors.length) {
    brand = await saveBrand(user.id, { primary: b.colors[0], colors: b.colors })
    applied.colors = now
    done.push(`your colour is ${b.colors[0]}`)
  }
  if (want("fonts") && b.fonts.length) {
    brand = await saveBrand(user.id, { font: b.fonts[0] })
    applied.fonts = now
    done.push(`your font is saved as ${b.fonts[0]}`)
  }
  let voice = s.voice ?? null
  const rules = bookRules(b)
  if (want("rules") && rules.length) {
    voice = voice ?? (await ensureVoice(user.id).catch(() => null))
    if (!voice) return NextResponse.json({ error: "I need to read your website first. Tap “Read my site again” above, then try this." }, { status: 409 })
    voice = { ...voice, rules }
    await saveAgentSettings(user.id, { voice })
    applied.rules = now
    done.push("everything I write follows its tone and words")
  }
  if (!done.length) return reply("Nothing new to use from it.")
  await patchAsset(user.id, a.id, { brandbook: { ...b, applied } })
  // The photo sample carries the colour: draw it again next time.
  if (applied.colors === now) {
    const im = await imageSettings(user.id)
    if (im.samples?.photo) await saveImageSettings(user.id, { samples: { ...im.samples, photo: null } })
  }
  const extra: Message[] = []
  if (brand && (applied.colors === now || applied.fonts === now)) extra.push(...brandMessages(brand, brand.sampleId ? imageUrl(brand.sampleId) : null))
  if (voice && applied.rules === now) extra.push(...voiceMessages(voice))
  return reply(`Done: ${done.join(", ")}.`, extra)
}
