"use client"

// The signed-in app: a frosted sidebar (Briefing + the agent's workspaces), a status island, and
// a ⌘K ask bar that opens the real agent chat (components/agent/DashboardAgent → /api/agent/*).
// Pages talk to the chat through lib/workspace/events.ts. Older detail pages render inside the
// shell with their own styles and stay reachable from "More" (grouped). One sidebar item is lit,
// from lib/workspace/nav-map.ts. The chat opens as a right-hand sheet over a scrim.

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { DashboardAgent } from "@/components/agent/DashboardAgent"
import { AccountMenu, AccountMenuView } from "@/components/agent/AccountMenu"
import { SiteSwitcher, type Site } from "@/components/agent/SiteSwitcher"
import { AutoApproveModal, openAutoApprove, turnOffAutoApprove } from "@/components/agent/AutoApproveModal"
import { AUTO_APPROVE_CHANGED, type AutoApproveChangedDetail } from "@/lib/auto-approve-text"
import { agent, type Message } from "@/lib/agent/types"
import type { DashboardTheme } from "@/lib/theme"
import { AGENT_EVENT, AI_NOTE, ASK_EVENT, ISLAND_EVENT, TOAST_EVENT, WS_EVENT, type AskDetail, type AgentEventDetail, type WsDetail } from "@/lib/workspace/events"
import type { ShellData } from "@/lib/workspace/shell"
import { Check, Icon, SendArrow, type IconName } from "./icons"
import { CreditsSheet } from "./CreditsSheet"
import { BannedWordConfirm } from "./BannedWordConfirm"
import { RoleContext, useMemberFetchNotice } from "./role"
import { can, ROLE_LABEL } from "@/lib/team/permissions"
import { isStageRoute } from "@/lib/workspace/stage-routes"
import { activeNav, moreOpenFor, type NavKey } from "@/lib/workspace/nav-map"
import "./shell.css"


type Suggest = { label: string; say?: string; topic?: string }
const SUGGEST: Record<string, Suggest[]> = {
  "/dashboard": [{ label: "Run my marketing for this week", say: "Run my marketing for this week" }, { label: "What’s working?", topic: "insights" }, { label: "What have you done?", topic: "work" }],
  "/dashboard/research": [{ label: "What’s working in my niche?", topic: "niche" }, { label: "What are my competitors doing?", topic: "competitors" }, { label: "Ideas from my numbers", topic: "insights" }],
  "/dashboard/social": [{ label: "Plan this week’s posts", say: "Run my marketing for this week" }, { label: "My social accounts", topic: "social" }, { label: "How my images look", topic: "voice" }],
  "/dashboard/social/calendar": [{ label: "Plan this week’s posts", say: "Run my marketing for this week" }, { label: "Website posts & pages", topic: "content" }, { label: "Write an email", topic: "email" }],
  "/dashboard/email": [{ label: "Write an email", topic: "email" }, { label: "Who is on my list?", topic: "email" }, { label: "What I send without asking", topic: "autopilot" }],
  "/dashboard/ads": [{ label: "How are my ads doing?", topic: "ads" }, { label: "Show my ad plan", topic: "adplan" }, { label: "My monthly limit", topic: "autopilot" }],
  "/dashboard/citations": [{ label: "Every question and answer", topic: "answers" }, { label: "What are my competitors doing?", topic: "competitors" }, { label: "What’s your plan?", topic: "insights" }],
  "/dashboard/tracking": [{ label: "Is everything counting?", topic: "tracking" }, { label: "Finish setting up", topic: "setup" }, { label: "All my channels", topic: "channels" }],
}

// More: the older detail pages, grouped. Pages that were folded into a workspace (keywords,
// competitors, content ideas, site speed, website health, the ad plan, the content calendar)
// are reached from that workspace, not listed here. `topic` entries open that chat thread in
// place (the website posts & pages queue lives in the "content" thread).
type MoreItem = { href: string; label: string; topic?: string }
const MORE: { title: string; icon: IconName; items: MoreItem[] }[] = [
  { title: "AI search", icon: "spark", items: [
    { href: "/dashboard/sandbox", label: "Ask the AIs" },
    { href: "/dashboard/visibility", label: "AI search, per AI" },
    { href: "/dashboard/citations", label: "Pages AI cites" },
    { href: "/dashboard/vault", label: "What AI reads about you" },
  ] },
  { title: "Website", icon: "globe", items: [
    { href: "/dashboard?ask=content", label: "Website posts & pages", topic: "content" },
    { href: "/dashboard/settings/website", label: "Website connection" },
  ] },
  { title: "Google listing", icon: "pin", items: [
    { href: "/dashboard/posts", label: "Google listing posts" },
    { href: "/dashboard/reviews", label: "Reviews" },
  ] },
  { title: "Reports", icon: "doc", items: [
    { href: "/dashboard/reports", label: "Weekly briefings" },
  ] },
]

