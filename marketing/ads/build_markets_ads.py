"""Paid-ads copy for the local market pages (UK, DE, FR, IT, UAE English, UAE Arabic).

Run: python3 marketing/ads/build_markets_ads.py  -> writes markets-ads-copy.md next to it.
Checks every platform limit and the Alphaa banned-words list; exits non-zero on a breach.
US + Canada copy stays in build_ads_copy.py.
"""
import re
import sys
from pathlib import Path

LIMITS = {"meta_headline": 40, "meta_desc": 30, "meta_short": 125, "g_head": 30, "g_desc": 90}

BANNED = [
    r"#1", r"\bbest\b", r"\bleading\b", r"free trial", r"no sign ?up", r"—",
    r"\bbeste[nr]?\b", r"kostenlos testen", r"testphase", r"probemonat",          # de
    r"\bmeilleur", r"essai gratuit", r"\bleader\b",                               # fr
    r"\bmigliore?\b", r"prova gratuita", r"\bperiodo di prova\b",                  # it
    r"الأفضل", r"تجربة مجانية", r"رقم 1",                                          # ar
    r"copilot", r"grok", r"\bgoogle ai\b",
]

UTM = "utm_source={src}&utm_medium={med}&utm_campaign=mkt_{key}_{camp}&utm_content={ad}"

