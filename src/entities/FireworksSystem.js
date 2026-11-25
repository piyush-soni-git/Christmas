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

    // Pre-allocated scratch vectors to avoid GC allocations in hot loops
    this._v1 = new THREE.Vector3();
    this._v2 = new THREE.Vector3();

    this.initParticleTextures();
  }

  initParticleTextures() {
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

  // --- 1. STAR SKY ROCKETS ---
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

    const rocketGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6);
    const rocketMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const mesh = new THREE.Mesh(rocketGeo, rocketMat);
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    const trailLight = new THREE.PointLight(0xffaa44, 2.0, 12);
    trailLight.position.copy(startPos);
    this.scene.add(trailLight);

    const targetY = 28 + Math.random() * 20;

    this.activeRockets.push({
      mesh,
      light: trailLight,
      targetY,
      vel: new THREE.Vector3((Math.random() - 0.5) * 4, 34 + Math.random() * 10, (Math.random() - 0.5) * 4),
      burstColor,
      life: 0
    });
  }

  // --- 2. FIREWORK EXPLOSION BURST ---
  createBurst(pos, color) {
    this.sound.playFireworkBoom();

    const particleCount = 180;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

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
      size: 1.1,
      map: this.sparkTexture,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    const burstLight = new THREE.PointLight(color, 6.0, 45, 1.2);
    burstLight.position.copy(pos);
    this.scene.add(burstLight);

    this.activeBursts.push({
      points,
      velocities,
      light: burstLight,
      mat,
      life: 0,
      maxLife: 2.0
    });
  }

  // --- 3. GROUND FOUNTAIN CRACKER ---
  plantFountain(pos) {
    const group = new THREE.Group();
    group.position.set(pos.x, 0, pos.z);

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0x198754 }));
    cone.position.y = 0.35;
    group.add(cone);
    this.scene.add(group);

    const sparkCount = 140;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkCount * 3);
    const velocities = [];

    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = 0.7;
      positions[i * 3 + 2] = pos.z;

      velocities.push({
        vx: (Math.random() - 0.5) * 2.6,
        vy: 6.5 + Math.random() * 8.0,
        vz: (Math.random() - 0.5) * 2.6
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.85,
      map: this.sparkTexture,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    const fLight = new THREE.PointLight(0xffb74d, 3.2, 16);
    fLight.position.set(pos.x, 1.5, pos.z);
    this.scene.add(fLight);

    this.activeFountains.push({
      group,
      points,
      velocities,
      light: fLight,
      pos,
      duration: 7.0,
      timer: 0
    });
  }

  // --- 4. CHRISTMAS PARTY CRACKERS ---
  pullChristmasCracker(playerPos, forward) {
    this.sound.playCrackerSnap();

    const confettiCount = 130;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(confettiCount * 3);
    const colors = new Float32Array(confettiCount * 3);
    const velocities = [];

    const origin = this._v1.copy(playerPos).add({ x: 0, y: 1.5, z: 0 }).addScaledVector(forward, 1.2);

    const palette = [
      [1.0, 0.1, 0.2],
      [0.1, 0.8, 0.3],
      [1.0, 0.85, 0.1],
      [0.2, 0.6, 1.0],
      [0.9, 0.2, 0.9]
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
        forward.x * 4 + (Math.random() - 0.5) * 5,
        3.5 + Math.random() * 4.5,
        forward.z * 4 + (Math.random() - 0.5) * 5
      ));
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.5,
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
      maxLife: 3.2
    });
  }

  // --- 5. SNOWBALL THROWING ---
  throwSnowball(playerPos, forward) {
    this.sound.playSnowballThrow();

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0xf5f8fc, roughness: 0.9 })
    );

    const startPos = this._v1.copy(playerPos).add({ x: 0, y: 1.6, z: 0 }).addScaledVector(forward, 0.7);
    ball.position.copy(startPos);
    this.scene.add(ball);

    const velocity = forward.clone().multiplyScalar(24.0);
    velocity.y += 3.5;

    this.activeSnowballs.push({
      mesh: ball,
      velocity,
      life: 0
    });
  }

  // --- 6. WRAPPED GIFT BOX ---
  placeGiftBox(pos) {
    const giftColors = [0xd90429, 0x198754, 0x0d6efd, 0x6f42c1, 0xffc107];
    const col = giftColors[Math.floor(Math.random() * giftColors.length)];

    const group = new THREE.Group();
    group.position.set(pos.x, 0.4, pos.z);

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.8, 0.85), new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 }));
    box.castShadow = true;
    group.add(box);

    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.82, 0.18), new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.6 }));
    group.add(rib);

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
        this.createBurst(gift.pos.clone().add({ x: 0, y: 2.5, z: 0 }), 0xffd700);
        this.scene.remove(gift.group);
        return '🎁 Surprise! You unwrapped a magical holiday music box! (+25 Christmas Cheer)';
      }
    }
    return null;
  }

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
        v.y -= 7.5 * delta;
        v.x *= (1 - 0.85 * delta);
        v.z *= (1 - 0.85 * delta);

        posArray[j * 3] += v.x * delta;
        posArray[j * 3 + 1] += v.y * delta;
        posArray[j * 3 + 2] += v.z * delta;
      }
      posAttr.needsUpdate = true;

      b.mat.opacity = 1.0 - progress;
      b.light.intensity = Math.max(0, 6.0 * (1.0 - progress * 1.8));

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

        v.vy -= 18.0 * delta;

        if (posArray[j * 3 + 1] < 0.1) {
          posArray[j * 3] = f.pos.x;
          posArray[j * 3 + 1] = 0.7;
          posArray[j * 3 + 2] = f.pos.z;
          v.vx = (Math.random() - 0.5) * 2.6;
          v.vy = 7.0 + Math.random() * 8.0;
          v.vz = (Math.random() - 0.5) * 2.6;
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
        v.y -= 5.5 * delta;
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

      let hit = false;
      if (village && village.snowmen) {
        for (const sm of village.snowmen) {
          if (sb.mesh.position.distanceTo(sm.group.position) < 2.0) {
            hit = true;
            sm.group.rotation.z = (Math.random() - 0.5) * 0.4;
            setTimeout(() => { sm.group.rotation.z = 0; }, 350);
            break;
          }
        }
      }

      if (sb.mesh.position.y <= 0.1 || hit || sb.life > 3.0) {
        this.sound.playSnowballImpact();
        this.createSnowSplatter(sb.mesh.position);
        this.scene.remove(sb.mesh);
        this.activeSnowballs.splice(i, 1);
      }
    }

    // 6. Sparkler
    if (this.sparklerActive && player) {
      if (Math.random() < 0.35) {
        this.sound.playSparklerCrackle();
      }
    }
  }

  createSnowSplatter(pos) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
    );
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
