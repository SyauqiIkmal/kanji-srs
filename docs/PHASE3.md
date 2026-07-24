# Phase 3: Animated Stroke Order & KanjiVG Integration Documentation

**Status:** Completed · **Last updated:** 2026-07-24

---

## Overview

Phase 3 introduces ordered SVG stroke path data for all 103 N5 kanji characters and builds an interactive stroke animation component.

---

## 1. Stroke Data Layer

### `app/data/strokes.json`

- **Purpose:** Pre-processed ordered SVG path data for all 103 N5 kanji.
- **Data Schema (`StrokeData`):**
  - `paths`: Array of ordered SVG path `d` strings representing strokes in sequence.
  - `viewBox`: `"0 0 109 109"` (uniform KanjiVG coordinate system).
- **Bundle Strategy:** Lazy-loaded at runtime via `useStrokes()` composable to keep the initial page bundle minimal (~180 KB uncompressed, loaded on-demand).

### `app/composables/useStrokes.ts`

- Provides asynchronous lazy-loading accessor for `strokes.json`.
- `getStroke(char)`: Returns `StrokeData | null` for a given character.

---

## 2. Animation Component (`app/components/KanjiStrokeOrder.vue`)

- **Visual Rendering:**
  - 4x4 guideline grid background for traditional Japanese rice paper feel (`0.5px` hairline dashed lines).
  - Background static ghost stroke paths in light gray (`stroke-muted/30`).
  - Completed strokes rendered in sumi ink (`stroke-foreground`).
  - Active stroke animated in vermillion (`stroke-primary`) using CSS keyframe `stroke-dasharray` and `stroke-dashoffset` interpolation.
  - Number indicators positioned at starting point of each stroke.
- **Controls:**
  - Play / Pause animation toggle button.
  - Step Previous / Step Next stroke buttons.
  - Replay button.
  - Speed toggle (0.5x, 1x, 1.5x, 2x).

---

## 3. Integrations

1. **Kanji Detail Modal (`app/pages/browse.vue`)**:
   - Displays stroke order animation alongside FSRS card metrics (stability, difficulty, review count).
2. **Study Session Card (`app/pages/study.vue`)**:
   - Automatically starts stroke order animation when the card answer is revealed.

---

## File Sitemap

```
app/
├── components/
│   └── KanjiStrokeOrder.vue
├── composables/
│   └── useStrokes.ts
└── data/
    └── strokes.json
```
