# Faculty first, then publications

Order is fixed:

1. **Roster** — who is core I-O faculty at this program (from the program website).
2. **IDs** — Google Scholar profile (and ORCID if listed) from that person’s homepage.
3. **Papers** — Google Scholar profiles (all papers stored; ranking uses the journal whitelist).

Do not invent the roster from a bibliographic database. Once names are right, Scholar profile fetches are constrained and much safer.

## Step 1 — Who is on the program

Count a person if **all** of the following are true:

1. They appear on the I-O / Organizational Science **program page** or the area’s faculty list (not the whole psychology department).
2. Rank is tenure-track or tenured research faculty: Assistant / Associate / Full Professor.
3. Primary appointment is at this institution.
4. They are currently active (not emeritus-only, unless the program still lists them as core).

Do **not** count: emeritus-only, adjunct/clinical/teaching-only, visitors, postdocs, students, other-university affiliates, MPS-only instructors, or business-school OB/HR faculty (Carlson, Broad, Mays, etc.) even if the I-O page lists them as affiliates.

Only people whose home unit is the I-O / Organizational Science program itself.

A school is `complete_v1` when every core name from `faculty_page_url` is a row in `faculty.csv`.

## Step 2 — Attach Scholar / ORCID

From the personal homepage or CV, copy:

- Google Scholar `user=` ID (required for scoring; almost every I-O professor has this)
- ORCID if present (optional)

`python pipeline/extract_profile_ids.py` can scrape those links from `homepage`, but many university sites block bots — manual copy is the source of truth.

## Step 3 — Papers (only after the roster exists)

| Source | Role |
| --- | --- |
| **Google Scholar profile** | Publications + citations for that Scholar ID |

Never search bibliographic databases by bare name across all authors. Fetch **this person’s** Scholar profile only.

## Workflow per school

1. Open `program_url` / `faculty_page_url`.
2. Copy core faculty into `data/faculty.csv`.
3. Add homepage + Scholar ID (+ ORCID if available).
4. Run Scholar fetch.
5. Score whitelist journals by default (`venues.json`); `1/N` credit. Re-score after changing the list — no need to re-fetch Scholar.

```bash
python pipeline/extract_profile_ids.py
python pipeline/fetch_scholar.py
python pipeline/score.py
```

Or end-to-end:

```bash
python pipeline/run_all.py
```
