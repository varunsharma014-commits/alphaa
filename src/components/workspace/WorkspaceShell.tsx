"use client"

// The signed-in app: a frosted sidebar (Briefing + the agent's workspaces), a status island, and
// a ⌘K ask bar that opens the real agent chat (components/agent/DashboardAgent → /api/agent/*).
// Pages talk to the chat through lib/workspace/events.ts. Older detail pages render inside the
// shell with their own styles and stay reachable from "More".

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { DashboardAgent } from "@/components/agent/DashboardAgent"
import { ASK_EVENT, type AskDetail } from "@/components/agent/AgentShell"
import { AccountMenu } from "@/components/agent/AccountMenu"
import { SiteSwitcher } from "@/components/agent/SiteSwitcher"
import { AutoApproveModal, openAutoApprove, turnOffAutoApprove } from "@/components/agent/AutoApproveModal"
import { AUTO_APPROVE_CHANGED, type AutoApproveChangedDetail } from "@/lib/auto-approve-text"
import { agent, type Message } from "@/lib/agent/types"
import { THEME_COOKIE, type DashboardTheme } from "@/lib/theme"
import { AGENT_EVENT, TOAST_EVENT, WS_EVENT, type AgentEventDetail, type WsDetail } from "@/lib/workspace/events"
import type { ShellData } from "@/lib/workspace/shell"
import { Check, Icon, SendArrow, type IconName } from "./icons"

const WORKSPACES = ["/dashboard", "/dashboard/research", "/dashboard/social", "/dashboard/email", "/dashboard/ads", "/dashboard/tracking"]

type Suggest = { label: string; say?: string; topic?: string }
const SUGGEST: Record<string, Suggest[]> = {
  "/dashboard": [{ label: "Run my marketing for this week", say: "Run my marketing for this week" }, { label: "What’s working?", topic: "insights" }, { label: "What have you done?", topic: "work" }],
  "/dashboard/research": [{ label: "What’s working in my niche?", topic: "niche" }, { label: "What are my competitors doing?", topic: "competitors" }, { label: "Ideas from my numbers", topic: "insights" }],
  "/dashboard/social": [{ label: "Plan this week’s posts", say: "Run my marketing for this week" }, { label: "My social accounts", topic: "social" }, { label: "How my images look", topic: "voice" }],
  "/dashboard/email": [{ label: "Write an email", topic: "email" }, { label: "Who is on my list?", topic: "email" }, { label: "What I send without asking", topic: "autopilot" }],
  "/dashboard/ads": [{ label: "How are my ads doing?", topic: "ads" }, { label: "Show my ad plan", topic: "adplan" }, { label: "My monthly limit", topic: "autopilot" }],
  "/dashboard/tracking": [{ label: "Is everything counting?", topic: "tracking" }, { label: "Finish setting up", topic: "setup" }, { label: "All my channels", topic: "channels" }],
}

const MORE: { href: string; label: string }[] = [
  { href: "/dashboard/sandbox", label: "Ask the AIs" },
  { href: "/dashboard/vault", label: "What AI reads about you" },
  { href: "/dashboard/visibility", label: "AI search, per AI" },
  { href: "/dashboard/citations", label: "Pages AI cites" },
  { href: "/dashboard/keywords", label: "Your Google searches" },
  { href: "/dashboard/audit", label: "Website health" },
  { href: "/dashboard/speed", label: "Site speed" },
  { href: "/dashboard/posts", label: "Google listing posts" },
  { href: "/dashboard/reviews", label: "Reviews" },
  { href: "/dashboard/content-plan", label: "Content calendar" },
  { href: "/dashboard/content-gaps", label: "Content ideas" },
  { href: "/dashboard/competitors", label: "Competitors" },
  { href: "/dashboard/ad-strategy", label: "Your ad plan" },
  { href: "/dashboard/reports", label: "Weekly briefings" },
  { href: "/dashboard/upgrade", label: "Plans" },
]

