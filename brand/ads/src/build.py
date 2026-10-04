#!/usr/bin/env python3
"""Generate Alphaa ad creative HTML (brand/ads/src/*.html) for every concept x size.

Render with brand/ads/src/render.sh. Each page auto-scales its visual to fit the free
space and writes a layout report to <body data-report> (checked by render.sh via --dump-dom).
"""
import pathlib

HERE = pathlib.Path(__file__).parent
LOGO = "../../mono/alphaa-mono-icon-256.png"
SIZES = {"sq": (1080, 1080), "st": (1080, 1920), "ls": (1200, 628)}
LANDSCAPE = {"c01", "c02", "c03", "c10"}  # top 4 get a 1200x628 version


def chat(app, q, intro, names, foot=None, ex=True):
    lis = "".join(
        f'<li><i>{i+1}</i><span class="nm blur">{n}</span><span class="why">{w}</span></li>'
        for i, (n, w) in enumerate(names)
    )
    f = f'<div class="cfoot">{foot}<span class="no">Not listed</span></div>' if foot else ""
    tag = '<span class="ex">Example</span>' if ex else ""
    return (
        f'<div class="chat"><div class="chead"><span class="app">{app}</span>{tag}</div>'
        f'<div class="ubub">{q}</div><div class="ans">{intro}<ol>{lis}</ol></div>{f}</div>'
    )


DENTAL = [("Harbor Smile Dental", "4.9 stars"), ("Oakline Family Dentistry", "Open Saturdays"), ("Bright Path Dental", "Sedation options")]

V = {}
V["phone"] = (
    '<div class="phone"><div class="notch"></div>'
    + chat("ChatGPT", "Who's a good dentist near me?", "Here are three well-reviewed practices nearby:", DENTAL)
    + '</div><div class="overlay">Is your practice here?</div>'
)

goog = "".join(
    f'<div class="res">{"<div class=sp>Sponsored</div>" if i < 3 else ""}<div class="ln t" style="width:{w}%"></div><div class="ln" style="width:{w2}%"></div><div class="ln" style="width:{w3}%"></div></div>'
    for i, (w, w2, w3) in enumerate([(78, 95, 60), (64, 90, 72), (82, 88, 55), (70, 92, 66), (60, 85, 70)])
)
V["split"] = (
    '<div class="split"><div class="pane g"><div class="ph">Google<small>10 links</small></div>'
    '<div class="sbar">best dentist near me</div>' + goog + "</div>"
    '<div class="pane c"><div class="ph">ChatGPT<small>1 answer</small></div>'
    '<div class="ubub">best dentist near me</div><div class="ans">I\'d look at these three:<ol>'
    + "".join(f'<li><i>{i+1}</i><span class="nm blur">{n}</span></li>' for i, (n, _) in enumerate(DENTAL))
    + "</ol>Strong reviews and clear answers to patient questions.</div></div></div>"
    '<div class="splitcap"><span>Which one are your</span><span>customers using?</span></div>'
)

V["invisible"] = (
    '<div class="chat"><div class="chead"><span class="app">ChatGPT</span><span class="ex">Example</span></div>'
    '<div class="ubub">Who should I call for a roof leak?</div>'
    '<div class="ans">Three local roofers people recommend:<ol>'
    '<li><i>1</i><span class="nm blur">Summit Ridge Roofing</span><span class="why">Same-day quotes</span></li>'
    '<li><i>2</i><span class="nm blur">Keystone Roof Co.</span><span class="why">500+ reviews</span></li>'
    '<li><i>3</i><span class="nm blur">Clearview Exteriors</span><span class="why">Clear pricing</span></li>'
    '</ol><div class="slot">Your business<span>Never came up</span></div></div></div>'
)

V["selftest"] = (
    '<div class="card">'
    '<div class="step"><div class="n">1</div><div><h3>Open ChatGPT</h3><p>Or Gemini, Claude, Perplexity.</p></div></div>'
    '<div class="step"><div class="n">2</div><div><h3>Ask what a customer would</h3><p>"Best [your trade] in [your city]?"</p></div></div>'
    '<div class="step hl"><div class="n">3</div><div><h3>Are you in the answer?</h3><p>If not, that customer never knew you existed.</p></div></div>'
    "</div>"
)

V["dentists"] = chat(
    "ChatGPT", "Who's a good dentist in Austin for a nervous patient?",
    "These practices are known for gentle care:", DENTAL, foot="Your practice")
V["medspa"] = chat(
    "Gemini", "Where should I get Botox in Scottsdale?",
    "Well-reviewed med spas in Scottsdale:",
    [("Desert Glow Aesthetics", "Licensed injectors"), ("Lumen Skin Studio", "Before photos online"), ("Saguaro Med Spa", "Free consults")],
    foot="Your spa")
