import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "bing-places-for-ai-search",
  title: "Bing Places for AI Search: A 2026 Setup Guide",
  description:
    "How to set up Bing Places for AI search: import from Google, verify, fill every field and keep details consistent so Copilot and ChatGPT get your facts right.",
  subtitle:
    "Claim your free Bing Places listing at bing.com/forbusiness, import it from Google Business Profile, and keep every detail identical to your website, because Bing's index feeds Copilot and is one of ChatGPT's search partners.",
  date: "2026-11-13",
  updated: "2026-11-13",
  readMins: 5,
  tag: "Guide",
  kind: "guide",
  keyphrase: "bing places for ai search",
  image: {
    src: "/blog/bing-places-for-ai-search.webp",
    alt: "A lit, empty shop window at dusk with a blank wooden hanging sign outside and a paper street map with one red pin taped inside the glass.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Bing Places for Business is Microsoft's free listing tool, now at bing.com/forbusiness, and listings appear in Bing search and Bing Maps.",
    "Microsoft says web-grounded answers in Bing, Copilot and Microsoft 365 use content collected by its crawlers.",
    "OpenAI says ChatGPT search sometimes sends rewritten queries, with a general location, to partner search providers, and links Microsoft's privacy statement.",
    "The new Bing Places imports name, hours and contact details from Google Business Profile, then suggests missing fields to add.",
    "Matching details across Bing, Google and your website matters because Bing says grounding systems may abstain when sources conflict.",
  ],
  sources: [
    {
      title: "Introducing the New Bing Places for Business: Built for Business Owners, Powered by Research",
      publisher: "Microsoft Bing Blogs",
      url: "https://blogs.bing.com/search/October-2025/Introducing-the-New-Bing-Places-for-Business-Built-for-Business-Owners,-Powered-by-Research",
    },
    {
      title: "Searching the web with ChatGPT | OpenAI Help Center",
      publisher: "OpenAI",
      url: "https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt",
    },
    {
      title: "Your content, your choice: clearer preferences for training and grounding",
      publisher: "Microsoft Bing Blogs",
      url: "https://blogs.bing.com/search/2026/10/your-content-your-choice-clearer-preferences-for-training-and-grounding/",
    },
    {
      title: "Evolving role of the index: From ranking pages to supporting answers",
      publisher: "Microsoft Bing Blogs",
      url: "https://blogs.bing.com/search/2026/5/Evolving-role-of-the-index-From-ranking-pages-to-supporting-answers/",
    },
    {
      title: "Guidelines for representing your business on Google - Google Business Profile Help",
      publisher: "Google",
      url: "https://support.google.com/business/answer/3038177",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Using Bing Places for AI search means claiming your free listing at
        bing.com/forbusiness, importing it from Google Business Profile, and keeping every detail identical to your
        website. Bing&apos;s index grounds Copilot&apos;s answers, and Microsoft is one of the search partners ChatGPT
        uses, so a missing or wrong Bing listing can follow you into AI answers.
      </p>

      <p>
        This guide is for local business owners who set up Google Business Profile years ago and never touched Bing.
        It covers why the listing matters for AI assistants, the setup steps in the new Bing Places, and what Microsoft
        and OpenAI have and have not said about how the data is used.
      </p>

      <h2>What is Bing Places for Business?</h2>
      <p>
        Bing Places for Business is Microsoft&apos;s free tool for creating and managing the business listing that
        appears in Bing search results and Bing Maps. Microsoft rebuilt it in October 2025 and, in its{" "}
        <a
          href="https://blogs.bing.com/search/October-2025/Introducing-the-New-Bing-Places-for-Business-Built-for-Business-Owners,-Powered-by-Research"
          {...ext}
        >
          launch post
        </a>
        , moved it from bingplaces.com to bing.com/forbusiness. Existing listings were migrated automatically, so if
        someone set one up for you years ago, it may still be there with old details.
      </p>
      <p>
        The same post says the new version imports listings from Google faster and better preserves the business
        name, hours and contact details, adds dashboards and bulk editing, and launches a Recommendation Tool that
        suggests missing information such as photos, a website link, hours and social profiles. Microsoft also names
        deeper integration with Bing Maps and Copilot as planned work.
      </p>

      <h2>Why does Bing Places matter for AI search?</h2>
      <p>
        Bing Places matters for AI search because Bing&apos;s data reaches two of the assistants your customers use:
        Microsoft Copilot directly, and ChatGPT through its search partners. Microsoft&apos;s October 2026 post on{" "}
        <a
          href="https://blogs.bing.com/search/2026/10/your-content-your-choice-clearer-preferences-for-training-and-grounding/"
          {...ext}
        >
          training and grounding preferences
        </a>{" "}
        describes web content collected through its crawlers being used for &quot;web-grounded responses in Bing,
        Copilot, and Microsoft 365&quot;.
      </p>
      <p>
        On the ChatGPT side, OpenAI&apos;s help page{" "}
        <a href="https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt" {...ext}>
          Searching the web with ChatGPT
        </a>{" "}
        says ChatGPT search sometimes partners with other search providers, rewriting a question such as &quot;good
        restaurants near me&quot; into a query like &quot;top restaurants San Francisco&quot; using your general
        location. For how those providers process queries, it links Microsoft&apos;s privacy statement. Our explainer on{" "}
        <Link href="/blog/does-chatgpt-use-bing">whether ChatGPT uses Bing</Link> covers that relationship in detail.
      </p>
      <p>
        Be clear about the limit: neither company says a Bing Places listing is copied into ChatGPT or Copilot answers
        field by field. What the documents do show is that Bing&apos;s view of the web, which includes its local
        listings, is one of the sources these assistants draw on. A claimed, accurate listing is cheap insurance that
        the facts returned about you are right.
      </p>

      <h2>Why do consistent details matter so much to AI answers?</h2>
      <p>
        Consistent details matter because AI answers are built from facts gathered across several sources, and
        conflicting facts can make an assistant leave you out or repeat the wrong one. Bing&apos;s May 2026 post{" "}
        <a
          href="https://blogs.bing.com/search/2026/5/Evolving-role-of-the-index-From-ranking-pages-to-supporting-answers/"
          {...ext}
        >
          Evolving role of the index
        </a>{" "}
        says grounding treats stale facts as a direct cause of wrong answers, must detect conflicts between sources, and
        counts abstaining as a valid outcome when evidence is missing, stale or conflicting.
      </p>
      <p>
        For a local business, that means a Bing listing with last year&apos;s phone number, a different suite number or
        old hours is not neutral. It is a second version of the truth that an AI system has to reconcile with your
        website and Google profile. Google&apos;s own{" "}
        <a href="https://support.google.com/business/answer/3038177" {...ext}>
          Guidelines for representing your business on Google
        </a>{" "}
        ask for the business name as used in the real world, an accurate address and hours, and the same rule is the
        right standard on Bing. Our guide to{" "}
        <Link href="/blog/directory-listings-nap-citations-ai-search">directory listings and AI search</Link> goes
        through the rest of the listings worth checking.
      </p>

      <h2>How do you set up Bing Places for AI search step by step?</h2>
      <p>
        There are seven steps, starting with finding out whether a listing already exists and ending with a monthly
        check. Most owners finish the first five in under an hour.
      </p>
      <ol>
        <li>
          <strong>Search for your business on Bing and Bing Maps.</strong> Note whether a listing exists and what it
          says. An old or duplicate listing is the most common problem.
        </li>
        <li>
          <strong>Sign in at bing.com/forbusiness.</strong> Use a Microsoft account you control, ideally one tied to a
          business email rather than a former employee&apos;s address.
        </li>
        <li>
          <strong>Import from Google Business Profile, or add the business manually.</strong> Microsoft says the import
          preserves the name, hours and contact details. Check every imported field anyway; anything wrong on Google
          will now be wrong on Bing too.
        </li>
        <li>
          <strong>Complete verification.</strong> Follow the verification option Bing offers for your listing. An
          unverified listing is easier for anyone else to edit.
        </li>
        <li>
          <strong>Fill every field the Recommendation Tool suggests.</strong> Add your website link, hours, photos,
          categories, services and social profiles. For restaurants, Microsoft mentions menu and online ordering links.
        </li>
        <li>
          <strong>Match your website exactly.</strong> Make the name, address, phone number and hours on Bing, Google
          and your site identical, and mark them up with LocalBusiness structured data; see{" "}
          <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>.
        </li>
        <li>
          <strong>Recheck monthly and after any change.</strong> When you move, change hours or add a service, update
          Bing the same day you update Google and your website.
        </li>
      </ol>
      <p>
        If your website itself is not in Bing&apos;s index, the listing has less to support it. Submitting your sitemap
        in Bing Webmaster Tools and pinging changes with{" "}
        <Link href="/blog/indexnow-for-ai-search">IndexNow</Link> help Bing find your pages and updates sooner.
      </p>

      <h2>How does Bing Places compare with Google Business Profile?</h2>
      <p>
        Bing Places and Google Business Profile do the same job for different ecosystems, so a local business needs
        both and should keep them identical. The table sets out what each one feeds, based on Microsoft&apos;s and
        OpenAI&apos;s published pages.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>Bing Places for Business</th>
              <th>Google Business Profile</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Run by</td>
              <td>Microsoft</td>
              <td>Google</td>
            </tr>
            <tr>
              <td>Where the listing shows</td>
              <td>Bing search and Bing Maps</td>
              <td>Google Search and Google Maps</td>
            </tr>
            <tr>
              <td>AI answers in that ecosystem</td>
              <td>Copilot and Bing&apos;s own AI answers; Microsoft is a ChatGPT search partner</td>
              <td>Google AI Overviews and AI Mode</td>
            </tr>
            <tr>
              <td>Setup address</td>
              <td>bing.com/forbusiness</td>
              <td>Google Business Profile</td>
            </tr>
            <tr>
              <td>Shortcut</td>
              <td>Import from Google Business Profile</td>
              <td>None needed</td>
            </tr>
            <tr>
              <td>Cost</td>
              <td>Free</td>
              <td>Free</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Google&apos;s side is covered in our guide to{" "}
        <Link href="/blog/google-business-profile-ai-answers">Google Business Profile and AI answers</Link>, and the
        Microsoft side in <Link href="/blog/how-to-get-recommended-by-microsoft-copilot">how to get recommended by Microsoft Copilot</Link>.
      </p>

      <h2>What can Bing Places not do for AI visibility?</h2>
      <p>
        Bing Places cannot make an AI assistant recommend you; it only makes sure the facts Bing holds about you are
        complete and correct. Recommendations also depend on what your website says about your services, your reviews,
        and whether other trusted sites mention you. A perfect listing with a thin website still gives an assistant
        little reason to pick you for &quot;best&quot; questions.
      </p>
      <p>
        It also does not control how your site&apos;s content is used. That is a separate set of page-level settings;
        Microsoft&apos;s new <Link href="/blog/bing-ai-grounding-preference">AI grounding preference</Link> takes effect
        from February 2027, and the default keeps your pages eligible for AI answers.
      </p>

      <h2>What should you do next?</h2>
      <p>
        Next, check what the assistants already say about you, because that tells you whether Bing is the gap or just
        one item on a longer list. Ask Copilot and ChatGPT for your business by name and for &quot;best [your service] in
        [your town]&quot;, and compare the hours, phone number and address they give with your own.
      </p>
      <p>
        Alphaa&apos;s <Link href="/start">free 60-second AI check</Link> asks ChatGPT, Gemini, Claude and Perplexity
        those questions for you. On a paid plan, from $99 a month, the agent repeats the check weekly and drafts fixes
        for your website and Google Business Profile, which you approve before anything goes live.
      </p>

      <h2>What else do owners ask about Bing Places and AI?</h2>

      <h3>Is Bing Places still free?</h3>
      <p>
        Yes, Microsoft describes Bing Places for Business as a free platform for creating and managing listings that
        appear in Bing search and Bing Maps. There is no paid tier needed to claim or edit a listing.
      </p>

      <h3>Does bingplaces.com still work?</h3>
      <p>
        Microsoft moved Bing Places to bing.com/forbusiness in October 2025 and said existing users would be redirected
        when they sign in. Bookmarks to the old address should land on the new experience.
      </p>

      <h3>Does a Bing Places listing help with ChatGPT recommendations?</h3>
      <p>
        It can help indirectly, because OpenAI says ChatGPT search uses partner search providers and links
        Microsoft&apos;s privacy statement for them. OpenAI has not said Bing Places data is used directly, so treat the
        listing as accuracy insurance rather than a ranking lever.
      </p>

      <h3>Should I import from Google or enter details by hand?</h3>
      <p>
        Import from Google if your Google Business Profile is accurate, because Microsoft says the new import preserves
        the name, hours and contact details. Then review every field, since the import copies mistakes as faithfully as
        correct data.
      </p>

      <h3>How often should I update my Bing listing?</h3>
      <p>
        Update it whenever any detail changes, and check it at least once a month. Bing says stale facts in grounding
        can produce wrong answers directly, so an outdated listing is a real risk.
      </p>
    </div>
  )
}
