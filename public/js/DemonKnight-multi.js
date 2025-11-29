// Parse URL parameters
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    sessionId: params.get('sessionId'),
    userId: params.get('userId'),
    username: params.get('username'),
  };
}

const { sessionId, userId, username } = getUrlParams();
const token = localStorage.getItem('token');

if (!sessionId || !userId || !username) {
  alert('Missing session or user info! Redirecting to lobby.');
  window.location.href = '/lobby.html';
}

document.getElementById("sessionId").textContent = sessionId;

// Socket setup force to use IPv4
const socket = io('http://127.0.0.1:3000', {
  transports: ['websocket', 'polling'],
});

// Game state received from server
const gameState = {
  players: [],
  projectiles: []
};

socket.on('connect', () => {
  console.log('Connected as', socket.id);
  socket.emit('joinGame', { sessionId, token });
});

socket.on('gameOver', ({ winnerId, username, reason }) => {
  console.log(`Game Over! Winner: ${username} (${winnerId}), Reason: ${reason}`);
  stopGameLoop();
  showGameOverScreen(username);
});

socket.on('stateUpdate', (data) => {
  gameState.players = data.players || [];
  gameState.projectiles = data.projectiles || [];
  
  const playerListHTML = gameState.players
    .map(p => `<li>${p.username} - HP: ${p.health}</li>`)
    .join('');
  document.getElementById("playerList").innerHTML = playerListHTML;
});

// ========== FIXED INPUT MANAGEMENT ==========
let keysDown = {};
let actionKeys = {}; // Separate tracking for action keys

document.addEventListener('keydown', (e) => {
  const wasUp = !keysDown[e.key];
  keysDown[e.key] = true;
  
  // Mark action keys as "just pressed" only on initial press
  if (wasUp && ['w', 'z', 'x', 'c', 'Shift', 'f'].includes(e.key)) {
    actionKeys[e.key] = true;
  }
});

document.addEventListener('keyup', (e) => {
  keysDown[e.key] = false;
  actionKeys[e.key] = false;
});

// Send input to server
function sendInput() {
  const input = {
    left: keysDown['a'] || false,
    right: keysDown['d'] || false,
    jump: actionKeys['w'] || false,
    crouch: keysDown['s'] || false,
    attack: actionKeys['z'] || false,
    attack2: actionKeys['x'] || false,
    combo: actionKeys['c'] || false,
    dash: actionKeys['Shift'] || false,
    fire: actionKeys['f'] || false,
  };

  socket.emit('playerInput', input);

  // Clear action keys AFTER sending (server will read them before next tick)
  // Movement keys stay held down
  Object.keys(actionKeys).forEach(key => {
    if (actionKeys[key]) {
      actionKeys[key] = false;
    }
  });
}

// (matches server tick rate)
setInterval(sendInput, 50);

// ========== CANVAS & RENDERING ==========
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight* dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 
}
resizeCanvas();

