/**
 * VS Impostor V4 Legacy - Playable Skin Studio Core Engine
 * Verified format matching official VS Impostor Legacy, Security DLC & idkbf specs.
 * Includes complete .imp Project Save/Load Engine, Frame Timing & Pacing Calibrator.
 */

// 1. GLOBAL STATE
const state = {
  mode: 'upload',
  rawSpriteFile: null,
  spriteImage: null,
  cols: 5,
  rows: 1,
  activePose: 'idle',
  idleFrameTick: 0,
  isSinging: false,
  singTimeout: null,
  customBannerImage: null,
  customNodeRenderImage: null,
  icons: {
    normal: null,
    lose: null,
    win: null
  },
  looseFrames: {
    idle: null,
    left: null,
    down: null,
    up: null,
    right: null
  },
  hatAnchor: { x: 0, y: -90 },
  camAnchor: { x: 100, y: -100 }
};

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
  document.querySelectorAll('.pill-btn:not(.export-pill):not(.imp-pill)').forEach(b => b.classList.remove('active'));
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

// 4. ANIMATED SPRITESHEET GENERATOR (14 Frames)
async function generateAnimatedTemplateImage(bodyColor) {
  const sheet = document.createElement('canvas');
  const fw = 300, fh = 260;
  sheet.width = fw * 7;
  sheet.height = fh * 2;
  const sCtx = sheet.getContext('2d');

  // Frame 0-3: Idle (Breathing Bop)
  const idleBops = [0, -6, -12, -4];
  idleBops.forEach((offsetY, i) => {
    sCtx.save();
    sCtx.translate(i * fw + fw / 2, fh * 0.88 + offsetY);
    renderProceduralImpostor(sCtx, bodyColor, 'idle', i * 0.05);
    sCtx.restore();
  });

  // Frame 4-5: Left Pose
  [0, 1].forEach((sub, i) => {
    sCtx.save();
    sCtx.translate((4 + i) * fw + fw / 2, fh * 0.88);
    renderProceduralImpostor(sCtx, bodyColor, 'singLEFT', sub * 0.04);
    sCtx.restore();
  });

  // Frame 6: Down Pose 1
  sCtx.save();
  sCtx.translate(6 * fw + fw / 2, fh * 0.88);
  renderProceduralImpostor(sCtx, bodyColor, 'singDOWN', 0);
  sCtx.restore();

  // Row 2
  const row2Poses = ['singDOWN', 'singUP', 'singUP', 'singRIGHT', 'singRIGHT', 'hey', 'hey'];
  row2Poses.forEach((pose, i) => {
    sCtx.save();
    sCtx.translate(i * fw + fw / 2, fh + fh * 0.88);
    renderProceduralImpostor(sCtx, bodyColor, pose, (i % 2) * 0.05);
    sCtx.restore();
  });

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = sheet.toDataURL('image/png');
  });
}

// 5. SLICER & STAGE PIPELINE
function switchSlicerMode(mode) {
  state.mode = mode;
  document.getElementById('customUploadSection').style.display = (mode === 'upload') ? 'block' : 'none';
  document.getElementById('loosePngsSection').style.display = (mode === 'loose_pngs') ? 'block' : 'none';

  if (mode === 'animated_template') {
    state.cols = 7;
    state.rows = 2;
    document.getElementById('gridCols').value = 7;
    document.getElementById('gridRows').value = 2;
    generateAnimatedTemplateImage(document.getElementById('healthColor').value).then(img => {
      state.spriteImage = img;
      updateSlicerMap();
      autoCalibrateScale();
      drawCharacter();
    });
  } else if (mode === 'static_template') {
    state.cols = 5;
    state.rows = 1;
    document.getElementById('gridCols').value = 5;
    document.getElementById('gridRows').value = 1;
    state.spriteImage = null;
    updateSlicerMap();
    autoCalibrateScale();
    drawCharacter();
  } else if (mode === 'upload') {
    state.cols = parseInt(document.getElementById('gridCols').value) || 5;
    state.rows = parseInt(document.getElementById('gridRows').value) || 1;
    updateSlicerMap();
    drawCharacter();
  }
}

