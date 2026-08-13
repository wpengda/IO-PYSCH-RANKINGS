# FAQ

## What is this site?

A metrics-based ranking of U.S. and Canadian industrial-organizational (I-O) psychology PhD programs. Faculty lists come from program websites; papers come from Google Scholar profiles, then a journal whitelist.

## Is this an official SIOP or APA ranking?

No. It is an independent open project. It does not represent SIOP, APA, or any university.

## Why journals instead of conferences?

I-O psychology primarily evaluates research through peer-reviewed journals, so the whitelist is journals only.

## What does “adjusted count” mean?

Each paper contributes `1 / N`, where `N` is the number of authors. That is the default ranking metric.

## Why can I also sort by citations or impact factor?

Those views are for exploration. Citation and IF numbers change quickly and can be gamed. Prefer adjusted counts for stable comparisons.

**Impact factor (sum)** adds the journal’s curated Clarivate JIF once per paper (no 1/N).

## Why are some well-known faculty missing?

v1 is a **pilot**. Rosters are incomplete until each program is fully curated. See [contributing.md](contributing.md).

## Why might a paper be missing?

- The journal is not in [`data/venues.json`](../../data/venues.json), or the Scholar venue string did not match (handbooks, similarly named outlets, truncated titles).
- The faculty member has no Google Scholar ID, or the paper is missing from their Scholar profile.
- The paper is outside the Years slider.
- The journal is unchecked in **Journals** (cross-boundary titles are off by default).

## Are Academy of Management Journal and Journal of Management included?

They are **cross-boundary** and off by default (**Journals → core only**). Check those titles, or choose **all**.

## How are the area pills next to a name chosen?

From **all** of that person’s whitelist-journal papers, **all years**. Years / Journals / Areas filters do not change the pills. See [methodology.md](methodology.md).

## How often is data refreshed?

When someone re-runs `python pipeline/run_all.py` and commits `web/data/rankings.json`.

## Can I reproduce the numbers?

Yes. Faculty IDs, venues, and pipeline code are in this repository. See the README.
