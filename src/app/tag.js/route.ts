export const dynamic = "force-dynamic"

// Served at /tag.js. Customers paste:
//   <script async src="https://alphaa.app/tag.js?id=USER_ID"></script>
// before </head>. It fetches that business's live JSON-LD from alphaa and
// injects it into the page — so alphaa can update the schema anytime without
// the customer re-doing anything.
//
// Note: JS-injected JSON-LD is only read by crawlers that execute JavaScript.
// For the strongest coverage, customers can also copy-paste the schema into
// their HTML directly (shown on Website Health).
export async function GET(): Promise<Response> {
  const js = `(function () {
  try {
    var s = document.currentScript;
    if (!s) { var all = document.getElementsByTagName('script'); s = all[all.length - 1]; }
    var src = s && s.src ? s.src : '';
    var id = (src.split('id=')[1] || '').split('&')[0];
    if (!id) return;
    var origin = new URL(src).origin;
    fetch(origin + '/api/tag/schema?id=' + encodeURIComponent(id))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data['@type']) return;
        var el = document.createElement('script');
        el.type = 'application/ld+json';
        el.text = JSON.stringify(data);
        document.head.appendChild(el);
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