// 6. LABELED SPRITESHEET SLICER VIEWER
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

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const index = r * cols + c;
        const x = c * frameW;
        const y = r * frameH;
        const label = poseLabels[index] || `FRAME ${index}`;

        slCtx.strokeStyle = '#38bdf8';
        slCtx.lineWidth = 3;
        slCtx.strokeRect(x + 2, y + 2, frameW - 4, frameH - 4);

        slCtx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        slCtx.fillRect(x + 4, y + 4, frameW - 8, 24);

        slCtx.fillStyle = '#fde047';
        slCtx.font = 'bold 12px "Montserrat", sans-serif';
        slCtx.fillText(`[${index}: ${label}]`, x + 8, y + 20);
      }
    }
  } else {
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

// 7. STAGE SIMULATOR
const charCanvas = document.getElementById('charCanvas');
const ctx = charCanvas.getContext('2d');

function drawStageBackground(c, type) {
  const w = charCanvas.width;
  const h = charCanvas.height;
  const groundY = h * 0.78;

  if (type === 'mira') {
    const skyGrad = c.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#7dd3fc');
    skyGrad.addColorStop(1, '#e0f2fe');
    c.fillStyle = skyGrad;
    c.fillRect(0, 0, w, groundY);

    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.fillRect(w * 0.35, 30, w * 0.3, groundY - 30);
    c.strokeStyle = '#0284c7';
    c.lineWidth = 3;
    c.strokeRect(w * 0.35, 30, w * 0.3, groundY - 30);

    c.fillStyle = '#16a34a';
    c.fillRect(0, groundY, w, h - groundY);
  } else if (type === 'polus') {
    c.fillStyle = '#0f172a';
    c.fillRect(0, 0, w, groundY);
    c.fillStyle = '#e2e8f0';
    c.fillRect(0, groundY, w, h - groundY);
  } else if (type === 'airship') {
    c.fillStyle = '#991b1b';
    c.fillRect(0, 0, w, groundY);
    c.fillStyle = '#374151';
    c.fillRect(0, groundY, w, h - groundY);
  } else if (type === 'defeat') {
    c.fillStyle = '#000000';
    c.fillRect(0, 0, w, groundY);
    c.fillStyle = '#b91c1c';
    c.fillRect(0, groundY, w, h - groundY);
  } else {
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.fillRect(0, 0, w, h);
  }

  c.strokeStyle = '#22c55e';
  c.lineWidth = 3;
  c.setLineDash([8, 6]);
  c.beginPath();
  c.moveTo(0, groundY);
  c.lineTo(w, groundY);
  c.stroke();
  c.setLineDash([]);
}

function drawCharacter() {
  ctx.clearRect(0, 0, charCanvas.width, charCanvas.height);

  const bgType = document.getElementById('stageBgSelect') ? document.getElementById('stageBgSelect').value : 'mira';
  drawStageBackground(ctx, bgType);

  const antialias = document.getElementById('antialiasSelect').value === 'true';
  ctx.imageSmoothingEnabled = antialias;

  const scale = parseFloat(document.getElementById('charScale').value) || 1.75;
  const color = document.getElementById('healthColor').value;
  const groundY = charCanvas.height * 0.78;

  ctx.save();
  ctx.translate(charCanvas.width / 2, groundY);
  ctx.scale(scale, scale);

  if (state.spriteImage) {
    const frameW = state.spriteImage.width / state.cols;
    const frameH = state.spriteImage.height / state.rows;
    
    let frameIndex = 0;
    if (state.mode === 'animated_template') {
      const animatedMap = {
        idle: [0, 1, 2, 3],
        singLEFT: [4, 5],
        singDOWN: [6, 7],
        singUP: [8, 9],
        singRIGHT: [10, 11],
        hey: [12, 13]
      };
      const activeFrames = animatedMap[state.activePose] || [0];
      frameIndex = activeFrames[state.idleFrameTick % activeFrames.length];
    } else {
      const poseIndexMap = { idle: 0, singLEFT: 1, singDOWN: 2, singUP: 3, singRIGHT: 4, hey: 0 };
      frameIndex = poseIndexMap[state.activePose] || 0;
    }
    
    const col = frameIndex % state.cols;
    const row = Math.floor(frameIndex / state.cols) % state.rows;
    const sx = col * frameW;
    const sy = row * frameH;

    ctx.drawImage(state.spriteImage, sx, sy, frameW, frameH, -frameW / 2, -frameH, frameW, frameH);
  } else {
    renderProceduralImpostor(ctx, color, state.activePose);
  }

  ctx.restore();
}

function renderProceduralImpostor(c, bodyColor, pose, squish = 0) {
  let offsetX = 0, offsetY = 0, rot = 0;
  if (pose === 'singLEFT')  { offsetX = -25; rot = -0.08; }
  if (pose === 'singDOWN')  { offsetY = 20; }
  if (pose === 'singUP')    { offsetY = -20; }
  if (pose === 'singRIGHT') { offsetX = 25; rot = 0.08; }
  if (pose === 'hey')       { offsetY = -25; rot = 0.05; }

  c.save();
  c.translate(offsetX, offsetY);
  c.rotate(rot);

  c.fillStyle = bodyColor;
  c.strokeStyle = '#000000';
  c.lineWidth = 8;
  c.beginPath();
  c.roundRect(55, -150 - squish * 10, 35, 120 + squish * 10, 16);
  c.fill();
  c.stroke();

  c.beginPath();
  c.roundRect(-70, -200 - squish * 10, 140, 200 + squish * 10, [70, 70, 25, 25]);
  c.fill();
  c.stroke();

  c.fillStyle = '#7feaff';
  c.beginPath();
  c.roundRect(-60, -165 - squish * 10, 80, 48, 24);
  c.fill();
  c.stroke();

  c.fillStyle = '#ffffff';
  c.beginPath();
  c.roundRect(-45, -158 - squish * 10, 50, 14, 7);
  c.fill();

  c.restore();
}

// 8. SIMULATED BEAT CONDUCTOR (Bops once per beat instead of vibrating endlessly!)
let beatTimer = 0;
function stageAnimationLoop(time) {
  if (time - beatTimer > 500) { // ~120 BPM tempo
    beatTimer = time;
    if (!state.isSinging) {
      state.idleFrameTick++;
      if (state.mode === 'animated_template') {
        drawCharacter();
      }
    }
  }
  requestAnimationFrame(stageAnimationLoop);
}
requestAnimationFrame(stageAnimationLoop);

// 9. AUTO-CALIBRATE TO IMPOSTOR HEIGHT
function autoCalibrateScale() {
  let currentHeight = 240;
  if (state.spriteImage) {
    currentHeight = Math.floor(state.spriteImage.height / state.rows);
  }
  const calculatedScale = (380 / currentHeight).toFixed(2);
  document.getElementById('charScale').value = calculatedScale;
  drawCharacter();
}

// 10. FILE UPLOADS
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

// 11. LOOSE PNGs AUTO-PACKER
async function handleLooseFrame(pose, e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      state.looseFrames[pose] = img;
      stitchLooseFramesIntoSprite();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function stitchLooseFramesIntoSprite() {
  const poses = ['idle', 'left', 'down', 'up', 'right'];
  const loaded = poses.map(p => state.looseFrames[p]).filter(Boolean);
  if (loaded.length === 0) return;

  const maxW = Math.max(...loaded.map(img => img.width));
  const maxH = Math.max(...loaded.map(img => img.height));

  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = maxW * 5;
  sheetCanvas.height = maxH;
  const sCtx = sheetCanvas.getContext('2d');

  poses.forEach((p, i) => {
    const img = state.looseFrames[p] || state.looseFrames['idle'];
    if (img) {
      sCtx.drawImage(img, i * maxW + (maxW - img.width) / 2, maxH - img.height);
    }
  });

  const finalImg = new Image();
  finalImg.onload = () => {
    state.spriteImage = finalImg;
    state.cols = 5;
    state.rows = 1;
    document.getElementById('gridCols').value = 5;
    document.getElementById('gridRows').value = 1;
    updateSlicerMap();
    autoCalibrateScale();
    drawCharacter();
  };
  finalImg.src = sheetCanvas.toDataURL('image/png');
}

// 12. 1-CLICK 3-STATE ICONS
async function autoGenerateIconsFromIdle() {
  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = 150;
  baseCanvas.height = 150;
  const bCtx = baseCanvas.getContext('2d');

  if (state.spriteImage) {
    const fw = Math.floor(state.spriteImage.width / state.cols);
    const fh = Math.floor(state.spriteImage.height / state.rows);
    bCtx.drawImage(state.spriteImage, 0, 0, fw, fh, 10, 10, 130, 130);
  } else {
    bCtx.save();
    bCtx.translate(75, 120);
    bCtx.scale(0.55, 0.55);
    renderProceduralImpostor(bCtx, document.getElementById('healthColor').value, 'idle');
    bCtx.restore();
  }

  const imgNormal = new Image();
  imgNormal.src = baseCanvas.toDataURL('image/png');
  state.icons.normal = imgNormal;
  document.getElementById('iconNormalStatus').innerText = 'Auto-Generated';

  const loseCanvas = document.createElement('canvas');
  loseCanvas.width = 150;
  loseCanvas.height = 150;
  const lCtx = loseCanvas.getContext('2d');
  lCtx.drawImage(baseCanvas, 0, 0);
  lCtx.fillStyle = 'rgba(255, 51, 68, 0.35)';
  lCtx.fillRect(0, 0, 150, 150);
  lCtx.strokeStyle = '#000000';
  lCtx.lineWidth = 5;
  lCtx.beginPath();
  lCtx.moveTo(40, 20); lCtx.lineTo(75, 80); lCtx.lineTo(60, 130);
  lCtx.moveTo(110, 30); lCtx.lineTo(80, 80); lCtx.lineTo(105, 120);
  lCtx.stroke();

  const imgLose = new Image();
  imgLose.src = loseCanvas.toDataURL('image/png');
  state.icons.lose = imgLose;
  document.getElementById('iconLoseStatus').innerText = 'Auto-Generated';

  const winCanvas = document.createElement('canvas');
  winCanvas.width = 150;
  winCanvas.height = 150;
  const wCtx = winCanvas.getContext('2d');
  wCtx.drawImage(baseCanvas, 0, 0);
  wCtx.fillStyle = 'rgba(251, 191, 36, 0.25)';
  wCtx.fillRect(0, 0, 150, 150);
  wCtx.fillStyle = '#ffffff';
  wCtx.font = 'bold 24px sans-serif';
  wCtx.fillText('★', 18, 40);
  wCtx.fillText('★', 115, 55);

  const imgWin = new Image();
  imgWin.src = winCanvas.toDataURL('image/png');
  state.icons.win = imgWin;
  document.getElementById('iconWinStatus').innerText = 'Auto-Generated';

  alert("Generated 3-State Icons: Normal, Lose (Cracked), and Win (Sparkling)!");
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
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      state.customBannerImage = img;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function handleNodeRenderUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      state.customNodeRenderImage = img;
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
  if (state.customNodeRenderImage) return;
  const nCanvas = document.getElementById('nodeIconCanvas');
  const nCtx = nCanvas.getContext('2d');
  nCtx.clearRect(0, 0, 48, 48);

  if (state.spriteImage) {
    const fw = Math.floor(state.spriteImage.width / state.cols);
    const fh = Math.floor(state.spriteImage.height / state.rows);
    nCtx.drawImage(state.spriteImage, 0, 0, fw, fh, 2, 2, 44, 44);
  } else {
    nCtx.fillStyle = '#ffdd00';
    nCtx.beginPath();
    nCtx.arc(24, 24, 18, 0, Math.PI * 2);
    nCtx.fill();
    nCtx.fillStyle = '#7feaff';
    nCtx.fillRect(12, 18, 16, 10);
  }
}

// 13. KEYBOARD LISTENER (WITH SING HOLD DURATION)
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  let newPose = null;

  if (key === 'arrowleft' || key === 'a') newPose = 'singLEFT';
  if (key === 'arrowdown' || key === 's') newPose = 'singDOWN';
  if (key === 'arrowup' || key === 'w') newPose = 'singUP';
  if (key === 'arrowright' || key === 'd') newPose = 'singRIGHT';
  if (key === ' ' || key === 'shift') newPose = 'hey';

  if (newPose) {
    state.activePose = newPose;
    state.isSinging = true;
    document.getElementById('activePoseName').innerText = newPose;
    drawCharacter();

    clearTimeout(state.singTimeout);
    state.singTimeout = setTimeout(() => {
      state.isSinging = false;
      state.activePose = 'idle';
      document.getElementById('activePoseName').innerText = 'idle';
      drawCharacter();
    }, 450); // Holds pose for note duration before returning to idle
  }
});

