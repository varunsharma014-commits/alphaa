import type { Platform } from "@/lib/connector/types"

// Simple "works with" marks for the website platforms Alphaa connects to.
// Deliberately plain: a recognisable shape + brand colour, not the official artwork.
export function PlatformIcon({ platform, size = 28 }: { platform: Platform; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 32 32", "aria-hidden": true as const, focusable: false as const }
  switch (platform) {
    case "wordpress":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="14" fill="#21759B" />
          <circle cx="16" cy="16" r="11.2" fill="none" stroke="#fff" strokeWidth="1.4" />
          <path d="M9.2 11.5l3.6 10.2 3.2-8 3.2 8 3.6-10.2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case "shopify":
      return (
        <svg {...common}>
          <path d="M11.5 9.5V8a4.5 4.5 0 0 1 9 0v1.5" fill="none" stroke="#5E8E3E" strokeWidth="2" strokeLinecap="round" />
          <path d="M6.5 9.5h19l-1.6 18a2 2 0 0 1-2 1.8H10.1a2 2 0 0 1-2-1.8z" fill="#95BF47" />
          <path d="M18.6 14.6c-.6-.5-1.5-.8-2.4-.8-1.5 0-2.6.8-2.6 2 0 2.5 5 1.7 5 4.4 0 1.4-1.2 2.3-2.9 2.3-1.1 0-2.2-.4-2.9-1" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case "webflow":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="28" height="28" rx="7" fill="#146EF5" />
          <path d="M7.5 11l3.6 10 3.4-7.2 2.9 7.2 7.1-10" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case "wix":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="28" height="28" rx="7" fill="currentColor" opacity="0.08" />
          <text x="16" y="20.5" textAnchor="middle" fontSize="12" fontWeight="800" fontFamily="Helvetica, Arial, sans-serif" fill="currentColor" letterSpacing="-0.5">
            Wix
          </text>
        </svg>
      )
  }
}
