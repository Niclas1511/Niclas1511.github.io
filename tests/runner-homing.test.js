// Run from the repository root: gjs tests/runner-homing.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function create(){const s=game.create(960);s.spawnIn=Infinity;s.nextBossAt=Infinity;return s;}
function run(s,seconds,dt){for(let i=0;i<Math.ceil(seconds/dt);i++)game.step(s,dt);}
for(const dt of [1/30,1/60,1/120]){
 let s=create();s.items=[{kind:'homing',x:78,y:220,w:28,h:28,speed:0}];game.step(s,dt);
 assert(s.powerups.homing===10,'walk-through pickup activates homing');
 const target={x:400,y:132,w:62,h:28,speed:100};s.obstacles=[target];game.throwChalk(s);
 assert(s.shots[0].homing && s.chalk===2,'normal ammo cost for homing');
 run(s,.06,dt);assert(s.shots[0].vy<0,'shot curves toward upper lane');
 assert(s.shots[0].trail.length>0 && Math.hypot(s.shots[0].vx,s.shots[0].vy)<500,'opening arc leaves trail at slower speed');
 s.powerups.homing=0;run(s,.18,dt);
 assert(Math.hypot(s.shots[0].vx,s.shots[0].vy)>850,'terminal approach accelerates');
 for(let i=0;i<Math.ceil(.7/dt) && !target.destroyed;i++)game.step(s,dt);
 assert(s.impacts.length===1 && s.particles.length>20,'impact creates shock ring and fragments');
 assert(target.destroyed && s.streak===1,'in-flight shot tracks moving target after effect expires');
 s.cooldown=0;game.throwChalk(s);assert(!s.shots[0].homing,'new shots return to normal after expiry');
 s=create();s.powerups.homing=10;s.powerups.spread=10;s.powerups.infinite=10;s.chalk=0;
 game.throwChalk(s);assert(s.shots.length===3 && s.shots.every(shot=>shot.homing) && s.chalk===0,'spread and infinite combine');
 const first={x:400,y:132,w:62,h:28,speed:1};const second={x:450,y:192,w:62,h:28,speed:1};
 s.obstacles=[first,second];game.step(s,dt);first.destroyed=true;game.step(s,dt);
 assert(s.shots.every(shot=>shot.target===second),'cleared targets are replaced');
 s=create();s.powerups.homing=10;game.throwChalk(s);run(s,2.7,dt);
 assert(!s.shots.length && !s.volleys.length && !s.streak,'targetless throws expire and count as misses');
 s=create();s.powerups.homing=10;s.hagoromo=1;game.throwChalk(s);
 assert(s.shots[0].giant && !s.shots[0].homing,'Hagoromo retains its own behaviour');
 s=create();s.nextBossAt=0;game.step(s,dt);s.bossIntro=null;s.boss.attackIn=Infinity;s.powerups.homing=10;
 game.throwChalk(s);run(s,1.6,dt);assert(s.boss.hp===5,'homing hits moving boss exactly once');
}
assert(!game.create().powerups.homing,'restart clears homing');
print('Passed: homing pickup, steering, moving targets, retargeting, expiry, misses, combined power-ups, Hagoromo and boss damage at 30/60/120 FPS.');
