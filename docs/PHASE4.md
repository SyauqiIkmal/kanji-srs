# Phase 4: PWA, Offline Capability & E2E Testing Documentation

**Status:** Completed · **Last updated:** 2026-07-24

---

## Overview

Phase 4 completes the v1.0 release specifications by implementing full Progressive Web App (PWA) offline capabilities, Workbox service worker caching, and end-to-end automated testing with Playwright.

---

## 1. Progressive Web App (PWA) Setup

### `@vite-pwa/nuxt` Module Integration

- **Module Registration:** Added `@vite-pwa/nuxt` to `nuxt.config.ts`.
- **Auto-Update Strategy:** Configured `registerType: 'autoUpdate'` for seamless service worker background updates.
- **Web App Manifest (`manifest`):**
  - `name`: `"Kanji SRS - JLPT N5"`
  - `short_name`: `"Kanji SRS"`
  - `description`: `"Client-side spaced repetition study app for JLPT N5 kanji using FSRS algorithm"`
  - `theme_color`: `"#7f1d1d"` (Traditional Vermillion 朱色)
  - `background_color`: `"#fbf9f5"` (Warm Rice Paper)
  - `display`: `"standalone"`
- **Workbox Caching Strategy:**
  - `navigateFallback`: `'/'` (Single-Page Application fallback for offline routing)
  - `globPatterns`: Caches all static bundles (`js`, `css`, `html`, `png`, `svg`, `ico`, `json`).

---

## 2. End-to-End Automated Testing

### Playwright Test Harness (`playwright.config.ts` & `tests/e2e/study.spec.ts`)

- **Configured Test Runner:** Playwright configured with Chromium environment and auto-starting dev server (`http://localhost:3000`).
- **Vitest Exclusion:** Excluded `**/tests/e2e/**` from Vitest unit test runner in `vitest.config.ts` to keep test harnesses separate.
- **Automated E2E Suite (`tests/e2e/study.spec.ts`):**
  1. `Dashboard loads and displays initial state`: Asserts header logo, due cards counter, new intake, and progress bar.
  2. `Complete a study session flow`: Simulates user entering study queue, revealing answer card (`Space` / click), and grading card using FSRS grade buttons.
  3. `Kanji browse page filter and detail modal`: Tests live search query filtering (`日`), category tabs, and opening kanji detail modal.
  4. `Stats page loads metrics and export options`: Validates metrics cards, 30-day forecast chart, and JSON export buttons.

---

## 3. Definition of Done (v1.0 Checklist)

- [x] All 103 N5 kanji present with readings, meanings, stroke count, and example words.
- [x] FSRS scheduling engine implemented & verified by unit test suite (19/19 passing).
- [x] Progress survives browser restart via `localStorage` persistence.
- [x] Animated SVG stroke order plays on detail modal & study card reveal.
- [x] Stats page renders retention metrics, streak, and 30-day due forecast.
- [x] PWA offline manifest & service worker configured.
- [x] CI pipeline green: lint, typecheck, unit tests, E2E happy path, and build clean.
- [x] Deployed to static host.
- [x] Complete documentation written for all 4 implementation phases.

---

## File Sitemap

```
.
├── playwright.config.ts
├── vitest.config.ts
├── docs/
│   ├── PHASE1.md
│   ├── PHASE2.md
│   ├── PHASE3.md
│   └── PHASE4.md
└── tests/
    └── e2e/
        └── study.spec.ts
```
