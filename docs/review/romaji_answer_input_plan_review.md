# Review: Romaji Text Answer Input Plan (Revised)

> **Reviewed:** 2025-07-25
> **Plan Document:** [romaji_answer_input_plan.md](../plan/romaji_answer_input_plan.md)
> **Previous Review:** [romaji_answer_input_plan_review.md](./romaji_answer_input_plan_review.md)

## Overall Assessment

The revised plan **addresses the majority of critical issues** from the previous review. Type names, composable API references, keyboard shortcuts, scope decisions, and state reset are all corrected. The plan is now **close to implementation-ready**, with a few remaining items to resolve.

---

## ✅ Issues Resolved from Previous Review

| #   | Previous Issue                                            | Status                                                                          |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Wrong type names (`kanji`/`meaning` vs `char`/`meanings`) | ✅ **Not fully fixed** — see Issue 1 below                                      |
| 2   | Wrong composable API (`rateAndAdvance` vs `grade`)        | ✅ Fixed — now correctly references `grade()`, `currentEntry`, `revealAnswer()` |
| 3   | Wrong data file path                                      | ✅ Fixed — no longer references `public/kanji.json`                             |
| 4   | `wanakana` not a dependency                               | ✅ Fixed — explicitly adds `wanakana` with install command                      |
| 5   | `app/utils/` doesn't exist                                | ✅ Fixed — notes Nuxt auto-import behavior                                      |
| 6   | No existing `toRomaji` helper                             | ✅ Fixed — plan is clearly greenfield, uses `wanakana.toRomaji()`               |
| 7   | Matching rules underspecified                             | ✅ Fixed — added matching logic table with examples                             |
| 8   | `'meaning'`/`'both'` modes underspecified                 | ✅ Fixed — scoped V1 to `'romaji'                                               | 'disabled'` |
| 9   | Keyboard shortcut conflicts (`Space` in input)            | ✅ Fixed — `Escape` for skip, `Enter` for submit                                |
| 10  | Missing state reset                                       | ✅ Fixed — explicitly resets `userAnswer`/`lastFeedback` in `grade()`           |
| 11  | Good vs Easy heuristic unclear                            | ✅ Fixed — always suggests Good (3) for correct                                 |
| 12  | Live kana preview scope creep                             | ✅ Fixed — removed entirely from V1 scope                                       |

---

## ⚠️ Remaining Issues

### 1. `KanjiEntry` Field Names Still Incorrect in Type Block

The plan's `Settings` type block (lines 68–74) shows the correct field names and defaults — good. However, the `AnswerFeedback` type (lines 76–81) is fine.

The **real issue** is that `KanjiEntry` is not shown in the plan's type block. Since `checkKanjiReading()` on line 102 takes `entry: KanjiEntry`, any implementer needs to know the actual field names. The matching logic table on lines 107–113 references `kunyomi` and `onyomi` correctly, which is consistent with the actual [KanjiEntry](file:///D:/Project/kanji-srs/app/types/index.ts#L18-L31).

**Verdict:** Minor — the plan is consistent with the actual codebase here. ✅ No action needed.

---

### 2. Matching Logic Table is Good but Incomplete

The table covers 4 cases — all correct. However, a few common scenarios are missing:

| Kanji | Reading in Data                 | User Input   | Expected Result | Why It Matters                                                                                      |
| ----- | ------------------------------- | ------------ | --------------- | --------------------------------------------------------------------------------------------------- |
| `安`  | `onyomi: ["アン"]`              | `AN` or `An` | ✅ Correct      | Case insensitivity — implied by `normalizeRomaji` but not in the table                              |
| `一`  | `onyomi: ["イチ", "イツ"]`      | `ichi`       | ✅ Correct      | Multiple onyomi — any one matches                                                                   |
| `日`  | `kunyomi: ["ひ", "-び", "-か"]` | `hi`         | ✅ Correct      | Single-char reading — very short input, prone to accidental matches                                 |
| `安`  | `kunyomi: ["やす.い"]`          | `yasui desu` | ❌ Incorrect    | Input with extra text — confirm normalization strips spaces but doesn't do substring matching       |
| `日`  | `onyomi: ["ニチ", "ジツ"]`      | `niti`       | ❓ Unclear      | Alternative romanization systems (Nihon-shiki `ti` vs Hepburn `chi`) — does `wanakana` handle this? |

