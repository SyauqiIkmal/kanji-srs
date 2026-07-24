# Architecture Decision Records

Short documents capturing decisions that were non-obvious at the time they
were made, and would otherwise be re-litigated later.

**Format:** Context → Decision → Consequences → Alternatives considered.
Target ~200 words. If it needs more, the decision probably wasn't ready.

**When to write one:** a choice that (a) is expensive to reverse, (b) had a
credible alternative, and (c) someone reading the code would reasonably
ask "why did they do it that way?"

**Statuses:** Proposed · Accepted · Superseded by ADR-XXXX

| # | Title | Status |
|---|-------|--------|
| [0001](0001-use-fsrs-over-sm2.md) | Use FSRS instead of SM-2 for scheduling | Accepted |
| [0002](0002-localstorage-over-indexeddb.md) | Persist to localStorage, not IndexedDB | Accepted |
| [0003](0003-build-time-json-over-runtime-parsing.md) | Pre-process dictionary data at build time | Accepted |
| [0004](0004-n5-kanji-list-source.md) | Define the N5 set as an explicit committed list | Accepted |
