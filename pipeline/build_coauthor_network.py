"""Build coauthor nodes/edges from cached Scholar publications.

Roster faculty who share a paper (same normalized title on two profiles, or
a parsed author string matching another roster name) become an internal edge.
Unmatched author strings are kept as external nodes on ego edges.

Writes pipeline/cache/coauthor_network.json (gitignored) and
web/data/coauthor_network.json (slim copy for later viz).
"""

from __future__ import annotations

import json
import re
from collections import defaultdict

import pandas as pd

from config import CACHE, DATA, WEB_DATA, apply_venue, ensure_dirs, has_google_scholar_id, load_faculty, load_venues, venue_name_lookup

SUFFIXES = {"jr", "sr", "ii", "iii", "iv", "phd", "ph.d"}


def norm_title(title: str) -> str:
    text = (title or "").lower()
    text = text.replace("–", "-").replace("—", "-").replace("’", "'")
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def tokens(name: str) -> list[str]:
    text = re.sub(r"[^a-z]+", " ", (name or "").lower()).strip()
    parts = [p for p in text.split() if p and p not in SUFFIXES]
    return parts


def name_keys(name: str) -> set[str]:
    parts = tokens(name)
    if not parts:
        return set()
    keys = {" ".join(parts)}
    last = parts[-1]
    given = parts[:-1]
    if given:
        initials = "".join(p[0] for p in given if p)
        keys.add(f"{last} {initials}")
        keys.add(f"{initials} {last}")
        keys.add(f"{last} {given[0][0]}")
        keys.add(f"{given[0][0]} {last}")
        keys.add(f"{given[0]} {last}")
        keys.add(f"{last} {given[0]}")
    else:
        keys.add(last)
    return {k for k in keys if k}


def load_roster() -> pd.DataFrame:
    faculty = load_faculty()
    faculty = faculty[faculty["active"].astype(str).str.lower().isin(["true", "1", "yes"])]
    faculty = faculty[faculty["google_scholar_id"].map(has_google_scholar_id)]
    return faculty


def roster_index(faculty: pd.DataFrame) -> dict[str, list[str]]:
    by_key: dict[str, list[str]] = defaultdict(list)
    for _, row in faculty.iterrows():
        fid = str(row["faculty_id"])
        for key in name_keys(str(row["name"])):
            if fid not in by_key[key]:
                by_key[key].append(fid)
    return dict(by_key)


def match_author(name: str, by_key: dict[str, list[str]], ego: str) -> str | None:
    hits: list[str] = []
    for key in name_keys(name):
        for fid in by_key.get(key, []):
            if fid not in hits:
                hits.append(fid)
    if ego in hits and len(hits) == 1:
        return ego
    others = [h for h in hits if h != ego]
    if len(others) == 1:
        return others[0]
    if len(hits) == 1:
        return hits[0]
    return None


def add_undirected(
    edges: dict[tuple[str, str], dict],
    a: str,
    b: str,
    title: str,
    year,
    venue_id: str = "",
    areas: list | None = None,
    display_title: str = "",
) -> None:
    if not a or not b or a == b:
        return
    key = (a, b) if a < b else (b, a)
    slot = edges.setdefault(
        key, {"weight": 0, "titles": set(), "venues": defaultdict(int), "papers": []}
    )
    if title in slot["titles"]:
        return
    slot["titles"].add(title)
    slot["weight"] += 1
    if venue_id:
        slot["venues"][venue_id] += 1
        slot["papers"].append(
            {
                "y": year,
                "v": venue_id,
                "a": list(areas or []),
                "t": (display_title or "").strip(),
            }
        )
    slot["year_min"] = min(slot.get("year_min", year or 9999), year or 9999)
    slot["year_max"] = max(slot.get("year_max", year or 0), year or 0)