MARKETS = [
    {
        "key": "uk", "name": "United Kingdom", "lang": "English (UK)", "geo": "United Kingdom",
        "home": "/uk", "industry": "/uk/dental-practices", "price": "£79",
        "meta": [
            {"id": "p01", "camp": "prospecting", "creative": "c01-phone-demo", "page": "home",
             "headline": "See what ChatGPT says about you", "desc": "Free check in about 60 seconds",
             "short": "Your customers ask ChatGPT who to ring. It names a few local firms. Are you one of them?",
             "long": "Someone near you just asked ChatGPT who to ring.\nIt gave one answer with three names.\n\nIf yours isn't one of them, that customer never knew you existed.\n\nI'm Alphaa, an AI Agent. I ask ChatGPT, Gemini, Claude and Perplexity the questions your customers ask, and show you the real answers in about 60 seconds. Free, no card."},
            {"id": "p02", "camp": "prospecting", "creative": "c05-dentists", "page": "industry",
             "headline": "Dental practices: is ChatGPT naming you?", "desc": "Free check in about 60 seconds",
             "short": "Patients ask ChatGPT for a dentist nearby. Does it name your practice, or the one down the road?",
             "long": "Patients now ask ChatGPT for a dentist nearby.\nIt names a few practices. Is yours one of them?\n\nI check ChatGPT, Gemini, Claude and Perplexity for you, show you who gets named instead, and fix what's missing. You approve everything first."},
            {"id": "r01", "camp": "retargeting", "creative": "c13-guarantee", "page": "home",
             "headline": "Named by AI in 90 days, or a month free", "desc": "From £79 a month",
             "short": "I find out why AI names a rival, fix it, and show you what I did. From £79 a month.",
             "long": "You've seen what ChatGPT says about you. Here's what I do next:\nI find out why AI names someone else, fix it, and tell you exactly what I did. Nothing goes live without your OK.\n\nFrom £79 a month, month to month, 7-day refund.\nIf no AI names you within 90 days, your next month is free. Terms apply."},
        ],
        "g_heads": ["Get Recommended by ChatGPT", "See What ChatGPT Says of You", "Free 60-Second AI Check",
                    "Your AI Agent Does the Work", "From £79 a Month", "Month to Month, 7-Day Refund",
                    "Checks ChatGPT and Gemini", "Also Claude and Perplexity", "Nothing Goes Live Without You",
                    "Built for UK Local Firms", "Named in 90 Days or Month Free", "For Dentists and Solicitors"],
        "g_descs": ["Your customers ask ChatGPT who to ring. See if it names you, free, in 60 seconds.",
                    "I find out why AI names a rival, fix it, and tell you what I did. You approve first.",
                    "From £79 a month, month to month. No AI names you in 90 days? Next month is free.",
                    "I check ChatGPT, Gemini, Claude and Perplexity every week and do the work to fix it."],
        "g_keywords": ["get recommended by chatgpt", "chatgpt seo uk", "ai search visibility", "how to appear in chatgpt answers", "ai seo for small business uk"],
    },
    {
        "key": "de", "name": "Germany", "lang": "German (Sie)", "geo": "Germany (add Austria later)",
        "home": "/de", "industry": "/de/zahnarzt", "price": "99 €",
        "meta": [
            {"id": "p01", "camp": "prospecting", "creative": "c01-phone-demo", "page": "home",
             "headline": "Was sagt ChatGPT über Ihren Betrieb?", "desc": "Gratis-Check in 60 Sekunden",
             "short": "Ihre Kunden fragen ChatGPT, wen sie anrufen sollen. Die KI nennt ein paar Betriebe. Sind Sie dabei?",
             "long": "Gerade hat jemand in Ihrer Nähe ChatGPT gefragt, wen er anrufen soll.\nDie Antwort: drei Namen.\n\nWenn Ihrer nicht dabei ist, erfährt dieser Kunde nie von Ihnen.\n\nIch bin Alphaa, ein KI-Agent. Ich stelle ChatGPT, Gemini, Claude und Perplexity die Fragen Ihrer Kunden und zeige Ihnen in etwa 60 Sekunden die echten Antworten. Kostenlos, ohne Kreditkarte."},
            {"id": "p02", "camp": "prospecting", "creative": "c05-dentists", "page": "industry",
             "headline": "Zahnarztpraxen: Nennt ChatGPT Sie?", "desc": "Gratis-Check in 60 Sekunden",
             "short": "Patienten fragen ChatGPT nach einem Zahnarzt in der Nähe. Nennt die KI Ihre Praxis oder eine andere?",
             "long": "Patienten fragen heute ChatGPT nach einem Zahnarzt in der Nähe.\nDie KI nennt ein paar Praxen. Ist Ihre dabei?\n\nIch prüfe ChatGPT, Gemini, Claude und Perplexity, zeige Ihnen, wer stattdessen genannt wird, und behebe, was fehlt. Nichts geht ohne Ihr OK online."},
            {"id": "r01", "camp": "retargeting", "creative": "c13-guarantee", "page": "home",
             "headline": "In 90 Tagen genannt oder Monat gratis", "desc": "Ab 99 € im Monat",
             "short": "Ich finde heraus, warum die KI die Konkurrenz nennt, behebe es und zeige Ihnen, was ich getan habe.",
             "long": "Sie haben gesehen, was ChatGPT über Sie sagt. So geht es weiter:\nIch finde heraus, warum die KI die Konkurrenz nennt, behebe es und sage Ihnen genau, was ich getan habe. Nichts geht ohne Ihr OK online.\n\nAb 99 € im Monat, monatlich kündbar, 7 Tage Geld-zurück.\nNennt Sie innerhalb von 90 Tagen keine KI, ist Ihr nächster Monat kostenlos. Es gelten Bedingungen."},
        ],
        "g_heads": ["Von ChatGPT empfohlen werden", "Was sagt ChatGPT über Sie?", "Kostenloser KI-Check",
                    "Ihr KI-Agent erledigt das", "Ab 99 € im Monat", "Monatlich kündbar",
                    "Prüft ChatGPT und Gemini", "Auch Claude und Perplexity", "Nichts geht ohne Ihr OK live",
                    "Für lokale Betriebe", "Ergebnis in 60 Sekunden", "Für Praxen und Handwerker"],
        "g_descs": ["Ihre Kunden fragen ChatGPT, wen sie anrufen. Prüfen Sie gratis, ob Sie genannt werden.",
                    "Ich finde heraus, warum die KI andere nennt, und behebe es. Sie geben alles frei.",
                    "Ab 99 € im Monat, monatlich kündbar. Keine KI nennt Sie in 90 Tagen? Monat gratis.",
                    "Ich prüfe jede Woche ChatGPT, Gemini, Claude und Perplexity und erledige die Arbeit."],
        "g_keywords": ["in chatgpt gefunden werden", "von chatgpt empfohlen werden", "ki sichtbarkeit unternehmen", "seo für chatgpt", "ki suche lokales unternehmen"],
    },
    {
        "key": "fr", "name": "France", "lang": "French (vous)", "geo": "France (add Belgium/Switzerland later)",
        "home": "/fr", "industry": "/fr/dentiste", "price": "99 €",
        "meta": [
            {"id": "p01", "camp": "prospecting", "creative": "c01-phone-demo", "page": "home",
             "headline": "Que dit ChatGPT de votre entreprise ?", "desc": "Vérification gratuite en 60 s",
             "short": "Vos clients demandent à ChatGPT qui appeler. Il cite quelques noms. Le vôtre en fait-il partie ?",
             "long": "Quelqu'un près de chez vous vient de demander à ChatGPT qui appeler.\nRéponse : trois noms.\n\nSi le vôtre n'y est pas, ce client ne saura jamais que vous existez.\n\nJe suis Alphaa, un agent IA. Je pose à ChatGPT, Gemini, Claude et Perplexity les questions de vos clients et je vous montre les vraies réponses en 60 secondes environ. Gratuit, sans carte bancaire."},
            {"id": "p02", "camp": "prospecting", "creative": "c05-dentists", "page": "industry",
             "headline": "Dentistes : ChatGPT vous cite-t-il ?", "desc": "Vérification gratuite en 60 s",
             "short": "Les patients demandent à ChatGPT un dentiste près de chez eux. Cite-t-il votre cabinet ou un autre ?",
             "long": "Les patients demandent maintenant à ChatGPT un dentiste près de chez eux.\nIl cite quelques cabinets. Le vôtre en fait-il partie ?\n\nJe vérifie ChatGPT, Gemini, Claude et Perplexity, je vous montre qui est cité à votre place et je corrige ce qui manque. Rien n'est publié sans votre accord."},
            {"id": "r01", "camp": "retargeting", "creative": "c13-guarantee", "page": "home",
             "headline": "Cité sous 90 jours, ou un mois offert", "desc": "À partir de 99 € par mois",
             "short": "Je découvre pourquoi l'IA cite un concurrent, je corrige et je vous montre ce que j'ai fait.",
             "long": "Vous avez vu ce que ChatGPT dit de vous. La suite :\nje découvre pourquoi l'IA cite un concurrent, je corrige et je vous dis exactement ce que j'ai fait. Rien n'est publié sans votre accord.\n\nÀ partir de 99 € par mois, sans engagement, remboursé sous 7 jours.\nSi aucune IA ne vous cite sous 90 jours, le mois suivant vous est offert. Conditions applicables."},
        ],
        "g_heads": ["Être recommandé par ChatGPT", "Que dit ChatGPT de vous ?", "Vérification IA gratuite",
                    "Votre agent IA fait le travail", "À partir de 99 € par mois", "Sans engagement",
                    "Vérifie ChatGPT et Gemini", "Et aussi Claude et Perplexity", "Rien n'est publié sans vous",
                    "Pour les entreprises locales", "Résultat en 60 secondes", "Dentistes, avocats, artisans"],
        "g_descs": ["Vos clients demandent à ChatGPT qui appeler. Vérifiez gratuitement s'il vous cite.",
                    "Je découvre pourquoi l'IA cite un concurrent et je corrige. Vous validez tout.",
                    "Dès 99 € par mois, sans engagement. Aucune IA ne vous cite en 90 jours ? Mois offert.",
                    "Chaque semaine, je vérifie ChatGPT, Gemini, Claude et Perplexity et je fais le travail."],
        "g_keywords": ["apparaître dans chatgpt", "être recommandé par chatgpt", "référencement ia", "seo chatgpt entreprise", "visibilité ia entreprise locale"],
    },
    {
        "key": "it", "name": "Italy", "lang": "Italian (tu)", "geo": "Italy",
        "home": "/it", "industry": "/it/dentisti", "price": "99 €",
        "meta": [
            {"id": "p01", "camp": "prospecting", "creative": "c01-phone-demo", "page": "home",
             "headline": "Cosa dice ChatGPT della tua attività?", "desc": "Controllo gratis in 60 secondi",
             "short": "I tuoi clienti chiedono a ChatGPT chi chiamare. Fa qualche nome. Il tuo c'è?",
             "long": "Qualcuno vicino a te ha appena chiesto a ChatGPT chi chiamare.\nRisposta: tre nomi.\n\nSe il tuo non c'è, quel cliente non saprà mai che esisti.\n\nSono Alphaa, un agente IA. Faccio a ChatGPT, Gemini, Claude e Perplexity le domande dei tuoi clienti e ti mostro le risposte vere in circa 60 secondi. Gratis, senza carta."},
            {"id": "p02", "camp": "prospecting", "creative": "c05-dentists", "page": "industry",
             "headline": "Dentisti: ChatGPT fa il tuo nome?", "desc": "Controllo gratis in 60 secondi",
             "short": "I pazienti chiedono a ChatGPT un dentista in zona. Fa il nome del tuo studio o di un altro?",
             "long": "I pazienti ora chiedono a ChatGPT un dentista in zona.\nFa il nome di qualche studio. Il tuo c'è?\n\nControllo ChatGPT, Gemini, Claude e Perplexity, ti mostro chi viene nominato al posto tuo e sistemo quello che manca. Niente va online senza il tuo ok."},
            {"id": "r01", "camp": "retargeting", "creative": "c13-guarantee", "page": "home",
             "headline": "Nominato entro 90 giorni o mese gratis", "desc": "Da 99 € al mese",
             "short": "Scopro perché l'IA consiglia un concorrente, lo sistemo e ti mostro cosa ho fatto. Da 99 € al mese.",
             "long": "Hai visto cosa dice ChatGPT di te. Ecco il passo successivo:\nscopro perché l'IA consiglia un concorrente, lo sistemo e ti dico esattamente cosa ho fatto. Niente va online senza il tuo ok.\n\nDa 99 € al mese, senza vincoli, rimborso entro 7 giorni.\nSe nessuna IA ti nomina entro 90 giorni, il mese successivo non lo paghi. Si applicano condizioni."},
        ],
        "g_heads": ["Fatti consigliare da ChatGPT", "Cosa dice ChatGPT di te?", "Controllo IA gratuito",
                    "Il tuo agente IA fa il lavoro", "Da 99 € al mese", "Disdici quando vuoi",
                    "Controlla ChatGPT e Gemini", "Anche Claude e Perplexity", "Niente online senza il tuo ok",
                    "Per le attività locali", "Risultato in 60 secondi", "Dentisti, avvocati, idraulici"],
        "g_descs": ["I tuoi clienti chiedono a ChatGPT chi chiamare. Scopri gratis se fa il tuo nome.",
                    "Scopro perché l'IA consiglia un concorrente e lo sistemo. Approvi tutto tu.",
                    "Da 99 € al mese, senza vincoli. Nessuna IA ti nomina in 90 giorni? Mese gratis.",
                    "Ogni settimana controllo ChatGPT, Gemini, Claude e Perplexity e faccio il lavoro."],
        "g_keywords": ["farsi consigliare da chatgpt", "apparire su chatgpt", "seo per chatgpt", "visibilità ia attività locale", "posizionamento intelligenza artificiale"],
    },
    {
        "key": "ae", "name": "UAE (English)", "lang": "English", "geo": "United Arab Emirates",
        "home": "/ae", "industry": "/ae/dental-clinics", "price": "AED 369",
        "meta": [
            {"id": "p01", "camp": "prospecting", "creative": "c01-phone-demo", "page": "home",
             "headline": "See what ChatGPT says about you", "desc": "Free check in about 60 seconds",
             "short": "Customers in Dubai ask ChatGPT for a dentist, a salon or a broker. It names a few. Are you one?",
             "long": "Someone in Dubai just asked ChatGPT for a clinic, a salon or a broker.\nIt gave one answer with three names.\n\nIf yours isn't one of them, that customer never knew you existed.\n\nI'm Alphaa, an AI Agent. I ask ChatGPT, Gemini, Claude and Perplexity the questions your customers ask, in English or Arabic, and show you the real answers in about 60 seconds. Free, no card."},
            {"id": "p02", "camp": "prospecting", "creative": "c05-dentists", "page": "industry",
             "headline": "Dental clinics: is ChatGPT naming you?", "desc": "Free check in about 60 seconds",
             "short": "Patients in Dubai ask ChatGPT for a dentist nearby. Does it name your clinic, or another one?",
             "long": "Patients in Dubai and Abu Dhabi now ask ChatGPT for a dentist nearby.\nIt names a few clinics. Is yours one of them?\n\nI check ChatGPT, Gemini, Claude and Perplexity, show you who gets named instead, and fix what's missing. You approve everything first."},
            {"id": "r01", "camp": "retargeting", "creative": "c13-guarantee", "page": "home",
             "headline": "Named by AI in 90 days, or a month free", "desc": "From AED 369 a month",
             "short": "I find out why AI names a rival, fix it, and show you what I did. From AED 369 a month.",
             "long": "You've seen what ChatGPT says about you. Here's what I do next:\nI find out why AI names someone else, fix it, and tell you exactly what I did. Nothing goes live without your OK.\n\nFrom AED 369 a month, month to month, 7-day refund.\nIf no AI names you within 90 days, your next month is free. Terms apply."},
        ],
        "g_heads": ["Get Recommended by ChatGPT", "See What ChatGPT Says of You", "Free 60-Second AI Check",
                    "Your AI Agent Does the Work", "From AED 369 a Month", "Month to Month, 7-Day Refund",
                    "Checks ChatGPT and Gemini", "Also Claude and Perplexity", "Nothing Goes Live Without You",
                    "Built for UAE Businesses", "English and Arabic Checks", "Clinics, Salons and Brokers"],
        "g_descs": ["Customers in Dubai ask ChatGPT who to call. See if it names you, free, in 60 seconds.",
                    "I find out why AI names a rival, fix it, and tell you what I did. You approve first.",
                    "From AED 369 a month, month to month. No AI names you in 90 days? Next month free.",
                    "I check ChatGPT, Gemini, Claude and Perplexity every week and do the work to fix it."],
        "g_keywords": ["get recommended by chatgpt dubai", "ai seo dubai", "chatgpt visibility uae", "appear in chatgpt answers", "ai search optimisation uae"],
    },
    {
        "key": "ar", "name": "UAE (Arabic)", "lang": "Arabic", "geo": "United Arab Emirates (Arabic speakers)",
        "home": "/ae/ar", "industry": "/ae/ar/dental-clinics", "price": "369 درهمًا",
        "meta": [
            {"id": "p01", "camp": "prospecting", "creative": "c01-phone-demo", "page": "home",
             "headline": "ماذا يقول ChatGPT عن نشاطك؟", "desc": "فحص مجاني في 60 ثانية",
             "short": "يسأل عملاؤك ChatGPT عن عيادة أو صالون أو وسيط عقاري. يذكر بعض الأسماء. هل اسمك بينها؟",
             "long": "سأل أحدهم في دبي ChatGPT للتو عن عيادة أو صالون أو وسيط عقاري.\nجاء الجواب بثلاثة أسماء.\n\nإن لم يكن اسمك بينها، فلن يعرف هذا العميل بوجودك.\n\nأنا Alphaa، وكيل ذكاء اصطناعي. أطرح على ChatGPT وGemini وClaude وPerplexity أسئلة عملائك بالعربية، وأعرض لك الإجابات الحقيقية خلال 60 ثانية تقريبًا. مجانًا، دون بطاقة."},
            {"id": "p02", "camp": "prospecting", "creative": "c05-dentists", "page": "industry",
             "headline": "عيادات الأسنان: هل يذكركم ChatGPT؟", "desc": "فحص مجاني في 60 ثانية",
             "short": "يسأل المرضى ChatGPT عن طبيب أسنان قريب. هل يذكر عيادتك أم عيادة أخرى؟",
             "long": "يسأل المرضى في دبي وأبوظبي ChatGPT اليوم عن طبيب أسنان قريب.\nيذكر بعض العيادات. هل عيادتك بينها؟\n\nأفحص ChatGPT وGemini وClaude وPerplexity، وأريك من يُذكر بدلًا منك، وأصلح ما ينقص. لا يُنشر شيء دون موافقتك."},
            {"id": "r01", "camp": "retargeting", "creative": "c13-guarantee", "page": "home",
             "headline": "تُذكر خلال 90 يومًا أو شهر مجاني", "desc": "ابتداءً من 369 درهمًا شهريًا",
             "short": "أكتشف لماذا يذكر الذكاء الاصطناعي منافسك، وأصلح ذلك، وأريك ما فعلت.",
             "long": "رأيت ما يقوله ChatGPT عنك. هذه خطوتي التالية:\nأكتشف لماذا يذكر الذكاء الاصطناعي منافسك، وأصلح ذلك، وأخبرك بما فعلته بالضبط. لا يُنشر شيء دون موافقتك.\n\nابتداءً من 369 درهمًا شهريًا، اشتراك شهري، واسترداد خلال 7 أيام.\nإذا لم يذكرك أي ذكاء اصطناعي خلال 90 يومًا، فالشهر التالي مجاني. تطبق الشروط."},
        ],
        "g_heads": ["اجعل ChatGPT يرشّح نشاطك", "ماذا يقول ChatGPT عنك؟", "فحص مجاني بالذكاء الاصطناعي",
                    "وكيلك الذكي يتولّى العمل", "من 369 درهمًا شهريًا", "اشتراك شهري، ألغِ متى شئت",
                    "يفحص ChatGPT وGemini", "وأيضًا Claude وPerplexity", "لا يُنشر شيء دون موافقتك",
                    "للأعمال المحلية في الإمارات", "النتيجة خلال 60 ثانية", "عيادات وصالونات ووسطاء"],
        "g_descs": ["يسأل عملاؤك ChatGPT عمّن يتصلون به. افحص مجانًا هل يذكرك خلال 60 ثانية.",
                    "أكتشف لماذا يذكر الذكاء الاصطناعي منافسك وأصلح ذلك. أنت توافق أولًا.",
                    "من 369 درهمًا شهريًا. لم يذكرك أي ذكاء اصطناعي خلال 90 يومًا؟ الشهر التالي مجاني.",
                    "كل أسبوع أفحص ChatGPT وGemini وClaude وPerplexity وأقوم بالعمل نيابةً عنك."],
        "g_keywords": ["الظهور في ChatGPT", "تحسين الظهور في الذكاء الاصطناعي", "سيو الذكاء الاصطناعي دبي", "ترشيح ChatGPT للشركات", "تسويق العيادات دبي"],
    },
]

