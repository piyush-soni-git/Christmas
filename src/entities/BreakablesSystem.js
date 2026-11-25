import * as THREE from 'three';

export class BreakablesSystem {
  constructor(world, soundManager, uiManager) {
    this.world = world;
    this.scene = world.scene;
    this.sound = soundManager;
    this.ui = uiManager;

    this.targets = []; // Glass Baubles & Target Props
    this.activeShards = []; // Flying glass fragments
    this.floatingTexts = []; // Floating "+20 Cheer" indicators

    this.initBreakables();
  }

  initBreakables() {
    // 1. Hanging Glass Bauble Targets around the village
    const targetConfigs = [
      { pos: [-9, 3.2, 5], color: 0xff1744, name: 'Ruby Glass Orb' },
      { pos: [9, 3.2, 5], color: 0x00e676, name: 'Emerald Glass Orb' },
      { pos: [-6, 2.8, -7], color: 0x00e5ff, name: 'Sapphire Glass Orb' },
      { pos: [6, 2.8, -7], color: 0xffd700, name: 'Golden Sun Orb' },
      { pos: [0, 4.0, 16], color: 0xd500f9, name: 'Royal Amethyst Orb' },
      { pos: [-14, 2.6, 2], color: 0xff6d00, name: 'Amber Crystal Orb' }
    ];

    targetConfigs.forEach((cfg, idx) => {
      this.createGlassTarget(cfg.pos, cfg.color, cfg.name, idx);
    });

    // 2. Pyramid Stack of Target Boxes on a Table
    this.createPyramidTarget(11, 0, -5);
  }

