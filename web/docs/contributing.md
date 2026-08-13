# Contributing

The most useful contributions are **complete program faculty rosters** (from the official I-O page), then Google Scholar IDs.

## Add or update faculty

1. Confirm the person is tenure-track / full-time research faculty at a U.S. or Canadian I-O (or closely related) program.
2. Copy the Google Scholar `user=` ID from their homepage or CV (required for scoring). ORCID is optional.
3. Edit [`data/faculty.csv`](../../data/faculty.csv):

```csv
faculty_id,name,institution_id,homepage,orcid,google_scholar_id,rank,active,notes
doe_jane,Jane Doe,umn,https://example.edu/jane-doe,0000-0002-1825-0097,abcdEFGhij,Assistant Professor,true,
```

4. If the institution is new, add a row to [`data/institutions.csv`](../../data/institutions.csv).
5. Open a pull request with the faculty homepage and Scholar profile.

### Remove faculty

Set `active` to `false` and explain why in `notes`. Prefer soft removal over deleting history.

## Propose journal whitelist changes

Edit [`data/venues.json`](../../data/venues.json). For each venue provide:

- Full journal name and aliases (how it appears on Scholar)
- ISSN(s)
- `impact_factor` (Clarivate JIF used by **Impact factor (sum)**)
- Area tags
- Whether it is `cross_boundary`

Keep the list **selective**. Discuss controversial additions in the PR.

After whitelist edits, re-score without re-fetching Scholar:

```bash
python pipeline/score.py
```

## Rebuild scores after faculty edits

```bash
python -m pip install -r requirements.txt
python pipeline/run_all.py
```

Commit updated `web/data/rankings.json` so GitHub Pages stays current.

## Code / UI contributions

- Pipeline: `pipeline/`
- Site: `web/`
- Docs shown on the site: `web/docs/` (keep them aligned with scoring behavior)
