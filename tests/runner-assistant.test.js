// Run from the repository root: gjs tests/runner-assistant.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function create(){const s=game.create(420);s.spawnIn=Infinity;s.nextBossAt=Infinity;return s;}
function hire(s){s.items.push({kind:'assistant',x:78,y:220,w:28,h:28,speed:0});game.step(s,1/120);}
function run(s,time,dt){for(let i=0;i<Math.ceil(time/dt);i++)game.step(s,dt);}
for(const dt of [1/30,1/60,1/120]){
 const s=create();hire(s);const helper=s.assistants[0];
 assert(helper.hits===5,'pickup hires five-life assistant');
 run(s,90,dt);assert(s.assistants[0]===helper&&helper.hits===5,'assistant has no time limit');
 for(const y of [222,192,132,192,222]){
  const obstacle={x:360,y,w:35,h:28,speed:180};s.obstacles.push(obstacle);game.step(s,dt);
  assert(helper.flight && helper.y<game.ground && !obstacle.destroyed,'visible leap precedes contact');
  for(let i=0;i<Math.ceil(.6/dt)&&!obstacle.destroyed;i++)game.step(s,dt);
  assert(obstacle.destroyed&&helper.hurt>0,'collision removes one life and recoils');
  if(helper.hits)run(s,.9,dt);
 }
 assert(!helper.hits&&!s.over&&!s.streak&&!s.bonus,'five obstacles cleared without farming combo');
 run(s,.8,dt);assert(!s.assistants.length&&!s.powerups.assistant,'exhausted helper leaves after recoil');
 hire(s);hire(s);assert(s.assistants.length===2,'pickups add assistants');
 s.obstacles=[{x:350,y:132,w:35,h:28,speed:180},{x:390,y:222,w:35,h:28,speed:180}];game.step(s,dt);
 assert(s.assistants[0].flight.target!==s.assistants[1].flight.target,'team reserves different targets');
 run(s,.6,dt);assert(s.assistants.every(h=>h.hits===4),'helpers intercept independently');
 s.obstacles=[];s.nextBossAt=0;game.step(s,dt);s.bossIntro=null;s.boss.attackIn=Infinity;
 assert(s.assistants.length===2&&s.assistants.every(h=>h.hits===4),'arena preserves team and lives');
 const before=s.assistants.reduce((sum,h)=>sum+h.hits,0);
 s.enemyShots=[{x:300,y:132,w:12,h:10,vx:0,vy:0}];run(s,1.5,dt);
 assert(!s.enemyShots.length&&s.assistants.reduce((sum,h)=>sum+h.hits,0)===before-1,'helper intercepts boss projectile at cost of one life');
 assert(s.boss.hp===6,'helpers do not automatically damage boss');
}
for(const dt of [1/30,1/60,1/120]) {
 const s=create();hire(s);s.nextBossAt=0;game.step(s,dt);s.bossIntro=null;s.boss.attackIn=Infinity;
 s.enemyShots=[{x:350,y:220,w:12,h:10,vx:-175,vy:0}];run(s,1.5,dt);
 assert(!s.over&&!s.enemyShots.length&&s.assistants[0].hits===4,'assistant intercepts moving hostile shot before it hits player');
}
assert(!game.create().assistants.length,'restart clears team');
print('Passed: unlimited lifetime, five lives, physical jumps on all lanes, independent teams, boss survival and projectile interception at 30/60/120 FPS.');
