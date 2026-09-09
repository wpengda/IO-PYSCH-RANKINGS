"""Build coauthor nodes/edges from cached Scholar publications.

Faculty with a Google Scholar ID (current roster, inactive, and
appointment-only) who share a paper become an internal edge.
A person may list several programs. Unmatched author strings are
kept as external nodes on ego edges.

Writes pipeline/cache/coauthor_network.json (gitignored) and
web/data/coauthor_network.json (slim copy for later viz).
"""

from __future__ import annotations

import json
import re
from collections import defaultdict

import pandas as pd

from config import (
    CACHE,
    DATA,
    WEB_DATA,
    apply_venue,
    appointments_payload,
    ensure_dirs,
    faculty_for_network,
    load_venues,
    venue_name_lookup,
)

SUFFIXES = {"jr", "sr", "ii", "iii", "iv", "phd", "ph.d"}
# Given-name pairs that are not prefixes of each other (Tom/Thomas is).
_NICKNAMES = {
    frozenset(p)
    for p in (
        ("mike", "michael"),
        ("bob", "robert"),
        ("bill", "william"),
        ("will", "william"),
        ("jim", "james"),
        ("joe", "joseph"),
        ("liz", "elizabeth"),
        ("beth", "elizabeth"),
        ("kate", "katherine"),
        ("kathy", "katherine"),
        ("katie", "katherine"),
        ("cathy", "catherine"),
        ("chris", "christopher"),
        ("tom", "thomas"),
        ("steve", "stephen"),
        ("cliff", "clifford"),
        ("cliff", "clifton"),
        ("mikki", "michelle"),
        ("dia", "deepshikha"),
        ("jenny", "jennifer"),
        ("jen", "jennifer"),
        ("rick", "richard"),
        ("dick", "richard"),
        ("ted", "theodore"),
        ("tony", "anthony"),
        ("matt", "matthew"),
        ("nick", "nicholas"),
    )
}


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


def _split_name(name: str) -> tuple[list[str], str]:
    parts = tokens(name)
    if not parts:
        return [], ""
    return parts[:-1], parts[-1]


def _is_nickname(a: str, b: str) -> bool:
    return a != b and frozenset({a, b}) in _NICKNAMES


def _given_token_compatible(author: str, roster: str) -> bool:
    if author == roster:
        return True
    if _is_nickname(author, roster):
        return True
    if len(author) == 1:
        return roster.startswith(author)
    if len(roster) == 1:
        return author.startswith(roster)
    # Alex / Alexander. Length-2 prefixes are too loose (Je / Julie, Ti / Tianjun).
    if len(author) >= 3 and roster.startswith(author):
        return True
    if len(roster) >= 3 and author.startswith(roster):
        return True
    return False


def _givens_compatible(author_given: list[str], roster_given: list[str]) -> bool:
    if not author_given or not roster_given:
        return True
    n = min(len(author_given), len(roster_given))
    if all(_given_token_compatible(author_given[i], roster_given[i]) for i in range(n)):
        return True
    # Parenthetical / extra given names: Daisy vs Chu-Hsiang (Daisy).
    for a in author_given:
        if len(a) == 1:
            if any(r.startswith(a) for r in roster_given):
                continue
            return False
        if not any(_given_token_compatible(a, r) for r in roster_given):
            return False
    return True


def match_strength(author: str, roster_name: str) -> str | None:
    """How specifically `author` can refer to `roster_name`.

    ``strong`` — full given name, nickname, or 2+ initials (TD Allen, AM Ryan).
    ``weak`` — last name plus a single initial (T Sun), or last name only.
    ``None`` — different given name (Tianlu vs Tianjun) or clashing initials (JE vs JV).
    """
    ag, alast = _split_name(author)
    rg, rlast = _split_name(roster_name)
    if not alast or not rlast or alast != rlast:
        return None
    if not ag:
        return "weak"
    if not rg:
        return "weak"
    ri = "".join(g[0] for g in rg if g)
    if len(ag) == 1 and 2 <= len(ag[0]) <= 4 and ag[0].isalpha():
        blob = ag[0]
        if ri.startswith(blob):
            return "strong"
        if any(_given_token_compatible(blob, r) for r in rg):
            return "strong"
        return None
    if not _givens_compatible(ag, rg):
        return None
    if any(len(t) >= 2 for t in ag):
        return "strong"
    return "weak"


def load_roster() -> pd.DataFrame:
    return faculty_for_network()


