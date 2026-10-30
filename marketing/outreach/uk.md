# UK: scan-led cold email (UK English)

4 emails, plain text, one ask each. Body 100-130 words (footer excluded). Read `README.md` first.

**Who you may email (PECR):** corporate subscribers only: limited companies, PLCs, LLPs and Scottish partnerships. Look every business up on Companies House and store the company number. **No company number = sole trader or ordinary partnership = do not email** (they need prior consent). Use LinkedIn or a letter for those. Many dental practices, solicitors and trades are partnerships or sole traders, so expect to lose a big share of each list.

**UK GDPR still applies** to named addresses (jane@practice.co.uk): keep a legitimate-interests assessment on file, give the Art. 14 notice (in the footer below), and treat any objection as permanent. Check whether the ICO's B2B guidance has changed after the Data (Use and Access) Act 2025 before launch.

Prices: £79 / £159 / £239 a month, excluding VAT where it applies.

## Merge fields

Same derivations as `us-ca.md` (all from `ScanLead`, see the table there and in `README.md`), plus:

| Field | Filled from |
|---|---|
| `{{company_number}}` | Companies House (prospect list). Required; not merged into the email, used as the send gate. |
| `{{customer_noun}}` | Prospect list: patients / clients / customers |
| `{{scan_date}}` | `ScanLead.createdAt`, written "30 October" |

Gap texts: use the table in `us-ca.md` with UK spelling (no changes needed except "Yelp" → "Yell" in `profiles`: "Your site doesn't link to your Google, Yell or social profiles").

## Footer (every email)

```
{{sender_name}}, Alphaa
9629033 Canada Inc., 1000 Innovation Drive, Suite 500, Kanata, ON K2K 3E7, Canada
alphaa.app | {{sender_email}}
I found this business address on {{source_url}} and wrote because it concerns how {{business_name}} gets found. How we handle your details and your rights: alphaa.app/privacy. Reply "no" or unsubscribe here and I'll stop for good: {{unsubscribe_link}}
```

---

## Email 1 (Day 0)

**Subject:** A: `{{rival_engine}} named {{rival_1}}, not {{business_name}}` / B: `{{business_name}} wasn't in the answer` / C: `{{business_name}} and the wider question`

```
Hi {{first_name}},

Before writing, I asked ChatGPT, Gemini, Claude and Perplexity the question your {{customer_noun}} ask:

"{{question}}"

[A] {{missed_count}} of the {{answered_count}} that answered left {{business_name}} out. {{rival_engine}} named {{rival_1}} instead.
[B] {{missed_engines}} answered without mentioning {{business_name}} at all.
[C] All {{answered_count}} named {{business_name}}. Good. Then I asked the wider question people ask first, "{{broad_question}}", and {{broad_missed_count}} of {{broad_answered_count}} left you out[, naming {{broad_rival_1}} instead].

Every answer is here, word for word, no login: {{scan_url}}

Your score on that check is {{score}}/100. It's measured: how often the AIs named you, plus how well they can read your site.

I work with Alphaa, an AI Agent that finds out why AI names someone else, then fixes it.

Shall I send the two fixes I'd start with? Reply "yes".

{{sender_name}}
```

## Email 2 (Day 3)

**Subject:** A: `Why {{rival_1}} gets named` / B and C: `Why AI skips {{business_name}}`

```
Hi {{first_name}},

Here's the part of the check I didn't send last time: why it happened.

When I read {{business_name}}'s website the way an AI assistant does, two things stood out:

1. {{gap_1}}.[ {{gap_rival_domain}} has this.]
2. {{gap_2}}.

AI names businesses it can verify. If it can't read your opening hours, your town or a clear answer to the question it was asked, it picks someone it can.

None of this is difficult. It just has to be done, then kept up every week.

Shall I send the exact wording for fix 1, so you or whoever looks after your website can sort it this week?

{{sender_name}}
```

**Fallback (no failed site check):** replace the numbered block with: `Your website passed the checks I ran, so the gap isn't on your site. It's on the pages those AIs leaned on when they answered: directories such as Yell, review sites and pages that answer the exact question asked.` Ask: `Shall I send the list of pages those answers leaned on?`

## Email 3 (Day 7)

**Subject:** `£79 a month, and what happens if it doesn't work`

```
Hi {{first_name}},

The plain version of what this costs.

Alphaa is £79 a month plus VAT. One new {{customer_noun_singular}} is often worth more than a whole year of it (£948).

For that, the AI Agent asks all four AIs your {{customer_noun}}' questions every week, writes the pages and answers they quote, keeps your Google Business Profile active and tells you in plain English what it did. Nothing goes live until you approve it.

If no AI names you within 90 days, your next month is free. Monthly, cancel any time, with a 7-day refund on the first payment.

Get ChatGPT to recommend {{business_name}}: https://alphaa.app/uk

{{sender_name}}
```

`{{customer_noun_singular}}`: prospect list (patient / client / customer / job). For trades write "One new job".

## Email 4 (Day 12)

**Subject:** `AI answers change. Want to know when yours does?`

```
Hi {{first_name}},

Last email from me.

AI answers move week to week as businesses publish pages and collect reviews. What the four AIs said about {{business_name}} on {{scan_date}} won't stay that way, in either direction.

So here's a low-effort option. Reply "check" and in 30 days I'll ask the same question again, "{{question}}", and send you only what changed. If {{business_name}} starts getting named, you'll see it. If someone else moves ahead, you'll see that too.

Your report stays online either way: {{scan_url}}

If it's a no, there's no need to reply. You won't hear from me again after this.

{{sender_name}}
```
