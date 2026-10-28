// Run from the repository root: gjs games/math-run/tests/runner.test.js
const GLib = imports.gi.GLib;
const [, source] = GLib.file_get_contents('games/math-run/runner-engine.js');
const engine = new Function(new TextDecoder().decode(source) + '; return MathRunner;')();
function assert(condition, message) { if (!condition) throw Error(message); }
function obstacle(band, x = 80) { return { ...engine.bands[band], x, w: 62, band, variant: 0 }; }
function trial(band, action, initialTime = 0, dt = 1 / 120) {
    const state = engine.create(420);
    state.lives = 1; // Collision routes are tested with one life remaining.
    state.time = initialTime;
    state.spawnIn = Infinity;
    const speed = Math.min(280, 180 + initialTime * 1.3);
    state.obstacles = [obstacle(band, 100 + speed * .14)];
    if (action === 'jump') engine.jump(state);
    if (action === 'duck') state.duck = true;
    for (let i = 0; i < Math.ceil(1.25 / dt); i++) engine.step(state, dt);
    return state;
}
for (const dt of [1/30, 1/60, 1/144]) {
    assert(!trial(0, 'jump', 0, dt).over, 'low obstacle jump at different frame rates');
    assert(!trial(0, 'jump', 100, dt).over, 'maximum speed jump at different frame rates');
}
for (const time of [0, 20, 50, 100]) {
    assert(!trial(0, 'jump', time).over, 'low obstacles can be jumped at every speed');
    assert(trial(0, 'stand', time).over, 'low obstacle hits standing player');
    assert(trial(0, 'duck', time).over, 'ducking does not avoid floor obstacles');
    assert(!trial(1, 'duck', time).over, 'middle obstacle can be ducked');
    assert(trial(1, 'stand', time).over, 'middle obstacle hits standing player');
    assert(!trial(2, 'stand', time).over, 'high obstacle safely passes standing player');
    assert(!trial(2, 'duck', time).over, 'high obstacle safely passes ducking player');
    assert(trial(2, 'jump', time).over, 'jumping into high obstacle collides');
}
let state = engine.create();
engine.jump(state);engine.step(state, .02);
const vy = state.vy;engine.jump(state);
assert(state.vy === -430 && state.vy !== vy && state.jumps === 2, 'second jump gives a new upward impulse');
const doubleVy = state.vy;engine.jump(state);
assert(state.vy === doubleVy && state.jumps === 2, 'no third jump');
for(let i=0;i<100;i++) engine.step(state, 1/120);
assert(state.y === engine.ground && state.vy === 0, 'lands exactly on ground');
assert(state.jumps === 0, 'landing restores both jumps');
state.duck = true;engine.jump(state);assert(state.vy === 0, 'cannot jump while ducking');
assert(engine.player(state).h === 20, 'duck hitbox');
state.duck = false;assert(engine.player(state).h === 44, 'standing hitbox');
// Chalk is finite, recharges, and intersects only the height of the throw.
state = engine.create();state.spawnIn = Infinity;
state.obstacles = [obstacle(1, 180), obstacle(0, 180)];
assert(engine.throwChalk(state), 'chalk can be thrown');
assert(!engine.throwChalk(state) && state.chalk === 2, 'throw cooldown prevents spam');
for(let i=0;i<14;i++)engine.step(state,1/120);
assert(state.obstacles.length === 1 && state.obstacles[0].band === 0, 'standing chalk hits middle target, not ground target');
assert(state.bonus === 5 && state.shots.length === 0, 'one shot destroys one obstacle and awards bonus');
state = engine.create();state.spawnIn = Infinity;state.duck = true;
state.obstacles = [obstacle(0,180)];engine.throwChalk(state);
for(let i=0;i<14;i++)engine.step(state,1/120);
assert(state.obstacles.length === 0, 'ducked throw hits low target');
state = engine.create();state.spawnIn = Infinity;state.y = 168;state.jumps = 1;
state.obstacles = [obstacle(2,180)];engine.throwChalk(state);
for(let i=0;i<14;i++)engine.step(state,1/120);
assert(state.obstacles.length === 0, 'airborne throw hits high target');
state = engine.create();state.spawnIn = Infinity;
for(let i=0;i<3;i++){state.cooldown=0;assert(engine.throwChalk(state),'three starting pieces');}
state.cooldown=0;assert(!engine.throwChalk(state),'empty chalk cannot fire');
for(let i=0;i<481;i++)engine.step(state,1/120);
assert(state.chalk === 1,'one piece recharges every four seconds');
assert(state.shots.length===0 && state.particles.length===0,'projectiles and particles cleaned up');
state.over=true;assert(!engine.throwChalk(state),'no shots after game over');
const normalFall=engine.create(), fastFall=engine.create();
normalFall.y=fastFall.y=180;normalFall.vy=fastFall.vy=80;fastFall.duck=true;
normalFall.spawnIn=fastFall.spawnIn=Infinity;
engine.step(normalFall,.03);engine.step(fastFall,.03);
assert(fastFall.y>normalFall.y,'down accelerates falling');
state = engine.create();engine.step(state, 100);
assert(state.time <= 1/30, 'long frames are bounded');
state.over = true;const oldTime=state.time;engine.step(state,.02);
assert(state.time===oldTime,'game over freezes simulation');
// Check spawns for every lane, maximum difficulty, narrow and wide screens.
for(const width of [420,960]) for(const lane of [0,1,2]) {
    state=engine.create(width);state.time=100;state.nextBossAt=Infinity;
    let lastSpawn=-Infinity;
    for(let i=0;i<3600;i++) {
        // Move the player below the world to test spawning independently of collisions.
        state.y=engine.ground;state.obstacles.forEach(o=>o.y=-1000);
        const count=state.count;
        let call=0;
        engine.step(state,1/120,()=> { call++; return call<=2 ? (lane+.1)/3 : .99; });
        if(state.count!==count) {
            assert(state.time-lastSpawn>=1.59,'safe spacing at maximum speed');
            lastSpawn=state.time;
            const newest=state.obstacles[state.obstacles.length-1];
            assert([0,1,2].includes(newest.band),'phase patterns use valid height bands');
            assert((width-100)/state.speed>1.1,'at least 1.1 seconds of visible approach on mobile');
        }
        assert(state.speed<=280,'speed cap');
        assert(state.obstacles.length<8,'old obstacles are removed');
    }
}
print('Passed: three height bands, safe actions at all speeds, collisions, jump/duck physics, spacing, mobile reaction time and cleanup.');