errors = []


def check(label, text, limit=None):
    if limit and len(text) > limit:
        errors.append(f"{label}: {len(text)}/{limit} chars: {text}")
    for pat in BANNED:
        if re.search(pat, text, re.I):
            errors.append(f"{label}: banned '{pat}': {text}")


out = []
w = out.append
w("# Local-market paid ads (UK, DE, FR, IT, UAE)\n")
w("> Generated by `marketing/ads/build_markets_ads.py` (edit there and re-run; it checks every limit and banned word). "
  "Decision (Varun, 2026-10-30): **US and Canada first** for cold email and off-site links; the five local markets get **paid ads only**, sent to their local pages. "
  "US/Canada copy is in `meta-ads-copy.md` and `google-ads-copy.md`. Nothing here has been set up in any ad account, and nothing spends without Varun's OK.\n")
w("## Setup, every market\n")
w("| Item | Setting |\n|---|---|")
w("| Budget | **Varun to set.** Suggested test: ~$10/day per market on Meta for 14 days, Google Search only where a market's Meta ads produce checks. Start with UK and DE (largest), then FR, IT, UAE. |")
w("| Structure | One Meta campaign per market (separate budgets, separate learning). Geo = that country, language = the ad language. Advantage+ audience, age 30 to 65, exclude Audience Network. |")
w("| Optimization event | `Lead` (fires on the market home's check when the email is entered). Retargeting audiences as in `meta-ads-copy.md`, scoped to the market's URL path. |")
w("| EU/UK consent | The cookie banner blocks GA and the Meta pixel until Accept, so reported conversions will be lower than real ones. Judge by checks in our own database (`ScanLead` by market), not only by Ads Manager. |")
w("| EU ads on Meta (DSA) | Beneficiary and payer: **9629033 Canada Inc.** |")
w("| Prices in ads | Local prices only (they match the pages and Stripe). Annual plans and the setup fee are billed in USD, so don't quote those in ads. |")
w("| Report language | The check asks the AIs in the page's language, but the report and emails are in English (the pages say so). Don't promise a translated report. |")
w("| Creatives | Reuse `brand/ads/` images whose on-image text is language-neutral or English; for DE/FR/IT/AR, use the local-language LinkedIn images in `brand/social/posts/m_<key>_w<n>.png` until localized ad creatives are made. |")
w("")

