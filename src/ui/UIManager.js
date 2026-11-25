export const LEVELS = [
  { level: 1, name: 'Village Novice', minCheer: 0, nextCheer: 25, unlockedSlots: [1, 7] },
  { level: 2, name: 'Merry Elf', minCheer: 25, nextCheer: 50, unlockedSlots: [1, 7, 5, 6] },
  { level: 3, name: 'Holiday Joybringer', minCheer: 50, nextCheer: 75, unlockedSlots: [1, 7, 5, 6, 4, 3] },
  { level: 4, name: "Santa's Chief Helper", minCheer: 75, nextCheer: 100, unlockedSlots: [1, 7, 5, 6, 4, 3, 8] },
  { level: 5, name: '🌟 True Spirit of Christmas', minCheer: 100, nextCheer: 100, unlockedSlots: [1, 7, 5, 6, 4, 3, 8, 2] }
];

export class UIManager {
  constructor(game) {
    this.game = game;
    this.activeSlot = 1; // 1 to 8
    this.cheerScore = 0; // Starts at 0
    this.currentLevel = 1;
    this.maxCheer = 100;
    this.photoModeActive = false;
    this.currentToast = null;
    this.toastTimer = null;

    this.slots = [
      { id: 1, key: '1', name: 'Snowball', icon: '❄️', reqLevel: 1, desc: 'Throw snowballs & break targets' },
      { id: 7, key: '2', name: 'Hot Cocoa', icon: '☕', reqLevel: 1, desc: 'Sip warm cocoa (+Cheer)' },
      { id: 5, key: '3', name: 'Xmas Cracker', icon: '🍬', reqLevel: 2, desc: 'Pop party cracker with confetti' },
      { id: 6, key: '4', name: 'Mystery Gift', icon: '🎁', reqLevel: 2, desc: 'Place a present on the snow' },
      { id: 4, key: '5', name: 'Sparkler', icon: '🎇', reqLevel: 3, desc: 'Toggle crackling hand sparkler' },
      { id: 3, key: '6', name: 'Pine Fountain', icon: '🌋', reqLevel: 3, desc: 'Plant ground sparkler fountain' },
      { id: 8, key: '7', name: 'Cathedral Bell', icon: '🔔', reqLevel: 4, desc: 'Ring the great church bells' },
      { id: 2, key: '8', name: 'Star Rocket', icon: '🎆', reqLevel: 5, desc: 'Grand Sky Rocket (True Spirit Exclusive!)' }
    ];

    this.initDOM();
    this.bindEvents();
    this.updateCheerBar();
    this.renderHotbar();
  }

  initDOM() {
    this.hud = document.getElementById('hud');
    this.hotbarContainer = document.getElementById('hotbar');
    this.interactionPrompt = document.getElementById('interaction-prompt');
    this.promptAction = document.getElementById('prompt-action');
    this.promptTitle = document.getElementById('prompt-title');
    this.cheerFill = document.getElementById('cheer-fill');
    this.cheerText = document.getElementById('cheer-text');
    this.toastContainer = document.getElementById('toast-container');
    this.modal = document.getElementById('help-modal');
  }

