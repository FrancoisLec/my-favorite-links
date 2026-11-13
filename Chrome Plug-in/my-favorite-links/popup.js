import {
  loadData, saveData, newLink, ensureCategory, parseTags,
  domainOf, isValidUrl, matches, faviconUrl, el,
  setupFolderPicker, readFolderPicker, defaultFolder
} from "./store.js";

const $ = id => document.getElementById(id);
let data;
let existing = null;

async function init() {
  data = await loadData();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || "";

  existing = data.links.find(l => l.url === url) || null;
  $("url").value = existing?.url ?? url;
  $("title").value = existing?.title ?? tab?.title ?? "";
  $("tags").value = existing ? existing.tags.join(", ") : "";
  $("fav").checked = !!existing?.fav;
  fillCategories(existing?.category ?? defaultFolder(data));
  setMode();

  renderResults();
  $("search").focus();
}

// The add/edit form is hidden until "+ Add link" (or "✎ Edit this link") is clicked.
function showForm(show) {
  $("saveForm").hidden = !show;
  $("addBar").hidden = show;
  $("formMsg").textContent = "";
  if (show) {
    status("");
    ($("title").value ? $("tags") : $("title")).focus();
  } else {
    $("search").focus();
  }
}

function fillCategories(selected) {
  setupFolderPicker($("category"), $("newFolder"), data.categories, selected);
}

function setMode() {
  $("saveBtn").textContent = existing ? "Update" : "Save";
  $("removeBtn").hidden = !existing;
  $("addToggle").textContent = existing ? "✎ Edit this link" : "+ Add link";
  status(existing ? (existing.fav ? "★ Saved in Favorites" : "✓ This page is saved") : "");
}

$("addToggle").addEventListener("click", () => showForm(true));
$("cancelBtn").addEventListener("click", () => showForm(false));
$("saveForm").addEventListener("keydown", e => {
  if (e.key === "Escape") { e.preventDefault(); showForm(false); }
});

function status(msg) { $("status").textContent = msg; }

$("saveForm").addEventListener("submit", async e => {
  e.preventDefault();
  const url = $("url").value.trim();
  if (!isValidUrl(url)) { $("formMsg").textContent = "Invalid URL"; return; }

  const category = ensureCategory(data, readFolderPicker($("category"), $("newFolder")));
  const fields = { url, title: $("title").value.trim() || domainOf(url), category, tags: parseTags($("tags").value), fav: $("fav").checked };

  const isNew = !existing;
  if (existing) Object.assign(existing, fields);
  else {
    existing = newLink(fields);
    data.links.unshift(existing);
  }
  try {
    await saveData(data);
  } catch (err) {
    if (isNew) { data.links.shift(); existing = null; }
    $("formMsg").textContent = "Not saved: " + err.message;
    return;
  }
  fillCategories(category);
  showForm(false);
  setMode();
  status("Saved ✓");
  renderResults();
});

$("removeBtn").addEventListener("click", async () => {
  if (!existing) return;
  data.links = data.links.filter(l => l.id !== existing.id);
  existing = null;
  await saveData(data);
  showForm(false);
  setMode();
  status("Removed");
  renderResults();
});

$("openManager").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("manager.html") });
  window.close();
});

$("openAbout").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("about.html") });
  window.close();
});

$("search").addEventListener("input", renderResults);
$("search").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const first = $("results").querySelector("a");
    if (first) first.click();
  }
});

function renderResults() {
  const q = $("search").value;
  // Favorites first, then the rest; both already in alphabetical order.
  const found = data.links.filter(l => matches(l, q));
  const list = [...found.filter(l => l.fav), ...found.filter(l => !l.fav)].slice(0, 12);
  const items = list.map(l => el("li", {},
    el("a", {
      href: l.url,
      title: l.url,
      onclick: e => { e.preventDefault(); chrome.tabs.create({ url: l.url }); window.close(); }
    },
      el("img", { class: "fav", src: faviconUrl(l.url, 32), alt: "" }),
      el("span", { class: "r-title" }, l.title),
      l.fav && el("span", { class: "r-star", title: "Favorite" }, "★"),
      el("span", { class: "r-domain" }, domainOf(l.url))
    )
  ));
  $("results").replaceChildren(...(items.length ? items
    : [el("li", { class: "empty" }, data.links.length ? "No match." : "No links yet — save this page above.")]));
}

init();
