// Shared data layer for popup, manager and background.
// Data lives in chrome.storage.local:
//   links:      [{ id, url, title, category, tags: [], created }]
//   categories: ["General", ...]

export const DEFAULT_CATEGORY = "General";

export async function loadData() {
  const { links = [], categories = [] } = await chrome.storage.local.get(["links", "categories"]);
  return { links, categories: categories.length ? categories : [DEFAULT_CATEGORY] };
}

export async function saveData({ links, categories }) {
  await chrome.storage.local.set({ links, categories });
}

export function newLink({ url, title, category = DEFAULT_CATEGORY, tags = [] }) {
  return {
    id: crypto.randomUUID(),
    url,
    title: (title || "").trim() || domainOf(url),
    category,
    tags,
    created: Date.now()
  };
}

export function ensureCategory(data, name) {
  const clean = (name || "").trim() || DEFAULT_CATEGORY;
  const found = data.categories.find(c => c.toLowerCase() === clean.toLowerCase());
  if (found) return found;
  data.categories.push(clean);
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
