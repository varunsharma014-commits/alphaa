# Deutschland: Brief + LinkedIn/Xing (Deutsch)

**Keine Kalt-E-Mails nach Deutschland.** Read `README.md` for sources. Short version:

- **E-Mail:** § 7 Abs. 2 Nr. 2 UWG (old numbering Nr. 3) requires prior express consent for advertising email, B2B included. AG Düsseldorf, 19.1.2026 (290c C 153/25): unsolicited ads to a company's business address are unlawful; an unsubscribe link does not cure it; a "contact us" invitation on a website is not consent.
- **LinkedIn/Xing:** German courts treat advertising messages on these networks as "elektronische Post" too, and a connection is not consent. So a pitch by DM is the same risk as a cold email (Abmahnung with costs).
- **Contact forms:** treat a pitch through a company's contact form like email. Not for cold use.
- **Addressed postal letter:** allowed B2B unless the recipient has said they don't want advertising. **This is the cold channel for Germany.**
- **Phone:** B2B calls need at least presumed consent based on concrete circumstances; "the offer is useful" is not enough. Skip.

So the order is: **letter first** → the person visits their report, writes back, or connects → **then** LinkedIn/Xing messages. The connection request itself carries no advertising.

Sie-Form throughout. Prices: 99 € / 199 € / 299 € im Monat, netto zzgl. USt. The check asks the AIs in German; the report page is in English for now (say so, as alphaa.app/de does). Letters must be on paper with a real signature by `{{sender_name}}`.

## Merge fields

| Feld | Quelle |
|---|---|
| `{{anrede}}` | Prospect list: "Sehr geehrte Frau Dr. Weber", "Sehr geehrter Herr Krause". Unknown: "Guten Tag" |
| `{{nachname_mit_anrede}}` | Prospect list: "Frau Dr. Weber", "Herr Krause" (LinkedIn/Xing) |
| `{{city}}` | `ScanLead.city`; empty or "your area": write "Ihrer Region" |
| `{{inhaber}}` | Prospect list: owner's name for the address block (from the site's Impressum) |
| `{{postanschrift}}` | Prospect list: business postal address (Impressum or Google Business Profile) |
| `{{business_name}}` | `ScanLead.businessName`, else domain of `ScanLead.businessUrl` |
| `{{kunden}}` | Prospect list: Patienten / Mandanten / Kunden |
| `{{question}}` | `ScanLead.engineResponses.<engine>.query` (German, as asked); fallback `ogData.insights.query` |
| `{{answered_count}}`, `{{missed_count}}`, `{{missed_engines}}` | `ScanLead.engineResponses` (see `README.md`) |
| `{{rival_1}}`, `{{rival_engine}}` | `engineResponses.<missed>.mentioned`, excluding the business, most-named first |
| `{{broad_question}}`, `{{broad_missed_count}}`, `{{broad_answered_count}}` | `ogData.questions[1]` (segment C) |
| `{{score}}` | `ScanLead.visibilityScore` (skip if `ogData.auditFallback` is true) |
| `{{gap_1}}`, `{{gap_2}}` | `ogData.siteChecks.you.checks[]` with `ok === false`, highest `CHECK_IMPACT` first, through the table below |
| `{{scan_date}}` | `ScanLead.createdAt`, "30. Oktober" |
| `{{scan_url}}` / `{{qr_code}}` | `https://alphaa.app/scan/results?id=` + `ScanLead.id`; printed as a QR code plus the short form |
| `{{source_url}}` | Prospect list: where the postal address was found (usually the Impressum) |
| `{{sender_name}}`, `{{sender_email}}` | Real person; LinkedIn/Xing profile in their own name |

### Lücken (key → `{{gap_1}}`)