for m in MARKETS:
    k = m["key"]
    w(f"## {m['name']} · {m['lang']}\n")
    w(f"- Geo: {m['geo']}. Landing: `https://alphaa.app{m['home']}` (core, retargeting) and `https://alphaa.app{m['industry']}` (industry ad).")
    w(f"- Price line: {m['price']} a month (Starter).\n")
    w("### Meta\n")
    for a in m["meta"]:
        lab = f"{k}/{a['id']}"
        check(lab + " headline", a["headline"], LIMITS["meta_headline"])
        check(lab + " desc", a["desc"], LIMITS["meta_desc"])
        check(lab + " short", a["short"], LIMITS["meta_short"])
        check(lab + " long", a["long"])
        path = m["home"] if a["page"] == "home" else m["industry"]
        url = f"https://alphaa.app{path}?" + UTM.format(src="facebook", med="paid_social", key=k, camp=a["camp"], ad=f"{a['id']}_{a['creative']}")
        w(f"#### {a['id'].upper()} · {a['camp']}\n")
        w(f"- **Creative:** `{a['creative']}` (see Creatives above)")
        w(f"- **Headline** ({len(a['headline'])}/40): {a['headline']}")
        w(f"- **Description** ({len(a['desc'])}/30): {a['desc']}")
        w(f"- **URL:** `{url}`")
        w(f"- **Primary text, short** ({len(a['short'])}/125):\n\n  > {a['short']}\n")
        w("- **Primary text, long:**\n")
        w("\n".join("  > " + l if l else "  >" for l in a["long"].split("\n")))
        w("")
    w("### Google Search (responsive search ad)\n")
    url = f"https://alphaa.app{m['home']}?" + UTM.format(src="google", med="cpc", key=k, camp="search", ad="rsa1")
    w(f"- **Final URL:** `{url}`")
    w(f"- **Language targeting:** {m['lang'].split(' ')[0]}. Search network only. Phrase match on the keywords below; add brand names of local competitors only after checking trademark rules.")
    w("- **Keywords:** " + ", ".join(f"\"{x}\"" for x in m["g_keywords"]))
    w("- **Headlines:**")
    for i, h in enumerate(m["g_heads"], 1):
        check(f"{k}/g head {i}", h, LIMITS["g_head"])
        w(f"  {i}. {h} ({len(h)}/30)")
    w("- **Descriptions:**")
    for i, d in enumerate(m["g_descs"], 1):
        check(f"{k}/g desc {i}", d, LIMITS["g_desc"])
        w(f"  {i}. {d} ({len(d)}/90)")
    w("")

if errors:
    print("\n".join(errors))
    sys.exit(1)
Path(__file__).with_name("markets-ads-copy.md").write_text("\n".join(out) + "\n")
print(f"OK: {len(MARKETS)} markets, {sum(len(m['meta']) for m in MARKETS)} Meta ads, {sum(len(m['g_heads']) for m in MARKETS)} Google headlines")
