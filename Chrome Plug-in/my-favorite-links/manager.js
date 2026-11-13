import {
  loadData, saveData, newLink, ensureCategory, parseTags,
  domainOf, isValidUrl, matches, faviconUrl, el, DEFAULT_CATEGORY,
  setupFolderPicker, readFolderPicker
} from "./store.js";

const $ = id => document.getElementById(id);
const ALL = "__all__";

let data = { links: [], categories: [] };
let currentCat = ALL;
let selectedTags = new Set();
let editing = null;      // link being edited, or null when adding
let editingCat = null;   // category being renamed

// ---------- data ----------
async function reload() {
  data = await loadData();
  if (currentCat !== ALL && !data.categories.includes(currentCat)) currentCat = ALL;
  render();
}
async function persist() {
  await saveData(data);
  render();
}
// Re-render when the popup or context menu saves something.
chrome.storage.onChanged.addListener((_, area) => { if (area === "local") reload(); });

// ---------- rendering ----------
function render() {
  renderCats();
  renderTags();
  renderGrid();
}

function renderCats() {
  const counts = {};
  for (const l of data.links) counts[l.category] = (counts[l.category] || 0) + 1;

  const item = (key, label, count, editable) => {
    const row = el("div", {
      class: "cat" + (currentCat === key ? " active" : ""),
      onclick: () => { currentCat = key; selectedTags.clear(); render(); }
    },
      el("span", { class: "name" }, label),
      el("span", { class: "count" }, count),
      editable && el("button", {
        class: "edit", title: "Rename / delete",
        onclick: e => { e.stopPropagation(); openCatDialog(key); }
      }, "✎")
    );
    if (editable) addDropTarget(row, key);
    return row;
  };

  $("cats").replaceChildren(
    item(ALL, "All links", data.links.length, false),
    el("div", { class: "sep" }),
    ...data.categories.map(c => item(c, c, counts[c] || 0, true))
  );
}

function linksInView() {
  return currentCat === ALL ? data.links : data.links.filter(l => l.category === currentCat);
}

function renderTags() {
  const counts = new Map();
  for (const l of linksInView()) for (const t of l.tags) counts.set(t, (counts.get(t) || 0) + 1);
  for (const t of selectedTags) if (!counts.has(t)) selectedTags.delete(t);
  const tags = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  $("tagBar").replaceChildren(...tags.map(([t, n]) =>
    el("button", { class: "chip" + (selectedTags.has(t) ? " on" : ""), onclick: () => toggleTag(t) },
      "#" + t, el("span", { class: "count" }, n))
  ));
}

function toggleTag(t) {
  selectedTags.has(t) ? selectedTags.delete(t) : selectedTags.add(t);
  render();
}

function renderGrid() {
  const q = $("search").value;
  let list = linksInView()
    .filter(l => matches(l, q))
    .filter(l => [...selectedTags].every(t => l.tags.includes(t)));

  const sort = $("sort").value;
  if (sort === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "domain") list = [...list].sort((a, b) => domainOf(a.url).localeCompare(domainOf(b.url)));

  const label = currentCat === ALL ? "All links" : currentCat;
  const filt = [q && `“${q}”`, ...[...selectedTags].map(t => "#" + t)].filter(Boolean).join(" ");
  $("heading").textContent = `${label}${filt ? " · " + filt : ""} — ${list.length}`;

  $("grid").replaceChildren(...list.map(tile));
  const empty = $("empty");
  empty.hidden = list.length > 0;
  empty.textContent = data.links.length
    ? "Nothing matches these filters."
    : "No favorites yet. Click “+ Add link”, use the toolbar button, or right-click any page → Save to My Favorite Links.";
}

function tile(l) {
  const node = el("div", { class: "tile", draggable: "true", dataset: { id: l.id } },
    currentCat === ALL && el("span", { class: "t-cat" }, l.category),
    el("a", { href: l.url, title: l.url },
      el("div", { class: "icon" }, el("img", { src: faviconUrl(l.url, 64), alt: "" })),
      el("span", { class: "t-title" }, l.title),
      el("span", { class: "t-domain" }, domainOf(l.url))
    ),
    el("div", { class: "t-tags" }, l.tags.map(t =>
      el("button", { class: "chip" + (selectedTags.has(t) ? " on" : ""), onclick: () => toggleTag(t) }, "#" + t)
    )),
    el("button", { class: "t-edit", title: "Edit", onclick: () => openEditDialog(l) }, "✎")
  );
  node.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/x-fav-id", l.id);
    e.dataTransfer.effectAllowed = "move";
    node.classList.add("dragging");
  });
  node.addEventListener("dragend", () => node.classList.remove("dragging"));
  return node;
}

function addDropTarget(row, cat) {
  row.addEventListener("dragover", e => {
    if (e.dataTransfer.types.includes("text/x-fav-id")) { e.preventDefault(); row.classList.add("drop"); }
  });
  row.addEventListener("dragleave", () => row.classList.remove("drop"));
  row.addEventListener("drop", e => {
    e.preventDefault();
    row.classList.remove("drop");
    const link = data.links.find(l => l.id === e.dataTransfer.getData("text/x-fav-id"));
    if (link && link.category !== cat) { link.category = cat; persist(); }
  });
}

