// Local market pages: alphaa.app/uk, /de, /fr, /it, /ae. One entry per market;
// LocalHome renders them all. Copy follows the Alphaa voice rules: the agent
// speaks as "I", no "#1"/"best", no free trial (the check is free), outcomes
// as "can", prices are the real USD prices.

export type LocaleKey = "uk" | "de" | "fr" | "it" | "ae"

export interface LocaleCopy {
  key: LocaleKey
  path: string
  lang: string // html lang
  hreflang: string
  country: string
  title: string
  description: string
  h1a: string // before the rotating AI name
  h1b: string
  sub: string
  cta: string
  guarantee: [string, string] // plain, bold
  fine: string
  arrows: [string, string]
  greet: { lines: string[]; ask: string; hint: string; idleHint: string; startHere: string }
  pillarsTitle: string
  pillars: { title: string; body: string }[]
  whereTitle: string
  whereIntro: string
  where: { name: string; why: string }[]
  priceTitle: string
  priceSub: string
  priceItems: string[]
  priceCta: string
  priceNote: string
  faqTitle: string
  faq: { q: string; a: string }[]
  english: string
}

export const LOCALES: Record<LocaleKey, LocaleCopy> = {
  uk: {
    key: "uk",
    path: "/uk",
    lang: "en-GB",
    hreflang: "en-GB",
    country: "United Kingdom",
    title: "Get Recommended by ChatGPT & AI in the UK | Alphaa",
    description:
      "Alphaa is an AI Agent that gets UK businesses recommended by ChatGPT, Gemini, Claude and Perplexity. It does the work; you tap approve. Free check in 60 seconds.",
    h1a: "Get customers from",
    h1b: "Your AI agent does the work.",
    sub: "When someone in London, Manchester or Leeds asks AI who to call, I make sure your business is in the answer, then tell you exactly what I did.",
    cta: "Check my business free",
    guarantee: ["If no AI names you within 90 days,", "your next month is free."],
    fine: "No card needed. Checks ChatGPT, Gemini, Claude and Perplexity.",
    arrows: ["it's live, try it", "your real answers, in 60s"],
    greet: {
      startHere: "Start here",
      lines: ["Hi. I'm Alphaa, an AI agent.", "I get UK businesses recommended by ChatGPT, Gemini, Claude and Perplexity."],
      ask: "What's your website?",
      hint: "Nothing to install. No card. Just your website.",
      idleHint: "Type your website and press Enter. I'll ask ChatGPT, Gemini, Claude and Perplexity about you live, in about 60 seconds.",
    },
    pillarsTitle: "What I do for UK businesses",
    pillars: [
      { title: "I find out why AI names someone else", body: "Every week I ask the four AIs the questions your customers ask, the way people in your town ask them, and show you who gets named instead." },
      { title: "I do the work to fix it", body: "I write the pages and answers AI quotes, correct the facts it has wrong, and keep your Google listing and reviews active. You approve each change with one tap." },
      { title: "I show you what changed", body: "A short weekly briefing in plain English: what I did, what changed in the answers, and what needs your yes." },
    ],
    whereTitle: "Where AI looks you up in the UK",
    whereIntro: "Before AI recommends a business, it reads what other sites say about it. In the UK these matter most:",
    where: [
      { name: "Google Business Profile", why: "Your hours, reviews and category: the first thing AI checks." },
      { name: "Trustpilot and Google reviews", why: "Recent reviews tell AI you're active and trusted." },
      { name: "Yell, Checkatrade and Bark", why: "Trade directories AI often quotes for local services." },
      { name: "Your own website", why: "Clear service pages and answers in plain English that AI can quote." },
    ],
    priceTitle: "One AI Agent. Less than an agency's lunch budget.",
    priceSub: "Everything it takes to get named by AI, done for you.",
    priceItems: [
      "Weekly checks of what ChatGPT, Gemini, Claude and Perplexity say about you",
      "Your Google listing kept fresh: posts and review replies written for you",
      "Nothing goes live until you tap approve",
      "Month to month. Cancel in two clicks.",
      "If no AI names you within 90 days, your next month is free.",
    ],
    priceCta: "Get recommended by AI — $99/mo",
    priceNote: "$99 a month, billed in US dollars.",
    faqTitle: "Questions from UK businesses",
    faq: [
      { q: "Does Alphaa work for UK businesses?", a: "Yes. I ask ChatGPT, Gemini, Claude and Perplexity the questions customers in your area ask, check the UK sites AI reads (like Trustpilot, Yell and Checkatrade), and fix what's missing." },
      { q: "How much does it cost?", a: "$99 a month, billed in US dollars, month to month. Cancel in two clicks. The check on this page is free." },
      { q: "Do I need to know anything about marketing?", a: "No. I do the work and tell you what I did in plain English. If you can tap Approve, you can use Alphaa." },
      { q: "What about my data?", a: "We follow UK GDPR. We only use your website and public information to check what AI says, and you can ask us to delete your data at any time." },
    ],
    english: "Visiting from the US? Go to the main site",
  },

  de: {
    key: "de",
    path: "/de",
    lang: "de-DE",
    hreflang: "de-DE",
    country: "Deutschland",
    title: "Von ChatGPT & KI empfohlen werden | Alphaa",
    description:
      "Alphaa ist ein KI-Agent, der Ihr Unternehmen bei ChatGPT, Gemini, Claude und Perplexity empfehlen lässt. Er erledigt die Arbeit, Sie geben frei. Kostenloser Check.",
    h1a: "Neue Kunden über",
    h1b: "Ihr KI-Agent erledigt die Arbeit.",
    sub: "Wenn jemand in Berlin, München oder Hamburg eine KI fragt, wen er anrufen soll, sorge ich dafür, dass Ihr Unternehmen in der Antwort steht, und sage Ihnen genau, was ich getan habe.",
    cta: "Mein Unternehmen kostenlos prüfen",
    guarantee: ["Nennt Sie innerhalb von 90 Tagen keine KI,", "ist Ihr nächster Monat kostenlos."],
    fine: "Keine Kreditkarte nötig. Prüft ChatGPT, Gemini, Claude und Perplexity.",
    arrows: ["live, probieren Sie es", "Ihre echten Antworten in 60 s"],
    greet: {
      startHere: "Hier starten",
      lines: ["Hallo. Ich bin Alphaa, ein KI-Agent.", "Ich sorge dafür, dass ChatGPT, Gemini, Claude und Perplexity Ihr Unternehmen empfehlen."],
      ask: "Wie lautet Ihre Website?",
      hint: "Nichts zu installieren. Keine Karte. Nur Ihre Website. Den Bericht schreibe ich vorerst auf Englisch.",
      idleHint: "Website eingeben und Enter drücken. Ich frage ChatGPT, Gemini, Claude und Perplexity live nach Ihnen, in etwa 60 Sekunden. Den Bericht schreibe ich vorerst auf Englisch.",
    },
    pillarsTitle: "Was ich für Unternehmen in Deutschland tue",
    pillars: [
      { title: "Ich finde heraus, warum die KI jemand anderen nennt", body: "Jede Woche stelle ich den vier KIs die Fragen, die Ihre Kunden stellen, auf Deutsch und so, wie man in Ihrer Stadt fragt, und zeige Ihnen, wer stattdessen genannt wird." },
      { title: "Ich erledige die Arbeit", body: "Ich schreibe die Seiten und Antworten, die KI zitiert, korrigiere falsche Angaben und halte Ihr Google-Profil und Ihre Bewertungen aktiv. Jede Änderung geben Sie mit einem Tipp frei." },
      { title: "Ich zeige Ihnen, was sich geändert hat", body: "Ein kurzes wöchentliches Briefing in klarer Sprache: was ich getan habe, was sich in den Antworten geändert hat und was Ihr OK braucht." },
    ],
    whereTitle: "Wo KI Sie in Deutschland nachschlägt",
    whereIntro: "Bevor eine KI ein Unternehmen empfiehlt, liest sie, was andere Seiten darüber sagen. In Deutschland zählen vor allem:",
    where: [
      { name: "Google Unternehmensprofil", why: "Öffnungszeiten, Bewertungen und Kategorie: das Erste, was KI prüft." },
      { name: "Gelbe Seiten und Das Örtliche", why: "Verzeichnisse, die KI für lokale Anbieter häufig liest." },
      { name: "Jameda, ProvenExpert und Trustpilot", why: "Bewertungsportale, je nach Branche, die Vertrauen signalisieren." },
      { name: "Ihre eigene Website", why: "Klare Leistungsseiten und Antworten auf Deutsch, die KI zitieren kann." },
    ],
    priceTitle: "Ein KI-Agent. Statt einer Agentur.",
    priceSub: "Alles, was nötig ist, damit KI Sie nennt, für Sie erledigt.",
    priceItems: [
      "Wöchentliche Prüfung, was ChatGPT, Gemini, Claude und Perplexity über Sie sagen",
      "Ihr Google-Profil bleibt aktiv: Beiträge und Antworten auf Bewertungen für Sie geschrieben",
      "Nichts geht online, bevor Sie freigeben",
      "Monatlich kündbar, mit zwei Klicks.",
      "Nennt Sie innerhalb von 90 Tagen keine KI, ist Ihr nächster Monat kostenlos.",
    ],
    priceCta: "Von KI empfohlen werden — 99 $/Monat",
    priceNote: "99 $ pro Monat, Abrechnung in US-Dollar.",
    faqTitle: "Fragen von Unternehmen in Deutschland",
    faq: [
      { q: "Funktioniert Alphaa für Unternehmen in Deutschland?", a: "Ja. Ich stelle ChatGPT, Gemini, Claude und Perplexity die Fragen, die Kunden in Ihrer Region stellen, auf Deutsch, prüfe die Seiten, die KI liest (etwa Gelbe Seiten und Ihr Google-Profil), und behebe, was fehlt." },
      { q: "Was kostet es?", a: "99 $ pro Monat, abgerechnet in US-Dollar, monatlich kündbar mit zwei Klicks. Der Check auf dieser Seite ist kostenlos." },
      { q: "Ist Alphaa DSGVO-konform?", a: "Wir verarbeiten nur Ihre Website und öffentliche Informationen, um zu prüfen, was KI über Sie sagt. Cookies für Statistik und Werbung setzen wir erst nach Ihrer Zustimmung, und Sie können jederzeit die Löschung Ihrer Daten verlangen." },
      { q: "Ist das Produkt auf Deutsch?", a: "Der Check fragt die KIs auf Deutsch. Bericht und Briefing schreibe ich vorerst auf Englisch; die deutsche Version folgt." },
    ],
    english: "English version",
  },

  fr: {
    key: "fr",
    path: "/fr",
    lang: "fr-FR",
    hreflang: "fr-FR",
    country: "France",
    title: "Être recommandé par ChatGPT et l’IA | Alphaa",
    description:
      "Alphaa est un agent IA qui fait recommander votre entreprise par ChatGPT, Gemini, Claude et Perplexity. Il fait le travail, vous validez. Vérification gratuite.",
    h1a: "Des clients grâce à",
    h1b: "Votre agent IA fait le travail.",
    sub: "Quand quelqu’un à Paris, Lyon ou Marseille demande à une IA qui appeler, je fais en sorte que votre entreprise soit dans la réponse, puis je vous dis exactement ce que j’ai fait.",
    cta: "Vérifier mon entreprise gratuitement",
    guarantee: ["Si aucune IA ne vous cite sous 90 jours,", "votre mois suivant est offert."],
    fine: "Sans carte bancaire. Vérifie ChatGPT, Gemini, Claude et Perplexity.",
    arrows: ["c’est en direct, essayez", "vos vraies réponses en 60 s"],
    greet: {
      startHere: "Commencez ici",
      lines: ["Bonjour. Je suis Alphaa, un agent IA.", "Je fais recommander votre entreprise par ChatGPT, Gemini, Claude et Perplexity."],
      ask: "Quel est votre site web ?",
      hint: "Rien à installer. Pas de carte. Juste votre site. Le rapport est en anglais pour l’instant.",
      idleHint: "Tapez votre site et appuyez sur Entrée. J’interroge ChatGPT, Gemini, Claude et Perplexity en direct, en 60 secondes environ. Le rapport est en anglais pour l’instant.",
    },
    pillarsTitle: "Ce que je fais pour les entreprises en France",
    pillars: [
      { title: "Je découvre pourquoi l’IA cite quelqu’un d’autre", body: "Chaque semaine, je pose aux quatre IA les questions de vos clients, en français et comme on les pose dans votre ville, et je vous montre qui est cité à votre place." },
      { title: "Je fais le travail", body: "J’écris les pages et les réponses que l’IA reprend, je corrige les informations erronées et je garde votre fiche Google et vos avis actifs. Vous validez chaque changement d’un geste." },
      { title: "Je vous montre ce qui a changé", body: "Un court point hebdomadaire, en langage clair : ce que j’ai fait, ce qui a changé dans les réponses et ce qui attend votre accord." },
    ],
    whereTitle: "Où l’IA se renseigne sur vous en France",
    whereIntro: "Avant de recommander une entreprise, l’IA lit ce que d’autres sites en disent. En France, ce qui compte le plus :",
    where: [
      { name: "Fiche d’établissement Google", why: "Horaires, avis et catégorie : la première chose que l’IA vérifie." },
      { name: "PagesJaunes", why: "L’annuaire que l’IA consulte souvent pour les services locaux." },
      { name: "Doctolib, Trustpilot et avis Google", why: "Selon votre métier, les plateformes d’avis qui inspirent confiance." },
      { name: "Votre propre site", why: "Des pages de services claires et des réponses en français que l’IA peut citer." },
    ],
    priceTitle: "Un agent IA. À la place d’une agence.",
    priceSub: "Tout ce qu’il faut pour être cité par l’IA, fait pour vous.",
    priceItems: [
      "Vérification chaque semaine de ce que disent ChatGPT, Gemini, Claude et Perplexity",
      "Votre fiche Google reste active : publications et réponses aux avis rédigées pour vous",
      "Rien n’est publié sans votre accord",
      "Sans engagement. Résiliation en deux clics.",
      "Si aucune IA ne vous cite sous 90 jours, votre mois suivant est offert.",
    ],
    priceCta: "Être recommandé par l’IA — 99 $/mois",
    priceNote: "99 $ par mois, facturés en dollars américains.",
    faqTitle: "Questions des entreprises en France",
    faq: [
      { q: "Alphaa fonctionne-t-il pour les entreprises françaises ?", a: "Oui. Je pose à ChatGPT, Gemini, Claude et Perplexity les questions de vos clients, en français, je vérifie les sites que l’IA lit (comme PagesJaunes et votre fiche Google) et je corrige ce qui manque." },
      { q: "Combien ça coûte ?", a: "99 $ par mois, facturés en dollars américains, sans engagement, résiliation en deux clics. La vérification sur cette page est gratuite." },
      { q: "Et le RGPD ?", a: "Nous n’utilisons que votre site et des informations publiques pour vérifier ce que dit l’IA. Les cookies de mesure et de publicité ne sont déposés qu’avec votre accord, et vous pouvez demander la suppression de vos données à tout moment." },
      { q: "Le produit est-il en français ?", a: "La vérification interroge les IA en français. Le rapport et le point hebdomadaire sont en anglais pour l’instant ; la version française arrive." },
    ],
    english: "English version",
  },

  it: {
    key: "it",
    path: "/it",
    lang: "it-IT",
    hreflang: "it-IT",
    country: "Italia",
    title: "Fatti consigliare da ChatGPT e dall’IA | Alphaa",
    description:
      "Alphaa è un agente IA che fa consigliare la tua attività da ChatGPT, Gemini, Claude e Perplexity. Fa il lavoro, tu approvi. Controllo gratuito in 60 secondi.",
    h1a: "Nuovi clienti da",
    h1b: "Il tuo agente IA fa il lavoro.",
    sub: "Quando qualcuno a Milano, Roma o Napoli chiede a un’IA chi chiamare, faccio in modo che la tua attività sia nella risposta, e poi ti dico esattamente cosa ho fatto.",
    cta: "Controlla la mia attività gratis",
    guarantee: ["Se nessuna IA ti nomina entro 90 giorni,", "il mese successivo è gratis."],
    fine: "Nessuna carta richiesta. Controlla ChatGPT, Gemini, Claude e Perplexity.",
    arrows: ["è dal vivo, provalo", "le tue risposte reali in 60 s"],
    greet: {
      startHere: "Inizia qui",
      lines: ["Ciao. Sono Alphaa, un agente IA.", "Faccio consigliare la tua attività da ChatGPT, Gemini, Claude e Perplexity."],
      ask: "Qual è il tuo sito web?",
      hint: "Niente da installare. Nessuna carta. Solo il tuo sito. Per ora il report è in inglese.",
      idleHint: "Scrivi il tuo sito e premi Invio. Chiedo a ChatGPT, Gemini, Claude e Perplexity di te dal vivo, in circa 60 secondi. Per ora il report è in inglese.",
    },
    pillarsTitle: "Cosa faccio per le attività in Italia",
    pillars: [
      { title: "Scopro perché l’IA nomina qualcun altro", body: "Ogni settimana faccio alle quattro IA le domande dei tuoi clienti, in italiano e come le fanno nella tua città, e ti mostro chi viene nominato al posto tuo." },
      { title: "Faccio il lavoro", body: "Scrivo le pagine e le risposte che l’IA cita, correggo le informazioni sbagliate e tengo attivi il profilo Google e le recensioni. Approvi ogni modifica con un tocco." },
      { title: "Ti mostro cosa è cambiato", body: "Un breve riepilogo settimanale, in parole semplici: cosa ho fatto, cosa è cambiato nelle risposte e cosa aspetta il tuo ok." },
    ],
    whereTitle: "Dove l’IA cerca informazioni su di te in Italia",
    whereIntro: "Prima di consigliare un’attività, l’IA legge cosa ne dicono altri siti. In Italia contano soprattutto:",
    where: [
      { name: "Profilo dell’attività su Google", why: "Orari, recensioni e categoria: la prima cosa che l’IA controlla." },
      { name: "PagineGialle", why: "L’elenco che l’IA legge spesso per i servizi locali." },
      { name: "MioDottore, TripAdvisor e Trustpilot", why: "A seconda del settore, i portali di recensioni che danno fiducia." },
      { name: "Il tuo sito", why: "Pagine dei servizi chiare e risposte in italiano che l’IA può citare." },
    ],
    priceTitle: "Un agente IA. Al posto di un’agenzia.",
    priceSub: "Tutto ciò che serve per farti nominare dall’IA, fatto per te.",
    priceItems: [
      "Controllo settimanale di cosa dicono di te ChatGPT, Gemini, Claude e Perplexity",
      "Il tuo profilo Google resta attivo: post e risposte alle recensioni scritti per te",
      "Niente va online senza il tuo ok",
      "Senza vincoli. Disdici in due clic.",
      "Se nessuna IA ti nomina entro 90 giorni, il mese successivo è gratis.",
    ],
    priceCta: "Fatti consigliare dall’IA — 99 $/mese",
    priceNote: "99 $ al mese, addebitati in dollari USA.",
    faqTitle: "Domande dalle attività in Italia",
    faq: [
      { q: "Alphaa funziona per le attività italiane?", a: "Sì. Faccio a ChatGPT, Gemini, Claude e Perplexity le domande dei tuoi clienti, in italiano, controllo i siti che l’IA legge (come PagineGialle e il tuo profilo Google) e sistemo ciò che manca." },
      { q: "Quanto costa?", a: "99 $ al mese, addebitati in dollari USA, senza vincoli, disdetta in due clic. Il controllo in questa pagina è gratuito." },
      { q: "E il GDPR?", a: "Usiamo solo il tuo sito e informazioni pubbliche per verificare cosa dice l’IA. I cookie di statistica e pubblicità vengono salvati solo con il tuo consenso, e puoi chiedere la cancellazione dei tuoi dati in qualsiasi momento." },
      { q: "Il prodotto è in italiano?", a: "Il controllo interroga le IA in italiano. Per ora report e riepilogo settimanale sono in inglese; la versione italiana è in arrivo." },
    ],
    english: "English version",
  },

  ae: {
    key: "ae",
    path: "/ae",
    lang: "en-AE",
    hreflang: "en-AE",
    country: "United Arab Emirates",
    title: "Get Recommended by ChatGPT & AI in Dubai & UAE | Alphaa",
    description:
      "Alphaa is an AI Agent that gets businesses in Dubai, Abu Dhabi and across the UAE recommended by ChatGPT, Gemini, Claude and Perplexity. Free check in 60 seconds.",
    h1a: "Get customers from",
    h1b: "Your AI agent does the work.",
    sub: "When someone in Dubai, Abu Dhabi or Sharjah asks AI for a clinic, a salon or a contractor, I make sure your business is in the answer, then tell you exactly what I did.",
    cta: "Check my business free",
    guarantee: ["If no AI names you within 90 days,", "your next month is free."],
    fine: "No card needed. Checks ChatGPT, Gemini, Claude and Perplexity.",
    arrows: ["it's live, try it", "your real answers, in 60s"],
    greet: {
      startHere: "Start here",
      lines: ["Hi. I'm Alphaa, an AI agent.", "I get businesses in the UAE recommended by ChatGPT, Gemini, Claude and Perplexity."],
      ask: "What's your website?",
      hint: "Nothing to install. No card. Just your website.",
      idleHint: "Type your website and press Enter. I'll ask ChatGPT, Gemini, Claude and Perplexity about you live, in about 60 seconds.",
    },
    pillarsTitle: "What I do for businesses in the UAE",
    pillars: [
      { title: "I find out why AI names someone else", body: "Every week I ask the four AIs the questions your customers ask in Dubai, Abu Dhabi and beyond, and show you who gets named instead." },
      { title: "I do the work to fix it", body: "I write the pages and answers AI quotes, correct the facts it has wrong, and keep your Google listing and reviews active. You approve each change with one tap." },
      { title: "I show you what changed", body: "A short weekly briefing in plain English: what I did, what changed in the answers, and what needs your yes." },
    ],
    whereTitle: "Where AI looks you up in the UAE",
    whereIntro: "Before AI recommends a business, it reads what other sites say about it. In the UAE these matter most:",
    where: [
      { name: "Google Business Profile", why: "Your location, hours, reviews and category: the first thing AI checks." },
      { name: "Google reviews and TripAdvisor", why: "Recent reviews tell AI you're active and trusted." },
      { name: "Industry platforms", why: "Booking and listing sites for your field, such as clinic booking or property portals." },
      { name: "Your own website", why: "Clear service pages with your area, prices and answers AI can quote." },
    ],
    priceTitle: "One AI Agent. Instead of an agency.",
    priceSub: "Everything it takes to get named by AI, done for you.",
    priceItems: [
      "Weekly checks of what ChatGPT, Gemini, Claude and Perplexity say about you",
      "Your Google listing kept fresh: posts and review replies written for you",
      "Nothing goes live until you tap approve",
      "Month to month. Cancel in two clicks.",
      "If no AI names you within 90 days, your next month is free.",
    ],
    priceCta: "Get recommended by AI — $99/mo",
    priceNote: "$99 a month, billed in US dollars.",
    faqTitle: "Questions from UAE businesses",
    faq: [
      { q: "Does Alphaa work for businesses in Dubai and Abu Dhabi?", a: "Yes. I ask ChatGPT, Gemini, Claude and Perplexity the questions customers in your emirate ask, check the sites AI reads about you, and fix what's missing." },
      { q: "How much does it cost?", a: "$99 a month, billed in US dollars, month to month. Cancel in two clicks. The check on this page is free." },
      { q: "Does it work in Arabic?", a: "The check and your weekly briefing are in English today. If your website is in Arabic, I ask the AIs in Arabic." },
      { q: "Do I need to know anything about marketing?", a: "No. I do the work and tell you what I did in plain English. If you can tap Approve, you can use Alphaa." },
    ],
    english: "Visiting from the US? Go to the main site",
  },
}

export const LOCALE_LIST: LocaleCopy[] = Object.values(LOCALES)

/** hreflang map for the homepage and every market page. */
export const HREFLANG: Record<string, string> = {
  "en-US": "/",
  ...Object.fromEntries(LOCALE_LIST.map((l) => [l.hreflang, l.path])),
  "x-default": "/",
}
