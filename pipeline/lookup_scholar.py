"""Find Google Scholar IDs by name + current institution.

Google Scholar author search is often blocked, so this uses a web search
(ddgs) for "{name} {school} Google Scholar", then accepts a profile only
when the Scholar URL/snippet matches the roster name AND affiliation.
Ambiguous / no-affiliation matches are skipped (logged), never guessed.
"""

from __future__ import annotations

import argparse
import csv
import re
import time
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import pandas as pd
from ddgs import DDGS

from config import write_scholar_table

ROOT = Path(__file__).resolve().parents[1]
FACULTY = ROOT / "data" / "faculty.csv"
INST = ROOT / "data" / "institutions.csv"
LOG = ROOT / "pipeline" / "cache" / "scholar_lookup_log.csv"

BLOCKED_IDS = {
    "mHCtGhcAAAAJ",  # botanist James Beck, not Waterloo I-O
    "qRrkCbkAAAAJ",  # Andrew F. Hayes PROCESS profile, not Ho Kwan Cheung
    "Io3oUv4AAAAJ",  # Robert Henning, University of Chicago crystallography
    "kZeVQQ0AAAAJ",  # Xiaohong (Violet) Xu, not Stephanie Payne
    "UlYZ-RQAAAAJ",  # Kibeom Lee HEXACO profile; Scholar/SerpAPI 404
    "0dpLJtwAAAAJ",  # Nicholas A. Smith lookup match; Scholar 404
    "prsyEcQAAAAJ",  # different Rebecca Grossman (Columbia/CUMC); Hofstra I-O is s4feQ-wAAAAJ
    "rmR5rTUAAAAJ",  # lookup hit for Betsy Albritton; Scholar 404 (Clemson page still links it)
    "wSjJUsMAAAAJ",  # Kibeom Lee Seoul recommender-systems profile, not Calgary HEXACO
    "Pk540RcAAAAJ",  # Kibeom Lee Gachon University, not Calgary HEXACO
    "BaN8s-MAAAAJ",  # Aaron G. Schmidt Harvard Medical, not UMN I-O Aaron M. Schmidt
    "I1VGsbAAAAAJ",  # Ryan E. Grant Queen's, not UNCC Ryan Grant
    "leaDyIoAAAAJ",  # biomedical Ryan Grant, not UNCC
    "tfTokuwAAAAJ",  # Kevin Nolan University College Dublin, not Hofstra
    "tYGzwOIAAAAJ",  # Sophie Meunier Princeton, not UQAM
    "sdaJew0AAAAJ",  # Xiaowen Chen George Mason, not SLU
    "xYdlSLMAAAAJ",  # Corey Seemiller (Generation Z / leadership ed), not Wright State I-O Corey E. Miller
}
SCHOLAR_ID_RE = re.compile(r"^[A-Za-z0-9_-]{10,16}$")
SUFFIXES = {"jr", "jr.", "sr", "sr.", "ii", "iii", "iv", "phd", "ph.d."}

