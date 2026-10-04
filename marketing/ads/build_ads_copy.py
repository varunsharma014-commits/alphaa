#!/usr/bin/env python3
"""Single source for Alphaa paid-ad copy.

Generates marketing/ads/meta-ads-copy.md and marketing/ads/google-ads-copy.md and
verifies every platform character limit plus the founder's copy rules. Run:

    python3 marketing/ads/build_ads_copy.py

Exit code 1 if any limit or rule is broken (nothing is written in that case).
Edit the copy HERE, never in the generated .md files.
"""
import pathlib
import re
import sys
from urllib.parse import urlencode

OUT = pathlib.Path(__file__).parent
START = "https://alphaa.app/start"
GUARANTEE = "If no AI names you in 90 days, your next month is free"

# ---------------------------------------------------------------- META ----------
META_LIMITS = {"headline": 40, "description": 30, "short": 125}

# id, group, concept, creative base name, utm_campaign, CTA, headline, description, short, long
META = [
    # ---- Prospecting: core concepts -------------------------------------------------
    dict(id="p01", group="Core: phone-screen demo", creative="c01-phone-demo", campaign="prospecting", cta="Learn More",
         headline="See what ChatGPT says about you", description="Free check in about 60 seconds",
         short="Your customers ask ChatGPT who to hire now. It names a few businesses. Are you one of them?",
         long="""Someone near you just asked ChatGPT who to hire.
It gave one answer with three names.

If you're not one of them, that customer never knew you existed. No click. Nothing in your analytics.

Alphaa AI Agent asks ChatGPT, Gemini, Claude and Perplexity the questions your customers ask, and shows you the real answers in about 60 seconds.

Then it does the work to get you named. You just tap approve.

See what AI says about you, free: alphaa.app/start"""),
    dict(id="p02", group="Core: split screen", creative="c02-split-screen", campaign="prospecting", cta="Learn More",
         headline="Google gives 10 links. AI gives 1.", description="Are you in the one answer?",
         short="Google gives ten links. ChatGPT gives one answer with a few names. Which one are your customers using?",
         long="""Google gives ten links.
ChatGPT gives one answer.

More of your customers now ask AI who to call, and they call one of the few names it gives.

Alphaa AI Agent checks what ChatGPT, Gemini, Claude and Perplexity say about your business, shows you who they name instead, and does the work to get you in the answer.

Check yours free in about 60 seconds: alphaa.app/start"""),
    dict(id="p03", group="Core: invisible", creative="c03-invisible", campaign="prospecting", cta="Learn More",
         headline="Is ChatGPT naming your business?", description="See the real answer, free",
         short="If ChatGPT doesn't name you, you don't lose a ranking. You just never come up.",
         long="""When a customer asks ChatGPT who to call, there's no page two.

It names a few businesses. Everyone else is invisible for that customer. No click, no visit, nothing to see in your analytics.

Alphaa AI Agent shows you exactly what ChatGPT, Gemini, Claude and Perplexity say when asked about businesses like yours. Then it fixes what's keeping you out.

Free check: alphaa.app/start"""),
    dict(id="p04", group="Core: self-test", creative="c04-self-test", campaign="prospecting", cta="Learn More",
         headline="Ask ChatGPT who to hire near you", description="Then run the free AI check",
         short="Try this: open ChatGPT and ask for the best [your trade] in [your city]. Are you in the answer?",
         long="""A 10-second test:

1. Open ChatGPT.
2. Ask what a customer would: "Who's the best [your trade] in [your city]?"
3. Read the names.

Are you in the answer?

If not, Alphaa AI Agent shows you why, asks Gemini, Claude and Perplexity too, and does the work to get you named. You tap approve.

Run the full check free: alphaa.app/start"""),
    dict(id="p05", group="Core: teach (save-bait)", creative="c12-three-things", campaign="prospecting", cta="Learn More",
         headline="3 things AI checks before it names you", description="See how you score, free",
         short="Before ChatGPT recommends a local business, it looks for 3 things. Most owners are missing at least one.",
         long="""Before ChatGPT recommends a local business, it looks for:

1. Clear answers to the questions customers really ask.
2. Facts that match everywhere: hours, services, address.
3. Recent reviews on sites it can read.

Nobody can promise you'll be named. But these are the signals AI reads, and they can be fixed.

Alphaa AI Agent checks all three, fixes them for you, and re-asks the AIs every week.

See where you stand, free: alphaa.app/start"""),
    dict(id="p06", group="Core: four AIs", creative="c10-four-ais", campaign="prospecting", cta="Learn More",
         headline="What do 4 AIs say about you?", description="ChatGPT, Gemini, Claude, more",
         short="We ask ChatGPT, Gemini, Claude and Perplexity about your business. You see the real answers in 60 seconds.",
         long="""Your customers don't all use the same AI.

So we ask all four: ChatGPT, Gemini, Claude and Perplexity. The questions your customers ask, asked live.

You see each real answer, who got named instead of you, and what they have that you don't.

Then your AI agent starts fixing it. You tap approve. Undo anytime.

Free check: alphaa.app/start"""),
    dict(id="p07", group="Core: agent diary", creative="c11-agent-diary", campaign="prospecting", cta="Learn More",
         headline="When AI gets your facts wrong", description="Your agent drafts the fix",
         short="Example: ChatGPT told a customer you close at 5. You close at 8. Your AI agent catches that.",
         long="""An example of what the agent does:

9:02am. I asked ChatGPT when you close.
9:02am. It said 5pm. Your site says 8pm.
9:05am. I drafted a fix for your Google profile and your site. Tap approve?

Alphaa AI Agent checks what ChatGPT, Gemini, Claude and Perplexity say about you every week, fixes what they get wrong, and asks you before anything goes live.

See what AI says about you, free: alphaa.app/start"""),
    # ---- Prospecting: industry callouts ----------------------------------------------
    dict(id="p08", group="Callout: dentists", creative="c05-dentists", campaign="prospecting", cta="Learn More",
         headline="Dentists: is ChatGPT naming you?", description="Free check for your practice",
         short="Dentists: patients ask ChatGPT for a dentist before they book. It names three practices. Is yours one?",
         long="""For dental practices:

A patient with a cracked tooth doesn't scroll ten links anymore. They ask ChatGPT, get three names, and call one.

Alphaa AI Agent checks what ChatGPT, Gemini, Claude and Perplexity say when patients ask about dentists near you. Then it writes the answers AI quotes, fixes your facts, and keeps your Google profile active. You tap approve.

See what AI says about your practice, free: alphaa.app/start"""),
    dict(id="p09", group="Callout: med spas", creative="c06-med-spas", campaign="prospecting", cta="Learn More",
         headline="Med spas: does AI name your spa?", description="Free check in 60 seconds",
         short="Med spa clients ask ChatGPT and Gemini where to book. They pick from the names it gives. Is yours there?",
         long="""For med spas:

"Where should I get Botox near me?" is now a question people ask ChatGPT and Gemini. They book one of the few names in the answer.

Alphaa AI Agent shows you what all four AIs say about your spa, who they name instead, and does the work to get you in the answer: treatment pages, correct facts, active Google posts. You approve everything first.

Free check: alphaa.app/start"""),
    dict(id="p10", group="Callout: HVAC", creative="c07-hvac", campaign="prospecting", cta="Learn More",
         headline="HVAC owners: ask ChatGPT this", description="Then see your free AI check",
         short="HVAC owners: when an AC dies, homeowners ask ChatGPT who can come today. Does it name your company?",
         long="""For HVAC companies:

When the AC dies at 4pm, more homeowners ask ChatGPT "who can come today?" It gives a few names. They call one.

Alphaa AI Agent checks what ChatGPT, Gemini, Claude and Perplexity say about HVAC companies near you, then does the work to get you named: service-area pages, correct hours, active Google posts. You tap approve from your phone.

See what AI says about you, free: alphaa.app/start"""),
    dict(id="p11", group="Callout: plumbers", creative="c08-plumbers", campaign="prospecting", cta="Learn More",
         headline="Plumbers: AI decides who gets called", description="Is it you? Free check",
         short="Plumbers: the emergency call goes to a name AI gives. Is it yours? See what ChatGPT says, free.",
         long="""For plumbing companies:

A burst pipe at night. The homeowner asks ChatGPT or Perplexity for an emergency plumber open now. The call goes to one of the names it gives.

Alphaa AI Agent shows you what all four AIs say, who they name instead of you, and fixes what's keeping you out: 24-hour service facts, service pages, reviews AI can read. You approve before anything goes live.

Free check: alphaa.app/start"""),
    dict(id="p12", group="Callout: lawyers", creative="c09-lawyers", campaign="prospecting", cta="Learn More",
         headline="Law firms: does AI recommend you?", description="See the real answers, free",
         short="Law firms: after an accident, people ask AI which lawyer to call. Is your firm in the answer?",
         long="""For law firms:

After a car accident, people ask Claude or ChatGPT which injury lawyer to call. They get a short list.

Alphaa AI Agent asks ChatGPT, Gemini, Claude and Perplexity the questions your clients ask, shows you which firms get named, and does the work to get your firm in the answer. Nothing goes live without your approval.

See what AI says about your firm, free: alphaa.app/start"""),
    # ---- Retargeting ------------------------------------------------------------------
    dict(id="r01", group="Retarget: guarantee (checkers, no purchase)", creative="c13-guarantee", campaign="retargeting", cta="Subscribe",
         headline="Our 90-day AI visibility guarantee", description="$99/mo. Month to month.",
         short=f"{GUARANTEE}. Terms apply. Your AI agent starts this week.",
         long=f"""You've seen what AI says about your business. Here's the deal if you want it fixed.

Your AI agent checks ChatGPT, Gemini, Claude and Perplexity every week, writes the pages AI quotes, fixes the facts it gets wrong, and asks you to tap approve.

{GUARANTEE}. Terms apply.

$99/month. Month to month. Full refund within 7 days of your first charge.

Start at alphaa.app/start"""),
    dict(id="r02", group="Retarget: agent at work (checkers)", creative="c14-agent-approve", campaign="retargeting", cta="Subscribe",
         headline="Your AI agent does the work", description="You just tap approve",
         short="Your agent checks the AIs, does the fix and asks you first. You read one short email a week.",
         long="""What a week with your AI agent looks like (example):

Asked ChatGPT, Gemini, Claude and Perplexity about you.
Fixed your hours on Google.
Drafted 2 answers to questions customers ask.
One new Google post waiting: Post it / Edit / Skip.

No dashboards to learn. Everything it publishes can be undone.

$99/month, month to month, 7-day refund. {g}. Terms apply.

alphaa.app/start""".replace("{g}", GUARANTEE)),
    dict(id="r03", group="Retarget: agency vs agent (money gap, retargeting only)", creative="c15-agency-vs-agent", campaign="retargeting", cta="Learn More",
         headline="Get recommended by AI, no retainer", description="Month to month. 7-day refund.",
         short="Agencies optimize for 10 blue links. Your customers are asking AI. Get an agent that works on the answer.",
         long="""Most SEO agencies still optimize for a page of links. Your customers are asking ChatGPT.

A typical agency: about $2,000/month, a monthly PDF, a long contract.

Alphaa AI Agent: $99/month. Weekly checks on ChatGPT, Gemini, Claude and Perplexity, 2 Google posts a week, 2 AI-ready blog posts a month, review monitoring. You tap approve.

Month to month. Cancel in two clicks. 7-day refund.

Run it next to your agency for a month and compare: alphaa.app/start"""),
    dict(id="r04", group="Retarget: started check, didn't finish", creative="c10-four-ais", campaign="retargeting", cta="Learn More",
         headline="Your AI check takes 60 seconds", description="See all four answers",
         short="You were one step from seeing what ChatGPT, Gemini, Claude and Perplexity say about your business.",
         long="""Your check is about 60 seconds from done.

Enter your website and we ask ChatGPT, Gemini, Claude and Perplexity the questions your customers ask, live. You see each real answer and who they named instead.

No card. We email you the full report.

Finish your check: alphaa.app/start"""),
    dict(id="r05", group="Retarget: site visitors, no check", creative="c01-phone-demo", campaign="retargeting", cta="Learn More",
         headline="Still wondering what ChatGPT says?", description="Find out in 60 seconds",
         short="Ask ChatGPT about your business and you get one answer. See it, plus Gemini, Claude and Perplexity, free.",
         long="""Still wondering what ChatGPT says when customers ask about businesses like yours?

The free check shows you the real answers from ChatGPT, Gemini, Claude and Perplexity in about 60 seconds, plus who they named instead of you.

alphaa.app/start"""),
    dict(id="r06", group="Retarget: fix preview (checkers)", creative="c11-agent-diary", campaign="retargeting", cta="Subscribe",
         headline="Your fix is ready to approve", description="Tap approve. Undo anytime.",
         short="Your AI agent can start on the fixes from your check this week. You approve every change first.",
         long="""Your check showed what AI says about you. The fix is the part that matters.

Your AI agent writes the answers AI quotes, corrects facts like hours and services, and keeps your Google profile active. Every public change waits for your tap: Post it / Edit / Skip. Undo anytime.

$99/month. Month to month. 7-day refund. {g}. Terms apply.

alphaa.app/start""".replace("{g}", GUARANTEE)),
]

