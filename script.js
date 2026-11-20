const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('currentScore');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySubtitle = document.getElementById('overlaySubtitle');
const startBtn = document.getElementById('startBtn');

// Загружаем рекорд из памяти браузера
let highScore = Number(localStorage.getItem('cyberRunnerHigh')) || 0;
highScoreEl.textContent = String(highScore).padStart(4, '0');

// Игровые переменные
let isRunning = false;
let score = 0;
let gameSpeed = 4;
let frameCount = 0;
let animationId;

// Игрок (Дино / Кибер-бегун)
const player = {
  x: 70,
  y: 210,
  width: 36,
  height: 44,
  dy: 0,
  jumpForce: 13.5,
  gravity: 0.72,
  grounded: false,
  jumps: 0 //
};

const groundY = 254;
let obstacles = [];

// Прыжок
function jump() {
  if (player.grounded && isRunning) {
    player.dy = -player.jumpForce;
    player.grounded = false;
    player.jumps++;//
  }
}

// Управление клавиатурой и мышью/экраном
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

// Запуск / перезапуск игры
function startGame() {
  isRunning = true;
  score = 0;
  gameSpeed = 4;
  frameCount = 0;
  obstacles = [];
  player.y = groundY - player.height;
  player.dy = 0;
  player.grounded = true;
  canvas.style.backgroundColor = '#0f172a';
  overlay.style.display = 'none';
  update();
}

// Создание препятствия (кактуса / лазерного блока)
function spawnObstacle() {
  const type = Math.random();

  if (type > 0.75 && score > 150) {
    // Летающий дрон (появляется после 150 очков)
    obstacles.push({
      x: canvas.width + 20,
      y: groundY - 72, // висит в воздухе над землёй
      width: 34,
      height: 22,
      color: '#f59e0b' // оранжевый цвет
    });
  } else {
    // Обычный наземный блок
    const isTall = Math.random() > 0.5;
    const height = isTall ? 52 : 34;
    const width = isTall ? 24 : 38;
    obstacles.push({
      x: canvas.width + 20,
      y: groundY - height,
      width: width,
      height: height,
      color: '#ef4444' // красный цвет
    });
  }
}


// Отрисовка игрока
function drawPlayer() {
  // Тело
  ctx.fillStyle = '#10b981';
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Визор (глаз)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(player.x + 22, player.y + 8, 10, 6);
}

// Главный игровой цикл (60 кадров в секунду)
function update() {
  if (!isRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  frameCount++;

  // Линия земли
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(canvas.width, groundY);
  ctx.stroke();

  // Физика игрока
  player.dy += player.gravity;
  player.y += player.dy;

  if (player.y + player.height >= groundY) {
    player.y = groundY - player.height;
    player.dy = 0;
    player.grounded = true;
  }

  drawPlayer();

  // Спавн препятствий
  const spawnRate = Math.max(55, Math.floor(110 - gameSpeed * 3));
  if (frameCount % spawnRate === 0) {
    spawnObstacle();
  }

  // Движение препятствий и проверка столкновений
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= gameSpeed;

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

    // Проверка столкновения (AABB)
    if (
      player.x < obs.x + obs.width - 4 &&
      player.x + player.width - 4 > obs.x &&
      player.y < obs.y + obs.height - 4 &&
      player.y + player.height - 4 > obs.y
    ) {
      gameOver();
      return;
    }

    // Удаляем ушедшие за экран препятствия
    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
    }
  }

  // Подсчёт очков и ускорение
  if (frameCount % 5 === 0) {
    score++;
    scoreEl.textContent = String(score).padStart(4, '0');

    if (score % 100 === 0) {
      gameSpeed += 0.4;
    }

    // Смена дня и ночи каждые 300 очков
    if (score % 600 === 300) {
      canvas.style.backgroundColor = '#1e293b';
    } else if (score % 600 === 0) {
      canvas.style.backgroundColor = '#0f172a';
    }
  }

  animationId = requestAnimationFrame(update);
}

// Конец игры
function gameOver() {
  isRunning = false;
  cancelAnimationFrame(animationId);

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
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(520, 0.12) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square'; // ретро 8-битный звук
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
