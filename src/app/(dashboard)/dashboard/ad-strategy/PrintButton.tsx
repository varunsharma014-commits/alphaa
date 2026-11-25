"use client"

export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="rounded-full bg-black px-4 py-2 text-sm text-white">Save as PDF</button>
}
