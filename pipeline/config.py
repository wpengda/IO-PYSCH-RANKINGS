"""Shared paths and helpers for the IO Psychology Rankings pipeline."""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
WEB_DATA = ROOT / "web" / "data"
CACHE = ROOT / "pipeline" / "cache"

MAILTO = "io-psyc-rankings@example.com"
USER_AGENT = f"IO-Psyc-Index/0.1 (mailto:{MAILTO})"
CROSSREF_BASE = "https://api.crossref.org"
ALLOWED_TYPES = {"journal-article"}


def load_venues() -> dict:
    return json.loads((DATA / "venues.json").read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_taxonomy() -> dict:
    path = DATA / "taxonomy.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_area_keywords() -> dict:
    tax = load_taxonomy()
    if tax.get("paper_keywords"):
        return {"keywords": tax["paper_keywords"], "areas": tax.get("areas") or []}
    path = DATA / "area_keywords.json"
    if not path.exists():
        return {"keywords": {}}
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_faculty_areas() -> dict[str, list[str]]:
    """faculty_id -> curated/homepage/Scholar-mapped areas."""
    path = DATA / "faculty_areas.json"
    if not path.exists():
        return {}
    doc = json.loads(path.read_text(encoding="utf-8"))
    out: dict[str, list[str]] = {}
    for row in doc.get("faculty") or []:
        fid = row.get("faculty_id")
        areas = [a for a in (row.get("areas") or []) if a and a != "General"]
        if fid and areas:
            out[str(fid)] = areas
    return out


def _normalize_title(title: str) -> str:
    text = (title or "").lower()
    text = text.replace("–", "-").replace("—", "-").replace("’", "'")
    return re.sub(r"\s+", " ", text).strip()


def title_area_hits(title: str, keywords: dict[str, list[str]] | None = None) -> list[str]:
    """Return areas whose keywords appear in the title (longest phrases preferred)."""
    text = _normalize_title(title)
    if not text:
        return []
    # Pad so edge tokens like "(ai)" / " ai " match cleanly
    padded = f" {text} "
    kw = keywords if keywords is not None else load_area_keywords().get("keywords") or {}
    hits: list[str] = []
    for area, phrases in kw.items():
        ordered = sorted({p.lower().strip() for p in phrases if p and p.strip()}, key=len, reverse=True)
        for phrase in ordered:
            # Avoid bare "ai" false positives inside longer words; require word-ish boundaries
            if phrase in {"ai", "it", "hr", "vr", "ar"}:
                if re.search(rf"(?<![a-z0-9]){re.escape(phrase)}(?![a-z0-9])", text):
                    hits.append(area)
                    break
                continue
            if " " in phrase or "-" in phrase or "(" in phrase or ")" in phrase:
                if phrase in text or phrase in padded:
                    hits.append(area)
                    break
            else:
                if re.search(rf"(?<![a-z0-9]){re.escape(phrase)}(?![a-z0-9])", text):
                    hits.append(area)
                    break
    return hits


def refine_paper_areas(
    title: str,
    venue_areas: list[str],
    *,
    keywords: dict[str, list[str]] | None = None,
) -> list[str]:
    """
    Paper-level areas for ranking filters.

    - Specialty venue (one candidate area): keep that area, and also keep any
      additional title keyword hits (e.g. an LQ paper on AI → Leadership + Technology).
    - Broad venue: use all title keyword hits.
    - No title hit: General when the venue allows it; else the specialty/candidate list.
    """
    candidates = list(venue_areas or [])
    if not candidates:
        return []

    hits = title_area_hits(title, keywords)
    order = {a: i for i, a in enumerate(candidates)}

    if len(candidates) == 1:
        chosen = list(candidates)
        for a in hits:
            if a not in chosen:
                chosen.append(a)
        return chosen

    if hits:
        return sorted(set(hits), key=lambda a: order.get(a, 1000 + len(a)))
    if "General" in candidates:
        return ["General"]
    return candidates


def venue_by_issn(venues_doc: dict) -> dict[str, dict]:
    """Map hyphenless ISSN -> venue record."""
    out: dict[str, dict] = {}
    for v in venues_doc["venues"]:
        for issn in v.get("issn") or []:
            out[normalize_issn(issn)] = v
    return out


def venue_name_lookup(venues_doc: dict) -> dict[str, dict]:
    """Map lowercase journal name (aliases) and ISSN -> venue record."""
    out: dict[str, dict] = {}
    for v in venues_doc["venues"]:
        names = [v["name"], *(v.get("aliases") or [])]
        for name in names:
            key = str(name).lower().strip()
            if key:
                out[key] = v
        for issn in v.get("issn") or []:
            out[normalize_issn(issn)] = v
    return out


def match_venue(title_or_venue: str, venues: dict[str, dict]) -> dict | None:
    """Match Scholar venue strings to whitelist entries.

    Uses longest prefix match, then requires a bibliographic-looking
    continuation (volume/year), so short titles like \"Psychological Science\"
    or \"Journal of Management\" do not swallow longer unrelated names
    (e.g. Perspectives on Psychological Science, Journal of Management Development).
    """
    text = (title_or_venue or "").lower().strip()
    if not text:
        return None
    names = sorted(
        (n for n in venues if n and any(ch.isalpha() for ch in n)),
        key=len,
        reverse=True,
    )

    def ok_continuation(name: str) -> bool:
        if text == name:
            return True
        if not text.startswith(name) or len(text) <= len(name):
            return False
        nxt = text[len(name)]
        if nxt not in " ,.;:([{/|-–—":
            return False
        rest = text[len(name) :].lstrip(" ,.;:([{/|-–—")
        if not rest:
            return True
        # Skip leading junk (Scholar truncation artifacts) then require vol/year.
        rest = re.sub(r"^[^a-z0-9(]+", "", rest)
        if not rest:
            return True
        # Typical Scholar: "Journal Name 12 (3), 45-67, 2020"
        if rest[0].isdigit() or rest.startswith("("):
            return True
        # Subtitle aliases (name already contains ":") may continue with
        # publisher fluff before the year, e.g. Wiley HRM long form.
        if ":" in name and re.search(r"\b(19|20)\d{2}\b", text):
            return True
        return False

    for name in names:
        if ok_continuation(name):
            return venues[name]
    return None


def apply_venue(pub: dict, venues: dict[str, dict]) -> dict:
    """Attach current whitelist fields; keep raw_venue for later rematch."""
    raw = pub.get("raw_venue") or pub.get("venue_name") or ""
    matched = match_venue(raw, venues)
    out = dict(pub)
    out["raw_venue"] = raw
    if matched:
        out["in_whitelist"] = True
        out["venue_id"] = matched["id"]
        out["venue_name"] = matched["name"]
        out["venue_weight"] = float(matched.get("impact_factor") or matched.get("weight") or 0.0)
        out["impact_factor"] = float(matched.get("impact_factor") or matched.get("weight") or 0.0)
        out["cross_boundary"] = bool(matched.get("cross_boundary"))
        venue_areas = matched.get("areas") or []
        out["venue_areas"] = list(venue_areas)
        out["areas"] = refine_paper_areas(out.get("title") or "", venue_areas)
    else:
        out["in_whitelist"] = False
        out["venue_id"] = ""
        out["venue_name"] = raw
        out["venue_weight"] = 0.0
        out["impact_factor"] = 0.0
        out["cross_boundary"] = False
        out["venue_areas"] = []
        out["areas"] = []
    return out


def normalize_issn(issn: str) -> str:
    return "".join(ch for ch in str(issn).upper() if ch.isalnum())


def normalize_orcid(value: str) -> str:
    text = str(value or "").strip()
    if not text or text.lower() in {"nan", "none"}:
        return ""
    text = text.replace("https://orcid.org/", "").replace("http://orcid.org/", "").strip("/")
    return text


def ensure_dirs() -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    WEB_DATA.mkdir(parents=True, exist_ok=True)
