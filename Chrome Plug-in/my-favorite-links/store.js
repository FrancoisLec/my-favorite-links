// Shared data layer for popup, manager and background.
//
// Data lives in chrome.storage.sync, so it follows the user to every computer
// where they are signed in to Chrome with sync on (same extension ID thanks to
// the "key" in manifest.json). Sync storage limits: ~100 KB total, 8 KB per item,
// 512 items — so each link is stored as its own small item:
//   "folders"   → ["General", "Xerox", ...]
//   "l:<id>"    → { u: url, t: title, c: folder, g: [tags], d: created, f: 1 if favorite }
//
// In memory (what popup/manager use) the shape is unchanged:
//   { links: [{ id, url, title, category, tags, created, fav }], categories: [...] }
// Folders and links are kept in alphabetical order.

export const DEFAULT_CATEGORY = "General";
const LINK_PREFIX = "l:";
export const SYNC_QUOTA = chrome.storage.sync.QUOTA_BYTES || 102400;

// Alphabetical, ignoring case and accents ("école" next to "Ecole"), numbers in natural order.
export const byName = (a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base", numeric: true });
export const byTitle = (a, b) => byName(a.title, b.title) || byName(a.url, b.url);

export async function loadData() {
  await migrateLocalToSync();
  return readSync();
}

async function readSync() {
  const all = await chrome.storage.sync.get(null);
  const links = [];
  for (const [k, v] of Object.entries(all)) {
    if (!k.startsWith(LINK_PREFIX) || !v) continue;
    links.push({
      id: k.slice(LINK_PREFIX.length),
      url: v.u, title: v.t || "", category: v.c || DEFAULT_CATEGORY,
      tags: Array.isArray(v.g) ? v.g : [], created: v.d || 0, fav: !!v.f
    });
  }
  links.sort(byTitle);
  loadedIds = new Set(links.map(l => l.id));
  const categories = Array.isArray(all.folders) && all.folders.length ? [...all.folders] : [DEFAULT_CATEGORY];
  for (const l of links) if (!categories.includes(l.category)) categories.push(l.category);
  categories.sort(byName);
  return { links, categories };
}

// Ids this page saw at its last load. Only these can be deleted by saveData,
// so a link just added on another computer is never wiped by a stale page.
let loadedIds = new Set();

// Writes only what changed and removes links this page deleted.
export async function saveData({ links, categories }) {
  const current = await chrome.storage.sync.get(null);
  const toSet = {};
  const ids = new Set(links.map(l => l.id));
  categories = [...categories].sort(byName);
  if (JSON.stringify(current.folders) !== JSON.stringify(categories)) toSet.folders = categories;
  for (const l of links) {
    const key = LINK_PREFIX + l.id;
    const item = { u: l.url, t: l.title, c: l.category, g: l.tags, d: l.created };
    if (l.fav) item.f = 1;
    if (JSON.stringify(current[key]) !== JSON.stringify(item)) toSet[key] = item;
  }
  const toRemove = [...loadedIds].filter(id => !ids.has(id)).map(id => LINK_PREFIX + id);
  if (Object.keys(toSet).length) await chrome.storage.sync.set(toSet);
  if (toRemove.length) await chrome.storage.sync.remove(toRemove);
  loadedIds = ids;
}

export async function bytesInUse() {
  return chrome.storage.sync.getBytesInUse(null);
}

// One-time move of links saved by versions ≤ 1.0.2 (chrome.storage.local).
// The old local copy is kept as a backup; links already in sync (same URL) are skipped.
let migration = null;
function migrateLocalToSync() {
  migration ??= (async () => {
    const local = await chrome.storage.local.get(["links", "categories", "migratedToSync"]);
    if (local.migratedToSync || !Array.isArray(local.links) || !local.links.length) return;
    const data = await readSync();
    const urls = new Set(data.links.map(l => l.url));
    for (const c of local.categories || []) if (!data.categories.includes(c)) data.categories.push(c);
    for (const l of local.links) {
      if (!l?.url || urls.has(l.url)) continue;
      data.links.push({ ...l, id: l.id || crypto.randomUUID(), tags: l.tags || [], created: l.created || Date.now(), fav: !!l.fav });
      urls.add(l.url);
      if (!data.categories.includes(l.category)) data.categories.push(l.category);
    }
    await saveData(data);
    await chrome.storage.local.set({ migratedToSync: true });
  })().catch(err => { migration = null; throw err; });
  return migration;
}

export function newLink({ url, title, category = DEFAULT_CATEGORY, tags = [], fav = false }) {
  return {
    id: crypto.randomUUID(),
    url,
    title: (title || "").trim() || domainOf(url),
    category,
    tags,
    created: Date.now(),
    fav
  };
}

// Folder used when none is chosen: "General" if it exists, else the first one.
export function defaultFolder(data) {
  return data.categories.includes(DEFAULT_CATEGORY) ? DEFAULT_CATEGORY : data.categories[0] || DEFAULT_CATEGORY;
}

export function ensureCategory(data, name) {
  const clean = (name || "").trim() || DEFAULT_CATEGORY;
  const found = data.categories.find(c => c.toLowerCase() === clean.toLowerCase());
  if (found) return found;
  data.categories.push(clean);
  data.categories.sort(byName);
  return clean;
}

export function parseTags(text) {
  return [...new Set(
    (text || "").split(",").map(t => t.trim().toLowerCase().replace(/^#/, "")).filter(Boolean)
  )];
}

export function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

export function isValidUrl(url) {
  try { new URL(url); return true; } catch { return false; }
}

// Every word in the query must appear in title, url, category or tags.
export function matches(link, query) {
  const words = (query || "").toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = [link.title, link.url, link.category, ...link.tags].join(" ").toLowerCase();
  return words.every(w => hay.includes(w.replace(/^#/, "")));
}

// Chrome's built-in favicon cache (needs the "favicon" permission).
export function faviconUrl(pageUrl, size = 32) {
  const u = new URL(chrome.runtime.getURL("/_favicon/"));
  u.searchParams.set("pageUrl", pageUrl);
  u.searchParams.set("size", String(size));
  return u.toString();
}

// ---------- folder picker (a <select> + a hidden "new folder" input) ----------
const NEW_FOLDER = "__new__";

export function setupFolderPicker(select, newInput, folders, selected) {
  const opts = folders.map(f => {
    const o = document.createElement("option");
    o.value = f; o.textContent = f;
    return o;
  });
  const add = document.createElement("option");
  add.value = NEW_FOLDER; add.textContent = "+ New folder…";
  select.replaceChildren(...opts, add);
  select.value = folders.includes(selected) ? selected : folders[0];
  newInput.value = "";
  newInput.hidden = true;
  select.onchange = () => {
    newInput.hidden = select.value !== NEW_FOLDER;
    if (!newInput.hidden) newInput.focus();
  };
}

// Returns the chosen folder name (a new name if "+ New folder…" was picked).
export function readFolderPicker(select, newInput) {
  return select.value === NEW_FOLDER ? newInput.value.trim() : select.value;
}

// Tiny DOM helper: el("div", { class: "x", onclick: fn }, child1, "text")
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (k === "class") node.className = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (v === true) node.setAttribute(k, "");
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}
