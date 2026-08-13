"""Map scraped interest phrases onto data/taxonomy.json and sync venue/keyword files."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

from config import CACHE, DATA, load_venues

INTERESTS = CACHE / "interests" / "faculty_interests.json"
TAXONOMY = DATA / "taxonomy.json"
FACULTY_AREAS = DATA / "faculty_areas.json"
UNMAPPED = CACHE / "interests" / "unmapped_phrases.json"


def load_taxonomy() -> dict:
    return json.loads(TAXONOMY.read_text(encoding="utf-8"))


def normalize(text: str) -> str:
    text = (text or "").lower().replace("–", "-").replace("—", "-")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def map_phrase(phrase: str, aliases: dict[str, str]) -> list[str]:
    """Map one free-text interest to zero or more canonical areas."""
    p = normalize(phrase)
    if not p:
        return []
    if "gather" in p and "meta quest" in p:
        return []
    if p in aliases:
        area = aliases[p]
        return [] if area == "General" else [area]

    hits: list[str] = []
    for alias, area in sorted(aliases.items(), key=lambda kv: -len(kv[0])):
        if area == "General":
            continue
        if len(alias) <= 3:
            if re.search(rf"(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])", p):
                if area not in hits:
                    hits.append(area)
            continue
        if alias in p or (len(p) >= 5 and p in alias and len(alias) - len(p) <= 8):
            if area not in hits:
                hits.append(area)
    return hits


def expand_phrases(phrases: list[str]) -> list[str]:
    """Split comma-joined interest chips into atomic phrases."""
    out: list[str] = []
    for phrase in phrases:
        parts = re.split(r"\s*,\s*", phrase)
        if len(parts) >= 2 and all(3 <= len(p) <= 60 for p in parts):
            out.extend(parts)
        else:
            out.append(phrase)
    return out


def map_phrases(phrases: list[str], aliases: dict[str, str]) -> tuple[list[str], list[str]]:
    areas: list[str] = []
    unmapped: list[str] = []
    seen: set[str] = set()
    for phrase in expand_phrases(phrases):
        mapped = map_phrase(phrase, aliases)
        if not mapped:
            low = normalize(phrase)
            if low in {
                "industrial and organizational psychology",
                "industrial-organizational psychology",
                "i/o psychology",
                "organizational behavior",
                "social psychology",
                "overview",
                "edit your profile",
            } or "doctoral program" in low or "phd students" in low:
                continue
            unmapped.append(phrase)
            continue
        for a in mapped:
            if a == "General":
                continue
            if a not in seen:
                seen.add(a)
                areas.append(a)
    return areas, unmapped


def sync_venues(tax: dict) -> None:
    venues_path = DATA / "venues.json"
    doc = json.loads(venues_path.read_text(encoding="utf-8"))
    doc["areas"] = list(tax["areas"])
    doc["domains"] = list(tax["domains"])

    # Keep specialty journals narrow; expand broad journals to full area set minus General-only noise
    specialty = {
        "lq": ["Leadership"],
        "orm": ["Methods"],
        "johp": ["OHP"],
    }
    broad = [a for a in tax["areas"] if a != "General"] + ["General"]
    for v in doc["venues"]:
        if v["id"] in specialty:
            v["areas"] = specialty[v["id"]]
        else:
            # preserve prior focus when possible by intersecting old with new, else full broad
            old = [a for a in (v.get("areas") or []) if a in tax["areas"]]
            v["areas"] = old if len(old) >= 2 else list(broad)
            if "General" not in v["areas"]:
                v["areas"].append("General")
    venues_path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def sync_area_keywords(tax: dict) -> None:
    path = DATA / "area_keywords.json"
    payload = {
        "note": "Generated from data/taxonomy.json paper_keywords. Prefer editing taxonomy.json.",
        "areas": tax["areas"],
        "keywords": tax.get("paper_keywords") or {},
    }
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--min-count", type=int, default=1)
    args = parser.parse_args()

    if not INTERESTS.exists():
        raise SystemExit(f"Missing {INTERESTS}; run pipeline/fetch_interests.py first")

    tax = load_taxonomy()
    aliases = {normalize(k): v for k, v in (tax.get("aliases") or {}).items()}
    rows = json.loads(INTERESTS.read_text(encoding="utf-8"))

    faculty_out: list[dict] = []
    unmapped_counter: Counter[str] = Counter()
    area_counter: Counter[str] = Counter()
    phrase_counter: Counter[str] = Counter()

    for row in rows:
        phrases = row.get("phrases") or []
        for p in phrases:
            phrase_counter[normalize(p)] += 1
        areas, unmapped = map_phrases(phrases, aliases)
        for u in unmapped:
            unmapped_counter[u] += 1
        for a in areas:
            area_counter[a] += 1
        faculty_out.append(
            {
                "faculty_id": row["faculty_id"],
                "name": row.get("name"),
                "phrases": phrases,
                "areas": areas,
                "unmapped": unmapped,
                "source": {
                    "scholar": bool(row.get("scholar_phrases")),
                    "homepage": bool(row.get("homepage_phrases")),
                },
            }
        )

    faculty_out.sort(key=lambda r: r["faculty_id"])
    FACULTY_AREAS.write_text(
        json.dumps(
            {
                "generated_from": str(INTERESTS.as_posix()),
                "taxonomy_version": tax.get("version"),
                "faculty": faculty_out,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    UNMAPPED.write_text(
        json.dumps(
            {
                "unmapped": unmapped_counter.most_common(),
                "top_phrases": phrase_counter.most_common(80),
                "area_faculty_counts": area_counter.most_common(),
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    sync_venues(tax)
    sync_area_keywords(tax)

    n_with = sum(1 for r in faculty_out if r["areas"])
    print(
        f"Wrote {FACULTY_AREAS} ({n_with}/{len(faculty_out)} with areas); "
        f"unmapped unique={len(unmapped_counter)}; synced venues + area_keywords"
    )
    print("area counts:", dict(area_counter.most_common()))
    print("top unmapped:", unmapped_counter.most_common(15))


if __name__ == "__main__":
    main()
