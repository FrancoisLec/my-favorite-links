# Support

Need help with **My Favorite Links**?

## Contact

- **Author:** Francois Lecompte
- **Email:** [lecomptefr@gmail.com](mailto:lecomptefr@gmail.com?subject=My%20Favorite%20Links%20support)
- **Bugs and ideas:** [open an issue on GitHub](https://github.com/FrancoisLec/my-favorite-links/issues/new/choose)

When you report a problem, please include:

1. The extension version (shown on the **About & support** page: popup → ⓘ).
2. Your Chrome version (`chrome://version`).
3. What you did, what you expected, and what happened, with a screenshot if possible.

## Common questions

**"Manifest file is missing or unreadable" when loading the extension**
Select the folder that directly contains `manifest.json`:
`Chrome Plug-in/my-favorite-links`, not the repository root or your Downloads folder.

**A site shows a globe instead of its icon**
Icons come from Chrome's own cache. Visit the site once and the icon will appear.

**My changes to the code don't show up**
Open `chrome://extensions` and click **↻ reload** on the My Favorite Links card, then reopen the popup.

**I updated or moved the extension and my links are gone**
Since version 1.0.2, the extension ID is permanent (`pbjnbclfppjfmhgjphdjgjommfhckcmp`), so this should not happen.
Check in `chrome://extensions` (Developer mode on) that the card shows this ID. With an older version, export your
links from the old card (**⬇ Export backup**) and import them into the new one (**⬆ Import backup**).

**Where are my links stored?**
In `chrome.storage.local`, inside your Chrome profile on this computer. They are not uploaded anywhere.
Removing the extension deletes them, so export a backup first.
