// Run from the repository root: gjs games/math-run/tests/runner-rivals-routes.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
for(const width of [420,960])for(const dt of [1/30,1/60,1/120])for(const [count,actor,kind] of [[1,'professor','integral'],[5,'paperPrinter','paperAvalanche']])for(const wins of [0,1,4]){
 const s=game.create(width);s.time=20;s.runTime=20;s.spawnIn=0;s.encounters=count;s.bossWins=wins;s.nextBossAt=Infinity;
 game.step(s,dt,()=>.99);s.spawnIn=Infinity;
 assert(s.attackers[0]?.kind===actor&&s.obstacles.some(o=>o.kind===kind),'scheduled rival has matching attacks');
 for(let i=0;i<Math.ceil(15/dt)&&!s.over;i++){
  const upcoming=s.obstacles.filter(o=>!o.destroyed&&o.x+o.w>s.x);
  const low=upcoming.find(o=>o.band===0),mid=upcoming.find(o=>o.band===1);
  const lt=low?(low.x-100)/low.speed:Infinity,mt=mid?(mid.x-100)/mid.speed:Infinity;
  s.duck=mt<.5&&Boolean(mid&&mid.x+mid.w>s.x);
  if(lt<.16&&lt>-.1&&s.y===252){s.duck=false;s.jumpHeld=true;game.jump(s);}
  game.step(s,dt,()=>.99);
 }
 assert(!s.over&&s.lives===1,'rival route '+[width,dt,count,wins,s.y,s.time]);
 assert(!s.attackers.length,'rival leaves after its volley');
}
for(const width of [420,960])for(const dt of [1/30,1/60,1/120])for(const time of [20,59])for(const wins of [1,8])for(const risky of [false,true]){
 const s=game.create(width);s.time=time;s.runTime=time;s.bossWins=wins;s.encounters=2;s.nextRoute=2;s.spawnIn=0;
 game.step(s,dt,()=>.99);s.spawnIn=Infinity;s.nextBossAt=Infinity;
 const reward=s.items.find(o=>o.risky);
 assert(reward.riskBonus===50&&s.obstacles.length===3&&s.obstacles.every(o=>o.optional),'expert route has greater reward and longer optional ceiling');
 let jumped=null,second=false;
 for(let i=0;i<Math.ceil(12/dt)&&!s.over;i++){
  if(risky&&jumped===null&&(reward.x-100)/reward.speed<.62){s.jumpHeld=true;game.jump(s);jumped=s.time;}
  if(jumped!==null&&!second&&s.time-jumped>=.3){game.jump(s);second=true;}
  if(risky&&s.pickupSerial){s.duck=true;game.releaseJump(s);}
  game.step(s,dt,()=>.99);
 }
 assert(!s.over&&s.lives===1,'route survives '+[width,dt,time,wins,risky,s.pickupSerial,s.bonus,s.y]);
 assert(s.bonus===(risky?60:10),'bonus correct '+[width,dt,time,wins,risky,s.pickupSerial,s.bonus,s.nearMisses]);
 assert(s.pickupSerial===(risky?2:1),'risk and ground rewards remain independently collectible');
}
print('Passed: professor/integral and printer/paper volleys, cleanup, safe/expert routes and bonus rewards at 30/60/120 FPS.');
