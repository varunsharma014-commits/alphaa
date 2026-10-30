import type { Market } from "./types"

export const market: Market = {
  copy: {
    key: "uk",
    path: "/uk",
    lang: "en-GB",
    hreflang: "en-GB",
    country: "United Kingdom",
    title: "Get Recommended by ChatGPT in the UK | Alphaa",
    description:
      "Alphaa is an AI Agent that gets UK businesses recommended by ChatGPT, Gemini, Claude and Perplexity. I do the work; you tap approve. Free 60-second check.",
    h1a: "Get customers from",
    h1b: "Your AI Agent does the work.",
    sub: "Your customers in Manchester, Leeds or Bristol ask ChatGPT who to ring. It names someone. If it isn’t you, I find out why, fix it, and tell you exactly what I did.",
    cta: "Check my business — free",
    guarantee: ["If no AI names you within 90 days,", "your next month is free."],
    fine: "No card needed. I check ChatGPT, Gemini, Claude and Perplexity.",
    arrows: ["it's live, have a go", "your real answers, in 60s"],
    greet: {
      startHere: "Start here",
      lines: [
        "Hello. I'm Alphaa, an AI Agent.",
        "I get UK businesses recommended by ChatGPT, Gemini, Claude and Perplexity.",
      ],
      ask: "What's your website?",
      hint: "Nothing to install. No card. Just your website.",
      idleHint:
        "Type your website and press Enter. I'll ask ChatGPT, Gemini, Claude and Perplexity about you, live, in about 60 seconds.",
    },
    pillarsTitle: "What I do for UK businesses",
    pillars: [
      {
        title: "I find out why AI names someone else",
        body: "Every week I ask the four AIs the questions your customers ask, the way people in your area ask them, and show you which practice, firm or engineer gets named instead, and what they have that you don't.",
      },
      {
        title: "I do the work to fix it",
        body: "I write the pages and answers AI quotes, correct the details it has wrong (phone, address, opening hours), and draft your Google Business Profile posts and review replies. You approve each change with one tap.",
      },
      {
        title: "I tell you what changed",
        body: "A short weekly briefing in plain English: what I did, what the AIs now say about you, and what's waiting for your yes. No reports to wade through.",
      },
    ],
    whereTitle: "Where AI looks you up in the UK",
    whereIntro:
      "Before AI recommends a business, it reads what other sites say about it. For UK firms, these carry the most weight:",
    where: [
      { name: "Google Business Profile", why: "Your opening hours, category and reviews: usually the first thing AI checks." },
      { name: "Trustpilot and Google reviews", why: "Recent, answered reviews tell AI you're active and trusted." },
      { name: "Yell, Checkatrade and Bark", why: "UK directories AI often reads for local trades and services." },
      { name: "Your own website", why: "Clear service pages and plain-English answers AI can quote word for word." },
    ],
    priceTitle: "One AI Agent. A fraction of an agency retainer.",
    priceSub: "Everything it takes to get named by AI, done for you.",
    priceItems: [
      "Weekly checks of what ChatGPT, Gemini, Claude and Perplexity say about you",
      "Your Google Business Profile kept fresh: posts and review replies drafted for you",
      "Nothing goes live until you tap approve",
      "Month to month. Cancel in two clicks. 7-day refund on your first charge.",
      "If no AI names you within 90 days, your next month is free.",
    ],
    priceCta: "Get recommended by AI — {starter}/month",
    priceNote: "Starter {starter}, Pro {pro} (up to 3 locations), Full Service {full}. Monthly, cancel any time. Prices exclude VAT where it applies.",
    faqTitle: "Questions from UK business owners",
    faq: [
      {
        q: "Does Alphaa work for UK businesses?",
        a: "Yes. I ask ChatGPT, Gemini, Claude and Perplexity the questions customers in your area ask, check the UK sites AI reads (Google, Trustpilot, Yell, Checkatrade and the rest), and fix what's missing.",
      },
      {
        q: "How much does it cost?",
        a: "Starter is {starter} a month, Pro is {pro} (up to 3 locations) and Full Service is {full}, where a person publishes everything for you. Month to month, cancel in two clicks, and the check on this page is free.",
      },
      {
        q: "I'm a sole trader with no time for marketing. Is this for me?",
        a: "Yes. I do the work and tell you what I did in plain English. If you can tap Approve on your phone between jobs, you can use Alphaa.",
      },
      {
        q: "Will it post anything without asking me?",
        a: "No. Nothing goes live until you approve it, and every change to your website is logged and can be undone.",
      },
      {
        q: "What about my data?",
        a: "We follow UK GDPR. I only use your website and public information to check what AI says, and you can ask us to delete your data at any time.",
      },
    ],
    english: "Not in the UK? Go to the main site",
  },
  extra: {
    questionsTitle: "What people in the UK really ask AI",
    questionsIntro:
      "These are the kinds of questions your customers type into ChatGPT instead of searching Google. Every week I ask them for you and see who gets named.",
    questions: [
      { q: "Which dentist in Clapham is taking on new patients for Invisalign?", who: "Dental practices" },
      { q: "Can you recommend a good conveyancing solicitor in Leeds?", who: "Solicitors" },
      { q: "My combi boiler's lost pressure. Who's a reliable Gas Safe engineer in south Manchester?", who: "Heating engineers" },
      { q: "Where's a safe, qualified clinic for lip filler in Birmingham?", who: "Aesthetics clinics" },
      { q: "Who's a trustworthy emergency plumber in Glasgow who'll come out tonight?", who: "Plumbers" },
    ],
    industriesTitle: "Built for the trades where one customer is worth a lot",
    industriesIntro:
      "One new patient, client or boiler install can be worth more than a year of Alphaa. Here's how I work for each.",
    industryLinkPrefix: "More for",
    industries: [
      {
        slug: "dental-practices",
        name: "Dental practices",
        title: "Get Your Dental Practice Recommended by ChatGPT",
        description:
          "When patients ask ChatGPT for a dentist in their area, your practice should be in the answer. I find out why it isn't, fix it, and you approve each change.",
        h1: "Get your dental practice recommended by AI",
        sub: "Patients now ask ChatGPT which practice to book with, private or NHS. I make sure it can name yours, and I show you who it names today.",
        questions: [
          "Which dentist in Clapham is taking on new private patients?",
          "Who does affordable Invisalign in Manchester city centre?",
          "Is there an emergency dentist open on Saturday in Edinburgh?",
        ],
        where: [
          { name: "Google Business Profile", why: "Opening hours, treatments and reviews: AI checks these first when someone asks for a dentist nearby." },
          { name: "NHS website (Find a dentist)", why: "Whether you take NHS patients and your contact details are read from here, so they need to match your site." },
          { name: "Doctify", why: "Patient reviews of named dentists that AI can quote when comparing practices." },
          { name: "Your practice website", why: "Clear pages on each treatment, fees and how to register as a new patient give AI something to quote." },
        ],
        steps: [
          { title: "I ask what your patients ask", body: "Every week I put questions like 'Invisalign near me' and 'emergency dentist open now' to all four AIs, and show you which practices get named instead of yours." },
          { title: "I write the pages AI quotes", body: "Treatment pages, fees and FAQs in plain English (implants, whitening, hygienist appointments, registering as a new patient), ready for you to approve." },
          { title: "I keep your listings consistent", body: "I check your phone number, address and opening hours match across Google and the sites AI reads, and draft replies to your patient reviews." },
        ],
        faq: [
          { q: "Does this work for a mixed NHS and private practice?", a: "Yes. I make it clear to AI which treatments are private, whether you're taking on NHS patients, and how to register, so you're named for the right questions." },
          { q: "Will you write anything about treatments without checking with me?", a: "No. Every page and answer waits for your approval, so you or your practice manager can check the clinical wording first." },
          { q: "We already have an agency doing our website.", a: "That's fine. If someone else runs your site, I email them the exact change. Most agencies work on Google links, not the answers AI gives." },
        ],
      },
      {
        slug: "solicitors",
        name: "Solicitors",
        title: "Get Your Law Firm Recommended by ChatGPT",
        description:
          "Clients now ask ChatGPT which solicitor to instruct. I find out why AI names another firm, write the answers it quotes, and you approve every change.",
        h1: "Get your firm recommended by AI",
        sub: "When someone asks ChatGPT for a family, conveyancing or employment solicitor in their town, it names a few firms. I work to make yours one of them.",
        questions: [
          "Can you recommend a conveyancing solicitor in Leeds with fixed fees?",
          "Who's a good family law solicitor in Bristol for a divorce?",
          "I've been unfairly dismissed. Which employment solicitor in Birmingham should I speak to?",
        ],
        where: [
          { name: "Law Society (Find a Solicitor)", why: "AI uses it to confirm you're a regulated firm and what areas of law you practise." },
          { name: "ReviewSolicitors", why: "Client reviews of named solicitors that AI often reads when comparing firms." },
          { name: "Google Business Profile", why: "Office locations, hours and reviews for each branch AI might recommend." },
          { name: "Your firm's website", why: "Practice-area pages, fee information and plain answers to client questions AI can quote." },
        ],
        steps: [
          { title: "I ask what clients ask", body: "Each week I ask the four AIs questions about your practice areas in your towns, and show you which firms get named and why." },
          { title: "I write answers AI can quote", body: "Practice-area pages and FAQs in plain English (how conveyancing works, what a divorce costs, what to do after a dismissal), for you to check and approve." },
          { title: "I keep your firm's details right", body: "I make sure your offices, phone numbers and areas of law match across Google, the Law Society and the sites AI reads, and draft replies to client reviews." },
        ],
        faq: [
          { q: "Can you write content that's accurate for a regulated firm?", a: "I draft, and nothing is published until you or a colleague approves it, so a fee-earner can check every page before it goes live." },
          { q: "We have several offices. Does that work?", a: "Yes. Pro covers up to 3 locations, each with its own pages, so AI can name the right office for someone in Leeds or York." },
          { q: "Will it reply to reviews on my behalf?", a: "I draft the replies; you approve them. I never confirm someone was a client or mention case details in a reply." },
        ],
      },
      {
        slug: "plumbers-heating-engineers",
        name: "Plumbers & heating engineers",
        title: "Get Plumbers & Heating Engineers Named by ChatGPT",
        description:
          "Homeowners ask ChatGPT who to call for a boiler or a leak. I find out why AI names another engineer, fix it, and you approve each change from your phone.",
        h1: "Get your plumbing and heating business recommended by AI",
        sub: "When a boiler packs up, more people ask ChatGPT who to ring. I make sure it can name you, and I do the work while you're out on jobs.",
        questions: [
          "Who's a reliable Gas Safe engineer for a boiler service in south Manchester?",
          "Can you recommend an emergency plumber in Liverpool who'll come out tonight?",
          "Which local firms fit heat pumps in Bristol?",
        ],
        where: [
          { name: "Gas Safe Register", why: "AI looks for proof you're registered before it recommends anyone for boiler or gas work." },
          { name: "Checkatrade and MyBuilder", why: "Trade directories with reviews that AI reads for local plumbing and heating jobs." },
          { name: "Google Business Profile", why: "Your service area, hours and reviews: what AI checks when someone needs a plumber now." },
          { name: "Your website", why: "Clear pages for boiler installs, servicing, repairs and the areas you cover give AI something to quote." },
        ],
        steps: [
          { title: "I ask what homeowners ask", body: "Every week I ask the four AIs questions like 'boiler repair near me' for the towns you cover, and show you which engineers get named instead." },
          { title: "I write the pages AI quotes", body: "Service pages for boiler installs, servicing, power flushes and leaks, plus a page for each area you cover, ready for you to approve." },
          { title: "I keep your profile busy", body: "I draft Google Business Profile posts and replies to your reviews, and check your details match across Checkatrade, Yell and the rest." },
        ],
        faq: [
          { q: "I'm a sole trader. Have I got time for this?", a: "You don't need much. I do the work and send you a short list to approve, which takes a minute on your phone between jobs." },
          { q: "I already pay for Checkatrade. Why do I need this?", a: "Checkatrade is one of the sites AI reads. I make sure the rest of what AI finds about you, especially your own website and Google profile, backs it up." },
          { q: "Can you target the areas I actually work in?", a: "Yes. I ask the AIs about the towns and postcodes you cover and write pages for those areas, not the whole country." },
        ],
      },
      {
        slug: "aesthetics-clinics",
        name: "Aesthetics clinics",
        title: "Get Your Aesthetics Clinic Recommended by ChatGPT",
        description:
          "Clients ask ChatGPT where to go for Botox or filler safely. I find out why AI names another clinic, fix it, and you approve every change first.",
        h1: "Get your aesthetics clinic recommended by AI",
        sub: "People ask ChatGPT where's safe for Botox, filler or skin treatments. AI looks for qualified, well-reviewed clinics. I make sure it can find yours.",
        questions: [
          "Where's a safe, qualified clinic for lip filler in Birmingham?",
          "Who's a medically trained Botox practitioner in Chelsea?",
          "Which clinic in Glasgow is good for skin boosters and Profhilo?",
        ],
        where: [
          { name: "Save Face", why: "A register of accredited practitioners that AI can use to judge whether a clinic is safe to recommend." },
          { name: "Treatwell", why: "Bookable treatments and client reviews AI reads when comparing clinics." },
          { name: "Google Business Profile", why: "Your treatments, opening hours and reviews: AI checks these when someone asks for a clinic nearby." },
          { name: "Your clinic website", why: "Clear treatment pages, practitioner qualifications and aftercare answers AI can quote." },
        ],
        steps: [
          { title: "I ask what clients ask", body: "Every week I ask the four AIs questions like 'safe lip filler near me', and show you which clinics get named instead of yours." },
          { title: "I write the pages AI quotes", body: "Treatment pages, practitioner profiles and aftercare FAQs in plain English, written to the advertising rules for your sector and ready for you to approve." },
          { title: "I keep your reputation visible", body: "I draft replies to your reviews and Google Business Profile posts, and check your details match on the sites AI reads." },
        ],
        faq: [
          { q: "Can you advertise prescription-only treatments like Botox?", a: "I write about them the way the advertising rules allow, focusing on consultations, qualifications and aftercare. You approve every word before it goes live." },
          { q: "Does it help that I'm on a register like Save Face?", a: "It can. AI looks for signs a clinic is qualified and safe, so I make sure your registrations and qualifications are clear on your own site too." },
          { q: "I'm a solo practitioner. Is that a problem?", a: "Not at all. Many clinics are run by one practitioner. I do the work and you approve it in a tap." },
        ],
      },
    ],
    backToMarket: "Back to Alphaa UK",
    industryCta: "Check my business — free",
  },
}
