#!/usr/bin/env python3
"""Build the Alphaa social post images (black & white system).

Writes HTML to brand/social/posts/src/<id>.html and renders PNGs to
brand/social/posts/<id>.png (1080x1350) and <id>-x.png (1600x900 for X).
Carousel slides render to <id>-s<N>.png.

Usage:  python3 brand/social/posts/build.py            # build everything
        python3 brand/social/posts/build.py w1_chat     # only ids containing "w1_chat"
"""
import os, sys, subprocess, tempfile, time, signal, shutil, html as H
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")
ICON = "file:///Users/varunsharma/alphaa/brand/mono/alphaa-mono-icon-256.png"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
AIS = ["ChatGPT", "Gemini", "Claude", "Perplexity"]

e = H.escape


# ---------- visual components ----------
def chat(engine, question, intro, names, miss, sources=False):
    lis = "".join(f"<li>{e(n)}</li>" for n in names)
    src = "<span class=src>Sources: 6 websites, 2 directories, 1 forum</span>" if sources else ""
    return (f"<div class=phone><div class=ph-top><b>{e(engine)}</b><span>Example</span></div>"
            f"<div class='b user'>{e(question)}</div>"
            f"<div class='b ai'>{e(intro)}<ol>{lis}</ol>{src}</div>"
            f"<div class=miss>{miss}</div></div>")


def chat_why(engine, question, answer_lines):
    a = "".join(f"<p style='margin-top:10px'>{e(l)}</p>" for l in answer_lines)
    return (f"<div class=phone><div class=ph-top><b>{e(engine)}</b><span>Example</span></div>"
            f"<div class='b user'>{e(question)}</div>"
            f"<div class='b ai'>{a}</div></div>")


def score(question, verdicts):
    rows = ""
    for ai, v in zip(AIS, verdicts):
        cls, lab = {"y": ("ok", "Named you"), "n": ("no", "Didn't name you"),
                    "?": ("unk", "Result in post")}[v]
        rows += f"<div class=row>{ai}<span class='pill {cls}'>{lab}</span></div>"
    return f"<div class=card><div class=q>{e(question)}</div>{rows}</div>"


def steps(items, outline=False):
    o = " o" if outline else ""
    out = ""
    for i, it in enumerate(items, 1):
        t, d = it if isinstance(it, tuple) else (it, "")
        dd = f"<div class=d>{e(d)}</div>" if d else ""
        out += f"<div class=st><div class='n{o}'>{i}</div><div><div class=t>{e(t)}</div>{dd}</div></div>"
    return f"<div class=steps>{out}</div>"


def agent(paras, time="8:02 AM", buttons=("Post it", "Edit", "Skip")):
    ps = "".join(f"<p>{p}</p>" for p in paras)
    bs = "".join(f"<span class={'ok' if i == 0 else ''}>{e(b)}</span>" for i, b in enumerate(buttons))
    btn = f"<div class=btns>{bs}</div>" if buttons else ""
    return (f"<div class=agent><div class=ag-h><img src='{ICON}'><b>Alphaa</b> · your AI Agent · {e(time)}</div>"
            f"<div class=ag-b>{ps}</div>{btn}</div>")


def fact(rows):
    out = ""
    for lab, val, kind in rows:
        out += (f"<div class='fr {'w' if kind == 'w' else ''}'><div class=lab>{e(lab)}</div>"
                f"<div class='val {'s' if kind == 's' else ''}'>{e(val)}</div></div>")
    return f"<div class=fact>{out}</div>"


def split():
    lines = "".join("<div class=ln></div>" for _ in range(10))
    return ("<div class=split><div class=old><h3 style='color:#9a9a9a'>Google</h3>" + lines +
            "</div><div class=new><h3>ChatGPT</h3><div class=ans>One answer.<b>Business A</b><b>Business B</b>"
            "<b>Business C</b></div><div style='margin-top:auto;font-size:24px;color:#555'>Everyone else: not mentioned</div></div></div>")


def versus(lt, litems, rt, ritems):
    l = "".join(f"<li>{e(i)}</li>" for i in litems)
    r = "".join(f"<li>{e(i)}</li>" for i in ritems)
    return (f"<div class=cols><div class='col old'><h3>{e(lt)}</h3><ul>{l}</ul></div>"
            f"<div class='col new'><h3>{e(rt)}</h3><ul>{r}</ul></div></div>")


def quote(text, by="Varun Sharma, founder of Alphaa"):
    return f"<div class=quote>{e(text)}<span class=by>{e(by)}</span></div>"


def grid(rows):
    """Question-by-AI grid, as in the scan report. rows: [(question, "yyn?")]."""
    head = "<div class=gr-h><span></span>" + "".join(f"<span>{a}</span>" for a in AIS) + "</div>"
    body = ""
    for q, marks in rows:
        cells = "".join({"y": "<span class='c y'>Named</span>", "n": "<span class='c n'>Not named</span>",
                         "?": "<span class='c u'>?</span>"}[m] for m in marks)
        body += f"<div class=gr-r><span class=gq>{e(q)}</span>{cells}</div>"
    return f"<div class=grid>{head}{body}</div>"


def browser(title, sub, url="alphaa.app/start"):
    chips = "".join(f"<span>{a}</span>" for a in AIS)
    return (f"<div class=browser><div class=br-top><i></i><i></i><i></i><span class=url>{e(url)}</span></div>"
            f"<div class=br-body><div style='font-size:36px;font-weight:600'>{e(title)}</div>"
            f"<div style='font-size:26px;color:#9a9a9a;margin-top:8px'>{e(sub)}</div>"
            f"<div class=inp><span class=f>yourwebsite.com</span><span class=go>Check</span></div>"
            f"<div class=chips>{chips}</div></div></div>")


def factboxes(items):
    return "<div class=facts>" + "".join(f"<div><b>{e(a)}</b>{e(b)}</div>" for a, b in items) + "</div>"


