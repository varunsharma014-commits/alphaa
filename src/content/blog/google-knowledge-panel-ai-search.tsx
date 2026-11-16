import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "google-knowledge-panel-ai-search",
  title: "Google Knowledge Panel for AI Search: How to Get One",
  description:
    "How a Google knowledge panel for AI search works, who gets one, how to claim and fix it, and the entity signals that help Google and AI assistants know you.",
  subtitle:
    "Google generates knowledge panels automatically for entities in its Knowledge Graph, so you cannot apply for one, but you can make your business easy to recognise with consistent facts, Organization markup and verifiable profiles, then claim the panel once it appears.",
  date: "2026-11-16",
  updated: "2026-11-16",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "google knowledge panel for ai search",
  takeaways: [
    "Google says knowledge panels are generated automatically from web sources and update as information on the web changes.",
    "There is no form to request a knowledge panel; once one appears, its subject or an official representative can claim it.",
    "Local businesses that serve customers at a location or in a service area use a Google Business Profile, a separate feature.",
    "Google's Organization markup has no required properties, and its logo property can influence the logo shown in a knowledge panel.",
    "Google says AI Overviews and AI Mode need no special schema, so entity work helps through clarity, not a special tag.",
  ],
  sources: [
    {
      title: "About knowledge panels - Knowledge Panel Help",
      publisher: "Google",
      url: "https://support.google.com/knowledgepanel/answer/9163198?hl=en",
    },
    {
      title: "Get verified on Google - Knowledge Panel Help",
      publisher: "Google",
      url: "https://support.google.com/knowledgepanel/answer/7534902?hl=en",
    },
    {
      title: "Organization Schema Markup",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/structured-data/organization",
    },
    {
      title: "Google Knowledge Graph Search API",
      publisher: "Google for Developers",
      url: "https://developers.google.com/knowledge-graph",
    },
    {
      title: "Introducing the Knowledge Graph: things, not strings",
      publisher: "Google",
      url: "https://blog.google/products/search/introducing-knowledge-graph-things-not/",
    },
    {
      title: "AI Features and Your Website",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/ai-features",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> A Google knowledge panel for AI search is a sign that Google has recognised your
        business as an entity. Google generates panels automatically, so you cannot apply for one. You can make your
        brand easy to recognise with one consistent name, Organization markup, linked official profiles and independent
        mentions, then claim the panel once it appears.
      </p>

      <p>
        This guide is for brands, SaaS companies, practices and founders who want Google, and the AI assistants that
        read the same web, to know exactly who they are. It covers what a knowledge panel is, how it differs from a
        Business Profile, how to check and claim one, and the steps that make you easier to identify.
      </p>

      <h2>What is a Google knowledge panel?</h2>
      <p>
        A Google knowledge panel is an information box that appears in Google results when someone searches for a
        person, place, organization or thing that Google has in its Knowledge Graph. Google&apos;s help page{" "}
        <a href="https://support.google.com/knowledgepanel/answer/9163198?hl=en" {...ext}>
          about knowledge panels
        </a>{" "}
        says the panels are generated automatically from information on the web, sometimes combined with data from
        partners, and are updated automatically as that information changes.
      </p>
      <p>
        The Knowledge Graph itself is Google&apos;s model of real-world entities and how they relate. When Google{" "}
        <a href="https://blog.google/products/search/introducing-knowledge-graph-things-not/" {...ext}>
          introduced it in 2012
        </a>
        , it described the idea as &quot;things, not strings&quot;: understanding that a search is about a specific
        entity rather than matching keywords. A knowledge panel is the visible part of that understanding.
      </p>

      <h2>Why does a knowledge panel matter for AI search?</h2>
      <p>
        A knowledge panel matters for AI search because it shows Google has resolved your brand into one entity with
        known facts, which is the same problem every AI assistant has to solve before it can describe or recommend you.
        If Google cannot tell your company apart from others with a similar name, an assistant reading the web is
        likely to have the same trouble.
      </p>
      <p>
        Be careful not to overstate this. Google says in its guide to{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI features and your website
        </a>{" "}
        that there are no additional requirements or special optimizations to appear in AI Overviews or AI Mode, and
        no special schema.org structured data you need to add. A panel is not a ticket into AI answers. It is a useful
        signal that your entity work is landing. Our guide to{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">entity SEO and how AI identifies a business</Link>{" "}
        explains the wider idea.
      </p>

      <h2>How is a knowledge panel different from a Google Business Profile?</h2>
      <p>
        A knowledge panel describes an entity, while a Google Business Profile describes a local business that serves
        customers at a location or in a service area. Google&apos;s help pages treat them as separate features and send
        local businesses to Business Profile to manage how they appear on Search and Maps.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>Knowledge panel</th>
              <th>Google Business Profile</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Who it is for</td>
              <td>People, organizations, brands, works, things</td>
              <td>Businesses with a location or service area</td>
            </tr>
            <tr>
              <td>How it is created</td>
              <td>Generated automatically by Google</td>
              <td>Created and verified by the business</td>
            </tr>
            <tr>
              <td>Can you request one?</td>
              <td>No; you can claim one that exists</td>
              <td>Yes, through Business Profile</td>
            </tr>
            <tr>
              <td>How you edit it</td>
              <td>Suggest changes after claiming, or send feedback</td>
              <td>Edit details directly in the profile</td>
            </tr>
            <tr>
              <td>Main data source</td>
              <td>Information across the web and data partners</td>
              <td>What the owner enters, plus reviews and photos</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        A local dental practice therefore needs a Business Profile first; see{" "}
        <Link href="/blog/google-business-profile-ai-answers">Google Business Profile and AI answers</Link>. A software
        company, a national brand or a well-known founder is more likely to get an entity knowledge panel.
      </p>

      <h2>How do you check whether Google knows your business as an entity?</h2>
      <p>
        You can check by searching your exact brand name on Google and looking for a panel, then confirming with the
        Knowledge Graph Search API. Search for your brand name alone, then your brand name plus your category or city.
        If a panel shows, read every fact on it. If none shows, that is common for smaller brands and is not a penalty.
      </p>
      <p>
        For a more direct check, Google&apos;s{" "}
        <a href="https://developers.google.com/knowledge-graph" {...ext}>
          Knowledge Graph Search API
        </a>{" "}
        lets you look up entities by name and returns matches with an ID, types such as Organization, a description and
        a score. It needs a Google Cloud API key. Google says the API returns individual entities rather than the full graph,
        and warns it is not suitable as a production-critical service, so treat it as a quick lookup, not a dashboard.
      </p>

      <h2>How do you claim a knowledge panel?</h2>
      <p>
        You claim a knowledge panel by finding it in Google Search, choosing the claim option and signing in to one of
        the official sites or profiles Google links to you. Google&apos;s{" "}
        <a href="https://support.google.com/knowledgepanel/answer/7534902?hl=en" {...ext}>
          Get verified on Google
        </a>{" "}
        page sets out the steps.
      </p>
      <ol>
        <li>
          <strong>Sign in to a Google Account</strong> that you will keep, ideally one owned by the company rather than
          a single employee.
        </li>
        <li>
          <strong>Search for your entity</strong> on Google and open its knowledge panel.
        </li>
        <li>
          <strong>Choose &quot;Claim this knowledge panel&quot;</strong>, usually at the bottom of the panel or in its
          About section.
        </li>
        <li>
          <strong>Review the information</strong> Google shows about the panel.
        </li>
        <li>
          <strong>Sign in to an official profile</strong> Google lists for you, such as YouTube, Search Console, X or
          Facebook. If Google cannot link one, it asks for more information to verify you.
        </li>
      </ol>
      <p>
        Google notes that not every panel can be claimed yet. Once verified, you can suggest changes to facts and pick a
        featured image. Anyone else can use the feedback link on the panel to report an error.
      </p>

      <h2>What makes Google more likely to recognise your brand as an entity?</h2>
      <p>
        Google is more likely to recognise your brand when the same facts about it appear consistently on your own site
        and on independent sources it trusts. There is no switch to flip, but these steps make your business easier to
        identify.
      </p>
      <ol>
        <li>
          <strong>Use one name everywhere.</strong> The same spelling on your site, social profiles, directories and
          press. Variants split you into several weak entities.
        </li>
        <li>
          <strong>Write a plain About page.</strong> Who you are, what you do, where, since when and who runs it, in
          sentences a machine can quote. See{" "}
          <Link href="/blog/about-page-for-ai-search">the about page for AI search</Link>.
        </li>
        <li>
          <strong>Add Organization markup.</strong> Google&apos;s{" "}
          <a href="https://developers.google.com/search/docs/appearance/structured-data/organization" {...ext}>
            Organization structured data
          </a>{" "}
          guide says the markup helps Google understand your administrative details and disambiguate your organization
          in results. It has no required properties; add the ones that apply, such as name, url, logo, description,
          address, contactPoint and sameAs.
        </li>
        <li>
          <strong>Link your official profiles with sameAs.</strong> Point to the LinkedIn page, YouTube channel, social
          profiles and directory listings you control, so Google can connect them to one entity.
        </li>
        <li>
          <strong>Get mentioned by independent sources.</strong> Trade press, industry directories and partner pages
          that describe you the same way. Our guide to{" "}
          <Link href="/blog/do-brand-mentions-without-links-help-ai-search">brand mentions without links</Link> covers
          why these count.
        </li>
        <li>
          <strong>Check Wikidata, but only if you are notable.</strong> Many panels draw on open sources. Do not create
          a Wikipedia article about yourself; read{" "}
          <Link href="/blog/wikipedia-wikidata-ai-visibility">Wikipedia, Wikidata and AI visibility</Link> for the
          rules.
        </li>
      </ol>

      <h2>What should you put in Organization markup?</h2>
      <p>
        Your Organization markup should state the facts that identify you and match what visitors see on the page.
        Google lists every property as recommended rather than required, so focus on accuracy over volume. A typical
        block for a company homepage looks like this.
      </p>
      <ul>
        <li>
          <code>name</code> and <code>url</code>: the exact brand name and homepage. Google says <code>url</code> helps
          it uniquely identify your organization.
        </li>
        <li>
          <code>logo</code>: a crawlable image at least 112 by 112 pixels. Google says it can influence the logo shown in
          Search results and your knowledge panel.
        </li>
        <li>
          <code>sameAs</code>: URLs of pages on other sites with more information about you, such as your official
          profiles.
        </li>
        <li>
          <code>description</code>, <code>address</code>, <code>telephone</code> and <code>contactPoint</code>: the
          same values as your footer and contact page.
        </li>
        <li>
          <code>legalName</code>, <code>foundingDate</code> and identifiers such as <code>taxID</code> or{" "}
          <code>duns</code> where you are happy to publish them.
        </li>
      </ul>
      <p>
        Put it on the homepage or About page, not on every URL, and validate it with Google&apos;s Rich Results Test.
        Our guide to <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link> has worked
        examples for other types.
      </p>

      <h2>How do you fix a wrong knowledge panel?</h2>
      <p>
        You fix a wrong knowledge panel by claiming it and suggesting an edit, or by sending feedback, and then
        correcting the source the wrong fact came from. Google updates panels from the web, so an edit can be overridden
        if an old directory or article still says the wrong thing.
      </p>
      <p>
        Find where the error lives. A wrong founding year might come from an outdated press release; a wrong logo from
        an old social profile. Fix those pages, update your own site and markup to state the correct fact plainly, then
        submit the change on the panel. The same approach works for wrong answers in ChatGPT or Gemini; see{" "}
        <Link href="/blog/fix-wrong-ai-information-about-your-business">how to fix wrong AI information</Link>.
      </p>
      <p>
        Alphaa helps with the repeatable part. It asks ChatGPT, Gemini, Claude and Perplexity what they say about your
        business each week, flags facts that are wrong or missing, and drafts the About page copy, Organization markup
        and FAQ changes for you to approve before anything goes live, from $99 a month. Start with the{" "}
        <Link href="/start">free 60-second AI check</Link>.
      </p>

      <h2>What else do people ask about knowledge panels and AI search?</h2>

      <h3>Can you pay Google for a knowledge panel?</h3>
      <p>
        No, Google generates knowledge panels automatically and does not sell them. Be wary of services that promise
        one, because nobody outside Google controls whether a panel appears.
      </p>

      <h3>How long does it take to get a knowledge panel?</h3>
      <p>
        There is no published timeline, and many businesses never get one. Panels appear when Google has enough
        consistent information to recognise an entity, which depends on how often and how clearly the web describes
        you.
      </p>

      <h3>Does a knowledge panel help with ChatGPT and Perplexity?</h3>
      <p>
        Not directly, because a knowledge panel is a Google feature. The work that earns one, consistent facts and
        clear descriptions across trusted sites, is the same information other assistants read when they search the
        web.
      </p>

      <h3>Do small local businesses need a knowledge panel?</h3>
      <p>
        Most local businesses should focus on a verified Google Business Profile instead, since Google points
        location-based businesses there. Organization markup and consistent listings still help Google connect your
        website to that profile.
      </p>

      <h3>Why did my knowledge panel disappear?</h3>
      <p>
        Panels can change or disappear because Google updates them automatically as the web changes. Check that your
        name, site and official profiles still agree, and that nothing new on the web confuses you with another entity.
      </p>
    </div>
  )
}
