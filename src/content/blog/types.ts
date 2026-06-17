import type { ReactNode } from "react"

export type PostMeta = {
  slug: string
  title: string
  description: string
  date: string // ISO (YYYY-MM-DD)
  readMins: number
  tag?: string
}

export type Post = {
  meta: PostMeta
  Body: () => ReactNode
}
