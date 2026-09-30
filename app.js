/**
 * VS Impostor V4 Legacy - Playable Skin Studio Core Engine
 * Verified format matching official VS Impostor Legacy & Security DLC specs.
 */

// 1. GLOBAL STATE
const state = {
  rawSpriteFile: null,
  spriteImage: null,
  cols: 4,
  rows: 2,
  activePose: 'idle',
  icons: {
    normal: null,
    lose: null,
    win: null
  },
  hatAnchor: { x: 0, y: -45 },
  camAnchor: { x: 100, y: -100 },
  stageOffset: { x: 0, y: -320 } // Pulls character down to the floor
};

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

// 4. CANVAS RENDERING ENGINE
const charCanvas = document.getElementById('charCanvas');
const ctx = charCanvas.getContext('2d');

function drawCharacter() {
  ctx.clearRect(0, 0, charCanvas.width, charCanvas.height);

  const antialias = document.getElementById('antialiasSelect').value === 'true';
  ctx.imageSmoothingEnabled = antialias;

  const scale = parseFloat(document.getElementById('charScale').value) || 1.0;
  const color = document.getElementById('healthColor').value;

  ctx.save();
  ctx.translate(charCanvas.width / 2, charCanvas.height / 2);
  ctx.scale(scale, scale);

  if (state.spriteImage) {
    const frameW = state.spriteImage.width / state.cols;
    const frameH = state.spriteImage.height / state.rows;
    
    const poseIndexMap = { idle: 0, singLEFT: 1, singDOWN: 2, singUP: 3, singRIGHT: 4 };
    const frameIndex = poseIndexMap[state.activePose] || 0;
    
    const col = frameIndex % state.cols;
    const row = Math.floor(frameIndex / state.cols) % state.rows;
    const sx = col * frameW;
    const sy = row * frameH;

    ctx.drawImage(state.spriteImage, sx, sy, frameW, frameH, -frameW / 2, -frameH / 2, frameW, frameH);
  } else {
    renderProceduralImpostor(ctx, color, state.activePose);
  }

  ctx.restore();
}

function renderProceduralImpostor(c, bodyColor, pose) {
  let offsetX = 0, offsetY = 0, rot = 0;
  if (pose === 'singLEFT')  { offsetX = -20; rot = -0.1; }
  if (pose === 'singDOWN')  { offsetY = 15; }
  if (pose === 'singUP')    { offsetY = -15; }
  if (pose === 'singRIGHT') { offsetX = 20; rot = 0.1; }

  c.save();
  c.translate(offsetX, offsetY);
  c.rotate(rot);

  // Backpack
  c.fillStyle = bodyColor;
  c.strokeStyle = '#000000';
  c.lineWidth = 7;
  c.beginPath();
  c.roundRect(55, -40, 30, 95, 12);
  c.fill();
  c.stroke();

  // Body
  c.beginPath();
  c.roundRect(-65, -90, 130, 180, [65, 65, 25, 25]);
  c.fill();
  c.stroke();

  // Visor (Facing Left)
  c.fillStyle = '#7feaff';
  c.beginPath();
  c.roundRect(-50, -55, 75, 42, 22);
  c.fill();
  c.stroke();

  // Visor Shine
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.roundRect(-35, -50, 45, 12, 6);
  c.fill();

  c.restore();
}

drawCharacter();

// 5. FILE UPLOAD HANDLERS
function handleSpriteUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  state.rawSpriteFile = file;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      state.spriteImage = img;
      drawCharacter();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function updateGridSlices() {
  state.cols = parseInt(document.getElementById('gridCols').value) || 4;
  state.rows = parseInt(document.getElementById('gridRows').value) || 2;
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

// 6. WASD & ARROW KEYS LISTENER
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  let newPose = null;

  if (key === 'arrowleft' || key === 'a') newPose = 'singLEFT';
  if (key === 'arrowdown' || key === 's') newPose = 'singDOWN';
  if (key === 'arrowup' || key === 'w') newPose = 'singUP';
  if (key === 'arrowright' || key === 'd') newPose = 'singRIGHT';

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

// 7. DRAGGABLE ANCHORS
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
    const relY = Math.round(y - rect.height / 2);
    stateTarget.x = relX;
    stateTarget.y = relY;

    document.getElementById(coordDisplayId).innerText = `${relX}, ${relY}`;
  });
  window.addEventListener('mouseup', () => dragging = false);
}

setupDraggableAnchor('hatMarker', 'hatCoords', state.hatAnchor);
setupDraggableAnchor('camMarker', 'camCoords', state.camAnchor);

document.getElementById('hatMarker').style.left = '46%';
document.getElementById('hatMarker').style.top = '28%';
document.getElementById('camMarker').style.left = '58%';
document.getElementById('camMarker').style.top = '45%';

// 8. COSMICUBE SHOP INSPECTOR
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