# ---------------------------------------------------------------- GOOGLE --------
G_LIMITS = {"headline": 30, "description": 90, "sitelink": 25, "sl_desc": 35, "callout": 25, "path": 15}

COMMON_H = [
    "Free AI Check in 60 Seconds",
    "ChatGPT, Gemini and Claude",
    "Plus Perplexity, Every Week",
    "Your AI Agent Does the Work",
    "You Just Tap Approve",
    "Fixes What AI Gets Wrong",
    "Weekly Plain-English Email",
]
OFFER_H = ["$99/mo. Month to Month", "90-Day AI Guarantee", "7-Day Refund. No Contract"]

G_DESC_COMMON = [
    "Alphaa AI Agent writes the pages AI quotes and fixes the facts it reads. You tap approve.",
    f"$99/mo. {GUARANTEE}. Terms apply.",
]


GOOGLE = [
    dict(campaign="1. Brand", budget=2, groups=[
        dict(name="Brand", url=START, paths=("ai", "check"),
             kw_exact=["alphaa", "alphaa app", "alphaa ai", "alphaa ai agent", "alphaa.app"],
             kw_phrase=["alphaa reviews", "alphaa pricing"],
             headlines=["Alphaa AI Agent", "Official Site: alphaa.app", "Ask Your AI Agent", "Get Recommended by AI",
                        "See What ChatGPT Says", *COMMON_H, *OFFER_H],
             descriptions=["The AI agent that gets you recommended by ChatGPT, Gemini, Claude and Perplexity.",
                           "Run the free check: see the real answers 4 AIs give about you in about 60 seconds.",
                           *G_DESC_COMMON]),
    ]),
    dict(campaign="2. AI visibility intent", budget=10, groups=[
        dict(name="Show up on ChatGPT", url=START, paths=("chatgpt", "check"),
             kw_exact=["how to show up on chatgpt", "get my business on chatgpt", "how to get recommended by chatgpt",
                       "get business listed on chatgpt", "how to rank on chatgpt", "chatgpt local business visibility"],
             kw_phrase=["show up on chatgpt", "get found on chatgpt", "appear in chatgpt", "get recommended by chatgpt",
                        "chatgpt recommend my business", "business on chatgpt", "rank in chatgpt answers"],
             headlines=["Show Up on ChatGPT", "Is ChatGPT Naming You?", "See What ChatGPT Says",
                        "Customers Ask AI Who to Hire", "Get Named in AI Answers", *COMMON_H, *OFFER_H, ],
             descriptions=["Customers ask ChatGPT who to hire. See if it names you, plus who it names instead.",
                           "Free check: real answers from ChatGPT, Gemini, Claude and Perplexity in 60 seconds.",
                           *G_DESC_COMMON]),
        dict(name="Get recommended by AI", url=START, paths=("ai", "recommend"),
             kw_exact=["get recommended by ai", "ai search visibility", "how to appear in ai search results",
                       "how to show up in ai answers", "get my business in ai search"],
             kw_phrase=["recommended by ai", "ai search visibility", "show up in ai search", "appear in ai answers",
                        "get found on perplexity", "show up on gemini", "ai recommendations for my business"],
             headlines=["Get Recommended by AI", "Does AI Name Your Business?", "See What 4 AIs Say About You",
                        "Customers Ask AI Who to Hire", "Be in the Answer", *COMMON_H, *OFFER_H],
             descriptions=["When customers ask AI who to call, it names a few businesses. See if you're one.",
                           "We ask ChatGPT, Gemini, Claude and Perplexity every week and show what changed.",
                           *G_DESC_COMMON]),
        dict(name="AI SEO / GEO / AEO", url=START, paths=("ai-seo", "check"),
             kw_exact=["ai seo", "generative engine optimization", "answer engine optimization", "geo seo",
                       "aeo for local business", "llm seo"],
             kw_phrase=["ai seo for small business", "ai seo service", "generative engine optimization service",
                        "answer engine optimization", "ai search optimization", "geo for local business"],
             headlines=["AI SEO Done by an AI Agent", "Get Recommended by AI", "See What ChatGPT Says",
                        "Not a Dashboard. An Agent.", "Built for Local Businesses", *COMMON_H, *OFFER_H],
             descriptions=["An agent, not a dashboard: it checks what AI says, does the fix, and asks you first.",
                           "Weekly checks on ChatGPT, Gemini, Claude and Perplexity, in plain English.",
                           *G_DESC_COMMON]),
    ]),
    dict(campaign="3. AI for [trade]", budget=10, groups=[]),  # filled below
    dict(campaign="4. SEO agency alternative (lower priority)", budget=4, groups=[
        dict(name="Agency alternative", url="https://alphaa.app/compare/alphaa-vs-seo-agency", paths=("compare", "agency"),
             kw_exact=["seo agency alternative", "alternative to seo agency", "seo without an agency"],
             kw_phrase=["seo agency alternative", "seo agency not working", "is my seo agency worth it",
                        "affordable seo for small business", "cancel seo contract", "seo agency too expensive"],
             headlines=["Your Customers Ask AI Now", "Get Recommended by AI", "See What ChatGPT Says",
                        "Agent Works on the AI Answer", "Weekly Proof, Plain English", *COMMON_H, *OFFER_H],
             descriptions=["Agencies optimize for 10 blue links. Customers ask ChatGPT. Get in the answer.",
                           "Weekly AI checks, 2 Google posts a week and 2 AI-ready blog posts a month. You approve.",
                           *G_DESC_COMMON]),
    ]),
]

