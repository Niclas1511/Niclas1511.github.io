// Run from the repository root: gjs games/math-run/tests/runner-challenges.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function create(width=420){const s=game.create(width);s.spawnIn=Infinity;s.nextBossAt=Infinity;return s;}
function run(s,time,dt=1/120){for(let i=0;i<Math.ceil(time/dt);i++)game.step(s,dt,()=>.8);}
// Normal chalk consumes one round per impact; each successful volley counts.
for(const hp of [2,3]){
 const s=create();const target={x:250,y:214,w:62,h:28,speed:1,hp,maxHp:hp,armor:hp===2?'proof':'report'};s.obstacles=[target];
 for(let i=0;i<hp;i++){game.throwChalk(s);run(s,.31);assert(target.hp===hp-i-1,'each chalk impact removes one armor point');if(i<hp-1)assert(!target.destroyed,'armored obstacle survives partial hits');}
 assert(target.destroyed&&s.chalk===3-hp&&s.streak===hp,'final impact destroys target with expected ammo and combo');
}
for(const power of ['giant','shield','assistant']){
 const s=create();const target={x:power==='shield'?78:power==='assistant'?360:250,y:214,w:62,h:28,speed:180,hp:3,maxHp:3,armor:'report'};s.obstacles=[target];
 if(power==='giant'){s.hagoromo=1;game.throwChalk(s);}
 if(power==='shield')s.powerups.shield=10;
 if(power==='assistant'){s.powerups.assistant=Infinity;s.assistants=[{id:0,remaining:Infinity,hits:5,hurt:0,x:186,y:252,vy:0,flight:null}];}
 run(s,.7);assert(target.destroyed,'special clearing still destroys armored target: '+power);
}
// Exercise sequences produced by the actual encounter scheduler, with one life,
// no chalk, no shield and the same duck/jump timing at multiple speeds.
for(const width of [420,960])for(const dt of [1/30,1/60,1/120])for(const [time,count,name,bossAt] of [[20,1,'duck-jump'],[20,5,'jump-duck'],[25,0,'exam'],[73,0,'inbox'],[95,0,'inbox'],[60,1,'duck-jump',80],[70,0,'exam',80],[20,1,'duck-jump',60],[40,1,'exam',60],[55,0,'exam',60]]){
 const s=create(width);s.runTime=time;s.time=time;s.encounters=count;s.spawnIn=0;s.chalk=0;if(bossAt)s.nextBossAt=bossAt;
 game.step(s,dt,()=>.8);
 if(name==='inbox')assert(s.spawnIn>=5.4,'deadline wave reserves a long rest after the burst');
 s.spawnIn=Infinity;s.nextBossAt=Infinity;
 assert(s.obstacles.length>=2&&s.obstacles.every(o=>o.sequence===name),'scheduler emits advertised sequence '+name);
 const speeds=new Set(s.obstacles.map(o=>o.speed));assert(speeds.size===1,'sequence hazards cannot catch one another');
 if(name==='inbox')assert(s.obstacles[0].speed>=s.speed*1.34,'deadline emails travel faster');
 for(let i=0;i<Math.ceil(12/dt)&&!s.over;i++){
  const upcoming=s.obstacles.filter(o=>!o.destroyed&&!o.resolved&&o.x+o.w>s.x).sort((a,b)=>a.x-b.x);
  const low=upcoming.find(o=>o.band===0), mid=upcoming.find(o=>o.band===1);
  const lowTime=low?(low.x-s.x-24)/low.speed:Infinity;
  const midTime=mid?(mid.x-s.x-24)/mid.speed:Infinity;
  s.duck=midTime<.5&&midTime>-.7;
  if(lowTime<.16&&lowTime>-.1&&s.y===252){s.duck=false;s.jumpHeld=true;game.jump(s);}
  game.step(s,dt,()=>.8);
 }
 assert(!s.over&&s.lives===1,'one-life no-ammo route survives '+name+' at '+width+'/'+dt);
}
// Both rewards remain independently collectible in either order.
for(const risky of [false,true]){
 const s=create();s.encounters=2;s.spawnIn=0;game.step(s,.01,()=>.8);s.spawnIn=Infinity;
 const items=s.items;assert(items.length===2&&items[0].kind==='points'&&items[0].route===items[1].route,'reward pair keeps its shared layout marker');
 const chosen=items.find(i=>Boolean(i.risky)===risky);chosen.x=78;s.y=risky?chosen.y+30:252;
 game.step(s,.001);
 assert(s.items.length===1&&s.pickupSerial===1,'other reward stays visible after collection');
 assert(risky?s.powerups.infinite>0:s.bonus===10,'selected branch grants correct reward');
 const other=s.items[0];other.x=78;s.y=other.risky?other.y+30:252;s.vy=0;game.step(s,.001);
 assert(!s.items.length&&s.pickupSerial===2&&s.bonus===10&&s.powerups.infinite>0,'both rewards can be collected once');
}
for(const [previous,hp] of [[4,2],[19,3]]){
 const s=create();s.runTime=20;s.time=20;s.encounters=previous;s.spawnIn=0;game.step(s,.01,()=>.8);
 assert(s.obstacles[0].hp===hp&&s.obstacles[0].maxHp===hp,'scheduler produces multi-hit obstacles');
}
{
 const s=create();s.nextRoute=1;s.encounters=2;s.spawnIn=0;game.step(s,.01,()=>.8);s.spawnIn=Infinity;
 const heart=s.items.find(item=>item.risky);assert(heart.kind==='heart','alternate upper route offers healing');
 heart.x=78;s.y=heart.y+30;game.step(s,.001);
 assert(s.lives===2&&s.items.length===1&&s.bonus===0,'upper heart heals while lower reward stays');
}
// The difficult upper branch is physically reachable with a timed double jump,
// followed by fast fall to clear its trailing high obstacle.
for(const width of [420,960])for(const dt of [1/30,1/60,1/120])for(const time of [0,100]){
 const s=create(width);s.runTime=time;s.time=time;s.encounters=2;s.spawnIn=0;game.step(s,dt,()=>.8);s.spawnIn=Infinity;
 const reward=s.items.find(item=>item.risky);let jumpedAt=null,second=false;
 for(let i=0;i<Math.ceil(10/dt)&&!s.over;i++){
  if(jumpedAt===null&&(reward.x-100)/reward.speed<.62){s.jumpHeld=true;game.jump(s);jumpedAt=s.time;}
  if(jumpedAt!==null&&!second&&s.time-jumpedAt>=.3){game.jump(s);second=true;}
  if(s.pickupSerial){s.duck=true;game.releaseJump(s);}
  game.step(s,dt,()=>.8);
 }
 assert(!s.over&&s.pickupSerial===2&&s.bonus===10,'double jump and fast fall can collect both rewards without damage');
}
// A sustained boss-free run cannot create overlapping groups at the player.
let s=create();s.powerups.shield=10000;let seed=321,last=-Infinity;
function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
for(let i=0;i<60000;i++){
 const count=s.count;s.obstacles=[];s.items=[];game.step(s,1/120,random);
 if(s.count!==count){const first=s.obstacles[0];const arrival=s.time+(first.x-100)/first.speed;assert(arrival-last>=1.59,'next group starts after previous reserved arrival');last=s.lastArrival;}
}
print('Passed: armor/ammo/combo, special clears, curated one-life sequences, fast deadline waves, independent reward pairs and mixed group scheduling.');

