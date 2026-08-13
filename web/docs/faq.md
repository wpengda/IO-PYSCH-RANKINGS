# FAQ

## What is this site?

A transparent, metrics-based ranking of U.S. and Canadian industrial-organizational (I-O) psychology programs. Faculty lists come from program websites; papers come from Google Scholar profiles, restricted to a journal whitelist.

## Is this an official SIOP or APA ranking?

No. It is an independent open project. It does not represent SIOP, APA, or any university.

## Why journals instead of conferences?

Unlike computer science, I-O psychology primarily evaluates research through peer-reviewed journals. The venue whitelist therefore focuses on journals.

## What does “adjusted count” mean?

Each paper contributes `1 / N`, where `N` is the number of authors. This is the default ranking metric.

## Why can I also sort by citations or weighted impact?

They are useful for exploration, but citation-based numbers change quickly and can be gamed. Prefer adjusted counts for stable comparisons.

## Why are some well-known faculty missing?

v1 is a **pilot**. Faculty lists are incomplete by design until programs are fully curated. Open a contribution PR to add people (see [contributing.md](contributing.md)).

## Why might a paper be missing?

Common reasons:

- The journal is not on the whitelist in `data/venues.json`
- The faculty member has no Google Scholar ID on file (or the paper is missing from their Scholar profile)
- The paper falls outside the selected year range
- The journal is unchecked in the **Journals** dialog (cross-boundary titles are off by default)

## Are Academy of Management Journal and Journal of Management included?

They are tagged as **cross-boundary** and off by default (Journals → **core only**). Open **Journals** and check those titles, or choose **all**, to count them.

## How often is data refreshed?

Whenever someone re-runs `python pipeline/run_all.py` and publishes the updated `web/data/rankings.json`. Automated monthly refresh can be added later via GitHub Actions.

## Can I reproduce the numbers?

Yes. All faculty IDs, venues, and pipeline code are in this repository. See the README for the exact commands.
