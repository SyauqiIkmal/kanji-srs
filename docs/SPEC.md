# Kanji SRS — Product Spec

**Status:** Draft · **Owner:** Taufiq · **Last updated:** 2026-07-24

---

## 1. What this is

A browser-based spaced-repetition app for learning the ~103 kanji in the
JLPT N5 set. Runs entirely client-side, works offline, stores progress
locally. No account, no server, no sync.

## 2. Who it's for

A single learner (me) working through N5 kanji, using the app daily on
both desktop and phone. Secondarily: a portfolio artifact demonstrating
front-end architecture, algorithm integration, and engineering process.

## 3. Goals

| # | Goal | Why |
|---|------|-----|
| G1 | Schedule reviews with a modern SRS algorithm (FSRS) | Better retention per review than SM-2; the interesting technical core |
| G2 | Make the kanji itself the visual focus | It's a kanji app — the glyph is the product |
| G3 | Animated stroke order for every character | Highest-value learning feature, and the demo moment |
| G4 | Usable offline on a phone | Reviews happen on commutes, not at a desk |
| G5 | Surface progress honestly (retention, forecast) | Motivation, and it proves the FSRS data is real |

## 4. Core features (v1.0)

1. **Browse** — grid of all N5 kanji, filterable by learning state
   (new / learning / review / due today).
2. **Detail** — single kanji: meanings, on'yomi, kun'yomi, stroke count,
   animated stroke order, example words.
3. **Review session** — cards due today, question → reveal → grade
   (Again / Hard / Good / Easy), keyboard-driven.
4. **Stats** — reviews per day heatmap, retention rate, upcoming due
   forecast, per-card maturity breakdown.
5. **Data management** — export progress as JSON, import it back, reset
   all progress.

## 5. Explicitly NOT doing

This list exists to be pointed at when a "quick addition" is proposed.
Changing it requires editing this file first.

- ❌ Authentication / user accounts
- ❌ Server, database, or cross-device sync
- ❌ N4 and above (data pipeline supports it; scope does not)
- ❌ Vocabulary decks (kanji only — no JMdict integration beyond the
      handful of example words baked into the static data)
- ❌ Handwriting recognition / drawing input
- ❌ Anki `.apkg` import or export
- ❌ Text-to-speech / audio
- ❌ Custom user-created decks or cards
- ❌ Theming beyond light/dark
- ❌ i18n (UI is English-only)

## 6. Definition of done (v1.0)

- [ ] All N5 kanji present with readings, meanings, and stroke data
- [ ] Review session schedules correctly via FSRS; verified by unit tests
- [ ] Progress survives a browser restart
- [ ] Stroke animation plays on detail and post-reveal review screens
- [ ] Stats page renders with ≥ 7 days of real review data
- [ ] Installable as a PWA; review session works with network disabled
- [ ] Lighthouse ≥ 95 on Performance, Accessibility, Best Practices, SEO
- [ ] CI green: lint, typecheck, unit tests, E2E happy path, build
- [ ] Deployed to a public URL
- [ ] README with animated GIF, architecture summary, and data attribution

## 7. Milestones

| Milestone | Contents |
|-----------|----------|
| `v0.1` Core loop | Data pipeline, browse, detail, review session, FSRS, persistence |
| `v0.2` Stroke order | KanjiVG integration, animation component |
| `v0.3` Stats | Heatmap, retention, forecast |
| `v0.4` Polish | PWA, a11y pass, Lighthouse, export/import |
| `v1.0` Ship | README, GIFs, deploy, tag |

## 8. Open questions

- ~~Which N5 kanji list is authoritative?~~ **Resolved — see ADR-0004.**
  There is no official list; the set is an explicit committed array seeded
  from the Tanos list (~103 characters).
- Should new cards be introduced at a fixed daily cap, or all at once?
  Leaning toward a configurable cap defaulting to 5/day.
