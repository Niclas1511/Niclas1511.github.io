// Run from the repository root: gjs games/math-run/tests/runner-printer.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function arena(width=420,dt=1/120){const s=game.create(width);s.bossCount=2;s.nextBossAt=0;s.spawnIn=Infinity;game.step(s,dt);s.bossIntro=null;return s;}
function run(s,time,dt){for(let i=0;i<Math.ceil(time/dt);i++)game.step(s,dt);}
function shot(s,x,y){s.shots.push({x,y,w:10,h:4,vx:560,vy:0});}
for(const width of [420,960])for(const dt of [1/30,1/60,1/120]) {
 let s=arena(width,dt);game.step(s,dt);let b=s.boss;
 assert(b.type==='printer'&&b.hp===8&&!b.open,'Printer is third boss with armored opening');
 shot(s,b.x-2,b.y+40);game.step(s,dt);assert(b.hp===8,'closed housing blocks chalk');
 run(s,.9,dt);assert(s.enemyShots.some(p=>p.paper&&!p.wave),'printer launches head-height sheets');
 run(s,.2,dt);s.enemyShots=[];assert(b.open,'feed opens after sheets');
 shot(s,b.x-2,b.y+60);game.step(s,dt);assert(b.hp===8,'housing stays armored beside open feed');
 const hitTime=b.cycle;shot(s,b.feed.x-2,b.feed.y+8);game.step(s,dt);
 assert(b.hp===7&&b.jamAt<=hitTime+.7,'feed hit triggers a telegraphed jam');
 run(s,.72,dt);assert(!b.open&&s.enemyShots.some(p=>p.paper&&p.wave),'jam closes feed and launches floor paper wave');
 // Ducking avoids the sheet; standing still is hit with one starting life.
 for(const duck of [false,true]) {
  s=arena(width,dt);s.boss.cycle=1.2;s.boss.sheetsFired=true;s.boss.jamAt=100;s.duck=duck;
  s.enemyShots=[{x:200,y:211,w:30,h:16,vx:-180,vy:0,paper:true}];run(s,1,dt);
  assert(duck?!s.over:s.over,'head-height sheet rewards ducking');
 }
 // The low paper wave can be cleared with one timed jump.
 s=arena(width,dt);s.boss.cycle=4;s.boss.jammed=true;s.boss.sheetsFired=true;
 s.enemyShots=[{x:200,y:232,w:32,h:20,vx:-175,vy:0,paper:true,wave:true}];
 run(s,.25,dt);s.jumpHeld=true;game.jump(s);run(s,.9,dt);assert(!s.over,'paper wave has a survivable jump route');
 // Both special chalk types respect weak points and normal boss damage.
 s=arena(width,dt);s.powerups.shield=100;run(s,1.15,dt);s.enemyShots=[];s.x=s.boss.x-100;s.powerups.homing=10;
 game.throwChalk(s);run(s,.3,dt);assert(s.boss.hp===7,'homing chalk finds open paper feed');
 s=arena(width,dt);s.powerups.shield=100;run(s,1.15,dt);s.enemyShots=[];b=s.boss;s.x=b.x-90;s.y=b.feed.y+28;s.hagoromo=1;
 game.throwChalk(s);run(s,.3,dt);assert(b.hp===5,'Hagoromo removes three HP through exposed feed');
 // Jump-height shots with finite ammo can win all sizes and frame rates.
 s=arena(width,dt);s.powerups.shield=200;
 for(let i=0;i<Math.ceil(100/dt)&&s.boss;i++) {
  b=s.boss;s.move=s.x<b.x-100?1:s.x>b.x-70?-1:0;
  if(s.y===252){s.jumpHeld=true;game.jump(s);}
  const line=game.player(s).y+16;
  if(b.open&&line>b.feed.y&&line<b.feed.y+b.feed.h&&s.facing===1)game.throwChalk(s);
  game.step(s,dt);
 }
 assert(!s.boss&&s.bonus>=100,'timed finite-ammo shots can win Printer');
 s.obstacles=[];s.runTime=s.nextBossAt;game.step(s,dt);assert(s.boss.type==='deadline','fourth boss after Printer is The Deadline');
}
assert(!game.motifs.flat().some(m=>m.includes('Tor')),'Tor motif removed');
print('Passed: Printer rotation, armored feed windows, hit-triggered jam, duck/jump attack routes, homing/Hagoromo and timed victories at 30/60/120 FPS.');
