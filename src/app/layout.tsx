import type { Metadata } from "next"
import Script from "next/script"
import { ConsentBanner } from "@/components/common/ConsentBanner"
import { HtmlLang } from "@/components/common/HtmlLang"
import { PATH_LANG_JS } from "@/lib/path-lang"
import { Toaster } from "sonner"
import "./globals.css"
import "./agent.css"
import "./apple.css"

// Apple's own type: the system font stack (SF Pro on Apple devices), defined
// as --font-apple in globals.css. No web fonts to download at all.
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID

export const metadata: Metadata = {
  title: {
    default: "Alphaa — Get Recommended by ChatGPT, Gemini & Claude",
    template: "%s | Alphaa",
  },
  description:
    "Alphaa is an AI Agent that gets your business recommended by ChatGPT, Gemini, Claude and Perplexity. It does the work; you approve. $99/month, month to month.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"),
  // Defaults for pages that don't declare their own card. No og:url here: a
  // root og:url made every inheriting page claim to be the homepage.
  openGraph: {
    title: "Alphaa AI Agent — Get Recommended by ChatGPT, Gemini, Claude and Perplexity",
    description: "Get customers from ChatGPT. Your AI Agent does the work. $99/month, month to month.",
    siteName: "Alphaa",
    type: "website",
    images: [{ url: "/og", width: 1200, height: 630, alt: "Alphaa: get customers from ChatGPT. Your AI Agent does the work." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alphaa AI Agent — Get Recommended by ChatGPT, Gemini, Claude and Perplexity",
    description: "Get customers from ChatGPT. Your AI Agent does the work. $99/month, month to month.",
    images: ["/og"],
  },
  // No site-wide canonical: a root default made every page point at the homepage,
  // so Google dropped them as duplicates. Each page declares its own.
}

// Brand-entity structured data. Tells Google "Alphaa" is a distinct organization
// (not a typo of "alpha"), which is what earns a brand panel / sitelinks and
// stops the "did you mean alpha" correction over time. Add real logo + sameAs
// (social profile URLs) to strengthen the entity further.
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Alphaa",
  alternateName: ["Alphaa App", "alphaa.app"],
  url: "https://alphaa.app",
  email: "hi@alphaa.app",
  description:
    "Alphaa is an AI search optimization (AEO) agent that checks what ChatGPT, Gemini, Claude and Perplexity say about a business every week and works to get it found, cited and recommended by those 4 AIs.",
  logo: "https://alphaa.app/logo.png",
  sameAs: ["https://www.linkedin.com/company/135966599/", "https://www.facebook.com/61592044887737", "https://www.instagram.com/alphaa.ai.agent/", "https://medium.com/@alphaaaiagent"],
}

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Alphaa",
  alternateName: "alphaa.app",
  url: "https://alphaa.app",
  publisher: { "@type": "Organization", name: "Alphaa" },
}

// ClerkProvider deliberately does NOT wrap the whole app. Clerk's browser SDK is
// ~300 KiB and only (auth) and (dashboard) render client-side Clerk components;
// every other file uses @clerk/nextjs/server, which works off middleware and
// needs no provider. Mounting it at the root shipped the whole auth SDK to
// every marketing visitor. Those two route groups mount it themselves.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // lang/dir follow the route (lib/path-lang.ts): set before first paint by the
    // inline script below and kept in sync on navigation by <HtmlLang />.
    <html lang="en" dir="ltr" data-theme="light" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: PATH_LANG_JS }} />
          {/* No preconnect to fonts.googleapis.com / fonts.gstatic.com: fonts are
              self-hosted via next/font now, so those origins are never hit.
              Lighthouse was flagging both as unused preconnects. */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
          />
          {/* Cookie consent (GDPR / UK GDPR / UAE PDPL): visitors in Europe or
              the UAE (by time zone), or on the /uk /de /fr /it /ae pages, get
              analytics and ads cookies only after they accept. Runs before GA
              and the pixel so both start denied. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var c=null;try{c=localStorage.getItem('alphaa.consent')}catch(e){}var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}var seg=location.pathname.split('/')[1]||'';var eu=tz.indexOf('Europe/')===0||['Atlantic/Canary','Atlantic/Madeira','Atlantic/Azores','Atlantic/Reykjavik','Atlantic/Faroe','Arctic/Longyearbyen','Asia/Nicosia','Asia/Famagusta','Asia/Dubai'].indexOf(tz)>-1||['uk','de','fr','it','ae'].indexOf(seg)>-1;window.__ccEu=eu;window.__ccNeed=eu&&!c;window.__ccDenied=(eu&&c!=='granted')||c==='denied';window.dataLayer=window.dataLayer||[];function g(){dataLayer.push(arguments)}if(window.__ccDenied){g('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'})}})();`,
            }}
          />
          {/* GA4 — only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set. Same rule as
              the pixel: where consent is needed (window.__ccDenied) the gtag
              script is not loaded at all until Accept (ConsentBanner calls
              window.__alphaaGA()); never on Reject. */}
          {GA_ID && (
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.__alphaaGA=function(){if(window.__gaOn)return;window.__gaOn=1;var t=document.createElement('script');t.async=true;t.src='https://www.googletagmanager.com/gtag/js?id=${GA_ID}';document.head.appendChild(t);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${GA_ID}')};if(!window.__ccDenied)window.__alphaaGA();`,
              }}
            />
          )}
          {/* Meta Pixel — only when NEXT_PUBLIC_FB_PIXEL_ID is set. Where consent
              is needed (window.__ccDenied) nothing is loaded from Meta and
              nothing fires until the visitor taps Accept: ConsentBanner calls
              window.__alphaaPixel(). On Reject it is never loaded. PageView
              fires on load; funnel events fire from lib/pixel.ts (no-op while
              fbq is undefined). No <noscript> pixel: it can't check consent. */}
          {FB_PIXEL_ID && (
            <Script
              id="fb-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.__alphaaPixel=function(){if(window.__pxOn)return;window.__pxOn=1;!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${FB_PIXEL_ID}');fbq('track','PageView')};if(!window.__ccDenied)window.__alphaaPixel();`,
              }}
            />
          )}
        </head>
        <body className="bg-bg-primary text-fg font-sans antialiased">
          <HtmlLang />
          <ConsentBanner />
          <div className="dot-grid" aria-hidden="true" />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "rgb(var(--bg-secondary-rgb))",
                border: "1px solid var(--card-border)",
                color: "rgb(var(--fg-rgb))",
              },
            }}
          />
        </body>
    </html>
  )
}
