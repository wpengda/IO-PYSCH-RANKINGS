"""Fetch faculty works from Crossref using ORCID (author-claimed identity).

Optional Crossref-by-ORCID fetch. Primary source is Google Scholar
profiles. Name search is not used.
"""

from __future__ import annotations

import argparse
import json
import time
from typing import Any

import httpx
import pandas as pd

from config import (
    ALLOWED_TYPES,
    CACHE,
    CROSSREF_BASE,
    DATA,
    USER_AGENT,
    ensure_dirs,
    load_venues,
    normalize_issn,
    normalize_orcid,
    venue_by_issn,
)


def _get_json(client: httpx.Client, url: str, params: dict | None = None) -> dict:
    for attempt in range(5):
        resp = client.get(url, params=params)
        if resp.status_code == 429:
            time.sleep(2 ** attempt)
            continue
        resp.raise_for_status()
        return resp.json()
    resp.raise_for_status()
    return resp.json()


def fetch_orcid_works(client: httpx.Client, orcid: str) -> list[dict[str, Any]]:
    works: list[dict[str, Any]] = []
    cursor = "*"
    while cursor:
        data = _get_json(
            client,
            f"{CROSSREF_BASE}/works",
            params={
                "filter": f"orcid:{orcid},type:journal-article",
                "rows": 100,
                "cursor": cursor,
                "mailto": "io-psyc-rankings@example.com",
            },
        )
        message = data.get("message") or {}
        items = message.get("items") or []
        works.extend(items)
        cursor = message.get("next-cursor") if items else None
        time.sleep(0.15)
    return works


def year_from_crossref(item: dict) -> int | None:
    for key in ("published-print", "published-online", "issued"):
        parts = ((item.get(key) or {}).get("date-parts") or [[]])[0]
        if parts:
            try:
                return int(parts[0])
            except (TypeError, ValueError):
                continue
    return None


def title_from_crossref(item: dict) -> str:
    titles = item.get("title") or []
    return titles[0] if titles else ""


def filter_work(item: dict, venues: dict[str, dict]) -> dict | None:
    if (item.get("type") or "") not in ALLOWED_TYPES:
        return None
    year = year_from_crossref(item)
    if not year:
        return None
    matched = None
    for issn in item.get("ISSN") or []:
        matched = venues.get(normalize_issn(issn))
        if matched:
            break
    if not matched:
        return None
    n_authors = max(1, len(item.get("author") or []))
    doi = item.get("DOI") or ""
    return {
        "work_id": doi or item.get("URL") or title_from_crossref(item),
        "doi": f"https://doi.org/{doi}" if doi else "",
        "title": title_from_crossref(item),
        "year": int(year),
        "type": "article",
        "cited_by_count": int(item.get("is-referenced-by-count") or 0),
        "n_authors": n_authors,
        "adj_credit": 1.0 / n_authors,
        "venue_id": matched["id"],
        "venue_name": matched["name"],
        "venue_weight": float(matched["weight"]),
        "cross_boundary": bool(matched.get("cross_boundary")),
        "areas": matched.get("areas") or [],
        "source": "crossref_orcid",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch whitelist journal articles via ORCID + Crossref")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    ensure_dirs()
    faculty = pd.read_csv(DATA / "faculty.csv")
    faculty = faculty[faculty["active"].astype(str).str.lower().isin(["true", "1", "yes"])]
    if "orcid" not in faculty.columns:
        faculty["orcid"] = ""
    if args.limit:
        faculty = faculty.head(args.limit)

    venues = venue_by_issn(load_venues())
    all_pubs: list[dict] = []
    skipped = 0

    with httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=60.0) as client:
        for _, row in faculty.iterrows():
            fid = row["faculty_id"]
            orcid = normalize_orcid(row.get("orcid"))
            if not orcid:
                skipped += 1
                print(f"Skipping {row['name']} (no ORCID on file)")
                continue
            print(f"Fetching {row['name']} (orcid:{orcid})...")
            raw = fetch_orcid_works(client, orcid)
            (CACHE / f"{fid}.crossref.json").write_text(json.dumps(raw), encoding="utf-8")
            for item in raw:
                filtered = filter_work(item, venues)
                if not filtered:
                    continue
                filtered["faculty_id"] = fid
                filtered["name"] = row["name"]
                filtered["institution_id"] = row["institution_id"]
                filtered["orcid"] = orcid
                all_pubs.append(filtered)

    out_path = CACHE / "filtered_publications.json"
    out_path.write_text(json.dumps(all_pubs, indent=2), encoding="utf-8")
    print(f"Wrote {len(all_pubs)} filtered authorships -> {out_path} ({skipped} faculty skipped, no ORCID)")


if __name__ == "__main__":
    main()
