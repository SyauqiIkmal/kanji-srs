# Design System

**Direction:** A — Traditional Japanese (rice paper, sumi ink, vermillion)
**Status:** Accepted · **Last updated:** 2026-07-24

Scope: token definitions and the rules that govern them. Not a component
library — shadcn-vue provides the components; this file provides the
values they read.

---

## 1. Direction

Warm off-white paper ground, near-black ink text, traditional vermillion
(朱色) as the single accent. Flat planes separated by 1px hairlines rather
than shadows. Small radius (4px) so corners read as cut paper rather than
as rounded UI.

The intent is that the kanji is the only visually loud element on screen.
Everything else recedes.

**Prohibited:** gradients, glassmorphism, drop shadows, glows, decorative
illustration, photography, custom iconography beyond a standard set.

---

## 2. Token format — decide this before writing any CSS

The tokens below are written as `hsl(42, 36%, 95%)`. **This form breaks
Tailwind opacity modifiers.** `bg-background/50` compiles to
`hsl(var(--background) / 0.5)`, which is invalid when the variable already
contains a wrapped `hsl(...)`.

Two valid setups — match whichever your `shadcn-vue` init produced:

| Tailwind | Variable form                              | Consumed as                              |
| -------- | ------------------------------------------ | ---------------------------------------- |
| v3       | `--background: 42 36% 95%;` (bare triplet) | `hsl(var(--background) / <alpha-value>)` |
| v4       | `--background: oklch(0.96 0.01 85);`       | `@theme inline` direct reference         |

Check `tailwind.config.js` / your CSS entry before converting. Converting
the wrong way costs an hour of confusing failures.

The values in §3 are given in the wrapped form for readability. Strip the
`hsl()` wrapper for v3, or convert to OKLCH for v4.

---

## 3. Color tokens

### Light — `:root`

```css
:root {
  /* Surface & base neutrals (rice paper & sumi ink) */
  --background: hsl(42, 36%, 95%); /* warm rice paper ground */
  --foreground: hsl(24, 10%, 15%); /* sumi ink */

  /* Cards & containers */
  --card: hsl(40, 100%, 99%); /* elevated paper surface */
  --card-foreground: hsl(24, 10%, 15%);

  /* Primary accent (Japanese vermillion / 朱色) */
  --primary: hsl(0, 57%, 38%);
  --primary-foreground: hsl(0, 0%, 100%);

  /* Secondary & muted */
  --secondary: hsl(38, 41%, 92%); /* subtle parchment */
  --secondary-foreground: hsl(30, 11%, 20%);
  --muted: hsl(39, 27%, 86%);
  --muted-foreground: hsl(30, 9%, 38%);
  --accent: hsl(0, 27%, 94%); /* vermillion tint */
  --accent-foreground: hsl(0, 57%, 38%);

  --destructive: hsl(0, 70%, 36%);
  --destructive-foreground: hsl(0, 0%, 100%);

  /* Structure & focus */
  --border: hsl(39, 27%, 86%);
  --input: hsl(39, 27%, 86%);
  --ring: hsl(0, 57%, 38%);

  --radius: 0.25rem;
}
```

### Dark — `.dark`

```css
.dark {
  --background: hsl(30, 8%, 9%); /* deep charcoal paper */
  --foreground: hsl(36, 33%, 92%); /* warm cream */

  --card: hsl(30, 9%, 13%);
  --card-foreground: hsl(36, 33%, 92%);

  --primary: hsl(7, 72%, 58%); /* bright vermillion */
  --primary-foreground: hsl(30, 8%, 9%);

  --secondary: hsl(30, 11%, 15%);
  --secondary-foreground: hsl(38, 30%, 86%);
  --muted: hsl(30, 10%, 20%);
  --muted-foreground: hsl(35, 11%, 62%);
  --accent: hsl(7, 40%, 16%);
  --accent-foreground: hsl(7, 72%, 58%);

  --destructive: hsl(0, 63%, 31%);
  --destructive-foreground: hsl(0, 96%, 82%);

  --border: hsl(30, 10%, 20%);
  --input: hsl(30, 10%, 20%);
  --ring: hsl(7, 72%, 58%);
}
```

