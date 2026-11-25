export class UIManager {
  constructor(game) {
    this.game = game;
    this.activeSlot = 1; // 1 to 8
    this.cheerScore = 20; // Starts with 20 cheer
    this.maxCheer = 100;
    this.photoModeActive = false;

    this.slots = [
      { id: 1, key: '1', name: 'Snowball', icon: '❄️', desc: 'Throw snowballs & hit targets' },
      { id: 2, key: '2', name: 'Star Rocket', icon: '🎆', desc: 'Launch aerial sky firework' },
      { id: 3, key: '3', name: 'Pine Fountain', icon: '🌋', desc: 'Plant ground sparkler fountain' },
      { id: 4, key: '4', name: 'Sparkler', icon: '🎇', desc: 'Toggle crackling hand sparkler' },
      { id: 5, key: '5', name: 'Xmas Cracker', icon: '🍬', desc: 'Pop party cracker with confetti' },
      { id: 6, key: '6', name: 'Mystery Gift', icon: '🎁', desc: 'Place a present on the snow' },
      { id: 7, key: '7', name: 'Hot Cocoa', icon: '☕', desc: 'Sip warm cocoa (+Cheer & speed)' },
      { id: 8, key: '8', name: 'Cathedral Bell', icon: '🔔', desc: 'Ring the great church bells' }
    ];

    this.initDOM();
    this.bindEvents();
    this.updateCheerBar();
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

    this.renderHotbar();
  }

  renderHotbar() {
    if (!this.hotbarContainer) return;
    this.hotbarContainer.innerHTML = '';

    this.slots.forEach(slot => {
      const btn = document.createElement('button');
      btn.className = `hotbar-slot ${slot.id === this.activeSlot ? 'active' : ''}`;
      btn.dataset.slot = slot.id;
      btn.innerHTML = `
        <span class="slot-key">${slot.key}</span>
        <span class="slot-icon">${slot.icon}</span>
        <span class="slot-name">${slot.name}</span>
      `;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectSlot(slot.id);
        this.game.useActiveItem();
      });

      this.hotbarContainer.appendChild(btn);
    });
  }

  selectSlot(id) {
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
    // Number keys 1-8
    window.addEventListener('keydown', (e) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 8) {
        this.selectSlot(num);
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

    // Left click on screen uses active item
    window.addEventListener('click', (e) => {
      // Don't trigger if clicked on UI elements
      if (e.target.closest('#hud') || e.target.closest('#help-modal')) return;
      this.game.useActiveItem();
    });

    // Interaction prompt click for mobile/easy click
    if (this.interactionPrompt) {
      this.interactionPrompt.addEventListener('click', () => {
        this.game.triggerInteraction();
      });
    }

    // Top Bar Buttons
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

    // Mobile Virtual Joystick Setup
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

          // Normalize vector to [-1, 1]
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
    this.cheerScore = Math.min(this.maxCheer, this.cheerScore + amount);
    this.updateCheerBar();

    if (this.cheerScore >= this.maxCheer) {
      this.showToast('🌟 MAXIMUM CHRISTMAS CHEER ACHIEVED! You are the Spirit of Christmas! 🎅🎄');
    }
  }

  updateCheerBar() {
    if (!this.cheerFill || !this.cheerText) return;
    const percent = Math.floor((this.cheerScore / this.maxCheer) * 100);
    this.cheerFill.style.width = `${percent}%`;

    let rank = 'Village Elf';
    if (percent >= 40) rank = 'Holiday Joybringer';
    if (percent >= 75) rank = 'Santa\'s Chief Helper';
    if (percent >= 100) rank = '🌟 True Spirit of Christmas';

    this.cheerText.textContent = `Cheer: ${percent}% (${rank})`;
  }

  showToast(message) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3200);
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
