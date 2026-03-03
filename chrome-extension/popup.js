"use strict";

// Display order — most severe first
var CATEGORY_ORDER = [
  "Cross-site tracking",
  "Advertising",
  "Fingerprinting",
  "PII exposure",
  "Tracking",
];

document.addEventListener("DOMContentLoaded", function () {
  chrome.runtime.sendMessage({ type: "getResults" }, function (data) {
    render(data);
  });
});

function render(data) {
  var verdictEl = document.getElementById("verdict");
  var flaggedSection = document.getElementById("flagged-section");
  var cleanSection = document.getElementById("clean-section");
  var emptyEl = document.getElementById("empty");

  if (!data || !data.items || data.items.length === 0) {
    verdictEl.appendChild(buildVerdict(data ? data.domain : "Unknown", 0, 0));
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

  verdictEl.appendChild(buildVerdict(data.domain, flaggedItems.length, total));

  if (flaggedItems.length > 0) {
    flaggedSection.classList.remove("hidden");
    buildFlaggedBreakdown(flaggedSection, flaggedItems);
  }

  if (cleanItems.length > 0) {
    cleanSection.classList.remove("hidden");
    buildCleanSummary(cleanSection, cleanItems);
  }
}

function buildVerdict(domain, flagged, total) {
  var level = "clean";
  var message = "Nothing suspicious found.";
  if (flagged > 0 && flagged <= 3) {
    level = "warn";
    message = flagged + " suspicious item" + (flagged !== 1 ? "s" : "") + " found.";
  } else if (flagged > 3) {
    level = "bad";
    message = flagged + " suspicious items found.";
  }

  var wrap = el("div", "verdict verdict-" + level);

  var domainEl = el("div", "verdict-domain");
  domainEl.textContent = domain;
  wrap.appendChild(domainEl);

  var countEl = el("div", "verdict-count");
  if (total > 0) {
    var f = el("span", "verdict-flagged");
    f.textContent = flagged;
    var sep = el("span", "verdict-sep");
    sep.textContent = " / ";
    var t = el("span", "verdict-total");
    t.textContent = total;
    countEl.appendChild(f);
    countEl.appendChild(sep);
    countEl.appendChild(t);
  }
  wrap.appendChild(countEl);

  var msg = el("div", "verdict-message");
  msg.textContent = message;
  wrap.appendChild(msg);

  return wrap;
}

function buildFlaggedBreakdown(container, items) {
  // Count per category (items can have multiple flags)
  var counts = {};
  for (var i = 0; i < items.length; i++) {
    for (var j = 0; j < items[i].flags.length; j++) {
      var cat = items[i].flags[j];
      counts[cat] = (counts[cat] || 0) + 1;
    }
  }

  // Sort by severity order
  var categories = Object.keys(counts).sort(function (a, b) {
    var ai = CATEGORY_ORDER.indexOf(a);
    var bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1) ai = 999;
    if (bi === -1) bi = 999;
    return ai - bi;
  });

  var label = el("div", "section-label");
  label.textContent = "Flagged";
  container.appendChild(label);

  var breakdown = el("div", "breakdown");
  for (var c = 0; c < categories.length; c++) {
    var row = el("div", "breakdown-row");
    var catEl = el("span", "breakdown-category");
    catEl.textContent = categories[c];
    var countEl = el("span", "breakdown-count");
    countEl.textContent = counts[categories[c]];
    row.appendChild(catEl);
    row.appendChild(countEl);
    breakdown.appendChild(row);
  }
  container.appendChild(breakdown);
}

function buildCleanSummary(container, items) {
  var summary = el("div", "clean-summary");
  var label = el("span", "section-label");
  label.textContent = "Other";
  var count = el("span", "clean-count");
  count.textContent = items.length + " item" + (items.length !== 1 ? "s" : "");
  summary.appendChild(label);
  summary.appendChild(count);
  container.appendChild(summary);
}

function el(tag, className) {
  var node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}
