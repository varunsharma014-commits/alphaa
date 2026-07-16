# alphaa embed tag (`/tag.js`)

One line customers paste before `</head>`:

```html
<script async src="https://alphaa.app/tag.js?id=USER_ID"></script>
```

The snippet is shown (with copy button) on **Dashboard → Website Health**.

## How it works

1. `/tag.js` (cached 1h) reads its own `?id=` param and fetches
   `/api/tag/schema?id=…` from the alphaa origin (CORS `*`, `no-store`).
2. The endpoint returns `{ v: 2, schemas: [{ pageUrl, jsonLd }] }`:
   - the live business schema built from the user's profile (`pageUrl: "/"`,
     applied site-wide), plus
   - every Claude-generated schema from the latest `SchemaMarkup` record
     (FAQPage, Service, …), each scoped to its `pageUrl`. Types duplicating
     the business schema are skipped.
3. The snippet injects a `<script type="application/ld+json">` per entry whose
   `pageUrl` is `/` or matches the visitor's `location.pathname` (normalized:
   query/hash stripped, trailing slashes removed).
4. v1 compat: a bare JSON-LD object response still injects as-is, so cached
   copies of the old snippet keep working.

Limits: JS-injected JSON-LD is only read by crawlers that execute JavaScript.
The copy-paste schema on Website Health remains the maximum-coverage path.

## Future phases (not built)

- **FAQ content blocks**: render visible FAQ HTML (not just FAQPage JSON-LD)
  into a customer-designated container element, e.g.
  `<div data-alphaa="faq"></div>`. Unlocks publishing content without site
  write-access.
- **Verification ping**: endpoint records `lastSeenAt` per id when the tag
  fetches, so the dashboard can show "snippet installed ✓" instead of hoping.
- **Per-page schema editor**: let users toggle individual schemas on/off
  before they go live through the tag.
