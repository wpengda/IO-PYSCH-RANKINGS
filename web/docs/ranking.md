# How we rank

IO Psychology Rankings ranks U.S. and Canadian industrial-organizational (I-O) psychology PhD programs by faculty research output in a curated journal whitelist. The [Network](network.md) tab maps coauthorship among the same faculty, using the same papers.

It is inspired by [CSRankings](https://csrankings.org/) (selective venues + author-adjusted counts), but is independent of it.

## Pipeline (what actually runs)

1. **Roster first.** Faculty names come from each program’s official I-O page.
2. **Attach Google Scholar IDs** in [`data/google_scholar.csv`](../../data/google_scholar.csv) (mirrored on `data/faculty.csv`). That table is the source of truth for scoring. A homepage link is useful when it works; a dead homepage link does not override a verified ID.
3. **Fetch papers** from each person’s Google Scholar profile (`pipeline/fetch_scholar.py`). The cache stores the full profile.
4. **Score** with `pipeline/score.py`: keep papers whose venue string matches [`data/venues.json`](../../data/venues.json), then apply 1/N credit.

Default rebuild: `python pipeline/run_all.py` (extract IDs → Scholar fetch → score). Changing the journal list does **not** require a re-fetch; re-run `score.py` only.

## Who is counted

- Tenure-track / full-time research faculty (assistant, associate, full professor).
- Primary appointment in a U.S. or Canadian I-O (or closely related) graduate program.
- Excluded: emeritus-only, adjunct/clinical/teaching-only, visitors, postdocs, students, and business-school affiliates listed only as affiliates.

A person appears in the ranking after they are on the roster. **Scores are 0** until a Google Scholar ID is attached and papers are fetched. Incomplete rosters bias a school downward.

**Current faculty only.** v1 uses each program’s **present** roster (people listed on the official I-O page now). It does **not** yet include people who used to be in that program and have since left, retired, or moved. Papers they published while there therefore do not count toward that school. Former faculty will be added in a later version.

## What publications count (ranking scores)

A paper counts toward the **ranking table** if it matches **all** of the following in the UI:

1. The Scholar venue string matches a journal in `venues.json` (longest prefix match, then a volume/year-style continuation so handbooks and similarly named outlets are not counted).
2. The journal is checked in **Journals**. Default is **all** whitelist titles. Uncheck a journal or a discipline header to exclude it. Presets: **Q1 only**, **A* only**, and **A* & A only**.
3. The publication year is inside the Years slider (default ≈ last 10 calendar years). Papers with no year count only when the slider covers the full available span.

Scholar profiles include whatever Google Scholar lists (articles, and sometimes commentaries or other items). There is **no separate editorial/errata filter** beyond journal matching.

### Journal disciplines

Journals are grouped by field in `venues.json` (`discipline`). Group membership is **not** the default-on switch — every title below is on until you uncheck it. Within a group, journals are sorted by **2025 JIF** (high → low). Each row shows that JIF, the journal’s **best Clarivate JCR 2025 quartile**, and its **2025 ABDC** rating (`A*`, `A`, `B`, `C`, or **—** if the title is not on the ABDC Journal Quality List). The whitelist is **Q1–Q2 only**. A journal indexed in two Web of Science categories may be Q1 in one and Q2 in another; the badge is the better of those.

**I-O / Work Psychology:** JAP, Personnel Psychology, *Industrial and Organizational Psychology*, JBP, JOHP, JOOP, Applied Psychology, EJWOP, IJSA, Organizational Psychology Review, Work & Stress, Work Aging and Retirement, *Annual Review of Organizational Psychology and Organizational Behavior*, Stress and Health, International Journal of Stress Management, Journal of Vocational Behavior, Journal of Career Assessment, Career Development International, Human Resource Development Quarterly, Military Psychology

**OB / Management:** JOB, Leadership Quarterly, Journal of Leadership & Organizational Studies, OBHDP, Group & Organization Management, Journal of Management, AMJ, Human Relations, Journal of Managerial Psychology, HRM, HRMJ, HRMR, IJHRM, Personnel Review, AMR, AOM Annals, AOM Discoveries, ASQ, Organization Science, JMS, Organization Studies, Management Science, SMJ, Organizational Dynamics, Harvard Business Review

**Methods / Measurement / Psychometrics:** ORM, Psychological Methods, AMPPS, Assessment, Behavior Research Methods, Educational and Psychological Measurement, Multivariate Behavioral Research, Psychological Assessment, Psychometrika, Sociological Methods & Research

**General / Experimental / Decision Psychology:** Nature, Science, Psychological Bulletin, Nature Reviews Psychology, Nature Communications, Nature Human Behaviour, Psychological Science, PNAS, American Psychologist, Annual Review of Psychology, Current Directions in Psychological Science, Perspectives on Psychological Science, Psychological Review, Psychological Science in the Public Interest, JEP: General, Judgment and Decision Making

**Social / Individual Differences:** JPSP, PSPB, PSPR, Journal of Applied Social Psychology, Journal of Personality, Journal of Research in Personality, Personality and Individual Differences, Intelligence, Learning and Individual Differences

**Career / Vocational / Counseling / Educational Psychology:** Journal of Counseling Psychology, Journal of Educational Psychology

**Human Factors / Health / Aging / Technology:** Computers in Human Behavior, Human Factors, Journal of Health Psychology, Psychology and Aging

## Credit: adjusted counts (1/N)

Each counted paper contributes **1 / N**, where **N** is the number of authors on the Scholar record. Author order and co-author affiliation do not matter.

## Switchable metrics

All metrics use the **same** filtered paper set (Years + Journals + Areas):

| UI label | Definition |
| --- | --- |
| Adjusted count (1/N) | Sum of 1/N (default sort) |
| Raw paper count | Number of counted papers |
| 1st / 2nd / last author | Counted papers where this person is first, second, or last on the Scholar author list (each paper once) |
| Last-author papers | Counted papers where this person is last among **two or more** authors (sole-author papers are not last) |
| Citations | Sum of each counted paper’s Google Scholar citation total (see below) |
| Impact factor (sum) | Sum of Clarivate JIF (`impact_factor` in `venues.json`) per paper — **not** 1/N. Values are the JCR 2026 release (2025 JIF, 17 Jun 2026). |
| … / faculty | The metric above divided by faculty with a fetched Scholar profile |

Institution scores are the **sum** across rostered faculty. Per-faculty options divide by faculty with a **fetched Google Scholar profile** (including those with zero counted papers in the current filters). Faculty with no Scholar ID, or a 404/empty profile, are listed on the roster but are not in that denominator.

Default ranking is adjusted count because citation and IF sums move quickly and are easier to game. The author-position counts are optional views; they depend on matching names to Scholar’s (sometimes truncated) author string.

### Author position (1st / 2nd / last)

Two optional metrics use the **same** filtered paper set as the others, then keep papers by position on Google Scholar’s author string:

- **1st / 2nd / last author:** keep a paper if the roster name matches **first, second, or last**. A paper counts **once** even if two of those labels apply (a two-author second author is also last).
- **Last-author papers:** keep only last position when there are **at least two** authors.

Rules shared by both:

- **First:** position 1, including sole-author papers.
- **Second:** position 2.
- **Last:** last position when there are **at least two** authors. A sole-author paper is first, not last.
- Middle authors (3rd of 4, etc.) do not add to these counts. They still count in raw / 1/N / citations / IF.
- If the name cannot be matched (typos, unusual initials, truncated lists), the paper counts in raw / 1/N / citations / IF but **not** here.

Position comes from Scholar’s author string, not the publisher XML. Scholar often abbreviates names (`PL Ackerman`) and sometimes truncates long lists, so “last” on a long author string may not be the true senior author. Matching uses the roster name against that string (same style of initial/last-name keys as the coauthor network).

These views are for exploration (e.g. student-led vs. senior-authored work). They are **not** the default ranking.

### Citations (what the number is)

The Years slider filters papers by **publication year**, not by when citations happened.

**Citations** then adds, for those papers, the citation total Google Scholar showed on each paper when that faculty profile was last fetched. It is a **lifetime count to the fetch date** (from the paper’s publication through the snapshot), not “how many citations accrued during the selected years.”

Example: with the default window (about the last 10 calendar years), a 2018 whitelist article contributes whatever Scholar listed as its total cites at fetch time — including cites from 2018 through the snapshot. A 2025 article in the same window usually contributes few cites because it has had little time to be cited. Opening the slider to all years brings in older articles and their much larger lifetime totals.

Other details:

- The count is **not** divided by the number of authors (unlike adjusted count).
- It is Google Scholar’s count, not Web of Science or Scopus, and it is **not live** in the browser. Updating it requires re-fetching Scholar profiles and re-running `score.py`. The footer date is the last score rebuild (`generated_at` in `web/data/rankings.json`), which may be later than an individual profile’s fetch.
- If two people on the roster are co-authors of the same paper, **each** row gets that paper’s full Scholar total. The institution sum therefore counts those cites twice.
- Scholar’s number can include cites to whatever Scholar attached to that record (including some non-article items if the venue string still matched the whitelist).

This metric answers: *among whitelist papers published in the selected years, how much have those papers been cited up to the Scholar snapshot?* It does **not** answer how many citations the program received in those years.

## Transparency and limitations

- v1 is a **pilot**. Incomplete faculty lists bias scores downward. Rankings currently reflect **current** program faculty only; former members are not included yet.
- Papers come only from Google Scholar profiles. Coverage follows Scholar (missing IDs, missing papers, messy venue strings).
- Relative `weight` in `venues.json` is unused for the live IF metric. **Impact factor (sum)** uses Clarivate JIF values stored in that file from the JCR 2026 release (2025 JIF). Journal list rows use the same release’s JIF and **best JCR quartile**, plus the **2025 ABDC Journal Quality List** rating when the title is listed. This site cannot query Web of Science/JCR (subscription) or ABDC’s live database.
- This site does **not** measure teaching quality, student outcomes, or overall prestige.

The footer shows the month/year of the latest score rebuild (`generated_at` in `web/data/rankings.json`).
