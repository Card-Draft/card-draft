# Contributing to Card Draft

Thank you for your interest in contributing! Card Draft is fully open source under the MIT license.

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)
- Git

### Setup

```bash
git clone https://github.com/card-draft/card-draft.git
cd card-draft
pnpm install
pnpm dev
```

The app opens automatically. That's it — one command from clone to running app.

### Project Structure

```
apps/desktop/         — Electron app (main + renderer)
packages/core/        — Shared business logic, DB schema, export pipeline
packages/template-runtime/  — Canvas primitives + SES sandbox
packages/ui/          — Shared design system utilities
templates/magic-m15/  — Official MTG M15 frame template
```

## Development Workflow

```bash
pnpm dev              # Start all apps in dev mode (hot reload)
pnpm typecheck        # Type-check all packages
pnpm lint             # Lint all packages
pnpm test             # Run unit tests (Vitest)
```

## Making Changes

1. Fork the repo and create a branch: `git checkout -b feat/my-feature`
2. Make your changes
3. Run `pnpm typecheck && pnpm lint && pnpm test` — all must pass
4. Open a Pull Request against `main`

## Creating Templates

Templates are the heart of Card Draft. See [TEMPLATE_AUTHORING.md](TEMPLATE_AUTHORING.md) for the full guide.

Quick start:
```bash
# Scaffold a new template
npx carddraft init my-template-name
cd my-template-name
npx carddraft dev     # Live preview
```

## Issue Labels

- `good first issue` — great for first-time contributors
- `template request` — request for a new frame template
- `bug` — something broken
- `enhancement` — new feature or improvement

## Code Style

- TypeScript strict mode — no `any`, no `@ts-ignore` without comment
- Prettier formatting (runs on save if you use VS Code with the recommended extensions)
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`

## Security

Templates run in a sandboxed SES Compartment. If you discover a sandbox escape or security issue, please report it privately at security@carddraft.app rather than opening a public issue.

## License

By contributing, you agree your contributions are licensed under the [MIT License](../LICENSE).
