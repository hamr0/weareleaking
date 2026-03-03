"use strict";

var CATEGORY_ORDER = [
  "Cross-site tracking",
  "Advertising",
  "Fingerprinting",
  "PII exposure",
  "Tracking",
];

document.addEventListener("DOMContentLoaded", function () {
  browser.runtime.sendMessage({ type: "getResults" }).then(function (data) {
    render(data);
  });
});

function render(data) {
  var verdictEl = document.getElementById("verdict");
  var flaggedSection = document.getElementById("flagged-section");
  var cleanSection = document.getElementById("clean-section");
  var emptyEl = document.getElementById("empty");

  if (!data || !data.items || data.items.length === 0) {
    verdictEl.innerHTML = renderVerdict(data ? data.domain : "Unknown", 0, 0);
    emptyEl.classList.remove("hidden");
    return;
  }

  var total = data.items.length;
  var flaggedItems = [];
  var cleanItems = [];
  for (var i = 0; i < data.items.length; i++) {
    if (data.items[i].flags.length > 0) {
      flaggedItems.push(data.items[i]);
    } else {
      cleanItems.push(data.items[i]);
    }
  }

  verdictEl.innerHTML = renderVerdict(data.domain, flaggedItems.length, total);

  if (flaggedItems.length > 0) {
    flaggedSection.classList.remove("hidden");
    flaggedSection.innerHTML = renderFlaggedBreakdown(flaggedItems);
  }

  if (cleanItems.length > 0) {
    cleanSection.classList.remove("hidden");
    cleanSection.innerHTML = renderCleanSummary(cleanItems);
  }
}

function renderVerdict(domain, flagged, total) {
  var level = "clean";
  var message = "Nothing suspicious found.";
  if (flagged > 0 && flagged <= 3) {
    level = "warn";
    message = flagged + " suspicious item" + (flagged !== 1 ? "s" : "") + " found.";
  } else if (flagged > 3) {
    level = "bad";
    message = flagged + " suspicious items found.";
  }

  var html = '<div class="verdict verdict-' + level + '">';
  html += '<div class="verdict-domain">' + escapeHtml(domain) + "</div>";
  html += '<div class="verdict-count">';
  if (total > 0) {
    html += '<span class="verdict-flagged">' + flagged + "</span>";
    html += '<span class="verdict-sep"> / </span>';
    html += '<span class="verdict-total">' + total + "</span>";
  }
  html += "</div>";
  html += '<div class="verdict-message">' + message + "</div>";
  html += "</div>";
  return html;
}

function renderFlaggedBreakdown(items) {
  var counts = {};
  for (var i = 0; i < items.length; i++) {
    for (var j = 0; j < items[i].flags.length; j++) {
      var cat = items[i].flags[j];
      counts[cat] = (counts[cat] || 0) + 1;
    }
  }

  var categories = Object.keys(counts).sort(function (a, b) {
    var ai = CATEGORY_ORDER.indexOf(a);
    var bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1) ai = 999;
    if (bi === -1) bi = 999;
    return ai - bi;
  });

  var html = '<div class="section-label">Flagged</div>';
  html += '<div class="breakdown">';
  for (var c = 0; c < categories.length; c++) {
    var cat = categories[c];
    html += '<div class="breakdown-row">';
    html += '<span class="breakdown-category">' + escapeHtml(cat) + "</span>";
    html += '<span class="breakdown-count">' + counts[cat] + "</span>";
    html += "</div>";
  }
  html += "</div>";
  return html;
}

function renderCleanSummary(items) {
  var html = '<div class="clean-summary">';
  html += '<span class="section-label">Other</span>';
  html += '<span class="clean-count">' + items.length + " item" + (items.length !== 1 ? "s" : "") + "</span>";
  html += "</div>";
  return html;
}

function escapeHtml(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
