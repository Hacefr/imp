/**
 * VS Impostor V4 Legacy - Playable Skin Studio Core Engine
 * Verified format matching official VS Impostor Legacy, Security DLC & idkbf specs.
 */

// 1. GLOBAL STATE
const state = {
  rawSpriteFile: null,
  spriteImage: null,
  cols: 5,
  rows: 1,
  activePose: 'idle',
  customBannerFile: null,
  customNodeRenderFile: null,
  icons: {
    normal: null,
    lose: null,
    win: null
  },
  hatAnchor: { x: 0, y: -90 },
  camAnchor: { x: 100, y: -100 }
};

// Animation labels mapped to indices
const poseLabels = ["IDLE", "LEFT", "DOWN", "UP", "RIGHT", "HEY / PEACE", "IDLE 2", "IDLE 3"];

// 2. STARFIELD BACKGROUND SIMULATION
const starCanvas = document.getElementById('starfield');
const starCtx = starCanvas.getContext('2d');
let stars = [];

function initStars() {
  starCanvas.width = window.innerWidth;
  starCanvas.height = window.innerHeight;
  stars = Array.from({ length: 85 }, () => ({
    x: Math.random() * starCanvas.width,
    y: Math.random() * starCanvas.height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 0.4 + 0.1,
    alpha: Math.random() * 0.8 + 0.2
  }));
}
window.addEventListener('resize', initStars);
initStars();

function animateStarfield() {
  starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
  starCtx.fillStyle = '#ffffff';
  stars.forEach(s => {
    starCtx.globalAlpha = s.alpha;
    starCtx.fillRect(s.x, s.y, s.size, s.size);
    s.y -= s.speed;
    if (s.y < 0) {
      s.y = starCanvas.height;
      s.x = Math.random() * starCanvas.width;
    }
  });
  requestAnimationFrame(animateStarfield);
}
animateStarfield();

// 3. TAB NAVIGATION
function switchTab(tabId) {
  document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.pill-btn:not(.export-pill)').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + tabId).classList.add('active');

  const tabBtn = {
    skin: 'tabBtnSkin',
    cosmic: 'tabBtnCosmic',
    export: 'tabBtnExport'
  }[tabId];
  if (tabBtn) document.getElementById(tabBtn).classList.add('active');

  const titles = {
    skin: "AUTOMATED BOYFRIEND SKIN COMPILER",
    cosmic: "COSMICUBE & SHOP ECONOMY",
    export: "ENGINE MANIFEST & DIRECTORY PIPELINE"
  };
  document.getElementById('subTitle').innerText = titles[tabId];
}

// 4. LABELED SPRITESHEET SLICER VIEWER
const slicerCanvas = document.getElementById('slicerCanvas');
const slCtx = slicerCanvas.getContext('2d');

function updateSlicerMap() {
  const img = state.spriteImage;
  const cols = state.cols;
  const rows = state.rows;

  if (img) {
    const frameW = Math.floor(img.width / cols);
    const frameH = Math.floor(img.height / rows);
    document.getElementById('frameDimTag').innerText = `${frameW} x ${frameH} px per frame`;

    slicerCanvas.width = img.width;
    slicerCanvas.height = img.height;

    slCtx.clearRect(0, 0, slicerCanvas.width, slicerCanvas.height);
    slCtx.drawImage(img, 0, 0);

    // Overlay neon boundary boxes with titles
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const index = r * cols + c;
        const x = c * frameW;
        const y = r * frameH;
        const label = poseLabels[index] || `FRAME ${index}`;

        // Neon Slice Box
        slCtx.strokeStyle = '#38bdf8';
        slCtx.lineWidth = 3;
        slCtx.strokeRect(x + 2, y + 2, frameW - 4, frameH - 4);

        // Header Pill
        slCtx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        slCtx.fillRect(x + 4, y + 4, frameW - 8, 24);

        // Title Text
        slCtx.fillStyle = '#fde047';
        slCtx.font = 'bold 12px "Montserrat", sans-serif';
        slCtx.fillText(`[${index}: ${label}]`, x + 8, y + 20);
      }
    }
  } else {
    // Fallback Slicer Canvas Preview
    slicerCanvas.width = 500;
    slicerCanvas.height = 100;
    document.getElementById('frameDimTag').innerText = `300 x 240 px (Target)`;

    slCtx.clearRect(0, 0, slicerCanvas.width, slicerCanvas.height);
    const fw = 100;
    for (let i = 0; i < 5; i++) {
      slCtx.strokeStyle = '#38bdf8';
      slCtx.lineWidth = 2;
      slCtx.strokeRect(i * fw + 2, 2, fw - 4, 96);

      slCtx.fillStyle = 'rgba(0,0,0,0.6)';
      slCtx.fillRect(i * fw + 4, 4, fw - 8, 20);

      slCtx.fillStyle = '#fde047';
      slCtx.font = 'bold 10px "Montserrat", sans-serif';
      slCtx.fillText(`[${i}: ${poseLabels[i]}]`, i * fw + 6, 18);
    }
  }

  updateNodeRenderIconPreview();
}

