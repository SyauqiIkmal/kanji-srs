# Repo Setup Runbook

One-time initialization for the Kanji SRS project. Follow in order.

**Stack:** Nuxt 4 · Tailwind v4 · shadcn-vue (Reka UI) · bun · Windows

**Why this order:** process scaffolding — formatting, linting, CI — comes
_before_ the first feature. Retrofitting commit hooks onto eighty commits
named "update" is miserable, and a clean history is a large part of what
makes the repo read as a real project rather than a tutorial follow-along.

Tooling is layered so each gate can be verified alone: Prettier, then
ESLint, then hooks, then CI. Installing them together means debugging
three things at once when one misfires.

Budget roughly one focused evening for steps 1–13. No feature code until
step 14.

---

## 0. Prerequisites

```bash
node --version   # 20.x or 22.x LTS — still needed by some tooling
bun --version    # 1.2+ preferred (writes text lockfiles)
git --version
gh --version     # GitHub CLI, used in step 12
```

### bun command mapping

If you're reading other guides written for pnpm/npm:

| Elsewhere              | Here           |
| ---------------------- | -------------- |
| `pnpm add -D x`        | `bun add -d x` |
| `pnpm dlx x` / `npx x` | `bunx x`       |
| `pnpm exec x`          | `bunx x`       |
| `pnpm run x`           | `bun run x`    |

**Always `bun run test`, never `bun test`.** The latter invokes Bun's own
test runner, bypasses Vitest entirely, and reports zero tests found. This
costs everyone five confusing minutes exactly once.

---

## 1. Scaffold Nuxt

```bash
bun create nuxt@latest kanji-srs
cd kanji-srs
bun add -d typescript
```

Prompt answers:

| Prompt                                        | Answer  |
| --------------------------------------------- | ------- |
| Package manager                               | **bun** |
| Initialize git repository                     | **Yes** |
| Would you like to browse and install modules? | **No**  |

Decline the module browser — you add `shadcn-nuxt` and `@nuxt/eslint`
explicitly in later steps, and the browse flow pulls in extras that are
exactly the scope creep SPEC §5 exists to prevent.

The scaffold runs `git init` for you, so there's no separate init step.

> If you hit `ERROR: Cannot read properties of undefined (reading 'sys')`,
> the explicit `typescript` install above is the fix.

Nuxt 4 puts source under `app/`. All paths below assume that.

---

## 2. Prettier, `.gitignore`, and the first commit

Formatting the scaffold _before_ the first commit means your history
starts from a clean baseline instead of carrying a reformat-everything
commit later.

```bash
git branch -M main
bun add -d prettier
```

`eslint-config-prettier` comes later, with ESLint. Prettier standalone
needs nothing else.

### `.prettierrc`

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "all",
  "endOfLine": "lf"
}
```

`endOfLine: "lf"` is not optional on Windows. Without it, Prettier and Git
disagree about line endings and you get diffs where every line appears
changed.

### `.gitattributes`

```gitattributes
* text=auto eol=lf
bun.lockb binary
```

The second line only matters if you're on bun < 1.2, which writes a binary
`bun.lockb`. Check with `ls bun.lock*`. Bun 1.2+ writes a text `bun.lock`
that diffs fine. Either way, **commit the lockfile.**

### `.prettierignore`

```
.nuxt
.output
dist
node_modules
bun.lock
bun.lockb
app/components/ui
data/
```

Two deliberate entries: `app/components/ui` holds shadcn-vue's generated
components — leaving them unformatted means `shadcn-vue add` produces
clean diffs instead of reformatting churn. `data/` keeps Prettier away
from generated kanji JSON, which it would reflow into something enormous.

### `.gitignore` additions

Append to what the scaffold generated:

```gitignore
# Raw dictionary sources — see ADR-0003
data/raw/

