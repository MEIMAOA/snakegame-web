/* SnakeGame 网页试玩：经典贪吃蛇轻量复刻（独立实现，仅用于宣传体验） */
(function () {
  "use strict";

  var canvas = document.getElementById("snake");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var overlay = document.getElementById("overlay");
  var startBtn = document.getElementById("startBtn");
  var pauseBtn = document.getElementById("pauseBtn");
  var restartBtn = document.getElementById("restartBtn");

  var COLS = 24, ROWS = 24;
  var CELL = canvas.width / COLS;      // 25px
  var BASE_STEP = 130;                 // ms / 格

  var snake, dir, nextDir, food, score, alive, paused, started;
  var timer = null, lastStep = 0;
  var best = parseInt(localStorage.getItem("snakegame.best") || "0", 10);
  bestEl.textContent = best;

  var COLORS = {
    bg: "#0a0f16",
    grid: "#111a24",
    head: "#3ddc84",
    body: "#2bb673",
    food: "#ff5a5a",
    text: "#e8eef7"
  };

  function reset() {
    var mid = Math.floor(COLS / 2);
    snake = [{ x: mid, y: mid }, { x: mid - 1, y: mid }, { x: mid - 2, y: mid }];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    alive = true;
    paused = false;
    started = false;
    scoreEl.textContent = "0";
    placeFood();
    draw();
  }

  function placeFood() {
    while (true) {
      var p = { x: (Math.random() * COLS) | 0, y: (Math.random() * ROWS) | 0 };
      var hit = snake.some(function (s) { return s.x === p.x && s.y === p.y; });
      if (!hit) { food = p; return; }
    }
  }

  function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 网格
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (var i = 0; i <= COLS; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
    }

    // 食物
    ctx.fillStyle = COLORS.food;
    roundRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6, 5);

    // 蛇
    for (var k = snake.length - 1; k >= 0; k--) {
      var s = snake[k];
      ctx.fillStyle = k === 0 ? COLORS.head : COLORS.body;
      roundRect(s.x * CELL + 2, s.y * CELL + 2, CELL - 4, CELL - 4, 6);
    }
    // 眼睛
    var h = snake[0];
    ctx.fillStyle = "#07130c";
    var ex = h.x * CELL + CELL / 2, ey = h.y * CELL + CELL / 2;
    ctx.beginPath(); ctx.arc(ex - 4, ey - 2, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 4, ey - 2, 2.4, 0, Math.PI * 2); ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  function step() {
    if (!started || !alive || paused) return;

    // 吃食物
    var head = { x: snake[0].x + nextDir.x, y: snake[0].y + nextDir.y };
    dir = nextDir;

    // 撞墙
    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS) { gameOver(); return; }
    // 撞自己（尾巴会移动，忽略最后一节）
    for (var i = 0; i < snake.length - 1; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) { gameOver(); return; }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = score;
      if (score > best) {
        best = score;
        bestEl.textContent = best;
        localStorage.setItem("snakegame.best", String(best));
      }
      placeFood();
      // 每 50 分加速
      if (score % 50 === 0 && BASE_STEP > 60) BASE_STEP -= 8;
    } else {
      snake.pop();
    }
    draw();
  }

  function gameOver() {
    alive = false;
    started = false;
    stopLoop();
    overlay.classList.remove("hidden");
    overlay.querySelector("h3").textContent = "游戏结束";
    overlay.querySelector("p").textContent = "得分 " + score + " · 最高 " + best + " —— 再来一局？";
    startBtn.textContent = "再玩一次";
  }

  function startGame() {
    reset();
    started = true;
    paused = false;
    overlay.classList.add("hidden");
    startLoop();
  }

  function startLoop() {
    stopLoop();
    lastStep = performance.now();
    timer = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (timer) { cancelAnimationFrame(timer); timer = null; }
  }

  function loop(now) {
    if (!started) return;
    if (now - lastStep >= BASE_STEP) {
      lastStep = now;
      step();
    }
    if (started) timer = requestAnimationFrame(loop);
  }

  function turn(dx, dy) {
    if (!started || !alive) return;
    // 不允许 180° 反向
    if (dir.x === -dx && dir.y === -dy) return;
    if (dx !== 0 && dir.x === dx) return;
    if (dy !== 0 && dir.y === dy) return;
    nextDir = { x: dx, y: dy };
  }

  /* ---------------- 输入 ---------------- */
  document.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === "ArrowUp" || k === "w" || k === "W") { turn(0, -1); e.preventDefault(); }
    else if (k === "ArrowDown" || k === "s" || k === "S") { turn(0, 1); e.preventDefault(); }
    else if (k === "ArrowLeft" || k === "a" || k === "A") { turn(-1, 0); e.preventDefault(); }
    else if (k === "ArrowRight" || k === "d" || k === "D") { turn(1, 0); e.preventDefault(); }
    else if (k === " ") { togglePause(); e.preventDefault(); }
  });

  // 触屏滑动
  var touchStart = null;
  canvas.addEventListener("touchstart", function (e) {
    var t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener("touchend", function (e) {
    if (!touchStart) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStart.x, dy = t.clientY - touchStart.y;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) { togglePause(); }
    else if (Math.abs(dx) > Math.abs(dy)) { turn(dx > 0 ? 1 : -1, 0); }
    else { turn(0, dy > 0 ? 1 : -1); }
    touchStart = null;
    e.preventDefault();
  }, { passive: false });

  // 方向键按钮
  Array.prototype.forEach.call(document.querySelectorAll(".dpad button"), function (btn) {
    btn.addEventListener("click", function () {
      var d = btn.getAttribute("data-dir");
      if (d === "up") turn(0, -1);
      if (d === "down") turn(0, 1);
      if (d === "left") turn(-1, 0);
      if (d === "right") turn(1, 0);
    });
  });

  function togglePause() {
    if (!started) return;
    paused = !paused;
    pauseBtn.textContent = paused ? "继续" : "暂停";
    if (paused) {
      overlay.classList.remove("hidden");
      overlay.querySelector("h3").textContent = "已暂停";
      overlay.querySelector("p").textContent = "按空格或点击按钮继续";
      startBtn.textContent = "继续游戏";
    } else {
      overlay.classList.add("hidden");
      lastStep = performance.now();
    }
  }

  startBtn.addEventListener("click", function () {
    if (paused) { togglePause(); return; }
    startGame();
  });
  pauseBtn.addEventListener("click", togglePause);
  restartBtn.addEventListener("click", startGame);

  /* 进入视口后自动滚动定位到试玩区时重新计算画布尺寸（CSS 缩放，无需改内部分辨率） */
  reset();
})();
