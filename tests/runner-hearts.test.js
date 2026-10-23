// Run from the repository root: gjs tests/runner-hearts.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function create(){const s=game.create(420);s.spawnIn=Infinity;s.nextBossAt=Infinity;return s;}
function run(s,time,dt){for(let i=0;i<Math.ceil(time/dt);i++)game.step(s,dt);}
function heart(s,x=78){s.items.push({kind:'heart',x,y:220,w:28,h:28,speed:0});}
for(const dt of [1/30,1/60,1/120]){
 let s=create();assert(s.lives===1&&s.maxLives===5,'one starting life, five maximum');
 s.lives=3; // Recovery behavior after collecting extra hearts.
 s.obstacles=[{x:78,y:222,w:62,h:30,speed:1},{x:78,y:192,w:62,h:28,speed:1}];
 game.step(s,dt);assert(s.lives===2&&!s.over&&s.hurt>0,'simultaneous contacts cost one heart');
 run(s,1,dt);assert(s.lives===2,'ongoing contact cannot drain hearts during recovery');
 run(s,.6,dt);assert(s.lives===1&&!s.over,'another hit after recovery costs one more life');
 run(s,1.6,dt);assert(s.over&&s.lives===0,'only last life causes game over');
 s=create();s.lives=1;heart(s);game.step(s,dt);assert(s.lives===2&&!s.items.length,'walk-through heart heals once');
 for(let i=0;i<5;i++){heart(s);game.step(s,dt);}assert(s.lives===5,'hearts capped at five');
 s=create();heart(s,200);game.throwChalk(s);run(s,.2,dt);assert(s.lives===1&&s.items.length===1,'shooting does not collect hearts');
 s=create();s.lives=1;s.powerups.shield=5;s.obstacles=[{x:78,y:222,w:62,h:30,speed:1}];game.step(s,dt);
 assert(s.lives===1&&!s.over,'shield protects hearts');
 s=create();s.nextBossAt=0;s.lives=2;game.step(s,dt);
 assert(s.boss&&s.lives===2,'boss entry preserves lives');s.bossIntro=null;s.boss.attackIn=Infinity;
 s.enemyShots=[0,1,2].map(()=>({x:s.x+9,y:220,w:12,h:10,vx:0,vy:0}));game.step(s,dt);
 assert(s.lives===1&&!s.over&&!s.enemyShots.length,'boss shots respect shared recovery window');
 s=create();s.hurt=1;s.lives=2;s.nextBossAt=0;game.step(s,dt);run(s,1,dt);
 assert(s.hurt===1,'cinematic freezes recovery timer');
 s=create();s.encounters=7;s.spawnIn=0;game.step(s,dt,()=>.8);
 assert(s.items.length===1&&s.items[0].kind==='heart'&&!s.obstacles.length,'every eighth encounter offers a safe heart');
}
const fresh=game.create();assert(fresh.lives===1&&!fresh.hurt,'restart restores starting health');
print('Passed: starting/capped health, safe heart pickups, damage and recovery, last-life game over, shields, boss carryover and projectile damage at 30/60/120 FPS.');