`--radius` is not redefined in dark mode; it is theme-independent.

### Grade tokens (FSRS recall quality)

Application-specific, outside the shadcn contract. Kept in their own block.

```css
:root {
  --grade-again: hsl(0, 86%, 97%);
  --grade-again-foreground: hsl(0, 70%, 36%);
  --grade-hard: hsl(38, 100%, 97%);
  --grade-hard-foreground: hsl(28, 87%, 37%);
  --grade-good: hsl(138, 76%, 97%);
  --grade-good-foreground: hsl(142, 72%, 29%);
  --grade-easy: hsl(204, 100%, 97%);
  --grade-easy-foreground: hsl(201, 96%, 32%);
}

.dark {
  --grade-again: hsl(0, 42%, 15%);
  --grade-again-foreground: hsl(0, 96%, 82%);
  --grade-hard: hsl(27, 52%, 14%);
  --grade-hard-foreground: hsl(50, 96%, 62%);
  --grade-good: hsl(146, 45%, 12%);
  --grade-good-foreground: hsl(138, 76%, 73%);
  --grade-easy: hsl(203, 52%, 14%);
  --grade-easy-foreground: hsl(199, 95%, 74%);
}
```

Grade colors map to FSRS ratings: Again=1, Hard=2, Good=3, Easy=4. The
hue order (red → amber → green → blue) must stay stable; it is the
primary at-a-glance signal during review.

### Missing tokens — add before building

Not supplied by the generated palette, but required:

| Token                               | Needed by                          | Suggested                         |
| ----------------------------------- | ---------------------------------- | --------------------------------- |
| `--popover`, `--popover-foreground` | Tooltip, Dropdown, Select, Popover | Same as `--card` pair             |
| `--chart-1` … `--chart-5`           | Stats page (heatmap, due forecast) | Derive from vermillion + neutrals |

For the heatmap specifically, don't reuse the grade colors — a green
"Good" cell and a green "high activity" cell mean different things and
will be conflated. Use a single-hue vermillion ramp for intensity.

---

## 4. Typography

