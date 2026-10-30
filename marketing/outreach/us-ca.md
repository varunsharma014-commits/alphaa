# US + Canada: scan-led cold email (English)

4 emails, plain text, one ask each. Body 100-130 words (footer excluded). Read `README.md` first: segments, which scans you may use, compliance.

**Before any Canadian send:** the address must pass CASL's conspicuous-publication test (published by the person on their own site, no "no unsolicited email" notice next to it, offer relevant to their role). Keep `{{source_url}}` + date + screenshot. Addresses from directories, scrapers or pattern-guessing tools: US only, never Canada.
**Quebec:** send in French (adapt `fr.md`, prices in USD) or skip. Don't send English-only cold email into Quebec without checking the French-language rules with counsel.
Prices are USD for both countries ($99 / $199 / $299).

## Merge fields

| Field | Filled from |
|---|---|
| `{{first_name}}` | Prospect list. Empty: "Hi," |
| `{{business_name}}` | `ScanLead.businessName`, else domain of `ScanLead.businessUrl` |
| `{{customer_noun}}` | Prospect list (patients / clients / customers / homeowners) |
| `{{question}}` | `ScanLead.engineResponses.<engine>.query` (fallback `ogData.insights.query`) |
| `{{answered_count}}` | `engineResponses` entries with a response over 20 characters |
| `{{missed_count}}` | Those entries with `appeared === false` |
| `{{missed_engines}}` | Same entries, keys mapped to ChatGPT / Gemini / Claude / Perplexity |
| `{{rival_1}}` | Most-named name in `engineResponses.<missed>.mentioned`, excluding the business |
| `{{rival_engine}}` | First missed engine whose `mentioned` includes `{{rival_1}}` |
| `{{broad_question}}`, `{{broad_missed_count}}`, `{{broad_answered_count}}`, `{{broad_rival_1}}` | `ogData.questions[1]` (segment C only) |
| `{{score}}` | `ScanLead.visibilityScore` (skip the prospect if `ogData.auditFallback` is true) |
| `{{gap_1}}`, `{{gap_2}}` | `ogData.siteChecks.you.checks[]` with `ok === false`, highest `CHECK_IMPACT` first, through the gap table below |
| `{{gap_rival_domain}}` | `ogData.siteChecks.competitors[].domain` that passes the `{{gap_1}}` check |
| `{{scan_date}}` | `ScanLead.createdAt`, written "October 30" |
| `{{scan_url}}` | `https://alphaa.app/scan/results?id=` + `ScanLead.id` (scan run with no email) |
| `{{source_url}}` | Prospect list: page where the address was published |
| `{{sender_name}}`, `{{sender_email}}`, `{{unsubscribe_link}}` | Sending tool |

### Gap table (check key → `{{gap_1}}` text)

| Key | Text |
|---|---|
| aibots | Your site turns AI assistants away at the door |
| robots | A setting on your site tells AI to stay out |
| indexable | Your homepage asks Google not to show it |
| render | AI sees a blank page because your words only load after extra code runs |
| canonical | Your pages tell Google a different page is the real one |
| https | Your site answers at more than one address, or isn't fully secure |
| bing | No sign you're set up with Bing, which ChatGPT's search leans on |
| llms | No short summary of your business written for AI assistants |
| sitemap | No list of your pages for Google and AI to follow |
| speed | Your site is slow to load |
| schema | Your business facts aren't in the background code AI reads |
| schemaFacts | That background code is missing your address, phone or hours |
| facts | AI couldn't find your phone, address or hours on the page |
| local | Your site doesn't clearly say which city you serve |
| meta | Your page title and Google summary don't say clearly what you do |
| headings | Your homepage has no clear main heading |
| depth | There are too few words on the page for AI to quote |
| pages | You don't have a page for each service |
| faq | You have no published answers to the questions customers ask |
| reviews | Your reviews aren't on your own site as text AI can read |
| profiles | Your site doesn't link to your Google, Yelp or social profiles |
| about | There's no About page saying who you are |
| blog | Nothing new has been published lately |

## Footer (every email, set at campaign level)

