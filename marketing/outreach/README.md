# Alphaa cold outreach kit v2

v2.0, 2026-10-30. Replaces `marketing/outreach-kit.md` (v1, 2026-07-14).

Motion, unchanged: run the prospect's check first, then write only about what that check found. Every line in every email must trace back to a field in that prospect's stored scan. If a field is empty, use the fallback line. Never invent a rival, a result or a number.

**Not legal advice. Confirm every country with counsel before the first send.** The compliance table below is a working summary of public sources, checked 2026-10-30.

## Files

| File | Market | Channel |
|---|---|---|
| `us-ca.md` | US + Canada excluding Quebec (English) | Cold email, 4 steps. **Start here: US and Canada are the only cold-email markets for now (2026-10-30).** |
| `uk.md` | UK (UK English) | Cold email, 4 steps, limited companies and LLPs only |
| `fr.md` | France (French) | Cold email, 4 steps, professional addresses only |
| `ae.md` | UAE (English + Arabic) | Email, 4 steps, consent or counsel sign-off required first |
| `de.md` | Germany (German) | Postal letter first; LinkedIn/Xing only after the person engages; contact-form text (not for cold use) |
| `it.md` | Italy (Italian) | Postal letter; LinkedIn permission-first; contact-form text (not for cold use) |
| `reply-playbook.md` | All | The 8 most likely replies, per language |

## What changed from v1

