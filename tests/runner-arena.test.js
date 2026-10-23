// Run from the repository root: gjs tests/runner-arena.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function run(s,seconds,dt=1/120){for(let i=0;i<Math.ceil(seconds/dt);i++)game.step(s,dt,()=>.8);}
function arena(width=420,dt=1/120){
 const s=game.create(width);s.time=60;s.spawnIn=Infinity;
 game.step(s,dt);assert(s.boss,'boss starts after sixty running seconds');return s;
}
let s=game.create();s.time=60;s.obstacles=[{x:200,y:132,w:62,h:28,speed:1}];
game.step(s,.01);assert(!s.boss,'boss waits for runner hazards to clear');
s.obstacles=[];game.step(s,.01);assert(s.boss && s.chalk===3,'arena entry refreshes ammo');
for(const width of [420,960])for(const dt of [1/30,1/60,1/120]){
 s=arena(width,dt);s.boss.attackIn=Infinity;
 const distance=s.distance,clock=s.runTime,phase=s.phase,count=s.count;
 s.move=1;run(s,.5,dt);
 assert(s.x>150 && game.player(s).x===s.x,'player moves right freely in arena');
 s.move=-1;run(s,.4,dt);assert(s.x<150,'player can move back left');
 s.move=-1;run(s,5,dt);assert(s.x===12,'left arena boundary');
 s.move=1;run(s,5,dt);assert(s.x===width-36,'right arena boundary');
 assert(s.distance===distance && s.runTime===clock && s.phase===phase && s.count===count,'runner distance, phase clock and spawns freeze in arena');
 assert(s.boss,'boss cannot be bypassed by waiting');
 s.move=0;const x=s.x;game.jump(s);run(s,.2,dt);assert(s.y<252 && s.x===x,'jumping remains available');
 game.aimAt(s,20,100);assert(s.aimAngle<-Math.PI/2 && s.facing===-1,'can aim behind player');
 game.throwChalk(s);assert(s.shots[0].vx<0 && s.shots[0].vy<0,'aimed throw travels left and up');
 s.shots=[];s.volleys=[];s.cooldown=0;s.powerups.spread=100;
 game.aimAt(s,width-10,150);game.throwChalk(s);
 assert(s.shots.length===3 && new Set(s.shots.map(p=>p.vy)).size===3,'spread rotates around aimed direction');
 // Aiming at a moving target, with ordinary finite ammo and recharge, can win.
 s=arena(width,dt);s.boss.attackIn=Infinity;
 for(let i=0;i<Math.ceil(30/dt) && s.boss;i++){
  game.aimAt(s,s.boss.x+s.boss.w/2,s.boss.y+s.boss.h/2);
  game.throwChalk(s);game.step(s,dt);
 }
 assert(!s.over && !s.boss && s.bonus>=100,'normal-ammo aimed throws defeat boss at all screen sizes/frame rates');
 assert(s.x===76 && !s.enemyShots.length && s.chalk===3,'victory restores normal runner position and clears arena fire');
 const restartClock=s.runTime,next=s.nextBossAt,oldDistance=s.distance;
 assert(Math.abs(next-restartClock-60)<.001,'next boss scheduled sixty running seconds after victory');
 game.step(s,dt);assert(s.distance>oldDistance && s.runTime>restartClock,'runner resumes after victory');
 s.obstacles=[];s.items=[];s.spawnIn=Infinity;s.runTime=next-.05;
 run(s,.15,dt);assert(s.boss,'boss encounters recur at regular running intervals');
}
s=arena();s.boss.attackIn=Infinity;s.chalk=0;s.reload=0;run(s,1.05);
assert(s.chalk===1,'arena recharges one chalk per second');
s=arena();s.boss.attackIn=Infinity;game.aimAt(s,0,0);
const hp=s.boss.hp;game.throwChalk(s);run(s,1);
assert(s.boss.hp===hp,'throwing away from boss does not damage it');
s=arena();s.powerups.shield=100;
const patterns=[];
for(let i=0;i<1200;i++){
 const pattern=s.boss.pattern;game.step(s,1/120);
 if(s.boss.pattern!==pattern)patterns.push(s.enemyShots.filter(p=>!p.used).length);
}
assert(s.boss.pattern>=3,'boss cycles through aimed, fan and ground attacks');
s=arena();s.boss.attackIn=.7;game.step(s,.01);
const locked={...s.boss.target};s.move=1;run(s,.2);
assert(s.boss.target.x===locked.x && s.boss.target.y===locked.y,'warning locks target so player can dodge');
s=arena();s.boss.attackIn=Infinity;
s.enemyShots=[{x:s.x+9,y:220,w:12,h:10,vx:0,vy:0}];game.step(s,.01);
assert(s.over,'enemy projectile damages player');
s=arena();s.boss.attackIn=Infinity;s.powerups.shield=5;
s.enemyShots=[{x:s.x+9,y:220,w:12,h:10,vx:0,vy:0}];game.step(s,.01);
assert(!s.over && !s.enemyShots.length,'shield intercepts boss projectiles');
s=arena();s.boss.attackIn=Infinity;s.aimTurn=-1;const angle=s.aimAngle;run(s,.2);
assert(s.aimAngle<angle && !s.aim,'keyboard aim adjustment');
const fresh=game.create();assert(fresh.x===76 && fresh.nextBossAt===60 && !fresh.boss && !fresh.enemyShots.length,'restart clears arena state');
for(const width of [420,960])for(const dt of [1/30,1/60,1/120]){
 for(const pattern of [0,1]){
  let dodged=false;
  for(const jumpAt of pattern===0 ? [Infinity] : [.3,.6,.9,1.2,1.5,1.8,2.1,2.4,2.7,3,3.3,3.6,3.9,4.2,4.5]){
   const dodge=arena(width,dt);dodge.boss.pattern=pattern;dodge.boss.attackIn=.7;
   game.step(dodge,dt);assert(dodge.boss.target,'shot is telegraphed before firing');
   dodge.move=pattern===0 ? 1 : 0;let jumped=false;
   for(let i=0;i<Math.ceil(5/dt) && !dodge.over;i++){
    if(!jumped && i*dt>=jumpAt){dodge.jumpHeld=true;game.jump(dodge);jumped=true;}
    game.step(dodge,dt);
    if(dodge.boss.pattern>pattern)dodge.boss.attackIn=Infinity;
   }
   if(!dodge.over){dodged=true;break;}
  }
  assert(dodged,`movement with a timed jump can dodge the ${pattern===0?'aimed':'fan'} attack at ${width}px / ${dt}s`);
 }
 const wave=arena(width,dt);wave.boss.attackIn=Infinity;
 wave.enemyShots=[{x:width-28,y:232,w:24,h:20,vx:-200,vy:0,wave:true}];
 let jumped=false;
 for(let i=0;i<Math.ceil(6/dt) && wave.enemyShots.length && !wave.over;i++){
  if(!jumped && (wave.enemyShots[0].x-wave.x-24)/200<=.14){game.jump(wave);jumped=true;}
  game.step(wave,dt);
 }
 assert(jumped && !wave.over && !wave.enemyShots.length,'ground waves can be jumped at all screen widths/frame rates');
}
print('Passed: recurring boss arenas, frozen runner, free movement/bounds, directed/spread throws, finite-ammo victories, attacks, shield and resumption at 30/60/120 FPS.');
