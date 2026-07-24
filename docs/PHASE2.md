# Phase 2: Core Study Flow & Navigation Documentation

**Status:** Completed · **Last updated:** 2026-07-24

---

## Overview

Phase 2 builds the core user interface and navigation structure for the Kanji SRS application, connecting the Phase 1 FSRS data store to interactive screens.

---

## 1. Application Layout & Navigation

### `app/layouts/default.vue`

- **Header Navigation:**
  - App Logo with Kanji icon and subtitle.
  - Desktop nav links (Dashboard, Study, Browse, Stats) with live due badge indicators.
  - Real-time review streak counter with flame animation indicator (`progress.streak`).
  - Color theme toggle button (cycling through Light, Dark, and System modes).
- **Mobile Navigation Bar:**
  - Fixed bottom tab bar for thumb-friendly mobile navigation with notification badges.

---

## 2. Views & Features

### Dashboard Page (`app/pages/index.vue`)

- **Hero Status Banner:** Contextual greeting based on due reviews count and daily new card intake limits.
- **Primary Actions:** "Start Review", "Start Learning", and "Browse All" buttons.
- **Metrics Grid:** Cards for Due Today, New Intake remaining cap, Learning count, and Review (Graduated) count.
- **N5 Mastery Progress Bar:** Visual multi-color bar displaying proportional breakdown of Review, Learning, and Unstudied kanji across the 103 N5 collection.

### Study Session Page (`app/pages/study.vue`)

- **Question State:** Hero character display styled with Japanese typography (`font-jp` at `clamp(6rem, 18vw, 10rem)`).
- **Answer State:** Unveils English meanings, Katakana On'yomi, Hiragana Kunyomi, stroke count, school grade, and N5 example vocabulary words.
- **FSRS Grade Controls:** 4 color-coded grade buttons matching recall quality tokens:
  - **Again** (1) -> Red tint (`var(--grade-again)`)
  - **Hard** (2) -> Amber tint (`var(--grade-hard)`)
  - **Good** (3) -> Green tint (`var(--grade-good)`)
  - **Easy** (4) -> Blue tint (`var(--grade-easy)`)
- **Keyboard Shortcuts:** Listeners bound for `Space` (Reveal answer), `1` (Again), `2` (Hard), `3` (Good), and `4` (Easy).
- **Session Complete Screen:** Displays summary stats and breakdown of grades given during the session with options to return to dashboard or study again.

### Kanji Browse Page (`app/pages/browse.vue`)

- **Kanji Grid:** Responsive 3-to-8 column grid rendering all 103 N5 kanji with status indicators.
- **Filter Tabs:** Category filtering for All, New, Learning, Review, and Due Today.
- **Live Search:** Instant search filter matching kanji character, On'yomi / Kunyomi readings, or English meanings.
- **Kanji Detail Dialog:** Modal popup displaying character details, readings, stroke count, school grade, newspaper frequency rank, N5 example words, and current FSRS stability / difficulty parameters.

### Statistics & Settings Page (`app/pages/stats.vue`)

- **Performance Overview:** Cards for Target vs Actual Retention Rate, Streak, Lifetime Reviews, and Deck Coverage percentage.
- **30-Day Due Forecast Chart:** Bar visualization of upcoming reviews per day.
- **FSRS Settings Controls:** Sliders for Daily New Cards Intake Cap (1–25) and FSRS Target Retention Rate (70%–95%).
- **Data Lifecycle Operations:** Progress JSON export download, JSON backup file importer, and reset progress modal confirmation.

---

## File Sitemap

```
app/
├── layouts/
│   └── default.vue
└── pages/
    ├── browse.vue
    ├── index.vue
    ├── stats.vue
    └── study.vue
```
