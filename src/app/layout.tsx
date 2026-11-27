import type { Metadata } from "next"
import Script from "next/script"
import { ConsentBanner } from "@/components/common/ConsentBanner"
import { HtmlLang } from "@/components/common/HtmlLang"
import { PATH_LANG_JS } from "@/lib/path-lang"
import { CONSENT_JS } from "@/lib/consent-script"
import { Toaster } from "sonner"
import "./globals.css"
import "./agent.css"
import "./agent-v2.css"
import "./apple.css"

// Apple's own type: the system font stack (SF Pro on Apple devices), defined
// as --font-apple in globals.css. No web fonts to download at all.
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID

export const metadata: Metadata = {
  title: {
    default: "Alphaa: AI Marketing Agent for Small Businesses",
    template: "%s | Alphaa",
  },
  description:
    "Alphaa is an AI agent that runs your marketing: getting recommended by ChatGPT and Google, social posts, Google posts, reviews and email, with Google and Meta ads in early access. It does the work; you approve. From $99/month, month to month.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"),
  // Defaults for pages that don't declare their own card. No og:url here: a
  // root og:url made every inheriting page claim to be the homepage.
  openGraph: {
    title: "Alphaa: Your entire marketing, run by an AI agent",
    description: "AI search, social posts, Google posts, reviews and email, done for you every week, with ads in early access. You approve. From $99/month.",
    siteName: "Alphaa",
    type: "website",
    images: [{ url: "/og", width: 1200, height: 630, alt: "Alphaa: your entire marketing, run by an AI agent." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alphaa: Your entire marketing, run by an AI agent",
    description: "AI search, social posts, Google posts, reviews and email, done for you every week, with ads in early access. You approve. From $99/month.",
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
  legalName: "9629033 Canada INC",
  alternateName: ["Alphaa App", "alphaa.app"],
  url: "https://alphaa.app",
  email: "hi@alphaa.app",
  description:
    "Alphaa is an AI marketing agent for small businesses. It does SEO and AI search optimization (AEO), blog and Google Business Profile posts, review replies, social media posts and email marketing, with Google and Meta ads management in early access, and checks what ChatGPT, Gemini, Claude and Perplexity say about the business every week.",
  logo: "https://alphaa.app/logo.png",
  address: { "@type": "PostalAddress", streetAddress: "1000 Innovation Drive, Suite 500", addressLocality: "Kanata", addressRegion: "ON", postalCode: "K2K 3E7", addressCountry: "CA" },
  areaServed: ["US", "CA", "GB", "DE", "FR", "IT", "AE"],
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
          {/* Cookie consent by region (lib/consent-script.ts): sets the Consent Mode v2
              defaults and window.__cc before GA and the pixel. US and most of Canada
              load with consent granted (GPC / "Your privacy choices" keep ads off);
              Quebec, Europe, the UK, the UAE and unknown locations stay denied until
              Accept. */}
          <script dangerouslySetInnerHTML={{ __html: CONSENT_JS }} />
          {/* GA4 — only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set. Loaded when analytics
              consent is granted for this visitor (window.__cc.a); where it isn't, the
              gtag script is not loaded at all until Accept (ConsentBanner calls
              window.__alphaaGA()); never on Reject. Ads consent is handled by the
              Consent Mode defaults above. */}
          {GA_ID && (
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.__alphaaGA=function(){if(window.__gaOn)return;window.__gaOn=1;var t=document.createElement('script');t.async=true;t.src='https://www.googletagmanager.com/gtag/js?id=${GA_ID}';document.head.appendChild(t);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${GA_ID}')};if(window.__cc&&window.__cc.a)window.__alphaaGA();`,
              }}
            />
          )}
          {/* Meta Pixel — only when NEXT_PUBLIC_FB_PIXEL_ID is set, and only when ads
              consent is granted (window.__cc.ad): never with GPC or the "Your privacy
              choices" opt-out, and in opt-in regions only after Accept
              (ConsentBanner calls window.__alphaaPixel()). PageView
              fires on load; funnel events fire from lib/pixel.ts (no-op while
              fbq is undefined). No <noscript> pixel: it can't check consent. */}
          {FB_PIXEL_ID && (
            <Script
              id="fb-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.__alphaaPixel=function(){if(window.__pxOn)return;window.__pxOn=1;!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${FB_PIXEL_ID}');fbq('track','PageView')};if(window.__cc&&window.__cc.ad)window.__alphaaPixel();`,
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
