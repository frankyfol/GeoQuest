import Phaser from 'phaser';

// BootScene: load the absolute minimum needed to render a loading bar,
// then hand off to PreloadScene which loads everything else.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Generate a tiny 1x1 white texture used to draw the loading bar
    // and various placeholder rectangles, without needing any image files.
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 1, 1);
    g.generateTexture('pixel', 1, 1);
    g.destroy();
  }

  create() {
    this.scene.start('Preload');
  }
}