TRADES = [
    # slug, group name, noun (their place), customer, h-callout, keywords exact, keywords phrase
    ("dentists", "Dentists", "Practice", "Patients",
     ["ai seo for dentists", "chatgpt for dentists marketing", "dental ai search", "how to get more dental patients from ai"],
     ["ai seo for dentists", "dental practice chatgpt", "dentist ai search", "seo for dentists", "dental seo", "dental marketing ai"]),
    ("med-spas", "Med Spas", "Spa", "Clients",
     ["ai seo for med spa", "med spa chatgpt", "med spa ai marketing"],
     ["med spa seo", "ai marketing for med spa", "med spa chatgpt", "aesthetics clinic seo", "med spa marketing ai"]),
    ("hvac", "HVAC", "Company", "Homeowners",
     ["ai seo for hvac", "hvac chatgpt", "hvac ai marketing"],
     ["hvac seo", "ai seo for hvac", "hvac marketing ai", "get more hvac calls", "hvac company chatgpt"]),
    ("plumbers", "Plumbers", "Company", "Homeowners",
     ["ai seo for plumbers", "plumber chatgpt", "plumbing ai marketing"],
     ["seo for plumbers", "plumbing seo", "ai marketing for plumbers", "plumber chatgpt", "get more plumbing calls"]),
    ("lawyers", "Law Firms", "Firm", "Clients",
     ["ai seo for law firms", "law firm chatgpt", "ai search for lawyers"],
     ["law firm seo", "seo for lawyers", "ai marketing for law firms", "law firm chatgpt", "personal injury law firm seo"]),
]
for slug, label, place, cust, kx, kp in TRADES:
    GOOGLE[2]["groups"].append(dict(
        name=f"AI for {label}", url=f"https://alphaa.app/for/{slug}", paths=("for", slug),
        kw_exact=kx, kw_phrase=kp,
        headlines=[f"AI Search for {label}", f"{cust} Ask ChatGPT Now", f"Does AI Name Your {place}?",
                   "See What ChatGPT Says", "Get Recommended by AI", *COMMON_H, *OFFER_H],
        descriptions=[f"{cust} ask ChatGPT who to call. See if it names your {place.lower()}, free in 60 seconds.",
                      "We check ChatGPT, Gemini, Claude and Perplexity weekly and fix what keeps you out.",
                      *G_DESC_COMMON]))

