/* Pure simulation; also exercised by games/math-run/tests/runner.test.js. Coordinates are CSS-independent. */
var MathRunner = (() => {
    const ground = 252;
    const bands = [{ y: 222, h: 30 }, { y: 192, h: 28 }, { y: 132, h: 28 }];
    const motifs = [
        ['8 AM', 'books', 'EXAM', 'R/I', 'Gal(K/F)', 'Ext¹', 'GRANT'],
        ['Ax = b', 'I ⊂ R', 'ker φ', '0→A→B→C→0', 'REVIEWER|2', 'REVISE &|RESUBMIT', 'DEADLINE'],
        ['Spec R', 'THESIS', 'PhD|DEFENSE', 'NOETHER', 'LEMMA|2.1', 'PROOF?', 'dim R']
    ];
    const sequences = [
        { name: 'duck-jump', label: 'DUCK → JUMP', steps: [[1, 0], [0, .82], [2, 1.95]] },
        { name: 'jump-duck', label: 'JUMP → DUCK', steps: [[0, 0], [1, 1.05]] },
        { name: 'exam', label: 'EXAM: DUCK / JUMP', steps: [[1, 0], [0, .78], [1, 1.75]] },
        { name: 'inbox', label: 'INBOX WAVE', steps: [[1, 0], [0, .95], [1, 2]], email: true },
        { name: 'zigzag', label: 'DUCK → JUMP → DUCK → JUMP', steps: [[1, 0], [0, .82], [1, 1.9], [0, 2.8]] },
        { name: 'low-ceiling', label: 'JUMP → STAY LOW → DUCK → JUMP', steps: [[0, 0], [2, 1.15], [1, 1.85], [0, 2.8]] },
        { name: 'gauntlet', label: 'JUMP → DUCK → JUMP → DUCK → JUMP', steps: [[0, 0], [1, 1.05], [0, 1.95], [1, 3], [0, 3.9]] }
    ];
    const flyers = [
        { kind: 'student', label: 'QUICK QUESTION!', band: 1, y: 176, w: 84, h: 50, pace: 1.05 },
        { kind: 'email', label: 'URGENT MAIL', band: 1, y: 192, w: 70, h: 30, pace: 1.25 },
        { kind: 'reviewer', label: 'REVIEWER 2', band: 1, y: 194, w: 68, h: 24, pace: 1.15 },
        { kind: 'epsilon', label: '∀ε>0 ∃δ>0 ∀x∈D: |x−a|<δ ⇒ |f(x)−f(a)|<ε',
            formula: '∀ε>0 ∃δ>0 ∀x∈D: |x−a|<δ ⇒ |f(x)−f(a)|<ε',
            band: 2, y: 132, w: 520, h: 32, pace: 1.05 },
        { kind: 'worksheet', label: 'PROBLEM SHEET', band: 2, y: 132, w: 48, h: 30, pace: 1 },
        { kind: 'conference', label: 'ABSTRACT DUE TODAY', band: 2, y: 132, w: 76, h: 28, pace: 1.12 },
        { kind: 'clock', label: 'TICK TOCK', band: 1, y: 177, w: 30, h: 30, pace: 1.08 }
    ];
    const powerupTypes = [
        { kind: 'infinite', label: 'Unlimited chalk', duration: 10, symbol: '∞', color: '#a9ccb4' },
        { kind: 'spread', label: 'Triple throw', duration: 10, symbol: '3', color: '#e4bd7a' },
        { kind: 'shield', label: 'Invincible', duration: 6, symbol: 'S', color: '#a9c9ef' },
        { kind: 'assistant', label: 'Student assistant', duration: 0, symbol: '', color: '#c5b0de' },
        { kind: 'homing', label: 'Homing chalk', duration: 10, symbol: 'H', color: '#83d9dc' },
        { kind: 'espresso', label: 'Espresso jump', duration: 10, symbol: '', color: '#d9aa76' }
    ];
    const phases = ['Lecture week', 'Exam season', 'Conference', 'Deadline night'].map(label => ({
        label, sky: '#172431', grid: '#203442', ground: '#263e44', accent: '#a9ccb4'
    }));
    function worldPaletteAt(time, nextBossAt, arena = false, wins = 0) {
        const amount = arena ? 1 : stressAt(time, nextBossAt, wins).intensity;
        const red = { sky: '#48252c', grid: '#5a343c', ground: '#5c363c', accent: '#dda59b' };
        return Object.fromEntries(Object.keys(red).map(key => {
            const from = phases[0][key], to = red[key];
            const color = [1, 3, 5].map(index => Math.round(
                parseInt(from.slice(index, index + 2), 16) * (1 - amount) +
                parseInt(to.slice(index, index + 2), 16) * amount
            ).toString(16).padStart(2, '0')).join('');
            return [key, '#' + color];
        }));
    }
    function semesterAt(wins) {
        return ['Balanced semester', 'Meteor shower', 'Long formulas', 'Professor visits'][wins % 4];
    }
    function fillPrimes(state, budget = 128) {
        let candidate = BigInt(state.primeCandidate), divisor = BigInt(state.primeDivisor);
        while (budget-- > 0 && state.primeQueue.length < 32) {
            if (divisor * divisor > candidate) {
                state.primeQueue.push(candidate.toString()); candidate += 2n; divisor = 3n;
            } else if (candidate % divisor === 0n) { candidate += 2n; divisor = 3n; }
            else divisor += 2n;
        }
        state.primeCandidate = candidate.toString(); state.primeDivisor = divisor.toString();
    }
    function meteorWindow(wins) { return Math.min(50, 20 + wins * 5); }
    function phaseAt(time) { return Math.floor(time / 24) % phases.length; }
    function eventAt(time) {
        const phase = phaseAt(time), local = time % 24;
        const kind = phase === 0 ? 'office' : phase === 3 ? 'inbox' : null;
        if (!kind || local < 6 || local >= 16) return null;
        return { kind, label: kind === 'office' ? 'Office hours' : 'Inbox overflow',
            warning: local < 8, remaining: 16 - local };
    }
    function approachAt(time, nextBossAt) {
        if (!Number.isFinite(nextBossAt)) return 0;
        return Math.max(0, Math.min(1, 1 - (nextBossAt - time) / bossInterval));
    }
    function stressAt(time, nextBossAt, wins = 0) {
        const duration = Math.min(45, 20 + wins * 5);
        const remaining = nextBossAt - time;
        const intensity = Number.isFinite(remaining) ? Math.max(0, Math.min(1, (duration - remaining) / duration)) : 0;
        return { intensity, countdown: intensity > 0 && remaining > 0 ? Math.ceil(remaining) : 0,
            wave: intensity > 0 && remaining > 0 ? Math.floor((duration - remaining) / 4) : -1,
            recovery: intensity > 0 && remaining > 0 && (duration - remaining) % 4 >= 2.5 };
    }
    function pressureAt(time, nextBossAt, wins = 0) {
        if (!Number.isFinite(nextBossAt)) return 0;
        const remaining = nextBossAt - time;
        return remaining <= 10 ? 2 : remaining <= Math.min(45, 20 + wins * 5) ? 1 : 0;
    }
    function sound(state, name) {
        if (state.sounds.length < 64) state.sounds.push(name);
    }
    function damagePlayer(state) {
        if (state.over || state.hurt > 0 || state.powerups.shield > 0) return;
        state.lives = Math.max(0, state.lives - 1);
        state.hurt = 1.5;
        sound(state, 'hurt');
        burst(state, state.x + 12, state.y - 20, '#e87878', 16);
        if (!state.lives) state.over = true;
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
            if (done.cancelled) continue;
            if (done.hits) {
                state.streak++;
                state.multiplier = state.streak;
                const points = 5 * done.hits * state.multiplier;
                state.bonus += points;
                popup(state, `+${points}  x${state.multiplier}`);
                if (state.streak % 10 === 0 && !state.over) {
                    state.hagoromo++;
                    sound(state, 'reward');
                    state.rewardSerial++;
                    popup(state, '10 HIT COMBO! Hagoromo ready', state.width / 2, 85, '#fff1b8');
                }
            } else {

                if (state.streak) popup(state, 'Combo lost', 88, state.y - 55, '#d69a93');
                state.streak = 0;
                state.multiplier = 1;
            }
        }
    }
    function hitReaction(state, hit, color = '#e9efdb', force = false) {
        if (!force && hit.hp > 1) {
            hit.hp--; hit.hitFlash = .15; sound(state, 'hit');
            burst(state, hit.x + hit.w / 2, hit.y + 10, color, 5);
            return;
        }
        if (hit.hp) hit.hp = 0;
        sound(state, hit.kind === 'student' ? 'answered' : hit.kind === 'worksheet' ? 'fold' : 'hit');
        if (hit.kind === 'student' || hit.kind === 'worksheet') {
            hit.resolved = true;
            hit.resolvedAt = state.time;
            if (hit.kind === 'worksheet') { hit.kind = 'paperplane'; hit.w = 48; }
        } else hit.destroyed = true;
        burst(state, hit.x + hit.w / 2, hit.y + 8, hit.kind === 'reviewer' ? '#e87878' : color);
    }
    const bossInterval = 60;
    function beginBoss(state) {
        state.bossPressure = 0;
        sound(state, 'boss');
        state.bossIntro = { age: 0, duration: 2.4, impact: false };
        // Transition only after the last runner hazard has left the field.
        for (const shot of state.shots) {
            if (shot.giant && !shot.used) {
                // Arena transitions must not swallow an earned projectile.
                state.hagoromo++;
                const volley = state.volleys.find(volley => volley.id === shot.volley);
                if (volley) volley.cancelled = true;
            }
            finishVolley(state, shot);
        }
        state.shots = []; state.obstacles = []; state.items = []; state.enemyShots = []; state.attackers = [];
        state.x = 76; state.move = 0;
        state.aim = null; state.aimAngle = -.4; state.facing = 1;
        state.y = ground; state.vy = 0; state.jumps = 0; state.duck = false;
        state.jumpBuffer = 0; state.jumpHeld = false;
        const bossTier = Math.floor(state.bossCount / 4);
        const bossIndex = state.bossCount++ % 4;
        const blackboard = bossIndex === 1;
        state.boss = { kind: 'boss', x: state.width - 108, y: 120, w: 88, h: 30,
            hp: 6, maxHp: 6, age: 0, pickupIn: 18, attackIn: 2.4, pattern: 0, target: null, type: 'reviewer', name: 'Reviewer 2' };
        if (blackboard) Object.assign(state.boss, { type: 'blackboard', name: 'The Blackboard',
            x: Math.max(140, state.width - 154), y: 100, w: 122, h: 76, hp: 8, maxHp: 8, open: false, cycle: 0, pattern: 0 });
        if (bossIndex === 2) Object.assign(state.boss, { type: 'printer', name: 'The Printer',
            x: Math.max(150, state.width - 160), y: 166, w: 124, h: 80, hp: 8, maxHp: 8,
            open: false, cycle: 0, pattern: 0, jamAt: 3.6, sheetsFired: false, jammed: false });
        if (bossIndex === 3) Object.assign(state.boss, { type: 'deadline', name: 'The Deadline',
            x: Math.max(150, state.width - 154), y: 94, w: 104, h: 104,
            hp: 10, maxHp: 10, slow: 0, hitFlash: 0, handAngle: 0, attackIn: 2.8, pattern: 0 });
        state.boss.tier = bossTier;
        state.boss.echoIn = null;
        for (const helper of state.assistants) { helper.flight = null; helper.y = ground; helper.vy = 0; helper.x = 186; }
        state.chalk = 3; state.reload = 0; state.cooldown = 0;
        popup(state, 'Boss arena! Move, jump, throw', state.width / 2, 70, '#e87878');
    }
    function endBoss(state) {
        sound(state, 'victory');
        if (state.boss && !state.trophies.includes(state.boss.type)) state.trophies.push(state.boss.type);
        state.bossWins++;
        state.primeWarning = false;
        state.stress = stressAt(0, Infinity); state.stressTick = 0; state.stressWave = -1;
        popup(state, `Semester ${state.bossWins + 1}`, state.width / 2, 70, '#e4bd7a');
        state.boss = null;
        state.enemyShots = []; state.attackers = [];
        state.items = state.items.filter(item => !item.arena);
        state.x = 76; state.y = ground; state.vy = 0; state.jumps = 0;
        state.move = 0; state.aim = null; state.facing = 1;
        state.duck = false; state.jumpBuffer = 0; state.jumpHeld = false;
        for (const helper of state.assistants) { helper.flight = null; helper.x = Math.min(state.width - 40, 186); helper.y = ground; helper.vy = 0; }
        state.nextBossAt = state.runTime + bossInterval;
        state.bossPressure = 0;
        state.spawnIn = 1.6; state.lastArrival = -Infinity;
        state.chalk = 3; state.reload = 0;
    }
    function skipBoss(state) {
        if (!state.boss || state.over) return false;
        state.bossIntro = null;
        state.shots = []; state.volleys = []; state.sounds = [];
        endBoss(state);
        return true;
    }
    function skipPhase(state) {
        if (state.over) return false;
        if (state.boss) return skipBoss(state);
        const now = state.runTime ?? state.time;
        state.runTime = Math.max(now, Math.min((Math.floor(now / 24) + 1) * 24, state.nextBossAt));
        state.obstacles = []; state.items = []; state.enemyShots = []; state.attackers = [];
        state.shots = []; state.volleys = []; state.popups = []; state.explosions = []; state.impacts = [];
        state.y = ground; state.vy = 0; state.jumps = 0;
        state.duck = false; state.jumpHeld = false; state.jumpBuffer = 0; state.move = 0; state.boost = false;
        state.lastArrival = -Infinity; state.spawnIn = 1.2;
        state.phase = phaseAt(state.runTime); state.event = eventAt(state.runTime);
        state.bossPressure = pressureAt(state.runTime, state.nextBossAt, state.bossWins);
        state.stress = stressAt(state.runTime, state.nextBossAt, state.bossWins);
        if (state.runTime >= state.nextBossAt) beginBoss(state);
        return true;
    }
    function bossPosition(width, age, w) {
        const poses = [[.72,188],[.47,118],[.75,155],[.38,88]];
        const cycle = age / 3.2, index = Math.floor(cycle) % poses.length;
        const t = Math.min(1, (cycle % 1) * 3.2 / .85);
        const smooth = t * t * (3 - 2 * t);
        const previous = poses[(index + poses.length - 1) % poses.length], next = poses[index];
        return { x: Math.max(110, Math.min(width - w - 12, width * (previous[0] + (next[0] - previous[0]) * smooth))),
            y: previous[1] + (next[1] - previous[1]) * smooth };
    }
    function bossTargets(boss) {
        if (!boss) return [];
        if (boss.type === 'deadline') return [{ x: boss.x + 16, y: boss.y + 16, w: 72, h: 72, kind: 'boss', owner: boss,
            prevX: (boss.prevX ?? boss.x) + 16, prevY: (boss.prevY ?? boss.y) + 16 }];
        if (!['blackboard', 'printer'].includes(boss.type)) return [boss];
        const body = { x: boss.x, y: boss.y, w: boss.w, h: boss.h, kind: 'board' };
        return boss.open ? [{ ...(boss.type === 'printer' ? boss.feed : boss.eraser), kind: 'boss', owner: boss }, body] : [body];
    }
    function updateBlackboard(state, dt) {
        const boss = state.boss;
        boss.age += dt;
        boss.cycle += dt;
        const drawing = 1.2, duration = 4.8;
        if (boss.cycle >= duration) {
            boss.cycle -= duration; boss.pattern++; boss.fired = false;
        }
        const heights = [100, 156, 72, 128];
        const from = boss.pattern ? heights[(boss.pattern - 1) % heights.length] : 100;
        const t = Math.min(1, boss.cycle / drawing), ease = t * t * (3 - 2 * t);
        boss.prevY = boss.y;
        boss.y = from + (heights[boss.pattern % heights.length] - from) * ease;
        boss.open = boss.cycle >= drawing;
        const previous = boss.eraser;
        boss.eraser = { x: boss.x - 24, y: boss.y + 56, w: 32, h: 18,
            prevX: previous?.x ?? boss.x - 24, prevY: previous?.y ?? boss.y + 56 };
        if (boss.open && !boss.fired) {
            boss.fired = true; sound(state, 'attack');
            state.enemyShots.push({ x: boss.x - 34, y: 224, w: 22, h: 18,
                vx: -160, vy: 0, age: 0, graph: boss.pattern % 2 ? 'sine' : 'parabola' });
        }
    }
    function updatePrinter(state, dt) {
        const boss = state.boss;
        boss.age += dt; boss.cycle += dt;
        if (boss.cycle >= 6.2) {
            boss.cycle -= 6.2; boss.pattern++; boss.jamAt = 3.6;
            boss.sheetsFired = false; boss.jammed = false;
        }
        boss.feed = { x: boss.x - 24, y: boss.y + 24, w: 32, h: 24 };
        boss.open = boss.cycle >= 1.05 && boss.cycle < boss.jamAt;
        if (boss.cycle >= .85 && !boss.sheetsFired) {
            boss.sheetsFired = true; sound(state, 'attack');
            state.enemyShots.push({ x: boss.x - 26, y: 211, w: 30, h: 16,
                vx: -180, vy: 0, paper: true });
        }
        if (boss.cycle >= boss.jamAt && !boss.jammed) {
            boss.jammed = true; boss.open = false; sound(state, 'attack');
            state.enemyShots.push({ x: boss.x - 30, y: 232, w: 32, h: 20,
                vx: -175, vy: 0, wave: true, paper: true });
            burst(state, boss.x, ground - 12, '#e9efdb', 12);
        }
    }
    function updateDeadline(state, dt) {
        const boss = state.boss;
        const scale = boss.slow > 0 ? .45 : 1;
        const frantic = boss.hp <= 3;
        const clockDt = dt * scale;
        boss.prevX = boss.x; boss.prevY = boss.y;
        boss.slow = Math.max(0, boss.slow - dt);
        boss.hitFlash = Math.max(0, boss.hitFlash - dt);
        boss.age += clockDt;
        boss.y = 94 + Math.sin(boss.age * .8) * 14;
        boss.handAngle += clockDt * (frantic ? 4.6 : 2);
        boss.attackIn -= clockDt;
        if (boss.attackIn <= 0) {
            const floor = boss.pattern++ % 2 === 0;
            const direction = state.x + 12 < boss.x + 52 ? -1 : 1;
            state.enemyShots.push({ x: direction < 0 ? boss.x - 24 : boss.x + 80, y: floor ? 234 : 211,
                w: 48, h: 14, vx: direction * (frantic ? 220 : 170), vy: 0,
                clockHand: floor ? 'minute' : 'hour' });
            sound(state, 'attack');
            boss.attackIn = frantic ? 1.7 : 2.8;
        }
    }
    function updateBoss(state, dt) {
        const boss = state.boss;
        if (!boss) return;
        if (boss.echoIn !== null && boss.echoIn !== undefined) {
            boss.echoIn -= dt;
            if (boss.echoIn <= 0) {
                boss.echoIn = null;
                const y = boss.type === 'printer' || boss.type === 'deadline' ? 211 : 224;
                state.enemyShots.push({ x: boss.x - 32, y, w: 24, h: 16, vx: -165, vy: 0,
                    ...(boss.type === 'blackboard' ? { graph: boss.pattern % 2 ? 'parabola' : 'sine', age: 0 } : {}),
                    ...(boss.type === 'printer' ? { paper: true } : {}) });
                sound(state, 'attack');
            }
        }
        // Second-cycle bosses announce a delayed follow-up rather than overlapping attacks.
        const cycle = boss.pattern || 0;
        if (boss.tier > 0 && cycle !== boss.echoPattern) {
            boss.echoPattern = cycle;
            if (cycle > 0) { boss.echoIn = 1.1; popup(state, 'FOLLOW-UP ATTACK!', state.width / 2, 60); }
        }
        if (boss.type === 'blackboard') { updateBlackboard(state, dt); return; }
        if (boss.type === 'printer') { updatePrinter(state, dt); return; }
        if (boss.type === 'deadline') { updateDeadline(state, dt); return; }
        boss.prevX = boss.x; boss.prevY = boss.y;
        boss.age += dt;
        Object.assign(boss, bossPosition(state.width, boss.age, boss.w));
        boss.attackIn -= dt;
        if (boss.attackIn <= .8 && !boss.target) {
            const body = player(state);

            boss.target = { x: body.x + body.w / 2, y: body.y + body.h / 2 };
        }
        if (boss.attackIn <= 0) {
            sound(state, 'attack');
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
            score: 0, lives: 1, maxLives: 5, hurt: 0, speed: 180, spawnIn: 1.2, obstacles: [], over: false, count: 0,
            jumps: 0, jumpBuffer: 0, espressoSip: 0, espressoBoost: 0, espressoPuffs: [], shots: [], particles: [], chalk: 3, reload: 0,
            cooldown: 0, throwFlash: 0, bonus: 0, lastArrival: -Infinity,
            encounters: 0, itemCount: 0, nextRoute: 0, items: [], powerups: { infinite: 0, spread: 0, shield: 0, assistant: 0, homing: 0, espresso: 0 },
            attackers: [], assistants: [], nextAssistant: 0, sounds: [],
            stress: stressAt(0, Infinity), stressTick: 0, stressWave: -1, closeCall: 0,
            pickupSerial: 0, pickupMessage: '', phase: 0, event: null,
            jumpHeld: true, streak: 0, multiplier: 1,
            volleys: [], nextVolley: 0, popups: [], nearMisses: 0,
            boss: null, bossPressure: 0, deadlineShatter: null, bossCount: 0, bossWins: 0, trophies: [], primeSerial: 0, primeQueue: ['2'], primeCandidate: '3', primeDivisor: '3', semesterAnnounced: -1, primeWarning: false, bossIntro: null, nextBossAt: bossInterval, runTime: null, enemyShots: [],
            hagoromo: 0, rewardSerial: 0, explosions: [], impacts: [],
            x: 76, move: 0, boost: false, aimAngle: -.4, aim: null, facing: 1 };
    }
    function player(state) {
        return { x: state.x, y: state.y - (state.duck && state.y === ground ? 20 : 44),
            w: 24, h: state.duck && state.y === ground ? 20 : 44 };
    }
    function jump(state) {
        if (state.over || state.bossIntro) return;
        if (state.duck && state.y === ground) return;
        if (state.jumps >= (state.powerups.espresso > 0 ? 3 : 2)) { state.jumpBuffer = .12; return; }
        state.vy = state.jumps === 0 ? -510 : -430;
        state.jumps++;
        if (state.jumps === 3) {
            state.espressoBoost = .6;
            state.espressoPuffs.push({ x: state.x, y: state.y, age: 0 });
            if (state.espressoPuffs.length > 6) state.espressoPuffs.shift();
        }
        sound(state, state.jumps === 3 ? 'espressoJump' : state.jumps === 2 ? 'doubleJump' : 'jump');
        state.jumpBuffer = 0;
        burst(state, state.x + 12, state.y - 3, '#a9ccb4', 6);
    }
    function burst(state, x, y, color, count = 10) {
        for (let i = 0; i < count; i++) state.particles.push({ x, y, color,
            vx: Math.cos(i * 2.4) * 65, vy: -35 - Math.sin(i * 2.4) * 60, life: .35 });
    }
    function throwChalk(state) {
        if (state.bossIntro) return false;
        if (!state.over && state.chalk < 1 && !state.powerups.infinite && !state.hagoromo && state.cooldown <= 0) sound(state, 'empty');
        if (state.over || (state.chalk < 1 && !state.powerups.infinite && !state.hagoromo) || state.cooldown > 0) return false;
        const body = player(state);
        const giant = state.hagoromo > 0;
        const directions = !giant && state.powerups.spread > 0 ? [-210, 0, 210] : [0];
        const volley = { id: state.nextVolley++, pending: directions.length, hits: 0 };
        state.volleys.push(volley);
        if (state.boss) state.aimAngle = state.facing < 0 ? Math.PI : 0;
        if (giant) {
            const angle = state.boss ? state.aimAngle : 0;
            state.shots.push({ x: body.x + 12 + Math.cos(angle) * 48 - 42,
                y: Math.min(ground - 27, body.y + 16 + Math.sin(angle) * 28 - 13),
                w: 84, h: 26, vx: Math.cos(angle) * 420, vy: Math.sin(angle) * 420,
                volley: volley.id, giant: true, age: 0 });
            state.hagoromo--;
        } else for (const direction of directions) {
            if (state.boss) {
                const angle = state.aimAngle + Math.atan2(direction, 560);
                state.shots.push({ x: body.x + 12 + Math.cos(state.aimAngle) * 18,
                    y: body.y + 16 + Math.sin(state.aimAngle) * 18, w: 6, h: 4,
                    vx: Math.cos(angle) * 560, vy: Math.sin(angle) * 560, volley: volley.id });
            } else state.shots.push({ x: body.x + body.w, y: body.y + 10, w: 10, h: 4, vy: direction, volley: volley.id });
        }
        if (!giant && state.powerups.homing > 0) {
            for (const shot of state.shots.filter(shot => shot.volley === volley.id)) {
                shot.homing = true;
                shot.age = 0;
                shot.trail = [];
                shot.arc = state.shots.filter(other => other.volley === volley.id).indexOf(shot) - (directions.length - 1) / 2;
            }
        }
        if (!giant && !state.powerups.infinite) state.chalk--;
        sound(state, giant ? 'giant' : state.powerups.homing ? 'homing' : directions.length === 3 ? 'spread' : 'throw');
        state.cooldown = .28;
        state.throwFlash = .15;
        return true;
    }
    function steerChalk(state, shot, dt) {
        shot.age += dt;
        const targets = [...state.obstacles, ...bossTargets(state.boss)]
            .filter(target => !(target.kind === 'board' && state.boss?.open) && !target.destroyed && !target.resolved && target.x + target.w > 0 && target.x < state.width);
        if (!targets.includes(shot.target)) {
            shot.target = targets.filter(target => target.x + target.w >= shot.x)
                .sort((a, b) => Math.hypot(a.x + a.w / 2 - shot.x, a.y + a.h / 2 - shot.y) -
                    Math.hypot(b.x + b.w / 2 - shot.x, b.y + b.h / 2 - shot.y))[0];
        }
        if (!shot.target) return;
        shot.trail.push({ x: shot.x, y: shot.y });
        if (shot.trail.length > 12) shot.trail.shift();
        const target = shot.target;
        const distance = Math.hypot(target.x - shot.x, target.y - shot.y);
        const diving = shot.age >= .22 || distance < 100;
        if (diving && !shot.diving) sound(state, 'dive');
        shot.diving = diving;
        const aimX = target.x + target.w / 2 - (diving ? 0 : Math.min(110, distance * .3));
        const aimY = diving ? target.y + target.h / 2 : Math.max(45, target.y - 55 - shot.arc * 25);
        const angle = Math.atan2(shot.vy || 0, shot.vx ?? 560);
        const desired = Math.atan2(aimY - shot.y - shot.h / 2, aimX - shot.x - shot.w / 2);
        const difference = Math.atan2(Math.sin(desired - angle), Math.cos(desired - angle));
        const limit = (diving ? 14 : 10) * dt;
        const turn = Math.max(-limit, Math.min(limit, difference));
        const speed = diving ? 900 : 410;
        shot.vx = Math.cos(angle + turn) * speed;
        shot.vy = Math.sin(angle + turn) * speed;
    }
    function updateAssistant(state, helper, index, dt) {
        const homeX = Math.max(12, Math.min(state.width - 40, state.x + (state.boss ? state.facing : 1) * (110 + index * 32)));
        const targets = state.boss ? state.enemyShots.filter(shot => !shot.used) : state.obstacles;
        const old = { x: helper.x, y: helper.y - 40 };
        helper.hurt = Math.max(0, helper.hurt - dt);
        if (!helper.flight && !helper.hurt && helper.hits > 0 && helper.y === ground) {
            const target = targets.filter(o => !o.destroyed && !o.resolved && (state.boss || o.x + o.w > helper.x) &&
                !state.assistants.some(other => other !== helper && other.flight?.target === o) &&
                Math.abs(o.x - helper.x) < (o.speed || Math.abs(o.vx) || state.speed) * .65 + 60).sort((a,b) => a.x - b.x)[0];
            if (target) sound(state, 'helperJump');
            if (target) helper.flight = { age: 0, x: helper.x, y: helper.y, target };
        }
        if (helper.flight) {
            const flight = helper.flight;
            flight.age += dt;
            const t = Math.min(1, flight.age / .45);
            const target = flight.target;
            const landingX = Math.max(12, Math.min(state.width - 36, target.x + target.w / 2 - 12));
            const landingY = Math.min(ground, target.y + target.h / 2 + 20);
            helper.x = flight.x + (landingX - flight.x) * t;
            helper.y = flight.y + (landingY - flight.y) * t - 70 * Math.sin(Math.PI * t);
            const body = { x: helper.x, y: helper.y - 40, w: 24, h: 40 };
            const hit = targets.find(o => !o.used && !o.destroyed && !o.resolved &&
                !state.assistants.some(other => other !== helper && other.flight?.target === o) &&
                shotImpact(body, old.x, old.y, o) !== null);
            if (hit) {
                if (state.boss) { hit.used = true; burst(state, hit.x, hit.y, '#c5b0de'); }
                else hitReaction(state, hit, '#c5b0de', true);
                helper.hits--;
                sound(state, 'ouch');
                helper.hurt = .65;
                helper.vy = -120;
                helper.flight = null;
                popup(state, 'Ouch!', helper.x + 12, helper.y - 58, '#c5b0de');
                if (!helper.hits) helper.remaining = Math.min(helper.remaining, .65);
            } else if (t === 1 || target.destroyed || target.resolved || target.used) {
                helper.flight = null;
                helper.vy = 0;
            }
        } else {
            helper.x += Math.max(-180 * dt, Math.min(180 * dt, homeX - helper.x));
            helper.vy += 1200 * dt;
            helper.y = Math.min(ground, helper.y + helper.vy * dt);
            if (helper.y === ground) helper.vy = 0;
        }
    }

    function damageBoss(state, boss, amount) {
        if (['blackboard', 'printer'].includes(boss.type) && !boss.open) return false;
        if (boss.type === 'printer') boss.jamAt = Math.min(boss.jamAt, boss.cycle + .65);
        if (boss.type === 'deadline') { boss.slow = .8; boss.hitFlash = .18; }
        sound(state, 'bossHit');
        boss.hp = Math.max(0, boss.hp - amount);
        burst(state, boss.x + 20, boss.y + 15, '#e87878');
        if (boss.hp === 0) {
            if (boss.type === 'deadline') state.deadlineShatter = { x: boss.x + 52, y: boss.y + 52, age: 0 };
            burst(state, boss.x + 44, boss.y + 15, '#e87878', 28);
            state.bonus += 100;
            popup(state, 'Accepted! +100', state.width / 2, 90, '#a9ccb4');
            endBoss(state);
        }
        return true;
    }
    function inBlast(x, y, radius, target) {
        const dx = x - Math.max(target.x, Math.min(target.x + target.w, x));
        const dy = y - Math.max(target.y, Math.min(target.y + target.h, y));
        return dx * dx + dy * dy <= radius * radius;
    }
    function explode(state, shot, x, y) {
        if (shot.used) return;
        shot.used = true;
        sound(state, 'explosion');
        const radius = 180;
        const blast = { x, y, radius, age: 0, shot, bossHit: false };
        state.explosions.push(blast);
        burst(state, x, y, '#fff1b8', 42);
        popup(state, 'Hagoromo!', x, Math.max(45, y - 50), '#fff1b8');
        applyBlast(state, blast);
    }
    function applyBlast(state, blast) {
        const { x, y, radius, shot } = blast;
        let hits = 0;
        for (const obstacle of state.obstacles) {
            if (obstacle.destroyed || obstacle.resolved || !inBlast(x, y, radius, obstacle)) continue;
            hitReaction(state, obstacle, '#fff1b8', true);
            hits++;
        }
        // Clear hostile chalk too; collectibles and the player remain unharmed.
        state.enemyShots = state.enemyShots.filter(enemy => !inBlast(x, y, radius, enemy));
        if (state.boss && !blast.bossHit && (!['blackboard', 'printer'].includes(state.boss.type) || state.boss.open) &&
            inBlast(x, y, radius, state.boss.type === 'blackboard' ? state.boss.eraser : state.boss.type === 'printer' ? state.boss.feed : state.boss)) {
            blast.bossHit = true;
            damageBoss(state, state.boss, 3);
            hits++;
        }
        const volley = state.volleys.find(volley => volley.id === shot.volley);
        if (volley) volley.hits += hits;
        else state.bonus += hits * 5;
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
        const elapsed = Math.max(0, Math.min(dt, 1 / 30));
        const boosted = state.boost && !state.boss && !state.bossIntro;
        const slices = boosted ? 2 : 1;
        for (let i = 0; i < slices; i++) {
            advance(state, elapsed * (boosted ? 1.6 : 1) / slices, random);
            if (state.over || state.boss || state.bossIntro) break;
        }
    }
    function advance(state, dt, random) {
        if (state.over) return;
        // Bound integration steps even when called outside the browser loop.
        dt = Math.max(0, Math.min(dt, 1 / 30));
        if (state.bossIntro) {
            const intro = state.bossIntro;
            intro.age += dt;
            if (!intro.impact && intro.age >= 1.15) { intro.impact = true; sound(state, 'smash'); }
            if (intro.age >= intro.duration) { state.bossIntro = null; state.move = 0; state.jumpHeld = false; }
            return;
        }
        if (state.runTime === null) state.runTime = state.time;
        fillPrimes(state);
        if (state.semesterAnnounced !== state.bossWins) {
            state.semesterAnnounced = state.bossWins;
            if (state.bossWins > 0) popup(state, semesterAt(state.bossWins), state.width / 2, 55);
        }
        state.time += dt;
        if (!state.boss) state.runTime += dt;
        const nextPhase = phaseAt(state.runTime);

        state.phase = nextPhase;
        const nextEvent = eventAt(state.runTime);

        state.event = nextEvent;
        if (!state.boss && state.runTime >= state.nextBossAt && !state.obstacles.some(o => !o.resolved)) { beginBoss(state); return; }
        const arena = Boolean(state.boss);
        state.bossPressure = arena ? 0 : pressureAt(state.runTime, state.nextBossAt, state.bossWins);
        state.closeCall = Math.max(0, state.closeCall - dt);
        state.stress = arena ? stressAt(0, Infinity) : stressAt(state.runTime, state.nextBossAt, state.bossWins);
        const tickSecond = Math.ceil(state.nextBossAt - state.runTime);
        if (state.stress.intensity > 0 && tickSecond !== state.stressTick) sound(state, 'tick');
        state.stressTick = tickSecond;
        if (state.stress.wave >= 0 && state.stress.wave !== state.stressWave) {
            state.stressWave = state.stress.wave;
            popup(state, ['SUBMISSION DUE!', 'REVIEWER 2 HAS QUESTIONS!', 'INBOX OVERLOAD!', 'FINAL REVISION!', 'DEADLINE!'][state.stress.wave % 5], state.width / 2, 88, '#e4bd7a');
            sound(state, state.stress.wave % 2 ? 'mailPing' : 'printerRattle');
        }
        const remainingToBoss = state.nextBossAt - state.runTime;
        if (!arena && remainingToBoss <= meteorWindow(state.bossWins) + 2 && !state.primeWarning) {
            state.primeWarning = true;
            sound(state, 'warning');
            popup(state, 'PRIME ASTEROIDS INCOMING', state.width / 2, 65, '#e87878');
        }
        for (const attacker of state.attackers) { attacker.age += dt; attacker.life -= dt; }
        state.attackers = state.attackers.filter(attacker => attacker.life > 0);
        const previousBody = player(state);
        if (arena) {
            state.x = Math.max(12, Math.min(state.width - 36, state.x + Math.max(-1, Math.min(1, state.move)) * 230 * dt));
            if (state.move) state.facing = state.move < 0 ? -1 : 1;
        } else { state.x = 76; state.move = 0; }
        updateBoss(state, dt);
        if (state.boss) {
            state.boss.pickupIn = (state.boss.pickupIn ?? 18) - dt;
            if (state.boss.pickupIn <= 0 && !state.items.some(item => item.arena)) {
                const type = powerupTypes[Math.min(powerupTypes.length - 1, Math.floor(random() * powerupTypes.length))];
                const x = state.x < state.width / 2 ? state.width * .78 : state.width * .18;
                state.items.push({ x: Math.max(20, Math.min(state.width - 48, x)), y: 58 + random() * 18,
                    w: 28, h: 28, speed: 0, kind: type.kind, arena: true, life: 6.5 });
                state.boss.pickupIn = 24 + random() * 10;
            }
        }
        for (const kind of Object.keys(state.powerups)) {
            if (kind !== 'assistant') {

                state.powerups[kind] = Math.max(0, state.powerups[kind] - dt);
            }
        }

        for (const helper of state.assistants) if (!helper.hits) helper.remaining = Math.max(0, helper.remaining - dt);
        state.assistants = state.assistants.filter(helper => helper.remaining > 0);
        state.powerups.assistant = Math.max(0, ...state.assistants.map(helper => helper.remaining));
        const approach = approachAt(state.runTime, state.nextBossAt);
        // Victories raise the baseline with diminishing gains, keeping reaction time bounded.
        const escalation = state.bossWins / (state.bossWins + 4);
        // Keep encounter speeds fixed once spawned to preserve their dodge timing.
        state.speed = Number.isFinite(state.nextBossAt)
            ? 180 + 100 * escalation + 120 * approach + 160 * Math.pow(Math.max(0, (approach - .75) / .25), 2)
            : Math.min(280, 180 + state.runTime * 1.3);
        if (!arena) state.distance += state.speed * dt;
        state.score = Math.floor(state.distance / 20) + state.bonus;
        state.cooldown = Math.max(0, state.cooldown - dt);
        state.throwFlash = Math.max(0, state.throwFlash - dt);
        state.hurt = Math.max(0, state.hurt - dt);
        state.espressoSip = Math.max(0, state.espressoSip - dt);
        state.espressoBoost = Math.max(0, state.espressoBoost - dt);
        for (const puff of state.espressoPuffs) puff.age += dt;
        state.espressoPuffs = state.espressoPuffs.filter(puff => puff.age < .7);
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
            if (state.jumps) sound(state, 'land');
            if (state.jumps) burst(state, state.x + 12, ground - 2, '#718b83', 5);
            state.vy = 0;
            state.jumps = 0;
            if (state.jumpBuffer > 0) jump(state);
        }
        // Keep even a late second jump inside the visible play area.
        if (state.y < 64) { state.y = 64; state.vy = Math.max(0, state.vy); }
        if (state.boss) state.aimAngle = state.facing < 0 ? Math.PI : 0;
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
            const encounter = state.encounters + 1;
            if (flying && encounter % 6 === 4 && !(state.event && !state.event.warning)) type = flyers[6];
            const reward = encounter % 8 === 0 || encounter % 4 === 3;
            let sequence = !reward && state.runTime >= 12 && !(state.event?.kind === 'office' && !state.event.warning)
                ? state.phase === 3 ? sequences[3] : state.phase === 1 ? sequences[state.encounters % 3 === 2 ? 1 : 2]
                    : state.bossPressure === 2 ? sequences[[2, 0, 1][state.encounters % 3]]
                    : ((state.bossPressure === 1 ? encounter % 2 === 0 : encounter % 4 === 2) || random() < approach * .65)
                        ? sequences[Math.floor(state.encounters / 4) % 2] : null : null;
            // Longer curated combinations unlock after victories.
            if (!reward && state.bossWins > 0 && (encounter % 2 === 0 || approach >= .65)
                && !(state.event?.kind === 'office' && !state.event.warning)) {
                const unlocked = state.bossWins >= 2 ? 3 : 2;
                sequence = sequences[4 + Math.floor(state.encounters / 2) % unlocked];
            }
            if (!reward && (state.bossWins >= 3 || state.bossWins % 4 === 1) && remainingToBoss <= meteorWindow(state.bossWins) && encounter % 3 === 0) sequence = sequences[6];
            if (!reward && state.bossWins % 4 === 3 && encounter % 3 === 0) sequence = sequences[4];
            const falling = !type && !reward && !sequence && state.runTime >= 6 && encounter % 7 === 1
                && !(state.event && !state.event.warning);
            if (falling) { type = null; band = 0; variant = 1; }
            const firstNewObstacle = state.obstacles.length;
            const speed = reward ? Math.min(320, state.speed) : sequence ? state.speed * (sequence.email ? 1.35 : 1) : state.speed * (type ? type.pace : 1);
            const clearance = Number.isFinite(state.nextBossAt) ? 1.8 - .55 * approach - .2 * escalation : 1.6;
            const x = Math.max(state.width + (type ? speed * .7 : 24),
                100 + Math.max(0, state.lastArrival + clearance - state.time) * speed);
            state.lastArrival = state.time + (x - 100) / speed;
            state.encounters++;
            let routeDuration = 0;
            if (state.encounters % 8 === 0) {
                state.items.push({ x, y: 220, w: 28, h: 28, speed, kind: 'heart' });
            } else if (state.encounters % 4 === 3) {
                const route = state.nextRoute++;
                const expert = state.bossWins > 0 && route % 3 === 2;
                const item = powerupTypes[state.itemCount % powerupTypes.length];
                if (route % 2 === 0) state.itemCount++;
                state.items.push({ x, y: 220, w: 28, h: 28, speed, kind: 'points', route, points: 10 });
                state.items.push({ x: x - speed * .35, y: 86, w: 28, h: 28, speed,
                    kind: route % 2 ? 'heart' : item.kind, route, risky: true, ...(expert ? { riskBonus: 50 } : {}) });
                // Scale the landing window with speed, including late-semester peaks.
                const trailGap = Math.max(115, speed * .55);
                routeDuration = trailGap / speed; state.lastArrival += routeDuration;
                // A high obstacle trails the elevated reward; the low route stays clear.
                state.obstacles.push({ x: x + trailGap, ...bands[2], w: 62, band: 2, variant: 2,
                    speed, baseY: bands[2].y, age: 0, optional: true });
                if (expert) {
                    // The ground path stays safe; upper collectors must fast-fall through a longer ceiling.
                    for (const offset of [.65, 1.2]) state.obstacles.push({
                        x: x + trailGap + offset * speed, ...bands[2], w: 62, band: 2, variant: 6,
                        speed, baseY: bands[2].y, age: 0, optional: true, riskRoute: route
                    });
                    state.lastArrival += 1.2; routeDuration += 1.2;
                }
            } else if (sequence) {
                sequence.steps.forEach(([lane, offset], index) => {
                    const flyer = sequence.email ? flyers[1] : null;
                    state.obstacles.push({ x: x + offset * speed, ...bands[lane], w: 44,
                        ...(flyer || {}), band: lane, y: bands[lane].y, baseY: bands[lane].y,
                        variant: (encounter + index * 2) % motifs[lane].length, speed, age: 0, id: state.count++,
                        sequence: sequence.name, label: sequence.label, sequenceLead: index === 0,
                        ...(state.bossPressure === 2 && !sequence.email && index === sequence.steps.length - 1
                            ? { armor: 'proof', hp: 2, maxHp: 2 } : {}) });
                });
                state.lastArrival += sequence.steps.at(-1)[1];
            } else {
                const armor = !type && encounter % 5 === 0 ? (encounter % 10 === 0 ? 'report' : 'proof') : null;
                state.obstacles.push({ x, ...bands[band], w: 62, band, variant,
                    ...(type || {}), speed, baseY: type ? type.y : bands[band].y,
                    age: 0, id: state.count++, ...(armor ? { armor, hp: armor === 'report' ? 3 : 2, maxHp: armor === 'report' ? 3 : 2 } : {}) });
            }
            if (sequence && state.runTime >= 12 && ([2, 6].includes(encounter % 8) || (state.bossWins % 4 === 3 && encounter % 3 === 0))) {
                const attacker = encounter % 8 === 6 ? 'paperPrinter' : 'professor';
                const projectiles = state.obstacles.slice(firstNewObstacle);
                for (const obstacle of projectiles) {
                    if (!obstacle.armor && motifs[obstacle.band][obstacle.variant] === '0→A→B→C→0') continue;
                    Object.assign(obstacle, { kind: attacker === 'professor' ? 'integral' : 'paperAvalanche',
                        label: attacker === 'professor' ? 'PROFESSOR: INTEGRALS!' : 'PRINTER: PAPER AVALANCHE!',
                        w: attacker === 'professor' ? (state.bossWins > 0 && obstacle.band === 1 && state.encounters % 2 === 0 ? 54 : 30) : 44 });
                }
                if (attacker === 'paperPrinter' && state.bossWins > 0) {
                    const last = projectiles.at(-1);
                    state.obstacles.push({ ...last, x: last.x + speed * 1.1, band: 1, y: 192, baseY: 192, h: 28, w: 44, id: state.count++ });
                    routeDuration += 1.1; state.lastArrival += 1.1;
                    popup(state, 'PAPER JAM: EXTRA SHEETS!', state.width / 2, 75);
                }
                state.attackers.push({ kind: attacker, age: 0,
                    life: (projectiles.at(-1).x - state.width) / speed + 2 });
                sound(state, attacker === 'professor' ? 'attack' : 'printerRattle');
            }
            // Asteroids occupy existing jump slots, preserving the surrounding duck/jump route.
            if (remainingToBoss <= meteorWindow(state.bossWins)) {
                const count = state.bossWins >= 6 ? 3 : state.bossWins >= 3 || state.bossWins % 4 === 1 ? 2 : 1;
                const targets = state.obstacles.slice(firstNewObstacle).filter(o => o.band === 0 && !o.optional).slice(0, count);
                for (const [index, target] of targets.entries()) {
                    if (!state.primeQueue.length) break;
                    const prime = state.primeQueue.shift(); state.primeSerial++;
                    const span = [240, 320, 200][index];
                    Object.assign(target, { kind: 'prime', prime,
                        label: 'PRIME ASTEROIDS', w: Math.min(112, Math.max(30, prime.length * 8 + 8)), h: 30, y: 8, baseY: ground - 30,
                        dropLead: Math.min(1.25, (state.width - 100) / speed - .05),
                        impacted: false, impactAge: 0, flightSpan: span, flightOffset: span });
                    target.dropDuration = Math.max(.18, Math.min(.65, target.dropLead - .45));
                    delete target.armor; delete target.hp; delete target.maxHp;
                    sound(state, 'attack');
                }
            }
            // Longer exact-sequence tiles also reserve room before the next obstacle.
            let extraWidth = 0;
            for (const obstacle of state.obstacles.slice(firstNewObstacle)) {
                obstacle.x += extraWidth;
                if (obstacle.kind === 'prime') { obstacle.x += obstacle.flightOffset; extraWidth += obstacle.w - 30; }
                if (obstacle.kind === 'epsilon') {
                    if (state.bossWins % 4 === 2) { obstacle.w += 140; obstacle.formula = 'f:D⊆ℝ→ℝ, a∈D: ' + obstacle.formula; }
                    extraWidth += obstacle.w - 68;
                }
                if (!obstacle.kind && !obstacle.armor && motifs[obstacle.band][obstacle.variant] === '0→A→B→C→0') {
                    extraWidth += 132 - obstacle.w;
                    obstacle.w = 132;
                }
            }
            state.lastArrival += extraWidth / speed;
            // Falling objects take existing ground slots, preserving safe group spacing.
            let dropped = false;
            for (const obstacle of state.obstacles.slice(firstNewObstacle)) {
                if (obstacle.band !== 0 || obstacle.optional || ['prime', 'integral', 'paperAvalanche'].includes(obstacle.kind)) continue;
                if (dropped || (!falling && !(sequence && state.encounters % 5 === 2 && (state.bossWins > 0 || approach >= .4)))) continue;
                dropped = true;
                obstacle.falling = ['books', 'archive', 'exams', 'blackboard'][Math.floor(state.encounters / 2) % 4];
                obstacle.dropFrom = 32;
                obstacle.dropLead = Math.min(2, (state.width - 100) / speed - .05);
                obstacle.dropDuration = Math.max(.2, Math.min(.65, obstacle.dropLead - .65));
                obstacle.y = obstacle.dropFrom;
                obstacle.baseY = ground - obstacle.h;
            }
            // Keep safe gaps inside patterns; alternate bursts with longer recovery.
            const recoveryGap = state.stress.recovery ? 1.1 : 0;
            // Leave room to land even after a second jump.
            state.spawnIn = routeDuration + recoveryGap + extraWidth / speed + (sequence ? sequence.steps.at(-1)[1] + (sequence.email ? 3.4 : clearance) : clearance) + random() * (.55 - .3 * approach);
        }
        for (const obstacle of state.obstacles) {
            obstacle.hitFlash = Math.max(0, (obstacle.hitFlash || 0) - dt);
            obstacle.prevX = obstacle.x;
            obstacle.prevY = obstacle.y;
            obstacle.x -= (obstacle.speed || state.speed) * dt;
            obstacle.age = (obstacle.age || 0) + dt;
            if (obstacle.kind && !obstacle.resolved && !obstacle.warned && obstacle.x >= state.width &&
                (obstacle.x - state.width) / (obstacle.speed || state.speed) <= .75) {
                obstacle.warned = true; sound(state, 'warning');
            }
            if (obstacle.resolved) {
                obstacle.y -= (obstacle.kind === 'paperplane' && state.time - obstacle.resolvedAt < .3 ? 90 : 180) * dt;
                continue;
            }
            if (obstacle.kind === 'prime') {
                const groundX = obstacle.x - obstacle.flightOffset;
                const remaining = (groundX - 100) / obstacle.speed;
                const progress = Math.max(0, Math.min(1, (obstacle.dropLead - remaining) / obstacle.dropDuration));
                const offset = obstacle.flightSpan * (1 - progress);
                obstacle.x += offset - obstacle.flightOffset;
                obstacle.flightOffset = offset;
                // A straight, shallow diagonal from the upper right, rather than a vertical drop.
                obstacle.y = 8 + (obstacle.baseY - 8) * progress;
                obstacle.tailSlope = (obstacle.baseY - 8) / (obstacle.flightSpan + obstacle.speed * obstacle.dropDuration);
                obstacle.impactX = groundX - obstacle.speed * Math.max(0, remaining - (obstacle.dropLead - obstacle.dropDuration));
                if (progress > 0 && !obstacle.dropWarned) { obstacle.dropWarned = true; sound(state, 'warning'); }
                if (progress === 1 && !obstacle.impacted) {
                    obstacle.impacted = true; sound(state, 'smash');
                    burst(state, obstacle.x + obstacle.w / 2, ground - 3, '#e4bd7a', 16);
                }
                if (obstacle.impacted) obstacle.impactAge += dt;
            }
            if (obstacle.falling) {
                const remaining = (obstacle.x - 100) / obstacle.speed;
                const progress = Math.max(0, Math.min(1, (obstacle.dropLead - remaining) / obstacle.dropDuration));
                obstacle.y = obstacle.dropFrom + (obstacle.baseY - obstacle.dropFrom) * progress * progress;
                if (progress > 0 && !obstacle.dropWarned) {
                    obstacle.dropWarned = true; sound(state, 'warning');
                }
                if (progress === 1 && !obstacle.landed) {
                    obstacle.landed = true;
                    burst(state, obstacle.x + obstacle.w / 2, ground - 2, '#e4bd7a', 8);
                }
            }
            if (obstacle.kind === 'student') obstacle.y = obstacle.baseY + Math.sin(obstacle.age * 4) * 4;
            if (obstacle.kind === 'clock') obstacle.y = 177 + Math.sin(obstacle.age * 2.2) * 45;
            if (obstacle.kind === 'epsilon') obstacle.y = obstacle.baseY + Math.sin(obstacle.age * 6) * 14;
            if (obstacle.kind === 'conference') obstacle.y = obstacle.baseY + Math.sin(obstacle.age * 3) * 7;
            if (obstacle.kind === 'worksheet' && (obstacle.x - 100) / obstacle.speed < 1.5) {
                obstacle.y = Math.min(222, obstacle.y + 135 * dt);
            }
        }
        for (const item of state.items) {
            if (item.collected) continue;
            if (item.arena) { item.life -= dt; if (item.life <= 0) continue; }
            item.x -= item.speed * dt;
            if (overlaps(player(state), item)) {
                if (item.riskBonus) { state.bonus += item.riskBonus; popup(state, `RISK ROUTE +${item.riskBonus}`, item.x, item.y - 20, '#e4bd7a'); }
                if (item.kind === 'points') {
                    state.bonus += item.points || 10; item.collected = true;
                    state.pickupSerial++; state.pickupMessage = 'Safe route — +10 points';
                    popup(state, '+10', item.x, item.y - 15);
                    continue;
                }
                if (item.kind === 'heart') {
                    const healed = state.lives < state.maxLives;
                    state.lives = Math.min(state.maxLives, state.lives + 1);
                    item.collected = true;
                    state.pickupSerial++;
                    state.pickupMessage = healed ? 'Heart collected — one life restored' : 'Hearts full';
                    if (healed) sound(state, 'heal');
                    burst(state, item.x + 14, item.y + 14, '#e87878', 14);
                    continue;
                }
                const type = powerupTypes.find(type => type.kind === item.kind);
                state.powerups[item.kind] = type.duration;
                if (item.kind === 'espresso') state.espressoSip = .95;
                if (item.kind === 'assistant') state.assistants.push({ id: state.nextAssistant++, remaining: Infinity,
                    hits: 5, hurt: 0, x: Math.min(state.width - 40, state.x + 110 + state.assistants.length * 32),
                    y: ground, vy: 0, flight: null });
                sound(state, item.kind === 'assistant' ? 'hire' : 'pickup');
                state.pickupSerial++;
                state.pickupMessage = item.kind === 'assistant' ? 'Student assistant hired — 5 lives' : `${type.label} — ${type.duration} seconds`;
                item.collected = true;
                burst(state, item.x + 14, item.y + 14, type.color, 14);
            }
        }
        state.items = state.items.filter(item => !item.collected && (!item.arena || item.life > 0) && item.x + item.w > 0);
        for (const shot of state.shots) {
            const oldX = shot.x;
            const oldY = shot.y;
            if (shot.homing) steerChalk(state, shot, dt);
            shot.x += (shot.vx ?? 560) * dt;
            shot.y += (shot.vy || 0) * dt;
            if (shot.giant) shot.age += dt;
            // Sweep the projectile to prevent skipping narrow overlaps at low frame rates.
            // A hit anywhere on the student answers their question. Requiring the
            // small, bobbing bubble made normal standing throws pass through them.
            const collision = [...state.obstacles, ...bossTargets(state.boss)].filter(o => !o.destroyed && !o.resolved)
                .map(obstacle => ({ obstacle, impact: shotImpact(shot, oldX, oldY, obstacle) }))
                .filter(hit => hit.impact !== null).sort((a, b) => a.impact - b.impact)[0];
            const hit = collision?.obstacle;
            if (shot.giant) {
                const leaving = shot.x + shot.w < 0 || shot.x > state.width || shot.y + shot.h < 0 || shot.y + shot.h > ground;
                if (hit || shot.age >= .9 || leaving) {
                    const t = collision?.impact ?? 1;
                    explode(state, shot, oldX + (shot.x - oldX) * t + shot.w / 2,
                        oldY + (shot.y - oldY) * t + shot.h / 2);
                }
                continue;
            }
            if (hit) {
                if (hit.kind === 'boss') damageBoss(state, hit.owner || hit, 1);
                else if (hit.kind === 'board') { sound(state, 'shield'); burst(state, shot.x, shot.y, '#a9ccb4', 5); }
                else hitReaction(state, hit);
                if (shot.homing) {
                    sound(state, 'smash');
                    const x = oldX + (shot.x - oldX) * collision.impact + shot.w / 2;
                    const y = oldY + (shot.y - oldY) * collision.impact + shot.h / 2;
                    state.impacts.push({ x, y, age: 0 });
                    burst(state, x, y, '#83d9dc', 28);
                    for (let i = 0; i < 8; i++) state.particles.push({ x, y,
                        vx: (shot.vx || 560) * (.1 + i * .025), vy: (shot.vy || 0) * .15 + (i - 3.5) * 35,
                        color: '#fff5dc', life: .28 });
                }
                shot.used = true;
                const volley = state.volleys.find(volley => volley.id === shot.volley);
                if (hit.kind !== 'board') {
                    if (volley) volley.hits++;
                    else state.bonus += 5;
                }
            }
        }
        {
            state.assistants.forEach((helper, index) => updateAssistant(state, helper, index, dt));
            state.powerups.assistant = Math.max(0, ...state.assistants.map(helper => helper.remaining));
        }
        // The visible blast also clears hazards entering after detonation.
        for (const blast of state.explosions) applyBlast(state, blast);
        state.obstacles = state.obstacles.filter(o => !o.destroyed && o.x + o.w > 0 && o.y + o.h > 0);
        for (const obstacle of state.obstacles) {
            if (obstacle.resolved) continue;
            const boxes = obstacle.kind === 'student' ? [
                { x: obstacle.x, y: obstacle.y, w: obstacle.w, h: 18 },
                { x: obstacle.x + 28, y: obstacle.y + 18, w: 24, h: 26 },
                { x: obstacle.x, y: obstacle.y + 44, w: obstacle.w, h: 6 }
            ] : [obstacle];
            const body = player(state);
            if (!state.powerups.shield && !state.hurt && !obstacle.nearRewarded) {
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
                    state.closeCall = .35;
                    sound(state, 'heartbeat');

                    popup(state, restoredChalk ? 'Close! +10 / +1 chalk' : 'Close! +10');
                }
            }
            if (boxes.some(box => overlaps(body, box))) {
                if (state.powerups.shield > 0) {
                    sound(state, 'shield');
                    hitReaction(state, obstacle, '#a9c9ef', true);
                } else damagePlayer(state);
            }
        }
        for (const shot of state.enemyShots) {
            if (shot.used) continue;
            const oldX = shot.x, oldY = shot.y;
            shot.prevX = oldX; shot.prevY = oldY;
            const slow = shot.clockHand && state.boss?.type === 'deadline' && state.boss.slow > 0 ? .45 : 1;
            shot.x += shot.vx * dt * slow; shot.y += shot.vy * dt * slow;
            if (shot.graph) {
                shot.age += dt;
                shot.trail ||= []; shot.trail.push({ x: oldX, y: oldY });
                if (shot.trail.length > 18) shot.trail.shift();
                shot.y = shot.graph === 'parabola' ? 234 - 96 * Math.abs(Math.sin(shot.age * 3.1)) : 222 + Math.sin(shot.age * 5) * 12;
            }
            if (state.explosions.some(blast => inBlast(blast.x, blast.y, blast.radius, shot))) {
                shot.used = true;
                continue;
            }
            const body = { ...player(state), prevX: previousBody.x, prevY: previousBody.y };
            if (shotImpact(shot, oldX, oldY, body) !== null) {
                shot.used = true;
                if (state.powerups.shield > 0) { sound(state, 'shield'); burst(state, shot.x, shot.y, '#a9c9ef'); }
                else damagePlayer(state);
            }
        }
        state.enemyShots = state.enemyShots.filter(shot => !shot.used && shot.x + shot.w > 0 &&
            shot.x < state.width + 30 && shot.y + shot.h > 0 && shot.y < ground + 24);
        state.obstacles = state.obstacles.filter(o => !o.destroyed);
        state.shots = state.shots.filter(shot => {
            // At game over no projectile can hit again: settle even unfinished
            // volleys so successful spread hits still count in the final score.
            if (!state.over && !shot.used && (!shot.homing || shot.age < 2.5) && shot.x > -30 && shot.x < state.width + 30 && shot.y > -20 && shot.y < ground + 20) return true;
            if (!state.explosions.some(blast => blast.shot === shot)) finishVolley(state, shot);
            return false;
        });
        for (const explosion of state.explosions) {
            explosion.age += dt;
            if (explosion.age >= .55 || state.over) finishVolley(state, explosion.shot);
        }
        state.explosions = state.explosions.filter(explosion => explosion.age < .55 && !state.over);
        if (state.deadlineShatter) {
            state.deadlineShatter.age += dt;
            if (state.deadlineShatter.age > 1) state.deadlineShatter = null;
        }
        for (const impact of state.impacts) impact.age += dt;
        state.impacts = state.impacts.filter(impact => impact.age < .25);
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
    return { ground, bands, motifs, sequences, flyers, powerupTypes, phases, worldPaletteAt, phaseAt, eventAt, approachAt, stressAt, pressureAt, bossInterval, create, fillPrimes, meteorWindow, semesterAt, skipBoss, skipPhase, player, jump, releaseJump, throwChalk, overlaps, shotImpact, step };
})();
