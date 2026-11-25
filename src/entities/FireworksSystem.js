import * as THREE from 'three';

export class FireworksSystem {
  constructor(world, soundManager) {
    this.world = world;
    this.scene = world.scene;
    this.sound = soundManager;

    this.activeRockets = [];
    this.activeBursts = [];
    this.activeFountains = [];
    this.activeSnowballs = [];
    this.activeConfetti = [];
    this.placedGifts = [];
    this.sparklerActive = false;
    this.sparklerTimer = 0;
    this.sparklerParticles = [];

    this.initParticleTextures();
  }

  initParticleTextures() {
    // Sharp round glow particle canvas
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 230, 180, 0.9)');
    grad.addColorStop(0.7, 'rgba(255, 150, 50, 0.4)');
    grad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    this.sparkTexture = new THREE.CanvasTexture(canvas);
  }

  // --- 1. STAR SKY ROCKETS (AERIAL FIREWORKS) ---
  launchRocket(startPos, customColor = null) {
    this.sound.playRocketLaunch();

    const colors = [
      0xff1744, // Ruby Red
      0x00e676, // Emerald Green
      0xffd700, // Royal Gold
      0x00e5ff, // Ice Blue
      0xff4081, // Festive Magenta
      0xffffff  // Winter White
    ];
    const burstColor = customColor || colors[Math.floor(Math.random() * colors.length)];

    // 3D Rocket projectile
    const rocketGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6);
    const rocketMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const mesh = new THREE.Mesh(rocketGeo, rocketMat);
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    // Rocket Trail Light
    const trailLight = new THREE.PointLight(0xffaa44, 2.0, 12);
    trailLight.position.copy(startPos);
    this.scene.add(trailLight);

    const targetY = 28 + Math.random() * 22; // Altitude
    const vx = (Math.random() - 0.5) * 4;
    const vz = (Math.random() - 0.5) * 4;

    this.activeRockets.push({
      mesh,
      light: trailLight,
      targetY,
      vel: new THREE.Vector3(vx, 32 + Math.random() * 12, vz),
      burstColor,
      life: 0
    });
  }

  // --- 2. FIREWORK EXPLOSION BURST ---
  createBurst(pos, color) {
    this.sound.playFireworkBoom();

    const particleCount = 220;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    // Burst styles: spherical, ring, or willow
    const isRing = Math.random() > 0.65;

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      let vx, vy, vz;
      if (isRing) {
        const theta = (i / particleCount) * Math.PI * 2;
        const speed = 12 + Math.random() * 4;
        vx = Math.cos(theta) * speed;
        vy = (Math.random() - 0.5) * 3;
        vz = Math.sin(theta) * speed;
      } else {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = 8 + Math.random() * 14;
        vx = Math.sin(phi) * Math.cos(theta) * speed;
        vy = Math.sin(phi) * Math.sin(theta) * speed;
        vz = Math.cos(phi) * speed;
      }
      velocities.push(new THREE.Vector3(vx, vy, vz));
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: color,
      size: 1.2,
      map: this.sparkTexture,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    // Flash light that illuminates the town and snow
    const burstLight = new THREE.PointLight(color, 8.0, 50, 1.2);
    burstLight.position.copy(pos);
    this.scene.add(burstLight);

    this.activeBursts.push({
      points,
      velocities,
      light: burstLight,
      mat,
      life: 0,
      maxLife: 2.2
    });
  }

  // --- 3. GROUND FOUNTAIN CRACKER (PINE VOLCANO) ---
  plantFountain(pos) {
    const group = new THREE.Group();
    group.position.set(pos.x, 0, pos.z);

    // Cone cracker mesh
    const coneGeo = new THREE.ConeGeometry(0.35, 0.7, 8);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0x198754 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 0.35;
    group.add(cone);
    this.scene.add(group);

    // Fountain spark particles
    const sparkCount = 180;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkCount * 3);
    const velocities = [];

    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = 0.7;
      positions[i * 3 + 2] = pos.z;

      velocities.push({
        vx: (Math.random() - 0.5) * 2.8,
        vy: 6.5 + Math.random() * 8.5,
        vz: (Math.random() - 0.5) * 2.8,
        life: Math.random()
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.9,
      map: this.sparkTexture,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    const fLight = new THREE.PointLight(0xffb74d, 3.5, 18);
    fLight.position.set(pos.x, 1.5, pos.z);
    this.scene.add(fLight);

    this.activeFountains.push({
      group,
      points,
      velocities,
      light: fLight,
      pos,
      duration: 7.5, // 7.5 seconds of sparkling fountain!
      timer: 0
    });
  }

  // --- 4. CHRISTMAS PARTY CRACKERS ---
  pullChristmasCracker(playerPos, forward) {
    this.sound.playCrackerSnap();

    // Burst confetti particles!
    const confettiCount = 160;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(confettiCount * 3);
    const colors = new Float32Array(confettiCount * 3);
    const velocities = [];

    const origin = new THREE.Vector3()
      .copy(playerPos)
      .add(new THREE.Vector3(0, 1.5, 0))
      .add(forward.clone().multiplyScalar(1.2));

    const palette = [
      [1.0, 0.1, 0.2], // Red
      [0.1, 0.8, 0.3], // Green
      [1.0, 0.85, 0.1], // Gold
      [0.2, 0.6, 1.0], // Blue
      [0.9, 0.2, 0.9]  // Magenta
    ];

    for (let i = 0; i < confettiCount; i++) {
      positions[i * 3] = origin.x;
      positions[i * 3 + 1] = origin.y;
      positions[i * 3 + 2] = origin.z;

      const col = palette[i % palette.length];
      colors[i * 3] = col[0];
      colors[i * 3 + 1] = col[1];
      colors[i * 3 + 2] = col[2];

      velocities.push(new THREE.Vector3(
        (forward.x * 4 + (Math.random() - 0.5) * 6),
        (3.5 + Math.random() * 5.0),
        (forward.z * 4 + (Math.random() - 0.5) * 6)
      ));
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.55,
      vertexColors: true,
      transparent: true,
      opacity: 1.0
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    this.activeConfetti.push({
      points,
      velocities,
      mat,
      life: 0,
      maxLife: 3.5
    });

    // Small wrapped toy / sweet reward
    const rewardGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 8);
    const rewardMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.5 });
    const reward = new THREE.Mesh(rewardGeo, rewardMat);
    reward.position.copy(origin);
    this.scene.add(reward);

    setTimeout(() => {
      this.scene.remove(reward);
    }, 4500);
  }

  // --- 5. SNOWBALL THROWING ---
  throwSnowball(playerPos, forward) {
    this.sound.playSnowballThrow();

    const ballGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xf5f8fc, roughness: 0.9 });
    const mesh = new THREE.Mesh(ballGeo, ballMat);

    const startPos = new THREE.Vector3()
      .copy(playerPos)
      .add(new THREE.Vector3(0, 1.6, 0))
      .add(forward.clone().multiplyScalar(0.7));

    mesh.position.copy(startPos);
    this.scene.add(mesh);

    const speed = 22.0;
    const velocity = forward.clone().multiplyScalar(speed);
    velocity.y += 3.5; // Arc trajectory

    this.activeSnowballs.push({
      mesh,
      velocity,
      life: 0
    });
  }

  // --- 6. WRAPPED GIFT BOX PLACEMENT ---
  placeGiftBox(pos) {
    const giftColors = [0xd90429, 0x198754, 0x0d6efd, 0x6f42c1, 0xffc107];
    const col = giftColors[Math.floor(Math.random() * giftColors.length)];

    const group = new THREE.Group();
    group.position.set(pos.x, 0.4, pos.z);

    const boxGeo = new THREE.BoxGeometry(0.85, 0.8, 0.85);
    const boxMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.castShadow = true;
    group.add(box);

    const ribGeo = new THREE.BoxGeometry(0.88, 0.82, 0.18);
    const ribMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.6 });
    const rib1 = new THREE.Mesh(ribGeo, ribMat);
    group.add(rib1);

    const rib2 = rib1.clone();
    rib2.rotation.y = Math.PI / 2;
    group.add(rib2);

    this.scene.add(group);

    this.placedGifts.push({
      group,
      pos: new THREE.Vector3(pos.x, 0.4, pos.z),
      opened: false
    });

    this.sound.playJingleBells(1);
    return 'Wrapped Gift placed on the snow! Anyone can unwrap it for a surprise!';
  }

  unwrapNearestGift(pos) {
    for (const gift of this.placedGifts) {
      if (!gift.opened && gift.pos.distanceTo(pos) < 3.2) {
        gift.opened = true;
        this.sound.playGiftUnwrap();

        // Celebration burst over the gift
        this.createBurst(gift.pos.clone().add(new THREE.Vector3(0, 2.5, 0)), 0xffd700);

        // Remove box after flying open
        this.scene.remove(gift.group);
        return '🎁 Surprise! You unwrapped a magical holiday music box! (+25 Christmas Cheer)';
      }
    }
    return null;
  }

  // --- 7. TOGGLE HANDHELD SPARKLER ---
  toggleSparkler() {
    this.sparklerActive = !this.sparklerActive;
    return this.sparklerActive ? 'Sparkler ignited! Crackling bright golden sparks!' : 'Sparkler put out.';
  }

  update(delta, player, village) {
    // 1. Update Rockets
    for (let i = this.activeRockets.length - 1; i >= 0; i--) {
      const r = this.activeRockets[i];
      r.mesh.position.addScaledVector(r.vel, delta);
      r.light.position.copy(r.mesh.position);
      r.life += delta;

      // Rocket reached target height or apex
      if (r.mesh.position.y >= r.targetY || r.life > 1.8) {
        this.createBurst(r.mesh.position, r.burstColor);
        this.scene.remove(r.mesh);
        this.scene.remove(r.light);
        this.activeRockets.splice(i, 1);
      }
    }

    // 2. Update Bursts
    for (let i = this.activeBursts.length - 1; i >= 0; i--) {
      const b = this.activeBursts[i];
      b.life += delta;
      const progress = b.life / b.maxLife;

      const posAttr = b.points.geometry.attributes.position;
      const posArray = posAttr.array;

      for (let j = 0; j < b.velocities.length; j++) {
        const v = b.velocities[j];
        // Apply gravity and drag
        v.y -= 7.5 * delta;
        v.x *= (1 - 0.9 * delta);
        v.z *= (1 - 0.9 * delta);

        posArray[j * 3] += v.x * delta;
        posArray[j * 3 + 1] += v.y * delta;
        posArray[j * 3 + 2] += v.z * delta;
      }
      posAttr.needsUpdate = true;

      // Fade out
      b.mat.opacity = 1.0 - progress;
      b.light.intensity = Math.max(0, 8.0 * (1.0 - progress * 1.8));

      if (b.life >= b.maxLife) {
        this.scene.remove(b.points);
        this.scene.remove(b.light);
        this.activeBursts.splice(i, 1);
      }
    }

    // 3. Update Fountains
    for (let i = this.activeFountains.length - 1; i >= 0; i--) {
      const f = this.activeFountains[i];
      f.timer += delta;

      // Crackle sound tick
      if (Math.random() < 0.25) {
        this.sound.playSparklerCrackle();
      }

      const posAttr = f.points.geometry.attributes.position;
      const posArray = posAttr.array;

      for (let j = 0; j < f.velocities.length; j++) {
        const v = f.velocities[j];
        posArray[j * 3] += v.vx * delta;
        posArray[j * 3 + 1] += v.vy * delta;
        posArray[j * 3 + 2] += v.vz * delta;

        v.vy -= 18.0 * delta; // Gravity

        // If particle drops to ground, respawn from nozzle
        if (posArray[j * 3 + 1] < 0.1) {
          posArray[j * 3] = f.pos.x;
          posArray[j * 3 + 1] = 0.7;
          posArray[j * 3 + 2] = f.pos.z;
          v.vx = (Math.random() - 0.5) * 2.8;
          v.vy = 7.0 + Math.random() * 8.5;
          v.vz = (Math.random() - 0.5) * 2.8;
        }
      }
      posAttr.needsUpdate = true;

      if (f.timer >= f.duration) {
        this.scene.remove(f.points);
        this.scene.remove(f.light);
        this.activeFountains.splice(i, 1);
      }
    }

    // 4. Update Confetti
    for (let i = this.activeConfetti.length - 1; i >= 0; i--) {
      const c = this.activeConfetti[i];
      c.life += delta;
      const progress = c.life / c.maxLife;

      const posAttr = c.points.geometry.attributes.position;
      const posArray = posAttr.array;

      for (let j = 0; j < c.velocities.length; j++) {
        const v = c.velocities[j];
        v.y -= 5.5 * delta; // Slow flutter fall
        v.x *= 0.94;
        v.z *= 0.94;

        posArray[j * 3] += v.x * delta + Math.sin(c.life * 4.0 + j) * 0.04;
        posArray[j * 3 + 1] += v.y * delta;
        posArray[j * 3 + 2] += v.z * delta + Math.cos(c.life * 4.0 + j) * 0.04;

        if (posArray[j * 3 + 1] < 0.05) posArray[j * 3 + 1] = 0.05;
      }
      posAttr.needsUpdate = true;

      c.mat.opacity = 1.0 - progress;

      if (c.life >= c.maxLife) {
        this.scene.remove(c.points);
        this.activeConfetti.splice(i, 1);
      }
    }

    // 5. Update Snowballs
    for (let i = this.activeSnowballs.length - 1; i >= 0; i--) {
      const sb = this.activeSnowballs[i];
      sb.velocity.y -= 14.0 * delta;
      sb.mesh.position.addScaledVector(sb.velocity, delta);
      sb.life += delta;

      // Check collision with snowmen
      let hit = false;
      if (village && village.snowmen) {
        for (const sm of village.snowmen) {
          if (sb.mesh.position.distanceTo(sm.group.position.clone().add(new THREE.Vector3(0, 2, 0))) < 1.8) {
            hit = true;
            sm.group.rotation.z = (Math.random() - 0.5) * 0.5;
            setTimeout(() => { sm.group.rotation.z = 0; }, 400);
            break;
          }
        }
      }

      // Check ground hit or timeout
      if (sb.mesh.position.y <= 0.1 || hit || sb.life > 3.0) {
        this.sound.playSnowballImpact();
        this.createSnowSplatter(sb.mesh.position);
        this.scene.remove(sb.mesh);
        this.activeSnowballs.splice(i, 1);
      }
    }

    // 6. Update Sparkler on Player
    if (this.sparklerActive && player) {
      if (Math.random() < 0.35) {
        this.sound.playSparklerCrackle();
      }
    }
  }

  createSnowSplatter(pos) {
    const puffGeo = new THREE.SphereGeometry(0.35, 6, 6);
    const puffMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const puff = new THREE.Mesh(puffGeo, puffMat);
    puff.position.copy(pos);
    this.scene.add(puff);

    let scale = 1.0;
    const interval = setInterval(() => {
      scale += 0.25;
      puff.scale.set(scale, scale, scale);
      puff.material.opacity -= 0.15;
      if (puff.material.opacity <= 0.05) {
        clearInterval(interval);
        this.scene.remove(puff);
      }
    }, 40);
  }
}
