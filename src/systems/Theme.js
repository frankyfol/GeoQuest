// Theme.js
// Shared visual constants and small UI helpers (retro font, panels, buttons).
import { UI_ZOOM, VIEW_W, VIEW_H } from '../main.js';

export const FONT = '"Press Start 2P", monospace';

// UI scenes are authored in a compact 320x240 design space; this zooms the
// scene camera so that space fills the 1280x960 frame (crisp x4 scaling).
export function uiCamera(scene) {
  scene.cameras.main.setZoom(UI_ZOOM);
  scene.cameras.main.centerOn(VIEW_W / 2, VIEW_H / 2);
}

export const COLORS = {
  bg: 0x0b1020,
  panel: 0x1c2541,
  panelLight: 0x2a3a66,
  border: 0x5bc0eb,
  text: '#e8f1ff',
  textDim: '#9fb3d1',
  accent: '#ffd166',
  good: '#06d6a0',
  bad: '#ef476f',
  water: 0x4fc3f7,
  canopy: 0x66bb6a,
  tide: 0x26a69a
};

// Default bitmap-style text style.
export function textStyle(size = 8, color = COLORS.text) {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    resolution: 2
  };
}

// Draw a retro 9-slice-ish panel using a Graphics object.
export function drawPanel(scene, x, y, w, h, opts = {}) {
  const g = scene.add.graphics();
  const fill = opts.fill !== undefined ? opts.fill : COLORS.panel;
  const border = opts.border !== undefined ? opts.border : COLORS.border;
  const alpha = opts.alpha !== undefined ? opts.alpha : 1;
  g.fillStyle(fill, alpha);
  g.fillRect(x, y, w, h);
  g.lineStyle(opts.borderWidth || 2, border, 1);
  g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  return g;
}

export default { FONT, COLORS, textStyle, drawPanel };
