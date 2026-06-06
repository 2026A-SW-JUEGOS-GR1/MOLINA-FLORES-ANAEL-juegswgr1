import { GAME_HEIGHT, GAME_WIDTH } from './core/config.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import Level1Scene from './scenes/Level1Scene.js';
import Level2Scene from './scenes/Level2Scene.js';
import UIScene from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  backgroundColor: '#21160f',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    PreloadScene,
    MenuScene,
    Level1Scene,
    Level2Scene,
    UIScene,
    GameOverScene,
    VictoryScene
  ]
};

window.addEventListener('load', () => {
  // eslint-disable-next-line no-new
  new Phaser.Game(config);
});
