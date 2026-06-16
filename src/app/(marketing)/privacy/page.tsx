export const metadata = { title: "Privacy Policy — Alphaa" }

const sections = [
  {
    title: "1. Introduction",
    body: `Alphaa ("Alphaa," "we," "us," or "our") is committed to protecting the privacy and security of your personal information. This Privacy Policy describes how we collect, use, disclose, and protect information when you use our AI search visibility platform and related services (the "Service").

This Policy applies to all users of the Service, including visitors to our website. By using the Service, you agree to the collection and use of information in accordance with this Policy. If you do not agree to this Policy, please do not use the Service.

This Policy is designed to comply with applicable privacy laws, including the General Data Protection Regulation ("GDPR") for users in the European Economic Area, and the California Consumer Privacy Act ("CCPA") for California residents.`,
  },
  {
    title: "2. Information We Collect",
    body: `We collect information in the following categories:

Account Information: When you create an account, we collect your name, email address, and password credentials (managed securely by Clerk, our authentication provider).

Business Information: Information you provide about your business, including business name, address, phone number, website URL, business category, hours of operation, and any other details you submit to the Service.

Google API Data: When you connect your Google Business Profile, we access your business profile information, post history, photo data, review content, and performance metrics (impressions, clicks, calls) via Google's official APIs. This data is used exclusively to provide the Service.

Usage Data: Information about how you interact with the Service, including pages visited, features used, actions taken, timestamps, IP address, browser type, operating system, and device identifiers.

Communications: Records of your communications with us, including support requests and email correspondence.

Payment Information: We do not store your full payment card details. Payment transactions are processed and stored by Stripe, our payment processor. We receive limited transaction metadata (subscription status, billing dates, last 4 digits of card) for account management purposes.

AI Content Data: Business information and prompts submitted to generate AI content on your behalf, including queries sent to the Anthropic Claude API.`,
  },
  {
    title: "3. How We Use Your Information",
    body: `We use the information we collect for the following purposes:

Service Delivery: To provide, maintain, and improve the features of the Alphaa platform, including generating content, posting to your Google Business Profile, tracking AI search visibility, and delivering weekly reports.

Content Generation: To send your business information to the Anthropic Claude API for the purpose of generating optimized content on your behalf.

Transactional Communications: To send emails directly related to your account and use of the Service, including: welcome and onboarding messages, weekly visibility reports, billing confirmations and receipts, product update notifications, and service interruption alerts.

Customer Support: To respond to your inquiries, troubleshoot issues, and provide technical assistance.

Security and Fraud Prevention: To detect, investigate, and prevent fraudulent activity, unauthorized access, and other illegal activities.

Legal Compliance: To comply with applicable laws, regulations, and legal processes.

We do NOT use your information for behavioral advertising, third-party ad targeting, or to sell your personal information to any third party.`,
  },
  {
    title: "4. Third-Party Processors",
    body: `We share your information with the following service providers solely to operate the Service. Each provider is bound by data processing agreements and contractual obligations to protect your data:

Clerk (Authentication)
Purpose: User account creation, login, session management, and identity verification.
Data shared: Email address, name, authentication tokens.
Privacy policy: https://clerk.com/privacy

Stripe (Payments)
Purpose: Processing subscription payments, managing billing cycles, issuing refunds.
Data shared: Email address, subscription plan, billing metadata. Full card details are submitted directly to Stripe and never pass through Alphaa servers.
Privacy policy: https://stripe.com/privacy

Railway (Hosting & Infrastructure)
Purpose: Cloud hosting and database services for the Alphaa platform.
Data shared: All application data is stored on Railway-hosted infrastructure in the United States.
Privacy policy: https://railway.app/legal/privacy

Resend (Transactional Email)
Purpose: Delivering transactional emails including reports, billing notices, and account communications.
Data shared: Your email address and the content of transactional emails.
Privacy policy: https://resend.com/privacy

Anthropic (AI Content Generation)
Purpose: Generating AI-powered content (business descriptions, posts, FAQs) using the Claude API.
Data shared: Your business name, location, category, and other business details necessary to generate relevant content. We do not send your personal contact information or payment data to Anthropic.
Privacy policy: https://www.anthropic.com/privacy

Google APIs (Google Business Profile Integration)
Purpose: Posting content to your Google Business Profile, retrieving performance metrics.
Data shared: OAuth tokens and business profile data as authorized by you. See Section 5 for full Google API disclosure.
Privacy policy: https://policies.google.com/privacy

We do not share your personal information with any other third parties except as required by law.`,
  },
  {
    title: "5. Google API Limited Use Disclosure",
    body: `This section constitutes our required disclosure under Google's API Services User Data Policy (https://developers.google.com/terms/api-services-user-data-policy).

Alphaa's use of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.

OAuth Scopes We Request and Why:

• https://www.googleapis.com/auth/business.manage (Google Business Profile)
  We use this scope to read your business profile information (name, address, hours, category), retrieve existing posts and performance metrics (impressions, clicks, calls), publish new posts you generate through Alphaa, and fetch customer reviews so you can monitor and respond to them from within the Alphaa dashboard.

• https://www.googleapis.com/auth/webmasters.readonly (Google Search Console)
  We use this scope to retrieve your website's keyword ranking data, including search queries, click-through rates, impressions, and average position. This data is displayed in your Alphaa Keywords dashboard to help you understand your organic search performance.

• https://www.googleapis.com/auth/analytics.readonly (Google Analytics)
  We use this scope to retrieve traffic data including sessions, page views, bounce rate, average session duration, and traffic source breakdown. This data is displayed in your Alphaa dashboard to help you understand how users are finding and engaging with your website.

Limited Use Commitments:
• We access Google user data solely to provide the features and functionality of the Alphaa Service that you have explicitly requested and authorized.
• We do not use Google user data to develop, improve, or train generalized AI or machine learning models.
• We do not sell Google user data to any third parties.
• We do not use or transfer Google user data for advertising purposes or to brokers.
• We do not allow humans to read your Google user data except: (a) with your explicit consent; (b) where necessary for security purposes and to investigate suspected abuse; (c) to comply with applicable law; or (d) where the data has been aggregated and anonymized and is no longer linkable to you.
• We store Google API data only as long as necessary to provide the Service, and delete it within 30 days of account deletion or revocation of access.

You may revoke Alphaa's access to your Google data at any time by visiting https://myaccount.google.com/permissions and removing Alphaa's access. Revoking access will disable features that depend on Google integrations but will not affect your Alphaa account otherwise.`,
  },
  {
    title: "6. Cookies and Tracking",
    body: `We use a minimal set of cookies strictly necessary to operate the Service:

Session Cookies: Used to maintain your authenticated session while you use the Service. These expire when you close your browser or log out.

Authentication Cookies: Set by Clerk to maintain your login state across sessions if you select "Remember me."

We do NOT use:
• Third-party advertising cookies
• Cross-site tracking cookies
• Analytics cookies from Google Analytics, Meta Pixel, or similar advertising platforms
• Any cookies for behavioral profiling or ad targeting

You can control cookie settings through your browser preferences. Disabling session cookies will prevent you from logging in to the Service.`,
  },
  {
    title: "7. Data Retention",
    body: `Active Accounts: We retain your personal information and account data for as long as your account remains active or as needed to provide the Service.

Deleted Accounts: When you delete your account, we will delete or anonymize your personally identifiable information (including name, email address, and business contact details) within 30 days of account deletion.

Generated Content and Reports: AI-generated content and visibility report data may be retained in anonymized, aggregated form for up to 2 years following account deletion for service improvement and statistical analysis purposes. This data will not be linkable to you individually.

Legal Holds: Notwithstanding the above, we may retain information longer if required by applicable law, regulation, or legal process, or to enforce our rights under these Terms.

Google API Data: Data obtained through Google APIs is deleted within 30 days of account deletion or revocation of Google access, whichever occurs first.`,
  },
  {
    title: "8. Your Privacy Rights",
    body: `Depending on your location, you may have the following rights regarding your personal information:

GDPR Rights (EEA and UK Residents):
• Right of Access: Request a copy of the personal data we hold about you.
• Right of Rectification: Request correction of inaccurate or incomplete personal data.
• Right of Erasure ("Right to be Forgotten"): Request deletion of your personal data, subject to certain legal exceptions.
• Right to Data Portability: Receive your personal data in a structured, machine-readable format.
• Right to Restrict Processing: Request that we limit our processing of your data in certain circumstances.
• Right to Object: Object to our processing of your personal data for certain purposes.
• Right to Withdraw Consent: Where processing is based on consent, withdraw that consent at any time.

CCPA Rights (California Residents):
• Right to Know: Request disclosure of the categories and specific pieces of personal information we have collected about you.
• Right to Delete: Request deletion of your personal information, subject to certain exceptions.
• Right to Opt-Out of Sale: We do not sell personal information. No opt-out is needed, but you have this right.
• Right to Non-Discrimination: We will not discriminate against you for exercising your CCPA rights.

To exercise any of these rights, please email privacy@alphaa.app with your name, email address, and a description of your request. We will respond within 30 days (or within the timeframe required by applicable law).`,
  },
  {
    title: "9. Children's Privacy",
    body: `The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from anyone under 18. If you are a parent or guardian and believe your child has provided us with personal information without your consent, please contact us at privacy@alphaa.app and we will promptly delete such information.

If we become aware that we have inadvertently collected personal information from a person under 18, we will take steps to delete that information as quickly as possible.`,
  },
  {
    title: "10. International Data Transfers",
    body: `Alphaa is based in the United States. If you are accessing the Service from the European Economic Area (EEA), United Kingdom, or other regions with laws governing data collection and use that may differ from U.S. law, please be aware that your information may be transferred to, stored, and processed in the United States and other countries.

For transfers of personal data from the EEA or UK to the United States, Alphaa relies on the following transfer mechanisms:
• Standard Contractual Clauses (SCCs) approved by the European Commission, incorporated into our data processing agreements with sub-processors.
• For transfers to processors with EU-U.S. Data Privacy Framework certification, we rely on that framework where applicable.

By using the Service, you acknowledge that your information may be transferred to and processed in the United States. We take appropriate safeguards to ensure your personal information remains protected in accordance with this Policy and applicable law.`,
  },
  {
    title: "11. Data Security",
    body: `We implement commercially reasonable technical and organizational security measures designed to protect your personal information from unauthorized access, disclosure, alteration, and destruction. These measures include encryption of data in transit (TLS), access controls, and regular security reviews.

However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security. You are responsible for maintaining the security of your account credentials and for notifying us immediately if you suspect unauthorized access to your account.`,
  },
  {
    title: "12. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. For material changes, we will provide at least 14 days' advance notice by emailing your registered email address and/or by posting a prominent notice on the Service. The "Last updated" date at the top of this Policy will reflect the date of the most recent revision.

Your continued use of the Service after the effective date of any changes constitutes your acceptance of the revised Policy. If you do not agree to the revised Policy, you must discontinue use of the Service.`,
  },
  {
    title: "13. Contact Us",
    body: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our Privacy team:

Email: hi@alphaa.app
Subject line: Privacy Request — [your request type]
Website: https://alphaa.app

Mailing address:
Alphaa
1000 Innovation Dr
Kanata, ON K2K 3E7
Canada

We will respond to your inquiry within 30 days.`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-white text-3xl font-semibold mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: June 15, 2026</p>

        <p className="text-white/50 text-sm leading-relaxed mb-10 p-4 border border-white/[0.08] rounded-lg bg-white/[0.02]">
          This Privacy Policy explains how Alphaa collects, uses, and protects your personal information. It is designed to comply with GDPR (for EEA users) and CCPA (for California residents). We take your privacy seriously and are committed to transparency about our data practices.
        </p>

        {sections.map((s) => (
          <div key={s.title} className="mb-10">
            <h2 className="text-white font-semibold text-lg mb-3">{s.title}</h2>
            <div className="text-white/50 text-sm leading-relaxed whitespace-pre-line">{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
