"""Collect faculty research-interest phrases from Scholar + homepages.

Primary: Google Scholar author interest chips via SerpAPI (self-labeled).
Secondary: homepage scrape when a Research Interests block exists.

Outputs:
  pipeline/cache/interests/faculty_interests.json
"""

from __future__ import annotations

import argparse
import json
import os
import re
import time
from pathlib import Path
from urllib.parse import urlparse

import httpx
import pandas as pd
import requests
from bs4 import BeautifulSoup

from config import CACHE, DATA, ROOT, USER_AGENT, ensure_dirs

INTEREST_CACHE = CACHE / "interests"
HTML_DIR = INTEREST_CACHE / "html"
SCHOLAR_DIR = INTEREST_CACHE / "scholar"
OUT_JSON = INTEREST_CACHE / "faculty_interests.json"
SERPAPI = "https://serpapi.com/search.json"

HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

HEADING_RE = re.compile(
    r"^\s*(research\s+interests?|research\s+areas?|areas?\s+of\s+(?:research|expertise|interest)|"
    r"expertise|research\s+focus|current\s+research|scholarly\s+interests?|"
    r"primary\s+research|research\s+topics?)\s*:?\s*$",
    re.I,
)
INLINE_RE = re.compile(
    r"(research\s+interests?|research\s+areas?|areas?\s+of\s+(?:research|expertise|interest)|"
    r"expertise)\s*[:\-–]\s*(.+)",
    re.I,
)
SPLIT_RE = re.compile(r"[;|•·]|\n|,(?=\s*[A-Z])")

JUNK_PHRASES = {
    "faculty",
    "cognition",
    "neuroscience",
    "& social",
    "university of south florida",
    "for current and recent research, see:",
    "industrial-organizational",
    "industrial/organizational psychology",
    "i-o psychology",
    "io psychology",
    "organizational psychology",
    "psychology",
}


def load_dotenv() -> None:
    path = ROOT / ".env"
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key, val = key.strip(), val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


def api_key() -> str:
    load_dotenv()
    key = (os.environ.get("SERPAPI_API_KEY") or "").strip()
    if not key:
        raise SystemExit("Set SERPAPI_API_KEY in .env for Scholar interests")
    return key


def slug_url(url: str) -> str:
    host = urlparse(url).netloc.replace(":", "_")
    path = re.sub(r"[^\w\-]+", "_", urlparse(url).path.strip("/"))[:120]
    return f"{host}__{path or 'root'}.html"


def _clean_phrase(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip(" \t\r\n-–—•·|;,.")
    text = re.sub(r"\[email\s*protected\]", "", text, flags=re.I)
    return text.strip()


def _keep_phrase(text: str) -> bool:
    p = _clean_phrase(text)
    if len(p) < 3 or len(p) > 80:
        return False
    low = p.lower()
    if low in JUNK_PHRASES:
        return False
    if any(
        x in low
        for x in (
            "skip to",
            "cookie",
            "privacy",
            "click here",
            "curriculum vitae",
            "download cv",
            "contact",
            "phone:",
            "email",
            "view cv",
        )
    ):
        return False
    return True


def _split_phrases(blob: str) -> list[str]:
    parts: list[str] = []
    for chunk in SPLIT_RE.split(blob or ""):
        chunk = _clean_phrase(chunk)
        if _keep_phrase(chunk):
            parts.append(chunk)
    seen: set[str] = set()
    out: list[str] = []
    for p in parts:
        key = p.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(p)
    return out


def fetch_homepage_html(url: str, *, force: bool = False) -> tuple[str, str]:
    HTML_DIR.mkdir(parents=True, exist_ok=True)
    path = HTML_DIR / slug_url(url)
    if path.exists() and not force:
        return path.read_text(encoding="utf-8", errors="replace"), "cached"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30, allow_redirects=True)
        if resp.status_code >= 400:
            path.write_text("", encoding="utf-8")
            return "", f"http_{resp.status_code}"
        html = resp.text or ""
        path.write_text(html, encoding="utf-8", errors="replace")
        return html, "ok" if len(html.strip()) >= 80 else "empty"
    except Exception as exc:  # noqa: BLE001
        path.write_text("", encoding="utf-8")
        return "", f"exception:{type(exc).__name__}"


def extract_homepage_phrases(html: str) -> tuple[list[str], str]:
    if not html or len(html.strip()) < 80:
        return [], "empty"
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "nav", "footer", "header"]):
        tag.decompose()

    for node in soup.find_all(["h1", "h2", "h3", "h4", "h5", "strong", "b", "dt", "span", "p"]):
        label = _clean_phrase(node.get_text(" ", strip=True))
        if not label or not HEADING_RE.match(label):
            continue
        collected: list[str] = []
        if node.name == "dt":
            dd = node.find_next_sibling("dd")
            if dd:
                collected.extend(_split_phrases(dd.get_text("\n", strip=True)))
        for sib in node.find_all_next(["ul", "ol", "p", "div"], limit=8):
            sib_text = _clean_phrase(sib.get_text(" ", strip=True))
            if HEADING_RE.match(sib_text) and sib is not node:
                break
            if sib.name in {"ul", "ol"}:
                for li in sib.find_all("li"):
                    collected.extend(_split_phrases(li.get_text(" ", strip=True)))
                break
            if sib.name in {"p", "div"}:
                txt = sib.get_text("\n", strip=True)
                if len(txt) > 15:
                    collected.extend(_split_phrases(txt))
                if collected:
                    break
        if not collected and node.parent:
            parent_txt = node.parent.get_text("\n", strip=True)
            m = INLINE_RE.search(parent_txt)
            if m:
                collected.extend(_split_phrases(m.group(2)))
        phrases = [p for p in collected if not HEADING_RE.match(p)]
        if phrases:
            return phrases[:12], "heading"

    text = soup.get_text("\n", strip=True)
    for line in text.split("\n"):
        m = INLINE_RE.search(line)
        if m:
            phrases = _split_phrases(m.group(2))
            if phrases:
                return phrases[:12], "inline"
    return [], "none"