```
{{sender_name}}, Alphaa
9629033 Canada Inc., 1000 Innovation Drive, Suite 500, Kanata, ON K2K 3E7, Canada
alphaa.app | {{sender_email}}
I found your address on {{source_url}} and wrote because this concerns how {{business_name}} gets found. Not interested? Reply "no" or unsubscribe here and you won't hear from me again: {{unsubscribe_link}}
```

---

## Email 1 (Day 0)

**Subject:**
- A: `{{rival_engine}} named {{rival_1}}, not {{business_name}}`
- B: `{{business_name}} wasn't in the answer`
- C: `{{business_name}} and the wider question`

```
Hi {{first_name}},

Before writing, I asked ChatGPT, Gemini, Claude and Perplexity the question your {{customer_noun}} ask:

"{{question}}"

[A] {{missed_count}} of the {{answered_count}} that answered left {{business_name}} out. {{rival_engine}} named {{rival_1}} instead.
[B] {{missed_engines}} answered without mentioning {{business_name}} at all.
[C] All {{answered_count}} named {{business_name}}. Good. Then I asked the wider question people ask first, "{{broad_question}}", and {{broad_missed_count}} of {{broad_answered_count}} left you out[, naming {{broad_rival_1}} instead].

Every answer is here, word for word, no login: {{scan_url}}

Your score on that check is {{score}}/100. It's measured, not estimated: how often the AIs named you, plus how well they can read your site.

I work with Alphaa, an AI Agent that finds out why AI names someone else, then fixes it.

Want the two fixes I'd start with for {{business_name}}? Reply "yes" and I'll send them.

{{sender_name}}
```

## Email 2 (Day 3)

**Subject:** A: `Why {{rival_1}} gets named` / B and C: `Why AI skips {{business_name}}`

```
Hi {{first_name}},

Here's the part of the check I didn't send last time: why it happened.

When I read {{business_name}}'s site the way an AI assistant does, two things stood out:

1. {{gap_1}}.[ {{gap_rival_domain}} has this.]
2. {{gap_2}}.

AI names businesses it can verify. If it can't read your hours, your city or a clear answer to the question it was asked, it picks a business it can.

None of this is hard. It just has to be done, then kept up every week.

Should I send the exact wording for fix 1, so you or your web person can make the change this week?

{{sender_name}}
```

**Fallback when no site check failed (or `siteChecks` is null):** replace lines "When I read…" through "2. {{gap_2}}." with:

```
Your site passed the checks I ran, so the gap isn't on your site. It's on the pages those AIs leaned on when they answered: directories, review sites and pages that answer the exact question asked.
```
and change the ask to: `Should I send the list of pages those answers leaned on?`

## Email 3 (Day 7)

**Subject:** `$1,188 a year vs $24,000`

```
Hi {{first_name}},

One number, then I'll leave it with you.

An SEO agency at around $2,000 a month is $24,000 a year, and most still work on Google links, not the answers AI gives. Alphaa is $99 a month: $1,188 a year.

For that, the AI Agent asks all four AIs your {{customer_noun}}' questions every week, writes the pages and answers they quote, keeps your Google profile active, and tells you in plain English what it did. Nothing goes live until you approve it.

If no AI names you within 90 days, your next month is free. Month to month, with a 7-day refund on the first charge.

Get ChatGPT to recommend {{business_name}}: https://alphaa.app/pricing

{{sender_name}}
```

## Email 4 (Day 12)

**Subject:** `AI answers change. Want to know when yours does?`

```
Hi {{first_name}},

Last email from me.

AI answers move week to week as businesses publish pages and collect reviews. What the four AIs said about {{business_name}} on {{scan_date}} won't stay that way, in either direction.

So here's a low-effort option. Reply "check" and in 30 days I'll ask the same question again, "{{question}}", and send you only what changed. If {{business_name}} starts getting named, you'll see it. If someone else moves ahead, you'll see that too.

Your report stays online either way: {{scan_url}}

If it's a no, you don't need to reply. You won't hear from me again after this.

{{sender_name}}
```

A "check" reply is consent to one more email with the re-check result. Log it with the date.