// ---------- link dialog ----------
function openEditDialog(link) {
  editing = link;
  $("editTitle").textContent = link ? "Edit link" : "Add link";
  $("eTitle").value = link?.title ?? "";
  $("eUrl").value = link?.url ?? "https://";
  setupFolderPicker($("eCategory"), $("eNewFolder"), data.categories,
    link?.category ?? (currentCat === ALL ? data.categories[0] : currentCat));
  $("eTags").value = link?.tags.join(", ") ?? "";
  $("eDelete").hidden = !link;
  $("editDlg").showModal();
  (link ? $("eTitle") : $("eUrl")).focus();
}

$("editForm").addEventListener("submit", e => {
  e.preventDefault();
  let url = $("eUrl").value.trim();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = "https://" + url;
  if (!isValidUrl(url)) { $("eUrl").setCustomValidity("Invalid URL"); $("eUrl").reportValidity(); return; }
  $("eUrl").setCustomValidity("");

  const fields = {
    url,
    title: $("eTitle").value.trim() || domainOf(url),
    category: ensureCategory(data, readFolderPicker($("eCategory"), $("eNewFolder"))),
    tags: parseTags($("eTags").value)
  };
  if (editing) Object.assign(editing, fields);
  else data.links.unshift(newLink(fields));
  $("editDlg").close();
  persist();
});

$("eUrl").addEventListener("input", () => $("eUrl").setCustomValidity(""));

$("eDelete").addEventListener("click", () => {
  if (!editing) return;
  data.links = data.links.filter(l => l.id !== editing.id);
  $("editDlg").close();
  persist();
});

// ---------- category dialog ----------
function openCatDialog(cat) {
  editingCat = cat;
  $("cName").value = cat;
  const n = data.links.filter(l => l.category === cat).length;
  const target = moveTargetFor(cat);
  $("cInfo").textContent = `${n} link(s). Deleting moves them to “${target}”.`;
  $("cDelete").hidden = data.categories.length <= 1;
  $("catDlg").showModal();
  $("cName").select();
}

function moveTargetFor(cat) {
  if (cat !== DEFAULT_CATEGORY) return DEFAULT_CATEGORY;
  return data.categories.find(c => c !== cat) || DEFAULT_CATEGORY;
}

$("catForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("cName").value.trim();
  if (!name || name === editingCat) { $("catDlg").close(); return; }
  const clash = data.categories.find(c => c.toLowerCase() === name.toLowerCase() && c !== editingCat);
  if (clash) {
    // Merge into the existing category.
    data.categories = data.categories.filter(c => c !== editingCat);
    data.links.forEach(l => { if (l.category === editingCat) l.category = clash; });
  } else {
    data.categories = data.categories.map(c => c === editingCat ? name : c);
    data.links.forEach(l => { if (l.category === editingCat) l.category = name; });
  }
  if (currentCat === editingCat) currentCat = clash || name;
  $("catDlg").close();
  persist();
});

$("cDelete").addEventListener("click", () => {
  const target = moveTargetFor(editingCat);
  data.categories = data.categories.filter(c => c !== editingCat);
  if (!data.categories.includes(target)) data.categories.unshift(target);
  data.links.forEach(l => { if (l.category === editingCat) l.category = target; });
  if (currentCat === editingCat) currentCat = ALL;
  $("catDlg").close();
  persist();
});

// ---------- misc wiring ----------
document.querySelectorAll("[data-close]").forEach(b =>
  b.addEventListener("click", () => b.closest("dialog").close()));

$("addCatForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("newCatName").value.trim();
  if (!name) return;
  currentCat = ensureCategory(data, name);
  $("newCatName").value = "";
  persist();
});

$("addLink").addEventListener("click", () => openEditDialog(null));
$("search").addEventListener("input", renderGrid);
$("sort").addEventListener("change", renderGrid);

document.addEventListener("keydown", e => {
  if (e.key === "/" && !e.target.closest("input, textarea, dialog")) {
    e.preventDefault();
    $("search").focus();
  }
  if (e.key === "Escape" && document.activeElement === $("search")) {
    $("search").value = "";
    renderGrid();
  }
});

// ---------- backup: export / import ----------
$("exportBtn").addEventListener("click", async () => {
  const { links = [], categories = [] } = await chrome.storage.local.get(["links", "categories"]);
  const backup = {
    app: "my-favorite-links",
    version: chrome.runtime.getManifest().version,
    exported: new Date().toISOString(),
    categories, links
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const a = el("a", { href: URL.createObjectURL(blob), download: `my-favorite-links-backup-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  $("backupStatus").textContent = `Exported ${links.length} link(s).`;
});

$("importBtn").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", async e => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    if (!Array.isArray(backup.links)) throw new Error("no links found");
    const ids = new Set(data.links.map(l => l.id));
    const urls = new Set(data.links.map(l => l.url));
    let added = 0;
    for (const c of backup.categories || []) ensureCategory(data, c);
    for (const l of backup.links) {
      if (!l || !l.url || urls.has(l.url)) continue;
      const link = {
        id: ids.has(l.id) || !l.id ? crypto.randomUUID() : l.id,
        url: l.url,
        title: l.title || domainOf(l.url),
        category: ensureCategory(data, l.category),
        tags: Array.isArray(l.tags) ? l.tags : [],
        created: l.created || Date.now()
      };
      data.links.push(link); ids.add(link.id); urls.add(link.url); added++;
    }
    await persist();
    $("backupStatus").textContent = `Imported ${added} new link(s)` + (backup.links.length - added ? `, skipped ${backup.links.length - added} already here.` : ".");
  } catch (err) {
    $("backupStatus").textContent = "Import failed: " + err.message;
  }
});

reload();
