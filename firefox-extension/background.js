"use strict";

// MV2 background pages persist — in-memory store is fine
var tabData = {};

browser.runtime.onMessage.addListener(function (message, sender) {
  if (message.type === "scanResult" && sender.tab) {
    var tabId = sender.tab.id;
    tabData[tabId] = message;
    updateBadge(tabId, message.totals.flagged);
    return;
  }

  if (message.type === "getResults") {
    return browser.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
      if (tabs.length === 0) return null;
      var tabId = tabs[0].id;
      return tabData[tabId] || null;
    });
  }
});

function updateBadge(tabId, flaggedCount) {
  var text = flaggedCount > 0 ? String(flaggedCount) : "0";
  browser.browserAction.setBadgeText({ text: text, tabId: tabId });
  browser.browserAction.setBadgeBackgroundColor({
    color: flaggedCount > 0 ? "#e74c3c" : "#555555",
    tabId: tabId,
  });
}

browser.tabs.onRemoved.addListener(function (tabId) {
  delete tabData[tabId];
});

browser.tabs.onActivated.addListener(function (activeInfo) {
  var data = tabData[activeInfo.tabId];
  if (data) {
    updateBadge(activeInfo.tabId, data.totals.flagged);
  }
});
