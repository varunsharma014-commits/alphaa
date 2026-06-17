import type { Post } from "./types"
import { meta as llmsTxtMeta, Body as LlmsTxtBody } from "./llms-txt-guide"
import { meta as aeoVsSeoMeta, Body as AeoVsSeoBody } from "./aeo-vs-seo"

// Registry of blog posts. To add a post: create a new module in this folder
// exporting `meta` + `Body`, then add it here.
export const POSTS: Post[] = [
  { meta: aeoVsSeoMeta, Body: AeoVsSeoBody },
  { meta: llmsTxtMeta, Body: LlmsTxtBody },
]

export function getAllPosts(): Post[] {
  return [...POSTS].sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1))
}

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.meta.slug === slug)
}

export type { Post, PostMeta } from "./types"
