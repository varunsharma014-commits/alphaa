import type { Metadata } from "next"
import Script from "next/script"
import { Inter_Tight, Instrument_Serif, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

// These used to be @import url(fonts.googleapis.com) at the top of globals.css,
// which forced a four-hop render-blocking chain before the hero text could
// paint: HTML → our CSS → Google's CSS → the woff2 files. next/font downloads
// them at build time and serves them from our own origin instead, so there is
// no third-party round trip on the critical path at all. Each exposes the same
// CSS variable the Tailwind fontFamily config already expects.
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-inter-tight",
  display: "swap",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-instrument-serif",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
  display: "swap",
})

const fontVars = `${interTight.variable} ${instrumentSerif.variable} ${geistMono.variable}`

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID

export const metadata: Metadata = {
  title: {
    default: "Alphaa — Get Found on Google and ChatGPT",
    template: "%s | Alphaa",
  },
  description:
    "Alphaa replaces your SEO agency. Automatically optimize your Google Business Profile, website, and content so customers find you on Google, ChatGPT, and AI search — whether you serve your town or the whole world. $99/month, no contracts.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"),
  openGraph: {
    title: "Alphaa — Get Found on Google and ChatGPT",
    description: "Replace your SEO agency. $99/month. No contracts.",
    url: "https://alphaa.app",
    siteName: "Alphaa",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alphaa — Get Found on Google and ChatGPT",
    description: "Replace your SEO agency. $99/month. No contracts.",
  },
  alternates: { canonical: "/" },
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
    "Alphaa is an AI search optimization (AEO) platform that automatically gets businesses found, cited, and recommended on Google, ChatGPT, Claude, Gemini, and Perplexity.",
  logo: "https://alphaa.app/logo.png",
  // sameAs: ["https://www.linkedin.com/company/alphaa", "https://x.com/alphaa", ...],
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
    <html lang="en" className={fontVars}>
        <head>
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
          {/* GA4 — only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set */}
          {GA_ID && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                strategy="afterInteractive"
              />
              <Script
                id="ga4-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
                }}
              />
            </>
          )}
          {/* Meta Pixel — only when NEXT_PUBLIC_FB_PIXEL_ID is set. PageView
              fires here; funnel events fire from lib/pixel.ts. */}
          {FB_PIXEL_ID && (
            <Script
              id="fb-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${FB_PIXEL_ID}');fbq('track','PageView');`,
              }}
            />
          )}
          {/* Set theme before first paint to avoid a flash of the wrong theme */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('alphaa-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`,
            }}
          />
        </head>
        <body className="bg-bg-primary text-fg font-sans antialiased">
          {FB_PIXEL_ID && (
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                alt=""
                src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
              />
            </noscript>
          )}
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
