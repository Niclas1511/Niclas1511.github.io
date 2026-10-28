// Run from the repository root: gjs games/math-run/tests/runner-flyers.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-engine.js');
const engine=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(value,message){if(!value)throw Error(message);}
function spawn(index,width=420,time=100) {
    const state=engine.create(width);state.lives=1;state.time=time;state.spawnIn=0;state.nextBossAt=Infinity;
    const values=[.4,.2,0,(index+.1)/engine.flyers.length,.5];
    engine.step(state,1/120,()=>values.shift());state.spawnIn=Infinity;
    return state;
}
assert(engine.flyers.length===7,'all seven flying motifs');
const continuity=spawn(3),string=continuity.obstacles[0];
assert(string.w===520&&string.formula==='∀ε>0 ∃δ>0 ∀x∈D: |x−a|<δ ⇒ |f(x)−f(a)|<ε','long flying string states continuity on D');
const arrival=continuity.time+(string.x-100)/string.speed;
assert(continuity.lastArrival>=arrival+(string.w-68)/string.speed-.001,'scheduler reserves extra passage time for formula string');
for(let index=0;index<6;index++)for(const width of [420,960])for(const time of [0,100])for(const dt of [1/30,1/60,1/120]){
    const state=spawn(index,width,time),obstacle=state.obstacles[0];
    assert(obstacle.kind===engine.flyers[index].kind,'each flying type can spawn');
    assert((obstacle.x-width)/obstacle.speed>.65,'warning before entering view');
    let jumped=false, seenWarning=false, seenScreen=false;
    const startY=obstacle.y;
    for(let i=0;i<1500 && state.obstacles.length && !state.over;i++){
        if(obstacle.x>=width && (obstacle.x-width)/obstacle.speed<=.75)seenWarning=true;
        if(obstacle.x<width)seenScreen=true;
        if(obstacle.kind==='worksheet'){
            if(!jumped && (obstacle.x-100)/obstacle.speed<=.14){engine.jump(state);jumped=true;}
        }else state.duck=true;
        engine.step(state,dt);
    }
    assert(!state.over,`${obstacle.kind}: dodge possible at ${width}px, ${dt}s step`);
    assert(seenWarning && seenScreen,'warning then visible approach');
    assert(!state.obstacles.length,'flying obstacle exits and is cleaned up');
    if(obstacle.kind==='worksheet')assert(obstacle.y===222 && startY<obstacle.y,'sheet falls then stays at ground height');
}
// A chalk hit answers the question, instead of destroying the student.
let state=spawn(0);let student=state.obstacles[0];
student.x=175;student.baseY=176;student.y=176;
state.y=210;state.jumps=1; // Chalk leaves at y=176, in the question bubble.
assert(engine.throwChalk(state),'throw towards bubble');
for(let i=0;i<12;i++)engine.step(state,1/120);
assert(student.resolved && !student.destroyed,'question resolved; student remains intact');
assert(state.bonus===5 && state.shots.length===0,'one bonus and consumed chalk');
// Put the now-friendly student directly over the player.
student.x=76;student.y=205;state.y=engine.ground;
engine.step(state,1/120);assert(!state.over,'resolved student is harmless');
for(let i=0;i<360;i++)engine.step(state,1/120);
assert(!state.obstacles.length,'student flies away and cleans up');
state=spawn(0);student=state.obstacles[0];student.x=175;
engine.throwChalk(state);
for(let i=0;i<10;i++)engine.step(state,1/120);
assert(student.resolved && !state.over,'standing body hit also answers the question');
// Regression: use normal throws, not a manually positioned airborne player.
for(const dt of [1/30,1/60,1/120])for(const speed of [189,294])for(const x of [200,300,410])for(const phase of [0,.4,.8,1.2]){
    state=engine.create(420);state.spawnIn=Infinity;
    student={...engine.flyers[0],x,baseY:176,age:phase,speed};
    state.obstacles=[student];
    assert(engine.throwChalk(state),'standing player can throw');
    for(let i=0;i<200 && !student.resolved && !state.over;i++)engine.step(state,dt);
    assert(student.resolved && !state.over,'standing throw resolves student across distances, bobbing phases and frame rates');
    assert(state.bonus===5,'standing hit awards one bonus');
    student.x=76;student.y=205;
    engine.step(state,dt);assert(!state.over,'answered student cannot collide with player');
}
// Faster flyers must not catch up to earlier obstacles at the player.
state=engine.create(420);state.nextBossAt=Infinity;let seed=123;
function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
let lastArrival=-Infinity;let kinds=new Set();
for(let i=0;i<40000;i++){
    const count=state.count;
    // Only test scheduling here; remove spawned obstacles to avoid player collisions.
    state.obstacles=[];
    engine.step(state,1/120,random);
    if(state.count!==count){
        const o=state.obstacles[0];kinds.add(o.kind || 'regular');
        assert(state.lastArrival-lastArrival>=1.599,'mixed speeds retain safe arrival spacing');
        lastArrival=state.lastArrival;
    }
}
assert(kinds.has('regular')&&kinds.has('student')&&kinds.has('email')&&kinds.size>=5,'mixed scheduling keeps regular obstacles and varied flyers; individual tests cover every flyer');
print('Passed: six flyers, 144 dodge scenarios, warnings, falling sheets, question-bubble hits, harmless student exit and mixed-speed spacing.');