AFFILIATION_HINTS = {
    "umn": ["minnesota", "umn.edu", "umn"],
    "msu": ["michigan state", "msu.edu"],
    "uiuc": ["illinois", "urbana", "champaign", "illinois.edu"],
    "bgsu": ["bowling green", "bgsu.edu"],
    "uakron": ["akron", "uakron.edu"],
    "psu": ["penn state", "pennsylvania state", "psu.edu"],
    "rice": ["rice university", "rice u", "rice.edu"],
    "gmu": ["george mason", "gmu.edu"],
    "uga": ["university of georgia", "uga.edu"],
    "tamu": ["texas a&m", "texas am", "tamu.edu"],
    "usf": ["south florida", "usf.edu"],
    "purdue": ["purdue", "purdue.edu"],
    "uh": ["university of houston", "uh.edu"],
    "pdx": ["portland state", "pdx.edu"],
    "csu": ["colorado state", "colostate.edu"],
    "uncc": ["charlotte", "unc charlotte", "charlotte.edu"],
    "ncsu": ["north carolina state", "nc state", "ncsu.edu"],
    "gatech": ["georgia tech", "georgia institute", "gatech.edu"],
    "umd": ["maryland", "umd.edu"],
    "baruch": ["baruch", "cuny", "baruch.cuny.edu"],
    "clemson": ["clemson", "clemson.edu"],
    "wright": ["wright state", "wright.edu"],
    "cmich": ["central michigan", "cmich.edu"],
    "wayne": ["wayne state", "wayne.edu"],
    "fit": ["florida tech", "florida institute", "fit.edu"],
    "ucf": ["central florida", "ucf.edu"],
    "niu": ["northern illinois", "niu.edu"],
    "ou": ["oklahoma", "ou.edu"],
    "iit": ["illinois institute", "illinois tech", "iit.edu"],
    "depaul": ["depaul", "depaul.edu"],
    "ualbany": ["albany", "albany.edu"],
    "unomaha": ["nebraska", "omaha", "unomaha.edu"],
    "utulsa": ["tulsa", "utulsa.edu"],
    "latech": ["louisiana tech", "latech.edu"],
    "fiu": ["florida international", "fiu.edu"],
    "auburn": ["auburn", "auburn.edu"],
    "vt": ["virginia tech", "vt.edu"],
    "slu": ["saint louis", "st. louis university", "slu.edu"],
    "wmu": ["western michigan", "wmich.edu"],
    "montclair": ["montclair", "montclair.edu"],
    "hofstra": ["hofstra", "hofstra.edu"],
    "spu": ["seattle pacific", "spu.edu"],
    "tc": ["teachers college", "columbia", "tc.columbia.edu"],
    "gwu": ["george washington", "gwu.edu"],
    "uta": ["arlington", "uta.edu"],
    "waterloo": ["waterloo", "uwaterloo.ca"],
    "calgary": ["calgary", "ucalgary.ca"],
    "smu": ["saint mary", "st. mary", "st mary", "smu.ca"],
    "guelph": ["guelph", "uoguelph.ca"],
    "western": ["western university", "western ontario", "uwo.ca"],
    "uqam": ["uqam", "québec à montréal", "quebec a montreal", "uqam.ca"],
    "umontreal": ["université de montréal", "universite de montreal", "umontreal.ca", "udem"],
    "windsor": ["windsor", "uwindsor.ca"],
    "ksu": ["kansas state", "k-state", "kstate", "ksu.edu", "k-state.edu"],
    "uconn": ["connecticut", "uconn", "uconn.edu"],
    "lsu": ["louisiana state", "lsu.edu", "lsu"],
    "wsu": ["washington state", "wsu.edu", "wsu vancouver"],
}


def affiliation_ok(text: str, institution_id: str) -> bool:
    blob = (text or "").lower()
    if not blob:
        return False
    hints = AFFILIATION_HINTS.get(institution_id, [])
    return any(h in blob for h in hints)


def name_parts(name: str) -> tuple[str, list[str]]:
    tokens = [t.strip(" ,") for t in name.replace("-", " ").split() if t.strip(" ,")]
    while tokens and tokens[-1].lower().rstrip(".") in SUFFIXES:
        tokens.pop()
    if not tokens:
        return "", []
    last = tokens[-1]
    given = [t.rstrip(".") for t in tokens[:-1] if len(t.rstrip(".")) >= 3]
    return last, given


def _name_token_in(hay: str, token: str) -> bool:
    """Whole-token match so 'miller' does not hit 'Seemiller'."""
    if not token:
        return False
    return re.search(rf"(?<![a-z]){re.escape(token.lower())}(?![a-z])", hay.lower()) is not None


def _name_ok_one(hay: str, name: str) -> bool:
    last, given = name_parts(name)
    if not last or not _name_token_in(hay, last):
        return False
    if given and not any(_name_token_in(hay, g) for g in given):
        return False
    return True


def name_ok(title: str, body: str, names: list[str]) -> bool:
    """Match name on the Scholar result title, not snippet coauthors."""
    title_l = (title or "").lower().strip()
    body_l = (body or "").lower()
    generic = title_l in {"google scholar", "google akademik"} or title_l.startswith(
        "google scholar"
    )
    hay = body_l if generic else title_l
    return any(_name_ok_one(hay, name) for name in names)


