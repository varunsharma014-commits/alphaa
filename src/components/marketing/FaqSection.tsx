"use client"

import { useState } from "react"
import { SectionLabel } from "@/components/common/SectionLabel"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    q: "What does Alphaa actually do?",
    a: "We make sure your business shows up when people search for what you do — on Google, Google Maps, ChatGPT, Perplexity, and other AI tools. We do the work automatically: posting to your Google Business Profile, optimizing your website, creating content, and tracking where you appear.",
  },
  {
    q: "How is this different from an SEO agency?",
    a: "SEO agencies charge $500–$2,000/month, lock you into contracts, and send reports you can't make sense of. Alphaa does the actual work — automatically — for $99/month with no contracts. You can cancel anytime.",
  },
  {
    q: "Do I need to know anything about marketing or SEO?",
    a: "No. Connect your Google profile and add one snippet to your website in 2 minutes. We do everything else.",
  },
  {
    q: "What's this 'AI search' thing?",
    a: "More and more people search on ChatGPT, Perplexity, and Google AI instead of regular Google — whether they're looking for a shop down the street or a vendor anywhere in the world. If your business isn't showing up there, you're invisible to a growing chunk of customers. Alphaa tracks and improves your presence across all of them.",
  },
  {
    q: "Will I see results in the first month?",
    a: "Usually yes for Google Business Profile changes — these show up in days. Website and AI search improvements take 30–60 days to fully kick in.",
  },
  {
    q: "What if I already have an SEO agency?",
    a: "Many customers run Alphaa alongside their agency for the first month, see the difference, then cancel the agency. We never lock you in either way.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. One click in your dashboard. No phone calls, no retention specialists, no contracts.",
  },
  {
    q: "What kinds of businesses is this for?",
    a: "Any business that wants to be found — local or online. Dentists, lawyers, contractors, salons, and restaurants serving a city, plus ecommerce brands, SaaS and B2B companies, agencies, and online services selling regionally, nationally, or worldwide.",
  },
]

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <SectionLabel className="mb-3 block">FAQ</SectionLabel>
          <h2 className="text-section-mobile md:text-[36px] font-semibold text-white">
            Common questions
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-card rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-white font-medium text-sm pr-4">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted flex-shrink-0 transition-transform duration-200",
                    open === i && "rotate-180"
                  )}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-muted text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
