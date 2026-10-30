import type { MarketGuides } from "../guides-types"

export const guides: MarketGuides = {
  base: "guides",
  label: "Guides",
  guides: [
    {
      slug: "get-recommended-by-chatgpt-uk",
      title: "How to Get Your Business Recommended by ChatGPT (UK)",
      description:
        "A practical guide for UK local businesses: what ChatGPT, Gemini, Claude and Perplexity read before recommending you, and what to fix, step by step.",
      h1: "How to get your UK business recommended by ChatGPT, Gemini, Claude and Perplexity",
      answer:
        "To get recommended by ChatGPT and the other AI assistants, make it easy for them to confirm who you are, what you do and where: a complete Google Business Profile, identical details across every listing, recent reviews with replies, the right UK trade or professional registers, clear service pages answering real customer questions, and structured data. Then re-check monthly.",
      takeaways: [
        "AI recommends businesses it can see described clearly and consistently across several independent sources, not just your own website.",
        "Your name, address, phone number and category should match exactly on Google, Yell, trade directories and your site.",
        "The pages AI quotes answer a specific question in the first two lines, phrased the way a customer would ask it.",
        "Before changing anything, ask the four AIs yourself who they recommend in your town, and write the answers down.",
      ],
      sections: [
        {
          h2: "What happens when someone asks AI who to ring",
          paragraphs: [
            "A few years ago, someone in Leeds with a broken boiler typed “boiler repair Leeds” into Google and worked down a page of links. Now plenty of people type the whole question into ChatGPT, Gemini, Claude or Perplexity instead: “Who’s a reliable Gas Safe engineer in Headingley who can come out tomorrow?” The answer isn’t ten links. It’s two, three, maybe five names, often with a sentence on why each one was picked. If you’re not one of them, that customer never sees you.",
            "The AIs don’t pick names at random. When they search the web live (ChatGPT with search on, Perplexity nearly always, Gemini drawing on Google’s own data), they read listings, reviews and web pages as you ask. When they answer from memory, they rely on what was public on the web when they were trained. Either way, the raw material is the same: what’s written about you online, where, and how consistently.",
            "The good news is that you control, or can influence, most of that material. The industry calls this work AEO (answer engine optimisation), but in practice it’s a list of very ordinary jobs. Here they are, in the order I’d tackle them.",
          ],
        },
        {
          h2: "Step 1: Ask the AIs what they say today",
          paragraphs: [
            "Before you change anything, take a snapshot. Open ChatGPT, Gemini, Claude and Perplexity and ask the questions your customers actually ask, with your town or area in them. Not “best solicitor UK”, but the way people really talk: “a conveyancing solicitor in Bristol who won’t take months”, “NHS dentist taking new patients near Didsbury”, “someone to fit a new kitchen in Reading, not too pricey”.",
            "For each AI, note who gets named, the reasons given, and which sites it seems to be drawing on (Perplexity lists its sources, and ChatGPT often does too). Then ask directly: “What do you know about [your business] in [town]?” It’s surprisingly common to find old opening hours, a previous address or a service you stopped offering years ago.",
          ],
          bullets: [
            "Three to five questions per main service, in your customers’ words",
            "Always include the town or neighbourhood (“in Glasgow’s West End”)",
            "One direct question about your business name",
            "Keep the list and repeat it every month so you can see what changes",
          ],
        },
        {
          h2: "Step 2: Get your Google Business Profile right",
          paragraphs: [
            "Your Google Business Profile is the panel that appears on Google Maps and in local search. Gemini uses it directly, and the other AIs often pick up the same details as they’re repeated across the web. It’s the first thing to fix.",
            "Choose the most specific primary category you can (“Emergency plumber” or “Cosmetic dentist” rather than a vague catch-all), then add relevant secondary categories. List each service with a line of description, set accurate opening hours (including bank holidays, which are the ones most people forget), add your service area if you go to customers, and upload real, recent photos of your premises and your work. Post an update every week or two: a finished job, a seasonal tip, a new service. An active profile tells AI the business is open and trading.",
          ],
        },
        {
          h2: "Step 3: Make your details identical everywhere",
          paragraphs: [
            "AI assistants cross-check sources. If Google says you’re on Station Road, Yell still has your old unit on the industrial estate and your website lists a landline nobody answers, the AI can’t tell which is right, and it tends to name someone easier to verify.",
            "Pick one official version of your business name, address, phone number, website and category, and use it word for word on Google, Bing Places (Bing is one of the search sources behind ChatGPT), Apple Business Connect, Yell, Facebook and every trade or professional directory you’re on. Small differences matter: “J Smith Plumbing & Heating Ltd” and “Smith Plumbers” can look like two businesses to a machine. If you’re a limited company, show your registered company name, number and registered office on your website, as UK rules already require. It also links you to your Companies House record.",
          ],
        },
        {
          h2: "Step 4: Recent reviews, and reply to all of them",
          paragraphs: [
            "When AI explains why it recommends someone, it nearly always leans on reviews: “praised for turning up on time”, “patients mention how calm the dentist is”. Volume helps, but freshness and detail matter more. Twenty reviews from this year that mention “combi boiler”, “same-day callout” and “clear quote” are worth more than a hundred vague ones from 2019.",
            "Ask every happy customer, straight after the job, with a direct link by text or WhatsApp. Reply to every review, good and bad, personally and specifically. Never buy reviews or write your own: fake reviews are banned outright under the Digital Markets, Competition and Consumers Act, platforms remove them, and a profile that suddenly loses a batch of reviews looks far worse than a modest honest one.",
          ],
        },
        {
          h2: "Step 5: Website pages that answer real questions",
          paragraphs: [
            "AI quotes pages that answer a question directly, near the top. A homepage that says “Quality and service since 1985” tells it nothing. A page called “Dental implants in Leicester: how long treatment takes and what it costs” gives it something to work with.",
            "Create a page for each main service and, if you cover several areas, say which ones (“we cover Brighton, Hove, Shoreham and Lewes”). On each page, add a short FAQ with the questions people ask you on the phone, answered plainly. If you’re regulated, stay within your rules: solicitors should display the SRA badge and describe services accurately, and healthcare and aesthetics businesses need to follow the advertising codes on claims about treatments. Factual, calm, specific copy happens to be exactly what AI prefers to quote.",
          ],
          bullets: [
            "One page per service, with the town or area in the title",
            "The direct answer in the first two lines, detail afterwards",
            "FAQs written the way customers ask, not the way a brochure would",
            "Who you are: names, qualifications, registration numbers, years trading",
          ],
        },
        {
          h2: "Step 6: Structured data, and let AI read your site",
          paragraphs: [
            "Structured data (often called schema markup) is a small block of code visitors never see. It tells machines, unambiguously: this is a local business, this is its name, address, opening hours and services. The common type is LocalBusiness, with more specific versions such as Dentist, Attorney (used for solicitors), Plumber and Restaurant. On WordPress, plugins like Yoast or Rank Math can add it without code; otherwise ask whoever runs your site.",
            "Also check that your site isn’t blocking AI. Sometimes, by caution or by accident, the robots.txt file shuts out the programs that OpenAI, Anthropic, Perplexity or Google use to read the web. If they’re blocked, those assistants can’t read your site when they look you up. It’s a five-minute check for your web person.",
          ],
        },
        {
          h2: "Step 7: Re-check every month",
          paragraphs: [
            "This isn’t a one-off job. AI answers shift, competitors publish, reviews age. Rerun your Step 1 questions every month and compare: have you appeared? In which AI? For what reason? Assistants that search live, like Perplexity, tend to pick up changes sooner; those answering from memory can take much longer.",
            "If you’d rather not start from a blank page, the free check at alphaa.app/uk asks the four AIs your customers’ questions and shows you, in about 60 seconds, who they name and what you’re missing. Alphaa is an AI Agent that can then do the work in this guide for you, with your approval on every change. But every step above is something you can do yourself, an afternoon at a time.",
          ],
        },
      ],
      faq: [
        {
          q: "Can I pay ChatGPT to recommend my business?",
          a: "No. There’s no way to buy a place in the ordinary answers from ChatGPT, Gemini, Claude or Perplexity. What you can do is make the information they read about you clearer, more complete and more consistent.",
        },
        {
          q: "How long does it take to start being recommended?",
          a: "It depends on the assistant and where you’re starting from. AIs that search the web live can notice changes within weeks; those answering from memory can take much longer. That’s why a monthly check is worth doing.",
        },
        {
          q: "Do I need a website to be recommended by AI?",
          a: "It helps a lot. A business with only a Google profile can be named, but a site with a clear page per service gives AI far more to quote and verify.",
        },
        {
          q: "Is normal SEO still worth doing?",
          a: "Yes. Most of the groundwork overlaps: a well-kept Google profile, reviews, clear pages. AEO adds a focus on answering specific questions and keeping your details consistent on every site AI reads.",
        },
      ],
      date: "2026-10-30",
    },
    {
      slug: "sites-ai-reads-about-uk-local-businesses",
      title: "Which Sites AI Reads About UK Local Businesses",
      description:
        "Google, Trustpilot, Yell, Checkatrade, NHS, Law Society, Gas Safe and more: the UK sites AI reads about your business, and how to fix each one.",
      h1: "Which sites AI reads about your UK business, and how to fix each one",
      answer:
        "In the UK, ChatGPT, Gemini, Claude and Perplexity learn about local businesses mainly from Google Business Profile, review sites like Trustpilot, directories such as Yell, trade platforms like Checkatrade, TrustATrader, MyBuilder and Bark, sector sites like the NHS website, Doctify and Treatwell, and official registers. On each, keep details identical, categories precise and reviews recent and answered.",
      takeaways: [
        "AI trusts what it can confirm on several independent sites, not what you say only on your own.",
        "Google Business Profile is the base for everyone; after that, the platforms for your trade matter most.",
        "For regulated trades and professions, an official register entry is proof AI can check.",
        "Three complete, current listings beat fifteen abandoned ones with old details.",
      ],
      sections: [
        {
          h2: "Why other people’s sites matter so much",
          paragraphs: [
            "Ask Perplexity “a good physio in Nottingham for a running injury?” and the sources appear under the answer: Google listings, health directories, the odd local news article or forum thread. ChatGPT with search on does much the same, and Gemini draws straight on Google’s data. Even when an AI answers from memory, what it “knows” about a business came from these same kinds of sites.",
            "The reason is simple. An AI can’t pop round to check your shop. To decide whether to recommend you, it looks for independent confirmation. If your name, address and services appear the same way on several trusted sites, with recent reviews, you’re a safe name to give. If the information is thin or contradictory, it picks someone else.",
            "Here are the sites that carry most weight for UK local businesses, and what to fix on each. You don’t need to be everywhere: get Google right, then the two or three platforms that matter in your trade.",
          ],
        },
        {
          h2: "Google Business Profile",
          paragraphs: [
            "The panel on Google Maps and in local search is, for nearly every local business, the single most important source. Gemini uses it directly, and its details get repeated across the web where other AIs pick them up.",
          ],
          bullets: [
            "Claim and verify your profile at business.google.com if you haven’t already",
            "A precise primary category, plus relevant secondary ones",
            "Every service listed with a one-line description",
            "Accurate hours, including bank holidays and Christmas closures",
            "Real, recent photos of your premises, team and work",
            "A post every week or two, and a reply to every review",
          ],
        },
        {
          h2: "Trustpilot and Yell",
          paragraphs: [
            "Trustpilot matters most if you sell online or work nationally (removals, e-commerce, financial services, home improvement firms with several branches). If your customers use it, claim your free business profile, link your website, and invite reviews through Trustpilot’s own invitation tools rather than shortcuts. Trustpilot publicly flags businesses that break its guidelines, which is the opposite of what you want an AI to read.",
            "Yell is the UK’s long-standing business directory, and many listings have sat there for years, sometimes created automatically and never checked. That’s exactly why it’s worth a look: an old phone number or a previous address on Yell can end up in an AI answer. Find your listing, claim it (a basic listing is free) and match your name, address, phone, website and category to your Google profile. While you’re at it, do the same on Bing Places, Apple Business Connect and your Facebook page.",
          ],
        },
        {
          h2: "Trades: Checkatrade, TrustATrader, MyBuilder, Bark and Gas Safe",
          paragraphs: [
            "For plumbers, electricians, roofers, builders, landscapers and other trades, these platforms are where homeowners look for vetted tradespeople and leave detailed reviews. Checkatrade and TrustATrader both run checks before listing members, which is useful reassurance for anyone reading your profile, including an AI. MyBuilder and Bark are job-matching platforms where customers post a job and get responses, and the reviews left there are public.",
            "You don’t need all four. Pick the ones customers in your area actually use, and make those profiles complete rather than spreading yourself thin.",
            "Anyone working on gas appliances in Great Britain must be on the Gas Safe Register, and the public can check an engineer or business on the register’s website. Make sure your registered business details match the name you trade under, and put your Gas Safe registration number on your website and every listing. The same logic applies to electrical competent-person schemes such as NICEIC and NAPIT: an official, checkable record is precisely the kind of independent proof that makes AI comfortable naming you.",
          ],
          bullets: [
            "The same business name, address and phone number as your Google profile",
            "Your coverage area written out with real town and postcode district names",
            "Photos of finished jobs, not stock images",
            "Accreditations listed (Gas Safe, NICEIC, NAPIT, FENSA, TrustMark) with registration numbers",
            "Replies to reviews here as well as on Google",
          ],
        },
        {
          h2: "Health and dental: NHS website, Doctify and Save Face",
          paragraphs: [
            "GP surgeries, NHS dental practices, pharmacies and opticians have service profiles on the NHS website, and AI assistants often draw on them when people ask things like “which dentists near Sheffield are taking NHS patients?”. Practice staff can update profile details such as opening times, services and whether you’re accepting new patients, so check it is current; an out-of-date “not accepting new patients” line costs you real enquiries.",
            "Doctify carries profiles and verified patient reviews for private consultants, clinics and dental practices; complete your specialisms, locations and treatments in specific terms (“dental implants”, “Invisalign”, not just “dentistry”). For non-surgical aesthetics such as injectables and skin treatments, Save Face is an accredited register of practitioners whose premises and qualifications have been checked; if you’re eligible, being listed is a strong trust signal. Your GDC or GMC registration and any CQC registration are official records too, so keep the details consistent with how you present yourself online.",
          ],
        },
        {
          h2: "Legal: Find a Solicitor and ReviewSolicitors",
          paragraphs: [
            "The Law Society’s Find a Solicitor directory lists firms and individual solicitors with their offices and areas of practice. Check that your firm’s offices, practice areas and contact details are accurate and match your website. Combined with the SRA digital badge on your site, it gives AI an official confirmation of who you are and what you do.",
            "ReviewSolicitors is a review platform for law firms in England and Wales, and it often appears when people ask AI for, say, “a family solicitor in Cardiff with good reviews”. Claim your firm’s profile, invite clients to review once a matter has closed, and reply professionally, without revealing anything confidential.",
          ],
        },
        {
          h2: "Beauty and wellbeing: Treatwell",
          paragraphs: [
            "For hair salons, barbers, nail bars, beauty salons and spas, Treatwell is a major booking and review platform. List treatments by the names clients actually search for (“balayage”, “lash lift”, “gel manicure”), keep stylists and hours up to date, and encourage clients to review after appointments. Those treatment names are exactly the words people use when they ask AI where to book.",
          ],
        },
        {
          h2: "How to do this without losing weeks",
          paragraphs: [
            "Make a simple spreadsheet with three columns: site, link to your listing, details to fix. Start with Google, then Yell, then the two or three platforms for your trade. Give it an hour a week and you’ll have most of it sorted within a month. Whenever your hours, phone number or address change, update every row the same day.",
            "To see which of these sites the AIs are actually leaning on for your type of business in your town, the free check at alphaa.app/uk asks all four assistants who they recommend and shows you where you appear and where you don’t. From there you can fix things yourself, or let Alphaa’s AI Agent do it, with your approval on each change.",
          ],
        },
      ],
      faq: [
        {
          q: "Do I have to pay directories to appear in AI answers?",
          a: "No. Basic listings on Google, Yell, Trustpilot and most platforms are free. What matters to AI is accurate, complete details and recent reviews, not advertising spend.",
        },
        {
          q: "Which platform matters most for my trade?",
          a: "Test it: ask Perplexity for a recommendation in your category and town, then look at the sources it cites. The sites that show up there are the ones to fix first.",
        },
        {
          q: "What should I do about duplicate or out-of-date listings?",
          a: "Claim and correct them, or ask the platform to merge or remove the duplicate. A listing with old details confuses AI more than a missing one.",
        },
        {
          q: "Does being on an official register really help?",
          a: "It gives AI an independent, authoritative record of who you are and what you’re qualified to do. Make sure the name and address on the register match how you trade.",
        },
      ],
      date: "2026-10-30",
    },
  ],
}
