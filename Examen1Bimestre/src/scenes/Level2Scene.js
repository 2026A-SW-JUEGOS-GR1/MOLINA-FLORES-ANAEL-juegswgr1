import BaseLevelScene from './BaseLevelScene.js';
import { addScore } from '../core/runState.js';

export default class Level2Scene extends BaseLevelScene {
  constructor() {
    super('Level2Scene');
    this.wavesSpawned = 0;
    this.maxWaves = 4;
    this.portalPosition = null;
    this.waveSpawnPoints = [];
  }

  create() {
    this.createLevel({
      levelNumber: 2,
      title: 'Escenario 2 - Casa embrujada',
      mapKey: 'nivel2',
      tilesetName: 'casa',
      tilesetImageKey: 'casaTiles',
      levelMusicMood: 'casa'
    });

    this.wavesSpawned = 0;
    this.maxWaves = 4;
    this.portalPosition = this.findObject('portal');
    this.waveSpawnPoints = this.findObjects('wave_spawner');
    this.spawnHouseSupplies();
    this.startZombieWaves();
    this.showObjective('Objetivo: resiste las oleadas de zombies dentro de la casa embrujada.');
  }

  showObjective(text) {
    const objective = this.add.text(480, 78, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#fff2cc',
      backgroundColor: 'rgba(28, 22, 18, 0.86)',
      padding: { left: 12, right: 12, top: 8, bottom: 8 }
    }).setScrollFactor(0).setOrigin(0.5).setDepth(1100);

    this.tweens.add({
      targets: objective,
      alpha: 0,
      delay: 4600,
      duration: 700,
      onComplete: () => objective.destroy()
    });
  }

  startZombieWaves() {
    this.spawnWave();
    this.waveEvent = this.time.addEvent({
      delay: 7200,
      repeat: this.maxWaves - 2,
      callback: () => this.spawnWave()
    });
  }

  spawnWave() {
    this.wavesSpawned += 1;
    const waveText = this.add.text(480, 120, `Oleada zombie ${this.wavesSpawned}/${this.maxWaves}`, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '30px',
      color: '#fff0a8',
      stroke: '#221512',
      strokeThickness: 5
    }).setScrollFactor(0).setOrigin(0.5).setDepth(1100);
    this.tweens.add({ targets: waveText, alpha: 0, y: 95, delay: 950, duration: 700, onComplete: () => waveText.destroy() });

    const spawners = this.waveSpawnPoints.length > 0 ? this.waveSpawnPoints : [this.getRandomSafePoint({ minDistanceFromPlayer: 300 })];
    spawners.forEach((spawner) => {
      if (spawner) {
        this.spawnEnemy('zombie', spawner.x + Phaser.Math.Between(-20, 20), spawner.y + Phaser.Math.Between(-20, 20));
      }
    });

    if (this.wavesSpawned >= 3) {
      const point = this.getRandomSafePoint({ minDistanceFromPlayer: 260 }) || this.findObject('portal');
      if (point) this.spawnEnemy('zombie', point.x, point.y);
    }
  }

  spawnHouseSupplies() {
    const points = this.getRandomSafePoints(3, {
      margin: 140,
      minDistanceFromPlayer: 220,
      minDistanceBetween: 210
    });

    points.forEach((point) => {
      this.spawnCoinCache(point.x, point.y, Phaser.Math.Between(4, 6));
    });
  }

  checkLevelCompletion() {
    const wavesDone = this.wavesSpawned >= this.maxWaves;
    const activeEnemies = this.enemies.countActive(true);
    if (wavesDone && activeEnemies === 0 && !this.portal) {
      addScore(this, 150);
      this.showObjective('La puerta final radiante se ha abierto. Entra para demostrar tu victoria.');
      this.createPortal(() => this.completeLevel(() => this.scene.start('VictoryScene')), this.portalPosition, {
        texture: 'radiantDoor',
        label: 'Puerta final'
      });
    }
  }

  update(time, delta) {
    super.update(time, delta);
    if (!this.levelFinished) {
      this.checkLevelCompletion();
    }
  }
}