# ---------- image specs ----------
# id: dict(tag, h1, sub, vis, example, lg)
IMAGES = {
    # ---- week 1 ----
    "w1_one_answer": dict(tag="SEO said / AI says", h1="ChatGPT gives one answer",
        sub="Google gives 10 links. AI gives a few names. Are you one of them?", vis=split()),
    "w1_chat_dentist": dict(tag="Are you in the answer?", h1="Is ChatGPT naming your practice?",
        vis=chat("ChatGPT", "Which dentist in Austin should I see?",
                 "Here are three practices people often recommend:", ["Practice A", "Practice B", "Practice C"],
                 "Your practice: <b>not mentioned</b>"), example=True),
    "w1_self_test": dict(tag="Try this today", h1="Ask ChatGPT who to hire",
        sub="Then check if it names you.",
        vis=steps([("Open ChatGPT", "Or Gemini, Claude, Perplexity."),
                   ("Ask like a customer", "\"Who should I call for [service] in [city]?\""),
                   ("Count the names", "Are you one of them?"),
                   ("Ask \"why them?\"", "The answer is your to-do list.")])),
    "w1_scorecard": dict(tag="Example check", h1="Will AI recommend your business?",
        vis=score("Asked: \"Who should I call for a plumber in Denver?\"", "nnyn"), example=True),
    "w1_agent_morning": dict(tag="Agent diary", h1="Your AI agent checked ChatGPT",
        vis=agent(["I asked ChatGPT, Gemini, Claude and Perplexity about you this morning.",
                   "<span class=g>Two named you. Two didn't. The two that didn't named businesses with a clear FAQ page.</span>",
                   "I drafted one for you."]), example=True),
    "w1_founder_why": dict(tag="Building Alphaa", h1="Your customers ask ChatGPT now",
        vis=quote("If you're not in the answer, you didn't lose a ranking. You just never came up.")),
    "w1_dogfood": dict(tag="Building Alphaa · Week 1", h1="Does ChatGPT recommend Alphaa yet?",
        vis=score("Asked: \"What's a good AI visibility tool for a small business?\"", "????")),
    "w1_offer_check": dict(tag="Free AI check", h1="See what ChatGPT says, free",
        vis=browser("What does AI say about you?", "Live answers from 4 AIs in about 60 seconds.")),
    # ---- week 2 ----
    "w2_fact_hours": dict(tag="Agent diary", h1="ChatGPT got your hours wrong",
        vis=fact([("ChatGPT told a customer", "Closes at 5 PM", "s"), ("Your real hours", "Closes at 8 PM", "w")]),
        sub="Example. Your agent found it and drafted the fix.", example=True),
    "w2_three_things": dict(tag="Save this", h1="3 things AI looks for",
        sub="Before ChatGPT recommends a local business.",
        vis=steps([("Clear answers", "What you do, where, for whom, what it costs."),
                   ("Consistent facts", "Same name, phone, hours on every site."),
                   ("Reviews it can verify", "Recent, detailed, on public sites.")])),
    "w2_plumbers": dict(tag="Plumbers", h1="Plumbers: does ChatGPT name you?",
        vis=chat("ChatGPT", "My water heater is leaking. Who can come today in Phoenix?",
                 "These plumbers offer same-day service:", ["Plumber A", "Plumber B", "Plumber C"],
                 "Your company: <b>not mentioned</b>"), example=True),
    "w2_hvac": dict(tag="HVAC", h1="Does Gemini recommend your HVAC?",
        vis=chat("Gemini", "AC stopped working. Who do people trust for repairs in Tampa?",
                 "A few companies with strong reviews:", ["HVAC company A", "HVAC company B", "HVAC company C"],
                 "Your company: <b>not mentioned</b>"), example=True),
    "w2_competitor": dict(tag="Why them?", h1="Why AI picked your competitor",
        vis=versus("You", ["Homepage only", "Old hours on Yelp", "Few recent reviews"],
                   "Who got named", ["A page per service", "Same facts everywhere", "Recent, detailed reviews"]),
        sub="Example of a typical gap."),
    "w2_agent_approve": dict(tag="How it works", h1="AI agent works. You approve.",
        vis=agent(["I wrote a short FAQ page answering the 5 questions people ask AI about plumbers in your area.",
                   "<span class=g>Nothing goes live until you say so. You can undo it anytime.</span>"], time="9:14 AM"),
        example=True),
    "w2_founder_honest": dict(tag="Building Alphaa", h1="Nobody can guarantee AI rankings",
        vis=quote("Anyone who promises you a spot in ChatGPT is guessing. We fix what AI reads, then show you what changed.")),
    "w2_offer_month": dict(tag="Alphaa AI Agent", h1="AI agent. No contract.",
        sub="Your agent checks 4 AIs every week and does the work to get you named.",
        vis=factboxes([("$99/mo", "Starter. 1 location."), ("2 clicks", "To cancel. Month to month."),
                       ("7 days", "Refund on your first charge.")])),
    # ---- week 3 ----
    "w3_seo_vs_ai": dict(tag="SEO said / AI says", h1="SEO ranks. AI recommends.",
        vis=versus("Ranking on Google", ["Keywords", "Backlinks", "Page 1 of 10 links"],
                   "Named by AI", ["Clear answers", "Consistent facts", "Reviews AI can verify"])),
    "w3_lawyer_chat": dict(tag="Lawyers", h1="Lawyers: does Claude recommend you?",
        vis=chat("Claude", "I was hurt in a car accident in Calgary. Which lawyer should I call?",
                 "Here are a few personal injury firms to consider:", ["Firm A", "Firm B", "Firm C"],
                 "Your firm: <b>not mentioned</b>"), example=True),
    "w3_myth_keywords": dict(tag="SEO said / AI says", h1="AI wants answers, not keywords",
        vis=versus("SEO said", ["Repeat the keyword", "Write 2,000 words", "Chase backlinks"],
                   "AI says", ["Answer the question", "Be specific and short", "Match facts everywhere"])),
    "w3_diary_week": dict(tag="Agent diary", h1="Inside an AI agent's week",
        vis=steps([("Mon", "Asked 4 AIs your customers' questions."),
                   ("Tue", "Flagged old hours on 2 listings."),
                   ("Wed", "Drafted 3 review replies."),
                   ("Thu", "Wrote an FAQ page. You approved it."),
                   ("Fri", "Sent your weekly briefing.")], outline=True), example=True),
    "w3_perplexity": dict(tag="Are you in the answer?", h1="Perplexity shows its sources. Yours?",
        vis=chat("Perplexity", "Good family dentist in Toronto taking new patients?",
                 "Based on reviews and local listings:", ["Clinic A", "Clinic B", "Clinic C"],
                 "Your website: <b>not one of the sources</b>", sources=True), example=True),
    "w3_founder_dashboard": dict(tag="Building Alphaa", h1="Owners don't want AI dashboards",
        vis=quote("So we deleted ours. Alphaa talks to you like a person: here's what AI said, here's my fix, tap approve.")),
    "w3_reviews": dict(tag="60-second fix", h1="Reviews AI can actually verify",
        vis=steps([("On public sites", "Google, Yelp, industry directories."),
                   ("Recent", "A steady trickle beats an old pile."),
                   ("Specific", "\"Fixed our furnace same day\" beats \"Great!\""),
                   ("Answered", "Reply to every review, good or bad.")])),
    "w3_offer_free": dict(tag="Free AI check", h1="Your free AI check",
        sub="Enter your website. See what ChatGPT, Gemini, Claude and Perplexity say about you.",
        vis=factboxes([("60 sec", "Live answers from 4 AIs."), ("Who got named", "Instead of you, and why."),
                       ("No card", "Just your website.")])),
    # ---- week 4 ----
    "w4_compare": dict(tag="60-second fix", h1="Ask ChatGPT: why them?",
        vis=chat_why("ChatGPT", "Why did you recommend those three med spas?",
                     ["They have clear pages for each treatment with prices.",
                      "Their details match across listings.",
                      "They have many recent, detailed reviews."]), example=True),
    "w4_medspa_chat": dict(tag="Med spas", h1="ChatGPT picked three med spas",
        vis=chat("ChatGPT", "Where should I get Botox in Scottsdale?",
                 "Three med spas people speak well of:", ["Med spa A", "Med spa B", "Med spa C"],
                 "Yours: <b>not mentioned</b>"), example=True),
    "w4_accountant": dict(tag="Accountants", h1="Accountants: will AI recommend you?",
        vis=score("Asked: \"Who can do my small business taxes in Vancouver?\"", "ynnn"), example=True),
    "w4_invisible": dict(tag="The invisible loss", h1="You can't see AI losses",
        vis=steps([("Customer asks ChatGPT", "\"Who should I call?\""),
                   ("Gets three names", "Yours isn't one."),
                   ("Calls one of them", "No click. No visit. Nothing in your analytics.")], outline=True)),
    "w4_guarantee": dict(tag="90-day guarantee", h1="Our 90-day AI visibility guarantee",
        sub="If none of the 4 AIs names you in any weekly check in your first 90 days, your next month is free.",
        vis=factboxes([("4 AIs", "Checked every week."), ("90 days", "Not named? Next month free."),
                       ("7 days", "Refund on your first charge.")])),
    "w4_agent_reviews": dict(tag="Agent diary", h1="Your AI agent answers reviews",
        vis=agent(["Two new Google reviews came in overnight. I drafted replies to both.",
                   "<span class=g>\"Thanks, Maria. Glad the same-day repair helped. See you at the spring tune-up.\"</span>"],
                  time="7:40 AM", buttons=("Post both", "Edit", "Skip")), example=True),
    "w4_founder_weeks": dict(tag="Building Alphaa", h1="Some weeks AI doesn't change",
        vis=quote("We'll show you those weeks too. An honest report beats a pretty one.")),
    # ---- week 5 (2026-11-02..08) ----
    "w5_niche_gap": dict(tag="Our own test", h1="ChatGPT named it. Then didn't.",
        sub="A niche agency: named by all 4 AIs for its niche. Not once for the broad question.",
        vis=grid([("Its exact niche question", "yyyy"),
                  ("\"How do I find and market to accredited investors?\"", "nnnn")]),
        note="Real check · name withheld"),
    "w5_word_for_word": dict(tag="Free AI check", h1="ChatGPT's answer, word for word",
        vis=browser("What does AI say about you?", "Real answers from 4 AIs, word for word, in about 60 seconds.",
                    url="alphaa.app")),
    "w5_broad_question": dict(tag="Try this today", h1="Ask ChatGPT the broad question",
        vis=steps([("Your exact question", "\"Who does Invisalign in Plano?\""),
                   ("Your wider category", "\"Good family dentist in Plano?\""),
                   ("The problem, in buyers' words", "\"Why does my jaw click when I chew?\""),
                   ("Compare the names", "Named for one? Missing from the others?")])),
    "w5_dentist": dict(tag="Dentists", h1="Dentists: is ChatGPT naming you?",
        vis=chat("ChatGPT", "I cracked a tooth tonight. Who can see me tomorrow in Dallas?",
                 "Three practices that offer urgent appointments:", ["Practice A", "Practice B", "Practice C"],
                 "Your practice: <b>not mentioned</b>"), example=True),
    "w5_my_plan": dict(tag="Agent diary", h1="AI Agent: here's my plan",
        vis=agent(["Gemini and Perplexity named two clinics with a page for emergency visits. You don't have one.",
                   "<b>My plan:</b> I'll write that page in your voice and add it to your services menu.",
                   "<span class=g>Nothing goes live until you approve.</span>"],
                  time="8:05 AM", buttons=("Approve", "Edit", "Skip")), example=True),
    "w5_web_person": dict(tag="Free AI check", h1="Fix emailed to your webmaster",
        sub="Your free AI check drafts the fix. One tap sends it.",
        vis=agent(["I drafted an FAQ answer from your check while you waited.",
                   "<span class=g>Your web person can paste it in a few minutes. No passwords to share.</span>"],
                  time="just now", buttons=("Email it to my web person", "Copy")), example=True),
    "w5_measured": dict(tag="Building Alphaa", h1="Your AI score isn't guessed",
        vis=quote("Every score in the report comes from real AI answers and 23 site checks. "
                  "If we didn't measure it, we don't show it.")),
    # ---- week 6 (2026-11-09..15) ----
    "w6_site_read": dict(tag="Save this", h1="Can AI read your website?",
        sub="The free check runs 23 site checks. They boil down to 3 questions.",
        vis=steps([("Can AI get in?", "Some sites turn AI assistants away without knowing it."),
                   ("Can AI understand what you do?", "Your city, services, phone and hours in plain text."),
                   ("Does AI have a reason to trust you?", "Reviews, an About page, your Google and Yelp profiles.")])),
    "w6_twelve": dict(tag="New in the free check", h1="Named in X of 12",
        sub="3 questions x 4 AIs = 12 answers. Unlocks when 3 or 4 AIs name you.",
        vis=grid([("Your exact question", "????"), ("Your wider category", "????"),
                  ("The problem, in the buyer's words", "????")])),
    "w6_hvac": dict(tag="HVAC", h1="HVAC: does Gemini name you?",
        vis=chat("Gemini", "My furnace is making a banging noise. Who should I call in Columbus?",
                 "A few local companies with strong reviews:", ["HVAC company A", "HVAC company B", "HVAC company C"],
                 "Your company: <b>not mentioned</b>"), example=True),
    "w6_buyers_broad": dict(tag="SEO said / AI says", h1="Buyers ask AI broader questions",
        vis=versus("You check", ["Your exact service", "Your city", "Your business name"],
                   "Buyers ask", ["The wider category", "The problem, in their words", "No business names at all"])),
    "w6_90_days": dict(tag="Risk off", h1="Not named in 90 days?",
        sub="If no AI names you within 90 days, your next month is free.",
        vis=factboxes([("4 AIs", "Checked every week."), ("90 days", "Not named? Next month free."),
                       ("7 days", "Refund on your first charge.")])),
    "w6_lawyer": dict(tag="Lawyers", h1="Lawyers: is Claude naming you?",
        vis=chat("Claude", "I was hurt at work in Cleveland. Which lawyer should I call?",
                 "Here are a few workers' compensation firms to consider:", ["Firm A", "Firm B", "Firm C"],
                 "Your firm: <b>not mentioned</b>"), example=True),
    "w6_ads_stop": dict(tag="Building Alphaa", h1="Ads stop. AI answers don't.",
        vis=quote("Ads stop the day you stop paying. Being the answer ChatGPT gives keeps working.")),
    # ---- week 7 (2026-11-16..22) ----
    "w7_zero_of_four": dict(tag="Our own test", h1="Broad question: 0 of 4",
        sub="Same agency: named by all 4 AIs for its niche question.",
        vis=score("Asked: \"How do I find and market to accredited investors?\"", "nnnn"),
        note="Real check · name withheld"),
    "w7_old_number": dict(tag="Agent diary", h1="ChatGPT has your old number",
        vis=fact([("ChatGPT told a customer", "(512) 555-0142", "s"), ("Your real number", "(512) 555-0199", "w")]),
        sub="Example. Your AI Agent finds it and drafts the fix.", example=True),
    "w7_new_rival": dict(tag="Agent diary", h1="AI named a new rival",
        vis=agent(["This week Perplexity started naming Clinic B for same-day crowns. They just published a page about it. You don't have one.",
                   "<b>My plan:</b> I'll draft your same-day crowns page today.",
                   "<span class=g>You approve before it goes live.</span>"],
                  time="7:52 AM", buttons=("Approve", "Edit", "Skip")), example=True),
    "w7_medspa": dict(tag="Med spas", h1="Med spas: Perplexity named three",
        vis=chat("Perplexity", "Who's good for lip filler in Miami with natural results?",
                 "Based on reviews and local listings:", ["Med spa A", "Med spa B", "Med spa C"],
                 "Yours: <b>not mentioned</b>", sources=True), example=True),
    "w7_sixty": dict(tag="Free AI check", h1="4 AIs. 60 seconds. Free.",
        vis=browser("Type your website.", "See what ChatGPT, Gemini, Claude and Perplexity say about you.",
                    url="alphaa.app")),
    "w7_inside_check": dict(tag="Free AI check", h1="Inside your free AI check",
        vis=steps([("The question your customers ask", "Asked live to 4 AIs."),
                   ("Each AI's answer, word for word", "Not a summary. What it actually said."),
                   ("Who got named instead", "The businesses AI picked over you."),
                   ("A measured score", "Real answers plus 23 site checks."),
                   ("A fix, drafted while you wait", "Email it straight to your web person.")])),
    "w7_new_markets": dict(tag="Building Alphaa · Coming soon", h1="London asks ChatGPT too",
        sub="Local pages for the UK, Germany, France, Italy and the UAE are coming.",
        vis=steps([("UK", "\"Who's a good emergency plumber in Leeds?\""),
                   ("Germany", "\"Welcher Zahnarzt in München nimmt neue Patienten?\""),
                   ("France", "\"Quel avocat contacter à Lyon pour un divorce ?\""),
                   ("Italy", "\"Un idraulico a Milano disponibile oggi?\""),
                   ("UAE", "\"Which dental clinic in Dubai Marina is open on Friday?\"")], outline=True)),
    # ---- week 8 (2026-11-23..29) ----
    "w8_plumber": dict(tag="Plumbers", h1="Plumbers: does Claude name you?",
        vis=chat("Claude", "Burst pipe under the sink. Who can come tonight in Charlotte?",
                 "These plumbers list emergency service:", ["Plumber A", "Plumber B", "Plumber C"],
                 "Your company: <b>not mentioned</b>"), example=True),
    "w8_problem": dict(tag="Are you in the answer?", h1="Customers ask AI about problems",
        vis=chat_why("ChatGPT", "Why is my AC blowing warm air?",
                     ["Common causes: a dirty filter, a tripped breaker or low refrigerant.",
                      "If it keeps happening, call a licensed HVAC technician. Local options include Company A and Company B."]),
        example=True),
    "w8_drafts": dict(tag="Agent diary", h1="AI Agent drafts. You approve.",
        vis=agent(["I drafted 2 Google posts for this week and replies to 3 new reviews.",
                   "<b>My plan:</b> I'll post them Thursday morning once you approve.",
                   "<span class=g>Every change is logged and can be undone.</span>"],
                  time="8:10 AM", buttons=("Approve all", "Edit", "Skip")), example=True),
    "w8_one_patient": dict(tag="Do the maths", h1="One ChatGPT patient. One year.",
        sub="One new patient is worth more than a year of your AI Agent.",
        vis=factboxes([("$99/mo", "Starter. Your AI Agent, every week."), ("$1,188", "A full year."),
                       ("1 patient", "Often worth more than that.")])),
    "w8_your_ok": dict(tag="Risk off", h1="Nothing goes live without you",
        sub="Your AI Agent works to get you named by ChatGPT. You approve every change.",
        vis=factboxes([("Approve", "Nothing public without your OK."), ("Undo", "Every site change is logged."),
                       ("2 clicks", "To cancel. Month to month.")])),
    "w8_strong_gap": dict(tag="Building Alphaa", h1="Named by ChatGPT? Ask broader.",
        vis=quote("Being named for your exact niche isn't the same as being named when buyers ask broadly. "
                  "That's where strong businesses usually find their gap.")),
    "w8_ai_visitors": dict(tag="Agent diary", h1="Count customers ChatGPT sends you",
        vis=agent(["I count the people ChatGPT, Gemini, Claude and Perplexity send to your website, every 30 days.",
                   "<span class=g>Connect me to your Google Analytics and I'll show you the trend in your briefing.</span>"],
                  time="9:00 AM", buttons=("Connect Google", "Later")), example=True),
}

