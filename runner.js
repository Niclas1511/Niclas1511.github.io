(() => {
    const canvas = document.querySelector('#runner-canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const overlay = document.querySelector('#runner-overlay');
    const message = document.querySelector('#runner-message');
    const startButton = document.querySelector('#runner-start');
    const pauseButton = document.querySelector('#runner-pause');
    const jumpButton = document.querySelector('#runner-jump');
    const duckButton = document.querySelector('#runner-duck');
    const chalkButton = document.querySelector('#runner-chalk');
    const chalkDisplay = document.querySelector('#runner-chalk-count');
    const chalkCapacity = document.querySelector('#runner-chalk-capacity');
    const effectsDisplay = document.querySelector('#runner-effects');
    const comboDisplay = document.querySelector('#runner-combo');
    const phaseDisplay = document.querySelector('#runner-phase');
    const eventDisplay = document.querySelector('#runner-event');
    const arenaControls = document.querySelector('#runner-arena-controls');
    const leftButton = document.querySelector('#runner-left');
    const rightButton = document.querySelector('#runner-right');
    const controlsHint = document.querySelector('#runner-controls-hint');
    let previousArena = false;
    let announcedScene = '';
    let announcedPickup = 0;
    const score = document.querySelector('#runner-score');
    const bestDisplay = document.querySelector('#runner-best');
    const status = document.querySelector('#runner-status');
    const storageKey = 'niederdrenk-math-run-best';
    let best = 0;
    try { best = Math.max(0, Number(localStorage.getItem(storageKey)) || 0); } catch (_) { }
    bestDisplay.textContent = String(best);
    let state = MathRunner.create();
    let mode = 'ready';
    let lastTime = 0;
    let frame;
    const duckInputs = new Set();
    const jumpInputs = new Set();
    const leftInputs = new Set(), rightInputs = new Set();
    const aimUpInputs = new Set(), aimDownInputs = new Set();
    const colors = { sky: '#172431', grid: '#203442', ink: '#e9efdb', mint: '#a9ccb4',
        ground: '#718b83', muted: '#59747a', gold: '#e4bd7a', pink: '#d69a93' };

    function rect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), w, h);
    }
    const sprite = [
        '    hhhh    ', '   hhhhhh   ', '   hhsssh   ', '   sssssss  ',
        '   skkskks  ', '   sssssss  ', '    ssss    ', '     ss     ',
        '   bbbbbb   ', '  bbbbbbbb  ', '  sbbbbbbp  ', '  sbbbbbbp  ',
        '  sbbbbbbp  ', '   bbbbbb   ', '   bbbbbb   ', '   tttttt   ',
        '   tttttt   ', '   tt  tt   ', '   tt  tt   ', '   tt  tt   ',
        '   kk  kk   ', '  kkk  kkk  '
    ];
    function drawStudent() {
        const player = MathRunner.player(state);
        const avatarRect = (x, y, w, h, color) => rect(player.x + (state.facing < 0 ? 24 - x - w : x), y, w, h, color);
        if (state.duck && state.y === MathRunner.ground) {
            avatarRect(0, 236, 24, 10, colors.mint);
            avatarRect(16, 232, 10, 10, colors.gold);
            avatarRect(22, 234, 4, 2, colors.sky);
            avatarRect(0, 246, 26, 6, colors.ink);
            avatarRect(-2, 234, 8, 8, colors.pink);
            return;
        }
        const palette = { h: '#493f46', s: colors.gold, k: colors.sky,
            b: colors.mint, p: colors.pink, t: '#91a3bc' };
        const stride = state.y === MathRunner.ground && mode === 'running' && (!state.boss || state.move !== 0)
            ? Math.floor(state.time * 10) % 2 : 0;
        sprite.forEach((row, y) => [...row].forEach((pixel, x) => {
            if (pixel === ' ') return;
            const offset = y > 17 && stride ? (x < 6 ? -2 : 2) : 0;
            avatarRect(x * 2 + offset, player.y + y * 2, 2, 2, palette[pixel]);
        }));
    }
    function drawPlane(x, y, width, color) {
        for (let row = 0; row < 7; row++) {
            const inset = Math.abs(row - 3) * 7;
            rect(x + inset, y + row * 2, width - inset - row * 2, 2, color);
        }
        rect(x + width / 3, y + 6, width / 2, 2, colors.sky);
    }
    function pixelText(text, x, y, size = 10, color = colors.sky, width = 80) {
        ctx.font = `bold ${size}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.fillText(text, Math.round(x), Math.round(y), width);
    }
    function drawFlyer(o) {
        const { x, y, w, h, kind } = o;
        if (kind === 'student') {
            if (!o.resolved) {
                rect(x, y, w, 16, colors.ink);
                rect(x + 35, y + 16, 5, 3, colors.ink);
                pixelText('Quick question!', x + w / 2, y + 8, 9, colors.sky, w - 6);
            } else if (state.time - o.resolvedAt < .6) {
                pixelText('Thanks!', x + w / 2, y + 8, 10, colors.mint, w);
            }
            rect(x + 33, y + 19, 13, 11, colors.gold);
            rect(x + 32, y + 18, 15, 4, '#493f46');
            rect(x + 33, y + 24, 5, 2, colors.sky);
            rect(x + 41, y + 24, 5, 2, colors.sky);
            rect(x + 29, y + 31, 23, 9, colors.pink);
            rect(x + 32, y + 40, 17, 5, colors.mint);
            drawPlane(x, y + 36, w, colors.ink);
        } else if (kind === 'paperplane') {
            const fold = Math.min(1, (state.time - o.resolvedAt) / .25);
            if (fold < 1) {
                rect(x + fold * 10, y, w * (1 - fold * .4), h * (1 - fold * .5), colors.ink);
                rect(x + w / 2, y, 2, h * (1 - fold * .5), colors.muted);
            }
            drawPlane(x, y + 8, w, colors.ink);
            if (state.time - o.resolvedAt < .6) pixelText('Solved!', x + w / 2, y - 5, 9, colors.mint, 60);
        } else if (kind === 'comment') {
            rect(x, y, w, h, colors.pink);
            pixelText(['REVISE', 'CITE ME', 'WHY?'][o.band], x + w / 2, y + h / 2, 11, colors.sky, w - 6);
        } else if (kind === 'email') {
            rect(x, y + 2, w, h - 4, colors.gold);
            for (let i = 0; i < 7; i++) {
                rect(x + 3 + i * 4, y + 4 + i * 2, 5, 2, colors.sky);
                rect(x + w - 8 - i * 4, y + 4 + i * 2, 5, 2, colors.sky);
            }
            rect(x + 28, y + 13, 16, 14, colors.pink);
            pixelText('!', x + 36, y + 20, 12);
            pixelText('URGENT', x + w / 2, y - 6, 8, colors.gold, w);
        } else if (kind === 'reviewer') {
            rect(x + 12, y + 8, w - 16, 10, colors.pink);
            rect(x + w - 10, y + 8, 8, 10, colors.ink);
            rect(x + 7, y + 10, 7, 6, colors.gold);
            rect(x + 2, y + 12, 6, 2, colors.ink);
            pixelText('REVIEWER 2', x + w / 2, y + 2, 8, colors.pink, w);
        } else if (kind === 'epsilon') {
            pixelText('ε', x + 15, y + h / 2, 27, colors.mint, 25);
            pixelText('δ', x + 54, y + h / 2, 22, colors.gold, 25);
            rect(x + 30, y + 14, 12, 2, colors.muted);
            rect(x + 30, y + 12, 3, 6, colors.muted);
        } else if (kind === 'worksheet') {
            rect(x + 2, y, w - 4, h, colors.ink);
            rect(x + w - 11, y, 9, 6, colors.muted);
            pixelText('PSET', x + w / 2, y + 7, 9);
            pixelText('∫ x² dx', x + w / 2, y + 18, 9, colors.sky, w - 8);
            rect(x + 8, y + 25, w - 16, 2, colors.muted);
        } else if (kind === 'conference') {
            drawPlane(x, y + 8, w, colors.mint);
            pixelText('ABSTRACT', x + w / 2, y + 3, 8, colors.mint, w);
            pixelText('DUE TODAY', x + w / 2, y + h - 2, 8, colors.gold, w);
        }
    }
    function drawWarnings() {
        const incoming = state.obstacles.filter(o => o.kind && !o.resolved &&
            o.x >= canvas.width && (o.x - canvas.width) / o.speed <= .75)
            .sort((a, b) => a.x - b.x)[0];
        if (!incoming) return;
        const x = canvas.width - 152;
        rect(x, 44, 142, 27, colors.grid);
        pixelText(incoming.label, x + 71, 57, 9, colors.gold, 132);
        // A marker at the incoming height links the warning to its flight path.
        const y = incoming.y + incoming.h / 2;
        rect(canvas.width - 6, y - 4, 4, 8, colors.gold);
        rect(canvas.width - 10, y - 2, 4, 4, colors.gold);
    }
    function drawObstacle(obstacle) {
        if (obstacle.kind) { drawFlyer(obstacle); return; }
        const { x, y, w, h, band, variant } = obstacle;
        const motif = MathRunner.motifs[band][variant];
        const color = [colors.gold, colors.pink, colors.mint][band];
        // The complete visible tile is the obstacle, including its border.
        rect(x, y + 3, w, h - 6, color);
        rect(x + 3, y, w - 6, h, color);
        ctx.fillStyle = colors.sky;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 13px monospace';
        if (motif === 'coffee') {
            rect(x + 23, y + 6, 17, 17, colors.sky);
            rect(x + 40, y + 9, 7, 10, colors.sky);
            rect(x + 40, y + 12, 4, 4, color);
            rect(x + 25, y + 8, 13, 3, colors.ink);
        } else if (motif === 'books') {
            rect(x + 16, y + 7, 31, 6, colors.sky);
            rect(x + 20, y + 15, 29, 7, colors.sky);
            rect(x + 20, y + 9, 25, 2, colors.ink);
            rect(x + 24, y + 17, 23, 2, colors.ink);
        } else {
            const lines = motif.split('|');
            ctx.font = `bold ${lines.length > 1 ? 10 : 12}px monospace`;
            lines.forEach((line, i) => ctx.fillText(line, Math.round(x + w / 2),
                y + h / 2 + (i - (lines.length - 1) / 2) * 11 + 1, w - 8));
        }
    }
    function drawItem(item) {
        const type = MathRunner.powerupTypes.find(type => type.kind === item.kind);
        const { x, y } = item;
        rect(x + 3, y, 22, 28, colors.grid);
        rect(x, y + 3, 28, 22, colors.grid);
        rect(x + 4, y, 20, 2, type.color);
        rect(x + 4, y + 26, 20, 2, type.color);
        rect(x, y + 4, 2, 20, type.color);
        rect(x + 26, y + 4, 2, 20, type.color);
        if (item.kind === 'shield') {
            rect(x + 8, y + 7, 12, 2, type.color);
            rect(x + 8, y + 9, 2, 9, type.color);
            rect(x + 18, y + 9, 2, 9, type.color);
            rect(x + 10, y + 18, 8, 2, type.color);
            rect(x + 12, y + 20, 4, 2, type.color);
        } else {
            pixelText(type.symbol, x + 14, y + 14, 20, type.color, 24);
        }
        const phase = state.time * 3;
        rect(x + 14 + Math.cos(phase) * 20, y + 14 + Math.sin(phase) * 19, 2, 2, type.color);
        pixelText(item.risky ? 'RISK / REWARD' : 'PICK UP', x + 14, y - 7, 7, type.color, item.risky ? 76 : 43);
    }
    function drawShield() {
        if (!state.powerups.shield) return;
        const body = MathRunner.player(state);
        const color = '#a9c9ef';
        const pad = 5 + Math.round(Math.sin(state.time * 5));
        rect(body.x - pad + 4, body.y - pad, body.w + pad * 2 - 8, 2, color);
        rect(body.x - pad + 4, body.y + body.h + pad, body.w + pad * 2 - 8, 2, color);
        rect(body.x - pad, body.y - pad + 4, 2, body.h + pad * 2 - 8, color);
        rect(body.x + body.w + pad, body.y - pad + 4, 2, body.h + pad * 2 - 8, color);
        for (let i = 0; i < 4; i++) {
            const angle = state.time * 3 + i * Math.PI / 2;
            rect(body.x + body.w / 2 + Math.cos(angle) * (body.w / 2 + 11),
                body.y + body.h / 2 + Math.sin(angle) * (body.h / 2 + 9), 3, 3, color);
        }
    }
    function updateHud() {
        score.textContent = String(state.score);
        chalkDisplay.textContent = state.powerups.infinite > 0 ? '∞' : String(state.chalk);
        chalkCapacity.hidden = state.powerups.infinite > 0;
        chalkButton.disabled = mode !== 'running' || (state.chalk === 0 && !state.powerups.infinite);
        const active = MathRunner.powerupTypes.filter(type => state.powerups[type.kind] > 0);
        effectsDisplay.textContent = active.map(type => `${type.label} ${Math.ceil(state.powerups[type.kind])}s`).join(' · ');
        effectsDisplay.hidden = active.length === 0;
        comboDisplay.textContent = `×${state.multiplier}`;
        phaseDisplay.textContent = MathRunner.phases[state.phase].label;
        const arena = Boolean(state.boss);
        if (arena !== previousArena) { clearInputs(); previousArena = arena; }
        arenaControls.hidden = !arena;
        leftButton.disabled = rightButton.disabled = mode !== 'running' || !arena;
        canvas.setAttribute('data-arena', String(arena));
        controlsHint.textContent = arena
            ? 'Arena: A/D or ←/→ move · Mouse / touch aim + shoot · W/S adjust aim · Space jump · X throw · P pause'
            : 'Hold Space / ↑ jump higher · Tap twice double jump · ↓ duck / fast fall · X chalk · P pause';
        const bossWarning = !arena && (state.runTime ?? state.time) >= state.nextBossAt - 3;
        const scene = arena ? `Reviewer 2 · ${state.boss.hp}/6 comments left · aim at the red pen`
            : bossWarning ? 'Boss arena incoming — the run will stop!'
            : state.event ? `${state.event.label}${state.event.warning ? ' incoming…' : ` · ${Math.ceil(state.event.remaining)}s`}` : '';
        eventDisplay.textContent = scene;
        eventDisplay.hidden = !scene;
        const sceneKey = `${state.phase}:${state.boss ? 'boss' : bossWarning ? 'boss-warning' : state.event ? state.event.kind + state.event.warning : ''}`;
        if (sceneKey !== announcedScene) {
            announcedScene = sceneKey;
            status.textContent = scene || phaseDisplay.textContent;
        }
        if (state.pickupSerial !== announcedPickup) {
            announcedPickup = state.pickupSerial;
            status.textContent = state.pickupMessage;
        }
    }
    function drawBoss() {
        const boss = state.boss;
        if (!boss) return;
        const { x, y, w } = boss;
        rect(x + 16, y + 9, w - 20, 13, '#e87878');
        rect(x + 8, y + 12, 10, 7, colors.gold);
        rect(x + 2, y + 14, 6, 3, colors.ink);
        rect(x + w - 12, y + 9, 10, 13, colors.ink);
        pixelText('REVIEWER 2', x + w / 2, y - 18, 10, colors.pink, w);
        for (let i = 0; i < boss.maxHp; i++) rect(x + 8 + i * 12, y - 8, 9, 4, i < boss.hp ? '#e87878' : colors.muted);
        if (boss.attackIn < .9) {
            const pattern = boss.pattern % 3;
            pixelText(['TARGET LOCK', 'FAN SHOT', 'GROUND WAVE'][pattern], x + w / 2, y + 37, 9, colors.gold, 100);
            if (boss.target && pattern !== 2) {
                const target = boss.target;
                for (let i = 1; i < 15; i++) rect(x + w / 2 + (target.x - x - w / 2) * i / 15,
                    y + 15 + (target.y - y - 15) * i / 15, 2, 2, colors.pink);
                rect(target.x - 6, target.y, 12, 2, colors.pink);
                rect(target.x, target.y - 6, 2, 12, colors.pink);
            } else if (pattern === 2) rect(canvas.width - 28, 247, 20, 3, colors.pink);
        }
    }
    function drawAim() {
        if (!state.boss) return;
        const body = MathRunner.player(state);
        const origin = { x: body.x + 12, y: body.y + 16 };
        const target = state.aim || { x: origin.x + Math.cos(state.aimAngle) * 90, y: origin.y + Math.sin(state.aimAngle) * 90 };
        for (let i = 1; i < 12; i++) rect(origin.x + (target.x - origin.x) * i / 12,
            origin.y + (target.y - origin.y) * i / 12, 2, 2, colors.mint);
        rect(target.x - 7, target.y, 5, 2, colors.ink);
        rect(target.x + 3, target.y, 5, 2, colors.ink);
        rect(target.x, target.y - 7, 2, 5, colors.ink);
        rect(target.x, target.y + 3, 2, 5, colors.ink);
    }

    function pressJump(input) {
        if (mode !== 'running') return;
        jumpInputs.add(input);
        state.jumpHeld = true;
        MathRunner.jump(state);
    }
    function releaseJump(input) {
        jumpInputs.delete(input);
        if (!jumpInputs.size) MathRunner.releaseJump(state);
    }
    function draw() {
        const phase = MathRunner.phases[state.phase];
        colors.sky = phase.sky; colors.grid = phase.grid; colors.mint = phase.accent;
        ctx.imageSmoothingEnabled = false;
        rect(0, 0, canvas.width, canvas.height, colors.sky);
        const offset = Math.floor(state.distance * .18) % 32;
        for (let x = -offset; x < canvas.width; x += 32) rect(x, 0, 1, 252, colors.grid);
        for (let y = 28; y < 252; y += 32) rect(0, y, canvas.width, 1, colors.grid);
        ctx.font = '12px monospace';
        ctx.fillStyle = colors.muted;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(state.boss ? 'BOSS ARENA · REVIEWER 2' : phase.label.toUpperCase(), 20, 30);
        // Three quiet guide lines make incoming obstacle heights easy to read.
        for (const band of MathRunner.bands) {
            for (let x = 120; x < canvas.width; x += 16) rect(x, band.y + band.h / 2, 3, 1, colors.grid);
        }
        rect(0, 252, canvas.width, 4, colors.mint);
        rect(0, 256, canvas.width, 64, phase.ground);
        const floorOffset = Math.floor(state.distance) % 32;
        for (let x = -floorOffset; x < canvas.width; x += 32) {
            rect(x, 266, 12, 3, colors.ground);
            rect(x + 16, 286, 5, 3, colors.muted);
        }
        rect(state.x - 7, 252, 39, 3, colors.sky);
        if (state.boss) { rect(8, 234, 3, 18, colors.gold); rect(canvas.width - 11, 234, 3, 18, colors.gold); }
        drawStudent();
        drawShield();
        state.items.forEach(drawItem);
        state.obstacles.forEach(drawObstacle);
        drawWarnings();
        drawBoss();
        drawAim();
        for (const shot of state.enemyShots) {
            rect(shot.x, shot.y, shot.w, shot.h, colors.pink);
            if (shot.wave) pixelText("!", shot.x + shot.w / 2, shot.y + 10, 13, colors.sky, shot.w);
        }
        for (const shot of state.shots) {
            rect(shot.x - Math.sign(shot.vx ?? 560) * 6, shot.y + 1, 5, 2, colors.muted);
            rect(shot.x, shot.y, shot.w, shot.h, colors.ink);
        }
        if (state.throwFlash > 0) {
            const body = MathRunner.player(state);
            rect(body.x + 12 + Math.cos(state.boss ? state.aimAngle : 0) * 10, body.y + (state.boss ? 16 : 10), 9, 4, colors.gold);
        }
        for (const particle of state.particles) rect(particle.x, particle.y, 3, 3, particle.color);
        for (const text of state.popups) pixelText(text.text, Math.max(75, Math.min(canvas.width - 75, text.x)), text.y, 10, text.color, 150);
        // Two quiet pips show the remaining jumps, including the mid-air jump.
        for (let i = 0; i < 2; i++) rect(78 + i * 9, 301, 5, 5,
            i < 2 - state.jumps ? colors.mint : colors.muted);
    }
    function clearInputs() {
        duckInputs.clear();
        jumpInputs.clear();
        leftInputs.clear(); rightInputs.clear(); aimUpInputs.clear(); aimDownInputs.clear();
        state.move = 0; state.aimTurn = 0;
        state.jumpHeld = false;
        state.duck = false;
        duckButton.setAttribute('aria-pressed', 'false');
    }
    function setDuck(key, held) {
        if (held && mode === 'running') duckInputs.add(key);
        else duckInputs.delete(key);
        state.duck = duckInputs.size > 0;
        duckButton.setAttribute('aria-pressed', String(state.duck));
    }
    function showOverlay(text, buttonText) {
        message.textContent = text;
        startButton.textContent = buttonText;
        overlay.hidden = false;
        status.textContent = text;
    }
    function setControls(enabled) {
        pauseButton.disabled = !enabled;
        jumpButton.disabled = !enabled;
        duckButton.disabled = !enabled;
        chalkButton.disabled = !enabled;
        leftButton.disabled = rightButton.disabled = !enabled || !state.boss;
    }
    function finish() {
        mode = 'over';
        clearInputs();
        setControls(false);
        if (state.score > best) {
            best = state.score;
            bestDisplay.textContent = String(best);
            try { localStorage.setItem(storageKey, String(best)); } catch (_) { }
        }
        showOverlay(`Semester over. Score ${state.score}.`, 'Try again');
    }
    function tick(time) {
        if (mode !== 'running') return;
        if (lastTime) MathRunner.step(state, (time - lastTime) / 1000);
        lastTime = time;
        updateHud();
        draw();
        if (state.over) finish();
        else frame = requestAnimationFrame(tick);
    }
    function run() {
        if (mode !== 'paused') {
            state = MathRunner.create(canvas.width);
            score.textContent = '0';
            chalkDisplay.textContent = '3';
            announcedPickup = 0;
            announcedScene = '';
            previousArena = false;
        }
        mode = 'running';
        lastTime = 0;
        overlay.hidden = true;
        pauseButton.textContent = 'Pause';
        setControls(true);
        updateHud();
        clearInputs();
        canvas.focus({ preventScroll: true });
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(tick);
        status.textContent = 'Hold jump to go higher; release for a short hop. Press again for a double jump. Down ducks or speeds up your fall. X throws chalk. Consecutive successful throws multiply hit points; a missed volley resets the combo.';
    }
    function pause() {
        if (mode !== 'running') return;
        mode = 'paused';
        cancelAnimationFrame(frame);
        clearInputs();
        pauseButton.textContent = 'Resume';
        jumpButton.disabled = true;
        duckButton.disabled = true;
        chalkButton.disabled = true;
        leftButton.disabled = rightButton.disabled = true;
        showOverlay('Paused', 'Resume');
        draw();
    }
    startButton.addEventListener('click', run);
    pauseButton.addEventListener('click', () => mode === 'paused' ? run() : pause());
    jumpButton.addEventListener('pointerdown', event => {
        if (mode !== 'running') return;
        event.preventDefault();
        jumpButton.setPointerCapture(event.pointerId);
        pressJump(event.pointerId);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        jumpButton.addEventListener(type, event => releaseJump(event.pointerId));
    }
    jumpButton.addEventListener('click', event => {
        if (event.detail === 0 && mode === 'running') { pressJump('accessible'); releaseJump('accessible'); }
    });
    duckButton.addEventListener('pointerdown', event => {
        if (mode !== 'running') return;
        event.preventDefault();
        duckButton.setPointerCapture(event.pointerId);
        setDuck(event.pointerId, true);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        duckButton.addEventListener(type, event => setDuck(event.pointerId, false));
    }
    duckButton.addEventListener('click', event => {
        if (event.detail === 0) setDuck('toggle', !duckInputs.has('toggle'));
    });
    chalkButton.addEventListener('pointerdown', event => {
        if (mode !== 'running') return;
        event.preventDefault();
        MathRunner.throwChalk(state);
    });
    chalkButton.addEventListener('click', event => {
        if (event.detail === 0 && mode === 'running') MathRunner.throwChalk(state);
    });
    function refreshArenaInputs() {
        state.move = Number(rightInputs.size > 0) - Number(leftInputs.size > 0);
        state.aimTurn = Number(aimDownInputs.size > 0) - Number(aimUpInputs.size > 0);
    }
    for (const [button, inputs] of [[leftButton, leftInputs], [rightButton, rightInputs]]) {
        button.addEventListener('pointerdown', event => {
            if (mode !== 'running' || !state.boss) return;
            event.preventDefault(); button.setPointerCapture(event.pointerId);
            inputs.add(event.pointerId); refreshArenaInputs();
        });
        for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
            button.addEventListener(type, event => { inputs.delete(event.pointerId); refreshArenaInputs(); });
        }
        button.addEventListener('keydown', event => {
            if (!['Space', 'Enter'].includes(event.code) || mode !== 'running' || !state.boss) return;
            event.preventDefault(); event.stopPropagation(); inputs.add('button'); refreshArenaInputs();
        });
        button.addEventListener('keyup', event => {
            if (!['Space', 'Enter'].includes(event.code)) return;
            event.preventDefault(); event.stopPropagation(); inputs.delete('button'); refreshArenaInputs();
        });
    }
    function aimFromPointer(event) {
        const bounds = canvas.getBoundingClientRect();
        MathRunner.aimAt(state, (event.clientX - bounds.left) * canvas.width / bounds.width,
            (event.clientY - bounds.top) * canvas.height / bounds.height);
    }
    canvas.addEventListener('pointermove', event => {
        if (mode !== 'running' || !state.boss) return;
        aimFromPointer(event);
    });
    canvas.addEventListener('pointerdown', event => {
        if (mode !== 'running' || !state.boss || (event.button !== undefined && event.button !== 0)) return;
        event.preventDefault(); canvas.focus({ preventScroll: true });
        aimFromPointer(event); MathRunner.throwChalk(state);
    });
    jumpButton.addEventListener('keydown', event => {
        if (!['Space', 'Enter'].includes(event.code) || mode !== 'running') return;
        event.preventDefault(); event.stopPropagation();
        if (!event.repeat) pressJump(`button-${event.code}`);
    });
    jumpButton.addEventListener('keyup', event => {
        if (!['Space', 'Enter'].includes(event.code)) return;
        event.preventDefault(); event.stopPropagation(); releaseJump(`button-${event.code}`);
    });
    document.addEventListener('keydown', event => {
        if (!['Space', 'ArrowUp', 'ArrowDown', 'KeyP', 'KeyX', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(event.code)) return;
        if (event.target !== canvas && event.target !== document.body &&
            ![jumpButton, duckButton, chalkButton, leftButton, rightButton].includes(event.target)) return;
        if (mode !== 'running' && mode !== 'paused') return;
        const arenaInput = ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(event.code);
        if (arenaInput && !state.boss) return;
        event.preventDefault();
        if (event.code === 'KeyP' && !event.repeat) mode === 'paused' ? run() : pause();
        if (mode !== 'running') return;
        const inputSet = ['ArrowLeft','KeyA'].includes(event.code) ? leftInputs : ['ArrowRight','KeyD'].includes(event.code) ? rightInputs : event.code === 'KeyW' ? aimUpInputs : event.code === 'KeyS' ? aimDownInputs : null;
        if (inputSet) { inputSet.add(event.code); refreshArenaInputs(); }
        if (event.code === 'KeyX' && !event.repeat) MathRunner.throwChalk(state);
        if (event.code === 'ArrowDown') setDuck('keyboard', true);
        else if (!event.repeat && ['Space', 'ArrowUp'].includes(event.code)) pressJump(event.code);
    });
    document.addEventListener('keyup', event => {
        for (const inputs of [leftInputs, rightInputs, aimUpInputs, aimDownInputs]) inputs.delete(event.code);
        refreshArenaInputs();
        if (event.code === 'ArrowDown') setDuck('keyboard', false);
        if (['Space', 'ArrowUp'].includes(event.code)) releaseJump(event.code);
    });
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    function resize() {
        const width = Math.max(420, Math.min(960, Math.round(canvas.parentElement.clientWidth)));
        if (width === canvas.width) return;
        pause();
        canvas.width = width;
        state.width = width;
        state.x = Math.max(12, Math.min(width - 36, state.x));
        if (state.boss) {
            state.boss.x = Math.max(110, Math.min(width - state.boss.w - 12, state.boss.x));
            if (state.aim) state.aim.x = Math.min(width, state.aim.x);
        }
        draw();
    }
    window.addEventListener('resize', resize);
    duckButton.setAttribute('aria-pressed', 'false');
    resize();
    draw();
})();
