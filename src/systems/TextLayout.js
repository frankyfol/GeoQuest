// TextLayout.js — measure wrapped text and stack blocks without overlap.

/** Measure how tall wrapped text will be without leaving it on screen. */
export function measureTextHeight(scene, str, style) {
  const t = scene.add.text(-5000, -5000, str || ' ', style).setVisible(false);
  const h = t.height;
  t.destroy();
  return h;
}

/** Place text objects one below another; returns the Y just below the last block. */
export function layoutBelow(prevBottom, gap = 6) {
  return prevBottom + gap;
}

export default { measureTextHeight, layoutBelow };
