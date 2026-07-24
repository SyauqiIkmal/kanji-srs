# ADR-0004: Define the N5 set as an explicit committed list

**Status:** Accepted · **Date:** 2026-07-24

## Context

The app's entire content scope is "the N5 kanji" (SPEC.md §4). That set
has to be pinned down before the data pipeline can run — and it turns out
to be genuinely ambiguous.

**There is no official list.** The Japan Foundation deliberately does not
publish a Test Content Specification for the post-2010 N1–N5 levels, on
the grounds that studying from fixed lists is undesirable. Every list in
circulation is reverse-engineered from pre-2010 exams. Published counts
for N5 range from 78 to 134:

| Count    | Where it appears                             |
| -------- | -------------------------------------------- |
| 78–80    | JLPTsensei, Japanesetest4you, Jisho.org (79) |
| ~100–103 | Tanos, NIHONGO ICHIBAN, JLPT Samurai         |
| 112      | Hirakan (deliberately padded for coverage)   |
| 134      | Assorted app-specific lists                  |

**KANJIDIC2's `jlpt` field is not what it looks like.** Per the EDRDG
documentation it records the _pre-2010_ level (values 1–4 only). Old
level 4 maps to N5 and old level 3 to N4; old level 2 was split between
N2 and N3. There is no value `5` in the file. A filter of `jlpt === 5`
silently returns an empty set.

## Decision

Two parts.

**1. The N5 set is an explicit array, not a query.**
`data/n5-list.ts` exports a hand-committed array of characters. The build
script (`scripts/build-data.ts`) iterates _that_ array and uses KANJIDIC2
solely to look up fields — readings, meanings, stroke count, grade,
frequency. KANJIDIC2's `jlpt` field is never used as a selector.

**2. The array is seeded from the Tanos (Jonathan Waller) list,** ~103
characters.

The script asserts an expected length and fails the build on mismatch, and
asserts that every character has a corresponding KanjiVG entry.

## Consequences

- **Positive:** The scope of the app is a reviewable diff in one file with
  a provenance comment, rather than an emergent property of an
  externally-controlled field with counter-intuitive semantics.
- **Positive:** Adding or removing a character is a one-line change that
  touches no pipeline logic.
- **Positive:** Choosing the Tanos list means the app's contents match
  what Jisho, Tanoshii Japanese, and kanjiapi.dev-derived datasets show.
  Anyone cross-checking will find agreement. This matters more than
  matching the smallest defensible count.
- **Positive:** The build-time assertions turn an upstream data change
  from a blank card discovered mid-review into a failed CI run.
- **Negative:** ~23 characters more than the minimalist 80-kanji lists.
  They are all high-frequency (万, 午, 半, and similar) — no real cost.
- **Negative:** The list is now a manually maintained artifact. Acceptable:
  it changes approximately never, and "approximately never" is exactly
  what a committed constant is for.

## Alternatives considered

- **Filter KANJIDIC2 on `jlpt === 4`.** Rejected as the _source of truth_,
  though it is a reasonable cross-check. It yields ~80 characters, hides
  the scope decision inside pipeline code, and encodes a mapping
  (old-4 ⇒ N5) that a future reader has to rediscover.
- **Use the 112-character padded list.** Rejected: buys exam-hedging
  coverage this project doesn't need, since nobody is actually sitting
  the JLPT off the back of it.
- **Use the 78–80 minimalist list.** Rejected: smaller, but diverges from
  what the most widely used tools display.

## Notes for implementation

- Seed the array from a kanjiapi.dev-derived dataset (several pre-filtered
  N1–N5 JSON mirrors exist and cite Waller for level data), then paste the
  characters in. Keep KANJIDIC2 as the field source so attribution stays
  to a single dictionary.
- Tanos lists are **non-cumulative** — the N4 list excludes N5 characters.
  Irrelevant at current scope; relevant the moment N4 is added.

## Related

- Supersedes the first open question in SPEC.md §8.
- Depends on ADR-0003 (build-time processing).
