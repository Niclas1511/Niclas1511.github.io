// Run from the repository root: gjs games/math-run/tests/runner-exact-sequence.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
assert(game.motifs[1][3]==='0→A→B→C→0','complete exact sequence replaces old motif');
for(const width of [420,960])for(const dt of [1/30,1/60,1/120]){
 const s=game.create(width);s.nextBossAt=Infinity;s.time=20;s.runTime=20;s.encounters=9;s.spawnIn=0;
 game.step(s,dt,()=>.99);s.spawnIn=Infinity;
 const first=s.obstacles[0],next=s.obstacles[1];
 assert(first.w===132&&first.variant===3,'exact sequence has a wider physical obstacle');
 assert((next.x-first.x)/first.speed>.82,'following jump is delayed for wider tile');
 for(let i=0;i<Math.ceil(12/dt)&&!s.over;i++){
  const remaining=s.obstacles.filter(o=>o.x+o.w>s.x);
  const low=remaining.find(o=>o.band===0),mid=remaining.find(o=>o.band===1);
  const lowTime=low?(low.x-100)/low.speed:Infinity;
  s.duck=Boolean(mid&&(mid.x-100)/mid.speed<.5&&mid.x+mid.w>s.x);
  if(lowTime<.16&&lowTime>-.1&&s.y===252){s.duck=false;s.jumpHeld=true;game.jump(s);}
  game.step(s,dt,()=>.99);
 }
 assert(!s.over,'wide exact-sequence tile followed by jump remains avoidable');
}
print('Passed: full exact sequence, wider collision box, reserved spacing and duck/jump routes at 30/60/120 FPS.');
