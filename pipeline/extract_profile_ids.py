"""Pull ORCID from faculty homepages.

Google Scholar IDs live in data/google_scholar.csv (source of truth).
This script does not overwrite Scholar IDs from homepage links.
"""

from __future__ import annotations

import re
import time

import httpx
import pandas as pd

from config import DATA, USER_AGENT, load_faculty, normalize_orcid

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
    faculty = ensure_id_columns(load_faculty())
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
            if have_orcid:
                continue
            try:
                resp = client.get(homepage)
                if resp.status_code >= 400:
                    print(f"  skip {row['name']}: HTTP {resp.status_code}")
                    continue
                orcid, _scholar = extract_ids(resp.text)
            except Exception as exc:
                print(f"  skip {row['name']}: {exc}")
                continue
            if orcid and not have_orcid:
                faculty.at[idx, "orcid"] = orcid
                updated += 1
                print(f"  {row['name']}: orcid={orcid}")
            time.sleep(0.2)

    faculty.to_csv(DATA / "faculty.csv", index=False)
    print(f"Wrote data/faculty.csv ({updated} ORCID values updated from homepages)")


if __name__ == "__main__":
    main()
