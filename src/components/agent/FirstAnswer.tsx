"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { FirstAnswer as Answer } from "@/lib/agent/first-answer"
import { ENGINE_LABEL } from "@/lib/agent/types"
import { AnswerBlock } from "./blocks"

// The first-visit moment: what ChatGPT actually tells their customers, their
// name (or the rival's) highlighted. Shown once; brand-new accounts with
// nothing asked yet get the question asked live, right here.

type Live = { engine: Answer["engine"]; answer: string; appeared: boolean; mentioned: string[]; status: string }

const list = (names: string[]) => (names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`)

export function FirstAnswer() {
  const router = useRouter()
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [name, setName] = useState("")
  const [asking, setAsking] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    ;(async () => {
      const r = await fetch("/api/agent/first-answer").then((x) => (x.ok ? x.json() : null)).catch(() => null) as { show?: boolean; answer?: Answer | null; businessName?: string; question?: string | null } | null
      if (!r?.show) return
      setName(r.businessName ?? "")
      if (r.answer) return setAnswer(r.answer)
      if (!r.question) return
      setAsking(true)
      const res = await fetch("/api/sandbox/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: r.question }) }).catch(() => null)
      const data = (await res?.json().catch(() => null)) as { results?: Live[] } | null
      setAsking(false)
      const answered = (data?.results ?? []).filter((x) => x.answer.trim() && (x.status === "appeared" || x.status === "not_appearing"))
      const lead = answered.find((x) => x.engine === "chatgpt") ?? answered[0]
      if (!lead) return
      setAnswer({ engine: lead.engine, query: r.question, answer: lead.answer, appeared: lead.appeared, mentioned: lead.mentioned, at: new Date().toISOString() })
      router.refresh() // the four lights now have a real answer behind them
    })()
  }, [router])

  function done() {
    setGone(true)
    void fetch("/api/agent/first-answer", { method: "POST" }).catch(() => null)
  }

  if (gone) return null
  if (asking) {
    return (
      <section className="ag-first ag-first--asking" aria-live="polite">
        <p className="ag-first__kick">First, what your customers see</p>
        <p className="ag-first__title"><span className="ag-dot ag-dot--live" aria-hidden="true" /> I’m asking ChatGPT right now, the way a customer would…</p>
      </section>
    )
  }
  if (!answer) return null

  const ai = ENGINE_LABEL[answer.engine]
  const rivals = answer.mentioned.filter((n) => n.toLowerCase() !== name.toLowerCase()).slice(0, 3)
  return (
    <section className="ag-first" aria-label={`What ${ai} tells your customers`}>
      <p className="ag-first__kick">First, what your customers see</p>
      <h2 className="ag-first__title">{answer.appeared ? `Great news: ${ai} names you!` : `This is what ${ai} tells your customers right now.`}</h2>
      <AnswerBlock kind="answer" engine={answer.engine} query={answer.query} answer={answer.answer} appeared={answer.appeared} mentioned={answer.mentioned} businessName={name} />
      <p className="ag-first__say">
        {answer.appeared
          ? `That’s the hardest part, and you already have it. I’ll keep you there and get the other AIs saying it too.`
          : rivals.length
            ? <>It sends them to <b>{list(rivals)}</b>. Not you. <b>I’m going to change this.</b></>
            : <>You’re not in it yet. <b>I’m going to change this.</b></>}
      </p>
      <div className="ag-first__btns">
        <button type="button" className="ag-btn-primary" onClick={done}>{answer.appeared ? "Love it. Keep going" : "Go change it"}</button>
        <span>Asked {new Date(answer.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}. I ask again every week.</span>
      </div>
    </section>
  )
}
