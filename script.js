const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('currentScore');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySubtitle = document.getElementById('overlaySubtitle');
const startBtn = document.getElementById('startBtn');

let highScore = Number(localStorage.getItem('cyberRunnerHigh')) || 0;
highScoreEl.textContent = String(highScore).padStart(4, '0');

let isRunning = false;
let score = 0;
let gameSpeed = 4;
let frameCount = 0;
let animationId;

const player = {
  x: 70,
  y: 210,
  width: 36,
  height: 44,
  dy: 0,
  jumpForce: 13.5,
  gravity: 0.72,
  grounded: false,
  jumps: 0
};

const groundY = 254;
let obstacles = [];

// Звуковой движок
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, duration) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Двойной прыжок со звуком
function jump() {
  if (player.jumps < 2 && isRunning) {
    player.dy = -player.jumpForce;
    player.grounded = false;
    player.jumps++;
    playSound(player.jumps === 1 ? 520 : 680, 0.12);
  }
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    if (!isRunning) {
      startGame();
    } else {
      jump();
    }
  }
});

canvas.addEventListener('pointerdown', () => {
  if (isRunning) jump();
});

function startGame() {
  isRunning = true;
  score = 0;
  gameSpeed = 4;
  frameCount = 0;
  obstacles = [];
  player.y = groundY - player.height;
  player.dy = 0;
  player.grounded = true;
  player.jumps = 0;
  canvas.style.backgroundColor = '#0f172a';
  overlay.style.display = 'none';
  update();
}

function spawnObstacle() {
  const type = Math.random();

  if (type > 0.75 && score > 150) {
    obstacles.push({
      x: canvas.width + 20,
      y: groundY - 72,
      width: 34,
      height: 22,
      color: '#f59e0b'
    });
  } else {
    const isTall = Math.random() > 0.5;
    const height = isTall ? 52 : 34;
    const width = isTall ? 24 : 38;
    obstacles.push({
      x: canvas.width + 20,
      y: groundY - height,
      width: width,
      height: height,
      color: '#ef4444'
    });
  }
}

function drawPlayer() {
  ctx.fillStyle = '#10b981';
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(player.x + 22, player.y + 8, 10, 6);
}

function update() {
  if (!isRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  frameCount++;

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(canvas.width, groundY);
  ctx.stroke();

  player.dy += player.gravity;
  player.y += player.dy;

  if (player.y + player.height >= groundY) {
    player.y = groundY - player.height;
    player.dy = 0;
    player.grounded = true;
    player.jumps = 0;
  }

  drawPlayer();

  const spawnRate = Math.max(65, Math.floor(125 - gameSpeed * 3));
  if (frameCount % spawnRate === 0) {
    spawnObstacle();
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= gameSpeed;

    ctx.fillStyle = obs.color || '#ef4444';
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

    if (
      player.x < obs.x + obs.width - 4 &&
      player.x + player.width - 4 > obs.x &&
      player.y < obs.y + obs.height - 4 &&
      player.y + player.height - 4 > obs.y
    ) {
      gameOver();
      return;
    }

    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
    }
  }

  if (frameCount % 5 === 0) {
    score++;
    scoreEl.textContent = String(score).padStart(4, '0');

    if (score % 100 === 0) {
      gameSpeed += 0.25;
    }

    if (score % 600 === 300) {
      canvas.style.backgroundColor = '#1e293b';
    } else if (score % 600 === 0) {
      canvas.style.backgroundColor = '#0f172a';
    }
  }

  animationId = requestAnimationFrame(update);
}

function gameOver() {
  isRunning = false;
  cancelAnimationFrame(animationId);
  playSound(140, 0.35);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('cyberRunnerHigh', highScore);
    highScoreEl.textContent = String(highScore).padStart(4, '0');
  }

  overlayTitle.textContent = 'ИГРА ОКОНЧЕНА!';
  overlaySubtitle.innerHTML = `Твой счёт: <strong>${score}</strong> • Рекорд: <strong>${highScore}</strong>`;
  startBtn.textContent = '↻ ЕЩЁ РАЗ';
  overlay.style.display = 'flex';
}