# Carousels: id -> list of slides. Slide kinds: cover, item, end.
CAROUSELS = {
    "w1_car_howpicks": [
        ("cover", "How ChatGPT picks a business", "5 public signals AI reads before it names anyone."),
        ("item", "Clear answers on your site", "A page that says what you do, where, for whom and what it costs. AI quotes plain answers."),
        ("item", "The same facts everywhere", "Name, address, phone and hours that match on your site, Google and directories. Conflicts make AI unsure."),
        ("item", "Reviews it can verify", "Recent reviews on public sites that describe the actual job. Not just stars."),
        ("item", "Others talking about you", "Local news, associations, directories, forums. AI leans on what other sources say."),
        ("item", "A page per service", "One clear page per service and area beats one vague homepage."),
        ("end", "See what AI says about you", "Free check across ChatGPT, Gemini, Claude and Perplexity."),
    ],
    "w1_car_selftest": [
        ("cover", "Test your business on ChatGPT", "A 5-minute self-test. Do it today."),
        ("item", "Open all four", "ChatGPT, Gemini, Claude and Perplexity. A private window helps."),
        ("item", "Ask like a customer", "\"Who should I call for [service] in [city]?\" Not your business name. The real question."),
        ("item", "Ask it three ways", "Add \"near me\", \"open Saturday\" or \"for families\". Small changes can change the names."),
        ("item", "Write down who's named", "Every name, every AI. That's who you really compete with now."),
        ("item", "Ask \"why them?\"", "AI will usually explain its picks. That answer is your to-do list."),
        ("item", "Check your own facts", "Ask about your business by name. Wrong hours or services? Note them."),
        ("end", "Or skip the homework", "The free AI check runs all four in about 60 seconds."),
    ],
    "w2_car_factfix": [
        ("cover", "Fix what AI gets wrong", "Wrong hours, old address, services you dropped. Here's the 60-second fix."),
        ("item", "Ask AI about you", "\"What are [business name]'s hours and services?\" Ask all four AIs."),
        ("item", "Find the source", "Wrong facts usually come from an old listing: Yelp, Facebook, a directory, an old page."),
        ("item", "Fix it at the source", "Update every listing so the facts match your website exactly."),
        ("item", "Say it on your site", "Hours, services and areas in plain text on your site. Not only in an image."),
        ("item", "Ask again next week", "AI updates on its own schedule. Re-check weekly."),
        ("end", "Let your agent watch it", "Alphaa re-asks 4 AIs every week and flags wrong facts."),
    ],
    "w2_car_trades": [
        ("cover", "Trades: get recommended by ChatGPT", "The question each trade's customers ask AI. Try yours."),
        ("item", "Plumbers", "\"Who can fix a leaking water heater today in [city]?\""),
        ("item", "HVAC", "\"Who do people trust for AC repair in [city]?\""),
        ("item", "Electricians", "\"Licensed electrician for a panel upgrade near [city]?\""),
        ("item", "Roofers", "\"Who should I call for roof storm damage in [city]?\""),
        ("item", "Cleaners", "\"Reliable house cleaning service in [city] with good reviews?\""),
        ("end", "Did AI name you?", "Run all four AIs on your business, free."),
    ],
    "w3_car_seo_said": [
        ("cover", "SEO said vs AI says", "Old rules, new answers. Swipe."),
        ("item", "SEO said: rank on page 1", "<b>AI says:</b> there is no page 1. There's one answer with a few names."),
        ("item", "SEO said: repeat keywords", "<b>AI says:</b> answer the actual question in plain words."),
        ("item", "SEO said: longer is better", "<b>AI says:</b> short, specific answers are easier to quote."),
        ("item", "SEO said: get backlinks", "<b>AI says:</b> be mentioned in places people trust, with the same facts everywhere."),
        ("item", "SEO said: check rankings monthly", "<b>AI says:</b> ask the AIs every week. Answers change."),
        ("end", "Are you in the answer?", "See what 4 AIs say about you, free."),
    ],
    "w3_car_lawyers": [
        ("cover", "Lawyers: get named by AI", "People ask AI which lawyer to call. Here's what it reads."),
        ("item", "One page per practice area", "Personal injury, family, estate. Each with clear answers to real client questions."),
        ("item", "Plain-language FAQs", "\"How long do I have to file?\" \"Do you charge upfront?\" Answer them on your site."),
        ("item", "Matching bar and directory info", "Name, address and phone that match everywhere you're listed."),
        ("item", "Reviews that describe the case type", "AI can match \"car accident\" reviews to car accident questions."),
        ("item", "Ask the AIs yourself", "\"Which [practice area] lawyer should I call in [city]?\" Who got named?"),
        ("end", "Is your firm in the answer?", "Free check across ChatGPT, Gemini, Claude and Perplexity."),
    ],
    "w4_car_competitor": [
        ("cover", "Why ChatGPT names your competitor", "It's rarely luck. It's usually these 5 gaps."),
        ("item", "They answer the question", "Their site says what they do, where and for whom, in plain words."),
        ("item", "Their facts match", "Same name, phone and hours on every listing. Yours may conflict."),
        ("item", "Their reviews are recent", "And describe the actual service, which AI can match to questions."),
        ("item", "Others mention them", "Local news, directories, forums. AI leans on outside sources."),
        ("item", "They have a page per service", "One vague homepage is hard for AI to recommend for anything."),
        ("end", "See who AI names instead", "And what they have that you don't. Free check."),
    ],
    "w4_car_agent": [
        ("cover", "Your AI agent, explained", "What Alphaa does every week, in plain English."),
        ("item", "It asks the 4 AIs", "ChatGPT, Gemini, Claude and Perplexity get your customers' questions, live."),
        ("item", "It tells you what they said", "Who got named, who didn't, and why. In a short message."),
        ("item", "It drafts the fix", "FAQ pages, blog posts, corrected facts, Google posts, review replies."),
        ("item", "You tap approve", "Post it, Edit or Skip. Nothing public goes live without you."),
        ("item", "Undo anytime", "Everything it publishes can be rolled back."),
        ("end", "Start with the free check", "See what AI says about you in about 60 seconds."),
    ],
}


