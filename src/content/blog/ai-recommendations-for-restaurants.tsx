import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "ai-recommendations-for-restaurants",
  title: "How Restaurants Get Recommended by AI (ChatGPT, Google AI & More)",
  description:
    "When diners ask ChatGPT or Google AI for the best spot near them, AI leans on your Google Business Profile, reviews, menu details, and consistent listings. Here is the restaurant playbook to become the place it names.",
  date: "2026-06-17",
  readMins: 9,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> When someone asks an AI assistant &quot;best ramen near me&quot;
        or &quot;a good Italian restaurant in [city] for an anniversary,&quot; it doesn&apos;t make the
        list up — it leans on the public signals it can read about you: your Google Business Profile,
        your reviews (how many, how high, how recent, and whether you reply), your menu and cuisine
        details, and whether your listings agree with each other across Google, Yelp, TripAdvisor, and
        reservation platforms. You can&apos;t edit what the model thinks. But you can shape what it reads
        about you, so the restaurants that get named tend to be the ones that are <em>complete</em>,
        <em> well-reviewed</em>, and described <em>consistently</em> everywhere.
      </p>

      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>

      <h2>Why AI names some restaurants and skips others</h2>
      <p>
        AI assistants answer dining questions in two ways. Some retrieve live results the moment you
        ask — Google&apos;s AI features and tools that browse the web pull from current pages, maps,
        and directories. Others answer from what they absorbed during training, which favors places
        that are written about consistently and positively across many sources. Either way, the inputs
        are the same public signals, so the work that earns you a mention overlaps heavily for both.
      </p>
      <p>
        Reviews do a lot of the gatekeeping for local food recommendations. When AI assembles a short
        list of &quot;good&quot; or &quot;best&quot; spots, it tends to skew toward restaurants with
        strong ratings, a healthy volume of recent reviews, and visible owner responses. Very low
        ratings, almost no reviews, or reviews that sit unanswered can quietly keep you off the list —
        not because you&apos;re penalized, but because the signal that you&apos;re a safe, well-liked
        choice simply isn&apos;t there. None of this guarantees a ranking; AI output varies by phrasing,
        location, and the day. The goal is to be the obvious, well-documented answer so you show up far
        more often.
      </p>

      <h2>The restaurant AEO playbook</h2>

      <h3>1. Complete and actively maintained Google Business Profile</h3>
      <p>
        Your Google Business Profile is the single most important thing AI reads about a restaurant.
        Fill in everything: exact name, address, and phone; precise hours (including holiday hours);
        cuisine and category; price range; the attributes diners filter on (outdoor seating, takeout,
        delivery, reservations, dine-in, wheelchair access, good for groups, kid-friendly). Add real,
        well-lit photos of the room, the food, and the storefront, and refresh them. Keep posting
        updates — specials, seasonal menus, events. A profile that&apos;s complete and clearly active
        reads as a real, current business, which is exactly what an assistant wants to recommend.
      </p>

      <h3>2. A reviews strategy, not just a review count</h3>
      <p>
        Reviews are where most of the leverage is. Make it easy and routine for happy guests to leave a
        Google review — a short link on the receipt, a QR code at the table, a line from your servers.
        Aim for a steady stream rather than a one-time burst, because recency matters: a restaurant with
        fresh reviews this month reads as livelier than one whose last review was a year ago. Reply to
        reviews — all of them. Thank people for the good ones and respond calmly and specifically to the
        critical ones. Response behavior is itself a visible signal, and it&apos;s one of the cheapest
        ways to look like a place that cares. Never buy or fake reviews; platforms detect it and it can
        sink the trust you&apos;re trying to build.
      </p>

      <h3>3. Make your menu, cuisine, price, and dietary info unmistakable</h3>
      <p>
        A huge share of dining questions are specific: &quot;gluten-free pasta near me,&quot; &quot;vegan
        brunch in [city],&quot; &quot;cheap tacos open late,&quot; &quot;where can I get good vegetarian
        Indian food.&quot; AI can only match you to those questions if the details exist in plain text it
        can read. Publish your full menu on your own site as real HTML — not trapped inside a PDF or an
        image — with dish names, descriptions, prices, and dietary tags (vegan, vegetarian, gluten-free,
        nut-free, halal, spice level). State your cuisine and price range clearly. Keep the menu on your
        site current and matching what&apos;s posted on Google. The more concretely you describe what you
        serve, the more specific questions you can be the answer to.
      </p>

      <h3>4. Occasion- and dish-specific content and FAQs</h3>
      <p>
        People rarely ask for a restaurant in the abstract. They ask for &quot;best patio brunch in
        [city],&quot; &quot;a romantic dinner spot for an anniversary,&quot; &quot;a good place for a
        big birthday group,&quot; &quot;late-night food downtown.&quot; Write short, honest pages and FAQ
        answers that speak to the occasions and dishes you genuinely do well. If your patio is the draw,
        have a page that says so and describes it. If you take large parties, say how many you seat and
        how to book. A clear FAQ — Do you take reservations? Is there parking? Are you kid-friendly? Can
        you handle gluten-free? — gives AI clean, quotable answers to the exact questions diners type. The
        same instinct applies to any local business; we cover the general version in{" "}
        <Link href="/blog/get-recommended-by-ai-local-service-business">
          how local service businesses get recommended by AI
        </Link>
        .
      </p>

      <h3>5. Restaurant and Menu schema</h3>
      <p>
        Schema markup is structured data that spells out, in a machine-readable format, what your page
        is about. Add <strong>Restaurant</strong> schema with your name, address, phone, hours,
        cuisine, price range, and geo, and <strong>Menu</strong> schema for your menu items, sections,
        and prices. This won&apos;t force a recommendation, but it removes ambiguity — it helps engines
        confirm the facts they&apos;re reading rather than guessing. Pair it with review markup where
        appropriate. If you want the bigger picture on structured data and retrieval, see{" "}
        <Link href="/blog/what-is-answer-engine-optimization">what answer engine optimization is</Link>.
      </p>

      <h3>6. Consistent listings everywhere</h3>
      <p>
        AI cross-checks you across sources. If your name, address, phone, hours, and cuisine are
        identical on Google, Yelp, TripAdvisor, your reservation platform (OpenTable, Resy, and the
        like), delivery apps, and your own site, you read as one trustworthy, well-established place. If
        they disagree — an old address here, wrong hours there, a phone number that&apos;s changed — the
        confidence drops and so do your chances of being named. Audit your major listings, fix the
        conflicts, and claim the profiles you don&apos;t control yet. Consistency is unglamorous and it
        compounds.
      </p>

      <h3>7. Don&apos;t block the AI crawlers</h3>
      <p>
        None of this works if assistants can&apos;t read your site. Check that your{" "}
        <code>robots.txt</code> and any bot rules aren&apos;t blocking the crawlers that AI tools use,
        and that your menu and key pages render as real text rather than as images or scripts that bots
        can&apos;t parse. A surprising number of restaurant sites accidentally hide their most important
        content this way. If an AI engine can&apos;t fetch your menu, it can&apos;t recommend you for the
        dish someone&apos;s craving.
      </p>

      <h2>What this is — and isn&apos;t</h2>
      <p>
        To be clear about the mechanics: this work shapes the <em>public signals</em> AI relies on —
        your Google Business Profile, reviews, menu and cuisine details, schema, and directory listings.
        It does not reach inside the model or buy you a placement, and there&apos;s no guaranteed ranking.
        What it does is make you the well-documented, well-reviewed, clearly described choice that an
        assistant keeps landing on when a hungry person asks. Get the fundamentals right and you stop
        being invisible to the way people increasingly decide where to eat.
      </p>

      <h2>Start with what AI sees today</h2>
      <p>
        Before you change anything, find out what assistants actually say about your restaurant right
        now — which questions you show up for, where your listings disagree, and what&apos;s missing.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
