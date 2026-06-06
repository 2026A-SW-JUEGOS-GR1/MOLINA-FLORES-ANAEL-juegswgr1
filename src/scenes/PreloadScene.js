export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.tilemapTiledJSON('nivel1', 'assets/tilemaps/nivel1.json');
    this.load.tilemapTiledJSON('nivel2', 'assets/tilemaps/nivel2.json');
    this.load.image('bosqueTiles', 'assets/tilesets/bosque.png');
    this.load.image('casaTiles', 'assets/tilesets/casa.png');
    this.load.image('coverZombie', 'assets/sprites/Zombie.png');

    const loading = this.add.text(480, 270, 'Cargando El Guerrero de la Casa Embrujada...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#ffe6a7'
    }).setOrigin(0.5);

    this.load.on('complete', () => loading.destroy());
  }

  create() {
    this.createRuntimeTextures();
    this.scene.start('MenuScene');
  }

  createRuntimeTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    const makeRect = (key, width, height, fill, stroke = null) => {
      g.clear();
      g.fillStyle(fill, 1);
      g.fillRect(0, 0, width, height);
      if (stroke !== null) {
        g.lineStyle(2, stroke, 1);
        g.strokeRect(1, 1, width - 2, height - 2);
      }
      g.generateTexture(key, width, height);
    };

    // Guerrero: silueta pixel-art simple.
    g.clear();
    g.fillStyle(0x2f3448, 1);
    g.fillRect(9, 6, 14, 22);
    g.fillStyle(0xd2b48c, 1);
    g.fillRect(11, 4, 10, 9);
    g.fillStyle(0x9aa7b8, 1);
    g.fillRect(7, 12, 18, 10);
    g.fillStyle(0xd6dbe8, 1);
    g.fillRect(24, 7, 3, 20);
    g.fillStyle(0x47506b, 1);
    g.fillRect(5, 14, 4, 10);
    g.generateTexture('warrior', 32, 32);

    // Enemigos.
    makeRect('spider', 26, 20, 0x2b1a11, 0xffb65c);
    makeRect('scorpion', 34, 22, 0x553018, 0xff8f4d);
    makeRect('mummy', 30, 34, 0xe0d2a4, 0x735c3b);
    makeRect('serpent', 36, 20, 0x4c7a3f, 0xb6e39d);
    g.clear();
    g.fillStyle(0x42664b, 1);
    g.fillRect(8, 8, 16, 22);
    g.fillStyle(0x8fbf73, 1);
    g.fillRect(10, 4, 12, 10);
    g.fillStyle(0x1f2f24, 1);
    g.fillRect(5, 12, 5, 15);
    g.fillRect(22, 12, 5, 15);
    g.fillStyle(0xffdf72, 1);
    g.fillRect(12, 7, 3, 3);
    g.fillRect(18, 7, 3, 3);
    g.generateTexture('zombie', 32, 34);

    // Proyectiles y objetos.
    makeRect('arrow', 22, 5, 0xf2d27a, 0x3b2311);
    makeRect('enemyBolt', 12, 12, 0xc24b37, 0xffd0a3);
    makeRect('venom', 12, 12, 0x67bf5b, 0xcaffe1);
    makeRect('coin', 15, 15, 0xffd452, 0x7c4a00);
    makeRect('portal', 50, 70, 0x6e4b2f, 0xffd452);
    makeRect('radiantDoor', 58, 76, 0xfff0a8, 0xffffff);
    makeRect('platform', 112, 26, 0x5e5043, 0xc6a678);

    // Efectos.
    g.clear();
    g.lineStyle(3, 0xffc04d, 1);
    g.strokeCircle(34, 34, 30);
    g.generateTexture('explosionRing', 68, 68);
  }
}
