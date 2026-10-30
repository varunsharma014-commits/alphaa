# UAE: scan-led email (English + Arabic)

4 emails, plain text, one ask each. Body 100-130 words (footer excluded). Read `README.md` first.

**Send gate (not cleared for cold email):** TDRA's rules on unsolicited electronic communications require opt-in consent for marketing messages, and the Federal PDPL is read by Baker McKenzie as requiring consent for email direct marketing. A B2B exemption is claimed only by vendor blogs. So this sequence goes only to:
1. people who opted in (asked for their check on /ae or /ae/ar, replied yes on LinkedIn, gave a card at an event and agreed to hear from us), **or**
2. business addresses, **after UAE counsel confirms in writing** that the use case is allowed (and whether DIFC/ADGM recipients change the answer).

Until then, use LinkedIn (permission-first, like `it.md`), the /ae pages with ads, and partner/chamber events. No cold WhatsApp, no cold calls (2024 telemarketing rules).

Language: English by default. Use Arabic when the business's site is Arabic-first or the contact writes in Arabic. The check asks the AIs in the site's language; the report page is in English for now.
Prices: AED 369 / 739 / 1,099 a month, excluding VAT where it applies.

## Merge fields

Same derivations as `us-ca.md` and `README.md` (all from `ScanLead`), plus:

| Field | Filled from |
|---|---|
| `{{area}}` | `ScanLead.city` (often an area such as "Dubai Marina"). Empty or "your area": drop the phrase |
| `{{consent_basis}}` | Prospect list: "asked for a check on alphaa.app/ae on 2 Nov", "replied on LinkedIn", or counsel-approved B2B. Required; used in the footer |
| `{{customer_noun}}` / `{{customer_noun_ar}}` | Prospect list: patients / clients / customers; المرضى / العملاء |
| `{{gap_1_ar}}`, `{{gap_2_ar}}` | Same check keys, through the Arabic gap table below |

English gap texts: the table in `us-ca.md`.

### Arabic gap table (key → `{{gap_1_ar}}`)

| Key | النص |
|---|---|
| aibots | موقعك يمنع مساعدات الذكاء الاصطناعي من الدخول |
| robots | إعداد في موقعك يطلب من الذكاء الاصطناعي عدم قراءته |
| indexable | صفحتك الرئيسية تطلب من Google عدم عرضها |
| render | يرى الذكاء الاصطناعي صفحة فارغة لأن نصوصك لا تظهر إلا بعد تشغيل كود إضافي |
| canonical | صفحاتك تخبر Google أن صفحة أخرى هي الأصل |
| https | موقعك يعمل على أكثر من عنوان، أو غير آمن بالكامل |
| bing | لا يوجد ما يدل على تسجيل موقعك في Bing الذي يعتمد عليه بحث ChatGPT |
| llms | لا يوجد ملخص لنشاطك مكتوب لمساعدات الذكاء الاصطناعي |
| sitemap | لا توجد قائمة بصفحاتك لـ Google والذكاء الاصطناعي |
| speed | موقعك بطيء في التحميل |
| schema | بيانات نشاطك غير موجودة في الكود الخلفي الذي يقرؤه الذكاء الاصطناعي |
| schemaFacts | هذا الكود الخلفي لا يحتوي على عنوانك أو هاتفك أو ساعات العمل |
| facts | لم يجد الذكاء الاصطناعي هاتفك أو عنوانك أو ساعات العمل في الصفحة |
| local | موقعك لا يذكر بوضوح المنطقة التي تخدمها |
| meta | عنوان صفحتك وملخصها في Google لا يوضحان ما تقدمه |
| headings | صفحتك الرئيسية بلا عنوان رئيسي واضح |
| depth | النص في الصفحة قليل جدًا ولا يكفي ليقتبس منه الذكاء الاصطناعي |
| pages | لا توجد صفحة لكل خدمة تقدمها |
| faq | لا توجد إجابات منشورة عن الأسئلة التي يطرحها عملاؤك |
| reviews | تقييماتك غير موجودة في موقعك كنص يقرؤه الذكاء الاصطناعي |
| profiles | موقعك لا يربط بملفك على Google أو حساباتك على وسائل التواصل |
| about | لا توجد صفحة «من نحن» تعرّف بك |
| blog | لم يُنشر شيء جديد مؤخرًا |

## Footers (every email)

English:
```
{{sender_name}}, Alphaa
9629033 Canada Inc., 1000 Innovation Drive, Suite 500, Kanata, ON K2K 3E7, Canada
alphaa.app | {{sender_email}}
You're getting this because {{consent_basis}}. Your data and rights: alphaa.app/privacy. To stop these emails, reply "stop" or click: {{unsubscribe_link}}
```

