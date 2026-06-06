import { resetRun } from '../core/runState.js';
import { addButton, addPanel } from '../core/ui.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data) {
    const run = data.run || { score: 0, coins: 0, skills: [] };
    this.cameras.main.setBackgroundColor('#180806');
    addPanel(this, 480, 270, 680, 390, 0x210c08, 0.95);

    this.add.text(480, 120, 'GAME OVER', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '54px',
      color: '#ff6b5a',
      stroke: '#330000',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(480, 204,
      `Roguelike puro: perdiste todo y vuelves a nivel 1.\n\nScore final: ${run.score}\nMonedas al morir: ${run.coins}\nHabilidades obtenidas: ${run.skills?.length || 0}`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#fff2cc',
        align: 'center',
        lineSpacing: 8
      }).setOrigin(0.5);

    addButton(this, 480, 340, 'Reintentar desde Nivel 1', () => {
      resetRun(this);
      this.scene.start('Level1Scene');
    }, { width: 300 });

    addButton(this, 480, 400, 'Volver al menú', () => {
      resetRun(this);
      this.scene.start('MenuScene');
    }, { width: 300 });
  }
}
