import { loadData, saveData, newLink } from "./store.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "save-link", title: "Save link to My Favorite Links", contexts: ["link"] });
    chrome.contextMenus.create({ id: "save-page", title: "Save this page to My Favorite Links", contexts: ["page"] });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const isLink = info.menuItemId === "save-link";
  const url = isLink ? info.linkUrl : (info.pageUrl || tab?.url);
  if (!url) return;
  const title = isLink ? (info.selectionText || "") : (tab?.title || "");

  const data = await loadData();
  if (data.links.some(l => l.url === url)) {
    flashBadge("=", "#6b7280");
    return;
  }
  data.links.unshift(newLink({ url, title, category: data.categories[0] }));
  await saveData(data);
  flashBadge("✓", "#16a34a");
});

function flashBadge(text, color) {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 1500);
}
