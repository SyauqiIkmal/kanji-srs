# Kanji SRS

A spaced-repetition study app for JLPT N5 kanji, built with Nuxt 4, Tailwind CSS v4, and shadcn-vue.

**Live:** [kanjisrs.netlify.app](https://kanjisrs.netlify.app/)

## Stack

- **Framework:** Nuxt 4 (Vue 3)
- **Styling:** Tailwind CSS v4
- **Components:** shadcn-vue (Reka UI)
- **SRS algorithm:** FSRS
- **Package manager:** bun

## Development

```bash
bun install
bun run dev
```

## Scripts

| Command                | Description            |
| ---------------------- | ---------------------- |
| `bun run dev`          | Start dev server       |
| `bun run build`        | Production build       |
| `bun run generate`     | Static site generation |
| `bun run lint`         | Run ESLint             |
| `bun run format`       | Format with Prettier   |
| `bun run format:check` | Check formatting (CI)  |
| `bun run typecheck`    | Type-check with Nuxt   |
| `bun run test`         | Run Vitest             |
| `bun run test:e2e`     | Run Playwright         |

## Docs

- [SPEC.md](docs/SPEC.md) — Product specification
- [DESIGN.md](docs/DESIGN.md) — Design system tokens
- [DATA-MODEL.md](docs/DATA-MODEL.md) — Data model
- [PHASE1.md](docs/PHASE1.md) — Phase 1 data layer & core logic
- [ADRs](docs/adr/) — Architecture decision records

## License

MIT