for(const [time,expected] of [[39.9,0],[40,1],[49.9,1],[50,2],[60,2]])assert(game.pressureAt(time,60)===expected,'pressure threshold '+time);
assert(game.pressureAt(100,Infinity)===0,'disabled bosses disable pressure');
for(const [time,pressure] of [[59,0],[60,1],[70,2]]){
 const s=create();s.nextBossAt=80;s.runTime=time;s.time=time;s.encounters=1;s.spawnIn=0;game.step(s,.001,()=>.8);
 assert(s.bossPressure===pressure,'scheduled pressure follows next boss');
 if(pressure===2)assert(s.obstacles.at(-1).hp===2,'final push adds a two-hit ending');
}
print('Passed: pre-boss thresholds and one-life no-ammo approach routes.');

// Every boss approach ramps speed and density, including later semesters.
for (const bossAt of [60,120,300]) {
 const samples=[0,20,40,55].map(elapsed=>{
  const s=create();s.nextBossAt=bossAt;s.runTime=bossAt-60+elapsed;
  s.time=s.runTime;s.encounters=7;s.spawnIn=0;game.step(s,.001,()=>.99);
  const tail=s.obstacles.at(-1);
  const duration=tail?.sequence ? game.sequences.find(q=>q.name===tail.sequence).steps.at(-1)[1] : 0;
  return {speed:s.speed,gap:s.spawnIn-duration-(s.stress.recovery?1.1:0)};
 });
 for(let i=1;i<samples.length;i++){
  assert(samples[i].speed>samples[i-1].speed,'each approach accelerates');
  assert(samples[i].gap<samples[i-1].gap,'recovery gaps shrink through each approach');
 }
}
assert(game.approachAt(60,120)===0 && game.approachAt(120,120)===1,'approach resets for next boss');
assert(game.approachAt(0,60)===0 && game.approachAt(100,60)===1,'approach remains bounded');
print('Passed: continuous speed and density progression, per-boss reset and full-speed dodge routes.');

