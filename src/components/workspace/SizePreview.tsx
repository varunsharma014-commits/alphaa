"use client"

// Social Studio → Preview: the post as it would look in each place it can go, in the size I post
// there (lib/image-formats.ts PREVIEW_SPOTS): Instagram feed 4:5, Instagram story 9:16, Facebook
// feed 4:5, LinkedIn 1200×675. Simple app-style frames (no platform logos) with the connected
// account's own name and picture: where the caption is cut with "more", and where the app's own
// buttons sit over the picture. The pictures come from POST /api/workspace/sizes, the same files posting uses.
import { useEffect, useState } from "react"
import { captionCut, PREVIEW_SPOTS, type PreviewSpot } from "@/lib/image-formats"
import { ChannelMark, Segmented, Skeleton } from "./ui"

const NET_OF: Record<PreviewSpot["platform"], string> = { instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn" }
const SHORT: Record<string, string> = { "ig-feed": "Feed", "ig-story": "Story", "fb-feed": "Feed", "li-feed": "Post" }
// Pictures I can't redraw in another size are shown whole with bars, so nothing on them is cut off.
const FIXED_NOTE = {
  canva: "This is a Canva design, so I can’t redraw it in this size. It’s shown whole. Resize it in Canva for a full fit.",
  photo: "This photo post was made before I could draw other sizes, so it’s shown whole.",
  other: "I can’t redraw this picture in this size, so it’s shown whole.",
} as const
const RATIO = { square: "1 / 1", portrait: "4 / 5", story: "9 / 16", wide: "16 / 9", link: "16 / 9" } as const

export function SizePreview({ postId, text, image, nets, brandName, who = {}, version }: {
  postId: string
  text: string
  image: string | null
  nets: string[]
  brandName: string
  /** Per platform name: the connected account's name + picture. */
  who?: Record<string, { name: string; avatar: string | null }>
  version?: string
}) {
  const mine = PREVIEW_SPOTS.filter((s) => nets.includes(NET_OF[s.platform]))
  const spots = mine.length ? mine : PREVIEW_SPOTS
  const [key, setKey] = useState(spots[0].key)
  const [pics, setPics] = useState<Record<string, { url: string; note: string | null; fit?: boolean }>>({})
  const [safe, setSafe] = useState(false)
  const spot = spots.find((s) => s.key === key) ?? spots[0]
  const k = `${spot.format}|${version ?? ""}`
  const got = pics[k]
  const pic = got?.url

  useEffect(() => {
    if (!image || pics[k]) return
    let off = false
    // Can't draw it: the post's own picture shown whole in the frame (bars, never cropped), and I say so.
    const cropped = (note?: string | null) => setPics((m) => ({ ...m, [k]: { url: image, fit: true, note: note ? `${note} This is your picture as it is.` : "I couldn’t draw this size, so this is your picture as it is." } }))
    fetch("/api/workspace/sizes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: postId, format: spot.format }) })
      .then(async (r) => ({ ok: r.ok, d: (await r.json().catch(() => null)) as { image?: string; error?: string; exact?: boolean; fixed?: "canva" | "photo" | "other" | null } | null }))
      .then(({ ok, d }) => {
        if (off) return
        if (ok && d?.image) setPics((m) => ({ ...m, [k]: { url: d.image!, fit: d.exact === false, note: d.exact === false ? FIXED_NOTE[d.fixed ?? "other"] : null } }))
        else cropped(d?.error)
      })
      .catch(() => { if (!off) cropped() })
    return () => { off = true }
  }, [postId, image, spot.format, k, pics])

  // The real account this goes out as; the business name only when nothing is connected there.
  const acct = who[NET_OF[spot.platform]]
  const name = acct?.name || brandName || "Your business"
  const initial = name.trim()[0]?.toUpperCase() ?? "Y"
  const avatar = acct?.avatar ? <img className="ax-pv-av" src={acct.avatar} alt="" /> : <span className="ax-pv-av">{initial}</span>
  const cap = captionCut(text, spot.cut)
  const picture = (
    <div className="ax-pv-pic" style={{ aspectRatio: RATIO[spot.format] }}>
      {pic ? <img src={pic} alt="" className={got?.fit ? "fit" : undefined} /> : image ? <span className="ax-pv-wait" aria-busy="true"><Skeleton kind="line" width="60%" /></span> : <span className="ax-pv-wait">No picture</span>}
    </div>
  )
  const head = (
    <div className="ax-pv-head">{avatar}<b>{name}</b><span className="ax-pv-mut">{spot.platform === "instagram" ? "" : "Just now"}</span></div>
  )
  const caption = (
    <p className="ax-pv-cap">
      {spot.platform === "instagram" && <b>{name} </b>}
      {cap.shown}{cap.cut && <span className="ax-pv-more">{spot.more}</span>}
    </p>
  )
  const where = NET_OF[spot.platform]
  return (
    <div>
      <div className="ax-eb" style={{ marginBottom: 8 }}>How it looks where it goes</div>
      {spots.length > 1 && (
        <Segmented
          label="Where it goes"
          full
          value={spot.key}
          onChange={setKey}
          options={spots.map((s) => ({ value: s.key, label: <span className="ax-pv-opt"><ChannelMark channel={s.platform} size={16} />{SHORT[s.key] ?? s.label}<span className="sr-only"> on {NET_OF[s.platform]}</span></span> }))}
        />
      )}
      {spot.placement === "story" ? (
        <div className={`ax-pv ax-pv-story${safe ? " safe" : ""}`}>
          {picture}
          <div className="ax-pv-top" aria-hidden="true"><i /><div className="ax-pv-head">{avatar}<b>{name}</b><span className="ax-pv-mut">1h</span></div></div>
          <div className="ax-pv-bot" aria-hidden="true"><span>Send message</span></div>
        </div>
      ) : (
        <div className="ax-pv ax-pv-feed">
          {head}
          {spot.platform !== "instagram" && caption}
          {picture}
          <div className="ax-pv-acts" aria-hidden="true">
            {spot.platform === "instagram" ? <><i /><i /><i /><i className="r" /></> : spot.platform === "facebook" ? <><span>Like</span><span>Comment</span><span>Share</span></> : <><span>Like</span><span>Comment</span><span>Repost</span><span>Send</span></>}
          </div>
          {spot.platform === "instagram" && caption}
        </div>
      )}
      <p className="ax-note" style={{ marginTop: 8 }}>
        {spot.placement === "story"
          ? <>I don’t post stories myself yet. Text stays clear of the top and bottom, where the app puts its own buttons. <button type="button" className="ax-lnk" onClick={() => setSafe((s) => !s)}>{safe ? "Hide" : "Show"} those areas</button></>
          : spot.cut ? `${where} shows the first ${spot.cut} characters, then “${spot.more.replace(/^…\s*/, "")}”.` : `${where} shows the whole caption.`}
        {got?.note ? <><br />{got.note}</> : null}
      </p>
    </div>
  )
}