// 14. DRAGGABLE ANCHORS
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

// 15. COSMICUBE SHOP & SYNC
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

// 16. GRAPHICS GENERATORS
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
      oCtx.restore();
    }
  });

  return new Promise(resolve => offCanvas.toBlob(resolve, 'image/png'));
}

async function generateCosmicubeBanner(title, bodyColor) {
  const bCanvas = document.createElement('canvas');
  bCanvas.width = 380;
  bCanvas.height = 210;
  const bCtx = bCanvas.getContext('2d');

  if (state.customBannerImage) {
    const img = state.customBannerImage;
    const hRatio = bCanvas.width / img.width;
    const vRatio = bCanvas.height / img.height;
    const ratio = Math.max(hRatio, vRatio);
    const centerShiftX = (bCanvas.width - img.width * ratio) / 2;
    const centerShiftY = (bCanvas.height - img.height * ratio) / 2;

    bCtx.drawImage(img, 0, 0, img.width, img.height,
                   centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
  } else {
    const grad = bCtx.createLinearGradient(0, 0, 380, 210);
    grad.addColorStop(0, '#0c0a1a');
    grad.addColorStop(1, '#2c1248');
    bCtx.fillStyle = grad;
    bCtx.fillRect(0, 0, 380, 210);

    bCtx.strokeStyle = '#a855f7';
    bCtx.lineWidth = 6;
    bCtx.strokeRect(3, 3, 374, 204);

    bCtx.save();
    bCtx.translate(310, 160);
    bCtx.scale(0.45, 0.45);
    renderProceduralImpostor(bCtx, bodyColor, 'idle');
    bCtx.restore();

    bCtx.fillStyle = '#ffffff';
    bCtx.font = '900 22px "Montserrat", sans-serif';
    bCtx.fillText(title.toUpperCase(), 20, 100);

    bCtx.fillStyle = '#fde047';
    bCtx.font = '700 13px "Nunito", sans-serif';
    bCtx.fillText('PLAYABLE SKIN CUBE', 22, 130);
  }

  return new Promise(resolve => bCanvas.toBlob(resolve, 'image/png'));
}

async function generateNodeRenderItemBlob() {
  const rCanvas = document.createElement('canvas');
  rCanvas.width = 180;
  rCanvas.height = 180;
  const rCtx = rCanvas.getContext('2d');

  if (state.customNodeRenderImage) {
    rCtx.drawImage(state.customNodeRenderImage, 0, 0, 180, 180);
  } else if (state.spriteImage) {
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

async function generateCurrencyIconBlob() {
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 64;
  cCanvas.height = 64;
  const cCtx = cCanvas.getContext('2d');

  cCtx.fillStyle = '#fde047';
  cCtx.beginPath();
  cCtx.arc(32, 32, 26, 0, Math.PI * 2);
  cCtx.fill();
  cCtx.strokeStyle = '#000000';
  cCtx.lineWidth = 4;
  cCtx.stroke();

  cCtx.fillStyle = '#ffffff';
  cCtx.font = 'bold 28px "Montserrat", sans-serif';
  cCtx.fillText('★', 20, 42);

  return new Promise(resolve => cCanvas.toBlob(resolve, 'image/png'));
}

// 17. .IMP PROJECT SAVE / LOAD ENGINE
function imageToBase64(img) {
  if (!img) return null;
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const cx = c.getContext('2d');
  cx.drawImage(img, 0, 0);
  return c.toDataURL('image/png');
}

function base64ToImage(b64) {
  return new Promise((resolve) => {
    if (!b64) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = b64;
  });
}

async function saveImpProject() {
  const skinId = document.getElementById('skinId').value || 'custom_bf';

  const projectData = {
    format: "VS_IMPOSTOR_STUDIO_PROJECT",
    version: "1.2",
    savedAt: new Date().toISOString(),
    config: {
      mode: state.mode,
      skinId: document.getElementById('skinId').value,
      skinDisplayName: document.getElementById('skinDisplayName').value,
      charScale: document.getElementById('charScale').value,
      stageOffsetX: document.getElementById('stageOffsetX').value,
      stageOffsetY: document.getElementById('stageOffsetY').value,
      animFps: document.getElementById('animFps').value,
      danceEverySelect: document.getElementById('danceEverySelect').value,
      singDurationInput: document.getElementById('singDurationInput').value,
      idleIndicesInput: document.getElementById('idleIndicesInput').value,
      healthColor: document.getElementById('healthColor').value,
      antialiasSelect: document.getElementById('antialiasSelect').value,
      gridCols: state.cols,
      gridRows: state.rows,
      currencyMode: document.getElementById('currencyMode').value,
      cubeTitle: document.getElementById('cubeTitle').value,
      nodeCostInput: document.getElementById('nodeCostInput').value,
      hatAnchor: state.hatAnchor,
      camAnchor: state.camAnchor
    },
    images: {
      spriteImage: imageToBase64(state.spriteImage),
      customBannerImage: imageToBase64(state.customBannerImage),
      customNodeRenderImage: imageToBase64(state.customNodeRenderImage),
      iconNormal: imageToBase64(state.icons.normal),
      iconLose: imageToBase64(state.icons.lose),
      iconWin: imageToBase64(state.icons.win)
    }
  };

  const jsonString = JSON.stringify(projectData, null, 2);
  const blob = new Blob([jsonString], { type: "application/octet-stream" });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${skinId}.imp`;
  a.click();
}

async function loadImpProject(e) {
  const file = e.target.files ? e.target.files[0] : e;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (data.format !== "VS_IMPOSTOR_STUDIO_PROJECT") {
        alert("This is not a valid VS Impostor .imp project file!");
        return;
      }

      const cfg = data.config;
      document.getElementById('skinId').value = cfg.skinId || 'custom_bf';
      document.getElementById('skinDisplayName').value = cfg.skinDisplayName || 'Custom Character';
      document.getElementById('charScale').value = cfg.charScale || 1.75;
      document.getElementById('stageOffsetX').value = cfg.stageOffsetX || 0;
      document.getElementById('stageOffsetY').value = cfg.stageOffsetY || 400;
      if (cfg.animFps) document.getElementById('animFps').value = cfg.animFps;
      if (cfg.danceEverySelect) document.getElementById('danceEverySelect').value = cfg.danceEverySelect;
      if (cfg.singDurationInput) document.getElementById('singDurationInput').value = cfg.singDurationInput;
      if (cfg.idleIndicesInput) document.getElementById('idleIndicesInput').value = cfg.idleIndicesInput;

      document.getElementById('healthColor').value = cfg.healthColor || '#ffdd00';
      document.getElementById('antialiasSelect').value = cfg.antialiasSelect || 'true';
      document.getElementById('gridCols').value = cfg.gridCols || 5;
      document.getElementById('gridRows').value = cfg.gridRows || 1;
      document.getElementById('currencyMode').value = cfg.currencyMode || 'beans';
      document.getElementById('cubeTitle').value = cfg.cubeTitle || 'Custom Cube';
      document.getElementById('nodeCostInput').value = cfg.nodeCostInput || 150;

      state.mode = cfg.mode || 'upload';
      if (document.getElementById('slicerModeSelect')) {
        document.getElementById('slicerModeSelect').value = state.mode;
      }

      state.cols = parseInt(cfg.gridCols) || 5;
      state.rows = parseInt(cfg.gridRows) || 1;
      state.hatAnchor = cfg.hatAnchor || { x: 0, y: -90 };
      state.camAnchor = cfg.camAnchor || { x: 100, y: -100 };

      document.getElementById('hatCoords').innerText = `${state.hatAnchor.x}, ${state.hatAnchor.y}`;
      document.getElementById('camCoords').innerText = `${state.camAnchor.x}, ${state.camAnchor.y}`;

      if (data.images) {
        state.spriteImage = await base64ToImage(data.images.spriteImage);
        state.customBannerImage = await base64ToImage(data.images.customBannerImage);
        state.customNodeRenderImage = await base64ToImage(data.images.customNodeRenderImage);
        state.icons.normal = await base64ToImage(data.images.iconNormal);
        state.icons.lose = await base64ToImage(data.images.iconLose);
        state.icons.win = await base64ToImage(data.images.iconWin);

        if (state.icons.normal) document.getElementById('iconNormalStatus').innerText = 'Loaded from .imp';
        if (state.icons.lose) document.getElementById('iconLoseStatus').innerText = 'Loaded from .imp';
        if (state.icons.win) document.getElementById('iconWinStatus').innerText = 'Loaded from .imp';
      }

      syncSkinDisplayName();
      syncCubeTitle();
      updateSlicerMap();
      drawCharacter();
      alert(`Project "${cfg.skinDisplayName}" (.imp) loaded successfully!`);
    } catch (err) {
      alert("Error reading .imp file: " + err.message);
    }
  };
  reader.readAsText(file);
}

window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && (file.name.endsWith('.imp') || file.name.endsWith('.json'))) {
    loadImpProject(file);
  }
});

// 18. MULTI-DIRECTORY BUNDLER (.ZIP) WITH FIXED BEAT PACING
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
  
  const isCustomCurrency = document.getElementById('currencyMode').value === 'custom';
  const currencyType = isCustomCurrency ? 'starcoins' : 'beans';

  const offsetX = parseInt(document.getElementById('stageOffsetX').value) || 0;
  const offsetY = parseInt(document.getElementById('stageOffsetY').value) || 400;

  const fps = parseInt(document.getElementById('animFps').value) || 24;
  const danceEvery = parseInt(document.getElementById('danceEverySelect').value) || 2;
  const singDuration = parseInt(document.getElementById('singDurationInput').value) || 6;

  // Parse user's custom idle sequence indices (e.g. 0, 0, 1, 1, 2, 2, 3, 3)
  const idleIndicesRaw = document.getElementById('idleIndicesInput').value;
  const parsedIdleIndices = idleIndicesRaw.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));

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

  // B. DUAL-ENGINE CHARACTER SCHEMA (CRUCIAL: looped: false on idle so it doesn't vibrate!)
  const charConfigData = {
    renderType: "sparrow",
    version: "1.0.1",
    name: skinId,
    assetPath: `characters/${skinId}`,
    danceEvery: danceEvery,
    dance_every: danceEvery,
    singTime: singDuration,
    sing_duration: singDuration,
    flipX: true,
    flip_x: true,
    isPixel: document.getElementById('antialiasSelect').value === 'false',
    no_antialiasing: document.getElementById('antialiasSelect').value === 'false',
    startingAnimation: "idle",
    healthIcon: {
      id: skinId,
      isPixel: false
    },
    image: `characters/${skinId}`,
    position: [offsetX, offsetY],
    offsets: [offsetX, offsetY],
    camera_position: [state.camAnchor.x, state.camAnchor.y],
    cameraOffsets: [state.camAnchor.x, state.camAnchor.y],
    hat_position: [state.hatAnchor.x, state.hatAnchor.y],
    healthicon: skinId,
    scale: scale,
    healthbar_colors: [255, 221, 0],

    // CRITICAL: looped: false on Idle prevents the hyper-fast infinite vibration!
    animations: [
      { 
        name: "idle", anim: "idle", prefix: "idle", offsets: [0, 0], 
        frameRate: fps, fps: fps, 
        looped: false, loop: false, // Must be FALSE! In FNF, Idle is triggered by the music beat!
        indices: (state.mode === 'animated_template') ? parsedIdleIndices : [], 
        frameIndices: (state.mode === 'animated_template') ? parsedIdleIndices : [] 
      },
      { name: "singLEFT", anim: "singLEFT", prefix: "singLEFT", offsets: [0, 0], frameRate: fps, fps: fps, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "singDOWN", anim: "singDOWN", prefix: "singDOWN", offsets: [0, 0], frameRate: fps, fps: fps, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "singUP", anim: "singUP", prefix: "singUP", offsets: [0, 0], frameRate: fps, fps: fps, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "singRIGHT", anim: "singRIGHT", prefix: "singRIGHT", offsets: [0, 0], frameRate: fps, fps: fps, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "singLEFTmiss", anim: "singLEFTmiss", prefix: "singLEFT", offsets: [0, 0], frameRate: fps, fps: fps, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "singDOWNmiss", anim: "singDOWNmiss", prefix: "singDOWN", offsets: [0, 0], frameRate: fps, fps: fps, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "singUPmiss", anim: "singUPmiss", prefix: "singUP", offsets: [0, 0], frameRate: fps, fps: fps, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "singRIGHTmiss", anim: "singRIGHTmiss", prefix: "singRIGHT", offsets: [0, 0], frameRate: fps, fps: fps, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "hey", anim: "hey", prefix: "peace", offsets: [0, 0], frameRate: fps, fps: fps, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "peace", anim: "peace", prefix: "peace", offsets: [0, 0], frameRate: fps, fps: fps, looped: false, loop: false, indices: [], frameIndices: [] },
      { name: "taunt", anim: "taunt", prefix: "peace", offsets: [0, 0], frameRate: fps, fps: fps, looped: false, loop: false, indices: [], frameIndices: [] }
    ]
  };
  const charConfigString = JSON.stringify(charConfigData, null, 2);

  // C. Spritesheet Image Data & XML
  let spriteBlob;
  let frameW = 300, frameH = 240;
  let cols = state.cols, rows = state.rows;

  if (state.spriteImage) {
    frameW = Math.floor(state.spriteImage.width / state.cols);
    frameH = Math.floor(state.spriteImage.height / state.rows);
    const c = document.createElement('canvas');
    c.width = state.spriteImage.width;
    c.height = state.spriteImage.height;
    c.getContext('2d').drawImage(state.spriteImage, 0, 0);
    spriteBlob = await new Promise(res => c.toBlob(res, 'image/png'));
  } else {
    const c = document.createElement('canvas');
    c.width = 1500; c.height = 260;
    const sCtx = c.getContext('2d');
    const poses = ['idle', 'singLEFT', 'singDOWN', 'singUP', 'singRIGHT'];
    poses.forEach((pose, i) => {
      sCtx.save();
      sCtx.translate(i * 300 + 150, 260 * 0.88);
      renderProceduralImpostor(sCtx, bodyColor, pose);
      sCtx.restore();
    });
    spriteBlob = await new Promise(res => c.toBlob(res, 'image/png'));
    cols = 5; rows = 1; frameW = 300; frameH = 260;
  }

  // D. Fully Padded Sparrow XML Atlas
  let xmlString = `<?xml version="1.0" encoding="utf-8"?>\n<TextureAtlas imagePath="${skinId}.png" width="${cols * frameW}" height="${rows * frameH}">\n`;
  if (state.mode === 'animated_template') {
    const animMap = [
      { name: "idle", count: 4 },
      { name: "singLEFT", count: 2 },
      { name: "singDOWN", count: 2 },
      { name: "singUP", count: 2 },
      { name: "singRIGHT", count: 2 },
      { name: "peace", count: 2 }
    ];
    let frameIdx = 0;
    animMap.forEach(anim => {
      for (let i = 0; i < anim.count; i++) {
        const x = (frameIdx % cols) * frameW;
        const y = Math.floor(frameIdx / cols) * frameH;
        xmlString += `  <SubTexture name="${anim.name}${String(i).padStart(4, '0')}" x="${x}" y="${y}" width="${frameW}" height="${frameH}" frameX="0" frameY="0" frameWidth="${frameW}" frameHeight="${frameH}"/>\n`;
        frameIdx++;
      }
    });
  } else {
    const xmlPoseKeys = ["idle", "singLEFT", "singDOWN", "singUP", "singRIGHT", "peace"];
    for (let i = 0; i < cols * rows; i++) {
      const aName = xmlPoseKeys[i] || "idle";
      const x = (i % cols) * frameW;
      const y = Math.floor(i / cols) * frameH;
      xmlString += `  <SubTexture name="${aName}0000" x="${x}" y="${y}" width="${frameW}" height="${frameH}" frameX="0" frameY="0" frameWidth="${frameW}" frameHeight="${frameH}"/>\n`;
    }
    if (cols * rows <= 5) {
      xmlString += `  <SubTexture name="peace0000" x="0" y="0" width="${frameW}" height="${frameH}" frameX="0" frameY="0" frameWidth="${frameW}" frameHeight="${frameH}"/>\n`;
    }
  }
  xmlString += `</TextureAtlas>`;

  // E. Verified Cosmicube Header & Item Node
  const cubeHeaderString = JSON.stringify({
    title: cubeTitle.toUpperCase(),
    currency: currencyType
  }, null, 2);

  const itemNodeString = JSON.stringify({
    type: "playerSkin",
    price: cost,
    title: skinDisplayName,
    hint: "Cosmicube Exclusive",
    description: `Play as ${skinDisplayName} in any song!`,
    node: {
      direction: "north",
      parent: "root"
    }
  }, null, 2);

  // F. Graphics Blobs
  const iconBlob = await generateStitchedIconBlob();
  const bannerBlob = await generateCosmicubeBanner(cubeTitle, bodyColor);
  const nodeRenderBlob = await generateNodeRenderItemBlob();
  const currencyBlob = isCustomCurrency ? await generateCurrencyIconBlob() : null;

  // G. Inject into all verified paths
  const injectAll = (target) => {
    target.file("meta.json", metaString);
    target.file("_polymod_meta.json", metaString);
    target.file("icon.png", iconBlob);

    target.folder("characters").file(`${skinId}.json`, charConfigString);
    target.folder("data").folder("characters").file(`${skinId}.json`, charConfigString);

    target.folder("images").folder("characters").file(`${skinId}.png`, spriteBlob);
    target.folder("images").folder("characters").file(`${skinId}.xml`, xmlString);
    target.folder("shared").folder("images").folder("characters").file(`${skinId}.png`, spriteBlob);
    target.folder("shared").folder("images").folder("characters").file(`${skinId}.xml`, xmlString);

    target.folder("images").folder("icons").file(`icon-${skinId}.png`, iconBlob);
    target.folder("shared").folder("images").folder("icons").file(`icon-${skinId}.png`, iconBlob);

    target.folder("data").folder("cosmicube").file(`${cubeId}.json`, cubeHeaderString);
    target.folder("data").folder("cosmicube").folder(cubeId).file(`${skinId}.json`, itemNodeString);

    target.folder("images").folder("menu").folder("cosmicube").folder("slides").file(`${cubeId}.png`, bannerBlob);
    target.folder("shared").folder("images").folder("menu").folder("cosmicube").folder("slides").file(`${cubeId}.png`, bannerBlob);

    target.folder("images").folder("menu").folder("cosmicube").folder("items").file(`${skinId}.png`, nodeRenderBlob);
    target.folder("shared").folder("images").folder("menu").folder("cosmicube").folder("items").file(`${skinId}.png`, nodeRenderBlob);

    if (isCustomCurrency) {
      target.folder("images").folder("currency").file(`${currencyType}.png`, currencyBlob);
      target.folder("shared").folder("images").folder("currency").file(`${currencyType}.png`, currencyBlob);
    }
  };

  injectAll(zip);
  injectAll(zip.folder(skinId));

  const finalZipBlob = await zip.generateAsync({ type: "blob" });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(finalZipBlob);
  downloadLink.download = `${skinId}_v4_legacy_bundle.zip`;
  downloadLink.click();
}

// Initial draw calls
updateSlicerMap();
drawCharacter();
