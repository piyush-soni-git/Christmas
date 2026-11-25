import * as THREE from 'three';

export class Player {
  constructor(world, soundManager) {
    this.world = world;
    this.scene = world.scene;
    this.camera = world.camera;
    this.sound = soundManager;

    this.position = new THREE.Vector3(0, 0, 10);
    this.velocity = new THREE.Vector3();
    this.currentSpeed = 0;
    this.targetSpeed = 0;
    this.moveSpeed = 7.0;
    this.sprintSpeed = 12.0;
    this.jumpForce = 8.5;
    this.gravity = 22.0;
    this.isGrounded = true;

    // Buttery Camera Settings (Reels-style exponential damping)
    this.camDistance = 7.2;
    this.camHeight = 2.6;
    this.camYaw = Math.PI;
    this.camPitch = 0.28;
    this.targetCamPos = new THREE.Vector3();
    this.currentCamPos = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();
    this.currentLookTarget = new THREE.Vector3();
    this.isFirstPerson = false;

    // Animation & Footsteps
    this.walkCycle = 0;
    this.isMoving = false;
    this.stepTimer = 0;

    // Inputs
    this.keys = {};
    this.mouse = { isDown: false, x: 0, y: 0 };
    this.joystickVector = { x: 0, y: 0 };

    this.initMesh();
    this.setupInputs();

    // Init camera positions
    this.updateCameraInstant();
  }

