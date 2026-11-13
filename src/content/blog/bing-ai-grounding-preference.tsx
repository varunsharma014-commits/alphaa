import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "bing-ai-grounding-preference",
  title: "Bing AI Grounding Preference: What Changes in 2027",
  description:
    "Microsoft's new AI Training and AI Grounding preferences replace NoArchive and NoCache from February 2027. What each setting does and who must act by 1 March.",
  subtitle:
    "From 1 February 2027 Bing honors separate AI Training and AI Grounding preferences that replace NoArchive and NoCache, and sites that used those tags must republish their choice by 1 March 2027.",
  date: "2026-11-13",
  updated: "2026-11-13",
  readMins: 5,
  tag: "News",
  kind: "news",
  keyphrase: "bing ai grounding preference",
  image: {
    src: "/blog/bing-ai-grounding-preference.webp",
    alt: "Two brass rotary switches on a pale plaster wall, one turned left and one turned right, casting long soft shadows.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Microsoft announced separate AI Training and AI Grounding preferences on 30 October 2026, replacing NoArchive and NoCache for those uses.",
    "AI Grounding is set per page with a meta tag or X-Robots-Tag header: allow, disallowextended or disallow; there is no site-wide robots.txt option.",
    "Both preferences default to Allow, and neither changes eligibility for traditional Bing search results.",
    "Sites using NoArchive or NoCache must publish new preferences, plus a temporary grounding preference in Bing Webmaster Tools, before 1 March 2027.",
    "Microsoft warns that Disallow or DisallowExtended for grounding will reduce brand visibility in AI experiences.",
  ],
  sources: [
    {
      title: "Your content, your choice: clearer preferences for training and grounding",
      publisher: "Microsoft Bing Blogs",
      url: "https://blogs.bing.com/search/2026/10/your-content-your-choice-clearer-preferences-for-training-and-grounding/",
    },
    {
      title: "draft-kelley-aipref-training-preference-signal-00 - Machine-Readable Training Preference Signal",
      publisher: "IETF Datatracker",
      url: "https://datatracker.ietf.org/doc/draft-kelley-aipref-training-preference-signal/",
    },
    {
      title: "Your choice: Turn AI answers on or off in Bing | Bing Search Blog",
      publisher: "Microsoft Bing Blogs",
      url: "https://blogs.bing.com/search/2026/11/your-choice-turn-ai-answers-on-or-off-in-bing/",
    },
    {
      title: "Why IndexNow | Bing Webmaster Tools",
      publisher: "Microsoft Bing",
      url: "https://www.bing.com/indexnow",
    },
    {
      title: "Searching the web with ChatGPT | OpenAI Help Center",
      publisher: "OpenAI",
      url: "https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> The Bing AI grounding preference is a new page-level setting that tells
        Microsoft whether your content may inform AI-generated answers in Bing, Copilot and Microsoft 365. It takes
        effect from 1 February 2027, defaults to Allow, and replaces NoArchive and NoCache for that purpose. Most
        businesses that want customers should leave it on Allow.
      </p>

      <p>
        This explainer covers what Microsoft announced, the three grounding options, the deadlines, and what it means
        for a business that wants to be named in AI answers.
      </p>

      <h2>What did Microsoft announce?</h2>
      <p>
        Microsoft announced two independent publisher preferences, AI Training and AI Grounding, in a{" "}
        <a
          href="https://blogs.bing.com/search/2026/10/your-content-your-choice-clearer-preferences-for-training-and-grounding/"
          {...ext}
        >
          Bing blog post on 30 October 2026
        </a>
        . AI Training controls whether content may be used to train generative models. AI Grounding controls whether it
        may be used as input to help inform generated responses. Microsoft says the two replace its older NoArchive and
        NoCache tags for training and grounding, and that neither affects eligibility for traditional Bing results.
      </p>
      <p>
        The training preference follows a shared robots.txt syntax described in an{" "}
        <a href="https://datatracker.ietf.org/doc/draft-kelley-aipref-training-preference-signal/" {...ext}>
          IETF Internet-Draft
        </a>
        , which uses a policy token, <code>__usage_ai-training</code>, in the User-Agent line. The draft is an
        individual submission and, as the IETF page notes, has no formal standing yet. The grounding preference is
        Microsoft&apos;s own addition.
      </p>

      <h2>What are the three AI grounding options?</h2>
      <p>
        The three options are Allow, DisallowExtended and Disallow, and each is set page by page. Microsoft says there
        is no site-wide robots.txt grounding preference.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Setting</th>
              <th>What it does</th>
              <th>How to set it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Allow (default)</td>
              <td>Content can help inform generated responses</td>
              <td>No action needed</td>
            </tr>
            <tr>
              <td>DisallowExtended</td>
              <td>
                Grounding only in Microsoft-operated experiences such as Copilot and Microsoft 365, not in grounding
                services Microsoft provides to third parties
              </td>
              <td>
                <code>ai-grounding:disallowextended</code>
              </td>
            </tr>
            <tr>
              <td>Disallow</td>
              <td>Content is not used to inform generated responses</td>
              <td>
                <code>ai-grounding:disallow</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        You publish the value in a meta tag or an HTTP header. Microsoft&apos;s example for blocking grounding on one page
        is:
      </p>
      <pre>
        <code>{`<meta name="Bingbot" content="ai-grounding:disallow">
X-Robots-Tag: Bingbot: ai-grounding:disallow`}</code>
      </pre>
      <p>
        The third-party services Microsoft names as excluded by DisallowExtended are Web IQ and grounding through API
        access in Foundry. It does not list which outside products use them.
      </p>

      <h2>What are the key dates?</h2>
      <p>
        The key date for most sites is 1 February 2027, when Microsoft starts honoring the new preferences as it
        crawls. Sites that use NoArchive or NoCache have four dates to plan around.
      </p>
      <ol>
        <li>
          <strong>15 December 2026.</strong> Temporary grounding preferences open in Bing Webmaster Tools, only for
          sites using NoArchive or NoCache on that date.
        </li>
        <li>
          <strong>1 February 2027.</strong> New AI Training and AI Grounding preferences begin taking effect as pages
          are crawled.
        </li>
        <li>
          <strong>1 March 2027.</strong> Deadline to publish new preferences and record the temporary grounding
          preference. After this, NoArchive and NoCache are no longer read as training or grounding preferences.
        </li>
        <li>
          <strong>30 September 2027.</strong> Temporary preferences expire, or earlier once Bing recrawls a page and
          finds its new setting.
        </li>
      </ol>
      <p>
        Microsoft notes that publishing a setting is not the same as activating it, because Bing must crawl the page
        first. It says <a href="https://www.bing.com/indexnow" {...ext}>IndexNow</a> can raise the chance of a recrawl
        but does not guarantee a date; our guide to <Link href="/blog/indexnow-for-ai-search">IndexNow for AI search</Link>{" "}
        explains the setup.
      </p>

      <h2>Should a local business change anything?</h2>
      <p>
        Most local businesses should change nothing, because the default of Allow keeps their pages eligible to be
        cited in Copilot and Bing&apos;s AI answers. Microsoft&apos;s post warns plainly that choosing Disallow or
        DisallowExtended for grounding will reduce brand visibility in AI experiences, and adds that neither choice
        guarantees inclusion, traffic or payment.
      </p>
      <p>
        The one check worth doing now is whether an SEO plugin or old developer setting added NoArchive or NoCache to
        your pages. If it did and you never meant to restrict AI use, you can leave it: after 1 March 2027 those tags
        stop counting for grounding and the default applies. If you want to keep your pages out of model training but
        still be cited, Microsoft says you can set AI Training to Disallow and leave AI Grounding on Allow. Our{" "}
        <Link href="/blog/ai-crawlers-robots-txt-guide">AI crawlers and robots.txt guide</Link> covers the same split for
        other AI companies.
      </p>

      <h2>Does this affect ChatGPT?</h2>
      <p>
        It may, but neither company has said exactly how. OpenAI&apos;s help page{" "}
        <a href="https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt" {...ext}>
          Searching the web with ChatGPT
        </a>{" "}
        says ChatGPT search sometimes sends queries to partner search providers and links Microsoft&apos;s privacy
        statement. Microsoft&apos;s post does not name ChatGPT among the third parties affected by DisallowExtended. Read
        more in <Link href="/blog/does-chatgpt-use-bing">does ChatGPT use Bing</Link>.
      </p>

      <h2>Is this the same as Bing&apos;s new AI answers toggle?</h2>
      <p>
        No, the grounding preference is a publisher setting, while the toggle announced on 11 November 2026 is a
        searcher setting. Bing&apos;s{" "}
        <a href="https://blogs.bing.com/search/2026/11/your-choice-turn-ai-answers-on-or-off-in-bing/" {...ext}>
          post on turning AI answers on or off
        </a>{" "}
        describes a preview browser extension and a <code>-ai</code> search operator that hide AI answers for that user.
        Google&apos;s equivalent publisher control is covered in{" "}
        <Link href="/blog/how-to-opt-out-of-ai-overviews">how to opt out of AI Overviews</Link>, and the concept itself
        in <Link href="/blog/what-is-grounding-in-ai-search">what grounding in AI search means</Link>.
      </p>
      <p>
        To see whether AI assistants already cite and name your business, run Alphaa&apos;s{" "}
        <Link href="/start">free 60-second AI check</Link> across ChatGPT, Gemini, Claude and Perplexity.
      </p>

      <h2>What else are site owners asking about the change?</h2>

      <h3>Does blocking AI grounding remove my site from Bing search?</h3>
      <p>
        No, Microsoft says these preferences do not change eligibility for traditional Bing search results. They only
        govern use in training and in generated answers.
      </p>

      <h3>Can I set the grounding preference in robots.txt?</h3>
      <p>
        No, Microsoft says AI Grounding is a page-level setting only, published in a meta tag or X-Robots-Tag header.
        Only the AI Training preference can be set for a whole site or path in robots.txt.
      </p>

      <h3>What happens if I do nothing?</h3>
      <p>
        If you do nothing, both preferences default to Allow, so your content stays eligible for training and for AI
        answers. Sites still using NoArchive or NoCache after 1 March 2027 also fall back to Allow until recrawled.
      </p>

      <h3>Does Allow guarantee my pages appear in Copilot answers?</h3>
      <p>
        No, Microsoft states that neither choice guarantees inclusion, traffic or payment. Allow only keeps your content
        eligible; whether it is cited depends on how useful and trustworthy it is for the question.
      </p>
    </div>
  )
}