  getCurrentLevelData() {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (this.cheerScore >= LEVELS[i].minCheer) {
        return LEVELS[i];
      }
    }
    return LEVELS[0];
  }

  isSlotUnlocked(slotId) {
    const lvl = this.getCurrentLevelData();
    return lvl.unlockedSlots.includes(slotId);
  }

  renderHotbar() {
    if (!this.hotbarContainer) return;
    this.hotbarContainer.innerHTML = '';

    const currentLvl = this.getCurrentLevelData();

    this.slots.forEach((slot, index) => {
      const isUnlocked = currentLvl.unlockedSlots.includes(slot.id);
      const isActive = slot.id === this.activeSlot && isUnlocked;

      const btn = document.createElement('button');
      btn.className = `hotbar-slot ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
      btn.dataset.slot = slot.id;

      btn.innerHTML = `
        <span class="slot-key">${index + 1}</span>
        <span class="slot-icon">${slot.icon}</span>
        ${!isUnlocked ? '<span class="slot-lock">🔒</span>' : ''}
        <span class="slot-name">${slot.name}</span>
      `;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isUnlocked) {
          const reqLvl = LEVELS.find(l => l.level === slot.reqLevel);
          this.showToast(`🔒 Locked! Reach Level ${slot.reqLevel} (${reqLvl.name}) at ${reqLvl.minCheer}% Cheer to unlock!`);
          return;
        }
        this.selectSlot(slot.id);
        this.game.useActiveItem();
      });

      this.hotbarContainer.appendChild(btn);
    });
  }

  selectSlot(id) {
    if (!this.isSlotUnlocked(id)) {
      const slot = this.slots.find(s => s.id === id);
      const reqLvl = LEVELS.find(l => l.level === slot.reqLevel);
      this.showToast(`🔒 ${slot.name} is locked! Reach Level ${slot.reqLevel} (${reqLvl.name}) to unlock!`);
      return;
    }

    this.activeSlot = id;
    const allSlots = this.hotbarContainer.querySelectorAll('.hotbar-slot');
    allSlots.forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.slot) === id);
    });

    const activeItem = this.slots.find(s => s.id === id);
    if (activeItem) {
      this.showToast(`Selected: ${activeItem.icon} ${activeItem.name}`);
    }
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 8) {
        const slot = this.slots[num - 1];
        if (slot) this.selectSlot(slot.id);
      }
      if (e.code === 'KeyE') {
        this.game.triggerInteraction();
      }
      if (e.code === 'KeyF') {
        this.game.useActiveItem();
      }
      if (e.code === 'KeyP') {
        this.togglePhotoMode();
      }
    });

    window.addEventListener('click', (e) => {
      if (e.target.closest('#hud') || e.target.closest('#help-modal')) return;
      this.game.useActiveItem();
    });

    if (this.interactionPrompt) {
      this.interactionPrompt.addEventListener('click', () => {
        this.game.triggerInteraction();
      });
    }

    const btnMute = document.getElementById('btn-mute');
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        const unmuted = this.game.sound.toggleMute();
        btnMute.innerHTML = unmuted ? '🔊 Sound: ON' : '🔇 Sound: OFF';
        this.showToast(unmuted ? 'Sound unmuted' : 'Sound muted');
      });
    }

    const btnMusic = document.getElementById('btn-music');
    if (btnMusic) {
      btnMusic.addEventListener('click', () => {
        const playing = this.game.sound.toggleMusic();
        btnMusic.innerHTML = playing ? '🎵 Music: ON' : '🎵 Music: OFF';
        this.showToast(playing ? 'Holiday Music ON' : 'Holiday Music Paused');
      });
    }

    const btnTime = document.getElementById('btn-time');
    if (btnTime) {
      const modes = ['night', 'sunset', 'day'];
      let modeIdx = 0;
      btnTime.addEventListener('click', () => {
        modeIdx = (modeIdx + 1) % modes.length;
        const currentMode = modes[modeIdx];
        this.game.world.setTimeOfDay(currentMode);
        const labels = { night: '🌌 Night (Aurora)', sunset: '🌄 Sunset Dusk', day: '☀️ Winter Noon' };
        btnTime.innerHTML = labels[currentMode];
        this.showToast(`Atmosphere: ${labels[currentMode]}`);
      });
    }

    const btnPhoto = document.getElementById('btn-photo');
    if (btnPhoto) {
      btnPhoto.addEventListener('click', () => this.togglePhotoMode());
    }

    const btnHelp = document.getElementById('btn-help');
    if (btnHelp) {
      btnHelp.addEventListener('click', () => this.toggleHelpModal(true));
    }

    const btnCloseModal = document.getElementById('btn-close-modal');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => this.toggleHelpModal(false));
    }

    this.setupMobileControls();
  }

  setupMobileControls() {
    const joystickZone = document.getElementById('joystick-zone');
    const joystickThumb = document.getElementById('joystick-thumb');
    const btnAction = document.getElementById('btn-mobile-action');
    const btnJump = document.getElementById('btn-mobile-jump');
    const btnInteract = document.getElementById('btn-mobile-interact');

    if (!joystickZone || !joystickThumb) return;

    let touchId = null;
    let originX = 0;
    let originY = 0;
    const maxRadius = 45;

    joystickZone.addEventListener('touchstart', (e) => {
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      const rect = joystickZone.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    }, { passive: true });

    joystickZone.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          const dx = touch.clientX - originX;
          const dy = touch.clientY - originY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          const clampedDist = Math.min(dist, maxRadius);

          const thumbX = Math.cos(angle) * clampedDist;
          const thumbY = Math.sin(angle) * clampedDist;
          joystickThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;
          this.game.player.setJoystick(thumbX / maxRadius, thumbY / maxRadius);
        }
      }
    }, { passive: true });

    const resetJoystick = () => {
      touchId = null;
      joystickThumb.style.transform = 'translate(0px, 0px)';
      this.game.player.setJoystick(0, 0);
    };

    joystickZone.addEventListener('touchend', resetJoystick, { passive: true });
    joystickZone.addEventListener('touchcancel', resetJoystick, { passive: true });

    if (btnAction) {
      btnAction.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.useActiveItem();
      });
    }

    if (btnJump) {
      btnJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.player.keys['Space'] = true;
        setTimeout(() => { this.game.player.keys['Space'] = false; }, 200);
      });
    }

    if (btnInteract) {
      btnInteract.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.triggerInteraction();
      });
    }
  }

  showInteraction(title, action) {
    if (!this.interactionPrompt) return;
    this.promptTitle.textContent = title;
    this.promptAction.textContent = action;
    this.interactionPrompt.classList.add('visible');
  }

  hideInteraction() {
    if (!this.interactionPrompt) return;
    this.interactionPrompt.classList.remove('visible');
  }

  addCheer(amount) {
    const oldLevel = this.currentLevel;
    this.cheerScore = Math.min(this.maxCheer, this.cheerScore + amount);

    const newLvlData = this.getCurrentLevelData();
    this.currentLevel = newLvlData.level;

    this.updateCheerBar();

    // Check if player Leveled Up!
    if (this.currentLevel > oldLevel) {
      this.onLevelUp(newLvlData);
    }
  }

  onLevelUp(lvlData) {
    this.game.sound.playLevelUp();
    this.renderHotbar();

    // Find newly unlocked items
    const newlyUnlocked = this.slots
      .filter(s => s.reqLevel === lvlData.level)
      .map(s => `${s.icon} ${s.name}`)
      .join(', ');

    if (lvlData.level === 5) {
      this.showToast(`👑 CONGRATULATIONS! You achieved Level 5: ${lvlData.name}! Unlocked the legendary 🎆 Star Sky Rocket!`);
    } else {
      this.showToast(`🎉 LEVEL UP! Level ${lvlData.level}: ${lvlData.name}! Unlocked: ${newlyUnlocked}!`);
    }
  }

  updateCheerBar() {
    if (!this.cheerFill || !this.cheerText) return;
    const lvl = this.getCurrentLevelData();
    const percent = this.cheerScore;

    this.cheerFill.style.width = `${percent}%`;

    if (lvl.level === 5) {
      this.cheerText.textContent = `Level 5: 🌟 True Spirit (100%)`;
    } else {
      this.cheerText.textContent = `Lvl ${lvl.level}: ${lvl.name} (${percent}% / ${lvl.nextCheer}%)`;
    }
  }

  // --- CLEAN SINGLE-TOAST SYSTEM (NO SCREEN SPAMMING) ---
  showToast(message) {
    if (!this.toastContainer) return;

    // Remove any previous toast immediately to prevent stacking clutter!
    if (this.currentToast) {
      this.currentToast.remove();
      this.currentToast = null;
    }
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    this.currentToast = toast;

    this.toastTimer = setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        if (toast === this.currentToast) {
          toast.remove();
          this.currentToast = null;
        }
      }, 350);
    }, 2800);
  }

  togglePhotoMode() {
    this.photoModeActive = !this.photoModeActive;
    if (this.hud) {
      this.hud.style.display = this.photoModeActive ? 'none' : 'flex';
    }

    const watermark = document.getElementById('photo-watermark');
    if (watermark) {
      watermark.style.display = this.photoModeActive ? 'block' : 'none';
    }

    if (this.photoModeActive) {
      this.showToast('Photo Mode: ON. Press [P] to exit.');
    }
  }

  toggleHelpModal(show) {
    if (!this.modal) return;
    this.modal.classList.toggle('visible', show);
  }
}