const planLabel = (d: ShellData) => (d.growth ? "Growth" : d.pro ? "Pro" : d.planPro ? "Pro" : "Starter")

function greeting(d: ShellData): Message {
  const hi = d.firstName ? `Hi ${d.firstName}.` : "Hi."
  const did = d.doneThisWeek ? ` This week I did ${d.doneThisWeek} thing${d.doneThisWeek === 1 ? "" : "s"} for ${d.businessName}${d.goingOut ? `, and ${d.goingOut} ${d.goingOut === 1 ? "is" : "are"} going out in the next 7 days` : ""}.` : ""
  return agent([{ kind: "text", text: `${hi}${did}\n\nTell me what to focus on, or ask me anything. I do the work and tell you what I did.` }], "ws-hello")
}

// Dev preview only (showUser = false): sample account + websites so the menus can be looked at.
const PREVIEW_SITES: { sites: Site[]; activeId: string } = { activeId: "s1", sites: [
  { id: "s1", name: "Sample Dental", url: "sampledental.example", paid: true, ready: true },
  { id: "s2", name: "Sample Dental Kanata", url: "kanata.sampledental.example", paid: false, ready: true },
  { id: "s3", name: "sample-test", url: "sample-test.myshopify.com", paid: true, ready: true },
  { id: "s4", name: "Sample Bakery", url: "samplebakery.example", paid: true, ready: true, role: "publisher" },
] }

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
  // Light only (owner, 2026-11-26): dark mode is off; the prop stays for the dev preview.
  const theme: DashboardTheme = initialTheme
  const [ap, setAp] = useState(data.autopilot)
  // Teams (lib/team): turning Autopilot on is the owner's legal OK; an admin may turn it off.
  const role = data.role ?? "owner"
  useMemberFetchNotice(role)
  const apAllowed = ap ? can(role, "autopilot") : can(role, "autopilot_consent")
  const [drawer, setDrawer] = useState(false)
  const lit = activeNav(pathname)
  const [more, setMore] = useState(() => moreOpenFor(pathname) || lit.key === "admin")
  useEffect(() => { if (moreOpenFor(pathname)) setMore(true) }, [pathname])
  const [chat, setChat] = useState(false)
  const [mounted, setMounted] = useState(false)
  // The suggestion chips sit in the chat only until the first question.
  const [asked, setAsked] = useState(false)
  const [queue, setQueue] = useState<WsDetail[]>([])
  const [toastText, setToastText] = useState<string | null>(null)
  const [pageIsland, setPageIsland] = useState<string | null>(null)
  const [sbFade, setSbFade] = useState(false)
  const sbt = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const on = (e: Event) => setPageIsland((e as CustomEvent<string | null>).detail ?? null)
    window.addEventListener(ISLAND_EVENT, on)
    return () => window.removeEventListener(ISLAND_EVENT, on)
  }, [])
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hello = useRef<Message[]>([greeting(data)])

  const flash = useCallback((t: string) => {
    setToastText(t)
    if (toastT.current) clearTimeout(toastT.current)
    toastT.current = setTimeout(() => setToastText(null), 2400)
  }, [])


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
  // Autopilot accepted under an older declaration: ask again once per visit.
  useEffect(() => {
    if (!data.consentStale) return
    try { if (sessionStorage.getItem("alphaa.ws.renew") === "1") return; sessionStorage.setItem("alphaa.ws.renew", "1") } catch {}
    const t = window.setTimeout(() => openAutoApprove({ renew: true }), 600)
    return () => window.clearTimeout(t)
  }, [data.consentStale])
  const toggleAp = async () => {
    if (!apAllowed) return flash(ap ? "Only the owner or an admin can turn Autopilot off" : "Only the owner can turn Autopilot on")
    if (ap) { if (!(await turnOffAutoApprove())) flash("That didn’t save. Try again.") }
    else openAutoApprove()
  }

  // The chat: a sheet from the right, mounted on first use and kept, so the conversation survives
  // closing it. Opening remembers where focus was and puts it back on close.
  const showChat = useCallback(() => {
    setChat((c) => {
      if (!c) opener.current = document.activeElement as HTMLElement | null
      return true
    })
    setMounted(true)
    setDrawer(false)
  }, [])
  const hideChat = useCallback(() => {
    setChat((c) => {
      // The ask bar was hidden while the chat was open: focus its new copy when that opened it.
      if (c) window.setTimeout(() => { const o = opener.current; (o && document.contains(o) ? o : document.querySelector<HTMLElement>(".ax .ax-cmd"))?.focus() }, 30)
      return false
    })
  }, [])
  const open = useCallback((d?: WsDetail) => {
    showChat()
    if (d && (d.topic || d.chip || d.say || d.push?.length)) { setAsked(true); setQueue((q) => [...q, d]) }
  }, [showChat])
  useEffect(() => {
    if (!mounted || !queue.length) return
    // Runs after DashboardAgent's own effects in the same commit, so its listeners are there.
    for (const d of queue) {
      if (d.topic) window.dispatchEvent(new CustomEvent<AskDetail>(ASK_EVENT, { detail: { topic: d.topic, label: d.label ?? "" } }))
      if (d.chip || d.say || d.push?.length) window.dispatchEvent(new CustomEvent<AgentEventDetail>(AGENT_EVENT, { detail: { chip: d.chip, say: d.say, push: d.push } }))
    }
    setQueue([])
  }, [mounted, queue])
  // Opening shows the newest message and puts the cursor in the composer; the page behind stops scrolling.
  useEffect(() => {
    if (!chat) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const raf = requestAnimationFrame(() => {
      const panel = chatRef.current
      const feed = panel?.querySelector<HTMLElement>(".ag-scroll")
      if (feed) feed.scrollTop = feed.scrollHeight
      const input = panel?.querySelector<HTMLElement>("#agent-input, .ag-composer input, .ag-composer textarea")
      if (input && window.matchMedia("(pointer: fine)").matches) input.focus({ preventScroll: true })
      else panel?.focus({ preventScroll: true })
    })
    return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev }
  }, [chat])
  useEffect(() => {
    const onWs = (e: Event) => open((e as CustomEvent<WsDetail>).detail)
    const onToast = (e: Event) => flash(String((e as CustomEvent<string>).detail ?? ""))
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        // ⌘K inside the draft editor is "add a link", not the chat.
        if ((e.target as HTMLElement | null)?.closest?.(".dx-root")) return
        e.preventDefault()
        if (chatRef.current && !chatRef.current.hidden) hideChat(); else showChat()
      } else if (e.key === "Escape") {
        // A sheet or menu opened on top of the chat closes first.
        if (document.querySelector(".ax .xd-sheet, .ax .xd-pop, .dx-root")) return
        hideChat()
        setDrawer(false)
      }
    }
    window.addEventListener(WS_EVENT, onWs)
    window.addEventListener(TOAST_EVENT, onToast)
    window.addEventListener("keydown", onKey)
    return () => { window.removeEventListener(WS_EVENT, onWs); window.removeEventListener(TOAST_EVENT, onToast); window.removeEventListener("keydown", onKey) }
  }, [open, flash, showChat, hideChat])
  useEffect(() => setDrawer(false), [pathname])
  // Arriving with ?ask=<topic> (emails, old links, website connect): a fresh chat reads it on
  // mount; an open one gets the topic now.
  const mountedRef = useRef(false)
  mountedRef.current = mounted
  useEffect(() => {
    const topic = new URLSearchParams(window.location.search).get("ask")
    if (!topic) return
    setAsked(true)
    if (!mountedRef.current) return open()
    open({ topic })
    window.history.replaceState(null, "", window.location.pathname)
  }, [pathname, open])
  // Keep Tab inside the open chat (it covers the page with a scrim).
  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !chatRef.current) return
    const items = Array.from(chatRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter((n) => n.offsetParent !== null)
    if (!items.length) return
    const first = items[0], last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  // The sidebar shows a soft fade at the bottom while there is more to scroll to.
  const checkFade = useCallback(() => {
    const el = sbt.current
    if (el) setSbFade(el.scrollHeight - el.scrollTop - el.clientHeight > 8)
  }, [])
  useEffect(() => {
    checkFade()
    window.addEventListener("resize", checkFade)
    return () => window.removeEventListener("resize", checkFade)
  }, [checkFade, more, drawer])

  // Swipe the drawer left to close it (phones).
  const swipe = useRef<number | null>(null)

  const isWs = isStageRoute(pathname)
  const suggest = SUGGEST[pathname] ?? SUGGEST["/dashboard"]
  const ni = (key: NavKey, href: string, label: string, icon: IconName, extra?: React.ReactNode) => {
    const on = lit.key === key
    return (
      <Link className={`ax-ni${on ? " on" : ""}`} href={href} aria-current={on ? "page" : undefined}>
        <span className="l"><Icon name={icon} />{label}</span>{extra}
      </Link>
    )
  }
  // Upgrade tags only where the plan doesn't include the workspace (Email: Pro, Ads: Growth).
  const tag = (need: "Pro" | "Growth") => (need === "Pro" ? !data.pro : !data.growth) ? <span className="ax-tag">{need}</span> : null
  const failing = data.signals ? data.signals.total - data.signals.ok : 0
  const island = `Working on ${data.channels} channel${data.channels === 1 ? "" : "s"} · ${data.goingOut ? `${data.goingOut} going out this week` : "planning what goes out next"}`

  return (
    <RoleContext.Provider value={role}>
    <div data-dashboard-root="" data-agent="" data-theme={theme} data-brand="blue">
      <div className="ax">
        <div className="ax-top">
          <button type="button" className="ic" onClick={() => setDrawer(true)} aria-label="Open menu" aria-expanded={drawer}><Icon name="more" size={22} /></button>
          <Link href="/dashboard" className="mid"><span className="ax-orb" style={{ width: 16, height: 16 }} />Alphaa</Link>
          <span style={{ width: 38 }} aria-hidden="true" />
        </div>
        <div className={`ax-scrim${drawer ? " open" : ""}`} onClick={() => setDrawer(false)} aria-hidden="true" />
        <aside className={`ax-sb${drawer ? " open" : ""}`} aria-label="Workspaces"
          onTouchStart={(e) => { swipe.current = e.touches[0]?.clientX ?? null }}
          onTouchEnd={(e) => { const x0 = swipe.current; swipe.current = null; const x1 = e.changedTouches[0]?.clientX; if (drawer && x0 != null && x1 != null && x0 - x1 > 60) setDrawer(false) }}>
          <div ref={sbt} className={`ax-sbt${sbFade ? " fade" : ""}`} onScroll={checkFade}>
            <div className="ax-brand">
              <span className="ax-orb" style={{ width: 30, height: 30 }} />
              <span><b>Alphaa</b><small>{!showUser ? data.businessName : role !== "owner" ? `${ROLE_LABEL[role]} on this brand` : "Your marketing agent"}</small></span>
              <button type="button" className="ax-x ax-sbclose" aria-label="Close menu" onClick={() => setDrawer(false)}><Icon name="x" size={16} /></button>
            </div>
            <div className="ax-site"><SiteSwitcher name={data.businessName} sample={showUser ? undefined : PREVIEW_SITES} /></div>
            <p className="ax-sec">Command</p>
            <nav className="ax-nav">{ni("briefing", "/dashboard", "Briefing", "briefing")}</nav>
            <p className="ax-sec">Agent workspaces</p>
            <nav className="ax-nav">
              {ni("research", "/dashboard/research", "Research & Ideas", "research")}
              {ni("social", "/dashboard/social", "Social Studio", "social", data.socialScheduled ? <span className="ax-bdg" title={`${data.socialScheduled} going out this week`}>{data.socialScheduled}</span> : tag("Pro"))}
              {ni("calendar", "/dashboard/social/calendar", "Calendar", "calendar")}
              {ni("email", "/dashboard/email", "Email & Flows", "email", tag("Pro"))}
              {ni("ads", "/dashboard/ads", "Ads", "ads", tag("Growth"))}
              {ni("tracking", "/dashboard/tracking", "Tracking & Setup", "tracking", data.trackingNeeds ? <span className="ax-bdg amber" title={`${data.trackingNeeds} to finish`}>{data.trackingNeeds}</span> : null)}
            </nav>
            <nav className="ax-nav">
              {ni("settings", "/dashboard/settings", "Settings", "rules")}
              <button type="button" className={`ax-ni${lit.key === "more" && !more ? " on" : ""}`} onClick={() => setMore(!more)} aria-expanded={more} aria-controls="ax-more">
                <span className="l"><Icon name="more" />More</span>
                <span className={`ax-chev${more ? " open" : ""}`}><Icon name="chevron" size={14} /></span>
              </button>
              {more && (
                <div id="ax-more" className="ax-more">
                  {MORE.map((g) => (
                    <div key={g.title} className="ax-more__g">
                      <p className="ax-more__h"><Icon name={g.icon} size={14} />{g.title}</p>
                      {g.items.map((m) => m.topic ? (
                        <Link key={m.href} href={m.href} className="ax-ni sm" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); open({ topic: m.topic, label: m.label }) }}>{m.label}</Link>
                      ) : (
                        <Link key={m.href} href={m.href} className={`ax-ni sm${lit.moreHref === m.href ? " on" : ""}`} aria-current={lit.moreHref === m.href ? "page" : undefined}>{m.label}</Link>
                      ))}
                    </div>
                  ))}
                  {admin && (
                    <div className="ax-more__g">
                      <p className="ax-more__h"><Icon name="shield" size={14} />Admin only</p>
                      <Link href="/dashboard/admin/usage" className={`ax-ni sm${pathname.startsWith("/dashboard/admin/usage") ? " on" : ""}`}>Usage</Link>
                      <Link href="/dashboard/admin/ds" className={`ax-ni sm${pathname.startsWith("/dashboard/admin/ds") ? " on" : ""}`}>Design system</Link>
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>
          <div className="ax-sbb">
            <div className="ax-row">
              <div><div className="ax-t13">Autopilot</div><div className="ax-t11">{ap ? "On · stop anything before it goes out" : "Off · I ask before anything goes out"}{!apAllowed && role !== "owner" ? " · the owner decides" : ""}</div></div>
              <button type="button" role="switch" aria-checked={ap} aria-label="Autopilot" aria-disabled={!apAllowed} onClick={() => void toggleAp()} className={`ax-sw${ap ? " on" : ""}${apAllowed ? "" : " off"}`}><i /></button>
            </div>
            <div className="ax-acct">
              {showUser
                ? <AccountMenu plan={planLabel(data)} />
                : <AccountMenuView who={{ name: data.firstName ? `${data.firstName} Sample` : null, email: "owner@sample.example", image: null }} plan={planLabel(data)} onSecurity={() => flash("Preview only")} onSignOut={() => flash("Preview only")} />}
            </div>
          </div>
        </aside>

        <main className="ax-main">
          <div className="ax-island" role="status">
            <span className="ax-orb" style={{ width: 14, height: 14 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{pageIsland ?? island}</span>
            {data.signals && <span className={`chip${failing ? "" : " ok"}`}>{data.signals.ok}/{data.signals.total} signals</span>}
          </div>
          {isWs ? (
            <div className="ax-stage">{children}</div>
          ) : (
            <div className="ag-main ax-legacy"><div className="ag-legacy">{children}</div></div>
          )}
        </main>

        {!chat && (
          <div className="ax-cmdw">
            <div className="ax-chips">
              {suggest.map((s) => <button key={s.label} type="button" onClick={() => open({ topic: s.topic, say: s.say, label: s.topic ? s.label : undefined })}>{s.label}</button>)}
            </div>
            <button type="button" className="ax-cmd" onClick={() => open()} aria-label="Ask Alphaa" aria-keyshortcuts="Meta+K">
              <span className="ax-orb" style={{ width: 14, height: 14 }} />
              <span className="ph">Tell me what to focus on, or ask anything</span>
              <span className="ax-kbd">⌘K</span>
              <span className="ax-send"><SendArrow /></span>
            </button>
          </div>
        )}
        {mounted && (
          <>
            <div className={`ax-chatscrim${chat ? " open" : ""}`} onClick={hideChat} aria-hidden="true" />
            <section ref={chatRef} className="ax-chatp" role="dialog" aria-modal="true" aria-label="Chat with Alphaa" hidden={!chat} tabIndex={-1} onKeyDown={trapTab}
              onClickCapture={(e) => { if ((e.target as HTMLElement).closest(".ag-chip, .ag-weekbtn, .ag-composer button")) setAsked(true) }}
              onSubmitCapture={() => setAsked(true)}>
              <header>
                <span className="ax-orb" style={{ width: 26, height: 26 }} />
                <div className="who"><b>Alphaa</b><small>I do the work and tell you what I did.</small></div>
                <button className="ax-x" type="button" aria-label="Close chat" onClick={hideChat}><Icon name="x" size={16} /></button>
              </header>
              {!asked && (
                <div className="ax-chatchips">
                  {suggest.map((s) => <button key={s.label} type="button" onClick={() => open({ topic: s.topic, say: s.say, label: s.topic ? s.label : undefined })}>{s.label}</button>)}
                </div>
              )}
              <div className="ag-main">
                <DashboardAgent initial={hello.current} businessName={data.businessName} current={pathname} composerOpen />
              </div>
              <p className="ax-ainote">{AI_NOTE}</p>
            </section>
          </>
        )}

        {toastText && <div className="ax-toast" role="status"><Check />{toastText}</div>}
        <AutoApproveModal pro={data.planPro} growth={data.pro} />
        <CreditsSheet />
        <BannedWordConfirm />
      </div>
    </div>
    </RoleContext.Provider>
  )
}
