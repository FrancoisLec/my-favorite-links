#!/usr/bin/env bash
# Commit everything, tag the version found in manifest.json, push to GitHub
# and create a GitHub Release with the packaged zip and the CHANGELOG notes.
#
# Usage:  bash ~/MyApps/my-favorite-links/scripts/release.sh ["commit message"]
#
# Before running: update "version" in manifest.json and add a section for it
# at the top of CHANGELOG.md.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REPO="FrancoisLec/my-favorite-links"
VERSION="$(grep -oP '"version"\s*:\s*"\K[^"]+' "Chrome Plug-in/my-favorite-links/manifest.json")"
MSG="${1:-Version $VERSION}"

say() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

command -v gh >/dev/null || { echo "GitHub CLI (gh) is missing:  sudo apt install gh"; exit 1; }
gh auth status >/dev/null 2>&1 || gh auth login --hostname github.com --git-protocol https --web

if ! grep -q "^## \[$VERSION\]" CHANGELOG.md; then
  echo "CHANGELOG.md has no section for $VERSION. Add '## [$VERSION] - $(date +%F)' first."; exit 1
fi

say "Committing"
git add -A
if git diff --cached --quiet; then echo "Nothing new to commit."; else git commit -q -m "$MSG"; git log --oneline -1; fi

if git rev-parse -q --verify "refs/tags/v$VERSION" >/dev/null; then
  say "Tag v$VERSION already exists: pushing commits only"
  git push
  echo "To publish a new release, raise the version in manifest.json first."
  exit 0
fi

say "Tagging v$VERSION and pushing"
git tag -a "v$VERSION" -m "My Favorite Links $VERSION"
git push --follow-tags

say "Creating GitHub Release v$VERSION"
bash scripts/package.sh
NOTES="$(awk "/^## \\[$VERSION\\]/{f=1;next} /^## \\[/{f=0} /^\\[/{f=0} f" CHANGELOG.md)"
gh release create "v$VERSION" "dist/my-favorite-links-$VERSION.zip" --repo "$REPO" \
  --title "My Favorite Links $VERSION" --notes "$NOTES"

say "Done!  https://github.com/$REPO/releases/tag/v$VERSION"
