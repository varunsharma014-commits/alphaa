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
    "Alphaa replaces your SEO agency. Automatically optimize your Google Business Profile, website, and content so people find you on Google, ChatGPT, and Maps. $99/month, no contracts.",
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
        </head>
        <body className="bg-bg-primary text-white font-sans antialiased">
          <div className="dot-grid" aria-hidden="true" />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#13100C",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
