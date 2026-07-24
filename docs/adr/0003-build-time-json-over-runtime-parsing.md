# ADR-0003: Pre-process dictionary data at build time

**Status:** Accepted · **Date:** 2026-07-24

## Context

Kanji content comes from two open datasets:

- **KANJIDIC2** — a ~19 MB XML file covering ~13,000 characters, with
  readings, meanings, stroke counts, and JLPT/grade metadata.
- **KanjiVG** — one SVG file per character containing ordered stroke
  paths, several thousand files totalling ~100 MB.

The app needs roughly 0.8% of this: 103 characters, a subset of fields.

## Decision

A Node script (`scripts/build-data.ts`) parses both sources offline,
filters to the N5 set, extracts only the required fields, and emits
`kanji.json` and `strokes.json`. Both outputs are committed to the repo
and imported statically. Raw XML and SVG sources are **not** committed —
the script fetches or reads them from a gitignored `data/raw/` directory,
and the README documents how to obtain them.

## Consequences

- **Positive:** ~225 KB of JSON ships instead of ~120 MB of source data.
  No XML parser in the client bundle, no parsing cost at boot.
- **Positive:** The app is a pure static site — no server needed to serve
  or transform data, so it deploys to any static host.
- **Positive:** Extending to N4 is a script re-run, not an architecture
  change.
- **Negative:** Generated files in version control. Accepted deliberately:
  it keeps `npm install && npm run dev` working without a data-fetch step,
  which matters for anyone cloning the repo. Regeneration is idempotent
  and diffs are reviewable.
- **Negative:** Data updates require running the script and committing.
  Upstream changes rarely, so this is near-zero maintenance.

## Alternatives considered

- **Parse XML in the browser at runtime.** Rejected: shipping 19 MB and a
  parser to extract 45 KB is indefensible on any metric.
- **Query an external dictionary API at runtime.** Rejected: breaks the
  offline requirement (SPEC.md §3, G4) and introduces a dependency the
  project can't control.
- **Commit raw sources too.** Rejected: bloats clone size for no benefit;
  the licences require attribution, not redistribution.

## Attribution

Both datasets are CC BY-SA. KANJIDIC2 is from the Electronic Dictionary
Research and Development Group; KanjiVG is by Ulrich Apel. Attribution
belongs in the README and in an in-app "About" section.
