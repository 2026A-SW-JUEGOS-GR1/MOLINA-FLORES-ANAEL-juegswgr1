import { ABILITIES } from '../core/config.js';
import { addSkill, getRun } from '../core/runState.js';
import { addButton, addPanel } from '../core/ui.js';

export default class AbilityScene extends Phaser.Scene {
  constructor() {
    super('AbilityScene');
  }

  create(data) {
    this.nextScene = data.nextScene || 'TiendaScene';
    this.nextLevelScene = data.nextLevelScene || 'Level2Scene';
    this.levelCompleted = data.levelCompleted || 1;

    this.cameras.main.setBackgroundColor('#1b110c');
    this.add.tileSprite(480, 270, 960, 540, 'bosqueTiles').setAlpha(0.12);
    addPanel(this, 480, 270, 760, 430, 0x21160f, 0.92);

    this.add.text(480, 88, 'Elige 1 habilidad de flecha', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '34px',
      color: '#ffd27f',
      stroke: '#341304',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(480, 130, 'Las habilidades se acumulan durante la run y se pierden al morir.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#fff2cc'
    }).setOrigin(0.5);

    const options = this.pickThreeAbilities();
    if (options.length === 0) {
      this.add.text(480, 242, 'Ya tienes todas las habilidades disponibles.', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#fff2cc'
      }).setOrigin(0.5);
      addButton(this, 480, 340, 'Continuar', () => this.goNext(), { width: 240 });
      return;
    }

    options.forEach((ability, index) => {
      const y = 195 + index * 82;
      addPanel(this, 480, y, 650, 68, 0x3b2416, 0.92);
      this.add.text(190, y - 18, ability.name, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '18px',
        color: '#ffd27f'
      }).setOrigin(0, 0.5);
      this.add.text(190, y + 12, ability.description, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#fff7df',
        wordWrap: { width: 410 }
      }).setOrigin(0, 0.5);
      addButton(this, 695, y, 'Elegir', () => {
        addSkill(this, ability.id);
        this.goNext();
      }, { width: 110, height: 40, fontSize: '15px' });
    });
  }

  pickThreeAbilities() {
    const run = getRun(this);
    const available = ABILITIES.filter((ability) => !run.skills.includes(ability.id));
    Phaser.Utils.Array.Shuffle(available);
    return available.slice(0, 3);
  }

  goNext() {
    this.scene.start(this.nextScene, {
      nextLevelScene: this.nextLevelScene,
      levelCompleted: this.levelCompleted
    });
  }
}
