"use client"

import { useState } from "react"

type Platform = {
  id: string
  label: string
  steps: string[]
  caveat?: string
}

// Steps are deliberately worded so they stay true even if a platform renames a
// menu. Where we are not certain of the exact path, we describe the area instead
// of inventing a menu name.
const PLATFORMS: Platform[] = [
  {
    id: "wordpress",
    label: "WordPress",
    steps: [
      "Log in to your WordPress admin (usually yoursite.com/wp-admin).",
      "If your theme has a header or scripts box (many themes call it \"Header Scripts\", and plugins like Insert Headers and Footers add one), paste the code there.",
      "Otherwise go to Appearance → Theme File Editor, open header.php, and paste the code just before the </head> line. Save.",
    ],
    caveat:
      "Editing header.php directly is safest with a child theme — a theme update can overwrite it. If that sounds risky, send it to whoever manages your site instead.",
  },
  {
    id: "shopify",
    label: "Shopify",
    steps: [
      "In your Shopify admin, go to Online Store → Themes.",
      "On your current theme, click the three-dot menu → Edit code.",
      "Open theme.liquid, paste the code just before the </head> line, and save.",
    ],
  },
  {
    id: "webflow",
    label: "Webflow",
    steps: [
      "Open your project, then go to Project Settings → Custom Code.",
      "Paste the code into the \"Head Code\" box.",
      "Save, then publish your site so the change goes live.",
    ],
  },
  {
    id: "wix",
    label: "Wix",
    steps: [
      "In your Wix dashboard, go to Settings → Custom Code.",
      "Click \"Add Code\", paste the code, and choose to place it in the Head.",
      "Apply it to all pages, then save and publish.",
    ],
    caveat: "Wix requires a paid plan to add custom code.",
  },
  {
    id: "squarespace",
    label: "Squarespace",
    steps: [
      "In your Squarespace dashboard, go to Settings → Advanced → Code Injection.",
      "Paste the code into the \"Header\" box.",
      "Save. It applies to every page on your site.",
    ],
    caveat: "Code Injection requires a paid Squarespace plan (Business or higher).",
  },
  {
    id: "other",
    label: "Other / custom",
    steps: [
      "Find where your site's page header is defined — a template file, or a \"custom code\" / \"header scripts\" area in your site tool.",
      "Paste the code so it sits just before the closing </head> tag.",
      "Save and publish. If you are not sure where that is, send it to whoever manages your website using the button below.",
    ],
  },
]

export function PlatformPicker({ mailtoHref }: { mailtoHref: string }) {
  const [selected, setSelected] = useState<string>("wordpress")
  const platform = PLATFORMS.find((p) => p.id === selected) ?? PLATFORMS[0]

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
        {PLATFORMS.map((p) => {
          const active = p.id === selected
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              style={{
                background: active ? "var(--ds-accent)" : "transparent",
                color: active ? "var(--ds-text)" : "var(--ds-text-mute)",
                border: `1px solid ${active ? "var(--ds-accent)" : "var(--ds-border-3)"}`,
                borderRadius: "20px",
                padding: "5px 14px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      <ol style={{ display: "flex", flexDirection: "column", gap: "10px", margin: 0, padding: 0, listStyle: "none" }}>
        {platform.steps.map((step, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <span
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "var(--ds-surface)",
                border: "1px solid var(--ds-border-2)",
                color: "var(--ds-text-mute)",
                fontSize: "11px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: "1px",
              }}
            >
              {i + 1}
            </span>
            <p style={{ flex: 1, fontSize: "13px", color: "var(--ds-text-strong)", lineHeight: 1.6 }}>{step}</p>
          </li>
        ))}
      </ol>

      {platform.caveat && (
        <p
          style={{
            fontSize: "12px",
            color: "var(--ds-warn)",
            background: "var(--ds-warn-bg)",
            border: "1px solid var(--ds-warn-border)",
            borderRadius: "8px",
            padding: "8px 12px",
            marginTop: "12px",
            lineHeight: 1.6,
          }}
        >
          Heads up: {platform.caveat}
        </p>
      )}

      <div style={{ marginTop: "14px" }}>
        <a
          href={mailtoHref}
          style={{
            display: "inline-block",
            background: "transparent",
            border: "1px solid var(--ds-border-3)",
            color: "var(--ds-text-mute)",
            borderRadius: "8px",
            padding: "7px 14px",
            fontSize: "12px",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Send this to whoever manages my website
        </a>
      </div>
    </div>
  )
}
