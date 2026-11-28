"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/lib/workspace/events"
import { Button, CodeBlock, Field, FieldGrid, PageHeader, Pill, TextInput, When } from "./ui"
import "./detail.css"

// "What AI reads about you": the business facts AI assistants read in the site's code. Built only
// from the owner's real profile (lib/schema-generator.ts). Missing facts are asked for, never guessed.

export type VaultBlock = { title: string; where: string; code: string }
export type MissingFact = { key: "businessName" | "businessType" | "city" | "state"; label: string; hint?: string; placeholder: string }

export type VaultData = {
  status: "none" | "empty" | "partial" | "good"
  checkedAt: string | null
  checkedUrl: string | null
  found: string[]
  blocks: VaultBlock[]
  writtenAt: string | null
  /** An older AI-made version existed and was taken down (it had guessed facts). */
  hadOld: boolean
  hasSite: boolean
  missing: MissingFact[]
  install: { auto: boolean; platform: string; how: string }
  tag: string
  llms: string
  llmsUrl: string
}

const STATUS: Record<VaultData["status"], { tone: "ok" | "warn" | "idle"; pill: string; title: string; text: string }> = {
  good: { tone: "ok", pill: "Working", title: "AI can read your business details", text: "When I last checked your site, AI assistants could read:" },
  partial: { tone: "warn", pill: "Partly there", title: "AI can read your pages, not your business details", text: "Your site has some code for AI, but none of it says who you are. The code below fixes that." },
  empty: { tone: "warn", pill: "Missing", title: "AI can’t read your business details yet", text: "Your site has no code that tells AI who you are, so AI assistants have to guess. Add the code below." },
  none: { tone: "idle", pill: "Not checked yet", title: "I haven’t checked your site yet", text: "I read your site every week and show here what AI assistants can read." },
}

