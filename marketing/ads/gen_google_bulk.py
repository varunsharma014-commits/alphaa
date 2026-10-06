# Google Ads bulk-upload CSV (Tools > Bulk actions > Uploads) for the 4 Search test campaigns,
# built from the copy in build_ads_copy.py. Everything is created PAUSED.
import csv, pathlib
from build_ads_copy import GOOGLE, NEGATIVES, NEG_TRADE

BUDGET_CAD = {"1. Brand": 3, "2. AI visibility intent": 12, "3. AI for [trade]": 9,
              "4. SEO agency alternative (lower priority)": 4}
NAME = {"1. Brand": "T1 Brand", "2. AI visibility intent": "T2 AI visibility intent",
        "3. AI for [trade]": "T3 AI for trades", "4. SEO agency alternative (lower priority)": "T4 Agency alternative"}
H = [f"Headline {i}" for i in range(1, 16)]
D = [f"Description {i}" for i in range(1, 5)]
COLS = ["Action", "Campaign", "Campaign type", "Campaign status", "Budget", "Budget type", "Bid strategy type",
        "Networks", "Ad group", "Ad group status", "Keyword", "Match type", "Status", "Ad type",
        *H, *D, "Final URL", "Path 1", "Path 2"]
rows = []
def row(**k):
    r = {c: "" for c in COLS}; r.update({"Action": "Add"}); r.update(k); rows.append(r)
for c in GOOGLE:
    camp = NAME[c["campaign"]]
    row(Campaign=camp, **{"Campaign type": "Search", "Campaign status": "Paused", "Budget": BUDGET_CAD[c["campaign"]],
        "Budget type": "Daily", "Bid strategy type": "Maximize clicks", "Networks": "Google search"})
    for g in c["groups"]:
        row(Campaign=camp, **{"Ad group": g["name"], "Ad group status": "Enabled"})
        for kw in g["kw_exact"]:
            row(Campaign=camp, Keyword=kw, Status="Enabled", **{"Ad group": g["name"], "Match type": "Exact"})
        for kw in g["kw_phrase"]:
            row(Campaign=camp, Keyword=kw, Status="Enabled", **{"Ad group": g["name"], "Match type": "Phrase"})
        ad = {"Ad group": g["name"], "Ad type": "Responsive search ad", "Status": "Enabled", "Final URL": g["url"],
              "Path 1": g["paths"][0], "Path 2": g["paths"][1]}
        ad.update({H[i]: h for i, h in enumerate(g["headlines"][:15])})
        ad.update({D[i]: d for i, d in enumerate(g["descriptions"][:4])})
        row(Campaign=camp, **ad)
    # campaign-level negatives
    negs = [n.strip() for n in NEGATIVES.split(",") if n.strip()]
    if c["campaign"].startswith("3."):
        for v in NEG_TRADE.values(): negs += [n.strip() for n in v.split(",")]
    for n in negs:
        row(Campaign=camp, Keyword=n, **{"Match type": "Campaign negative phrase"})
out = pathlib.Path(__file__).parent / "google-ads-bulk-upload.csv"
with out.open("w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=COLS); w.writeheader(); w.writerows(rows)
print(out, len(rows), "rows")
