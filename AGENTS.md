# Golden Set — brief for AI agents

Tennis community app for iOS + Android. Find a partner at your level, log matches,
climb the rating, join tournaments.

**The full plan lives in [`docs/PLAN.md`](docs/PLAN.md). Read it before making decisions —
it records not just what we do, but why.** This file is the short version.

## Expo has changed

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.
This project is Expo SDK 54 / React Native 0.81 / React 19.1. Do not copy patterns from other SDK
versions in either direction.

**Why SDK 54 and not the latest:** Expo Go on the App Store is pinned to SDK 54, and a newer SDK
would mean either a paid Apple Developer account or no iPhone testing at all. Do not bump the SDK
without deciding that question first — see `docs/PLAN.md` §14.

## Stack

| | |
|---|---|
| App | Expo (managed) + Expo Router (file-based, `src/app/`) + TypeScript strict |
| Data | Supabase — Postgres + Auth + Storage + Realtime + Edge Functions |
| Server logic | Supabase Edge Functions (rating recalc, brackets, push) |
| State | TanStack Query for server data; Zustand only where genuinely needed |
| i18n | i18next — **English is the source language, Ukrainian the first localisation** |
| CI | GitHub Actions: lint + typecheck on every PR |

## Rules that are not negotiable

1. **No hardcoded colours or spacing.** Everything comes from `src/theme/tokens.ts`.
   The palette is derived from the design reference at `docs/reference/design-reference-home.jpg` —
   dark clay theme, gold as the brand colour.
2. **Type comes from `Type`/`FontFamily` in tokens, never `fontWeight`.** The app ships
   Inter Tight as a custom font; with a custom font Android silently ignores `fontWeight`, so a
   "bold" style set that way renders regular on half the devices.
3. **No literal user-facing strings in JSX.** Always `t('key')`, with the key added to both
   `src/i18n/locales/en.json` and `uk.json`. ESLint enforces this and will fail the build.
   Ukrainian needs 3 plural forms (`_one/_few/_many`), English 2 — use i18next plurals, never
   manual string concatenation.
4. **Rating points are written by the server only.** Never from the client. The Elo maths lives in
   one Edge Function and is unit-tested. See `docs/PLAN.md` §5.
5. **Secrets.** Only `EXPO_PUBLIC_*` keys may reach the app bundle (RLS protects them).
   `SUPABASE_SERVICE_ROLE_KEY` belongs in Edge Function / GitHub secrets and nowhere else.
   `.env` is git-ignored; keep `.env.example` in sync when adding a variable.
6. **Database changes go through migrations** (`supabase/migrations/`), never by hand in the
   dashboard — otherwise local and production drift apart.
7. **Row Level Security on every table, from the first migration.**

## Layout

```
src/app/        screens (Expo Router)
src/theme/      design tokens — the single source of truth for styling
src/components/ui/  the design system: Text, Button, Card, Avatar, NtrpBadge,
                SegmentedControl, ListRow, Sheet — build screens from these
src/lib/        supabase client
src/i18n/       i18next setup + locales/en.json, locales/uk.json
docs/PLAN.md    the plan: stack, data model, rating maths, phases, branding
docs/reference/ source art: the design mock-up and the ball shot
scripts/build-assets.py  regenerates everything in assets/images/ from that source art
```

## Commands

```
npm start          # Expo dev server (scan QR with Expo Go)
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## Where we are

Phases 0 (foundation) and 1 (design system) complete. Next: Phase 2 — build the real home
screen 1:1 with `docs/reference/design-reference-home.jpg` out of the existing UI components.
See `docs/PLAN.md` §7 for the phase list.
