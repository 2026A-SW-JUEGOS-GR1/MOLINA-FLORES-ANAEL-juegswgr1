export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const ABILITIES = [
  {
    id: 'double',
    name: 'Flecha doble',
    description: 'Dispara 2 flechas simultáneas con separación angular.'
  },
  {
    id: 'fire',
    name: 'Flecha de fuego',
    description: 'Aplica quemadura: daño continuo por 3 segundos.'
  },
  {
    id: 'ice',
    name: 'Flecha de hielo',
    description: 'Ralentiza al enemigo un 50% durante 2 segundos.'
  },
  {
    id: 'piercing',
    name: 'Flecha perforante',
    description: 'Atraviesa hasta 3 enemigos en línea recta.'
  },
  {
    id: 'rain',
    name: 'Lluvia de flechas',
    description: 'Dispara 5 flechas en abanico.'
  },
  {
    id: 'explosive',
    name: 'Flecha explosiva',
    description: 'Hace daño en radio de 64 px al impactar.'
  },
  {
    id: 'rapid',
    name: 'Disparo rápido',
    description: '+50% de velocidad de disparo durante la partida.'
  },
  {
    id: 'boomerang',
    name: 'Flecha bumerán',
    description: 'La flecha regresa y golpea enemigos en ambos sentidos.'
  },
  {
    id: 'electric',
    name: 'Flecha eléctrica',
    description: 'Encadena daño a 2 enemigos cercanos al impactar.'
  },
  {
    id: 'homing',
    name: 'Flecha teleguiada',
    description: 'Corrige su trayectoria hacia el enemigo más cercano.'
  }
];

export const UPGRADES = [
  {
    id: 'health',
    name: 'Salud máxima',
    cost: 20,
    description: '+20 HP máximo por nivel.'
  },
  {
    id: 'luck',
    name: 'Suerte',
    cost: 15,
    description: '+15% de monedas por nivel.'
  },
  {
    id: 'armor',
    name: 'Armadura',
    cost: 25,
    description: 'Reduce 5% del daño recibido por nivel.'
  },
  {
    id: 'speed',
    name: 'Velocidad',
    cost: 18,
    description: '+10% de velocidad por nivel.'
  },
  {
    id: 'damage',
    name: 'Daño base',
    cost: 30,
    description: '+5 de daño por nivel.'
  }
];

export const ENEMY_SCORE = {
  zombie: 16,
  spider: 10,
  scorpion: 18,
  mummy: 22,
  serpent: 26
};
