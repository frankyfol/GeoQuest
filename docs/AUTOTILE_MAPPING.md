# Autotile mapping (MPWSP01) — inspection report

Tile size: **16×16 px**. Indices are `col + row * sheetCols` (zero-based).

## `world.png` — 640×1344 → **40 cols × 84 rows**

Land autotile sets are **4×4 blobs** (16 tiles). Observed repeat blocks at 16px origins:

| Terrain (game code) | Blob origin (col, row) | Notes |
|---------------------|------------------------|--------|
| SAND (5) | (0, 0) | Yellow sand transitions; repeats at (0, 24) |
| PATH (1) | (12, 0) | Brown dirt/path; 64px-aligned block at col 3 |
| GRASS (0) | (0, 48) | Greener field fill; pair with coast shores for water edges |

### 16-tile cardinal blob layout (within each 4×4 block)

```
[ 0][ 1][ 2][ 3]
[ 4][ 5][ 6][ 7]
[ 8][ 9][10][11]
[12][13][14][15]
```

Bitmask: **N=1, E=2, S=4, W=8** (neighbor same terrain).  
`tileIndex = origin + BLOB16[bitmask]` where `BLOB16` is in `AutotileCatalog.js`.

## `coast.png` — 1536×768 → **96 cols × 48 rows**

Matches **Python-Monsters** `coast_importer(96, 48)` at 16px/cell.

Each shore terrain is **3×3 tiles**; eight terrains in columns:

| Index | Key | Use in GeoQuest |
|-------|-----|-----------------|
| 0 | grass | Shore next to GRASS land |
| 1 | grass_i | Pond interior (water surrounded by grass) |
| 2 | sand_i | Sand pond interior |
| 3 | sand | Shore next to SAND land |
| 4–7 | rock, rock_i, ice, ice_i | Reserved / other regions |

### Coast side offsets (within each 3×3 strip)

| Side | (col, row) offset in strip |
|------|----------------------------|
| topleft | (0, 0) |
| top | (1, 0) |
| topright | (2, 0) |
| left | (0, 1) |
| right | (2, 1) |
| bottomleft | (0, 2) |
| bottom | (1, 2) |
| bottomright | (2, 2) |

**Tile index:** `col = terrainIndex * 3 + sideCol`, `row = sideRow + animRow * 3`  
→ `index = row * 96 + col` (animRow 0 for static ground).

### Water cell → coast side

Land north → `top`; south → `bottom`; west → `left`; east → `right`  
Corners: `topleft`, `topright`, `bottomleft`, `bottomright`  
All four cardinals land → `grass_i` / `sand_i` center (row 1 col 1 of strip)  
Open water → deep tile at coast (12, 9) area

## Render priority (low → high)

`WATER (2) < SAND (5) < GRASS (0) < PATH (1) < MUD (6)`

MUD uses coast **grass** shores + world dirt blob where not water.