function greeting(d: ShellData): Message {
  const hi = d.firstName ? `Hi ${d.firstName}.` : "Hi."
  const did = d.doneThisWeek ? ` This week I did ${d.doneThisWeek} thing${d.doneThisWeek === 1 ? "" : "s"} for ${d.businessName}${d.goingOut ? `, and ${d.goingOut} ${d.goingOut === 1 ? "is" : "are"} going out in the next 7 days` : ""}.` : ""
  return agent([{ kind: "text", text: `${hi}${did}\n\nTell me what to focus on, or ask me anything. I do the work and tell you what I did.` }], "ws-hello")
}

export function WorkspaceShell({ data, theme: initialTheme, admin, children, showUser = true, path }: {
  data: ShellData
  theme: DashboardTheme
  admin: boolean
  children: React.ReactNode
  /** Dev preview (/preview?ws=…) renders without a Clerk session and at a fake path. */
  showUser?: boolean
  path?: string
}) {
  const realPath = usePathname() ?? "/dashboard"
  const pathname = path ?? realPath
  const [theme, setTheme] = useState<DashboardTheme>(initialTheme)
  const [ap, setAp] = useState(data.autopilot)
  const [drawer, setDrawer] = useState(false)
  const [more, setMore] = useState(() => MORE.some((m) => pathname.startsWith(m.href)) || pathname.startsWith("/dashboard/settings"))
  const [chat, setChat] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [queue, setQueue] = useState<WsDetail[]>([])
  const [toastText, setToastText] = useState<string | null>(null)
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hello = useRef<Message[]>([greeting(data)])

  const flash = useCallback((t: string) => {
    setToastText(t)
    if (toastT.current) clearTimeout(toastT.current)
    toastT.current = setTimeout(() => setToastText(null), 2400)
  }, [])

  // Theme: the cookie keeps it for the next server paint; the attribute switches it now.
  const pickTheme = (t: DashboardTheme) => {
    setTheme(t)
    document.cookie = `${THEME_COOKIE}=${t}; path=/; max-age=31536000; samesite=lax`
  }

  // Autopilot = the existing "Auto-approve and post" consent (lib/agent/auto-approve.ts).
  useEffect(() => setAp(data.autopilot), [data.autopilot])
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<AutoApproveChangedDetail>).detail
      setAp(!!d?.on)
      flash(d?.on ? "Autopilot on" : "Autopilot off: I’ll ask first")
    }
    window.addEventListener(AUTO_APPROVE_CHANGED, on)
    return () => window.removeEventListener(AUTO_APPROVE_CHANGED, on)
  }, [flash])
  const toggleAp = async () => {
    if (ap) { if (!(await turnOffAutoApprove())) flash("That didn’t save. Try again.") }
    else openAutoApprove()
  }

  // The chat: mounted on first use and kept, so the conversation survives closing the panel.
  const open = useCallback((d?: WsDetail) => {
    setChat(true)
    setMounted(true)
    setDrawer(false)
    if (d && (d.topic || d.chip || d.say || d.push?.length)) setQueue((q) => [...q, d])
  }, [])
  useEffect(() => {
    if (!mounted || !queue.length) return
    // Runs after DashboardAgent's own effects in the same commit, so its listeners are there.
    for (const d of queue) {
      if (d.topic) window.dispatchEvent(new CustomEvent<AskDetail>(ASK_EVENT, { detail: { topic: d.topic, label: d.label ?? "" } }))
      if (d.chip || d.say || d.push?.length) window.dispatchEvent(new CustomEvent<AgentEventDetail>(AGENT_EVENT, { detail: { chip: d.chip, say: d.say, push: d.push } }))
    }
    setQueue([])
  }, [mounted, queue])
  useEffect(() => {
    const onWs = (e: Event) => open((e as CustomEvent<WsDetail>).detail)
    const onToast = (e: Event) => flash(String((e as CustomEvent<string>).detail ?? ""))
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setChat((c) => { if (!c) setMounted(true); return !c }) }
      else if (e.key === "Escape") setChat(false)
    }
    window.addEventListener(WS_EVENT, onWs)
    window.addEventListener(TOAST_EVENT, onToast)
    window.addEventListener("keydown", onKey)
    return () => { window.removeEventListener(WS_EVENT, onWs); window.removeEventListener(TOAST_EVENT, onToast); window.removeEventListener("keydown", onKey) }
  }, [open, flash])
  useEffect(() => setDrawer(false), [pathname])
  // Arriving with ?ask=<topic> (emails, old links, website connect): a fresh chat reads it on
  // mount; an open one gets the topic now.
  const mountedRef = useRef(false)
  mountedRef.current = mounted
  useEffect(() => {
    const topic = new URLSearchParams(window.location.search).get("ask")
    if (!topic) return
    if (!mountedRef.current) return open()
    open({ topic })
    window.history.replaceState(null, "", window.location.pathname)
  }, [pathname, open])

  const isWs = WORKSPACES.includes(pathname)
  const suggest = SUGGEST[pathname] ?? SUGGEST["/dashboard"]
  const ni = (href: string, label: string, icon: IconName, extra?: React.ReactNode) => {
    const on = href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`)
    return (
      <Link className={`ax-ni${on ? " on" : ""}`} href={href} aria-current={on ? "page" : undefined}>
        <span className="l"><Icon name={icon} />{label}</span>{extra}
      </Link>
    )
  }
  const failing = data.signals ? data.signals.total - data.signals.ok : 0
  const island = `Working on ${data.channels} channel${data.channels === 1 ? "" : "s"} · ${data.goingOut ? `${data.goingOut} going out this week` : "nothing scheduled this week"}`

  return (
    <div data-dashboard-root="" data-agent="" data-theme={theme} data-brand="blue">
      <div className="ax">
        <div className="ax-top">
          <button type="button" className="ic" onClick={() => setDrawer(true)} aria-label="Open menu"><Icon name="more" size={22} /></button>
          <Link href="/dashboard" className="mid"><span className="ax-orb" style={{ width: 16, height: 16 }} />Alphaa</Link>
          <button type="button" className="mode" onClick={() => pickTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "☀︎ Light" : "☾ Spatial"}</button>
        </div>
        <div className={`ax-scrim${drawer ? " open" : ""}`} onClick={() => setDrawer(false)} aria-hidden="true" />
        <aside className={`ax-sb${drawer ? " open" : ""}`} aria-label="Workspaces">
          <div className="ax-sbt">
            <div className="ax-brand"><span className="ax-orb" style={{ width: 30, height: 30 }} /><span><b>Alphaa</b><small>{showUser ? "Your marketing agent" : data.businessName}</small></span></div>
            {showUser && <div className="ax-site"><SiteSwitcher name={data.businessName} /></div>}
            <p className="ax-sec">Command</p>
            <nav className="ax-nav">{ni("/dashboard", "Briefing", "briefing")}</nav>
            <p className="ax-sec">Agent workspaces</p>
            <nav className="ax-nav">
              {ni("/dashboard/research", "Research & Ideas", "research")}
              {ni("/dashboard/social", "Social Studio", "social", data.socialScheduled ? <span className="ax-bdg">{data.socialScheduled}</span> : !data.pro ? <span className="ax-tag">Pro</span> : null)}
              {ni("/dashboard/email", "Email & Flows", "email", <span className="ax-tag">Growth</span>)}
              {ni("/dashboard/ads", "Ads", "ads", <span className="ax-tag">Top plan</span>)}
              {ni("/dashboard/tracking", "Tracking & Setup", "tracking", failing ? <span className="ax-bdg amber">{failing}</span> : null)}
            </nav>
            <nav className="ax-nav">
              {ni("/dashboard/settings", "Your rules", "rules")}
              <button type="button" className="ax-ni" onClick={() => setMore(!more)} aria-expanded={more}>
                <span className="l"><Icon name="more" />More</span>
                <span style={{ transform: more ? "rotate(90deg)" : "none", transition: "transform .2s", display: "inline-flex" }}><Icon name="chevron" size={14} /></span>
              </button>
              {more && (
                <div style={{ paddingLeft: 18 }}>
                  {MORE.map((m) => (
                    <Link key={m.href} href={m.href} className={`ax-ni sm${pathname === m.href || pathname.startsWith(`${m.href}/`) ? " on" : ""}`}>{m.label}</Link>
                  ))}
                  {admin && <Link href="/dashboard/admin/usage" className={`ax-ni sm${pathname.startsWith("/dashboard/admin") ? " on" : ""}`}>Admin · usage</Link>}
                </div>
              )}
            </nav>
          </div>
          <div className="ax-sbb">
            <div className="ax-row">
              <div><div className="ax-t13">Autopilot</div><div className="ax-t11">{ap ? "On · stop anything before it goes out" : "Off · I ask before anything goes out"}</div></div>
              <button type="button" role="switch" aria-checked={ap} aria-label="Autopilot" onClick={() => void toggleAp()} className={`ax-sw${ap ? " on" : ""}`}><i /></button>
            </div>
            <div className="ax-seg" role="group" aria-label="Appearance">
              <button type="button" className={theme === "dark" ? "" : "on"} onClick={() => pickTheme("light")} aria-pressed={theme !== "dark"}>☀︎ Light</button>
              <button type="button" className={theme === "dark" ? "on" : ""} onClick={() => pickTheme("dark")} aria-pressed={theme === "dark"}>☾ Spatial</button>
            </div>
            {showUser && <div className="ax-acct"><span className="ax-t11">Account & billing</span><AccountMenu /></div>}
          </div>
        </aside>

        <main className="ax-main">
          <div className="ax-island" role="status">
            <span className="ax-orb" style={{ width: 14, height: 14 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{island}</span>
            {data.signals && <span className={`chip${failing ? "" : " ok"}`}>{data.signals.ok}/{data.signals.total} signals</span>}
          </div>
          {isWs ? (
            <div className="ax-stage">{children}</div>
          ) : (
            <div className="ag-main ax-legacy"><div className="ag-legacy">{children}</div></div>
          )}
        </main>

        <div className="ax-cmdw">
          {!chat && (
            <>
              <div className="ax-chips">
                {suggest.map((s) => <button key={s.label} type="button" onClick={() => open({ topic: s.topic, say: s.say, label: s.topic ? s.label : undefined })}>{s.label}</button>)}
              </div>
              <button type="button" className="ax-cmd" onClick={() => open()} aria-label="Ask Alphaa">
                <span className="ax-orb" style={{ width: 14, height: 14 }} />
                <span className="ph">Tell Alphaa what to focus on, or ask anything…</span>
                <span className="ax-kbd">⌘K</span>
                <span className="ax-send"><SendArrow /></span>
              </button>
            </>
          )}
          {mounted && (
            <section className="ax-chatp" aria-label="Chat with Alphaa" hidden={!chat}>
              <header>
                <span className="ax-orb" style={{ width: 22, height: 22 }} />
                <div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 15 }}>Alphaa</b><div className="ax-t11">Ask anything. I do the work and tell you what I did.</div></div>
                <button className="ax-x" type="button" aria-label="Close chat" onClick={() => setChat(false)}>✕</button>
              </header>
              <div className="ax-chatchips">
                {suggest.map((s) => <button key={s.label} type="button" onClick={() => open({ topic: s.topic, say: s.say, label: s.topic ? s.label : undefined })}>{s.label}</button>)}
              </div>
              <div className="ag-main">
                <DashboardAgent initial={hello.current} businessName={data.businessName} current={pathname} composerOpen />
              </div>
            </section>
          )}
        </div>

        {toastText && <div className="ax-toast" role="status"><Check />{toastText}</div>}
        <AutoApproveModal pro={data.planPro} growth={data.pro} />
      </div>
    </div>
  )
}
