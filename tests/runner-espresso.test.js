// Run from the repository root: gjs tests/runner-espresso.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function create(){const s=game.create(420);s.spawnIn=Infinity;s.nextBossAt=Infinity;return s;}
function drink(s){const body=game.player(s);s.items.push({kind:'espresso',x:body.x,y:body.y,w:28,h:28,speed:0});game.step(s,1/120);}
function run(s,seconds,dt){for(let i=0;i<Math.ceil(seconds/dt);i++)game.step(s,dt);}
for(const dt of [1/30,1/60,1/120]){
 let s=create();drink(s);assert(s.powerups.espresso===10&&s.pickupMessage.includes('Espresso')&&s.espressoSip>0,'cup grants effect and funny sip animation');
 s.jumpHeld=true;game.jump(s);run(s,.2,dt);game.jump(s);run(s,.2,dt);game.jump(s);
 assert(s.jumps===3&&s.vy<0&&s.sounds.includes('espressoJump'),'third jump works with distinct cue');
 assert(s.espressoPuffs.length===1&&s.espressoBoost>0,'third jump creates steam puff and stretch animation');
 const vy=s.vy;game.jump(s);assert(s.jumps===3&&s.vy===vy,'no fourth jump');
 drink(s);assert(s.jumps===3&&s.powerups.espresso===10,'another coffee refreshes timer without resetting jumps');
 s.powerups.espresso=.001;game.step(s,dt);const after=s.vy;game.jump(s);assert(s.jumps===3&&s.vy===after,'expiry cannot grant further jumps mid-air');
 run(s,2,dt);assert(s.y===252&&!s.jumps&&!s.espressoPuffs.length&&!s.espressoBoost,'landing restores jumps and completed animation is cleaned up');
 game.jump(s);game.jump(s);const double=s.vy;game.jump(s);assert(s.jumps===2&&s.vy===double,'expiry restores ordinary two-jump rule');
 s=create();game.jump(s);game.jump(s);drink(s);game.jump(s);assert(s.jumps===3,'mid-air pickup grants third jump');
 s=create();drink(s);s.nextBossAt=0;game.step(s,dt);const timer=s.powerups.espresso;run(s,1,dt);assert(s.powerups.espresso===timer,'cinematic freezes coffee timer');
 s.bossIntro=null;s.jumpHeld=true;game.jump(s);game.jump(s);game.jump(s);assert(s.jumps===3,'espresso works inside boss arenas');
}
let s=create();const upperKinds=new Set();
for(let i=0;i<48;i++){
 s.items=[];s.obstacles=[];s.spawnIn=0;game.step(s,.01,()=>.8);
 const reward=s.items.find(item=>item.risky&&item.kind!=='heart');if(reward)upperKinds.add(reward.kind);
}
assert(upperKinds.size===game.powerupTypes.length&&upperKinds.has('espresso'),'all effects, including coffee, appear in upper reward rotation');
assert(!game.motifs.flat().some(m=>m==='coffee')&&game.motifs[0].includes('8 AM'),'cup is no longer a harmful obstacle');
assert(!game.create().powerups.espresso,'restart clears coffee effect');
print('Passed: coffee pickup, third-jump limit, refresh, mid-air pickup/expiry, landing, boss/cinematic behavior and complete upper-reward rotation.');