V["hvac"] = chat(
    "ChatGPT", "My AC died. Who can come today in Phoenix?",
    "These companies offer same-day AC repair:",
    [("CoolLine Air", "24/7 service"), ("Valley Comfort HVAC", "Upfront pricing"), ("Mesa Air Pros", "4.8 stars")],
    foot="Your company")
V["plumbers"] = chat(
    "Perplexity", "Emergency plumber open now in Dallas?",
    "Plumbers with 24-hour emergency service:",
    [("TrueFlow Plumbing", "Open 24 hours"), ("Lone Star Drain Co.", "No overtime fee"), ("Redline Plumbing", "Licensed, insured")],
    foot="Your company")
V["lawyers"] = chat(
    "Claude", "I was rear-ended. Which injury lawyer in Tampa should I call?",
    "Firms that handle car accident cases in Tampa:",
    [("Bayside Injury Law", "Free consultation"), ("Gulfview Trial Lawyers", "Car accident focus"), ("Harper & Lowe, PA", "Spanish spoken")],
    foot="Your firm")

V["fourai"] = (
    '<div class="card"><div class="q"><span>Asked: "Who\'s a good dentist near me?"</span><span class="ex">Example</span></div>'
    '<div class="row">ChatGPT<span class="pill no">Didn\'t name you</span></div>'
    '<div class="row">Gemini<span class="pill no">Didn\'t name you</span></div>'
    '<div class="row">Claude<span class="pill no">Didn\'t name you</span></div>'
    '<div class="row">Perplexity<span class="pill ok">Named you</span></div></div>'
)

V["diary"] = (
    '<div class="card"><div class="q"><span>Agent diary · Tuesday</span><span class="ex">Example</span></div><div class="log">'
    '<div class="e"><span class="t">9:02am</span><span>I asked ChatGPT when you close.</span></div>'
    '<div class="e"><span class="t">9:02am</span><span>It said <b>5pm</b>. Your site says <b>8pm</b>.</span></div>'
    '<div class="e"><span class="t">9:05am</span><span>I drafted a fix for your Google profile and your site.</span></div>'
    '</div><div class="approve"><div class="lbl">Needs your OK</div><div class="what">Update hours to 8am to 8pm</div>'
    '<div class="btns"><span>Post it</span><span>Edit</span><span>Skip</span></div></div></div>'
)

V["three"] = (
    '<div class="card">'
    '<div class="step"><div class="n">1</div><div><h3>Clear answers</h3><p>Pages that answer the questions customers really ask.</p></div></div>'
    '<div class="step"><div class="n">2</div><div><h3>Facts that match</h3><p>Same hours, services and address everywhere.</p></div></div>'
    '<div class="step"><div class="n">3</div><div><h3>Reviews it can verify</h3><p>Recent, real reviews on sites AI reads.</p></div></div>'
    "</div>"
)

V["guarantee"] = (
    '<div class="gcard"><div class="gnum"><span class="n">90</span><span class="u">days</span></div>'
    '<div class="gtext">If no AI names you in 90 days, your next month is free.</div>'
    '<div class="gsmall">Checked weekly on ChatGPT, Gemini, Claude and Perplexity. Terms apply.</div>'
    '<div class="chips"><span>$99/month</span><span>7-day refund</span><span>Month to month</span></div></div>'
)

V["approve"] = (
    '<div class="card"><div class="q"><span>Your weekly briefing</span><span class="ex">Example</span></div><div class="log">'
    '<div class="e"><span class="tick">&#10003;</span><span>Asked ChatGPT, Gemini, Claude and Perplexity about you</span></div>'
    '<div class="e"><span class="tick">&#10003;</span><span>Fixed your hours on Google</span></div>'
    '<div class="e"><span class="tick">&#10003;</span><span>Drafted 2 answers to questions patients ask</span></div>'
    '</div><div class="approve"><div class="lbl">Needs your OK</div><div class="what">New Google post: "Same-week crowns"</div>'
    '<div class="btns"><span>Post it</span><span>Edit</span><span>Skip</span></div></div></div>'
)

V["agency"] = (
    '<div class="cols"><div class="col old"><h3>Typical agency</h3><div class="pr">About $2,000/month</div><ul>'
    "<li>Monthly PDF</li><li>Long contract</li><li>Built for 10 blue links</li><li>You chase updates</li></ul></div>"
    '<div class="col new"><h3>Alphaa AI agent</h3><div class="pr">$99/month</div><ul>'
    "<li>Checks 4 AIs weekly</li><li>Month to month</li><li>Fixes and publishes</li><li>You tap approve</li></ul></div></div>"
)