NEGATIVES = """jobs, job, career, careers, salary, hiring, internship, course, courses, certification, training,
tutorial, learn, degree, university, school, free tool, free software, open source, api, github, plugin download,
login, sign in, chatgpt login, chatgpt app download, chatgpt plus, openai stock, chatgpt prompts, prompt,
prompts, write, essay, homework, white label, reseller, affiliate, become an seo, meaning, definition, what is,
pdf, template, examples, reddit, youtube, crack, jailbreak, ai detector, humanizer""".replace("\n", " ")
NEG_TRADE = {"dentists": "dental school, dental assistant, dds, dental hygienist jobs",
             "med-spas": "esthetician school, botox training, med spa jobs",
             "hvac": "hvac certification, hvac school, hvac license, epa 608",
             "plumbers": "plumbing license, plumber apprenticeship, plumbing school",
             "lawyers": "law school, lsat, paralegal, bar exam, free legal advice"}

SITELINKS = [
    ("Free AI Check", "See what 4 AIs say about you", "Real answers in about 60 seconds", "https://alphaa.app/start"),
    ("How It Works", "Your agent checks, fixes, asks", "You tap approve. Undo anytime", "https://alphaa.app/how-it-works"),
    ("Pricing", "$99/mo Starter, month to month", "7-day refund on first charge", "https://alphaa.app/pricing"),
    ("90-Day Guarantee", "No AI names you in 90 days?", "Your next month is free", "https://alphaa.app/pricing"),
    ("For Dentists", "Patients ask AI before booking", "See what it says about you", "https://alphaa.app/for/dentists"),
    ("For HVAC", "Homeowners ask AI who to call", "Are you in the answer?", "https://alphaa.app/for/hvac"),
]
CALLOUTS = ["Checks 4 AIs Every Week", "You Tap Approve", "Month to Month", "7-Day Refund",
            "90-Day AI Guarantee", "Short Weekly Email", "Undo Anytime", "WordPress Plugin"]
