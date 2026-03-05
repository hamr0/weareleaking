# weareleaking — Product Reference

## Overview
weareleaking scans localStorage and sessionStorage on every website you visit and shows you what's being stored without your knowledge. It detects cross-site trackers, advertising networks, fingerprinting IDs, and exposed personal data using pattern matching against known tracking systems like Google Analytics, Facebook Pixel, Segment, HotJar, and more.

## How it works
```
popup.html ←→ popup.js ←→ background.js ←→ content.js
                              (storage)        (scans storage)
```

| Component | Chrome (MV3) | Firefox (MV2) |
|-----------|-------------|---------------|
| Content script | Runs at `document_idle` on all URLs, scans storage, classifies keys against regex patterns, sends results to background | Same |
| Background | Service worker, stores results in `chrome.storage.session` (survives worker restarts), updates badge | Persistent background page, stores results in memory, uses `browser.*` API |
| Popup | Sends `getResults` to background, renders verdict + category breakdown | Same, uses `browser.*` promises |

## Project structure

```
weareleaking/
├── chrome-extension/
│   ├── manifest.json      # MV3 manifest
│   ├── content.js         # Storage scanner + pattern matcher
│   ├── background.js      # Badge updates, stores results per tab
│   ├── popup.html         # Popup shell
│   ├── popup.js           # Renders verdict + breakdown
│   ├── styles.css         # Dark theme
│   └── icon{16,48,128}.png
├── firefox-extension/
│   ├── manifest.json      # MV2 manifest
│   ├── content.js         # Same patterns, browser.* API
│   ├── background.js      # Persistent background page
│   ├── popup.html
│   ├── popup.js           # Same UI, browser.* promises
│   ├── styles.css
│   └── icon{16,48,128}.png
├── CLAUDE.md
├── POC_PLAN.md
└── README.md
```

## Design decisions
- Pure vanilla JS — zero dependencies, no build step
- Local-only — nothing leaves the browser
- Dark theme matching the wearecooked/wearebaked design language
- Values truncated to 200 chars, capped at 500 keys per domain

## Known limitations
- Content scripts can only read same-origin storage (cross-origin iframes are skipped)
- IndexedDB and Cache API are not scanned
- UUID detection may flag non-tracking UUIDs (e.g., app-generated IDs)

## Roadmap
- [ ] Dashboard page — aggregated view across all scanned domains
- [ ] IndexedDB + Cache API scanning
- [ ] Storage size tracking per domain
- [ ] Historical comparison — what changed since last visit
- [ ] Export/share report
