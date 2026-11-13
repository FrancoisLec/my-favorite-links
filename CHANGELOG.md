# Changelog

All notable changes to **My Favorite Links** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/FrancoisLec/my-favorite-links/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/FrancoisLec/my-favorite-links/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/FrancoisLec/my-favorite-links/releases/tag/v1.0.1