window.addEventListener('resize', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// Sprite loading
const loadImage = (path) => {
  const img = new Image();
  img.src = path;
  return img;
};

const playerSprites = {
  idle: loadImage('/FreeKnight_v1/_Idle.png'),
  walk: loadImage('/FreeKnight_v1/_Run.png'),
  slide: loadImage('/FreeKnight_v1/_SlideFull.png'),
  attack: loadImage('/FreeKnight_v1/_Attack.png'),
  attack2: loadImage('/FreeKnight_v1/_Attack2.png'),
  crouchAttack: loadImage('/FreeKnight_v1/_CrouchAttack.png'),
  crouch: loadImage('/FreeKnight_v1/_Crouch.png'),
  combo: loadImage('/FreeKnight_v1/_AttackCombo2hit.png'),
  dash: loadImage('/FreeKnight_v1/_Dash.png'),
  death: loadImage('/FreeKnight_v1/_Death.png'),
  hit: loadImage('/FreeKnight_v1/_Hit.png'),
  jump: loadImage('/FreeKnight_v1/_Jump.png'),
  fall: loadImage('/FreeKnight_v1/_JumpFallInBetween.png'),
  slide: loadImage('/FreeKnight_v1/_SlideFull.png'),
};

// Projectile sprite (placeholder)
const projectileSprite = (() => {
  const dummy = document.createElement("canvas");
  dummy.width = 128;
  dummy.height = 32;
  const dCtx = dummy.getContext("2d");
  dCtx.fillStyle = "red";
  for (let i = 0; i < 4; i++) {
    dCtx.fillRect(i * 32, 0, 32, 32);
  }
  return dummy;
})();

// Drawing functions
function drawPlayer(ctx, player) {
  const sprite = playerSprites[player.currentAnim] || playerSprites.idle;
  const frameWidth = 120;
  const frameHeight = 80;
  const scale = 2; // ← ADD SCALING
  const frameIndex = player.frameIndex || 0;
  const sx = frameIndex * frameWidth;
  
  // Calculate draw position (center the sprite on the player position)
  const dWidth = frameWidth * scale;
  const dHeight = frameHeight * scale;
  const dx = player.x - dWidth / 2;
  const dy = player.y - dHeight; // ← Anchor at feet, not center

  ctx.save();
 if (player.direction === 'left') {
  // Flip horizontally around the sprite center
  ctx.translate(player.x, player.y - dHeight / 2);
  ctx.scale(-1, 1);
  ctx.translate(-player.x, -(player.y - dHeight / 2));
}

ctx.drawImage(sprite, sx, 0, frameWidth, frameHeight, dx, dy, dWidth, dHeight);

ctx.restore();

  // Draw username and health bar
  drawHealthBar(ctx, player);
  
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(player.username || 'Player', player.x, dy + 50);
}

function drawHealthBar(ctx, player) {
  const barWidth = 100;
  const barHeight = 10;
  const x = player.x - barWidth / 2;
  const y = player.y - 85;

  ctx.fillStyle = 'gray';
  ctx.fillRect(x, y, barWidth, barHeight);

  ctx.fillStyle = 'limegreen';
  const healthWidth = Math.max(0, (player.health / 10000) * barWidth);
  ctx.fillRect(x, y, healthWidth, barHeight);

  ctx.strokeStyle = 'black';
  ctx.strokeRect(x, y, barWidth, barHeight);
}

function drawProjectile(ctx, projectile) {
  const { x, y, dead, width = 40, height = 40 } = projectile;

  if (!Number.isFinite(x) || !Number.isFinite(y)) return;

  const t = Date.now() / 120; // animation speed factor
  const centerY = y - height / 2;
  const baseRadius = 15;

  // Dragon energy aura radius pulsation
  const auraRadius = baseRadius + Math.sin(t) * 5;

  // Radial gradient for fiery glowing aura: bright orange to transparent
  const gradient = ctx.createRadialGradient(x, centerY, 2, x, centerY, auraRadius);
  gradient.addColorStop(0, 'rgba(255, 140, 0, 0.9)');   // intense orange glow center
  gradient.addColorStop(0.4, 'rgba(255, 69, 0, 0.7)');  // dark orange outer glow
  gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');      // transparent edges

  ctx.save();
  ctx.globalAlpha = dead ? 0.4 : 1;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, centerY, auraRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Sharp pulsating outline to simulate crackling energy edges
  ctx.save();
  ctx.strokeStyle = `rgba(255, 69, 0, ${0.6 + 0.4 * Math.sin(t * 4)})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, centerY, auraRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  
}


// Game loop
let isPause = false;
let isGame = true;

function gameLoop() {
  if (!isPause && isGame) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log('Players count:', gameState.players.length);
    // Draw all players
    gameState.players.forEach(p => {
      if (!p.dead) drawPlayer(ctx, p);
    });

    // Draw all projectiles
    gameState.projectiles.forEach(proj => {
      drawProjectile(ctx, proj);
    });
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// Game end handlers
function stopGameLoop() {
  isGame = false;
}

function showGameOverScreen(winnerUsername) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'gold';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${winnerUsername} Wins!`, canvas.width / 2, canvas.height / 2);
  
  ctx.font = '24px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText('Returning to lobby...', canvas.width / 2, canvas.height / 2 + 50);
  
  setTimeout(() => {
    window.location.href = '/lobby.html';
  }, 5000);
}