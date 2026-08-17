"""Shared paths and helpers for the IO Psychology Rankings pipeline."""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
WEB_DATA = ROOT / "web" / "data"
CACHE = ROOT / "pipeline" / "cache"
SCHOLAR_TABLE = DATA / "google_scholar.csv"

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
      additional title keyword hits (e.g. an LQ paper on AI → Leadership + AI / Technology).
    - Tight specialty group (e.g. JOHP: a few OHP areas, no General): keep title
      hits inside the group, plus extra hits; if none, keep the first area.
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

    tight = "General" not in candidates and 1 < len(candidates) <= 4
    if tight:
        chosen = [a for a in hits if a in candidates]
        extra = [a for a in hits if a not in candidates]
        if not chosen:
            chosen = [candidates[0]]
        for a in extra:
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
        if nxt not in " ,.;:([{/|-–—…⋯":
            return False
        rest = text[len(name) :].lstrip(" ,.;:([{/|-–—…⋯")
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


def has_google_scholar_id(value) -> bool:
    text = str(value or "").strip()
    return bool(text) and text.lower() not in {"nan", "none"}


def normalize_orcid(value: str) -> str:
    text = str(value or "").strip()
    if not text or text.lower() in {"nan", "none"}:
        return ""
    text = text.replace("https://orcid.org/", "").replace("http://orcid.org/", "").strip("/")
    return text


def ensure_dirs() -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    WEB_DATA.mkdir(parents=True, exist_ok=True)


def _clean_scholar_id(value) -> str:
    text = str(value or "").strip()
    if not text or text.lower() in {"nan", "none"}:
        return ""
    return text


def apply_scholar_table(faculty: pd.DataFrame) -> pd.DataFrame:
    """Overlay Scholar IDs from data/google_scholar.csv when that table exists."""
    out = faculty.copy()
    out["google_scholar_id"] = out["google_scholar_id"].map(_clean_scholar_id)
    if not SCHOLAR_TABLE.exists():
        return out
    table = pd.read_csv(SCHOLAR_TABLE)
    if "faculty_id" not in table.columns or "google_scholar_id" not in table.columns:
        return out
    overlay = (
        table.drop_duplicates("faculty_id")
        .assign(google_scholar_id=lambda d: d["google_scholar_id"].map(_clean_scholar_id))
        .set_index("faculty_id")["google_scholar_id"]
    )
    mapped = out["faculty_id"].map(overlay)
    out["google_scholar_id"] = mapped.where(mapped.notna(), out["google_scholar_id"])
    return out


def load_faculty() -> pd.DataFrame:
    return apply_scholar_table(pd.read_csv(DATA / "faculty.csv"))


def year_or_none(value) -> int | None:
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none", "present"}:
        return None
    try:
        return int(float(text))
    except (TypeError, ValueError):
        return None


def load_appointments() -> pd.DataFrame:
    path = DATA / "faculty_appointments.csv"
    if not path.exists():
        return pd.DataFrame(
            columns=[
                "faculty_id",
                "name",
                "institution_id",
                "start_year",
                "end_year",
                "google_scholar_id",
                "notes",
            ]
        )
    return pd.read_csv(path)


def appointments_payload(appts: pd.DataFrame | None = None) -> list[dict]:
    df = load_appointments() if appts is None else appts
    rows: list[dict] = []
    if df.empty:
        return rows
    for _, r in df.iterrows():
        sid = _clean_scholar_id(r.get("google_scholar_id"))
        rows.append(
            {
                "faculty_id": str(r.get("faculty_id") or "").strip(),
                "name": str(r.get("name") or "").strip(),
                "institution_id": str(r.get("institution_id") or "").strip(),
                "start_year": year_or_none(r.get("start_year")),
                "end_year": year_or_none(r.get("end_year")),
                "google_scholar_id": sid,
            }
        )
    return [row for row in rows if row["faculty_id"] and row["institution_id"]]


def appointment_coverage_ids(appts: pd.DataFrame | None = None) -> list[str]:
    rows = appointments_payload(appts)
    return sorted({r["institution_id"] for r in rows})


def faculty_universe(*, active_only: bool = False) -> pd.DataFrame:
    """faculty.csv rows plus appointment-only people (not already on the csv)."""
    faculty = load_faculty()
    appts = load_appointments()
    if active_only:
        active_mask = faculty["active"].astype(str).str.lower().isin(["true", "1", "yes"])
        keep_ids = set(faculty.loc[active_mask, "faculty_id"].astype(str))
        if not appts.empty:
            keep_ids.update(
                str(x).strip() for x in appts["faculty_id"].dropna() if str(x).strip()
            )
        from_csv = faculty[faculty["faculty_id"].astype(str).isin(keep_ids)].copy()
    else:
        from_csv = faculty.copy()
    have = set(from_csv["faculty_id"].astype(str))
    extras: list[dict] = []
    if not appts.empty:
        for _, appt in appts.iterrows():
            fid = str(appt.get("faculty_id") or "").strip()
            if not fid or fid in have:
                continue
            extras.append(
                {
                    "faculty_id": fid,
                    "name": str(appt.get("name") or fid).strip(),
                    "institution_id": str(appt.get("institution_id") or "").strip(),
                    "homepage": "",
                    "rank": "",
                    "active": False,
                    "notes": str(appt.get("notes") or ""),
                    "orcid": "",
                    "google_scholar_id": _clean_scholar_id(appt.get("google_scholar_id")),
                }
            )
            have.add(fid)
    if extras:
        from_csv = pd.concat([from_csv, pd.DataFrame(extras)], ignore_index=True)
    return from_csv.reset_index(drop=True)


def faculty_for_publication_fetch() -> pd.DataFrame:
    """Active roster plus anyone listed in faculty_appointments.csv."""
    return faculty_universe(active_only=True)


def faculty_for_network() -> pd.DataFrame:
    """Everyone with a Google Scholar ID, including former / appointment-only people."""
    df = faculty_universe(active_only=False)
    return df[df["google_scholar_id"].map(has_google_scholar_id)].reset_index(drop=True)


def write_scholar_table(faculty: pd.DataFrame) -> None:
    cols = ["faculty_id", "name", "institution_id", "google_scholar_id"]
    df = faculty[cols].copy()
    df["google_scholar_id"] = df["google_scholar_id"].map(_clean_scholar_id)
    df.to_csv(SCHOLAR_TABLE, index=False)