# ---------- local market posts (Nov 2026): m_<key>_w<n> ----------
# One LinkedIn page post per market per week. Portrait only. Copy is native to
# each market; every AI answer or agent message is labelled as an example in
# the local language, with placeholder businesses.
ML = {
    "en": dict(ex="Example", foot="Example scenario", agent="your AI Agent", yes="Named you",
               no="Didn't name you", btns=("Post it", "Edit", "Skip")),
    "de": dict(ex="Beispiel", foot="Beispielszenario", agent="Ihr KI-Agent", yes="Nennt Sie",
               no="Nennt Sie nicht", btns=("Freigeben", "Bearbeiten", "Überspringen")),
    "fr": dict(ex="Exemple", foot="Exemple illustratif", agent="votre agent IA", yes="Vous cite",
               no="Ne vous cite pas", btns=("Publier", "Modifier", "Ignorer")),
    "it": dict(ex="Esempio", foot="Esempio illustrativo", agent="il tuo agente IA", yes="Ti nomina",
               no="Non ti nomina", btns=("Pubblica", "Modifica", "Salta")),
    "ar": dict(ex="مثال", foot="مثال توضيحي", agent="وكيلك الذكي", yes="ذكرك",
               no="لم يذكرك", btns=("انشره", "عدّل", "تخطَّ")),
}