def main() -> None:
    ensure_dirs()
    pubs_path = CACHE / "all_publications.json"
    if not pubs_path.exists():
        raise SystemExit(f"Missing {pubs_path}; run fetch_scholar_serpapi.py first")

    pubs = json.loads(pubs_path.read_text(encoding="utf-8"))
    venues_doc = load_venues()
    venues = venue_name_lookup(venues_doc)
    pubs = [apply_venue(p, venues) for p in pubs]
    faculty = load_roster()
    by_id = {str(r["faculty_id"]): r for _, r in faculty.iterrows()}
    by_key = roster_index(faculty)

    title_faculty: dict[str, set[str]] = defaultdict(set)
    with_authors = 0
    for p in pubs:
        fid = str(p.get("faculty_id") or "")
        if fid not in by_id:
            continue
        t = norm_title(p.get("title") or "")
        if t:
            title_faculty[t].add(fid)
        if p.get("authors"):
            with_authors += 1

    roster_edges: dict[tuple[str, str], dict] = {}
    ego_edges: dict[tuple[str, str], dict] = {}
    externals: dict[str, str] = {}

    for p in pubs:
        ego = str(p.get("faculty_id") or "")
        if ego not in by_id:
            continue
        title = p.get("title") or ""
        tkey = norm_title(title)
        year = p.get("year")
        try:
            year = int(year) if year is not None else None
        except (TypeError, ValueError):
            year = None
        venue_id = str(p.get("venue_id") or "") if p.get("in_whitelist") else ""
        areas = [a for a in (p.get("areas") or []) if a]

        roster_on_paper = set(title_faculty.get(tkey) or {ego})
        roster_on_paper.add(ego)
        for other in roster_on_paper:
            add_undirected(roster_edges, ego, other, tkey, year, venue_id, areas, title)
            add_undirected(ego_edges, f"roster:{ego}", f"roster:{other}", tkey, year, venue_id, areas, title)

        for name in p.get("authors") or []:
            matched = match_author(name, by_key, ego)
            if matched:
                add_undirected(roster_edges, ego, matched, tkey, year, venue_id, areas, title)
                add_undirected(ego_edges, f"roster:{ego}", f"roster:{matched}", tkey, year, venue_id, areas, title)
                continue
            ext_id = "ext:" + " ".join(tokens(name)) or name
            if ext_id not in externals:
                externals[ext_id] = name
            add_undirected(ego_edges, f"roster:{ego}", ext_id, tkey, year, venue_id, areas, title)

    inst_names = {}
    inst_countries = {}
    inst_path = DATA / "institutions.csv"
    if inst_path.exists():
        inst = pd.read_csv(inst_path)
        inst_names = {
            str(r["institution_id"]): str(r["name"])
            for _, r in inst.iterrows()
        }
        inst_countries = {
            str(r["institution_id"]): str(r.get("country") or "")
            for _, r in inst.iterrows()
        }

    degree: dict[str, int] = defaultdict(int)
    strength: dict[str, int] = defaultdict(int)
    for (a, b), meta in roster_edges.items():
        degree[a] += 1
        degree[b] += 1
        strength[a] += meta["weight"]
        strength[b] += meta["weight"]

    nodes = []
    for fid, row in by_id.items():
        iid = str(row["institution_id"])
        nodes.append(
            {
                "id": fid,
                "kind": "roster",
                "name": row["name"],
                "institution_id": iid,
                "institution": inst_names.get(iid, iid),
                "country": inst_countries.get(iid, ""),
                "degree": int(degree[fid]),
                "strength": int(strength[fid]),
            }
        )

    venue_meta = [
        {
            "id": v["id"],
            "name": v["name"],
            "cross_boundary": bool(v.get("cross_boundary")),
            "discipline": v.get("discipline") or "",
            "subfield": v.get("subfield") or "",
            "io_relevance": v.get("io_relevance") or "",
            "jcr_quartile": v.get("jcr_quartile") or "",
            "impact_factor": v.get("impact_factor"),
            "abdc": v.get("abdc") or "",
        }
        for v in venues_doc.get("venues") or []
    ]

    roster_edge_list = [
        {
            "source": a,
            "target": b,
            "weight": meta["weight"],
            "venues": dict(meta.get("venues") or {}),
            "papers": meta.get("papers") or [],
            "year_min": meta.get("year_min"),
            "year_max": meta.get("year_max"),
        }
        for (a, b), meta in sorted(roster_edges.items(), key=lambda kv: -kv[1]["weight"])
    ]

    years = [
        int(p["y"])
        for e in roster_edge_list
        for p in e.get("papers") or []
        if p.get("y") is not None
    ]
    payload = {
        "stats": {
            "publications": len(pubs),
            "with_author_names": with_authors,
            "roster_nodes": len(by_id),
            "roster_edges": len(roster_edge_list),
            "external_name_strings": len(externals),
            "year_min": min(years) if years else 1973,
            "year_max": max(years) if years else 2026,
        },
        "venues": venue_meta,
        "areas": venues_doc.get("areas") or [],
        "domains": venues_doc.get("domains") or [],
        "disciplines": venues_doc.get("disciplines") or [],
        "nodes": nodes,
        "roster_edges": roster_edge_list,
    }

    cache_out = CACHE / "coauthor_network.json"
    cache_out.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
    WEB_DATA.mkdir(parents=True, exist_ok=True)
    slim = {
        "stats": payload["stats"],
        "venues": venue_meta,
        "areas": payload["areas"],
        "domains": payload["domains"],
        "disciplines": payload["disciplines"],
        "nodes": nodes,
        "roster_edges": roster_edge_list,
    }
    (WEB_DATA / "coauthor_network.json").write_text(
        json.dumps(slim, indent=2, default=str), encoding="utf-8"
    )
    s = payload["stats"]
    print(
        f"Wrote {cache_out} and web/data/coauthor_network.json "
        f"({s['roster_nodes']} roster nodes, {s['roster_edges']} roster edges, "
        f"{s['with_author_names']}/{s['publications']} pubs with author names)"
    )


if __name__ == "__main__":
    main()
