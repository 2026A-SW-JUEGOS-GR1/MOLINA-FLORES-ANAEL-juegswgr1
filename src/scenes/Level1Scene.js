import BaseLevelScene from './BaseLevelScene.js';
import { addScore } from '../core/runState.js';

export default class Level1Scene extends BaseLevelScene {
  constructor() {
    super('Level1Scene');
    this.portalPosition = null;
  }

  create() {
    this.createLevel({
      levelNumber: 1,
      title: 'Escenario 1 - Bosque infectado',
      mapKey: 'nivel1',
      tilesetName: 'bosque',
      tilesetImageKey: 'bosqueTiles',
      levelMusicMood: 'bosque'
    });

    this.requiredKills = 8;
    this.portalPosition = this.findObject('portal');
    this.spawnEnemiesFromMap(['zombie']);
    this.spawnForestSupplies();
    this.showObjective('Objetivo: limpia el bosque de zombies y busca la entrada a la casa embrujada.');
  }

  showObjective(text) {
    const objective = this.add.text(480, 78, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#eef8d8',
      backgroundColor: 'rgba(18, 48, 25, 0.82)',
      padding: { left: 12, right: 12, top: 8, bottom: 8 }
    }).setScrollFactor(0).setOrigin(0.5).setDepth(1100);

    this.tweens.add({
      targets: objective,
      alpha: 0,
      delay: 4400,
      duration: 700,
      onComplete: () => objective.destroy()
    });
  }

  spawnForestSupplies() {
    const points = this.getRandomSafePoints(3, {
      margin: 140,
      minDistanceFromPlayer: 220,
      minDistanceBetween: 190
    });

    points.forEach((point) => {
      this.spawnCoinCache(point.x, point.y, Phaser.Math.Between(3, 5));
    });
  }

  checkLevelCompletion() {
    if (this.enemyKills >= this.requiredKills && !this.portal) {
      addScore(this, 60);
      this.showObjective('El bosque esta despejado. Aparecio la entrada a la casa embrujada.');
      this.createPortal(() => this.completeLevel(() => this.scene.start('Level2Scene')), this.portalPosition, {
        label: 'Casa embrujada'
      });
    }
  }
}