NICKNAMES = {
    "hebl_mikki": ["Mikki Hebl", "Michelle Hebl"],
    "king_danielle": ["Danielle King", "Danielle D. King"],
    "ford_kevin": ["Kevin Ford", "J Kevin Ford"],
    "lebreton_james": ["James LeBreton", "James M LeBreton"],
    "zickar_michael": ["Mike Zickar"],
    "shoss_mindy": ["Mindy Krischer Shoss", "Mindy (Krischer) Shoss"],
    "ackerman_phillip": ["Philllip L. Ackerman", "Phillip Ackerman"],
    "kelloway_kevin": ["Kevin Kelloway", "Kelloway, E. Kevin"],
    "chao_georgia": ["Georgia Chao"],
    "dik_bryan": ["Bryan Dik"],
    "oneill_thomas": ["Tom O'Neill", "Thomas O'Neill"],
    "hunter_samuel": ["Sam Hunter", "Samuel Hunter"],
    "kaplan_seth": ["Seth Kaplan"],
    "bobocel_ramona": ["Ramona Bobocel", "D Ramona Bobocel"],
    "foster_lori": ["Lori Foster Thompson", "Lori Foster"],
    "sonhing_leanne": ["Leanne Son Hing"],
    "steelejohnson_debra": ["Debra Steele-Johnson", "Debra Steele Johnson"],
    "simkins_susan": ["Susan Mohammed", "Susan J Mohammed"],
    "taylor_maryanne": ["Maryanne Taylor", "Mary A Taylor"],
    "shahanidenning_comila": ["Comila Shahani"],
    "svyantek_dan": ["Daniel Svyantek", "Dan Svyantek"],
    "menard_julie": ["Julie Ménard"],
    "scott_cliff": ["Clifford Scott"],
    "godollei_anna": ["Anna Godöllei"],
    "chatterjee_dia": ["Deepshikha Chatterjee", "Dia Chatterjee"],
    "carver_sarah": ["Sarah J Carver", "Sarah J. Carver"],
    "nguyen_tin": ["Tin L Nguyen", "Tin L. Nguyen"],
    "gibbons_alyssa": ["Alyssa Mitchell Gibbons"],
    "scott_cliff": ["Clifton Scott", "Clifton W Scott", "Cliff Scott"],
    "baker_nathan": ["NM Baker", "Nathan M Baker"],
    "martini_kate": ["Katherine Martini", "Katherine Jane-Binder Martini"],
    "magley_vicki": ["Vicki J Magley", "Vicki J. Magley"],
    "henning_robert": ["Robert A Henning", "Robert A. Henning"],
    "zhang_don": ["Don C Zhang", "Don C. Zhang"],
    "cobb_haley": ["Haley R Cobb", "Haley R. Cobb"],
    "allen_shalene": ["Shalene J Allen", "Shalene J. Allen"],
    "snyder_lori": ["Lori Anderson Snyder", "Lori A Snyder"],
    "mcgee_heather": ["Heather M McGee", "Heather McGee"],
    "beck_james": ["James W Beck", "James Beck"],
    "lee_kibeom": ["Kibeom Lee"],
    "albritton_betsy": ["Betsy Albritton", "Elizabeth Albritton"],
    "smith_nicholas": ["Nicholas A Smith", "Nicholas A. Smith"],
}


def name_variants(name: str, faculty_id: str = "") -> list[str]:
    last, given = name_parts(name)
    out = [name]
    if given and last:
        out.append(f"{given[0]} {last}")
    out.extend(NICKNAMES.get(faculty_id, []))
    # unique, keep order
    seen: set[str] = set()
    uniq: list[str] = []
    for n in out:
        key = n.lower()
        if key not in seen:
            seen.add(key)
            uniq.append(n)
    return uniq


def scholar_id_from_url(url: str) -> str:
    if not url or "scholar.google." not in url.lower():
        return ""
    parsed = urlparse(url)
    if "citations" not in parsed.path.lower():
        return ""
    sid = (parse_qs(parsed.query).get("user") or [""])[0].strip()
    if SCHOLAR_ID_RE.match(sid):
        return sid
    return ""


