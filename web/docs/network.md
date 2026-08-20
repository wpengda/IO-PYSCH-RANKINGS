# How we network

IO Psychology Network maps **coauthorship among faculty with a Google Scholar profile** at U.S. and Canadian I-O PhD programs — current members and people listed on a program’s faculty timeline.

It uses the **same Google Scholar fetch and the same venue whitelist** (journals plus listed CS/HCI/ML conferences) as [How we rank](ranking.md). A line is not a ranking score; it is a count of shared whitelist papers.

## Who appears

A person is a node if they have a fetched Google Scholar profile and appear on the current roster ([`data/faculty.csv`](../../data/faculty.csv)) or a faculty timeline ([`data/faculty_appointments.csv`](../../data/faculty_appointments.csv)). Faculty without an ID do not appear here.

One person can belong to **more than one program** (for example Nathan Kuncel at Minnesota now and Illinois in 2003–2005). Searching a school keeps anyone with that affiliation, past or present. Region uses any of those programs. Node color is the current (or most recent) program.

## What a line means

A line between two people means they share **at least one** counted paper in the current filters (Years + Journals + Areas). The number on the line is how many such papers they share.

Two rostered faculty are treated as coauthors on a paper if:

- the same (normalized) title appears on both Scholar profiles, or
- one profile’s Scholar author string matches the other person’s roster name (initials / last-name keys; the same matching used for author position in Rankings).

The map shows **roster–roster** ties only. Students, colleagues outside the roster, and unmatched author strings are not drawn as nodes.

## What publications count

The same whitelist and matching rules as Rankings (`venues.json`). Default is **all** whitelist journals, last ~10 calendar years. Uncheck journals or drag Years to change the graph. The Areas sidebar keeps a paper if **any** of its assigned areas is selected.

Non-whitelist Scholar items do not add visible ties.

## Other controls

| Control | Effect |
| --- | --- |
| Region | Keep people at U.S. programs, Canadian programs, or both |
| Min papers | Hide a line unless that pair shares at least this many counted papers |
| Min connections | Hide people with fewer roster coauthors than this in the current filters (default 1 hides isolates) |
| Faculty / Program | Type a name or school to highlight matches and keep their coauthors (faded). |

Click a person for their program and the shared papers behind each tie.

## Rebuild

After a Scholar fetch or a journal-list change:

```bash
python pipeline/build_coauthor_network.py
```

That writes `web/data/coauthor_network.json`. It is **not** part of `python pipeline/run_all.py`.

## Limitations

- Coverage follows Google Scholar (missing IDs, missing papers, messy titles and author strings).
- Truncated Scholar author lists can miss a roster coauthor; title overlap on two profiles can still create the tie.
- Appointment years are shown on the person; a line is still shared whitelist papers, not “they overlapped at the same school.”
- This is a map of collaboration in the whitelist, not a measure of friendship, mentoring quality, or program prestige.