SNIPPET = ("Services", ["AI Visibility Checks", "AI-Ready Pages", "Google Posts", "Fact Fixes", "Review Monitoring"])

# ---------------------------------------------------------------- RULES ---------
BANNED = [(r"—", "em-dash"), (r"#1", "#1"), (r"\bbest\b(?!\s*\[)", "best"), (r"\bleading\b", "leading"),
          (r"free trial", "free trial"), (r"no sign ?up", "no signup"), (r"copilot", "Copilot"),
          (r"ai overviews?", "AI Overviews"), (r"guaranteed? (#|rank|top)", "promised ranking"),
          (r"\b14-day\b", "14-day"), (r"are you an? ", "personal-attribute question")]


def check_text(where, text, errs, allow_best=False):
    for pat, label in BANNED:
        if label == "best" and allow_best:
            continue
        if re.search(pat, text, flags=re.I):
            errs.append(f"{where}: banned '{label}' in: {text[:80]}")


def utm(campaign, content):
    return START + "?" + urlencode(dict(utm_source="facebook", utm_medium="paid_social",
                                         utm_campaign=campaign, utm_content=content))


def main():
    errs, rows = [], []
    # META checks
    for a in META:
        for k in ("headline", "description", "short"):
            n = len(a[k])
            ok = n <= META_LIMITS[k]
            rows.append(("meta", a["id"], k, n, META_LIMITS[k], ok))
            if not ok:
                errs.append(f"meta {a['id']} {k} {n}>{META_LIMITS[k]}: {a[k]}")
        # self-test quotes "best [your trade]", which is the customer's own words, not a claim about us
        for k in ("headline", "description", "short", "long"):
            check_text(f"meta {a['id']} {k}", a[k], errs, allow_best=a["id"] in ("p04",))
        if GUARANTEE.lower() not in a["long"].lower() and "guarantee" in a["long"].lower():
            errs.append(f"meta {a['id']}: guarantee mentioned without exact wording")
        # hooks must not lead with price
        if re.search(r"\$|agency|fee", a["short"].split(".")[0], flags=re.I) and a["campaign"] == "prospecting":
            errs.append(f"meta {a['id']}: prospecting hook leads with price/agency")
    # GOOGLE checks
    for c in GOOGLE:
        for g in c["groups"]:
            hs, ds = g["headlines"], g["descriptions"]
            if len(hs) != 15:
                errs.append(f"google {g['name']}: {len(hs)} headlines (need 15)")
            if len(set(hs)) != len(hs):
                errs.append(f"google {g['name']}: duplicate headlines")
            if len(ds) != 4:
                errs.append(f"google {g['name']}: {len(ds)} descriptions (need 4)")
            for h in hs:
                ok = len(h) <= 30
                rows.append(("google", g["name"], "headline", len(h), 30, ok))
                if not ok:
                    errs.append(f"google {g['name']} headline {len(h)}>30: {h}")
                check_text(f"google {g['name']}", h, errs)
            for d in ds:
                ok = len(d) <= 90
                rows.append(("google", g["name"], "description", len(d), 90, ok))
                if not ok:
                    errs.append(f"google {g['name']} description {len(d)}>90: {d}")
                check_text(f"google {g['name']}", d, errs)
            for p in g["paths"]:
                if len(p) > 15:
                    errs.append(f"google {g['name']} path '{p}' >15")
    for t, d1, d2, _ in SITELINKS:
        for s, lim in ((t, 25), (d1, 35), (d2, 35)):
            ok = len(s) <= lim
            rows.append(("google", "sitelink", s, len(s), lim, ok))
            if not ok:
                errs.append(f"sitelink '{s}' {len(s)}>{lim}")
    for c in CALLOUTS + SNIPPET[1]:
        ok = len(c) <= 25
        rows.append(("google", "callout/snippet", c, len(c), 25, ok))
        if not ok:
            errs.append(f"callout '{c}' {len(c)}>25")

    if errs:
        print("FAIL")
        print("\n".join(errs))
        sys.exit(1)

    write_meta()
    write_google()
    n_meta = sum(1 for r in rows if r[0] == "meta")
    n_g = sum(1 for r in rows if r[0] == "google")
    mx = {}
    for r in rows:
        key = (r[0], r[2] if r[0] == "meta" or r[2] in ("headline", "description") else "ext")
        mx[key] = max(mx.get(key, 0), r[3])
    print(f"OK: {n_meta} Meta fields and {n_g} Google fields within limits; 0 rule violations.")
    print("Longest per field:", {f"{k[0]}:{k[1]}": v for k, v in mx.items()})
    print(f"Meta ads: {len(META)} ({sum(a['campaign']=='prospecting' for a in META)} prospecting, "
          f"{sum(a['campaign']=='retargeting' for a in META)} retargeting)")
    print(f"Google ad groups: {sum(len(c['groups']) for c in GOOGLE)}, headlines: "
          f"{sum(len(g['headlines']) for c in GOOGLE for g in c['groups'])}")


