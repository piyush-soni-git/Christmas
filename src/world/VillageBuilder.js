import * as THREE from 'three';

export class VillageBuilder {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.interactables = []; // Objects player can interact with
    this.treeBaubles = [];
    this.bellMesh = null;
    this.bellRinging = false;
    this.bellAngle = 0;
    this.smokeParticles = [];
    this.greatStarLight = null;
    this.treeLightsOn = true;

    this.materials = this.createMaterials();
  }

  createMaterials() {
    return {
      pineDark: new THREE.MeshStandardMaterial({ color: 0x1a472a, roughness: 0.8, flatShading: true }),
      pineLight: new THREE.MeshStandardMaterial({ color: 0x245a35, roughness: 0.8, flatShading: true }),
      snow: new THREE.MeshStandardMaterial({ color: 0xf5f8fc, roughness: 0.9, flatShading: true }),
      woodDark: new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.85 }),
      woodLight: new THREE.MeshStandardMaterial({ color: 0x8a5d3b, roughness: 0.8 }),
      woodRed: new THREE.MeshStandardMaterial({ color: 0x9e2a2b, roughness: 0.75 }),
      stone: new THREE.MeshStandardMaterial({ color: 0x60656f, roughness: 0.9 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.75, roughness: 0.25 }),
      bronze: new THREE.MeshStandardMaterial({ color: 0xcd7f32, metalness: 0.65, roughness: 0.35 }),
      candyRed: new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.4 }),
      candyWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
      windowGlow: new THREE.MeshBasicMaterial({ color: 0xffcc66 }),
      stainedGlass: new THREE.MeshBasicMaterial({ color: 0x4488ff }),
      roofTile: new THREE.MeshStandardMaterial({ color: 0x733835, roughness: 0.8 }),
      carrot: new THREE.MeshStandardMaterial({ color: 0xff7b00, roughness: 0.6 }),
      coal: new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.9 })
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
    this.buildStreetLamps();
    this.buildPerimeterForest();
    this.buildFestiveBunting();
  }

  // --- 1. THE GREAT CENTRAL CHRISTMAS TREE ---
  buildGreatChristmasTree(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(1.2, 1.6, 5, 10);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.woodDark);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    group.add(trunk);

    // Stacked Pine Cones (4 tiers)
    const tiers = [
      { radius: 7.2, height: 7.0, y: 5.5 },
      { radius: 5.8, height: 6.0, y: 9.5 },
      { radius: 4.4, height: 5.0, y: 13.5 },
      { radius: 2.8, height: 4.2, y: 17.0 }
    ];

    tiers.forEach((t, i) => {
      const coneGeo = new THREE.ConeGeometry(t.radius, t.height, 10);
      const cone = new THREE.Mesh(coneGeo, i % 2 === 0 ? this.materials.pineDark : this.materials.pineLight);
      cone.position.y = t.y;
      cone.castShadow = true;
      cone.receiveShadow = true;
      group.add(cone);

      // Snow trim on each tier
      const snowRimGeo = new THREE.TorusGeometry(t.radius * 0.9, 0.45, 6, 12);
      snowRimGeo.rotateX(Math.PI / 2);
      const snowRim = new THREE.Mesh(snowRimGeo, this.materials.snow);
      snowRim.position.y = t.y - t.height * 0.45;
      group.add(snowRim);
    });

    // Glowing Star Topper
    const starGroup = new THREE.Group();
    starGroup.position.y = 20.2;
    const starGeo = new THREE.OctahedronGeometry(1.3, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfffa77 });
    const star = new THREE.Mesh(starGeo, starMat);
    starGroup.add(star);

    // Star point light illuminating the town square
    this.greatStarLight = new THREE.PointLight(0xffdf66, 2.2, 38, 1.2);
    this.greatStarLight.position.y = 20.2;
    this.greatStarLight.castShadow = true;
    group.add(this.greatStarLight);
    group.add(starGroup);

    // Twinkling Multi-color Baubles
    const colors = [0xff2244, 0x22ee77, 0x3399ff, 0xffd700, 0xff77aa, 0xffffff];
    const baubleGeo = new THREE.SphereGeometry(0.32, 8, 8);

    for (let i = 0; i < 75; i++) {
      const tier = tiers[Math.floor(Math.random() * tiers.length)];
      const angle = Math.random() * Math.PI * 2;
      const r = tier.radius * (0.65 + Math.random() * 0.32);
      const bx = Math.cos(angle) * r;
      const bz = Math.sin(angle) * r;
      const by = tier.y - tier.height * 0.35 + (Math.random() - 0.5) * 1.5;

      const col = colors[i % colors.length];
      const bMat = new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.2,
        metalness: 0.8,
        emissive: col,
        emissiveIntensity: 0.4
      });
      const bMesh = new THREE.Mesh(baubleGeo, bMat);
      bMesh.position.set(bx, by, bz);
      group.add(bMesh);

      this.treeBaubles.push({
        mesh: bMesh,
        origColor: col,
        speed: 1.5 + Math.random() * 2.0,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Wrapped Presents Under the Tree
    const giftColors = [0xd90429, 0x198754, 0x0d6efd, 0xffc107, 0x6f42c1];
    for (let i = 0; i < 12; i++) {
      const gAngle = (i / 12) * Math.PI * 2 + Math.random() * 0.2;
      const gDist = 2.8 + Math.random() * 3.2;
      const gx = Math.cos(gAngle) * gDist;
      const gz = Math.sin(gAngle) * gDist;
      const gSize = 0.8 + Math.random() * 0.6;

      const boxGeo = new THREE.BoxGeometry(gSize, gSize, gSize);
      const boxMat = new THREE.MeshStandardMaterial({
        color: giftColors[i % giftColors.length],
        roughness: 0.5
      });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(gx, gSize / 2, gz);
      box.rotation.y = Math.random() * Math.PI;
      box.castShadow = true;
      group.add(box);

      // Gold ribbon cross
      const ribGeo = new THREE.BoxGeometry(gSize * 1.02, gSize * 1.02, gSize * 0.22);
      const rib = new THREE.Mesh(ribGeo, this.materials.gold);
      box.add(rib);
    }

    this.scene.add(group);

    // Collider for tree trunk
    this.world.colliders.push({
      type: 'cylinder',
      pos: new THREE.Vector3(x, y, z),
      radius: 2.2
    });

    // Interactable: Town Tree Light Show
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
    this.treeBaubles.forEach(b => {
      b.mesh.material.emissiveIntensity = this.treeLightsOn ? 0.9 : 0.1;
    });
    return this.treeLightsOn ? 'Grand Tree Lights Twinkling Joyously!' : 'Tree Lights Dimmed to Warm Glow';
  }

  // --- 2. CATHEDRAL & BELL TOWER ---
  buildCathedral(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Main Church Nave
    const naveGeo = new THREE.BoxGeometry(10, 8, 16);
    const nave = new THREE.Mesh(naveGeo, this.materials.stone);
    nave.position.set(0, 4, 0);
    nave.castShadow = true;
    nave.receiveShadow = true;
    group.add(nave);

    // Steep Snow-Covered Roof
    const roofGeo = new THREE.ConeGeometry(9.5, 5, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, this.materials.roofTile);
    roof.position.set(0, 10.5, 0);
    roof.scale.set(1.1, 1, 1.8);
    roof.castShadow = true;
    group.add(roof);

    // Snow topping on roof
    const snowCapGeo = new THREE.ConeGeometry(9.7, 1.8, 4);
    snowCapGeo.rotateY(Math.PI / 4);
    const snowCap = new THREE.Mesh(snowCapGeo, this.materials.snow);
    snowCap.position.set(0, 11.2, 0);
    snowCap.scale.set(1.1, 1, 1.8);
    group.add(snowCap);

    // High Arched Bell Tower (Belfry)
    const towerGeo = new THREE.BoxGeometry(5.5, 17, 5.5);
    const tower = new THREE.Mesh(towerGeo, this.materials.stone);
    tower.position.set(0, 8.5, 9);
    tower.castShadow = true;
    group.add(tower);

    // Tower Spire
    const spireGeo = new THREE.ConeGeometry(3.6, 8, 8);
    const spire = new THREE.Mesh(spireGeo, this.materials.roofTile);
    spire.position.set(0, 21, 9);
    spire.castShadow = true;
    group.add(spire);

    // Gold Cross on Spire
    const crossGeoV = new THREE.BoxGeometry(0.3, 1.8, 0.3);
    const crossGeoH = new THREE.BoxGeometry(1.2, 0.3, 0.3);
    const crossV = new THREE.Mesh(crossGeoV, this.materials.gold);
    const crossH = new THREE.Mesh(crossGeoH, this.materials.gold);
    crossV.position.set(0, 25.6, 9);
    crossH.position.set(0, 25.8, 9);
    group.add(crossV);
    group.add(crossH);

    // Belfry Arches / Open chamber with the Great Bronze Bell!
    const bellGroup = new THREE.Group();
    bellGroup.position.set(0, 14.5, 9);

    // Bell hanger beam
    const beamGeo = new THREE.BoxGeometry(3.8, 0.4, 0.4);
    const beam = new THREE.Mesh(beamGeo, this.materials.woodDark);
    bellGroup.add(beam);

    // Great Cathedral Bronze Bell
    const bellBodyGeo = new THREE.CylinderGeometry(0.5, 1.4, 1.8, 16);
    this.bellMesh = new THREE.Mesh(bellBodyGeo, this.materials.bronze);
    this.bellMesh.position.y = -0.9;
    this.bellMesh.castShadow = true;
    bellGroup.add(this.bellMesh);

    group.add(bellGroup);
    this.cathedralBellGroup = bellGroup;

    // Glowing Church Windows (Stained glass warmly lit from within)
    const winGeo = new THREE.PlaneGeometry(1.8, 3.2);
    const win1 = new THREE.Mesh(winGeo, this.materials.windowGlow);
    win1.position.set(5.05, 4.5, 0);
    win1.rotateY(Math.PI / 2);
    group.add(win1);

    const win2 = new THREE.Mesh(winGeo, this.materials.windowGlow);
    win2.position.set(-5.05, 4.5, 0);
    win2.rotateY(-Math.PI / 2);
    group.add(win2);

    // Cathedral warm lantern light at entrance
    const churchLight = new THREE.PointLight(0xffcc77, 1.6, 20);
    churchLight.position.set(0, 3.5, 12.5);
    group.add(churchLight);

    this.scene.add(group);

    // Collider
    this.world.colliders.push({
      type: 'box',
      min: new THREE.Vector3(x - 6, 0, z - 9),
      max: new THREE.Vector3(x + 6, 20, z + 12)
    });

    // Interactable: Cathedral Bells
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

  // --- 3. SANTA'S WORKSHOP & GIFT STALL ---
  buildSantasWorkshop(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Stall base cabin
    const cabinGeo = new THREE.BoxGeometry(6.5, 3.8, 4.5);
    const cabin = new THREE.Mesh(cabinGeo, this.materials.woodRed);
    cabin.position.set(0, 1.9, 0);
    cabin.castShadow = true;
    group.add(cabin);

    // Striped Candy-Cane Awning
    const awningWidth = 7.2;
    const awningDepth = 3.0;
    const stripes = 8;
    for (let i = 0; i < stripes; i++) {
      const w = awningWidth / stripes;
      const stripeGeo = new THREE.BoxGeometry(w, 0.25, awningDepth);
      const mat = i % 2 === 0 ? this.materials.candyRed : this.materials.candyWhite;
      const stripe = new THREE.Mesh(stripeGeo, mat);
      stripe.position.set(-awningWidth / 2 + (i + 0.5) * w, 3.6, 1.5);
      stripe.rotation.x = 0.25;
      group.add(stripe);
    }

    // Counter shelf
    const counterGeo = new THREE.BoxGeometry(6.2, 0.4, 1.2);
    const counter = new THREE.Mesh(counterGeo, this.materials.woodLight);
    counter.position.set(0, 1.5, 2.3);
    group.add(counter);

    // Firecrackers, Sparklers, and Gifts on the Counter
    const propGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8);
    for (let i = -2; i <= 2; i++) {
      const rocket = new THREE.Mesh(propGeo, i % 2 === 0 ? this.materials.candyRed : this.materials.gold);
      rocket.position.set(i * 0.9, 1.9, 2.3);
      group.add(rocket);
    }

    // Friendly Elf NPC (Barnaby)
    const elfGroup = new THREE.Group();
    elfGroup.position.set(0, 1.4, 0.8);

    // Body
    const elfBodyGeo = new THREE.CylinderGeometry(0.4, 0.55, 1.2, 8);
    const elfBodyMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });
    const elfBody = new THREE.Mesh(elfBodyGeo, elfBodyMat);
    elfGroup.add(elfBody);

    // Head
    const elfHeadGeo = new THREE.SphereGeometry(0.35, 10, 10);
    const elfHeadMat = new THREE.MeshStandardMaterial({ color: 0xffdfba });
    const elfHead = new THREE.Mesh(elfHeadGeo, elfHeadMat);
    elfHead.position.y = 0.95;
    elfGroup.add(elfHead);

    // Pointy Elf Hat
    const hatGeo = new THREE.ConeGeometry(0.38, 0.9, 8);
    const hat = new THREE.Mesh(hatGeo, this.materials.candyRed);
    hat.position.set(0.08, 1.4, -0.05);
    hat.rotation.z = -0.25;
    elfGroup.add(hat);

    // Golden hat bell
    const hatBellGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const hatBell = new THREE.Mesh(hatBellGeo, this.materials.gold);
    hatBell.position.set(0.25, 1.85, -0.05);
    elfGroup.add(hatBell);

    group.add(elfGroup);

    // Warm lantern light on stall
    const stallLight = new THREE.PointLight(0xffb74d, 1.8, 16);
    stallLight.position.set(0, 3.2, 2.4);
    group.add(stallLight);

    // Signboard: "SANTA'S WORKSHOP - HOLIDAY NOVELTIES"
    const signGeo = new THREE.BoxGeometry(4.5, 1.1, 0.15);
    const sign = new THREE.Mesh(signGeo, this.materials.woodDark);
    sign.position.set(0, 4.3, 1.8);
    group.add(sign);

    this.scene.add(group);

    // Collider
    this.world.colliders.push({
      type: 'box',
      min: new THREE.Vector3(x - 4, 0, z - 3),
      max: new THREE.Vector3(x + 4, 6, z + 3.5)
    });

    // Interactable: Talk to Elf Barnaby
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

    // Gingerbread brown cabin
    const cabinGeo = new THREE.BoxGeometry(6.0, 3.8, 5.0);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x6e4125, roughness: 0.85 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.9, 0);
    cabin.castShadow = true;
    group.add(cabin);

    // White "frosting" roof trim
    const roofGeo = new THREE.ConeGeometry(5.2, 3.0, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, this.materials.snow);
    roof.position.set(0, 4.8, 0);
    roof.scale.set(1.2, 1, 1.1);
    group.add(roof);

    // Counter with giant mugs of steaming Hot Cocoa
    const counterGeo = new THREE.BoxGeometry(5.0, 0.35, 1.1);
    const counter = new THREE.Mesh(counterGeo, this.materials.woodLight);
    counter.position.set(0, 1.4, 2.6);
    group.add(counter);

    // Steaming Mug
    const mugGeo = new THREE.CylinderGeometry(0.3, 0.25, 0.55, 12);
    const mugMat = new THREE.MeshStandardMaterial({ color: 0xd90429 });
    const mug = new THREE.Mesh(mugGeo, mugMat);
    mug.position.set(0, 1.8, 2.6);
    group.add(mug);

    // Hot Cocoa liquid
    const liquidGeo = new THREE.CircleGeometry(0.27, 12);
    liquidGeo.rotateX(-Math.PI / 2);
    const liquidMat = new THREE.MeshBasicMaterial({ color: 0x3d2314 });
    const liquid = new THREE.Mesh(liquidGeo, liquidMat);
    liquid.position.set(0, 2.05, 2.6);
    group.add(liquid);

    // Marshmallows
    for (let i = 0; i < 3; i++) {
      const mGeo = new THREE.BoxGeometry(0.1, 0.08, 0.1);
      const mm = new THREE.Mesh(mGeo, this.materials.candyWhite);
      mm.position.set(
        Math.cos(i * 2.1) * 0.12,
        2.09,
        2.6 + Math.sin(i * 2.1) * 0.12
      );
      group.add(mm);
    }

    // Chimney with continuous soft smoke puffs
    const chimGeo = new THREE.BoxGeometry(0.8, 2.2, 0.8);
    const chim = new THREE.Mesh(chimGeo, this.materials.stone);
    chim.position.set(1.8, 5.2, -1.0);
    group.add(chim);

    this.registerChimneySmoke(x + 1.8, y + 6.3, z - 1.0);

    const light = new THREE.PointLight(0xffa726, 1.6, 14);
    light.position.set(0, 2.8, 3.0);
    group.add(light);

    this.scene.add(group);

    // Collider
    this.world.colliders.push({
      type: 'box',
      min: new THREE.Vector3(x - 3.5, 0, z - 3.2),
      max: new THREE.Vector3(x + 3.5, 6, z + 3.2)
    });

    // Interactable: Sip Hot Cocoa
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

  // --- 5. SANTA'S SLEIGH & RUDOLPH REINDEER ---
  buildSantasSleigh(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Red sleigh body
    const bodyGeo = new THREE.BoxGeometry(2.4, 1.2, 4.0);
    const body = new THREE.Mesh(bodyGeo, this.materials.candyRed);
    body.position.set(0, 1.1, 0);
    body.castShadow = true;
    group.add(body);

    // Gold runners
    const runnerGeo = new THREE.TorusGeometry(2.2, 0.1, 6, 16, Math.PI);
    runnerGeo.rotateZ(Math.PI / 2);
    runnerGeo.rotateY(Math.PI / 2);
    const runnerL = new THREE.Mesh(runnerGeo, this.materials.gold);
    runnerL.position.set(-1.1, 0.35, 0);
    const runnerR = new THREE.Mesh(runnerGeo, this.materials.gold);
    runnerR.position.set(1.1, 0.35, 0);
    group.add(runnerL);
    group.add(runnerR);

    // Big green gift sack in back
    const sackGeo = new THREE.SphereGeometry(1.1, 10, 8);
    const sackMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.9 });
    const sack = new THREE.Mesh(sackGeo, sackMat);
    sack.position.set(0, 1.8, -0.9);
    sack.scale.set(1, 1.2, 1);
    group.add(sack);

    // Rudolph the Red-Nosed Reindeer (hitched in front)
    const reinGroup = new THREE.Group();
    reinGroup.position.set(0, 0, 4.5);

    // Reindeer Body
    const rBodyGeo = new THREE.BoxGeometry(0.9, 1.0, 1.8);
    const deerMat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.8 });
    const rBody = new THREE.Mesh(rBodyGeo, deerMat);
    rBody.position.y = 1.3;
    rBody.castShadow = true;
    reinGroup.add(rBody);

    // Reindeer 4 Legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 1.1, 6);
    for (let lx of [-0.32, 0.32]) {
      for (let lz of [-0.6, 0.6]) {
        const leg = new THREE.Mesh(legGeo, deerMat);
        leg.position.set(lx, 0.55, lz);
        leg.castShadow = true;
        reinGroup.add(leg);
      }
    }

    // Reindeer Head & Neck
    const neckGeo = new THREE.BoxGeometry(0.45, 0.8, 0.5);
    const neck = new THREE.Mesh(neckGeo, deerMat);
    neck.position.set(0, 2.0, 0.9);
    neck.rotation.x = -0.3;
    reinGroup.add(neck);

    const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.8);
    const head = new THREE.Mesh(headGeo, deerMat);
    head.position.set(0, 2.4, 1.2);
    reinGroup.add(head);

    // GLOWING RED NOSE!
    const noseGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const noseMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 2.35, 1.65);
    reinGroup.add(nose);

    // Red nose point light
    const noseLight = new THREE.PointLight(0xff2244, 1.5, 6);
    noseLight.position.set(0, 2.35, 1.75);
    reinGroup.add(noseLight);

    // Antlers
    const antlerMat = new THREE.MeshStandardMaterial({ color: 0xd7ccc8, roughness: 0.7 });
    for (let ax of [-0.22, 0.22]) {
      const antler = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.7, 6), antlerMat);
      antler.position.set(ax, 2.8, 1.05);
      antler.rotation.z = (ax < 0 ? 0.35 : -0.35);
      reinGroup.add(antler);
    }

    group.add(reinGroup);
    this.scene.add(group);

    // Collider
    this.world.colliders.push({
      type: 'box',
      min: new THREE.Vector3(x - 2, 0, z - 2),
      max: new THREE.Vector3(x + 2, 3, z + 6)
    });

    // Interactable: Sit in Santa's Sleigh
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

  // --- 6. COZY ALPINE CHALETS & COTTAGES ---
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

      // Base Log Cabin
      const baseGeo = new THREE.BoxGeometry(6.5, 4.2, 5.5);
      const base = new THREE.Mesh(baseGeo, this.materials.woodLight);
      base.position.y = 2.1;
      base.castShadow = true;
      base.receiveShadow = true;
      house.add(base);

      // Snow-Heavy Gabled Roof
      const roofGeo = new THREE.ConeGeometry(5.8, 3.4, 4);
      roofGeo.rotateY(Math.PI / 4);
      const roof = new THREE.Mesh(roofGeo, this.materials.roofTile);
      roof.position.y = 5.2;
      roof.scale.set(1.15, 1, 1.25);
      roof.castShadow = true;
      house.add(roof);

      // Fluffy Snow Layer on Roof
      const snowGeo = new THREE.ConeGeometry(6.0, 1.2, 4);
      snowGeo.rotateY(Math.PI / 4);
      const snow = new THREE.Mesh(snowGeo, this.materials.snow);
      snow.position.y = 5.8;
      snow.scale.set(1.15, 1, 1.25);
      house.add(snow);

      // Warm Glowing Windows
      const winGeo = new THREE.PlaneGeometry(1.2, 1.5);
      const winF = new THREE.Mesh(winGeo, this.materials.windowGlow);
      winF.position.set(0, 2.2, 2.76);
      house.add(winF);

      const winS = new THREE.Mesh(winGeo, this.materials.windowGlow);
      winS.position.set(3.26, 2.2, 0);
      winS.rotateY(Math.PI / 2);
      house.add(winS);

      // Chimney with Smoke
      const chim = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.4, 0.7), this.materials.stone);
      chim.position.set(1.6, 5.2, -1.2);
      chim.castShadow = true;
      house.add(chim);

      this.registerChimneySmoke(cp.x + 1.6, 6.4, cp.z - 1.2);

      // Window amber warm glow light
      const wLight = new THREE.PointLight(0xffbb55, 1.2, 12);
      wLight.position.set(0, 2.2, 3.2);
      house.add(wLight);

      this.scene.add(house);

      // Collider
      this.world.colliders.push({
        type: 'box',
        min: new THREE.Vector3(cp.x - 4, 0, cp.z - 3.5),
        max: new THREE.Vector3(cp.x + 4, 7, cp.z + 3.5)
      });
    });
  }

  registerChimneySmoke(x, y, z) {
    this.smokeParticles.push({
      origin: new THREE.Vector3(x, y, z),
      puffs: []
    });
  }

  // --- 7. SNOWMEN WITH CHARACTER ---
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

      // Bottom sphere
      const bGeo = new THREE.SphereGeometry(1.1, 10, 10);
      const bMesh = new THREE.Mesh(bGeo, this.materials.snow);
      bMesh.position.y = 1.0;
      bMesh.castShadow = true;
      group.add(bMesh);

      // Middle sphere
      const mGeo = new THREE.SphereGeometry(0.8, 10, 10);
      const mMesh = new THREE.Mesh(mGeo, this.materials.snow);
      mMesh.position.y = 2.4;
      mMesh.castShadow = true;
      group.add(mMesh);

      // Head
      const hGeo = new THREE.SphereGeometry(0.55, 10, 10);
      const hMesh = new THREE.Mesh(hGeo, this.materials.snow);
      hMesh.position.y = 3.4;
      hMesh.castShadow = true;
      group.add(hMesh);

      // Carrot Nose
      const cGeo = new THREE.ConeGeometry(0.12, 0.6, 6);
      cGeo.rotateX(Math.PI / 2);
      const cMesh = new THREE.Mesh(cGeo, this.materials.carrot);
      cMesh.position.set(0, 3.4, 0.6);
      group.add(cMesh);

      // Top Hat
      const hatBrimGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.1, 12);
      const hatTopGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.7, 12);
      const hatMat = new THREE.MeshStandardMaterial({ color: loc.hat, roughness: 0.8 });
      const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
      hatBrim.position.y = 3.85;
      const hatTop = new THREE.Mesh(hatTopGeo, hatMat);
      hatTop.position.y = 4.2;
      group.add(hatBrim);
      group.add(hatTop);

      // Knitted Scarf
      const scarfGeo = new THREE.TorusGeometry(0.6, 0.16, 6, 12);
      scarfGeo.rotateX(Math.PI / 2);
      const scarfMat = new THREE.MeshStandardMaterial({ color: loc.hat });
      const scarf = new THREE.Mesh(scarfGeo, scarfMat);
      scarf.position.y = 2.95;
      group.add(scarf);

      // Stick Arms
      const armMat = this.materials.woodDark;
      const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6);
      const armL = new THREE.Mesh(armGeo, armMat);
      armL.position.set(-1.0, 2.5, 0);
      armL.rotation.z = 0.8;
      group.add(armL);

      const armR = new THREE.Mesh(armGeo, armMat);
      armR.position.set(1.0, 2.5, 0);
      armR.rotation.z = -0.8;
      group.add(armR);

      this.scene.add(group);

      this.snowmen.push({
        group,
        pos: new THREE.Vector3(loc.x, 0, loc.z),
        wobble: 0
      });

      this.world.colliders.push({
        type: 'cylinder',
        pos: new THREE.Vector3(loc.x, 0, loc.z),
        radius: 1.2
      });

      // Interactable
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

  // --- 8. FESTIVE STREET LAMPS ---
  buildStreetLamps() {
    const lampLocs = [
      [-10, 0, 5], [10, 0, 5],
      [-10, 0, -5], [10, 0, -5],
      [-18, 0, 10], [18, 0, 10],
      [0, 0, 12], [0, 0, -14],
      [16, 0, 8], [-15, 0, -5]
    ];

    lampLocs.forEach(pos => {
      const lamp = new THREE.Group();
      lamp.position.set(pos[0], pos[1], pos[2]);

      // Post
      const postGeo = new THREE.CylinderGeometry(0.12, 0.16, 4.2, 8);
      const post = new THREE.Mesh(postGeo, this.materials.stone);
      post.position.y = 2.1;
      post.castShadow = true;
      lamp.add(post);

      // Lantern cage
      const cageGeo = new THREE.BoxGeometry(0.7, 0.9, 0.7);
      const cage = new THREE.Mesh(cageGeo, this.materials.gold);
      cage.position.y = 4.3;
      lamp.add(cage);

      // Glowing Glass Core
      const bulbGeo = new THREE.BoxGeometry(0.5, 0.7, 0.5);
      const bulb = new THREE.Mesh(bulbGeo, this.materials.windowGlow);
      bulb.position.y = 4.3;
      lamp.add(bulb);

      // Evergreen Wreath with Red Bow
      const wreathGeo = new THREE.TorusGeometry(0.45, 0.15, 6, 12);
      const wreath = new THREE.Mesh(wreathGeo, this.materials.pineDark);
      wreath.position.set(0, 3.2, 0.15);
      lamp.add(wreath);

      const bowGeo = new THREE.BoxGeometry(0.2, 0.2, 0.1);
      const bow = new THREE.Mesh(bowGeo, this.materials.candyRed);
      bow.position.set(0, 2.9, 0.25);
      lamp.add(bow);

      // Warm Amber Point Light
      const pLight = new THREE.PointLight(0xffaa44, 1.4, 15, 1.4);
      pLight.position.set(0, 4.3, 0);
      lamp.add(pLight);

      this.scene.add(lamp);

      this.world.colliders.push({
        type: 'cylinder',
        pos: new THREE.Vector3(pos[0], pos[1], pos[2]),
        radius: 0.6
      });
    });
  }

  // --- 9. PERIMETER EVERGREEN PINE FOREST ---
  buildPerimeterForest() {
    const forestTreeCount = 55;
    for (let i = 0; i < forestTreeCount; i++) {
      const angle = (i / forestTreeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const radius = 42 + Math.random() * 32;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;
      const scale = 0.8 + Math.random() * 0.9;

      this.createPineTree(tx, 0, tz, scale);
    }
  }

  createPineTree(x, y, z, scale = 1.0) {
    const tree = new THREE.Group();
    tree.position.set(x, y, z);
    tree.scale.set(scale, scale, scale);

    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.6, 2.5, 6),
      this.materials.woodDark
    );
    trunk.position.y = 1.25;
    trunk.castShadow = true;
    tree.add(trunk);

    // 3 Cones
    const cones = [
      { r: 2.8, h: 3.5, y: 3.2 },
      { r: 2.1, h: 3.0, y: 5.2 },
      { r: 1.4, h: 2.4, y: 7.0 }
    ];

    cones.forEach(c => {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(c.r, c.h, 7),
        this.materials.pineDark
      );
      cone.position.y = c.y;
      cone.castShadow = true;
      cone.receiveShadow = true;
      tree.add(cone);

      // Snow trim
      const snow = new THREE.Mesh(
        new THREE.TorusGeometry(c.r * 0.85, 0.25, 4, 8),
        this.materials.snow
      );
      snow.rotateX(Math.PI / 2);
      snow.position.y = c.y - c.h * 0.45;
      tree.add(snow);
    });

    this.scene.add(tree);

    this.world.colliders.push({
      type: 'cylinder',
      pos: new THREE.Vector3(x, y, z),
      radius: 1.0 * scale
    });
  }

  // --- 10. FESTIVE BUNTING & FAIRY LIGHTS ---
  buildFestiveBunting() {
    // String fairy lights between town posts
    const lines = [
      [[-10, 4.3, 5], [0, 4.3, 12]],
      [[0, 4.3, 12], [10, 4.3, 5]],
      [[-10, 4.3, -5], [0, 4.3, -14]],
      [[0, 4.3, -14], [10, 4.3, -5]]
    ];

    const lightColors = [0xff3344, 0x33ff55, 0xffd700, 0x33aaff];
    const bulbGeo = new THREE.SphereGeometry(0.12, 6, 6);

    lines.forEach(pair => {
      const p1 = new THREE.Vector3(...pair[0]);
      const p2 = new THREE.Vector3(...pair[1]);
      const count = 12;

      for (let i = 1; i < count; i++) {
        const t = i / count;
        const pos = new THREE.Vector3().lerpVectors(p1, p2, t);
        // Catenary sag curve
        const sag = Math.sin(t * Math.PI) * 1.2;
        pos.y -= sag;

        const col = lightColors[i % lightColors.length];
        const mat = new THREE.MeshBasicMaterial({ color: col });
        const bulb = new THREE.Mesh(bulbGeo, mat);
        bulb.position.copy(pos);
        this.scene.add(bulb);
      }
    });
  }

  update(delta) {
    const time = performance.now() * 0.001;

    // Twinkle tree baubles
    if (this.treeLightsOn) {
      this.treeBaubles.forEach(b => {
        const pulse = Math.sin(time * b.speed + b.phase) * 0.4 + 0.6;
        b.mesh.material.emissiveIntensity = pulse;
      });
    }

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
