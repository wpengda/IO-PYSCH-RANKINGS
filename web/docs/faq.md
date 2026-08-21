# FAQ

## What is this site?

A metrics-based ranking of U.S. and Canadian industrial-organizational (I-O) psychology PhD programs. Faculty lists come from program websites; papers come from Google Scholar profiles, then a journal whitelist.

## Is this an official SIOP or APA ranking?

No. It is an independent open project. It does not represent SIOP, APA, or any university.

## Why is UNC Charlotte’s whole Organizational Science faculty in the ranking?

This ranking is by **program**, not by a psychology department. UNC Charlotte’s listed program is [Organizational Science](https://orgscience.charlotte.edu/), an interdisciplinary PhD whose faculty sit in Management, Sociology, Communication Studies, Psychological Science, and related units. Those people are counted because they are faculty of that program — that mix is a program feature, not an extra department being added on.

## Why journals instead of conferences?

I-O psychology primarily evaluates research through peer-reviewed journals, so the core whitelist is journals. A separate **CS / HCI / ML conferences** group is also on by default: ACL, EMNLP, NAACL, EACL, COLM, ICLR, AAAI, ICML, NeurIPS, CVPR, ECCV, KDD, CHI, CSCW, IUI, and IMWUT. In computer science, papers at these venues are the archival **peer-reviewed publication of record** (full papers, competitive acceptance), not a society-meeting talk. Uncheck that group (or use **Q1 only**) to score journals only.

**SIOP, AOM Proceedings, and similar meeting papers are not counted.** In I-O and management those are conference presentations or short proceedings, not the archival publication of record — the version that “counts” is usually the later journal article. Counting both would double-count the same work. Book chapters are also excluded.

## What does “adjusted count” mean?

Each paper contributes `1 / N`, where `N` is the number of authors. That is the default ranking metric.

## Why can I also sort by citations or impact factor?

Those views are for exploration. Citation and IF numbers change quickly and can be gamed. Prefer adjusted counts for stable comparisons.

**Citations** is not “cites received during the selected years.” The Years slider keeps whitelist papers by **publication year**; the metric sums each paper’s Google Scholar **lifetime** citation total as of the last profile fetch. See [ranking.md](ranking.md).

**Impact factor (sum)** adds the journal’s Clarivate JIF (JCR 2026 / 2025 JIF) once per paper (no 1/N). The Journals list shows each title’s 2025 JIF, best JCR 2025 quartile, and 2025 ABDC rating (`A*`–`C`, or **—** if unlisted). Conference rows show ICORE 2026 and CCF 2022 instead. Journal titles on the list are Q1–Q2, except Journal of Behavioral Decision Making (Q3). CS/HCI/ML conferences are extra and have no JCR quartile.

**1st / 2nd / last author** counts whitelist papers where the person is first, second, or last on Google Scholar’s author list (once per paper). **Last-author papers** counts only last position among two or more authors. Sole-author papers count as first, not last. See [ranking.md](ranking.md).

## Why are some well-known faculty missing?

v1 is a **pilot**. Rosters are incomplete until each program is fully curated. The default table uses **current faculty only**. Turn on **by faculty appointment** to score schools that have a faculty timeline in [`data/faculty_appointments.csv`](../../data/faculty_appointments.csv) using only papers from those years (61 programs so far). Each appointment’s start year is not counted at that school; a remaining shared year goes to the earlier school. Turn on **faculty ranking** to sort every person by their full counted paper list (this turns off by faculty appointment). See [ranking.md](ranking.md).

## Why might a paper be missing?

- The journal is not in [`data/venues.json`](../../data/venues.json), or the Scholar venue string did not match (handbooks, similarly named outlets, truncated titles).
- The faculty member has no Google Scholar ID, or the paper is missing from their Scholar profile.
- The paper is outside the Years slider.
- The journal is unchecked in **Journals** (all whitelist titles are on by default; uncheck ones you want to exclude).

## Are Academy of Management Journal and Journal of Management included?

They are in the **OB / Management** group and **on by default**. Uncheck those titles, or use **Q1 only** / **A* only**, if you want a narrower set.

## What does the Network tab show?

Coauthorship among faculty with a Google Scholar profile — including people on more than one program over time — using the same journal whitelist as Rankings. A line is shared whitelist papers, not a ranking score. See [network.md](network.md).

## How often is data refreshed?

When someone re-runs `python pipeline/run_all.py` and commits `web/data/rankings.json`. The Network tab also needs `python pipeline/build_coauthor_network.py` and a commit of `web/data/coauthor_network.json`.

## Can I reproduce the numbers?

Yes. Faculty IDs, venues, and pipeline code are in this repository. See the README.
