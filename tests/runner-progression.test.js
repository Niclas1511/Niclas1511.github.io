// Run from the repository root: gjs tests/runner-progression.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function create(width=420){const s=game.create(width);s.spawnIn=Infinity;s.nextBossAt=Infinity;return s;}
function run(s,seconds,dt=1/120){for(let i=0;i<Math.ceil(seconds/dt);i++)game.step(s,dt,()=>.8);}
function target(s,x=180,y=214,kind){s.obstacles.push({x,y,w:35,h:12,speed:1,...(kind?{kind,baseY:y}: {})});}
for(const dt of [1/30,1/60,1/120]){
 const held=create(),tap=create();game.jump(held);game.jump(tap);
 let heldPeak=252,tapPeak=252;
 for(let i=0;i<Math.ceil(1/dt);i++){
  if(i===1)game.releaseJump(tap);
  game.step(held,dt);game.step(tap,dt);
  heldPeak=Math.min(heldPeak,held.y);tapPeak=Math.min(tapPeak,tap.y);
 }
 assert(tapPeak-heldPeak>35,'holding jump produces a substantially higher arc at every frame rate');
}
let s=create();s.y=249;s.vy=200;s.jumps=2;game.jump(s);game.step(s,.03);
assert(s.jumps===1 && s.vy<0,'jump pressed just before landing is buffered');
s=create();s.y=180;s.vy=-100;s.jumps=2;game.jump(s);run(s,1);
assert(s.y===252 && s.jumps===0,'old buffered input expires instead of causing a late jump');
s=create();s.powerups.infinite=100;
for(let i=0;i<6;i++){target(s);assert(game.throwChalk(s),'combo shot');run(s,.3);assert(s.multiplier===Math.min(5,i+1),'multiplier increases to cap');}
assert(s.bonus===100 && s.streak===6,'six successive hits earn 5+10+15+20+25+25');
assert(game.throwChalk(s),'missed shot');run(s,1);
assert(s.streak===0 && s.multiplier===1,'miss resets combo');
target(s);game.throwChalk(s);run(s,.3);assert(s.bonus===105,'next hit starts again at five points');
s=create();s.powerups.infinite=100;s.powerups.spread=100;
target(s);game.throwChalk(s);run(s,.8);
assert(s.streak===1 && s.bonus===5 && !s.volleys.length,'one hit in spread volley prevents its other shots from resetting combo');
s=create();s.powerups.spread=100;target(s);game.throwChalk(s);run(s,.15);
assert(s.volleys.length===1 && s.volleys[0].hits===1,'successful spread volley still has airborne shots');
s.obstacles=[{x:78,y:222,w:62,h:30,speed:1}];game.step(s,.01);
assert(s.over && s.bonus===5 && !s.volleys.length && !s.shots.length,'game over cashes in pending successful volleys');
// Later shots can finish first. Settlement follows throw order, not collision order.
s=create();s.powerups.infinite=100;s.streak=3;s.multiplier=3;
game.throwChalk(s);run(s,.3);
s.y=218;s.vy=0;target(s,180,180);game.throwChalk(s);run(s,.18);
assert(s.streak===3 && s.volleys.length===2,'completed later throw waits for earlier miss');
run(s,.4);
assert(s.streak===1 && s.multiplier===1 && s.bonus===5,'earlier miss then later hit are scored in their original order');
s=create();s.duck=true;s.chalk=0;s.obstacles=[{x:110,y:192,w:62,h:28,speed:180}];run(s,.7);
assert(!s.over && s.nearMisses===1 && s.bonus===10 && s.chalk===1,'close dodge awards points and chalk');
run(s,.5);assert(s.nearMisses===1 && s.bonus===10,'near miss rewarded once');
s=create();s.duck=true;s.powerups.shield=10;s.obstacles=[{x:110,y:192,w:62,h:28,speed:180}];run(s,.7);
assert(s.nearMisses===0,'shield cannot farm near-miss rewards');
s=create();target(s,180,214,'reviewer');game.throwChalk(s);run(s,.15);
assert(s.particles.some(p=>p.color==='#e87878'),'reviewer pen explodes into red pixels');
s=create();s.obstacles=[{...game.flyers[4],x:180,y:192,baseY:192,speed:1,age:0}];game.throwChalk(s);run(s,.15);
assert(s.obstacles[0].kind==='paperplane' && s.obstacles[0].resolved,'worksheet folds into a harmless paper plane');
run(s,2);assert(!s.obstacles.length,'folded sheet exits');
assert([0,24,48,72,96].map(game.phaseAt).join(',')==='0,1,2,3,0','four phases cycle every 24 seconds');
assert(new Set(game.phases.map(p=>p.sky)).size===4,'each phase has its own palette');
assert(game.eventAt(6).warning && !game.eventAt(8).warning && !game.eventAt(16),'office hours has advance notice and finite duration');
assert(game.eventAt(78).warning && game.eventAt(81).kind==='inbox','inbox event has advance notice');
for(const [time,expected] of [[9,'student'],[81,'email']]){
 s=create();s.time=time;s.spawnIn=0;game.step(s,.01,()=>.8);
 assert(s.obstacles[0].kind===expected,'announced events create their promised motifs');
}
for(const [time,kind,band] of [[1,'student',1],[25,undefined,0],[49,'conference',2],[73,'worksheet',2]]){
 s=create();s.time=time;s.spawnIn=0;game.step(s,.01,()=>.1);
 assert(s.obstacles[0].kind===kind && s.obstacles[0].band===band,'phase changes encounter patterns');
}
for(const width of [420,960]){
 s=create(width);s.encounters=2;s.spawnIn=0;game.step(s,.01,()=>.8);s.spawnIn=Infinity;
 assert(s.items.length===2 && s.items.some(i=>i.risky) && s.obstacles[0].optional,'safe and risky reward routes');
 run(s,8);assert(!s.over && s.pickupSerial===1,'safe ground route requires no jump and collects only ground reward');
 s=create(width);s.items=[{x:180,y:140,w:28,h:28,speed:280,kind:'spread',risky:true}];
 s.obstacles=[{x:295,y:132,w:62,h:28,speed:280}];game.jump(s);run(s,1.5);
 assert(!s.over && s.pickupSerial===1,'elevated reward is reachable and trailing hazard avoidable');
}
const fresh=create();assert(fresh.streak===0 && fresh.multiplier===1 && !fresh.volleys.length && !fresh.boss && fresh.phase===0,'restart resets progression');
print('Passed: variable jump/buffer, ordered combos and misses, near dodges, reactions, four phases, events and reward routes.');
