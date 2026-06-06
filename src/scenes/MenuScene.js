import { resetRun, setLevel } from '../core/runState.js';
import { addButton, addPanel } from '../core/ui.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#08090a');
    const cover = this.add.image(480, 270, 'coverZombie');
    cover.setScale(Math.max(960 / cover.width, 540 / cover.height));
    this.add.rectangle(480, 270, 960, 540, 0x000000, 0.24);

    addPanel(this, 480, 270, 720, 430, 0x21160f, 0.88);

    this.add.text(480, 98, 'EL GUERRERO DE LA CASA EMBRUJADA', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '34px',
      color: '#fff0a8',
      stroke: '#120605',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(480, 148, 'Top-Down | Bosque infectado | Casa embrujada', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#fff1c2'
    }).setOrigin(0.5);

    this.add.text(480, 204,
      'Un guerrero debe atravesar un bosque tomado por zombies.\nDespues entrara a una casa embrujada, resistira oleadas y escapara por la puerta final radiante.',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        align: 'center',
        color: '#fff7df',
        lineSpacing: 8,
        wordWrap: { width: 620 }
      }).setOrigin(0.5);

    addButton(this, 480, 292, 'Nueva partida - Bosque', () => {
      resetRun(this);
      this.scene.start('Level1Scene');
    }, { width: 310 });

    addButton(this, 480, 352, 'Probar casa embrujada', () => {
      resetRun(this);
      setLevel(this, 2);
      this.scene.start('Level2Scene');
    }, { width: 310 });

    addButton(this, 480, 412, 'Controles', () => this.showControls(), { width: 310 });
  }

  showControls() {
    const panel = addPanel(this, 480, 270, 620, 260, 0x111811, 0.96).setDepth(20);
    const text = this.add.text(480, 250,
      'CONTROLES\n\nWASD o flechas: mover al guerrero\nClick izquierdo: atacar hacia el cursor\nESPACIO: atacar hacia la ultima direccion\nESC: volver al menu desde un escenario',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#fff2cc',
        align: 'center',
        lineSpacing: 8
      }).setOrigin(0.5).setDepth(21);

    const close = addButton(this, 480, 385, 'Cerrar', () => {
      panel.destroy();
      text.destroy();
      close.bg.destroy();
      close.text.destroy();
    }, { width: 180 });
    close.bg.setDepth(21);
    close.text.setDepth(22);
  }
}
