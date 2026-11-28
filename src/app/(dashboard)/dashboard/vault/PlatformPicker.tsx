"use client"

import { useState } from "react"
import { FilterPills } from "@/components/workspace/ui"

type Platform = { id: string; label: string; steps: string[]; caveat?: string }

// Steps are worded so they stay true even if a platform renames a menu. Where the exact path isn't
// certain, the area is described instead of inventing a menu name.
const PLATFORMS: Platform[] = [
  {
    id: "wordpress",
    label: "WordPress",
    steps: [
      "Log in to your WordPress admin (usually yoursite.com/wp-admin).",
      "If your theme has a header scripts box (plugins like Insert Headers and Footers add one), paste the code there.",
      "Otherwise open Appearance, Theme File Editor, header.php, and paste the code just before the </head> line. Save.",
    ],
    caveat: "A theme update can overwrite header.php. If that sounds risky, send it to whoever manages your site.",
  },
  {
    id: "shopify",
    label: "Shopify",
    steps: [
      "In your Shopify admin, open Online Store, Themes.",
      "On your current theme, open the three dot menu and choose Edit code.",
      "Open theme.liquid, paste the code just before the </head> line, and save.",
    ],
  },
  {
    id: "webflow",
    label: "Webflow",
    steps: [
      "Open your project, then Site settings, Custom code.",
      "Paste the code into the Head code box.",
      "Save, then publish your site so the change goes live.",
    ],
  },
  {
    id: "wix",
    label: "Wix",
    steps: [
      "In your Wix dashboard, open Settings, Custom code.",
      "Choose Add code, paste it, and place it in the Head.",
      "Apply it to all pages, then save and publish.",
    ],
    caveat: "Wix needs a paid plan to add custom code.",
  },
  {
    id: "squarespace",
    label: "Squarespace",
    steps: [
      "In your Squarespace dashboard, open Settings, Advanced, Code injection.",
      "Paste the code into the Header box.",
      "Save. It applies to every page on your site.",
    ],
    caveat: "Code injection needs a Squarespace Business plan or higher.",
  },
  {
    id: "other",
    label: "Something else",
    steps: [
      "Find where your site’s page header is set: a template file, or a custom code or header scripts area in your site tool.",
      "Paste the code so it sits just before the closing </head> tag.",
      "Save and publish. Not sure where that is? Send it to whoever manages your website.",
    ],
  },
]

export function PlatformPicker({ mailtoHref, initial = "wordpress" }: { mailtoHref: string; initial?: string }) {
  const [selected, setSelected] = useState<string>(PLATFORMS.some((p) => p.id === initial) ? initial : "wordpress")
  const platform = PLATFORMS.find((p) => p.id === selected) ?? PLATFORMS[0]

  return (
    <div className="xp-stack">
      <FilterPills label="How your website was built" scroll value={selected} onChange={setSelected} options={PLATFORMS.map((p) => ({ value: p.id, label: p.label }))} />
      <ol className="xp-mini-steps">{platform.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      {platform.caveat && <p className="ax-p">Good to know: {platform.caveat}</p>}
      <div><a className="ax-btn s" href={mailtoHref}>Email it to my web person</a></div>
    </div>
  )
}