def fetch_scholar_interests(
    scholar_id: str, key: str, client: httpx.Client, *, force: bool = False
) -> tuple[list[str], str]:
    SCHOLAR_DIR.mkdir(parents=True, exist_ok=True)
    path = SCHOLAR_DIR / f"{scholar_id}.json"
    if path.exists() and not force:
        data = json.loads(path.read_text(encoding="utf-8"))
        phrases = data.get("phrases") or []
        return phrases, "cached"

    try:
        resp = client.get(
            SERPAPI,
            params={
                "engine": "google_scholar_author",
                "author_id": scholar_id,
                "api_key": key,
                "hl": "en",
            },
            timeout=60.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        interests = (payload.get("author") or {}).get("interests") or []
        phrases = []
        for item in interests:
            title = _clean_phrase(item.get("title") if isinstance(item, dict) else str(item))
            if _keep_phrase(title):
                phrases.append(title)
        path.write_text(
            json.dumps(
                {"scholar_id": scholar_id, "phrases": phrases, "raw": interests},
                indent=2,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        return phrases, "ok"
    except Exception as exc:  # noqa: BLE001
        path.write_text(
            json.dumps({"scholar_id": scholar_id, "phrases": [], "error": str(exc)}, indent=2),
            encoding="utf-8",
        )
        return [], f"error:{type(exc).__name__}"


def merge_phrases(*groups: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for group in groups:
        for p in group:
            key = p.lower()
            if key in seen:
                continue
            seen.add(key)
            out.append(p)
    return out


def load_faculty(active_only: bool = True) -> pd.DataFrame:
    df = pd.read_csv(DATA / "faculty.csv")
    if active_only:
        df = df[df["active"].astype(str).str.lower().isin(["true", "1", "yes"])]
    return df.reset_index(drop=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--sleep", type=float, default=0.25)
    parser.add_argument("--skip-homepage", action="store_true")
    parser.add_argument("--skip-scholar", action="store_true")
    parser.add_argument("--ids", type=str, default="")
    args = parser.parse_args()

    ensure_dirs()
    INTEREST_CACHE.mkdir(parents=True, exist_ok=True)
    df = load_faculty()
    if args.ids:
        keep = {x.strip() for x in args.ids.split(",") if x.strip()}
        df = df[df["faculty_id"].isin(keep)]
    if args.limit:
        df = df.head(args.limit)

    key = "" if args.skip_scholar else api_key()
    results: dict[str, dict] = {}
    if OUT_JSON.exists():
        try:
            for row in json.loads(OUT_JSON.read_text(encoding="utf-8")):
                results[row["faculty_id"]] = row
        except json.JSONDecodeError:
            pass

    stats = {
        "scholar_ok": 0,
        "scholar_cached": 0,
        "homepage_hit": 0,
        "with_phrases": 0,
        "none": 0,
    }

    with httpx.Client() as client:
        for _, row in df.iterrows():
            fid = str(row["faculty_id"])
            homepage = str(row.get("homepage") or "").strip()
            scholar_id = str(row.get("google_scholar_id") or "").strip()
            if scholar_id.lower() in {"nan", "none"}:
                scholar_id = ""

            scholar_phrases: list[str] = []
            scholar_status = "skipped"
            if not args.skip_scholar and scholar_id:
                scholar_phrases, scholar_status = fetch_scholar_interests(
                    scholar_id, key, client, force=args.force
                )
                if scholar_status == "ok":
                    stats["scholar_ok"] += 1
                    time.sleep(args.sleep)
                elif scholar_status == "cached":
                    stats["scholar_cached"] += 1

            home_phrases: list[str] = []
            home_method = "skipped"
            home_fetch = "skipped"
            if not args.skip_homepage and homepage:
                html, home_fetch = fetch_homepage_html(homepage, force=args.force)
                if home_fetch == "ok":
                    time.sleep(min(0.15, args.sleep))
                home_phrases, home_method = extract_homepage_phrases(html)
                if home_phrases:
                    stats["homepage_hit"] += 1

            phrases = merge_phrases(scholar_phrases, home_phrases)
            if phrases:
                stats["with_phrases"] += 1
            else:
                stats["none"] += 1

            results[fid] = {
                "faculty_id": fid,
                "name": row["name"],
                "homepage": homepage,
                "google_scholar_id": scholar_id,
                "phrases": phrases,
                "scholar_phrases": scholar_phrases,
                "homepage_phrases": home_phrases,
                "scholar_status": scholar_status,
                "homepage_fetch": home_fetch,
                "homepage_method": home_method,
            }
            print(
                f"{fid}: scholar={scholar_status} home={home_fetch}/{home_method} -> {phrases[:5]}"
            )

    out = [results[fid] for fid in df["faculty_id"].tolist()]
    if not args.ids and not args.limit:
        out = sorted(results.values(), key=lambda r: r["faculty_id"])
    OUT_JSON.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT_JSON} ({len(out)} rows) stats={stats}")


if __name__ == "__main__":
    main()
