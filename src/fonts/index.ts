import localFont from "next/font/local"

// Self-hosted instead of next/font/google: the build fetches Google Fonts at
// build time, and a change in Google's CSS broke every Railway build (2026-11-03).
export const arabic = localFont({
  src: [
    { path: "./noto-sans-arabic-400.woff2", weight: "400", style: "normal" },
    { path: "./noto-sans-arabic-600.woff2", weight: "600", style: "normal" },
    { path: "./noto-sans-arabic-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
})

export const hand = localFont({
  src: [{ path: "./caveat-600.woff2", weight: "600", style: "normal" }],
  display: "swap",
})
