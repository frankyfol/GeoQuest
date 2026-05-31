# GeoQuest: Island of the Living Map

> A retro, Pokémon-style **educational geography RPG** that teaches the
> Singapore Secondary 1 (Lower Secondary Geography — Physical) syllabus through
> exploration and friendly concept "battles". Built with **Phaser 3** + **Vite**
> in plain JavaScript. Runs entirely in the browser, works offline, stores
> nothing but a local save — **no logins, no accounts, no tracking.**

You are a junior **Geo-Ranger** who arrives on a tropical island whose natural
systems are breaking down. By learning how water, rainforests and mangroves
work, you repair the island, earn topic-mastery **badges**, and ultimately
*heal the island*. There is **no violence and no way to lose** — every
"battle" is a quiz-style concept challenge, and wrong answers simply show a
hint and let you try again.

---

## Table of contents

- [Why this game exists](#why-this-game-exists)
- [The world & story](#the-world--story)
- [How you play](#how-you-play)
- [Controls](#controls)
- [The three regions & what they teach](#the-three-regions--what-they-teach)
- [The Field Journal (Geo-Dex)](#the-field-journal-geo-dex)
- [Question types](#question-types)
- [Progression & saving](#progression--saving)
- [Getting started](#getting-started)
- [Build & deploy](#build--deploy)
- [How it's built (architecture)](#how-its-built-architecture)
- [Project structure](#project-structure)
- [Editing & extending the content](#editing--extending-the-content)
- [Design principles](#design-principles)
- [For teachers](#for-teachers)
- [Tech stack](#tech-stack)
- [Testing](#testing)
- [Accessibility & privacy](#accessibility--privacy)
- [Credits, licensing & legal](#credits-licensing--legal)

---

## Why this game exists

Lower-secondary physical geography is full of **processes** (the water cycle),
**cause-and-effect** (sealed surfaces → flooding) and **systems thinking**
(why mangroves protect a coast). These are exactly the things that stick better
when you *do* them rather than read them.

GeoQuest reuses the familiar, motivating loop of a creature-collecting RPG and
quietly swaps the content for curriculum:

| Classic RPG element | GeoQuest equivalent |
| --- | --- |
| Top-down pixel overworld | Tile-based island regions you walk around |
| Wild encounters / battles | Concept encounters (quiz-style challenges) |
| Pokédex | **Field Journal** — fills in as you master concepts |
| Gym badges | **Topic-mastery badges** that gate the next region |
| NPC dialogue | Rangers, spirits and villagers who teach |
| Starter companion | A **droplet sprite** that levels up as you learn |

The result is a self-paced revision tool that feels like a game: students
explore, get things wrong safely, and build a personal "dex" of everything
they've mastered.

---

## The world & story

The island's environment is failing: the water cycle has stalled, the rainforest
is threatened, and the coast is exposed. As the Geo-Ranger you travel through
three regions, meet the guardians of each natural system, and restore them by
proving you understand how they work.

- Friendly **spirits** along each path each represent one concept (evaporation,
  condensation, a forest layer, a mangrove root…).
- A **boss guardian** at the end of each region tests the whole topic.
- Beating a boss awards that region's **badge** and unlocks the next region.
- Earn **all three badges** and the island is *healed* — you reach the victory
  screen as a fully-fledged Geo-Ranger.

---

## How you play

1. **Explore** the overworld with grid-based movement.
2. **Talk** to rangers and signposts for guidance, and to **spirits** to start a
   concept challenge.
3. In a challenge, answer a short, ordered set of questions about one concept.
   - **Correct** → a success chime, the challenge meter drains a little, the
     linked **Field Journal** entry becomes *Mastered*, your companion gains XP,
     and you get a short **explanation**.
   - **Wrong** → a gentle "try again" sound, a **hint**, and you retry the *same*
     question. You can never fail or be sent back.
4. Clear all of a region's spirits, then beat its **boss guardian** to earn the
   **badge** and open the gate to the next region.
5. Open the **Field Journal** any time (press `J`) to review what you've learned.

The core promise: **progress is the only outcome.** The game teaches through
hints and retries, so it's safe to be wrong.

---

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move (one tile; hold to repeat) | Arrow keys / **WASD** | On-screen **D-pad** |
| Act · Talk · Advance text | **SPACE** / **ENTER** | **A** button |
| Open Field Journal | **J** | **J** button |
| Settings / pause | **ESC** | (via menus) |

**Answering questions**

- **Multiple choice / true-false:** click/tap an option, or press the matching
  **number key** (`1`–`4`).
- **Multi-select ("choose all"):** toggle options (tap or number keys), then
  press **SPACE** / the **Submit** button.
- **Sequence (put in order):** tap the items in the correct order (a **Reset**
  button is provided).
- **Match (pair A↔B):** tap a left item, then its matching right item.

On-screen touch controls appear automatically on touch devices.

---

## The three regions & what they teach

Each region maps to one syllabus topic. **Hydro Valley is the fully built-out
MVP**; the other two reuse the exact same engine and are also playable.

### 1. Hydro Valley — *Topic 1.1 Water*
The hydrological cycle and water management.

- **Concepts:** evaporation, transpiration, condensation, precipitation,
  infiltration, surface runoff, the water cycle, uneven distribution, water
  contamination, floods, drought, water management, NEWater / Singapore's water
  sources.
- **Spirits → Boss:** The Rising Mist → Cloud Ridge → The Grey Sky → Thirsty
  Soil → The Old Riverbed → **Guardian: The Floodmaster** (earn the **Water Drop
  Badge**).

### 2. Verdant Canopy — *Topic 1.2 Tropical Rainforests*
Structure, adaptations, biodiversity and deforestation.

- **Concepts:** forest layers, the canopy, equatorial climate, drip-tip leaves,
  buttress roots, plant adaptations, biodiversity, deforestation and its
  effects, conservation.
- **Spirits → Boss:** Layers of Life → Built for the Rain → **Guardian: The
  Clearcutter** (earn the **Canopy Badge**).

### 3. Tidewood Mangroves — *Topic 1.2 Mangroves*
Adaptations, coastal value and threats.

- **Concepts:** the mangrove environment, prop/stilt roots, breathing roots
  (pneumatophores), the value of mangroves, coastal protection, threats to
  mangroves, conservation.
- **Spirits → Boss:** Roots in the Tide → The Living Shield → **Guardian: The
  Storm Surge** (earn the **Tideguard Badge**).

Earn all three badges → **the island is healed** → end screen.

---

## The Field Journal (Geo-Dex)

The Field Journal is both a collectible "dex" and a **revision tool**. Open it
with `J` (or the on-screen button) at any time.

- Entries are grouped into tabs by region (**Water · Forest · Coast · Other**).
- Each concept has its own **icon** (a clean, region-colour-coded SVG) and a
  one-line, syllabus-aligned **definition**.
- Every entry has a **state**:
  - **Unseen** — not yet encountered. Shown as a placeholder **silhouette** with
    "???" so discovering it stays part of the fun.
  - **Seen** — you've met the concept in a challenge (yellow marker).
  - **Mastered** — you've answered it correctly (green marker).
- A progress counter ("Mastered X / 29") shows overall completion.
- Tap any discovered entry to re-read its definition — handy for revision before
  a test.

There is one journal entry per concept in the question bank (29 in total).

---

## Question types

All grading lives in one place (`src/systems/QuestionEngine.js`,
`checkAnswer(question, response)`), so every scene grades consistently. Five
interaction types are supported:

1. **`mcq`** — one correct option out of four.
2. **`truefalse`** — a quick true/false check.
3. **`multi`** — "choose all that apply" (correct only on the exact set).
4. **`sequence`** — order N steps correctly (e.g. the water cycle).
5. **`match`** — pair items from column A to column B (e.g. adaptation ↔ purpose).

---

## Progression & saving

- An **encounter** is *cleared* the first time you answer all of its questions
  correctly. You can replay a cleared encounter for revision without affecting
  your state.
- A **journal entry** becomes *seen* when first encountered and *mastered* when
  its concept is answered correctly (mastery never downgrades).
- A **badge** is awarded when a region's boss is cleared; earning a badge unlocks
  the next region. All three badges → the End scene.
- Your **companion** levels up purely for motivation: `+20 XP` per question
  answered correctly the first time, `level = 1 + floor(XP / 100)`.
- The game **auto-saves** to `localStorage` (key `geoquest_save`) after clearing
  an encounter, earning a badge, changing region, moving, or changing settings.
- The Title screen shows **Continue** only if a save exists; **New Game** warns
  before overwriting.

---

## Getting started

**Prerequisites:** [Node.js](https://nodejs.org/) 18+ and npm.

```bash
npm install
npm run dev
```

Then open the printed local URL (default <http://localhost:5173>). The dev
server hot-reloads as you edit code or content.

---

## Build & deploy

```bash
npm run build      # outputs a static site to dist/
npm run preview    # preview the production build locally
```

The build uses a **relative base path** (`base: './'`), so the contents of
`dist/` can be dropped onto any static host with no extra configuration.

- **Netlify / Vercel / Cloudflare Pages:** drag-and-drop the `dist/` folder, or
  point the host at the repo with build command `npm run build` and publish
  directory `dist`.
- **GitHub Pages:** run `npm run build`, then publish `dist/` (e.g. push it to a
  `gh-pages` branch or use a Pages action).
- **itch.io:** zip the contents of `dist/` and upload as an HTML5 game.

Because everything is static and self-contained, the published game works
offline after first load.

---

## How it's built (architecture)

GeoQuest is a small, readable Phaser 3 project. Logic lives in code; **all
teaching content lives in JSON** and is loaded at runtime.

**Scene flow**

```
Boot → Preload → Title
Title → World            (New Game or Continue)
World ⇄ Dialogue         (talk to an NPC; overlay over a paused World)
World ⇄ Journal          (press J; overlay)
World ⇄ Settings         (press ESC; overlay)
World → Encounter → World (start/finish a concept challenge)
World → End              (when all three badges are earned)
```

**Systems**

- `GameState.js` — a singleton holding the single source of truth, with
  `save() / load() / hasSave() / newGame()` and helpers for journal state,
  companion XP, badges and region unlocking.
- `QuestionEngine.js` — pure `checkAnswer()` grading for all five question types.
- `Tileset.js` — generates all in-game art at runtime as crisp 64×64 pixel-art:
  textured tiles (grass, path, water, sand, mud, trees, rocks, flowers) and
  outlined chibi character sprites (an animated walking hero, NPC rangers and
  villagers, spirit orbs, a boss guardian, a signpost, a stone gate and the
  droplet companion).
- `MapFactory.js` — hand-authored maps generated in code (tile grids, collision,
  triggers, decorative ponds and spawn) for all three regions. `WorldScene` bakes
  them into a single `RenderTexture`.
- `AudioManager.js` — music and SFX synthesised at runtime with the Web Audio
  API, so there are **no audio files** to ship. Respects the sound setting.
- `DialogueManager.js` — dialogue lookup + text-speed timing.
- `Theme.js` — shared colours, the retro font and small UI helpers.

**Assets**

- The game ships with **zero binary art or audio assets** — tiles, characters,
  music and SFX are all generated procedurally at runtime. You can swap in real
  tilesets/sprites later **without changing any game logic**.
- **Field Journal icons** are clean SVGs under `public/assets/sprites/journal/`,
  one per concept, referenced by each `journal.json` entry's `icon` field. They
  are colour-coded by region (blue = water, green = rainforest, teal = mangroves,
  grey = general) and loaded with smooth (LINEAR) filtering. Regenerate them with
  `node tools/gen-journal-icons.mjs`.
- The **retro font** is *Press Start 2P* (loaded from Google Fonts).

---

## Project structure

```
geoquest/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── assets/
│       ├── data/                # questions, regions, journal, dialogue (JSON)
│       └── sprites/journal/     # 29 SVG concept icons (one per journal entry)
├── tools/
│   └── gen-journal-icons.mjs    # regenerates the journal icons
└── src/
    ├── main.js                  # Phaser config + scene registration
    ├── scenes/                  # Boot, Preload, Title, World, Encounter,
    │                            #   Dialogue, Journal, Settings, End
    └── systems/                 # GameState, QuestionEngine, DialogueManager,
                                 #   AudioManager, MapFactory, Tileset, Theme
```

---

## Editing & extending the content

All content is plain JSON under `public/assets/data/` — **you can add questions,
regions, journal entries and dialogue without touching code.**

### `questions.json`

An `encounters` list plus a shared `pool` of questions referenced by id.

```jsonc
{
  "encounters": [
    {
      "id": "hv_evaporation",
      "region": "hydro_valley",
      "title": "The Rising Mist",
      "isBoss": false,
      "intro": "Cloud Spirit: The sea is warm today. Where does the water go?",
      "victory": "You restored the first step of the cycle — evaporation!",
      "questions": ["q_w01", "q_w02"]
    }
  ],
  "pool": [
    {
      "id": "q_w01",
      "concept": "evaporation",     // links to the journal entry
      "type": "mcq",                 // mcq | truefalse | multi | sequence | match
      "difficulty": "easy",
      "prompt": "The sun heats the sea. What happens to water at the surface?",
      "options": ["It freezes", "It evaporates into vapour", "It sinks", "It rains"],
      "answer": 1,                   // index of the correct option
      "hint": "Heat changes liquid into gas.",
      "explanation": "Heat from the sun turns liquid water into water vapour."
    }
  ]
}
```

Type-specific fields:

- **`sequence`** — use `"items": [...]` and `"order": [1,0,2,3]` (item indices in
  the correct order).
- **`match`** — use `"left": [...]`, `"right": [...]`, `"pairs": [[0,1],[1,0]]`
  (left index → right index).
- **`multi`** — use `"options": [...]` and `"answers": [0,1,3]` (all correct
  indices).
- **`truefalse`** — use `"answer": true | false`.

### `regions.json`

The three regions, their maps, badges and unlock order:

```jsonc
{
  "regions": [
    { "id": "hydro_valley", "name": "Hydro Valley", "badge": "water",
      "unlockedBy": null,
      "encounterOrder": ["hv_evaporation", "...", "hv_boss_flood"],
      "bossEncounter": "hv_boss_flood" }
  ]
}
```

### `journal.json`

One entry per concept used in `questions.json`:

```jsonc
{
  "entries": [
    { "id": "evaporation", "region": "hydro_valley", "title": "Evaporation",
      "definition": "Heat from the sun turns liquid water into water vapour.",
      "icon": "assets/sprites/journal/evaporation.svg" }
  ]
}
```

### `dialogue.json`

NPC conversations:

```jsonc
{
  "dialogues": [
    { "id": "hv_intro_ranger", "speaker": "Ranger May",
      "lines": ["Welcome to Hydro Valley, Geo-Ranger!", "..."] }
  ]
}
```

### Common tasks

- **Add a question:** append it to `pool`, then reference its id from an
  encounter's `questions` array. Tag it with a `concept` and `difficulty`.
- **Add a new concept:** add a matching `journal.json` entry and an SVG icon (or
  add a glyph to `tools/gen-journal-icons.mjs` and re-run it).
- **Add real maps:** the trigger model (`type`, `id`, `target`, `activate`) maps
  cleanly onto a Tiled `triggers` object layer + a `collision` layer; replace the
  `MapFactory` output to load Tiled JSON instead.

---

## Design principles

- **You cannot lose.** Wrong answers teach via a hint and an immediate retry.
- **Content is data, not code.** Teaching material is editable JSON.
- **Placeholders first.** Coloured shapes and synthesised audio prove the logic;
  real art/music can be swapped in later without touching gameplay.
- **Local-only.** No network calls beyond loading local assets; one local save.
- **Curriculum-aligned.** Wording follows the MOE syllabus content (verify each
  year — see below).

---

## For teachers

- **Self-paced revision:** students can replay any region and re-read mastered
  journal entries before a test.
- **Measure learning, not just fun:** pair the game with a quick before/after
  quiz (e.g. on the water cycle) to see the effect.
- **No setup for students:** it's a single static web page. Host the `dist/`
  build on a free static host and share the link, or run it from a USB/local
  folder.
- **No data collected:** there are no accounts and nothing leaves the device, so
  there are no PDPA concerns.

---

## Tech stack

- **Engine:** [Phaser 3](https://phaser.io/) (HTML5 Canvas/WebGL).
- **Build tool:** [Vite](https://vitejs.dev/).
- **Language:** plain JavaScript (ES modules) — no TypeScript, no framework.
- **Rendering:** 64×64 pixel tiles on a 1280×960 internal resolution (scaled to
  fit the window), `pixelArt: true` for crisp pixels. UI scenes are authored in a
  compact 320×240 design space and shown through a ×4 camera zoom.
- **Audio:** Web Audio API (procedural music + SFX).
- **Persistence:** browser `localStorage`.

---

## Testing

The game was verified end to end in a headless browser:

- All scenes render with **no console/page errors** and no failed requests.
- The grading engine is checked against the full question bank (every question
  grades a correct response as correct and a wrong one as wrong), and every
  concept has a matching journal entry.
- A scripted **full playthrough** clears all encounters across the three
  regions: each boss awards its badge, regions unlock in order, every journal
  concept reaches *mastered*, and the win condition routes to the End scene.

To re-run a quick content sanity check after editing JSON, simply
`npm run build` (it will fail if any JSON is malformed) and play through in
`npm run dev`.

---

## Accessibility & privacy

- **No-lose design** removes failure anxiety; hints scaffold every question.
- **Keyboard, mouse/touch and number-key** input are all supported.
- **Text speed** is adjustable (slow / normal / fast) and **sound** can be
  toggled; both persist.
- **No logins, no accounts, no analytics, no third-party calls** (beyond the
  Google-hosted retro font). A single local save can be cleared by starting a
  New Game or clearing site data.

---

## Credits, licensing & legal

- Code is provided under the **MIT License** (see `package.json`).
- GeoQuest borrows the *style* of classic creature-collecting RPGs only — it uses
  **no Nintendo/Pokémon art, music or names**. All in-game visuals are original
  generated shapes and SVG icons; all audio is synthesised at runtime.
- The retro font *Press Start 2P* is an open-source Google Font.
- If you add third-party art or audio, use openly-licensed packs (e.g.
  [Kenney.nl](https://kenney.nl/), OpenGameArt LPC sets) and credit the creators.

Content is aligned to the **Singapore MOE 2021 Lower Secondary Geography
syllabus** — Topic 1.1 Water and Topic 1.2 Tropical Rainforests & Mangroves.
Verify wording against the current syllabus each year.
