// Run from the repository root: gjs games/math-run/tests/runner-cosmetics.test.js
const GLib=imports.gi.GLib;
function read(p){const [,b]=GLib.file_get_contents(p);return new TextDecoder().decode(b);}
const art=new Function(read('games/math-run/runner-cosmetics.js')+';return RunnerCosmetics;')();
const game=new Function(read('games/math-run/runner-engine.js')+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
assert([0,2,5,9,15].map(w=>art.profileAt(w).title).join(',')==='Student,Doctoral student,Postdoc,Professor,Emeritus','academic career progression');
for(let w=2;w<=100;w+=2)assert(art.profileAt(w).beardLength>art.profileAt(w-2).beardLength,'beard still grows every two semesters beyond semester twelve');
function render(wins,duck,time=3,reduced=false){
 const ops=[];const r=(...v)=>ops.push(v);const p=art.profileAt(wins,duck);
 art.adorn(r,p,duck?232:208,duck,time,{wind:.5},['reviewer','blackboard','printer','deadline'],reduced);
 assert(ops.every(([x,y,w,h])=>[x,y,w,h].every(Number.isFinite)&&w>0&&h>0),'cosmetic pixels have valid dimensions');
 return ops;
}
for(const wins of [0,2,5,9,12,15,24,40,80])for(const duck of [false,true]){
 const s=game.create();s.bossWins=wins;s.duck=duck;
 const before=JSON.stringify(s),body=JSON.stringify(game.player(s));
 render(wins,duck);
 assert(JSON.stringify(s)===before&&JSON.stringify(game.player(s))===body,'cosmetics never alter simulation or hitbox');
 assert(JSON.stringify(render(wins,duck,1,true))===JSON.stringify(render(wins,duck,2,true)),'reduced motion stops decorative flutter');
}
assert(JSON.stringify(render(12,false))!==JSON.stringify(render(24,false))&&JSON.stringify(render(24,false))!==JSON.stringify(render(40,false)),'late silhouettes continue changing');
for(const dt of [1/30,1/60,1/120]){
 let motion;
 for(let t=0;t<2;t+=dt)motion=art.motionAt(motion,t,true,0,false,false);
 assert(motion.wind>1.4,'sprinting streams beard backward');
 const at=motion.time;
 for(let t=at+dt;t<at+.4;t+=dt)motion=art.motionAt(motion,t,false,0,false,false);
 assert(motion.wind<0,'boost release swings beard forward');
 const frozen=JSON.stringify(motion);motion=art.motionAt(motion,motion.time,false,0,false,false);
 assert(JSON.stringify(motion)===frozen,'pause freezes beard physics');
 art.motionAt(motion,motion.time+dt,true,0,false,true);assert(motion.wind===0,'reduced motion suppresses wind');
}
const s=game.create();
for(let i=0;i<4;i++){s.runTime=s.nextBossAt;s.obstacles=[];s.spawnIn=Infinity;game.step(s,.001);game.skipBoss(s);}
assert(s.trophies.join(',')==='reviewer,blackboard,printer,deadline','actual boss victories award the correct mementos');
s.runTime=s.nextBossAt;game.step(s,.001);game.skipBoss(s);assert(s.trophies.length===4,'repeated bosses do not duplicate cosmetics');
assert(!game.create().trophies.length,'new run clears trophies');
print('Passed: career/world stages, long-term beard growth, late silhouettes, sprint/brake physics, pause/reduced motion, cosmetic-only behavior and earned boss mementos.');

const backdrops=[];
for(const kind of ['reviewer','blackboard','printer','deadline']){
 const ops=[];art.bossBackdrop((...v)=>ops.push(v),kind,420,{grid:'#203442',sky:'#172431'});
 assert(ops.length>0&&ops.every(([x,y,w,h])=>y>=50&&y+h<=160),'subtle boss backdrop stays in upper background');
 backdrops.push(JSON.stringify(ops));
}
assert(new Set(backdrops).size===4,'each boss has a distinct backdrop');
const normal=[];art.bossBackdrop((...v)=>normal.push(v),null,420,{});assert(!normal.length,'no boss decoration during normal running');
