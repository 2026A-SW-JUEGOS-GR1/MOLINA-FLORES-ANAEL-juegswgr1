const DEFAULT_RUN = Object.freeze({
  score: 0,
  coins: 0,
  level: 1,
  hp: 100,
  hpMax: 100,
  skills: [],
  upgrades: {
    health: 0,
    luck: 0,
    armor: 0,
    speed: 0,
    damage: 0
  }
});

export function createDefaultRun() {
  return {
    ...DEFAULT_RUN,
    skills: [],
    upgrades: { ...DEFAULT_RUN.upgrades }
  };
}

export function cloneRun(run) {
  return {
    ...run,
    skills: [...(run.skills || [])],
    upgrades: { ...(run.upgrades || DEFAULT_RUN.upgrades) }
  };
}

export function resetRun(scene) {
  const run = createDefaultRun();
  scene.registry.set('run', run);
  return run;
}

export function getRun(scene) {
  const current = scene.registry.get('run');
  if (!current) {
    return resetRun(scene);
  }
  return cloneRun(current);
}

export function saveRun(scene, run) {
  scene.registry.set('run', cloneRun(run));
}

export function hasSkill(scene, skillId) {
  return getRun(scene).skills.includes(skillId);
}

export function addSkill(scene, skillId) {
  const run = getRun(scene);
  if (!run.skills.includes(skillId)) {
    run.skills.push(skillId);
  }
  saveRun(scene, run);
  return run;
}

export function addCoins(scene, amount) {
  const run = getRun(scene);
  run.coins += Math.max(0, Math.floor(amount));
  saveRun(scene, run);
  return run;
}

export function addScore(scene, amount) {
  const run = getRun(scene);
  run.score += Math.max(0, Math.floor(amount));
  saveRun(scene, run);
  return run;
}

export function setLevel(scene, level) {
  const run = getRun(scene);
  run.level = level;
  saveRun(scene, run);
  return run;
}

export function healPlayer(scene, amount) {
  const run = getRun(scene);
  run.hp = Math.min(run.hpMax, run.hp + Math.max(0, amount));
  saveRun(scene, run);
  return run;
}

export function damagePlayer(scene, rawDamage) {
  const run = getRun(scene);
  const stats = getDerivedStats(run);
  const finalDamage = Math.max(1, Math.round(rawDamage * (1 - stats.armorReduction)));
  run.hp = Math.max(0, run.hp - finalDamage);
  saveRun(scene, run);
  return { run, finalDamage };
}

export function buyUpgrade(scene, upgrade) {
  const run = getRun(scene);
  if (run.coins < upgrade.cost) {
    return { ok: false, run, message: 'No tienes monedas suficientes.' };
  }

  run.coins -= upgrade.cost;
  run.upgrades[upgrade.id] += 1;

  if (upgrade.id === 'health') {
    run.hpMax += 20;
    run.hp = Math.min(run.hpMax, run.hp + 20);
  }

  saveRun(scene, run);
  return { ok: true, run, message: `${upgrade.name} mejorada.` };
}

export function getDerivedStats(run) {
  const upgrades = run.upgrades || DEFAULT_RUN.upgrades;
  const rapid = run.skills?.includes('rapid') ? 0.67 : 1;

  return {
    moveSpeed: 175 * (1 + upgrades.speed * 0.10),
    arrowDamage: 24 + upgrades.damage * 5,
    shootCooldown: 310 * rapid,
    armorReduction: Math.min(0.65, upgrades.armor * 0.05),
    luckMultiplier: 1 + upgrades.luck * 0.15,
    hpMax: run.hpMax
  };
}