def search_web(query: str, max_results: int = 8) -> list[dict]:
    last_err: Exception | None = None
    for attempt in range(3):
        try:
            with DDGS() as ddgs:
                return list(ddgs.text(query, max_results=max_results))
        except Exception as exc:
            last_err = exc
            time.sleep(2 + attempt * 2)
    raise RuntimeError(last_err)


def search_one(
    name: str, institution_id: str, institution_name: str, faculty_id: str = ""
) -> tuple[str, str]:
    variants = name_variants(name, faculty_id)
    queries: list[str] = []
    for n in variants:
        queries.append(f'"{n}" {institution_name} Google Scholar')
        queries.append(f"{n} {institution_name} Google Scholar")
    matches: list[tuple[str, str, str]] = []
    seen: set[str] = set()
    notes: list[str] = []
    for q in queries:
        try:
            results = search_web(q)
        except Exception as exc:
            return "", f"search_error:{exc}"
        for r in results:
            url = r.get("href") or r.get("url") or ""
            title = r.get("title") or ""
            body = r.get("body") or ""
            sid = scholar_id_from_url(url)
            if not sid or sid in seen:
                continue
            if sid in BLOCKED_IDS:
                notes.append(f"blocked:{sid}")
                continue
            seen.add(sid)
            snippet = f"{title} {body}"
            if not name_ok(title, body, variants):
                notes.append(f"name_mismatch:{sid}")
                continue
            if not affiliation_ok(snippet, institution_id):
                notes.append(f"affil_mismatch:{sid}")
                continue
            matches.append((sid, title, body[:160]))
        if matches:
            break
    uniq = {sid for sid, _, _ in matches}
    if len(uniq) == 1:
        sid, title, body = matches[0]
        return sid, f"ok:{title} | {body}"
    if not matches:
        extra = ";".join(notes[:4])
        return "", "no_affiliation_match" + (f":{extra}" if extra else "")
    return "", "ambiguous:" + " | ".join(f"{s} ({t})" for s, t, _ in matches[:3])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--sleep", type=float, default=1.5)
    parser.add_argument("--start", type=int, default=0, help="Skip first N remaining faculty")
    args = parser.parse_args()

    inst_name = {
        r["institution_id"]: r["name"]
        for r in csv.DictReader(INST.open(encoding="utf-8"))
    }
    rows = list(csv.DictReader(FACULTY.open(encoding="utf-8")))
    fields = list(rows[0].keys())
    LOG.parent.mkdir(parents=True, exist_ok=True)

    todo = [
        r
        for r in rows
        if r["active"].strip().lower() == "true"
        and not (r.get("google_scholar_id") or "").strip()
    ]
    if args.start:
        todo = todo[args.start :]
    if args.limit:
        todo = todo[: args.limit]

    found = 0
    log_rows: list[dict] = []
    print(f"Looking up {len(todo)} faculty without Scholar IDs")
    for i, row in enumerate(todo, 1):
        name = row["name"]
        iid = row["institution_id"]
        print(f"[{i}/{len(todo)}] {name} ({iid})", flush=True)
        sid, note = search_one(name, iid, inst_name.get(iid, iid), row["faculty_id"])
        if sid:
            row["google_scholar_id"] = sid
            found += 1
            print(f"  -> {sid}", flush=True)
        else:
            print(f"  -> skip  {note[:200]}", flush=True)
        log_rows.append(
            {
                "faculty_id": row["faculty_id"],
                "name": name,
                "institution_id": iid,
                "google_scholar_id": sid,
                "note": note[:500],
            }
        )
        time.sleep(args.sleep)

        if i % 10 == 0:
            with FACULTY.open("w", encoding="utf-8", newline="") as f:
                w = csv.DictWriter(f, fieldnames=fields, lineterminator="\n")
                w.writeheader()
                w.writerows(rows)

    with FACULTY.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    write_scholar_table(pd.DataFrame(rows))

    write_header = not LOG.exists()
    with LOG.open("a", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["faculty_id", "name", "institution_id", "google_scholar_id", "note"],
            lineterminator="\n",
        )
        if write_header:
            w.writeheader()
        w.writerows(log_rows)

    print(f"Matched {found}/{len(todo)}. Wrote {FACULTY}")


if __name__ == "__main__":
    main()
