import * as THREE from 'three';

export class Player {
  constructor(world, soundManager) {
    this.world = world;
    this.scene = world.scene;
    this.camera = world.camera;
    this.sound = soundManager;

    this.position = new THREE.Vector3(0, 0, 10);
    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.moveSpeed = 6.8;
    this.sprintSpeed = 11.5;
    this.jumpForce = 8.2;
    this.gravity = 22.0;

    // Camera Orbit Controls
    this.camDistance = 7.5;
    this.camHeight = 2.8;
    this.camYaw = Math.PI; // Face north initially
    this.camPitch = 0.28;
    this.isFirstPerson = false;

    // Animation state
    this.walkCycle = 0;
    this.isMoving = false;
    this.stepTimer = 0;

    // Input state
    this.keys = {};
    this.mouse = { isDown: false, x: 0, y: 0 };
    this.joystickVector = { x: 0, y: 0 };

    this.initMesh();
    this.setupInputs();
  }

  initMesh() {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    // Winter Coat Torso
    const coatGeo = new THREE.CylinderGeometry(0.42, 0.52, 1.1, 8);
    const coatMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.6 });
    this.coat = new THREE.Mesh(coatGeo, coatMat);
    this.coat.position.y = 1.05;
    this.coat.castShadow = true;
    this.group.add(this.coat);

    // White fur coat trim
    const trimGeo = new THREE.TorusGeometry(0.53, 0.1, 6, 12);
    trimGeo.rotateX(Math.PI / 2);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = 0.55;
    this.group.add(trim);

    // Knitted Scarf
    const scarfGeo = new THREE.TorusGeometry(0.45, 0.14, 6, 12);
    scarfGeo.rotateX(Math.PI / 2);
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0x198754 });
    const scarf = new THREE.Mesh(scarfGeo, scarfMat);
    scarf.position.y = 1.58;
    this.group.add(scarf);

    // Head
    const headGeo = new THREE.SphereGeometry(0.38, 10, 10);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdfba, roughness: 0.7 });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.y = 1.95;
    this.head.castShadow = true;
    this.group.add(this.head);

    // Cute Eyes
    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.14, 2.02, 0.34);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.14, 2.02, 0.34);
    this.group.add(eyeL);
    this.group.add(eyeR);

    // Santa Hat
    const hatGroup = new THREE.Group();
    hatGroup.position.y = 2.25;

    // White fur brim
    const brimGeo = new THREE.TorusGeometry(0.4, 0.1, 6, 12);
    brimGeo.rotateX(Math.PI / 2);
    const brim = new THREE.Mesh(brimGeo, trimMat);
    hatGroup.add(brim);

    // Red cone
    const coneGeo = new THREE.ConeGeometry(0.38, 0.75, 8);
    const cone = new THREE.Mesh(coneGeo, coatMat);
    cone.position.set(0, 0.35, -0.05);
    cone.rotation.x = -0.2;
    hatGroup.add(cone);

    // Fluffy Pom-pom
    const pomGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const pom = new THREE.Mesh(pomGeo, trimMat);
    pom.position.set(0, 0.75, -0.15);
    hatGroup.add(pom);

    this.group.add(hatGroup);

    // Legs / Boots
    const legGeo = new THREE.CylinderGeometry(0.14, 0.13, 0.65, 6);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.8 });

    this.leftLeg = new THREE.Mesh(legGeo, bootMat);
    this.leftLeg.position.set(-0.22, 0.32, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, bootMat);
    this.rightLeg.position.set(0.22, 0.32, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);

    // Right Hand / Item Holder (for holding sparklers, snowballs, gifts)
    this.itemHolder = new THREE.Group();
    this.itemHolder.position.set(0.55, 1.25, 0.3);
    this.group.add(this.itemHolder);

    this.scene.add(this.group);
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyV') {
        this.togglePerspective();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse drag for camera orbit
    window.addEventListener('mousedown', (e) => {
      if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
        this.mouse.isDown = true;
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.mouse.isDown) {
        const dx = e.clientX - this.mouse.x;
        const dy = e.clientY - this.mouse.y;
        this.camYaw -= dx * 0.005;
        this.camPitch = Math.max(0.05, Math.min(Math.PI / 2.3, this.camPitch + dy * 0.005));
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    // Touch look support for mobile screens
    let touchStart = { x: 0, y: 0 };
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && e.touches[0].clientX > window.innerWidth * 0.4) {
        touchStart.x = e.touches[0].clientX;
        touchStart.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && e.touches[0].clientX > window.innerWidth * 0.4) {
        const dx = e.touches[0].clientX - touchStart.x;
        const dy = e.touches[0].clientY - touchStart.y;
        this.camYaw -= dx * 0.006;
        this.camPitch = Math.max(0.05, Math.min(Math.PI / 2.3, this.camPitch + dy * 0.006));
        touchStart.x = e.touches[0].clientX;
        touchStart.y = e.touches[0].clientY;
      }
    }, { passive: true });

    // Scroll wheel zoom
    window.addEventListener('wheel', (e) => {
      this.camDistance = Math.max(2.5, Math.min(18.0, this.camDistance + e.deltaY * 0.008));
    }, { passive: true });
  }

  togglePerspective() {
    this.isFirstPerson = !this.isFirstPerson;
    this.group.visible = !this.isFirstPerson;
  }

  setJoystick(x, y) {
    this.joystickVector.x = x;
    this.joystickVector.y = y;
  }

  update(delta) {
    // Determine movement direction from input
    let moveX = 0;
    let moveZ = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    // Add joystick input
    if (Math.abs(this.joystickVector.x) > 0.1 || Math.abs(this.joystickVector.y) > 0.1) {
      moveX += this.joystickVector.x;
      moveZ += this.joystickVector.y;
    }

    const inputMag = Math.sqrt(moveX * moveX + moveZ * moveZ);
    this.isMoving = inputMag > 0.1;

    const isSprinting = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && this.isMoving;
    const currentSpeed = isSprinting ? this.sprintSpeed : this.moveSpeed;

    if (this.isMoving) {
      // Normalize input
      moveX /= Math.max(1, inputMag);
      moveZ /= Math.max(1, inputMag);

      // Camera-relative movement
      const sinYaw = Math.sin(this.camYaw);
      const cosYaw = Math.cos(this.camYaw);

      const worldMoveX = moveX * cosYaw + moveZ * sinYaw;
      const worldMoveZ = -moveX * sinYaw + moveZ * cosYaw;

      this.velocity.x = worldMoveX * currentSpeed;
      this.velocity.z = worldMoveZ * currentSpeed;

      // Face direction of movement
      const targetAngle = Math.atan2(worldMoveX, worldMoveZ);
      this.group.rotation.y = targetAngle;

      // Walking leg animation
      this.walkCycle += delta * (isSprinting ? 14 : 9);
      this.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.65;
      this.rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.65;

      // Footstep audio
      this.stepTimer += delta * (isSprinting ? 2.5 : 1.8);
      if (this.stepTimer > 0.7 && this.isGrounded) {
        this.sound.playSnowStep();
        this.stepTimer = 0;
      }
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.stepTimer = 0;
    }

    // Jump
    if (this.keys['Space'] && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this.sound.playSnowStep();
    }

    // Gravity
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * delta;
    }

    // Proposed next position
    const nextX = this.position.x + this.velocity.x * delta;
    const nextY = this.position.y + this.velocity.y * delta;
    const nextZ = this.position.z + this.velocity.z * delta;

    // Collision Resolution with Village Colliders
    const playerRadius = 0.65;
    let resolvedX = nextX;
    let resolvedZ = nextZ;

    for (const col of this.world.colliders) {
      if (col.type === 'cylinder') {
        const dx = resolvedX - col.pos.x;
        const dz = resolvedZ - col.pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minDist = playerRadius + col.radius;
        if (dist < minDist && dist > 0.001) {
          const push = (minDist - dist);
          resolvedX += (dx / dist) * push;
          resolvedZ += (dz / dist) * push;
        }
      } else if (col.type === 'box') {
        // AABB check
        const closestX = Math.max(col.min.x, Math.min(resolvedX, col.max.x));
        const closestZ = Math.max(col.min.z, Math.min(resolvedZ, col.max.z));
        const dx = resolvedX - closestX;
        const dz = resolvedZ - closestZ;
        const distSq = dx * dx + dz * dz;
        if (distSq < playerRadius * playerRadius) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.001) {
            resolvedX = closestX + (dx / dist) * playerRadius;
            resolvedZ = closestZ + (dz / dist) * playerRadius;
          }
        }
      }
    }

    this.position.x = resolvedX;
    this.position.z = resolvedZ;

    // Ground plane check (y = 0 with snow height)
    if (nextY <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.position.y = nextY;
      if (this.position.y > 0.05) this.isGrounded = false;
    }

    this.group.position.copy(this.position);

    // Update Camera Follow
    this.updateCamera();
  }

  updateCamera() {
    if (this.isFirstPerson) {
      this.camera.position.set(
        this.position.x,
        this.position.y + 1.95,
        this.position.z
      );
      const lookTarget = new THREE.Vector3(
        this.position.x + Math.sin(this.camYaw) * Math.cos(this.camPitch),
        this.position.y + 1.95 - Math.sin(this.camPitch),
        this.position.z + Math.cos(this.camYaw) * Math.cos(this.camPitch)
      );
      this.camera.lookAt(lookTarget);
    } else {
      // 3rd-person orbital follow
      const offsetX = Math.sin(this.camYaw) * Math.cos(this.camPitch) * this.camDistance;
      const offsetY = Math.sin(this.camPitch) * this.camDistance + this.camHeight;
      const offsetZ = Math.cos(this.camYaw) * Math.cos(this.camPitch) * this.camDistance;

      const targetCamPos = new THREE.Vector3(
        this.position.x + offsetX,
        Math.max(1.0, this.position.y + offsetY),
        this.position.z + offsetZ
      );

      // Smooth camera interpolation
      this.camera.position.lerp(targetCamPos, 0.15);

      const lookTarget = new THREE.Vector3(
        this.position.x,
        this.position.y + 1.5,
        this.position.z
      );
      this.camera.lookAt(lookTarget);
    }
  }

  getForwardDirection() {
    return new THREE.Vector3(
      -Math.sin(this.camYaw),
      0,
      -Math.cos(this.camYaw)
    ).normalize();
  }
}
