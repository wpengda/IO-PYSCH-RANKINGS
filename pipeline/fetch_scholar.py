"""Fetch *all* publications from Google Scholar profiles.

Requires google_scholar_id on faculty.csv.
Does not search Scholar by name. Does not drop non-whitelist journals —
venues.json is applied later in score.py so the list can change without
re-fetching.

Install: pip install scholarly
Note: Google may block automated requests; use cookies/proxies if needed,
or export a Scholar profile as CSV and drop it in pipeline/cache/scholar/.
"""

from __future__ import annotations

import argparse
import json
import re
import time

import pandas as pd

from config import (
    CACHE,
    DATA,
    apply_venue,
    ensure_dirs,
    load_faculty,
    load_venues,
    venue_name_lookup,
)

try:
    from scholarly import scholarly
except ImportError:
    scholarly = None


def pubs_from_author(scholar_id: str) -> list[dict]:
    if scholarly is None:
        raise SystemExit("Install scholarly: pip install scholarly")
    author = scholarly.fill(scholarly.search_author_id(scholar_id), sections=["publications"])
    return author.get("publications") or []


def parse_year(bib: dict) -> int | None:
    year = bib.get("pub_year") or bib.get("year")
    try:
        return int(year)
    except (TypeError, ValueError):
        return None


_AUTHOR_SPLIT = re.compile(r"\s+and\s+|,\s*")


def parse_author_names(raw: str) -> list[str]:
    """Split Scholar/SerpAPI author strings into display names."""
    names: list[str] = []
    for part in _AUTHOR_SPLIT.split(raw or ""):
        name = " ".join(part.split())
        if not name or re.fullmatch(r"[.…]+", name):
            continue
        if name.lower().rstrip(".") in {"et al", "etal"}:
            continue
        names.append(name)
    return names


def records_from_raw(raw: list[dict], row: pd.Series, venues: dict) -> list[dict]:
    out = []
    sid = str(row.get("google_scholar_id") or "").strip()
    for pub in raw:
        bib = pub.get("bib") or {}
        authors = parse_author_names(bib.get("author") or "")
        n = max(1, len(authors))
        out.append(
            apply_venue(
                {
                    "work_id": pub.get("author_pub_id") or bib.get("title"),
                    "doi": "",
                    "title": bib.get("title"),
                    "year": parse_year(bib),
                    "type": bib.get("pub_type") or "article",
                    "cited_by_count": int(pub.get("num_citations") or 0),
                    "n_authors": n,
                    "authors": authors,
                    "adj_credit": 1.0 / n,
                    "raw_venue": bib.get("citation") or bib.get("venue") or bib.get("journal") or "",
                    "source": "google_scholar",
                    "faculty_id": row["faculty_id"],
                    "name": row["name"],
                    "institution_id": row["institution_id"],
                    "google_scholar_id": sid,
                },
                venues,
            )
        )
    return out


def write_outputs(all_pubs: list[dict]) -> None:
    all_path = CACHE / "all_publications.json"
    all_path.write_text(json.dumps(all_pubs, indent=2), encoding="utf-8")
    filtered = [p for p in all_pubs if p.get("in_whitelist")]
    filtered_path = CACHE / "filtered_publications.json"
    filtered_path.write_text(json.dumps(filtered, indent=2), encoding="utf-8")
    print(
        f"Wrote {len(all_pubs)} pubs -> {all_path} "
        f"({len(filtered)} whitelist -> {filtered_path})"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="Max new profiles to fetch")
    parser.add_argument("--force", action="store_true", help="Re-fetch even if cached")
    parser.add_argument("--sleep", type=float, default=2.0)
    args = parser.parse_args()

    ensure_dirs()
    cache_dir = CACHE / "scholar"
    cache_dir.mkdir(exist_ok=True)
    faculty = load_faculty()
    faculty = faculty[faculty["active"].astype(str).str.lower().isin(["true", "1", "yes"])]
    has_id = faculty["google_scholar_id"].fillna("").astype(str).str.strip()
    faculty = faculty[~has_id.isin(["", "nan", "none"])]
    venues = venue_name_lookup(load_venues())

    todo = []
    cached_ok = 0
    for _, row in faculty.iterrows():
        path = cache_dir / f"{row['faculty_id']}.json"
        if path.exists() and not args.force:
            cached_ok += 1
            continue
        todo.append(row)
    if args.limit:
        todo = todo[: args.limit]

    print(f"Cached {cached_ok}; fetching {len(todo)} Scholar profiles")
    fetched = 0
    failed = 0
    streak = 0
    try:
        for i, row in enumerate(todo, 1):
            sid = str(row["google_scholar_id"]).strip()
            print(f"[{i}/{len(todo)}] {row['name']} ({sid})", flush=True)
            try:
                raw = pubs_from_author(sid)
            except Exception as exc:
                failed += 1
                streak += 1
                wait = min(args.sleep * (2 ** min(streak, 4)), 60)
                print(f"  failed: {exc}  (backoff {wait:.0f}s)", flush=True)
                if streak >= 8:
                    print("Too many consecutive blocks; stopping so we can retry later.")
                    break
                time.sleep(wait)
                continue
            (cache_dir / f"{row['faculty_id']}.json").write_text(
                json.dumps(raw, default=str), encoding="utf-8"
            )
            recs = records_from_raw(raw, row, venues)
            listed = sum(1 for r in recs if r.get("in_whitelist"))
            print(f"  {len(recs)} pubs ({listed} whitelist)", flush=True)
            fetched += 1
            streak = 0
            time.sleep(args.sleep)
    finally:
        all_pubs: list[dict] = []
        by_id = {r["faculty_id"]: r for _, r in faculty.iterrows()}
        for path in sorted(cache_dir.glob("*.json")):
            fid = path.stem
            if fid not in by_id:
                continue
            raw = json.loads(path.read_text(encoding="utf-8"))
            all_pubs.extend(records_from_raw(raw, by_id[fid], venues))
        write_outputs(all_pubs)
        print(f"Fetched {fetched}, failed {failed}, reused cache {cached_ok}")


if __name__ == "__main__":
    main()
