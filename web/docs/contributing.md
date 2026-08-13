# Contributing

Thanks for helping improve IO Psychology Rankings. The most valuable contributions are **complete program faculty rosters** (from the I-O page), then Google Scholar IDs.

## Add or update faculty

1. Confirm the person is tenure-track / full-time research faculty at a U.S. or Canadian I-O (or closely related) program.
2. Open their homepage/CV and copy the Google Scholar `user=` ID (required for scoring). ORCID is optional if listed.
3. Edit [`data/faculty.csv`](../../data/faculty.csv):

```csv
faculty_id,name,institution_id,homepage,orcid,google_scholar_id,rank,active,notes
doe_jane,Jane Doe,umn,https://example.edu/jane-doe,0000-0002-1825-0097,abcdEFGhij,Assistant Professor,true,
```

4. If the institution is new, also add a row to [`data/institutions.csv`](../../data/institutions.csv).
5. Open a pull request with the faculty homepage and Scholar profile (ORCID welcome if available).

### Remove faculty

Set `active` to `false` and explain why in `notes` (retired, moved to industry, non-TT, deceased, wrong person). Prefer soft removal over deleting history.

## Propose journal whitelist changes

Edit [`data/venues.json`](../../data/venues.json). For each venue provide:

- Full journal name
- ISSN(s)
- Suggested relative weight / impact factor
- Area tags
- Whether it is `cross_boundary`

Keep the list **selective**. Prefer community discussion in the PR for controversial additions.

## Rebuild scores after data edits

```bash
python -m pip install -r requirements.txt
python pipeline/run_all.py
```

Commit updated `web/data/rankings.json` (and optionally `web/data/publications.json`) with the data change so GitHub Pages stays in sync.

## Code / UI contributions

- Pipeline code lives in `pipeline/`
- Static site lives in `web/`
- Site docs live in `web/docs/` (shown via `doc.html`) and should stay aligned with scoring behavior
