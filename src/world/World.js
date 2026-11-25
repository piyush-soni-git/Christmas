import * as THREE from 'three';

export class World {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.clock = new THREE.Clock();

    this.snowflakes = null;
    this.snowCount = 2500;
    this.auroraMesh = null;
    this.timeOfDay = 'night'; // 'night', 'sunset', 'day'
    this.lights = {};
    this.colliders = []; // Bounding boxes or objects for collision

    this.initRenderer();
    this.initSkyAndAtmosphere();
    this.initTerrain();
    this.initSnowParticles();
    this.initAurora();

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  initRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);
  }

  initSkyAndAtmosphere() {
    // Atmospheric winter twilight night color
    this.scene.background = new THREE.Color(0x0a1024);
    this.scene.fog = new THREE.FogExp2(0x0e172e, 0.014);

    // Ambient Lighting
    this.lights.ambient = new THREE.AmbientLight(0x354b73, 0.85);
    this.scene.add(this.lights.ambient);

    // Directional Moonlight
    this.lights.moon = new THREE.DirectionalLight(0xaad0ff, 1.2);
    this.lights.moon.position.set(40, 75, 45);
    this.lights.moon.castShadow = true;
    this.lights.moon.shadow.mapSize.width = 2048;
    this.lights.moon.shadow.mapSize.height = 2048;
    this.lights.moon.shadow.camera.near = 10;
    this.lights.moon.shadow.camera.far = 180;
    const d = 50;
    this.lights.moon.shadow.camera.left = -d;
    this.lights.moon.shadow.camera.right = d;
    this.lights.moon.shadow.camera.top = d;
    this.lights.moon.shadow.camera.bottom = -d;
    this.lights.moon.shadow.bias = -0.0005;
    this.scene.add(this.lights.moon);

    // Starfield
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 220 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.95); // Mostly in upper hemisphere
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.cos(phi);
      starPositions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      transparent: true,
      opacity: 0.85
    });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);
  }

  initTerrain() {
    // Main Snowy Valley Ground
    const terrainSize = 240;
    const segments = 90;
    const geo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    // Gentle rolling snowbanks, keep center village flat
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromCenter = Math.sqrt(x * x + z * z);

      // Center town square is level (radius ~ 35)
      let y = 0;
      if (distFromCenter > 25) {
        const factor = (distFromCenter - 25) / 95;
        y = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 2.2 * factor +
            Math.sin(x * 0.03 + z * 0.03) * 6.5 * factor;
      }
      pos.setY(i, y);
    }
    geo.computeVertexNormals();

    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xedf4fc,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true
    });
    this.terrainMesh = new THREE.Mesh(geo, snowMat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    // Frozen Ice Skating Pond in town square
    const pondGeo = new THREE.CylinderGeometry(11, 12, 0.4, 32);
    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x88bbdd,
      roughness: 0.1,
      metalness: 0.25,
      transparent: true,
      opacity: 0.88
    });
    const pond = new THREE.Mesh(pondGeo, iceMat);
    pond.position.set(16, 0.1, 14);
    pond.receiveShadow = true;
    this.scene.add(pond);

    // Wooden rim around the pond
    const rimGeo = new THREE.TorusGeometry(11.5, 0.35, 8, 32);
    rimGeo.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(16, 0.25, 14);
    this.scene.add(rim);

    // Festive snow path leading through town
    this.createPath();
  }

  createPath() {
    // Village cobblestone/beaten snow pathway
    const pathSegments = [
      { start: [-30, 0.05, 0], end: [30, 0.05, 0], width: 4 },
      { start: [0, 0.05, -30], end: [0, 0.05, 30], width: 4 },
      { start: [0, 0.05, 0], end: [16, 0.05, 14], width: 3 }
    ];

    pathSegments.forEach(seg => {
      const dx = seg.end[0] - seg.start[0];
      const dz = seg.end[2] - seg.start[2];
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);

      const pathGeo = new THREE.PlaneGeometry(length, seg.width);
      pathGeo.rotateX(-Math.PI / 2);
      pathGeo.rotateY(-angle);

      const pathMat = new THREE.MeshStandardMaterial({
        color: 0xd8e4f0,
        roughness: 0.95,
        metalness: 0.02
      });
      const pathMesh = new THREE.Mesh(pathGeo, pathMat);
      pathMesh.position.set(
        (seg.start[0] + seg.end[0]) / 2,
        0.04,
        (seg.start[2] + seg.end[2]) / 2
      );
      pathMesh.receiveShadow = true;
      this.scene.add(pathMesh);
    });
  }

  initSnowParticles() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.snowCount * 3);
    const velocities = new Float32Array(this.snowCount * 3);

    for (let i = 0; i < this.snowCount; i++) {
      const idx = i * 3;
      positions[idx] = (Math.random() - 0.5) * 120;
      positions[idx + 1] = Math.random() * 45;
      positions[idx + 2] = (Math.random() - 0.5) * 120;

      velocities[idx] = (Math.random() - 0.5) * 0.4; // Wind drift X
      velocities[idx + 1] = -(1.2 + Math.random() * 1.5); // Fall speed Y
      velocities[idx + 2] = (Math.random() - 0.5) * 0.4; // Wind drift Z
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.snowVelocities = velocities;

    // Crisp soft snowflake sprite generated procedurally
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.5, 'rgba(235, 245, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.65,
      map: texture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.snowflakes = new THREE.Points(geo, mat);
    this.scene.add(this.snowflakes);
  }

  initAurora() {
    // Ethereal Aurora Borealis (Northern Lights) curtain
    const auroraWidth = 140;
    const auroraHeight = 35;
    const segmentsX = 40;
    const geo = new THREE.PlaneGeometry(auroraWidth, auroraHeight, segmentsX, 1);
    geo.translate(0, auroraHeight / 2, 0);

    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vPos;
      uniform float uTime;
      void main() {
        vUv = uv;
        vec3 pos = position;
        // Wavy undulating curtain
        float wave = sin(pos.x * 0.05 + uTime * 0.8) * 6.0 +
                     cos(pos.x * 0.02 - uTime * 0.4) * 4.0;
        pos.z += wave;
        vPos = pos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;
      varying vec3 vPos;
      uniform float uTime;
      void main() {
        // Vertical glow gradient: transparent at base and top, bright in middle
        float alpha = sin(vUv.y * 3.14159);
        alpha = pow(alpha, 1.8) * 0.65;

        // Dynamic color shifting from emerald green to cyan to violet
        float shift = sin(vPos.x * 0.04 + uTime * 0.5) * 0.5 + 0.5;
        vec3 green = vec3(0.15, 0.95, 0.55);
        vec3 cyan = vec3(0.1, 0.8, 0.95);
        vec3 violet = vec3(0.7, 0.25, 0.9);

        vec3 col = mix(green, cyan, shift);
        col = mix(col, violet, sin(uTime * 0.3) * 0.3);

        gl_FragColor = vec4(col, alpha);
      }
    `;

    this.auroraUniforms = {
      uTime: { value: 0 }
    };

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.auroraUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.auroraMesh = new THREE.Mesh(geo, mat);
    this.auroraMesh.position.set(0, 22, -90);
    this.scene.add(this.auroraMesh);
  }

  setTimeOfDay(mode) {
    this.timeOfDay = mode;
    if (mode === 'day') {
      this.scene.background.set(0x7eaed9);
      this.scene.fog.color.set(0x94bee3);
      this.lights.ambient.color.set(0x99bbdd);
      this.lights.ambient.intensity = 1.1;
      this.lights.moon.color.set(0xfffae8);
      this.lights.moon.intensity = 1.5;
      if (this.auroraMesh) this.auroraMesh.visible = false;
    } else if (mode === 'sunset') {
      this.scene.background.set(0x281938);
      this.scene.fog.color.set(0x381f3d);
      this.lights.ambient.color.set(0x6b446a);
      this.lights.ambient.intensity = 0.9;
      this.lights.moon.color.set(0xff9955);
      this.lights.moon.intensity = 1.2;
      if (this.auroraMesh) this.auroraMesh.visible = true;
    } else {
      // Night (default magical Christmas village atmosphere)
      this.scene.background.set(0x0a1024);
      this.scene.fog.color.set(0x0e172e);
      this.lights.ambient.color.set(0x354b73);
      this.lights.ambient.intensity = 0.85;
      this.lights.moon.color.set(0xaad0ff);
      this.lights.moon.intensity = 1.2;
      if (this.auroraMesh) this.auroraMesh.visible = true;
    }
  }

  update(delta, playerPos) {
    const time = this.clock.getElapsedTime();

    // Animate Aurora
    if (this.auroraUniforms) {
      this.auroraUniforms.uTime.value = time;
    }

    // Animate Falling Snowflakes (keep them centered around the player)
    if (this.snowflakes && playerPos) {
      const posAttr = this.snowflakes.geometry.attributes.position;
      const posArray = posAttr.array;
      const vArray = this.snowVelocities;

      for (let i = 0; i < this.snowCount; i++) {
        const idx = i * 3;

        // Apply fall and subtle wind swirl
        posArray[idx] += vArray[idx] + Math.sin(time * 0.8 + posArray[idx + 1] * 0.1) * 0.05;
        posArray[idx + 1] += vArray[idx + 1] * delta * 5.0;
        posArray[idx + 2] += vArray[idx + 2] + Math.cos(time * 0.7 + posArray[idx + 1] * 0.1) * 0.05;

        // Wrap around player if below ground or out of view bounds
        if (posArray[idx + 1] < 0.2) {
          posArray[idx + 1] = 38 + Math.random() * 8;
          posArray[idx] = playerPos.x + (Math.random() - 0.5) * 80;
          posArray[idx + 2] = playerPos.z + (Math.random() - 0.5) * 80;
        }

        // Horizontal boundary wrap around player
        const dx = posArray[idx] - playerPos.x;
        const dz = posArray[idx + 2] - playerPos.z;
        if (Math.abs(dx) > 45) posArray[idx] = playerPos.x - Math.sign(dx) * 44;
        if (Math.abs(dz) > 45) posArray[idx + 2] = playerPos.z - Math.sign(dz) * 44;
      }
      posAttr.needsUpdate = true;
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
