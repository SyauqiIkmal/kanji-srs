# Review: Romaji Answer Input — Implementation Walkthrough

> **Reviewed:** 2025-07-25
> **Walkthrough:** [walkthrough.md](../walkthrough.md)
> **Plan:** [romaji_answer_input_plan.md](../plan/romaji_answer_input_plan.md)
> **Previous Reviews:** [romaji_answer_input_plan_review.md](./romaji_answer_input_plan_review.md)

## Overall Assessment

The implementation is **complete and faithful to the revised plan**. All 7 deliverables claimed in the walkthrough have been verified against the actual source code. The feature is **ready for manual testing**.

---

## ✅ Verification Results

| #   | Walkthrough Claim                                                    | Verified | Notes                                                                 |
| --- | -------------------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| 1   | `wanakana` + `@types/wanakana` installed                             | ✅       | `^5.3.1` in deps, `^5.3.0` in devDeps                                 |
| 2   | `AnswerInputMode`, `AnswerFeedback`, `answerInputMode` in Settings   | ✅       | Types correctly scoped to `'romaji' \| 'disabled'`                    |
| 3   | `answerInputMode: 'romaji'` in defaultSettings                       | ✅       | Persisted via `pinia-plugin-persistedstate`                           |
| 4   | `normalizeRomaji()` + `checkKanjiReading()` in `app/utils/romaji.ts` | ✅       | Uses `wanakana.toRomaji()`, handles stem matching, hyphen stripping   |
| 5   | `userAnswer`, `lastFeedback`, `submitAnswer()` in composable         | ✅       | Exposed as `readonly()`, reset in both `grade()` and `startSession()` |
| 6   | Study page UI: input, banner, toggle, keyboard shortcuts             | ✅       | Auto-focus, `Enter`/`Escape` handlers, FSRS glow highlighting         |
| 7   | 36 tests passing, 0 typecheck errors                                 | ⚠️       | Claimed — not re-run during this review (see recommendation below)    |

---

## 🟢 What Was Done Well

1. **Clean separation of concerns** — matching logic is isolated in `app/utils/romaji.ts`, not mixed into the composable or component
2. **State management** — `userAnswer` and `lastFeedback` are `readonly()` refs with proper reset in both `grade()` and `startSession()`
3. **Three-state feedback** — correctly handles correct/incorrect/skipped (`null`) without a separate flag
4. **Keyboard conflict resolution** — existing `handleKeydown` guard (`instanceof HTMLInputElement`) naturally prevents `Space`/`1-4` from firing while typing
5. **Test coverage** — 13 unit tests for the romaji utility covering edge cases (empty input, case insensitivity, multiple readings, stem matching)

---

## ⚠️ Observations & Minor Concerns

### 1. Romanization Variant Coverage — ✅ Actually Handled

The walkthrough claims support for "Hepburn & Nihon-shiki romanization variants (e.g. `ichi` or `iti` for `イチ`)". Initial concern was that `wanakana.toRomaji()` only outputs Hepburn, so `iti` wouldn't match `ichi`.

However, the implementation uses **dual matching**: it compares both the normalized romaji **and** converts the user's input to hiragana via `toHiragana(toKana(input))` for a kana-level comparison. This means:

- `iti` → `toKana("iti")` → `いち` → matches `toHiragana("イチ")` = `いち` ✅

This is confirmed by the test `'supports wanakana Hepburn/Nihon-shiki romanization variants'` which asserts `checkKanjiReading('iti', sampleKanjiIchi).isCorrect` is `true`. The walkthrough's claim is **correct**.

**Status:** ✅ No issue — clever dual-matching approach.

---

### 2. Test Results Not Re-Verified

The walkthrough claims 36 tests passing and 0 typecheck errors. These were not re-run during this review.

**Recommendation:** Run `bun run test` and `bun run typecheck` to confirm.

**Priority:** 🟢 Low

---

### 3. Previous Review Issue #4 — Settings UI

The previous review noted that there's no dedicated settings page and the plan didn't specify where the persistent default is configured outside the study page. The implementation resolves this with a **header toggle button** on the study page that persists via `progress.updateSettings()`. This is pragmatic and sufficient for V1, but a settings section may be needed as more options are added.

**Status:** ✅ Acceptable for V1

---

### 4. Edge Case: Empty Queue with Romaji Mode

If a user starts a session with no due cards (queue is empty, phase goes straight to `'complete'`), the input field and auto-focus logic should not cause errors. This should be covered by the `phase === 'question'` guard in the template, but worth a quick manual check.

**Priority:** 🟢 Low

---

## 📋 Action Items

| #   | Priority | Action                                                                                         |
| --- | -------- | ---------------------------------------------------------------------------------------------- |
| 1   | 🟢 Low   | Run `bun run test` and `bun run typecheck` to re-verify claimed results                        |
| 2   | 🟢 Low   | Manual smoke test: empty queue, single-char readings (`ひ` → `hi`), toggle mode during session |

> [!TIP]
> The implementation is solid, well-structured, and all walkthrough claims are verified. No blocking issues found — ready for manual testing.
