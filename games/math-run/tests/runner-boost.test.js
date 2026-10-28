// Run from the repository root: gjs games/math-run/tests/runner-boost.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function create(boost){const s=game.create();s.boost=boost;s.spawnIn=Infinity;s.nextBossAt=Infinity;return s;}
for(const dt of [1/30,1/60,1/120]){
 const normal=create(false),fast=create(true);
 for(let i=0;i<Math.round(1/dt);i++){game.step(normal,dt);game.step(fast,dt);}
 assert(Math.abs(fast.runTime/normal.runTime-1.6)<.001,'boost consistently accelerates simulation at all frame rates');
 const before=fast.runTime;fast.boost=false;game.step(fast,dt);
 assert(Math.abs(fast.runTime-before-dt)<1e-6,'release immediately restores normal pace');
 const arena=create(true);arena.boss={type:'reviewer',x:600,y:120,w:88,h:30,hp:6,age:0,attackIn:100,pattern:0};
 game.step(arena,dt);assert(Math.abs(arena.time-dt)<1e-6,'boost does not accelerate boss arenas');
}
function speedAt(time){const s=game.create();s.runTime=time;s.spawnIn=Infinity;game.step(s,.001);return s.speed;}
assert(speedAt(59)>speedAt(45)*1.5,'final quarter of semester has a dramatic acceleration');
print('Passed: frame-independent 1.6x acceleration, immediate release, boss exclusion and late-semester surge.');
