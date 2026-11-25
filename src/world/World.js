import * as THREE from 'three';

export class World {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      600
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.clock = new THREE.Clock();

    this.snowCount = 3000;
    this.snowUniforms = null;
    this.auroraUniforms = null;
    this.timeOfDay = 'night';
    this.lights = {};
    this.colliders = [];

    this.initRenderer();
    this.initSkyAndAtmosphere();
    this.initTerrain();
    this.initGpuSnowParticles();
    this.initAurora();

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  initRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Cap pixel ratio at 1.75 for locked 60-120 FPS on Retina / 4K screens
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);
  }

  initSkyAndAtmosphere() {
    this.scene.background = new THREE.Color(0x0a1024);
    this.scene.fog = new THREE.FogExp2(0x0e172e, 0.014);

    // Ambient Lighting
    this.lights.ambient = new THREE.AmbientLight(0x354b73, 0.9);
    this.scene.add(this.lights.ambient);

    // Directional Moonlight (The ONLY light in the scene that casts shadows!)
    this.lights.moon = new THREE.DirectionalLight(0xaad0ff, 1.25);
    this.lights.moon.position.set(40, 70, 45);
    this.lights.moon.castShadow = true;
    this.lights.moon.shadow.mapSize.width = 1024;
    this.lights.moon.shadow.mapSize.height = 1024;
    this.lights.moon.shadow.camera.near = 15;
    this.lights.moon.shadow.camera.far = 160;
    const d = 42;
    this.lights.moon.shadow.camera.left = -d;
    this.lights.moon.shadow.camera.right = d;
    this.lights.moon.shadow.camera.top = d;
    this.lights.moon.shadow.camera.bottom = -d;
    this.lights.moon.shadow.bias = -0.0006;
    this.scene.add(this.lights.moon);

    // Lightweight Starfield (Single draw call)
    const starCount = 1000;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 240 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.95);
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.cos(phi);
      starPositions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.1,
      transparent: true,
      opacity: 0.85
    });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);
  }

  initTerrain() {
    // Optimized resolution terrain: 48x48 segments instead of 90x90
    const terrainSize = 220;
    const segments = 48;
    const geo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromCenter = Math.sqrt(x * x + z * z);

      let y = 0;
      if (distFromCenter > 22) {
        const factor = (distFromCenter - 22) / 88;
        y = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 2.2 * factor +
            Math.sin(x * 0.03 + z * 0.03) * 6.5 * factor;
      }
      pos.setY(i, y);
    }
    geo.computeVertexNormals();

    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xedf4fc,
      roughness: 0.88,
      metalness: 0.05
    });
    this.terrainMesh = new THREE.Mesh(geo, snowMat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    // Frozen Ice Skating Pond
    const pondGeo = new THREE.CylinderGeometry(11, 11.5, 0.3, 24);
    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x88bbdd,
      roughness: 0.12,
      metalness: 0.25,
      transparent: true,
      opacity: 0.88
    });
    const pond = new THREE.Mesh(pondGeo, iceMat);
    pond.position.set(16, 0.1, 14);
    pond.receiveShadow = true;
    this.scene.add(pond);

    const rimGeo = new THREE.TorusGeometry(11.4, 0.3, 6, 24);
    rimGeo.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(16, 0.22, 14);
    this.scene.add(rim);

    this.createPath();
  }

  createPath() {
    const pathSegments = [
      { start: [-30, 0.05, 0], end: [30, 0.05, 0], width: 4 },
      { start: [0, 0.05, -30], end: [0, 0.05, 30], width: 4 },
      { start: [0, 0.05, 0], end: [16, 0.05, 14], width: 3 }
    ];

    const pathMat = new THREE.MeshStandardMaterial({
      color: 0xd8e4f0,
      roughness: 0.95
    });

    pathSegments.forEach(seg => {
      const dx = seg.end[0] - seg.start[0];
      const dz = seg.end[2] - seg.start[2];
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);

      const pathGeo = new THREE.PlaneGeometry(length, seg.width);
      pathGeo.rotateX(-Math.PI / 2);
      pathGeo.rotateY(-angle);

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

  // --- 100% GPU-ACCELERATED SNOWFALL SHADER (ZERO CPU OVERHEAD) ---
  initGpuSnowParticles() {
    const count = this.snowCount;
    const geo = new THREE.BufferGeometry();
    const initialPositions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      initialPositions[i * 3] = (Math.random() - 0.5) * 100;
      initialPositions[i * 3 + 1] = Math.random() * 38;
      initialPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      velocities[i * 3] = (Math.random() - 0.5) * 0.4;
      velocities[i * 3 + 1] = -(2.2 + Math.random() * 2.8); // Fall speed
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      sizes[i] = 12.0 + Math.random() * 14.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
    geo.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    // Procedural round soft snowflake texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.5, 'rgba(240, 248, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);

    this.snowUniforms = {
      uTime: { value: 0 },
      uPlayerPos: { value: new THREE.Vector3(0, 0, 0) },
      uTexture: { value: texture }
    };

    const vertexShader = `
      uniform float uTime;
      uniform vec3 uPlayerPos;
      attribute vec3 aVelocity;
      attribute float aSize;
      varying float vAlpha;

      void main() {
        // Compute position over time on GPU
        vec3 pos = position;
        pos.y += aVelocity.y * uTime;
        pos.x += aVelocity.x * uTime;
        pos.z += aVelocity.z * uTime;

        // Wrap relative to player
        vec3 rel = pos - uPlayerPos;
        rel.x = mod(rel.x + 45.0, 90.0) - 45.0;
        rel.y = mod(rel.y, 38.0);
        rel.z = mod(rel.z + 45.0, 90.0) - 45.0;

        // Subtle wind drift
        rel.x += sin(uTime * 0.9 + rel.y * 0.15) * 0.6;
        rel.z += cos(uTime * 0.7 + rel.y * 0.15) * 0.6;

        vec3 worldPos = uPlayerPos + rel;
        vec4 mvPos = modelViewMatrix * vec4(worldPos, 1.0);

        gl_PointSize = aSize * (120.0 / -mvPos.z);
        gl_Position = projectionMatrix * mvPos;

        // Fade out near ground
        vAlpha = clamp(rel.y * 0.25, 0.0, 0.85);
      }
    `;

    const fragmentShader = `
      uniform sampler2D uTexture;
      varying float vAlpha;

      void main() {
        vec4 tex = texture2D(uTexture, gl_PointCoord);
        gl_FragColor = vec4(tex.rgb, tex.a * vAlpha);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.snowUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.snowflakes = new THREE.Points(geo, mat);
    this.scene.add(this.snowflakes);
  }

  initAurora() {
    const auroraWidth = 140;
    const auroraHeight = 35;
    const geo = new THREE.PlaneGeometry(auroraWidth, auroraHeight, 28, 1);
    geo.translate(0, auroraHeight / 2, 0);

    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vPos;
      uniform float uTime;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float wave = sin(pos.x * 0.05 + uTime * 0.7) * 5.0 +
                     cos(pos.x * 0.02 - uTime * 0.35) * 3.5;
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
        float alpha = sin(vUv.y * 3.14159);
        alpha = pow(alpha, 1.8) * 0.65;

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
      this.scene.background.set(0x90caf9);
      this.scene.fog.color.set(0xbcd9f5);
      this.lights.ambient.color.set(0xd0e2ec);
      this.lights.ambient.intensity = 1.15;
      this.lights.moon.color.set(0xfffaed);
      this.lights.moon.intensity = 1.35;
      if (this.auroraMesh) this.auroraMesh.visible = false;
    } else if (mode === 'sunset') {
      this.scene.background.set(0x281a38);
      this.scene.fog.color.set(0x322044);
      this.lights.ambient.color.set(0x828ca8);
      this.lights.ambient.intensity = 0.95;
      this.lights.moon.color.set(0xffc2d1); // Magical Alpenglow rosy pink
      this.lights.moon.intensity = 1.25;
      if (this.auroraMesh) this.auroraMesh.visible = true;
    } else {
      this.scene.background.set(0x0a1024);
      this.scene.fog.color.set(0x0e172e);
      this.lights.ambient.color.set(0x354b73);
      this.lights.ambient.intensity = 0.9;
      this.lights.moon.color.set(0xaad0ff);
      this.lights.moon.intensity = 1.25;
      if (this.auroraMesh) this.auroraMesh.visible = true;
    }
  }

  update(delta, playerPos) {
    const time = this.clock.getElapsedTime();

    // 0-CPU GPU Particle Update: Just update two uniform values!
    if (this.snowUniforms && playerPos) {
      this.snowUniforms.uTime.value = time;
      this.snowUniforms.uPlayerPos.value.copy(playerPos);
    }

    if (this.auroraUniforms) {
      this.auroraUniforms.uTime.value = time;
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
