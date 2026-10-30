# Italia: lettera + LinkedIn (italiano)

**Nessuna e-mail a freddo in Italia.** Sources in `README.md`. Short version:

- **E-mail:** art. 130 Codice Privacy requires prior consent for promotional email. The Garante has fined senders who used public registers (PEC addresses from INI-PEC; decision of 1 Feb 2018 n. 52 and a 2021 sanction) and held on 17 May 2023 that an unsubscribe link does not fix an unconsented send. The "soft spam" exception covers existing customers only. Never use PEC addresses for marketing.
- **Contact forms:** same risk as email. Not for cold use.
- **Addressed postal letter:** the lowest-risk cold channel. Legitimate interest under GDPR with an Art. 14 notice. If the postal address came from a public phone directory, check it against the Registro Pubblico delle Opposizioni first. Confirm with counsel.
- **LinkedIn:** no Garante ruling on sales DMs found. GDPR legitimate-interest test applies. We go permission-first: no offer until the person says yes. Confirm with counsel.

Register: **Lei** in cold contact (the market page uses "tu", but a first message to a dentist or avvocato is formal). Switch to "tu" only if they do.
Prices: 99 € / 199 € / 299 € al mese, IVA esclusa. The check asks the AIs in Italian; the report page is in English for now (say so, as alphaa.app/it does).

## Merge fields

| Campo | Fonte |
|---|---|
| `{{saluto}}` | Prospect list: "Gentile Dott.ssa Rossi", "Gentile Avv. Bianchi", "Gentile Sig. Esposito". Unknown: "Buongiorno" |
| `{{cognome_titolo}}` | Prospect list: "Dott.ssa Rossi" (LinkedIn) |
| `{{titolare}}`, `{{indirizzo_postale}}` | Prospect list: from the site's legal notice / Google Business Profile |
| `{{business_name}}` | `ScanLead.businessName`, else domain of `ScanLead.businessUrl` |
| `{{clienti}}` | Prospect list: pazienti / clienti |
| `{{city}}` | `ScanLead.city`; empty or "your area": "nella Sua zona" |
| `{{question}}` | `ScanLead.engineResponses.<engine>.query` (Italian, as asked); fallback `ogData.insights.query` |
| `{{answered_count}}`, `{{missed_count}}`, `{{missed_engines}}` | `ScanLead.engineResponses` (see `README.md`) |
| `{{rival_1}}`, `{{rival_engine}}` | `engineResponses.<missed>.mentioned`, excluding the business, most-named first |
| `{{broad_question}}`, `{{broad_missed_count}}`, `{{broad_answered_count}}` | `ogData.questions[1]` (segment C) |
| `{{score}}` | `ScanLead.visibilityScore` (skip if `ogData.auditFallback` is true) |
| `{{gap_1}}`, `{{gap_2}}` | `ogData.siteChecks.you.checks[]` with `ok === false`, highest `CHECK_IMPACT` first, through the table below |
| `{{scan_date}}` | `ScanLead.createdAt`, "30 ottobre" |
| `{{scan_url}}` / `{{qr_code}}` | `https://alphaa.app/scan/results?id=` + `ScanLead.id`; QR code on paper |
| `{{source_url}}` | Prospect list: where the postal address was found |
| `{{sender_name}}`, `{{sender_email}}` | Real person; LinkedIn profile in their own name |

### Lacune (key → `{{gap_1}}`)

| Key | Testo |
|---|---|
| aibots | Il Suo sito chiude la porta agli assistenti IA |
| robots | Un'impostazione del sito dice all'IA di non leggerlo |
| indexable | La home page chiede a Google di non mostrarla |
| render | L'IA vede una pagina vuota, perché i testi compaiono solo dopo codice aggiuntivo |
| canonical | Le pagine dicono a Google che la pagina giusta è un'altra |
| https | Il sito risponde a più indirizzi, o non è del tutto sicuro |
| bing | Nessun segno che il sito sia registrato su Bing, su cui si basa la ricerca di ChatGPT |
| llms | Non c'è una breve descrizione dell'attività scritta per gli assistenti IA |
| sitemap | Non c'è un elenco delle pagine per Google e per l'IA |
| speed | Il sito è lento a caricarsi |
| schema | I dati dell'attività non sono nel codice di sfondo che l'IA legge |
| schemaFacts | In quel codice mancano indirizzo, telefono o orari |
| facts | L'IA non ha trovato telefono, indirizzo né orari nella pagina |
| local | Il sito non dice chiaramente in quale città lavora |
| meta | Il titolo della pagina e la descrizione su Google non dicono chiaramente cosa fa |
| headings | La home page non ha un titolo principale chiaro |
| depth | C'è troppo poco testo nella pagina perché l'IA possa citarla |
| pages | Non c'è una pagina per ogni servizio |
| faq | Non ci sono risposte pubblicate alle domande dei clienti |
| reviews | Le recensioni non sono sul sito come testo leggibile dall'IA |
| profiles | Il sito non rimanda al profilo Google, a MioDottore, PagineGialle o ai social |
| about | Non c'è una pagina "Chi siamo" che dica chi è |
| blog | Non è stato pubblicato nulla di nuovo di recente |

---

## 1. Lettera (contatto a freddo, per posta)

