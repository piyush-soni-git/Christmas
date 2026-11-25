import * as THREE from 'three';

export class VillageBuilder {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.interactables = [];
    this.bellMesh = null;
    this.bellRinging = false;
    this.bellAngle = 0;
    this.bellSwingVelocity = 0;
    this.greatStarLight = null;
    this.treeLightsOn = true;

    this.materials = this.createMaterials();
  }

  createMaterials() {
    return {
      pineDark: new THREE.MeshStandardMaterial({ color: 0x1a472a, roughness: 0.8 }),
      pineLight: new THREE.MeshStandardMaterial({ color: 0x245a35, roughness: 0.8 }),
      snow: new THREE.MeshStandardMaterial({ color: 0xf5f8fc, roughness: 0.9 }),
      woodDark: new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.85 }),
      woodLight: new THREE.MeshStandardMaterial({ color: 0x8a5d3b, roughness: 0.8 }),
      woodRed: new THREE.MeshStandardMaterial({ color: 0x9e2a2b, roughness: 0.75 }),
      stone: new THREE.MeshStandardMaterial({ color: 0x60656f, roughness: 0.9 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.75, roughness: 0.25 }),
      bronze: new THREE.MeshStandardMaterial({ color: 0xcd7f32, metalness: 0.65, roughness: 0.35 }),
      candyRed: new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.4 }),
      candyWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
      windowGlow: new THREE.MeshBasicMaterial({ color: 0xffcc66 }),
      roofTile: new THREE.MeshStandardMaterial({ color: 0x733835, roughness: 0.8 }),
      carrot: new THREE.MeshStandardMaterial({ color: 0xff7b00, roughness: 0.6 })
    };
  }

  buildVillage() {
    this.buildGreatChristmasTree(0, 0, 0);
    this.buildCathedral(-22, 0, 16);
    this.buildSantasWorkshop(-15, 0, -12);
    this.buildHotCocoaChalet(16, 0, -14);
    this.buildSantasSleigh(10, 0, 22);
    this.buildCottages();
    this.buildSnowmen();
    this.buildInstancedStreetLamps();
    this.buildInstancedPerimeterForest();
    this.buildInstancedFestiveBunting();
  }

  // --- 1. THE GREAT CENTRAL CHRISTMAS TREE ---
  buildGreatChristmasTree(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(1.2, 1.6, 5, 8);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.woodDark);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    group.add(trunk);

    // 4 Tiered Cones
    const tiers = [
      { radius: 7.2, height: 7.0, y: 5.5 },
      { radius: 5.8, height: 6.0, y: 9.5 },
      { radius: 4.4, height: 5.0, y: 13.5 },
      { radius: 2.8, height: 4.2, y: 17.0 }
    ];

    tiers.forEach((t, i) => {
      const coneGeo = new THREE.ConeGeometry(t.radius, t.height, 8);
      const cone = new THREE.Mesh(coneGeo, i % 2 === 0 ? this.materials.pineDark : this.materials.pineLight);
      cone.position.y = t.y;
      cone.castShadow = true;
      group.add(cone);

      const snowRimGeo = new THREE.TorusGeometry(t.radius * 0.9, 0.4, 5, 8);
      snowRimGeo.rotateX(Math.PI / 2);
      const snowRim = new THREE.Mesh(snowRimGeo, this.materials.snow);
      snowRim.position.y = t.y - t.height * 0.45;
      group.add(snowRim);
    });

    // Glowing Star Topper
    const starGeo = new THREE.OctahedronGeometry(1.3, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfffa77 });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.y = 20.2;
    group.add(star);

    // Central illumination (Non-shadow casting to preserve 60-120 FPS)
    this.greatStarLight = new THREE.PointLight(0xffdf66, 2.2, 40, 1.2);
    this.greatStarLight.position.y = 20.2;
    group.add(this.greatStarLight);

    // 75 INSTANCED BAUBLES (Single Draw Call instead of 75!)
    const baubleCount = 75;
    const baubleGeo = new THREE.SphereGeometry(0.32, 6, 6);
    const baubleMat = new THREE.MeshStandardMaterial({
      roughness: 0.25,
      metalness: 0.75,
      emissive: 0xffffff,
      emissiveIntensity: 0.5
    });
    this.instancedBaubles = new THREE.InstancedMesh(baubleGeo, baubleMat, baubleCount);

    const dummy = new THREE.Object3D();
    const colors = [
      new THREE.Color(0xff2244),
      new THREE.Color(0x22ee77),
      new THREE.Color(0x3399ff),
      new THREE.Color(0xffd700),
      new THREE.Color(0xff77aa),
      new THREE.Color(0xffffff)
    ];

    for (let i = 0; i < baubleCount; i++) {
      const tier = tiers[Math.floor(Math.random() * tiers.length)];
      const angle = Math.random() * Math.PI * 2;
      const r = tier.radius * (0.65 + Math.random() * 0.32);
      const bx = Math.cos(angle) * r;
      const bz = Math.sin(angle) * r;
      const by = tier.y - tier.height * 0.35 + (Math.random() - 0.5) * 1.5;

      dummy.position.set(bx, by, bz);
      dummy.scale.setScalar(0.85 + Math.random() * 0.3);
      dummy.updateMatrix();

      this.instancedBaubles.setMatrixAt(i, dummy.matrix);
      this.instancedBaubles.setColorAt(i, colors[i % colors.length]);
    }
    this.instancedBaubles.instanceMatrix.needsUpdate = true;
    if (this.instancedBaubles.instanceColor) this.instancedBaubles.instanceColor.needsUpdate = true;
    group.add(this.instancedBaubles);

    // 12 INSTANCED PRESENTS (Single Draw Call!)
    const giftCount = 12;
    const boxGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const boxMat = new THREE.MeshStandardMaterial({ roughness: 0.5 });
    const instancedGifts = new THREE.InstancedMesh(boxGeo, boxMat, giftCount);

    const giftColors = [
      new THREE.Color(0xd90429),
      new THREE.Color(0x198754),
      new THREE.Color(0x0d6efd),
      new THREE.Color(0xffc107),
      new THREE.Color(0x6f42c1)
    ];

    for (let i = 0; i < giftCount; i++) {
      const gAngle = (i / giftCount) * Math.PI * 2 + Math.random() * 0.2;
      const gDist = 2.8 + Math.random() * 3.2;
      const gx = Math.cos(gAngle) * gDist;
      const gz = Math.sin(gAngle) * gDist;
      const gSize = 0.8 + Math.random() * 0.6;

      dummy.position.set(gx, gSize / 2, gz);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.scale.set(gSize, gSize, gSize);
      dummy.updateMatrix();

      instancedGifts.setMatrixAt(i, dummy.matrix);
      instancedGifts.setColorAt(i, giftColors[i % giftColors.length]);
    }
    instancedGifts.instanceMatrix.needsUpdate = true;
    if (instancedGifts.instanceColor) instancedGifts.instanceColor.needsUpdate = true;
    group.add(instancedGifts);

    this.scene.add(group);

    this.world.colliders.push({
      type: 'cylinder',
      pos: new THREE.Vector3(x, y, z),
      radius: 2.2
    });

    this.interactables.push({
      id: 'great_tree',
      name: 'Grand Town Christmas Tree',
      actionText: 'Toggle Festive Light Show',
      pos: new THREE.Vector3(x, y + 2, z + 3.5),
      radius: 5.0,
      onInteract: () => this.toggleTreeLightShow()
    });
  }

  toggleTreeLightShow() {
    this.treeLightsOn = !this.treeLightsOn;
    if (this.greatStarLight) {
      this.greatStarLight.intensity = this.treeLightsOn ? 2.5 : 0.4;
    }
    if (this.instancedBaubles && this.instancedBaubles.material) {
      this.instancedBaubles.material.emissiveIntensity = this.treeLightsOn ? 0.9 : 0.1;
    }
    return this.treeLightsOn ? 'Grand Tree Lights Twinkling Joyously!' : 'Tree Lights Dimmed to Warm Glow';
  }

  // --- 2. CATHEDRAL & BELL TOWER ---
  buildCathedral(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Nave
    const naveGeo = new THREE.BoxGeometry(10, 8, 16);
    const nave = new THREE.Mesh(naveGeo, this.materials.stone);
    nave.position.set(0, 4, 0);
    nave.castShadow = true;
    nave.receiveShadow = true;
    group.add(nave);

    // Steep Roof
    const roofGeo = new THREE.ConeGeometry(9.5, 5, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, this.materials.roofTile);
    roof.position.set(0, 10.5, 0);
    roof.scale.set(1.1, 1, 1.8);
    roof.castShadow = true;
    group.add(roof);

    const snowCapGeo = new THREE.ConeGeometry(9.7, 1.8, 4);
    snowCapGeo.rotateY(Math.PI / 4);
    const snowCap = new THREE.Mesh(snowCapGeo, this.materials.snow);
    snowCap.position.set(0, 11.2, 0);
    snowCap.scale.set(1.1, 1, 1.8);
    group.add(snowCap);

    // Belfry Tower
    const towerGeo = new THREE.BoxGeometry(5.5, 17, 5.5);
    const tower = new THREE.Mesh(towerGeo, this.materials.stone);
    tower.position.set(0, 8.5, 9);
    tower.castShadow = true;
    group.add(tower);

    // Spire
    const spireGeo = new THREE.ConeGeometry(3.6, 8, 6);
    const spire = new THREE.Mesh(spireGeo, this.materials.roofTile);
    spire.position.set(0, 21, 9);
    spire.castShadow = true;
    group.add(spire);

    // Gold Cross
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 0.3), this.materials.gold);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.3), this.materials.gold);
    crossV.position.set(0, 25.6, 9);
    crossH.position.set(0, 25.8, 9);
    group.add(crossV);
    group.add(crossH);

    // Belfry Bell
    const bellGroup = new THREE.Group();
    bellGroup.position.set(0, 14.5, 9);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.4, 0.4), this.materials.woodDark);
    bellGroup.add(beam);

    const bellBodyGeo = new THREE.CylinderGeometry(0.5, 1.4, 1.8, 12);
    this.bellMesh = new THREE.Mesh(bellBodyGeo, this.materials.bronze);
    this.bellMesh.position.y = -0.9;
    bellGroup.add(this.bellMesh);
    group.add(bellGroup);

    // Stained Glass Windows
    const winGeo = new THREE.PlaneGeometry(1.8, 3.2);
    const win1 = new THREE.Mesh(winGeo, this.materials.windowGlow);
    win1.position.set(5.05, 4.5, 0);
    win1.rotateY(Math.PI / 2);
    group.add(win1);

    const win2 = new THREE.Mesh(winGeo, this.materials.windowGlow);
    win2.position.set(-5.05, 4.5, 0);
    win2.rotateY(-Math.PI / 2);
    group.add(win2);

    const churchLight = new THREE.PointLight(0xffcc77, 1.6, 20);
    churchLight.position.set(0, 3.5, 12.5);
    group.add(churchLight);

    this.scene.add(group);

    this.world.colliders.push({
      type: 'box',
      min: new THREE.Vector3(x - 6, 0, z - 9),
      max: new THREE.Vector3(x + 6, 20, z + 12)
    });

    this.interactables.push({
      id: 'cathedral_bell',
      name: 'Cathedral Belfry',
      actionText: 'Ring the Christmas Cathedral Bell',
      pos: new THREE.Vector3(x, y + 1, z + 12.5),
      radius: 4.5,
      onInteract: () => this.ringBell()
    });
  }

  ringBell() {
    this.bellRinging = true;
    this.bellSwingVelocity = 12.0;
    return 'DONGGGG! The majestic Christmas bells echo across the snowy valley!';
  }

  // --- 3. SANTA'S WORKSHOP STALL ---
  buildSantasWorkshop(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.8, 4.5), this.materials.woodRed);
    cabin.position.set(0, 1.9, 0);
    cabin.castShadow = true;
    group.add(cabin);

    // Awning
    const awning = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.25, 3.0), this.materials.candyRed);
    awning.position.set(0, 3.6, 1.5);
    awning.rotation.x = 0.25;
    group.add(awning);

    const counter = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.4, 1.2), this.materials.woodLight);
    counter.position.set(0, 1.5, 2.3);
    group.add(counter);

    // Elf NPC (Barnaby)
    const elfGroup = new THREE.Group();
    elfGroup.position.set(0, 1.4, 0.8);

    const elfBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.55, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
    );
    elfGroup.add(elfBody);

    const elfHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffdfba })
    );
    elfHead.position.y = 0.95;
    elfGroup.add(elfHead);

    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.9, 8), this.materials.candyRed);
    hat.position.set(0.08, 1.4, -0.05);
    hat.rotation.z = -0.25;
    elfGroup.add(hat);

    group.add(elfGroup);

    const stallLight = new THREE.PointLight(0xffb74d, 1.8, 16);
    stallLight.position.set(0, 3.2, 2.4);
    group.add(stallLight);

    this.scene.add(group);

    this.world.colliders.push({
      type: 'box',
      min: new THREE.Vector3(x - 4, 0, z - 3),
      max: new THREE.Vector3(x + 4, 6, z + 3.5)
    });

    this.interactables.push({
      id: 'elf_stall',
      name: 'Santa\'s Workshop Stall',
      actionText: 'Talk to Elf Barnaby & Stock Fireworks',
      pos: new THREE.Vector3(x, y + 1, z + 3.2),
      radius: 3.8,
      onInteract: () => this.talkToElf()
    });
  }

  talkToElf() {
    return 'Elf Barnaby: "Ho Ho Ho! Welcome to the North Pole Workshop! Here are fresh Star Rockets, Sparklers, and Mystery Gifts to spread Christmas Cheer!"';
  }

  // --- 4. GINGERBREAD & HOT COCOA CHALET ---
  buildHotCocoaChalet(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(6.0, 3.8, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x6e4125, roughness: 0.85 })
    );
    cabin.position.set(0, 1.9, 0);
    cabin.castShadow = true;
    group.add(cabin);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 3.0, 4), this.materials.snow);
    roof.position.set(0, 4.8, 0);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.2, 1, 1.1);
    group.add(roof);

    const counter = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.35, 1.1), this.materials.woodLight);
    counter.position.set(0, 1.4, 2.6);
    group.add(counter);

    // Giant Mug
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.55, 10), this.materials.candyRed);
    mug.position.set(0, 1.8, 2.6);
    group.add(mug);

    const light = new THREE.PointLight(0xffa726, 1.6, 14);
    light.position.set(0, 2.8, 3.0);
    group.add(light);

    this.scene.add(group);

    this.world.colliders.push({
      type: 'box',
      min: new THREE.Vector3(x - 3.5, 0, z - 3.2),
      max: new THREE.Vector3(x + 3.5, 6, z + 3.2)
    });

    this.interactables.push({
      id: 'hot_cocoa',
      name: 'Hot Cocoa Stand',
      actionText: 'Drink Hot Marshmallow Cocoa (Warmth + Cheer!)',
      pos: new THREE.Vector3(x, y + 1, z + 3.2),
      radius: 3.5,
      onInteract: () => this.drinkCocoa()
    });
  }

  drinkCocoa() {
    return 'Mmm! Warm rich hot chocolate with melted marshmallows! You feel toasty and energized (+15 Cheer)!';
  }

  // --- 5. SANTA'S SLEIGH & RUDOLPH ---
  buildSantasSleigh(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 4.0), this.materials.candyRed);
    body.position.set(0, 1.1, 0);
    body.castShadow = true;
    group.add(body);

    const sack = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.9 })
    );
    sack.position.set(0, 1.8, -0.9);
    group.add(sack);

    // Rudolph
    const reinGroup = new THREE.Group();
    reinGroup.position.set(0, 0, 4.5);
    const deerMat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.8 });

    const rBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 1.8), deerMat);
    rBody.position.y = 1.3;
    rBody.castShadow = true;
    reinGroup.add(rBody);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.8), deerMat);
    head.position.set(0, 2.4, 1.2);
    reinGroup.add(head);

    // Glowing Red Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff0022 }));
    nose.position.set(0, 2.35, 1.65);
    reinGroup.add(nose);

    const noseLight = new THREE.PointLight(0xff2244, 1.4, 6);
    noseLight.position.set(0, 2.35, 1.75);
    reinGroup.add(noseLight);

    group.add(reinGroup);
    this.scene.add(group);

    this.world.colliders.push({
      type: 'box',
      min: new THREE.Vector3(x - 2, 0, z - 2),
      max: new THREE.Vector3(x + 2, 3, z + 6)
    });

    this.interactables.push({
      id: 'santas_sleigh',
      name: 'Santa\'s Magic Sleigh',
      actionText: 'Hop in Santa\'s Sleigh with Rudolph',
      pos: new THREE.Vector3(x, y + 1, z + 1),
      radius: 3.5,
      onInteract: () => this.sitInSleigh()
    });
  }

  sitInSleigh() {
    return 'Ho Ho Ho! Jingle bells ring as Rudolph\'s nose shines bright! You are honorary Santa!';
  }

  // --- 6. ALPINE COTTAGES ---
  buildCottages() {
    const cottagePositions = [
      { x: -16, z: -25, rot: 0.2 },
      { x: 22, z: -24, rot: -0.3 },
      { x: -25, z: -2, rot: 1.4 },
      { x: 26, z: 2, rot: -1.2 },
      { x: -12, z: 28, rot: 2.8 },
      { x: 24, z: 26, rot: -2.6 }
    ];

    cottagePositions.forEach(cp => {
      const house = new THREE.Group();
      house.position.set(cp.x, 0, cp.z);
      house.rotation.y = cp.rot;

      const base = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.2, 5.5), this.materials.woodLight);
      base.position.y = 2.1;
      base.castShadow = true;
      base.receiveShadow = true;
      house.add(base);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(5.8, 3.4, 4), this.materials.roofTile);
      roof.position.y = 5.2;
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1.15, 1, 1.25);
      roof.castShadow = true;
      house.add(roof);

      const snow = new THREE.Mesh(new THREE.ConeGeometry(6.0, 1.2, 4), this.materials.snow);
      snow.position.y = 5.8;
      snow.rotation.y = Math.PI / 4;
      snow.scale.set(1.15, 1, 1.25);
      house.add(snow);

      const winF = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), this.materials.windowGlow);
      winF.position.set(0, 2.2, 2.76);
      house.add(winF);

      const wLight = new THREE.PointLight(0xffbb55, 1.1, 12);
      wLight.position.set(0, 2.2, 3.2);
      house.add(wLight);

      this.scene.add(house);

      this.world.colliders.push({
        type: 'box',
        min: new THREE.Vector3(cp.x - 4, 0, cp.z - 3.5),
        max: new THREE.Vector3(cp.x + 4, 7, cp.z + 3.5)
      });
    });
  }

  // --- 7. SNOWMEN ---
  buildSnowmen() {
    this.snowmen = [];
    const snowmanLocs = [
      { x: -5, z: 8, hat: 0x111111 },
      { x: 12, z: 6, hat: 0xd90429 },
      { x: -8, z: -8, hat: 0x198754 },
      { x: 7, z: -7, hat: 0x0d6efd }
    ];

    snowmanLocs.forEach(loc => {
      const group = new THREE.Group();
      group.position.set(loc.x, 0, loc.z);

      const bMesh = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 8), this.materials.snow);
      bMesh.position.y = 1.0;
      bMesh.castShadow = true;
      group.add(bMesh);

      const mMesh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), this.materials.snow);
      mMesh.position.y = 2.4;
      mMesh.castShadow = true;
      group.add(mMesh);

      const hMesh = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), this.materials.snow);
      hMesh.position.y = 3.4;
      hMesh.castShadow = true;
      group.add(hMesh);

      const cMesh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 6), this.materials.carrot);
      cMesh.rotation.x = Math.PI / 2;
      cMesh.position.set(0, 3.4, 0.6);
      group.add(cMesh);

      const hatMat = new THREE.MeshStandardMaterial({ color: loc.hat, roughness: 0.8 });
      const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.7, 8), hatMat);
      hatTop.position.y = 4.2;
      group.add(hatTop);

      this.scene.add(group);

      this.snowmen.push({ group, pos: new THREE.Vector3(loc.x, 0, loc.z) });

      this.world.colliders.push({
        type: 'cylinder',
        pos: new THREE.Vector3(loc.x, 0, loc.z),
        radius: 1.2
      });

      this.interactables.push({
        id: `snowman_${loc.x}`,
        name: 'Frosty Snowman',
        actionText: 'Give High-Five / Adjust Carrot Nose',
        pos: new THREE.Vector3(loc.x, 1, loc.z),
        radius: 2.5,
        onInteract: () => {
          group.rotation.y += 0.5;
          return 'Snowman smiles happily and gives you a snowy high-five (+5 Cheer)!';
        }
      });
    });
  }

  // --- 8. INSTANCED STREET LAMPS (MASSIVE DRAW CALL REDUCTION) ---
  buildInstancedStreetLamps() {
    const lampLocs = [
      [-10, 0, 5], [10, 0, 5],
      [-10, 0, -5], [10, 0, -5],
      [-18, 0, 10], [18, 0, 10],
      [0, 0, 12], [0, 0, -14],
      [16, 0, 8], [-15, 0, -5]
    ];
    const count = lampLocs.length;

    const postGeo = new THREE.CylinderGeometry(0.12, 0.16, 4.2, 6);
    const instancedPosts = new THREE.InstancedMesh(postGeo, this.materials.stone, count);

    const cageGeo = new THREE.BoxGeometry(0.65, 0.8, 0.65);
    const instancedCages = new THREE.InstancedMesh(cageGeo, this.materials.windowGlow, count);

    const dummy = new THREE.Object3D();

    lampLocs.forEach((pos, i) => {
      dummy.position.set(pos[0], 2.1, pos[2]);
      dummy.updateMatrix();
      instancedPosts.setMatrixAt(i, dummy.matrix);

      dummy.position.set(pos[0], 4.3, pos[2]);
      dummy.updateMatrix();
      instancedCages.setMatrixAt(i, dummy.matrix);

      const pLight = new THREE.PointLight(0xffaa44, 1.3, 15, 1.4);
      pLight.position.set(pos[0], 4.3, pos[2]);
      this.scene.add(pLight);

      this.world.colliders.push({
        type: 'cylinder',
        pos: new THREE.Vector3(pos[0], pos[1], pos[2]),
        radius: 0.6
      });
    });

    instancedPosts.instanceMatrix.needsUpdate = true;
    instancedCages.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedPosts);
    this.scene.add(instancedCages);
  }

  // --- 9. INSTANCED PERIMETER PINE FOREST (DRAWS 55 TREES IN 4 CALLS INSTEAD OF 385!) ---
  buildInstancedPerimeterForest() {
    const treeCount = 55;
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 2.5, 6);
    const cone1Geo = new THREE.ConeGeometry(2.8, 3.5, 6);
    const cone2Geo = new THREE.ConeGeometry(2.1, 3.0, 6);
    const cone3Geo = new THREE.ConeGeometry(1.4, 2.4, 6);

    const instancedTrunks = new THREE.InstancedMesh(trunkGeo, this.materials.woodDark, treeCount);
    const instancedCones1 = new THREE.InstancedMesh(cone1Geo, this.materials.pineDark, treeCount);
    const instancedCones2 = new THREE.InstancedMesh(cone2Geo, this.materials.pineLight, treeCount);
    const instancedCones3 = new THREE.InstancedMesh(cone3Geo, this.materials.pineDark, treeCount);

    const dummy = new THREE.Object3D();

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const radius = 42 + Math.random() * 32;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;
      const s = 0.8 + Math.random() * 0.9;

      dummy.scale.set(s, s, s);

      // Trunk
      dummy.position.set(tx, 1.25 * s, tz);
      dummy.updateMatrix();
      instancedTrunks.setMatrixAt(i, dummy.matrix);

      // Tier 1
      dummy.position.set(tx, 3.2 * s, tz);
      dummy.updateMatrix();
      instancedCones1.setMatrixAt(i, dummy.matrix);

      // Tier 2
      dummy.position.set(tx, 5.2 * s, tz);
      dummy.updateMatrix();
      instancedCones2.setMatrixAt(i, dummy.matrix);

      // Tier 3
      dummy.position.set(tx, 7.0 * s, tz);
      dummy.updateMatrix();
      instancedCones3.setMatrixAt(i, dummy.matrix);

      this.world.colliders.push({
        type: 'cylinder',
        pos: new THREE.Vector3(tx, 0, tz),
        radius: 1.0 * s
      });
    }

    instancedTrunks.instanceMatrix.needsUpdate = true;
    instancedCones1.instanceMatrix.needsUpdate = true;
    instancedCones2.instanceMatrix.needsUpdate = true;
    instancedCones3.instanceMatrix.needsUpdate = true;

    this.scene.add(instancedTrunks);
    this.scene.add(instancedCones1);
    this.scene.add(instancedCones2);
    this.scene.add(instancedCones3);
  }

  // --- 10. INSTANCED FESTIVE BUNTING & FAIRY LIGHTS ---
  buildInstancedFestiveBunting() {
    const lines = [
      [[-10, 4.3, 5], [0, 4.3, 12]],
      [[0, 4.3, 12], [10, 4.3, 5]],
      [[-10, 4.3, -5], [0, 4.3, -14]],
      [[0, 4.3, -14], [10, 4.3, -5]]
    ];

    const lightColors = [
      new THREE.Color(0xff3344),
      new THREE.Color(0x33ff55),
      new THREE.Color(0xffd700),
      new THREE.Color(0x33aaff)
    ];

    const totalBulbs = 4 * 11;
    const bulbGeo = new THREE.SphereGeometry(0.12, 4, 4);
    const bulbMat = new THREE.MeshBasicMaterial();
    const instancedBulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, totalBulbs);

    const dummy = new THREE.Object3D();
    let bulbIndex = 0;

    lines.forEach(pair => {
      const p1 = new THREE.Vector3(...pair[0]);
      const p2 = new THREE.Vector3(...pair[1]);
      const count = 12;

      for (let i = 1; i < count; i++) {
        const t = i / count;
        const pos = new THREE.Vector3().lerpVectors(p1, p2, t);
        pos.y -= Math.sin(t * Math.PI) * 1.2;

        dummy.position.copy(pos);
        dummy.updateMatrix();
        instancedBulbs.setMatrixAt(bulbIndex, dummy.matrix);
        instancedBulbs.setColorAt(bulbIndex, lightColors[bulbIndex % lightColors.length]);
        bulbIndex++;
      }
    });

    instancedBulbs.instanceMatrix.needsUpdate = true;
    if (instancedBulbs.instanceColor) instancedBulbs.instanceColor.needsUpdate = true;
    this.scene.add(instancedBulbs);
  }

  update(delta) {
    // Bell swing physics
    if (this.bellRinging && this.bellMesh) {
      this.bellAngle += this.bellSwingVelocity * delta;
      this.bellMesh.rotation.z = Math.sin(this.bellAngle) * 0.45;
      this.bellSwingVelocity *= 0.985;
      if (Math.abs(this.bellSwingVelocity) < 0.05) {
        this.bellRinging = false;
        this.bellMesh.rotation.z = 0;
      }
    }
  }
}
