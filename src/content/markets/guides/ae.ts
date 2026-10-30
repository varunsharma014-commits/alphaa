import type { MarketGuides } from "../guides-types"

export const guides: MarketGuides = {
  base: "guides",
  label: "Guides",
  guides: [
    {
      slug: "get-recommended-by-chatgpt-uae",
      title: "How to Get Recommended by ChatGPT in the UAE",
      description:
        "A practical guide for UAE businesses: how ChatGPT, Gemini, Claude and Perplexity choose who to name, and the fixes you can make yourself this week.",
      h1: "How to get your business recommended by ChatGPT (and Gemini, Claude, Perplexity) in the UAE",
      answer:
        "AI assistants recommend the UAE businesses they can describe with confidence: a complete Google Business Profile with your exact area, recent answered reviews, consistent details on the platforms your trade uses, and a website that plainly answers the questions customers ask, in English and Arabic. Fix those signals, then ask the AIs the same questions your customers ask, every few weeks, to see what changed.",
      takeaways: [
        "AI names a handful of businesses per answer, so being described clearly and consistently matters more than being big.",
        "In the UAE, your area is part of the question: Dubai Marina, JLT, Al Barsha or Khalifa City has to appear on your listing and your site.",
        "Recent reviews that mention the service and the area, with your reply, are some of the strongest signals AI repeats.",
        "Write real answers to real questions on your website, including Arabic versions if your customers ask in Arabic.",
        "Test it yourself: ask all four AIs the question your customer would ask, in both languages, and note who gets named.",
      ],
      sections: [
        {
          h2: "Why AI recommendations matter for UAE businesses now",
          paragraphs: [
            "Picture a family that has just moved to Dubai Marina. Their son has toothache on a Thursday evening, so his mother opens ChatGPT and types: 'Which kids' dentist near Dubai Marina is open tonight and takes Daman?' ChatGPT names three clinics, gives a reason for each, and she calls the first one. If your clinic is two streets away, open late and on her insurance network, but it was not one of those three names, you lost that patient and you will never know it happened.",
            "Versions of that scene happen across the UAE for dentists, nurseries, garages, salons and brokers, because the country is full of people who are new to a neighbourhood and short on time. Asking an AI feels faster than scrolling through ten Google results, and the answer comes back as a short list of names with reasons.",
            "That short list is the whole point. A Google results page shows many businesses; an AI answer usually names three to five. There is no ad slot to buy inside the answer and no page two to scroll to.",
            "The good news is that the AIs are not guessing. ChatGPT, Gemini, Claude and Perplexity can all search the web before they answer, and they build their recommendation from what they find: your Google listing, your reviews, the platforms you appear on and your own website. Most of those inputs are things you control.",
          ],
        },
        {
          h2: "How ChatGPT, Gemini, Claude and Perplexity decide who to name",
          paragraphs: [
            "Each assistant works a little differently, but the pattern is the same. When someone asks a local question, the AI searches the web, reads a set of pages about businesses that might fit, and then writes an answer naming the ones it can describe with the most confidence. Confidence comes from agreement: when your website, your Google Business Profile, your reviews and third-party sites all say the same thing about what you do and where you are, the AI has an easy, safe answer to give.",
            "Gemini leans heavily on Google's own data, including Maps. ChatGPT and Claude run their own web searches. Perplexity shows its sources openly, a useful window into what the others probably read too. You do not need to optimise for each one separately. You need the same clear, consistent story to be easy to find wherever they look.",
            "Businesses that get skipped usually have one of three problems: the AI cannot tell exactly where they are, finds no evidence they do the specific thing asked about, or finds details that disagree, such as an old number on a directory.",
          ],
        },
        {
          h2: "Step 1: Make your Google Business Profile impossible to misread",
          paragraphs: [
            "Your Google Business Profile is the single most-read source for local recommendations, especially for Gemini. Treat it as the official record of your business, not a box you ticked once.",
          ],
          bullets: [
            "Business name: use the exact name on your trade licence and signboard. Do not stuff it with keywords like 'Best Dentist Dubai'; Google can suspend profiles for that.",
            "Category: pick the most specific primary category, such as 'Cosmetic dentist' rather than 'Dentist', and add secondary ones for real services only.",
            "Address and area: make sure the pin sits on your actual building and the address names the community people search for, such as Jumeirah Lake Towers, Dubai Marina or Al Reem Island. If you serve customers at home, set a service area covering the emirates and districts you really cover.",
            "Hours: the UAE weekend is Saturday and Sunday for most businesses, but plenty of customers still assume a Friday afternoon break. Spell out your real hours and add special hours for Ramadan, Eid and national holidays every year. Wrong hours can lead an AI to tell someone you are closed.",
            "Services and description: list each service in plain words and write a description that says who you help, where, and in which languages your team serves customers.",
            "Photos: add real photos of your entrance, building and team, which matters in towers like those in JLT or Business Bay.",
          ],
        },
        {
          h2: "Step 2: Earn reviews that say what you do and where",
          paragraphs: [
            "AI assistants quote reviews more than most owners expect. A review that says 'Dr Sara did my Invisalign at their Dubai Marina clinic and they were open late on Friday' answers three questions at once: what, where and when. A review that just says 'Great service' tells the AI almost nothing.",
            "You cannot write reviews for customers, and you should never pay for them or offer discounts in exchange, but you can make it easy and you can ask at the right moment. Send the direct review link by WhatsApp straight after a good visit, and ask customers to mention the treatment, the service or the area if they are happy to. Many UAE customers will write in Arabic, Hindi, Urdu, Tagalog or Russian; those reviews count too.",
            "Reply to every review within a few days, short and polite, never sharing private details. A calm reply to a one-star review shows the next customer and the AI that you are active and fair.",
          ],
        },
        {
          h2: "Step 3: Answer real customer questions on your website, in English and Arabic",
          paragraphs: [
            "Your website is where you get to explain yourself in full. AI assistants quote sentences that directly answer the question asked, so the best pages read like a helpful conversation, not a brochure.",
            "Start with the questions you hear on the phone and on WhatsApp every week. Which insurance do you accept? Do you do same-day appointments? Do you deliver to Jumeirah Village Circle? Is parking available? Give each important service its own page, and answer the common questions in the first few lines of that page in plain sentences.",
          ],
          bullets: [
            "Name your area on the page in the words people use: 'near Mall of the Emirates in Al Barsha', not just a postal address.",
            "If you have branches, give each branch its own page with its address, hours, phone number and map.",
            "If your customers ask in Arabic, publish real Arabic pages written for Arabic readers, not a machine translation of the English. AI answers Arabic questions more confidently when it finds Arabic content.",
            "Ask your web person to add LocalBusiness structured data, the background code that tells AI your name, address, hours and services in a format machines read easily.",
            "Check that your website does not block AI assistants from reading it. Some security settings and firewall rules quietly do this.",
          ],
        },
        {
          h2: "A worked example: one service-page answer in English and Arabic",
          paragraphs: [
            "Take a dental clinic in Al Barsha. A customer typing in English might ask ChatGPT: 'Is there a dentist near Mall of the Emirates that takes Daman and is open after 8pm?' An Arabic-speaking customer is more likely to type the way they talk: 'أبغى عيادة أسنان في البرشاء تقبل تأمين ضمان وتفتح بعد الدوام'. That question is in Gulf dialect, not textbook Arabic. Your page does not need to copy the dialect, but it should use the same key words: the area, the insurer and the time.",
            "A weak answer on the clinic's website says: 'We work with all major insurers. Contact us for details.' The AI cannot quote that, because it does not say which insurers. A strong answer looks like the two below. Swap in your own insurers, landmark and hours.",
            "Each version below answers in its first word, names the landmark people use, gives real hours and is honest about what depends on the plan. Write the Arabic fresh rather than translating word by word. Ten answers like this do more than a long 'About us' page.",
          ],
          bullets: [
            "English: 'Do you accept Daman insurance? Yes. We accept Daman and Sukoon at our Al Barsha clinic, a five-minute walk from Mall of the Emirates. Cover depends on your plan, so send us a photo of your card on WhatsApp and we will confirm before you visit. We are open until 10pm, Monday to Saturday.'",
            "Arabic: 'هل تقبلون تأمين ضمان؟ نعم، نقبل تأمين ضمان وسكون في عيادتنا بالبرشاء، على بُعد خمس دقائق سيرًا من مول الإمارات. تختلف التغطية حسب وثيقتك، لذا أرسل صورة بطاقتك عبر واتساب وسنؤكد لك قبل الزيارة. نعمل حتى العاشرة مساءً من الاثنين إلى السبت.'",
          ],
        },
        {
          h2: "Step 4: Keep your details identical everywhere, and avoid the common mistakes",
          paragraphs: [
            "Pick one English spelling and one Arabic spelling of your name and use them everywhere. Do the same with your phone number format, your building name and your area.",
            "Then go through the platforms that matter for your trade, such as Bayut and Property Finder for brokers, Fresha for salons and spas, Okadoc for clinics, TripAdvisor for restaurants and Yellow Pages UAE for most trades, and make sure each listing matches. Close or merge duplicates. A branch that shut in 2023 but still shows on a directory is exactly the kind of contradiction that makes an AI hesitate. These are the mistakes I see most often in the UAE:",
          ],
          bullets: [
            "One business, four names: 'Al Waha Auto Garage' on Google, 'Alwaha Garage LLC' on the website, 'ورشة الواحة' on the signboard and 'الواحه' on an Arabic directory. A person knows it is one garage; an AI may not.",
            "No Arabic name anywhere online, so a customer searching in Arabic has nothing to match.",
            "One phone number written three ways, or an old mobile still on a directory.",
          ],
        },
        {
          h2: "Step 5: Test what the AIs say, the way your customers ask",
          paragraphs: [
            "The only way to know where you stand is to ask. Open ChatGPT, Gemini, Claude and Perplexity and type the question a real customer would type, with the area and the detail they care about. People in the UAE tend to ask long, specific questions: 'Which pediatric dentist in Mirdif is good with nervous kids and takes Daman insurance?' or 'Who is a reliable AC maintenance company in Sharjah that can come today?'",
            "Ask in English and in Arabic, and note who gets named, what reasons the AI gives and which sources it cites. If a competitor is named, look at what they have that you lack: newer reviews, a page on that exact service, a platform you skipped. That gap is your to-do list. Repeat the questions every few weeks, because answers change.",
            "If you would rather not run these checks by hand, Alphaa's free check at alphaa.app/ae asks all four AIs your customers' question in about 60 seconds and shows you the real answers. Alphaa is an AI Agent that then keeps checking every week and does the fixes for you to approve, but everything in this guide works on its own if you prefer to do it yourself.",
          ],
        },
        {
          h2: "Your first 30 days",
          paragraphs: [
            "You do not need to do this all at once. This plan takes roughly two to three hours a week.",
          ],
          bullets: [
            "Days 1 to 3: ask all four AIs three questions your customers really ask, in English and Arabic. Note who is named, why, and which sites are cited.",
            "Days 4 to 7: fix your Google Business Profile, including holiday hours for the coming months.",
            "Week 2: choose your English and Arabic spellings, update your trade platform and directories to match, and close duplicates.",
            "Week 2: send your review link by WhatsApp after every good visit, and reply to the last three months of reviews.",
            "Week 3: answer your ten most common questions on your service pages, in English and Arabic, using the example above. Ask your web person about structured data and AI access.",
            "Week 4: ask the day-1 questions again and compare. Some changes take longer than a month, so keep going.",
          ],
        },
      ],
      faq: [
        {
          q: "How long does it take for ChatGPT to start recommending my business?",
          a: "It varies. Fixes to your Google listing and website can show up in AI answers within weeks once the assistants search the web again, but building up reviews and mentions takes longer. Recheck the same questions every few weeks rather than expecting an overnight change.",
        },
        {
          q: "Can I pay to appear in ChatGPT's recommendations?",
          a: "Not in the organic answer. The recommendations are built from what the AI finds on the web, so the way in is to make your business easy to find and easy to describe accurately.",
        },
        {
          q: "Do I need an Arabic website to be recommended in the UAE?",
          a: "Not always, but if your customers ask in Arabic, Arabic pages help a lot. AI assistants tend to answer an Arabic question using Arabic sources when good ones exist.",
        },
        {
          q: "Does social media like Instagram help with AI recommendations?",
          a: "Indirectly. Instagram is great for attention, but AI assistants mostly read websites, listings, reviews and articles. Make sure the facts on your Instagram match your Google listing and website.",
        },
      ],
      date: "2026-10-30",
    },
    {
      slug: "sites-ai-reads-uae-businesses",
      title: "Which Sites AI Reads About UAE Businesses",
      description:
        "The UAE sites ChatGPT, Gemini, Claude and Perplexity read before naming a business, from Google Maps to Bayut, Fresha and Okadoc, and how to fix each one.",
      h1: "Which sites AI reads about UAE businesses, and how to fix your presence on each",
      answer:
        "Before naming a UAE business, AI assistants read your Google Business Profile and Maps reviews, your own website, the platforms your trade uses (Bayut, Property Finder, Dubizzle, Fresha, Okadoc, TripAdvisor), directories like Yellow Pages UAE, and local news and forum mentions. Make your name, area, phone and hours identical across them, keep reviews fresh and answered, and close old duplicates.",
      takeaways: [
        "Google Business Profile and Maps reviews are the starting point for almost every local AI answer.",
        "Each trade has its own platforms in the UAE, and AI reads them as proof of what you really do.",
        "Mismatched names, numbers and closed branches across sites make AI hesitate to name you.",
        "Local press, community guides and forums like Reddit add independent evidence your own website cannot.",
        "Search for your business on each platform once a quarter and fix what is out of date.",
      ],
      sections: [
        {
          h2: "Why AI reads other sites before it trusts yours",
          paragraphs: [
            "A tenant in Al Barsha has a leaking water heater at 9pm and asks ChatGPT: 'Who is a reliable plumber in Al Barsha who can come tonight?' ChatGPT names two companies and quotes a review for each. Your team was ten minutes away, but the AI never found enough about you to name you. Usually the reason is not your website. It is everything around it.",
            "When someone in the UAE asks for a plumber, a salon or a good Lebanese restaurant in Deira, the AI does not just take each business's word for it. It looks for agreement between several sources: what you say on your website, what Google knows, what customers wrote in reviews and what independent sites say about you. The more those sources agree, the more comfortable the AI is putting your name in its answer.",
            "That means your presence on other sites is not just about getting traffic from them. It is about giving AI assistants enough consistent evidence to recommend you. Below are the sites that matter most for UAE businesses, what the AIs take from each, and what to fix.",
            "Different questions send the AI to different sites. Here are a few typical UAE questions, in English and in Arabic, with the kind of sources an AI is likely to draw on. Perplexity lists the sources it used, so running two or three of your own customers' questions there is the quickest way to see which sites matter for your trade.",
          ],
          bullets: [
            "'Which agency is reliable for a two-bedroom rental in JVC?' or 'أبغى وكيل عقاري موثوق في قرية جميرا الدائرية': Bayut and Property Finder listings, agency websites and Google reviews of the agency.",
            "'Where can I get gel nails in Al Barsha on a Sunday evening?' or 'صالون أظافر في البرشاء يفتح الأحد مساءً': Fresha profiles, Google Maps hours and recent reviews.",
            "'Female dermatologist in Khalifa City who speaks Arabic and takes Thiqa' or 'دكتورة جلدية في مدينة خليفة تتكلم عربي وتقبل ثقة': booking sites such as Okadoc, the doctor pages on clinic websites and Google.",
            "'Good shawarma near Al Seef that's open late' or 'أفضل شاورما قريبة من السيف تفتح لين متأخر': Google Maps, TripAdvisor, city guides and Reddit threads.",
          ],
        },
        {
          h2: "Google Business Profile and Google Maps reviews",
          paragraphs: [
            "This is the foundation for every trade. Gemini draws directly on Google's local data, and the other assistants regularly find Google listings and Maps information when they search. Your profile tells them your category, exact location, hours, phone, services and what customers say.",
          ],
          bullets: [
            "Claim and verify the profile, and make sure the owner account belongs to the business, not a former employee or agency.",
            "Check the map pin. In dense areas like JLT, Business Bay and Downtown Dubai a pin on the wrong tower is common.",
            "Add special hours for Ramadan, Eid and public holidays each year.",
            "Answer the questions in the Q&A section if your profile shows it, and reply to every review.",
            "Remove duplicate profiles for the same location and mark closed branches as permanently closed.",
          ],
        },
        {
          h2: "Your own website",
          paragraphs: [
            "Your website is the only source where you control every word, and AI assistants use it to fill in the detail other platforms leave out: the exact services, prices if you publish them, which insurance you accept, the languages your team speaks and the areas you serve.",
            "Make sure each main service has its own page, each branch has its own page with its address and hours, and the answers to common questions sit near the top of the page in plain sentences. If many of your customers speak Arabic, publish proper Arabic pages. Ask your web person to add LocalBusiness structured data (background code that spells out your name, address and hours for machines) and to check that your site is not blocking AI assistants from reading it.",
          ],
        },
        {
          h2: "Trade platforms: Bayut, Property Finder, Dubizzle, Fresha, Okadoc",
          paragraphs: [
            "Every trade in the UAE has a few platforms customers trust, and AI assistants read them as evidence that you really do what you claim, in the areas you claim.",
          ],
          bullets: [
            "Real estate: Bayut, Property Finder and Dubizzle show which communities you actually list in. Keep agency and agent profiles complete, with the same agency name and phone as your website, and keep listings current. Stale or duplicate listings undercut your credibility with buyers and AI alike. Advertising property in the UAE comes with permit rules, so check current requirements with the relevant authority before you publish.",
            "Salons, spas and barbers: Fresha profiles show services, prices, reviews and opening hours. Fill in every service with a plain name customers would search for, such as 'gel nails' or 'keratin treatment', and use the same address and area as on Google.",
            "Clinics: Okadoc profiles show doctors, specialities and booking availability. Make sure doctor names, specialities and clinic locations match your website exactly. Keep any medical claims careful and check your health authority's advertising rules.",
            "Home services and general trades: Dubizzle services listings and Yellow Pages UAE are worth claiming. They are often the first independent sources an AI finds for a plumber, AC company or movers.",
          ],
        },
        {
          h2: "Platform checklists: what to check on each one",
          paragraphs: [
            "Each of these takes well under an hour once you have your master record (see the next section) open beside you. Fields differ between platforms and change over time, so fill in what your platform shows and skip what it doesn't.",
          ],
          bullets: [
            "Bayut and Property Finder: agency name exactly as on your trade licence and website; office address with building and community; one main phone number; every agent profile with photo, languages spoken and the areas they cover; rented and sold listings taken down promptly; permit details shown where required (check current rules with the relevant authority).",
            "Fresha: business name, address and area matching Google; every service with a plain name, duration and starting price; team members listed with what they do; opening hours including Ramadan; a reply to every review; a link to your website.",
            "Okadoc: each doctor's full name spelled the same as on your website; speciality, languages and branch; insurance accepted, where the profile shows it; booking slots kept current so the profile never looks abandoned.",
            "TripAdvisor: listing claimed; cuisine, price range and hours set; current menu and recent photos; replies to reviews, in the reviewer's language where you can.",
            "Yellow Pages UAE and Dubizzle services: listings claimed; same name, number and area as everywhere else; old ads carrying a former number deleted.",
          ],
        },
        {
          h2: "The name problem: how one business ends up looking like four",
          paragraphs: [
            "Take a ladies' salon in JLT that trades as Lamsa Beauty Lounge. On Google it is 'Lamsa Beauty Salon JLT'. On Fresha it is 'Lamsa Ladies Salon'. The signboard says 'لمسة للتجميل' and an Arabic directory lists 'صالون لمسه', spelled with ه instead of ة. Google shows the landline, Fresha shows a manager's old mobile, and one listing still says Cluster D while the salon moved to Cluster Y last year. A customer would work it out. An AI reading four sources sees four slightly different businesses and may name none of them.",
            "Arabic adds its own traps: ة versus ه at the end of a word, with or without 'ال', different hamza forms, and several Latin spellings of the same Arabic word, such as Al Noor, Alnoor and An-Noor. None of these is wrong on its own. The problem is mixing them.",
            "The fix is a master record: one short document that every listing is copied from, never retyped from memory. Give it to whoever updates your listings, including agencies and new staff.",
          ],
          bullets: [
            "Trading name in English, exactly as you want it shown, and trading name in Arabic.",
            "One main phone number, written in one format, for example +971 4 xxx xxxx.",
            "Building, community and the landmark people use, such as 'Cluster Y, JLT, near the metro station'.",
            "Opening hours, plus Ramadan and holiday hours.",
            "Website address, and the main services named in plain words.",
          ],
        },
        {
          h2: "Your first 30 days",
          paragraphs: [
            "If your listings have never been cleaned up, this order gets the most important fixes done first.",
          ],
          bullets: [
            "Week 1: write your master record, then search your name in English and Arabic on Google and note every listing you find, including ones you did not create.",
            "Week 1: fix your Google Business Profile against the master record, and mark closed branches as permanently closed.",
            "Week 2: run the checklist above on the main platform for your trade.",
            "Week 3: update or close the remaining directories and old ads, and merge duplicates.",
            "Week 4: ask Perplexity and ChatGPT three of your customers' questions, open the sources they cite for competitors and add any site you are missing from to next quarter's list.",
          ],
        },
        {
          h2: "Restaurants and hospitality: TripAdvisor, Google Maps and delivery apps",
          paragraphs: [
            "For restaurants, cafes and hotels, TripAdvisor carries weight alongside Google Maps, especially for questions from visitors and tourists in areas like the Abu Dhabi Corniche, JBR, Downtown Dubai and Al Seef. Claim your listing, upload a current menu and photos, set the correct cuisine and price range and reply to reviews.",
            "Delivery apps such as Talabat and Deliveroo matter for the customer journey, but they are not always visible to AI in the same way. Make sure your own website and Google listing carry the essentials: your cuisine, signature dishes, hours, whether you take bookings, family seating and parking.",
          ],
        },
        {
          h2: "Local press, guides and community conversations",
          paragraphs: [
            "AI assistants give extra weight to independent mentions: articles in Khaleej Times, Gulf News or The National, listings in city guides like Time Out Dubai, community blogs, and discussions on forums such as Reddit's UAE and Dubai communities. When residents recommend you by name in a thread about 'honest garages in Al Quoz', that is exactly the kind of evidence an AI repeats.",
            "You cannot fake this, and you should not try; planted posts tend to get spotted and removed. What you can do is give people a reason to mention you: take part in community events, offer expert comments to local journalists, sponsor a school or sports club event and do work worth talking about. When you are mentioned, check the article spells your name correctly and links to your website.",
          ],
        },
        {
          h2: "A quarterly routine to keep every site in sync",
          paragraphs: [
            "Once your listings are fixed, they drift. Staff change, numbers change, a branch moves from Al Barsha to Al Quoz and an old listing never gets updated. Put a 30-minute check in your calendar every three months.",
          ],
          bullets: [
            "Search your business name in English and Arabic on Google, and on each platform you use.",
            "Compare name, area, phone number, hours and website link against your master record.",
            "Close duplicates and old branches, and update photos and services.",
            "Ask ChatGPT, Gemini, Claude and Perplexity your customers' question and note which sources they cite for your competitors; those are the sites to fix next.",
            "If you want this done for you, Alphaa's AI Agent checks the four AIs every week and drafts the fixes for your approval, or you can start with the free check at alphaa.app/ae.",
          ],
        },
      ],
      faq: [
        {
          q: "Which site matters most for AI recommendations in the UAE?",
          a: "For almost every local business it is your Google Business Profile, followed by your own website and the main platform for your trade, such as Bayut for brokers, Fresha for salons or Okadoc for clinics.",
        },
        {
          q: "Should I list my business on every directory I can find?",
          a: "No. A few accurate, well-kept listings on platforms your customers really use are worth more than dozens of thin ones. Every extra listing is one more place your details can go out of date.",
        },
        {
          q: "My business name is spelled differently on different sites. Does that matter?",
          a: "Yes. AI assistants match sources by name, address and phone. Choose one English and one Arabic spelling, then update every listing to match.",
        },
        {
          q: "How do I see which sources an AI used?",
          a: "Perplexity lists its sources under each answer, and ChatGPT shows links when it searches the web. Ask about your trade and area, then open the cited pages to see where competitors appear and you don't.",
        },
      ],
      date: "2026-10-30",
    },
  ],
}
