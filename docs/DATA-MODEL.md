# Data Model

**Status:** Draft · **Last updated:** 2026-07-24

---

## Core principle

Two stores, strictly separated:

| | Static content | User state |
|---|---|---|
| **Source** | Build-time JSON, committed | Created at runtime |
| **Location** | `app/data/*.json`, bundled | `localStorage` |
| **Mutability** | Immutable at runtime | Mutated every review |
| **Keyed by** | Kanji character (`"日"`) | Same character |
| **On update** | Ship new JSON, no migration | Never touched by content updates |

The join key is the kanji character itself — a stable, unique, human-readable
identifier. No synthetic IDs, no mapping table.

This separation is the whole point: adding N4 kanji later means dropping in
a bigger JSON file, and every existing card's scheduling state survives
untouched.

---

## 1. Static content

Generated once by `scripts/build-data.ts` from KANJIDIC2 + KanjiVG.
Committed to the repo. Never parsed at runtime.

### `kanji.json`

```ts
type KanjiEntry = {
  /** The character itself. Primary key. */
  char: string            // "日"
  /** Unicode codepoint, lowercase hex — used to look up KanjiVG paths. */
  codepoint: string       // "065e5"
  meanings: string[]      // ["day", "sun", "Japan", "counter for days"]
  onyomi: string[]        // ["ニチ", "ジツ"]
  kunyomi: string[]       // ["ひ", "-び", "-か"]
  strokeCount: number     // 4
  jlpt: 5                 // literal 5 for now; widens to 5|4|3|2|1 later
  grade: number | null    // Japanese school grade, if assigned
  frequency: number | null // newspaper frequency rank, if present
  examples: Example[]     // 2–3 hand-curated words, N5-appropriate
}

type Example = {
  word: string            // "日本"
  reading: string         // "にほん"
  meaning: string         // "Japan"
}
```

Shipped as `Record<string, KanjiEntry>` keyed by `char`, for O(1) lookup
without building an index at boot.

### `strokes.json`

```ts
type StrokeData = {
  /** Ordered SVG path `d` attributes, one per stroke. */
  paths: string[]
  /** viewBox is uniform across KanjiVG: "0 0 109 109". */
  viewBox: string
}
```

Also `Record<string, StrokeData>` keyed by `char`.

Kept in a **separate file** from `kanji.json` because path data is bulky
and only needed on detail/reveal screens — it can be lazy-loaded, while
the browse grid needs only `kanji.json`.

---

## 2. User state

Persisted to `localStorage` via Pinia + `pinia-plugin-persistedstate`.
Everything here is disposable — losing it costs progress, not content.

### Scheduling: adopt `ts-fsrs` types directly

Do **not** invent a parallel card shape and map between them. `ts-fsrs`
exports a `Card` type; store it as-is.

```ts
import type { Card, ReviewLog } from 'ts-fsrs'

type ProgressStore = {
  /** char → FSRS card state. Absent key = never studied ("new"). */
  cards: Record<string, Card>
  /** Append-only. The source of truth for all stats. */
  log: ReviewEntry[]
  settings: Settings
  /** Schema version, for future migrations. */
  version: number
}

type ReviewEntry = ReviewLog & {
  char: string
}
```

`ts-fsrs`'s `Card` carries: `due`, `stability`, `difficulty`,
`elapsed_days`, `scheduled_days`, `reps`, `lapses`, `state`,
`last_review`. That is the complete scheduling state — nothing to add.

### Settings

```ts
type Settings = {
  newCardsPerDay: number      // default 5
  maxReviewsPerDay: number    // default 100, 0 = unlimited
  theme: 'light' | 'dark' | 'system'
  requestRetention: number    // FSRS target, default 0.9
}
```

---

## 3. Derived state (computed, never stored)

Everything below is a Pinia getter. Storing any of it invites drift.

| Derived | From |
|---|---|
| `dueToday` | `cards` where `due <= endOfToday`, plus new-card intake up to cap |
| `newCount` / `learningCount` / `reviewCount` | `cards[].state` |
| `retentionRate` | `log` — ratio of grade > Again among mature reviews |
| `reviewHeatmap` | `log` grouped by local calendar date |
| `dueForecast` | `cards[].due` bucketed by day, next 30 days |
| `isNew(char)` | `!(char in cards)` |

---

## 4. Storage budget

| Item | Est. size |
|---|---|
| `kanji.json` (103 entries) | ~45 KB |
| `strokes.json` (103 entries) | ~180 KB |
| User cards (103) | ~25 KB |
| Review log (1 year, ~20/day) | ~1.5 MB |

localStorage caps at ~5 MB per origin. The log is the only thing that
grows unbounded — at ~200 bytes/entry it takes several years to become a
problem. If it ever does: compact entries older than 90 days into daily
aggregates (the heatmap and retention rate are the only consumers that
need history, and both work fine on aggregates).

See ADR-0002 for why localStorage over IndexedDB.

---

## 5. Migration strategy

`version` starts at `1`. On store hydration, if the persisted version is
lower than the current one, run migrations in sequence, then write back.
Given the "not doing" list, this is likely to stay unused — but the field
costs nothing now and is impossible to add retroactively.

---

## 6. Data flow

```
KANJIDIC2.xml ─┐
               ├─► scripts/build-data.ts ─► kanji.json ──┐
KanjiVG/*.svg ─┘                        └─► strokes.json ┤
                                                         ▼
                                              Static import (bundled)
                                                         │
                                                         ▼
localStorage ──► Pinia progress store ──► derived getters ──► components
     ▲                                                            │
     └────────────────── grade(card, rating) ◄────────────────────┘
                              via ts-fsrs
```
