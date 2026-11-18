import type { Market } from "./types"

export const market: Market = {
  copy: {
    key: "de",
    path: "/de",
    lang: "de-DE",
    hreflang: "de-DE",
    country: "Deutschland",
    title: "KI-Agent für Ihr gesamtes Marketing | Alphaa",
    description:
      "Alphaa ist ein KI-Agent, der Ihr Marketing übernimmt: Google-Beiträge, Blog, Bewertungen, SEO und Empfehlungen durch ChatGPT. Social Media mit Pro, Ads und E-Mail mit Growth.",
    h1a: "Ihr gesamtes Marketing,",
    h1b: "erledigt von einem KI-Agenten.",
    sub: "Keine Agenturrechnung, keine Abende mit Beiträgen. Ich schreibe Ihre Inhalte, beantworte Bewertungen, mache Ihre Website fit für Google und ChatGPT und schicke Ihnen eine kurze Liste zur Freigabe. Sie gewinnen Zeit für die Arbeit, die Geld bringt.",
    cta: "Jetzt starten",
    guarantee: ["Nennt Sie bis Tag 90 bei aktiven Wochenchecks keine KI,", "geht der nächste Monat auf uns."],
    fine: "Der erste Check ist kostenlos. Keine Kreditkarte nötig. Monatlich kündbar.",
    arrows: ["läuft live, probieren Sie es", "Ihre echten Antworten in 60 Sekunden"],
    greet: {
      work: { title: "Was ich jede Woche für Sie erledige", steps: ["Beiträge für Ihr Google Unternehmensprofil und Blogartikel schreiben, in Ihrem Ton", "Antworten auf Ihre Bewertungen entwerfen", "Ihre Website so verbessern, dass Google und KI sie verstehen", "Prüfen, was ChatGPT, Gemini, Claude und Perplexity über Sie sagen", "Ihnen ein kurzes Wochenbriefing schicken: was erledigt ist, was auf Ihr OK wartet"] },
      startHere: "Hier starten",
      lines: [
        "Guten Tag. Ich bin Alphaa, ein KI-Agent.",
        "Ich übernehme das Marketing für kleine Betriebe, damit Sie es nicht müssen.",
      ],
      ask: "Wie lautet Ihre Website?",
      hint: "Nichts installieren, keine Karte, nur Ihre Website. Ich frage die KIs auf Deutsch; den Bericht schreibe ich vorerst auf Englisch.",
      idleHint:
        "Website eingeben und Enter drücken. Ich starte mit einem Live-Check, was Google und KI auf Deutsch über Sie sagen, in etwa 60 Sekunden. Den Bericht schreibe ich vorerst auf Englisch.",
    },
    pillarsTitle: "Ihr Marketing, für Sie erledigt",
    pillars: [
      {
        title: "Ich halte Sie jede Woche sichtbar",
        body: "Beiträge für Ihr Google Unternehmensprofil, Blogartikel und Antworten auf Bewertungen, in Ihrem Ton geschrieben. Kunden sehen einen Betrieb, der aktiv ist und gut zu tun hat.",
      },
      {
        title: "Ich sorge dafür, dass man Sie findet",
        body: "Ich bringe Website, strukturierte Daten und Angaben in Ordnung, damit Google, ChatGPT, Gemini, Claude und Perplexity Sie nennen können. Jede Woche prüfe ich, wen sie statt Ihnen nennen.",
      },
      {
        title: "Social Media mit Pro. Anzeigen und E-Mail mit Growth",
        body: "Ab dem Pro-Tarif schreibe ich auch Ihre Social-Media-Beiträge mit Bildern in Ihrem Markendesign. Im Growth-Tarif (Early Access) baue ich zusätzlich Google- und Meta-Anzeigen pausiert zur Budgetfreigabe auf und schicke E-Mails, die frühere Kunden zurückholen. Freigeschaltet, sobald die Plattformen zustimmen.",
      },
    ],
    whereTitle: "Wo Kunden und KI Sie in Deutschland nachschlagen",
    whereIntro:
      "Bevor jemand anruft, schaut er nach, was im Netz über Sie steht. Die KI macht es genauso. In Deutschland zählen vor allem diese Quellen, und ich halte sie aktuell:",
    where: [
      { name: "Google Unternehmensprofil", why: "Adresse, Öffnungszeiten, Kategorie und Bewertungen: das Erste, was die KI abgleicht." },
      { name: "Gelbe Seiten, Das Örtliche und 11880", why: "Die klassischen Branchenverzeichnisse. Stimmen dort Nummer oder Adresse nicht, zweifelt die KI." },
      { name: "Jameda, Doctolib, anwalt.de, MyHammer und ProvenExpert", why: "Die Bewertungsportale Ihrer Branche zeigen der KI, dass Kunden Ihnen vertrauen." },
      { name: "Ihre eigene Website", why: "Klare Leistungsseiten und Antworten auf Deutsch, die die KI wörtlich übernehmen kann." },
    ],
    priceTitle: "Ein KI-Agent statt einer Agentur.",
    priceSub: "Ihr wöchentliches Marketing, erledigt. Online geht nur, was Sie freigeben.",
    priceItems: [
      "Beiträge für Ihr Google Unternehmensprofil, Blogartikel und Antworten auf Bewertungen, in Ihrem Ton",
      "Ihre Website fit für Google und KI-Suche, mit Wochenchecks, was ChatGPT, Gemini, Claude und Perplexity über Sie sagen",
      "Ein kurzes Wochenbriefing, jede Änderung mit einem Tipp freigegeben",
      "Pro mit Social Media für bis zu 3 Standorte: {pro} im Monat. Growth mit Anzeigen und E-Mail: {growth} im Monat (Early Access).",
      "Growth-Tarif (Early Access): alles aus Pro, dazu Google- und Meta-Anzeigen, E-Mail und Lead-Tracking. Das Werbebudget zahlen Sie direkt an Google und Meta, ohne Aufschlag.",
      "Monatlich kündbar, online in einer Minute. 7 Tage Geld zurück auf die erste Abbuchung.",
      "Nennt Sie bis Tag 90 bei aktiven Wochenchecks keine KI, ist der nächste Monat kostenlos.",
    ],
    priceCta: "Jetzt starten: {starter}/Monat",
    priceNote: "Monatliche Abrechnung, jederzeit zum Monatsende kündbar. Weitere Marken 50 % günstiger. Nur für Unternehmen (B2B). Wir sind nicht umsatzsteuerlich registriert und berechnen keine USt.; fällt USt. an, schulden Sie sie im Reverse-Charge-Verfahren.",
    faqTitle: "Fragen von Betrieben in Deutschland",
    faq: [
      {
        q: "Was genau macht Alphaa für einen Betrieb in Deutschland?",
        a: "Ich übernehme Ihr Marketing Woche für Woche: Beiträge für Ihr Google Unternehmensprofil, Blogartikel, Antworten auf Bewertungen und Verbesserungen an Ihrer Website. Dazu prüfe ich auf Deutsch, was ChatGPT, Gemini, Claude und Perplexity über Sie sagen und was auf Gelbe Seiten oder Jameda steht. Social Media gibt es ab dem Pro-Tarif, Anzeigen und E-Mail im Growth-Tarif, derzeit im Early Access.",
      },
      {
        q: "Was kostet das?",
        a: "Starter kostet {starter} im Monat, Pro {pro} im Monat (Social Media, bis zu 3 Standorte). Growth mit Anzeigen und E-Mail kostet {growth} im Monat (Early Access). Monatlich online in einer Minute kündbar, 7 Tage Geld zurück auf die erste Abbuchung. Der Check auf dieser Seite ist kostenlos.",
      },
      {
        q: "Muss ich mich mit Marketing auskennen?",
        a: "Nein. Genau dafür gibt es mich. Ich mache das Marketing und erkläre Ihnen in klaren Worten, was ich getan habe. Wenn Sie auf „Freigeben“ tippen können, können Sie Alphaa nutzen.",
      },
      {
        q: "Ist Alphaa DSGVO-konform?",
        a: "Ich nutze nur Ihre Website und öffentliche Informationen, um zu prüfen, was die KI über Sie sagt. Cookies für Statistik und Werbung setzen wir erst nach Ihrer Einwilligung, und Sie können jederzeit die Löschung Ihrer Daten verlangen.",
      },
      {
        q: "Gibt es Alphaa auf Deutsch?",
        a: "Der Check fragt die KIs auf Deutsch, und die Texte für Ihre Website und Ihr Google-Profil schreibe ich auf Deutsch. Bericht und wöchentliches Briefing schreibe ich vorerst auf Englisch; die deutsche Fassung folgt.",
      },
    ],
    english: "English version",
  },
  extra: {
    questionsTitle: "Das fragen Menschen in Deutschland heute die KI",
    questionsIntro:
      "Statt zu googeln, tippen immer mehr Leute ihre Frage direkt in ChatGPT, ganz konkret, mit Stadtteil und Wunschtermin. Die KI nennt dann ein, zwei, drei Namen. Dass Ihrer dabei ist, gehört zu dem Marketing, das ich für Sie mache.",
    questions: [
      { q: "Welcher Zahnarzt in München-Schwabing nimmt noch neue Patienten auf und ist gut bei Angstpatienten?", who: "Patientin, München" },
      { q: "Unsere Gastherme in Köln-Ehrenfeld ist ausgefallen. Welcher Heizungsbauer kommt noch diese Woche?", who: "Hausbesitzer, Köln" },
      { q: "Ich brauche einen Fachanwalt für Arbeitsrecht in Frankfurt, mir wurde gekündigt. Wen kannst du empfehlen?", who: "Angestellter, Frankfurt am Main" },
      { q: "Physiotherapie in Leipzig mit freien Terminen, ich habe ein Rezept für Krankengymnastik.", who: "Patient, Leipzig" },
      { q: "Wer baut in Stuttgart ein Bad barrierefrei um und hat gute Bewertungen?", who: "Eigentümerin, Stuttgart" },
    ],
    industriesTitle: "Für Praxen, Kanzleien und Handwerksbetriebe",
    industriesIntro:
      "Am meisten bringt es dort, wo ein einziger neuer Kunde viel wert ist: ein neuer Patient, ein neues Mandat, eine neue Heizung.",
    industryLinkPrefix: "Mehr für",
    industries: [
      {
        slug: "zahnarzt",
        name: "Zahnärzte",
        title: "KI-Marketing für Zahnarztpraxen: Google und ChatGPT",
        description:
          "Ein KI-Agent übernimmt das Marketing Ihrer Praxis: Google-Beiträge, Bewertungen, Leistungsseiten und Empfehlungen durch ChatGPT. Sie geben alles frei.",
        h1: "Das Marketing Ihrer Zahnarztpraxis, erledigt von einem KI-Agenten",
        sub: "Patienten suchen ihren Zahnarzt bei Google, auf Jameda und inzwischen bei ChatGPT. Ich halte all das für Ihre Praxis in Schuss, damit Sie sich um Ihre Patienten kümmern können.",
        questions: [
          "Welcher Zahnarzt in Berlin-Prenzlauer Berg nimmt noch neue Kassenpatienten auf?",
          "Guter Zahnarzt für Angstpatienten in Hamburg-Eimsbüttel, am liebsten mit Behandlung unter Sedierung?",
          "Wo bekomme ich in Düsseldorf Implantate zu einem fairen Preis, und welche Praxis hat gute Bewertungen?",
        ],
        where: [
          { name: "Jameda", why: "Das Arztbewertungsportal, das die KI bei Zahnärzten am häufigsten liest: Noten, Bewertungen, Schwerpunkte." },
          { name: "Doctolib", why: "Zeigt der KI, dass Sie online buchbar sind und neue Patienten annehmen." },
          { name: "Google Unternehmensprofil", why: "Öffnungszeiten, Notdienst-Hinweise und aktuelle Bewertungen, die die KI direkt abgleicht." },
          { name: "Ihre Praxis-Website", why: "Seiten zu Leistungen wie Implantaten, Prophylaxe oder Angstpatienten, die die KI zitieren kann." },
        ],
        steps: [
          { title: "Ich übernehme das wöchentliche Marketing", body: "Beiträge für Ihr Google Unternehmensprofil, Blogartikel zu den Leistungen, die Sie stärken wollen, und Antwortentwürfe auf Bewertungen, alles zur Freigabe. Social Media gibt es mit Pro, Anzeigen und E-Mail mit Growth im Early Access." },
          {
            title: "Ich schreibe die Antworten, die die KI zitiert",
            body: "Ich entwerfe sachliche Seiten und FAQ-Antworten zu Ihren Leistungen, etwa zu Kosten, Ablauf oder Behandlung von Angstpatienten. Sie prüfen jeden Satz, bevor er online geht.",
          },
          {
            title: "Ich halte Ihre Angaben überall gleich",
            body: "Ich gleiche Telefonnummer, Sprechzeiten und Adresse mit Google, Jameda und den Verzeichnissen ab und beantworte Bewertungen in Ihrem Namen, natürlich ohne Patientendaten.",
          },
        ],
        faq: [
          {
            q: "Ist das mit dem Heilmittelwerbegesetz und der Berufsordnung vereinbar?",
            a: "Ich schreibe sachlich und informativ, ohne Heilversprechen und ohne Vorher-nachher-Werbung. Jeder Text geht erst nach Ihrer Freigabe online, und die berufsrechtliche Verantwortung bleibt bei Ihnen.",
          },
          {
            q: "Antworten Sie auf Bewertungen, ohne die Schweigepflicht zu verletzen?",
            a: "Ja. Meine Antwortentwürfe bestätigen nie, dass jemand Patient bei Ihnen war, und nennen keine Behandlungsdetails. Sie geben jede Antwort frei.",
          },
          {
            q: "Ich habe schon einen Jameda-Eintrag. Reicht das nicht?",
            a: "Jameda ist eine wichtige Quelle, aber die KI liest auch Google, Ihre Website und andere Verzeichnisse. Widersprechen sich die Angaben, nennt sie lieber eine Praxis, bei der alles zusammenpasst.",
          },
        ],
      },
      {
        slug: "heizung-sanitaer",
        name: "SHK-Betriebe",
        title: "KI-Marketing für Heizung & Sanitär: Google und ChatGPT",
        description:
          "Ein KI-Agent übernimmt das Marketing Ihres SHK-Betriebs: Google-Beiträge, Bewertungen, Leistungsseiten und Empfehlungen durch ChatGPT. Freigabe per Handy.",
        h1: "Das Marketing Ihres SHK-Betriebs, erledigt von einem KI-Agenten",
        sub: "Ob Wärmepumpe, Badsanierung oder Rohrbruch: Hausbesitzer suchen bei Google, auf MyHammer und inzwischen bei ChatGPT. Ich sorge dafür, dass Ihr Betrieb überall auftaucht, während Sie auf der Baustelle sind.",
        questions: [
          "Welcher Heizungsbauer in München baut Wärmepumpen ein und hilft beim Förderantrag?",
          "Notdienst Sanitär in Hamburg-Wandsbek, wer kommt auch am Wochenende bei einem Rohrbruch?",
          "Ich will in Leipzig mein Bad sanieren lassen. Welche Firma ist zuverlässig und hat gute Bewertungen?",
        ],
        where: [
          { name: "Google Unternehmensprofil", why: "Einsatzgebiet, Notdienstzeiten und Bewertungen: Darauf schaut die KI bei Handwerkern zuerst." },
          { name: "MyHammer", why: "Das Handwerkerportal, auf dem die KI Bewertungen und erledigte Aufträge findet." },
          { name: "Gelbe Seiten, Das Örtliche und 11880", why: "Branchenbuch-Einträge, mit denen die KI Ihre Adresse und Nummer bestätigt." },
          { name: "ProvenExpert", why: "Gesammelte Kundenbewertungen, die viele SHK-Betriebe auf der Website zeigen und die KI mitliest." },
        ],
        steps: [
          { title: "Ich mache das Marketing, Sie die Aufträge", body: "Google-Beiträge zu aktuellen Projekten, Antworten auf Bewertungen und eine Seite für jeden Ort, den Sie anfahren, zur Freigabe in einer Minute. Social Media gibt es mit Pro, Anzeigen und E-Mail mit Growth im Early Access." },
          {
            title: "Ich schreibe Seiten für Ihre Leistungen",
            body: "Wärmepumpe, Gasheizung tauschen, Badsanierung, Notdienst: Ich entwerfe für jede Leistung eine klare Seite mit den Fragen, die Kunden wirklich stellen. Sie geben frei.",
          },
          {
            title: "Ich halte Ihr Google-Profil aktiv",
            body: "Ich schreibe Beiträge zu aktuellen Projekten und Antworten auf Bewertungen, damit die KI sieht, dass Ihr Betrieb gut zu tun hat und zuverlässig ist.",
          },
        ],
        faq: [
          {
            q: "Wir sind voll ausgelastet. Warum sollten wir das machen?",
            a: "Damit Sie sich die Aufträge aussuchen können. Wenn die KI Sie für Wärmepumpen oder Badsanierungen nennt, kommen eher die Anfragen, die sich für Sie lohnen, statt nur kleine Reparaturen.",
          },
          {
            q: "Wir haben kaum Zeit für Büroarbeit. Wie viel Aufwand ist das?",
            a: "Ein paar Minuten pro Woche. Ich erledige die Arbeit, und Sie tippen auf „Freigeben“, auch vom Handy aus der Baustelle.",
          },
          {
            q: "Unsere Website hat ein Dienstleister gebaut. Geht das trotzdem?",
            a: "Ja. Ich arbeite mit WordPress, Shopify und Webflow. Betreut jemand anderes Ihre Seite, schicke ich ihm die genaue Änderung per E-Mail.",
          },
        ],
      },
      {
        slug: "rechtsanwalt",
        name: "Rechtsanwälte",
        title: "KI-Marketing für Kanzleien: Google und ChatGPT",
        description:
          "Ein KI-Agent übernimmt das Marketing Ihrer Kanzlei: Seiten zu Rechtsgebieten, Google-Beiträge, Bewertungen und Empfehlungen durch ChatGPT. Sie geben alles frei.",
        h1: "Das Marketing Ihrer Kanzlei, erledigt von einem KI-Agenten",
        sub: "Mandanten suchen ihren Anwalt bei Google, auf anwalt.de und inzwischen bei ChatGPT. Ich übernehme das Marketing über all diese Kanäle, damit Sie Zeit für Ihre Mandate haben.",
        questions: [
          "Ich habe eine Kündigung bekommen. Welcher Fachanwalt für Arbeitsrecht in Düsseldorf ist gut?",
          "Anwalt für Familienrecht in Berlin-Charlottenburg, der sich mit Scheidung und Unterhalt auskennt?",
          "Welche Kanzlei in Köln hilft Mietern bei einer Eigenbedarfskündigung?",
        ],
        where: [
          { name: "anwalt.de", why: "Das Anwaltsportal, das die KI für Rechtsgebiete, Fachanwaltstitel und Bewertungen heranzieht." },
          { name: "Google Unternehmensprofil", why: "Bewertungen und Kontaktdaten Ihrer Kanzlei, die die KI direkt abgleicht." },
          { name: "ProvenExpert", why: "Mandantenbewertungen, die Vertrauen zeigen und die KI mitliest." },
          { name: "Ihre Kanzlei-Website", why: "Seiten zu Ihren Rechtsgebieten mit verständlichen Antworten auf typische Mandantenfragen." },
        ],
        steps: [
          { title: "Ich übernehme das wöchentliche Marketing", body: "Beiträge für Ihr Google-Profil, sachliche Artikel zu Ihren Rechtsgebieten und Antwortentwürfe auf Bewertungen, jede Woche zur Prüfung. Social Media gibt es mit Pro, Anzeigen und E-Mail mit Growth im Early Access." },
          {
            title: "Ich schreibe verständliche Antworten",
            body: "Ich entwerfe sachliche Seiten zu den Fragen, die Mandanten stellen, etwa zu Fristen nach einer Kündigung oder zum Ablauf einer Scheidung. Sie prüfen jede Formulierung.",
          },
          {
            title: "Ich bringe Ihre Angaben in Ordnung",
            body: "Ich gleiche Rechtsgebiete, Fachanwaltstitel und Kontaktdaten zwischen Website, anwalt.de und Google ab, damit die KI ein stimmiges Bild Ihrer Kanzlei hat.",
          },
        ],
        faq: [
          {
            q: "Ist das mit dem anwaltlichen Werberecht vereinbar?",
            a: "Ich schreibe sachlich und informativ, ohne reißerische Aussagen und ohne Erfolgsversprechen. Jeder Text geht erst nach Ihrer Freigabe online, und die berufsrechtliche Verantwortung bleibt bei Ihnen.",
          },
          {
            q: "Wie antworten Sie auf Bewertungen, ohne die Schweigepflicht zu verletzen?",
            a: "Meine Antwortentwürfe bestätigen kein Mandat und nennen keine Details zum Fall. Sie geben jede Antwort frei, bevor sie erscheint.",
          },
          {
            q: "Wir sind eine kleine Kanzlei mit zwei Anwälten. Lohnt sich das?",
            a: "Gerade dann. Die KI nennt bei solchen Fragen nur wenige Kanzleien, und ein einziges neues Mandat ist oft mehr wert als ein Jahr Alphaa.",
          },
        ],
      },
      {
        slug: "physiotherapie",
        name: "Physiotherapiepraxen",
        title: "KI-Marketing für Physiotherapie: Google und ChatGPT",
        description:
          "Ein KI-Agent übernimmt das Marketing Ihrer Physiotherapiepraxis: Google-Beiträge, Bewertungen, Leistungsseiten und Empfehlungen durch ChatGPT.",
        h1: "Das Marketing Ihrer Physiotherapiepraxis, erledigt von einem KI-Agenten",
        sub: "Mit dem Rezept in der Hand suchen Patienten bei Google und inzwischen bei ChatGPT nach einer Praxis in der Nähe. Ich halte Ihre Praxis dort sichtbar und mache die Arbeit für Sie.",
        questions: [
          "Physiotherapie in Leipzig-Gohlis mit freien Terminen diese Woche, ich habe ein Rezept für Krankengymnastik.",
          "Welche Praxis in Stuttgart macht Manuelle Therapie und Lymphdrainage und hat gute Bewertungen?",
          "Physiotherapeut in Frankfurt-Sachsenhausen für Rückenschmerzen, auch für Privatpatienten und Selbstzahler?",
        ],
        where: [
          { name: "Google Unternehmensprofil", why: "Öffnungszeiten, Lage und Bewertungen: Danach sortiert die KI Praxen in der Nähe." },
          { name: "Jameda", why: "Listet auch Physiotherapeuten mit Bewertungen und Schwerpunkten, die die KI liest." },
          { name: "Doctolib", why: "Zeigt der KI, dass man bei Ihnen online einen Termin buchen kann." },
          { name: "Ihre Praxis-Website", why: "Seiten zu Ihren Therapien und Hinweise zu Rezept, Hausbesuch und Selbstzahlern, die die KI zitieren kann." },
        ],
        steps: [
          { title: "Ich übernehme das wöchentliche Marketing", body: "Beiträge für Ihr Google-Profil, Artikel zu Ihren Therapien und Kursen und Antwortentwürfe auf Bewertungen, alles zur Freigabe. Social Media gibt es mit Pro, Anzeigen und E-Mail mit Growth im Early Access." },
          {
            title: "Ich mache Ihre Leistungen sichtbar",
            body: "Ich schreibe Seiten zu Krankengymnastik, Manueller Therapie, Lymphdrainage oder Ihren Kursen, damit die KI weiß, was Sie anbieten. Sie geben jede Seite frei.",
          },
          {
            title: "Ich pflege Profil und Bewertungen",
            body: "Ich halte Öffnungszeiten und Angaben überall aktuell, schreibe Beiträge für Ihr Google-Profil und entwerfe Antworten auf Bewertungen, ohne Gesundheitsdaten zu nennen.",
          },
        ],
        faq: [
          {
            q: "Unser Terminkalender ist voll. Was bringt mir das?",
            a: "Sie können steuern, welche Patienten kommen. Wenn die KI Sie für Selbstzahlerleistungen, Kurse oder bestimmte Schwerpunkte nennt, füllen Sie die Termine, die sich für Ihre Praxis lohnen.",
          },
          {
            q: "Darf ich das als Heilmittelerbringer überhaupt?",
            a: "Ich schreibe sachlich über Ihre Leistungen, ohne Heilversprechen. Jeder Text geht erst nach Ihrer Freigabe online, und die Verantwortung für die Inhalte bleibt bei Ihnen.",
          },
          {
            q: "Wir haben mehrere Standorte. Geht das?",
            a: "Ja. Mit Pro für {pro} im Monat betreue ich bis zu 3 Standorte, jeden mit eigenen Seiten und eigenem Profil.",
          },
        ],
      },
    ],
    backToMarket: "Zurück zur Übersicht für Deutschland",
    industryCta: "Jetzt starten",
  },
}
