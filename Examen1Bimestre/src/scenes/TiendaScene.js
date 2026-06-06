import { UPGRADES } from '../core/config.js';
import { buyUpgrade, getDerivedStats, getRun, saveRun } from '../core/runState.js';
import { addButton, addPanel } from '../core/ui.js';

export default class TiendaScene extends Phaser.Scene {
  constructor() {
    super('TiendaScene');
  }

  create(data) {
    this.nextLevelScene = data.nextLevelScene || 'Level2Scene';
    this.cameras.main.setBackgroundColor('#20130b');
    this.add.tileSprite(480, 270, 960, 540, 'casaTiles').setAlpha(0.11);

    addPanel(this, 480, 270, 820, 470, 0x21160f, 0.93);
    this.add.text(480, 62, 'Tienda entre niveles', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '34px',
      color: '#ffd27f',
      stroke: '#341304',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.infoText = this.add.text(480, 103, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#fff2cc'
    }).setOrigin(0.5);

    this.messageText = this.add.text(480, 438, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffe39c'
    }).setOrigin(0.5);

    this.renderUpgrades();
    this.refreshInfo();

    addButton(this, 480, 488, 'Continuar al Nivel 2', () => {
      const run = getRun(this);
      run.hp = run.hpMax;
      saveRun(this, run);
      this.scene.start(this.nextLevelScene);
    }, { width: 280 });
  }

  renderUpgrades() {
    UPGRADES.forEach((upgrade, index) => {
      const x = index % 2 === 0 ? 270 : 690;
      const y = 172 + Math.floor(index / 2) * 88;
      addPanel(this, x, y, 365, 70, 0x3b2416, 0.92);
      this.add.text(x - 160, y - 20, `${upgrade.name} — ${upgrade.cost} monedas`, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '16px',
        color: '#ffd27f'
      }).setOrigin(0, 0.5);
      this.add.text(x - 160, y + 8, upgrade.description, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#fff7df',
        wordWrap: { width: 240 }
      }).setOrigin(0, 0.5);
      addButton(this, x + 124, y, 'Comprar', () => this.buy(upgrade), {
        width: 96,
        height: 38,
        fontSize: '14px'
      });
    });
  }

  buy(upgrade) {
    const result = buyUpgrade(this, upgrade);
    this.messageText.setText(result.message);
    this.refreshInfo();
  }

  refreshInfo() {
    const run = getRun(this);
    const stats = getDerivedStats(run);
    this.infoText.setText(`Monedas: ${run.coins} | HP: ${run.hp}/${run.hpMax} | Daño: ${stats.arrowDamage} | Velocidad: ${Math.round(stats.moveSpeed)}`);
  }
}
