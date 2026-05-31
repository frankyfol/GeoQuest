// DialogueManager.js
// Small helper to look up dialogue and map text-speed settings to a
// typewriter character delay (in ms).

export function getDialogue(scene, id) {
  const cache = scene.cache.json.get('dialogue');
  if (!cache || !cache.dialogues) return null;
  return cache.dialogues.find((d) => d.id === id) || null;
}

export function textSpeedToDelay(speed) {
  switch (speed) {
    case 'slow':
      return 55;
    case 'fast':
      return 12;
    case 'normal':
    default:
      return 28;
  }
}

export default { getDialogue, textSpeedToDelay };
