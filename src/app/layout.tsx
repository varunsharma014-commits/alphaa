import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "sonner"
import "./globals.css"

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
  // logo: "https://alphaa.app/logo.png",   // add a 112x112+ PNG
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
          />
          {/* Set theme before first paint to avoid a flash of the wrong theme */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('alphaa-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`,
            }}
          />
        </head>
        <body className="bg-bg-primary text-fg font-sans antialiased">
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
    </ClerkProvider>
  )
}
