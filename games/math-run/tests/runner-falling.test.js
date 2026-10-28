// Run from the repository root: gjs games/math-run/tests/runner-falling.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function encounter(width,dt,wins=0){
 const s=game.create(width);s.time=20;s.runTime=20;s.bossWins=wins;s.spawnIn=0;
 // Use an isolated ground encounter; keep advanced combos for their own route tests.
 s.encounters=wins?11:0;if(wins)s.nextBossAt=Infinity;
 game.step(s,dt,()=>.99);
 if(wins){
  // Advanced sequence supplies falling ground obstacles at late-run speeds.
  s.obstacles=s.obstacles.filter(o=>o.falling).slice(0,1);
 }
 assert(s.obstacles.length===1&&s.obstacles[0].falling,'scheduler creates a falling ground obstacle');
 s.spawnIn=Infinity;s.nextBossAt=Infinity;return s;
}
for(const width of [420,960])for(const dt of [1/30,1/60,1/120])for(const wins of [0,100])for(const dodge of [false,true]){
 const s=encounter(width,dt,wins),o=s.obstacles[0];let sawFall=false,landedAt=null;
 for(let i=0;i<Math.ceil(12/dt)&&!s.over;i++){
  const remaining=(o.x-100)/o.speed;
  if(o.y>o.dropFrom&&o.y<o.baseY&&o.x<width)sawFall=true;
  if(o.landed&&landedAt===null)landedAt=remaining;
  s.duck=!dodge;
  if(dodge&&remaining<.16&&remaining>-.1&&s.y===252){s.jumpHeld=true;game.jump(s);}
  game.step(s,dt,()=>.99);
 }
 assert(sawFall,'fall is visible on desktop and mobile');
 assert(landedAt>.45&&o.y===252-o.h,'lands before the player and stays on the floor');
 assert(dodge?!s.over:s.over,'jump clears the obstacle; permanent ducking fails');
 assert(o.dropWarned&&o.landed,'fall warning and landing run once');
}
{
 const s=encounter(420,1/120),o=s.obstacles[0];
 while(!o.landed)game.step(s,1/120);
 s.duck=true;game.throwChalk(s);
 for(let i=0;i<100&&!s.over;i++)game.step(s,1/120);
 assert(o.destroyed,'landed obstacles can be cleared with chalk');
}
print('Passed: scheduled falling hazards, visible descent and safe landing lead, jump/duck counterplay and chalk clearing at 30/60/120 FPS.');

const variants=new Set();let drops=0,hazards=0;
for(let count=0;count<100;count++){
 const s=game.create();s.time=6.1;s.runTime=6.1;s.encounters=count;s.spawnIn=0;
 game.step(s,.001,()=>.99);
 for(const o of s.obstacles){hazards++;if(o.falling){variants.add(o.falling);drops++;}}
}
assert(variants.size===4&&variants.has('blackboard'),'all four falling variants occur, including the small board');
assert(drops/hazards<.2,'falling objects stay below a fifth of isolated hazards');
print('Passed: reduced falling frequency and all four falling variants.');
