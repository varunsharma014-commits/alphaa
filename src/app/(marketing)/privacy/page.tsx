import { pageMeta } from "@/lib/seo"
import { V3Page, Frame, Section } from "@/components/marketing/v3"
import "@/components/marketing/v3/pages/article.css"
export const metadata = pageMeta({
  title: "Privacy Policy",
  description: "How Alphaa collects, uses and protects your information, including the Google data you connect, and the choices you have.",
  path: "/privacy",
})

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

AI Content Data: Business information and prompts submitted to generate AI content on your behalf, including queries sent to the Anthropic Claude API.

Your Customers' Contact Details: If you ask Alphaa to request a review from one of your customers, we process the first name and email address or phone number you provide to send that one request (email is sent through Resend; for a phone number we only prepare a message for you to send). We don't keep the email address or phone number itself — only a one-way fingerprint of it, so the same person isn't asked twice within 90 days — and we use it for no other purpose.

Website Connector: If you install the Alphaa Connector plugin on your website, it tells us when a visitor arrives from an AI assistant (for example ChatGPT or Perplexity), sending only the assistant's name and the page path. It sets no cookies and sends no IP address or other information about the visitor.

Lead Tracking (Growth plan): If you turn on tracking, the Alphaa tag or plugin tells us when a visitor to your website taps your phone number or email link or sends a form, sending only the kind of lead and an event ID, never the visitor's personal data, and if you add a Meta Conversions API token we pass that event to Meta with the visitor's IP address and browser string (not stored by us), skipping any visitor whose browser sends Global Privacy Control.`,
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

We do NOT sell your personal information to any third party. Apart from the Meta Pixel and Google Analytics measurement on our public website described in Section 7 (which, where consent is required, runs only after you accept), we do not use your information for advertising or share it for third-party ad targeting.`,
  },
  {
    title: "3a. Legal Bases for Processing (GDPR Art. 6)",
    body: `If the GDPR or UK GDPR applies to you, we rely on these legal bases:

Contract (Art. 6(1)(b)): to create and run your account, deliver the Service you subscribe to, bill you and provide support.

Legitimate interests (Art. 6(1)(f)): to run the free AI visibility check you request, keep the Service secure, prevent fraud, improve the Service, and research public information about your business (such as what AI assistants and public websites say about it). We balance these interests against your rights, and you may object at any time.

Consent (Art. 6(1)(a)): for measurement and advertising cookies (Google Analytics, Meta Pixel) and, for visitors in the EEA, UK and UAE, for the follow-up emails after a free check. You can withdraw consent at any time, with the cookie settings link or the unsubscribe link in any email, without affecting processing before withdrawal.

Legal obligation (Art. 6(1)(c)): to keep tax and accounting records and respond to lawful requests.`,
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

OpenAI (AI visibility checks and content)
Purpose: Asking ChatGPT models the questions your customers ask, to see whether your business is named, and helping draft content.
Data shared: Your business name, website, city, category and the questions we ask. No payment data; we do not send your personal contact details.
Privacy policy: https://openai.com/policies/privacy-policy

Google Gemini (AI visibility checks)
Purpose: Asking Google's Gemini models the same customer questions.
Data shared: Your business name, website, city, category and the questions we ask.
Privacy policy: https://policies.google.com/privacy

Perplexity (AI visibility checks)
Purpose: Asking Perplexity the same customer questions.
Data shared: Your business name, website, city, category and the questions we ask.
Privacy policy: https://www.perplexity.ai/hub/legal/privacy-policy

Apify (public web data)
Purpose: Collecting public search results and public social media posts about your business and its competitors, used in your checks and in emails written for you.
Data shared: Your business name, city, website and public profile addresses. Only publicly available information is collected.
Privacy policy: https://apify.com/privacy-policy

Google PageSpeed Insights and Safe Browsing (website checks)
Purpose: Measuring your website's speed and checking it is not flagged as unsafe.
Data shared: Your website address only.
Privacy policy: https://policies.google.com/privacy

IndexNow and Bing Webmaster Tools (search indexing)
Purpose: Telling search engines when Alphaa publishes or updates a page on your website.
Data shared: The page address only.
Privacy policy: https://www.microsoft.com/privacy/privacystatement

Meta Platforms and Google Analytics (our website only)
Purpose: Measuring visits and our ads, as described in Section 7. Where consent is required, these run only after you accept.
Privacy policy: https://www.facebook.com/privacy/policy and https://policies.google.com/privacy

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

• https://www.googleapis.com/auth/analytics.readonly (Google Analytics, optional)
  We use this read-only scope to count the visits your website receives, by channel, and how many of those visits came from AI assistants (ChatGPT, Gemini, Claude and Perplexity). These totals appear in your Weekly Briefing and weekly report email so you can see whether being named by AI assistants brings you visitors. We never change your Analytics settings or data, and we do not use it for advertising.

Limited Use Commitments:
• We access Google user data solely to provide the features and functionality of the Alphaa Service that you have explicitly requested and authorized.
• We do not use Google user data to develop, improve, or train generalized AI or machine learning models.
• We do not sell Google user data to any third parties.
• We do not use or transfer Google user data for advertising purposes or to brokers.
• We do not transfer Google user data to any third party except as necessary to provide or improve the user-facing features you have authorized, for security purposes, to comply with applicable law, or as part of a merger or acquisition with prior notice to you.
• Google user data is protected with encryption in transit (TLS) and at rest; OAuth access and refresh tokens are stored encrypted and are accessible only to your own account's server-side integration — never exposed to other users or third parties.
• We do not allow humans to read your Google user data except: (a) with your explicit consent; (b) where necessary for security purposes and to investigate suspected abuse; (c) to comply with applicable law; or (d) where the data has been aggregated and anonymized and is no longer linkable to you.
• We store Google API data only as long as necessary to provide the Service, and delete it within 30 days of account deletion or revocation of access.

You may revoke Alphaa's access to your Google data at any time by visiting https://myaccount.google.com/permissions and removing Alphaa's access. Revoking access will disable features that depend on Google integrations but will not affect your Alphaa account otherwise.`,
  },
  {
    title: "6. Website Connections (WordPress, Shopify, Webflow)",
    body: `If you connect your website, Alphaa uses that connection only to publish and undo the changes you approve (or that you have set to publish automatically) and to check the connection still works.

What we access: your site's content — blog posts, pages, and their SEO titles and descriptions — plus the basic site details needed to publish to the right place (your site or store name, address and blog). We do not access, request or store customer, order, product or payment data from your website platform.

Shopify: the Alphaa app asks only for the read_content and write_content permissions (blog posts and pages). It cannot read orders, customers or products, and cannot edit your theme or robots.txt. We store your store's address, the blog we publish to, and an access token. We honor Shopify's privacy webhooks: because we store no Shopify customer data, customer data requests and redaction requests have nothing to return or delete, and a shop redaction request (or uninstalling the app) deletes the store's connection from Alphaa.

Webflow: the Alphaa app asks for Sites (read), CMS (read and write) and Pages (read and write). We store your site's ID and address, the CMS collection we publish to and its field names, and an access token.

WordPress: the Alphaa Connector plugin holds a connection key that you paste in; we store your site's address, its REST API address and the plugin version. We don't hold a WordPress password or token — the key is derived on our side and used to sign each request to your site. The plugin's AI-visit count is described in Section 2.

How tokens are stored: Shopify and Webflow access tokens (and refresh tokens, where the platform issues them) are encrypted with AES-256-GCM before they're saved to our database, and are only decrypted on our servers when Alphaa talks to your site for you (publishing, undoing, or checking the connection). They are never shown in the dashboard, sent to your browser, or shared with anyone else.

What we keep: a log of each change Alphaa made to your site (what it was, the page address, and what's needed to undo it), shown in your dashboard.

Disconnecting: in Settings → Website connection, click Disconnect. We delete the stored connection and tokens at once and, for Webflow, ask Webflow to revoke the token. For Shopify, you can also uninstall the app in your Shopify admin; Shopify then notifies us and we delete the connection. Content already published stays on your site until you remove it or use Undo.`,
  },
  {
    title: "6a. Social Media and Ad Accounts (Facebook, Instagram, LinkedIn, TikTok)",
    body: `On the Pro and Growth plans you can connect your business's social media accounts, and on the Growth plan your ad accounts. Alphaa uses each connection only to do the marketing work you approve (or set to run automatically): publishing your posts and, where you turn it on, building and adjusting ads inside the budget you approved. Ad spend is billed by the platform to your own ad account; Alphaa never pays for or marks up your ads.

What we store: the IDs, names, handles and profile pictures of the Pages and accounts you choose to connect, an access token for each, the posts and ads Alphaa created for you, and their results. We do not read your personal profile, friends, private messages or personal photos, and we do not sell or share this data.

Lead ads: if you run a Facebook or Instagram lead form campaign through Alphaa, we read the leads it collects for you and store only the name, email address and phone number the form asked for, encrypted, so you can see and contact them in your dashboard. We act for you as your processor for these leads: we do not use them for anything else, never add them to our own marketing, and delete them when you ask (email privacy@alphaa.app) or when you close your account.

Facebook and Instagram: Alphaa connects through Facebook Login for Business. You choose which Pages, Instagram business accounts, ad accounts and pixels to share, and you can change that choice at any time.

How tokens are stored: access tokens are encrypted with AES-256-GCM before they are saved, are only decrypted on our servers when Alphaa acts for you, and are never shown in the dashboard or sent to your browser.

Deleting your data: in the dashboard, open "Social accounts & posts" and choose Disconnect for any account; we delete its stored token and connection at once. You can also remove Alphaa from Facebook (Settings → Business Integrations) or from the other platform's connected apps page. To have all data Alphaa received from Facebook, Instagram, LinkedIn or TikTok deleted, email privacy@alphaa.app from your account email; we delete it within 30 days and confirm by email. Posts already published stay on your accounts until you remove them.`,
  },
  {
    title: "6b. Google Drive and Dropbox (your brand library)",
    body: `If you add files to your brand library from Google Drive or Dropbox, Alphaa can open only the files you pick in Google's or Dropbox's own file picker (for Google Drive we ask for the drive.file permission, which covers only those files). We store a link to each file, a small preview picture and the tags and short description we write for it, never a copy of the file: when a post uses one of your photos or videos, or when we read your brand book, we fetch the file at that moment and discard it once the work is done. Your Google Drive key is encrypted with AES-256-GCM. Google Drive data is used only to make your own marketing and is never used to train AI models or shown to anyone else. Remove a file from your library at any time; remove Alphaa's access in your Google Account (Security → Third-party apps with account access, myaccount.google.com/permissions) or in Dropbox (turn off the shared link for the file, or Settings → Connected apps), or choose "Disconnect Google Drive" in the dashboard. Our use of information received from Google APIs follows the Google API Services User Data Policy, including the Limited Use requirements.`,
  },
  {
    title: "7. Cookies and Tracking",
    body: `Strictly necessary cookies (always on):

Session Cookies: Used to maintain your authenticated session while you use the Service. These expire when you close your browser or log out.

Authentication Cookies: Set by Clerk to maintain your login state across sessions if you select "Remember me."

Measurement and advertising (on our public website):
• Google Analytics, to count visits and see which pages are used.
• Meta Pixel, to measure whether our ads on Facebook and Instagram lead to visits and sign-ups, and to show our ads on Facebook and Instagram to people who have visited our website (retargeting).

Meta Pixel and retargeting: when the Meta Pixel is on, your browser sends Meta Platforms the page you viewed, actions such as starting a free check or opening checkout, and standard technical data (IP address, browser and device information, and Meta's own cookies). We do not send Meta your name, email address or the results of your check. Meta may combine this with information it holds if you use Facebook or Instagram, so it can measure our ads and include you in audiences of recent visitors that we advertise to. Meta acts as an independent controller for its own use of this data; see Meta's Privacy Policy (https://www.facebook.com/privacy/policy) and your Facebook or Instagram ad preferences to control the ads you see.

If you visit from the European Economic Area, the United Kingdom or the United Arab Emirates, or use our UK, German, French, Italian or UAE pages, these measurement and advertising tools stay off, and neither Google Analytics nor the Meta Pixel is loaded at all, until you choose "Accept" in the cookie notice. If you choose "Reject", they stay off. Your choice is stored in your browser. You can change it at any time with the "Cookie settings" link in the website footer; choosing "Reject" there turns both off on future page loads, wherever you are.

We never sell personal information.

You can also control cookies through your browser preferences. Disabling session cookies will prevent you from logging in to the Service.`,
  },
  {
    title: "8. Data Retention",
    body: `Active Accounts: We retain your personal information and account data for as long as your account remains active or as needed to provide the Service.

Deleted Accounts: When you delete your account, we will delete or anonymize your personally identifiable information (including name, email address, and business contact details) within 30 days of account deletion.

Generated Content and Reports: AI-generated content and visibility report data may be retained in anonymized, aggregated form for up to 2 years following account deletion for service improvement and statistical analysis purposes. This data will not be linkable to you individually.

Legal Holds: Notwithstanding the above, we may retain information longer if required by applicable law, regulation, or legal process, or to enforce our rights under these Terms.

Google API Data: Data obtained through Google APIs is deleted within 30 days of account deletion or revocation of Google access, whichever occurs first.`,
  },
  {
    title: "9. Your Privacy Rights",
    body: `Depending on your location, you may have the following rights regarding your personal information:

GDPR Rights (EEA and UK Residents):
• Right of Access: Request a copy of the personal data we hold about you.
• Right of Rectification: Request correction of inaccurate or incomplete personal data.
• Right of Erasure ("Right to be Forgotten"): Request deletion of your personal data, subject to certain legal exceptions.
• Right to Data Portability: Receive your personal data in a structured, machine-readable format.
• Right to Restrict Processing: Request that we limit our processing of your data in certain circumstances.
• Right to Object: Object to our processing of your personal data for certain purposes.
• Right to Withdraw Consent: Where processing is based on consent, withdraw that consent at any time.
• Right to Complain: You may lodge a complaint with a data protection supervisory authority, in particular in the country where you live or work or where you believe your rights were infringed (for example the ICO in the UK, or your national authority in the EU). In Canada you may contact the Office of the Privacy Commissioner of Canada. We would appreciate the chance to resolve your concern first at privacy@alphaa.app.

CCPA Rights (California Residents):
• Right to Know: Request disclosure of the categories and specific pieces of personal information we have collected about you.
• Right to Delete: Request deletion of your personal information, subject to certain exceptions.
• Right to Opt-Out of Sale: We do not sell personal information. No opt-out is needed, but you have this right.
• Right to Non-Discrimination: We will not discriminate against you for exercising your CCPA rights.

To exercise any of these rights, please email privacy@alphaa.app with your name, email address, and a description of your request. We will respond within 30 days (or within the timeframe required by applicable law).`,
  },
  {
    title: "10. Children's Privacy",
    body: `The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from anyone under 18. If you are a parent or guardian and believe your child has provided us with personal information without your consent, please contact us at privacy@alphaa.app and we will promptly delete such information.

If we become aware that we have inadvertently collected personal information from a person under 18, we will take steps to delete that information as quickly as possible.`,
  },
  {
    title: "11. International Data Transfers",
    body: `Alphaa is operated by 18355355 Canada INC (1000 Innovation Drive, Suite 500, Kanata, ON K2K 3E7, Canada), the controller of your personal data, and our servers are in the United States. If you are accessing the Service from the European Economic Area (EEA), United Kingdom, or other regions with laws governing data collection and use that may differ from U.S. law, please be aware that your information may be transferred to, stored, and processed in the United States and other countries.

For transfers of personal data from the EEA or UK to the United States, Alphaa relies on the following transfer mechanisms:
• Standard Contractual Clauses (SCCs) approved by the European Commission, incorporated into our data processing agreements with sub-processors.
• For transfers to processors with EU-U.S. Data Privacy Framework certification, we rely on that framework where applicable.

By using the Service, you acknowledge that your information may be transferred to and processed in the United States. We take appropriate safeguards to ensure your personal information remains protected in accordance with this Policy and applicable law.`,
  },
  {
    title: "12. Data Security",
    body: `We implement commercially reasonable technical and organizational security measures designed to protect your personal information from unauthorized access, disclosure, alteration, and destruction. These measures include encryption of data in transit (TLS), access controls, and regular security reviews.

However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security. You are responsible for maintaining the security of your account credentials and for notifying us immediately if you suspect unauthorized access to your account.`,
  },
  {
    title: "13. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. For material changes, we will provide at least 14 days' advance notice by emailing your registered email address and/or by posting a prominent notice on the Service. The "Last updated" date at the top of this Policy will reflect the date of the most recent revision.

Your continued use of the Service after the effective date of any changes constitutes your acceptance of the revised Policy. If you do not agree to the revised Policy, you must discontinue use of the Service.`,
  },
  {
    title: "14. Contact Us",
    body: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our Privacy team:

Email: hi@alphaa.app
Subject line: Privacy Request — [your request type]
Website: https://alphaa.app

Mailing address:
18355355 Canada INC (Alphaa)
1000 Innovation Drive, Suite 500
Kanata, ON K2K 3E7
Canada

We will respond to your inquiry within 30 days.`,
  },
]

export default function PrivacyPage() {
  return (
    <V3Page>
      <Frame top>
      <Section flush>
      <div className="rd3">
        <h1 className="v3-h1 v3-h1--md">Privacy Policy</h1>
        <p className="lgl3-updated" style={{ marginBottom: 32 }}>Last updated: November 18, 2026</p>

        <p className="lgl3-note">
          This Privacy Policy explains how Alphaa collects, uses, and protects your personal information. It is designed to comply with GDPR (for EEA users) and CCPA (for California residents). We take your privacy seriously and are committed to transparency about our data practices.
        </p>

        {sections.map((s) => (
          <div key={s.title} id={s.title.startsWith("7.") ? "cookies" : s.title.startsWith("6a.") ? "meta-data-deletion" : undefined} className="lgl3-sec">
            <h2>{s.title}</h2>
            <div className="lgl3-body">{s.body}</div>
          </div>
        ))}
      </div>
      </Section>
      </Frame>
    </V3Page>
  )
}
