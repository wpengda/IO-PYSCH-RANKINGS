# Deploy to GitHub Pages

## Recommended: publish the `web/` folder

1. Push the repository to GitHub.
2. A workflow is included at [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml). It publishes `web/` on pushes to `main`/`master`.
3. In **Settings → Pages**, set the source to **GitHub Actions**.

If you prefer a branch deploy instead, push only the contents of `web/` to a `gh-pages` branch and set Pages to that branch root.

### Workflow (reference)

```yaml
name: Deploy Pages
on:
  push:
    branches: [main, master]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: web
      - id: deployment
        uses: actions/deploy-pages@v4
```

After each faculty/venue update, regenerate scores before pushing:

```bash
python pipeline/run_all.py
```

Commit `web/data/rankings.json` so the live site stays current.

Site documentation pages are served via `doc.html` (for example `doc.html?p=faq`); Markdown sources live in `web/docs/`.
