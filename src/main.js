import * as THREE from 'three';
import { World } from './world/World.js';
import { VillageBuilder } from './world/VillageBuilder.js';
import { Player } from './entities/Player.js';
import { FireworksSystem } from './entities/FireworksSystem.js';
import { SoundManager } from './audio/SoundManager.js';
import { UIManager } from './ui/UIManager.js';

class ChristmasSimulator {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.sound = new SoundManager();
    this.world = new World(this.container);
    this.village = new VillageBuilder(this.world);
    this.village.buildVillage();

    this.player = new Player(this.world, this.sound);
    this.fireworks = new FireworksSystem(this.world, this.sound);
    this.ui = new UIManager(this);

    this.currentInteractable = null;
    this.initAudioUnlock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initAudioUnlock() {
    // Unlock AudioContext on first user interaction
    const unlock = () => {
      this.sound.ensureContext();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
  }

  useActiveItem() {
    this.sound.ensureContext();
    const slot = this.ui.activeSlot;
    const playerPos = this.player.position.clone();
    const forward = this.player.getForwardDirection();

    switch (slot) {
      case 1: // Snowball Blaster
        this.fireworks.throwSnowball(playerPos, forward);
        this.ui.addCheer(2);
        break;

      case 2: // Star Sky Rocket Firework
        const rocketStart = playerPos.clone().add(forward.clone().multiplyScalar(2.0));
        this.fireworks.launchRocket(rocketStart);
        this.ui.addCheer(6);
        this.ui.showToast('🚀 Sky Rocket launched! Watch the night sky burst!');
        break;

      case 3: // Pine Fountain Cracker
        const fPos = playerPos.clone().add(forward.clone().multiplyScalar(2.2));
        this.fireworks.plantFountain(fPos);
        this.ui.addCheer(8);
        this.ui.showToast('🌋 Pine Fountain ignited! Roaring golden sparks!');
        break;

      case 4: // Handheld Sparkler
        const msg = this.fireworks.toggleSparkler();
        this.ui.showToast(msg);
        this.ui.addCheer(4);
        break;

      case 5: // Christmas Party Cracker
        this.fireworks.pullChristmasCracker(playerPos, forward);
        this.ui.addCheer(10);
        this.ui.showToast('🍬 SNAP! Party Cracker pulled with confetti burst!');
        break;

      case 6: // Mystery Gift
        // First check if near placed gift to unwrap
        const unwrapMsg = this.fireworks.unwrapNearestGift(playerPos);
        if (unwrapMsg) {
          this.ui.showToast(unwrapMsg);
          this.ui.addCheer(20);
        } else {
          const gPos = playerPos.clone().add(forward.clone().multiplyScalar(1.8));
          const placeMsg = this.fireworks.placeGiftBox(gPos);
          this.ui.showToast(placeMsg);
          this.ui.addCheer(5);
        }
        break;

      case 7: // Hot Cocoa
        this.sound.playSip();
        this.ui.addCheer(12);
        this.ui.showToast('☕ Ahh! Sweet, warming hot chocolate! (+12 Cheer)');
        break;

      case 8: // Cathedral Bell Carillon
        this.sound.playChurchBell(196); // Deep G3 note
        this.village.ringBell();
        this.ui.addCheer(15);
        this.ui.showToast('🔔 Majestic Cathedral bell chimes resound across the mountains!');
        break;
    }
  }

  triggerInteraction() {
    if (this.currentInteractable) {
      const result = this.currentInteractable.onInteract();
      if (this.currentInteractable.id === 'cathedral_bell') {
        this.sound.playChurchBell(220); // A3 chime
        this.ui.addCheer(15);
      } else if (this.currentInteractable.id === 'santas_sleigh') {
        this.sound.playJingleBells(4);
        this.ui.addCheer(25);
      } else if (this.currentInteractable.id === 'elf_stall') {
        this.sound.playJingleBells(2);
        this.ui.addCheer(10);
      } else if (this.currentInteractable.id === 'hot_cocoa') {
        this.sound.playSip();
        this.ui.addCheer(15);
      } else if (this.currentInteractable.id === 'great_tree') {
        this.sound.playJingleBells(3);
        this.ui.addCheer(20);
      }

      if (result) {
        this.ui.showToast(result);
      }
    }
  }

  checkInteractables() {
    const pPos = this.player.position;
    let closest = null;
    let minDist = Infinity;

    for (const item of this.village.interactables) {
      const dist = pPos.distanceTo(item.pos);
      if (dist < item.radius && dist < minDist) {
        minDist = dist;
        closest = item;
      }
    }

    if (closest) {
      this.currentInteractable = closest;
      this.ui.showInteraction(closest.name, closest.actionText);
    } else {
      this.currentInteractable = null;
      this.ui.hideInteraction();
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.world.clock.getDelta(), 0.1);

    this.player.update(delta);
    this.world.update(delta, this.player.position);
    this.village.update(delta);
    this.fireworks.update(delta, this.player, this.village);
    this.checkInteractables();

    this.world.renderer.render(this.world.scene, this.world.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new ChristmasSimulator();
});