1. **Four AIs, named correctly:** ChatGPT, Gemini, Claude and Perplexity. v1 said "Google AI" and left out Claude.
2. **The score is measured now.** v1 quoted an estimated score. Since the scan-report rebuild, `visibilityScore` = 60% share of AI answers that named the business (across every question asked) + 40% weighted site checks (`src/lib/scan-report.ts`, `computeScore`). The emails say "measured", and we skip any prospect whose scan fell back to an estimate (see "Which scans you may use").
3. **No trial.** v1 offered a "14-day trial" and linked `/signup`. There is no free trial. Only the check at alphaa.app/start is free. Risk reversal is now the guarantee ("If no AI names you within 90 days, your next month is free."), the 7-day refund on the first charge, and month to month billing.
4. **Agent voice and outcome CTAs.** Alphaa is "an AI Agent", never a tool/platform/engine. Asks name the outcome ("get {{business_name}} named by ChatGPT"), never "Hire me", "Start today", "Start free" or "Sign up".
5. **A real person sends.** v1 signed as the founder in the copy. v2 uses `{{sender_name}}` so any real person on the team can send from their own inbox.
6. **Segments by what the check found** (A/B/C, plus D = do not send). v1 had only "rival named" or "(B) not named".
7. **US and Canada first (Varun, 2026-10-30).** UK, France, Germany, Italy and the UAE get paid ads to their local pages only (`marketing/ads/markets-ads-copy.md`); their files here are ready for later. Quebec is excluded.
8. **Six markets, not one.** Local prices (USD, EUR, GBP, AED), local wording, and a compliance verdict per country. Germany and Italy get no cold email at all.
9. **No em dashes, no "#1"/"best", no invented stats** (v1's "$22,800/yr back" and the yield estimates are gone).
10. **Opens are not tracked.** No tracking pixels anywhere (the CNIL says pixels need consent; they also hurt deliverability). Track replies and report-link visits only.

## Which scans you may use (read before building a batch)

The merge fields come from `ScanLead` (`prisma/schema.prisma`) as written by `src/app/api/scan/route.ts`. Rules:

- **Run outreach scans with NO email.** `POST /api/scan` with `email: ""`. If you pass the prospect's address, the app immediately sends them the report email from alphaa.app (`sendScanReadyEmail`) and the nurture cron can pick them up later. That would be an unconsented email from our main domain. Keep the prospect's address only in the sending tool.
- With no email, the report is not gated, so `{{scan_url}}` = `https://alphaa.app/scan/results?id={{ScanLead.id}}` works without a token.
- **Skip the prospect** when `ogData.auditFallback === true`, `engineResponses` is empty, or `visibilityScore` is null. That score was not measured.
- **Tag outreach scans.** `ScanLead` has no `source` column, so outreach scans currently count as real visitors in funnel metrics. Either add a `source` field or keep the outreach scan IDs in a list and exclude them from reporting (decision for Varun).
- The check asks the AIs in the site's language, but the report page is in English for now (the market pages say so). The FR, DE, IT and Arabic copy mentions this.

## Shared merge fields (every file uses these; local files add their own)

| Merge field | Filled from | Notes |
|---|---|---|
| `{{first_name}}` | Prospect list (not ScanLead) | Empty: greet with "Hi," / "Bonjour," etc. Never "Hi there". |
| `{{business_name}}` | `ScanLead.businessName` | Fallback: domain of `ScanLead.businessUrl`. |
| `{{city}}` | `ScanLead.city` | If empty or "your area", drop the whole " in {{city}}" phrase. |
| `{{industry}}` | `ScanLead.ogData.insights.industry` | Null when the scan couldn't tell. Then use the vertical from the list. |
| `{{customer_noun}}` | Prospect list, mapped from vertical | patients / clients / customers / homeowners. Not stored by the scan. |
| `{{question}}` | `ScanLead.engineResponses.<engine>.query` (same for every engine) | Fallback `ogData.insights.query`. This is the exact question the AIs were asked. |
| `{{answered_count}}` | Count of `engineResponses` entries whose `response` is longer than 20 characters | Only AIs that actually answered count (same rule as the report). |
| `{{named_count}}` | Entries with `appeared === true` | |
| `{{named_engines}}` / `{{missed_engines}}` | Engine keys mapped: chatgpt→ChatGPT, gemini→Gemini, claude→Claude, perplexity→Perplexity | Join as "ChatGPT and Gemini". |
| `{{missed_count}}` | `answered_count - named_count` | |
| `{{rival_1}}`, `{{rival_2}}` | `engineResponses.<missed engine>.mentioned[]`, excluding the business itself, most-named first | Same rule as `others()` in `buildFindings`. Empty = segment B. |
| `{{rival_engine}}` | First missed engine whose `mentioned` includes `{{rival_1}}` | |
| `{{broad_question}}` | `ogData.questions[1].query` (kind "broad") | Only exists when 3+ AIs named the business on the first question. |
| `{{broad_missed_count}}` / `{{broad_answered_count}}` | `ogData.questions[1].answers`: entries with `appeared === false` / entries with a response | |
| `{{broad_rival_1}}` | Most-named entry in `ogData.questions[1].answers.*.mentioned` | May be empty. |
| `{{score}}` | `ScanLead.visibilityScore` | Only if measured (see above). |
| `{{gap_1}}`, `{{gap_2}}` | `ogData.siteChecks.you.checks[]` where `ok === false`, sorted by `CHECK_IMPACT` (3 first) | Map the check `key` through the gap table in each language file. Do not paste `ScanLead.issues[].headline` raw: it is English only and one label (`render`) contains an em dash. |
| `{{gap_rival_domain}}` | `ogData.siteChecks.competitors[].domain` where the same check `key` has `ok === true` | Empty: drop the "{{gap_rival_domain}} has this" clause. |
| `{{scan_url}}` | `https://alphaa.app/scan/results?id=` + `ScanLead.id` | Scan must have been run with no email. |
| `{{source_url}}`, `{{source_date}}` | Prospect list: the page where the address was published and the date we saw it | Required for Canada (proof), UK/FR/IT/DE (GDPR Art. 14 notice). Keep a screenshot. |
| `{{sender_name}}`, `{{sender_email}}` | Sending-tool inbox | A real person. Real photo, real signature. |
| `{{unsubscribe_link}}` | Sending tool | One-click, plus `List-Unsubscribe` and `List-Unsubscribe-Post` headers. |

### Segments (pick per prospect, top-down)

| Segment | Rule | What the emails say |
|---|---|---|
| **A** | `missed_count >= 1` and `{{rival_1}}` exists | "{{rival_engine}} named {{rival_1}} instead." |
| **B** | `missed_count >= 1`, no rival extracted | "{{missed_engines}} answered without mentioning {{business_name}}." |
| **C** | `missed_count == 0` on the first question, but `broad_missed_count >= 1` | "All of them named you for that. Then I asked the wider question…" |
| **D** | Named everywhere, including the broad question | **Do not send.** The check gives them no reason to buy. Park for a re-check in 60 days. |

## Infrastructure checklist (nothing sends until every box is ticked)

- [ ] **Separate sending domains. Never alphaa.app.** alphaa.app carries the product's transactional mail (Resend: scan reports, receipts, Google reconnect). A spam complaint on a cold domain must never touch it. Buy 2 lookalike domains (Varun picks, e.g. `getalphaa.com`, `alphaa-agent.com`), 301 the root to alphaa.app. One extra domain per market if a market gets its own inboxes (e.g. a `.co.uk` / `.fr`).
- [ ] **2-3 inboxes per domain** (Google Workspace or Microsoft 365), each a real named person with photo and signature.
- [ ] **DNS:** SPF, DKIM (2048-bit), DMARC (`p=none` for the first month with reports on, then `p=quarantine`), MX. No custom open-tracking domain, because opens are not tracked.
- [ ] **Warmup:** 3 weeks minimum on each new inbox before any real send. Keep warmup running at a low level after launch.
- [ ] **Verification:** run every batch through Debounce (already used for SEC hub) or NeverBounce. Send to `valid` only. Drop `catch-all` and role-based addresses unless the market rules allow them. Stop the batch if bounces pass 2%.
- [ ] **Volume caps:** 20/inbox/day for weeks 1-2 after warmup, then 30/inbox/day steady state. Never more than 50. Keep the spam-complaint rate under 0.1% (Gmail and Yahoo's sender rules treat 0.3% as the hard ceiling).
- [ ] **One sequence per contact, one contact per business.** Stop the sequence on any reply.
- [ ] **Suppression list, shared and global:** every opt-out (any wording), every bounce, existing customers and scan leads already in the product's nurture (`ScanLead.email`), anyone who complained, competitors, and every German/Italian business email address (so nobody mails them by mistake). Synced into the sending tool before each batch. Never delete entries.
- [ ] **Sending tool:** Instantly or Smartlead (inbox rotation, warmup, per-campaign country tags, unified inbox, global block list, plain-text sending). Open tracking OFF, link tracking OFF (link rewriting also hurts deliverability). One campaign per country so each gets its own footer.
- [ ] **Records for each contact:** `source_url`, `source_date`, screenshot, entity type (UK), segment, scan ID. Canada and the GDPR markets need this as proof.
- [ ] **Seed row:** one of our own inboxes in each batch to check rendering and links.
- [ ] **Footer per country** set at campaign level (texts are in each file). Physical address on every email: 9629033 Canada Inc., 1000 Innovation Drive, Suite 500, Kanata, ON K2K 3E7, Canada.

## Compliance table (checked 2026-10-30)

Not legal advice; confirm with counsel. "Allowed" means allowed under the conditions listed, not allowed for any list we can buy.

| Country | Rule | Cold B2B email? | Conditions we follow | Use instead / as well |
|---|---|---|---|---|
| **US** | CAN-SPAM Act (FTC) | **Yes (opt-out regime)** | Honest From and subject; identify as an ad is satisfied by clear commercial content; valid physical postal address; clear opt-out that works for 30+ days after sending; honour within 10 business days (we do it instantly). No B2B exemption: it applies to business email too. Penalty up to $53,088 per email. | n/a |
| **Canada** | CASL (CRTC) | **Only under implied consent by conspicuous publication, s.10(9)(b)** | All three: (1) the person published the address themselves (their own website), (2) no "no unsolicited messages" notice next to it, (3) the message is relevant to their business role. Not from third-party directories, scrapers or guessed/pattern addresses (Hunter-style finds fail this). Job title alone is not proof of relevance. Keep `source_url` + date + screenshot for every address. Each message: sender name, mailing address plus a phone/email/web contact, unsubscribe that works 60 days, honoured within 10 business days. Penalties up to $10M per violation for a business. | Phone, LinkedIn, ads for any address that fails the test. |
| **UK** | PECR + UK GDPR (ICO) | **Yes for corporate subscribers only** (Ltd, PLC, LLP, Scottish partnerships). **No for sole traders and ordinary partnerships** (England, Wales, NI): they count as individuals and need prior consent. | Check Companies House before sending: no company number = do not email. Identify yourself, give a working opt-out, honour it. UK GDPR still applies to named addresses: legitimate-interests assessment on file, Art. 14 notice (where we got the address, link to privacy page), absolute right to object. Note: the ICO's B2B page says it is under review after the Data (Use and Access) Act 2025. Many dentists and trades are sole traders or partnerships: expect to drop a large share of UK lists. | LinkedIn, postal letter, phone (check TPS/CTPS first) for sole traders and partnerships. |
| **France** | Art. L34-5 CPCE + GDPR (CNIL) | **Yes, to a professional address, when the offer relates to the person's job** (opt-out regime). | Message must be about their professional activity (an AI-visibility offer to a clinic owner or tradesperson qualifies; to a receptionist's personal address it doesn't). Identify the sender, free and simple opt-out in every email, Art. 14 info (source of the address, privacy link). No tracking pixels without consent. Generic addresses (contact@, info@) are acceptable. | n/a, but personal Gmail/Orange addresses of sole traders are risky: skip them. |
| **Germany** | UWG §7(2) Nr. 2 (pre-2022 numbering: Nr. 3) + GDPR | **NO.** Advertising email needs prior express consent, B2B included. A presumed interest is not enough. | Do not cold email. AG Düsseldorf, 19 Jan 2026 (290c C 153/25): unsolicited ads to a company's business address are unlawful; an opt-out link doesn't cure it. Courts also treat advertising messages on LinkedIn and Xing as "elektronische Post" (AG Düsseldorf 23 C 120/25; OLG Hamm 18 U 154/22; OLG Nürnberg 3 U 724/18 as reported), and a LinkedIn connection is not consent. Treat contact-form pitches the same as email. Risk is mostly Abmahnungen (cease-and-desist with costs) from competitors and recipients. | **Addressed postal letter** (allowed B2B unless the recipient has objected) with GDPR Art. 14 notice. LinkedIn/Xing only as a non-promotional connection, and message only after the person engages first. B2B phone needs at least presumed consent based on concrete circumstances; usefulness of the offer is not enough, so skip it. |
| **Italy** | Art. 130 Codice Privacy + GDPR (Garante) | **NO.** The Garante requires prior consent for promotional email, has fined senders who used public registers (INI-PEC, 2021) and has said an unsubscribe link does not fix an unconsented send (17 May 2023). The "soft spam" exception is for existing customers only and, per commentators, not available for company addresses. Some vendors argue B2B legitimate interest; we don't rely on that. | Do not cold email, and never use PEC addresses from INI-PEC or the Registro Imprese. | **Addressed postal letter** to the business (check the Registro Pubblico delle Opposizioni if the postal address came from a phone directory). LinkedIn permission-first message (no pitch until they say yes). No Garante ruling on LinkedIn DMs found; GDPR legitimate-interest test applies, so confirm with counsel. |
| **UAE** | TDRA Regulations on Unsolicited Electronic Communications + Federal PDPL (Decree-Law 45/2021); DIFC/ADGM have their own data laws | **Not cleared.** TDRA rules require opt-in consent for marketing messages; Baker McKenzie reads the PDPL as requiring consent for any email direct marketing with no alternative basis. A B2B exemption is claimed only by vendor blogs, not verified. | Send `ae.md` emails only to (a) people who opted in (e.g. via /ae, events, a reply on LinkedIn), or (b) business addresses after UAE counsel signs off in writing. Every email: identity, opt-out, address. Telemarketing has its own strict 2024 rules (Cabinet Resolution 56/2024): no cold calls without counsel. | LinkedIn, the /ae and /ae/ar pages with ads, partner and chamber events, WhatsApp only to people who opted in. |

### Sources (accessed 2026-10-30)

- US: FTC, "CAN-SPAM Act: A Compliance Guide for Business" (penalty figure updated Jan 2024). https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- Canada: CRTC, "Guidance on Implied Consent" (Compliance and Enforcement Information Bulletin 2015-548). https://crtc.gc.ca/eng/com500/guide.htm . Torys, "FCA confirms CASL is constitutional, but limits business communications exemption" (June 2020, on 3510395 Canada Inc. (CompuFinder) v. Canada, 2020 FCA 103). https://www.torys.com/en/our-latest-thinking/publications/2020/06/fca-confirms-casl-is-constitutional-but-limits-business-communications-exemption . Bennett Jones on the CRTC Blackstone decision (Nov 2016). https://www.bennettjones.com/insights/blogs/2016/11/crtc-assesses-conspicuous-publication-basis-of-implied-consent-in-casl-enforcement-decision
- UK: ICO, "Business-to-business marketing" (page notes it is under review after the Data (Use and Access) Act). https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/
- France: Bercy Infos Entreprises, rules for commercial email to professionals. https://www.economie.gouv.fr/entreprises/obligation-entreprise-envoi-courriel-newsletters . Leto, "Prospection par email et SMS : la CNIL reprécise la frontière entre opt-in et opt-out" (14 June 2026, on the CNIL's updated reference sheet). https://www.leto.legal/news/cnil-communications-electroniques-prospection-regles-2026 . CCI Paris IdF fiche "Prospection commerciale par voie électronique". https://www.entreprises.cci-paris-idf.fr/fiches-pratiques/prospection-commerciale-par-voie-electronique
- Germany: Otto Schmidt, "Kalte Werbung per E-Mail? Gericht zieht klare Grenze" (21 Apr 2026, AG Düsseldorf 19.1.2026, 290c C 153/25). https://www.otto-schmidt.de/news/wirtschaftsrecht/kalte-werbung-per-e-mail-gericht-zieht-klare-grenze-2026-04-21.html . Scheja & Partners, "Düsseldorf Regional Court: LinkedIn networking does not circumvent the Act against Unfair Competition" (16 Apr 2026). https://scheja-partners.de/en/2026/04/16/duesseldorf-regional-court-linkedin-networking-does-not-circumvent-the-act-against-unfair-competition/ . IT-Recht Kanzlei on ads via Xing/LinkedIn. https://www.it-recht-kanzlei.de/werbe-mails-xing-linkedin.html . IHK Karlsruhe, "Werbung: was ist erlaubt?" (letters allowed, email needs consent). https://www.ihk.de/karlsruhe/fachthemen/recht/wettbewerbsrecht/werbung-was-ist-erlaubt-2459622
- Italy: Garante, provvedimento 1 Feb 2018 n. 52 (promotional email to PEC addresses from public registers). https://www.garanteprivacy.it/garante/doc.jsp?ID=7810723 . Cybersecurity360 on the Garante decision of 17 May 2023 (unsubscribe link does not cure unconsented email). https://www.cybersecurity360.it/news/e-mail-pubblicitarie-inviate-senza-consenso-arriva-lo-stop-del-garante-privacy/ . EC News on the INI-PEC sanction. https://www.ecnews.it/lavoro/news-del-giorno/privacy-vietato-invio-mail-pubblicitarie-indirizzi-pec-senza-consenso/
- UAE: Baker McKenzie Global Data and Cyber Handbook, UAE, "Cookies, online tracking and direct marketing". https://resourcehub.bakermckenzie.com/en/resources/global-data-and-cyber-handbook/emea/uae/topics/cookies-online-tracking-and-direct-marketing . Clyde & Co, "UAE tightens telemarketing regulations" (July 2024). https://www.clydeco.com/en/insights/2024/07/uae-tightens-telemarketing-regulations-what-you-ne

Gaps in the research, for counsel: the UK position after the Data (Use and Access) Act 2025; whether the CNIL's 2026 sheet changes anything for sole traders; any Italian ruling on LinkedIn messages; whether UAE free-zone recipients (DIFC/ADGM) change the answer.

## Copy rules (all files)

- Only ChatGPT, Gemini, Claude and Perplexity. No other AI names.
- No "#1", "best", "leading", "top". No invented stats, customers or results. No promised rankings or revenue.
- Never "free trial", "start free", "sign up". The check is free; the product is paid.
- Allowed: "If no AI names you within 90 days, your next month is free." Also allowed: 7-day refund on the first charge; month to month; nothing goes live without their OK.
- Plain text, one link per email at most, no images, no em dashes.
- 100-130 words in the body (footer excluded). One ask per email.
- Never "just checking in". Each follow-up brings one new fact from their check.
- Subjects describe the content. "Re:" only on a real reply in the same thread.
