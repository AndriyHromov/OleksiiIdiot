const AboutView = (() => {
  let _rafId = null;
  let _keydown = null;
  let _keyup = null;
  let _coffeeCupImage = null;

  const THEMES = {
    coffee: {
      id: 'coffee',
      title: 'Catch the Cookie',
      hint: 'Ловіть печиво чашкою з кавою. Пропустили — програш.'
    },
    tea: {
      id: 'tea',
      title: 'Catch the Lemon',
      hint: 'Ловіть лимони чашкою з зеленим чаєм. Пропустили — програш.'
    }
  };

  function _stopGame() {
    if (_rafId) {
      cancelAnimationFrame(_rafId);
      _rafId = null;
    }
    if (_keydown) {
      window.removeEventListener('keydown', _keydown);
      _keydown = null;
    }
    if (_keyup) {
      window.removeEventListener('keyup', _keyup);
      _keyup = null;
    }
  }

  function _roundedCupPath(ctx, cx, topY, botY, topRx, botRx, bulge) {
    const midY = topY + (botY - topY) * 0.48;
    ctx.beginPath();
    ctx.moveTo(cx - topRx, topY + 3);
    ctx.bezierCurveTo(
      cx - topRx * 0.5, topY - 5,
      cx + topRx * 0.5, topY - 5,
      cx + topRx, topY + 3
    );
    ctx.bezierCurveTo(
      cx + topRx + bulge, midY - 4,
      cx + botRx + bulge * 0.6, botY - 8,
      cx + botRx * 0.85, botY
    );
    ctx.bezierCurveTo(cx, botY + 7, cx, botY + 7, cx - botRx * 0.85, botY);
    ctx.bezierCurveTo(
      cx - botRx - bulge * 0.6, botY - 8,
      cx - topRx - bulge, midY - 4,
      cx - topRx, topY + 3
    );
    ctx.closePath();
  }

  function _drawSaucer(ctx, cx, saucerY, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,.06)';
    ctx.beginPath();
    ctx.ellipse(cx, saucerY + 10, w * 0.44, h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    const saucerG = ctx.createRadialGradient(cx, saucerY, 2, cx, saucerY, w * 0.5);
    saucerG.addColorStop(0, '#ffffff');
    saucerG.addColorStop(1, '#e6e6e6');
    ctx.fillStyle = saucerG;
    ctx.beginPath();
    ctx.ellipse(cx, saucerY, w * 0.48, h * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8d8d8';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.09)';
    ctx.beginPath();
    ctx.ellipse(cx, saucerY - 1, w * 0.18, h * 0.032, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ——— Coffee: PNG зображення ——— */
  function _drawCoffeeCup(ctx, box) {
    const { x, y, w, h } = box;
    
    if (_coffeeCupImage) {
      ctx.save();
      ctx.drawImage(_coffeeCupImage, x, y, w, h);
      ctx.restore();
    }
  }

  /* ——— Tea: емодзі чаю ——— */
  function _drawTeaCup(ctx, box) {
    const { x, y, w, h } = box;
    ctx.save();
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍵', x + w / 2, y + h / 2);
    ctx.restore();
  }


  function _drawCup(ctx, box, themeId) {
    if (themeId === 'tea') _drawTeaCup(ctx, box);
    else _drawCoffeeCup(ctx, box);
  }

  /* ——— Скибочка лимона з сегментами ——— */
  function _drawLemonSlice(ctx, c) {
    const r = c.r * 1.15;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot || 0);

    ctx.fillStyle = 'rgba(0,0,0,.08)';
    ctx.beginPath();
    ctx.ellipse(2, r * 0.9, r * 0.9, r * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    const rindG = ctx.createRadialGradient(0, 0, r * 0.7, 0, 0, r);
    rindG.addColorStop(0.85, '#ffc94d');
    rindG.addColorStop(1, '#e8a020');
    ctx.fillStyle = rindG;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff8e8';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    ctx.fill();

    const segments = 10;
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2 - Math.PI / 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r * 0.78, a0, a1);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? '#ffe566' : '#ffd42a';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.2, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    [[0.2, 0.15], [-0.25, 0.3], [0.1, -0.35]].forEach(([dx, dy]) => {
      ctx.fillStyle = '#f5f0d0';
      ctx.beginPath();
      ctx.ellipse(dx * r, dy * r, 2, 3.5, dy, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.ellipse(r * 0.55, -r * 0.75, 7, 4, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.85, -r * 0.55, 6, 3.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#388e3c';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(r * 0.35, -r * 0.7);
    ctx.lineTo(r * 0.95, -r * 0.5);
    ctx.stroke();

    ctx.restore();
  }

  function _drawCookie(ctx, c) {
    const r = c.r;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot || 0);

    ctx.fillStyle = 'rgba(0,0,0,.06)';
    ctx.beginPath();
    ctx.ellipse(1, r + 2, r * 0.9, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    const g = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 2, 0, 0, r);
    g.addColorStop(0, '#e8c49a');
    g.addColorStop(1, '#c4956a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a67c52';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#4a2c1a';
    [[-5, -4], [6, 3], [-3, 6], [4, -6], [0, -7]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(dx, dy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function _initCatchGame(canvas, scoreEl, statusEl, themeId) {
    _stopGame();

    const theme = THEMES[themeId] || THEMES.coffee;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const cup = {
      w: 110,
      h: 110,
      x: W / 2 - 55,
      y: H - 115,
      speed: 11
    };

    const themeStyle = themeId === 'tea'
      ? { bg: '#eef6f0', border: 'rgba(100,160,120,.45)' }
      : { bg: '#f4f0eb', border: 'rgba(200,169,110,.4)' };

    const keys = { left: false, right: false };
    let score = 0;
    let items = [];
    let lastSpawn = 0;
    let spawnInterval = 2300;
    let running = true;
    let gameOver = false;

    const drawItem = theme.id === 'tea' ? _drawLemonSlice : _drawCookie;

    function spawnItem() {
      const size = theme.id === 'tea' ? 28 : 26;
      items.push({
        x: size + Math.random() * (W - size * 2),
        y: -size,
        r: size / 2,
        vy: 1.8 + Math.random() * 0.8 + score * 0.01,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05
      });
    }

    function collide(item) {
      const left = cup.x + cup.w * 0.15;
      const right = cup.x + cup.w * 0.85;
      const top = cup.y + cup.h * 0.2;
      const bottom = cup.y + cup.h * 0.5;
      return (
        item.y + item.r >= top &&
        item.y - item.r <= bottom &&
        item.x >= left &&
        item.x <= right
      );
    }

    function endGame() {
      if (gameOver) return;
      gameOver = true;
      running = false;
      statusEl.textContent = `Програш! Очки: ${score}. Натисніть «Почати знову».`;
      statusEl.classList.add('game-status--over');
    }

    function resetGame() {
      score = 0;
      scoreEl.textContent = '0';
      items = [];
      lastSpawn = 0;
      spawnInterval = 2600;
      cup.x = W / 2 - 55;
      running = true;
      gameOver = false;
      statusEl.textContent = 'Гра йде…';
      statusEl.classList.remove('game-status--over');
      if (!_rafId) _rafId = requestAnimationFrame(loop);
    }

    function drawOverlay() {
      if (!gameOver) return;
      ctx.save();
      ctx.fillStyle = 'rgba(13,13,13,.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '700 30px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Програш', W / 2, H / 2 - 10);
      ctx.font = '600 17px Nunito, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      ctx.fillText(`Ваш рахунок: ${score}`, W / 2, H / 2 + 22);
      ctx.restore();
    }

    function loop(ts) {
      if (!document.getElementById('catch-game-canvas')) {
        _stopGame();
        return;
      }

      if (running) {
        if (keys.left) cup.x = Math.max(4, cup.x - cup.speed);
        if (keys.right) cup.x = Math.min(W - cup.w - 4, cup.x + cup.speed);

        if (ts - lastSpawn > spawnInterval) {
          spawnItem();
          lastSpawn = ts;
          spawnInterval = Math.max(1500, 2300 - score * 18);
        }

        const remaining = [];
        for (const item of items) {
          item.y += item.vy;
          if (item.rotSpeed) item.rot += item.rotSpeed;

          if (collide(item)) {
            score += 1;
            scoreEl.textContent = String(score);
            continue;
          }

          if (item.y - item.r > cup.y + cup.h * 0.55) {
            endGame();
            break;
          }

          if (item.y - item.r < H + 40) remaining.push(item);
        }
        items = remaining;
      }

      ctx.fillStyle = themeStyle.bg;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = themeStyle.border;
      ctx.setLineDash([6, 8]);
      ctx.strokeRect(8, 8, W - 16, H - 16);
      ctx.setLineDash([]);

      items.forEach(item => drawItem(ctx, item));
      _drawCup(ctx, cup, themeId);
      drawOverlay();

      _rafId = requestAnimationFrame(loop);
    }

    _keydown = e => {
      if (gameOver) return;
      if (e.key === 'ArrowLeft') { keys.left = true; e.preventDefault(); }
      if (e.key === 'ArrowRight') { keys.right = true; e.preventDefault(); }
    };
    _keyup = e => {
      if (e.key === 'ArrowLeft') keys.left = false;
      if (e.key === 'ArrowRight') keys.right = false;
    };
    window.addEventListener('keydown', _keydown);
    window.addEventListener('keyup', _keyup);

    canvas.tabIndex = 0;
    canvas.addEventListener('click', () => {
      if (!gameOver) canvas.focus();
    });

    const restartBtn = document.getElementById('game-restart-btn');
    if (restartBtn) {
      restartBtn.onclick = () => {
        resetGame();
        setTimeout(spawnItem, 600);
      };
    }

    resetGame();
    setTimeout(spawnItem, 800);
  }

  function render() {
    _stopGame();

    // Завантаження зображення кавової чашки
    if (!_coffeeCupImage) {
      _coffeeCupImage = new Image();
     _coffeeCupImage.src = './images/game/ChatGPTCoffee.png';
    }

    const main = document.getElementById('main-content');
    main.innerHTML = `
      <section class="about-game section-block" aria-labelledby="game-title">
        <div class="container">
          <header class="game-header">
            <div>
              <p class="meta-tag">MINI GAME</p>
              <h1 id="game-title" class="heading-lg">Catch the Cookie</h1>
              <p class="game-hint" id="game-hint">
                Оберіть тему, рухайте чашку стрілками ← → і ловіть падаючі предмети.
              </p>
            </div>
            <div class="game-score-panel" aria-live="polite">
              <span class="game-score-label">Очки</span>
              <span class="game-score-value" id="game-score">0</span>
            </div>
          </header>

          <div class="game-theme-tabs" role="tablist" aria-label="Тема гри">
            <button type="button" class="game-theme-btn active" data-theme="coffee" role="tab" aria-selected="true">
              ☕ Кава + печиво
            </button>
            <button type="button" class="game-theme-btn" data-theme="tea" role="tab" aria-selected="false">
              🍵 Чай + лимон
            </button>
          </div>

          <div class="game-wrap">
            <canvas
              id="catch-game-canvas"
              class="catch-game-canvas"
              width="640"
              height="400"
              role="img"
              aria-label="Поле гри: чашка внизу, предмети падають зверху">
            </canvas>
            <p class="game-status" id="game-status">Гра йде…</p>
            <p class="game-controls-hint">Клікніть на поле, потім ← →. Пропустили предмет — програш.</p>
            <button type="button" class="btn btn-outline" id="game-restart-btn">Почати знову</button>
          </div>
        </div>
      </section>
    `;

    window.scrollTo({ top: 0, behavior: 'instant' });

    const canvas = document.getElementById('catch-game-canvas');
    const scoreEl = document.getElementById('game-score');
    const statusEl = document.getElementById('game-status');
    const titleEl = document.getElementById('game-title');
    const hintEl = document.getElementById('game-hint');

    function applyTheme(themeId) {
      const t = THEMES[themeId];
      if (titleEl) titleEl.textContent = t.title;
      if (hintEl) hintEl.textContent = t.hint;
      document.querySelectorAll('.game-theme-btn').forEach(btn => {
        const active = btn.dataset.theme === themeId;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', String(active));
      });
      if (canvas && scoreEl && statusEl) {
        _initCatchGame(canvas, scoreEl, statusEl, themeId);
      }
    }

    document.querySelectorAll('.game-theme-btn').forEach(btn => {
      btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });

    // Зупинити гру при переході на іншу сторінку (SPA)
    const hashChangeHandler = () => {
      if (!window.location.hash.startsWith('#about')) {
        _stopGame();
        window.removeEventListener('hashchange', hashChangeHandler);
      }
    };
    window.addEventListener('hashchange', hashChangeHandler);

    applyTheme('coffee');
  }

  return { render };
})();
