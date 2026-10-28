// Run from the repository root: gjs games/math-run/tests/runner-hagoromo.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function create(width=420){const s=game.create(width);s.spawnIn=Infinity;s.nextBossAt=Infinity;return s;}
function run(s,seconds,dt=1/120){for(let i=0;i<Math.ceil(seconds/dt);i++)game.step(s,dt,()=>.8);}
function target(s,x=180,y=214){s.obstacles.push({x,y,w:35,h:12,speed:1});}
let s=create();s.powerups.infinite=100;
for(let i=1;i<=20;i++){
 target(s);const giant=s.hagoromo>0;game.throwChalk(s);run(s,giant?.9:.3);
 assert(s.streak===i,'every successful throw counts once');
 assert(s.multiplier===i,'multiplier keeps growing through the ten and twenty hit milestones');
 if(i===9)assert(s.hagoromo===0,'no reward before ten');
 if(i===10 || i===20)assert(s.hagoromo===1 && s.rewardSerial===i/10,'one reward at each ten-hit milestone');
}
assert(s.multiplier===20,'score multiplier reaches twenty without a cap');
s=create();s.streak=9;s.multiplier=5;s.powerups.spread=10;
s.obstacles=[188,214,244].map(y=>({x:180,y,w:35,h:12,speed:1}));
game.throwChalk(s);run(s,.3);
assert(s.streak===10 && s.hagoromo===1,'three hits in a spread volley grant one milestone reward');
s=create();s.hagoromo=1;s.chalk=0;s.powerups.spread=10;
assert(game.throwChalk(s),'earned chalk can fire at zero ammo');
assert(s.shots.length===1 && s.shots[0].giant && s.shots[0].w===84,'giant replaces spread with one thick chalk');
assert(s.hagoromo===0 && s.chalk===0,'one earned charge consumed without normal ammo');
assert(!game.throwChalk(s),'cooldown still applies');
// Misses reset the streak but keep an already earned, unused reward.
s=create();s.streak=8;s.multiplier=5;game.throwChalk(s);s.hagoromo=1;run(s,1);
assert(s.streak===0 && s.hagoromo===1,'earned reward survives a later normal miss');
for(const dt of [1/30,1/60,1/120]){
 s=create(960);s.hagoromo=1;
 s.obstacles=[{x:250,y:214,w:35,h:12,speed:1},
  {...game.flyers[0],x:280,y:176,baseY:176,speed:1,age:0},
  {...game.flyers[4],x:310,y:132,baseY:132,speed:1,age:0},
  {x:600,y:214,w:35,h:12,speed:1}];
 s.items=[{kind:'shield',x:285,y:220,w:28,h:28,speed:1}];
 s.enemyShots=[{x:290,y:170,w:12,h:10,vx:0,vy:0}];
 game.throwChalk(s);run(s,.25,dt);
 assert(!s.over,'own explosion never hurts player');
 assert(s.obstacles.filter(o=>!o.resolved).length===1 && s.obstacles.find(o=>o.x>500),'blast clears nearby obstacles but not distant targets');
 assert(s.obstacles.find(o=>o.kind==='student').resolved,'blast answers student safely');
 assert(s.obstacles.find(o=>o.kind==='paperplane').resolved,'blast folds worksheet');
 assert(!s.enemyShots.length && s.items.length===1,'blast clears enemy shots and preserves collectibles');

 assert(s.explosions.length===1,'one expanding blast effect');
 run(s,.7,dt);assert(!s.explosions.length,'explosion animation is cleaned up');
 assert(s.streak===1 && s.bonus===15,'multi-target blast is one successful volley');
 s=create(960);s.hagoromo=1;s.streak=3;s.multiplier=3;
 game.throwChalk(s);run(s,1.6,dt);
 assert(!s.shots.length && !s.volleys.length && s.streak===0,'empty blast detonates on its fuse and counts as a miss');
}
// Hazards entering after detonation are caught by the visible blast too.
for (const dt of [1/30,1/60,1/120]) {
 s=create(960);s.hagoromo=1;target(s,250);game.throwChalk(s);run(s,.25,dt);
 const blast=s.explosions[0];assert(blast,'blast is still visible');
 const late={x:blast.x+181,y:blast.y-5,w:15,h:10,speed:240};
 s.obstacles.push(late);
 s.enemyShots.push({x:blast.x+181,y:blast.y,w:10,h:10,vx:-240,vy:0});
 run(s,.1,dt);
 assert(late.destroyed && !s.enemyShots.length,'visible blast clears incoming hazards and shots');
 run(s,.5,dt);
 assert(s.streak===1 && s.bonus===10,'later blast hits belong to the original volley');
}
// The boss takes exactly three damage from one explosion, even on a direct hit.
s=game.create(420);s.time=60;s.spawnIn=Infinity;game.step(s,.01);s.bossIntro=null;s.boss.attackIn=Infinity;
s.hagoromo=2;
for(let i=0;i<2;i++){
 s.x=s.boss.x-120;s.y=s.boss.y+44;s.facing=1;
 game.throwChalk(s);run(s,.6);
 if(i===0)assert(s.boss.hp===3,'single blast removes three HP, not a direct hit plus splash twice');
}
assert(!s.boss && s.bonus>=100 && !s.enemyShots.length,'second blast defeats boss and resumes runner');
// Refund an in-flight giant if the arena transition clears the field.
s=create();s.hagoromo=1;game.throwChalk(s);s.runTime=60;s.nextBossAt=60;game.step(s,.01);
assert(s.boss && s.hagoromo===1 && !s.shots.length && !s.volleys.length,'arena entry preserves an earned special shot');
s=create();s.hagoromo=1;s.duck=true;game.throwChalk(s);game.step(s,.01);
assert(s.shots.length===1 && !s.explosions.length,'ducked giant throw does not instantly detonate inside floor');
const fresh=create();assert(!fresh.hagoromo && !fresh.explosions.length && fresh.rewardSerial===0,'restart clears special rewards');
print('Passed: ten/twenty-hit rewards, volley counting, giant/ammo rules, blast damage/range, boss hits, safe targets, fuse, animation cleanup and arena transitions.');