def m_chat(lg, engine, question, intro, names, miss):
    L = ML[lg]
    lis = "".join(f"<li>{e(n)}</li>" for n in names)
    return (f"<div class=phone><div class=ph-top><b>{e(engine)}</b><span>{e(L['ex'])}</span></div>"
            f"<div class='b user'>{e(question)}</div>"
            f"<div class='b ai'>{e(intro)}<ol>{lis}</ol></div>"
            f"<div class=miss>{miss}</div></div>")


def m_score(lg, question, verdicts):
    L = ML[lg]
    rows = ""
    for ai, v in zip(AIS, verdicts):
        cls, lab = ("ok", L["yes"]) if v == "y" else ("no", L["no"])
        rows += f"<div class=row><span dir=ltr>{ai}</span><span class='pill {cls}'>{e(lab)}</span></div>"
    return f"<div class=card><div class=q>{e(question)}</div>{rows}</div>"


def m_agent(lg, paras, time):
    L = ML[lg]
    ps = "".join(f"<p>{p}</p>" for p in paras)
    bs = "".join(f"<span class={'ok' if i == 0 else ''}>{e(b)}</span>" for i, b in enumerate(L["btns"]))
    return (f"<div class=agent><div class=ag-h><img src='{ICON}'><b>Alphaa</b> · {e(L['agent'])} · {e(time)}"
            f"<span class=ag-ex>{e(L['ex'])}</span></div>"
            f"<div class=ag-b>{ps}</div><div class=btns>{bs}</div></div>")


