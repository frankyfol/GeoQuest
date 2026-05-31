import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import Audio from '../systems/AudioManager.js';
import { buildMap, TILE_COLORS } from '../systems/MapFactory.js';
import { COLORS, FONT, textStyle } from '../systems/Theme.js';
import { TILE, VIEW_W, VIEW_H } from '../main.js';

const FACING = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 }
};

export default class WorldScene extends Phaser.Scene {
  constructor() {
    super('World');
  }

  init(data) {
    this._regionOverride = data && data.region ? data.region : null;
  }

  create() {
    const regions = this.cache.json.get('regions').regions;
    this.regions = regions;

    if (this._regionOverride) {
      GameState.data.currentRegion = this._regionOverride;
    }
    this.regionId = GameState.data.currentRegion;
    this.regionDef = regions.find((r) => r.id === this.regionId);
    this.map = buildMap(this.regionId);

    this._drawGround();
    this._spawnTriggers();
    this._spawnPlayer();
    this._setupCamera();
    this._buildHUD();
    this._setupInput();
    this._buildTouchControls();

    this.moving = false;
    this.moveCooldown = 0;

    this.cameras.main.fadeIn(250, 0, 0, 0);
    Audio.playMusic('world');

    // Refresh state whenever we come back from an overlay/encounter.
    this.events.on('resume', this._onResume, this);
    this.events.once('shutdown', () => this.events.off('resume', this._onResume, this));

    // If somehow all badges already earned, go to the end.
    if (GameState.hasAllBadges()) {
      this.time.delayedCall(400, () => this._goToEnd());
    }
  }

