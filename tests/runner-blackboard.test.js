// Run from the repository root: gjs tests/runner-blackboard.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function arena(width=420,dt=1/120){const s=game.create(width);s.bossCount=1;s.nextBossAt=0;s.spawnIn=Infinity;game.step(s,dt);s.bossIntro=null;return s;}
function run(s,time,dt){for(let i=0;i<Math.ceil(time/dt);i++)game.step(s,dt);}
function shot(s,x,y){s.shots.push({x,y,w:10,h:4,vx:560,vy:0});}
for(const width of [420,960])for(const dt of [1/30,1/60,1/120]){
 let s=arena(width,dt);assert(s.boss.type==='blackboard'&&s.boss.hp===8,'second boss is Blackboard');
 game.step(s,dt);let b=s.boss;
 assert(!b.open,'board starts drawing with armor');
 shot(s,b.x-3,b.y+20);game.step(s,dt);assert(b.hp===8&&!s.shots.length,'chalk hitting panel is blocked');
 run(s,1.25,dt);assert(b.open&&s.enemyShots[0]?.graph==='parabola','drawing launches parabola and exposes eraser');
 s.enemyShots=[];
 shot(s,b.x-3,b.y+20);game.step(s,dt);assert(b.hp===8,'panel remains armored while eraser is exposed');
 shot(s,b.eraser.x-2,b.eraser.y+7);game.step(s,dt);assert(b.hp===7,'only exposed eraser takes damage');
 // Wide-screen throws need positioning and correct height, just as normal arenas.
 s.enemyShots=[];s.x=b.x-90;s.y=b.eraser.y+28;s.vy=0;s.facing=1;game.throwChalk(s);run(s,.14,dt);
 assert(b.hp===6,'horizontal jump-height throw can hit eraser');
 // No attacks or life damage are needed to inspect both graph trajectories.
 s=arena(width,dt);s.powerups.shield=100;run(s,1.3,dt);
 const parabola=s.enemyShots[0];assert(parabola?.graph==='parabola','first graph attack is parabola');
 const y=parabola.y;run(s,.1,dt);assert(parabola.y!==y&&parabola.trail.length,'parabola follows a curved path with trail');
 run(s,4.8,dt);assert(s.enemyShots.some(p=>p.graph==='sine'),'second graph attack is sine wave');
 // Homing locks onto the exposed weak point rather than the panel.
 s=arena(width,dt);s.powerups.shield=100;run(s,1.3,dt);s.enemyShots=[];s.powerups.homing=10;
 s.x=s.boss.x-120;game.throwChalk(s);run(s,.4,dt);assert(s.boss.hp===7,'homing chalk can reach exposed eraser');
 // Hagoromo cannot bypass armor, but retains its three damage in an opening.
 s=arena(width,dt);game.step(s,dt);b=s.boss;s.hagoromo=1;s.x=b.x-90;s.y=b.y+50;s.facing=1;
 game.throwChalk(s);run(s,.3,dt);assert(b.hp===8,'giant explosion does not bypass closed armor');
 s.explosions=[];s.volleys=[];s.shots=[];s.cooldown=0;s.hagoromo=1;s.powerups.shield=100;run(s,1.2,dt);
 s.x=b.x-90;s.y=b.eraser.y+28;s.facing=1;game.throwChalk(s);run(s,.4,dt);assert(b.hp===5,'giant deals three damage to exposed eraser');
 // A player can win by timing jump throws; blind ground fire cannot win.
 s=arena(width,dt);s.powerups.shield=200;
 for(let i=0;i<Math.ceil(5/dt);i++){game.throwChalk(s);game.step(s,dt);}
 assert(s.boss.hp===8,'standing spam misses Blackboard');
 for(let i=0;i<Math.ceil(100/dt)&&s.boss;i++){
  const boss=s.boss;s.move=s.x<boss.x-100?1:s.x>boss.x-70?-1:0;
  if(s.y===252){s.jumpHeld=true;game.jump(s);}
  const line=game.player(s).y+16;
  if(boss.open&&line>boss.eraser.y&&line<boss.eraser.y+18&&s.facing===1)game.throwChalk(s);
  game.step(s,dt);
 }
 assert(!s.boss&&s.bonus>=100,'timed jump throws can win Blackboard fight');
 s.obstacles=[];s.runTime=s.nextBossAt;s.spawnIn=Infinity;game.step(s,dt);
 assert(s.boss.type==='reviewer','boss rotation returns to Reviewer 2');
}
// Both graph patterns have survivable routes with one life and no shield.
for(const width of [420,960])for(const dt of [1/30,1/60,1/120])for(const graph of ['sine','parabola']) {
 let safe=false;
 for(const jumpAt of [Infinity,.2,.4,.6,.8,1]){
  const s=arena(width,dt);s.boss.cycle=1.3;s.boss.fired=true;
  s.enemyShots=[{x:300,y:224,w:22,h:18,vx:-160,vy:0,age:0,graph}];let jumped=false;
  for(let i=0;i<Math.ceil(2/dt)&&!s.over;i++){
   if(!jumped&&i*dt>=jumpAt){s.jumpHeld=true;game.jump(s);jumped=true;}
   game.step(s,dt);
  }
  if(!s.over){safe=true;break;}
 }
 assert(safe,graph+' has a safe single-life dodge route');
}
print('Passed: alternating boss types, armor/eraser windows, graph attacks, homing/Hagoromo interaction, timed-throw victories and one-life dodge routes at 30/60/120 FPS.');
