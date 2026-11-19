#!/usr/bin/env python3
"""Build the standalone distributable ZIP of the admin UI.

Runs at container start so the download link always serves the current source.
"""

import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "download")
OUT_FILE = os.path.join(OUT_DIR, "snappshop-automation-ui.zip")

INCLUDE = ["index.html", "README.md", "assets"]
SKIP_DIRS = {"download", "__pycache__"}


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    tmp = OUT_FILE + ".tmp"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for entry in INCLUDE:
            path = os.path.join(ROOT, entry)
            if os.path.isfile(path):
                archive.write(path, entry)
                continue
            if not os.path.isdir(path):
                continue
            for dirpath, dirnames, filenames in os.walk(path):
                dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
                for filename in filenames:
                    if filename.endswith((".tmp", ".pyc")):
                        continue
                    full = os.path.join(dirpath, filename)
                    archive.write(full, os.path.relpath(full, ROOT))
    os.replace(tmp, OUT_FILE)
    size = os.path.getsize(OUT_FILE)
    print(f"built {OUT_FILE} ({size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
