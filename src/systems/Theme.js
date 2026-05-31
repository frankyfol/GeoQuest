// Theme.js — colours, readable UI typography, panels, and UI camera setup.
import { ZOOM, VIEW_W, VIEW_H } from '../main.js';

/** Clear sans-serif for all in-game text (replaces bitmap Press Start 2P). */
export const FONT = '"Nunito Sans", "Segoe UI", system-ui, sans-serif';

export function uiCamera(scene) {
  scene.cameras.main.setZoom(ZOOM);
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

const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 2;

export function textStyle(size = 10, color = COLORS.text) {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    resolution: DPR
  };
}

/** Dialogue / long-form copy — larger size and extra line spacing. */
export function bodyTextStyle(size = 11, color = COLORS.text, wrapWidth = VIEW_W - 32) {
  return {
    ...textStyle(size, color),
    wordWrap: { width: wrapWidth },
    lineSpacing: 5
  };
}

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

export default { FONT, COLORS, textStyle, bodyTextStyle, drawPanel, uiCamera };
