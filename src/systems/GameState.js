// GameState.js
// Central source of truth for the player's progress. Serialised to
// localStorage on every meaningful change so the game survives refreshes.

const SAVE_KEY = 'geoquest_save';
const SAVE_VERSION = 1;

function defaultState() {
  return {
    version: SAVE_VERSION,
    currentRegion: 'hydro_valley',
    // Tile coordinates on the current map (set sensibly by WorldScene).
    player: { x: 3, y: 7, facing: 'down' },
    companionXP: 0,
    companionLevel: 1,
    badges: { water: false, canopy: false, tideguard: false },
    regionsUnlocked: ['hydro_valley'],
    encountersCleared: [],
    journal: {},
    tutorialSeen: false,
    settings: { sound: true, textSpeed: 'normal' }
  };
}

class GameStateManager {
  constructor() {
    this.data = defaultState();
  }

  // ---- persistence ---------------------------------------------------
  hasSave() {
    try {
      return !!window.localStorage.getItem(SAVE_KEY);
    } catch (e) {
      return false;
    }
  }

  load() {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      // Merge with defaults so older/partial saves still work.
      this.data = this._merge(defaultState(), parsed);
      return true;
    } catch (e) {
      console.warn('GeoQuest: failed to load save, starting fresh.', e);
      this.data = defaultState();
      return false;
    }
  }

  save() {
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('GeoQuest: failed to save.', e);
    }
  }

  newGame() {
    this.data = defaultState();
    this.save();
  }

  clearSave() {
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  // Deep-merge saved data over defaults (one level of nested objects).
  _merge(base, over) {
    const out = { ...base };
    for (const key of Object.keys(over)) {
      const v = over[key];
      if (
        v &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        base[key] &&
        typeof base[key] === 'object' &&
        !Array.isArray(base[key])
      ) {
        out[key] = { ...base[key], ...v };
      } else {
        out[key] = v;
      }
    }
    return out;
  }

  // ---- convenience helpers ------------------------------------------
  isEncounterCleared(id) {
    return this.data.encountersCleared.includes(id);
  }

  markEncounterCleared(id) {
    if (!this.isEncounterCleared(id)) {
      this.data.encountersCleared.push(id);
    }
  }

  setJournal(concept, state) {
    if (!concept) return;
    const order = { unseen: 0, seen: 1, mastered: 2 };
    const current = this.data.journal[concept] || 'unseen';
    // Never downgrade a journal entry's mastery state.
    if ((order[state] || 0) >= (order[current] || 0)) {
      this.data.journal[concept] = state;
    }
  }

  getJournalState(concept) {
    return this.data.journal[concept] || 'unseen';
  }

  addCompanionXP(amount) {
    this.data.companionXP += amount;
    this.data.companionLevel = 1 + Math.floor(this.data.companionXP / 100);
  }

  isRegionUnlocked(regionId, regions) {
    if (this.data.regionsUnlocked.includes(regionId)) return true;
    // Fall back to checking the unlockedBy badge if available.
    const region = regions && regions.find((r) => r.id === regionId);
    if (!region) return false;
    if (!region.unlockedBy) return true;
    return !!this.data.badges[region.unlockedBy];
  }

  earnBadge(badge, regions) {
    if (!badge) return [];
    this.data.badges[badge] = true;
    const newlyUnlocked = [];
    if (regions) {
      for (const region of regions) {
        if (
          region.unlockedBy === badge &&
          !this.data.regionsUnlocked.includes(region.id)
        ) {
          this.data.regionsUnlocked.push(region.id);
          newlyUnlocked.push(region.id);
        }
      }
    }
    return newlyUnlocked;
  }

  hasAllBadges() {
    const b = this.data.badges;
    return !!(b.water && b.canopy && b.tideguard);
  }
}

// Export a single shared instance (singleton).
const GameState = new GameStateManager();
export default GameState;
