// Show the version from manifest.json and put it in the support email subject.
const version = chrome.runtime.getManifest().version;
document.getElementById("version").textContent = version;
for (const a of document.querySelectorAll('a[href^="mailto:"]')) {
  a.href = `mailto:lecomptefr@gmail.com?subject=${encodeURIComponent(`My Favorite Links ${version} — support`)}`;
}
