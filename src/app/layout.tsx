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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
