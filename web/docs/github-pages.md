# Deploy to GitHub Pages

The live site is the contents of `web/` (the ranking UI), **not** the repository README.

## Setup

1. Keep only [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml). Do **not** add GitHub’s starter **“Deploy Jekyll with GitHub Pages dependencies preinstalled”** workflow — that publishes a README page at the site root and hides the ranking UI.
2. In **Settings → Pages**, set Source to **GitHub Actions** (not “Deploy from a branch”).
3. Push to `main`. After a green **Deploy Pages** run, the site is `https://<user>.github.io/IO-PYSCH-RANKINGS/`.

If the root URL still looks like a README, hard-refresh (`Ctrl+F5`) or open a private window — an older Jekyll deploy may be cached.

## After data edits

```bash
python pipeline/run_all.py
```

Commit `web/data/rankings.json` before pushing so the live table stays current.

Site docs are `web/docs/`, shown at `doc.html?p=faq` (and methodology, faculty-roster, contributing).