def m(lg, **kw):
    """Market image spec: portrait only, local lang/dir, local example label."""
    d = dict(portrait_only=True, lang={"en": "en", "de": "de", "fr": "fr", "it": "it", "ar": "ar"}[lg],
             dir="rtl" if lg == "ar" else "ltr")
    if kw.pop("example", False):
        d.update(example=True, note=ML[lg]["foot"])
    d.update(kw)
    return d


MARKET_IMAGES = {
    # ---- UK (Mondays) ----
    "m_uk_w1": m("en", tag="Are you in the answer?", h1="Is ChatGPT recommending your business?", example=True,
        vis=m_chat("en", "ChatGPT", "Can you recommend a good conveyancing solicitor in Leeds?",
                   "A few firms people often recommend:", ["Firm A", "Firm B", "Firm C"],
                   "Your firm: <b>not mentioned</b>")),
    "m_uk_w2": m("en", tag="Example check", h1="Dentists: does ChatGPT name you?", example=True,
        vis=m_score("en", "Asked: “Which dentist in Clapham is taking on new private patients?”", "nnyn")),
    "m_uk_w3": m("en", tag="Save this", h1="Where ChatGPT checks your business",
        sub="Before AI names a UK business, it cross-checks these.",
        vis=steps([("Google Business Profile", "Hours, category and reviews. Usually checked first."),
                   ("Trustpilot and Google reviews", "Recent reviews you've replied to."),
                   ("Yell, Checkatrade and Bark", "Same name, number and address as everywhere else."),
                   ("Your own website", "A clear page per service that AI can quote.")])),
    "m_uk_w4": m("en", tag="Agent diary", h1="ChatGPT picks the boiler engineer", example=True,
        vis=m_agent("en", ["I asked ChatGPT this morning for a Gas Safe engineer in south Manchester. It named three firms. You weren't one.",
                           "<span class=g>All three show their Gas Safe number and have recent Checkatrade reviews. Your website doesn't show yours.</span>",
                           "<b>My plan:</b> I've drafted a boiler servicing page with your Gas Safe number and the areas you cover."],
                    "8:02 am")),
    # ---- Germany (Tuesdays) ----
    "m_de_w1": m("de", tag="Stehen Sie in der Antwort?", h1="Empfiehlt ChatGPT Ihren Betrieb?", example=True,
        vis=m_chat("de", "ChatGPT", "Ich brauche einen Fachanwalt für Arbeitsrecht in Frankfurt, mir wurde gekündigt. Wen kannst du empfehlen?",
                   "Diese Kanzleien werden oft empfohlen:", ["Kanzlei A", "Kanzlei B", "Kanzlei C"],
                   "Ihre Kanzlei: <b>nicht genannt</b>")),
    "m_de_w2": m("de", tag="Beispiel-Check", h1="Zahnärzte: Nennt ChatGPT Ihre Praxis?", example=True,
        vis=m_score("de", "Gefragt: „Welcher Zahnarzt in Berlin-Prenzlauer Berg nimmt noch neue Kassenpatienten auf?“", "nynn")),
    "m_de_w3": m("de", tag="Zum Merken", h1="Was ChatGPT über Sie liest",
        sub="Bevor die KI einen Betrieb nennt, gleicht sie diese Quellen ab.",
        vis=steps([("Google Unternehmensprofil", "Adresse, Öffnungszeiten, Bewertungen."),
                   ("Gelbe Seiten, Das Örtliche, 11880", "Nummer und Adresse müssen überall stimmen."),
                   ("Jameda, MyHammer, ProvenExpert", "Die Bewertungsportale Ihrer Branche."),
                   ("Ihre eigene Website", "Klare Antworten auf Deutsch, die die KI zitieren kann.")])),
    "m_de_w4": m("de", tag="Agenten-Tagebuch", h1="Wärmepumpe? ChatGPT nennt die Konkurrenz.", example=True,
        vis=m_agent("de", ["Ich habe ChatGPT heute Morgen gefragt, welcher Heizungsbauer in München Wärmepumpen einbaut. Drei Betriebe wurden genannt. Ihrer nicht.",
                           "<span class=g>Alle drei haben eine eigene Seite zur Wärmepumpe und aktuelle Bewertungen auf MyHammer und Google.</span>",
                           "<b>Mein Plan:</b> Ich habe eine Wärmepumpen-Seite mit Ihrem Einsatzgebiet entworfen."],
                    "08:02")),
    # ---- France (Wednesdays) ----
    "m_fr_w1": m("fr", tag="Êtes-vous dans la réponse ?", h1="ChatGPT recommande-t-il votre entreprise ?", example=True,
        vis=m_chat("fr", "ChatGPT", "Tu peux me conseiller un dentiste à Lyon qui prend encore de nouveaux patients ?",
                   "Voici quelques cabinets souvent recommandés :", ["Cabinet A", "Cabinet B", "Cabinet C"],
                   "Votre cabinet : <b>non cité</b>")),
    "m_fr_w2": m("fr", tag="Exemple de vérification", h1="Avocats : ChatGPT cite-t-il votre cabinet ?", example=True,
        vis=m_score("fr", "Question : « Quel avocat en droit de la famille à Bordeaux pour un divorce par consentement mutuel ? »", "nnny")),
    "m_fr_w3": m("fr", tag="À garder", h1="Où ChatGPT vérifie votre entreprise",
        sub="Avant de citer une entreprise, l’IA recoupe ces sources.",
        vis=steps([("Fiche d’établissement Google", "Activité, horaires, photos et avis."),
                   ("PagesJaunes", "Vos coordonnées doivent correspondre partout."),
                   ("Doctolib, Planity, Avis Vérifiés", "Les plateformes de votre métier."),
                   ("Votre propre site", "Des réponses claires que l’IA peut citer.")])),
    "m_fr_w4": m("fr", tag="Journal de l’agent", h1="Chauffagistes : ChatGPT vous cite‑t‑il ?", example=True,
        vis=m_agent("fr", ["Ce matin, j’ai demandé à ChatGPT quel chauffagiste RGE à Lyon peut installer une pompe à chaleur. Il a cité trois entreprises. Pas la vôtre.",
                           "<span class=g>Les trois figurent dans l’annuaire France Rénov’ et ont une page dédiée aux pompes à chaleur.</span>",
                           "<b>Mon plan :</b> j’ai rédigé une page « pompe à chaleur » avec votre zone d’intervention et votre qualification RGE."],
                    "08:02")),
    # ---- Italy (Thursdays) ----
    "m_it_w1": m("it", tag="Sei nella risposta?", h1="ChatGPT consiglia la tua attività?", example=True,
        vis=m_chat("it", "ChatGPT", "Avvocato a Torino per una separazione consensuale, chi è affidabile?",
                   "Alcuni studi spesso consigliati:", ["Studio A", "Studio B", "Studio C"],
                   "Il tuo studio: <b>non citato</b>")),
    "m_it_w2": m("it", tag="Esempio di controllo", h1="Dentisti: ChatGPT ti nomina?", example=True,
        vis=m_score("it", "Domanda: “Mi consigli un dentista bravo a Milano zona Porta Romana per un impianto?”", "nynn")),
    "m_it_w3": m("it", tag="Da salvare", h1="I siti che ChatGPT legge",
        sub="Prima di consigliare un’attività, l’IA incrocia queste fonti.",
        vis=steps([("Profilo dell’attività su Google", "Orari, categoria, foto e recensioni."),
                   ("PagineGialle", "Nome, indirizzo e telefono giusti."),
                   ("MioDottore, Treatwell, ProntoPro", "I portali del tuo settore."),
                   ("Il tuo sito", "Risposte chiare che l’IA può citare.")])),
    "m_it_w4": m("it", tag="Diario dell’agente", h1="ChatGPT sceglie l’idraulico. Sei tu?", example=True,
        vis=m_agent("it", ["Stamattina ho chiesto a ChatGPT un idraulico al Vomero, a Napoli, che venga oggi per una perdita. Ha fatto tre nomi. Il tuo no.",
                           "<span class=g>Tutti e tre hanno recensioni recenti su ProntoPro e una pagina per le urgenze sul loro sito.</span>",
                           "<b>Il mio piano:</b> ho preparato una pagina “pronto intervento” con le zone dove lavori."],
                    "08:02")),
    # ---- UAE, English (Fridays) ----
    "m_ae_w1": m("en", tag="Are you in the answer?", h1="Does ChatGPT recommend your business?", example=True,
        vis=m_chat("en", "ChatGPT", "Where can I get a good blow-dry and nails near Al Barsha, walk-ins welcome?",
                   "A few salons with strong reviews:", ["Salon A", "Salon B", "Salon C"],
                   "Your salon: <b>not mentioned</b>")),
    "m_ae_w2": m("en", tag="Example check", h1="Clinics: does ChatGPT name you?", example=True,
        vis=m_score("en", "Asked: “Which dental clinic in Jumeirah is good for veneers and accepts insurance?”", "nnyn")),
    "m_ae_w3": m("en", tag="Save this", h1="Where ChatGPT checks UAE businesses",
        sub="Before AI names a business in the Emirates, it cross-checks these.",
        vis=steps([("Google Business Profile", "Your exact area, hours, category and photos."),
                   ("Google Maps reviews and TripAdvisor", "Recent reviews you've replied to."),
                   ("Bayut, Property Finder, Fresha, Okadoc", "The platforms for your sector."),
                   ("Your own website", "Pages that name your area and your services.")])),
    "m_ae_w4": m("en", tag="Agent diary", h1="ChatGPT picks the Dubai broker", example=True,
        vis=m_agent("en", ["I asked ChatGPT this morning who to call for a villa rental in Arabian Ranches. It named three agencies. Yours wasn't one.",
                           "<span class=g>All three have a page about Arabian Ranches on their own website, and Google reviews that name the community.</span>",
                           "<b>My plan:</b> I've drafted an Arabian Ranches page from your current listings."],
                    "8:02 AM")),
    # ---- UAE, Arabic (Saturdays) ----
    "m_ar_w1": m("ar", tag="هل أنت في الإجابة؟", h1="هل يرشّح ChatGPT نشاطك التجاري؟", example=True,
        vis=m_chat("ar", "ChatGPT", "ما عيادة الأسنان الجيدة في دبي مارينا لتقويم Invisalign وتفتح مساء الجمعة؟",
                   "هذه بعض العيادات التي يُنصح بها كثيرًا:", ["عيادة أ", "عيادة ب", "عيادة ج"],
                   "عيادتك: <b>لم تُذكر</b>")),
    "m_ar_w2": m("ar", tag="مثال على الفحص", h1="هل يرشّح ChatGPT صالونك؟", example=True,
        vis=m_score("ar", "السؤال: «صالون نسائي جيد في البرشاء للكيراتين والأظافر ويفتح حتى وقت متأخر؟»", "nnyn")),
    "m_ar_w3": m("ar", tag="احفظ هذا", h1="ماذا يقرأ ChatGPT عن نشاطك؟",
        sub="قبل أن يرشّح الذكاء الاصطناعي نشاطًا في الإمارات، يقارن هذه المصادر.",
        vis=steps([("ملفك التجاري على Google", "منطقتك بالتحديد وساعات العمل والفئة والصور."),
                   ("تقييمات خرائط Google وTripAdvisor", "تقييمات حديثة رددت عليها."),
                   ("Bayut وProperty Finder وFresha وOkadoc", "منصات قطاعك."),
                   ("موقعك الإلكتروني", "صفحات تذكر منطقتك وخدماتك بوضوح.")])),
    "m_ar_w4": m("ar", tag="يوميات الوكيل", h1="ChatGPT يرشّح كراجًا آخر", example=True,
        vis=m_agent("ar", ["سألتُ ChatGPT صباح اليوم عن كراج أمين في القوز لصيانة رينج روفر. ذكر ثلاثة كراجات، ولم يذكر كراجك.",
                           "<span class=g>لدى الثلاثة تقييمات حديثة على خرائط Google تذكر نوع السيارة والسعر، وصفحة لكل ماركة يخدمونها.</span>",
                           "<b>خطتي:</b> أعددتُ صفحة لصيانة رينج روفر تذكر موقعك في القوز وساعات العمل."],
                    "8:02 ص")),
}
IMAGES.update(MARKET_IMAGES)


