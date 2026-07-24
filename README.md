# Kanji SRS

A client-side spaced-repetition study app for JLPT N5 kanji, built with Nuxt 4, Tailwind CSS v4, FSRS scheduling algorithm, and shadcn-vue.

**Live Demo:** [kanjisrs.netlify.app](https://kanjisrs.netlify.app/)

---

## ✨ Features

- **FSRS Scheduling Algorithm:** Powered by `ts-fsrs` with customizable target retention rate and memory stability calculations.
- **103 JLPT N5 Kanji Deck:** Complete dataset with Katakana On'yomi, Hiragana Kunyomi, English meanings, school grade, newspaper frequency rank, and curated N5 example vocabulary.
- **Animated Stroke Order:** Interactive SVG stroke order animations powered by KanjiVG data with step controls, speed multiplier, and stroke start numbers.
- **Traditional Japanese Aesthetic:** Rice paper background ground, sumi ink typography (`Noto Serif JP`), and vermillion 朱色 primary accent.
- **Keyboard-Driven Study Session:** Press `Space` to reveal answer, `1` for Again, `2` for Hard, `3` for Good, and `4` for Easy.
- **PWA & Offline Ready:** Configured with Workbox service worker caching and web app manifest for standalone mobile installation.
- **Data Privacy & Local First:** Zero server or authentication requirement — progress persists to browser `localStorage` with JSON export & import options.

---

## 🛠️ Stack

- **Framework:** Nuxt 4 (Vue 3)
- **Styling:** Tailwind CSS v4
- **Components:** shadcn-vue (Reka UI)
- **SRS Engine:** `ts-fsrs`
- **Testing:** Vitest (Unit) & Playwright (E2E)
- **Package Manager:** bun

---

## 🚀 Development

```bash
# Install dependencies
bun install

# Start local development server
bun run dev

# Build production bundle
bun run build

# Run unit tests
bun run test

# Run E2E tests
bun run test:e2e
```

---

## 📜 Scripts

| Command                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `bun run dev`          | Start local development server (`localhost:3000`) |
| `bun run build`        | Build production bundle                           |
| `bun run generate`     | Generate static site bundle                       |
| `bun run lint`         | Run ESLint linter                                 |
| `bun run format`       | Format codebase with Prettier                     |
| `bun run format:check` | Verify formatting in CI                           |
| `bun run typecheck`    | Run TypeScript type checking                      |
| `bun run test`         | Run Vitest unit tests                             |
| `bun run test:e2e`     | Run Playwright E2E tests                          |

---

## 📚 Documentation

- [SPEC.md](docs/SPEC.md) — Product specification & goals
- [DESIGN.md](docs/DESIGN.md) — Design system tokens & typography
- [DATA-MODEL.md](docs/DATA-MODEL.md) — Static data & user state schema
- [PHASE1.md](docs/PHASE1.md) — Phase 1 data layer & core logic
- [PHASE2.md](docs/PHASE2.md) — Phase 2 study UI & pages
- [PHASE3.md](docs/PHASE3.md) — Phase 3 animated stroke order
- [PHASE4.md](docs/PHASE4.md) — Phase 4 PWA, offline & E2E tests
- [ADRs](docs/adr/) — Architecture decision records

---

## 📄 Data Attribution

- **KANJIDIC2:** Kanji dictionary data is property of the Electronic Dictionary Research and Development Group (EDRDG), used under CC BY-SA 3.0.
- **KanjiVG:** Stroke order SVG path data is copyright © Ulrich Apel, used under CC BY-SA 3.0.

---

## ⚖️ License

MIT
