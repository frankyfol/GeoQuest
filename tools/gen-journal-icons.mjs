// One-off generator for the 29 Field Journal concept icons.
// Reads journal.json to know each entry's id + region (for colour theming),
// then writes a clean, consistent SVG per concept under
// public/assets/sprites/journal/. Run with: node tools/gen-journal-icons.mjs
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const OUT = path.join(ROOT, 'public/assets/sprites/journal');
const journal = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/assets/data/journal.json'), 'utf8'));

const STROKE = {
  hydro_valley: '#1f6fb2',
  verdant_canopy: '#2f8f46',
  tidewood_mangroves: '#1f8f8f',
  general: '#6f7480'
};
const FILL = {
  hydro_valley: '#d8ebfa',
  verdant_canopy: '#ddefe1',
  tidewood_mangroves: '#d6eeee',
  general: '#e6e8ec'
};

// Each glyph is a function of the theme colour `c`, returning inner SVG markup
// drawn within a 48x48 viewBox (keep shapes roughly within x/y 10..38).
const G = {
  evaporation: (c) => `
    <g fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 34c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0"/>
      <path d="M16 29V18M16 18l-2.5 2.5M16 18l2.5 2.5"/>
      <path d="M24 29V15M24 15l-2.5 2.5M24 15l2.5 2.5"/>
      <path d="M32 29V18M32 18l-2.5 2.5M32 18l2.5 2.5"/>
    </g>`,
  transpiration: (c) => `
    <path d="M24 30c-5 0-9-3-10-9 7 0 10 3 10 9z" fill="${c}"/>
    <path d="M24 26c5 0 9-3 10-9-7 0-10 3-10 9z" fill="${c}"/>
    <g fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round">
      <path d="M24 35V20"/>
      <path d="M18 14c1.5-1.6 3-1.6 4.5 0M25.5 12c1.5-1.6 3-1.6 4.5 0"/>
    </g>`,
  condensation: (c) => `
    <path fill="${c}" d="M17 33a7 7 0 0 1 .6-13.95 9 9 0 0 1 17.2 2.2A6 6 0 0 1 33 33z"/>`,
  precipitation: (c) => `
    <path fill="${c}" d="M16 26a6 6 0 0 1 .5-11.95 8 8 0 0 1 15.3 1.9A5 5 0 0 1 31 26z"/>
    <g stroke="${c}" stroke-width="2.4" stroke-linecap="round">
      <path d="M17 30l-1.6 4"/><path d="M24 30l-1.6 4"/><path d="M31 30l-1.6 4"/>
    </g>`,
  infiltration: (c) => `
    <g fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 13V24M16 24l-2.5-2.5M16 24l2.5-2.5"/>
      <path d="M24 11V26M24 26l-2.5-2.5M24 26l2.5-2.5"/>
      <path d="M32 13V24M32 24l-2.5-2.5M32 24l2.5-2.5"/>
      <path d="M10 31h28"/>
      <path d="M13 36h22" opacity="0.6" stroke-dasharray="3 3"/>
    </g>`,
  surface_runoff: (c) => `
    <g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 18c5-4 8 4 13 0s8-4 13 0"/>
      <path d="M10 28c5-4 8 4 13 0s8-4 13 0"/>
    </g>`,
  water_cycle: (c) => `
    <g fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M34 21a11 11 0 1 0 1.5 9"/>
      <path d="M34 13v8h-8"/>
    </g>`,
  uneven_distribution: (c) => `
    <g fill="${c}">
      <rect x="13" y="26" width="5" height="9" rx="1"/>
      <rect x="21.5" y="17" width="5" height="18" rx="1"/>
      <rect x="30" y="22" width="5" height="13" rx="1"/>
    </g>`,
  water_contamination: (c) => `
    <path fill="${c}" d="M24 12c5 7 8 10 8 14a8 8 0 0 1-16 0c0-4 3-7 8-14z"/>
    <g stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M21 23l6 6M27 23l-6 6"/></g>`,
  flood_causes: (c) => `
    <path fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="round" d="M16 24l8-7 8 7v6H16z"/>
    <path fill="${c}" d="M10 30c2.4-2.4 4.8-2.4 7.2 0s4.8 2.4 7.2 0 4.8-2.4 7.2 0 4.8 2.4 7.2 0v6H10z"/>`,
  drought: (c) => `
    <circle cx="24" cy="17" r="5.5" fill="${c}"/>
    <g stroke="${c}" stroke-width="2.2" stroke-linecap="round">
      <path d="M24 7v3M13 17h2.5M32.5 17H35M16 9.5l1.8 1.8M30.2 9.5l-1.8 1.8"/>
    </g>
    <path fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M10 33h7l3 3 4-4 3 3h10"/>`,
  water_management: (c) => `
    <path fill="${c}" opacity="0.25" d="M24 11c5 7 8 10 8 14a8 8 0 0 1-16 0c0-4 3-7 8-14z"/>
    <g fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M31 25a7 7 0 1 1-2.2-5.1"/>
      <path d="M31 17v4h-4"/>
    </g>`,
  singapore_water: (c) => `
    <path fill="${c}" d="M24 12c5 7 8 10 8 14a8 8 0 0 1-16 0c0-4 3-7 8-14z"/>
    <g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 26a4.6 4.6 0 0 0 7.2 3.2"/>
      <path d="M27.2 31v-3.2H24"/>
    </g>`,
  forest_structure: (c) => `
    <g stroke="${c}" stroke-width="3" stroke-linecap="round">
      <path d="M15 15h18"/><path d="M13 21h22"/><path d="M14 27h20"/><path d="M16 33h16"/>
    </g>`,
  canopy: (c) => `
    <rect x="22" y="25" width="4" height="10" rx="1" fill="${c}"/>
    <circle cx="24" cy="19" r="9" fill="${c}"/>`,
  equatorial_climate: (c) => `
    <circle cx="19" cy="17" r="5" fill="${c}"/>
    <g stroke="${c}" stroke-width="2" stroke-linecap="round"><path d="M19 8v2.5M10 17h2.5M11.5 9.5l1.8 1.8"/></g>
    <path fill="${c}" d="M22 33a5 5 0 0 1 .4-9.95 7 7 0 0 1 13 1.6A4.5 4.5 0 0 1 34 33z"/>`,
  drip_tip: (c) => `
    <path fill="${c}" d="M15 13c13 0 17 4 17 17 0 0-5 0-9.5-2.2C16 24.7 15 19.5 15 13z"/>
    <path fill="none" stroke="#fff" stroke-width="1.6" d="M19 17c6 3 9 6 11 11"/>
    <path fill="${c}" d="M27 31c1.5 1.9 2.6 3.2 2.6 4.4a2.6 2.6 0 0 1-5.2 0c0-1.2 1.1-2.5 2.6-4.4z"/>`,
  buttress_roots: (c) => `
    <rect x="22" y="15" width="4" height="15" fill="${c}"/>
    <circle cx="24" cy="14" r="6" fill="${c}"/>
    <path fill="${c}" d="M24 27l-10 9h6l4-5 4 5h6z"/>`,
  adaptations_match: (c) => `
    <path fill="${c}" d="M16 17h5.2a2.8 2.8 0 1 1 5.6 0H32v5.2a2.8 2.8 0 1 1 0 5.6V33h-5.2a2.8 2.8 0 1 0-5.6 0H16v-5.2a2.8 2.8 0 1 0 0-5.6z"/>`,
  biodiversity: (c) => `
    <g fill="${c}">
      <circle cx="17" cy="18" r="3.3"/><circle cx="30" cy="16" r="2.6"/>
      <circle cx="24" cy="25" r="3.8"/><circle cx="16" cy="30" r="2.6"/>
      <circle cx="32" cy="29" r="3"/>
    </g>`,
  deforestation: (c) => `
    <rect x="13" y="30" width="9" height="5" rx="1" fill="${c}"/>
    <path fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" d="M28 14l-9 13"/>
    <path fill="${c}" d="M26 11l7 3.2-3.2 5.3-5.6-3.2z"/>`,
  deforestation_effects: (c) => `
    <g fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 11v15M24 26l-4.5-4.5M24 26l4.5-4.5"/>
      <path d="M11 32h26"/>
    </g>`,
  conservation: (c) => `
    <path fill="none" stroke="${c}" stroke-width="2.6" stroke-linejoin="round" d="M24 11l11 4v8c0 7-5 11.2-11 14-6-2.8-11-7-11-14v-8z"/>
    <path fill="${c}" d="M29 19c-7 0-10 3-10 10 7 0 10-3 10-10z"/>`,
  mangrove_environment: (c) => `
    <circle cx="24" cy="15" r="4.2" fill="${c}"/>
    <rect x="22.5" y="17" width="3" height="8" fill="${c}"/>
    <path fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" d="M24 24l-5 6M24 24l5 6"/>
    <path fill="${c}" d="M10 31c2.4-2.4 4.8-2.4 7.2 0s4.8 2.4 7.2 0 4.8-2.4 7.2 0 4.8 2.4 7.2 0v5H10z"/>`,
  prop_roots: (c) => `
    <circle cx="24" cy="14" r="5" fill="${c}"/>
    <rect x="22.5" y="17" width="3" height="6" fill="${c}"/>
    <g fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 23l-7 12M24 23l7 12M24 23v12M20 30h8"/>
    </g>`,
  pneumatophores: (c) => `
    <g stroke="${c}" stroke-width="2.4" stroke-linecap="round"><path d="M15 31V20M21 31V15M27 31V18M33 31V22"/></g>
    <path fill="${c}" d="M10 31c2.4-2.4 4.8-2.4 7.2 0s4.8 2.4 7.2 0 4.8-2.4 7.2 0 4.8 2.4 7.2 0v5H10z"/>`,
  mangrove_value: (c) => `
    <path fill="${c}" d="M24 34s-10-6.2-10-13a5.8 5.8 0 0 1 10-4 5.8 5.8 0 0 1 10 4c0 6.8-10 13-10 13z"/>`,
  coastal_protection: (c) => `
    <path fill="none" stroke="${c}" stroke-width="2.6" stroke-linejoin="round" d="M24 11l11 4v8c0 7-5 11.2-11 14-6-2.8-11-7-11-14v-8z"/>
    <path fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" d="M19 23l4 4 7-8"/>`,
  mangrove_threats: (c) => `
    <path fill="none" stroke="${c}" stroke-width="2.6" stroke-linejoin="round" d="M24 12l13 22H11z"/>
    <path stroke="${c}" stroke-width="2.6" stroke-linecap="round" d="M24 21v7"/>
    <circle cx="24" cy="31.5" r="1.6" fill="${c}"/>`
};

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

let written = 0;
const missing = [];
for (const entry of journal.entries) {
  const region = entry.region in STROKE ? entry.region : 'general';
  const c = STROKE[region];
  const fill = FILL[region];
  const glyph = G[entry.id];
  if (!glyph) {
    missing.push(entry.id);
    continue;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <rect x="3" y="3" width="42" height="42" rx="11" fill="${fill}" stroke="${c}" stroke-width="3"/>
  ${glyph(c).trim()}
</svg>
`;
  fs.writeFileSync(path.join(OUT, `${entry.id}.svg`), svg);
  written++;
}

console.log(`Wrote ${written} icons to ${OUT}`);
if (missing.length) console.log('MISSING GLYPHS:', missing.join(', '));
