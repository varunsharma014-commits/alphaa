import type { Post } from "./types"
import { meta as llmsTxtMeta, Body as LlmsTxtBody } from "./llms-txt-guide"
import { meta as aeoVsSeoMeta, Body as AeoVsSeoBody } from "./aeo-vs-seo"
import { meta as whatIsAeoMeta, Body as WhatIsAeoBody } from "./what-is-answer-engine-optimization"
import { meta as chatgptMeta, Body as ChatgptBody } from "./how-to-get-recommended-by-chatgpt"
import { meta as isAeoRealMeta, Body as IsAeoRealBody } from "./is-aeo-real"
import { meta as localServiceMeta, Body as LocalServiceBody } from "./get-recommended-by-ai-local-service-business"
import { meta as checklistMeta, Body as ChecklistBody } from "./aeo-checklist"
import { meta as perplexityMeta, Body as PerplexityBody } from "./how-to-get-cited-on-perplexity"
import { meta as schemaMeta, Body as SchemaBody } from "./schema-markup-for-ai-search"
import { meta as restaurantsMeta, Body as RestaurantsBody } from "./ai-recommendations-for-restaurants"
import { meta as saasMeta, Body as SaasBody } from "./aeo-for-saas-b2b"

// Registry of blog posts. To add a post: create a new module in this folder
// exporting `meta` + `Body`, then add it here.
export const POSTS: Post[] = [
  { meta: whatIsAeoMeta, Body: WhatIsAeoBody },
  { meta: chatgptMeta, Body: ChatgptBody },
  { meta: isAeoRealMeta, Body: IsAeoRealBody },
  { meta: checklistMeta, Body: ChecklistBody },
  { meta: perplexityMeta, Body: PerplexityBody },
  { meta: schemaMeta, Body: SchemaBody },
  { meta: localServiceMeta, Body: LocalServiceBody },
  { meta: restaurantsMeta, Body: RestaurantsBody },
  { meta: saasMeta, Body: SaasBody },
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