| Key | Text |
|---|---|
| aibots | Ihre Website lässt KI-Assistenten nicht hinein |
| robots | Eine Einstellung auf Ihrer Website verbietet der KI das Lesen |
| indexable | Ihre Startseite bittet Google, sie nicht anzuzeigen |
| render | Die KI sieht eine leere Seite, weil Ihre Texte erst nach zusätzlichem Code erscheinen |
| canonical | Ihre Seiten sagen Google, eine andere Seite sei die richtige |
| https | Ihre Website ist unter mehreren Adressen erreichbar oder nicht ganz sicher |
| bing | Kein Hinweis, dass Ihre Website bei Bing eingetragen ist, auf das sich die Suche von ChatGPT stützt |
| llms | Es gibt keine Kurzbeschreibung Ihres Betriebs für KI-Assistenten |
| sitemap | Es gibt keine Liste Ihrer Seiten für Google und KI |
| speed | Ihre Website lädt langsam |
| schema | Ihre Betriebsdaten stehen nicht im Hintergrund-Code, den die KI liest |
| schemaFacts | In diesem Hintergrund-Code fehlen Adresse, Telefon oder Öffnungszeiten |
| facts | Die KI findet auf der Seite weder Telefon noch Adresse noch Öffnungszeiten |
| local | Ihre Website sagt nicht klar, in welcher Stadt Sie arbeiten |
| meta | Seitentitel und Google-Beschreibung sagen nicht klar, was Sie anbieten |
| headings | Ihre Startseite hat keine klare Hauptüberschrift |
| depth | Auf der Seite steht zu wenig Text, den die KI zitieren könnte |
| pages | Es gibt nicht für jede Leistung eine eigene Seite |
| faq | Es gibt keine veröffentlichten Antworten auf die Fragen Ihrer Kunden |
| reviews | Ihre Bewertungen stehen nicht als lesbarer Text auf Ihrer Website |
| profiles | Ihre Website verlinkt nicht auf Ihr Google-Profil, Jameda, ProvenExpert oder Ihre Social-Media-Profile |
| about | Es gibt keine „Über uns“-Seite, die sagt, wer Sie sind |
| blog | In letzter Zeit wurde nichts Neues veröffentlicht |

---

## 1. Brief (Kaltkontakt, per Post)

One page, plain, signed. Body about 170 words plus the mandatory data-protection note.

```
Alphaa · 9629033 Canada Inc. · 1000 Innovation Drive, Suite 500 · Kanata, ON K2K 3E7 · Kanada

{{business_name}}
{{inhaber}}
{{postanschrift}}

{{scan_date}}

Was ChatGPT über {{business_name}} sagt

{{anrede}},

ich habe ChatGPT, Gemini, Claude und Perplexity die Frage gestellt, die Ihre {{kunden}} stellen:

„{{question}}“

[A] {{missed_count}} von {{answered_count}} KIs haben {{business_name}} nicht genannt. {{rival_engine}} hat stattdessen {{rival_1}} empfohlen.
[B] {{missed_engines}} haben geantwortet, ohne {{business_name}} zu erwähnen.
[C] Alle {{answered_count}} haben Sie genannt. Bei der breiteren Frage „{{broad_question}}“ haben Sie {{broad_missed_count}} von {{broad_answered_count}} ausgelassen.

Ihr Wert in dieser Prüfung: {{score}}/100, gemessen, nicht geschätzt. Beim Lesen Ihrer Website ist mir vor allem aufgefallen: {{gap_1}}.

Alle Antworten im Wortlaut finden Sie über den QR-Code (Bericht vorerst auf Englisch, ohne Anmeldung):
{{qr_code}}

Alphaa ist ein KI-Agent, der herausfindet, warum die KI andere nennt, und das behebt. Ab 99 € im Monat zzgl. USt., monatlich kündbar. Nennt Sie innerhalb von 90 Tagen keine KI, ist Ihr nächster Monat kostenlos.

Wenn Sie wissen möchten, womit ich anfangen würde, schreiben Sie mir an {{sender_email}}.

Mit freundlichen Grüßen

{{sender_name}}
Alphaa · alphaa.app

Datenschutz: Ihre Geschäftsadresse stammt aus {{source_url}}. Verantwortlich ist 9629033 Canada Inc. (Anschrift oben). Wir verwenden sie nur für dieses Schreiben (Art. 6 Abs. 1 lit. f DSGVO). Sie können der Nutzung jederzeit widersprechen (Art. 21 DSGVO), formlos an {{sender_email}}; dann schreiben wir Ihnen nicht mehr. Details: alphaa.app/privacy
```

