#!/bin/sh
# Build the downloadable plugin package served at /yagent-ai.zip.
#
# Built from the WORKING TREE (not `git archive HEAD`) so uncommitted edits are
# included. Sandbox-only files — this directory, AGENTS.md, the Base44 compose
# file and `.gitignore` — stay out of the package, which is why the plugin tree
# inside the zip stays exactly what WordPress installs.
set -eu
cd "$(dirname "$0")/.."
mkdir -p .base44/download
python3 - <<'PY'
import os
import zipfile

ROOT = os.path.abspath('.')
SKIP_DIRS = {'.git', 'node_modules', '.base44'}
SKIP_TOP_FILES = {'AGENTS.md', 'docker-compose.base44.yml', '.gitignore'}
TARGET = os.path.join(ROOT, '.base44/download/yagent-ai.zip')

count = 0
with zipfile.ZipFile(TARGET, 'w', zipfile.ZIP_DEFLATED) as archive:
    for base, dirs, files in os.walk(ROOT):
        rel = os.path.relpath(base, ROOT)
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
        for name in sorted(files):
            if rel == '.' and name in SKIP_TOP_FILES:
                continue
            entry = os.path.join('yagent-ai', '' if rel == '.' else rel, name)
            archive.write(os.path.join(base, name), entry.replace(os.sep, '/'))
            count += 1
print(f'packaged {count} files -> {TARGET}')
PY
ls -lh .base44/download/yagent-ai.zip
