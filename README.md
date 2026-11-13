# ★ My Favorite Links

A lightweight Chrome extension to **save, organize, tag and search** your favorite web links.

![version](https://img.shields.io/badge/version-1.1.0-blue) ![manifest](https://img.shields.io/badge/Chrome-Manifest%20V3-brightgreen) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

## Features

- **Quick save popup**: one click (or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Y</kbd>) saves the current page with a folder and tags.
- **Right-click to save**: right-click any page or link and choose *Save to My Favorite Links*.
- **Folders**: create, rename, delete, and drag tiles between folders.
- **Tags and search**: tag links, filter by one or more tags, and search instantly by title, URL, folder or tag. Press <kbd>/</kbd> to search.
- **★ Favorites**: star your most-used links to show them in a Favorites section at the top of the sidebar.
- **Cards or list**: switch between a visual tile grid and a compact list.
- **Alphabetical order**: folders and links are always sorted A → Z.
- **Backup**: export all links to a JSON file and import them back, for example on another computer.
- **Light and dark mode**: follows your system theme.
- **Synced across your computers**: links, folders and tags follow you through your Chrome account (Chrome Sync).
- **Private**: nothing is sent anywhere except Chrome's own sync to your Google account.

## Installation (developer mode)

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the folder **`Chrome Plug-in/my-favorite-links`**, the one that contains `manifest.json`.
5. Pin the ★ icon from the puzzle-piece menu.

## Updating (your links are kept)

The extension has a **permanent ID**: `pbjnbclfppjfmhgjphdjgjommfhckcmp`.
Chrome keeps your links under this ID, so an update never creates a "new" extension.

1. Get the new files: `git pull`, or replace the files in the same folder.
2. In `chrome://extensions`, click **↻ reload** on the My Favorite Links card.

Your links stay even if you move the folder. In that case, click **Remove** and then **Load unpacked** from the new location.
Never change or delete the `"key"` line in `manifest.json`, because it is what keeps the ID permanent.
Using **⬇ Export backup** from time to time is still a good idea.

## Usage

| Action | How |
|---|---|
| Save or update current page | ★ button or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Y</kbd> |
| Save a link without opening it | Right-click the link → *Save link to My Favorite Links* |
| Open the full manager | Popup → **Open all ↗** (or right-click the ★ icon → *Options*) |
| Search | Type in the search box (press <kbd>/</kbd> in the manager) |
| Move a link to another folder | Drag its tile onto the folder in the sidebar |
| Edit or delete a link | Hover a tile → ✎ |
| Add or remove a favorite | Click ☆/★ on a card or row, or drag it onto *★ Favorites* |
| Switch between cards and list | Toolbar → **▦ Cards** / **☰ List** |
| Back up or restore links | Manager sidebar → **⬇ Export backup** / **⬆ Import backup** |
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
│   ├── publish-to-github.sh    ← first-time git + GitHub setup
│   └── release.sh              ← commit, tag, push and publish a release
├── .github/ISSUE_TEMPLATE/     ← bug report and feature request forms
├── CHANGELOG.md
├── SUPPORT.md
├── LICENSE
└── README.md
```

## Syncing between computers

Your links are stored in **Chrome Sync storage**, so they appear on every computer where:

1. you are signed in to Chrome with **sync turned on**, with *Extensions* included in what is synced
   (Chrome → Settings → *You and Google* → *Sync and Google services* → *Manage what you sync*), and
2. My Favorite Links is installed. Use **Load unpacked** on each computer; the permanent ID makes them the same extension.

Limits: Chrome Sync allows about **100 KB**, which is roughly 400 or more links. The manager sidebar shows the space used.
The extension does not work on Chrome for Android or iPhone, because mobile Chrome does not support extensions.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Save your links, folders and tags in Chrome Sync storage |
| `activeTab` | Read the title and URL of the page you are saving |
| `contextMenus` | Add the right-click *Save to My Favorite Links* items |
| `favicon` | Show site icons from Chrome's own icon cache |

## Releasing a new version

1. Update `"version"` in `Chrome Plug-in/my-favorite-links/manifest.json`.
2. Add a `## [x.y.z] - date` section at the top of `CHANGELOG.md`.
3. Run:
   ```bash
   bash scripts/release.sh "Version x.y.z: short summary"
   ```
   This commits everything, tags `vx.y.z`, pushes to GitHub and creates the GitHub Release with the zip and the changelog notes.
   To push small changes without a new release, run the same command. If the tag already exists, it only commits and pushes.

## Support

Francois Lecompte · [lecomptefr@gmail.com](mailto:lecomptefr@gmail.com) · see [SUPPORT.md](SUPPORT.md)

## License

[MIT](LICENSE) © 2026 Francois Lecompte