  initMesh() {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    // Torso Coat
    const coatGeo = new THREE.CylinderGeometry(0.42, 0.52, 1.1, 8);
    const coatMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.6 });
    this.coat = new THREE.Mesh(coatGeo, coatMat);
    this.coat.position.y = 1.05;
    this.coat.castShadow = true;
    this.group.add(this.coat);

    // Scarf
    const scarfGeo = new THREE.TorusGeometry(0.45, 0.14, 5, 10);
    scarfGeo.rotateX(Math.PI / 2);
    const scarf = new THREE.Mesh(scarfGeo, new THREE.MeshStandardMaterial({ color: 0x198754 }));
    scarf.position.y = 1.58;
    this.group.add(scarf);

    // Head
    const headGeo = new THREE.SphereGeometry(0.38, 8, 8);
    const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ color: 0xffdfba, roughness: 0.7 }));
    head.position.y = 1.95;
    head.castShadow = true;
    this.group.add(head);

    // Cute Eyes
    const eyeGeo = new THREE.SphereGeometry(0.06, 4, 4);
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

    const brim = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.1, 4, 10),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    );
    brim.rotateX(Math.PI / 2);
    hatGroup.add(brim);

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.75, 8), coatMat);
    cone.position.set(0, 0.35, -0.05);
    cone.rotation.x = -0.2;
    hatGroup.add(cone);

    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.12, 4, 4), brim.material);
    pom.position.set(0, 0.75, -0.15);
    hatGroup.add(pom);

    this.group.add(hatGroup);

    // Boots
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

    // High-precision pointer movement
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
        this.camYaw -= dx * 0.0045;
        this.camPitch = Math.max(0.04, Math.min(Math.PI / 2.3, this.camPitch + dy * 0.0045));
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    // Touch controls for mobile
    let touchStart = { x: 0, y: 0 };
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && e.touches[0].clientX > window.innerWidth * 0.38) {
        touchStart.x = e.touches[0].clientX;
        touchStart.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && e.touches[0].clientX > window.innerWidth * 0.38) {
        const dx = e.touches[0].clientX - touchStart.x;
        const dy = e.touches[0].clientY - touchStart.y;
        this.camYaw -= dx * 0.0055;
        this.camPitch = Math.max(0.04, Math.min(Math.PI / 2.3, this.camPitch + dy * 0.0055));
        touchStart.x = e.touches[0].clientX;
        touchStart.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('wheel', (e) => {
      this.camDistance = Math.max(2.5, Math.min(16.0, this.camDistance + e.deltaY * 0.006));
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
    // 1. Gather directional input
    let moveX = 0;
    let moveZ = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    if (Math.abs(this.joystickVector.x) > 0.08 || Math.abs(this.joystickVector.y) > 0.08) {
      moveX += this.joystickVector.x;
      moveZ += this.joystickVector.y;
    }

    const inputMag = Math.sqrt(moveX * moveX + moveZ * moveZ);
    this.isMoving = inputMag > 0.08;

    const isSprinting = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && this.isMoving;
    const maxSpeed = isSprinting ? this.sprintSpeed : this.moveSpeed;

    // Smooth acceleration & deceleration (momentum damping)
    this.targetSpeed = this.isMoving ? maxSpeed : 0;
    const accelDamp = 1.0 - Math.exp(-12.0 * delta);
    this.currentSpeed += (this.targetSpeed - this.currentSpeed) * accelDamp;

    if (this.currentSpeed > 0.05) {
      moveX /= Math.max(1, inputMag);
      moveZ /= Math.max(1, inputMag);

      const sinYaw = Math.sin(this.camYaw);
      const cosYaw = Math.cos(this.camYaw);

      const worldMoveX = moveX * cosYaw + moveZ * sinYaw;
      const worldMoveZ = -moveX * sinYaw + moveZ * cosYaw;

      this.velocity.x = worldMoveX * this.currentSpeed;
      this.velocity.z = worldMoveZ * this.currentSpeed;

      // Smooth rotation toward movement vector
      const targetAngle = Math.atan2(worldMoveX, worldMoveZ);
      const rotDamp = 1.0 - Math.exp(-15.0 * delta);
      // Shortest angle lerp
      let diff = targetAngle - this.group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.group.rotation.y += diff * rotDamp;

      // Leg swing animation
      this.walkCycle += delta * (isSprinting ? 14 : 9.5);
      this.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.65;
      this.rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.65;

      // Snow steps
      this.stepTimer += delta * (isSprinting ? 2.6 : 1.8);
      if (this.stepTimer > 0.65 && this.isGrounded) {
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

    // Collision check
    const nextX = this.position.x + this.velocity.x * delta;
    const nextY = this.position.y + this.velocity.y * delta;
    const nextZ = this.position.z + this.velocity.z * delta;

    const playerRadius = 0.6;
    let resolvedX = nextX;
    let resolvedZ = nextZ;

    for (let i = 0; i < this.world.colliders.length; i++) {
      const col = this.world.colliders[i];
      if (col.type === 'cylinder') {
        const dx = resolvedX - col.pos.x;
        const dz = resolvedZ - col.pos.z;
        const distSq = dx * dx + dz * dz;
        const minDist = playerRadius + col.radius;
        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.001) {
            const push = minDist - dist;
            resolvedX += (dx / dist) * push;
            resolvedZ += (dz / dist) * push;
          }
        }
      } else if (col.type === 'box') {
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

    if (nextY <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.position.y = nextY;
      if (this.position.y > 0.05) this.isGrounded = false;
    }

    this.group.position.copy(this.position);

    this.updateCamera(delta);
  }

  // --- REELS-STYLE BUTTERY SMOOTH CAMERA (FRAME-RATE INDEPENDENT EXPONENTIAL DECAY) ---
  updateCamera(delta) {
    if (this.isFirstPerson) {
      this.camera.position.set(
        this.position.x,
        this.position.y + 1.95,
        this.position.z
      );
      this.lookTarget.set(
        this.position.x + Math.sin(this.camYaw) * Math.cos(this.camPitch),
        this.position.y + 1.95 - Math.sin(this.camPitch),
        this.position.z + Math.cos(this.camYaw) * Math.cos(this.camPitch)
      );
      this.camera.lookAt(this.lookTarget);
    } else {
      const offsetX = Math.sin(this.camYaw) * Math.cos(this.camPitch) * this.camDistance;
      const offsetY = Math.sin(this.camPitch) * this.camDistance + this.camHeight;
      const offsetZ = Math.cos(this.camYaw) * Math.cos(this.camPitch) * this.camDistance;

      this.targetCamPos.set(
        this.position.x + offsetX,
        Math.max(0.8, this.position.y + offsetY),
        this.position.z + offsetZ
      );

      this.lookTarget.set(
        this.position.x,
        this.position.y + 1.45,
        this.position.z
      );

      // Frame-rate independent exponential smoothing algorithm:
      // At 60Hz, 120Hz, or 144Hz, motion remains exactly identical without micro-stutters!
      const dampFactor = 1.0 - Math.exp(-14.0 * delta);
      this.currentCamPos.lerp(this.targetCamPos, dampFactor);
      this.currentLookTarget.lerp(this.lookTarget, dampFactor);

      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.currentLookTarget);
    }
  }

  updateCameraInstant() {
    const offsetX = Math.sin(this.camYaw) * Math.cos(this.camPitch) * this.camDistance;
    const offsetY = Math.sin(this.camPitch) * this.camDistance + this.camHeight;
    const offsetZ = Math.cos(this.camYaw) * Math.cos(this.camPitch) * this.camDistance;

    this.currentCamPos.set(
      this.position.x + offsetX,
      this.position.y + offsetY,
      this.position.z + offsetZ
    );
    this.currentLookTarget.set(this.position.x, this.position.y + 1.45, this.position.z);
    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentLookTarget);
  }

  getForwardDirection() {
    return new THREE.Vector3(
      -Math.sin(this.camYaw),
      0,
      -Math.cos(this.camYaw)
    ).normalize();
  }
}
