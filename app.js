/**
 * VS Impostor V4 Legacy - Playable Skin Studio Core Engine
 * Complete with Multi-Character Manager, Interactive Drag & Drop Cosmicube Graph,
 * and .imp Project Serialization.
 */

// 1. GLOBAL STATE
const state = {
  mode: 'upload',
  activePose: 'idle',
  idleFrameTick: 0,
  isSinging: false,
  singTimeout: null,

  // MULTI-CHARACTER ROSTER
  characters: [
    {
      skinId: 'bf_star_impostor',
      skinDisplayName: 'Star Impostor',
      charScale: 1.75,
      stageOffsetX: 0,
      stageOffsetY: 400,
      healthColor: '#ffdd00',
      cols: 5,
      rows: 1,
      rawSpriteFile: null,
      spriteImage: null,
      customNodeRenderImage: null,
      icons: { normal: null, lose: null, win: null },
      hatAnchor: { x: 0, y: -90 },
      camAnchor: { x: 100, y: -100 }
    }
  ],
  activeCharIndex: 0,

  // DRAGGABLE COSMICUBE NODE GRAPH
  cosmicubeNodes: [
    { id: 'root', title: 'Start', cost: 0, type: 'start', parent: null, direction: null, x: 220, y: 260, charRef: '' },
    { id: 'bf_star_impostor', title: 'Star Impostor', cost: 150, type: 'playerSkin', parent: 'root', direction: 'north', x: 220, y: 120, charRef: 'bf_star_impostor' }
  ],
  selectedNodeId: 'bf_star_impostor',

  customBannerImage: null,
  looseFrames: { idle: null, left: null, down: null, up: null, right: null }
};

const poseLabels = ["IDLE", "LEFT", "DOWN", "UP", "RIGHT", "HEY / PEACE", "IDLE 2", "IDLE 3"];

function getCurrentChar() {
  return state.characters[state.activeCharIndex] || state.characters[0];
}

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

  if (tabId === 'cosmic') {
    renderDraggableNodeBoard();
  }
}

// 4. MULTI-CHARACTER ROSTER CONTROLLER
function renderRosterTabs() {
  const container = document.getElementById('rosterTabs');
  container.innerHTML = '';

  state.characters.forEach((char, idx) => {
    const tab = document.createElement('div');
    tab.className = `roster-tab ${idx === state.activeCharIndex ? 'active' : ''}`;
    tab.innerHTML = `<span>🧑‍🚀 ${char.skinDisplayName}</span>`;
    tab.onclick = () => selectCharacter(idx);
    container.appendChild(tab);
  });
}

function selectCharacter(idx) {
  state.activeCharIndex = idx;
  const char = getCurrentChar();

  document.getElementById('skinId').value = char.skinId;
  document.getElementById('skinDisplayName').value = char.skinDisplayName;
  document.getElementById('charScale').value = char.charScale;
  document.getElementById('stageOffsetX').value = char.stageOffsetX;
  document.getElementById('stageOffsetY').value = char.stageOffsetY;
  document.getElementById('healthColor').value = char.healthColor;
  document.getElementById('gridCols').value = char.cols;
  document.getElementById('gridRows').value = char.rows;

  document.getElementById('hatCoords').innerText = `${char.hatAnchor.x}, ${char.hatAnchor.y}`;
  document.getElementById('camCoords').innerText = `${char.camAnchor.x}, ${char.camAnchor.y}`;

  renderRosterTabs();
  updateSlicerMap();
  drawCharacter();
}

function addNewCharacter() {
  const newIdx = state.characters.length + 1;
  const newChar = {
    skinId: `custom_char_${newIdx}`,
    skinDisplayName: `Character ${newIdx}`,
    charScale: 1.75,
    stageOffsetX: 0,
    stageOffsetY: 400,
    healthColor: '#ff3344',
    cols: 5,
    rows: 1,
    rawSpriteFile: null,
    spriteImage: null,
    customNodeRenderImage: null,
    icons: { normal: null, lose: null, win: null },
    hatAnchor: { x: 0, y: -90 },
    camAnchor: { x: 100, y: -100 }
  };

  state.characters.push(newChar);
  selectCharacter(state.characters.length - 1);
  updateNodeCharDropdown();
}

