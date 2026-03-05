# weareleaking — POC Plan

## What is weareleaking?

A browser extension that scans localStorage and sessionStorage on every website you visit, flags suspicious tracking data (analytics IDs, UUIDs, fingerprints), and shows you what sites are storing on your machine without your knowledge. Part of the "weare____" privacy tool series.

No data leaves your browser. No accounts. No tracking.

## Why build this?

- DevTools shows localStorage but requires technical knowledge and per-tab manual inspection
- No extension aggregates this across all sites into a user-friendly view
- Users have no idea how much tracking data is stored locally in their browser
- Simple regex pattern matching catches the obvious stuff — no ML needed

## POC Goal

**Prove that scanning localStorage/sessionStorage from a content script catches surprising amounts of tracking data on regular websites, and that simple pattern matching is sufficient to flag the worst offenders.**

## POC Scope

### Happy Path
1. Content script runs on every page load, reads all localStorage + sessionStorage keys/values
2. Flags suspicious keys using regex patterns (tracking IDs, UUIDs, analytics cookies, PII-shaped strings)
3. Sends results to background script
4. Badge on extension icon shows count of flagged (suspicious) items on current tab
5. Popup shows a simple list: domain, key name, value preview, flag reason
6. Results stored per-domain so popup can show data even after navigation

### Edge Cases
1. **Zero storage** — site has no localStorage/sessionStorage → badge shows "0", popup says "No data stored by this site"
2. **Huge storage** — site has hundreds of keys or very large values → truncate values to 200 chars, cap at 500 keys per domain
3. **Cross-origin iframes** — content script only reads same-origin storage, that's fine for POC (note limitation, don't try to solve)

### Out of Scope for POC
- IndexedDB scanning (complex async API — save for v1)
- Cache API inspection
- Historical tracking across sessions
- Dashboard page with aggregated view across all domains
- Firefox version (build Chrome first, port after POC validates)

## Architecture

```
popup.html ←→ popup.js ←→ background.js ←→ content.js
                              (storage)        (scans localStorage/sessionStorage)
```

### Content Script (`content.js`)
- Runs at `document_idle` on all URLs
- Reads `window.localStorage` (all keys/values)
- Reads `window.sessionStorage` (all keys/values)
- Classifies each key using `SUSPICIOUS_PATTERNS` regex list
- Sends results to background via `chrome.runtime.sendMessage`:
  ```js
  {
    type: "scanResult",
    domain: location.hostname,
    url: location.href,
    timestamp: Date.now(),
    items: [
      { store: "local", key: "_ga", value: "GA1.2.123...", size: 28, flags: ["Analytics / Tracking"] },
      { store: "session", key: "cart_id", value: "abc-123", size: 7, flags: [] }
    ],
    totals: { local: 12, session: 3, flagged: 5 }
  }
  ```

### Background Script (`background.js`)
- Listens for `scanResult` messages from content script
- Stores latest scan per tab in memory (object keyed by tabId)
- Updates badge text with flagged count for the active tab
- Responds to `getResults` messages from popup with stored scan data
- Cleans up on tab close (`chrome.tabs.onRemoved`)

### Popup (`popup.html` + `popup.js`)
- Sends `getResults` message to background for current tab
- Renders results:
  - Header: domain name, total items, flagged count
  - List of items grouped: flagged first (red), then clean (grey)
  - Each item shows: store type (local/session), key name, truncated value, flag reason
- If no data: "No storage data found on this site"

### Suspicious Pattern Detection (`content.js`)

Flag keys matching these patterns (case-insensitive):

```js
const SUSPICIOUS_PATTERNS = [
  // Analytics / Tracking
  { pattern: /^_ga|^_gid|^_gat|^_gcl/i, category: "Analytics / Tracking" },
  { pattern: /amplitude|mixpanel|mp_/i, category: "Analytics / Tracking" },
  { pattern: /ahoy_|_hjid|_hjSession/i, category: "Analytics / Tracking" },
  { pattern: /hubspot|_fbp|_fbc|intercom/i, category: "Analytics / Tracking" },
  { pattern: /ajs_|segment|_clck|_clsk|clarity/i, category: "Analytics / Tracking" },
  { pattern: /plausible|matomo|_pk_|piwik/i, category: "Analytics / Tracking" },
  { pattern: /hotjar|fullstory|logrocket|mouseflow/i, category: "Analytics / Tracking" },

  // Advertising
  { pattern: /^IDE$|^DSID$|^NID$|^ANID$|^1P_JAR$/i, category: "Advertising" },
  { pattern: /__gads|__gpi|test_cookie|adroll/i, category: "Advertising" },
  { pattern: /doubleclick|googlesyndication|googlead/i, category: "Advertising" },
  { pattern: /fbclid|gclid|utm_/i, category: "Advertising" },

  // Fingerprinting / Device ID
  { pattern: /fingerprint|device_id|browser_id|machine_id/i, category: "Fingerprinting" },
  { pattern: /visitor_id|client_id|distinct_id/i, category: "Fingerprinting" },

  // UUIDs (generic tracking identifiers)
  { pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, category: "Tracking ID (UUID)", matchValue: true },

  // PII-shaped values
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i, category: "PII (email detected)", matchValue: true },
];
```

Patterns with `matchValue: true` check the value, not the key name. All others check the key name only.

## Files

| File | Purpose |
|------|---------|
| `chrome-extension/manifest.json` | MV3 manifest with activeTab, storage permissions |
| `chrome-extension/background.js` | Badge updates, stores scan results per tab |
| `chrome-extension/content.js` | Scans localStorage/sessionStorage, classifies keys |
| `chrome-extension/popup.html` | Simple results popup shell |
| `chrome-extension/popup.js` | Reads results from background, renders list |
| `chrome-extension/styles.css` | Dark theme (wearecooked palette) |
| `chrome-extension/icon48.png` | Placeholder icon (from wearecooked) |
| `chrome-extension/icon128.png` | Placeholder icon (from wearecooked) |

## Validation Criteria

POC is successful if:
1. Loading any major website (google.com, reddit.com, amazon.com, youtube.com) shows localStorage/sessionStorage data in the popup
2. At least some keys are correctly flagged as suspicious (e.g., `_ga`, `_gid` on sites using Google Analytics)
3. Badge count updates per tab and shows 0 on clean sites
4. Popup renders without errors, truncates large values, handles empty state

## After POC Validates

If the POC works → stop, design properly, then build v1:
- Firefox MV2 port
- Dashboard page (aggregated view across all scanned domains)
- IndexedDB + Cache API scanning
- Storage size tracking per domain
- Historical comparison (what changed since last visit)
- Export/share report
- Proper logo and store assets

## Test Manually

1. `chrome://extensions/` → Developer mode → Load unpacked → select `chrome-extension/`
2. Visit google.com → click extension icon → should see localStorage items
3. Visit amazon.com → badge should show flagged count → popup shows flagged items in red
4. Visit a simple site with no tracking (e.g., example.com) → badge shows 0 → popup shows empty state
5. Open multiple tabs → each tab has its own badge count and popup data