Arabic:
```
{{sender_name}}، Alphaa
9629033 Canada Inc., 1000 Innovation Drive, Suite 500, Kanata, ON K2K 3E7, Canada
alphaa.app | {{sender_email}}
تصلك هذه الرسالة لأن {{consent_basis_ar}}. بياناتك وحقوقك: alphaa.app/privacy. لإيقاف هذه الرسائل، ردّ بكلمة «إيقاف» أو اضغط هنا: {{unsubscribe_link}}
```

---

# English version

## Email 1 (Day 0)

**Subject:** A: `{{rival_engine}} named {{rival_1}}, not {{business_name}}` / B: `{{business_name}} wasn't in the answer` / C: `{{business_name}} and the wider question`

```
Hi {{first_name}},

I asked ChatGPT, Gemini, Claude and Perplexity the question your {{customer_noun}} ask:

"{{question}}"

[A] {{missed_count}} of the {{answered_count}} that answered left {{business_name}} out. {{rival_engine}} named {{rival_1}} instead.
[B] {{missed_engines}} answered without mentioning {{business_name}} at all.
[C] All {{answered_count}} named {{business_name}}. Good. Then I asked the wider question people ask first, "{{broad_question}}", and {{broad_missed_count}} of {{broad_answered_count}} left you out[, naming {{broad_rival_1}} instead].

Every answer is here, word for word, no login: {{scan_url}}

Your score on that check is {{score}}/100. It's measured: how often the AIs named you, plus how well they can read your site.

I work with Alphaa, an AI Agent that finds out why AI names someone else, then fixes it.

Want the two fixes I'd start with? Reply "yes".

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

AI names businesses it can verify. If it can't read your exact area, your hours or a clear answer to the question it was asked, it picks someone it can.

None of this is hard. It just has to be done, then kept up every week.

Shall I send the exact wording for fix 1, so your team or web person can make the change this week?

{{sender_name}}
```

Fallback (no failed site check): `Your website passed the checks I ran, so the gap is on the pages those AIs leaned on when they answered: Google Maps reviews, platforms such as Okadoc, Fresha, Bayut or Property Finder, and pages that answer the exact question.` Ask: `Shall I send the list of those pages?`

## Email 3 (Day 7)

**Subject:** `AED 369 a month, and what happens if it doesn't work`

```
Hi {{first_name}},

The plain version of what this costs.

Alphaa is AED 369 a month plus VAT. One new {{customer_noun_singular}} is often worth more than a year of it.

For that, the AI Agent asks all four AIs your {{customer_noun}}' questions every week, writes the pages and answers they quote, keeps your Google Business Profile active and tells you in plain English what it did. Nothing goes live until you approve it.

If no AI names you within 90 days, your next month is free. Monthly, cancel any time, with a 7-day refund on the first payment.

Get ChatGPT to recommend {{business_name}}: https://alphaa.app/ae

{{sender_name}}
```

## Email 4 (Day 12)

**Subject:** `AI answers change. Want to know when yours does?`

```
Hi {{first_name}},

Last email from me.

AI answers move week to week as businesses publish pages and collect reviews. What the four AIs said about {{business_name}} on {{scan_date}} won't stay that way, in either direction.

So here's a simple option. Reply "check" and in 30 days I'll ask the same question again, "{{question}}", and send you only what changed. If {{business_name}} starts getting named, you'll see it. If someone else moves ahead, you'll see that too.

Your report stays online either way: {{scan_url}}

If it's a no, there's no need to reply. You won't hear from me again after this.

{{sender_name}}
```

---

# النسخة العربية

Plain Modern Standard Arabic, polite and direct. Business names, AI names and links stay in Latin script.

## الرسالة 1 (اليوم 0)

**الموضوع:** A: `{{rival_engine}} ذكر {{rival_1}} وليس {{business_name}}` / B: `{{business_name}} لم يظهر في الإجابة` / C: `{{business_name}} والسؤال الأوسع`