function updateCurrentCharacterProp(prop, val) {
  const char = getCurrentChar();
  if (char) {
    char[prop] = val;
    if (prop === 'skinDisplayName') renderRosterTabs();
  }
}

// 5. DRAGGABLE COSMICUBE NODE GRAPH CONTROLLER
function renderDraggableNodeBoard() {
  const layer = document.getElementById('nodesLayer');
  layer.innerHTML = '';

  state.cosmicubeNodes.forEach(node => {
    const el = document.createElement('div');
    el.className = `board-node ${node.id === state.selectedNodeId ? 'selected' : ''}`;
    el.id = `nodeEl_${node.id}`;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;

    let iconHtml = '<span style="font-size:1.4rem;">🏁</span>';
    if (node.type === 'playerSkin') {
      iconHtml = '<span style="font-size:1.4rem;">🧑‍🚀</span>';
    } else if (node.type === 'pet') {
      iconHtml = '<span style="font-size:1.4rem;">🐕</span>';
    } else if (node.type === 'hat') {
      iconHtml = '<span style="font-size:1.4rem;">🎩</span>';
    }

    el.innerHTML = `
      ${iconHtml}
      <div class="node-cost-tag">${node.cost > 0 ? node.cost : 'FREE'}</div>
    `;

    // Click to Inspect
    el.onmousedown = (e) => {
      e.stopPropagation();
      selectCosmicubeNode(node.id);
      startNodeDrag(node, el, e);
    };

    layer.appendChild(el);
  });

  drawNodeConnectionLines();
  populateNodeInspector();
}

function drawNodeConnectionLines() {
  const svg = document.getElementById('nodeLinesSvg');
  svg.innerHTML = '';

  state.cosmicubeNodes.forEach(node => {
    if (node.parent) {
      const parentNode = state.cosmicubeNodes.find(n => n.id === node.parent);
      if (parentNode) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', parentNode.x + 38);
        line.setAttribute('y1', parentNode.y + 38);
        line.setAttribute('x2', node.x + 38);
        line.setAttribute('y2', node.y + 38);
        line.setAttribute('stroke', '#5b3a8a');
        line.setAttribute('stroke-width', '4');
        line.setAttribute('stroke-dasharray', '6 4');
        svg.appendChild(line);
      }
    }
  });
}

