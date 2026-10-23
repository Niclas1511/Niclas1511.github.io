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
    let previousIntro = false;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
    let announcedScene = '';
    let announcedPickup = 0;
    let announcedReward = 0;
    const score = document.querySelector('#runner-score');
    const bestDisplay = document.querySelector('#runner-best');
    const status = document.querySelector('#runner-status');
    const music = typeof RunnerMusic !== 'undefined' ? RunnerMusic.create(document.querySelector('#runner-music'), document.querySelector('#runner-track'), status) : null;
    const sound = typeof RunnerSound !== 'undefined' ? RunnerSound.create(document.querySelector('#runner-sound'), status) : null;
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
    const colors = { sky: '#172431', grid: '#203442', ink: '#e9efdb', mint: '#a9ccb4',
        ground: '#718b83', muted: '#59747a', gold: '#e4bd7a', pink: '#d69a93' };

    function rect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), w, h);
    }
    // Rasterize a small, deterministic gallery once. Only translation changes per frame.
    function mathMotif(draw) {
        const layers = [new Map(), new Map()];
        const labels = [];
        const line = (a, b, tone = 1) => {
            const steps = Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])));
            for (let i = 0; i <= steps; i++) {
                const t = steps ? i / steps : 0;
                const x = Math.round(a[0] + (b[0] - a[0]) * t);
                const y = Math.round(a[1] + (b[1] - a[1]) * t);
                layers[tone].set(`${x},${y}`, [x, y]);
            }
        };
        const path = (points, tone = 1) => points.slice(1).forEach((p, i) => line(points[i], p, tone));
        draw(line, path, labels);
        return { layers: layers.map(layer => [...layer.values()]), labels };
    }
    function graphMotif(logarithm) {
        return mathMotif((line, path, labels) => {
            if (logarithm) {
                line([35, 24], [35, 136], 0); line([17, 87], [171, 87], 0);
                path(Array.from({ length: 81 }, (_, i) => {
                    const x = .12 + i * 4.9 / 80;
                    return [35 + x * 25, 87 - Math.log(x) * 23];
                }));
                labels.push({ text: 'y = ln(x)', x: 111, y: 145 });
            } else {
                line([90, 20], [90, 130], 0); line([18, 119], [162, 119], 0);
                path(Array.from({ length: 81 }, (_, i) => {
                    const x = -2.15 + i * 4.3 / 80;
                    return [90 + x * 30, 119 - x * x * 20];
                }));
                labels.push({ text: 'y = x²', x: 127, y: 145 });
            }
        });
    }
    function solidMotif(vertices) {
        const distance = (a, b) => a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0);
        const edge = Math.min(...vertices.flatMap((a, i) => vertices.slice(i + 1).map(b => distance(a, b))));
        const projected = vertices.map(([x, y, z]) => {
            const rx = x * Math.cos(.55) - z * Math.sin(.55);
            const rz = x * Math.sin(.55) + z * Math.cos(.55);
            return [rx, y * Math.cos(.38) - rz * Math.sin(.38), rz];
        });
        const scale = 56 / Math.max(...projected.flatMap(([x, y]) => [Math.abs(x), Math.abs(y)]));
        return mathMotif(line => vertices.forEach((a, i) => vertices.slice(i + 1).forEach((b, j) => {
            if (Math.abs(distance(a, b) - edge) > 1e-6) return;
            const p = projected[i], q = projected[i + j + 1];
            line([90 + p[0] * scale, 80 + p[1] * scale],
                [90 + q[0] * scale, 80 + q[1] * scale], p[2] + q[2] < 0 ? 0 : 1);
        })));
    }
    const phi = (1 + Math.sqrt(5)) / 2;
    const signs = [-1, 1];
    const cube = signs.flatMap(x => signs.flatMap(y => signs.map(z => [x, y, z])));
    const icosahedron = signs.flatMap(a => signs.flatMap(b => [[0, a, b * phi], [a, b * phi, 0], [b * phi, 0, a]]));
    const dodecahedron = [...cube, ...signs.flatMap(a => signs.flatMap(b =>
        [[0, a / phi, b * phi], [a / phi, b * phi, 0], [b * phi, 0, a / phi]]))];
    const sierpinski = mathMotif((line) => {
        const triangle = (a, b, c, depth) => {
            if (!depth) { line(a, b); line(b, c); line(c, a); return; }
            const midpoint = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
            const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
            triangle(a, ab, ca, depth - 1); triangle(ab, b, bc, depth - 1); triangle(ca, bc, c, depth - 1);
        };
        triangle([90, 18], [26, 129], [154, 129], 3);
    });
    const snowflake = mathMotif((line) => {
        const koch = (a, b, depth) => {
            if (!depth) { line(a, b); return; }
            const dx = (b[0] - a[0]) / 3, dy = (b[1] - a[1]) / 3;
            const p = [a[0] + dx, a[1] + dy], q = [a[0] + 2 * dx, a[1] + 2 * dy];
            const tip = [p[0] + dx / 2 + dy * Math.sqrt(3) / 2, p[1] + dy / 2 - dx * Math.sqrt(3) / 2];
            koch(a, p, depth - 1); koch(p, tip, depth - 1); koch(tip, q, depth - 1); koch(q, b, depth - 1);
        };
        const points = [[90, 24], [142, 114], [38, 114], [90, 24]];
        points.slice(1).forEach((p, i) => koch(points[i], p, 2));
    });
    const integral = mathMotif((line, path, labels) => {
        const curve = x => 114 - 57 * Math.exp(-(((x - 95) / 39) ** 2));
        line([21, 119], [165, 119], 0);
        for (let x = 40; x < 153; x += 9) line([x, curve(x) + 3], [x, 117], 0);
        path(Array.from({ length: 70 }, (_, i) => [24 + i * 2, curve(24 + i * 2)]));
        labels.push({ text: '∫ f(x) dx', x: 91, y: 30, size: 20 });
    });
    const geometry = mathMotif((line, path, labels) => {
        const circle = Array.from({ length: 61 }, (_, i) => [90 + 55 * Math.cos(i * Math.PI / 30), 78 + 55 * Math.sin(i * Math.PI / 30)]);
        path(circle);
        const vertices = [0, 20, 40, 60].map(i => circle[i]);
        path(vertices, 0); line([35, 78], [145, 78], 0); line([90, 23], [90, 133], 0);
        labels.push({ text: 'θ', x: 108, y: 70, size: 16 });
    });
    const mathGallery = [graphMotif(false), solidMotif(cube), graphMotif(true), sierpinski,
        integral, solidMotif(icosahedron), geometry,
        solidMotif([[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]), snowflake,
        solidMotif([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]),
        solidMotif(dodecahedron)];
    function tintBackground(base, tint, amount) {
        const channel = (hex, offset) => parseInt(hex.slice(offset, offset + 2), 16);
        return '#' + [1, 3, 5].map(offset => Math.round(channel(base, offset) * (1 - amount) +
            channel(tint, offset) * amount).toString(16).padStart(2, '0')).join('');
    }
    function drawMathBackground(phase) {
        const spacing = 224, scroll = state.distance * .07;
        const start = Math.floor(scroll / spacing);
        const inks = [tintBackground(phase.sky, phase.accent, .065), tintBackground(phase.sky, colors.ink, .105)];
        for (let slot = 0; slot < Math.ceil(canvas.width / spacing) + 1; slot++) {
            const index = start + slot, motif = mathGallery[index % mathGallery.length];
            const x = Math.round(slot * spacing - scroll % spacing + 18), y = index % 2 ? 53 : 42;
            motif.layers.forEach((points, tone) => {
                ctx.fillStyle = inks[tone];
                for (const [px, py] of points) ctx.fillRect(x + px, y + py, 1, 1);
            });
            for (const label of motif.labels) {
                ctx.font = `${label.size || 12}px Georgia, serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = inks[1];
                ctx.fillText(label.text, x + label.x, y + label.y);
            }
        }
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
    function drawAssistant(helper) {
        if (!state.powerups.assistant) return;
        const hurt = helper.hurt > 0;
        const x = helper.x + (hurt ? Math.sin(state.time * 55) * 3 - 4 : 0);
        const y = helper.y - 40 + (hurt ? 5 : Math.sin(state.time * 18) * 2);
        const airborne = helper.y < MathRunner.ground - 3;
        const stride = hurt || airborne ? 1 : Math.sin(state.time * 18) * 4;
        rect(x + 5, y, 15, 6, colors.gold);
        rect(x + 6, y + 6, 13, 12, colors.ink);
        rect(x + 14, y + 9, 2, 2, colors.sky);
        if (hurt) {
            rect(x + 11, y + 14, 6, 2, colors.pink);
            for (let i = 0; i < 3; i++) {
                const angle = state.time * 8 + i * Math.PI * 2 / 3;
                pixelText('*', x + 12 + Math.cos(angle) * 18, y - 9 + Math.sin(angle) * 5, 12, colors.gold);
            }
        }
        rect(x + 4, y + 18, 17, 13, ['#c5b0de', '#a9ccb4', '#83d9dc'][helper.id % 3]);
        rect(x + 20, y + (hurt || airborne ? 14 : 22), 8, 5, colors.ink);
        rect(x + 5 + stride, y + 31, airborne ? 10 : 6, airborne ? 5 : 9, colors.muted);
        rect(x + 15 - stride, y + 31, 6, airborne ? 6 : 9, colors.muted);
        rect(x + 9, y + 21, 6, 6, colors.ink);
        for (let i = 0; i < helper.hits; i++) rect(x - 1 + i * 6, y - 20, 4, 3, '#c5b0de');
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
        if (item.kind === 'assistant') {
            rect(x + 10, y + 5, 8, 8, type.color);
            rect(x + 8, y + 14, 12, 7, type.color);
            rect(x + 8, y + 21, 4, 4, type.color);
            rect(x + 16, y + 21, 4, 4, type.color);
        } else if (item.kind === 'shield') {
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
        chalkButton.disabled = mode !== 'running' || Boolean(state.bossIntro) || (state.chalk === 0 && !state.powerups.infinite && !state.hagoromo);
        const active = MathRunner.powerupTypes.filter(type => state.powerups[type.kind] > 0);
        const effects = active.map(type => type.kind === 'assistant' ? `Student assistants ×${state.assistants.length} · ${state.assistants.reduce((sum, helper) => sum + helper.hits, 0)} lives` : `${type.label} ${Math.ceil(state.powerups[type.kind])}s`);
        if (state.hagoromo) effects.push(`Hagoromo ×${state.hagoromo} ready — next throw`);
        effectsDisplay.textContent = effects.join(' · ');
        effectsDisplay.hidden = effects.length === 0;
        comboDisplay.textContent = `×${state.multiplier}${state.streak ? ` · ${state.streak} hits` : ''}`;
        phaseDisplay.textContent = MathRunner.phases[state.phase].label;
        const intro = Boolean(state.bossIntro);
        if (intro !== previousIntro) { clearInputs(); previousIntro = intro; setControls(mode === 'running' && !intro); }
        const arena = Boolean(state.boss);
        music?.setBoss(arena);
        if (arena !== previousArena) { clearInputs(); previousArena = arena; }
        arenaControls.hidden = !arena;
        duckButton.hidden = arena;
        leftButton.disabled = rightButton.disabled = mode !== 'running' || !arena || intro;
        canvas.setAttribute('data-arena', String(arena));
        controlsHint.textContent = arena
            ? 'Boss: ← / → move · Space jump · X throw · Jump to aim · M mute'
            : 'Hold Space / ↑ jump higher · Tap twice double jump · ↓ duck / fast fall · X chalk · P pause · M mute music';
        const bossWarning = !arena && (state.runTime ?? state.time) >= state.nextBossAt - 3;
        const scene = intro ? 'Reviewer 2 is arriving…' : arena ? `Reviewer 2 · ${state.boss.hp}/6 comments left · Jump to aim`
            : bossWarning ? 'Boss arena incoming — the run will stop!'
            : state.event ? `${state.event.label}${state.event.warning ? ' incoming…' : ` · ${Math.ceil(state.event.remaining)}s`}` : '';
        eventDisplay.textContent = scene;
        eventDisplay.hidden = !scene;
        const sceneKey = `${state.phase}:${state.bossIntro ? 'boss-intro' : state.boss ? 'boss' : bossWarning ? 'boss-warning' : state.event ? state.event.kind + state.event.warning : ''}`;
        if (sceneKey !== announcedScene) {
            announcedScene = sceneKey;
            status.textContent = scene || phaseDisplay.textContent;
        }
        if (state.pickupSerial !== announcedPickup) {
            announcedPickup = state.pickupSerial;
            status.textContent = state.pickupMessage;
        }
        if (state.rewardSerial !== announcedReward) {
            announcedReward = state.rewardSerial;
            status.textContent = '10-hit combo! Hagoromo ready. Your next throw fires giant explosive chalk.';
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
    function drawThrowGuide() {
        if (!state.boss) return;
        const body = MathRunner.player(state);
        const x = body.x + 12, y = body.y + 16;
        for (let i = 1; i <= 4; i++) rect(x + state.facing * (22 + i * 8), y, 3, 1, colors.muted);
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
    function drawGiantChalk(shot) {
        const { x, y, w, h } = shot;
        const direction = Math.sign(shot.vx || 1);
        for (let i = 1; i <= 4; i++) rect(x - direction * i * 8, y + h / 2, 4, 3, colors.muted);
        rect(x, y + 3, w, h - 6, '#fff5dc');
        rect(x + 4, y, w - 8, h, '#fff5dc');
        rect(x + 5, y + 4, 3, h - 8, '#e4bd7a');
        rect(x + w - 8, y + 4, 3, h - 8, '#b7b6a9');
        pixelText('Hagoromo', x + w / 2, y + h / 2, 11, '#172431', w - 18);
    }
    function drawExplosions() {
        for (const blast of state.explosions) {
            const progress = Math.min(1, blast.age / .55);
            const radius = blast.radius * Math.sqrt(progress);
            for (let i = 0; i < 48; i++) {
                const angle = i * Math.PI * 2 / 48;
                rect(blast.x + Math.cos(angle) * radius, blast.y + Math.sin(angle) * radius, 4, 4, '#e4bd7a');
                if (progress < .65) rect(blast.x + Math.cos(angle) * radius * .65,
                    blast.y + Math.sin(angle) * radius * .65, 3, 3, '#fff5dc');
            }
        }
    }
    function drawBossIntro() {
        const intro = state.bossIntro;
        if (!intro) return;
        const t = intro.age, w = canvas.width, h = canvas.height;
        const close = Math.min(1, t / .35, (intro.duration - t) / .35);
        rect(0, 0, w, 34 * close, '#100f1c');
        rect(0, h - 34 * close, w, 34 * close, '#100f1c');
        rect(0, 87, w, 139, '#241e34');
        rect(0, 87, w, 3, '#e87878');
        rect(0, 223, w, 3, '#e87878');
        if (!reducedMotion) {
            const offset = t * 260 % 48;
            for (let x = -48; x < w + 48; x += 48) {
                rect(x + offset, 94, 24, 3, colors.muted);
                rect(w - x - offset, 216, 24, 3, colors.muted);
            }
        }
        const entrance = reducedMotion ? 0 : Math.max(0, 1 - t / .8) ** 3 * w;
        const impact = reducedMotion ? 0 : Math.max(0, 1 - Math.abs(t - 1.15) / .28);
        const shake = Math.sin(t * 75) * impact * 5;
        pixelText('BOSS ENCOUNTER', w / 2 - entrance, 113, 12, '#e4bd7a', w - 40);
        pixelText('REVIEWER 2', w / 2 + entrance + shake, 155, Math.min(38, w / 13), '#e87878', w - 36);
        pixelText(t < 1.15 ? 'Your proof is under review.' : 'REVISE. RESUBMIT. SURVIVE.', w / 2, 191, 12, colors.ink, w - 40);
        if (t > 1.15 && !reducedMotion) {
            const radius = (t - 1.15) * 340;
            for (let i = 0; i < 28; i++) {
                const angle = i * Math.PI / 14;
                rect(w / 2 + Math.cos(angle) * radius, 155 + Math.sin(angle) * radius * .4, 6, 3, '#e4bd7a');
            }
        }
    }
    function draw() {
        const phase = MathRunner.phases[state.phase];
        colors.sky = phase.sky; colors.grid = phase.grid; colors.mint = phase.accent;
        ctx.imageSmoothingEnabled = false;
        rect(0, 0, canvas.width, canvas.height, colors.sky);
        const offset = Math.floor(state.distance * .18) % 32;
        for (let x = -offset; x < canvas.width; x += 32) rect(x, 0, 1, 252, colors.grid);
        for (let y = 28; y < 252; y += 32) rect(0, y, canvas.width, 1, colors.grid);
        drawMathBackground(phase);
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
        state.assistants.forEach(drawAssistant);
        drawShield();
        state.items.forEach(drawItem);
        state.obstacles.forEach(drawObstacle);
        drawWarnings();
        drawBoss();
        drawThrowGuide();
        for (const shot of state.enemyShots) {
            rect(shot.x, shot.y, shot.w, shot.h, colors.pink);
            if (shot.wave) pixelText("!", shot.x + shot.w / 2, shot.y + 10, 13, colors.sky, shot.w);
        }
        for (const shot of state.shots) {
            if (shot.giant) { drawGiantChalk(shot); continue; }
            if (shot.homing) {
                for (let i = 0; i < shot.trail.length; i++) {
                    const point = shot.trail[i];
                    rect(point.x, point.y, i < 6 ? 2 : 3, 2, i < 6 ? colors.muted : '#83d9dc');
                }
            }
            rect(shot.x - Math.sign(shot.vx ?? 560) * 6, shot.y + 1, 5, 2, colors.muted);
            rect(shot.x, shot.y, shot.w, shot.h, shot.homing ? '#83d9dc' : colors.ink);
            if (shot.homing) rect(shot.x - (shot.vx ?? 560) * .018, shot.y - (shot.vy || 0) * .018, 3, 3, '#83d9dc');
        }
        if (state.throwFlash > 0) {
            const body = MathRunner.player(state);
            rect(body.x + 12 + Math.cos(state.boss ? state.aimAngle : 0) * 10, body.y + (state.boss ? 16 : 10), 9, 4, colors.gold);
        }
        drawExplosions();
        for (const impact of state.impacts) {
            const radius = 4 + impact.age * 110;
            for (let i = 0; i < 12; i++) {
                const angle = i * Math.PI / 6;
                rect(impact.x + Math.cos(angle) * radius, impact.y + Math.sin(angle) * radius,
                    4, 4, impact.age < .08 ? '#fff5dc' : '#83d9dc');
            }
            if (impact.age < .08) {
                rect(impact.x - 13, impact.y - 2, 26, 4, '#fff5dc');
                rect(impact.x - 2, impact.y - 13, 4, 26, '#fff5dc');
            }
        }
        for (const particle of state.particles) rect(particle.x, particle.y, 3, 3, particle.color);
        for (const text of state.popups) pixelText(text.text, Math.max(75, Math.min(canvas.width - 75, text.x)), text.y, 10, text.color, 150);
        drawBossIntro();
        // Two quiet pips show the remaining jumps, including the mid-air jump.
        for (let i = 0; i < 2; i++) rect(78 + i * 9, 301, 5, 5,
            i < 2 - state.jumps ? colors.mint : colors.muted);
    }
    function clearInputs() {
        duckInputs.clear();
        jumpInputs.clear();
        leftInputs.clear(); rightInputs.clear();
        state.move = 0;
        state.jumpHeld = false;
        state.duck = false;
        duckButton.setAttribute('aria-pressed', 'false');
    }
    function setDuck(key, held) {
        if (held && mode === 'running' && !state.boss) {
            if (!duckInputs.size) sound?.play(state.y < MathRunner.ground ? 'fall' : 'duck');
            duckInputs.add(key);
        }
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
        pauseButton.disabled = mode !== 'running' && mode !== 'paused';
        enabled = enabled && !state.bossIntro;
        jumpButton.disabled = !enabled;
        duckButton.disabled = !enabled;
        chalkButton.disabled = !enabled;
        leftButton.disabled = rightButton.disabled = !enabled || !state.boss;
    }
    function finish() {
        mode = 'over';
        sound?.play('over');
        music?.setRunning(false);
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
        sound?.drain(state);
        updateHud();
        draw();
        if (state.over) finish();
        else frame = requestAnimationFrame(tick);
    }
    function run() {
        const resuming = mode === 'paused';
        sound?.unlock()?.then(() => { if (mode === 'running') sound.play(resuming ? 'resume' : 'start'); });
        if (mode !== 'paused') {
            state = MathRunner.create(canvas.width);
            score.textContent = '0';
            chalkDisplay.textContent = '3';
            announcedPickup = 0;
            announcedReward = 0;
            announcedScene = '';
            previousArena = false;
        }
        mode = 'running';
        music?.setRunning(true);
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
        sound?.stop();
        state.sounds.length = 0;
        if (!document.hidden && document.hasFocus?.()) sound?.play('pause');
        music?.setRunning(false);
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
        if (state.boss && state.move) state.facing = state.move < 0 ? -1 : 1;
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
        if (event.code === 'KeyM' && !event.target?.isContentEditable &&
            !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) {
            event.preventDefault();
            if (!event.repeat) music?.toggle();
            return;
        }
        if (!['Space', 'ArrowUp', 'ArrowDown', 'KeyP', 'KeyX', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) return;
        if (event.target !== canvas && event.target !== document.body &&
            ![jumpButton, duckButton, chalkButton, leftButton, rightButton].includes(event.target)) return;
        if (event.code === 'Space' && (mode === 'ready' || mode === 'over')) {
            event.preventDefault();
            if (!event.repeat) run();
            return;
        }
        if (mode !== 'running' && mode !== 'paused') return;
        const arenaInput = ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code);
        if (arenaInput && !state.boss) return;
        event.preventDefault();
        if (event.code === 'KeyP' && !event.repeat) mode === 'paused' ? run() : pause();
        if (mode !== 'running' || state.bossIntro) return;
        const inputSet = ['ArrowLeft','KeyA'].includes(event.code) ? leftInputs : ['ArrowRight','KeyD'].includes(event.code) ? rightInputs : null;
        if (inputSet) { inputSet.add(event.code); refreshArenaInputs(); }
        if (event.code === 'KeyX' && !event.repeat) MathRunner.throwChalk(state);
        if (event.code === 'ArrowDown' && !state.boss) setDuck('keyboard', true);
        else if (!event.repeat && ['Space', 'ArrowUp'].includes(event.code)) pressJump(event.code);
    });
    document.addEventListener('keyup', event => {
        for (const inputs of [leftInputs, rightInputs]) inputs.delete(event.code);
        refreshArenaInputs();
        if (event.code === 'ArrowDown') setDuck('keyboard', false);
        if (['Space', 'ArrowUp'].includes(event.code)) releaseJump(event.code);
    });
    window.addEventListener('blur', () => { pause(); sound?.stop(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); sound?.stop(); } });
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