def build_affiliations(
    faculty: pd.DataFrame,
    inst_names: dict[str, str],
    inst_countries: dict[str, str],
) -> dict[str, list[dict]]:
    """One person can list several programs (current faculty.csv row + appointments)."""
    current_inst: dict[str, str] = {}
    current_active: set[str] = set()
    names: dict[str, str] = {}
    for _, row in faculty.iterrows():
        fid = str(row["faculty_id"])
        names[fid] = str(row["name"] or "")
        iid = str(row.get("institution_id") or "").strip()
        if iid:
            current_inst[fid] = iid
        if str(row.get("active", True)).lower() in ("true", "1", "yes"):
            current_active.add(fid)

    slots: dict[str, dict[str, dict]] = defaultdict(dict)
    for appt in appointments_payload():
        fid = appt["faculty_id"]
        iid = appt["institution_id"]
        slots[fid][iid] = {
            "institution_id": iid,
            "name": inst_names.get(iid) or appt.get("institution_name") or iid,
            "country": inst_countries.get(iid, "") or ("US" if iid == "uci" else ""),
            "start_year": appt.get("start_year"),
            "end_year": appt.get("end_year"),
            "current": appt.get("end_year") is None
            or (fid in current_active and current_inst.get(fid) == iid),
        }
        if appt.get("name"):
            names[fid] = appt["name"]

    for fid, iid in current_inst.items():
        if not iid:
            continue
        if iid not in slots[fid]:
            slots[fid][iid] = {
                "institution_id": iid,
                "name": inst_names.get(iid, iid),
                "country": inst_countries.get(iid, ""),
                "start_year": None,
                "end_year": None,
                "current": fid in current_active,
            }
        else:
            slots[fid][iid]["current"] = fid in current_active and current_inst.get(fid) == iid

    out: dict[str, list[dict]] = {}
    for fid, by_iid in slots.items():
        rows = list(by_iid.values())
        rows.sort(
            key=lambda r: (
                0 if r.get("current") else 1,
                -(r.get("end_year") or (9999 if r.get("current") else 0)),
                r.get("name") or "",
            )
        )
        out[fid] = rows
    return out


def roster_index(faculty: pd.DataFrame) -> dict[str, list[str]]:
    by_key: dict[str, list[str]] = defaultdict(list)
    for _, row in faculty.iterrows():
        fid = str(row["faculty_id"])
        for key in name_keys(str(row["name"])):
            if fid not in by_key[key]:
                by_key[key].append(fid)
    return dict(by_key)


def match_author(
    name: str,
    by_key: dict[str, list[str]],
    ego: str,
    roster_names: dict[str, str] | None = None,
    *,
    title_key: str = "",
    titles_by_fid: dict[str, set[str]] | None = None,
) -> str | None:
    """Match a Scholar author string to a roster id (not the paper's ego).

    Weak matches (T Sun) need the same normalized title on that person's
    Scholar profile so an unlisted Tianlu Sun is not attached to Tianjun Sun.
    Ambiguous initials (J Lee with two J. Lees on the roster) are left unmatched;
    title overlap can still create the tie if both profiles list the paper.
    """
    hits: list[str] = []
    for key in name_keys(name):
        for fid in by_key.get(key, []):
            if fid not in hits:
                hits.append(fid)
    names = roster_names or {}
    ranked: list[tuple[str, str]] = []
    for fid in hits:
        roster = names.get(fid) or ""
        kind = match_strength(name, roster) if roster else "weak"
        if kind:
            ranked.append((fid, kind))
    compatible = [fid for fid, _ in ranked]
    strengths = {fid: kind for fid, kind in ranked}

    def _accept(fid: str) -> str | None:
        if fid == ego:
            return None
        if strengths.get(fid) == "weak" and titles_by_fid is not None:
            if title_key not in (titles_by_fid.get(fid) or set()):
                return None
        return fid

    if len(compatible) > 1:
        strong_others = [
            fid for fid in compatible if fid != ego and strengths[fid] == "strong"
        ]
        if len(strong_others) == 1:
            return _accept(strong_others[0])
        return None
    if len(compatible) == 1:
        return _accept(compatible[0])
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
    roster_names = {fid: str(row["name"] or "") for fid, row in by_id.items()}
    by_key = roster_index(faculty)

    title_faculty: dict[str, set[str]] = defaultdict(set)
    titles_by_fid: dict[str, set[str]] = defaultdict(set)
    with_authors = 0
    for p in pubs:
        fid = str(p.get("faculty_id") or "")
        if fid not in by_id:
            continue
        t = norm_title(p.get("title") or "")
        if t:
            title_faculty[t].add(fid)
            titles_by_fid[fid].add(t)
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
            matched = match_author(
                name,
                by_key,
                ego,
                roster_names,
                title_key=tkey,
                titles_by_fid=titles_by_fid,
            )
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

    affiliations = build_affiliations(faculty, inst_names, inst_countries)

    degree: dict[str, int] = defaultdict(int)
    strength: dict[str, int] = defaultdict(int)
    for (a, b), meta in roster_edges.items():
        degree[a] += 1
        degree[b] += 1
        strength[a] += meta["weight"]
        strength[b] += meta["weight"]

    nodes = []
    for fid, row in by_id.items():
        affs = affiliations.get(fid) or []
        primary = next((a for a in affs if a.get("current")), affs[0] if affs else None)
        iid = str(primary["institution_id"]) if primary else str(row["institution_id"])
        nodes.append(
            {
                "id": fid,
                "kind": "roster",
                "name": row["name"],
                "institution_id": iid,
                "institution": (primary or {}).get("name")
                or inst_names.get(iid, iid),
                "country": (primary or {}).get("country")
                or inst_countries.get(iid, ""),
                "institutions": affs,
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