def page(body_cls, w, h, inner, lang="en", dir="ltr"):
    return (f"<!doctype html><html lang={lang} dir={dir} style='width:{w}px;height:{h}px'><head><meta charset=utf-8>"
            f"<link rel=stylesheet href=post.css></head><body class={body_cls}>{inner}</body></html>")


def foot(example, right=None):
    r = (f"<span class=ex>{e(right)}</span>" if right else "") or ("<span class=ex>Example scenario</span>" if example else "")
    return f"<div class=foot><div class=brand><img src='{ICON}'>alphaa.app</div>{r}</div>"


def single_html(spec, land):
    sub = f"<p class=sub>{e(spec['sub'])}</p>" if spec.get("sub") else ""
    tag = f"<div class=tag>{e(spec['tag'])}</div>" if spec.get("tag") else ""
    inner = (f"<div class=bg><div class=txt>{tag}<h1>{e(spec['h1'])}</h1>{sub}</div>"
             f"<div class=vis>{spec['vis']}</div>{foot(spec.get('example'), spec.get('note'))}</div>")
    return page("x" if land else "p", 1600 if land else 1080, 900 if land else 1350, inner,
                spec.get("lang", "en"), spec.get("dir", "ltr"))


def slide_html(kind, title, body, i, n, deck=""):
    cnt = f"<div class=cnt>{i} / {n}</div>"
    if kind == "cover":
        inner = (f"<div class=bg>{cnt}<div class=tag>Swipe · Save for later</div><div class=mid><h1 class=lg>{e(title)}</h1>"
                 f"<p class=sub>{e(body)}</p></div><div class=swipe>Swipe &rarr;</div>{foot(False)}</div>")
    elif kind == "item":
        inner = (f"<div class=bg>{cnt}<div class=tag>{e(deck)}</div><div class=mid><div class='big-n o'>{i - 1:02d}</div>"
                 f"<div class=s-t>{e(title)}</div><div class=s-d>{body}</div></div>{foot(False)}</div>")
    else:
        inner = (f"<div class=bg>{cnt}<div class=tag>Free AI check</div><div class=mid><h1 class=lg>{e(title)}</h1>"
                 f"<p class=sub>{e(body)}</p><div><span class=urlpill>alphaa.app/start</span></div></div>{foot(False)}</div>")
    return page("p slide", 1080, 1350, inner)


