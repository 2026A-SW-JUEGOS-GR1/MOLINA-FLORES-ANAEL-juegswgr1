import { getDerivedStats, getRun } from '../core/runState.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create(data) {
    this.levelName = data.levelName || 'Nivel';
    this.panel = this.add.rectangle(480, 22, 930, 40, 0x1d130d, 0.78)
      .setStrokeStyle(1, 0xf1c27d, 0.85)
      .setDepth(1000);

    this.text = this.add.text(22, 10, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#fff2cc'
    }).setDepth(1001);

    this.hpBarBg = this.add.rectangle(725, 22, 190, 16, 0x4a1b15, 1).setDepth(1001).setOrigin(0, 0.5);
    this.hpBar = this.add.rectangle(725, 22, 190, 16, 0x63c46a, 1).setDepth(1002).setOrigin(0, 0.5);
    this.hpText = this.add.text(820, 22, '', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(1003);
  }

  update() {
    const run = getRun(this);
    const stats = getDerivedStats(run);
    const skills = run.skills.length > 0 ? run.skills.length : 0;
    this.text.setText(
      `${this.levelName} | Score: ${run.score} | Monedas: ${run.coins} | Habilidades: ${skills} | Daño: ${stats.arrowDamage}`
    );

    const hpPercent = Phaser.Math.Clamp(run.hp / run.hpMax, 0, 1);
    this.hpBar.displayWidth = 190 * hpPercent;
    this.hpText.setText(`${run.hp}/${run.hpMax} HP`);
  }
}
