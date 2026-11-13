import {
  loadData, saveData, newLink, ensureCategory, parseTags,
  domainOf, isValidUrl, matches, faviconUrl, el, DEFAULT_CATEGORY,
  setupFolderPicker, readFolderPicker, bytesInUse, SYNC_QUOTA, byName, byTitle
} from "./store.js";

const $ = id => document.getElementById(id);
const ALL = "__all__";
const FAV = "__fav__";

// Per-computer display preferences (card/list view).
const pref = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};
let view = pref.get("view", "cards");

let data = { links: [], categories: [] };
let currentCat = ALL;
let selectedTags = new Set();
let editing = null;      // link being edited, or null when adding
let editingCat = null;   // category being renamed

// ---------- data ----------
async function reload() {
  data = await loadData();
  if (currentCat !== ALL && currentCat !== FAV && !data.categories.includes(currentCat)) currentCat = ALL;
  render();
  showUsage();
}
async function persist() {
  try {
    await saveData(data);
    $("backupStatus").textContent = "";
  } catch (err) {
    // Usually the ~100 KB Chrome Sync limit.
    $("backupStatus").textContent = "Could not save: " + err.message;
    await reload();
    return;
  }
  render();
  showUsage();
}
async function showUsage() {
  const used = await bytesInUse();
  $("syncInfo").textContent = `Synced with your Chrome account · ${Math.ceil(used / 1024)} KB of ${Math.round(SYNC_QUOTA / 1024)} KB used`;
}
// Re-render when the popup, the right-click menu or another computer changes something.
chrome.storage.onChanged.addListener((_, area) => { if (area === "sync") reload(); });

// ---------- rendering ----------
function render() {
  renderCats();
  renderTags();
  renderGrid();
}

function renderCats() {
  const counts = {};
  for (const l of data.links) counts[l.category] = (counts[l.category] || 0) + 1;

  const item = (key, label, count, editable, extra = "") => {
    const row = el("div", {
      class: "cat" + (currentCat === key ? " active" : "") + extra,
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

  const favRow = item(FAV, "Favorites", data.links.filter(l => l.fav).length, false, " favorites");
  addFavDropTarget(favRow);
  $("cats").replaceChildren(
    favRow,
    item(ALL, "All links", data.links.length, false),
    el("div", { class: "sep" }),
    ...[...data.categories].sort(byName).map(c => item(c, c, counts[c] || 0, true))
  );
}

function linksInView() {
  if (currentCat === ALL) return data.links;
  if (currentCat === FAV) return data.links.filter(l => l.fav);
  return data.links.filter(l => l.category === currentCat);
}

function renderTags() {
  const counts = new Map();
  for (const l of linksInView()) for (const t of l.tags) counts.set(t, (counts.get(t) || 0) + 1);
  for (const t of selectedTags) if (!counts.has(t)) selectedTags.delete(t);
  const tags = [...counts].sort((a, b) => byName(a[0], b[0]));
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
  list = [...list].sort(byTitle);
  if (sort === "za") list.reverse();
  if (sort === "new") list.sort((a, b) => b.created - a.created);
  if (sort === "domain") list.sort((a, b) => byName(domainOf(a.url), domainOf(b.url)) || byTitle(a, b));

  const label = currentCat === ALL ? "All links" : currentCat === FAV ? "★ Favorites" : currentCat;
  const filt = [q && `“${q}”`, ...[...selectedTags].map(t => "#" + t)].filter(Boolean).join(" ");
  $("heading").textContent = `${label}${filt ? " · " + filt : ""} — ${list.length}`;

  $("grid").className = "grid" + (view === "list" ? " list" : "");
  $("grid").replaceChildren(...list.map(view === "list" ? listRow : tile));
  $("grid").hidden = list.length === 0;
  for (const b of document.querySelectorAll(".seg [data-view]")) b.classList.toggle("on", b.dataset.view === view);
  const empty = $("empty");
  empty.hidden = list.length > 0;
  empty.textContent =
    !data.links.length ? "No links yet. Click “+ Add link”, use the toolbar button, or right-click any page → Save to My Favorite Links."
    : currentCat === FAV && !q && !selectedTags.size ? "No favorites yet. Click the ☆ on any link to add it here."
    : "Nothing matches these filters.";
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
    starButton(l),
    el("button", { class: "t-edit", title: "Edit", onclick: () => openEditDialog(l) }, "✎")
  );
  return makeDraggable(node, l);
}

function listRow(l) {
  const node = el("div", { class: "lrow", draggable: "true", dataset: { id: l.id } },
    el("img", { class: "fav", src: faviconUrl(l.url, 32), alt: "" }),
    el("a", { class: "r-title", href: l.url, title: l.url }, l.title),
    el("span", { class: "r-domain", title: l.url }, domainOf(l.url)),
    el("span", { class: "r-folder" }, l.category),
    el("div", { class: "r-tags" }, l.tags.map(t =>
      el("button", { class: "chip" + (selectedTags.has(t) ? " on" : ""), onclick: () => toggleTag(t) }, "#" + t)
    )),
    el("div", { class: "r-actions" },
      starButton(l),
      el("button", { class: "r-edit", title: "Edit", onclick: () => openEditDialog(l) }, "✎")
    )
  );
  return makeDraggable(node, l);
}

function starButton(l) {
  return el("button", {
    class: "star-btn" + (l.fav ? " on" : ""),
    title: l.fav ? "Remove from Favorites" : "Add to Favorites",
    "aria-pressed": l.fav ? "true" : "false",
    onclick: e => { e.preventDefault(); e.stopPropagation(); l.fav = !l.fav; persist(); }
  }, l.fav ? "★" : "☆");
}

function makeDraggable(node, l) {
  node.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/x-fav-id", l.id);
    e.dataTransfer.effectAllowed = "move";
    node.classList.add("dragging");
  });
  node.addEventListener("dragend", () => node.classList.remove("dragging"));
  return node;
}

// Dropping a link on "Favorites" stars it (it stays in its folder).
function addFavDropTarget(row) {
  row.addEventListener("dragover", e => {
    if (e.dataTransfer.types.includes("text/x-fav-id")) { e.preventDefault(); row.classList.add("drop"); }
  });
  row.addEventListener("dragleave", () => row.classList.remove("drop"));
  row.addEventListener("drop", e => {
    e.preventDefault();
    row.classList.remove("drop");
    const link = data.links.find(l => l.id === e.dataTransfer.getData("text/x-fav-id"));
    if (link && !link.fav) { link.fav = true; persist(); }
  });
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
  const folders = [...data.categories].sort(byName);
  const defaultFolder = data.categories.includes(currentCat) ? currentCat
    : (folders.includes(DEFAULT_CATEGORY) ? DEFAULT_CATEGORY : folders[0]);
  setupFolderPicker($("eCategory"), $("eNewFolder"), folders, link?.category ?? defaultFolder);
  $("eTags").value = link?.tags.join(", ") ?? "";
  $("eFav").checked = link ? !!link.fav : currentCat === FAV;
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
    tags: parseTags($("eTags").value),
    fav: $("eFav").checked
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
$("sort").value = pref.get("sort", "az");
$("sort").addEventListener("change", () => { pref.set("sort", $("sort").value); renderGrid(); });
for (const b of document.querySelectorAll(".seg [data-view]")) {
  b.addEventListener("click", () => { view = b.dataset.view; pref.set("view", view); renderGrid(); });
}

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
  const { links, categories } = await loadData();
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
        created: l.created || Date.now(),
        fav: !!l.fav
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