# ---------------------------------------------------------------- WRITERS -------
def write_meta():
    L = []
    w = L.append
    w("# Meta Ads: copy, creatives and testing plan")
    w("")
    w("> Generated by `marketing/ads/build_ads_copy.py` (edit copy there, then re-run; it re-checks every limit and rule). "
      "Supersedes the ad copy and creative spec in `marketing/meta-ads.md` (orange palette, 14-day trial, 'no signup', six-engine claims are all retired). "
      "Source of truth: `growth-playbook.html` (Paid ads) and `social-copy-brief.md`.")
    w("")
    w("## Rules every ad follows")
    w("")
    w("- **Lead with getting customers from AI.** The hook is always: customers ask ChatGPT/Gemini/Claude/Perplexity who to hire, and it isn't naming you. "
      "Price, agency comparison and the guarantee live in body copy, the offer line, or retargeting. The \"money gap\" creative (c15) is **retargeting only**.")
    w("- Image headline 4 to 5 words, self-contained, names AI/ChatGPT. Black and white only.")
    w("- No em-dashes, no \"#1/best/leading\", no promised rankings or timelines, no invented stats/customers. Every chat answer on a creative carries an **Example** tag and blurred business names.")
    w("- Four AIs only: ChatGPT, Gemini, Claude, Perplexity. Never \"free trial\" or \"no signup\".")
    w(f"- Guarantee wording, exactly: \"{GUARANTEE}\" + \"Terms apply.\" 7-day refund. Month to month.")
    w("- Meta policy: industry callouts are written as \"Dentists:\" / \"For dental practices\", never \"Are you a dentist?\". No before/after or guaranteed-result claims.")
    w("")
    w("## Account setup (for the founder; nothing here has been changed in any ad account)")
    w("")
    w("| Item | Setting |")
    w("|---|---|")
    w("| Prospecting | ~$700/mo (~$23/day). One campaign, one broad ad set: US + Canada, age 30 to 65, Advantage+ audience, no interest stacks (creative is the targeting). Advantage+ placements, exclude Audience Network. |")
    w("| Retargeting | ~$300/mo (~$10/day). Separate campaign, audiences below. Frequency cap watch: if 7-day frequency > 4, add creative or trim budget. |")
    w("| Optimization event | `Lead`. In code it fires on `/start` when the visitor enters their email to get the report (`StartAgent.tsx`, same moment as GA4 `scan_completed`) and on submit of the legacy `/scan` form (the `/for/` pages use that one). |")
    w("| Other pixel events in code | `ViewContent` (scan results), `InitiateCheckout` (Start today, value 99), `StartTrial` (dashboard `?upgraded=true`, i.e. paid). Use `StartTrial` as the purchase signal for check-to-paid reporting. |")
    w("| Destination | Every ad goes to `https://alphaa.app/start` with UTMs: `utm_source=facebook&utm_medium=paid_social&utm_campaign=prospecting (or retargeting)&utm_content={ad id}_{concept}`. |")
    w("")
    w("**Retargeting audiences**")
    w("")
    w("| Audience | Definition | Ads |")
    w("|---|---|---|")
    w("| Started, didn't finish | URL visitors to `/start` (30d) EXCLUDING `Lead` (30d). There is no Meta \"check started\" event yet (GA4 `scan_started` only), so use the URL rule. | r04 |")
    w("| Checkers who didn't buy | `Lead` (30d) EXCLUDING `StartTrial` (180d) | r01, r02, r03, r06 |")
    w("| Site visitors, no check | All visitors (30d) EXCLUDING `/start` visitors and `Lead` | r05 |")
    w("| Exclude everywhere | `StartTrial` (180d) | all |")
    w("")
    w("## Creative files")
    w("")
    w("All in `brand/ads/` (HTML source in `brand/ads/src/`, rebuild with `brand/ads/src/render.sh`). Use `-sq` (1080x1080) for Feed, `-st` (1080x1920) for Stories/Reels (text kept out of the top 250px and bottom 340px), `-ls` (1200x628) for link/right-column placements where available.")
    w("")
    w("## Ads")
    w("")
    groups = {}
    for a in META:
        groups.setdefault("Prospecting" if a["campaign"] == "prospecting" else "Retargeting", []).append(a)
    for gname, ads in groups.items():
        w(f"### {gname} ({len(ads)} ads)")
        w("")
        for a in ads:
            c = a["creative"]
            ls = f", `{c}-ls.png`" if c.split("-")[0] in ("c01", "c02", "c03", "c10") else ""
            content = f"{a['id']}_{c.split('-', 1)[1].replace('-', '_')}"
            w(f"#### {a['id'].upper()} · {a['group']}")
            w("")
            w(f"- **Creative:** `brand/ads/{c}-sq.png`, `{c}-st.png`{ls}")
            w(f"- **Headline** ({len(a['headline'])}/40): {a['headline']}")
            w(f"- **Description** ({len(a['description'])}/30): {a['description']}")
            w(f"- **CTA button:** {a['cta']}")
            w(f"- **URL:** `{utm(a['campaign'], content)}`")
            w(f"- **Primary text, short** ({len(a['short'])}/125):")
            w("")
            w(f"  > {a['short']}")
            w("")
            w("- **Primary text, long:**")
            w("")
            for line in a["long"].split("\n"):
                w(f"  > {line}" if line else "  >")
            w("")
    w("## Testing plan")
    w("")
    w("**What we measure:** cost per completed check (`Lead`) and check-to-paid within 14 days (`StartTrial`). Not CPC, not likes. CAC target is $300 or less.")
    w("")
    w("**Launch (week 1):** prospecting runs P01, P02, P03, P04, P08 (one ad per concept, both `-sq` and `-st` assets in the same ad so Meta places them). Retargeting runs R01, R02, R04, R05.")
    w("")
    w("**Every week after:** ship 3 to 5 new creatives into prospecting. Rotate in P05, P06, P07 and the remaining callouts (P09 to P12) first, then new hooks from the best organic posts of the week (\"Are you in the answer?\" episodes, agent diary, 60-second fix). R03 and R06 join retargeting in week 2.")
    w("")
    w("**Kill rule (from the playbook):** after about **$30 spend**, a creative with a weak thumb-stop rate is off.")
    w("")
    w("| Signal | Video / Reels | Static image | Action |")
    w("|---|---|---|---|")
    w("| Thumb-stop | 3-second views / impressions below ~25% | Link CTR below ~0.8% | Off at ~$30 spend |")
    w("| Cost per check | More than 2x the account average after ~$60 | same | Off |")
    w("| Winner | Cost per check at or below average with 3+ checks | same | Keep; duplicate the hook into a new format (static to video, square to story) |")
    w("")
    w("Starting thresholds are guesses; reset them from your own week 1 to 2 baseline. Fix the first line or the image headline before touching audiences. Move budget to the 2 to 3 winners from day 31 and keep shipping 3 new a week.")
    w("")
    w("**Later:** UGC-style ads only once real customers send a real clip of \"ChatGPT named us\". Never fake it. Founder video (see `video-ad-scripts.md`) goes in as soon as it's recorded; founder ads tend to earn trust on cold traffic.")
    (OUT / "meta-ads-copy.md").write_text("\n".join(L) + "\n")


