"""Pull ORCID and Google Scholar IDs from faculty homepages.

Do not search bibliographic databases by name. Identity comes from the
person's own page, the same way CSRankings uses a DBLP link the faculty posts.
"""

from __future__ import annotations

import re
import time

import httpx
import pandas as pd

from config import DATA, USER_AGENT, normalize_orcid

ORCID_RE = re.compile(r"orcid\.org/(0000-000\d{1}-\d{4}-\d{3}[\dX])", re.I)
SCHOLAR_RE = re.compile(
    r"scholar\.google\.[^/\s\"']+/citations\?[^\s\"']*user=([A-Za-z0-9_-]{10,})",
    re.I,
)


def extract_ids(html: str) -> tuple[str, str]:
    orcid = ""
    m = ORCID_RE.search(html or "")
    if m:
        orcid = normalize_orcid(m.group(1))
    scholar = ""
    m = SCHOLAR_RE.search(html or "")
    if m:
        scholar = m.group(1)
    return orcid, scholar


def ensure_id_columns(df: pd.DataFrame) -> pd.DataFrame:
    for col in ("orcid", "google_scholar_id"):
        if col not in df.columns:
            df[col] = ""
        df[col] = df[col].fillna("").astype(str).replace({"nan": "", "None": ""})
    return df


def main() -> None:
    faculty = ensure_id_columns(pd.read_csv(DATA / "faculty.csv"))
    updated = 0
    with httpx.Client(
        headers={"User-Agent": USER_AGENT, "Accept": "text/html"},
        timeout=30.0,
        follow_redirects=True,
    ) as client:
        for idx, row in faculty.iterrows():
            homepage = str(row.get("homepage") or "").strip()
            if not homepage.startswith("http"):
                continue
            have_orcid = bool(normalize_orcid(row.get("orcid")))
            have_scholar = bool(str(row.get("google_scholar_id") or "").strip())
            if have_orcid and have_scholar:
                continue
            try:
                resp = client.get(homepage)
                if resp.status_code >= 400:
                    print(f"  skip {row['name']}: HTTP {resp.status_code}")
                    continue
                orcid, scholar = extract_ids(resp.text)
            except Exception as exc:
                print(f"  skip {row['name']}: {exc}")
                continue
            changed = False
            if orcid and not have_orcid:
                faculty.at[idx, "orcid"] = orcid
                changed = True
            if scholar and not have_scholar:
                faculty.at[idx, "google_scholar_id"] = scholar
                changed = True
            if changed:
                updated += 1
                print(f"  {row['name']}: orcid={orcid or '-'} scholar={scholar or '-'}")
            time.sleep(0.2)

    faculty.to_csv(DATA / "faculty.csv", index=False)
    print(f"Wrote data/faculty.csv ({updated} profiles updated from homepages)")


if __name__ == "__main__":
    main()
