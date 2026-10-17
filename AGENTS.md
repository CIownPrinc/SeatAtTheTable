# AGENTS.md

Simple rules for anyone (human or AI) working in this repo. Keep them. If you must break one, say why in the PR.

**Looking for a plan, an audit, or "what's next"?** `TODO.md`'s doc table indexes every
planning/reference `.md` file in this repo. Check there before searching — it's the whole
list, kept current on purpose.

## How to talk to me (the maintainer)

- Write in plain English. Only reach for a technical term when it is the clearest word, then explain it once.
- Teach as you go. When you introduce a technology, tool, or pattern, explain it from first principles: what problem it solves, the smallest building block, then how we use it. Do not assume I already know it.
- Keep the detail. "Simple" means plain words, not fewer concepts. Do not flatten nuance or drop granularity to sound clean.
- Don't pad. No filler, no jargon for its own sake.
- Ask me the design decisions. Walk me from Low-Level Design (a function's shape, a type) up to System Design (services, data flow) and Product Design (what the user gets and why). When there's a real fork, ask — don't guess.
- Explain bugs when they happen: what broke, why it happened, and why it matters. A bug is a lesson, not just a fix.

## Language & types

- **TypeScript everywhere on the frontend.** `strict` mode is on and stays on. No implicit `any`.
- **Strong types are the contract.** Prefer `interface`/`type` over loose objects. Every function has a typed signature; public functions get an explicit return type.
- **Interfaces for behavior.** When something has more than one implementation (or might), define an interface for it and depend on the interface, not the concrete thing.
- **Tunable by design.** Game balance, thresholds, costs, timings — anything we might fine-tune — lives in named, typed config constants in one place, never as magic numbers buried in logic.

## Architecture

- **One monolith, one monorepo.** pnpm workspaces + Turbo. Do NOT split into microservices. Shared code goes in `packages/*`; the game is `SeatAtTheTable/`.
- **V1 is feature-frozen and stays on its own stack:** Vite + strict TypeScript + three.js, no framework. Finish and fix it; don't migrate it. New features and the web stack below belong to the remake — see `SEATATTHETABLE2.md`.
- **Web stack (for the V2 remake):** Next.js (App Router) + React + shadcn/ui (components) + Tailwind + Framer Motion (animation) + TanStack Query (server state). Use them; don't hand-roll what they already do.
- **Use TanStack Query only for server state** (data that lives on a backend: save/load, auth, leaderboards). Local game state (cash, ticks, the world) is client state — keep it in a proper client state layer, not in Query.

## Don't reinvent the wheel

- Reach for a well-maintained library before writing your own. UI primitives → shadcn/ui. Icons → the configured icon set (lucide). Animation → Framer Motion. Dates, math, validation, etc. → an established package.
- Only hand-write something when no good library exists, or the library is genuinely wrong for the job. If you hand-roll, say why.

## Data & SQL

- V1 has no database; saves live in the browser. When V2 adds one: **all SQL goes through an ORM (Prisma).** No raw SQL strings in app code. Schema changes go through Prisma migrations, on one Prisma version.

## Testing (TDD)

- **Test-first.** Write the failing test, then the code that makes it pass, then clean up.
- Three levels, all present:
  - **Unit** — one function/module in isolation (Vitest).
  - **Integration** — modules working together (and the DB, once there is one).
  - **End-to-end** — the real app in a browser (Playwright).
- A change to product code ships with tests. Bug fixes start with a test that reproduces the bug.

## Quality gates (never push junk to main)

- **Husky** blocks bad pushes. `pre-push` already runs `lint && test && build`; keep it green. Add a `pre-commit` for fast checks (format + lint) as we grow.
- **Linters:**
  - TypeScript/JS → ESLint (flat config at root).
  - Python (when we add any) → Ruff.
- **Formatting** → Prettier. Run before committing.
- Branch off `main`; open a PR; gates must pass before merge.

## Comments (enforced by `eslint-plugin-comment-policy`)

- A `//` comment MUST start with one of: `// LEGAL:`, `// TODO:`, `// COMPLIANCE:`.
- Comments are for **legal notes, TODOs, or compliance** — never to restate what the code does, narrate the implementation, or leave debugging chatter. If code needs a comment to be understood, rename things until it doesn't.

## Package & tool managers

- **JavaScript/TypeScript → pnpm.** Never `npm` or `yarn`. Node version is pinned in `.node-version` (20).
- **Python (when we add any) → uv.** Never bare `pip`.

## Guiding principles (the "why" behind the rules)

We follow four books. In one line each:

- **Extreme Programming** — test-first, small steps, always-green build, refactor constantly.
- **Clean Code** — small functions, honest names, no comments-as-crutch, one reason to change per unit.
- **Code Complete** — defensive coding, isolate complexity behind clean interfaces, tables/config over sprinkled constants.
- **The Pragmatic Programmer** — DRY, use the right tool, don't reinvent, fix broken windows early, make it easy to change.

## Not here yet (forward-looking rules)

These describe intent for code we don't have today. Don't build them until we've designed them together:

- **Python service / ML classification.** There is currently NO Python and NO ML in this repo. If/when we add a classifier (e.g. to "pick up readings" — needs a product definition first), use a real, appropriate model, not a generic quick hack. Package it with uv, lint with Ruff, test at all three levels.
