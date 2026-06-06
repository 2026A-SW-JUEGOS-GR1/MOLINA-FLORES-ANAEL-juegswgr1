import { ENEMY_SCORE } from '../core/config.js';
import {
  addCoins,
  addScore,
  damagePlayer,
  getDerivedStats,
  getRun,
  saveRun,
  setLevel
} from '../core/runState.js';
import { addKeyboardHint } from '../core/ui.js';

export default class BaseLevelScene extends Phaser.Scene {
  constructor(key) {
    super(key);
    this.levelFinished = false;
    this.enemyKills = 0;
    this.lastAimAngle = 0;
    this.nextPlayerDamageAt = 0;
    this.nextShotAt = 0;
  }

  createLevel({
    levelNumber,
    title,
    mapKey,
    tilesetName,
    tilesetImageKey,
    levelMusicMood = 'desierto'
  }) {
    this.levelFinished = false;
    this.enemyKills = 0;
    this.nextPlayerDamageAt = 0;
    this.nextShotAt = 0;
    this.levelTitle = title;
    this.levelNumber = levelNumber;
    setLevel(this, levelNumber);

    this.cameras.main.fadeIn(350, 0, 0, 0);
    this.createMap(mapKey, tilesetName, tilesetImageKey);
    this.createGroups();
    this.createPlayerFromMap();
    this.createCollisions();
    this.createLevelTexts(levelMusicMood);
    this.createInputs();
    this.scene.launch('UIScene', { levelName: title });
  }

  createMap(mapKey, tilesetName, tilesetImageKey) {
    this.map = this.make.tilemap({ key: mapKey });
    this.tileset = this.map.addTilesetImage(tilesetName, tilesetImageKey);
    this.groundLayer = this.map.createLayer('ground', this.tileset, 0, 0).setDepth(0);
    this.wallsLayer = this.map.createLayer('walls', this.tileset, 0, 0).setDepth(5);

    if (this.wallsLayer) {
      this.wallsLayer.setCollisionByExclusion([-1, 0]);
    }

    const danger = this.map.getLayer('danger');
    if (danger) {
      this.dangerLayer = this.map.createLayer('danger', this.tileset, 0, 0).setDepth(3).setAlpha(0.9);
      this.dangerLayer.setCollisionByExclusion([-1, 0]);
    }

    this.objects = this.map.getObjectLayer('objects')?.objects || [];

    const mapWidth = this.map.widthInPixels;
    const mapHeight = this.map.heightInPixels;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
  }

  createGroups() {
    this.enemies = this.physics.add.group();
    this.arrows = this.physics.add.group({ maxSize: 90 });
    this.enemyProjectiles = this.physics.add.group({ maxSize: 90 });
    this.coins = this.physics.add.group({ maxSize: 160 });
    this.platforms = this.physics.add.group();
  }

