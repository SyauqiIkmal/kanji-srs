# ADR-0001: Use FSRS instead of SM-2 for scheduling

**Status:** Accepted · **Date:** 2026-07-24

## Context

The scheduling algorithm is the core of any SRS app. SM-2 (SuperMemo,
1987) is the default choice — it's simple, well-documented, and was
Anki's algorithm for years. FSRS (Free Spaced Repetition Scheduler) is a
newer, memory-model-based scheduler that estimates each card's *stability*
and *difficulty* and schedules against a target retention rate. Anki
adopted it as an option in 2023 and made it the default in 2025.

## Decision

Use FSRS via the `ts-fsrs` package. Store its `Card` type verbatim as the
per-kanji scheduling state, and expose `requestRetention` as a user setting
(default 0.9).

## Consequences

- **Positive:** Fewer reviews for the same retention. The card state
  (`stability`, `difficulty`) is semantically meaningful, which makes the
  stats page genuinely informative rather than a review counter.
- **Positive:** `ts-fsrs` is typed, tested, and actively maintained — no
  hand-rolled scheduling logic to debug.
- **Negative:** Card state is larger and less intuitive than SM-2's
  ease-factor-and-interval. Harder to eyeball whether a schedule is
  "right"; mitigated by unit tests over the wrapper.
- **Negative:** Optimising FSRS parameters against personal review history
  needs a meaningful review corpus. Deferred — default parameters are fine
  and the optimiser can be added later without a data migration.

## Alternatives considered

- **SM-2 hand-rolled.** Rejected: writing a scheduler from a blog post is
  a well-trodden path with no upside here. FSRS is strictly better and
  the integration cost is comparable.
- **Leitner boxes.** Rejected: simpler, but too coarse to produce
  interesting progress data, and noticeably worse for a 100+ card deck.
