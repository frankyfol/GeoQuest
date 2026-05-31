/**
 * Capture dialogue + encounter screenshots for visual QA.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.GEOQUEST_URL || 'http://localhost:5173/';
const OUT = '/workspace/artifacts/qa';

async function waitGame(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('#game-root canvas', { timeout: 60000 });
  await page.waitForFunction(() => window.__GAME?.isBooted, { timeout: 60000 });
  await page.waitForTimeout(2000);
}

async function newGameWorld(page) {
  await page.evaluate(() => {
    window.__GS.newGame();
    window.__GS.data.tutorialSeen = true;
    window.__GS.save();
    const g = window.__GAME;
    ['Title', 'Tutorial', 'Preload'].forEach((k) => {
      if (g.scene.isActive(k)) g.scene.stop(k);
    });
    g.scene.start('World');
  });
  await page.waitForFunction(() => window.__GAME.scene.isActive('World'), { timeout: 15000 });
  await page.waitForTimeout(1500);
}

async function openDialogue(page, id) {
  await page.evaluate((dialogueId) => {
    const world = window.__GAME.scene.getScene('World');
    world.scene.pause();
    world.scene.launch('Dialogue', { id: dialogueId });
    world.scene.bringToTop('Dialogue');
  }, id);
  await page.waitForTimeout(600);
}

async function advanceDialogue(page, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);
  }
}

async function startEncounter(page, encounterId) {
  await page.evaluate((id) => {
    const world = window.__GAME.scene.getScene('World');
    world.scene.pause();
    world.scene.launch('Encounter', { id });
    world.scene.bringToTop('Encounter');
  }, encounterId);
  await page.waitForTimeout(1000);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await mkdir(OUT, { recursive: true });
await waitGame(page);

await newGameWorld(page);
await page.locator('#game-root').screenshot({ path: `${OUT}/01-world-overworld.png` });

await openDialogue(page, 'hv_intro_ranger');
await page.screenshot({ path: `${OUT}/02-dialogue-line1.png` });
await advanceDialogue(page, 3);
await page.screenshot({ path: `${OUT}/03-dialogue-line4-long.png` });

await page.evaluate(() => {
  window.__GAME.scene.stop('Dialogue');
  window.__GAME.scene.resume('World');
});
await page.waitForTimeout(300);

await startEncounter(page, 'hv_evaporation');
await page.screenshot({ path: `${OUT}/04-encounter-intro.png` });
await page.keyboard.press('Space');
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/05-encounter-question.png` });

await browser.close();
console.log('Wrote screenshots to', OUT);
