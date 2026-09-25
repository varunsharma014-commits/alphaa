=== Alphaa Connector ===
Contributors: alphaa
Tags: ai search, llms.txt, schema, aeo, chatgpt
Requires at least: 5.6
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later

Lets your Alphaa agent publish what you approve — FAQ pages, structured data, llms.txt and AI-crawler access — with one-tap undo.

== Description ==

Alphaa is an AI agent that works to get local businesses recommended by ChatGPT, Gemini, Claude and Perplexity. This plugin lets it make the website changes you approve:

* Publish FAQ pages (with FAQPage structured data) you approve in Alphaa.
* Add LocalBusiness structured data to your site's header.
* Serve /llms.txt.
* Add robots.txt rules that let AI search assistants (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User) read your site.
* Tell Bing and other IndexNow engines when a page changes.
* Count visitors who arrive from an AI assistant (only the assistant's name and page path are sent — no cookies, no IP, nothing about the visitor).

Every change can be undone from Alphaa. Pages are moved to the WordPress Trash, never permanently deleted.

Requests from Alphaa are signed with your connection key; nothing else can use the plugin's API.

== Installation ==

1. Plugins → Add New → Upload Plugin, choose the zip, then Activate.
2. Settings → Alphaa, paste the connection key from your Alphaa agent, click Connect.