function startNodeDrag(node, el, e) {
  const board = document.getElementById('nodeBoardContainer');
  const boardRect = board.getBoundingClientRect();
  let startX = e.clientX - node.x;
  let startY = e.clientY - node.y;

  function onMouseMove(moveEvent) {
    let newX = moveEvent.clientX - startX;
    let newY = moveEvent.clientY - startY;

    // Bounds limit
    newX = Math.max(10, Math.min(boardRect.width - 86, newX));
    newY = Math.max(10, Math.min(boardRect.height - 86, newY));

    node.x = Math.round(newX);
    node.y = Math.round(newY);

    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;

    drawNodeConnectionLines();
  }

  function onMouseUp() {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function selectCosmicubeNode(id) {
  state.selectedNodeId = id;
  document.querySelectorAll('.board-node').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById(`nodeEl_${id}`);
  if (el) el.classList.add('selected');
  populateNodeInspector();
}

function populateNodeInspector() {
  const node = state.cosmicubeNodes.find(n => n.id === state.selectedNodeId) || state.cosmicubeNodes[0];
  if (!node) return;

  document.getElementById('nodeIdInput').value = node.id;
  document.getElementById('nodeNameInput').value = node.title;
  document.getElementById('nodeCostInput').value = node.cost;
  document.getElementById('nodeTypeSelect').value = node.type || 'playerSkin';
  document.getElementById('nodeDirSelect').value = node.direction || 'north';

  updateNodeParentDropdown(node);
  updateNodeCharDropdown(node);
}

function updateNodeParentDropdown(currentNode) {
  const select = document.getElementById('nodeParentSelect');
  select.innerHTML = '';

  state.cosmicubeNodes.forEach(n => {
    if (n.id !== currentNode.id) {
      const opt = document.createElement('option');
      opt.value = n.id;
      opt.innerText = `${n.title} (${n.id})`;
      if (currentNode.parent === n.id) opt.selected = true;
      select.appendChild(opt);
    }
  });
}

function updateNodeCharDropdown(currentNode) {
  const select = document.getElementById('nodeCharSelect');
  select.innerHTML = '<option value="">(None / Cosmetic)</option>';

  state.characters.forEach(char => {
    const opt = document.createElement('option');
    opt.value = char.skinId;
    opt.innerText = `${char.skinDisplayName} (${char.skinId})`;
    if (currentNode && currentNode.charRef === char.skinId) opt.selected = true;
    select.appendChild(opt);
  });
}

function updateSelectedNodeProp(prop, val) {
  const node = state.cosmicubeNodes.find(n => n.id === state.selectedNodeId);
  if (node) {
    node[prop] = val;
    renderDraggableNodeBoard();
  }
}

function addNewCosmicubeNode() {
  const nodeNum = state.cosmicubeNodes.length + 1;
  const parent = state.selectedNodeId || 'root';
  const parentNode = state.cosmicubeNodes.find(n => n.id === parent) || state.cosmicubeNodes[0];

  const newNode = {
    id: `item_node_${nodeNum}`,
    title: `Reward ${nodeNum}`,
    cost: 150,
    type: 'playerSkin',
    parent: parent,
    direction: 'north',
    x: Math.min(450, parentNode.x + 90),
    y: Math.max(30, parentNode.y - 40),
    charRef: ''
  };

  state.cosmicubeNodes.push(newNode);
  selectCosmicubeNode(newNode.id);
  renderDraggableNodeBoard();
}

function deleteSelectedNode() {
  if (state.selectedNodeId === 'root') {
    alert("Cannot delete the root starting node!");
    return;
  }
  state.cosmicubeNodes = state.cosmicubeNodes.filter(n => n.id !== state.selectedNodeId);
  selectCosmicubeNode('root');
  renderDraggableNodeBoard();
}

// 6. ANIMATED TEMPLATE GENERATOR
async function generateAnimatedTemplateImage(bodyColor) {
  const sheet = document.createElement('canvas');
  const fw = 300, fh = 260;
  sheet.width = fw * 7;
  sheet.height = fh * 2;
  const sCtx = sheet.getContext('2d');

  const idleBops = [0, -6, -12, -4];
  idleBops.forEach((offsetY, i) => {
    sCtx.save();
    sCtx.translate(i * fw + fw / 2, fh * 0.88 + offsetY);
    renderProceduralImpostor(sCtx, bodyColor, 'idle', i * 0.05);
    sCtx.restore();
  });

  [0, 1].forEach((sub, i) => {
    sCtx.save();
    sCtx.translate((4 + i) * fw + fw / 2, fh * 0.88);
    renderProceduralImpostor(sCtx, bodyColor, 'singLEFT', sub * 0.04);
    sCtx.restore();
  });

  sCtx.save();
  sCtx.translate(6 * fw + fw / 2, fh * 0.88);
  renderProceduralImpostor(sCtx, bodyColor, 'singDOWN', 0);
  sCtx.restore();

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

function switchSlicerMode(mode) {
  state.mode = mode;
  document.getElementById('customUploadSection').style.display = (mode === 'upload') ? 'block' : 'none';
  document.getElementById('loosePngsSection').style.display = (mode === 'loose_pngs') ? 'block' : 'none';

  const char = getCurrentChar();

  if (mode === 'animated_template') {
    char.cols = 7;
    char.rows = 2;
    document.getElementById('gridCols').value = 7;
    document.getElementById('gridRows').value = 2;
    generateAnimatedTemplateImage(char.healthColor).then(img => {
      char.spriteImage = img;
      updateSlicerMap();
      autoCalibrateScale();
      drawCharacter();
    });
  } else if (mode === 'static_template') {
    char.cols = 5;
    char.rows = 1;
    document.getElementById('gridCols').value = 5;
    document.getElementById('gridRows').value = 1;
    char.spriteImage = null;
    updateSlicerMap();
    autoCalibrateScale();
    drawCharacter();
  } else if (mode === 'upload') {
    char.cols = parseInt(document.getElementById('gridCols').value) || 5;
    char.rows = parseInt(document.getElementById('gridRows').value) || 1;
    updateSlicerMap();
    drawCharacter();
  }
}

// 7. LABELED SPRITESHEET SLICER VIEWER
const slicerCanvas = document.getElementById('slicerCanvas');
const slCtx = slicerCanvas.getContext('2d');

function updateSlicerMap() {
  const char = getCurrentChar();
  const img = char.spriteImage;
  const cols = char.cols;
  const rows = char.rows;

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
}

// 8. STAGE SIMULATOR
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
  const char = getCurrentChar();

  const bgType = document.getElementById('stageBgSelect') ? document.getElementById('stageBgSelect').value : 'mira';
  drawStageBackground(ctx, bgType);

  const antialias = document.getElementById('antialiasSelect').value === 'true';
  ctx.imageSmoothingEnabled = antialias;

  const scale = parseFloat(char.charScale) || 1.75;
  const color = char.healthColor || '#ffdd00';
  const groundY = charCanvas.height * 0.78;

  ctx.save();
  ctx.translate(charCanvas.width / 2, groundY);
  ctx.scale(scale, scale);

  if (char.spriteImage) {
    const frameW = char.spriteImage.width / char.cols;
    const frameH = char.spriteImage.height / char.rows;
    
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
    
    const col = frameIndex % char.cols;
    const row = Math.floor(frameIndex / char.cols) % char.rows;
    const sx = col * frameW;
    const sy = row * frameH;

    ctx.drawImage(char.spriteImage, sx, sy, frameW, frameH, -frameW / 2, -frameH, frameW, frameH);
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

// 9. CONDUCTOR BEAT TICKER
let beatTimer = 0;
function stageAnimationLoop(time) {
  if (time - beatTimer > 500) {
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

// 10. AUTO-CALIBRATE TO IMPOSTOR HEIGHT
function autoCalibrateScale() {
  const char = getCurrentChar();
  let currentHeight = 240;
  if (char.spriteImage) {
    currentHeight = Math.floor(char.spriteImage.height / char.rows);
  }
  const calculatedScale = (380 / currentHeight).toFixed(2);
  char.charScale = calculatedScale;
  document.getElementById('charScale').value = calculatedScale;
  drawCharacter();
}

// 11. FILE UPLOAD HANDLERS
function handleSpriteUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const char = getCurrentChar();
  char.rawSpriteFile = file;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      char.spriteImage = img;
      updateSlicerMap();
      autoCalibrateScale();
      drawCharacter();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function updateGridSlices() {
  const char = getCurrentChar();
  char.cols = parseInt(document.getElementById('gridCols').value) || 5;
  char.rows = parseInt(document.getElementById('gridRows').value) || 1;
  updateSlicerMap();
  drawCharacter();
}

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
    const char = getCurrentChar();
    char.spriteImage = finalImg;
    char.cols = 5;
    char.rows = 1;
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
  const char = getCurrentChar();
  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = 150;
  baseCanvas.height = 150;
  const bCtx = baseCanvas.getContext('2d');

  if (char.spriteImage) {
    const fw = Math.floor(char.spriteImage.width / char.cols);
    const fh = Math.floor(char.spriteImage.height / char.rows);
    bCtx.drawImage(char.spriteImage, 0, 0, fw, fh, 10, 10, 130, 130);
  } else {
    bCtx.save();
    bCtx.translate(75, 120);
    bCtx.scale(0.55, 0.55);
    renderProceduralImpostor(bCtx, char.healthColor, 'idle');
    bCtx.restore();
  }

  const imgNormal = new Image();
  imgNormal.src = baseCanvas.toDataURL('image/png');
  char.icons.normal = imgNormal;
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
  char.icons.lose = imgLose;
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
  char.icons.win = imgWin;
  document.getElementById('iconWinStatus').innerText = 'Auto-Generated';

  alert(`Generated 3-State Icons for "${char.skinDisplayName}"!`);
}

function handleIconUpload(slot, e) {
  const file = e.target.files[0];
  if (!file) return;

  const char = getCurrentChar();
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      char.icons[slot] = img;
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

  const char = getCurrentChar();
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      char.customNodeRenderImage = img;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// 13. KEYBOARD LISTENER
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
    }, 450);
  }
});

// 14. DRAGGABLE ANCHORS
function setupDraggableAnchor(elementId, coordDisplayId, anchorProp) {
  const el = document.getElementById(elementId);
  const container = document.getElementById('stageCanvasContainer');
  let dragging = false;

  el.addEventListener('mousedown', () => dragging = true);
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const char = getCurrentChar();
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    el.style.left = `${x - 25}px`;
    el.style.top = `${y - 12}px`;

    const relX = Math.round(x - rect.width / 2);
    const relY = Math.round(y - rect.height * 0.78);
    char[anchorProp].x = relX;
    char[anchorProp].y = relY;

    document.getElementById(coordDisplayId).innerText = `${relX}, ${relY}`;
  });
  window.addEventListener('mouseup', () => dragging = false);
}

