// Run from the repository root: gjs games/math-run/tests/runner-deadline.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function arena(width=420,dt=1/120){const s=game.create(width);s.bossCount=3;s.nextBossAt=0;s.spawnIn=Infinity;game.step(s,dt);s.bossIntro=null;return s;}
function run(s,time,dt){for(let i=0;i<Math.ceil(time/dt);i++)game.step(s,dt);}
for(const width of [420,960])for(const dt of [1/30,1/60,1/120]){
 let s=arena(width,dt);let b=s.boss;
 assert(b.type==='deadline'&&b.hp===10,'Deadline is fourth boss');
 b.attackIn=1;run(s,.15,dt);assert(!s.enemyShots.length&&b.attackIn<.9,'attack warning precedes projectile');
 b.attackIn=.001;game.step(s,dt);assert(s.enemyShots[0]?.clockHand==='minute','first hand sweeps the floor');
 s.enemyShots=[];b.attackIn=.001;game.step(s,dt);assert(s.enemyShots[0]?.clockHand==='hour','second hand crosses head height');
 s=arena(width,dt);b=s.boss;b.attackIn=Infinity;
 const previous=b.age;
 s.shots=[{x:b.x+10,y:b.y+40,w:10,h:4,vx:560,vy:0}];game.step(s,dt);
 assert(b.hp===9&&b.slow>0&&b.hitFlash>0,'face hit causes damage and visible slow effect');
 const age=b.age;b.attackIn=2;
 const hand={x:300,y:211,w:48,h:14,vx:-170,vy:0,clockHand:'hour'};s.enemyShots=[hand];
 game.step(s,dt);assert(Math.abs(hand.x-(300-170*dt*.45))<.001,'existing hands slow with clock');
 assert(b.age-age<dt*.5&&b.attackIn>2-dt*.5,'mechanism and attack timer slow together');
 s.enemyShots=[];run(s,.85,dt);assert(!b.slow,'hit slowdown expires instead of stacking forever');
 s=arena(width,dt);b=s.boss;b.hp=3;b.attackIn=.001;game.step(s,dt);
 assert(b.attackIn<=1.7&&s.enemyShots[0].vx===-220,'last three HP increase rate and hand speed');
 const angle=b.handAngle;game.step(s,dt);assert(b.handAngle-angle>dt*4.5,'panic mechanism accelerates');
 // A high hand is duckable; a floor hand is jumpable with one life.
 s=arena(width,dt);s.boss.attackIn=Infinity;s.duck=true;
 s.enemyShots=[{x:200,y:211,w:48,h:14,vx:-170,vy:0,clockHand:'hour'}];run(s,1.3,dt);
 assert(!s.over,'ducking clears high hand');
 s=arena(width,dt);s.boss.attackIn=Infinity;
 s.enemyShots=[{x:200,y:234,w:48,h:14,vx:-170,vy:0,clockHand:'minute'}];run(s,.4,dt);
 s.jumpHeld=true;game.jump(s);run(s,1,dt);assert(!s.over,'timed jump clears floor hand');
 // Homing and Hagoromo both retain their boss effects.
 s=arena(width,dt);s.boss.attackIn=Infinity;s.x=s.boss.x-100;s.powerups.homing=10;game.throwChalk(s);run(s,.4,dt);
 assert(s.boss.hp===9&&s.boss.slow>0,'homing can hit face and trigger slow');
 s=arena(width,dt);s.boss.attackIn=Infinity;s.x=s.boss.x-90;s.y=s.boss.y+65;s.hagoromo=1;game.throwChalk(s);run(s,.3,dt);
 assert(s.boss.hp===7,'Hagoromo deals exactly three damage to clock');
 // A timed jump strategy can win with finite ammo; ground spam cannot.
 s=arena(width,dt);s.powerups.shield=200;s.boss.attackIn=Infinity;
 for(let i=0;i<Math.ceil(4/dt);i++){game.throwChalk(s);game.step(s,dt);}assert(s.boss.hp===10,'blind ground fire cannot win');
 for(let i=0;i<Math.ceil(100/dt)&&s.boss;i++){
  b=s.boss;s.move=s.x<b.x-100?1:s.x>b.x-70?-1:0;
  if(s.y===252){s.jumpHeld=true;game.jump(s);}
  const line=game.player(s).y+16;
  if(line>b.y+16&&line<b.y+88&&s.facing===1)game.throwChalk(s);
  game.step(s,dt);
 }
 assert(!s.boss&&s.bonus>=100,'positioned jump throws can defeat clock');
 // Trigger a fresh final hit to inspect the defeat animation.
 s=arena(width,dt);s.boss.hp=1;s.boss.attackIn=Infinity;b=s.boss;
 s.shots=[{x:b.x+10,y:b.y+40,w:10,h:4,vx:560,vy:0}];game.step(s,dt);
 assert(!s.boss&&s.deadlineShatter,'clock bursts into animated gears on defeat');
 run(s,1.1,dt);assert(!s.deadlineShatter,'gear animation cleans up');
 s.obstacles=[];s.runTime=s.nextBossAt;game.step(s,dt);assert(s.boss.type==='reviewer','rotation returns to Reviewer after Deadline');
}
assert(!game.create().deadlineShatter,'restart resets clock animation');
print('Passed: Deadline rotation, warnings/hands, timed duck/jump routes, face-hit slowdown, panic phase, special chalk, finite-ammo victory and gear-shatter cleanup.');