  createGlassTarget(pos, color, name, id) {
    const group = new THREE.Group();
    group.position.set(pos[0], pos[1], pos[2]);

    // Wooden post and hanging hook
    const postMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, pos[1], 6), postMat);
    post.position.set(0, -pos[1] / 2, 0);
    group.add(post);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.1), postMat);
    arm.position.set(0.5, 0.3, 0);
    group.add(arm);

    // Hanging string
    const stringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4), stringMat);
    string.position.set(1.0, 0, 0);
    group.add(string);

    // Breakable Glass Ornament Mesh
    const glassMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.1,
      metalness: 0.85,
      emissive: color,
      emissiveIntensity: 0.45
    });

    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), glassMat);
    orb.position.set(1.0, -0.4, 0);
    orb.castShadow = true;
    group.add(orb);

    // Shiny gold cap on top of ornament
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 })
    );
    cap.position.set(1.0, 0.15, 0);
    group.add(cap);

    // Subtle target glow light
    const targetLight = new THREE.PointLight(color, 1.2, 8);
    targetLight.position.set(1.0, -0.4, 0);
    group.add(targetLight);

    this.scene.add(group);

    const worldTargetPos = new THREE.Vector3(pos[0] + 1.0, pos[1] - 0.4, pos[2]);

    this.targets.push({
      id: `orb_${id}`,
      name: name,
      type: 'glass_orb',
      group,
      orbMesh: orb,
      capMesh: cap,
      light: targetLight,
      color: color,
      center: worldTargetPos,
      radius: 0.65,
      isBroken: false,
      respawnTimer: 0
    });
  }

  createPyramidTarget(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Wooden Table stand
    const tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 0.25, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.85 })
    );
    tableTop.position.y = 1.2;
    group.add(tableTop);

    // 4 legs
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6);
    const legMat = tableTop.material;
    for (let lx of [-1.3, 1.3]) {
      for (let lz of [-0.6, 0.6]) {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 0.6, lz);
        group.add(leg);
      }
    }

    // Pyramid of 6 colorful holiday cans/blocks
    const blocks = [];
    const blockMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.5 });
    const blockMatGold = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4 });
    const blockGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8);

    // Base row of 3
    const baseCoords = [
      { x: -0.5, y: 1.55, z: 0 },
      { x: 0, y: 1.55, z: 0 },
      { x: 0.5, y: 1.55, z: 0 },
      // Mid row of 2
      { x: -0.25, y: 2.1, z: 0 },
      { x: 0.25, y: 2.1, z: 0 },
      // Top can
      { x: 0, y: 2.65, z: 0 }
    ];

    baseCoords.forEach((c, idx) => {
      const b = new THREE.Mesh(blockGeo, idx % 2 === 0 ? blockMat : blockMatGold);
      b.position.set(c.x, c.y, c.z);
      b.castShadow = true;
      group.add(b);
      blocks.push({
        mesh: b,
        initialPos: new THREE.Vector3(c.x, c.y, c.z),
        initialRot: new THREE.Euler(0, 0, 0),
        vel: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        toppled: false
      });
    });

    this.scene.add(group);

    this.targets.push({
      id: 'pyramid_stack',
      name: 'Holiday Target Stack',
      type: 'pyramid',
      group,
      blocks,
      center: new THREE.Vector3(x, y + 2.0, z),
      radius: 1.2,
      isBroken: false,
      respawnTimer: 0
    });
  }

  // Check collision between a flying snowball and all breakable targets
  checkSnowballHit(ballPos, ballVelocity) {
    for (const target of this.targets) {
      if (target.isBroken) continue;

      const dist = ballPos.distanceTo(target.center);
      if (dist < target.radius) {
        this.breakTarget(target, ballVelocity);
        return true;
      }
    }
    return false;
  }

  breakTarget(target, impactVel) {
    target.isBroken = true;
    target.respawnTimer = 6.0; // 6 seconds to respawn

    if (target.type === 'glass_orb') {
      // 1. Play crisp glass shatter sound
      this.sound.playGlassShatter();

      // 2. Hide orb and cap
      target.orbMesh.visible = false;
      target.capMesh.visible = false;
      target.light.intensity = 0;

      // 3. Explode into 16 flying glass crystal shards
      this.spawnGlassShards(target.center, target.color, impactVel);

      // 4. Award Cheer and show Level Progression
      const cheerAwarded = 20;
      this.ui.addCheer(cheerAwarded);
      this.ui.showToast(`🎯 TARGET SHATTERED! ${target.name} broken into sparkling crystals! (+${cheerAwarded} Cheer)`);

    } else if (target.type === 'pyramid') {
      this.sound.playCrackerSnap();

      // Topple blocks
      target.blocks.forEach(b => {
        b.toppled = true;
        b.vel.set(
          (Math.random() - 0.5) * 5 + impactVel.x * 0.15,
          3.0 + Math.random() * 4.0,
          (Math.random() - 0.5) * 5 + impactVel.z * 0.15
        );
        b.rotVel.set(Math.random() * 8, Math.random() * 8, Math.random() * 8);
      });

      const cheerAwarded = 25;
      this.ui.addCheer(cheerAwarded);
      this.ui.showToast(`🎯 BULLSEYE! Holiday Target Pyramid knocked down! (+${cheerAwarded} Cheer)`);
    }
  }

  spawnGlassShards(origin, color, impactVel) {
    const shardCount = 18;
    const shardGeo = new THREE.TetrahedronGeometry(0.14, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.1,
      metalness: 0.85,
      emissive: color,
      emissiveIntensity: 0.8
    });

    for (let i = 0; i < shardCount; i++) {
      const mesh = new THREE.Mesh(shardGeo, shardMat);
      mesh.position.copy(origin);
      this.scene.add(mesh);

      const speed = 4.0 + Math.random() * 7.0;
      const angle = Math.random() * Math.PI * 2;
      const vy = 2.0 + Math.random() * 6.0;

      const vel = new THREE.Vector3(
        Math.cos(angle) * speed + impactVel.x * 0.1,
        vy,
        Math.sin(angle) * speed + impactVel.z * 0.1
      );

      this.activeShards.push({
        mesh,
        vel,
        rotVel: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
        life: 0,
        maxLife: 2.5
      });
    }
  }

  update(delta) {
    // 1. Update flying glass shards
    for (let i = this.activeShards.length - 1; i >= 0; i--) {
      const s = this.activeShards[i];
      s.life += delta;
      s.vel.y -= 18.0 * delta; // Gravity

      s.mesh.position.addScaledVector(s.vel, delta);
      s.mesh.rotation.x += s.rotVel.x * delta;
      s.mesh.rotation.y += s.rotVel.y * delta;

      // Ground bounce
      if (s.mesh.position.y <= 0.05) {
        s.mesh.position.y = 0.05;
        s.vel.y *= -0.3;
        s.vel.x *= 0.6;
        s.vel.z *= 0.6;
      }

      const progress = s.life / s.maxLife;
      s.mesh.scale.setScalar(Math.max(0.01, 1.0 - progress));

      if (s.life >= s.maxLife) {
        this.scene.remove(s.mesh);
        this.activeShards.splice(i, 1);
      }
    }

    // 2. Update toppled pyramid blocks
    for (const target of this.targets) {
      if (target.type === 'pyramid' && target.isBroken) {
        target.blocks.forEach(b => {
          if (b.toppled) {
            b.vel.y -= 16.0 * delta;
            b.mesh.position.addScaledVector(b.vel, delta);
            b.mesh.rotation.x += b.rotVel.x * delta;
            b.mesh.rotation.z += b.rotVel.z * delta;

            if (b.mesh.position.y <= 0.2) {
              b.mesh.position.y = 0.2;
              b.vel.set(0, 0, 0);
            }
          }
        });
      }

      // 3. Handle Respawning
      if (target.isBroken) {
        target.respawnTimer -= delta;
        if (target.respawnTimer <= 0) {
          target.isBroken = false;
          if (target.type === 'glass_orb') {
            target.orbMesh.visible = true;
            target.capMesh.visible = true;
            target.light.intensity = 1.2;
            this.sound.playJingleBells(1);
          } else if (target.type === 'pyramid') {
            target.blocks.forEach(b => {
              b.toppled = false;
              b.mesh.position.copy(b.initialPos);
              b.mesh.rotation.set(0, 0, 0);
            });
            this.sound.playJingleBells(1);
          }
        }
      }
    }
  }
}
