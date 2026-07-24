# ADR-0002: Persist to localStorage, not IndexedDB

**Status:** Accepted · **Date:** 2026-07-24

## Context

User progress (FSRS card state plus an append-only review log) must
survive browser restarts, offline. The two realistic browser options are
localStorage (synchronous, string-only, ~5 MB) and IndexedDB (async,
structured, effectively unbounded, typically wrapped with Dexie.js).

The scope is fixed at ~103 N5 kanji (see SPEC.md §5). Projected storage
after a year of daily use is roughly 1.5 MB, dominated by the review log.

## Decision

Persist the Pinia store to localStorage using
`pinia-plugin-persistedstate`. No IndexedDB, no Dexie.

## Consequences

- **Positive:** Persistence is one plugin line. No schema, no async
  hydration, no loading states in components — the store is populated
  before first render.
- **Positive:** Export/import of progress is trivial; the persisted value
  is already a JSON string.
- **Negative:** A hard ~5 MB ceiling. Reached only if the review log runs
  for several years; the mitigation (compacting old entries into daily
  aggregates) is documented in DATA-MODEL.md §4.
- **Negative:** Writes are synchronous and serialise the whole store. At
  this data size the cost is sub-millisecond and occurs once per grade —
  not a concern. It *would* be at 10,000+ cards.
- **Reversible:** The store's public interface doesn't expose the
  persistence layer, so swapping in Dexie later means changing one plugin,
  not the components.

## Alternatives considered

- **Dexie.js / IndexedDB.** Rejected as premature for this scope: async
  hydration would force loading states throughout the UI to solve a
  capacity problem that doesn't exist here.
- **`localStorage` written by hand.** Rejected: the plugin already handles
  serialisation, hydration timing, and SSR guards correctly.