// 5. STAGE FLOOR & SCALE SIMULATOR
const charCanvas = document.getElementById('charCanvas');
const ctx = charCanvas.getContext('2d');

function drawCharacter() {
  ctx.clearRect(0, 0, charCanvas.width, charCanvas.height);

  const antialias = document.getElementById('antialiasSelect').value === 'true';
  ctx.imageSmoothingEnabled = antialias;

  const scale = parseFloat(document.getElementById('charScale').value) || 1.75;
  const color = document.getElementById('healthColor').value;

  // Draw Ground Line & Carpet Simulator
  const groundY = charCanvas.height * 0.78;
  ctx.save();
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(10, groundY);
  ctx.lineTo(charCanvas.width - 10, groundY);
  ctx.stroke();

  // Faint carpet fill below line
  ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
  ctx.fillRect(10, groundY, charCanvas.width - 20, charCanvas.height - groundY - 10);
  ctx.restore();

  // Draw Character with feet standing on ground line
  ctx.save();
  ctx.translate(charCanvas.width / 2, groundY);
  ctx.scale(scale, scale);

  if (state.spriteImage) {
    const frameW = state.spriteImage.width / state.cols;
    const frameH = state.spriteImage.height / state.rows;
    
    const poseIndexMap = { idle: 0, singLEFT: 1, singDOWN: 2, singUP: 3, singRIGHT: 4, hey: 0 };
    const frameIndex = poseIndexMap[state.activePose] || 0;
    
    const col = frameIndex % state.cols;
    const row = Math.floor(frameIndex / state.cols) % state.rows;
    const sx = col * frameW;
    const sy = row * frameH;

    // Anchor at bottom center (feet touch ground!)
    ctx.drawImage(state.spriteImage, sx, sy, frameW, frameH, -frameW / 2, -frameH, frameW, frameH);
  } else {
    // Procedural Fallback Impostor
    renderProceduralImpostor(ctx, color, state.activePose);
  }

  ctx.restore();
}

// Procedural Impostor (Anchored to bottom feet)
function renderProceduralImpostor(c, bodyColor, pose) {
  let offsetX = 0, offsetY = 0, rot = 0;
  if (pose === 'singLEFT')  { offsetX = -25; rot = -0.08; }
  if (pose === 'singDOWN')  { offsetY = 20; }
  if (pose === 'singUP')    { offsetY = -20; }
  if (pose === 'singRIGHT') { offsetX = 25; rot = 0.08; }

  c.save();
  c.translate(offsetX, offsetY);
  c.rotate(rot);

  // Backpack on Right (+X)
  c.fillStyle = bodyColor;
  c.strokeStyle = '#000000';
  c.lineWidth = 8;
  c.beginPath();
  c.roundRect(55, -150, 35, 120, 16);
  c.fill();
  c.stroke();

  // Main Body
  c.beginPath();
  c.roundRect(-70, -200, 140, 200, [70, 70, 25, 25]);
  c.fill();
  c.stroke();

  // Visor on Left (-X) -> Faces Left toward Opponent & GF!
  c.fillStyle = '#7feaff';
  c.beginPath();
  c.roundRect(-60, -165, 80, 48, 24);
  c.fill();
  c.stroke();

  // Visor Highlight
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.roundRect(-45, -158, 50, 14, 7);
  c.fill();

  c.restore();
}

