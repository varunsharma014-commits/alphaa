// /integrations pages: what Alphaa can do on each website platform, how to
// connect it, and exactly which permissions it asks for. Keep this honest and
// in step with src/lib/connector/* — if a connector can't do something, say so.
import type { Platform } from "@/lib/connector/types"

export const INTEGRATIONS_CHECKED = "2026-09-28"

export type Integration = {
  slug: Platform
  name: string
  status: "live" | "soon"
  metaTitle: string
  description: string
  h1: string
  h1Quiet: string
  tldr: string
  /** What Alphaa does there: [thing, detail]. */
  does: [string, string][]
  /** What it can't do there, and what happens instead. */
  cant: string[]
  steps: string[]
  perms: { scope: string; why: string }[]
  permsNote?: string
  faq: { q: string; a: string }[]
}

const APPROVAL =
  "Nothing goes live until you approve it in Alphaa. On the Pro plan you can turn on auto-publish for blog posts, which only publishes drafts that have no [placeholders] left to fill in."

export const INTEGRATIONS: Integration[] = [
  {
    slug: "wordpress",
    name: "WordPress",
    status: "live",
    metaTitle: "Alphaa for WordPress — publish AI-ready pages, schema and llms.txt",
    description:
      "Connect WordPress to Alphaa with a small free plugin. Alphaa publishes FAQ pages and blog posts, updates page titles and descriptions, and adds structured data, llms.txt and AI-crawler rules. You approve every change, and each one has Undo.",
    h1: "Alphaa for WordPress.",
    h1Quiet: "The fixes AI needs, published for you.",
    tldr:
      "Install the free Alphaa Connector plugin and paste your key. From then on, Alphaa publishes the fixes you approve straight to your WordPress site: FAQ pages, blog posts, page titles and descriptions, structured data, llms.txt and robots.txt rules for AI crawlers. Every change has Undo.",
    does: [
      ["FAQ pages and blog posts", "Written from your business facts and published as WordPress pages and posts, with FAQ structured data added."],
      ["Page titles and descriptions", "Updates the SEO title and meta description of a page. Works with Yoast and Rank Math, or on its own."],
      ["Structured data", "Adds your LocalBusiness schema (name, address, phone, hours, services) to your site, so AI reads your facts correctly."],
      ["llms.txt", "Serves an llms.txt at your own domain, kept current by Alphaa."],
      ["AI-crawler rules", "Adds robots.txt rules that let ChatGPT, Claude and Perplexity’s search crawlers in."],
      ["Faster indexing", "Tells Bing about each change through IndexNow. ChatGPT’s search draws on Bing’s index."],
    ],
    cant: [
      "If your server already has a physical robots.txt or llms.txt file, that file wins over the plugin’s. Alphaa spots this and tells you, and can email your web person the fix.",
      "Firewalls like Cloudflare can block AI crawlers before WordPress ever sees them. That setting lives outside WordPress, so Alphaa sends your web person the exact steps.",
    ],
    steps: [
      "In Alphaa, tap “Connect my website”, pick WordPress and download the plugin (a small zip file).",
      "In WordPress, go to Plugins → Add New → Upload Plugin, choose the zip, then Install and Activate.",
      "Open Settings → Alphaa, paste the key Alphaa gave you, and click Connect. That’s it.",
    ],
    perms: [
      { scope: "WordPress admin, once", why: "You install the plugin yourself. Alphaa never asks for your WordPress password." },
      { scope: "Signed requests only", why: "The plugin only accepts changes signed with your private key, so no one else can publish through it." },
      { scope: "AI-visit counts", why: "When a visitor arrives from an AI assistant, the plugin sends the assistant’s name and the page path. No cookies, no IP address, nothing about the visitor." },
    ],
    faq: [
      { q: "Do I need a developer to connect WordPress?", a: "No. If you can install a plugin, you can connect Alphaa. It takes about two minutes and you need to be a WordPress admin." },
      { q: "Does the plugin slow my site down?", a: "Barely. It adds a small block of structured data to your pages and a tiny inline script that only sends a note when a visitor arrives from an AI assistant. It loads no external files and sets no cookies." },
      { q: "What happens when I click Undo?", a: "Pages and posts go to WordPress’s Trash, so you can restore them there too. Titles, schema, llms.txt and robots.txt rules go back to what they were before." },
      { q: "Does it work with Yoast or Rank Math?", a: "Yes. When one of them is active, Alphaa writes page titles and descriptions into their fields so they keep working as before." },
      { q: "Will Alphaa publish without asking?", a: APPROVAL },
      { q: "How do I disconnect?", a: "In Alphaa, go to Settings → Website connection and click Disconnect. You can also deactivate or delete the plugin in WordPress at any time." },
    ],
  },
  {
    slug: "shopify",
    name: "Shopify",
    status: "live",
    metaTitle: "Alphaa for Shopify — AI-ready blog posts and pages for your store",
    description:
      "Connect your Shopify store to Alphaa in one click. Alphaa publishes blog posts and pages and updates their search titles and descriptions. It asks only for read_content and write_content. You approve every change, and each one has Undo.",
    h1: "Alphaa for Shopify.",
    h1Quiet: "Answers AI can quote, on your own store.",
    tldr:
      "Install the Alphaa app on your Shopify store with one approval. Alphaa then publishes the blog posts and pages you approve and updates their search titles and descriptions. It only asks to read and write your store’s content (blog posts and pages), never your orders, customers or products.",
    does: [
      ["Blog posts", "Published to your store’s blog, with a featured image and summary."],
      ["Pages", "FAQ and service pages published as Shopify pages."],
      ["Search titles and descriptions", "Updates the search engine listing (title and meta description) of your blog posts and pages."],
      ["Undo on everything", "Undo hides a post or page again (it isn’t deleted), and puts a title or description back to what it was."],
    ],
    cant: [
      "Shopify apps with these permissions can’t edit theme files or robots.txt, so Alphaa can’t add sitewide structured data, AI-crawler rules or an llms.txt at your store’s root. It emails your web person the exact change, or our team does it on Full Service.",
      "Your homepage title and description live in Online Store → Preferences, which apps can’t change. Alphaa tells you exactly what to paste there.",
      "Your store needs a blog to publish posts to. If it doesn’t have one yet, add one in Shopify under Online Store → Blog posts → Manage blogs.",
    ],
    steps: [
      "In Alphaa, tap “Connect my website”, pick Shopify and enter your store address (yourstore.myshopify.com).",
      "Shopify shows exactly what Alphaa can access. Click Install.",
      "You’re back in Alphaa, connected. Approve your first post or page and it goes live on your store.",
    ],
    perms: [
      { scope: "read_content", why: "To find your blog and your existing pages and posts, so Alphaa publishes to the right place and can update the right page." },
      { scope: "write_content", why: "To create blog posts and pages, update their search titles and descriptions, and unpublish them again when you click Undo." },
    ],
    permsNote: "That’s all. Alphaa has no access to your orders, customers, products, payments or theme code.",
    faq: [
      { q: "What can Alphaa access in my Shopify store?", a: "Only your online store content: blog posts and pages. The app asks for read_content and write_content and nothing else, so it can’t see orders, customers, products or payments." },
      { q: "Can Alphaa edit my theme or robots.txt on Shopify?", a: "No. Those permissions don’t cover theme files or robots.txt. For changes there, Alphaa emails your web person the exact code and where it goes, or our team does it for you on Full Service." },
      { q: "What happens when I click Undo?", a: "The blog post or page is unpublished (hidden), not deleted, so you can still find it in Shopify. Title and description changes go back to what they were before." },
      { q: "Will Alphaa publish without asking?", a: APPROVAL },
      { q: "How do I disconnect?", a: "In Alphaa, go to Settings → Website connection and click Disconnect. To remove access completely, uninstall the Alphaa app in Shopify under Settings → Apps and sales channels; Alphaa drops the connection as soon as Shopify tells us." },
    ],
  },
  {
    slug: "webflow",
    name: "Webflow",
    status: "live",
    metaTitle: "Alphaa for Webflow — publish AI-ready posts to your CMS",
    description:
      "Connect Webflow to Alphaa in one click. Alphaa publishes blog posts to your CMS collection and updates page titles and descriptions. It asks for CMS read/write, Pages read/write and Sites read. You approve every change, and each one has Undo.",
    h1: "Alphaa for Webflow.",
    h1Quiet: "Posts AI can quote, straight into your CMS.",
    tldr:
      "Authorize Alphaa on your Webflow site with one click. Alphaa publishes the posts you approve to your blog collection and updates the SEO titles and descriptions of your pages. It asks for CMS read/write, Pages read/write and Sites read, and nothing else.",
    does: [
      ["Blog posts", "Published live to your blog collection in the Webflow CMS, with title, summary, body and featured image mapped to your fields."],
      ["FAQ pages", "Webflow’s API can’t create standalone pages, so FAQ content goes into your blog collection as its own item."],
      ["Page titles and descriptions", "Updates the SEO title and meta description of your static pages. They show on your live site the next time you publish in Webflow."],
      ["Undo on everything", "Undo unpublishes a CMS item (Webflow keeps it as a draft) and puts a page title or description back to what it was."],
    ],
    cant: [
      "With these permissions Alphaa can’t add site-wide custom code, so structured data and an llms.txt at your own domain go to your web person to paste into Webflow’s custom code settings. Alphaa sends them the exact code.",
      "Alphaa doesn’t publish your whole site, because that would also push any unfinished Designer work. Title changes wait for your next Publish in Webflow.",
      "You need a CMS collection with a rich-text field (like a Blog) to publish posts to.",
    ],
    steps: [
      "In Alphaa, tap “Connect my website” and pick Webflow.",
      "Sign in to Webflow, choose your site and click Authorize.",
      "You’re back in Alphaa, connected. Approve your first post and it goes live on your site.",
    ],
    perms: [
      { scope: "Sites: read", why: "To find your site and its public address, so links to new posts are right." },
      { scope: "CMS: read", why: "To find your blog collection and its fields, so posts land in the right place." },
      { scope: "CMS: write", why: "To publish the posts you approve, and unpublish them again when you click Undo." },
      { scope: "Pages: read", why: "To match a page on your site to its Webflow page before changing its title." },
      { scope: "Pages: write", why: "To update a page’s SEO title and meta description, and put them back on Undo." },
    ],
    permsNote: "Alphaa can’t change your designs, your site settings, your forms or your billing.",
    faq: [
      { q: "What can Alphaa change on my Webflow site?", a: "Items in your blog collection and the SEO title and description of your pages. It asks for CMS read/write, Pages read/write and Sites read. It can’t change your designs, site settings or forms." },
      { q: "Why don’t my title changes show up straight away?", a: "Webflow stages page settings until you publish. Alphaa doesn’t publish your whole site for you, because that would also push any unfinished work in the Designer. Hit Publish in Webflow and they go live." },
      { q: "Can Alphaa add schema or llms.txt on Webflow?", a: "Not with the permissions it asks for. Alphaa writes the structured data and llms.txt for you and emails your web person exactly where to paste them in Webflow, or our team does it on Full Service." },
      { q: "What happens when I click Undo?", a: "A published post is unpublished and kept as a draft in your CMS, not deleted. Page title and description changes go back to what they were." },
      { q: "Will Alphaa publish without asking?", a: APPROVAL },
      { q: "How do I disconnect?", a: "In Alphaa, go to Settings → Website connection and click Disconnect. Alphaa forgets the connection and asks Webflow to revoke its access. You can also remove Alphaa in your Webflow workspace’s app settings." },
    ],
  },
  {
    slug: "wix",
    name: "Wix",
    status: "soon",
    metaTitle: "Alphaa for Wix — coming soon",
    description:
      "A one-click Alphaa app for Wix is coming soon. Until then, Alphaa writes every fix for your Wix site and emails your web person exactly what to change, or our team does it for you on Full Service.",
    h1: "Alphaa for Wix.",
    h1Quiet: "Coming soon.",
    tldr:
      "A one-click Alphaa app for Wix is coming soon. You can use Alphaa on a Wix site today: it writes every fix and emails your web person the exact change and where it goes, or our team makes the changes for you on the Full Service plan.",
    does: [
      ["Today: every fix, written for you", "FAQ pages, blog posts, page titles and descriptions and structured data, written from your business facts."],
      ["Today: sent to your web person", "Alphaa emails the exact change and where it goes in Wix. Their replies come to you."],
      ["Coming soon: blog posts", "Published straight to your Wix Blog once you approve them, with Undo."],
      ["Coming soon: page titles and descriptions", "Updated on your pages and posts, with Undo."],
    ],
    cant: [
      "Until the Wix app is live, Alphaa can’t publish to Wix by itself. Use “Email it to my web person” on any fix, or the Full Service plan.",
    ],
    steps: [
      "Start with the free check at alphaa.app/start and see what the AIs say about you.",
      "Approve the fixes Alphaa writes for your site.",
      "Tap “Email it to my web person”, or let our team do it on Full Service. When the Wix app is live, you connect it with one click.",
    ],
    perms: [
      { scope: "None yet", why: "Nothing is installed on your Wix site today. When the app launches, it will ask only for what it needs to publish blog posts and update page titles, and this page will list each permission." },
    ],
    faq: [
      { q: "Does Alphaa work with Wix?", a: "Yes, today by email: Alphaa writes each fix and sends your web person the exact change. A one-click Wix app that publishes for you is coming soon." },
      { q: "When is the Wix app coming?", a: "We’re not giving a date until it’s ready. This page will change to show the connection steps and permissions when it is." },
      { q: "Can your team make the changes on my Wix site for me?", a: "Yes, on the Full Service plan our team makes the approved changes for you." },
      { q: "Will Alphaa publish without asking?", a: "No. Nothing goes live until you approve it, and on Wix today a person makes each change." },
    ],
  },
]

export const getIntegration = (slug: string) => INTEGRATIONS.find((i) => i.slug === slug)