# Local env
.env
.env.local
```

### Scripts

Add to the existing `"scripts"` block in `package.json` — keep `dev`,
`build`, `generate`, `preview`, `postinstall`:

```json
{
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

`format:check` fails instead of writing; that's the one CI calls.

### Commit

```bash
bun run format
git add -A
git commit -m "chore: scaffold nuxt 4 project"
```

From here on, every commit follows Conventional Commits. Step 8 enforces
it mechanically.

---

## 3. Tailwind CSS v4

```bash
bun add -d tailwindcss @tailwindcss/vite
```

Replace everything in `app/assets/css/tailwind.css`:

```css
@import 'tailwindcss';
```

Update `nuxt.config.ts`:

```ts
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [tailwindcss()],
  },
})
```

```bash
git add -A && git commit -m "chore: add tailwind css v4"
```

---

## 4. shadcn-vue

**Order matters.** Module → `nuxi prepare` → `init`. Running `init` before
the `.nuxt` folder exists writes a `components.json` pointing at paths that
don't exist, and the failure is confusing.

```bash
bunx nuxi@latest module add shadcn-nuxt
```

Add the config block to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  // ...existing
  modules: ['shadcn-nuxt'],
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },
})
```

Generate `.nuxt`, then initialize:

```bash
bunx nuxi prepare
bunx shadcn-vue@latest init
```

### CLI prompt answers

| Prompt            | Answer                                          | Why                                     |
| ----------------- | ----------------------------------------------- | --------------------------------------- |
| Component library | **Reka UI**                                     | The current shadcn-vue primitive layer  |
| Icon library      | **Lucide**                                      | See step 6                              |
| Font              | **Plus Jakarta Sans** if listed, else **Inter** | DESIGN.md §4; scroll — the list is long |
| Base color        | **Neutral**                                     | Overwritten in step 5; least to undo    |

The font prompt covers **Latin UI text only**. Your Japanese face is step 7
and is entirely manual — the CLI won't touch it. Don't pick "Noto Sans"
hoping it helps; different family from Noto Serif JP, and it won't cover
kanji.

### Add components

```bash
bunx shadcn-vue@latest add button card badge progress \
  tooltip dropdown-menu dialog separator skeleton
```

```bash
git add -A && git commit -m "chore: add shadcn-vue with reka ui"
```

### Note on DESIGN.md §2

The token-format warning there is **resolved by Tailwind v4**. On v4, tokens
are complete color values referenced through `@theme inline`, and opacity
modifiers work via `color-mix()`. Your `hsl(42, 36%, 95%)` values work
as-is — no unwrapping needed.

The warning still applies if you ever drop to v3. Amend §2 to read
"resolved — using Tailwind v4" rather than deleting it; the reasoning is
worth keeping on record.

---

## 5. Design tokens

Open `app/assets/css/tailwind.css` and paste the `:root` and `.dark` blocks
from DESIGN.md §3, plus the grade tokens and the two groups flagged as
missing there (`--popover*`, `--chart-*`).

**Verify before moving on.** Set a `<div>` to `bg-background text-foreground`
and confirm it renders rice-paper cream, not white. White means `@theme
inline` isn't wired up, and every subsequent step will look subtly wrong.

```bash
git add -A && git commit -m "feat: apply design tokens"
```

---

## 6. Icons

```bash
bun add lucide-vue-next
```

Lucide because shadcn-vue's own components import it internally — the
Dialog close button, Select chevron, Dropdown check marks. Any other set
means two icon libraries in the bundle, with yours visually mismatched
against ones you didn't write.

**One adjustment for Direction A.** Lucide defaults to 2px stroke, which
reads heavy beside your 1px hairlines and 0.25rem radius:

```vue
<Sun :size="18" :stroke-width="1.5" />
```

Add `--icon-stroke: 1.5` to DESIGN.md so it doesn't drift per component.

If you later need an icon lucide lacks, `@nuxt/icon` gives you Iconify's
whole catalogue on demand — but keep lucide as the default or you'll end
up with a grab bag.

---

## 7. Japanese fonts

Per DESIGN.md §4, subsetting is mandatory. Full Noto Serif JP is multiple
MB per weight and will sink the Lighthouse ≥95 target in SPEC §6.

```bash
bun add -d glyphhanger
```

Subset to your 103 kanji plus both kana sets plus Latin, drop the `.woff2`
into `app/assets/fonts/`, declare `@font-face` with `font-display: swap`,
and preload the subset in `nuxt.config.ts`.

You can defer this — but put it in a milestone, not in "later."

---

## 8. ESLint, formatting integration, and hooks

```bash
bun add -d eslint @nuxt/eslint eslint-config-prettier \
  husky lint-staged @commitlint/cli @commitlint/config-conventional
```

Add `@nuxt/eslint` to `modules` in `nuxt.config.ts`, then regenerate:

```bash
bunx nuxi prepare
```

### The two ESLint config files

This trips people up. There are two, and only one is yours:

| File                       | Origin                  | Committed?      |
| -------------------------- | ----------------------- | --------------- |
| `.nuxt/eslint.config.mjs`  | Generated by the module | No — gitignored |
| `eslint.config.mjs` (root) | **You write it**        | Yes             |

Create the root one:

```js
// eslint.config.mjs
import withNuxt from './.nuxt/eslint.config.mjs'
import prettier from 'eslint-config-prettier'