  createPlayerFromMap() {
    const spawn = this.findObject('player') || { x: 96, y: 480 };
    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'warrior')
      .setDepth(20)
      .setCollideWorldBounds(true);
    this.player.body.setSize(22, 24).setOffset(5, 6);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1);
  }

  createCollisions() {
    if (this.wallsLayer) {
      this.physics.add.collider(this.player, this.wallsLayer);
      this.physics.add.collider(this.enemies, this.wallsLayer);
      this.physics.add.collider(this.enemyProjectiles, this.wallsLayer, (bolt) => bolt.destroy());
    }

    this.physics.add.overlap(this.arrows, this.enemies, this.handleArrowEnemy, null, this);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemyProjectiles, this.handlePlayerProjectile, null, this);
  }

  createLevelTexts(mood) {
    const titleColor = mood === 'bosque' ? '#e8f5c8' : mood === 'casa' ? '#fff0a8' : '#ffd6a5';
    const strokeColor = mood === 'bosque' ? '#113314' : mood === 'casa' ? '#241913' : '#170b08';
    this.add.text(18, 18, this.levelTitle, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '24px',
      color: titleColor,
      stroke: strokeColor,
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(1000);

    addKeyboardHint(this);
  }

  createInputs() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,ESC');

    this.input.on('pointerdown', (pointer) => this.tryShoot(pointer));

    this.keys.SPACE.on('down', () => this.tryShoot(null));
    this.keys.ESC.on('down', () => {
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    });
  }

  update(time, delta) {
    if (!this.player || this.levelFinished) return;

    this.updatePlayer(time);
    this.updateArrows(time, delta);
    this.updateEnemies(time, delta);
    this.updateProjectiles(time);
  }

  updatePlayer(time) {
    const run = getRun(this);
    const stats = getDerivedStats(run);
    const cursedUntil = this.player.getData('cursedUntil') || 0;
    const speed = time < cursedUntil ? stats.moveSpeed * 0.55 : stats.moveSpeed;

    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.keys.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const vector = new Phaser.Math.Vector2(vx, vy).normalize().scale(speed);
      this.player.setVelocity(vector.x, vector.y);
      this.lastAimAngle = Math.atan2(vector.y, vector.x);
    } else {
      this.player.setVelocity(0, 0);
    }
  }

  tryShoot(pointer) {
    const now = this.time.now;
    const run = getRun(this);
    const stats = getDerivedStats(run);
    if (now < this.nextShotAt) return;

    let angle = this.lastAimAngle;
    if (pointer) {
      const worldPoint = pointer.positionToCamera(this.cameras.main);
      angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
      this.lastAimAngle = angle;
    }

    const skills = run.skills;
    if (skills.includes('rain')) {
      [-0.45, -0.22, 0, 0.22, 0.45].forEach((offset) => this.spawnArrow(angle + offset));
    } else if (skills.includes('double')) {
      this.spawnArrow(angle - 0.13);
      this.spawnArrow(angle + 0.13);
    } else {
      this.spawnArrow(angle);
    }

    this.nextShotAt = now + stats.shootCooldown;
  }

  spawnArrow(angle) {
    const run = getRun(this);
    const stats = getDerivedStats(run);
    const arrow = this.arrows.get(this.player.x, this.player.y, 'arrow');
    if (!arrow) return;

    arrow.setActive(true).setVisible(true).setDepth(18);
    arrow.body.enable = true;
    arrow.body.setAllowGravity(false);
    arrow.body.setSize(22, 5);
    arrow.setRotation(angle);
    arrow.setDataEnabled();
    arrow.setData({
      bornAt: this.time.now,
      ttl: run.skills.includes('boomerang') ? 1450 : 1050,
      damage: stats.arrowDamage,
      returned: false,
      hits: 0
    });
    this.physics.velocityFromRotation(angle, 500, arrow.body.velocity);
  }

  updateArrows(time) {
    this.arrows.children.each((arrow) => {
      if (!arrow.active) return;
      const bornAt = arrow.getData('bornAt') || time;
      const ttl = arrow.getData('ttl') || 1000;

      if (time - bornAt > ttl) {
        this.disableSprite(arrow);
        return;
      }

      const run = getRun(this);
      if (run.skills.includes('boomerang') && !arrow.getData('returned') && time - bornAt > 520) {
        arrow.setData('returned', true);
        arrow.body.velocity.x *= -1;
        arrow.body.velocity.y *= -1;
        arrow.rotation += Math.PI;
      }

      if (run.skills.includes('homing')) {
        const target = this.findNearestEnemy(arrow.x, arrow.y, 280);
        if (target) {
          const angle = Phaser.Math.Angle.Between(arrow.x, arrow.y, target.x, target.y);
          arrow.rotation = Phaser.Math.Angle.RotateTo(arrow.rotation, angle, 0.045);
          this.physics.velocityFromRotation(arrow.rotation, 500, arrow.body.velocity);
        }
      }
    });
  }

  updateEnemies(time) {
    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;
      const type = enemy.getData('type');
      const baseSpeed = enemy.getData('speed') || 70;
      const slowUntil = enemy.getData('slowUntil') || 0;
      const speed = time < slowUntil ? baseSpeed * 0.5 : baseSpeed;
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

      if (type === 'spider') {
        const wobble = Math.sin(time / 180 + (enemy.getData('phase') || 0)) * 0.7;
        this.physics.velocityFromRotation(angle + wobble, speed, enemy.body.velocity);
      }

      if (type === 'zombie') {
        const stagger = Math.sin(time / 260 + (enemy.getData('phase') || 0)) * 0.35;
        this.physics.velocityFromRotation(angle + stagger, speed * 0.72, enemy.body.velocity);
      }

      if (type === 'scorpion') {
        if (distance > 180) {
          this.physics.velocityFromRotation(angle, speed * 0.55, enemy.body.velocity);
        } else {
          enemy.setVelocity(0, 0);
        }
        this.enemyShoot(enemy, 'enemyBolt', 260, 11, 1450);
      }

      if (type === 'mummy') {
        this.physics.velocityFromRotation(angle, speed * 0.65, enemy.body.velocity);
      }

      if (type === 'serpent') {
        const orbit = Math.sin(time / 350 + (enemy.getData('phase') || 0)) * 1.2;
        this.physics.velocityFromRotation(angle + orbit, speed * 0.8, enemy.body.velocity);
        this.enemyShoot(enemy, 'venom', 230, 13, 1650);
      }
    });
  }

  enemyShoot(enemy, texture, projectileSpeed, damage, cooldown) {
    const now = this.time.now;
    const nextShot = enemy.getData('nextShotAt') || 0;
    if (now < nextShot) return;

    enemy.setData('nextShotAt', now + cooldown + Phaser.Math.Between(-250, 350));

    const projectile = this.enemyProjectiles.get(enemy.x, enemy.y, texture);
    if (!projectile) return;

    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    projectile.setActive(true).setVisible(true).setDepth(16);
    projectile.body.enable = true;
    projectile.body.setAllowGravity(false);
    projectile.setData({ bornAt: now, ttl: 2400, damage });
    this.physics.velocityFromRotation(angle, projectileSpeed, projectile.body.velocity);
  }

  updateProjectiles(time) {
    this.enemyProjectiles.children.each((projectile) => {
      if (!projectile.active) return;
      const bornAt = projectile.getData('bornAt') || time;
      const ttl = projectile.getData('ttl') || 2000;
      if (time - bornAt > ttl) {
        this.disableSprite(projectile);
      }
    });
  }

  handleArrowEnemy(arrow, enemy) {
    if (!arrow.active || !enemy.active) return;

    const run = getRun(this);
    const damage = arrow.getData('damage') || 20;
    this.damageEnemy(enemy, damage);

    if (run.skills.includes('fire')) {
      this.applyBurn(enemy, 3, Math.max(4, Math.round(damage * 0.22)));
    }

    if (run.skills.includes('ice')) {
      enemy.setData('slowUntil', this.time.now + 2000);
    }

    if (run.skills.includes('explosive')) {
      this.explodeAt(enemy.x, enemy.y, Math.max(8, Math.round(damage * 0.55)));
    }

    if (run.skills.includes('electric')) {
      this.chainLightning(enemy, Math.max(7, Math.round(damage * 0.45)));
    }

    if (run.skills.includes('piercing')) {
      const hits = (arrow.getData('hits') || 0) + 1;
      arrow.setData('hits', hits);
      if (hits >= 3) this.disableSprite(arrow);
    } else {
      this.disableSprite(arrow);
    }
  }

  damageEnemy(enemy, amount) {
    if (!enemy.active) return;
    const hp = (enemy.getData('hp') || 1) - amount;
    enemy.setData('hp', hp);
    enemy.setTint(0xfff2a8);
    this.time.delayedCall(80, () => enemy.active && enemy.clearTint());

    if (hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  applyBurn(enemy, ticks, tickDamage) {
    for (let i = 1; i <= ticks; i += 1) {
      this.time.delayedCall(i * 1000, () => {
        if (enemy.active) {
          enemy.setTint(0xff5d2a);
          this.damageEnemy(enemy, tickDamage);
          this.time.delayedCall(90, () => enemy.active && enemy.clearTint());
        }
      });
    }
  }

  explodeAt(x, y, damage) {
    const ring = this.add.image(x, y, 'explosionRing').setDepth(25).setAlpha(0.9);
    this.tweens.add({
      targets: ring,
      scale: 1.6,
      alpha: 0,
      duration: 260,
      onComplete: () => ring.destroy()
    });

    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= 64) {
        this.damageEnemy(enemy, damage);
      }
    });
  }

  chainLightning(originEnemy, damage) {
    const chained = this.enemies.children.entries
      .filter((enemy) => enemy.active && enemy !== originEnemy)
      .map((enemy) => ({ enemy, d: Phaser.Math.Distance.Between(originEnemy.x, originEnemy.y, enemy.x, enemy.y) }))
      .filter((item) => item.d <= 180)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);

    chained.forEach(({ enemy }) => {
      const line = this.add.line(0, 0, originEnemy.x, originEnemy.y, enemy.x, enemy.y, 0x9fe8ff, 0.9)
        .setOrigin(0, 0)
        .setDepth(30);
      this.tweens.add({ targets: line, alpha: 0, duration: 160, onComplete: () => line.destroy() });
      this.damageEnemy(enemy, damage);
    });
  }

  killEnemy(enemy) {
    const type = enemy.getData('type') || 'spider';
    const run = getRun(this);
    const stats = getDerivedStats(run);
    const score = ENEMY_SCORE[type] || 10;
    const coinCount = Math.max(1, Math.round((enemy.getData('coinDrop') || 1) * stats.luckMultiplier));

    this.spawnCoins(enemy.x, enemy.y, coinCount);
    addScore(this, score);
    this.enemyKills += 1;
    this.disableSprite(enemy);
    this.checkLevelCompletion();
  }

  spawnCoins(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      const coin = this.coins.get(x + Phaser.Math.Between(-14, 14), y + Phaser.Math.Between(-14, 14), 'coin');
      if (!coin) return;
      coin.setActive(true).setVisible(true).setDepth(14);
      coin.body.enable = true;
      coin.body.setAllowGravity(false);
      coin.setData('value', 1);
      coin.setBounce(0.4);
      coin.setVelocity(Phaser.Math.Between(-40, 40), Phaser.Math.Between(-40, 40));
      this.time.delayedCall(280, () => coin.active && coin.setVelocity(0, 0));
    }
  }

  spawnCoinCache(x, y, count = 5) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const radius = Phaser.Math.Between(10, 28);
      const coin = this.coins.get(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, 'coin');
      if (!coin) return;
      coin.setActive(true).setVisible(true).setDepth(14);
      coin.body.enable = true;
      coin.body.setAllowGravity(false);
      coin.setData('value', 1);
      coin.setVelocity(0, 0);
    }
  }

  collectCoin(player, coin) {
    if (!coin.active) return;
    const value = coin.getData('value') || 1;
    addCoins(this, value);
    addScore(this, value);
    this.disableSprite(coin);
  }

  handlePlayerEnemy(player, enemy) {
    if (!enemy.active) return;
    const type = enemy.getData('type');
    this.applyDamageToPlayer(enemy.getData('touchDamage') || 10);
    if (type === 'mummy') {
      this.player.setData('cursedUntil', this.time.now + 2000);
    }
  }

  handlePlayerProjectile(player, projectile) {
    const damage = projectile.getData('damage') || 10;
    this.applyDamageToPlayer(damage);
    this.disableSprite(projectile);
  }

  applyDamageToPlayer(amount) {
    const now = this.time.now;
    if (now < this.nextPlayerDamageAt || this.levelFinished) return;

    const { run, finalDamage } = damagePlayer(this, amount);
    this.nextPlayerDamageAt = now + 650;
    this.player.setTint(0xff5b5b);
    this.cameras.main.shake(120, 0.006);
    this.time.delayedCall(120, () => this.player?.clearTint());

    const floating = this.add.text(this.player.x, this.player.y - 28, `-${finalDamage}`, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      color: '#ffdddd',
      stroke: '#3b0000',
      strokeThickness: 3
    }).setDepth(80).setOrigin(0.5);
    this.tweens.add({ targets: floating, y: floating.y - 24, alpha: 0, duration: 500, onComplete: () => floating.destroy() });

    if (run.hp <= 0) {
      this.gameOver();
    }
  }

  spawnEnemy(type, x, y) {
    const texture = {
      zombie: 'zombie',
      spider: 'spider',
      scorpion: 'scorpion',
      mummy: 'mummy',
      serpent: 'serpent'
    }[type] || 'spider';

    const data = {
      zombie: { hp: 48, speed: 82, touchDamage: 9, coinDrop: 1 },
      spider: { hp: 35, speed: 95, touchDamage: 8, coinDrop: 1 },
      scorpion: { hp: 55, speed: 70, touchDamage: 10, coinDrop: 2 },
      mummy: { hp: 80, speed: 70, touchDamage: 12, coinDrop: 2 },
      serpent: { hp: 62, speed: 105, touchDamage: 10, coinDrop: 2 }
    }[type] || { hp: 35, speed: 85, touchDamage: 8, coinDrop: 1 };

    const enemy = this.enemies.create(x, y, texture)
      .setDepth(15)
      .setCollideWorldBounds(true);
    enemy.body.setAllowGravity(false);
    enemy.setData({
      type,
      ...data,
      phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      slowUntil: 0,
      nextShotAt: this.time.now + Phaser.Math.Between(600, 1600)
    });
    return enemy;
  }

  spawnEnemiesFromMap(types = []) {
    const allowed = new Set(types);
    this.objects.forEach((object) => {
      const type = object.type || object.name;
      if (allowed.has(type)) {
        this.spawnEnemy(type, object.x, object.y);
      }
    });
  }

  findObject(name) {
    return this.objects.find((object) => object.name === name || object.type === name);
  }

  findObjects(nameOrType) {
    return this.objects.filter((object) => object.name === nameOrType || object.type === nameOrType);
  }

  findNearestEnemy(x, y, maxDistance) {
    let nearest = null;
    let nearestDistance = maxDistance;
    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = enemy;
      }
    });
    return nearest;
  }

  getRandomSafePoint(options = {}) {
    const {
      margin = 96,
      minDistanceFromPlayer = 160,
      attempts = 80,
      avoidDanger = true
    } = options;

    for (let i = 0; i < attempts; i += 1) {
      const x = Phaser.Math.Between(margin, this.map.widthInPixels - margin);
      const y = Phaser.Math.Between(margin, this.map.heightInPixels - margin);
      if (this.isPointSafe(x, y, avoidDanger) && this.isFarEnoughFromPlayer(x, y, minDistanceFromPlayer)) {
        return { x, y };
      }
    }

    return null;
  }

  getRandomSafePoints(count, options = {}) {
    const points = [];
    const minDistanceBetween = options.minDistanceBetween || 120;
    const attempts = options.attempts || count * 90;

    for (let i = 0; i < attempts && points.length < count; i += 1) {
      const point = this.getRandomSafePoint({ ...options, attempts: 1 });
      if (!point) continue;
      const tooClose = points.some((other) => Phaser.Math.Distance.Between(point.x, point.y, other.x, other.y) < minDistanceBetween);
      if (!tooClose) {
        points.push(point);
      }
    }

    return points;
  }

  isFarEnoughFromPlayer(x, y, minDistance) {
    if (!this.player || minDistance <= 0) return true;
    return Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) >= minDistance;
  }

  isPointSafe(x, y, avoidDanger = true) {
    const tileX = Math.floor(x / this.map.tileWidth);
    const tileY = Math.floor(y / this.map.tileHeight);
    return !this.hasSolidTile(this.wallsLayer, tileX, tileY) &&
      (!avoidDanger || !this.hasSolidTile(this.dangerLayer, tileX, tileY));
  }

  hasSolidTile(layer, tileX, tileY) {
    if (!layer || tileX < 0 || tileY < 0 || tileX >= this.map.width || tileY >= this.map.height) {
      return false;
    }

    const tile = layer.getTileAt(tileX, tileY);
    return Boolean(tile && tile.index > 0);
  }

  createPortal(nextCallback, position = null, options = {}) {
    if (this.portal) return;
    const texture = options.texture || 'portal';
    const label = options.label || 'Salida';
    const portalObj = position || this.findObject('portal') || { x: this.map.widthInPixels - 100, y: this.map.heightInPixels / 2 };
    this.portal = this.physics.add.sprite(portalObj.x, portalObj.y, texture)
      .setDepth(12)
      .setAlpha(0.88);
    this.portal.body.setAllowGravity(false);
    this.portal.body.setImmovable(true);

    this.tweens.add({
      targets: this.portal,
      alpha: 0.45,
      scale: 1.08,
      yoyo: true,
      repeat: -1,
      duration: 550
    });

    this.add.text(portalObj.x, portalObj.y - 58, label, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      color: '#fff2a6',
      stroke: '#2a160d',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(40);

    this.physics.add.overlap(this.player, this.portal, () => {
      if (!this.levelFinished) nextCallback();
    });
  }

  completeLevel(callback) {
    this.levelFinished = true;
    this.scene.stop('UIScene');
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.time.delayedCall(360, callback);
  }

  gameOver() {
    if (this.levelFinished) return;
    this.levelFinished = true;
    const run = getRun(this);
    this.scene.stop('UIScene');
    this.cameras.main.fadeOut(350, 80, 0, 0);
    this.time.delayedCall(360, () => this.scene.start('GameOverScene', { run }));
  }

  disableSprite(sprite) {
    sprite.setActive(false).setVisible(false);
    if (sprite.body) {
      sprite.body.stop();
      sprite.body.enable = false;
    }
  }

  checkLevelCompletion() {
    // Implementado por las escenas de nivel.
  }
}