```
مرحبًا {{first_name}}،

سألتُ ChatGPT وGemini وClaude وPerplexity السؤال الذي يطرحه {{customer_noun_ar}}:

«{{question}}»

[A] {{missed_count}} من أصل {{answered_count}} أجابت دون أن تذكر {{business_name}}. وذكر {{rival_engine}} اسم {{rival_1}} بدلًا منك.
[B] أجابت {{missed_engines}} دون أي ذكر لـ {{business_name}}.
[C] ذكرتك الإجابات الـ {{answered_count}} كلها، وهذا جيد. ثم سألتُ السؤال الأوسع الذي يُطرح أولًا، «{{broad_question}}»، فتجاهلتك {{broad_missed_count}} من أصل {{broad_answered_count}}[، وذكرت {{broad_rival_1}}].

كل الإجابات حرفيًا هنا، دون تسجيل (الصفحة بالإنجليزية حاليًا): {{scan_url}}

نتيجتك في هذا الفحص {{score}}/100، وهي مقيسة وليست تقديرًا: كم مرة ذكرك الذكاء الاصطناعي، ومدى قدرته على قراءة موقعك.

أعمل مع Alphaa، وكيل ذكاء اصطناعي يكتشف لماذا يذكر الذكاء الاصطناعي غيرك، ثم يصلح ذلك.

هل أرسل لك أول إصلاحين أبدأ بهما؟ ردّ بكلمة «نعم».

{{sender_name}}
```

## الرسالة 2 (اليوم 3)

**الموضوع:** A: `لماذا يُذكر {{rival_1}}` / B وC: `لماذا يتجاهل الذكاء الاصطناعي {{business_name}}`

```
مرحبًا {{first_name}}،

هذا هو الجزء الذي لم أرسله في المرة السابقة: السبب.

قرأتُ موقع {{business_name}} كما يقرؤه مساعد الذكاء الاصطناعي، فلفت نظري أمران:

1. {{gap_1_ar}}.[ وهذا موجود لدى {{gap_rival_domain}}.]
2. {{gap_2_ar}}.

الذكاء الاصطناعي يذكر الأنشطة التي يستطيع التحقق منها. إذا لم يجد منطقتك بالتحديد أو ساعات عملك أو إجابة واضحة عن السؤال، يختار غيرك.

لا شيء من هذا صعب. المطلوب أن يُنفَّذ، ثم يُتابَع كل أسبوع.

هل أرسل لك النص الدقيق للإصلاح الأول ليطبّقه فريقك أو مسؤول موقعك هذا الأسبوع؟

{{sender_name}}
```

البديل (إذا نجح الموقع في كل الفحوص): `موقعك اجتاز الفحوص التي أجريتها، فالفجوة ليست في موقعك، بل في الصفحات التي اعتمد عليها الذكاء الاصطناعي في إجابته: تقييمات خرائط Google ومنصات مثل Okadoc وFresha وBayut وProperty Finder، والصفحات التي تجيب عن السؤال نفسه.` والطلب: `هل أرسل لك قائمة هذه الصفحات؟`

## الرسالة 3 (اليوم 7)

**الموضوع:** `369 درهمًا شهريًا، وماذا لو لم ينجح`

```
مرحبًا {{first_name}}،

التكلفة بوضوح.

اشتراك Alphaa بـ 369 درهمًا شهريًا، دون ضريبة القيمة المضافة. وعميل جديد واحد يساوي غالبًا أكثر من سنة كاملة منه.

مقابل ذلك، يسأل وكيل الذكاء الاصطناعي كل أسبوع الأنظمة الأربعة أسئلة {{customer_noun_ar}}، ويكتب الصفحات والإجابات التي تقتبسها، ويُبقي ملفك التجاري على Google نشطًا، ويخبرك بلغة بسيطة بما فعله. لا يُنشر شيء دون موافقتك.

إذا لم يذكرك أي ذكاء اصطناعي خلال 90 يومًا، فالشهر التالي مجاني. اشتراك شهري يمكنك إلغاؤه في أي وقت، مع استرداد خلال 7 أيام من أول دفعة.

اجعل ChatGPT يرشّح {{business_name}}: https://alphaa.app/ae/ar

{{sender_name}}
```

## الرسالة 4 (اليوم 12)

**الموضوع:** `إجابات الذكاء الاصطناعي تتغير. هل تريد أن تعرف متى؟`

```
مرحبًا {{first_name}}،

هذه آخر رسالة مني.

إجابات الذكاء الاصطناعي تتغير من أسبوع لآخر مع نشر الصفحات وتراكم التقييمات. ما قالته الأنظمة الأربعة عن {{business_name}} في {{scan_date}} لن يبقى كما هو، في أي اتجاه.

لذلك أقترح خيارًا بسيطًا: ردّ بكلمة «افحص»، وبعد 30 يومًا أطرح السؤال نفسه، «{{question}}»، وأرسل لك ما تغيّر فقط.

تقريرك يبقى متاحًا في كل الأحوال: {{scan_url}}

إن لم يكن الأمر مناسبًا، لا داعي للرد. لن تصلك مني رسائل أخرى.

{{sender_name}}
```