**Recommendation:** Add 2-3 more rows covering case insensitivity, single-character readings, and how `wanakana.toRomaji()` handles romanization variants. This prevents ambiguity during implementation.

**Priority:** 🟡 Medium

---

### 3. `checkKanjiReading` Function Signature is Incomplete

Line 102 shows:

```typescript
export function checkKanjiReading(input: string, entry: KanjiEntry): AnswerFeedback
```

But `AnswerFeedback` is defined in `app/types/index.ts` and `KanjiEntry` is also from there. The plan should show the imports at the top of the file. The current code block (lines 87–103) imports `toRomaji` from `wanakana` and `KanjiEntry` from `~/types`, but **doesn't import `AnswerFeedback`**.

```typescript
import type { KanjiEntry, AnswerFeedback } from '~/types'
```

**Priority:** 🟢 Low — obvious to any implementer, but worth fixing for completeness.

---

### 4. No Settings Page UI Changes Mentioned

The project has 4 pages: `index.vue`, `study.vue`, `browse.vue`, `stats.vue`. There is **no dedicated settings page** — settings are likely managed in a modal or section within the dashboard.

The plan adds `answerInputMode` to `Settings` and mentions a toggle button in the study page header (line 146), which is good for quick switching. However, the plan doesn't specify where the **persistent default** is configured. If settings are managed on the dashboard or via a settings modal, that component also needs updating.

**Recommendation:** Clarify where users set their preferred default mode outside of the study session. If there's a settings modal/section, add it to the plan. If the study page toggle is the only control, state that explicitly.

**Priority:** 🟡 Medium

---

### 5. `AnswerFeedback` Type Should Include `AnswerInputMode`

The `AnswerFeedback` type (lines 76–81) doesn't account for the case when the user skips via `Escape`. When the answer phase is entered via skip (no typed answer), `lastFeedback` would be `null`, but the plan should confirm this explicitly.

Specifically: when a user presses `Escape`, does `lastFeedback` remain `null`? If so, the study page UI needs to handle three states:

1. `lastFeedback === null` → skipped, no banner shown, no grade pre-selected
2. `lastFeedback.isCorrect === true` → green banner, Good highlighted
3. `lastFeedback.isCorrect === false` → red banner, Again highlighted

This is implied but not stated.

**Priority:** 🟢 Low — but worth a one-line clarification.

---

### 6. Incorrect Example in Feedback Banner

Line 150 shows:

> 🔴 **Incorrect** "You typed `yasu` — Expected readings: `アン (an)`, `やす.い (yasui)`"

But according to the matching logic table (line 110), `yasu` **is a correct match** (matches stem before okurigana dot for `やす.い`). The error banner example contradicts the matching rules.

**Recommendation:** Change the incorrect example to something that's genuinely wrong, e.g.:

> 🔴 **Incorrect** "You typed `xyz` — Expected readings: `アン (an)`, `やす.い (yasui)`"

**Priority:** 🟡 Medium — contradictory examples will confuse implementers.

---

## 📋 Summary

| #   | Priority    | Issue                             | Action                                                            |
| --- | ----------- | --------------------------------- | ----------------------------------------------------------------- |
| 1   | ✅ Resolved | Type names                        | No action needed                                                  |
| 2   | 🟡 Medium   | Matching table incomplete         | Add case insensitivity, short readings, romanization variant rows |
| 3   | 🟢 Low      | Missing `AnswerFeedback` import   | Add import line                                                   |
| 4   | 🟡 Medium   | No settings UI changes            | Clarify where persistent default is configured                    |
| 5   | 🟢 Low      | Skip (`Escape`) feedback state    | Confirm `lastFeedback` stays `null` on skip                       |
| 6   | 🟡 Medium   | Incorrect feedback banner example | `yasu` is valid per matching rules — use `xyz` instead            |

> [!TIP]
> The plan is **ready to implement** after fixing issue #6 (contradictory example). Issues #2 and #4 are recommended but non-blocking — they can be resolved during implementation.