# id, slug, headline, sub, visual key, story foot text
CONCEPTS = [
    ("c01", "phone-demo", "Does ChatGPT recommend you?", "Your customers ask AI who to hire now. Here's a typical answer.", "phone"),
    ("c02", "split-screen", "ChatGPT gives one answer.", "Google gives ten links. AI names a few businesses. Are you one?", "split"),
    ("c03", "invisible", "Invisible to ChatGPT?", "If AI doesn't name you, that customer never knew you existed.", "invisible"),
    ("c04", "self-test", "Ask ChatGPT who to hire.", "A 10-second test every owner should run today.", "selftest"),
    ("c05", "dentists", "Dentists: does ChatGPT name you?", "Patients ask AI before they book. Here's a typical answer.", "dentists"),
    ("c06", "med-spas", "Med spa clients ask ChatGPT.", "And Gemini. They book one of the names it gives.", "medspa"),
    ("c07", "hvac", "HVAC owners: ask ChatGPT this.", "Homeowners with a broken AC ask AI who to call.", "hvac"),
    ("c08", "plumbers", "Plumbers: AI picks who's called.", "The emergency call goes to a name AI gives.", "plumbers"),
    ("c09", "lawyers", "Lawyers: does AI name you?", "Clients ask AI which firm to call. Are you in it?", "lawyers"),
    ("c10", "four-ais", "What AI says about you.", "We ask ChatGPT, Gemini, Claude and Perplexity. You see the real answers.", "fourai"),
    ("c11", "agent-diary", "AI had our hours wrong.", "Your AI agent catches it, drafts the fix, and asks you first.", "diary"),
    ("c12", "three-things", "3 things ChatGPT checks first.", "Before AI recommends a local business, it looks for:", "three"),
    ("c13", "guarantee", "Our 90-day AI guarantee.", "Get recommended by ChatGPT, Gemini, Claude and Perplexity.", "guarantee"),
    ("c14", "agent-approve", "AI agent works. You approve.", "It checks what AI says, does the fix, and asks before anything goes live.", "approve"),
    ("c15", "agency-vs-agent", "Agency PDF or AI agent?", "Get recommended by AI without a retainer.", "agency"),
]

FIT_JS = r"""
<script>
(function(){
  const W=innerWidth,H=innerHeight,size=document.body.className;
  const vis=document.querySelector('.vis'),inner=document.querySelector('.inner');
  const vr=vis.getBoundingClientRect();
  const iw=inner.offsetWidth,ih=inner.offsetHeight;
  const max=size==='st'?1.12:1;
  const s=Math.min(max,vr.width/iw,vr.height/ih);
  inner.style.transform='translate(-50%,-50%) scale('+s.toFixed(3)+')';
  const issues=[];
  // safe area per format
  const safeTop=size==='st'?250:0, safeBot=size==='st'?H-340:H;
  const els=[...document.querySelectorAll('.top,h1,.sub,.foot,.inner')];
  for(const el of els){
    if(getComputedStyle(el).display==='none')continue;
    const r=el.getBoundingClientRect();
    if(r.top<safeTop-0.5||r.bottom>safeBot+0.5||r.left<-0.5||r.right>W+0.5)
      issues.push((el.className||el.tagName)+'@'+Math.round(r.top)+'-'+Math.round(r.bottom));
  }
  for(const el of document.querySelectorAll('h1,.sub,.ubub,.nm,.row,.step h3'))
    if(el.scrollWidth>el.clientWidth+1)issues.push('hscroll:'+el.tagName+'.'+el.className);
  const h1=document.querySelector('h1');
  const lines=Math.round(h1.getBoundingClientRect().height/parseFloat(getComputedStyle(h1).lineHeight));
  document.body.setAttribute('data-report','scale='+s.toFixed(2)+';h1lines='+lines+';issues='+(issues.join('|')||'none'));
})();
</script>
"""


def page(cid, slug, head, sub, vkey, size):
    w, h = SIZES[size]
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>{cid} {slug} {size}</title>
<link rel="stylesheet" href="ads.css">
<style>.vis>.inner{{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}}</style></head>
<body class="{size}"><div class="frame">
<div class="top"><img src="{LOGO}" alt="">Alphaa AI Agent<span class="url">alphaa.app</span></div>
<h1>{head}</h1>
<p class="sub">{sub}</p>
<div class="vis"><div class="inner">{V[vkey]}</div></div>
<div class="foot"><span>See what AI says about you</span><b>Free check: alphaa.app/start</b></div>
</div>{FIT_JS}</body></html>
"""


def main():
    jobs = []
    for cid, slug, head, sub, vkey in CONCEPTS:
        assert "—" not in head + sub + V[vkey], f"em-dash in {cid}"
        sizes = ["sq", "st"] + (["ls"] if cid in LANDSCAPE else [])
        for s in sizes:
            name = f"{cid}-{slug}-{s}"
            (HERE / f"{name}.html").write_text(page(cid, slug, head, sub, vkey, s))
            jobs.append(f"{name} {SIZES[s][0]} {SIZES[s][1]}")
    (HERE / "jobs.txt").write_text("\n".join(jobs) + "\n")
    print(f"{len(jobs)} pages")


if __name__ == "__main__":
    main()