def write_google():
    L = []
    w = L.append
    w("# Google Ads: search campaigns, keywords and RSA copy")
    w("")
    w("> Generated by `marketing/ads/build_ads_copy.py` (edit there, re-run to re-check every limit). Supersedes the copy in `marketing/google-ads.md` "
      "(that file's 14-day trial, \"no signup\", \"6 AI engines\", \"Google AI\" and \"Fire your SEO agency\" lines are retired). Its conversion and launch checklist mostly still apply; differences are noted below.")
    w("")
    w("## Setup (founder action; no ad account was touched)")
    w("")
    w("- Budget ~$800/mo (~$26/day). Search network only (no Display, no Search Partners). Geo US + Canada, \"Presence\". English.")
    w("- Bidding: Maximize Clicks with an $8 max CPC cap until ~30 conversions, then Maximize Conversions.")
    w("- Primary conversion: GA4 `scan_completed` (fires on `/start` when the email is entered). Secondary: `trial_start` (paid). Import both from GA4.")
    w("- Tracking template (account level): `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={_campaign}&utm_content={adgroupid}&utm_term={keyword}` with a `{_campaign}` custom parameter per campaign.")
    w("- Match types: exact and phrase only. No broad at launch. Auto-apply recommendations OFF.")
    w("- **Trademark note:** \"ChatGPT\", \"Gemini\", \"Claude\" and \"Perplexity\" in ad text are descriptive, but if a trademark owner restricts use, Google will disapprove those assets. Each group has enough non-trademark headlines (\"Get Recommended by AI\", \"Customers Ask AI Who to Hire\") to keep serving; check the asset report in week 1.")
    w("")
    w("| Campaign | $/day | Landing page |")
    w("|---|---|---|")
    for c in GOOGLE:
        urls = sorted({g["url"] for g in c["groups"]})
        lp = "`/for/[vertical]` (matching page)" if len(urls) > 2 else ", ".join(f"`{u.replace('https://alphaa.app', '') or '/'}`" for u in urls)
        w(f"| {c['campaign']} | ${c['budget']} | {lp} |")
    w("")
    w("Live `/for/` pages (from `src/content/verticals.ts`): dentists, med-spas, hvac, plumbers, lawyers, restaurants, saas. Restaurants and SaaS are not in this launch. The `/for/` pages run the older scan flow; if they convert worse than `/start` after 2 weeks, point the trade groups to `/start` instead.")
    w("")
    for c in GOOGLE:
        w(f"## {c['campaign']} (${c['budget']}/day)")
        w("")
        for g in c["groups"]:
            w(f"### Ad group: {g['name']}")
            w("")
            w(f"- **Final URL:** `{g['url']}`  ·  **Display path:** alphaa.app/{g['paths'][0]}/{g['paths'][1]}")
            w(f"- **Exact:** " + ", ".join(f"`[{k}]`" for k in g["kw_exact"]))
            w(f"- **Phrase:** " + ", ".join(f'`"{k}"`' for k in g["kw_phrase"]))
            slug = g["url"].rsplit("/", 1)[-1]
            if slug in NEG_TRADE:
                w(f"- **Ad-group negatives:** {NEG_TRADE[slug]}")
            w("")
            w("| # | Headline (15) | Chars |")
            w("|---|---|---|")
            for i, h in enumerate(g["headlines"], 1):
                pin = " (pin 1)" if i == 1 else (" (pin 2)" if i == 2 else "")
                w(f"| {i} | {h}{pin} | {len(h)}/30 |")
            w("")
            w("| # | Description (4) | Chars |")
            w("|---|---|---|")
            for i, d in enumerate(g["descriptions"], 1):
                w(f"| {i} | {d} | {len(d)}/90 |")
            w("")
    w("Pinning: pin headline 1 to position 1 and headline 2 to position 2 so every ad opens on the AI hook, never on price. Leave the rest unpinned.")
    w("")
    w("## Shared negative keyword list (attach to every campaign)")
    w("")
    w(NEGATIVES.strip())
    w("")
    w("Add `alphaa` as a negative on campaigns 2 to 4 so brand searches stay in the Brand campaign.")
    w("")
    w("## Sitelinks (account level)")
    w("")
    w("| Text (≤25) | Line 1 (≤35) | Line 2 (≤35) | URL |")
    w("|---|---|---|---|")
    for t, d1, d2, u in SITELINKS:
        w(f"| {t} ({len(t)}) | {d1} ({len(d1)}) | {d2} ({len(d2)}) | `{u}` |")
    w("")
    w("In the trade campaign, swap the last two sitelinks for the matching `/for/` page of each ad group.")
    w("")
    w("## Callouts (≤25)")
    w("")
    w(", ".join(f"{c} ({len(c)})" for c in CALLOUTS))
    w("")
    w(f"Note: \"WordPress Plugin\" is live; do not add Webflow or Shopify until those apps are approved.")
    w("")
    w(f"## Structured snippet")
    w("")
    w(f"Header **{SNIPPET[0]}**: " + ", ".join(f"{v} ({len(v)})" for v in SNIPPET[1]))
    w("")
    w("## Weekly review")
    w("")
    w("- Search terms report every Monday: add irrelevant terms to the shared negatives (expect lots of ChatGPT how-to and prompt traffic in the AI-intent groups).")
    w("- Judge groups on cost per `scan_completed` and check-to-paid, not CTR. Pause any group above 2x the account cost per check after ~$100 spend.")
    w("- The agency-alternative group stays at the lowest budget; its ads still lead with the AI hook (pinned) so we never sell as a cheaper SEO agency.")
    (OUT / "google-ads-copy.md").write_text("\n".join(L) + "\n")


if __name__ == "__main__":
    main()
