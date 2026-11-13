import {
  loadData, saveData, newLink, ensureCategory, parseTags,
  domainOf, isValidUrl, matches, faviconUrl, el,
  setupFolderPicker, readFolderPicker
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
  fillCategories(existing?.category ?? data.categories[0]);
  setMode();

  renderResults();
  (existing ? $("search") : $("tags")).focus();
}

function fillCategories(selected) {
  setupFolderPicker($("category"), $("newFolder"), data.categories, selected);
}

function setMode() {
  $("saveBtn").textContent = existing ? "Update" : "Save";
  $("removeBtn").hidden = !existing;
  status(existing ? "Already in your favorites" : "");
}

function status(msg) { $("status").textContent = msg; }

$("saveForm").addEventListener("submit", async e => {
  e.preventDefault();
  const url = $("url").value.trim();
  if (!isValidUrl(url)) { status("Invalid URL"); return; }

  const category = ensureCategory(data, readFolderPicker($("category"), $("newFolder")));
  const fields = { url, title: $("title").value.trim() || domainOf(url), category, tags: parseTags($("tags").value) };

  if (existing) Object.assign(existing, fields);
  else {
    existing = newLink(fields);
    data.links.unshift(existing);
  }
  await saveData(data);
  fillCategories(category);
  setMode();
  status("Saved ✓");
  renderResults();
});

$("removeBtn").addEventListener("click", async () => {
  if (!existing) return;
  data.links = data.links.filter(l => l.id !== existing.id);
  existing = null;
  await saveData(data);
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
  const list = data.links.filter(l => matches(l, q)).slice(0, 12);
  const items = list.map(l => el("li", {},
    el("a", {
      href: l.url,
      title: l.url,
      onclick: e => { e.preventDefault(); chrome.tabs.create({ url: l.url }); window.close(); }
    },
      el("img", { class: "fav", src: faviconUrl(l.url, 32), alt: "" }),
      el("span", { class: "r-title" }, l.title),
      el("span", { class: "r-domain" }, domainOf(l.url))
    )
  ));
  $("results").replaceChildren(...(items.length ? items
    : [el("li", { class: "empty" }, data.links.length ? "No match." : "No favorites yet — save this page above.")]));
}

init();
