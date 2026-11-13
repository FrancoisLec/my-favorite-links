# ★ My Favorite Links

A lightweight Chrome extension to **save, organize, tag and search** your favorite web links.

![version](https://img.shields.io/badge/version-1.0.1-blue) ![manifest](https://img.shields.io/badge/Chrome-Manifest%20V3-brightgreen) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

## Features

- **Quick save popup**: one click (or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Y</kbd>) saves the current page with a folder and tags.
- **Right-click to save**: right-click any page or link and choose *Save to My Favorite Links*.
- **Folders**: create, rename, delete, and drag tiles between folders.
- **Tags and search**: tag links, filter by one or more tags, and search instantly by title, URL, folder or tag. Press <kbd>/</kbd> to search.
- **Tile grid**: a visual start page that shows each site's icon.
- **Light and dark mode**: follows your system theme.
- **Private**: your links stay in your own Chrome profile and nothing is sent anywhere.

## Installation (developer mode)

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the folder **`Chrome Plug-in/my-favorite-links`**, the one that contains `manifest.json`.
5. Pin the ★ icon from the puzzle-piece menu.

To update, pull or replace the files, then click **↻ reload** on the extension card in `chrome://extensions`.

## Usage

| Action | How |
|---|---|
| Save or update current page | ★ button or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Y</kbd> |
| Save a link without opening it | Right-click the link → *Save link to My Favorite Links* |
| Open the full manager | Popup → **Open all ↗** (or right-click the ★ icon → *Options*) |
| Search | Type in the search box (press <kbd>/</kbd> in the manager) |
| Move a link to another folder | Drag its tile onto the folder in the sidebar |
| Edit or delete a link | Hover a tile → ✎ |
| About and support | Popup → ⓘ, or the manager sidebar → *About & support* |

## Project structure

```
my-favorite-links/
├── Chrome Plug-in/
│   └── my-favorite-links/      ← the extension (load this folder in Chrome)
│       ├── manifest.json       ← name, version, permissions
│       ├── background.js       ← right-click menus
│       ├── store.js            ← shared data layer (chrome.storage.local)
│       ├── popup.html / .js    ← toolbar popup
│       ├── manager.html/.js/.css ← full manager (tile grid)
│       ├── about.html / .js    ← about & support page
│       ├── common.css          ← shared styles and theme
│       └── icons/
├── scripts/
│   ├── package.sh              ← builds dist/my-favorite-links-<version>.zip
│   └── publish-to-github.sh    ← first-time git + GitHub setup and release
├── .github/ISSUE_TEMPLATE/     ← bug report and feature request forms
├── CHANGELOG.md
├── SUPPORT.md
├── LICENSE
└── README.md
```

## Permissions

| Permission | Why |
|---|---|
| `storage` | Save your links and folders locally |
| `activeTab` | Read the title and URL of the page you are saving |
| `contextMenus` | Add the right-click *Save to My Favorite Links* items |
| `favicon` | Show site icons from Chrome's own icon cache |

## Releasing a new version

1. Update `"version"` in `Chrome Plug-in/my-favorite-links/manifest.json`.
2. Add an entry at the top of `CHANGELOG.md`.
3. Run `./scripts/package.sh` to build the zip in `dist/`.
4. Commit, tag (`git tag v1.0.2`) and push (`git push --follow-tags`).

## Support

Francois Lecompte · [lecomptefr@gmail.com](mailto:lecomptefr@gmail.com) · see [SUPPORT.md](SUPPORT.md)

## License

[MIT](LICENSE) © 2026 Francois Lecompte
