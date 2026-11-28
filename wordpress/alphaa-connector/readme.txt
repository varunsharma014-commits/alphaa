=== Alphaa Connector ===
Contributors: alphaa
Tags: ai search, llms.txt, schema, aeo, chatgpt
Requires at least: 5.6
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.6.0
License: GPLv2 or later

Lets your Alphaa agent publish what you approve — FAQ pages, structured data, llms.txt and AI-crawler access — with one-tap undo.

== Description ==

Alphaa is an AI agent that works to get local businesses recommended by ChatGPT, Gemini, Claude and Perplexity. This plugin lets it make the website changes you approve:

* Publish FAQ pages, location pages and blog posts (with structured data) you approve in Alphaa.
* Refresh posts and pages you approve in place (same address), keeping the earlier version so Undo can put it back.
* Improve page titles and meta descriptions (written where Yoast or Rank Math reads them, if installed).
* Turn on WordPress's built-in sitemap and basic security headers.
* Add LocalBusiness structured data to your site's header.
* Serve /llms.txt.
* Add robots.txt rules that let AI search assistants (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User) read your site.
* Tell Bing and other IndexNow engines when a page changes.
* Count visitors who arrive from an AI assistant (only the assistant's name and page path are sent — no cookies, no IP, nothing about the visitor).
* Add Google Analytics 4 and the Meta Pixel you set up in Alphaa, and count phone taps, email taps and form sends (including HubSpot, Typeform and Calendly) as leads.
* Show what your ads earn: leads and WooCommerce orders from ad clicks, so Alphaa can work out your return on ad spend.

Every change can be undone from Alphaa. Pages are moved to the WordPress Trash, never permanently deleted.

Requests from Alphaa are signed with your connection key; nothing else can use the plugin's API.

== External services ==

This plugin connects to the Alphaa service at https://alphaa.app, run by 9629033 Canada INC. It is needed for the plugin to work; nothing is sent until you paste a connection key and click Connect.

* Connecting (https://alphaa.app/api/connect/wp/hello): when you click Connect, the plugin sends your connection key, your site address, your site's REST API address and the plugin version, so Alphaa can link the site to your account.
* Changes you approve: Alphaa's servers call this plugin's own REST API on your site (signed with your connection key) to publish, update or undo pages, structured data, llms.txt, robots.txt rules, titles and meta descriptions. The plugin does not send your content anywhere else.
* AI visitor count (https://alphaa.app/api/connect/visit): when a visitor arrives from an AI assistant (ChatGPT, Perplexity, Claude, Gemini or Copilot), their browser sends Alphaa your site's ID, the assistant's name and the page path, once per browser session. No cookies are set and no other information about the visitor is included in the request.
* Lead events (https://alphaa.app/api/tag/event): only when you set up tracking in Alphaa. When a visitor taps your phone number or email link, or sends a form, their browser tells Alphaa the kind of lead (phone, email or form), an event ID and the page address (without the query string). Alphaa keeps only a count per day, plus, for a lead that came from an ad, the click details below. If you added a Meta Conversions API token in Alphaa, the same event, the visitor's IP address and browser user agent are passed on to Meta (https://www.facebook.com/privacy/policy) and not stored. If the visitor arrived from an ad, the event also carries the ad's click ID (Google's gclid, gbraid or wbraid, Meta's fbclid or _fbc cookie) and the link's utm_source, utm_medium and utm_campaign, remembered for 90 days in a first-party cookie (alphaa_clk), so you can mark that lead as won and see what your ads earn. Visitors whose browser sends Global Privacy Control are counted but never sent to Meta, and no click ID or cookie is kept for them.
* WooCommerce orders (only when Alphaa asks, signed with your connection key): the plugin answers with your paid orders' totals (minus refunds), currency, date and the ad click ID / UTM the order came from (saved on the order at checkout from the alphaa_clk cookie, or WooCommerce's own order attribution). Orders without an ad click are sent only as a count and a sum. No names, emails, addresses or products are sent.
* IndexNow: when a page changes, Alphaa tells IndexNow search engines (such as Bing) the page address. The plugin only serves the IndexNow key file on your site.

Alphaa terms of service: https://alphaa.app/terms
Alphaa privacy policy: https://alphaa.app/privacy

== Installation ==

1. Plugins → Add New → Upload Plugin, choose the zip, then Activate.
2. Settings → Alphaa, paste the connection key from your Alphaa agent, click Connect.
