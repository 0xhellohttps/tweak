# TWEAK

A niche social platform for the underground music community. Part Discord, part
MySpace, part SoundCloud, part Twitch — with its own identity, built on the
[tweakmo.de](https://tweakmo.de) brand language.

**Music first. Community second.**

## Staging preview

Static preview (screenshots + brand page) is published on GitHub Pages from
`/docs`. The full app is dynamic (auth, SQLite, uploads, chat) and needs a
Node host — deploy to Vercel/Fly/Railway for an interactive staging URL.

## Features (MVP)

- **Accounts** — email/password auth, multi-role identity (DJ, producer, label,
  venue, radio…), private profiles, account deletion.
- **Spaces (MySpace-style profiles)** — accent color, background treatment,
  drag-and-drop section ordering, featured track, top friends, status line,
  social links, genres.
- **Sound (SoundCloud-style)** — track upload with artwork, genre doors,
  persistent bottom player with queue/seek, waveforms, likes, reposts,
  play counts.
- **Feed (X-style)** — transmissions (posts), attached tracks, likes, reposts,
  everyone/following tabs.
- **Rooms (Discord-style communities)** — channels, member roles
  (owner/admin/mod), private rooms with approval, live-ish chat (polling),
  rules, member directory.
- **Live (Twitch-inspired)** — go-live status, live-now rail in the sidebar.
  RTMP/WebRTC broadcast is the next milestone.

## Stack

Next.js 16 (App Router, server actions) · TypeScript · Tailwind 4 ·
Prisma 7 + SQLite (better-sqlite3 adapter) · jose sessions · bcryptjs.

## Run it

```bash
npm install
npm run db:push    # create prisma/dev.db
npm run db:seed    # demo users, rooms, synthesized audio loops
npm run dev
```

Open http://localhost:3000 — demo login: `noize_atx` / `tweaktweak`
(all seeded users share the password).

## Structure

```
prisma/schema.prisma      data model (users, tracks, posts, rooms, streams)
prisma/seed.ts            demo data + WAV synth + SVG artwork generators
src/lib/auth.ts           JWT cookie sessions
src/lib/actions/          server actions (auth, profile, social, tracks, rooms, live)
src/app/(app)/            authenticated shell: feed, discover, live, rooms, u/, settings
src/components/           player, track cards, chat, space editor
docs/                     GitHub Pages static staging preview
```
