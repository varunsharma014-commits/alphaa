import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "topical-authority-for-ai-search",
  title: "Topical Authority for AI Search: How to Build It (2026)",
  description:
    "Topical authority for AI search explained without the hype: what Google has confirmed, why focus helps AI engines cite you, and a 7-step plan to build it.",
  subtitle:
    "Topical authority is being the site that covers one subject so completely and reliably that search and AI engines reach for it first, and you build it by narrowing, not by publishing more.",
  date: "2026-11-02",
  updated: "2026-11-02",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "topical authority for ai search",
  image: {
    src: "/blog/topical-authority-for-ai-search.webp",
    alt: "A long row of identical dark green books on a cream shelf with one open green book and two ribbon bookmarks in front.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Google's only publicly confirmed topic authority system, announced in May 2023, ranks news sources for specialised topics.",
    "Its signals are notability for a topic or place, original reporting that others cite, and a track record of quality.",
    "Google's helpful content guidance asks whether a site has a primary purpose or focus, and warns against covering many unrelated topics.",
    "AI Overviews and AI Mode may fan one question out into several searches across subtopics, which rewards complete coverage.",
    "Build topical authority by mapping one subject's questions, answering each on its own page and linking them into a hub.",
  ],
  sources: [
    {
      title: "Understanding news topic authority",
      publisher: "Google Search Central Blog",
      url: "https://developers.google.com/search/blog/2023/05/understanding-news-topic-authority",
    },
    {
      title: "Creating Helpful, Reliable, People-First Content",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    },
    {
      title: "AI Features and Your Website",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/ai-features",
    },
    {
      title: "SEO Starter Guide: The Basics",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Topical authority for AI search means being the source that covers one
        subject so completely, accurately and consistently that search engines and AI assistants reach for your
        pages when that subject comes up. You build it by choosing a narrow topic, answering every real question
        within it on its own page, and earning citations from others.
      </p>

      <p>
        This guide is for small businesses and marketers who keep hearing the phrase and want to know what is
        confirmed, what is folklore and what to actually do on Monday. It separates the parts Google has documented
        from the parts that are reasonable inference.
      </p>

      <h2>What is topical authority?</h2>
      <p>
        Topical authority is the degree to which search and AI engines treat a site as a dependable go-to source on
        a specific subject. It is a description of an outcome rather than a single score you can look up. A local
        plumber whose site thoroughly answers questions about water heaters, burst pipes and drain problems in one
        city has more authority on those topics than a general home-services blog that touches each once.
      </p>
      <p>
        The idea matters more in AI search than it did with ten blue links. An assistant writing one answer usually
        names a handful of sources at most, so being one of several decent pages on a topic is no longer enough.
        The engine has to have a reason to pick you, and depth on the subject is one of the clearest reasons you can
        give it.
      </p>

      <h2>Has Google confirmed that topical authority is a ranking factor?</h2>
      <p>
        Google has confirmed a system called topic authority, but only for news. In{" "}
        <a href="https://developers.google.com/search/blog/2023/05/understanding-news-topic-authority" {...ext}>
          Understanding news topic authority
        </a>{" "}
        (May 2023), Google described a system that helps determine which expert sources are most helpful for newsy
        queries in specialised areas such as health, politics and finance. It has not published an equivalent
        system for ordinary business websites.
      </p>
      <p>The news system is still instructive, because Google named the signals it looks at:</p>
      <ul>
        <li>
          <strong>Notability for a topic or location.</strong> Its example is a local paper people rely on for high
          school football coverage.
        </li>
        <li>
          <strong>Influence and original reporting.</strong> How often other publishers cite a source&apos;s
          original work.
        </li>
        <li>
          <strong>Source reputation.</strong> A track record of quality, recommendations from expert bodies and
          professional awards.
        </li>
      </ul>
      <p>
        Swap &quot;reporting&quot; for &quot;expertise&quot; and those three map neatly onto a local business: be
        known for a specific service in a specific place, produce something original enough that others reference
        it, and keep a clean record over time. Any claim that topical authority is a single confirmed ranking factor
        for every site goes beyond what Google has said.
      </p>

      <h2>Why does topical focus help with AI search?</h2>
      <p>
        Topical focus helps because AI search breaks a question into several related searches, and a site that
        covers the whole cluster can match more of them. Google says in{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI Features and Your Website
        </a>{" "}
        that AI Overviews and AI Mode may use a &quot;query fan-out&quot; technique, issuing multiple related
        searches across subtopics and data sources to build a response. If a customer asks which water heater to
        buy, the engine may also search for costs, lifespans and installers nearby. A site with a page for each of
        those has several chances to be retrieved; a site with one general page has one. Our explainer on{" "}
        <Link href="/blog/what-is-query-fan-out">query fan-out</Link> goes deeper.
      </p>
      <p>
        Google&apos;s own guidance points the same way. Its{" "}
        <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" {...ext}>
          helpful content self-assessment
        </a>{" "}
        asks, &quot;Does your site have a primary purpose or focus?&quot; and lists as a warning sign producing
        lots of content on many different topics in hopes that some of it might perform well. It also asks whether
        content provides original information, research or analysis, and whether it is written or reviewed by
        someone who demonstrably knows the topic.
      </p>
      <p>
        ChatGPT, Claude and Perplexity do not publish ranking documentation of this kind, so we cannot quote their
        rules. What we can say is that they retrieve and cite web pages, and a page that answers the exact question
        clearly is easier to quote than one that buries it. See{" "}
        <Link href="/blog/what-sources-do-ai-engines-cite">what sources AI engines cite</Link> for what is known.
      </p>

      <h2>How do you build topical authority step by step?</h2>
      <p>
        You build topical authority in seven steps, starting with choosing a narrower subject than feels
        comfortable.
      </p>
      <ol>
        <li>
          <strong>Pick one subject you can own.</strong> &quot;Home services&quot; is too broad for a small site;
          &quot;tankless water heaters in Tucson&quot; is not. Choose the subject that matches your most profitable
          work and that you can speak about from experience.
        </li>
        <li>
          <strong>List every question customers ask about it.</strong> Pull them from phone calls, emails, reviews,
          sales conversations and the &quot;People also ask&quot; box. Group them into clusters such as cost,
          comparison, process, problems and local specifics. Our{" "}
          <Link href="/blog/keyword-research-for-ai-search">keyword research for AI search</Link> guide shows how.
        </li>
        <li>
          <strong>Give each important question its own page.</strong> Answer it in the first two sentences, then
          explain. One clear page per question is easier for an engine to match and quote than one long page
          trying to answer twenty.
        </li>
        <li>
          <strong>Build a hub and link the cluster together.</strong> Create one overview page for the subject that
          links to every question page, and have each question page link back and across to its neighbours.
          Google&apos;s{" "}
          <a href="https://developers.google.com/search/docs/fundamentals/seo-starter-guide" {...ext}>
            SEO Starter Guide
          </a>{" "}
          notes that link text tells users and Google something about the page being linked to, so use descriptive
          anchors rather than &quot;click here&quot;.
        </li>
        <li>
          <strong>Add something only you can say.</strong> Real prices from your jobs, before-and-after photos,
          a checklist you use on site, a small survey of your customers. Original material is what other sites cite,
          which is the influence signal in Google&apos;s news system. See{" "}
          <Link href="/blog/original-research-ai-citations">original research for AI citations</Link>.
        </li>
        <li>
          <strong>Make the expertise visible.</strong> Name the person who wrote or reviewed each page, state their
          qualifications and keep the business&apos;s name, address and services identical everywhere. That is how
          engines connect the content to a real entity; our{" "}
          <Link href="/blog/entity-seo-how-ai-identifies-your-business">entity SEO guide</Link> explains why.
        </li>
        <li>
          <strong>Prune or move what does not fit.</strong> Old posts on unrelated topics dilute the focus Google
          asks about. Update them so they connect to the subject, merge them, or remove them.
        </li>
      </ol>

      <h2>How is topical authority different from domain authority?</h2>
      <p>
        Topical authority is about depth on one subject, while domain authority is a third-party score estimating a
        site&apos;s overall link strength. The two are often confused because both use the word authority.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>Topical authority</th>
              <th>Domain authority</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>What it describes</td>
              <td>How completely and reliably you cover one subject</td>
              <td>A vendor&apos;s estimate of overall backlink strength</td>
            </tr>
            <tr>
              <td>Who defines it</td>
              <td>An industry concept; Google confirmed a news version</td>
              <td>SEO tool companies, each with its own formula</td>
            </tr>
            <tr>
              <td>Used by Google</td>
              <td>Topic authority is a confirmed system for news</td>
              <td>Not a Google metric</td>
            </tr>
            <tr>
              <td>How you improve it</td>
              <td>Narrow focus, full question coverage, original material</td>
              <td>Earning links from other sites</td>
            </tr>
            <tr>
              <td>Can a small site win?</td>
              <td>Yes, on a narrow enough subject</td>
              <td>Slowly, against much larger sites</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        For a small business the first is the more practical lever. You can out-cover a national directory on
        &quot;emergency boiler repair in Leeds&quot; long before you can match its link profile. Links still help,
        as our piece on <Link href="/blog/do-backlinks-matter-for-ai-search">whether backlinks matter for AI
        search</Link> explains, but they are not the whole story.
      </p>

      <h2>What mistakes weaken topical authority?</h2>
      <p>
        The most common mistake is publishing more instead of publishing deeper. These patterns undo the work:
      </p>
      <ul>
        <li>
          <strong>Chasing unrelated keywords.</strong> A roofer writing about general home decor to catch traffic
          is exactly the many-topics pattern Google&apos;s guidance warns about.
        </li>
        <li>
          <strong>Mass-producing thin pages.</strong> Google&apos;s self-assessment also asks whether you are using
          extensive automation to produce content on many topics. AI writing is not the problem; unreviewed volume
          is. See <Link href="/blog/does-ai-generated-content-hurt-ai-visibility">whether AI-generated content
          hurts AI visibility</Link>.
        </li>
        <li>
          <strong>Orphan pages.</strong> A good answer that nothing links to is hard for crawlers and readers to
          find. Google lists making content findable through internal links among its AI feature best practices.
        </li>
        <li>
          <strong>Letting pages go stale.</strong> Prices, regulations and products change. An outdated answer
          gives an engine a reason to cite someone else; our guide to{" "}
          <Link href="/blog/content-freshness-ai-search">content freshness</Link> covers when updates matter.
        </li>
      </ul>

      <h2>How can you tell if your topical authority is working?</h2>
      <p>
        You can tell it is working when AI assistants start naming or citing you across many questions in your
        subject, not just one. Write down 15 to 20 questions from your cluster map, ask them in ChatGPT, Gemini,
        Claude and Perplexity, and record whether you are mentioned and which page is cited. Repeat monthly, because
        answers vary from run to run and a single check proves little.
      </p>
      <p>
        That manual routine is what Alphaa automates for one business: it asks those four assistants your
        customers&apos; questions every week, checks what they can read on your site, and drafts the missing pages
        and fixes for you to approve. You can see where you stand today with the{" "}
        <Link href="/start">free 60-second AI check</Link>, or read{" "}
        <Link href="/blog/how-to-measure-ai-visibility">how to measure AI visibility</Link> to do it yourself.
      </p>

      <h2>What else do people ask about topical authority?</h2>

      <h3>How long does it take to build topical authority?</h3>
      <p>
        There is no fixed timeline, and anyone who promises one is guessing. It depends on how narrow your subject
        is, how much competition exists and how quickly engines recrawl your pages.
      </p>

      <h3>How many articles do I need for topical authority?</h3>
      <p>
        There is no magic number; you need enough pages to answer the real questions in your subject, and no more.
        For a narrow local service that might be a dozen focused pages, while a broad national topic could need
        far more.
      </p>

      <h3>Does topical authority matter for ChatGPT and Perplexity?</h3>
      <p>
        Probably, though neither publishes ranking rules, so this is inference rather than documentation. Both
        retrieve and cite web pages, and a site that answers the specific question clearly gives them more to
        quote.
      </p>

      <h3>Can a new website build topical authority?</h3>
      <p>
        Yes, and a narrow focus is the best way for a new site to compete. Our guide to{" "}
        AI visibility for a new website covers the first pages to publish and the profiles to set up.
      </p>

      <h3>Is topical authority the same as E-E-A-T?</h3>
      <p>
        No, but they overlap. E-E-A-T describes qualities Google wants content to show, such as experience and
        expertise, while topical authority describes depth on a subject; showing real expertise across a focused
        cluster supports both.
      </p>
    </div>
  )
}
