# 🎄 Christmas Simulator

A cozy, browser-based 3D holiday celebration game inspired by Chirag Bhargava's viral [diwalisimulator.online](https://diwalisimulator.online/).

Step into **St. Nicholas Alpine Village** on a magical, snowy winter night. Explore a snow-covered holiday town, launch dazzling festive fireworks, throw snowballs, pop Christmas crackers, plant roaring golden sparkler fountains, unwrap surprise presents, drink hot marshmallow cocoa, and ring the great cathedral church bells to fill the valley with Christmas cheer!

---

## ✨ Features

- **Magical 3D Winter Village (Procedural Low-Poly Three.js):**
  - **The Grand Town Christmas Tree**: A multi-tiered decorated evergreen centerpiece with 75+ twinkling multi-colored ornaments, garland, wrapped gifts, and a glowing star topper.
  - **Cathedral of St. Nicholas & Belfry**: A Gothic stone chapel with stained-glass windows and a swinging bronze church bell you can ring across the valley.
  - **Santa's Workshop & Novelty Stall**: Meet Elf Barnaby and stock up on star rockets, sparklers, and mystery gift boxes.
  - **Gingerbread & Hot Cocoa Chalet**: Grab a steaming mug of hot chocolate topped with marshmallows for a warmth & cheer boost.
  - **Santa's Sleigh & Rudolph**: A golden-runner red sleigh with gift sacks and Rudolph the Red-Nosed Reindeer with a glowing red nose light!
  - **Snowy Chalets & Cottages**: Cozy timber houses with smoking chimneys and warm glowing amber windows.
  - **Animated Snowmen & Lamp Posts**: Holly-wreath-wrapped wrought iron lanterns and interactive snowmen with top hats and carrot noses.
  - **Atmospheric Sky**: Dynamic Aurora Borealis (Northern Lights) shader, twinkling starfield, and 2,500+ drifting 3D snowflakes.

- **Holiday Activities & Interactive Hotbar (1–8):**
  1. ❄️ **Snowball Blaster**: Throw physical snowballs with trajectory physics, snow splatters, and interactive hits on snowmen & bells.
  2. 🎆 **Star Sky Rockets**: Launch aerial holiday fireworks bursting into Ruby Red, Emerald Green, Royal Gold, and Ice Blue starbursts with dynamic illumination.
  3. 🌋 **Pine Fountain Cracker**: Plant a ground fireworks volcano that erupts in a 15-foot roaring spray of golden sparks and embers.
  4. 🎇 **Handheld Sparkler**: Wave a hissing, crackling handheld sparkler leaving golden ember trails.
  5. 🍬 **Christmas Party Cracker**: Pull a traditional party popper with a loud snap, paper tear, and burst of colorful confetti.
  6. 🎁 **Mystery Gift Box**: Place wrapped presents anywhere on the snow, then unwrap them for surprise treats and fanfare!
  7. ☕ **Hot Cocoa**: Sip warming cocoa for warmth, cheer, and speed.
  8. 🔔 **Cathedral Carillon**: Ring the great bronze cathedral bell with deep resonant carillon acoustics.

- **100% Procedural Web Audio API Sound Engine:**
  - Zero external MP3/WAV dependencies — all acoustic bells, rocket whistles, explosion booms, cracker snaps, snowball whooshes, footstep snow crunches, and carillon holiday music melodies (*Jingle Bells*, *We Wish You a Merry Christmas*) are synthesized at runtime directly in code.

- **Cross-Platform Controls:**
  - **Desktop**: WASD / Arrow keys to move, `Shift` to sprint, `Space` to jump, `Mouse Drag` to look & orbit, `V` for 1st/3rd person toggle, `1-8` for hotbar, `E` to interact.
  - **Mobile & Tablet**: On-screen virtual touch joystick, action buttons (USE, JUMP, INTERACT), and touch camera look.

- **Atmosphere & Photo Mode:**
  - Toggle between **Magical Night (Aurora Borealis)**, **Golden Winter Sunset**, and **Crisp Snowy Noon**.
  - **Photo Mode (`P`)**: Hides the HUD and frames a clean holiday snapshot card.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+) & npm

### Development
```bash
# Clone the repository
git clone https://github.com/your-username/christmas_simulator.git
cd christmas_simulator

# Install dependencies
npm install

# Start local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
npm run preview
```
The optimized static build will be in the `dist/` directory, ready to deploy to GitHub Pages, Vercel, Netlify, or any static host.

---

## 🛠️ Architecture & Tech Stack

- **Graphics & 3D**: [Three.js](https://threejs.org/) (WebGL with ACESFilmicToneMapping, PCFSoftShadowMap, procedural geometry and custom GLSL shaders).
- **Sound**: Native Web Audio API procedural synthesis (oscillators, biquad filters, white noise buffers, additive bell harmonics).
- **Tooling**: [Vite](https://vitejs.dev/) for fast development and bundling.
- **Styling**: Modern CSS with frosted glass backdrop filters, responsive layout, and Google Fonts (*Mountains of Christmas*, *Fredoka*, *Outfit*).

---

## 🎅 Credits & Inspiration
Inspired by the wonderful [diwalisimulator.online](https://diwalisimulator.online/) created by Chirag Bhargava. Built with holiday cheer and joy! Merry Christmas! 🎄✨