def render(job):
    """Chrome writes the PNG fast but often lingers, so poll for the file and kill it."""
    src, out, w, h = job
    if os.path.exists(out):
        os.remove(out)
    prof = tempfile.mkdtemp(prefix="alphaa-chrome-")
    p = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                          f"--user-data-dir={prof}", "--allow-file-access-from-files",
                          f"--window-size={w},{h}", f"--screenshot={out}", "file://" + src],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    last, t0 = -1, time.time()
    while time.time() - t0 < 40:
        if p.poll() is not None:
            break
        if os.path.exists(out):
            sz = os.path.getsize(out)
            if sz > 0 and sz == last:
                break
            last = sz
        time.sleep(0.4)
    try:
        os.killpg(p.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    shutil.rmtree(prof, ignore_errors=True)
    return out


def main():
    flt = sys.argv[1] if len(sys.argv) > 1 else ""
    jobs = []
    for iid, spec in IMAGES.items():
        if flt not in iid:
            continue
        for land in ((False,) if spec.get("portrait_only") else (False, True)):
            name = iid + ("-x" if land else "")
            src = os.path.join(SRC, name + ".html")
            open(src, "w").write(single_html(spec, land))
            jobs.append((src, os.path.join(HERE, name + ".png"), 1600 if land else 1080, 900 if land else 1350))
    for cid, slides in CAROUSELS.items():
        if flt not in cid:
            continue
        n = len(slides)
        for i, (kind, t, b) in enumerate(slides, 1):
            name = f"{cid}-s{i}"
            src = os.path.join(SRC, name + ".html")
            open(src, "w").write(slide_html(kind, t, b, i, n, slides[0][1]))
            jobs.append((src, os.path.join(HERE, name + ".png"), 1080, 1350))
    with ThreadPoolExecutor(6) as ex:
        for out in ex.map(render, jobs):
            ok = os.path.exists(out)
            print(("ok  " if ok else "FAIL ") + os.path.relpath(out, HERE))


if __name__ == "__main__":
    main()