// Victory difficulty and advanced patterns must remain playable without chalk.
for(const width of [420,960])for(const dt of [1/30,1/60,1/120])for(const wins of [1,2,8,100])for(const count of [1,3,5])for(const time of [55,59]){
 const s=create(width);s.bossWins=wins;s.runTime=time;s.time=time;s.nextBossAt=60;s.encounters=count;s.spawnIn=0;s.chalk=0;
 game.step(s,dt,()=>.8);
 const name=(wins>=3||wins%4===1)&&(count+1)%3===0?'gauntlet':game.sequences[4+Math.floor(count/2)%(wins>=2?3:2)].name;
 assert(s.obstacles.length>=4&&s.obstacles.every(o=>o.sequence===name),'victories unlock advanced pattern '+name);
 s.spawnIn=Infinity;s.nextBossAt=Infinity;
 for(let i=0;i<Math.ceil(14/dt)&&!s.over;i++){
  const upcoming=s.obstacles.filter(o=>!o.destroyed&&!o.resolved&&o.x+o.w>s.x).sort((a,b)=>a.x-b.x);
  const low=upcoming.find(o=>o.band===0),mid=upcoming.find(o=>o.band===1);
  const lowTime=low?(low.x-s.x-24)/low.speed:Infinity;
  const midTime=mid?(mid.x-s.x-24)/mid.speed:Infinity;
  s.duck=midTime<.5&&midTime>-.7;
  if(lowTime<.16&&lowTime>-.1&&s.y===252){s.duck=false;s.jumpHeld=true;game.jump(s);}
  game.step(s,dt,()=>.8);
 }
 assert(!s.over&&s.lives===1,'no-ammo advanced route '+name+' wins='+wins+' width='+width+' dt='+dt);
}
for(const elapsed of [0,30,59]){
 let previous=0;
 for(const wins of [0,1,2,4,20,100]){
  const s=create();s.bossWins=wins;s.runTime=elapsed;s.nextBossAt=60;game.step(s,.001);
  assert(s.speed>previous&&s.speed<560,'victories raise speed within a playable limit');previous=s.speed;
 }
}
assert(game.create().bossWins===0,'restart resets victory difficulty');
print('Passed: permanent victory escalation and advanced one-life no-ammo routes at 30/60/120 FPS.');
