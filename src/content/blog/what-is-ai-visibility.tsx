import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "what-is-ai-visibility",
  title: "What Is AI Visibility? Definition and How to Check It",
  description:
    "What is AI visibility? It is how often and how accurately AI assistants mention, recommend and cite your business. A plain definition, its parts and checks.",
  subtitle:
    "AI visibility is how often, how accurately and how favourably AI assistants such as ChatGPT, Gemini, Claude and Perplexity mention, recommend and cite your business when people ask relevant questions.",
  date: "2026-11-17",
  updated: "2026-11-17",
  readMins: 4,
  tag: "Glossary",
  kind: "glossary",
  keyphrase: "what is ai visibility",
  takeaways: [
    "AI visibility measures whether AI assistants mention, recommend and cite your business for the questions your customers ask.",
    "It has four parts: being mentioned, being described accurately, being recommended over alternatives, and having your pages cited as sources.",
    "AI assistants with web search, such as ChatGPT search and Claude, show citations to the pages they draw on.",
    "AI visibility is measured by asking the same questions repeatedly, because single answers vary from run to run.",
    "It improves through public signals such as clear pages, consistent listings, reviews and crawler access, never through a guaranteed placement.",
  ],
  sources: [
    {
      title: "AI Features and Your Website",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/ai-features",
    },
    { title: "Overview of OpenAI Crawlers", publisher: "OpenAI", url: "https://developers.openai.com/api/docs/bots" },
    {
      title: "Claude web search now available globally on all plans | Claude by Anthropic",
      publisher: "Anthropic",
      url: "https://claude.com/blog/web-search",
    },
    { title: "Perplexity Crawlers", publisher: "Perplexity", url: "https://docs.perplexity.ai/guides/bots" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> AI visibility is how often and how accurately AI assistants such as
        ChatGPT, Gemini, Claude and Perplexity mention, recommend and cite your business when people ask questions
        you should be part of. It is the AI-answer equivalent of ranking in search, and you check it by asking those
        assistants the questions your customers ask.
      </p>

      <h2>What does AI visibility mean?</h2>
      <p>
        AI visibility means your business shows up, correctly described, inside the answers AI assistants give.
        Where classic search visibility is about your position in a list of links, AI visibility is about whether
        you are named in a written answer at all, what the answer says about you, and whether your own pages are
        linked as the source.
      </p>
      <p>
        It matters because more buying research now starts in a chat. According to Clutch (2026), 65% of consumers
        now use AI tools to research products before buying. If the answer names three competitors and not you, the
        customer may never reach your website.
      </p>

      <h2>What are the parts of AI visibility?</h2>
      <p>
        AI visibility has four parts, and a business can be strong on one and weak on another. Checking each
        separately shows where the real gap is.
      </p>
      <ol>
        <li>
          <strong>Mention.</strong> Does the assistant name your business at all for a relevant question, such as
          &quot;best physio near me&quot;?
        </li>
        <li>
          <strong>Accuracy.</strong> Are your services, location, hours and prices described correctly? Wrong facts
          can be worse than no mention.
        </li>
        <li>
          <strong>Recommendation.</strong> When the assistant lists options, are you suggested, and how are you
          framed against competitors?
        </li>
        <li>
          <strong>Citation.</strong> Does the answer link to your own pages as a source, or only to directories and
          competitors? Our explainer on <Link href="/blog/what-is-ai-citation-share">AI citation share</Link> covers
          how this is counted.
        </li>
      </ol>

      <h2>How do AI assistants decide who to mention?</h2>
      <p>
        AI assistants decide who to mention from what they learned in training plus what their search systems find
        on the web when they answer. Assistants that search the web show their sources: Anthropic says Claude{" "}
        <a href="https://claude.com/blog/web-search" {...ext}>
          provides direct citations
        </a>{" "}
        when it uses web results, and ChatGPT search relies on OpenAI&apos;s{" "}
        <a href="https://developers.openai.com/api/docs/bots" {...ext}>
          OAI-SearchBot
        </a>{" "}
        to surface websites.
      </p>
      <p>
        Perplexity runs its own crawler,{" "}
        <a href="https://docs.perplexity.ai/guides/bots" {...ext}>
          PerplexityBot
        </a>
        , to surface sites in its results. For Google&apos;s AI features, Google says a page only needs to be{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          indexed and eligible to show a snippet
        </a>{" "}
        to be a supporting link. So the inputs are mostly public: your website, your listings, your reviews, and
        what other sites say about you.
      </p>

      <h2>How is AI visibility different from SEO?</h2>
      <p>
        AI visibility differs from SEO in what it measures: SEO tracks your position in a list of links, while AI
        visibility tracks whether you are named and cited inside an answer. The two overlap heavily, because AI
        search systems still rely on crawling and indexing, but a page can rank well and still be left out of the
        answer.
      </p>
      <p>
        The work to improve AI visibility is often called answer engine optimization or generative engine
        optimization. Our glossary entry on{" "}
        <Link href="/blog/what-is-answer-engine-optimization">answer engine optimization</Link> explains the term and
        how it relates to SEO.
      </p>

      <h2>What improves AI visibility?</h2>
      <p>
        AI visibility improves when the public facts about your business are clear, consistent and easy for AI
        search systems to read. None of these steps guarantees a mention, but each removes a reason to leave you out.
      </p>
      <ul>
        <li>
          <strong>Crawler access.</strong> Let search crawlers such as OAI-SearchBot and PerplexityBot reach your
          site; blocking them keeps your pages out of their answers.
        </li>
        <li>
          <strong>Clear pages.</strong> One page per service, with the plain answer near the top, prices where you
          can share them, and an FAQ that uses the words customers use.
        </li>
        <li>
          <strong>Consistent listings.</strong> The same name, address, phone and hours on your site, Google
          Business Profile and the main directories, so assistants do not see conflicting facts.
        </li>
        <li>
          <strong>Genuine reviews.</strong> Recent, detailed reviews on the platforms your customers use give
          assistants specific things to say about you.
        </li>
        <li>
          <strong>Mentions elsewhere.</strong> Coverage, local guides and industry lists that name you give AI
          systems independent sources to cite.
        </li>
      </ul>

      <h2>How do you check your AI visibility?</h2>
      <p>
        You check AI visibility by asking several AI assistants the same customer-style questions and recording
        whether you are mentioned, described correctly and cited. Because answers vary between runs, repeat the
        questions over time rather than trusting one result.
      </p>
      <p>
        Start with five to ten questions a real customer would type, run them in ChatGPT, Gemini, Claude and
        Perplexity, and note who is named and which pages are cited. Doing this on a schedule is called{" "}
        <Link href="/blog/what-is-prompt-tracking">prompt tracking</Link>. For a fuller method, see our guide on{" "}
        <Link href="/blog/how-to-measure-ai-visibility">how to measure AI visibility</Link>, or run a structured{" "}
        <Link href="/blog/ai-visibility-audit">AI visibility audit</Link>.
      </p>
      <p>
        Alphaa&apos;s <Link href="/start">free 60-second AI check</Link> asks those four assistants about your
        business and shows the result in one place. On a paid plan from $99 a month, Alphaa checks weekly and drafts
        fixes for the owner to approve. Nobody can guarantee what an AI model says; what you can change is the public
        information it reads.
      </p>

      <h2>What else do people ask about AI visibility?</h2>

      <h3>Is AI visibility the same as brand awareness?</h3>
      <p>
        No, AI visibility is narrower: it measures what AI assistants say about you, not what people remember. A
        well-known brand can still be described wrongly or left out of AI answers for specific questions.
      </p>

      <h3>Can a small business have good AI visibility?</h3>
      <p>
        Yes, small businesses can be named in AI answers, especially for local and specific questions. Clear service
        pages, consistent listings and genuine reviews give assistants concrete facts to repeat.
      </p>

      <h3>How often does AI visibility change?</h3>
      <p>
        AI visibility can change from one answer to the next, because assistants vary their responses and their
        search results update. That is why it is tracked as a trend over repeated checks, not a single score.
      </p>

      <h3>Can I pay to improve my AI visibility directly?</h3>
      <p>
        You cannot buy a guaranteed mention in the organic answer of ChatGPT, Gemini, Claude or Perplexity. You can
        improve the public signals those assistants read, which is what AI visibility work focuses on.
      </p>
    </div>
  )
}