export default withNuxt(prettier)
```

`prettier` must come **last** — it exists to switch off rules that would
fight Prettier, so it has to override them.

### `commitlint.config.js`

```js
export default { extends: ['@commitlint/config-conventional'] }
```

### `.lintstagedrc.json`

```json
{
  "*.{ts,vue,js}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

### Hooks

```bash
bunx husky init
echo "bunx lint-staged" > .husky/pre-commit
echo 'bunx commitlint --edit "$1"' > .husky/commit-msg
```

### Scripts

```json
{
  "lint": "eslint .",
  "typecheck": "nuxt typecheck"
}
```

### Verify the gate actually fires

```bash
git commit --allow-empty -m "bad message"          # must FAIL
git commit --allow-empty -m "chore: verify hooks"  # must pass
```

**Do not skip this.** Husky changed its install mechanism across major
versions, and a hook that isn't wired up looks identical to one that is
until you try to break it. A gate you believe in but that isn't running is
worse than no gate.

```bash
git add -A && git commit -m "chore: add eslint, commitlint, and git hooks"
```

---

## 9. Testing

```bash
bun add -d vitest @vue/test-utils happy-dom @nuxt/test-utils
bun add -d @playwright/test
bunx playwright install --with-deps chromium
```

Scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test"
}
```

Don't write tests yet — there's nothing to test. Per the plan, the first
real ones target the FSRS wrapper once it exists (step 14).

```bash
git add -A && git commit -m "chore: add vitest and playwright"
```

---

## 10. CI

Now, and not earlier — `lint`, `typecheck`, and `test` only started
existing in steps 8 and 9. Running CI before them just produces red builds.

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bunx nuxi prepare
      - run: bun run format:check
      - run: bun run lint
      - run: bun run typecheck
      - run: bun run test
      - run: bun run build
```

Two things that aren't obvious:

- `nuxi prepare` before the checks is **required**. Without it, typecheck
  fails on missing auto-import types.
- No `actions/setup-node`, no separate cache step — `setup-bun` handles
  both.

E2E gets its own job once there's a happy path worth testing.

```bash
git add -A && git commit -m "ci: add verification workflow"
```

---

## 11. Docs

```bash
mkdir -p docs/adr
```

Drop in `SPEC.md`, `DATA-MODEL.md`, `DESIGN.md`, and `docs/adr/` (README
plus ADRs 0001–0004). Leave `ai-studio-brief.md` out — working material,
not a project doc.

```bash
git add -A && git commit -m "docs: add spec, data model, design system, and ADRs"
```

---

## 12. GitHub

```bash
gh repo create kanji-srs --public --source=. --push
```

Then configure:

- **Branch protection on `main`** — require the CI check, require a PR.
  Yes, even solo. It's what forces the PR trail that makes the history
  readable.
- **Milestones** matching SPEC §7: `v0.1 Core loop`, `v0.2 Stroke order`,
  `v0.3 Stats`, `v0.4 Polish`, `v1.0 Ship`.
- **Labels:** `feat`, `fix`, `chore`, `docs`, `data`, `a11y`, `perf`.
- **Projects board** — Todo / In Progress / Done.

Write the v0.1 issues _before_ building: data pipeline script, N5 list
constant, browse grid, kanji detail page, FSRS wrapper, progress store,
review session UI, persistence.

---

## 13. Deploy the empty scaffold

Connect to Vercel, Netlify, or Cloudflare Pages. Build command
`bun run generate`, output directory `.output/public`.

Deploying on day one surfaces static-build problems — SSG output paths,
base URL, font preloading — while there are ten files to debug instead of
two hundred.

Put the URL in the README now.

```bash
git add -A && git commit -m "docs: add readme with live url"
```

---

## 14. First feature branch

Scaffolding done. Now build.

```bash
git checkout -b feat/data-pipeline
```

Start with the data pipeline (ADR-0003, ADR-0004) — everything else
depends on real kanji data existing. Open a PR when it works, write a real
description, let CI verify it.

---

## Sanity checklist

- [ ] `bun run dev` serves a page
- [ ] `bg-background` renders rice-paper cream, not white
- [ ] A non-conventional commit message is **rejected**
- [ ] Unformatted code is auto-fixed on commit
- [ ] `bun run test` invokes Vitest (not Bun's runner)
- [ ] CI is green on a PR
- [ ] `bun run generate` produces a working static build
- [ ] Live URL loads
- [ ] `docs/` is committed, `data/raw/` is not
- [ ] Milestones and v0.1 issues exist

---

## On the commands

Setup commands for this stack change often. The above matches the
shadcn-vue Nuxt guide as of July 2026 (Tailwind v4 path). If something
fails, check the official installation page before debugging your own
typing — it's more likely a flag changed.
