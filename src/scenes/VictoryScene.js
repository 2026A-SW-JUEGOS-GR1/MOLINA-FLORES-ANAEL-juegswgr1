import { getRun, resetRun } from '../core/runState.js';
import { addButton, addPanel } from '../core/ui.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create() {
    const run = getRun(this);
    this.cameras.main.setBackgroundColor('#1b170f');
    addPanel(this, 480, 270, 740, 405, 0x211f18, 0.94);

    this.add.text(480, 100, 'VICTORIA', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '44px',
      color: '#fff0a8',
      stroke: '#3b2a08',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(480, 220,
      `Felicitaciones, guerrero.\n\nSobreviviste al bosque infectado, entraste a la casa embrujada y cruzaste la puerta final radiante.\n\nLogros alcanzados:\n- Derrotaste a los zombies del bosque\n- Resististe las oleadas dentro de la casa embrujada\n- Encontraste la puerta que demuestra tu victoria\n\nScore final: ${run.score}\nMonedas restantes: ${run.coins}\nHP final: ${run.hp}/${run.hpMax}`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#fff2cc',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: 620 }
      }).setOrigin(0.5);

    addButton(this, 480, 382, 'Nueva partida', () => {
      resetRun(this);
      this.scene.start('Level1Scene');
    }, { width: 250 });

    addButton(this, 480, 440, 'Menu', () => {
      resetRun(this);
      this.scene.start('MenuScene');
    }, { width: 250 });
  }
}
