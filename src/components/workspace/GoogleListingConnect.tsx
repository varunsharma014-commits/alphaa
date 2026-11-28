"use client"

import type { ReactNode } from "react"
import { Button, ChannelMark, ConnectCard, PageHeader } from "./ui"
import "./detail.css"

// The one "not connected" view for the Google listing pages (posts, reviews). One wording everywhere:
// "Connect your Google listing". `preview` = a REAL draft when there is one, never a made-up sample.
export const CONNECT_GOOGLE = "Connect your Google listing"

export function GoogleListingConnect({ title, sub, what, preview }: {
  title: string
  sub: string
  /** Three short "what I'll do" lines. */
  what: string[]
  preview?: ReactNode
}) {
  return (
    <>
      <PageHeader title={title} sub={sub} />
      <ConnectCard
        logo={<ChannelMark channel="google" size={36} />}
        name="Google listing"
        state="off"
        status="Not connected yet. It takes about two minutes."
        action={<Button variant="primary" href="/dashboard/settings/integrations">{CONNECT_GOOGLE}</Button>}
        preview={preview}
      >
        <ul className="xp-what">{what.map((w) => <li key={w}>{w}</li>)}</ul>
      </ConnectCard>
    </>
  )
}
