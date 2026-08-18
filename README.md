# Golden Set

Tennis community app for iOS and Android — find a partner at your level, log matches, climb the
rating, join tournaments.

Built with Expo (React Native) + Supabase. English and Ukrainian from day one.

## Getting started

```bash
npm install
npm start
```

Then scan the QR code with **Expo Go** on your phone (iOS or Android) — no Xcode or Android Studio
needed to see the app running.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Expo dev server |
| `npm run android` | Open on an Android emulator/device |
| `npm run ios` | Open on an iOS simulator (macOS only) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |

## Documentation

- [`docs/PLAN.md`](docs/PLAN.md) — the full development plan: stack decisions and why, data model,
  rating maths, phases, i18n rules, branding.
- [`AGENTS.md`](AGENTS.md) — short brief + non-negotiable rules (also read as `CLAUDE.md`).

## Environment

Copy `.env.example` to `.env` and fill in the Supabase keys. `.env` is git-ignored.
