# Content engine: blog post format (canonical spec)

The daily content task follows this file exactly. One post = one `.tsx` file in
`src/content/blog/`, one hero image in `public/blog/`, and one entry in
`src/content/blog/index.ts`. Everything else (sitemap, blog index, RSS at
`/blog/rss.xml`, the "All guides" list in `/llms.txt`, BlogPosting / FAQPage /
BreadcrumbList JSON-LD, OpenGraph and Twitter cards) is generated from the post's
`meta` automatically.

Reference example using every field:
`src/content/blog/ai-agent-tools-local-business-marketing.tsx`
(live at https://alphaa.app/blog/ai-agent-tools-local-business-marketing).

---

## 1. Pick the topic

- One primary query per post = `keyphrase` (e.g. "how to get recommended by chatgpt").
- Check it is not already covered: `grep -il "<keyphrase words>" src/content/blog/*.tsx`.
  If a post covers it, update that post instead (set `updated`), do not write a duplicate.
- Pick `kind`: `guide` | `comparison` | `glossary` | `listicle` | `industry` | `news`.

## 2. Word-count targets (body text, excluding meta)

| kind | words |
|---|---|
| guide | 1,400–2,000 |
| comparison, listicle | 1,600–2,400 |
| glossary | 700–1,000 |
| industry | 1,000–1,500 |
| news | 600–1,000 |

`readMins` = words / 230, rounded up.

## 3. Structure rules (all mandatory)

- **title**: ≤ 60 characters and contains the keyphrase (or its exact words in order).
- **description**: 140–160 characters. Count them.
- **subtitle**: answers the title's question in ONE sentence (shown under the H1, used in llms.txt and RSS).
- **First paragraph**: a 40–60-word direct answer, starting `<strong>Short answer:</strong>`. No preamble.
- **H2s are questions** ("How much does AEO cost?"), each followed immediately by a `<p>` whose first sentence answers it. Those pairs become FAQPage schema automatically, so the answer paragraph must be ≥ 40 characters and self-contained.
- **One comparison table or numbered steps** (`<ol>`) wherever it fits. Wrap every table in `<div className="table-wrap">…</div>` so it scrolls inside the column on phones.
- **"Frequently asked questions" H2** near the end with **4–6 Q&As**, each an `<h3>` ending in `?` directly followed by ONE `<p>` answer (≥ 40 characters, 2–3 sentences, answer in the first sentence). `extractFaq` in `src/content/blog/faq.ts` reads exactly this shape: `<h2>Frequently asked questions</h2>` then `<h3>…?</h3><p>…</p>` pairs. Don't put lists, links-only paragraphs or extra wrappers between the `<h3>` and its `<p>`. Don't repeat a question already used as an H2.
- **takeaways**: 3–5 bullets, each one sentence, ≤ 25 words, each a standalone fact.
- **sources**: 3–6 outbound citations to primary or authoritative pages (the vendor's own pricing page, Google Search Central, OpenAI, the study's own page). Not other SEO blogs. Open each URL and copy its real `<title>` into `title`. They render as a numbered "Sources" list at the end (`rel="noopener"`, followed), and as `citation` in the JSON-LD. Also link the most important ones inline in the body with `{...ext}`.
- **2–4 internal links**, always `import Link from "next/link"` and `<Link href="/blog/<slug>">`. Never `<a href="/...">`. Good targets: related posts, `/start` (free check), `/pricing`, `/compare/...`.
- **JSX escaping**: write `&apos;` for apostrophes and `&quot;` for double quotes inside JSX text. Strings inside `meta` are normal JS strings and need no escaping.
- **CTAs**: do NOT add your own CTA blocks; the template adds one near the top and one at the end.

## 4. Facts and claims

- Every statistic must come from the **"Verified stats bank"** in `marketing/content-engine.md`, quoted with its source and year. Never invent, round up or "estimate" numbers. If a stat is not in the bank, leave it out or describe it qualitatively.
- Competitor details only from the competitor's own site, with "as of <Month YYYY>".
- Never claim Alphaa is "#1", "the best", or that anything guarantees rankings, recommendations or timelines. Alphaa improves public signals; it cannot edit an AI model.
- Alphaa facts: Starter $99/mo, Pro $199/mo, Full Service $299/mo, month to month, no free trial (the free 60-second check at `/start` instead), 23-point check, asks ChatGPT, Gemini, Claude and Perplexity weekly. Brand is always spelled **Alphaa**.

## 5. File template (copy, then fill every field)

```tsx
import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-to-example-keyphrase", // lowercase-kebab, = file name without .tsx
  title: "How to Example Keyphrase in 2026", // ≤ 60 chars, contains keyphrase
  description:
    "140–160 characters that answer the query and name who it is for, ending on a concrete benefit, with the keyphrase used naturally.",
  subtitle: "One sentence that directly answers the question in the title.",
  date: "2026-10-01", // publish date, YYYY-MM-DD
  updated: "2026-10-01", // same as date on first publish; bump on real updates
  readMins: 8,
  tag: "Guide", // short visible label: Guide, Comparison, Glossary, Industry, News
  kind: "guide", // guide | comparison | glossary | listicle | industry | news
  keyphrase: "example keyphrase",
  image: {
    src: "/blog/how-to-example-keyphrase.webp", // from scripts/blog-image.mjs
    alt: "Literal description of what is in the image",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "First standalone takeaway in one sentence.",
    "Second standalone takeaway in one sentence.",
    "Third standalone takeaway in one sentence.",
  ],
  sources: [
    { title: "Exact page title", publisher: "Google Search Central", url: "https://developers.google.com/..." },
    { title: "Exact page title", publisher: "OpenAI", url: "https://openai.com/..." },
    { title: "Exact page title", publisher: "Publisher", url: "https://..." },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> 40–60 words that answer the query directly, in plain English, with the
        keyphrase in the first sentence. Say who it applies to and the one thing to do first.
      </p>

      <p>One or two sentences of context: who this guide is for and what it covers.</p>

      <h2>What is example keyphrase?</h2>
      <p>
        First sentence is the direct answer (this pair becomes FAQ schema). Then explain, citing a{" "}
        <a href="https://developers.google.com/..." {...ext}>primary source</a>.
      </p>

      <h2>How do you do example keyphrase step by step?</h2>
      <p>First sentence answers it: there are N steps, starting with X.</p>
      <ol>
        <li><strong>Step one.</strong> What to do and why.</li>
        <li><strong>Step two.</strong> What to do and why.</li>
        <li><strong>Step three.</strong> What to do and why.</li>
      </ol>

      <h2>How does option A compare with option B?</h2>
      <p>First sentence answers it. Then introduce the table.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Feature</th><th>Option A</th><th>Option B</th></tr>
          </thead>
          <tbody>
            <tr><td>Price</td><td>…</td><td>…</td></tr>
            <tr><td>Best for</td><td>…</td><td>…</td></tr>
          </tbody>
        </table>
      </div>

      <h2>What should you do next?</h2>
      <p>
        First sentence answers it. Link related reading, e.g.{" "}
        <Link href="/blog/how-to-get-recommended-by-chatgpt">how to get recommended by ChatGPT</Link>, and
        the <Link href="/start">free 60-second AI check</Link>.
      </p>

      <h2>Frequently asked questions</h2>

      <h3>Question one phrased the way a customer would ask it?</h3>
      <p>Direct one-sentence answer first. One or two supporting sentences.</p>

      <h3>Question two?</h3>
      <p>Direct one-sentence answer first. One or two supporting sentences.</p>

      <h3>Question three?</h3>
      <p>Direct one-sentence answer first. One or two supporting sentences.</p>

      <h3>Question four?</h3>
      <p>Direct one-sentence answer first. One or two supporting sentences.</p>
    </div>
  )
}
```

## 6. Register the post

In `src/content/blog/index.ts`:

1. Add an import next to the others:
   `import { meta as exampleMeta, Body as ExampleBody } from "./how-to-example-keyphrase"`
2. Add `{ meta: exampleMeta, Body: ExampleBody },` to the `POSTS` array.

That is all. Sitemap, `/blog`, `/blog/rss.xml` and the "All guides" section of
`/llms.txt` read `getAllPosts()` and pick it up on the next deploy.

**llms.txt:** the hand-written part lives in `src/content/llms-base.txt` (served by
`src/app/llms.txt/route.ts`, which appends the auto-generated article list). Only
edit `llms-base.txt` when a post deserves a spot in a curated section ("Key guides",
"Comparisons", "Original research"): add one line
`- [Title](https://alphaa.app/blog/<slug>): one-sentence summary.` Do NOT recreate
`public/llms.txt`; it would conflict with the route and break the build.

## 7. Hero image

Run from the repo root (the key comes from Railway env; never print or paste it):

```bash
railway run node scripts/blog-image.mjs <slug> "<what the image shows>"
```

- Describe a scene or object, not the title. The script already prepends the
  house style (clean editorial photography or minimal 3D illustration; no text,
  logos, real brands or UI screenshots).
- Output: `public/blog/<slug>.webp`, 1600x900, under ~200KB. The script prints the
  `image: {…}` line to paste into `meta`; write a literal `alt`.
- Open the file and look at it. Regenerate if it contains text, logos, faces or anything off-brand.
- Optional env: `BLOG_IMAGE_QUALITY=low|medium|high` (default medium), `OPENAI_IMAGE_MODEL`.

## 8. Verify, ship, ping

```bash
set -o pipefail
rm -rf .next/types && ./node_modules/.bin/tsc --noEmit > /tmp/tsc.log 2>&1; echo tsc=$?
./node_modules/.bin/next build > /tmp/build.log 2>&1; echo build=$?
```

- NEVER run `npm run build` (it runs prod DB migrations).
- Push only if both print `=0`. Never pipe these through `head`/`grep` before deciding.
- `git pull --rebase origin main`, commit (`Co-Authored-By` line), `git push origin main`.
- After Railway deploys (watch for the URL to return 200):

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://alphaa.app/blog/<slug>
node scripts/indexnow.mjs https://alphaa.app/blog/<slug> https://alphaa.app/blog https://alphaa.app/sitemap.xml
```

IndexNow notifies Bing (which feeds ChatGPT search and Copilot) and the other
IndexNow engines. A 200 or 202 response means accepted.

## 9. Pre-publish checklist

- [ ] title ≤ 60 chars with keyphrase; description 140–160 chars; subtitle is one sentence
- [ ] first paragraph 40–60 words, "Short answer:"
- [ ] question H2s each followed directly by an answering `<p>`
- [ ] one table (in `.table-wrap`) or numbered steps
- [ ] "Frequently asked questions" H2 with 4–6 `<h3>`/`<p>` pairs
- [ ] 3–5 takeaways; 3–6 sources with real page titles; 2–4 internal `<Link>`s
- [ ] every number traceable to the Verified stats bank or a cited primary source; no "#1", no guarantees
- [ ] hero image generated, viewed, `image` meta filled
- [ ] registered in `index.ts`; tsc and next build both exit 0
- [ ] deployed URL returns 200; IndexNow pinged
