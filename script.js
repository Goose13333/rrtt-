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
  width: 40,
  height: 46,
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

// Двойной прыжок
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

  if (type > 0.72 && score > 100) {
    // Летающий кибер-дрон
    obstacles.push({
      kind: 'drone',
      x: canvas.width + 20,
      y: groundY - 76,
      width: 38,
      height: 24
    });
  } else {
    // Кактус
    const isTall = Math.random() > 0.5;
    obstacles.push({
      kind: 'cactus',
      x: canvas.width + 20,
      y: groundY - (isTall ? 52 : 38),
      width: 28,
      height: isTall ? 52 : 38
    });
  }
}

// Прорисованный пиксельный динозавр с анимацией ног
function drawPlayer() {
  const x = player.x;
  const y = player.y;

  ctx.fillStyle = '#10b981';

  // Хвост
  ctx.fillRect(x, y + 20, 8, 12);
  ctx.fillRect(x + 4, y + 16, 6, 16);

  // Туловище и шея
  ctx.fillRect(x + 10, y + 14, 18, 22);
  ctx.fillRect(x + 18, y + 6, 10, 12);

  // Голова и морда
  ctx.fillRect(x + 18, y, 22, 12);
  ctx.fillRect(x + 30, y + 12, 8, 3); // нижняя челюсть

  // Маленькая лапка спереди
  ctx.fillRect(x + 28, y + 20, 6, 4);

  // Глаз
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 24, y + 3, 4, 4);

  // Анимация бегущих ног
  ctx.fillStyle = '#10b981';
  if (!player.grounded) {
    // В прыжке обе ноги поджаты
    ctx.fillRect(x + 12, y + 36, 5, 8);
    ctx.fillRect(x + 21, y + 36, 5, 8);
  } else {
    // На земле ноги по очереди шагают каждые 8 кадров
    const step = Math.floor(frameCount / 8) % 2 === 0;
    ctx.fillRect(x + 12, y + 36, 5, step ? 10 : 5);
    ctx.fillRect(x + 21, y + 36, 5, step ? 5 : 10);
  }
}

// Прорисованные кактусы и дроны
function drawObstacle(obs) {
  const x = obs.x;
  const y = obs.y;

  if (obs.kind === 'cactus') {
    ctx.fillStyle = '#22c55e';
    // Центральный ствол
    ctx.fillRect(x + 10, y, 8, obs.height);
    // Левая ветка
    ctx.fillRect(x + 2, y + 12, 8, 5);
    ctx.fillRect(x + 2, y + 6, 5, 11);
    // Правая ветка
    ctx.fillRect(x + 18, y + 16, 8, 5);
    ctx.fillRect(x + 21, y + 8, 5, 13);

    // Иголки (светлые точки)
    ctx.fillStyle = '#bbf7d0';
    ctx.fillRect(x + 12, y + 6, 2, 2);
    ctx.fillRect(x + 14, y + 20, 2, 2);
  } else {
    // Летающий дрон
    ctx.fillStyle = '#f59e0b';
    // Корпус
    ctx.fillRect(x + 6, y + 8, 26, 12);
    ctx.fillRect(x + 12, y + 4, 14, 4);

    // Красный сканер (глаз)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 8, y + 11, 6, 5);

    // Вращающийся винт сверху (меняет ширину каждый кадр)
    ctx.fillStyle = '#94a3b8';
    const bladeWidth = frameCount % 4 < 2 ? 36 : 12;
    ctx.fillRect(x + (obs.width - bladeWidth) / 2, y, bladeWidth, 3);
  }
}

function update() {
  if (!isRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  frameCount++;

  // Линия земли и мелкие камушки
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

    drawObstacle(obs);

    // Проверка столкновения (с небольшим отступом для честности)
    if (
      player.x + 6 < obs.x + obs.width - 4 &&
      player.x + player.width - 6 > obs.x + 4 &&
      player.y + 4 < obs.y + obs.height - 4 &&
      player.y + player.height - 4 > obs.y + 4
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
