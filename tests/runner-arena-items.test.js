// Run from the repository root: gjs tests/runner-arena-items.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function arena(width,dt,type=0){const s=game.create(width);s.bossCount=type;s.nextBossAt=0;game.step(s,dt);s.bossIntro=null;s.boss.attackIn=Infinity;s.powerups.shield=100;return s;}
function run(s,time,dt){for(let i=0;i<Math.ceil(time/dt);i++)game.step(s,dt,()=>0);}
for(const width of [420,960])for(const dt of [1/30,1/60,1/120])for(const type of [0,1]){
 let s=arena(width,dt,type);run(s,17,dt);assert(!s.items.length,'no early arena reward');
 run(s,1.1,dt);const item=s.items[0];
 assert(item?.arena&&item.y>=58&&item.y<=76&&item.speed===0,'rare elevated stationary reward in both arenas');
 assert(s.boss.pickupIn>23&&s.boss.pickupIn<=34,'rare repeat interval');
 const x=item.x,y=item.y;run(s,.2,dt);assert(item.x===x&&item.y===y,'arena items do not scroll');
 run(s,7,dt);assert(!s.items.length,'missed reward expires');
 s=arena(width,dt,type);s.boss.pickupIn=0;game.step(s,dt,()=>0);s.x=s.items[0].x;s.jumpHeld=true;game.jump(s);run(s,1,dt);
 assert(s.items.length===1&&!s.powerups.infinite,'single jump cannot collect elevated reward');
 s.jumpHeld=true;game.jump(s);run(s,.3,dt);game.jump(s);run(s,.5,dt);
 assert(!s.items.length&&s.powerups.infinite>0,'double jump can collect reward before expiry');
 s=arena(width,dt,type);s.boss.pickupIn=0;game.step(s,dt,()=>0);
 const life=s.items[0].life;s.bossIntro={age:0,duration:2.4,impact:false};run(s,1,dt);
 assert(s.items[0].life===life,'cinematic freezes collectible timer');
}
print('Passed: rare cadence, both boss types, fixed positions, expiry, double-jump requirement/reachability and cinematic timer freeze at 30/60/120 FPS.');
