/* Pure simulation; also exercised by tests/runner.test.js. Coordinates are CSS-independent. */
var MathRunner = (() => {
    const ground = 252;
    const bands = [{ y: 222, h: 30 }, { y: 192, h: 28 }, { y: 132, h: 28 }];
    const motifs = [
        ['coffee', 'books', 'EXAM', 'R/I', 'Tor₁', 'Ext¹', 'GRANT'],
        ['Ax = b', 'I ⊂ R', 'ker φ', '0→M→N', 'REVIEWER|2', 'REVISE &|RESUBMIT', 'DEADLINE'],
        ['Spec R', 'THESIS', 'PhD|DEFENSE', 'NOETHER', 'LEMMA|2.1', 'PROOF?', 'dim R']
    ];
    const flyers = [
        { kind: 'student', label: 'QUICK QUESTION!', band: 1, y: 176, w: 84, h: 50, pace: 1.05 },
        { kind: 'email', label: 'URGENT MAIL', band: 1, y: 192, w: 70, h: 30, pace: 1.25 },
        { kind: 'reviewer', label: 'REVIEWER 2', band: 1, y: 194, w: 68, h: 24, pace: 1.15 },
        { kind: 'epsilon', label: 'EPSILON / DELTA', band: 2, y: 132, w: 68, h: 28, pace: 1.05 },
        { kind: 'worksheet', label: 'PROBLEM SHEET', band: 2, y: 132, w: 48, h: 30, pace: 1 },
        { kind: 'conference', label: 'ABSTRACT DUE TODAY', band: 2, y: 132, w: 76, h: 28, pace: 1.12 }
    ];
    const powerupTypes = [
        { kind: 'infinite', label: 'Unlimited chalk', duration: 10, symbol: '∞', color: '#a9ccb4' },
        { kind: 'spread', label: 'Triple throw', duration: 10, symbol: '3', color: '#e4bd7a' },
        { kind: 'shield', label: 'Invincible', duration: 6, symbol: 'S', color: '#a9c9ef' }
    ];
    const phases = [
        { label: 'Lecture week', sky: '#172431', grid: '#203442', ground: '#263e44', accent: '#a9ccb4' },
        { label: 'Exam season', sky: '#30252d', grid: '#402e38', ground: '#49393b', accent: '#e4bd7a' },
        { label: 'Conference', sky: '#202a3c', grid: '#2b3a50', ground: '#30445c', accent: '#a9c9ef' },
        { label: 'Deadline night', sky: '#241e34', grid: '#342946', ground: '#392d4b', accent: '#d69a93' }
    ];
    function phaseAt(time) { return Math.floor(time / 24) % phases.length; }
    function eventAt(time) {
        const phase = phaseAt(time), local = time % 24;
        const kind = phase === 0 ? 'office' : phase === 3 ? 'inbox' : null;
        if (!kind || local < 6 || local >= 16) return null;
        return { kind, label: kind === 'office' ? 'Office hours' : 'Inbox overflow',
            warning: local < 8, remaining: 16 - local };
    }
    function popup(state, text, x = state.x + 12, y = state.y - 55, color = '#e4bd7a') {
        state.popups.push({ text, x, y, color, life: 1 });
    }
    function releaseJump(state) {
        state.jumpHeld = false;
        if (state.vy < -260) state.vy = -260;
    }
    function finishVolley(state, shot) {
        const volley = state.volleys.find(volley => volley.id === shot.volley);
        if (volley) volley.pending--;
        while (state.volleys.length && state.volleys[0].pending === 0) {
            const done = state.volleys.shift();
            if (done.hits) {
                state.streak++;
                state.multiplier = Math.min(5, state.streak);
                const points = 5 * done.hits * state.multiplier;
                state.bonus += points;
                popup(state, `+${points}  x${state.multiplier}`);
            } else {
                if (state.streak) popup(state, 'Combo lost', 88, state.y - 55, '#d69a93');
                state.streak = 0;
                state.multiplier = 1;
            }
        }
    }
    function hitReaction(state, hit, color = '#e9efdb') {
        if (hit.kind === 'student' || hit.kind === 'worksheet') {
            hit.resolved = true;
            hit.resolvedAt = state.time;
            if (hit.kind === 'worksheet') { hit.kind = 'paperplane'; hit.w = 48; }
        } else hit.destroyed = true;
        burst(state, hit.x + hit.w / 2, hit.y + 8, hit.kind === 'reviewer' ? '#e87878' : color);
    }
    const bossInterval = 60;
    function beginBoss(state) {
        // Transition only after the last runner hazard has left the field.
        for (const shot of state.shots) finishVolley(state, shot);
        state.shots = []; state.obstacles = []; state.items = []; state.enemyShots = [];
        state.x = 76; state.move = 0; state.aimTurn = 0;
        state.aim = null; state.aimAngle = -.4; state.facing = 1;
        state.y = ground; state.vy = 0; state.jumps = 0; state.duck = false;
        state.jumpBuffer = 0; state.jumpHeld = false;
        state.boss = { kind: 'boss', x: state.width - 108, y: 120, w: 88, h: 30,
            hp: 6, maxHp: 6, age: 0, attackIn: 2.4, pattern: 0, target: null };
        state.chalk = 3; state.reload = 0; state.cooldown = 0;
        popup(state, 'Boss arena! Aim and throw', state.width / 2, 70, '#e87878');
    }
    function endBoss(state) {
        state.boss = null;
        state.enemyShots = [];
        state.x = 76; state.y = ground; state.vy = 0; state.jumps = 0;
        state.move = 0; state.aimTurn = 0; state.aim = null; state.facing = 1;
        state.duck = false; state.jumpBuffer = 0; state.jumpHeld = false;
        state.nextBossAt = state.runTime + bossInterval;
        state.spawnIn = 1.6; state.lastArrival = -Infinity;
        state.chalk = 3; state.reload = 0;
    }
    function aimAt(state, x, y) {
        if (!state.boss || !Number.isFinite(x) || !Number.isFinite(y)) return;
        state.aim = { x: Math.max(0, Math.min(state.width, x)), y: Math.max(0, Math.min(ground, y)) };
        const body = player(state);
        state.aimAngle = Math.atan2(state.aim.y - (body.y + 16), state.aim.x - (body.x + 12));
        state.facing = Math.cos(state.aimAngle) < 0 ? -1 : 1;
    }
    function updateBoss(state, dt) {
        const boss = state.boss;
        if (!boss) return;
        boss.prevX = boss.x; boss.prevY = boss.y;
        boss.age += dt;
        boss.x = Math.max(110, Math.min(state.width - boss.w - 12,
            state.width * .67 + Math.sin(boss.age * .7) * state.width * .12));
        boss.y = 120 + Math.sin(boss.age * 1.1) * 42;
        boss.attackIn -= dt;
        if (boss.attackIn <= .8 && !boss.target) {
            const body = player(state);
            boss.target = { x: body.x + body.w / 2, y: body.y + body.h / 2 };
        }
        if (boss.attackIn <= 0) {
            const pattern = boss.pattern++ % 3;
            const target = boss.target || { x: state.x + 12, y: 230 };
            if (pattern === 2) {
                state.enemyShots.push({ x: state.width - 28, y: 232, w: 24, h: 20, vx: -200, vy: 0, wave: true });
            } else {
                const x = boss.x + boss.w / 2, y = boss.y + boss.h / 2;
                const angle = Math.atan2(target.y - y, target.x - x);
                for (const offset of pattern === 1 ? [-.55, 0, .55] : [0]) {
                    state.enemyShots.push({ x, y, w: 12, h: 10,
                        vx: Math.cos(angle + offset) * 175, vy: Math.sin(angle + offset) * 175 });
                }
            }
            boss.attackIn = 2.4; boss.target = null;
        }
    }
    function create(width = 960) {
        return { width, y: ground, vy: 0, duck: false, time: 0, distance: 0,
            score: 0, speed: 180, spawnIn: 1.2, obstacles: [], over: false, count: 0,
            jumps: 0, jumpBuffer: 0, shots: [], particles: [], chalk: 3, reload: 0,
            cooldown: 0, throwFlash: 0, bonus: 0, lastArrival: -Infinity,
            encounters: 0, itemCount: 0, items: [], powerups: { infinite: 0, spread: 0, shield: 0 },
            pickupSerial: 0, pickupMessage: '', phase: 0, event: null,
            jumpHeld: true, streak: 0, multiplier: 1,
            volleys: [], nextVolley: 0, popups: [], nearMisses: 0,
            boss: null, nextBossAt: bossInterval, runTime: null, enemyShots: [],
            x: 76, move: 0, aimTurn: 0, aimAngle: -.4, aim: null, facing: 1 };
    }
    function player(state) {
        return { x: state.x, y: state.y - (state.duck && state.y === ground ? 20 : 44),
            w: 24, h: state.duck && state.y === ground ? 20 : 44 };
    }
    function jump(state) {
        if (state.over) return;
        if (state.duck && state.y === ground) return;
        if (state.jumps >= 2) { state.jumpBuffer = .12; return; }
        state.vy = state.jumps === 0 ? -510 : -430;
        state.jumps++;
        state.jumpBuffer = 0;
        burst(state, state.x + 12, state.y - 3, '#a9ccb4', 6);
    }
    function burst(state, x, y, color, count = 10) {
        for (let i = 0; i < count; i++) state.particles.push({ x, y, color,
            vx: Math.cos(i * 2.4) * 65, vy: -35 - Math.sin(i * 2.4) * 60, life: .35 });
    }
    function throwChalk(state) {
        if (state.over || (state.chalk < 1 && !state.powerups.infinite) || state.cooldown > 0) return false;
        const body = player(state);
        const directions = state.powerups.spread > 0 ? [-210, 0, 210] : [0];
        const volley = { id: state.nextVolley++, pending: directions.length, hits: 0 };
        state.volleys.push(volley);
        if (state.boss && state.aim) aimAt(state, state.aim.x, state.aim.y);
        for (const direction of directions) {
            if (state.boss) {
                const angle = state.aimAngle + Math.atan2(direction, 560);
                state.shots.push({ x: body.x + 12 + Math.cos(state.aimAngle) * 18,
                    y: body.y + 16 + Math.sin(state.aimAngle) * 18, w: 6, h: 4,
                    vx: Math.cos(angle) * 560, vy: Math.sin(angle) * 560, volley: volley.id });
            } else state.shots.push({ x: body.x + body.w, y: body.y + 10, w: 10, h: 4, vy: direction, volley: volley.id });
        }
        if (!state.powerups.infinite) state.chalk--;
        state.cooldown = .28;
        state.throwFlash = .15;
        return true;
    }
    function overlaps(a, b) {
        return a.x + a.w > b.x + 3 && a.x < b.x + b.w - 3 &&
            a.y + a.h > b.y + 3 && a.y < b.y + b.h - 3;
    }
    function shotImpact(shot, oldX, oldY, obstacle) {
        // Swept rectangles in relative coordinates: diagonal throws cannot tunnel
        // through moving flyers, or hit something merely inside their bounding box.
        const x = oldX - (obstacle.prevX ?? obstacle.x);
        const y = oldY - (obstacle.prevY ?? obstacle.y);
        const dx = shot.x - obstacle.x - x;
        const dy = shot.y - obstacle.y - y;
        let enter = 0, exit = 1;
        for (const [position, velocity, min, max] of [[x, dx, -shot.w, obstacle.w], [y, dy, -shot.h, obstacle.h]]) {
            if (Math.abs(velocity) < 1e-9) { if (position <= min || position >= max) return null; }
            else {
                const a = (min - position) / velocity, b = (max - position) / velocity;
                enter = Math.max(enter, Math.min(a, b));
                exit = Math.min(exit, Math.max(a, b));
                if (enter > exit) return null;
            }
        }
        return enter;
    }
    function step(state, dt, random = Math.random) {
        if (state.over) return;
        // Bound integration steps even when called outside the browser loop.
        dt = Math.max(0, Math.min(dt, 1 / 30));
        if (state.runTime === null) state.runTime = state.time;
        state.time += dt;
        if (!state.boss) state.runTime += dt;
        state.phase = phaseAt(state.runTime);
        state.event = eventAt(state.runTime);
        if (!state.boss && state.runTime >= state.nextBossAt && !state.obstacles.some(o => !o.resolved)) beginBoss(state);
        const arena = Boolean(state.boss);
        const previousBody = player(state);
        if (arena) {
            state.x = Math.max(12, Math.min(state.width - 36, state.x + Math.max(-1, Math.min(1, state.move)) * 230 * dt));
            if (state.move) state.facing = state.move < 0 ? -1 : 1;
            if (state.aimTurn) { state.aim = null; state.aimAngle += state.aimTurn * 1.8 * dt; }
            if (state.aim) aimAt(state, state.aim.x, state.aim.y);
            else state.facing = Math.cos(state.aimAngle) < 0 ? -1 : 1;
        } else { state.x = 76; state.move = 0; state.aimTurn = 0; }
        updateBoss(state, dt);
        for (const kind of Object.keys(state.powerups)) state.powerups[kind] = Math.max(0, state.powerups[kind] - dt);
        state.speed = Math.min(280, 180 + state.runTime * 1.3);
        if (!arena) state.distance += state.speed * dt;
        state.score = Math.floor(state.distance / 20) + state.bonus;
        state.cooldown = Math.max(0, state.cooldown - dt);
        state.throwFlash = Math.max(0, state.throwFlash - dt);
        state.jumpBuffer = Math.max(0, state.jumpBuffer - dt);
        if (state.chalk < 3) {
            state.reload += dt;
            const recharge = arena ? 1 : 4;
            if (state.reload >= recharge) { state.chalk++; state.reload -= recharge; }
        } else state.reload = 0;
        // Down in the air is a fast fall; on the ground it is a duck.
        const risingReleased = state.vy < 0 && !state.jumpHeld;
        state.vy += (state.duck && state.vy > 0 ? 2600 : risingReleased ? 2200 : 1450) * dt;
        state.y = Math.min(ground, state.y + state.vy * dt);
        if (state.y === ground) {
            if (state.jumps) burst(state, state.x + 12, ground - 2, '#718b83', 5);
            state.vy = 0;
            state.jumps = 0;
            if (state.jumpBuffer > 0) jump(state);
        }
        // Keep even a late second jump inside the visible play area.
        if (state.y < 64) { state.y = 64; state.vy = Math.max(0, state.vy); }
        if (!arena) state.spawnIn -= dt;
        if (state.spawnIn <= 0 && !arena && state.runTime < state.nextBossAt) {
            let band = Math.min(2, Math.floor(random() * 3));
            let variant = Math.min(motifs[band].length - 1, Math.floor(random() * motifs[band].length));
            const flying = random() < .45;
            let type = flying ? flyers[Math.min(flyers.length - 1, Math.floor(random() * flyers.length))] : null;
            if (state.event && !state.event.warning) type = flyers[state.event.kind === 'office' ? 0 : 1];
            else if (state.phase === 1) { band = [0, 1, 0, 2][state.encounters % 4]; variant = band === 0 ? 2 : 6; type = state.encounters % 3 === 2 ? flyers[4] : null; }
            else if (state.phase === 2 && flying) type = flyers[state.encounters % 2 ? 3 : 5];
            else if (state.phase === 3) type = flyers[state.encounters % 3 ? 1 : 4];
            const speed = state.speed * (type ? type.pace : 1);
            const x = Math.max(state.width + (type ? speed * .7 : 24),
                100 + Math.max(0, state.lastArrival + 1.6 - state.time) * speed);
            state.lastArrival = state.time + (x - 100) / speed;
            state.encounters++;
            if (state.encounters % 4 === 3) {
                const item = powerupTypes[state.itemCount++ % powerupTypes.length];
                state.items.push({ x, y: 220, w: 28, h: 28, speed, kind: item.kind });
                const risky = powerupTypes[state.itemCount % powerupTypes.length];
                state.items.push({ x: x + 42, y: 140, w: 28, h: 28, speed, kind: risky.kind, risky: true });
                // A high obstacle trails the elevated reward; the low route stays clear.
                state.obstacles.push({ x: x + 115, ...bands[2], w: 62, band: 2, variant: 2,
                    speed, baseY: bands[2].y, age: 0, optional: true });
            } else {
                state.obstacles.push({ x, ...bands[band], w: 62, band, variant,
                    ...(type || {}), speed, baseY: type ? type.y : bands[band].y,
                    age: 0, id: state.count++ });
            }
            // Leave room to land even after a second jump.
            state.spawnIn = 1.6 + random() * .55;
        }
        for (const obstacle of state.obstacles) {
            obstacle.prevX = obstacle.x;
            obstacle.prevY = obstacle.y;
            obstacle.x -= (obstacle.speed || state.speed) * dt;
            obstacle.age = (obstacle.age || 0) + dt;
            if (obstacle.resolved) {
                obstacle.y -= (obstacle.kind === 'paperplane' && state.time - obstacle.resolvedAt < .3 ? 90 : 180) * dt;
                continue;
            }
            if (obstacle.kind === 'student') obstacle.y = obstacle.baseY + Math.sin(obstacle.age * 4) * 4;
            if (obstacle.kind === 'epsilon') obstacle.y = obstacle.baseY + Math.sin(obstacle.age * 6) * 14;
            if (obstacle.kind === 'conference') obstacle.y = obstacle.baseY + Math.sin(obstacle.age * 3) * 7;
            if (obstacle.kind === 'worksheet' && (obstacle.x - 100) / obstacle.speed < 1.5) {
                obstacle.y = Math.min(222, obstacle.y + 135 * dt);
            }
        }
        for (const item of state.items) {
            item.x -= item.speed * dt;
            if (overlaps(player(state), item)) {
                const type = powerupTypes.find(type => type.kind === item.kind);
                state.powerups[item.kind] = type.duration;
                state.pickupSerial++;
                state.pickupMessage = `${type.label} — ${type.duration} seconds`;
                item.collected = true;
                burst(state, item.x + 14, item.y + 14, type.color, 14);
            }
        }
        state.items = state.items.filter(item => !item.collected && item.x + item.w > 0);
        for (const shot of state.shots) {
            const oldX = shot.x;
            const oldY = shot.y;
            shot.x += (shot.vx ?? 560) * dt;
            shot.y += (shot.vy || 0) * dt;
            // Sweep the projectile to prevent skipping narrow overlaps at low frame rates.
            // A hit anywhere on the student answers their question. Requiring the
            // small, bobbing bubble made normal standing throws pass through them.
            const hit = [...state.obstacles, ...(state.boss ? [state.boss] : [])].filter(o => !o.destroyed && !o.resolved)
                .map(obstacle => ({ obstacle, impact: shotImpact(shot, oldX, oldY, obstacle) }))
                .filter(hit => hit.impact !== null).sort((a, b) => a.impact - b.impact)[0]?.obstacle;
            if (hit) {
                if (hit.kind === 'boss') {
                    hit.hp--;
                    burst(state, hit.x + 20, hit.y + 15, '#e87878');
                    if (hit.hp === 0) {
                        burst(state, hit.x + 44, hit.y + 15, '#e87878', 28);
                        state.bonus += 100;
                        popup(state, 'Accepted! +100', state.width / 2, 90, '#a9ccb4');
                        endBoss(state);
                    }
                } else hitReaction(state, hit);
                shot.used = true;
                const volley = state.volleys.find(volley => volley.id === shot.volley);
                if (volley) volley.hits++;
                else state.bonus += 5;
            }
        }
        state.obstacles = state.obstacles.filter(o => !o.destroyed && o.x + o.w > 0 && o.y + o.h > 0);
        for (const obstacle of state.obstacles) {
            if (obstacle.resolved) continue;
            const boxes = obstacle.kind === 'student' ? [
                { x: obstacle.x, y: obstacle.y, w: obstacle.w, h: 18 },
                { x: obstacle.x + 28, y: obstacle.y + 18, w: 24, h: 26 },
                { x: obstacle.x, y: obstacle.y + 44, w: obstacle.w, h: 6 }
            ] : [obstacle];
            const body = player(state);
            if (!state.powerups.shield && !obstacle.nearRewarded) {
                for (const box of boxes) if (body.x < box.x + box.w && body.x + body.w > box.x) {
                    const gap = Math.max(box.y - (body.y + body.h), body.y - (box.y + box.h));
                    if (gap >= 0 && gap <= 12) obstacle.near = true;
                }
                if (obstacle.near && obstacle.x + obstacle.w < body.x) {
                    obstacle.nearRewarded = true;
                    state.bonus += 10;
                    const restoredChalk = state.chalk < 3;
                    state.chalk = Math.min(3, state.chalk + 1);
                    state.nearMisses++;
                    popup(state, restoredChalk ? 'Close! +10 / +1 chalk' : 'Close! +10');
                }
            }
            if (boxes.some(box => overlaps(body, box))) {
                if (state.powerups.shield > 0) {
                    hitReaction(state, obstacle, '#a9c9ef');
                } else state.over = true;
            }
        }
        for (const shot of state.enemyShots) {
            const oldX = shot.x, oldY = shot.y;
            shot.x += shot.vx * dt; shot.y += shot.vy * dt;
            const body = { ...player(state), prevX: previousBody.x, prevY: previousBody.y };
            if (shotImpact(shot, oldX, oldY, body) !== null) {
                shot.used = true;
                if (state.powerups.shield > 0) burst(state, shot.x, shot.y, '#a9c9ef');
                else state.over = true;
            }
        }
        state.enemyShots = state.enemyShots.filter(shot => !shot.used && shot.x + shot.w > 0 &&
            shot.x < state.width + 30 && shot.y + shot.h > 0 && shot.y < ground + 24);
        state.obstacles = state.obstacles.filter(o => !o.destroyed);
        state.shots = state.shots.filter(shot => {
            // At game over no projectile can hit again: settle even unfinished
            // volleys so successful spread hits still count in the final score.
            if (!state.over && !shot.used && shot.x > -30 && shot.x < state.width + 30 && shot.y > -20 && shot.y < ground + 20) return true;
            finishVolley(state, shot);
            return false;
        });
        for (const text of state.popups) { text.life -= dt; text.y -= 20 * dt; }
        state.popups = state.popups.filter(text => text.life > 0);
        for (const particle of state.particles) {
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vy += 180 * dt;
            particle.life -= dt;
        }
        state.particles = state.particles.filter(particle => particle.life > 0);
        state.score = Math.floor(state.distance / 20) + state.bonus;
    }
    return { ground, bands, motifs, flyers, powerupTypes, phases, phaseAt, eventAt, bossInterval, aimAt, create, player, jump, releaseJump, throwChalk, overlaps, shotImpact, step };
})();
