# Card Draft

> A modern, open-source, cross-platform card design suite — a complete reimagining of Magic Set Editor.

**Card Draft** is built for card game enthusiasts who want to design custom cards with professional-quality output, an intuitive modern interface, and the flexibility to support any card game.

## Features (Phase 1)

- 🃏 **Live card editor** — edit fields, see your card render in real time
- 🎨 **Magic: The Gathering M15 frame** — creature, instant, sorcery, land, enchantment, artifact
- 📦 **Set management** — organize cards into sets, drag to reorder
- 🖨️ **Print-ready export** — PNG at 96/300/600 DPI, PDF print sheets with bleed & crop marks
- 📥 **MSE importer** — bring in card data from existing `.mse-set` files
- 🔌 **Template system** — install templates from local folders; npm-package templates coming in Phase 2
- ⌨️ **Keyboard shortcuts** — `⌘Z` / `⌘⇧Z` undo/redo
- 🌙 **Dark mode** — always

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9

### Install & Run

```bash
git clone https://github.com/card-draft/card-draft.git
cd card-draft
pnpm install
pnpm dev
```

### Build

```bash
pnpm build
# Distributable appears in apps/desktop/release/
```

## Project Structure

```
apps/desktop/              — Electron app (main + renderer)
packages/core/             — DB schema, export pipeline, MSE importer
packages/template-runtime/ — Canvas primitives, ManaText, SES sandbox
packages/ui/               — Shared design system utilities
templates/magic-m15/       — Official MTG M15 frame template
```

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md). PRs welcome — especially new frame templates!

## Roadmap

- **Phase 2:** Template marketplace, full Magic frame library, Scryfall importer, set statistics
- **Phase 3:** Optional Supabase cloud sync, collaborative editing, React Native companion app

## License

[MIT](.github/../LICENSE) — free forever.

---

*Card Draft is an independent fan project. Magic: The Gathering is © Wizards of the Coast. This project is not affiliated with or endorsed by Wizards of the Coast.*
