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
import { meta as chatgptSaysMeta, Body as ChatgptSaysBody } from "./how-to-see-what-chatgpt-says-about-your-business"
import { meta as bestToolsMeta, Body as BestToolsBody } from "./best-aeo-tools-2026"
import { meta as aiOverviewsLocalMeta, Body as AiOverviewsLocalBody } from "./google-ai-overviews-local-business"
import { meta as dentistsMeta, Body as DentistsBody } from "./how-dentists-get-recommended-by-ai"
import { meta as hvacPlumbingMeta, Body as HvacPlumbingBody } from "./how-hvac-plumbing-companies-get-recommended-by-ai"
import { meta as blueLinkMeta, Body as BlueLinkBody } from "./death-of-the-blue-link"
import { meta as lawFirmsMeta, Body as LawFirmsBody } from "./how-law-firms-get-recommended-by-ai"
import { meta as medSpasMeta, Body as MedSpasBody } from "./how-med-spas-get-recommended-by-ai"
import { meta as zeroClickMeta, Body as ZeroClickBody } from "./zero-click-search"
import { meta as agencyWorthItMeta, Body as AgencyWorthItBody } from "./is-your-seo-agency-worth-it"
import { meta as askingChatgptFirstMeta, Body as AskingChatgptFirstBody } from "./your-next-customer-is-asking-chatgpt-first"
import { meta as reviewsAiVisibilityMeta, Body as ReviewsAiVisibilityBody } from "./google-reviews-ai-visibility"
import { meta as aiOverviewsAnsweringMeta, Body as AiOverviewsAnsweringBody } from "./ai-overviews-answering-your-customers"
import { meta as aiSearchStatsMeta, Body as AiSearchStatsBody } from "./ai-search-statistics-2026"
import { meta as seoToAeoPlaybookMeta, Body as SeoToAeoPlaybookBody } from "./seo-to-aeo-90-day-playbook"
import { meta as realEstateMeta, Body as RealEstateBody } from "./how-real-estate-agents-get-recommended-by-ai"
import { meta as entitySeoMeta, Body as EntitySeoBody } from "./entity-seo-how-ai-identifies-your-business"
import { meta as geminiMeta, Body as GeminiBody } from "./how-to-get-recommended-by-google-gemini"
import { meta as aeoVsGeoMeta, Body as AeoVsGeoBody } from "./aeo-vs-geo"
import { meta as claudeEngineMeta, Body as ClaudeEngineBody } from "./how-to-get-recommended-by-claude"
import { meta as aeoTimelineMeta, Body as AeoTimelineBody } from "./how-long-does-aeo-take"
import { meta as aiCrawlersMeta, Body as AiCrawlersBody } from "./ai-crawlers-robots-txt-guide"
import { meta as trackAiTrafficMeta, Body as TrackAiTrafficBody } from "./how-to-track-ai-traffic-google-analytics"
import { meta as answerVarianceMeta, Body as AnswerVarianceBody } from "./why-ai-answers-change-every-time"
import { meta as redditMeta, Body as RedditBody } from "./reddit-and-ai-search"
import { meta as jsRenderingMeta, Body as JsRenderingBody } from "./javascript-rendering-ai-crawlers"
import { meta as accountantsMeta, Body as AccountantsBody } from "./how-accountants-get-recommended-by-ai"
import { meta as quotableContentMeta, Body as QuotableContentBody } from "./how-to-write-content-ai-quotes"
import { meta as vetsMeta, Body as VetsBody } from "./how-veterinary-clinics-get-recommended-by-ai"
import { meta as fixWrongAiMeta, Body as FixWrongAiBody } from "./fix-wrong-ai-information-about-your-business"
import { meta as autoRepairMeta, Body as AutoRepairBody } from "./how-auto-repair-shops-get-recommended-by-ai"
import { meta as backlinksMeta, Body as BacklinksBody } from "./do-backlinks-matter-for-ai-search"
import { meta as multiLocationMeta, Body as MultiLocationBody } from "./multi-location-business-ai-visibility"
import { meta as bestOfListsMeta, Body as BestOfListsBody } from "./get-into-ai-best-of-lists"
import { meta as gymsMeta, Body as GymsBody } from "./how-gyms-fitness-studios-get-recommended-by-ai"
import { meta as copilotMeta, Body as CopilotBody } from "./how-to-get-recommended-by-microsoft-copilot"
import { meta as competitorMeta, Body as CompetitorBody } from "./why-ai-recommends-your-competitor"
import { meta as ecommerceMeta, Body as EcommerceBody } from "./ecommerce-products-recommended-by-ai"
import { meta as wikipediaMeta, Body as WikipediaBody } from "./wikipedia-wikidata-ai-visibility"
import { meta as freshnessMeta, Body as FreshnessBody } from "./content-freshness-ai-search"
import { meta as gbpAnswersMeta, Body as GbpAnswersBody } from "./google-business-profile-ai-answers"
import { meta as pressReleasesMeta, Body as PressReleasesBody } from "./press-releases-news-coverage-ai-visibility"
import { meta as hotelsMeta, Body as HotelsBody } from "./how-hotels-get-recommended-by-ai"
import { meta as videoMeta, Body as VideoBody } from "./do-videos-show-up-in-ai-answers"
import { meta as advisorsMeta, Body as AdvisorsBody } from "./how-financial-advisors-get-recommended-by-ai"
import { meta as pricingPagesMeta, Body as PricingPagesBody } from "./pricing-pages-ai-recommendations"
import { meta as therapistsMeta, Body as TherapistsBody } from "./how-therapists-get-recommended-by-ai"
import { meta as eeatMeta, Body as EeatBody } from "./eeat-author-bios-ai-search"
import { meta as weddingMeta, Body as WeddingBody } from "./how-wedding-vendors-get-recommended-by-ai"
import { meta as directoriesMeta, Body as DirectoriesBody } from "./directory-listings-nap-citations-ai-search"
import { meta as roofingMeta, Body as RoofingBody } from "./how-roofing-contractors-get-recommended-by-ai"
import { meta as pdfsImagesMeta, Body as PdfsImagesBody } from "./do-ai-engines-read-pdfs-images"
import { meta as salonsMeta, Body as SalonsBody } from "./how-salons-barbershops-get-recommended-by-ai"
import { meta as socialProfilesMeta, Body as SocialProfilesBody } from "./do-social-media-profiles-affect-ai-search"
import { meta as chiropractorsMeta, Body as ChiropractorsBody } from "./how-chiropractors-get-recommended-by-ai"
import { meta as paidAdsMeta, Body as PaidAdsBody } from "./do-paid-ads-affect-ai-recommendations"
import { meta as mspsMeta, Body as MspsBody } from "./how-msps-it-support-get-recommended-by-ai"
import { meta as insuranceMeta, Body as InsuranceBody } from "./how-insurance-agencies-get-recommended-by-ai"
import { meta as comparisonPagesMeta, Body as ComparisonPagesBody } from "./comparison-pages-ai-search"
import { meta as aeoCostMeta, Body as AeoCostBody } from "./how-much-does-aeo-cost"
import { meta as staffingMeta, Body as StaffingBody } from "./how-staffing-recruiting-agencies-get-recommended-by-ai"

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
  { meta: chatgptSaysMeta, Body: ChatgptSaysBody },
  { meta: bestToolsMeta, Body: BestToolsBody },
  { meta: aiOverviewsLocalMeta, Body: AiOverviewsLocalBody },
  { meta: dentistsMeta, Body: DentistsBody },
  { meta: hvacPlumbingMeta, Body: HvacPlumbingBody },
  { meta: blueLinkMeta, Body: BlueLinkBody },
  { meta: lawFirmsMeta, Body: LawFirmsBody },
  { meta: medSpasMeta, Body: MedSpasBody },
  { meta: zeroClickMeta, Body: ZeroClickBody },
  { meta: agencyWorthItMeta, Body: AgencyWorthItBody },
  { meta: askingChatgptFirstMeta, Body: AskingChatgptFirstBody },
  { meta: reviewsAiVisibilityMeta, Body: ReviewsAiVisibilityBody },
  { meta: aiOverviewsAnsweringMeta, Body: AiOverviewsAnsweringBody },
  { meta: aiSearchStatsMeta, Body: AiSearchStatsBody },
  { meta: seoToAeoPlaybookMeta, Body: SeoToAeoPlaybookBody },
  { meta: realEstateMeta, Body: RealEstateBody },
  { meta: entitySeoMeta, Body: EntitySeoBody },
  { meta: geminiMeta, Body: GeminiBody },
  { meta: aeoVsGeoMeta, Body: AeoVsGeoBody },
  { meta: claudeEngineMeta, Body: ClaudeEngineBody },
  { meta: aeoTimelineMeta, Body: AeoTimelineBody },
  { meta: aiCrawlersMeta, Body: AiCrawlersBody },
  { meta: trackAiTrafficMeta, Body: TrackAiTrafficBody },
  { meta: answerVarianceMeta, Body: AnswerVarianceBody },
  { meta: redditMeta, Body: RedditBody },
  { meta: jsRenderingMeta, Body: JsRenderingBody },
  { meta: accountantsMeta, Body: AccountantsBody },
  { meta: quotableContentMeta, Body: QuotableContentBody },
  { meta: vetsMeta, Body: VetsBody },
  { meta: fixWrongAiMeta, Body: FixWrongAiBody },
  { meta: autoRepairMeta, Body: AutoRepairBody },
  { meta: backlinksMeta, Body: BacklinksBody },
  { meta: multiLocationMeta, Body: MultiLocationBody },
  { meta: bestOfListsMeta, Body: BestOfListsBody },
  { meta: gymsMeta, Body: GymsBody },
  { meta: copilotMeta, Body: CopilotBody },
  { meta: competitorMeta, Body: CompetitorBody },
  { meta: ecommerceMeta, Body: EcommerceBody },
  { meta: wikipediaMeta, Body: WikipediaBody },
  { meta: freshnessMeta, Body: FreshnessBody },
  { meta: gbpAnswersMeta, Body: GbpAnswersBody },
  { meta: pressReleasesMeta, Body: PressReleasesBody },
  { meta: hotelsMeta, Body: HotelsBody },
  { meta: videoMeta, Body: VideoBody },
  { meta: advisorsMeta, Body: AdvisorsBody },
  { meta: pricingPagesMeta, Body: PricingPagesBody },
  { meta: therapistsMeta, Body: TherapistsBody },
  { meta: eeatMeta, Body: EeatBody },
  { meta: weddingMeta, Body: WeddingBody },
  { meta: directoriesMeta, Body: DirectoriesBody },
  { meta: roofingMeta, Body: RoofingBody },
  { meta: pdfsImagesMeta, Body: PdfsImagesBody },
  { meta: salonsMeta, Body: SalonsBody },
  { meta: socialProfilesMeta, Body: SocialProfilesBody },
  { meta: chiropractorsMeta, Body: ChiropractorsBody },
  { meta: paidAdsMeta, Body: PaidAdsBody },
  { meta: mspsMeta, Body: MspsBody },
  { meta: insuranceMeta, Body: InsuranceBody },
  { meta: comparisonPagesMeta, Body: ComparisonPagesBody },
  { meta: aeoCostMeta, Body: AeoCostBody },
  { meta: staffingMeta, Body: StaffingBody },
]

export function getAllPosts(): Post[] {
  return [...POSTS].sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1))
}

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.meta.slug === slug)
}

export type { Post, PostMeta } from "./types"
