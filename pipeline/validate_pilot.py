"""Spot-check generated rankings for roster sanity (papers come later)."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "web" / "data" / "rankings.json").read_text(encoding="utf-8"))
view = data["views"]["window_10__core"]

print("generated:", data["generated_at"])
print("institutions:", len(view["institutions"]))
print("faculty:", len(view["faculty"]))
print("papers in default view:", sum(len(f.get("papers") or []) for f in view["faculty"]))
print()
print("Top 10 by faculty_count (scores empty until Scholar fetch):")
ranked = sorted(view["institutions"], key=lambda x: (-x["faculty_count"], x["name"]))
for i, inst in enumerate(ranked[:10], 1):
    print(
        f"  {i:2d}. {inst['name']:40s} "
        f"n={inst['faculty_count']:2d} adj={inst['adj_count']:.2f}"
    )

checks = [
    "sackett_paul",
    "salas_eduardo",
    "allen_tammy",
    "kelloway_kevin",
    "ford_kevin",
]
fac = {f["faculty_id"]: f for f in view["faculty"]}
print()
print("Faculty spot-check:")
for cid in checks:
    f = fac.get(cid)
    if not f:
        print("  MISSING", cid)
        continue
    print(
        f"  {f['name']}: adj={f['adj_count']:.2f} raw={f['raw_count']} "
        f"scholar={f.get('google_scholar_id') or '-'}"
    )

assert "openalex_id" not in (view["faculty"][0] if view["faculty"] else {})
assert len(view["institutions"]) >= 50
assert len(view["faculty"]) >= 200
for cid in checks:
    assert cid in fac, cid
print()
print("Validation OK")
