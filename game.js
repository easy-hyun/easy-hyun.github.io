(() => {
  const canvas = document.querySelector('#snake-canvas');
  const snakeStart = document.querySelector('#snake-start');
  const snakePause = document.querySelector('#snake-pause');
  const snakeRestart = document.querySelector('#snake-restart');
  const snakeScore = document.querySelector('#snake-score');
  const snakeHighScore = document.querySelector('#snake-high-score');
  const snakeStatus = document.querySelector('#snake-status');
  const directionButtons = document.querySelectorAll('[data-direction]');

  if (!canvas || !snakeStart || !snakePause || !snakeRestart) return;

  const context = canvas.getContext('2d');
  const cellSize = 21;
  const gridSize = canvas.width / cellSize;
  const initialSnake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  const directions = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  let snake = [...initialSnake];
  let food = { x: 15, y: 10 };
  let bomb = null;
  let direction = directions.right;
  let nextDirection = direction;
  let timerId = null;
  let score = 0;
  let running = false;
  let paused = false;
  let highScore = Number.parseInt(localStorage.getItem('jh-snake-high-score') || '0', 10);
  snakeHighScore.textContent = String(highScore);

  function setStatus(message) { snakeStatus.textContent = message; }
  function speedForScore() { return Math.max(55, 120 - Math.floor(score / 30) * 12); }
  function restartSnakeTimer() { if (timerId) clearInterval(timerId); timerId = setInterval(tickSnake, speedForScore()); }
  function resetSnake() {
    if (timerId) clearInterval(timerId);
    timerId = null; snake = [...initialSnake]; direction = directions.right; nextDirection = direction; food = { x: 15, y: 10 }; bomb = null; score = 0; running = false; paused = false;
    snakeScore.textContent = '0'; snakePause.disabled = true; snakePause.textContent = '일시정지'; snakeStart.disabled = false; drawSnake(); setStatus('시작 버튼을 눌러 게임을 시작하세요.');
  }
  function startSnake() {
    if (running && !paused) return;
    if (!running) { running = true; setStatus('게임 진행 중'); }
    paused = false; snakePause.disabled = false; snakePause.textContent = '일시정지'; snakeStart.disabled = true;
    restartSnakeTimer();
  }
  function togglePause() {
    if (!running) return;
    paused = !paused;
    if (paused) { clearInterval(timerId); timerId = null; snakePause.textContent = '계속하기'; setStatus('일시정지'); }
    else { setStatus('게임 진행 중'); snakePause.textContent = '일시정지'; restartSnakeTimer(); }
  }
  function setDirection(name) {
    const candidate = directions[name];
    if (!candidate || (candidate.x + direction.x === 0 && candidate.y + direction.y === 0)) return;
    nextDirection = candidate;
  }
  function placeFood() {
    do { food = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) }; }
    while (snake.some((part) => part.x === food.x && part.y === food.y));
  }
  function placeBomb() {
    do { bomb = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) }; }
    while (snake.some((part) => part.x === bomb.x && part.y === bomb.y) || (bomb.x === food.x && bomb.y === food.y));
  }
  function tickSnake() {
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    const hitWall = head.x < 0 || head.y < 0 || head.x >= gridSize || head.y >= gridSize;
    const hitSelf = snake.some((part) => part.x === head.x && part.y === head.y);
    const hitBomb = bomb && head.x === bomb.x && head.y === bomb.y;
    if (hitWall || hitSelf || hitBomb) { endSnake(hitBomb ? '폭탄을 밟았습니다' : '게임 오버'); return; }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) { score += 10; snakeScore.textContent = String(score); if (score > highScore) { highScore = score; localStorage.setItem('jh-snake-high-score', String(highScore)); snakeHighScore.textContent = String(highScore); } placeFood(); if (score >= 20 && (score % 30 === 0 || Math.random() < 0.35)) placeBomb(); restartSnakeTimer(); } else snake.pop();
    drawSnake();
  }
  function endSnake(reason = '게임 오버') {
    clearInterval(timerId); timerId = null; running = false; paused = false; snakePause.disabled = true; snakeStart.disabled = false; setStatus(`${reason} · 점수 ${score}`); drawSnake(true);
  }
  function drawSnake(gameOver = false) {
    context.fillStyle = '#0a0d0d'; context.fillRect(0, 0, canvas.width, canvas.height); context.strokeStyle = '#151a1b';
    for (let i = 0; i <= gridSize; i += 1) { context.beginPath(); context.moveTo(i * cellSize, 0); context.lineTo(i * cellSize, canvas.height); context.stroke(); context.beginPath(); context.moveTo(0, i * cellSize); context.lineTo(canvas.width, i * cellSize); context.stroke(); }
    context.fillStyle = '#ffbd55'; context.fillRect(food.x * cellSize + 4, food.y * cellSize + 4, cellSize - 8, cellSize - 8);
    if (bomb) {
      const trapX = bomb.x * cellSize + cellSize / 2;
      const trapY = bomb.y * cellSize + cellSize / 2;
      const pulse = 0.82 + Math.sin(Date.now() / 140) * 0.12;
      context.save();
      context.shadowColor = '#d66bff';
      context.shadowBlur = 12;
      context.fillStyle = `rgba(214, 107, 255, ${pulse})`;
      context.beginPath();
      context.arc(trapX, trapY, cellSize / 2 - 3, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      context.strokeStyle = '#f3c7ff';
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(trapX, trapY - 9); context.lineTo(trapX + 4, trapY - 5);
      context.lineTo(trapX + 8, trapY - 7); context.lineTo(trapX + 6, trapY - 2);
      context.moveTo(trapX - 9, trapY + 1); context.lineTo(trapX - 6, trapY - 3);
      context.lineTo(trapX - 8, trapY - 8); context.moveTo(trapX - 6, trapY + 7);
      context.lineTo(trapX - 2, trapY + 9); context.moveTo(trapX + 5, trapY + 8);
      context.lineTo(trapX + 9, trapY + 4); context.stroke();
      context.fillStyle = '#ffffff';
      context.beginPath();
      context.moveTo(trapX + 1, trapY - 8); context.lineTo(trapX - 3, trapY + 1);
      context.lineTo(trapX + 1, trapY); context.lineTo(trapX - 1, trapY + 8);
      context.lineTo(trapX + 6, trapY - 3); context.lineTo(trapX + 2, trapY - 2);
      context.closePath(); context.fill();
      context.restore();
    }
    snake.forEach((part, index) => { context.fillStyle = gameOver ? '#6d4545' : index === 0 ? '#b8f28e' : '#72bd54'; context.fillRect(part.x * cellSize + 2, part.y * cellSize + 2, cellSize - 4, cellSize - 4); });
  }
  const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
  document.addEventListener('keydown', (event) => { const name = keyMap[event.key]; if (name) { event.preventDefault(); setDirection(name); } if (event.key === ' ' && running) { event.preventDefault(); togglePause(); } });
  directionButtons.forEach((button) => button.addEventListener('click', () => setDirection(button.dataset.direction)));
  snakeStart.addEventListener('click', startSnake); snakePause.addEventListener('click', togglePause); snakeRestart.addEventListener('click', resetSnake); resetSnake();

  const symbols = ['🍒', '🍋', '🔔', 'BAR', '777'];
  const payout = { '🍒': 'SMALL WIN', '🍋': 'SMALL WIN', '🔔': 'WIN', BAR: 'BIG WIN', '777': 'JACKPOT' };
  const reels = [1, 2, 3].map((number) => document.querySelector(`#slot-reel-${number}`));
  const slotStart = document.querySelector('#slot-start'); const slotStatus = document.querySelector('#slot-status'); const slotResult = document.querySelector('#slot-result');
  let slotTimer = null; let stopTimers = []; let slotSpinning = false;
  function finishSlot() { const result = reels.map((reel) => reel.textContent); const won = result.every((symbol) => symbol === result[0]); slotResult.textContent = won ? `${payout[result[0]]} · ${result.join(' ')}` : `${result.join(' ')} · 다음 기회에!`; slotStatus.textContent = won ? (result[0] === '777' ? 'JACKPOT!' : 'WIN') : 'TRY AGAIN'; slotSpinning = false; slotStart.disabled = false; }
  function spinSlot() {
    if (slotSpinning) return; slotSpinning = true; slotStart.disabled = true; slotStatus.textContent = 'SPINNING'; slotResult.textContent = '릴이 순서대로 멈춥니다.'; reels.forEach((reel) => reel.classList.add('is-spinning')); if (slotTimer) clearInterval(slotTimer); stopTimers.forEach((timer) => clearTimeout(timer)); stopTimers = [];
    slotTimer = setInterval(() => reels.forEach((reel) => { reel.textContent = symbols[Math.floor(Math.random() * symbols.length)]; }), 80);
    [900, 1500, 2100].forEach((delay, index) => { stopTimers.push(setTimeout(() => { reels[index].classList.remove('is-spinning'); reels[index].textContent = symbols[Math.floor(Math.random() * symbols.length)]; if (index === reels.length - 1) { clearInterval(slotTimer); slotTimer = null; finishSlot(); } }, delay)); });
  }
  if (slotStart) slotStart.addEventListener('click', spinSlot);
})();
