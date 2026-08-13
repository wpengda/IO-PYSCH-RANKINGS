"""Score faculty and institutions across metrics and time windows."""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from datetime import datetime, timezone

import pandas as pd

from config import (
    CACHE,
    DATA,
    WEB_DATA,
    apply_venue,
    ensure_dirs,
    load_faculty_areas,
    load_venues,
    venue_name_lookup,
)


WINDOWS = {
    "5": 5,
    "10": 10,
    "all": None,
}


def faculty_area_labels(
    papers: list[dict],
    *,
    curated: list[str] | None = None,
    max_labels: int = 10,
    min_share: float = 0.0,
    min_credit: float = 0.0,
) -> list[str]:
    """
    Faculty display labels ordered by paper count per area (high → low).

    A paper counts once toward each of its areas. Curated Scholar/homepage
    areas with no pubs in this view still appear, but last (count 0).
    Ties break by 1/N credit, then name.
    """
    counts: dict[str, int] = defaultdict(int)
    weights: dict[str, float] = defaultdict(float)
    for p in papers:
        credit = float(p.get("adj_credit") or 0.0)
        areas = [a for a in (p.get("areas") or []) if a and a != "General"]
        if not areas:
            continue
        share = credit / len(areas)
        for a in areas:
            counts[a] += 1
            weights[a] += share

    if curated:
        for a in curated:
            if a and a != "General":
                counts.setdefault(a, 0)
                weights.setdefault(a, 0.0)

    if not counts:
        return []

    ranked = sorted(
        counts.items(),
        key=lambda kv: (-kv[1], -weights.get(kv[0], 0.0), kv[0]),
    )
    return [area for area, _n in ranked[:max_labels]]


def in_window(year: int | None, window: int | None, current_year: int) -> bool:
    if year is None:
        return window is None
    if window is None:
        return True
    return year >= current_year - window + 1


def score_rows(
    pubs: list[dict],
    faculty: pd.DataFrame,
    institutions: pd.DataFrame,
    *,
    window: int | None,
    include_cross_boundary: bool,
    current_year: int,
    curated_areas: dict[str, list[str]] | None = None,
) -> dict:
    fac_metrics: dict[str, dict[str, float]] = defaultdict(
        lambda: {"adj_count": 0.0, "raw_count": 0.0, "citations": 0.0, "weighted_if": 0.0}
    )
    fac_papers: dict[str, list[dict]] = defaultdict(list)

    for p in pubs:
        if not include_cross_boundary and p.get("cross_boundary"):
            continue
        year = p.get("year")
        try:
            year = int(year) if year is not None else None
        except (TypeError, ValueError):
            year = None
        if not in_window(year, window, current_year):
            continue
        fid = p["faculty_id"]
        credit = float(p["adj_credit"])
        weight = float(p["venue_weight"])
        cites = float(p["cited_by_count"])
        fac_metrics[fid]["adj_count"] += credit
        fac_metrics[fid]["raw_count"] += 1.0
        fac_metrics[fid]["citations"] += cites
        # Impact-factor metric: full journal IF per paper (no 1/N)
        fac_metrics[fid]["weighted_if"] += weight
        fac_papers[fid].append(
            {
                "work_id": p["work_id"],
                "title": p["title"],
                "year": year,
                "venue_id": p["venue_id"],
                "venue_name": p["venue_name"],
                "adj_credit": round(credit, 4),
                "cited_by_count": p["cited_by_count"],
                "weighted_if": round(weight, 4),
                "impact_factor": round(weight, 2),
                "cross_boundary": bool(p.get("cross_boundary", False)),
                "areas": p.get("areas") or [],
                "doi": p.get("doi"),
            }
        )

    inst_lookup = institutions.set_index("institution_id").to_dict("index")
    faculty_rows = []
    inst_agg: dict[str, dict] = {}
    for iid, meta in inst_lookup.items():
        inst_agg[iid] = {
            "institution_id": iid,
            "name": meta.get("name", iid),
            "country": meta.get("country", ""),
            "city": meta.get("city", ""),
            "program_url": meta.get("program_url", ""),
            "roster_status": meta.get("roster_status", ""),
            "faculty_count": 0,
            "adj_count": 0.0,
            "raw_count": 0.0,
            "citations": 0.0,
            "weighted_if": 0.0,
            "faculty_ids": [],
        }

    for _, row in faculty.iterrows():
        if str(row.get("active", True)).lower() not in ("true", "1", "yes"):
            continue
        fid = row["faculty_id"]
        iid = row["institution_id"]
        m = fac_metrics[fid]
        papers = sorted(
            fac_papers[fid],
            key=lambda x: (-(x["year"] or 0), -x["adj_credit"]),
        )
        curated_map = curated_areas or {}
        faculty_rows.append(
            {
                "faculty_id": fid,
                "name": row["name"],
                "institution_id": iid,
                "orcid": "" if pd.isna(row.get("orcid")) else str(row.get("orcid")),
                "google_scholar_id": "" if pd.isna(row.get("google_scholar_id")) else str(row.get("google_scholar_id")),
                "homepage": "" if pd.isna(row.get("homepage")) else str(row.get("homepage")),
                "rank": "" if pd.isna(row.get("rank")) else str(row.get("rank")),
                "adj_count": round(m["adj_count"], 4),
                "raw_count": int(m["raw_count"]),
                "citations": int(m["citations"]),
                "weighted_if": round(m["weighted_if"], 4),
                "areas": faculty_area_labels(
                    papers, curated=curated_map.get(str(fid))
                ),
                "papers": papers,
            }
        )
        inst_agg[iid]["faculty_count"] += 1
        inst_agg[iid]["adj_count"] += m["adj_count"]
        inst_agg[iid]["raw_count"] += m["raw_count"]
        inst_agg[iid]["citations"] += m["citations"]
        inst_agg[iid]["weighted_if"] += m["weighted_if"]
        inst_agg[iid]["faculty_ids"].append(fid)

    institutions_out = []
    for inst in inst_agg.values():
        fc = max(1, inst["faculty_count"])
        institutions_out.append(
            {
                **inst,
                "adj_count": round(inst["adj_count"], 4),
                "raw_count": int(inst["raw_count"]),
                "citations": int(inst["citations"]),
                "weighted_if": round(inst["weighted_if"], 4),
                "adj_count_per_faculty": round(inst["adj_count"] / fc, 4),
                "citations_per_faculty": round(inst["citations"] / fc, 4),
                "weighted_if_per_faculty": round(inst["weighted_if"] / fc, 4),
            }
        )

    institutions_out.sort(key=lambda x: (-x["adj_count"], x["name"]))
    faculty_rows.sort(key=lambda x: (-x["adj_count"], x["name"]))
    return {"institutions": institutions_out, "faculty": faculty_rows}


