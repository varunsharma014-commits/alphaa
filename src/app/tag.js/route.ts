export const dynamic = "force-dynamic"

// Served at /tag.js. Customers paste:
//   <script async src="https://alphaa.app/tag.js?id=USER_ID"></script>
// before </head>. It fetches that business's live JSON-LD from alphaa and
// injects it into the page — so alphaa can update the schema anytime without
// the customer re-doing anything.
//
// IMPORTANT — the limit of this approach (verified July 2026):
// GPTBot, ClaudeBot and PerplexityBot do NOT execute JavaScript; they read the
// raw HTML only. So schema injected by this snippet reaches Google (and Gemini,
// which uses Google's rendering service) but is INVISIBLE to ChatGPT, Claude and
// Perplexity. To be understood by those engines the JSON-LD must be server-
// rendered into the page's HTML: the copy-paste block on Website Health, or a
// CMS plugin. Keep the user-facing copy on Website Health honest about this.
export async function GET(): Promise<Response> {
  const js = `(function () {
  try {
    var s = document.currentScript;
    if (!s) { var all = document.getElementsByTagName('script'); s = all[all.length - 1]; }
    var src = s && s.src ? s.src : '';
    var id = (src.split('id=')[1] || '').split('&')[0];
    if (!id) return;
    var origin = new URL(src).origin;
    var inject = function (jsonLd) {
      if (!jsonLd || !jsonLd['@type']) return;
      var el = document.createElement('script');
      el.type = 'application/ld+json';
      el.text = JSON.stringify(jsonLd);
      document.head.appendChild(el);
    };
    var norm = function (p) {
      p = (p || '/').split('?')[0].split('#')[0];
      if (p.length > 1) p = p.replace(/\\/+$/, '');
      return p || '/';
    };
    fetch(origin + '/api/tag/schema?id=' + encodeURIComponent(id))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        if (data.v === 2 && data.schemas) {
          // v2: one entry per page. "/" entries apply site-wide; page-specific
          // entries (e.g. an FAQPage for /services) only inject on that page.
          var here = norm(window.location.pathname);
          for (var i = 0; i < data.schemas.length; i++) {
            var item = data.schemas[i] || {};
            var target = norm(item.pageUrl);
            if (target === '/' || target === here) inject(item.jsonLd);
          }
        } else {
          inject(data); // v1: a single bare JSON-LD object
        }
      })
      .catch(function () {});
  } catch (e) {}
})();`

  return new Response(js, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  })
}