/** llms.txt shown the way it reads, not as raw Markdown. */
function LlmsPreview({ text }: { text: string }) {
  const out: ReactNode[] = []
  text.split("\n").forEach((line, i) => {
    const l = line.trim()
    if (!l) return
    if (l.startsWith("# ") || l.startsWith("## ")) out.push(<h4 key={i}>{l.replace(/^#+\s*/, "")}</h4>)
    else if (l.startsWith("> ")) out.push(<blockquote key={i}>{l.slice(2)}</blockquote>)
    else out.push(<p key={i}>{l}</p>)
  })
  return <div className="xp-md">{out}</div>
}

export function VaultView({ data, mailtoHref, picker }: { data: VaultData; mailtoHref: string; picker: ReactNode }) {
  const router = useRouter()
  const [busy, setBusy] = useState<"write" | "install" | "save" | null>(null)
  const [facts, setFacts] = useState<Record<string, string>>({})
  const s = STATUS[data.status]
  const allCode = data.blocks.map((b) => b.code).join("\n\n")

  async function write(): Promise<boolean> {
    const res = await fetch("/api/schema/generate", { method: "POST" })
    const d = await res.json().catch(() => null)
    if (!res.ok) { toast(d?.error ?? "I couldn’t write it this time. Try again in a minute."); return false }
    toast("Written from your real details and checked")
    router.refresh()
    return true
  }

  async function writeNow() {
    setBusy("write")
    try { await write() } finally { setBusy(null) }
  }

  async function saveFacts() {
    setBusy("save")
    try {
      const body = Object.fromEntries(data.missing.map((m) => [m.key, (facts[m.key] ?? "").trim()]).filter(([, v]) => v))
      const res = await fetch("/api/user/onboarding-progress", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error("save")
      if (data.hasSite) await write()
      else { toast("Saved"); router.refresh() }
    } catch {
      toast("I couldn’t save that just now. Try again in a minute.")
    } finally { setBusy(null) }
  }

  async function install() {
    setBusy("install")
    try {
      const res = await fetch("/api/connect/wp/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "schema" }) })
      const d = await res.json().catch(() => null)
      toast(res.ok ? "Added to your site. You can undo it from the plugin." : d?.error ?? "That didn’t go through. Nothing changed.")
    } finally { setBusy(null) }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([data.llms], { type: "text/plain" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "llms.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  const needFacts = data.missing.length > 0
  const ready = data.blocks.length > 0

  return (
    <>
      <PageHeader
        title="What AI reads about you"
        sub="AI assistants read the code behind your site, not the page. Add your business facts as code and they describe you correctly."
        meta={data.checkedAt ? <span><When at={data.checkedAt} mode="ago" prefix="Site checked " fallback="" />{data.checkedUrl ? ` · ${data.checkedUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}` : ""}</span> : undefined}
      />

      <section className="xp-card xp-stack">
        <div className="xp-q__top"><b className="xp-q__t">{s.title}</b><Pill tone={s.tone} dot={s.tone === "ok"}>{s.pill}</Pill></div>
        <p className="ax-p">{s.text}</p>
        {data.status === "good" && data.found.length > 0 && <ul className="xp-found">{data.found.map((f) => <li key={f}><span className="ax-chip">{f}</span></li>)}</ul>}
      </section>

      <ol className="xp-steps xp-gap">
        {needFacts && (
          <li className="xp-step">
            <h3>{data.missing.length === 1 ? "I need one answer from you" : `I need ${data.missing.length} answers from you`}</h3>
            <p>I only write facts you’ve given me. I won’t guess them.</p>
            <div className="xp-step__b">
              <FieldGrid min={200}>
                {data.missing.map((m) => (
                  <Field key={m.key} label={m.label} hint={m.hint}>
                    <TextInput value={facts[m.key] ?? ""} placeholder={m.placeholder} onChange={(e) => setFacts((f) => ({ ...f, [m.key]: e.target.value }))} />
                  </Field>
                ))}
              </FieldGrid>
              <div className="xp-row-actions">
                <Button variant="primary" loading={busy === "save"} disabled={!data.missing.some((m) => (facts[m.key] ?? "").trim())} onClick={saveFacts}>{data.hasSite ? "Save and write my code" : "Save"}</Button>
              </div>
            </div>
          </li>
        )}

        <li className={`xp-step${ready ? " done" : ""}`}>
          <h3>Your business facts, as code</h3>
          {ready ? (
            <>
              <p>Written from your profile{data.writtenAt ? <>, <When at={data.writtenAt} mode="ago" fallback="" /></> : null}. Every block passed Google’s rules.</p>
              <div className="xp-step__b">
                {data.blocks.map((b, i) => <CodeBlock key={i} title={b.title} where={b.where} code={b.code} foldAt={10} copyLabel="Copy code" />)}
                <div className="xp-row-actions"><Button loading={busy === "write"} onClick={writeNow}>{busy === "write" ? "Writing" : "Write it again"}</Button></div>
              </div>
            </>
          ) : (
            <>
              <p>{data.hadOld ? "The code I wrote before filled gaps with guesses, so I took it down. I’ll write it again from your real details." : "I write it from your business details. It takes a few seconds."}</p>
              <div className="xp-step__b"><div className="xp-row-actions">
                <Button variant="primary" loading={busy === "write"} disabled={!data.hasSite} onClick={writeNow}>{busy === "write" ? "Writing" : "Write my code"}</Button>
                {!data.hasSite && <span className="ax-p">Add your website in <a className="ax-lnk" href="/dashboard/settings">Your business</a> first.</span>}
              </div></div>
            </>
          )}
        </li>

        <li className="xp-step">
          <h3>Add it to your site</h3>
          <p>{data.install.how}</p>
          {ready && (
            <div className="xp-step__b">
              {data.install.auto ? (
                <div className="xp-row-actions">
                  <Button variant="primary" loading={busy === "install"} onClick={install}>Install it for me</Button>
                  <CopyAll code={allCode} />
                </div>
              ) : (
                <>
                  <div className="xp-row-actions"><CopyAll code={allCode} /></div>
                  {picker}
                </>
              )}
            </div>
          )}
          {!ready && <p className="ax-p xp-gap">Write the code first, then I’ll show you where it goes.</p>}
        </li>

        <li className="xp-step">
          <h3>A short summary for AI</h3>
          <p>llms.txt is a plain page about you, written for AI assistants. I keep it up to date and host it for you.</p>
          <div className="xp-step__b">
            <LlmsPreview text={data.llms} />
            <div className="xp-row-actions">
              <Button onClick={download}>Download llms.txt</Button>
              <Button variant="undo" href={data.llmsUrl} external>Open my hosted copy</Button>
            </div>
            <p className="ax-p">To add it to your own site, upload it so it opens at yourdomain.com/llms.txt.</p>
          </div>
        </li>

        <li className="xp-step">
          <h3>Optional: keep Google’s copy fresh</h3>
          <p>One line in your site’s header. Google then always reads your newest details. ChatGPT, Claude and Perplexity don’t run it, so add the code above too.</p>
          <div className="xp-step__b"><CodeBlock title="The one line" where="Before </head>, the same place as above" code={data.tag} copyLabel="Copy line" /></div>
        </li>
      </ol>
      <p className="xp-note">Not sure about any of this? <a className="ax-lnk" href={mailtoHref}>Email it to whoever manages your website.</a></p>
    </>
  )
}

function CopyAll({ code }: { code: string }) {
  return <Button onClick={() => { navigator.clipboard?.writeText(code).then(() => toast("Copied"), () => toast("Couldn’t copy. Select the code and copy it instead.")) }}>Copy all the code</Button>
}
