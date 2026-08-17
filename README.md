# IO Psychology Rankings

Metrics-based ranking of **U.S. and Canadian industrial-organizational (I-O) psychology** programs by faculty research output in selective journals.

Inspired by [CSRankings](https://csrankings.org/), but independent of it. Build each program’s faculty roster from the official I-O page first. Then attach Google Scholar IDs and import papers from Scholar profiles.

## Features

- Default ranking by **author-adjusted publication counts** (`1/N`) in a curated journal whitelist
- Switchable metrics: raw count, 1st/2nd/last author, last author, citations, impact-factor sum, and per-faculty averages
- **Network** tab: coauthorship among faculty with a Google Scholar profile, including past and present program affiliations
- Continuous publication year range (default ≈ last 10 years)
- Journals picker: all whitelist titles on by default, grouped by discipline and sorted by impact factor, with IF / JCR / ABDC columns; uncheck to exclude, or use **Q1 only** / **A* only** / **A* & A only**
- School search in the toolbar
- **By faculty appointment** toggle: for programs with a faculty timeline, count only papers from years that person was on the roster
- **Faculty ranking** toggle: sort every person by their full counted paper list (cannot be on together with by faculty appointment)
- Area filter (Selection, Leadership, Stress / Well-being, Methods, …)
- Expand an institution to inspect faculty and counted papers
- Shareable URL hash for the current view
- Header links: How we rank, How we network, FAQ, and a [feedback form](https://docs.google.com/forms/d/e/1FAIpQLSco-_VbMsAgw0Qgz3H2d4-yFXM68cbcLk00zZdiM1RIEtegEQ/viewform)

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

Open http://127.0.0.1:8000/ — site docs are **How we rank** / **How we network** / **FAQ** in the header, or `doc.html?p=faq`.

## Repository layout

| Path | Purpose |
| --- | --- |
| `data/google_scholar.csv` | Google Scholar `user=` IDs used for scoring (source of truth) |
| `data/faculty.csv` | Curated faculty + homepage ORCID / Google Scholar IDs |
| `data/faculty_appointments.csv` | Faculty start/end years by program (used by the **by faculty appointment** ranking toggle) |
| `data/institutions.csv` | U.S./Canada I-O PhD programs (62); `roster_status` marks complete vs seed |
| `data/venues.json` | Journal whitelist, Clarivate IF, JCR quartile, ABDC rating, areas |
| `pipeline/` | Scholar import + scoring (`pipeline/cache/` is gitignored) |
| `web/` | Static ranking UI + doc viewer |
| `web/docs/` | How we rank (`ranking.md`), How we network (`network.md`), and FAQ |
| `web/data/rankings.json` | Generated scores served by the site (commit after rebuilds) |
| `web/data/coauthor_network.json` | Generated coauthor graph for the Network tab (commit after rebuilds) |

## GitHub Pages

A workflow is included at [`.github/workflows/pages.yml`](.github/workflows/pages.yml). It publishes the `web/` folder on pushes to `main`/`master`. See [web/docs/github-pages.md](web/docs/github-pages.md) for setup details.

After editing faculty or venues, regenerate before pushing:

```bash
python pipeline/run_all.py
python pipeline/build_coauthor_network.py
python pipeline/validate_pilot.py
```

Commit `web/data/rankings.json` and `web/data/coauthor_network.json` so the live Rankings and Network tabs stay current.

## Disclaimer

This is a pilot research tool, not an official SIOP/APA ranking. Faculty coverage is incomplete. The default ranking uses **current program faculty only**; **by faculty appointment** uses historical start/end years where they have been collected ([`data/faculty_appointments.csv`](data/faculty_appointments.csv)). Always verify important cases against program websites. See [How we rank](web/docs/ranking.md).