```css
--font-jp: 'Noto Serif JP', 'Source Han Serif JP', Georgia, serif;
--font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

Scale — major third, 1.25 ratio:

| Role       | Size                       | Weight  | Usage                       |
| ---------- | -------------------------- | ------- | --------------------------- |
| Hero kanji | `clamp(8rem, 20vw, 12rem)` | 400–500 | Review & detail character   |
| H1         | 1.75rem / 28px             | 700     | Screen titles               |
| H2         | 1.25rem / 20px             | 600     | Card titles, meanings       |
| Body       | 1rem / 16px                | 400–500 | Readings, explanations      |
| Label      | 0.875rem / 14px            | 500     | Metadata, example readings  |
| Micro      | 0.75rem / 12px             | 700     | Hotkeys (1–4), state badges |

```css
--kanji-display: clamp(8rem, 20vw, 12rem);
```

### Three typography decisions worth revisiting

**Hero weight: use 400–500, not 700.** The source spec says Bold. Noto
Serif JP at 700 and 160px+ renders dense kanji (鬱-class, but even 語 or
電) with strokes that visually merge. Mincho already carries strong stroke
contrast; bold adds mass without adding legibility. Test 語, 電, and 曜
at final size before committing to a weight.

**Serif vs. the stroke-order animation.** KanjiVG paths are drawn in a
sans/kaisho-like skeleton. Rendering the hero character in Mincho while
the animation beside it shows a structurally different glyph is a visible
mismatch. Options: accept it (they're on different parts of the screen),
render the static hero from KanjiVG too so they agree, or use a sans
Japanese face for the hero only. Worth deciding before building the
detail screen.

**Font subsetting is mandatory here.** Full Noto Serif JP is several MB
per weight. You need 103 kanji, both kana sets, and Latin. Subset with
`glyphhanger` or `pyftsubset` and self-host; the difference between a
subset and the full face is the difference between hitting the Lighthouse
≥95 target in SPEC §6 and missing it. Set `font-display: swap` and
preload the subset.

---

## 5. Spacing & layout

4px base grid: `0.25 · 0.5 · 0.75 · 1 · 1.5 · 2 · 3` rem.

| Context              | Desktop       | Mobile |
| -------------------- | ------------- | ------ |
| Viewport padding     | 2rem          | 1rem   |
| Study card padding   | 1.5rem        | 1.5rem |
| Compact tile padding | 1rem          | 1rem   |
| Button padding       | 1rem × 0.5rem | same   |

---

## 6. Elevation & radius

```css
box-shadow: none;
```

Surfaces are separated by 1px `--border` hairlines only. No shadows in any
state, including hover and focus.

Nested radius rule:

- Outer card: `--radius` (0.25rem)
- Inner container: `calc(var(--radius) / 2)` (0.125rem)

Focus is communicated by `--ring`, never by shadow.

---

## 7. Contrast — verified

All 16 pairings were recomputed from the HSL values (WCAG 2.x relative
luminance). **Every pairing passes AA.** The generated spec's numbers were
systematically optimistic; corrected values below.

| Pairing             | Claimed | Actual    | AA  | AAA |
| ------------------- | ------- | --------- | --- | --- |
| Light body text     | 14.1    | **13.73** | ✅  | ✅  |
| Light card text     | 14.8    | **14.87** | ✅  | ✅  |
| Primary button text | 7.2     | **7.79**  | ✅  | ✅  |
| Light muted subtext | 5.3     | **6.00**  | ✅  | —   |
| Grade 1 Again       | 7.8     | **7.34**  | ✅  | ✅  |
| Grade 2 Hard        | 5.4     | **4.69**  | ✅  | —   |
| Grade 3 Good        | 5.8     | **4.86**  | ✅  | —   |
| Grade 4 Easy        | 6.1     | **5.56**  | ✅  | —   |
| Dark body text      | 14.5    | **15.22** | ✅  | ✅  |
| Dark card text      | 13.1    | **13.60** | ✅  | ✅  |
| Dark primary text   | 6.8     | **4.87**  | ✅  | —   |
| Dark muted subtext  | 6.2     | **6.19**  | ✅  | —   |
| Dark Grade 1 Again  | 8.2     | **8.64**  | ✅  | ✅  |
| Dark Grade 2 Hard   | 11.4    | **11.07** | ✅  | ✅  |
| Dark Grade 3 Good   | 10.3    | **10.55** | ✅  | ✅  |
| Dark Grade 4 Easy   | 9.8     | **9.18**  | ✅  | ✅  |

Three were materially overstated and now sit close to the 4.5 threshold:

- **Grade 2 Hard — 4.69** (claimed 5.4)
- **Grade 3 Good — 4.86** (claimed 5.8)
- **Dark primary text — 4.87** (claimed 6.8)

These pass, but with little headroom. If any of these tokens is ever
nudged lighter, it fails. Treat their foreground lightness values as
locked, and re-verify on any palette change.

### Note on the hex comments

The hex values in the source comments don't exactly round-trip from the
HSL values — most differ by ±1 per channel (`hsl(24,10%,15%)` → `#2A2522`,
commented `#2B2623`). This is rounding noise, not an error, but it means
**the HSL values are the source of truth.** The hex comments are
documentation. Don't paste them into code as a shortcut, or the two will
drift apart.

---

## 8. Non-negotiables

Carried from the exploration brief; these govern component work.

1. The kanji is the hero. If a screen shows a character, it is the largest
   element on that screen.
2. Japanese text always uses `--font-jp`. Never allow fallback to a
   generic sans — CJK fallbacks may substitute Chinese glyph variants.
3. The review session is keyboard-first. Space to flip, 1–4 to grade.
   Every grade button has a visible focus state.
4. Tailwind core utilities only. No arbitrary values (`w-[347px]`), no
   one-off hex codes. If a value is needed twice, it becomes a token.
5. Empty states are designed, not defaults. "Nothing due today," "session
   complete," and "first run" each get real treatment.

---

## 9. Open

- Hero character font weight — pending the 語 / 電 / 曜 render test (§4)
- Whether hero glyph renders from font or from KanjiVG (§4)
- `--chart-*` ramp for the stats page (§3)
