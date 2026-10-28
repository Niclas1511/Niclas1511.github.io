// Run from the repository root: gjs games/math-run/tests/runner-arena.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function run(s,seconds,dt=1/120){for(let i=0;i<Math.ceil(seconds/dt);i++)game.step(s,dt,()=>.8);}
function arena(width=420,dt=1/120){
 const s=game.create(width);s.lives=1;s.time=60;s.spawnIn=Infinity;
 game.step(s,dt);assert(s.boss,'boss starts after sixty running seconds');s.bossIntro=null;return s;
}
let s=game.create();s.time=60;s.obstacles=[{x:200,y:132,w:62,h:28,speed:1}];
game.step(s,.01);assert(!s.boss,'boss waits for runner hazards to clear');
s.obstacles=[];game.step(s,.01);assert(s.boss && s.chalk===3,'arena entry refreshes ammo');
for(const width of [420,960])for(const dt of [1/30,1/60,1/120]){
 s=arena(width,dt);s.bossIntro=null;s.boss.attackIn=Infinity;
 const distance=s.distance,clock=s.runTime,phase=s.phase,count=s.count;
 s.move=1;run(s,.5,dt);
 assert(s.x>150 && game.player(s).x===s.x,'player moves right freely in arena');
 s.move=-1;run(s,.4,dt);assert(s.x<150,'player can move back left');
 s.move=-1;run(s,5,dt);assert(s.x===12,'left arena boundary');
 s.move=1;run(s,5,dt);assert(s.x===width-36,'right arena boundary');
 assert(s.distance===distance && s.runTime===clock && s.phase===phase && s.count===count,'runner distance, phase clock and spawns freeze in arena');
 assert(s.boss,'boss cannot be bypassed by waiting');
 s.move=0;const x=s.x;game.jump(s);run(s,.2,dt);assert(s.y<252 && s.x===x,'jumping remains available');
 assert(s.facing===1 && !s.aim,'boss cannot turn player automatically');
 s.move=-1;game.step(s,dt);s.move=0;
 game.throwChalk(s);assert(s.shots[0].vx<0,'last movement sets throw direction');
 s.shots=[];s.volleys=[];s.cooldown=0;s.powerups.spread=100;
 s.x=12;game.step(s,dt);game.throwChalk(s);
 assert(s.shots.length===3 && new Set(s.shots.map(p=>p.vy)).size===3,'spread keeps three directions');
 // Blind standing fire must miss; movement and jump timing can still win.
 s=arena(width,dt);s.bossIntro=null;s.boss.attackIn=Infinity;
 for(let i=0;i<Math.ceil(5/dt);i++){game.throwChalk(s);game.step(s,dt);}
 assert(s.boss.hp===6,'standing spam does not hit elevated boss');
 for(let i=0;i<Math.ceil(100/dt) && s.boss;i++){
  const boss=s.boss;
  s.move=s.x<boss.x-110?1:s.x>boss.x-60?-1:0;
  if(s.y===252){s.jumpHeld=true;game.jump(s);}
  const line=game.player(s).y+16;
  if(line>boss.y && line<boss.y+boss.h && s.facing===1)game.throwChalk(s);
  game.step(s,dt);
 }
 assert(!s.over && !s.boss && s.bonus>=100,'positioned jump throws with normal ammo can defeat boss');
 assert(s.x===76 && !s.enemyShots.length && s.chalk===3,'victory restores normal runner position and clears arena fire');
 const restartClock=s.runTime,next=s.nextBossAt,oldDistance=s.distance;
 assert(s.bossPressure===0,'boss victory resets approach pressure');
 assert(s.bossWins===1,'only a defeated boss raises permanent runner difficulty');
 assert(Math.abs(next-restartClock-60)<.001,'next boss scheduled sixty running seconds after victory');
 game.step(s,dt);assert(s.distance>oldDistance && s.runTime>restartClock,'runner resumes after victory');
 s.obstacles=[];s.items=[];s.spawnIn=Infinity;s.runTime=next-.05;
 run(s,.15,dt);assert(s.boss,'boss encounters recur at regular running intervals');
}
s=arena();s.bossIntro=null;s.boss.attackIn=Infinity;s.chalk=0;s.reload=0;run(s,1.05);
assert(s.chalk===1,'arena recharges one chalk per second');
s=arena();s.bossIntro=null;s.boss.attackIn=Infinity;s.facing=-1;
game.throwChalk(s);assert(s.shots[0].vx<0 && Math.abs(s.shots[0].vy)<1e-9,'boss position cannot override facing');
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
s=arena();s.bossIntro=null;s.boss.attackIn=Infinity;
s.enemyShots=[{x:s.x+9,y:220,w:12,h:10,vx:0,vy:0}];game.step(s,.01);
assert(s.over,'enemy projectile damages player');
s=arena();s.bossIntro=null;s.boss.attackIn=Infinity;s.powerups.shield=5;
s.enemyShots=[{x:s.x+9,y:220,w:12,h:10,vx:0,vy:0}];game.step(s,.01);
assert(!s.over && !s.enemyShots.length,'shield intercepts boss projectiles');
s=arena();s.bossIntro=null;s.boss.attackIn=Infinity;s.move=-1;run(s,.2);
assert(s.facing===-1 && s.aimAngle===Math.PI,'movement determines horizontal aim');
const fresh=game.create();assert(fresh.x===76 && fresh.nextBossAt===60 && !fresh.boss && !fresh.enemyShots.length,'restart clears arena state');
for(const width of [420,960])for(const dt of [1/30,1/60,1/120]){
 for(const pattern of [0,1]){
  let dodged=false;
  for(const jumpAt of [Infinity,.3,.6,.9,1.2,1.5,1.8,2.1,2.4,2.7,3,3.3,3.6,3.9,4.2,4.5]){
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
for(const dt of [1/30,1/60,1/120]) {
 const intro=game.create(420);intro.nextBossAt=0;intro.spawnIn=Infinity;intro.powerups.shield=5;
 game.step(intro,dt);assert(intro.bossIntro,'arena starts with cinematic');
 const time=intro.time, runTime=intro.runTime, distance=intro.distance;
 const ammo=intro.chalk;game.jump(intro);assert(!game.throwChalk(intro),'throw blocked during intro');
 intro.move=1;run(intro,2,dt);
 assert(intro.bossIntro&&intro.x===76&&intro.y===252&&intro.chalk===ammo,'cinematic blocks movement and ammo use');
 assert(intro.boss.age===0&&intro.boss.pattern===0&&!intro.enemyShots.length,'boss cannot attack during intro');
 assert(intro.time===time&&intro.runTime===runTime&&intro.distance===distance&&intro.powerups.shield===5,'cutscene freezes simulation clocks and effects');
 assert(intro.sounds.filter(c=>c==='smash').length===1,'dramatic impact plays exactly once');
 run(intro,.5,dt);assert(!intro.bossIntro&&!intro.over,'cinematic ends safely');
 game.jump(intro);assert(intro.jumps===1&&game.throwChalk(intro),'controls work after intro');
}
print('Passed: recurring boss arenas, frozen runner, free movement/bounds, directed/spread throws, finite-ammo victories, attacks, shield and resumption at 30/60/120 FPS.');
