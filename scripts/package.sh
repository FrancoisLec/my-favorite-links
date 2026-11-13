#!/usr/bin/env bash
# Build dist/my-favorite-links-<version>.zip from the extension folder.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT="$ROOT/Chrome Plug-in/my-favorite-links"
VERSION="$(grep -oP '"version"\s*:\s*"\K[^"]+' "$EXT/manifest.json")"
OUT="$ROOT/dist/my-favorite-links-$VERSION.zip"

mkdir -p "$ROOT/dist"
rm -f "$OUT"
(cd "$EXT" && zip -rq "$OUT" . -x '*.DS_Store')
echo "Built $OUT"