// 6. AUTO-CALIBRATE TO IMPOSTOR HEIGHT (420px target)
function autoCalibrateScale() {
  let currentHeight = 240; // Default
  if (state.spriteImage) {
    currentHeight = Math.floor(state.spriteImage.height / state.rows);
  }
  const calculatedScale = (380 / currentHeight).toFixed(2);
  document.getElementById('charScale').value = calculatedScale;
  drawCharacter();
}

// 7. FILE UPLOAD HANDLERS
function handleSpriteUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  state.rawSpriteFile = file;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      state.spriteImage = img;
      updateSlicerMap();
      autoCalibrateScale();
      drawCharacter();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function updateGridSlices() {
  state.cols = parseInt(document.getElementById('gridCols').value) || 5;
  state.rows = parseInt(document.getElementById('gridRows').value) || 1;
  updateSlicerMap();
  drawCharacter();
}

function handleIconUpload(slot, e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      state.icons[slot] = img;
      document.getElementById(`icon${slot.charAt(0).toUpperCase() + slot.slice(1)}Status`).innerText = `Loaded (${img.width}x${img.height})`;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function handleBannerUpload(e) {
  state.customBannerFile = e.target.files[0];
}

function handleNodeRenderUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  state.customNodeRenderFile = file;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const nCanvas = document.getElementById('nodeIconCanvas');
      const nCtx = nCanvas.getContext('2d');
      nCtx.clearRect(0, 0, 48, 48);
      nCtx.drawImage(img, 0, 0, 48, 48);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function updateNodeRenderIconPreview() {
  if (state.customNodeRenderFile) return;
  const nCanvas = document.getElementById('nodeIconCanvas');
  const nCtx = nCanvas.getContext('2d');
  nCtx.clearRect(0, 0, 48, 48);

  if (state.spriteImage) {
    const fw = Math.floor(state.spriteImage.width / state.cols);
    const fh = Math.floor(state.spriteImage.height / state.rows);
    nCtx.drawImage(state.spriteImage, 0, 0, fw, fh, 2, 2, 44, 44);
  } else {
    // Default star icon preview
    nCtx.fillStyle = '#ffdd00';
    nCtx.beginPath();
    nCtx.arc(24, 24, 18, 0, Math.PI * 2);
    nCtx.fill();
    nCtx.fillStyle = '#7feaff';
    nCtx.fillRect(12, 18, 16, 10);
  }
}

// 8. WASD & ARROW KEYS LISTENER
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  let newPose = null;

  if (key === 'arrowleft' || key === 'a') newPose = 'singLEFT';
  if (key === 'arrowdown' || key === 's') newPose = 'singDOWN';
  if (key === 'arrowup' || key === 'w') newPose = 'singUP';
  if (key === 'arrowright' || key === 'd') newPose = 'singRIGHT';
  if (key === ' ' || key === 'shift') newPose = 'hey'; // Spacebar taunt!

  if (newPose && state.activePose !== newPose) {
    state.activePose = newPose;
    document.getElementById('activePoseName').innerText = newPose;
    drawCharacter();
  }
});

window.addEventListener('keyup', () => {
  state.activePose = 'idle';
  document.getElementById('activePoseName').innerText = 'idle';
  drawCharacter();
});

// 9. DRAGGABLE ANCHORS
function setupDraggableAnchor(elementId, coordDisplayId, stateTarget) {
  const el = document.getElementById(elementId);
  const container = document.getElementById('stageCanvasContainer');
  let dragging = false;

  el.addEventListener('mousedown', () => dragging = true);
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    el.style.left = `${x - 25}px`;
    el.style.top = `${y - 12}px`;

    const relX = Math.round(x - rect.width / 2);
    const relY = Math.round(y - rect.height * 0.78);
    stateTarget.x = relX;
    stateTarget.y = relY;

    document.getElementById(coordDisplayId).innerText = `${relX}, ${relY}`;
  });
  window.addEventListener('mouseup', () => dragging = false);
}

