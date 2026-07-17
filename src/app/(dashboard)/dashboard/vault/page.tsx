export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import GenerateSchemaButton from "../audit/GenerateSchemaButton"
import CopyButton from "../audit/CopyButton"
import { DownloadLlmsButton } from "../audit/DownloadLlmsButton"
import type { SchemaItem } from "@/lib/schema-generator"
import { generateLlmsTxt } from "@/lib/llms-txt"
import { StatusPill } from "@/components/dashboard/StatusPill"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import { DsCard } from "@/components/dashboard/DsCard"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { PlatformPicker } from "./PlatformPicker"
import { Code2 } from "lucide-react"

export const metadata = { title: "What AI reads about you" }

// Schema types that describe the actual business (or its answers) — the ones
// that matter for an AI engine describing you. Matching is case-insensitive and
// covers the specific LocalBusiness subtypes our generator emits (Dentist,
// Plumber, Restaurant, …) via the suffix/keyword checks below.
const BUSINESS_TYPE_PLAIN: Record<string, string> = {
  localbusiness: "your business name, address and phone",
  organization: "your business name and details",
  faqpage: "your questions and answers",
  qapage: "your questions and answers",
  service: "the services you offer",
  product: "the products you sell",
  restaurant: "your restaurant details",
  menu: "your menu",
  menusection: "your menu",
  dentist: "your practice details",
  physician: "your practice details",
  medicalbusiness: "your practice details",
  legalservice: "your practice details",
  professionalservice: "your business details",
  homeandconstructionbusiness: "your business details",
  beautysalon: "your salon details",
  store: "your store details",
  review: "your reviews",
  aggregaterating: "your star rating",
  postaladdress: "your address",
  openinghoursspecification: "your opening hours",
  breadcrumblist: "how your pages link together",
  website: "your website name",
  webpage: "your page details",
  article: "your articles",
  blogposting: "your blog posts",
  person: "the people behind your business",
}

const NON_BUSINESS = new Set(["breadcrumblist", "website", "webpage", "article", "blogposting"])

function isBusinessType(type: string): boolean {
  const t = type.toLowerCase()
  if (NON_BUSINESS.has(t)) return false
  if (BUSINESS_TYPE_PLAIN[t]) return true
  // Unknown types that still look like a business/answer entity.
  return (
    t.endsWith("business") ||
    t.endsWith("service") ||
    t.endsWith("store") ||
    t.endsWith("shop") ||
    t.includes("faq")
  )
}

function plainName(type: string): string {
  return BUSINESS_TYPE_PLAIN[type.toLowerCase()] ?? `your ${type} details`
}

