# Faculty first, then publications

Order is fixed:

1. **Roster** — core I-O faculty at this program (from the program website).
2. **IDs** — Google Scholar profile (and ORCID if listed) from that person’s homepage.
3. **Papers** — Google Scholar profile fetch; ranking later keeps whitelist journals only.

Do not build the roster by searching a bibliographic database.

## Step 1 — Who is on the program

Count a person if **all** of the following are true:

1. They appear on the I-O / Organizational Science **program page** or the area’s faculty list (not the whole psychology department).
2. Rank is tenure-track or tenured research faculty: Assistant / Associate / Full Professor.
3. Primary appointment is at this institution.
4. They are currently active (not emeritus-only, unless the program still lists them as core).

Do **not** count: emeritus-only, adjunct/clinical/teaching-only, visitors, postdocs, students, other-university affiliates, MPS-only instructors, or business-school OB/HR faculty even if the I-O page lists them as affiliates.

A school is `complete_v1` when every core name from `faculty_page_url` is a row in `faculty.csv`.

## Step 2 — Attach Scholar / ORCID

From the personal homepage or CV, copy:

- Google Scholar `user=` ID (required for scoring)
- ORCID if present (optional; not used by the default `run_all.py` path)

`python pipeline/extract_profile_ids.py` can scrape links from `homepage`, but many university sites block bots — manual copy is the source of truth.

## Step 3 — Papers (only after the roster exists)

Fetch **this person’s** Scholar profile. Never search Scholar (or another database) by bare name across all authors.

```bash
python pipeline/extract_profile_ids.py
python pipeline/fetch_scholar.py
python pipeline/score.py
```

Or end-to-end:

```bash
python pipeline/run_all.py
```

Changing `venues.json` only requires `python pipeline/score.py` — no re-fetch.
