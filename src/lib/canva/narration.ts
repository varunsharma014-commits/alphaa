// What the owner sees about Canva: connect, use a design, edit in Canva and bring it back,
// fill a brand template. Ops go to /api/agent/canva. Shown only when Canva is configured.
import { agent, type Block, type Chip, type Message } from "@/lib/agent/types"
import type { CanvaAccount } from "./store"
import type { CanvaDesign, BrandTemplate } from "./client"

const op = (body: Record<string, string>, label: string, primary = false): Chip => ({ label, primary, action: { type: "agent-op", endpoint: "canva", body } })
export const connectCanvaChip = (back: "voice" | "channels" = "voice"): Chip => ({ label: "Connect my Canva", primary: true, action: { type: "link", href: `/api/canva/connect?back=${back}` } })

export function canvaMessages(acc: CanvaAccount | null, o: { growth: boolean; templates: boolean; template: string | null; note?: string | null }): Message[] {
  if (!o.growth) {
    return [agent([
      { kind: "text", text: "Design in Canva? With the Growth plan I can post your Canva designs for you, and you can touch up any image I make in Canva." },
      { kind: "chips", items: [{ label: "See the Growth plan", action: { type: "link", href: "/dashboard/upgrade" } }] },
    ], "vc-canva")]
  }
  if (!acc || acc.status === "expired") {
    return [agent([
      ...(o.note ? [{ kind: "text", text: o.note } as Block] : []),
      { kind: "text", text: acc ? "Your Canva connection expired. Connect it again and I’ll pick up where we left off." : "Use Canva? Connect it and I can post your own designs, and you can touch up any image I make in Canva before it goes out." },
      { kind: "chips", items: [connectCanvaChip("voice")] },
    ], "vc-canva")]
  }
  const chips: Chip[] = [op({ op: "designs" }, "Use my Canva designs", true), op({ op: "edit" }, "Edit my next post’s image in Canva")]
  if (acc.editing) chips.push(op({ op: "back" }, "Bring it back from Canva", true))
  if (o.templates) chips.push(op({ op: "templates" }, o.template ? "Change my brand template" : "Use my brand template"))
  chips.push(op({ op: "disconnect" }, "Disconnect Canva"))
  return [agent([
    ...(o.note ? [{ kind: "text", text: o.note } as Block] : []),
    { kind: "text", text: `Canva is connected${acc.name ? ` (${acc.name})` : ""}.${o.template ? ` I fill your “${o.template}” template for your posts.` : ""}${acc.editing ? ` You’re editing “${acc.editing.title}” in Canva. When you’re done, tap “Bring it back from Canva”.` : ""}` },
    { kind: "chips", items: chips },
  ], "vc-canva")]
}

export function designsMessage(designs: CanvaDesign[]): Message {
  if (!designs.length) return agent([{ kind: "text", text: "I didn’t find any designs in your Canva yet. Make one there and tap “Use my Canva designs” again." }], "cv-designs")
  const blocks: Block[] = [{ kind: "text", text: "Your latest Canva designs. Pick one and I’ll turn it into a post image (first page, as a JPG)." }]
  for (const d of designs) {
    blocks.push({ kind: "doc", title: d.title, meta: d.updatedAt ? `changed ${new Date(d.updatedAt * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : undefined, text: "", ...(d.thumbnail ? { image: d.thumbnail } : {}) })
    blocks.push({ kind: "chips", items: [op({ op: "use", id: d.id }, `Use “${d.title.slice(0, 40)}”`)] })
  }
  return agent(blocks, "cv-designs")
}

/** After an export: where should the picture go? */
export function pickedMessage(img: { id: string; url: string; title: string }, drafts: { id: string; title: string }[], said: string): Message {
  const chips: Chip[] = drafts.slice(0, 3).map((p) => op({ op: "attach", imageId: img.id, postId: p.id }, `Put it on “${p.title.slice(0, 40)}”`))
  chips.push(op({ op: "next", imageId: img.id }, "Use it on my next post", !drafts.length))
  return agent([
    { kind: "text", text: said },
    { kind: "doc", title: img.title, meta: "from your Canva", text: "", image: img.url },
    { kind: "chips", items: chips },
  ], "cv-picked")
}

export function editingMessage(d: { title: string; editUrl: string }): Message {
  return agent([
    { kind: "text", text: `I put “${d.title}” in your Canva. Change anything you like there, then come back and tap “Bring it back from Canva”.` },
    { kind: "cta", chip: { label: "Open it in Canva", primary: true, action: { type: "link", href: d.editUrl } }, sub: "Opens in a new tab" },
    { kind: "chips", items: [op({ op: "back" }, "Bring it back from Canva")] },
  ], "cv-editing")
}

export function templatesMessage(list: BrandTemplate[], current: string | null): Message {
  if (!list.length) return agent([{ kind: "text", text: "I didn’t find a brand template with a text field I can fill. In Canva, add a data field for the headline to your template, then try again." }], "cv-templates")
  const blocks: Block[] = [{ kind: "text", text: "Your brand templates. Pick one and I’ll fill it with each post’s headline" + (list.some((t) => t.imageField) ? " and one of your photos." : ".") }]
  for (const t of list) {
    blocks.push({ kind: "doc", title: t.title, meta: current === t.id ? "using this" : t.imageField ? "headline + photo" : "headline", text: "", ...(t.thumbnail ? { image: t.thumbnail } : {}) })
    blocks.push({ kind: "chips", items: [op({ op: "template", id: t.id }, current === t.id ? `✓ ${t.title.slice(0, 40)}` : `Use “${t.title.slice(0, 40)}”`, current === t.id)] })
  }
  return agent(blocks, "cv-templates")
}
