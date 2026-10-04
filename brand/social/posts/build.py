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
    return (f"<div class=agent><div class=ag-h><img src='{ICON}'><b>Alphaa</b> · your AI agent · {e(time)}</div>"
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


def browser(title, sub):
    chips = "".join(f"<span>{a}</span>" for a in AIS)
    return (f"<div class=browser><div class=br-top><i></i><i></i><i></i><span class=url>alphaa.app/start</span></div>"
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


def page(body_cls, w, h, inner):
    return (f"<!doctype html><html style='width:{w}px;height:{h}px'><head><meta charset=utf-8>"
            f"<link rel=stylesheet href=post.css></head><body class={body_cls}>{inner}</body></html>")


def foot(example, right=None):
    r = right or ("<span class=ex>Example scenario</span>" if example else "")
    return f"<div class=foot><div class=brand><img src='{ICON}'>alphaa.app</div>{r}</div>"


def single_html(spec, land):
    sub = f"<p class=sub>{e(spec['sub'])}</p>" if spec.get("sub") else ""
    tag = f"<div class=tag>{e(spec['tag'])}</div>" if spec.get("tag") else ""
    inner = (f"<div class=bg><div class=txt>{tag}<h1>{e(spec['h1'])}</h1>{sub}</div>"
             f"<div class=vis>{spec['vis']}</div>{foot(spec.get('example'))}</div>")
    return page("x" if land else "p", 1600 if land else 1080, 900 if land else 1350, inner)


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
        for land in (False, True):
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
