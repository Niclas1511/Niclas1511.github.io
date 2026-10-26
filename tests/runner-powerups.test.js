// Run from the repository root: gjs tests/runner-powerups.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function create(){const state=game.create(420);state.spawnIn=Infinity;return state;}
function pickup(state,kind){state.items.push({kind,x:78,y:220,w:28,h:28,speed:0});game.step(state,1/120);}
function run(state,seconds){for(let i=0;i<Math.ceil(seconds*120);i++)game.step(state,1/120);}
for(const type of game.powerupTypes.filter(type=>type.kind!=='assistant')){
 const state=create();pickup(state,type.kind);
 assert(state.powerups[type.kind]===type.duration,'walk-through pickup grants '+type.kind);
 assert(!state.items.length && state.pickupSerial===1,'collected exactly once');
 run(state,.5);pickup(state,type.kind);
 assert(state.powerups[type.kind]===type.duration,'repeat pickup refreshes instead of adding unbounded time');
 run(state,type.duration+.05);assert(state.powerups[type.kind]===0,'effect expires');
}
let state=create();state.y=170;pickup(state,'shield');
assert(!state.powerups.shield && state.items.length===1,'jumping over item does not collect');
state=create();state.items=[{kind:'infinite',x:170,y:220,w:28,h:28,speed:1}];
game.throwChalk(state);run(state,.15);
assert(!state.powerups.infinite && state.items.length===1,'chalk cannot collect or destroy items');
state.items[0].x=-40;game.step(state,.01);assert(!state.items.length,'missed item is removed');
state=create();state.chalk=0;pickup(state,'infinite');
assert(game.throwChalk(state) && state.chalk===0,'unlimited chalk works at zero ammo');
assert(!game.throwChalk(state),'unlimited mode keeps throw cooldown');
run(state,.3);assert(game.throwChalk(state),'unlimited mode can fire again');
state.powerups.infinite=.001;state.chalk=0;state.reload=0;game.step(state,.01);state.cooldown=0;
assert(!game.throwChalk(state),'normal ammo rules return after expiry');
state=create();pickup(state,'spread');
assert(game.throwChalk(state),'spread fires');
assert(state.shots.length===3 && state.chalk===2,'one ammo produces three shots');
assert(new Set(state.shots.map(s=>s.vy)).size===3,'three different directions');
state.obstacles=[188,214,244].map(y=>({x:180,y,w:35,h:12,speed:1}));run(state,.3);
assert(!state.obstacles.length && state.bonus===15,'spread hits high, central and low targets');
state=create();pickup(state,'infinite');pickup(state,'spread');
state.chalk=0;assert(game.throwChalk(state) && state.shots.length===3 && state.chalk===0,'infinite and spread combine');
state=create();pickup(state,'shield');
state.obstacles=[{x:78,y:222,w:62,h:30,speed:1}];game.step(state,.01);
assert(!state.over && !state.obstacles.length,'shield breaks touching hazard');
state.obstacles=[{...game.flyers[0],x:78,baseY:176,speed:1,age:0}];game.step(state,.01);
assert(!state.over && state.obstacles[0].resolved,'shield safely resolves student');
state.obstacles=[];state.lives=3;state.powerups.shield=.001;
state.obstacles=[{x:78,y:222,w:62,h:30,speed:1}];game.step(state,.01);
assert(!state.over && state.lives===2,'collision costs a life after shield expires');
state=create();state.items=[{kind:'shield',x:78,y:220,w:28,h:28,speed:0}];
state.obstacles=[{x:78,y:222,w:62,h:30,speed:1}];game.step(state,.01);
assert(!state.over && state.powerups.shield===6,'pickup protects in the same simulation step');
state=create();pickup(state,'shield');state.over=true;
const remaining=state.powerups.shield;game.step(state,.03);
assert(state.powerups.shield===remaining,'game-over freezes effect timers');
const fresh=create();assert(!fresh.items.length && Object.values(fresh.powerups).every(t=>t===0),'new game resets all effects');
assert(game.shotImpact({x:10,y:10,w:1,h:1},0,0,{x:5,y:5,w:1,h:1})!==null,'diagonal segment hits crossed target');
assert(game.shotImpact({x:10,y:10,w:1,h:1},0,0,{x:8,y:1,w:1,h:1})===null,'diagonal near miss does not count');
state=create();const kinds=[];
for(let i=0;i<19;i++){
 state.obstacles=[];state.items=[];state.spawnIn=0;game.step(state,.01,()=>.8);
 if(state.items[0]?.kind==='heart'){assert(!state.obstacles.length,'heart has a safe collection route');continue;}
 if(state.items.length){kinds.push(state.items[1].kind);assert(state.items.length===2 && state.obstacles.every(o=>o.optional),'safe and risky rewards with optional upper obstacle');}
}
assert(kinds.join(',')==='infinite,heart,spread,heart,shield','upper routes alternate power-ups and hearts');
assert(state.items[0].kind==='points','lower reward is a small score pickup');
print('Passed: item collection/misses, refresh/expiry, infinite ammo, triple trajectories, combined effects, shield collisions, scheduling and restart.');
