# routewatch

> CLI tool to audit and visualize Next.js app router structure and dead routes

## Installation

```bash
npm install -g routewatch
```

## Usage

Run `routewatch` from the root of your Next.js project:

```bash
routewatch
```

Or point it at a specific app directory:

```bash
routewatch --dir ./src/app
```

### Example Output

```
📁 app router structure
├── / ✅
├── /about ✅
├── /dashboard ✅
├── /dashboard/settings ⚠️  dead route (no inbound links)
└── /old-promo ❌  unreachable

2 issues found.
```

### Options

| Flag | Description |
|------|-------------|
| `--dir <path>` | Path to the app directory (default: `./app`) |
| `--json` | Output results as JSON |
| `--strict` | Exit with non-zero code if dead routes are found |

## Why routewatch?

As Next.js projects grow, it's easy to accumulate forgotten routes that are never linked to or visited. `routewatch` statically analyzes your app router file structure and cross-references internal `<Link>` usage to surface dead or unreachable routes before they become technical debt.

## Requirements

- Node.js 18+
- Next.js 13+ (App Router)

## License

[MIT](./LICENSE)