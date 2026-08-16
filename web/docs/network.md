# How we network

IO Psychology Network maps **coauthorship among current rostered faculty** at U.S. and Canadian I-O PhD programs.

It uses the **same people, the same Google Scholar fetch, and the same journal whitelist** as [How we rank](ranking.md). A line is not a ranking score; it is a count of shared whitelist papers.

## Who appears

A person is a node only if they are on the **current** program roster **and** have a fetched Google Scholar profile. Faculty without an ID (shown with score 0 on Rankings) do not appear here.

Same inclusion rules as Rankings: tenure-track / full-time research faculty; current members only. Former faculty will be added in a later version.

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
| Faculty / Program | Type a name to keep that person or program, plus their visible neighbors |

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
- Current faculty only; a paper written with someone who has since left the roster does not show that former colleague as a node.
- This is a map of collaboration in the whitelist, not a measure of friendship, mentoring quality, or program prestige.