setupDraggableAnchor('hatMarker', 'hatCoords', 'hatAnchor');
setupDraggableAnchor('camMarker', 'camCoords', 'camAnchor');

document.getElementById('hatMarker').style.left = '46%';
document.getElementById('hatMarker').style.top = '22%';
document.getElementById('camMarker').style.left = '58%';
document.getElementById('camMarker').style.top = '45%';

// 15. COSMICUBE SHOP & SYNC
function syncSkinDisplayName() {
  const char = getCurrentChar();
  const node = state.cosmicubeNodes.find(n => n.id === state.selectedNodeId);
  if (node && node.id === char.skinId) {
    node.title = char.skinDisplayName;
    document.getElementById('nodeNameInput').value = char.skinDisplayName;
    renderDraggableNodeBoard();
  }
}

function syncCubeTitle() {
  const title = document.getElementById('cubeTitle').value || 'Star Crewmate Cube';
  document.getElementById('bannerTitle').innerText = title;
}

function toggleCurrency(mode) {
  document.getElementById('currencyBadge').innerText = mode === 'beans' ? '5,000 Beans' : '1,500 Mod Pods';
}

// 16. GRAPHICS GENERATORS
async function generateStitchedIconBlobForChar(char) {
  const offCanvas = document.createElement('canvas');
  offCanvas.width = 450;
  offCanvas.height = 150;
  const oCtx = offCanvas.getContext('2d');

  const slots = [char.icons.normal, char.icons.lose, char.icons.win];
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

async function generateNodeRenderItemBlobForChar(char) {
  const rCanvas = document.createElement('canvas');
  rCanvas.width = 180;
  rCanvas.height = 180;
  const rCtx = rCanvas.getContext('2d');

  if (char.customNodeRenderImage) {
    rCtx.drawImage(char.customNodeRenderImage, 0, 0, 180, 180);
  } else if (char.spriteImage) {
    const fw = Math.floor(char.spriteImage.width / char.cols);
    const fh = Math.floor(char.spriteImage.height / char.rows);
    rCtx.drawImage(char.spriteImage, 0, 0, fw, fh, 10, 10, 160, 160);
  } else {
    rCtx.save();
    rCtx.translate(90, 140);
    rCtx.scale(0.6, 0.6);
    renderProceduralImpostor(rCtx, char.healthColor || '#ffdd00', 'idle');
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

// 17. .IMP PROJECT SERIALIZATION (Full Roster + Node Graph)
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
  const primaryChar = state.characters[0] || {};
  const skinId = primaryChar.skinId || 'custom_bf';

  const serializedCharacters = state.characters.map(c => ({
    skinId: c.skinId,
    skinDisplayName: c.skinDisplayName,
    charScale: c.charScale,
    stageOffsetX: c.stageOffsetX,
    stageOffsetY: c.stageOffsetY,
    healthColor: c.healthColor,
    cols: c.cols,
    rows: c.rows,
    hatAnchor: c.hatAnchor,
    camAnchor: c.camAnchor,
    spriteImageBase64: imageToBase64(c.spriteImage),
    customNodeRenderBase64: imageToBase64(c.customNodeRenderImage),
    iconNormal: imageToBase64(c.icons.normal),
    iconLose: imageToBase64(c.icons.lose),
    iconWin: imageToBase64(c.icons.win)
  }));

  const projectData = {
    format: "VS_IMPOSTOR_STUDIO_PROJECT",
    version: "2.0",
    savedAt: new Date().toISOString(),
    config: {
      mode: state.mode,
      animFps: document.getElementById('animFps').value,
      danceEverySelect: document.getElementById('danceEverySelect').value,
      singDurationInput: document.getElementById('singDurationInput').value,
      idleIndicesInput: document.getElementById('idleIndicesInput').value,
      antialiasSelect: document.getElementById('antialiasSelect').value,
      currencyMode: document.getElementById('currencyMode').value,
      cubeTitle: document.getElementById('cubeTitle').value,
      customBannerBase64: imageToBase64(state.customBannerImage)
    },
    characters: serializedCharacters,
    cosmicubeNodes: state.cosmicubeNodes
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

      const cfg = data.config || {};
      if (cfg.animFps) document.getElementById('animFps').value = cfg.animFps;
      if (cfg.danceEverySelect) document.getElementById('danceEverySelect').value = cfg.danceEverySelect;
      if (cfg.singDurationInput) document.getElementById('singDurationInput').value = cfg.singDurationInput;
      if (cfg.idleIndicesInput) document.getElementById('idleIndicesInput').value = cfg.idleIndicesInput;
      if (cfg.antialiasSelect) document.getElementById('antialiasSelect').value = cfg.antialiasSelect;
      if (cfg.currencyMode) document.getElementById('currencyMode').value = cfg.currencyMode;
      if (cfg.cubeTitle) document.getElementById('cubeTitle').value = cfg.cubeTitle;

      if (cfg.customBannerBase64) {
        state.customBannerImage = await base64ToImage(cfg.customBannerBase64);
      }

      // Rehydrate Characters Roster
      if (data.characters && data.characters.length > 0) {
        state.characters = await Promise.all(data.characters.map(async c => ({
          skinId: c.skinId || 'custom_bf',
          skinDisplayName: c.skinDisplayName || 'Custom Character',
          charScale: c.charScale || 1.75,
          stageOffsetX: c.stageOffsetX || 0,
          stageOffsetY: c.stageOffsetY || 400,
          healthColor: c.healthColor || '#ffdd00',
          cols: c.cols || 5,
          rows: c.rows || 1,
          hatAnchor: c.hatAnchor || { x: 0, y: -90 },
          camAnchor: c.camAnchor || { x: 100, y: -100 },
          rawSpriteFile: null,
          spriteImage: await base64ToImage(c.spriteImageBase64),
          customNodeRenderImage: await base64ToImage(c.customNodeRenderBase64),
          icons: {
            normal: await base64ToImage(c.iconNormal),
            lose: await base64ToImage(c.iconLose),
            win: await base64ToImage(c.iconWin)
          }
        })));
      }

      // Rehydrate Cosmicube Nodes
      if (data.cosmicubeNodes && data.cosmicubeNodes.length > 0) {
        state.cosmicubeNodes = data.cosmicubeNodes;
      }

      selectCharacter(0);
      syncCubeTitle();
      renderRosterTabs();
      renderDraggableNodeBoard();
      alert(`Project (.imp) with ${state.characters.length} character(s) loaded successfully!`);
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

// 18. MULTI-CHARACTER & MULTI-NODE BUNDLER (.ZIP)
async function bundleModZip() {
  const zip = new JSZip();
  const primaryChar = state.characters[0] || {};
  const cubeTitle = document.getElementById('cubeTitle').value || 'Custom Cube';
  const cubeId = cubeTitle.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const bodyColor = primaryChar.healthColor || '#ff3344';

  const isCustomCurrency = document.getElementById('currencyMode').value === 'custom';
  const currencyType = isCustomCurrency ? 'starcoins' : 'beans';

  const fps = parseInt(document.getElementById('animFps').value) || 24;
  const danceEvery = parseInt(document.getElementById('danceEverySelect').value) || 2;
  const singDuration = parseInt(document.getElementById('singDurationInput').value) || 6;
  const idleIndicesRaw = document.getElementById('idleIndicesInput').value;
  const parsedIdleIndices = idleIndicesRaw.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));

  // A. Engine Metadata
  const metaData = {
    name: primaryChar.skinId,
    title: cubeTitle,
    description: `Mod pack featuring ${state.characters.length} playable character(s) and Cosmicube.`,
    author: "Impostor Modder",
    version: "1.0.0",
    mod_version: "1.0.0",
    api_version: "0.1.0",
    global: false,
    color: [255, 43, 61],
    icon: "icon.png"
  };

  const metaString = JSON.stringify(metaData, null, 2);

  // B. Cosmicube Header
  const cubeHeaderString = JSON.stringify({
    title: cubeTitle.toUpperCase(),
    currency: currencyType
  }, null, 2);

  const bannerBlob = await generateCosmicubeBanner(cubeTitle, bodyColor);
  const currencyBlob = isCustomCurrency ? await generateCurrencyIconBlob() : null;
  const primaryIconBlob = await generateStitchedIconBlobForChar(primaryChar);

  // Common Multi-Directory Injector
  const injectTarget = (target) => {
    target.file("meta.json", metaString);
    target.file("_polymod_meta.json", metaString);
    target.file("icon.png", primaryIconBlob);

    // Cosmicube Header
    target.folder("data").folder("cosmicube").file(`${cubeId}.json`, cubeHeaderString);

    // Slide Banner
    target.folder("images").folder("menu").folder("cosmicube").folder("slides").file(`${cubeId}.png`, bannerBlob);
    target.folder("shared").folder("images").folder("menu").folder("cosmicube").folder("slides").file(`${cubeId}.png`, bannerBlob);

    if (isCustomCurrency) {
      target.folder("images").folder("currency").file(`${currencyType}.png`, currencyBlob);
      target.folder("shared").folder("images").folder("currency").file(`${currencyType}.png`, currencyBlob);
    }
  };

  injectTarget(zip);
  injectTarget(zip.folder(primaryChar.skinId));

  // C. COMPILE ALL CHARACTERS IN ROSTER
  for (const char of state.characters) {
    const sId = char.skinId.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const scale = parseFloat(char.charScale) || 1.75;

    // Character Config JSON
    const charConfigData = {
      renderType: "sparrow",
      version: "1.0.1",
      name: sId,
      assetPath: `characters/${sId}`,
      danceEvery: danceEvery,
      dance_every: danceEvery,
      singTime: singDuration,
      sing_duration: singDuration,
      flipX: true,
      flip_x: true,
      isPixel: document.getElementById('antialiasSelect').value === 'false',
      no_antialiasing: document.getElementById('antialiasSelect').value === 'false',
      startingAnimation: "idle",
      healthIcon: { id: sId, isPixel: false },
      image: `characters/${sId}`,
      position: [char.stageOffsetX, char.stageOffsetY],
      offsets: [char.stageOffsetX, char.stageOffsetY],
      camera_position: [char.camAnchor.x, char.camAnchor.y],
      cameraOffsets: [char.camAnchor.x, char.camAnchor.y],
      hat_position: [char.hatAnchor.x, char.hatAnchor.y],
      healthicon: sId,
      scale: scale,
      healthbar_colors: [255, 221, 0],

      animations: [
        { 
          name: "idle", anim: "idle", prefix: "idle", offsets: [0, 0], 
          frameRate: fps, fps: fps, looped: false, loop: false, 
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

    // Spritesheet PNG & XML
    let spriteBlob;
    let frameW = 300, frameH = 240;
    let cols = char.cols, rows = char.rows;

    if (char.spriteImage) {
      frameW = Math.floor(char.spriteImage.width / char.cols);
      frameH = Math.floor(char.spriteImage.height / char.rows);
      const c = document.createElement('canvas');
      c.width = char.spriteImage.width; c.height = char.spriteImage.height;
      c.getContext('2d').drawImage(char.spriteImage, 0, 0);
      spriteBlob = await new Promise(res => c.toBlob(res, 'image/png'));
    } else {
      const c = document.createElement('canvas');
      c.width = 1500; c.height = 260;
      const sCtx = c.getContext('2d');
      const poses = ['idle', 'singLEFT', 'singDOWN', 'singUP', 'singRIGHT'];
      poses.forEach((pose, i) => {
        sCtx.save();
        sCtx.translate(i * 300 + 150, 260 * 0.88);
        renderProceduralImpostor(sCtx, char.healthColor || '#ff3344', pose);
        sCtx.restore();
      });
      spriteBlob = await new Promise(res => c.toBlob(res, 'image/png'));
      cols = 5; rows = 1; frameW = 300; frameH = 260;
    }

    let xmlString = `<?xml version="1.0" encoding="utf-8"?>\n<TextureAtlas imagePath="${sId}.png" width="${cols * frameW}" height="${rows * frameH}">\n`;
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
    xmlString += `</TextureAtlas>`;

    const charIconBlob = await generateStitchedIconBlobForChar(char);
    const charNodeRenderBlob = await generateNodeRenderItemBlobForChar(char);

    // Multi-Directory Injection for Character
    const injectChar = (t) => {
      t.folder("characters").file(`${sId}.json`, charConfigString);
      t.folder("data").folder("characters").file(`${sId}.json`, charConfigString);

      t.folder("images").folder("characters").file(`${sId}.png`, spriteBlob);
      t.folder("images").folder("characters").file(`${sId}.xml`, xmlString);
      t.folder("shared").folder("images").folder("characters").file(`${sId}.png`, spriteBlob);
      t.folder("shared").folder("images").folder("characters").file(`${sId}.xml`, xmlString);

      t.folder("images").folder("icons").file(`icon-${sId}.png`, charIconBlob);
      t.folder("shared").folder("images").folder("icons").file(`icon-${sId}.png`, charIconBlob);

      t.folder("images").folder("menu").folder("cosmicube").folder("items").file(`${sId}.png`, charNodeRenderBlob);
      t.folder("shared").folder("images").folder("menu").folder("cosmicube").folder("items").file(`${sId}.png`, charNodeRenderBlob);
    };

    injectChar(zip);
    injectChar(zip.folder(primaryChar.skinId));
  }

  // D. COMPILE ALL COSMICUBE BRANCH NODES
  for (const node of state.cosmicubeNodes) {
    if (node.id === 'root') continue;

    const nodeConfig = {
      type: node.type || "playerSkin",
      price: node.cost || 0,
      title: node.title,
      hint: "Cosmicube Exclusive",
      description: `Unlock ${node.title} in the Cosmicube!`,
      node: {
        direction: node.direction || "north",
        parent: node.parent || "root"
      }
    };
    const nodeString = JSON.stringify(nodeConfig, null, 2);

    zip.folder("data").folder("cosmicube").folder(cubeId).file(`${node.id}.json`, nodeString);
    zip.folder(primaryChar.skinId).folder("data").folder("cosmicube").folder(cubeId).file(`${node.id}.json`, nodeString);
  }

  // Download Bundle
  const finalZipBlob = await zip.generateAsync({ type: "blob" });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(finalZipBlob);
  downloadLink.download = `${primaryChar.skinId}_v4_legacy_bundle.zip`;
  downloadLink.click();
}

// Initial draw calls
renderRosterTabs();
selectCharacter(0);
renderDraggableNodeBoard();