// 9. AUTOMATED 450x150 ICON STITCHER
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

// 10. AUTO-BAKED FALLBACK SPRITESHEET (Each animation frame cleanly separated)
async function generateFallbackSpritesheet(bodyColor) {
  const sheet = document.createElement('canvas');
  const frameW = 200, frameH = 200;
  sheet.width = frameW * 4;
  sheet.height = frameH * 2;
  const sCtx = sheet.getContext('2d');

  const poses = ['idle', 'singLEFT', 'singDOWN', 'singUP', 'singRIGHT', 'peace', 'idle', 'idle'];
  poses.forEach((pose, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    sCtx.save();
    sCtx.translate(col * frameW + frameW / 2, row * frameH + frameH / 2);
    renderProceduralImpostor(sCtx, bodyColor, pose);
    sCtx.restore();
  });

  return new Promise(resolve => sheet.toBlob(resolve, 'image/png'));
}

// 11. COSMICUBE BANNER GENERATOR
async function generateCosmicubeBanner(title, bodyColor) {
  const bCanvas = document.createElement('canvas');
  bCanvas.width = 400;
  bCanvas.height = 160;
  const bCtx = bCanvas.getContext('2d');

  const grad = bCtx.createLinearGradient(0, 0, 400, 160);
  grad.addColorStop(0, '#100e23');
  grad.addColorStop(1, '#2c1445');
  bCtx.fillStyle = grad;
  bCtx.fillRect(0, 0, 400, 160);

  bCtx.strokeStyle = '#a855f7';
  bCtx.lineWidth = 6;
  bCtx.strokeRect(3, 3, 394, 154);

  bCtx.save();
  bCtx.translate(330, 85);
  bCtx.scale(0.45, 0.45);
  renderProceduralImpostor(bCtx, bodyColor, 'idle');
  bCtx.restore();

  bCtx.fillStyle = '#ffffff';
  bCtx.font = '900 22px "Montserrat", sans-serif';
  bCtx.fillText(title.toUpperCase(), 24, 75);

  bCtx.fillStyle = '#fde047';
  bCtx.font = '700 13px "Nunito", sans-serif';
  bCtx.fillText('PLAYABLE SKIN CUBE', 26, 102);

  return new Promise(resolve => bCanvas.toBlob(resolve, 'image/png'));
}