def main() -> None:
    parser = argparse.ArgumentParser(description="Score IO Psych rankings from cached pubs")
    parser.add_argument("--year", type=int, default=datetime.now(timezone.utc).year)
    parser.add_argument(
        "--all-venues",
        action="store_true",
        help="Score every cached paper, not just venues.json whitelist",
    )
    args = parser.parse_args()

    ensure_dirs()
    all_path = CACHE / "all_publications.json"
    filtered_path = CACHE / "filtered_publications.json"
    pubs_path = all_path if all_path.exists() else filtered_path
    if not pubs_path.exists():
        raise SystemExit(f"Missing {pubs_path}; run fetch_scholar.py first")

    raw_pubs = json.loads(pubs_path.read_text(encoding="utf-8"))
    faculty = pd.read_csv(DATA / "faculty.csv")
    institutions = pd.read_csv(DATA / "institutions.csv")
    venues_doc = load_venues()
    venues = venue_name_lookup(venues_doc)
    curated_areas = load_faculty_areas()
    all_pubs = [apply_venue(p, venues) for p in raw_pubs]
    pubs = all_pubs if args.all_venues else [p for p in all_pubs if p.get("in_whitelist")]

    views = {}
    for wkey, wval in WINDOWS.items():
        for cross in (False, True):
            cross_key = "with_cross" if cross else "core"
            views[f"window_{wkey}__{cross_key}"] = score_rows(
                pubs,
                faculty,
                institutions,
                window=wval,
                include_cross_boundary=cross,
                current_year=args.year,
                curated_areas=curated_areas,
            )

    default = views["window_10__core"]
    bundle = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_year": args.year,
        "coverage_note": "Coverage: U.S./Canadian I-O PhD programs. Faculty area pills come from Scholar/homepage interests mapped to data/taxonomy.json; papers use the same taxonomy via title keywords.",
        "metrics": [
            {"key": "adj_count", "label": "Adjusted count (1/N)", "default": True},
            {"key": "raw_count", "label": "Raw paper count"},
            {"key": "citations", "label": "Citations"},
            {"key": "weighted_if", "label": "Impact factor (sum)"},
            {"key": "adj_count_per_faculty", "label": "Adj. count / faculty"},
            {"key": "citations_per_faculty", "label": "Citations / faculty"},
            {"key": "weighted_if_per_faculty", "label": "IF sum / faculty"},
        ],
        "windows": ["5", "10", "all"],
        "areas": venues_doc.get("areas") or [],
        "domains": venues_doc.get("domains") or [],
        "venues": venues_doc["venues"],
        "default": {
            "window": "10",
            "cross_boundary": False,
            "metric": "adj_count",
            "countries": ["US", "CA"],
        },
        "views": views,
    }

    WEB_DATA.mkdir(parents=True, exist_ok=True)
    out = WEB_DATA / "rankings.json"
    out.write_text(json.dumps(bundle, indent=2), encoding="utf-8")
    (WEB_DATA / "publications.json").write_text(json.dumps(all_pubs, indent=2), encoding="utf-8")
    print(
        f"Wrote {out} "
        f"({len(default['institutions'])} institutions, {len(default['faculty'])} faculty)"
    )


if __name__ == "__main__":
    main()
