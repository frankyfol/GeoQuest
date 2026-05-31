# GeoQuest: Island of the Living Map

A retro Pokémon-style, top-down **educational geography RPG** for Singapore
Secondary 1 (Lower Secondary Geography — Physical). The player is a junior
"Geo-Ranger" who repairs a breaking-down tropical island by learning how its
natural systems work. There is **no combat and no way to lose** — "battles" are
concept challenges, and wrong answers show a hint and let you retry.

Built with **Phaser 3** + **Vite** in plain JavaScript (ES modules).

## Regions / Topics

1. **Hydro Valley** — Topic 1.1 Water (hydrological cycle, floods/droughts, water management). *MVP, fully playable.*
2. **Verdant Canopy** — Topic 1.2 Tropical Rainforests (structure, adaptations, biodiversity, deforestation).
3. **Tidewood Mangroves** — Topic 1.2 Mangroves (adaptations, coastal value, threats).

Earn all three badges → the island is healed → victory screen.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (default http://localhost:5173).

## Build & deploy

```bash
npm run build      # outputs static site to dist/
npm run preview    # preview the production build locally
```

The build uses a **relative base path** (`base: './'`), so the contents of
`dist/` can be dropped onto GitHub Pages, Netlify, Vercel or any static host
with no extra configuration.

### Deploy to GitHub Pages (example)

1. `npm run build`
2. Push the contents of `dist/` to a `gh-pages` branch (or use the GitHub
   Pages action), or drag-and-drop `dist/` into Netlify.

## Controls

- **Move:** Arrow keys or WASD (grid-based, one tile per press; hold to repeat).
- **Act / Talk / Advance:** SPACE or ENTER (stand facing a spirit/NPC/gate and press).
- **Field Journal (Geo-Dex):** `J`.
- **Settings (pause):** `ESC`.
- **Touch devices:** an on-screen D-pad + A/J buttons appear automatically.

Quiz answers can be chosen by **clicking/tapping** options or pressing the
**number keys** (1–4). For multi-select press numbers to toggle then SPACE to
submit. Sequence/match questions are tap-to-order / tap-to-pair.

## How it works

- **Content lives in JSON** under `public/assets/data/` — edit questions,
  regions, journal entries and dialogue without touching code:
  - `questions.json` — encounters + a question pool (mcq, truefalse, multi, sequence, match).
  - `regions.json` — the three regions, badges and unlock order.
  - `journal.json` — one Field Journal entry per concept.
  - `dialogue.json` — NPC conversations.
- **Save/load** uses `localStorage` (key `geoquest_save`). No logins, no
  accounts, no personal data, no network calls beyond loading local assets.
- **Maps** are hand-authored in code (`src/systems/MapFactory.js`) using
  coloured-rectangle placeholder tiles, so the game runs with **zero art
  assets**. Swap in real tilesets/sprites later without changing the logic.
- **Field Journal icons** are clean SVGs under
  `public/assets/sprites/journal/` — one per concept, referenced by each
  `journal.json` entry's `icon` field. They are colour-coded by region and
  loaded with smooth (LINEAR) filtering. Unseen entries render a neutral
  placeholder silhouette so discovering them stays part of the fun. The icons
  are reproducible via `node tools/gen-journal-icons.mjs`.
- **Audio** is generated procedurally with the Web Audio API
  (`src/systems/AudioManager.js`) — no audio files required. Toggle in Settings.

## Project structure

```
geoquest/
├── index.html
├── package.json
├── vite.config.js
├── public/assets/data/        # questions, regions, journal, dialogue (JSON)
├── public/assets/sprites/journal/  # 29 SVG concept icons (one per journal entry)
├── tools/gen-journal-icons.mjs     # regenerates the journal icons
└── src/
    ├── main.js                # Phaser config + scene registration
    ├── scenes/                # Boot, Preload, Title, World, Encounter,
    │                          #   Dialogue, Journal, Settings, End
    └── systems/               # GameState, QuestionEngine, DialogueManager,
                               #   AudioManager, MapFactory, Theme
```

## Extending the game

- **Add questions:** append to `pool` in `questions.json` and reference the new
  ids from an encounter's `questions` array. Tag each with a `concept` and
  `difficulty`. Add a matching `journal.json` entry for any new concept.
- **Add real maps:** the engine is designed to also load Tiled JSON maps with a
  `collision` layer and a `triggers` object layer; replace `MapFactory` output
  accordingly.

## Legal / assets

This game borrows the Pokémon *style* only — **never** its art, music or names.
All visuals here are generated placeholder shapes; if you add art, use openly
licensed packs (e.g. Kenney.nl, OpenGameArt LPC) and credit the creators.

Content aligned to the Singapore MOE 2021 Lower Secondary Geography syllabus
(Topic 1.1 Water; Topic 1.2 Tropical Rainforests & Mangroves). Verify wording
against the current syllabus each year.