// 12. FULL HYBRID AUTO-BUNDLER (.ZIP)
async function bundleModZip() {
  const zip = new JSZip();
  const rawId = document.getElementById('skinId').value || 'custom_bf';
  const skinId = rawId.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const cubeTitle = document.getElementById('cubeTitle').value || 'Legacy Crewmate Cube';
  const cubeId = cubeTitle.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const scale = parseFloat(document.getElementById('charScale').value) || 1.0;
  const bodyColor = document.getElementById('healthColor').value;
  const cost = parseInt(document.getElementById('nodeCostInput').value) || 100;
  const currencyType = document.getElementById('currencyMode').value === 'custom' ? 'modpods' : 'beans';

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

  // B. EXACT CODENAME / NIGHTMAREVISION CHARACTER SCHEMA
  const codenameCharData = {
    renderType: "sparrow",
    version: "1.0.1",
    name: skinId,
    assetPath: `characters/${skinId}`,
    scale: scale,
    offsets: [state.stageOffset.x, state.stageOffset.y], // [0, -320] anchors him to the carpet floor!
    cameraOffsets: [state.camAnchor.x, state.camAnchor.y],
    danceEvery: 2,
    singTime: 6,
    flipX: false, // Correct orientation: faces Grey and GF
    isPixel: document.getElementById('antialiasSelect').value === 'false',
    startingAnimation: "idle",
    healthIcon: {
      id: skinId,
      isPixel: false
    },
    animations: [
      { name: "idle", prefix: "idle", offsets: [0, 0], frameRate: 24, looped: false, frameIndices: [] },
      { name: "singLEFT", prefix: "singLEFT", offsets: [0, 0], frameRate: 24, looped: false, frameIndices: [] },
      { name: "singDOWN", prefix: "singDOWN", offsets: [0, 0], frameRate: 24, looped: false, frameIndices: [] },
      { name: "singUP", prefix: "singUP", offsets: [0, 0], frameRate: 24, looped: false, frameIndices: [] },
      { name: "singRIGHT", prefix: "singRIGHT", offsets: [0, 0], frameRate: 24, looped: false, frameIndices: [] },
      { name: "singLEFTmiss", prefix: "singLEFTmiss", offsets: [0, 0], frameRate: 24, looped: false, frameIndices: [] },
      { name: "singDOWNmiss", prefix: "singDOWNmiss", offsets: [0, 0], frameRate: 24, looped: false, frameIndices: [] },
      { name: "singUPmiss", prefix: "singUPmiss", offsets: [0, 0], frameRate: 24, looped: false, frameIndices: [] },
      { name: "singRIGHTmiss", prefix: "singRIGHTmiss", offsets: [0, 0], frameRate: 24, looped: false, frameIndices: [] },
      { name: "peace", prefix: "peace", offsets: [0, 0], frameRate: 24, looped: false, frameIndices: [] }
    ]
  };
  const charConfigString = JSON.stringify(codenameCharData, null, 2);

  // C. Spritesheet Image Data
  let spriteBlob;
  let frameW = 200, frameH = 200;
  let cols = state.cols, rows = state.rows;

  if (state.rawSpriteFile) {
    spriteBlob = state.rawSpriteFile;
    frameW = Math.floor(state.spriteImage.width / state.cols);
    frameH = Math.floor(state.spriteImage.height / state.rows);
  } else {
    spriteBlob = await generateFallbackSpritesheet(bodyColor);
    cols = 4;
    rows = 2;
    frameW = 200;
    frameH = 200;
  }

  // D. Clean Multi-Frame Sparrow XML Mapping
  let xmlString = `<?xml version="1.0" encoding="utf-8"?>\n<TextureAtlas imagePath="${skinId}.png">\n`;
  const poseNames = ["idle", "singLEFT", "singDOWN", "singUP", "singRIGHT", "peace", "idle", "idle"];

  for (let i = 0; i < cols * rows; i++) {
    const aName = poseNames[i] || "idle";
    const x = (i % cols) * frameW;
    const y = Math.floor(i / cols) * frameH;
    xmlString += `  <SubTexture name="${aName}0000" x="${x}" y="${y}" width="${frameW}" height="${frameH}"/>\n`;
  }
  xmlString += `</TextureAtlas>`;

  // E. Security DLC Format for Cosmicubes
  const cubeHeaderString = JSON.stringify({
    title: cubeTitle.toUpperCase(),
    currency: currencyType
  }, null, 2);

  const itemNodeString = JSON.stringify({
    type: "playerSkin",
    price: cost,
    title: cubeTitle,
    hint: "Cosmicube Exclusive",
    description: "Custom Playable Boyfriend Skin",
    node: {
      direction: "north",
      parent: "root"
    }
  }, null, 2);

  // F. Icon Strips & Banner
  const iconBlob = await generateStitchedIconBlob();
  const bannerBlob = await generateCosmicubeBanner(cubeTitle, bodyColor);

  // -------------------------------------------------------------
  // COMPLETE MULTI-DIRECTORY INJECTION
  // -------------------------------------------------------------

  const injectAll = (target) => {
    target.file("meta.json", metaString);
    target.file("_polymod_meta.json", metaString);
    target.file("icon.png", iconBlob);

    // Characters JSON
    target.folder("characters").file(`${skinId}.json`, charConfigString);
    target.folder("data").folder("characters").file(`${skinId}.json`, charConfigString);

    // Spritesheet PNG & XML in images/characters/ AND shared/images/characters/
    target.folder("images").folder("characters").file(`${skinId}.png`, spriteBlob);
    target.folder("images").folder("characters").file(`${skinId}.xml`, xmlString);
    target.folder("shared").folder("images").folder("characters").file(`${skinId}.png`, spriteBlob);
    target.folder("shared").folder("images").folder("characters").file(`${skinId}.xml`, xmlString);

    // Also in characters/ root
    target.folder("characters").file(`${skinId}.png`, spriteBlob);
    target.folder("characters").file(`${skinId}.xml`, xmlString);

    // Icons
    target.folder("images").folder("icons").file(`icon-${skinId}.png`, iconBlob);
    target.folder("shared").folder("images").folder("icons").file(`icon-${skinId}.png`, iconBlob);

    // Cosmicube Data (data/cosmicube/)
    target.folder("data").folder("cosmicube").file(`${cubeId}.json`, cubeHeaderString);
    target.folder("data").folder("cosmicube").folder(cubeId).file(`${skinId}.json`, itemNodeString);

    // Cosmicube Banner
    target.folder("images").folder("cosmicube").file(`${cubeId}.png`, bannerBlob);
    target.folder("shared").folder("images").folder("cosmicube").file(`${cubeId}.png`, bannerBlob);
    target.folder("images").folder("cosmicubes").file(`${cubeId}.png`, bannerBlob);
    target.folder("shared").folder("images").folder("cosmicubes").file(`${cubeId}.png`, bannerBlob);
  };

  // 1. Inject at flat root
  injectAll(zip);

  // 2. Inject inside mod subfolder
  injectAll(zip.folder(skinId));

  // Download
  const finalZipBlob = await zip.generateAsync({ type: "blob" });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(finalZipBlob);
  downloadLink.download = `${skinId}_v4_legacy_bundle.zip`;
  downloadLink.click();
}
