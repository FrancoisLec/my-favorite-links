#!/usr/bin/env bash
# First-time setup: create the git repository, the GitHub issue templates,
# the v1.0.1 tag, the public GitHub repo FrancoisLec/my-favorite-links,
# and a GitHub Release with the packaged extension.
#
# Usage (from anywhere):  bash ~/MyApps/my-favorite-links/scripts/publish-to-github.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="FrancoisLec/my-favorite-links"
cd "$ROOT"
EXT="Chrome Plug-in/my-favorite-links"
VERSION="$(grep -oP '"version"\s*:\s*"\K[^"]+' "$EXT/manifest.json")"

say() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

# ---------- 1. tools ----------
command -v git >/dev/null || { echo "git is missing. Install it with:  sudo apt install git"; exit 1; }
command -v gh  >/dev/null || { echo "GitHub CLI (gh) is missing. Install it with:  sudo apt install gh   then run this script again."; exit 1; }

if ! gh auth status >/dev/null 2>&1; then
  say "Log in to GitHub (a browser window will open)"
  gh auth login --hostname github.com --git-protocol https --web
fi
gh auth setup-git >/dev/null

# ---------- 2. GitHub issue templates ----------
say "Creating .github issue templates"
mkdir -p .github/ISSUE_TEMPLATE
cat > .github/ISSUE_TEMPLATE/bug_report.md <<'EOF'
---
name: Bug report
about: Something isn't working in My Favorite Links
title: "[Bug] "
labels: bug
---

**What happened?**

**What did you expect?**

**Steps to reproduce**
1.
2.
3.

**Versions**
- Extension version (popup → ⓘ):
- Chrome version (`chrome://version`):
- OS:

**Screenshot** (optional)
EOF
cat > .github/ISSUE_TEMPLATE/feature_request.md <<'EOF'
---
name: Feature request
about: Suggest an idea for My Favorite Links
title: "[Idea] "
labels: enhancement
---

**What would you like to be able to do?**

**Why would it help?**

**Anything else?** (mockups, examples from other tools…)
EOF
cat > .github/ISSUE_TEMPLATE/config.yml <<'EOF'
blank_issues_enabled: true
contact_links:
  - name: Email support
    url: mailto:lecomptefr@gmail.com
    about: Contact Francois Lecompte directly.
EOF

# ---------- 3. git repository ----------
if [ ! -d .git ]; then
  say "Creating the git repository"
  git init -q -b main
fi
git config user.name  "Francois Lecompte"
git config user.email "lecomptefr@gmail.com"
chmod +x scripts/*.sh

git add -A
if ! git rev-parse --verify -q HEAD >/dev/null; then
  say "First commit"
  git commit -q -F - <<EOF
My Favorite Links $VERSION

Chrome extension (Manifest V3) to save, organize, tag and search
favorite links: popup, right-click save, folder sidebar, tag filters,
tile grid manager and About & support page.

Project files: README, CHANGELOG, MIT LICENSE, SUPPORT, issue
templates and packaging scripts.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012aZ2HrZ3cnFoLvKcvAvTWw
EOF
elif ! git diff --cached --quiet; then
  git commit -q -m "Update project files"
fi
git rev-parse -q --verify "refs/tags/v$VERSION" >/dev/null || git tag -a "v$VERSION" -m "My Favorite Links $VERSION"

# ---------- 4. GitHub repository ----------
if gh repo view "$REPO" >/dev/null 2>&1; then
  say "GitHub repo $REPO already exists — pushing"
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$REPO.git"
  git push -u origin main
else
  say "Creating public GitHub repo $REPO"
  gh repo create "$REPO" --public \
    --description "Chrome extension to save, organize, tag and search your favorite links." \
    --source . --remote origin --push
fi
git push origin --tags

# ---------- 5. GitHub Release ----------
bash scripts/package.sh
ZIP="dist/my-favorite-links-$VERSION.zip"
if ! gh release view "v$VERSION" --repo "$REPO" >/dev/null 2>&1; then
  say "Creating GitHub Release v$VERSION"
  NOTES="$(awk "/^## \\[$VERSION\\]/{f=1;next} /^## \\[/{f=0} /^\\[/{f=0} f" CHANGELOG.md)"
  gh release create "v$VERSION" "$ZIP" --repo "$REPO" \
    --title "My Favorite Links $VERSION" --notes "$NOTES"
fi

say "Done!  https://github.com/$REPO"
