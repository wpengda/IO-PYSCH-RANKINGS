# Methodology

IO Psychology Rankings is a metrics-based ranking of U.S. and Canadian industrial-organizational (I-O) psychology programs by faculty research output in a curated set of selective journals.

It is inspired by [CSRankings](https://csrankings.org/) (selective venues + author-adjusted counts), but is independent of it. Faculty rosters are built from program websites first. After names are fixed, publications come from **Google Scholar profiles**. Scholar fetch stores the full profile; default rankings use the journal whitelist in `venues.json` and can be re-scored if that list changes. We do not identify faculty by searching bibliographic databases.

## Who is counted

- Tenure-track / full-time research faculty (assistant, associate, full professor).
- Affiliated with an I-O psychology (or closely related) graduate program in the **United States** or **Canada**.
- Excluded: emeritus (unless still listed as active research faculty by the program), adjunct/clinical teaching-only appointments, visiting scholars, and industry affiliates without a primary academic appointment.

Faculty lists are curated from each program’s own faculty page. See [faculty-roster.md](faculty-roster.md). A person is scored after a Google Scholar ID is attached. Incomplete rosters bias scores downward.

## What publications count

Only works that match **all** of the following:

1. Appear in a journal listed in [`data/venues.json`](../../data/venues.json).
2. Are journal articles/reviews (editorials, comments, errata excluded) listed on the faculty member’s Google Scholar profile.
3. Fall inside the selected publication year range in the UI (default: about the last **10** calendar years; any from–to range is supported).

Cross-boundary outlets are tagged `cross_boundary` and are **off by default** (Journals → **core only**). That set includes management journals (*AMJ*, *AMR*, *ASQ*, *JoM*, *JMS*, *MS*, *Organization Science*, *Organization Studies*, *SMJ*, *Human Relations*, *AOM Annals*, *AOM Discoveries*) and broad psychology / HCI outlets (*JPSP*, *Psychological Science*, *Psychological Bulletin*, *Computers in Human Behavior*). Core I-O and methods journals (including *JOOP*, *Work & Stress*, *IJSA*, *Psychological Methods*, *AMPPS*) count by default. Use the **Journals** dialog to include individual titles or choose **all**.

## Credit: adjusted counts (1/N)

Each counted paper contributes **1 / N**, where **N** is the number of authors on the paper. Credit does not depend on author order or affiliation of co-authors. This matches the CSRankings incentive: adding honorary authors cannot increase anyone’s share above 1/N.

## Switchable metrics

Scores are computed on the **same** filtered paper set:

| Key | Definition |
| --- | --- |
| `adj_count` | Sum of 1/N over counted papers (default sort) |
| `raw_count` | Number of counted papers (unadjusted; diagnostic only) |
| `citations` | Sum of Google Scholar citation counts for those papers (diagnostic; default ranking is still `adj_count`) |
| `weighted_if` | Sum of Clarivate Journal Impact Factors over counted papers (**no** 1/N). Uses `impact_factor` in `venues.json`. |

Institution score defaults to the **sum** across affiliated faculty. The UI can also show a **per-faculty** average (`metric / faculty_count`).

Citation- and impact-weighted views are provided for exploration. Default ranking uses `adj_count` because citation metrics are easier to manipulate and change quickly.

## Areas (taxonomy)

Canonical areas live in [`data/taxonomy.json`](../../data/taxonomy.json) and drive **both** faculty pills and paper tags.

| Domain | Areas |
| --- | --- |
| Industrial / Personnel | Selection, Training, Personality |
| Organizational | Leadership, Motivation/Attitudes, Teams, Diversity, Careers |
| Technology & Future of Work | Technology |
| Occupational Health | OHP |
| Methods & General | Methods, General |

### Faculty labels

1. Pull self-described interests primarily from **Google Scholar** author chips (SerpAPI), plus homepage “Research Interests” blocks when parseable (`pipeline/fetch_interests.py`).
2. Map free-text phrases onto the taxonomy via `aliases` (`pipeline/build_taxonomy.py` → `data/faculty_areas.json`).
3. Display pills are based on **all** of that faculty member’s papers in the **full** journal whitelist (every venue in `venues.json`, all years)—**not** the currently selected Journals / Years / Areas filters. Order is by paper count per area (high → low; ties by 1/N credit). Scholar/homepage areas with no whitelist pubs still appear, but last. Changing journal checkboxes must not change these labels.

### Paper labels

Broad journals: title keywords from `taxonomy.json` → `paper_keywords` (same area names). Specialty journals (LQ, JOHP, ORM) keep a single venue area. Rebuild with `python pipeline/score.py` after taxonomy edits.

Area filters in the UI restrict the paper set to papers whose assigned areas intersect the selection (not merely venue tags).

## Transparency and limitations

- Coverage in v1 is a **pilot** subset of U.S./Canadian programs; incomplete faculty lists bias scores downward for missing schools.
- Papers come only from Google Scholar profiles tied to a named faculty member. We do not search bibliographic databases by name.
- Relative `weight` values in `venues.json` are coarse ranking aids, not official JIFs. The **Impact factor (sum)** metric uses curated Clarivate JIF values (`impact_factor`; see `impact_factor_note` in that file).
- This site does **not** claim to measure teaching quality, student outcomes, or overall program prestige.

The site footer shows the month/year of the latest score rebuild (`generated_at` in `web/data/rankings.json`).
