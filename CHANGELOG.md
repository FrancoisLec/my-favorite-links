# Changelog

All notable changes to **My Favorite Links** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.0] - 2026-11-13

### Added
- **Sync across computers**: links, folders and tags are now saved in Chrome Sync storage.
  They follow you to every computer where you are signed in to Chrome (with sync on) and have the extension installed.
- The manager sidebar shows how much of the ~100 KB Chrome Sync space is used (about 200 bytes per link).
- Changes made on another computer appear in the open manager automatically.
- **★ Favorites** section at the top of the sidebar. Star a link with ☆ on its card or row, with the checkbox in the
  popup or edit window, or by dragging it onto *Favorites*. Starred links stay in their folder and also show in Favorites.
  In the popup, favorites are listed first.
- **Cards / List** switch in the manager toolbar. The list view shows icon, title, site, folder and tags in rows.
  The choice is remembered on each computer.
- *Z → A* sort option.
- Simpler popup: it opens on the search and your links. Click **+ Add link** (or **✎ Edit this link** when the page
  is already saved) to show the form with **Save** / **Cancel**. Press <kbd>Esc</kbd> to close the form.
- Export and Import buttons are now side by side in the manager sidebar.

### Changed
- Existing links from version 1.0.2 and earlier are moved to sync storage automatically the first time you open
  the new version. The old local copy is kept as a safety backup.
- Folders and links are now in **alphabetical order** everywhere (sidebar, folder lists, manager, popup), ignoring
  upper/lower case and accents. *A → Z* is the default sort in the manager.
- New links default to the *General* folder when it exists.

## [1.0.2] - 2026-11-13

### Changed
- The extension now has a **permanent ID** (`pbjnbclfppjfmhgjphdjgjommfhckcmp`), set by a `key` in `manifest.json`.
  Updating the files, moving the folder or reinstalling no longer creates a "new" extension, so your links are kept.

### Added
- **Export / Import backup** buttons in the manager sidebar.

## [1.0.1] - 2026-11-13

First tracked release.

### Added
- Toolbar popup to save or update the current page with a title, folder and tags.
- Keyboard shortcut <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Y</kbd> to open the popup.
- Right-click menu items: *Save link to My Favorite Links* and *Save this page to My Favorite Links*.
- Full manager page with a tile grid showing site icons (favicons).
- Folders: create, rename, merge, delete (links move to *General*), and drag tiles onto a folder.
- Tags with a clickable tag bar; multiple tags can be combined as filters.
- Instant search across title, URL, folder and tags (press <kbd>/</kbd> in the manager).
- Sorting by newest, A → Z or domain.
- About & support page with version, contact and links.
- Automatic light and dark theme.

### Changed
- Renamed the extension from *Favorite Links* to **My Favorite Links**.
- "Category" is now called **Folder** everywhere.
- The Folder field is now a dropdown that lists every folder, with a **+ New folder…** option.

### Fixed
- URLs typed without `https://` are now accepted, and the prefix is added automatically.
- The folder list no longer shows only the currently selected folder.

[Unreleased]: https://github.com/FrancoisLec/my-favorite-links/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/FrancoisLec/my-favorite-links/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/FrancoisLec/my-favorite-links/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/FrancoisLec/my-favorite-links/releases/tag/v1.0.1
