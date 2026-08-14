# Methodology

IO Psychology Rankings ranks U.S. and Canadian industrial-organizational (I-O) psychology PhD programs by faculty research output in a curated journal whitelist.

It is inspired by [CSRankings](https://csrankings.org/) (selective venues + author-adjusted counts), but is independent of it.

## Pipeline (what actually runs)

1. **Roster first.** Faculty names come from each program’s official I-O page. See [faculty-roster.md](faculty-roster.md).
2. **Attach Google Scholar IDs** from homepages/CVs (`data/faculty.csv`). We do not search bibliographic databases by name.
3. **Fetch papers** from each person’s Google Scholar profile (`pipeline/fetch_scholar.py`). The cache stores the full profile.
4. **Score** with `pipeline/score.py`: keep papers whose venue string matches [`data/venues.json`](../../data/venues.json), then apply 1/N credit.

Default rebuild: `python pipeline/run_all.py` (extract IDs → Scholar fetch → score). Changing the journal list does **not** require a re-fetch; re-run `score.py` only.

## Who is counted

- Tenure-track / full-time research faculty (assistant, associate, full professor).
- Primary appointment in a U.S. or Canadian I-O (or closely related) graduate program.
- Excluded: emeritus-only, adjunct/clinical/teaching-only, visitors, postdocs, students, and business-school affiliates listed only as affiliates.

A person appears in the ranking after they are on the roster. **Scores are 0** until a Google Scholar ID is attached and papers are fetched. Incomplete rosters bias a school downward.

## What publications count (ranking scores)

A paper counts toward the **ranking table** if it matches **all** of the following in the UI:

1. The Scholar venue string matches a journal in `venues.json` (longest prefix match, then a volume/year-style continuation so handbooks and similarly named outlets are not counted).
2. The journal is checked in **Journals**. Default is **core only** (23 I-O / methods titles, including *Industrial and Organizational Psychology*). Cross-boundary titles are off until you check them or choose **all**.
3. The publication year is inside the Years slider (default ≈ last 10 calendar years). Papers with no year count only when the slider covers the full available span.

Scholar profiles include whatever Google Scholar lists (articles, and sometimes commentaries or other items). There is **no separate editorial/errata filter** beyond journal matching.

### Core vs cross-boundary

**Core (on by default):** JAP, Personnel Psychology, OBHDP, JOB, Leadership Quarterly, ORM, JVB, JOHP, HRM, HRMJ, HRMR, Work Aging and Retirement, JBP, EJWOP, JOOP, *Industrial and Organizational Psychology*, Work & Stress, IJSA, Applied Psychology, Organizational Psychology Review, Group & Organization Management, Psychological Methods, AMPPS.

**Cross-boundary (off by default):** AMJ, AMR, ASQ, Journal of Management, JMS, Management Science, Organization Science, Organization Studies, SMJ, Human Relations, AOM Annals, AOM Discoveries, JPSP, Psychological Science, Psychological Bulletin, Computers in Human Behavior.

## Credit: adjusted counts (1/N)

Each counted paper contributes **1 / N**, where **N** is the number of authors on the Scholar record. Author order and co-author affiliation do not matter.

## Switchable metrics

All metrics use the **same** filtered paper set (Years + Journals + Areas):

| UI label | Definition |
| --- | --- |
| Adjusted count (1/N) | Sum of 1/N (default sort) |
| Raw paper count | Number of counted papers |
| Citations | Sum of Google Scholar citation counts for those papers |
| Impact factor (sum) | Sum of curated Clarivate JIF (`impact_factor` in `venues.json`) per paper — **not** 1/N |
| … / faculty | The metric above divided by faculty with a fetched Scholar profile |

Institution scores are the **sum** across rostered faculty. Per-faculty options divide by faculty with a **fetched Google Scholar profile** (including those with zero counted papers in the current filters). Faculty with no Scholar ID, or a 404/empty profile, are listed on the roster but are not in that denominator.

Default ranking is adjusted count because citation and IF sums move quickly and are easier to game.

## Faculty labels (pills)

These are **independent of Years / Journals / Areas**. Changing those controls must not change the pills.

For each faculty member, pills come from **all of their papers in the full whitelist** (every journal in `venues.json`, all years):

- Paper areas skip `General`.
- Order: paper count per area (high → low); ties by 1/N, then name.
- If Scholar/homepage interests were mapped in `data/faculty_areas.json` and that area has no whitelist papers, the area can still appear, **last**.

Optional interest mapping (`pipeline/fetch_interests.py`) is **not** part of `run_all.py`. It is only a fallback when whitelist papers do not yield a non-General area.

## Paper labels (used by the Areas filter)

- Broad journals: areas from **title keywords** in `taxonomy.json`.
- Specialty journals with a single venue area (e.g. LQ, JOHP, ORM): keep that area, and add extra title-keyword hits.
- No title hit: `General` if the venue allows it.

The sidebar **Areas** filter keeps a paper if **any** of its assigned areas is selected. It does not filter by the faculty pills.

## Transparency and limitations

- v1 is a **pilot**. Incomplete faculty lists bias scores downward.
- Papers come only from Google Scholar profiles. Coverage follows Scholar (missing IDs, missing papers, messy venue strings).
- Relative `weight` in `venues.json` is unused for the live IF metric. **Impact factor (sum)** uses curated Clarivate JIF values in that file (not a live JCR pull).
- This site does **not** measure teaching quality, student outcomes, or overall prestige.

The footer shows the month/year of the latest score rebuild (`generated_at` in `web/data/rankings.json`).
