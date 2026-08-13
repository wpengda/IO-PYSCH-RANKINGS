"""Audit faculty area pills vs paper-derived areas; report gaps."""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

from config import CACHE, DATA, WEB_DATA

OUT = CACHE / "interests" / "faculty_area_audit.json"


def main() -> None:
    rank = json.loads((WEB_DATA / "rankings.json").read_text(encoding="utf-8"))
    fac_areas = json.loads((DATA / "faculty_areas.json").read_text(encoding="utf-8"))["faculty"]
    curated = {r["faculty_id"]: set(r.get("areas") or []) for r in fac_areas}
    interests = {
        r["faculty_id"]: r
        for r in json.loads((CACHE / "interests" / "faculty_interests.json").read_text(encoding="utf-8"))
    }

    view = rank["views"]["window_10__core"]
    gaps = []
    for f in view["faculty"]:
        fid = f["faculty_id"]
        pills = set(f.get("areas") or [])
        weights: dict[str, float] = defaultdict(float)
        counts: Counter[str] = Counter()
        for p in f.get("papers") or []:
            areas = [a for a in (p.get("areas") or []) if a and a != "General"]
            if not areas:
                continue
            share = float(p.get("adj_credit") or 0) / len(areas)
            for a in areas:
                weights[a] += share
                counts[a] += 1
        total = sum(weights.values()) or 1.0
        missing = []
        for a, cred in sorted(weights.items(), key=lambda kv: -kv[1]):
            if a in pills:
                continue
            if counts[a] >= 2 or cred >= 0.5 or (cred / total) >= 0.15:
                missing.append({"area": a, "credit": round(cred, 3), "papers": counts[a]})
        if missing:
            gaps.append(
                {
                    "faculty_id": fid,
                    "name": f["name"],
                    "pills": sorted(pills),
                    "curated": sorted(curated.get(fid) or []),
                    "missing_from_pills": missing,
                    "phrases": (interests.get(fid) or {}).get("phrases") or [],
                    "adj_count": f.get("adj_count"),
                }
            )

    miss_counts: Counter[str] = Counter()
    for g in gaps:
        for m in g["missing_from_pills"]:
            miss_counts[m["area"]] += 1

    gaps_sorted = sorted(
        gaps,
        key=lambda g: -sum(m["credit"] for m in g["missing_from_pills"]),
    )
    payload = {
        "n_faculty": len(view["faculty"]),
        "n_with_gaps": len(gaps),
        "missing_area_counts": miss_counts.most_common(),
        "gaps": gaps_sorted,
    }
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"faculty={payload['n_faculty']} with_gaps={len(gaps)}")
    print("missing area counts:", dict(miss_counts.most_common()))
    print("--- top gaps ---")
    for g in gaps_sorted[:50]:
        miss = ", ".join(f"{m['area']}({m['credit']}/{m['papers']}p)" for m in g["missing_from_pills"])
        print(f"{g['name']}: pills={g['pills']} | MISS {miss}")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
