# IO Psychology Rankings

Metrics-based ranking of **U.S. and Canadian industrial-organizational (I-O) psychology** programs by faculty research output in selective journals.

Inspired by [CSRankings](https://csrankings.org/), but independent of it. Build each program’s faculty roster from the official I-O page first. Then attach Google Scholar IDs and import papers from Scholar profiles.

## Features

- Default ranking by **author-adjusted publication counts** (`1/N`) in a curated journal whitelist
- Switchable metrics: raw count, citations, impact-factor sum, and per-faculty averages
- Continuous publication year range (default ≈ last 10 years)
- Journals picker: core venues by default; optional cross-boundary titles (AMJ, JoM, …)
- School search in the toolbar
- Area filter (Selection, Leadership, OHP, Methods, …)
- Expand an institution to inspect faculty and counted papers
- Shareable URL hash for the current view

## Quick start

```bash
python -m pip install -r requirements.txt
python pipeline/run_all.py
```

Optional: copy [`.env.example`](.env.example) to `.env` and set `SERPAPI_API_KEY` if you use SerpAPI-based Scholar / interest fetch scripts.

Serve the site locally (required so `fetch('data/rankings.json')` works):

```bash
python -m http.server 8000 --bind 127.0.0.1 --directory web
```

Open http://127.0.0.1:8000/ — docs are in the footer (**Methodology / FAQ / …**) or `doc.html?p=faq`.

## Repository layout

| Path | Purpose |
| --- | --- |
| `data/faculty.csv` | Curated faculty + homepage ORCID / Google Scholar IDs |
| `data/institutions.csv` | U.S./Canada I-O PhD programs (57); `roster_status` marks complete vs seed |
| `data/venues.json` | Journal whitelist, weights, Clarivate IF, areas |
| `pipeline/` | Scholar import + scoring (`pipeline/cache/` is gitignored) |
| `web/` | Static ranking UI + doc viewer |
| `web/docs/` | Methodology, FAQ, contributing (site docs) |
| `web/data/rankings.json` | Generated scores served by the site (commit after rebuilds) |

## GitHub Pages

A workflow is included at [`.github/workflows/pages.yml`](.github/workflows/pages.yml). It publishes the `web/` folder on pushes to `main`/`master`. See [web/docs/github-pages.md](web/docs/github-pages.md) for setup details.

After editing faculty or venues, regenerate before pushing:

```bash
python pipeline/run_all.py
python pipeline/validate_pilot.py
```

## Disclaimer

This is a pilot research tool, not an official SIOP/APA ranking. Faculty coverage is incomplete; always verify important cases against program websites. See [methodology](web/docs/methodology.md).