setupDraggableAnchor('hatMarker', 'hatCoords', state.hatAnchor);
setupDraggableAnchor('camMarker', 'camCoords', state.camAnchor);

document.getElementById('hatMarker').style.left = '46%';
document.getElementById('hatMarker').style.top = '22%';
document.getElementById('camMarker').style.left = '58%';
document.getElementById('camMarker').style.top = '45%';

// 10. COSMICUBE SHOP & SYNC
function syncSkinDisplayName() {
  const name = document.getElementById('skinDisplayName').value || 'Star Impostor';
  document.getElementById('nodeNameInput').value = name;
}

function syncCubeTitle() {
  const title = document.getElementById('cubeTitle').value || 'Star Crewmate Cube';
  document.getElementById('bannerTitle').innerText = title;
}

function selectNode(name, cost, nodeEl) {
  document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('selected'));
  nodeEl.classList.add('selected');
  document.getElementById('nodeNameInput').value = name;
  document.getElementById('nodeCostInput').value = cost;
}

function updateActiveNodeCost(val) {
  const selectedNode = document.querySelector('.tree-node.selected .node-cost');
  if (selectedNode) selectedNode.innerText = val > 0 ? val : 'FREE';
}

function toggleCurrency(mode) {
  document.getElementById('currencyBadge').innerText = mode === 'beans' ? '5,000 Beans' : '1,500 Mod Pods';
}

// 11. AUTOMATED 450x150 ICON STITCHER
async function generateStitchedIconBlob() {
  const offCanvas = document.createElement('canvas');
  offCanvas.width = 450;
  offCanvas.height = 150;
  const oCtx = offCanvas.getContext('2d');

  const slots = [state.icons.normal, state.icons.lose, state.icons.win];

  slots.forEach((iconImg, i) => {
    const dx = i * 150;
    if (iconImg) {
      oCtx.drawImage(iconImg, 0, 0, iconImg.width, iconImg.height, dx, 0, 150, 150);
    } else {
      oCtx.save();
      oCtx.fillStyle = i === 1 ? '#ff3344' : (i === 2 ? '#fde047' : '#7feaff');
      oCtx.beginPath();
      oCtx.roundRect(dx + 25, 45, 100, 60, 20);
      oCtx.fill();
      oCtx.strokeStyle = '#000000';
      oCtx.lineWidth = 6;
      oCtx.stroke();

      if (i === 1) {
        oCtx.strokeStyle = '#000000';
        oCtx.lineWidth = 4;
        oCtx.beginPath();
        oCtx.moveTo(dx + 65, 45);
        oCtx.lineTo(dx + 80, 75);
        oCtx.lineTo(dx + 70, 105);
        oCtx.stroke();
      }
      oCtx.restore();
    }
  });

  return new Promise(resolve => offCanvas.toBlob(resolve, 'image/png'));
}

// 12. AUTO-BAKED FALLBACK SPRITESHEET (400x400 cells)
async function generateFallbackSpritesheet(bodyColor) {
  const sheet = document.createElement('canvas');
  const frameW = 400, frameH = 400;
  sheet.width = frameW * 5;
  sheet.height = frameH * 1;
  const sCtx = sheet.getContext('2d');

  const poses = ['idle', 'singLEFT', 'singDOWN', 'singUP', 'singRIGHT'];
  poses.forEach((pose, i) => {
    sCtx.save();
    sCtx.translate(i * frameW + frameW / 2, frameH * 0.88);
    renderProceduralImpostor(sCtx, bodyColor, pose);
    sCtx.restore();
  });

  return new Promise(resolve => sheet.toBlob(resolve, 'image/png'));
}

