# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev           # Start Electron app in dev mode
pnpm build         # Build all packages and the app
pnpm typecheck     # Type-check all packages
pnpm lint          # Lint all packages
pnpm test          # Run all tests

# Single package
pnpm --filter @card-draft/core test
pnpm --filter @card-draft/core generate   # Generate Drizzle migrations
pnpm --filter @card-draft/desktop typecheck
```

## Architecture

Turborepo monorepo with pnpm workspaces. Three workspace roots: `apps/*`, `packages/*`, `templates/*`.

```
apps/desktop/         Electron app (electron-vite: main + preload + renderer)
packages/core/        DB schema (Drizzle/SQLite), export pipeline (PNG/PDF), MSE importer
packages/template-runtime/  React-Konva canvas primitives, ManaText symbol renderer, SES sandbox
packages/ui/          Shared Tailwind/shadcn utilities
templates/magic-m15/  The M15 card template (manifest.json + template.tsx + logic.ts + assets/)
```

### Renderer stack
React 19 + Tailwind CSS v4 + shadcn/ui (zinc dark theme). State: Zustand with Zundo for undo/redo. Async: TanStack React Query wrapping IPC calls. Forms: React Hook Form + Zod. Canvas: Konva/react-konva at 744×1039 logical px.

### IPC / data flow
Renderer → `window.api.*` (contextBridge) → electron-trpc procedures → Electron main process → better-sqlite3 / Drizzle ORM → `.carddraft` SQLite file in `app.getPath('userData')`.

IPC surface defined in `electron/preload.ts`. Handlers live in `electron/ipc/` (sets, cards, templates, export).

### Workspace aliases
Since pnpm workspace packages can't be bundle-resolved directly by Vite, all `@card-draft/*` imports are aliased in `electron.vite.config.ts` to point at source files. Sub-path exports like `@card-draft/core/types` must each have an explicit alias entry. TypeScript paths in `tsconfig.web.json` mirror these aliases.

### Template system
Each template is a directory under `templates/` with:
- `manifest.json` — field definitions, card dimensions, game metadata (validated by Zod in `template-runtime`)
- `template.tsx` — React component rendering onto a Konva Layer
- `logic.ts` — pure helpers run in an SES Compartment sandbox at runtime

In Phase 1, templates are bundled with the app (no dynamic install). The renderer lazy-imports `@card-draft/templates/magic-m15/template`.

### Database migrations
Drizzle migrations are generated via `pnpm --filter @card-draft/core generate`. The Electron main process applies them at startup. If no journal file exists (first run), migrations are skipped — run `generate` first to create them.

### Electron main process
`electron/main.ts` uses ES module format (`import electron from 'electron'`). The preload script compiles to `dist/preload/preload.mjs`. The `better-sqlite3` native module is shimmed in the renderer build (`electron/shims/better-sqlite3.ts`) so it only loads in the main process.

### index.html location
`index.html` lives at `src/index.html`. The renderer config sets `root: resolve(__dirname, 'src')`, so Vite serves from `src/` and the script src `/main.tsx` resolves to `src/main.tsx`.
