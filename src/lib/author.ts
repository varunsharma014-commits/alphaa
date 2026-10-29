// The named author on every blog post (Varun, 2026-10-29). A person with a
// real profile is a stronger experience/trust signal for Google and the AI
// assistants than "Alphaa" as author. Facts here match growthturbine.com's
// author page; keep them in sync.
export const AUTHOR = {
  name: "Varun Sharma",
  slug: "varun-sharma",
  path: "/author/varun-sharma",
  jobTitle: "Founder, Alphaa",
  linkedin: "https://www.linkedin.com/in/varunsharma014/",
  bio: "Varun Sharma is the founder of Alphaa. He has spent over a decade in performance marketing and founded Growth Turbine, a marketing agency in Ottawa that has run 200+ campaigns. He built Alphaa so local business owners get the AI-search work an agency would do, done by an AI Agent they approve with one tap.",
}

export const AUTHOR_SCHEMA = {
  "@type": "Person",
  name: AUTHOR.name,
  url: `https://alphaa.app${AUTHOR.path}`,
  jobTitle: AUTHOR.jobTitle,
  worksFor: { "@type": "Organization", name: "Alphaa", url: "https://alphaa.app" },
  sameAs: [AUTHOR.linkedin, "https://growthturbine.com/author/varun-sharma"],
}