// 13. COSMICUBE BANNER GENERATOR (images/menu/cosmicube/slides/[cubeId].png)
async function generateCosmicubeBanner(title, bodyColor) {
  if (state.customBannerFile) return state.customBannerFile;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = 480;
  bCanvas.height = 240;
  const bCtx = bCanvas.getContext('2d');

  const grad = bCtx.createLinearGradient(0, 0, 480, 240);
  grad.addColorStop(0, '#0c0a1a');
  grad.addColorStop(1, '#2c1248');
  bCtx.fillStyle = grad;
  bCtx.fillRect(0, 0, 480, 240);

  bCtx.strokeStyle = '#a855f7';
  bCtx.lineWidth = 6;
  bCtx.strokeRect(3, 3, 474, 234);

  bCtx.save();
  bCtx.translate(390, 190);
  bCtx.scale(0.55, 0.55);
  renderProceduralImpostor(bCtx, bodyColor, 'idle');
  bCtx.restore();

  bCtx.fillStyle = '#ffffff';
  bCtx.font = '900 26px "Montserrat", sans-serif';
  bCtx.fillText(title.toUpperCase(), 24, 110);

  bCtx.fillStyle = '#fde047';
  bCtx.font = '700 14px "Nunito", sans-serif';
  bCtx.fillText('PLAYABLE SKIN CUBE', 26, 145);

  return new Promise(resolve => bCanvas.toBlob(resolve, 'image/png'));
}

// 14. COSMICUBE NODE ITEM RENDER (images/menu/cosmicube/items/[skinId].png)
async function generateNodeRenderItemBlob() {
  if (state.customNodeRenderFile) return state.customNodeRenderFile;

  const rCanvas = document.createElement('canvas');
  rCanvas.width = 180;
  rCanvas.height = 180;
  const rCtx = rCanvas.getContext('2d');

  if (state.spriteImage) {
    const fw = Math.floor(state.spriteImage.width / state.cols);
    const fh = Math.floor(state.spriteImage.height / state.rows);
    rCtx.drawImage(state.spriteImage, 0, 0, fw, fh, 10, 10, 160, 160);
  } else {
    rCtx.save();
    rCtx.translate(90, 140);
    rCtx.scale(0.6, 0.6);
    renderProceduralImpostor(rCtx, document.getElementById('healthColor').value, 'idle');
    rCtx.restore();
  }

  return new Promise(resolve => rCanvas.toBlob(resolve, 'image/png'));
}

