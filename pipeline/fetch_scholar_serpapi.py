"""Fetch Google Scholar profile publications via SerpAPI.

Uses google_scholar_id from faculty.csv. Caches raw pubs in the same
format as fetch_scholar.py so score rebuilds are shared.

Requires SERPAPI_API_KEY in the environment or a .env file at the repo root.
"""

from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path

import httpx
import pandas as pd

from config import (
    CACHE,
    ROOT,
    ensure_dirs,
    faculty_for_publication_fetch,
    has_google_scholar_id,
    load_venues,
    venue_name_lookup,
)
from fetch_scholar import records_from_raw, write_outputs

SERPAPI = "https://serpapi.com/search.json"
PAGE_SIZE = 100


def load_dotenv() -> None:
    path = ROOT / ".env"
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key, val = key.strip(), val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


def api_key() -> str:
    load_dotenv()
    key = (os.environ.get("SERPAPI_API_KEY") or "").strip()
    if not key:
        raise SystemExit("Set SERPAPI_API_KEY in the environment or .env")
    return key


def cache_needs_refresh(path: Path) -> bool:
    """True if missing, empty, or list-level authors are incomplete."""
    if not path.exists():
        return True
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return True
    if not isinstance(data, list) or not data:
        return True
    sample = data[: min(20, len(data))]
    with_author = sum(1 for p in sample if ((p.get("bib") or {}).get("author") or "").strip())
    # Early scholarly dumps often omit authors on the list page.
    if with_author < max(1, len(sample) // 2):
        return True
    return False


def serpapi_articles(author_id: str, key: str, client: httpx.Client) -> list[dict]:
    """Return list-level publication dicts (no abstract / view_citation)."""
    articles: list[dict] = []
    start = 0
    while True:
        params = {
            "engine": "google_scholar_author",
            "author_id": author_id,
            "hl": "en",
            "num": PAGE_SIZE,
            "start": start,
            "api_key": key,
        }
        resp = client.get(SERPAPI, params=params, timeout=60.0)
        if resp.status_code == 429:
            raise RuntimeError("SerpAPI rate limit / quota")
        data = resp.json()
        if data.get("error"):
            raise RuntimeError(data["error"])
        if resp.status_code >= 400:
            raise RuntimeError(f"HTTP {resp.status_code}: {data}")
        meta = data.get("search_metadata") or {}
        html_url = meta.get("raw_html_file") or ""
        if html_url:
            html = client.get(html_url, timeout=60.0).text
            if "Error 404" in html or "404 (Not Found)" in html:
                raise RuntimeError("Scholar profile 404 via SerpAPI")
        batch = data.get("articles") or []
        for art in batch:
            cites = art.get("cited_by") or {}
            year = art.get("year")
            pub = art.get("publication") or ""
            articles.append(
                {
                    "author_pub_id": art.get("citation_id") or art.get("title"),
                    "citation_id": art.get("citation_id") or "",
                    "num_citations": int(cites.get("value") or 0),
                    "bib": {
                        "title": art.get("title"),
                        "author": art.get("authors") or "",
                        "pub_year": str(year) if year not in (None, "") else "",
                        "citation": pub,
                        "venue": pub,
                    },
                }
            )
        if len(batch) < PAGE_SIZE:
            break
        if not (data.get("serpapi_pagination") or {}).get("next"):
            break
        start += PAGE_SIZE
        time.sleep(0.25)
    return articles


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch Scholar list-level pubs via SerpAPI (no abstracts)."
    )
    parser.add_argument("--limit", type=int, default=0, help="Max profiles to fetch this run")
    parser.add_argument("--force", action="store_true", help="Re-fetch even if cached")
    parser.add_argument(
        "--refresh-incomplete",
        action="store_true",
        help="Also re-fetch caches that are missing author strings",
    )
    parser.add_argument("--sleep", type=float, default=0.5)
    args = parser.parse_args()

    key = api_key()
    ensure_dirs()
    cache_dir = CACHE / "scholar"
    cache_dir.mkdir(exist_ok=True)
    faculty = faculty_for_publication_fetch()
    faculty = faculty[faculty["google_scholar_id"].map(has_google_scholar_id)]
    venues = venue_name_lookup(load_venues())

    todo = []
    cached_ok = 0
    for _, row in faculty.iterrows():
        path = cache_dir / f"{row['faculty_id']}.json"
        if args.force or (args.refresh_incomplete and cache_needs_refresh(path)):
            todo.append(row)
        elif path.exists():
            cached_ok += 1
        else:
            todo.append(row)
    if args.limit:
        todo = todo[: args.limit]

    print(f"Keeping {cached_ok}; fetching {len(todo)} Scholar list profiles via SerpAPI")
    fetched = 0
    failed = 0
    try:
        with httpx.Client() as client:
            for i, row in enumerate(todo, 1):
                sid = str(row["google_scholar_id"]).strip()
                print(f"[{i}/{len(todo)}] {row['name']} ({sid})", flush=True)
                try:
                    raw = serpapi_articles(sid, key, client)
                except Exception as exc:
                    failed += 1
                    print(f"  failed: {exc}", flush=True)
                    time.sleep(max(args.sleep, 2.0))
                    continue
                if not raw:
                    failed += 1
                    print("  failed: empty article list (not cached)", flush=True)
                    continue
                (cache_dir / f"{row['faculty_id']}.json").write_text(
                    json.dumps(raw, default=str), encoding="utf-8"
                )
                recs = records_from_raw(raw, row, venues)
                listed = sum(1 for r in recs if r.get("in_whitelist"))
                with_auth = sum(1 for r in raw if (r.get("bib") or {}).get("author"))
                print(
                    f"  {len(recs)} pubs ({listed} whitelist, {with_auth} with authors)",
                    flush=True,
                )
                fetched += 1
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