export default async function VaultPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/login")

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/login")

  const latestSchema = await db.schemaMarkup.findFirst({
    where: { userId: user.id },
    orderBy: { generatedAt: "desc" },
  })
  const schemas = Array.isArray(latestSchema?.schemas)
    ? (latestSchema.schemas as unknown as SchemaItem[])
    : []

  const latestCrawl = await db.crawlResult.findFirst({
    where: { userId: user.id },
    orderBy: { crawledAt: "desc" },
  })

  // Real, measured status — derived only from what the crawler actually found on
  // the live site. Never assume a state we have not measured.
  const schemaFound: string[] = Array.isArray(latestCrawl?.schemaFound)
    ? (latestCrawl.schemaFound as unknown[]).filter((t): t is string => typeof t === "string")
    : []
  const businessTypesFound = schemaFound.filter(isBusinessType)

  type StatusKind = "none" | "empty" | "partial" | "good"
  let status: StatusKind = "none"
  if (!latestCrawl) status = "none"
  else if (schemaFound.length === 0) status = "empty"
  else if (businessTypesFound.length === 0) status = "partial"
  else status = "good"

  const llmsTxt = generateLlmsTxt(user)

  const appBase = process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
  const tagSnippet = `<script async src="${appBase}/tag.js?id=${user.id}"></script>`

  const firstSchemaBlock = schemas[0]
    ? `<script type="application/ld+json">\n${JSON.stringify(schemas[0].jsonLd, null, 2)}\n</script>`
    : ""

  const mailBody = `Hi,

Could you add the code below to ${user.businessName || "our"} website? It goes in the page header, just before the closing </head> tag, so it appears on every page.

It is standard schema.org structured data. It tells Google and AI assistants like ChatGPT, Claude and Perplexity who we are. It does not change how the site looks.

--- code starts ---
${firstSchemaBlock || "(the code is in our alphaa dashboard)"}
--- code ends ---

Thank you!`

  const mailtoHref = `mailto:?subject=${encodeURIComponent(
    `Please add this code to our website${user.businessName ? ` (${user.businessName})` : ""}`
  )}&body=${encodeURIComponent(mailBody)}`

  const statusPill =
    status === "good" ? (
      <StatusPill variant="found">Working</StatusPill>
    ) : status === "empty" ? (
      <StatusPill variant="error">Action needed</StatusPill>
    ) : status === "partial" ? (
      <StatusPill variant="warning">Partly there</StatusPill>
    ) : (
      <StatusPill variant="neutral">Checking</StatusPill>
    )

  const statusHeadline =
    status === "good"
      ? "AI can read your business details"
      : status === "empty"
        ? "AI engines can’t read your business details yet"
        : status === "partial"
          ? "AI can read your pages, but not your business details yet"
          : "alphaa is checking your site"

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto" }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: "18px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ds-text)" }}>
          What AI reads about you
        </h1>
        <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", marginTop: "4px", lineHeight: 1.6 }}>
          ChatGPT, Claude and Perplexity read the plain code of your website — they don&apos;t click
          around like a person does. Adding the code below is the single most useful thing you can do
          to be described correctly.
        </p>
      </div>

      {/* ── Real status ─────────────────────────────────────── */}
      <DsCard
        accent={
          status === "good"
            ? "var(--ds-ok)"
            : status === "empty"
              ? "var(--ds-bad)"
              : status === "partial"
                ? "var(--ds-warn)"
                : "var(--ds-border-3)"
        }
        style={{
          background:
            status === "good"
              ? "var(--ds-ok-bg)"
              : status === "empty"
                ? "var(--ds-bad-bg)"
                : status === "partial"
                  ? "var(--ds-warn-bg)"
                  : "var(--ds-surface-2)",
          marginBottom: "6px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--ds-text)" }}>
            {status === "empty"
              ? "AI engines can't read your business details yet"
              : statusHeadline}
          </span>
          {statusPill}
        </div>

        {status === "good" && (
          <div style={{ marginTop: "8px" }}>
            <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6 }}>
              When alphaa last checked your site, AI engines could read:
            </p>
            <ul style={{ margin: "6px 0 0", padding: 0, listStyle: "none" }}>
              {businessTypesFound.map((t) => (
                <li
                  key={t}
                  style={{ fontSize: "13px", color: "var(--ds-text-strong)", lineHeight: 1.7 }}
                >
                  · {plainName(t)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {status === "partial" && (
          <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6, marginTop: "6px" }}>
            alphaa found some code on your site, but nothing that describes your business itself.
            Adding the code below fixes that.
          </p>
        )}

        {status === "empty" && (
          <p style={{ fontSize: "13px", color: "var(--ds-bad-soft)", lineHeight: 1.6, marginTop: "6px" }}>
            alphaa checked your site and found no code describing your business. That means AI
            engines have to guess who you are. Copy the code in Step 1 and paste it onto your site —
            Step 2 shows you exactly where.
          </p>
        )}

        {status === "none" && (
          <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6, marginTop: "6px" }}>
            alphaa is checking your site — this updates after the first check, and then every week.
          </p>
        )}

        {latestCrawl && (
          <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", marginTop: "10px" }}>
            Based on alphaa&apos;s check of {latestCrawl.url} on {formatDate(latestCrawl.crawledAt)}.
          </p>
        )}
      </DsCard>

      {/* ── Step 1 — the paste block ────────────────────────── */}
      <SectionDivider>STEP 1 — COPY YOUR CODE</SectionDivider>
      {!latestSchema || schemas.length === 0 ? (
        <EmptyState
          icon={Code2}
          title="alphaa writes the code that tells AI who you are"
          body="This is the plain code ChatGPT, Claude and Perplexity read to describe your business correctly. alphaa creates it from your business details — it takes a moment."
          sub="Once it exists, you copy it here and paste it onto your site."
        >
          <GenerateSchemaButton prominent />
        </EmptyState>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <p style={{ fontSize: "11px", color: "var(--ds-text-faint)" }}>
              Written {formatDate(latestSchema.generatedAt)} · {schemas.length} block
              {schemas.length !== 1 ? "s" : ""} ready to paste
            </p>
            <GenerateSchemaButton />
          </div>
          {schemas.map((schema, i) => {
            const block = `<script type="application/ld+json">\n${JSON.stringify(
              schema.jsonLd,
              null,
              2
            )}\n</script>`
            return (
              <DsCard key={i}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <StatusPill variant="info">{plainName(schema.type)}</StatusPill>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--ds-text-faint)",
                        fontFamily: "monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      goes on {schema.pageUrl}
                    </span>
                  </div>
                  <CopyButton text={block} />
                </div>
                <pre
                  style={{
                    background: "var(--ds-bg)",
                    border: "1px solid var(--ds-border)",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "11px",
                    color: "var(--ds-text-mute)",
                    fontFamily: "monospace",
                    overflowX: "auto",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {block}
                </pre>
              </DsCard>
            )
          })}
        </div>
      )}

      {/* ── Step 2 — where to paste it ──────────────────────── */}
      <SectionDivider>STEP 2 — PASTE IT ONTO YOUR SITE</SectionDivider>
      <DsCard>
        <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6, marginBottom: "14px" }}>
          Pick how your website was built and follow the three steps. If you&apos;re not sure, ask
          whoever set up your site — or use the button at the bottom to send it to them.
        </p>
        <PlatformPicker mailtoHref={mailtoHref} />
      </DsCard>

      {/* ── Step 3 — optional JS snippet ────────────────────── */}
      <SectionDivider>STEP 3 — OPTIONAL EXTRA</SectionDivider>
      <DsCard>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--ds-text)" }}>
            Optional extra that keeps Google&apos;s copy fresh automatically
          </span>
          <StatusPill variant="neutral">Optional</StatusPill>
        </div>
        <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6, marginBottom: "12px" }}>
          Add this one line before your site&apos;s &lt;/head&gt; tag — the same place as Step 2.
          alphaa then keeps your details up to date automatically: your business information plus any
          code written here (questions and answers, services, and more). No re-pasting when anything
          changes.
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            background: "var(--ds-bg)",
            border: "1px solid var(--ds-border)",
            borderRadius: "8px",
            padding: "10px 12px",
          }}
        >
          <code
            style={{
              fontSize: "11px",
              color: "var(--ds-text-mute)",
              fontFamily: "monospace",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {tagSnippet}
          </code>
          <CopyButton text={tagSnippet} />
        </div>
        <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", marginTop: "10px", lineHeight: 1.6 }}>
          Important: this snippet adds your details using JavaScript, and only Google (and Google&apos;s
          AI) runs JavaScript when it reads your site. ChatGPT, Claude and Perplexity read the plain
          page only — so to be understood by those, use the copy-paste version in Step 1 (or ask
          whoever manages your website to add it). The snippet is still worth using: alphaa keeps it
          current for Google automatically.
        </p>
      </DsCard>

      {/* ── llms.txt ────────────────────────────────────────── */}
      <SectionDivider>ALSO: A SHORT SUMMARY FOR AI</SectionDivider>
      <DsCard>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--ds-text)" }}>
            llms.txt — a plain summary of who you are, written for AI
          </span>
          <StatusPill variant="found">Written</StatusPill>
        </div>
        <p
          style={{
            fontSize: "11px",
            color: "var(--ds-text-faint)",
            fontFamily: "monospace",
            marginBottom: "12px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Hosted at: alphaa.app/llms/{user.id}
        </p>
        <pre
          style={{
            background: "var(--ds-bg)",
            border: "1px solid var(--ds-border)",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "11px",
            color: "var(--ds-text-mute)",
            fontFamily: "monospace",
            overflowX: "auto",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {llmsTxt}
        </pre>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
          <DownloadLlmsButton content={llmsTxt} />
          <span style={{ fontSize: "11px", color: "var(--ds-text-faint)", lineHeight: 1.6 }}>
            alphaa keeps this updated automatically. To add it to your own site, download it and
            upload to yourdomain.com/llms.txt.
          </span>
        </div>
      </DsCard>
    </div>
  )
}