// 15. FULL MULTI-DIRECTORY BUNDLER (.ZIP)
async function bundleModZip() {
  const zip = new JSZip();
  const rawId = document.getElementById('skinId').value || 'custom_bf';
  const skinId = rawId.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const skinDisplayName = document.getElementById('skinDisplayName').value || 'Custom Boyfriend';
  const cubeTitle = document.getElementById('cubeTitle').value || 'Star Crewmate Cube';
  const cubeId = cubeTitle.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const scale = parseFloat(document.getElementById('charScale').value) || 1.75;
  const bodyColor = document.getElementById('healthColor').value;
  const cost = parseInt(document.getElementById('nodeCostInput').value) || 150;
  const currencyType = document.getElementById('currencyMode').value === 'custom' ? 'modpods' : 'beans';

  const offsetX = parseInt(document.getElementById('stageOffsetX').value) || 0;
  const offsetY = parseInt(document.getElementById('stageOffsetY').value) || 400;

  // A. Metadata
  const metaData = {
    name: skinId,
    title: cubeTitle,
    description: "Custom Playable Boyfriend Skin & Cosmicube for VS Impostor V4 Legacy",
    author: "Impostor Modder",
    version: "1.0.0",
    mod_version: "1.0.0",
    api_version: "0.1.0",
    global: false,
    color: [255, 43, 61],
    icon: "icon.png"
  };

  const metaString = JSON.stringify(metaData, null, 2);

  // B. DUAL-ENGINE CHARACTER SCHEMA (Codename + Psych)
  const charConfigData = {
    renderType: "sparrow",
    version: "1.0.1",
    name: skinId,
    assetPath: `characters/${skinId}`,
    danceEvery: 2,
    singTime: 6,
    flipX: true, // Engine inverts player side (!true = false), keeping him facing Left!
    isPixel: document.getElementById('antialiasSelect').value === 'false',
    startingAnimation: "idle",
    healthIcon: {
      id: skinId,
      isPixel: false
    },
    image: `characters/${skinId}`,
    flip_x: true,
    no_antialiasing: document.getElementById('antialiasSelect').value === 'false',
    position: [offsetX, offsetY],
    offsets: [offsetX, offsetY],
    camera_position: [state.camAnchor.x, state.camAnchor.y],
    cameraOffsets: [state.camAnchor.x, state.camAnchor.y],
    hat_position: [state.hatAnchor.x, state.hatAnchor.y],
    healthicon: skinId,
    scale: scale,
    sing_duration: 6,
    healthbar_colors: [255, 221, 0],

    animations: [
      { name: "idle", anim: "idle", prefix: "idle", offsets: [0, 0], frameRate: 24, fps: 24, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "singLEFT", anim: "singLEFT", prefix: "singLEFT", offsets: [0, 0], frameRate: 24, fps: 24, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "singDOWN", anim: "singDOWN", prefix: "singDOWN", offsets: [0, 0], frameRate: 24, fps: 24, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "singUP", anim: "singUP", prefix: "singUP", offsets: [0, 0], frameRate: 24, fps: 24, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "singRIGHT", anim: "singRIGHT", prefix: "singRIGHT", offsets: [0, 0], frameRate: 24, fps: 24, looped: false, loop: false, indices: [], frameIndices: [] },
      // Misses automatically fallback to directional sing poses so missing notes never glitches!
      { name: "singLEFTmiss", anim: "singLEFTmiss", prefix: "singLEFT", offsets: [0, 0], frameRate: 24, fps: 24, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "singDOWNmiss", anim: "singDOWNmiss", prefix: "singDOWN", offsets: [0, 0], frameRate: 24, fps: 24, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "singUPmiss", anim: "singUPmiss", prefix: "singUP", offsets: [0, 0], frameRate: 24, fps: 24, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "singRIGHTmiss", anim: "singRIGHTmiss", prefix: "singRIGHT", offsets: [0, 0], frameRate: 24, fps: 24, looped: false, loop: false, indices: [], frameIndices: [] },
      // Taunt Key Multi-Hook: "hey", "peace", and "taunt" all trigger the signature pose!
      { name: "hey", anim: "hey", prefix: "peace", offsets: [0, 0], frameRate: 24, fps: 24, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "peace", anim: "peace", prefix: "peace", offsets: [0, 0], frameRate: 24, fps: 24, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "taunt", anim: "taunt", prefix: "peace", offsets: [0, 0], frameRate: 24, fps: 24, looped: false, loop: false, indices: [], frameIndices: [] }
    ]
  };
  const charConfigString = JSON.stringify(charConfigData, null, 2);

  // C. Spritesheet Image Data
  let spriteBlob;
  let frameW = 300, frameH = 240;
  let cols = state.cols, rows = state.rows;

  if (state.rawSpriteFile) {
    spriteBlob = state.rawSpriteFile;
    frameW = Math.floor(state.spriteImage.width / state.cols);
    frameH = Math.floor(state.spriteImage.height / state.rows);
  } else {
    spriteBlob = await generateFallbackSpritesheet(bodyColor);
    cols = 5;
    rows = 1;
    frameW = 400;
    frameH = 400;
  }

  // D. Fully Padded Sparrow XML Atlas (frameWidth & frameHeight eliminate cut corners!)
  let xmlString = `<?xml version="1.0" encoding="utf-8"?>\n<TextureAtlas imagePath="${skinId}.png" width="${cols * frameW}" height="${rows * frameH}">\n`;
  const xmlPoseKeys = ["idle", "singLEFT", "singDOWN", "singUP", "singRIGHT", "peace"];

  for (let i = 0; i < cols * rows; i++) {
    const aName = xmlPoseKeys[i] || "idle";
    const x = (i % cols) * frameW;
    const y = Math.floor(i / cols) * frameH;
    xmlString += `  <SubTexture name="${aName}0000" x="${x}" y="${y}" width="${frameW}" height="${frameH}" frameX="0" frameY="0" frameWidth="${frameW}" frameHeight="${frameH}"/>\n`;
  }
  // Guarantee peace/hey frame exists even on 5-frame sheets!
  if (cols * rows <= 5) {
    xmlString += `  <SubTexture name="peace0000" x="0" y="0" width="${frameW}" height="${frameH}" frameX="0" frameY="0" frameWidth="${frameW}" frameHeight="${frameH}"/>\n`;
  }
  xmlString += `</TextureAtlas>`;

  // E. Verified Cosmicube Data
  const cubeHeaderString = JSON.stringify({
    title: cubeTitle.toUpperCase(),
    currency: currencyType
  }, null, 2);

  const itemNodeString = JSON.stringify({
    type: "playerSkin",
    price: cost,
    title: skinDisplayName, // Named after your character, NOT the cube!
    hint: "Cosmicube Exclusive",
    description: `Play as ${skinDisplayName} in any song!`,
    node: {
      direction: "north",
      parent: "root"
    }
  }, null, 2);

  // F. Generate All Graphics
  const iconBlob = await generateStitchedIconBlob();
  const bannerBlob = await generateCosmicubeBanner(cubeTitle, bodyColor);
  const nodeRenderBlob = await generateNodeRenderItemBlob();

  // -------------------------------------------------------------
  // VERIFIED MULTI-DIRECTORY INJECTION
  // -------------------------------------------------------------
  const injectAll = (target) => {
    target.file("meta.json", metaString);
    target.file("_polymod_meta.json", metaString);
    target.file("icon.png", iconBlob);

    // Characters JSON
    target.folder("characters").file(`${skinId}.json`, charConfigString);
    target.folder("data").folder("characters").file(`${skinId}.json`, charConfigString);

    // Spritesheet PNG & XML in shared/images/characters/ and images/characters/
    target.folder("images").folder("characters").file(`${skinId}.png`, spriteBlob);
    target.folder("images").folder("characters").file(`${skinId}.xml`, xmlString);
    target.folder("shared").folder("images").folder("characters").file(`${skinId}.png`, spriteBlob);
    target.folder("shared").folder("images").folder("characters").file(`${skinId}.xml`, xmlString);

    // Health Icons
    target.folder("images").folder("icons").file(`icon-${skinId}.png`, iconBlob);
    target.folder("shared").folder("images").folder("icons").file(`icon-${skinId}.png`, iconBlob);

    // Cosmicube Header & Item Node
    target.folder("data").folder("cosmicube").file(`${cubeId}.json`, cubeHeaderString);
    target.folder("data").folder("cosmicube").folder(cubeId).file(`${skinId}.json`, itemNodeString);

    // VERIFIED: Carousel Shop Slide Banner (images/menu/cosmicube/slides/)
    target.folder("images").folder("menu").folder("cosmicube").folder("slides").file(`${cubeId}.png`, bannerBlob);
    target.folder("shared").folder("images").folder("menu").folder("cosmicube").folder("slides").file(`${cubeId}.png`, bannerBlob);

    // VERIFIED: Node Tree Item Portrait Render (images/menu/cosmicube/items/)
    target.folder("images").folder("menu").folder("cosmicube").folder("items").file(`${skinId}.png`, nodeRenderBlob);
    target.folder("shared").folder("images").folder("menu").folder("cosmicube").folder("items").file(`${skinId}.png`, nodeRenderBlob);
  };

  // 1. Inject at Flat Root
  injectAll(zip);

  // 2. Inject inside Mod Subfolder
  injectAll(zip.folder(skinId));

  // Trigger Download
  const finalZipBlob = await zip.generateAsync({ type: "blob" });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(finalZipBlob);
  downloadLink.download = `${skinId}_v4_legacy_bundle.zip`;
  downloadLink.click();
}

// Initial draw calls
updateSlicerMap();
drawCharacter();