Send one letter. No follow-up letter unless the person replies. Log every objection on the global suppression list.

---

## 2. LinkedIn / Xing

### Nachricht 1: Kontaktanfrage (no advertising, under 300 characters)

Send only to the owner or practice head of a business that got the letter (or that is visible in your own network). No offer, no link, no mention of Alphaa's price.

```
Guten Tag {{nachname_mit_anrede}}, ich beschäftige mich damit, wie ChatGPT und andere KI-Assistenten Betriebe in {{city}} empfehlen, und vernetze mich gern mit Inhabern aus der Region. Viele Grüße, {{sender_name}}
```

**Stop here unless the person writes first** (replies to the letter, messages you, or asks after seeing your posts). An accepted request is not consent to advertising.

### Nachricht 2: after they write first (their question = the reason to reply)

```
Danke für Ihre Nachricht, {{nachname_mit_anrede}}.

Kurz zum Hintergrund: Ich habe ChatGPT, Gemini, Claude und Perplexity gefragt: „{{question}}“.
[A] {{missed_count}} von {{answered_count}} haben {{business_name}} nicht genannt, {{rival_engine}} hat {{rival_1}} empfohlen.
[B] {{missed_engines}} haben Sie nicht erwähnt.
[C] Alle haben Sie genannt, bei der breiteren Frage „{{broad_question}}“ fehlten Sie aber {{broad_missed_count}}-mal.

Alle Antworten im Wortlaut (Bericht vorerst auf Englisch): {{scan_url}}

Soll ich Ihnen die zwei Änderungen schicken, mit denen ich anfangen würde?
```

### Nachricht 3: they said yes

```
Gern. Das sind die zwei Punkte, die mir auf Ihrer Website am meisten auffallen:

1. {{gap_1}}.
2. {{gap_2}}.

Die KI nennt Betriebe, deren Angaben sie prüfen kann. Findet sie Öffnungszeiten, Stadt und eine klare Antwort auf die gestellte Frage nicht, nimmt sie jemand anderen.

Beides kann Ihr Webdienstleister umsetzen. Oder Alphaa übernimmt das und hält es jede Woche aktuell: 99 € im Monat zzgl. USt., monatlich kündbar, nichts geht ohne Ihre Freigabe online.

Soll ich Ihnen den genauen Text für Punkt 1 schicken?
```

### Nachricht 4: one week after Nachricht 3, only if the conversation is still open

```
Noch ein Punkt, dann lasse ich es gut sein: Nennt Sie innerhalb von 90 Tagen keine KI, ist Ihr nächster Monat kostenlos. Dazu 7 Tage Geld zurück auf die erste Abbuchung.

Wenn Sie möchten, dass ChatGPT {{business_name}} empfiehlt: alphaa.app/de

Und falls nicht: Sagen Sie kurz Bescheid, dann melde ich mich nicht mehr.
```

Fallbacks: no gap found → Nachricht 3, replace the list with `Ihre Website hat meine Prüfungen bestanden. Die Lücke liegt bei den Seiten, auf die sich die KIs gestützt haben: Gelbe Seiten, Jameda, ProvenExpert und Seiten, die genau diese Frage beantworten.`

---

## 3. Kontaktformular (NOT for cold use in Germany)

Courts treat a pitch through a contact form like advertising email. Use this text only as a reply when the business itself asked for it (e.g. answered the letter via its own form, or invited proposals on that topic). Under 600 characters for form limits.

```
Guten Tag, Sie hatten um das Ergebnis gebeten: Ich habe ChatGPT, Gemini, Claude und Perplexity gefragt: „{{question}}“. {{missed_count}} von {{answered_count}} haben {{business_name}} nicht genannt[, {{rival_engine}} hat {{rival_1}} empfohlen]. Alle Antworten (Bericht vorerst auf Englisch): {{scan_url}}. Wenn Sie wissen möchten, was ich zuerst ändern würde: {{sender_email}}. {{sender_name}}, Alphaa (9629033 Canada Inc., Kanata, Kanada). Datenschutz: alphaa.app/privacy
```