  // ---- rendering -----------------------------------------------------
  _drawGround() {
    const g = this.add.graphics();
    const { tiles } = this.map;
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const color = TILE_COLORS[tiles[y][x]] ?? 0x3f8f3f;
        g.fillStyle(color, 1);
        g.fillRect(x * TILE, y * TILE, TILE, TILE);
        // subtle checkerboard shade for texture
        if ((x + y) % 2 === 0) {
          g.fillStyle(0x000000, 0.06);
          g.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
      }
    }
    g.setDepth(0);
  }

  _spawnTriggers() {
    this.triggerSprites = [];
    this.map.triggers.forEach((trig) => {
      const px = trig.x * TILE + TILE / 2;
      const py = trig.y * TILE + TILE / 2;
      const spr = this.add.image(px, py, trig.sprite || 'npc_spirit').setDepth(5);

      // Cleared encounters get a check tint; dim them slightly.
      let cleared = false;
      if (trig.type === 'encounter' && GameState.isEncounterCleared(trig.id)) {
        cleared = true;
        spr.setTint(0x88ff88);
      }

      // Floating label above NPC.
      const label = this.add
        .text(px, py - 12, trig.label || '', textStyle(6, COLORS.text))
        .setOrigin(0.5)
        .setDepth(6);
      label.setVisible(false);

      // small check mark for cleared
      let check = null;
      if (cleared) {
        check = this.add.text(px + 5, py - 11, '\u2713', textStyle(7, COLORS.good)).setOrigin(0.5).setDepth(7);
      }

      this.triggerSprites.push({ trig, spr, label, check });

      // gentle bob for living NPCs/spirits
      if (trig.type !== 'door' && trig.sprite !== 'npc_sign') {
        this.tweens.add({ targets: spr, y: py - 2, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    });
  }

  _spawnPlayer() {
    let { x, y, facing } = GameState.data.player;
    // Validate saved tile for this map; otherwise use spawn.
    const valid =
      x >= 0 &&
      y >= 0 &&
      x < this.map.width &&
      y < this.map.height &&
      !this.map.collision.has(`${x},${y}`);
    if (this._regionOverride || !valid) {
      ({ x, y, facing } = this.map.spawn);
    }

    this.tileX = x;
    this.tileY = y;
    this.facing = facing || 'down';

    const px = x * TILE + TILE / 2;
    const py = y * TILE + TILE / 2;

    this.playerBody = this.add.image(0, 0, 'player');
    this.facingMarker = this.add.rectangle(0, -4, 5, 3, 0x6b4f1d);
    this.player = this.add.container(px, py, [this.playerBody, this.facingMarker]);
    this.player.setSize(TILE, TILE);
    this.player.setDepth(10);
    this._updateFacingMarker();

    // Companion droplet trailing behind.
    this.companion = this.add.image(px - 10, py + 4, 'companion').setScale(0.85).setDepth(9);
    this.tweens.add({ targets: this.companion, y: py + 1, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    GameState.data.player = { x, y, facing: this.facing };
  }

  _updateFacingMarker() {
    const d = FACING[this.facing];
    this.facingMarker.setPosition(d.dx * 5, d.dy * 5 - 1);
  }

  _setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.map.width * TILE, this.map.height * TILE);
    cam.startFollow(this.player, true, 0.18, 0.18);
    cam.setRoundPixels(true);
  }

  // ---- HUD -----------------------------------------------------------
  _buildHUD() {
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

    const bar = this.add.rectangle(0, 0, VIEW_W, 16, 0x0b1020, 0.85).setOrigin(0);
    bar.setStrokeStyle(0);
    const name = this.add.text(4, 4, this.regionDef ? this.regionDef.name : '', textStyle(7, COLORS.accent));

    this.hud.add([bar, name]);

    // Badge icons (right side).
    const badgeKeys = [
      { key: 'badge_water', flag: 'water' },
      { key: 'badge_canopy', flag: 'canopy' },
      { key: 'badge_tideguard', flag: 'tideguard' }
    ];
    badgeKeys.forEach((b, i) => {
      const icon = this.add.image(VIEW_W - 12 - i * 16, 8, b.key).setScale(0.5);
      icon.setAlpha(GameState.data.badges[b.flag] ? 1 : 0.25);
      this.hud.add(icon);
      b.icon = icon;
    });
    this._badgeIcons = badgeKeys;

    const hint = this.add.text(4, VIEW_H - 10, 'Move: Arrows/WASD  Act: SPACE  Journal: J', textStyle(5, COLORS.textDim)).setScrollFactor(0).setDepth(100);
    this.hud.add(hint);
  }

  _refreshHUD() {
    this._badgeIcons.forEach((b) => b.icon.setAlpha(GameState.data.badges[b.flag] ? 1 : 0.25));
  }

  // ---- input ---------------------------------------------------------
  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      J: Phaser.Input.Keyboard.KeyCodes.J,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC
    });

    this.input.keyboard.on('keydown-SPACE', () => this._tryAction());
    this.input.keyboard.on('keydown-ENTER', () => this._tryAction());
    this.input.keyboard.on('keydown-J', () => this._openJournal());
    this.input.keyboard.on('keydown-ESC', () => this._openSettings());

    Audio.resume();
  }

  _buildTouchControls() {
    // Only show on touch-capable devices.
    const isTouch = this.sys.game.device.input.touch && !this.sys.game.device.os.desktop;
    if (!isTouch) return;

    const mk = (x, y, label, onDown) => {
      const btn = this.add.circle(x, y, 12, COLORS.panelLight, 0.7).setScrollFactor(0).setDepth(120).setStrokeStyle(2, COLORS.border).setInteractive({ useHandCursor: true });
      const t = this.add.text(x, y, label, textStyle(8)).setOrigin(0.5).setScrollFactor(0).setDepth(121);
      btn.on('pointerdown', onDown);
      return { btn, t };
    };

    const baseX = 28;
    const baseY = VIEW_H - 44;
    this._dpadHeld = null;
    const dpad = (x, y, label, dir) => {
      const o = mk(x, y, label, () => {
        this._dpadHeld = dir;
      });
      o.btn.on('pointerup', () => (this._dpadHeld = null));
      o.btn.on('pointerout', () => (this._dpadHeld = null));
      return o;
    };
    dpad(baseX, baseY - 16, '\u25B2', 'up');
    dpad(baseX, baseY + 16, '\u25BC', 'down');
    dpad(baseX - 18, baseY, '\u25C0', 'left');
    dpad(baseX + 18, baseY, '\u25B6', 'right');

    mk(VIEW_W - 30, VIEW_H - 30, 'A', () => this._tryAction());
    mk(VIEW_W - 30, VIEW_H - 58, 'J', () => this._openJournal());
  }

  // ---- movement ------------------------------------------------------
  update(time, delta) {
    if (this.moving) return;
    if (this.moveCooldown > 0) {
      this.moveCooldown -= delta;
      return;
    }
    if (!this.scene.isActive()) return;

    let dir = null;
    if (this.cursors.up.isDown || this.keys.W.isDown || this._dpadHeld === 'up') dir = 'up';
    else if (this.cursors.down.isDown || this.keys.S.isDown || this._dpadHeld === 'down') dir = 'down';
    else if (this.cursors.left.isDown || this.keys.A.isDown || this._dpadHeld === 'left') dir = 'left';
    else if (this.cursors.right.isDown || this.keys.D.isDown || this._dpadHeld === 'right') dir = 'right';

    if (dir) this._tryMove(dir);
  }

  _tryMove(dir) {
    const turning = this.facing !== dir;
    this.facing = dir;
    this._updateFacingMarker();

    const d = FACING[dir];
    const nx = this.tileX + d.dx;
    const ny = this.tileY + d.dy;

    // If just turning to a new direction, pause briefly so the player can
    // re-orient without immediately walking (feels like classic RPGs).
    if (turning) {
      this.moveCooldown = 90;
    }

    const blocked =
      nx < 0 ||
      ny < 0 ||
      nx >= this.map.width ||
      ny >= this.map.height ||
      this.map.collision.has(`${nx},${ny}`);

    if (blocked) {
      this.moveCooldown = Math.max(this.moveCooldown, 60);
      return;
    }

    this.moving = true;
    this.tileX = nx;
    this.tileY = ny;
    const tx = nx * TILE + TILE / 2;
    const ty = ny * TILE + TILE / 2;
    Audio.play('move');

    this.tweens.add({
      targets: this.player,
      x: tx,
      y: ty,
      duration: 140,
      ease: 'Linear',
      onComplete: () => {
        this.moving = false;
        GameState.data.player = { x: this.tileX, y: this.tileY, facing: this.facing };
        this._moveCompanion(tx, ty);
        GameState.save();
        this._checkStepTrigger();
      }
    });
  }

  _moveCompanion(tx, ty) {
    const d = FACING[this.facing];
    this.tweens.add({
      targets: this.companion,
      x: tx - d.dx * 10,
      y: ty - d.dy * 10 + 2,
      duration: 160,
      ease: 'Sine.out'
    });
  }

  _checkStepTrigger() {
    const trig = this.map.triggers.find(
      (t) => t.activate === 'step' && t.x === this.tileX && t.y === this.tileY
    );
    if (trig) this._fireTrigger(trig);
  }

  // ---- actions / triggers -------------------------------------------
  _tryAction() {
    if (this.moving) return;
    const d = FACING[this.facing];
    const fx = this.tileX + d.dx;
    const fy = this.tileY + d.dy;
    const trig = this.map.triggers.find(
      (t) => t.activate === 'talk' && t.x === fx && t.y === fy
    );
    if (trig) this._fireTrigger(trig);
  }

  _fireTrigger(trig) {
    switch (trig.type) {
      case 'dialogue':
        Audio.play('open');
        this.scene.pause();
        this.scene.launch('Dialogue', { id: trig.id });
        this.scene.bringToTop('Dialogue');
        break;
      case 'encounter':
        Audio.play('select');
        Audio.stopMusic();
        this.scene.pause();
        this.scene.launch('Encounter', { id: trig.id });
        this.scene.bringToTop('Encounter');
        break;
      case 'journal':
        this._openJournal();
        break;
      case 'door':
        this._useDoor(trig);
        break;
      default:
        break;
    }
  }

  _useDoor(trig) {
    const target = this.regions.find((r) => r.id === trig.target);
    if (!target) return;
    const unlocked = GameState.isRegionUnlocked(target.id, this.regions);
    if (!unlocked) {
      Audio.play('incorrect');
      this.scene.pause();
      this.scene.launch('Dialogue', { id: trig.id || 'hv_door_locked' });
      this.scene.bringToTop('Dialogue');
      return;
    }
    Audio.play('open');
    Audio.stopMusic();
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      GameState.data.currentRegion = target.id;
      GameState.save();
      this.scene.restart({ region: target.id });
    });
  }

  _openJournal() {
    Audio.play('open');
    this.scene.pause();
    this.scene.launch('Journal');
    this.scene.bringToTop('Journal');
  }

  _openSettings() {
    Audio.play('open');
    this.scene.pause();
    this.scene.launch('Settings', { from: 'World' });
    this.scene.bringToTop('Settings');
  }

  // ---- returning from overlays --------------------------------------
  _onResume() {
    Audio.playMusic('world');
    this._refreshHUD();
    this._refreshTriggerVisuals();
    if (GameState.hasAllBadges()) {
      this.time.delayedCall(500, () => this._goToEnd());
    }
  }

  _refreshTriggerVisuals() {
    this.triggerSprites.forEach((ts) => {
      if (ts.trig.type === 'encounter' && GameState.isEncounterCleared(ts.trig.id)) {
        ts.spr.setTint(0x88ff88);
        if (!ts.check) {
          ts.check = this.add
            .text(ts.spr.x + 5, ts.spr.y - 11, '\u2713', textStyle(7, COLORS.good))
            .setOrigin(0.5)
            .setDepth(7);
        }
      }
    });
  }

  _goToEnd() {
    Audio.stopMusic();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('World');
      this.scene.start('End');
    });
  }
}
