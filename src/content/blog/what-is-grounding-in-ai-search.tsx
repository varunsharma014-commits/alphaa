import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "what-is-grounding-in-ai-search",
  title: "What Is Grounding in AI Search? A Plain Definition",
  description:
    "Grounding in AI search means an assistant bases its answer on sources it fetches at question time. Here is how it works and what it means for your website.",
  subtitle:
    "Grounding is when an AI model bases its answer on information it retrieves at question time, such as search results, instead of relying only on what it learned in training.",
  date: "2026-10-29",
  updated: "2026-10-29",
  readMins: 5,
  tag: "Glossary",
  kind: "glossary",
  keyphrase: "grounding in ai search",
  image: {
    src: "/blog/what-is-grounding-in-ai-search.webp",
    alt: "A dark iron anchor on a chain resting in clear shallow water over pale sand, with a calm sea behind it.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Google Cloud defines grounding as the ability to connect model output to verifiable sources of information.",
    "Google describes grounding as providing content from the Google Search index to the model at prompt time.",
    "Grounded answers can cite links, which is how a website earns a citation in an AI answer.",
    "To be used for grounding, a page must be reachable by the AI search crawler and state facts plainly.",
  ],
  sources: [
    {
      title: "Grounding overview | Gemini Enterprise Agent Platform | Google Cloud Documentation",
      publisher: "Google Cloud",
      url: "https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/overview",
    },
    {
      title: "Google's common crawlers | Google Crawling Infrastructure",
      publisher: "Google for Developers",
      url: "https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers",
    },
    { title: "Overview of OpenAI Crawlers", publisher: "OpenAI", url: "https://platform.openai.com/docs/bots" },
    { title: "Perplexity Crawlers - Perplexity", publisher: "Perplexity", url: "https://docs.perplexity.ai/guides/bots" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Grounding in AI search is when an assistant bases its answer on sources it
        retrieves at the moment you ask, usually web search results, rather than only on its training data. Grounded
        answers can cite the pages they used. For a business, being a page the assistant can fetch and quote is how you
        appear in those answers.
      </p>

      <h2>What does grounding mean in AI?</h2>
      <p>
        Grounding means tying a model&apos;s output to information outside the model that can be checked. Google
        Cloud&apos;s{" "}
        <a href="https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/overview" {...ext}>
          grounding overview
        </a>{" "}
        defines it as &quot;the ability to connect model output to verifiable sources of information&quot;, and lists
        three benefits: fewer hallucinations, responses anchored to your data sources, and auditability through links to
        those sources.
      </p>
      <p>
        Without grounding, a model answers from patterns it learned during training, which may be months old and has no
        built-in link back to a source. With grounding, the system first fetches relevant documents, then has the model
        write an answer based on them. The technical name for the general pattern is retrieval-augmented generation, or
        RAG.
      </p>

      <h2>How does grounding work in AI search?</h2>
      <p>
        In AI search, grounding usually works by running web searches behind the scenes and passing the results to the
        model before it writes. Google states this directly in its{" "}
        <a href="https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers" {...ext}>
          crawler documentation
        </a>
        , describing grounding as &quot;providing content from the Google Search index to the model at prompt time to
        improve factuality and relevancy&quot; in Gemini Apps and Grounding with Google Search on Vertex AI.
      </p>
      <p>The typical sequence looks like this:</p>
      <ol>
        <li>
          <strong>The question arrives.</strong> The assistant decides whether it needs fresh information, for example for
          local businesses, prices or recent events.
        </li>
        <li>
          <strong>It searches.</strong> It sends one or more queries to a search index, often several related ones, a
          pattern called <Link href="/blog/what-is-query-fan-out">query fan-out</Link>.
        </li>
        <li>
          <strong>It reads the results.</strong> The text of the top pages is passed to the model as context.
        </li>
        <li>
          <strong>It writes and cites.</strong> The model composes an answer from that context and links the pages it
          relied on.
        </li>
      </ol>

      <h2>Which AI assistants use grounding?</h2>
      <p>
        ChatGPT, Gemini, Claude and Perplexity can all ground answers in live web results, and each uses its own crawler
        or index to do it. The vendors document the crawlers involved:
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Assistant</th>
              <th>Search crawler</th>
              <th>What the vendor says it does</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ChatGPT</td>
              <td>OAI-SearchBot</td>
              <td>Surfaces websites in ChatGPT&apos;s search features</td>
            </tr>
            <tr>
              <td>Perplexity</td>
              <td>PerplexityBot</td>
              <td>Surfaces and links websites in Perplexity results; not used for model training</td>
            </tr>
            <tr>
              <td>Gemini</td>
              <td>Google Search index</td>
              <td>Search index content is provided to the model at prompt time</td>
            </tr>
            <tr>
              <td>Claude</td>
              <td>Claude-SearchBot</td>
              <td>Indexes content to improve Claude&apos;s search results</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Sources: OpenAI&apos;s{" "}
        <a href="https://platform.openai.com/docs/bots" {...ext}>
          crawler overview
        </a>
        , Perplexity&apos;s{" "}
        <a href="https://docs.perplexity.ai/guides/bots" {...ext}>
          crawler page
        </a>
        , Google&apos;s common crawlers page and Anthropic&apos;s help center. For how the training side differs, see{" "}
        <Link href="/blog/training-data-vs-live-retrieval-ai-search">training data vs live retrieval</Link>.
      </p>

      <h2>Why does grounding matter for your business?</h2>
      <p>
        Grounding matters because it is the moment an assistant can find, quote and link your website, even if the model
        never saw your business in training. A new business, a new service page or a corrected opening time can show up in
        a grounded answer once it is indexed, without waiting for the next model to be trained.
      </p>
      <p>Three things decide whether your page can be used for grounding:</p>
      <ul>
        <li>
          <strong>Access.</strong> The assistant&apos;s search crawler must be allowed to fetch the page. OpenAI says
          sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers, except as navigational links.
        </li>
        <li>
          <strong>Retrievability.</strong> The page must rank in the index the assistant searches for the question being
          asked, which is why classic SEO still matters.
        </li>
        <li>
          <strong>Quotability.</strong> The facts must be stated plainly in the HTML, in short self-contained passages
          the model can lift. Our guide to{" "}
          <Link href="/blog/how-to-write-content-ai-quotes">writing content AI quotes</Link> covers the format.
        </li>
      </ul>

      <h2>What else do people ask about grounding?</h2>

      <h3>Is grounding the same as RAG?</h3>
      <p>
        Grounding is the goal and retrieval-augmented generation is the most common way to achieve it. RAG fetches
        documents and adds them to the model&apos;s context; grounding with web search is RAG where the documents come
        from a search index.
      </p>

      <h3>Does grounding stop AI from making mistakes?</h3>
      <p>
        No, it reduces them but does not remove them. Google says grounding reduces the chances of the model inventing
        content, yet a grounded answer can still misread a source or rely on a page that is wrong.
      </p>

      <h3>Does blocking Google-Extended stop grounding?</h3>
      <p>
        Google says Google-Extended controls whether your content is used for Gemini training and for grounding in Gemini
        Apps and Grounding with Google Search on Vertex AI. It also says Google-Extended does not affect inclusion or
        ranking in Google Search.
      </p>

      <h3>How can I tell if an AI answer was grounded?</h3>
      <p>
        The clearest sign is a list of cited links or source cards alongside the answer. Answers with no citations were
        more likely written from training data alone, which is why they can be out of date.
      </p>

      <h3>How do I check whether assistants can ground answers in my site?</h3>
      <p>
        Ask them the questions your customers ask and look at what they cite. Alphaa does this weekly across ChatGPT,
        Gemini, Claude and Perplexity, and you can run the <Link href="/start">free 60-second AI check</Link> to see
        today&apos;s answers.
      </p>
    </div>
  )
}