One page, signed. About 170 words plus the privacy note.

```
Alphaa · 9629033 Canada Inc. · 1000 Innovation Drive, Suite 500 · Kanata, ON K2K 3E7 · Canada

{{business_name}}
c.a. {{titolare}}
{{indirizzo_postale}}

{{scan_date}}

Cosa risponde ChatGPT su {{business_name}}

{{saluto}},

ho fatto a ChatGPT, Gemini, Claude e Perplexity la domanda che fanno i Suoi {{clienti}}:

«{{question}}»

[A] {{missed_count}} IA su {{answered_count}} non hanno nominato {{business_name}}. {{rival_engine}} ha consigliato {{rival_1}}.
[B] {{missed_engines}} hanno risposto senza nominare {{business_name}}.
[C] Tutte e {{answered_count}} L'hanno nominata. Alla domanda più ampia, «{{broad_question}}», {{broad_missed_count}} su {{broad_answered_count}} L'hanno lasciata fuori.

Il punteggio in questa verifica è {{score}}/100: misurato, non stimato. Leggendo il Suo sito, la cosa che salta all'occhio è questa: {{gap_1}}.

Tutte le risposte, parola per parola, sono al QR code qui sotto (report per ora in inglese, senza registrazione):
{{qr_code}}

Alphaa è un agente IA che scopre perché l'IA nomina altri e lo sistema. Da 99 € al mese più IVA, disdetta quando vuole. Se nessuna IA La nomina entro 90 giorni, il mese successivo non lo paga.

Se vuole sapere da dove partirei, mi scriva a {{sender_email}}.

Cordiali saluti,

{{sender_name}}
Alphaa · alphaa.app

Privacy: il Suo indirizzo professionale proviene da {{source_url}}. Titolare del trattamento: 9629033 Canada Inc. (indirizzo sopra). Lo usiamo solo per questa lettera, sulla base del legittimo interesse (art. 6.1.f GDPR). Può opporsi in qualsiasi momento (art. 21 GDPR) scrivendo a {{sender_email}}: non La contatteremo più. Dettagli: alphaa.app/privacy
```

One letter only. Follow up only if they reply.

---

## 2. LinkedIn (permission-first)

### Messaggio 1: richiesta di collegamento (no offer, under 300 characters)

```
Buongiorno {{cognome_titolo}}, mi occupo di come ChatGPT e gli altri assistenti IA consigliano le attività a {{city}} e mi farebbe piacere collegarmi con titolari della zona. Cordiali saluti, {{sender_name}}
```

### Messaggio 2: 2-3 days after acceptance (asks permission, no offer)

```
Grazie del collegamento, {{cognome_titolo}}.

Ho fatto a ChatGPT, Gemini, Claude e Perplexity la domanda che fanno i Suoi {{clienti}}: «{{question}}». Il risultato riguarda {{business_name}} e penso Le possa interessare.

Vuole che Le mandi le risposte?
```

No reply = stop. Don't send a follow-up to a silent contact.

### Messaggio 3: they said yes

```
Eccole.

[A] {{missed_count}} IA su {{answered_count}} non hanno nominato {{business_name}}. {{rival_engine}} ha consigliato {{rival_1}}.
[B] {{missed_engines}} hanno risposto senza nominarLa.
[C] Tutte L'hanno nominata, ma alla domanda più ampia «{{broad_question}}» {{broad_missed_count}} su {{broad_answered_count}} L'hanno lasciata fuori.

Tutte le risposte parola per parola (report per ora in inglese): {{scan_url}}

Sul Suo sito le due cose che l'IA fa più fatica a leggere sono:
1. {{gap_1}}.
2. {{gap_2}}.

Vuole il testo esatto per sistemare la prima?
```

### Messaggio 4: one week later, only if the conversation is still open

```
Un'ultima cosa, poi non La disturbo più.

Le correzioni può farle chi segue il Suo sito. Oppure le fa Alphaa e le tiene aggiornate ogni settimana: 99 € al mese più IVA, disdetta quando vuole, nulla va online senza il Suo ok. Se nessuna IA La nomina entro 90 giorni, il mese successivo non lo paga.

Per farsi consigliare da ChatGPT: alphaa.app/it

Se non Le interessa, me lo dica pure e chiudo qui.
```

Fallback (no gap found), Messaggio 3: replace the list with `Il Suo sito ha superato le mie verifiche: la lacuna è nelle pagine su cui le IA si sono basate per rispondere, come PagineGialle, MioDottore, ProntoPro e le pagine che rispondono esattamente a quella domanda.`

---

## 3. Modulo di contatto (NOT for cold use in Italy)

Same rule as email. Use only when the business asked for it (e.g. replied to the letter through its own form). Under 600 characters.

```
Buongiorno, come richiesto: ho chiesto a ChatGPT, Gemini, Claude e Perplexity «{{question}}». {{missed_count}} su {{answered_count}} non hanno nominato {{business_name}}[, {{rival_engine}} ha consigliato {{rival_1}}]. Tutte le risposte (report per ora in inglese): {{scan_url}}. Se vuole sapere da dove partirei: {{sender_email}}. {{sender_name}}, Alphaa (9629033 Canada Inc., Kanata, Canada). Privacy: alphaa.app/privacy
```
