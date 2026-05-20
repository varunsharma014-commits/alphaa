export const metadata = { title: "Terms of Service" }

export default function TermsPage() {
  return (
    <div className="pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto prose prose-invert prose-sm">
        <h1 className="text-white text-3xl font-semibold mb-2">Terms of Service</h1>
        <p className="text-muted text-sm mb-10">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

        {[
          {
            title: "1. Acceptance of Terms",
            body: "By accessing or using Alphaa ('the Service'), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.",
          },
          {
            title: "2. Description of Service",
            body: "Alphaa provides AI-powered local visibility optimization for small businesses. This includes automated posting to Google Business Profile, content generation, AI search tracking, and visibility audits. The Service requires connection to your Google Business Profile and optionally your website.",
          },
          {
            title: "3. Subscriptions and Billing",
            body: "Alphaa offers paid subscriptions on a monthly or annual basis. All subscriptions include a 14-day free trial with no credit card required to start. After the trial period, a payment method is required to continue service. You may cancel at any time from your dashboard. Cancellations take effect at the end of the current billing period. No refunds are issued for partial months, except within 7 days of your first charge.",
          },
          {
            title: "4. Google API Services",
            body: "Alphaa's use of data received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. We use Google API data solely to provide the services you've requested. We do not sell, transfer, or use Google user data for advertising or other non-service purposes.",
          },
          {
            title: "5. Acceptable Use",
            body: "You agree not to use Alphaa to post content that is false, misleading, defamatory, or violates any applicable law. You are responsible for the accuracy of the business information you provide. Alphaa reserves the right to suspend accounts that violate these terms.",
          },
          {
            title: "6. Intellectual Property",
            body: "AI-generated content produced by Alphaa for your business is yours to use. Alphaa retains ownership of its platform, software, and brand. You may not reverse-engineer, copy, or resell the Alphaa platform.",
          },
          {
            title: "7. Limitation of Liability",
            body: "Alphaa provides visibility optimization services. We do not guarantee specific rankings, citation placements, or revenue outcomes. Search engines and AI platforms operate independently and their behavior is outside our control. Our liability is limited to the fees you paid in the 3 months preceding any claim.",
          },
          {
            title: "8. Changes to Terms",
            body: "We may update these terms from time to time. Material changes will be communicated by email to your registered address at least 14 days before they take effect. Continued use of the Service after that date constitutes acceptance of the updated terms.",
          },
          {
            title: "9. Contact",
            body: "Questions about these terms? Email us at legal@alphaa.app.",
          },
        ].map((s) => (
          <div key={s.title} className="mb-8">
            <h2 className="text-white font-semibold text-lg mb-2">{s.title}</h2>
            <p className="text-muted text-sm leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
