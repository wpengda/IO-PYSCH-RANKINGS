"""Run fetch + score end-to-end."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def run(script: str, extra: list[str] | None = None) -> None:
    cmd = [sys.executable, str(HERE / script), *(extra or [])]
    print(">", " ".join(cmd))
    subprocess.check_call(cmd, cwd=str(HERE))


def main() -> None:
    run("extract_profile_ids.py")
    run("fetch_scholar.py")
    run("score.py")


if __name__ == "__main__":
    main()
