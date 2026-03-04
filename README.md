# weareleaking

See what tracking data websites store in your browser.

weareleaking scans localStorage and sessionStorage on every website you visit and shows you what's being stored without your knowledge. It detects cross-site trackers, advertising networks, fingerprinting IDs, and exposed personal data using pattern matching against known tracking systems like Google Analytics, Facebook Pixel, Segment, HotJar, and more. Open the popup for a quick per-site verdict — how many items are flagged, what categories they fall into, and how much data the site is keeping locally. Everything runs in your browser. No data is collected, transmitted, or shared.

Part of the **weare____** privacy tool series.

## What it detects

- **Cross-site tracking** — third-party systems following you across the web (`_ga`, `_fbp`, `segment`, `amplitude`, `hotjar`, `permutive`, `clarity`, etc.)
- **Advertising** — ad networks and retargeting (`gclid`, `fbclid`, `utm_*`, `__gads`, `doubleclick`, `criteo`, `taboola`)
- **Fingerprinting** — device and browser identification (`device_id`, `browser_id`, `visitor_id`, `fingerprint`)
- **PII exposure** — personal data sitting in storage (email addresses)
- **Tracking** — generic tracking identifiers (UUIDs in values)

## Install

### Chrome

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `chrome-extension/`

### Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on** → select `firefox-extension/manifest.json`

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

## Design

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

## License

Open source. Part of the weare____ series.


---

## The weare____ Suite

Privacy tools that show what's happening — no cloud, no accounts, nothing leaves your browser.

| Extension | What it exposes |
|-----------|----------------|
| [wearecooked](https://github.com/hamr0/wearecooked) | Cookies, tracking pixels, and beacons |
| [wearebaked](https://github.com/hamr0/wearebaked) | Network requests, third-party scripts, and data brokers |
| [weareleaking](https://github.com/hamr0/weareleaking) | localStorage and sessionStorage tracking data |
| [wearelinked](https://github.com/hamr0/wearelinked) | Redirect chains and tracking parameters in links |
| [wearewatched](https://github.com/hamr0/wearewatched) | Browser fingerprinting and silent permission access |
| [weareplayed](https://github.com/hamr0/weareplayed) | Dark patterns: fake urgency, confirm-shaming, pre-checked boxes |
| [wearetosed](https://github.com/hamr0/wearetosed) | Toxic clauses in privacy policies and terms of service |
| [wearesilent](https://github.com/hamr0/wearesilent) | Form input exfiltration before you click submit |

All extensions run entirely on your device and work on Chrome and Firefox.
