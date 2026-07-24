# Phase 1: Data Layer & Core Logic Documentation

**Status:** Completed · **Last updated:** 2026-07-24

---

## Overview

Phase 1 establishes the client-side data layer, SRS scheduling engine, and state management composables for the Kanji SRS application.

No UI components or pages are created in Phase 1; all implementations focus on immutable content dictionaries, reactive state persistence via Pinia and LocalStorage, scheduling calculations using `ts-fsrs`, and unit test coverage.

---

## 1. Data Layer

### `app/data/n5-list.ts`

- **Purpose:** Defines the explicit, committed list of 103 JLPT N5 kanji characters based on the Tanos dataset.
- **Exports:**
  - `N5_KANJI_LIST`: Const array of 103 kanji strings (`['一', '二', ... '本']`).
  - `N5_KANJI_COUNT`: Derived count (`N5_KANJI_LIST.length`).
  - `KanjiChar`: Union type of all 103 kanji characters.

### `app/data/kanji.json`

- **Purpose:** Immutable lookup dictionary for all N5 kanji entries keyed by character for $O(1)$ access.
- **Schema (`KanjiEntry`):**
  - `char`: string (e.g., `"日"`)
  - `codepoint`: 5-character zero-padded lowercase hex (e.g., `"065e5"`)
  - `meanings`: string array
  - `onyomi`: Katakana readings array
  - `kunyomi`: Hiragana readings array
  - `strokeCount`: integer
  - `jlpt`: `5`
  - `grade`: school grade integer or `null`
  - `frequency`: newspaper frequency rank integer or `null`
  - `examples`: array of 2–3 N5-level example words (`{ word, reading, meaning }`)

---

## 2. Store & FSRS Scheduling Engine

### `app/stores/progress.ts`

- **Purpose:** Reactive state store for user learning progress and FSRS card metrics.
- **Persistence:** Uses `pinia-plugin-persistedstate` to persist `cards`, `log`, `settings`, and `version` to `localStorage` under key `kanji-srs-progress`.
- **FSRS Integration (`ts-fsrs`):**
  - Uses default parameters configured with user-customizable target retention (`requestRetention`, default `0.9`).
  - Stores `Card` state verbatim on `cards[char]`.
- **Key Store Actions:**
  - `gradeCard(char, rating)`: Calculates new stability, difficulty, interval, and due date via `scheduler.next()`. Appends to `log`.
  - `getStudyQueue(allKanji)`: Combines cards due today (due date $\le$ end of today) with new cards (up to `newCardsPerDay` limit).
  - `exportProgress()` / `importProgress(json)` / `resetProgress()`: Full data lifecycle management.
- **Getters:** `isNew`, `newCount`, `learningCount`, `reviewCount`, `dueToday`, `newCardsIntroducedToday`, `reviewsDoneToday`, `streak`, `retentionRate`, `reviewHeatmap`, and `dueForecast`.

---

## 3. Composables

### `app/composables/useKanji.ts`

- Access static kanji dictionary with helper lookup methods:
  - `lookup(char)`: $O(1)$ lookup returning `KanjiEntry | undefined`.
  - `kanjiList`: The 103 character array.
  - `allKanji`: Array of populated `KanjiEntry` objects.
  - `totalCount`: Total kanji count.

### `app/composables/useStudySession.ts`

- Manages an active review session state machine:
  - `phase`: `'idle'` | `'question'` | `'answer'` | `'complete'`.
  - `queue`: Active queue of kanji being reviewed (shuffled on start).
  - `startSession()`: Populates queue from `store.getStudyQueue()`.
  - `revealAnswer()`: Transitions from `'question'` to `'answer'`.
  - `grade(rating)`: Grades current card, updates store, tracks session stats, and re-queues `Again` ratings at the end of the session.

### `app/composables/useTheme.ts`

- Theme switcher supporting `'light'`, `'dark'`, and `'system'`.
- Synchronizes with `store.settings.theme` and updates document root class list (`document.documentElement.classList.toggle('dark')`).

---

## 4. Testing & Verification

### Unit Test Suite (`app/stores/__tests__/progress.test.ts`)

- **Runner:** Vitest + happy-dom environment configured via `vitest.config.ts`.
- **Coverage:** 19 unit tests passing:
  - Initial state & default settings
  - New card detection & lookup
  - FSRS card creation & update on grading
  - Intake limits & daily cap enforcement
  - Import / Export JSON roundtrips & data reset
  - Stats calculation (streak, mature retention rate, heatmap, 30-day due forecast)

---

## File Sitemap

```
app/
├── composables/
│   ├── useKanji.ts
│   ├── useStudySession.ts
│   └── useTheme.ts
├── data/
│   ├── kanji.json
│   └── n5-list.ts
├── stores/
│   ├── __tests__/
│   │   └── progress.test.ts
│   └── progress.ts
└── types/
    └── index.ts
```
